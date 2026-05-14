// Composite Deck 樓板使用階段荷重檢核
// 1:1 移植自 docs/鋼構容許荷重計算表_v10.xlsx [Deck樓板] 工作表
//
// 設計方法：LRFD 極限強度設計法（依混凝土結構設計規範 / ACI 318）
//   設計載重 wu = 1.2 wD + 1.6 wL
//   正彎矩強度 φMn+ = φ × [Deck_As × Deck_fy × (d_d - a/2) + As_rebar × fy_rebar × (d_r - a/2)]
//     其中 a = (Deck_As × Deck_fy + As_rebar × fy_rebar) / (0.85 × f'c × b)
//   負彎矩強度 φMn- = φ × WWM_As × WWM_fy × (d_WWM - a/2)
//   剪力強度 φVc = φ × 0.17 × √f'c × b × d
//
// 設計邊界：
//   1. 採完全張力鋼控制（under-reinforced），未驗算最大鋼筋比
//   2. 振動、火害、施工載重未檢核
//   3. 鋼筋保護層底筋預設 25 mm；WWM 由「WWM 保護層」輸入控制（自版頂量）
//   4. 撓度採開裂斷面轉換法，活載完整套用（保守）

import { AllowDeck, AllowWWM } from '../../data/allowable/deck';
import { N_PER_KG } from '../../data/allowable/grades';

export type DeckSupport = '單跨' | '雙跨連續' | '三跨以上';

export interface DeckInput {
  deck: AllowDeck | null;
  wwm: AllowWWM | null;
  deckFy: number;          // Deck 鋼板 fy (MPa) 預設 250
  rebarAs: number;         // 底層鋼筋 As (mm²/m)
  rebarFy: number;         // 底筋 fy (MPa)，SD420=420
  fc_psi: number;          // f'c (psi) 常用 3000/4000/5000
  tc: number;              // 波頂以上淨厚 (mm)
  density: number;         // 混凝土密度 (kg/m³) 一般 2400
  wwmCover: number;        // WWM 自版頂保護層 (mm)
  span: number;            // 跨距 L (mm)
  support: DeckSupport;
  wL: number;              // 活載重 (kg/m²)
  wD_add: number;          // 附加靜載 (kg/m²)
  L_over_n: number;        // 撓度比 L/n
  phi: number;             // 強度折減 φ（彎曲 0.9）
}

export interface DeckResult {
  // 自動換算
  fc_MPa: number;
  totalThickness: number;  // mm
  concreteSelfWeight: number; // kg/m²
  wD_total: number;        // kg/m²
  wu_kgPerM2: number;      // 設計載重

  // 強度
  phiMn_pos: number;       // 正彎矩強度 (kg·m/m)
  phiMn_neg: number;       // 負彎矩強度 (kg·m/m)
  phiVc: number;           // 剪力強度 (kg/m)

  // 實際需求
  Mu_pos: number;          // (kg·m/m)
  Mu_neg: number;
  Vu: number;              // (kg/m)
  delta_act: number;       // 服務撓度 (mm)
  delta_allow: number;     // 容許撓度 (mm)

  // 利用率
  IR_M_pos: number;
  IR_V: number;
  IR_delta: number;

  // 判定
  overall: 'OK' | 'NG' | '';
  controlBy: '正彎矩' | '剪力' | '撓度' | '';
  wL_max: number;          // 最大容許活載 (kg/m²)
}

export const EMPTY_DECK_RESULT: DeckResult = {
  fc_MPa: 0, totalThickness: 0, concreteSelfWeight: 0, wD_total: 0, wu_kgPerM2: 0,
  phiMn_pos: 0, phiMn_neg: 0, phiVc: 0,
  Mu_pos: 0, Mu_neg: 0, Vu: 0, delta_act: 0, delta_allow: 0,
  IR_M_pos: 0, IR_V: 0, IR_delta: 0,
  overall: '', controlBy: '', wL_max: 0,
};

export function calcDeck(input: DeckInput): DeckResult {
  const { deck, wwm, deckFy, rebarAs, rebarFy, fc_psi, tc, density,
    wwmCover, span, support, wL, wD_add, L_over_n, phi } = input;

  if (!deck || !deck.hr || !deck.As || !deck.selfWeight ||
      !fc_psi || fc_psi <= 0 || !tc || tc <= 0 || !span || span <= 0) {
    return EMPTY_DECK_RESULT;
  }

  const hr = deck.hr;                  // mm
  const deckAs = deck.As;              // mm²/m
  const deckSelf = deck.selfWeight;    // kg/m²
  const fc_MPa = fc_psi / 145.038;
  const totalThickness = hr + tc;
  const concreteSelfWeight = Math.round(density * (tc + hr / 2) / 1000 * 10) / 10;
  const wD_total = deckSelf + concreteSelfWeight + (wD_add || 0);
  const wu_kgPerM2 = 1.2 * wD_total + 1.6 * (wL || 0);

  // ── 正彎矩 φMn+ ──
  const a_pos = (deckAs * deckFy + (rebarAs || 0) * (rebarFy || 0)) / (0.85 * fc_MPa * 1000);
  const d_deck = totalThickness - hr / 2;
  const d_rebar = totalThickness - 25;
  const Mn_pos_Nmm = deckAs * deckFy * (d_deck - a_pos / 2)
    + (rebarAs > 0 ? rebarAs * rebarFy * (d_rebar - a_pos / 2) : 0);
  const phiMn_pos = phi * Mn_pos_Nmm / (N_PER_KG * 1000);  // kg·m/m

  // ── 負彎矩 φMn- ──
  let phiMn_neg = 0;
  if (wwm && wwm.AsY && wwm.fy) {
    const wwmAs = wwm.AsY;
    const wwmFy = wwm.fy;
    const a_neg = wwmAs * wwmFy / (0.85 * fc_MPa * 1000);
    const d_wwm = totalThickness - (wwmCover || 0);
    const Mn_neg_Nmm = wwmAs * wwmFy * (d_wwm - a_neg / 2);
    phiMn_neg = phi * Mn_neg_Nmm / (N_PER_KG * 1000);
  }

  // ── 剪力 φVc ──
  const d_v = totalThickness - hr / 2;
  const phiVc = phi * 0.17 * Math.sqrt(fc_MPa) * 1000 * d_v / N_PER_KG;

  // ── 需求 Mu / Vu ──
  const L_m = span / 1000;
  const wu_kgPerM = wu_kgPerM2;  // per-meter strip, b=1m
  let Mu_pos: number, Mu_neg: number, Vu: number;
  if (support === '單跨') {
    Mu_pos = wu_kgPerM * L_m * L_m / 8;
    Mu_neg = 0;
    Vu = wu_kgPerM * L_m / 2;
  } else if (support === '雙跨連續') {
    Mu_pos = wu_kgPerM * L_m * L_m / 8;
    Mu_neg = wu_kgPerM * L_m * L_m / 8;
    Vu = 5 * wu_kgPerM * L_m / 8;
  } else {
    Mu_pos = wu_kgPerM * L_m * L_m / 10;
    Mu_neg = wu_kgPerM * L_m * L_m / 9;
    Vu = wu_kgPerM * L_m / 2;
  }

  // ── 撓度 (服務載重，採開裂斷面轉換) ──
  const wService = wD_total + (wL || 0);
  const Ec = 4700 * Math.sqrt(fc_MPa);
  const n_modular = 200000 / Ec;
  const Ig_uncracked = 1000 * Math.pow(tc, 3) / 12;
  const I_steel_transformed = n_modular * (
    deckAs * Math.pow(d_deck - a_pos / 2, 2) +
    (rebarAs > 0 ? rebarAs * Math.pow(d_rebar - a_pos / 2, 2) : 0)
  );
  const EI_eff = Ec * (Ig_uncracked + I_steel_transformed);
  const delta_single = 5 * wService * N_PER_KG * Math.pow(span, 4) / (384 * EI_eff * 1000);
  // Excel: 連續跨採 ×0.4 近似
  const delta_act = support === '單跨' ? delta_single : delta_single * 0.4;
  const delta_allow = span / L_over_n;

  // ── 利用率 + 判定 ──
  const IR_M_pos = phiMn_pos > 0 ? Mu_pos / phiMn_pos : 0;
  const IR_V = phiVc > 0 ? Vu / phiVc : 0;
  const IR_delta = delta_allow > 0 ? delta_act / delta_allow : 0;
  const maxIR = Math.max(IR_M_pos, IR_V, IR_delta);

  const overall: 'OK' | 'NG' = maxIR <= 1 ? 'OK' : 'NG';
  const controlBy = IR_delta >= maxIR ? '撓度' : IR_M_pos >= IR_V ? '正彎矩' : '剪力';
  const wL_max = maxIR > 0 ? Math.round((wL || 0) / maxIR) : 0;

  return {
    fc_MPa, totalThickness, concreteSelfWeight, wD_total, wu_kgPerM2,
    phiMn_pos, phiMn_neg, phiVc,
    Mu_pos, Mu_neg, Vu, delta_act, delta_allow,
    IR_M_pos, IR_V, IR_delta,
    overall, controlBy, wL_max,
  };
}
