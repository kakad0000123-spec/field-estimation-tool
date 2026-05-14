// 鋼柱 容許軸力與梁柱組合應力檢核
// 1:1 移植自 docs/鋼構容許荷重計算表_v10.xlsx [鋼柱計算] 工作表
//
// 設計方法：AISC ASD 容許應力法（壓桿主公式 + Euler）
//   Cc = √(2π²E/Fy)
//   當 KL/r ≤ Cc：Fa = Fy × (1 - (KL/r)²/(2Cc²)) / [5/3 + 3(KL/r)/(8Cc) - (KL/r)³/(8Cc³)]
//   當 KL/r > Cc：Fa = 12π²E / (23(KL/r)²)
//   容許軸力 Pa = Fa × A
//
// 梁柱組合應力比（簡化 AISC ASD）：
//   IR_combined = fa/Fa + fbx/Fbx + fby/Fby
//   其中 fa = P/A、fbx = Mx/Sx、fby = My/Sy（Sy = Iy/(B/2)）
//        Fa = 上式，Fbx = Fby = 0.66 Fy
//
// 設計邊界：
//   1. K = 1.0 為兩端鉸接保守設定；柱頂自由時 K=2.0；兩端固接 K=0.5
//   2. 細長比應 ≤ 200（一般構材）/ ≤ 120（主壓桿）— 本表未自動檢核
//   3. 未檢核局部挫屈、扭轉挫屈
//   4. 雙向彎矩採線性疊加，未含 Cm 與 P-δ 二次效應放大

import { AllowSection } from '../../data/allowable/sections';
import { AllowGrade, FB_FACTOR, N_PER_KG } from '../../data/allowable/grades';

export interface ColumnInput {
  section: AllowSection | null;
  grade: AllowGrade | null;
  height: number;           // 柱淨高 H (mm)
  K: number;                // 有效長度係數
  P: number;                // 軸力 (kg)
  Mx: number;               // 強軸彎矩 (kg·m)
  My: number;               // 弱軸彎矩 (kg·m)
  includeSelfWeight: boolean;
}

export interface ColumnResult {
  // 自重 + 總壓力
  selfWeight: number;       // kg
  P_total: number;          // kg

  // 細長比與容許壓應力
  KL_over_r: number;        // 有效細長比
  Cc: number;               // 過渡點細長比
  Fa_MPa: number;           // 容許壓應力 (MPa)
  governingFormula: 'AISC主公式' | 'Euler' | '';

  // 容許值
  Pa_kg: number;            // 容許軸力 (kg)
  Fb_MPa: number;           // 容許彎曲應力 = 0.66 Fy (MPa)

  // 實際應力（給技師對照）
  fa_MPa: number;           // 實際軸壓應力
  fbx_MPa: number;          // 實際強軸彎曲應力
  fby_MPa: number;          // 實際弱軸彎曲應力

  // 利用率
  IR_axial: number;         // 純軸力利用率
  IR_combined: number;      // 組合應力比 fa/Fa + fbx/Fbx + fby/Fby

  // 判定
  check_axial: 'OK' | 'NG' | '';
  check_combined: 'OK' | 'NG' | '';
  overall: 'OK' | 'NG' | '';
  controlBy: '軸力控制' | '梁柱組合控制' | '';
}

export const EMPTY_COLUMN_RESULT: ColumnResult = {
  selfWeight: 0, P_total: 0,
  KL_over_r: 0, Cc: 0, Fa_MPa: 0, governingFormula: '',
  Pa_kg: 0, Fb_MPa: 0,
  fa_MPa: 0, fbx_MPa: 0, fby_MPa: 0,
  IR_axial: 0, IR_combined: 0,
  check_axial: '', check_combined: '', overall: '', controlBy: '',
};

export function calcColumn(input: ColumnInput): ColumnResult {
  const { section, grade, height, K, P, Mx, My, includeSelfWeight } = input;
  if (!section || !grade || !section.A || !section.Sx || !section.ry || !section.Iy || !section.bf ||
      !grade.Fy_MPa || !grade.E_MPa || !height || height <= 0) {
    return EMPTY_COLUMN_RESULT;
  }

  const Fy = grade.Fy_MPa;
  const E = grade.E_MPa;
  const A = section.A;
  const Sx = section.Sx;
  const Iy = section.Iy;
  const bf = section.bf;
  const ry = section.ry;
  const Sy = Iy / (bf / 2);   // 弱軸斷面模數 (mm³)

  // 自重 + 總壓力
  const selfWeight = includeSelfWeight && section.weight ? section.weight * height / 1000 : 0;
  const P_total = (P || 0) + selfWeight;

  // 細長比
  const KL_over_r = K * height / ry;
  const Cc = Math.sqrt(2 * Math.PI * Math.PI * E / Fy);

  // Fa
  let Fa_MPa: number;
  let governingFormula: 'AISC主公式' | 'Euler';
  if (KL_over_r <= Cc) {
    governingFormula = 'AISC主公式';
    const k = KL_over_r / Cc;
    Fa_MPa = Fy * (1 - k * k / 2) / (5 / 3 + 3 * k / 8 - Math.pow(k, 3) / 8);
  } else {
    governingFormula = 'Euler';
    Fa_MPa = 12 * Math.PI * Math.PI * E / (23 * KL_over_r * KL_over_r);
  }

  // 容許值
  const Pa_kg = Fa_MPa * A / N_PER_KG;
  const Fb_MPa = Fy * FB_FACTOR;

  // 實際應力（給技師核對）
  const fa_MPa = P_total * N_PER_KG / A;                // (kg × N/kgf) / mm² = MPa
  const fbx_MPa = Math.abs(Mx) * N_PER_KG * 1000 / Sx;  // kg·m → N·mm → MPa
  const fby_MPa = Math.abs(My) * N_PER_KG * 1000 / Sy;

  // 利用率 — Excel 公式 1:1 移植
  // 軸力：B22 = P_total × g / A / Fa = fa / Fa
  const IR_axial = fa_MPa / Fa_MPa;

  // 組合應力比：Excel R23 = fa/Fa + fbx/Fbx + fby/Fby（簡化 AISC ASD H1）
  //   注意：Excel 原公式為 `... × 0.66`，依公式應為 `÷ 0.66`（Fbx=0.66Fy），
  //   經技師逐一核對為 Excel 表達式書寫順序，仍等價於 fbx/Fbx。
  //   實作此處採用標準工程式：fbx/Fbx + fby/Fby，分母 = 0.66 Fy。
  const IR_combined = fa_MPa / Fa_MPa + fbx_MPa / Fb_MPa + fby_MPa / Fb_MPa;

  // 判定
  const check_axial: 'OK' | 'NG' = IR_axial <= 1 ? 'OK' : 'NG';
  const check_combined: 'OK' | 'NG' = IR_combined <= 1 ? 'OK' : 'NG';
  const overall: 'OK' | 'NG' =
    (check_axial === 'NG' || check_combined === 'NG') ? 'NG' : 'OK';
  const controlBy = IR_axial >= IR_combined ? '軸力控制' : '梁柱組合控制';

  return {
    selfWeight, P_total,
    KL_over_r, Cc, Fa_MPa, governingFormula,
    Pa_kg, Fb_MPa,
    fa_MPa, fbx_MPa, fby_MPa,
    IR_axial, IR_combined,
    check_axial, check_combined, overall, controlBy,
  };
}
