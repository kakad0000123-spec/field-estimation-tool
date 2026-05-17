// 斷面結實性 + 側向扭轉挫屈 (LTB) 計算
// 依《鋼結構極限設計法規範》/ AISC 360 第 B4 章與 F2 章
//
// ── 結實性分類 (Compact / Non-compact / Slender) ──
// 對 H/I 形：
//   Flange:  λ = (bf/2)/tf    λp = 0.38·√(E/Fy)    λr = 1.0·√(E/Fy)
//   Web:     λ = (d-2tf)/tw   λp = 3.76·√(E/Fy)   λr = 5.70·√(E/Fy)
// 對 BOX (HSS) 矩形：
//   Flange:  λ = bf/tf        λp = 1.12·√(E/Fy)   λr = 1.40·√(E/Fy)
//   Web:     λ = d/tw         λp = 2.42·√(E/Fy)   λr = 5.70·√(E/Fy)
// Non-compact 之 Mn 公式（F3）：
//   Mn = Mp - (Mp - 0.7·Fy·Sx)·(λ - λp)/(λr - λp)
//
// ── LTB (F2) ──
// Lp = 1.76·ry·√(E/Fy)         （塑性極限）
// Lr = 1.95·rts·(E/(0.7Fy)) × √[ J·c/(Sx·h0) + √( (J·c/(Sx·h0))² + 6.76·(0.7Fy/E)² ) ]
// 三區：
//   Lb ≤ Lp:        Mn = Mp                 (塑性區，無折減)
//   Lp < Lb ≤ Lr:   Mn = Cb·[Mp - (Mp - 0.7·Fy·Sx)·(Lb-Lp)/(Lr-Lp)] ≤ Mp (非彈性 LTB)
//   Lb > Lr:        Mn = Fcr·Sx ≤ Mp        (彈性 LTB)
//     Fcr = (Cb·π²·E/(Lb/rts)²) × √[1 + 0.078·J·c/(Sx·h0)·(Lb/rts)²]

import { AllowSection, getPlasticZx, getTorsionalJ, getWarpingCw, get_rts, get_h0 } from '../../data/allowable/sections';

export type Classification = 'Compact' | 'Non-compact' | 'Slender' | 'N/A';
export type LTBZone = 'Plastic' | 'Inelastic LTB' | 'Elastic LTB' | 'No LTB' | 'N/A';

export interface SectionClassResult {
  classification: Classification;
  flangeRatio: number;
  flangeLambdaP: number;
  flangeLambdaR: number;
  webRatio: number;
  webLambdaP: number;
  webLambdaR: number;
  Mn_local: number;      // 經結實性檢核後之 Mn (N·mm)
  factor: number;        // = Mn_local / Mp
}

export interface LTBResult {
  zone: LTBZone;
  Lp: number;            // 塑性極限 (mm)
  Lr: number;            // 彈性極限 (mm)
  Mn_ltb: number;        // 經 LTB 檢核後之 Mn (N·mm)
  factor: number;        // = Mn_ltb / Mp
  Fcr_MPa: number;       // 彈性 LTB 臨界應力（只在 elastic 區用得到）
}

export interface BendingCapacityResult {
  Mp_Nmm: number;        // 塑性彎矩 = Fy·Zx (N·mm)
  Mn_Nmm: number;        // 經結實性 + LTB 雙重檢核後之 Mn (N·mm)
  classification: SectionClassResult;
  ltb: LTBResult;
  /** 整體折減因子 = Mn / Mp（給 ASD 容許值放大用） */
  overall_factor: number;
}

const COMPACT_CLASS: SectionClassResult = {
  classification: 'Compact',
  flangeRatio: 0, flangeLambdaP: 0, flangeLambdaR: 0,
  webRatio: 0, webLambdaP: 0, webLambdaR: 0,
  Mn_local: 0, factor: 1.0,
};

const NO_LTB: LTBResult = {
  zone: 'No LTB', Lp: 0, Lr: Infinity, Mn_ltb: 0, factor: 1.0, Fcr_MPa: 0,
};

/**
 * 對 H/I/槽鋼/BOX 進行斷面結實性檢核。
 * 其他斷面（P 圓管、L 角鋼）回傳 'N/A' 並視為 compact (factor=1)，
 * 因其各自有獨立規定，本工具不細究。
 */
export function classifySection(
  section: AllowSection,
  Fy: number,
  E: number,
): SectionClassResult {
  const Mp = Fy * getPlasticZx(section);
  const Sx = section.Sx ?? 0;
  const Mr_local = 0.7 * Fy * Sx;
  const sqrtEFy = Math.sqrt(E / Fy);

  const shape = section.shape;

  if (shape === 'H形鋼' || shape === 'I型梁') {
    if (!section.bf || !section.tf || !section.d || !section.tw) {
      return { ...COMPACT_CLASS, Mn_local: Mp };
    }
    const flangeRatio = (section.bf / 2) / section.tf;
    const flangeLambdaP = 0.38 * sqrtEFy;
    const flangeLambdaR = 1.0 * sqrtEFy;
    const hw = section.d - 2 * section.tf;
    const webRatio = hw / section.tw;
    const webLambdaP = 3.76 * sqrtEFy;
    const webLambdaR = 5.70 * sqrtEFy;

    const flangeCompact = flangeRatio <= flangeLambdaP;
    const flangeNC = flangeRatio <= flangeLambdaR;
    const webCompact = webRatio <= webLambdaP;
    const webNC = webRatio <= webLambdaR;

    let classification: Classification = 'Compact';
    let Mn_local = Mp;

    if (!flangeCompact || !webCompact) {
      if (flangeNC && webNC) {
        classification = 'Non-compact';
        const Mn_f = flangeCompact
          ? Mp
          : Mp - (Mp - Mr_local) * (flangeRatio - flangeLambdaP) / (flangeLambdaR - flangeLambdaP);
        const Mn_w = webCompact
          ? Mp
          : Mp - (Mp - Mr_local) * (webRatio - webLambdaP) / (webLambdaR - webLambdaP);
        Mn_local = Math.min(Mn_f, Mn_w);
      } else {
        classification = 'Slender';
        Mn_local = Mr_local;  // 簡化保守處理
      }
    }
    return {
      classification, flangeRatio, flangeLambdaP, flangeLambdaR,
      webRatio, webLambdaP, webLambdaR,
      Mn_local, factor: Mp > 0 ? Mn_local / Mp : 1,
    };
  }

  if (shape === 'BOX柱') {
    if (!section.bf || !section.tf || !section.d || !section.tw) {
      return { ...COMPACT_CLASS, Mn_local: Mp };
    }
    const flangeRatio = section.bf / section.tf;
    const flangeLambdaP = 1.12 * sqrtEFy;
    const flangeLambdaR = 1.40 * sqrtEFy;
    const webRatio = section.d / section.tw;
    const webLambdaP = 2.42 * sqrtEFy;
    const webLambdaR = 5.70 * sqrtEFy;

    let classification: Classification = 'Compact';
    let Mn_local = Mp;

    if (flangeRatio > flangeLambdaP || webRatio > webLambdaP) {
      if (flangeRatio <= flangeLambdaR && webRatio <= webLambdaR) {
        classification = 'Non-compact';
        const factor = (flangeRatio - flangeLambdaP) / Math.max(flangeLambdaR - flangeLambdaP, 1e-9);
        Mn_local = Mp - (Mp - Mr_local) * Math.max(0, factor);
      } else {
        classification = 'Slender';
        Mn_local = Mr_local;
      }
    }
    return {
      classification, flangeRatio, flangeLambdaP, flangeLambdaR,
      webRatio, webLambdaP, webLambdaR,
      Mn_local, factor: Mp > 0 ? Mn_local / Mp : 1,
    };
  }

  if (shape === '槽鋼') {
    // 槽鋼之翼板為 b/tf（單翼），規範類同 I 形
    if (!section.bf || !section.tf || !section.d || !section.tw) {
      return { ...COMPACT_CLASS, Mn_local: Mp };
    }
    const flangeRatio = section.bf / section.tf;
    const flangeLambdaP = 0.38 * sqrtEFy;
    const flangeLambdaR = 1.0 * sqrtEFy;
    const hw = section.d - 2 * section.tf;
    const webRatio = hw / section.tw;
    const webLambdaP = 3.76 * sqrtEFy;
    const webLambdaR = 5.70 * sqrtEFy;

    let classification: Classification = 'Compact';
    let Mn_local = Mp;

    if (flangeRatio > flangeLambdaP || webRatio > webLambdaP) {
      if (flangeRatio <= flangeLambdaR && webRatio <= webLambdaR) {
        classification = 'Non-compact';
        const factor_f = flangeRatio > flangeLambdaP
          ? (flangeRatio - flangeLambdaP) / Math.max(flangeLambdaR - flangeLambdaP, 1e-9)
          : 0;
        const factor_w = webRatio > webLambdaP
          ? (webRatio - webLambdaP) / Math.max(webLambdaR - webLambdaP, 1e-9)
          : 0;
        Mn_local = Mp - (Mp - Mr_local) * Math.max(factor_f, factor_w);
      } else {
        classification = 'Slender';
        Mn_local = Mr_local;
      }
    }
    return {
      classification, flangeRatio, flangeLambdaP, flangeLambdaR,
      webRatio, webLambdaP, webLambdaR,
      Mn_local, factor: Mp > 0 ? Mn_local / Mp : 1,
    };
  }

  // P 圓管、L 角鋼：本工具不細究，視為 compact
  return {
    classification: 'N/A',
    flangeRatio: 0, flangeLambdaP: 0, flangeLambdaR: 0,
    webRatio: 0, webLambdaP: 0, webLambdaR: 0,
    Mn_local: Mp, factor: 1,
  };
}

/**
 * 側向扭轉挫屈 (LTB) 檢核（F2）。
 * 僅對 H/I/槽鋼計算；BOX/P 視為無 LTB（扭轉剛度高、或軸對稱），factor=1。
 *
 * @param Lb 側向無支撐長度 (mm)。若使用者選「壓力側連續支撐」，傳 0 表示無 LTB
 * @param Cb 側向扭轉修正係數（一般保守採 1.0；簡支均佈/集中可取 1.14~1.32）
 */
export function calcLTB(
  section: AllowSection,
  Fy: number,
  E: number,
  Lb_mm: number,
  Cb: number,
): LTBResult {
  const Mp = Fy * getPlasticZx(section);

  // 不適用 LTB 的斷面：BOX (扭轉剛度高)、P (軸對稱)、L (規範另行)
  if (section.shape === 'BOX柱' || section.shape === 'P型鋼' || section.shape === 'L型鋼') {
    return { ...NO_LTB, Mn_ltb: Mp };
  }
  // 壓力側連續支撐 → 無 LTB
  if (Lb_mm <= 0) return { ...NO_LTB, Mn_ltb: Mp };

  if (!section.ry || !section.Sx || !section.d || !section.tf) {
    return { ...NO_LTB, Mn_ltb: Mp };
  }

  const Sx = section.Sx;
  const ry = section.ry;
  const Mr = 0.7 * Fy * Sx;

  const Lp = 1.76 * ry * Math.sqrt(E / Fy);

  // Lr 計算（雙對稱 I/H 形；槽鋼用同公式近似，c≈1）
  const J = getTorsionalJ(section);
  const Cw = getWarpingCw(section);
  const rts = get_rts(section);
  const h0 = get_h0(section);
  const c = 1.0;

  let Lr = Infinity;
  if (rts > 0 && h0 > 0 && Sx > 0) {
    const ratio = (J * c) / (Sx * h0);
    const second = 6.76 * Math.pow((0.7 * Fy) / E, 2);
    Lr = 1.95 * rts * (E / (0.7 * Fy)) * Math.sqrt(ratio + Math.sqrt(ratio * ratio + second));
  }
  void Cw; // 已透過 rts 間接使用

  if (Lb_mm <= Lp) {
    return { zone: 'Plastic', Lp, Lr, Mn_ltb: Mp, factor: 1.0, Fcr_MPa: 0 };
  }

  if (Lb_mm <= Lr) {
    const Mn_raw = Cb * (Mp - (Mp - Mr) * (Lb_mm - Lp) / (Lr - Lp));
    const Mn_ltb = Math.min(Mn_raw, Mp);
    return {
      zone: 'Inelastic LTB', Lp, Lr,
      Mn_ltb, factor: Mp > 0 ? Mn_ltb / Mp : 1, Fcr_MPa: 0,
    };
  }

  // 彈性 LTB
  const Lb_rts = rts > 0 ? Lb_mm / rts : 1e12;
  const ratio = J * c / (Sx * h0);
  const Fcr = (Cb * Math.PI * Math.PI * E / Math.pow(Lb_rts, 2))
    * Math.sqrt(1 + 0.078 * ratio * Math.pow(Lb_rts, 2));
  const Mn_ltb = Math.min(Fcr * Sx, Mp);
  return {
    zone: 'Elastic LTB', Lp, Lr,
    Mn_ltb, factor: Mp > 0 ? Mn_ltb / Mp : 1, Fcr_MPa: Fcr,
  };
}

/**
 * 結合「結實性 + LTB」之 Mn 計算（取兩者最小）。
 */
export function calcStrongAxisCapacity(
  section: AllowSection,
  Fy: number,
  E: number,
  Lb_mm: number,
  Cb: number,
): BendingCapacityResult {
  const Mp = Fy * getPlasticZx(section);
  const cls = classifySection(section, Fy, E);
  const ltb = calcLTB(section, Fy, E, Lb_mm, Cb);
  const Mn = Math.min(cls.Mn_local, ltb.Mn_ltb);
  return {
    Mp_Nmm: Mp,
    Mn_Nmm: Mn,
    classification: cls,
    ltb,
    overall_factor: Mp > 0 ? Mn / Mp : 1,
  };
}
