// 鋼梁／天車梁 容許荷重與撓度檢核
// 1:1 移植自 docs/鋼構容許荷重計算表_v10.xlsx [鋼梁_天車計算] 工作表
//
// 設計方法：容許應力設計法 (ASD)
//   Fb = 0.66 × Fy （容許彎曲應力）
//   Fv = 0.40 × Fy （容許剪應力）
//   M_allow = Fb × Sx
//   V_allow = Fv × Aw
// 撓度公式（簡支梁 / 懸臂梁，集中 + 均佈組合）：
//   簡支 集中：Mmax = PL/4,  Vmax = P/2,  Δ = PL³/(48EI)
//   簡支 均佈：Mmax = wL²/8, Vmax = wL/2, Δ = 5wL⁴/(384EI)
//   懸臂 集中：Mmax = PL,    Vmax = P,    Δ = PL³/(3EI)
//   懸臂 均佈：Mmax = wL²/2, Vmax = wL,   Δ = wL⁴/(8EI)
//
// 設計邊界（與 Excel 一致）：
//   1. 本表以單跨梁之強軸彎曲初估為主
//   2. 未另檢核側向扭轉挫屈、局部挫屈、疲勞與接頭
//   3. P型鋼與 L型鋼之斷面性質為初估近似值
//   4. 天車梁(Monorail) 建議以集中荷重模式輸入，倍率可採 1.25

import { AllowSection } from '../../data/allowable/sections';
import { AllowGrade, FB_FACTOR, FV_FACTOR, N_PER_KG } from '../../data/allowable/grades';
import { AllowDeflection } from '../../data/allowable/deflection';

export type SupportType = '簡支梁' | '懸臂梁';
export type LoadType = '集中荷重' | '均佈荷重';
export type BeamUsage = '一般鋼梁' | '天車梁(Monorail)';

export interface BeamInput {
  usage: BeamUsage;
  support: SupportType;
  loadType: LoadType;
  section: AllowSection | null;
  grade: AllowGrade | null;
  span: number;            // L (mm)
  includeSelfWeight: boolean;
  wD_add: number;          // 附加靜載重 (kg/m)
  P: number;               // 集中荷重 (kg)
  wL: number;              // 均佈活載 (kg/m)
  loadFactor: number;      // 載重倍率
  deflection: AllowDeflection | null;
}

export interface BeamResult {
  // 容許應力
  Fb_MPa: number;          // 容許彎曲應力
  Fv_MPa: number;          // 容許剪應力

  // 容許值（基於斷面性質）
  M_allow: number;         // 容許彎矩 (kg·m)
  V_allow: number;         // 容許剪力 (kg)
  deflection_allow: number; // 容許撓度 Δa (mm)

  // 靜載重（固定）
  wD: number;              // 固定靜載 (kg/m) = 自重 + 附加
  MD: number;              // 固定靜載彎矩 (kg·m)
  VD: number;              // 固定靜載剪力 (kg)
  deltaD: number;          // 固定靜載撓度 (mm)

  // 服務值（含載重倍率）
  Ps_act: number;          // 服務集中荷重 (kg)
  qs_act: number;          // 服務均佈活載 (kg/m)
  M_act: number;           // 實際彎矩 (kg·m)
  V_act: number;           // 實際剪力 (kg)
  delta_act: number;       // 實際撓度 (mm)

  // 利用率
  ratio_M: number;
  ratio_V: number;
  ratio_delta: number;

  // 判定
  check_M: 'OK' | 'NG' | '';
  check_V: 'OK' | 'NG' | '';
  check_delta: 'OK' | 'NG' | '';
  overall: 'OK' | 'NG' | '';
  controlBy: '彎曲' | '剪力' | '撓度' | '';
  exceeded: string;        // 超標項目描述

  // 剩餘容許值
  M_remain: number;
  V_remain: number;
  delta_remain: number;

  // 集中荷重容許值
  Ps_M: number;
  Ps_V: number;
  Ps_delta: number;
  Ps_service: number;      // = min(三者)
  Pr_rated: number;        // = Ps_service / loadFactor

  // 均佈活載容許值
  qs_M: number;
  qs_V: number;
  qs_delta: number;
  qs_service: number;      // = min(三者)
}

export const EMPTY_BEAM_RESULT: BeamResult = {
  Fb_MPa: 0, Fv_MPa: 0,
  M_allow: 0, V_allow: 0, deflection_allow: 0,
  wD: 0, MD: 0, VD: 0, deltaD: 0,
  Ps_act: 0, qs_act: 0, M_act: 0, V_act: 0, delta_act: 0,
  ratio_M: 0, ratio_V: 0, ratio_delta: 0,
  check_M: '', check_V: '', check_delta: '', overall: '', controlBy: '', exceeded: '',
  M_remain: 0, V_remain: 0, delta_remain: 0,
  Ps_M: 0, Ps_V: 0, Ps_delta: 0, Ps_service: 0, Pr_rated: 0,
  qs_M: 0, qs_V: 0, qs_delta: 0, qs_service: 0,
};

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

export function calcBeam(input: BeamInput): BeamResult {
  const { section, grade, support, loadType, span, includeSelfWeight,
    wD_add, P, wL, loadFactor, deflection, usage: _usage } = input;
  void _usage;

  // 缺資料時回傳空結果
  if (!section || !grade || !section.Sx || !section.Aw || !section.Ix ||
      !grade.Fy_MPa || !grade.E_MPa || !span || span <= 0) {
    return EMPTY_BEAM_RESULT;
  }

  const Fy = grade.Fy_MPa;
  const E = grade.E_MPa;
  const Sx = section.Sx;       // mm³
  const Aw = section.Aw;       // mm²
  const Ix = section.Ix;       // mm⁴
  const L_mm = span;            // mm
  const L_m = span / 1000;      // m

  // ── 容許應力 ──
  const Fb_MPa = Fy * FB_FACTOR;
  const Fv_MPa = Fy * FV_FACTOR;

  // ── 容許值（Excel: M_allow = Fb × Sx ÷ (9.80665×1000) → kg·m） ──
  // Fb (N/mm² = MPa) × Sx (mm³) = N·mm；÷ 9.80665 → kgf·mm；÷ 1000 → kgf·m
  const M_allow = (Fb_MPa * Sx) / (N_PER_KG * 1000);
  const V_allow = (Fv_MPa * Aw) / N_PER_KG;

  // ── 容許撓度 ──
  const deflection_allow = calcDeflectionAllow(L_mm, deflection);

  // ── 靜載重 wD（kg/m） ──
  const sw = includeSelfWeight && section.weight ? section.weight : 0;
  const wD = sw + (wD_add || 0);

  // 固定靜載彎矩 MD (kg·m)
  const MD = support === '簡支梁' ? wD * L_m * L_m / 8 : wD * L_m * L_m / 2;
  // 固定靜載剪力 VD (kg)
  const VD = support === '簡支梁' ? wD * L_m / 2 : wD * L_m;
  // 固定靜載撓度 ΔD (mm)
  //   簡支：Δ = 5 w (kg/m) L^4 / (384 E I) × 9.80665 / 1000 （單位：mm）
  //   懸臂：Δ = w L^4 / (8 E I) × 9.80665 / 1000
  // Excel: 簡支 = 5*wD*9.80665*L^4/(384*E*Ix*1000)
  const deltaD = support === '簡支梁'
    ? 5 * wD * N_PER_KG * Math.pow(L_mm, 4) / (384 * E * Ix * 1000)
    : wD * N_PER_KG * Math.pow(L_mm, 4) / (8 * E * Ix * 1000);

  // ── 服務值（含倍率） ──
  const Ps_act = loadType === '集中荷重' ? P * loadFactor : 0;
  const qs_act = loadType === '均佈荷重' ? wL * loadFactor : 0;

  // 實際 M / V / Δ
  const M_act = support === '簡支梁'
    ? Ps_act * L_m / 4 + (wD + qs_act) * L_m * L_m / 8
    : Ps_act * L_m + (wD + qs_act) * L_m * L_m / 2;
  const V_act = support === '簡支梁'
    ? Ps_act / 2 + (wD + qs_act) * L_m / 2
    : Ps_act + (wD + qs_act) * L_m;
  const delta_act = support === '簡支梁'
    ? Ps_act * N_PER_KG * Math.pow(L_mm, 3) / (48 * E * Ix)
      + 5 * (wD + qs_act) * N_PER_KG * Math.pow(L_mm, 4) / (384 * E * Ix * 1000)
    : Ps_act * N_PER_KG * Math.pow(L_mm, 3) / (3 * E * Ix)
      + (wD + qs_act) * N_PER_KG * Math.pow(L_mm, 4) / (8 * E * Ix * 1000);

  // ── 利用率 ──
  const ratio_M = M_allow > 0 ? M_act / M_allow : 0;
  const ratio_V = V_allow > 0 ? V_act / V_allow : 0;
  let ratio_delta: number;
  if (deflection_allow <= 0) ratio_delta = delta_act > 0 ? 999 : 0;
  else ratio_delta = delta_act / deflection_allow;

  // ── 判定 ──
  const check_M: 'OK' | 'NG' = ratio_M <= 1 ? 'OK' : 'NG';
  const check_V: 'OK' | 'NG' = ratio_V <= 1 ? 'OK' : 'NG';
  const check_delta: 'OK' | 'NG' = ratio_delta <= 1 ? 'OK' : 'NG';
  const overall: 'OK' | 'NG' =
    (check_M === 'NG' || check_V === 'NG' || check_delta === 'NG') ? 'NG' : 'OK';

  // 控制準則 = 利用率最大者
  const maxRatio = Math.max(ratio_M, ratio_V, ratio_delta);
  const controlBy =
    ratio_delta >= maxRatio ? '撓度' :
    ratio_M >= maxRatio ? '彎曲' : '剪力';

  // 超標項目描述
  const ng: string[] = [];
  if (check_M === 'NG') ng.push('彎曲');
  if (check_V === 'NG') ng.push('剪力');
  if (check_delta === 'NG') ng.push('撓度');
  const exceeded = ng.length === 0 ? '無' : ng.join('、') + '超標';

  // ── 剩餘容許值 ──
  const M_remain = Math.max(0, M_allow - MD);
  const V_remain = Math.max(0, V_allow - VD);
  const isLiveOnly = deflection?.checkType === '活載重撓度' || deflection?.checkType === '服務性撓度';
  const delta_remain = Math.max(0, deflection_allow - (isLiveOnly ? 0 : deltaD));

  // ── 集中荷重容許值（剩餘空間 → 反推可承受 P） ──
  let Ps_M = 0, Ps_V = 0, Ps_delta = 0;
  if (support === '簡支梁') {
    Ps_M = L_m > 0 ? 4 * M_remain / L_m : 0;
    Ps_V = 2 * V_remain;
    Ps_delta = L_m > 0 ? 48 * E * Ix * delta_remain / (N_PER_KG * Math.pow(L_mm, 3)) : 0;
  } else {
    Ps_M = L_m > 0 ? M_remain / L_m : 0;
    Ps_V = V_remain;
    Ps_delta = L_m > 0 ? 3 * E * Ix * delta_remain / (N_PER_KG * Math.pow(L_mm, 3)) : 0;
  }
  const Ps_service = Math.min(Ps_M, Ps_V, Ps_delta);
  const Pr_rated = loadFactor > 0 ? Ps_service / loadFactor : 0;

  // ── 均佈活載容許值 ──
  let qs_M = 0, qs_V = 0, qs_delta = 0;
  if (support === '簡支梁') {
    qs_M = L_m > 0 ? 8 * M_remain / (L_m * L_m) : 0;
    qs_V = L_m > 0 ? 2 * V_remain / L_m : 0;
    qs_delta = L_m > 0 ? 384 * E * Ix * delta_remain * 1000 / (5 * N_PER_KG * Math.pow(L_mm, 4)) : 0;
  } else {
    qs_M = L_m > 0 ? 2 * M_remain / (L_m * L_m) : 0;
    qs_V = L_m > 0 ? V_remain / L_m : 0;
    qs_delta = L_m > 0 ? 8 * E * Ix * delta_remain * 1000 / (N_PER_KG * Math.pow(L_mm, 4)) : 0;
  }
  const qs_service = Math.min(qs_M, qs_V, qs_delta);

  return {
    Fb_MPa, Fv_MPa,
    M_allow, V_allow, deflection_allow,
    wD, MD, VD, deltaD,
    Ps_act, qs_act, M_act, V_act, delta_act,
    ratio_M, ratio_V, ratio_delta,
    check_M, check_V, check_delta, overall, controlBy, exceeded,
    M_remain, V_remain, delta_remain,
    Ps_M, Ps_V, Ps_delta, Ps_service, Pr_rated,
    qs_M, qs_V, qs_delta, qs_service,
  };
}
