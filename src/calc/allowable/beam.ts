// 鋼梁／天車梁 容許荷重檢核 (v2)
// 支援：ASD / LRFD 雙設計法、強軸 + 弱軸雙軸互制、D/L/W/E 載重組合自動包絡
//
// ── ASD 容許應力設計法 ──
//   Mcx = Fb × Sx,       Fb = 0.66 Fy
//   Vc  = Fv × Aw,       Fv = 0.40 Fy
//   組合：D, D+L, D+0.75L+0.75W, D+0.75L+0.75E, D+0.6W, D+0.6E, 0.6D+0.6W, 0.6D+0.6E
//   IR  = Mu / Mcx + Muy / Mcy （無 φ）
//
// ── LRFD 極限設計法（鋼結構極限設計法規範 / AISC 360）──
//   φMnx = φ_b × Fy × Zx,   φ_b = 0.9
//   φVn  = φ_v × 0.6 × Fy × Aw,  φ_v = 0.9
//   組合：1.4D, 1.2D+1.6L, 1.2D+L+W, 1.2D+L+E, 0.9D+W, 0.9D+E
//   IR  = Mu / φMnx + Muy / φMny
//
// 設計邊界：
//   1. 假設結實斷面 (Compact)；未計算翼板/腹板寬厚比折減
//   2. 未檢核側向扭轉挫屈 (LTB)；長跨無側向支撐請另算
//   3. Zx 採塑性係數近似 (Sx × 1.10~1.27 視形狀)，精確值請查 CNS 14165
//   4. 雙軸互制採線性疊加 H1
//   5. 地震力 E 由結構技師提供作用點反力，非由本工具計算

import { AllowSection, getPlasticZx, getElasticSy, getPlasticZy } from '../../data/allowable/sections';
import {
  AllowGrade, FB_FACTOR, FV_FACTOR, N_PER_KG,
  PHI_BENDING, PHI_SHEAR, FV_LRFD_FACTOR,
} from '../../data/allowable/grades';
import { AllowDeflection } from '../../data/allowable/deflection';

export type DesignMethod = 'ASD' | 'LRFD';
export type SupportType = '簡支梁' | '懸臂梁';
export type BeamUsage = '一般鋼梁' | '天車梁(Monorail)';

export interface BeamInput {
  method: DesignMethod;
  usage: BeamUsage;
  support: SupportType;
  section: AllowSection | null;
  grade: AllowGrade | null;
  deflection: AllowDeflection | null;
  span: number;            // mm
  includeSelfWeight: boolean;

  D_add: number;           // 附加靜載 (kg/m)
  L_uniform: number;       // 活載均佈 (kg/m)
  L_point: number;         // 活載集中 (kg)
  L_impact: number;        // 衝擊倍率 (天車 1.25 / 一般 1.0)
  W_uniform: number;       // 風均佈 (kg/m, 可為負表上吸)
  W_point: number;         // 風集中 (kg)
  E_point: number;         // 地震反力 (kg, 設備反力)
  My_input: number;        // 弱軸彎矩直接輸入 (kg·m)
}

interface ComboFactors { D: number; L: number; W: number; E: number; }

export interface BeamCombo {
  label: string;
  factors: ComboFactors;
  w_kgPerM: number;        // 因子組合後均佈 (kg/m)
  p_kg: number;            // 因子組合後集中 (kg)
  M_kgm: number;           // 強軸彎矩 (kg·m)
  V_kg: number;            // 剪力 (kg)
}

export interface BeamResult {
  method: DesignMethod;

  // 斷面性質
  Fy_MPa: number;
  E_MPa: number;
  Sx: number;
  Zx: number;
  Sy: number;
  Zy: number;
  Aw: number;
  Ix: number;

  // 材料容許應力（ASD 才顯示）
  Fb_MPa: number;
  Fv_MPa: number;

  // 容量
  Mcx_kgm: number;         // 強軸容量 (kg·m)
  Mcy_kgm: number;         // 弱軸容量 (kg·m)
  Vc_kg: number;           // 剪力容量 (kg)
  delta_allow: number;     // 容許撓度 (mm)

  // 載重組合
  combos: BeamCombo[];
  controlCombo: BeamCombo | null;

  // 內力 (控制組合)
  M_act: number;           // 強軸 Mu / Ma
  V_act: number;
  delta_act: number;       // 服務值 (D + L 不加因子)
  My_act: number;          // 弱軸（= My_input）

  // 利用率
  IR_M_x: number;
  IR_M_y: number;
  IR_biaxial: number;      // = IR_M_x + IR_M_y
  IR_V: number;
  IR_delta: number;

  // 判定
  check_M: 'OK' | 'NG';
  check_V: 'OK' | 'NG';
  check_delta: 'OK' | 'NG';
  overall: 'OK' | 'NG';
  controlBy: '彎曲' | '剪力' | '撓度' | '';

  // 自重 / 靜載總計
  selfWeight: number;      // kg/m
  wD_total: number;        // 含自重的總靜載 (kg/m)
}

export const EMPTY_BEAM_RESULT: BeamResult = {
  method: 'ASD',
  Fy_MPa: 0, E_MPa: 0,
  Sx: 0, Zx: 0, Sy: 0, Zy: 0, Aw: 0, Ix: 0,
  Fb_MPa: 0, Fv_MPa: 0,
  Mcx_kgm: 0, Mcy_kgm: 0, Vc_kg: 0, delta_allow: 0,
  combos: [], controlCombo: null,
  M_act: 0, V_act: 0, delta_act: 0, My_act: 0,
  IR_M_x: 0, IR_M_y: 0, IR_biaxial: 0, IR_V: 0, IR_delta: 0,
  check_M: 'OK', check_V: 'OK', check_delta: 'OK', overall: 'OK', controlBy: '',
  selfWeight: 0, wD_total: 0,
};

// ── 載重組合表 ──
// ASD（依 ASCE 7 容許應力組合，台灣鋼構造容許應力法規範類似）
const ASD_COMBOS: Array<{ label: string } & ComboFactors> = [
  { label: 'D',                D: 1.0, L: 0,    W: 0,    E: 0    },
  { label: 'D+L',              D: 1.0, L: 1.0,  W: 0,    E: 0    },
  { label: 'D+0.75L+0.75W',    D: 1.0, L: 0.75, W: 0.75, E: 0    },
  { label: 'D+0.75L+0.75E',    D: 1.0, L: 0.75, W: 0,    E: 0.75 },
  { label: 'D+0.6W',           D: 1.0, L: 0,    W: 0.6,  E: 0    },
  { label: 'D+0.6E',           D: 1.0, L: 0,    W: 0,    E: 0.6  },
  { label: '0.6D+0.6W',        D: 0.6, L: 0,    W: 0.6,  E: 0    },
  { label: '0.6D+0.6E',        D: 0.6, L: 0,    W: 0,    E: 0.6  },
];

// LRFD（依鋼結構極限設計法規範 / AISC 360 / IBC）
const LRFD_COMBOS: Array<{ label: string } & ComboFactors> = [
  { label: '1.4D',             D: 1.4, L: 0,    W: 0,    E: 0    },
  { label: '1.2D+1.6L',        D: 1.2, L: 1.6,  W: 0,    E: 0    },
  { label: '1.2D+1.0L+1.0W',   D: 1.2, L: 1.0,  W: 1.0,  E: 0    },
  { label: '1.2D+1.0L+1.0E',   D: 1.2, L: 1.0,  W: 0,    E: 1.0  },
  { label: '0.9D+1.0W',        D: 0.9, L: 0,    W: 1.0,  E: 0    },
  { label: '0.9D+1.0E',        D: 0.9, L: 0,    W: 0,    E: 1.0  },
];

/**
 * 計算容許撓度 Δa
 *   - 若 ratio>0 且 absoluteLimit>0: min(L/ratio, absoluteLimit)
 *   - 若僅 ratio>0: L/ratio
 *   - 若僅 absoluteLimit>0: absoluteLimit
 */
function calcDeflectionAllow(span_mm: number, def: AllowDeflection | null): number {
  if (!def) return 0;
  const byRatio = def.ratio && def.ratio > 0 ? span_mm / def.ratio : 0;
  const abs = def.absoluteLimit && def.absoluteLimit > 0 ? def.absoluteLimit : 0;
  if (byRatio > 0 && abs > 0) return Math.min(byRatio, abs);
  if (byRatio > 0) return byRatio;
  if (abs > 0) return abs;
  return 0;
}

/** 給定均佈 w (kg/m) + 集中 p (kg)、支承、跨距 L_m → 計算 Mmax, Vmax */
function maxForces(support: SupportType, L_m: number, w: number, p: number): { M: number; V: number } {
  if (support === '簡支梁') {
    // M = wL²/8 + PL/4；V = wL/2 + P/2
    return {
      M: w * L_m * L_m / 8 + p * L_m / 4,
      V: w * L_m / 2 + p / 2,
    };
  }
  // 懸臂梁：M = wL²/2 + PL；V = wL + P
  return {
    M: w * L_m * L_m / 2 + p * L_m,
    V: w * L_m + p,
  };
}

/** 給定均佈 + 集中 → 計算最大撓度 (mm)，採 E·I·g 換算 */
function maxDeflection(
  support: SupportType,
  L_mm: number,
  w_kgPerM: number,
  p_kg: number,
  E_MPa: number,
  Ix_mm4: number,
): number {
  if (!E_MPa || !Ix_mm4) return 0;
  // 簡支：Δ = PL³/(48EI) + 5wL⁴/(384EI)
  // 懸臂：Δ = PL³/(3EI) + wL⁴/(8EI)
  // w 單位 kg/m，須換算為 N/mm = kg/m × 9.80665 / 1000
  // 計算保持單位一致：用 kgf 與 mm，最後除以 EI（MPa·mm⁴ = N·mm²/(mm²)·mm⁴ → N·mm²）
  // 統一公式：Δ_mm = factor × force(kg) × N_PER_KG × L^n / (E × I)
  if (support === '簡支梁') {
    return p_kg * N_PER_KG * Math.pow(L_mm, 3) / (48 * E_MPa * Ix_mm4)
      + 5 * w_kgPerM * N_PER_KG * Math.pow(L_mm, 4) / (384 * E_MPa * Ix_mm4 * 1000);
  }
  return p_kg * N_PER_KG * Math.pow(L_mm, 3) / (3 * E_MPa * Ix_mm4)
    + w_kgPerM * N_PER_KG * Math.pow(L_mm, 4) / (8 * E_MPa * Ix_mm4 * 1000);
}

export function calcBeam(input: BeamInput): BeamResult {
  const { method, support, section, grade, deflection, span,
    includeSelfWeight, D_add, L_uniform, L_point, L_impact,
    W_uniform, W_point, E_point, My_input, usage: _u } = input;
  void _u;

  if (!section || !grade || !section.Sx || !section.Aw || !section.Ix ||
      !grade.Fy_MPa || !grade.E_MPa || !span || span <= 0) {
    return EMPTY_BEAM_RESULT;
  }

  const Fy = grade.Fy_MPa;
  const E = grade.E_MPa;
  const Sx = section.Sx;
  const Aw = section.Aw;
  const Ix = section.Ix;
  const Zx = getPlasticZx(section);
  const Sy = getElasticSy(section);
  const Zy = getPlasticZy(section);

  // ── 容量 ──
  let Mcx_kgm: number, Mcy_kgm: number, Vc_kg: number;
  let Fb_MPa = 0, Fv_MPa = 0;
  if (method === 'ASD') {
    Fb_MPa = Fy * FB_FACTOR;
    Fv_MPa = Fy * FV_FACTOR;
    Mcx_kgm = Fb_MPa * Sx / (N_PER_KG * 1000);
    Mcy_kgm = Sy > 0 ? Fb_MPa * Sy / (N_PER_KG * 1000) : 0;
    Vc_kg = Fv_MPa * Aw / N_PER_KG;
  } else {
    // LRFD: φMn = φ × Fy × Z
    Mcx_kgm = PHI_BENDING * Fy * Zx / (N_PER_KG * 1000);
    Mcy_kgm = Zy > 0 ? PHI_BENDING * Fy * Zy / (N_PER_KG * 1000) : 0;
    Vc_kg = PHI_SHEAR * FV_LRFD_FACTOR * Fy * Aw / N_PER_KG;
  }

  const delta_allow = calcDeflectionAllow(span, deflection);

  // ── 載重（服務值） ──
  const selfWeight = includeSelfWeight && section.weight ? section.weight : 0;
  const wD_total = selfWeight + (D_add || 0);
  const wL_service = L_uniform || 0;
  const pL_service = (L_point || 0) * (L_impact || 1.0);
  const wW_service = W_uniform || 0;
  const pW_service = W_point || 0;
  const pE_service = E_point || 0;

  const L_m = span / 1000;
  const L_mm = span;

  // ── 跑每組組合 ──
  const comboDefs = method === 'ASD' ? ASD_COMBOS : LRFD_COMBOS;
  const combos: BeamCombo[] = comboDefs.map((c) => {
    const w_combo = c.D * wD_total + c.L * wL_service + c.W * wW_service;
    // 集中：L、W、E 都可能是集中力
    const p_combo = c.L * pL_service + c.W * pW_service + c.E * pE_service;
    const f = maxForces(support, L_m, w_combo, p_combo);
    return {
      label: c.label,
      factors: { D: c.D, L: c.L, W: c.W, E: c.E },
      w_kgPerM: w_combo,
      p_kg: p_combo,
      M_kgm: f.M,
      V_kg: f.V,
    };
  });

  // 找彎矩絕對值最大的組合
  let controlCombo: BeamCombo | null = null;
  for (const c of combos) {
    if (!controlCombo || Math.abs(c.M_kgm) > Math.abs(controlCombo.M_kgm)) {
      controlCombo = c;
    }
  }

  const M_act = controlCombo ? Math.abs(controlCombo.M_kgm) : 0;
  // V_act 也分開找剪力最大組合
  let V_act = 0;
  for (const c of combos) if (Math.abs(c.V_kg) > V_act) V_act = Math.abs(c.V_kg);

  // 撓度檢核：採服務組合 (D + L)，不加因子
  const wServ = wD_total + wL_service;
  const pServ = pL_service;
  let delta_act = maxDeflection(support, L_mm, wServ, pServ, E, Ix);
  // 若撓度基準是「活載重撓度」或「服務性撓度」，只計 L 部分
  const liveOnly = deflection?.checkType === '活載重撓度' || deflection?.checkType === '服務性撓度';
  if (liveOnly) {
    delta_act = maxDeflection(support, L_mm, wL_service, pL_service, E, Ix);
  }

  const My_act = Math.abs(My_input || 0);

  // ── 利用率 ──
  const IR_M_x = Mcx_kgm > 0 ? M_act / Mcx_kgm : 0;
  const IR_M_y = Mcy_kgm > 0 ? My_act / Mcy_kgm : 0;
  const IR_biaxial = IR_M_x + IR_M_y;
  const IR_V = Vc_kg > 0 ? V_act / Vc_kg : 0;
  const IR_delta = delta_allow > 0 ? delta_act / delta_allow : (delta_act > 0 ? 999 : 0);

  // 判定（彎曲取雙軸最差）
  const check_M: 'OK' | 'NG' = IR_biaxial <= 1 ? 'OK' : 'NG';
  const check_V: 'OK' | 'NG' = IR_V <= 1 ? 'OK' : 'NG';
  const check_delta: 'OK' | 'NG' = IR_delta <= 1 ? 'OK' : 'NG';
  const overall: 'OK' | 'NG' =
    (check_M === 'NG' || check_V === 'NG' || check_delta === 'NG') ? 'NG' : 'OK';

  const maxIR = Math.max(IR_biaxial, IR_V, IR_delta);
  const controlBy =
    IR_delta >= maxIR ? '撓度' :
    IR_biaxial >= maxIR ? '彎曲' : '剪力';

  return {
    method,
    Fy_MPa: Fy, E_MPa: E,
    Sx, Zx, Sy, Zy, Aw, Ix,
    Fb_MPa, Fv_MPa,
    Mcx_kgm, Mcy_kgm, Vc_kg, delta_allow,
    combos, controlCombo,
    M_act, V_act, delta_act, My_act,
    IR_M_x, IR_M_y, IR_biaxial, IR_V, IR_delta,
    check_M, check_V, check_delta, overall, controlBy,
    selfWeight, wD_total,
  };
}
