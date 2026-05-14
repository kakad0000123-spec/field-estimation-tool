// 格柵 (Steel Grating) 容許荷重檢核
// 1:1 移植自 docs/鋼構容許荷重計算表_v10.xlsx [格柵計算] 工作表
//
// 設計方法：以單條承載條為簡支/懸臂梁，採 ASD 容許應力法
//   每條承載條視為矩形斷面：I = t·h³/12, S = t·h²/6, A = h·t
//   Fb = 0.66 Fy, Fv = 0.40 Fy
//   均佈荷重 (kg/m²) 經 tributary spacing 轉成每條線載重
//   集中荷重 (kg) 經接觸寬度均分到多條承載條
//
// 設計邊界：
//   1. 假設承載條兩端為簡支或單端固定
//   2. 集中載重接觸寬度視為腳踩寬度 (預設 225 mm)
//   3. 未檢核橫向交聯條的次要彎矩
//   4. E 採用一般鋼材 200000 MPa

import { AllowGrating } from '../../data/allowable/grating';
import { N_PER_KG, FB_FACTOR, FV_FACTOR } from '../../data/allowable/grades';

const E_STEEL = 200000; // MPa，鋼材彈性模數

export type GratingSupport = '簡支梁' | '懸臂梁';

export interface GratingInput {
  grating: AllowGrating | null;
  span: number;          // 跨距 L (mm)
  support: GratingSupport;
  L_over_n: number;      // 容許撓度比 L/n（走道一般 200，平台 240）
  P: number;             // 集中荷重 (kg)
  w: number;             // 均佈荷重 (kg/m²)
  contactWidth: number;  // 集中荷重接觸寬 (mm)
  Fy_MPa: number;        // 材料降伏強度 (MPa)
}

export interface GratingResult {
  // 單條斷面性質
  I_rib: number;         // 單條慣性矩 (mm⁴)
  S_rib: number;         // 單條斷面模數 (mm³)
  A_rib: number;         // 單條面積 (mm²)
  Fb_MPa: number;
  Fv_MPa: number;

  // 容許值
  M_allow_rib: number;   // 單條容許彎矩 (kg·mm)
  V_allow_rib: number;   // 單條容許剪力 (kg)
  deflection_allow: number; // 容許撓度 (mm)
  ribsPerMeter: number;  // 每公尺承載條數

  // 均佈檢核
  ratio_w_M: number;
  ratio_w_V: number;
  ratio_w_delta: number;
  check_uniform: 'OK' | 'NG' | '';
  controlBy_uniform: '彎矩' | '剪力' | '撓度' | '';

  // 集中檢核
  ribsLoaded: number;          // 受力條數
  P_per_rib: number;           // 單條分擔力 (kg)
  ratio_P_M: number;
  ratio_P_V: number;
  ratio_P_delta: number;
  check_concentrated: 'OK' | 'NG' | '';
  controlBy_concentrated: '彎矩' | '剪力' | '撓度' | '';

  // 容許上限
  w_max_allow: number;   // kg/m²
  P_max_allow: number;   // kg
}

export const EMPTY_GRATING_RESULT: GratingResult = {
  I_rib: 0, S_rib: 0, A_rib: 0, Fb_MPa: 0, Fv_MPa: 0,
  M_allow_rib: 0, V_allow_rib: 0, deflection_allow: 0, ribsPerMeter: 0,
  ratio_w_M: 0, ratio_w_V: 0, ratio_w_delta: 0,
  check_uniform: '', controlBy_uniform: '',
  ribsLoaded: 0, P_per_rib: 0,
  ratio_P_M: 0, ratio_P_V: 0, ratio_P_delta: 0,
  check_concentrated: '', controlBy_concentrated: '',
  w_max_allow: 0, P_max_allow: 0,
};

function pickControl(rM: number, rV: number, rD: number): '彎矩' | '剪力' | '撓度' {
  const max = Math.max(rM, rV, rD);
  if (rD >= max) return '撓度';
  if (rM >= max) return '彎矩';
  return '剪力';
}

export function calcGrating(input: GratingInput): GratingResult {
  const { grating, span, support, L_over_n, P, w, contactWidth, Fy_MPa } = input;
  if (!grating || !grating.h || !grating.t || !grating.spacing || !Fy_MPa ||
      !span || span <= 0 || !L_over_n || L_over_n <= 0) {
    return EMPTY_GRATING_RESULT;
  }

  const h = grating.h;       // mm
  const t = grating.t;       // mm
  const sp = grating.spacing; // mm
  const L = span;             // mm

  // 單條斷面（矩形 t × h）
  const I_rib = t * Math.pow(h, 3) / 12;
  const S_rib = t * h * h / 6;
  const A_rib = h * t;

  // 容許應力
  const Fb_MPa = Fy_MPa * FB_FACTOR;
  const Fv_MPa = Fy_MPa * FV_FACTOR;

  // 容許值（單條）
  const M_allow_rib = Fb_MPa * S_rib / N_PER_KG;  // kg·mm
  const V_allow_rib = Fv_MPa * A_rib / N_PER_KG;  // kg
  const deflection_allow = L / L_over_n;          // mm
  const ribsPerMeter = 1000 / sp;

  // ── 均佈荷重檢核（每條線載重 q_rib = w × sp / 1000，但 Excel 用 (w/1e6) × sp 同義） ──
  // q_rib in kg/mm: w(kg/m²) × sp(mm) / 1e6
  // Mmax 在 kg·mm 單位下：簡支 q×L²/8、懸臂 q×L²/2
  const q_rib = (w || 0) / 1e6 * sp;  // kg/mm
  const M_w = support === '簡支梁' ? q_rib * L * L / 8 : q_rib * L * L / 2;
  const V_w = support === '簡支梁' ? q_rib * L / 2 : q_rib * L;
  const delta_w = support === '簡支梁'
    ? 5 * q_rib * N_PER_KG * Math.pow(L, 4) / (384 * E_STEEL * I_rib)
    : q_rib * N_PER_KG * Math.pow(L, 4) / (8 * E_STEEL * I_rib);

  const ratio_w_M = M_allow_rib > 0 ? M_w / M_allow_rib : 0;
  const ratio_w_V = V_allow_rib > 0 ? V_w / V_allow_rib : 0;
  const ratio_w_delta = deflection_allow > 0 ? delta_w / deflection_allow : 0;
  const maxW = Math.max(ratio_w_M, ratio_w_V, ratio_w_delta);
  const check_uniform: 'OK' | 'NG' = maxW <= 1 ? 'OK' : 'NG';
  const controlBy_uniform = pickControl(ratio_w_M, ratio_w_V, ratio_w_delta);

  // ── 集中荷重檢核 ──
  const ribsLoaded = Math.min(Math.floor((contactWidth || 0) / sp) + 1, ribsPerMeter);
  const P_per_rib = ribsLoaded > 0 && P > 0 ? P / ribsLoaded : 0;

  const M_P = support === '簡支梁' ? P_per_rib * L / 4 : P_per_rib * L;
  const V_P = support === '簡支梁' ? P_per_rib / 2 : P_per_rib;
  const delta_P = support === '簡支梁'
    ? P_per_rib * N_PER_KG * Math.pow(L, 3) / (48 * E_STEEL * I_rib)
    : P_per_rib * N_PER_KG * Math.pow(L, 3) / (3 * E_STEEL * I_rib);

  const ratio_P_M = M_allow_rib > 0 ? M_P / M_allow_rib : 0;
  const ratio_P_V = V_allow_rib > 0 ? V_P / V_allow_rib : 0;
  const ratio_P_delta = deflection_allow > 0 ? delta_P / deflection_allow : 0;
  const maxP = Math.max(ratio_P_M, ratio_P_V, ratio_P_delta);
  const check_concentrated: 'OK' | 'NG' = maxP <= 1 ? 'OK' : 'NG';
  const controlBy_concentrated = pickControl(ratio_P_M, ratio_P_V, ratio_P_delta);

  // 容許上限（反推）
  const w_max_allow = maxW > 0 ? Math.round((w || 0) / maxW) : 0;
  const P_max_allow = maxP > 0 ? Math.round((P || 0) / maxP) : 0;

  return {
    I_rib, S_rib, A_rib, Fb_MPa, Fv_MPa,
    M_allow_rib, V_allow_rib, deflection_allow, ribsPerMeter,
    ratio_w_M, ratio_w_V, ratio_w_delta, check_uniform, controlBy_uniform,
    ribsLoaded, P_per_rib,
    ratio_P_M, ratio_P_V, ratio_P_delta, check_concentrated, controlBy_concentrated,
    w_max_allow, P_max_allow,
  };
}
