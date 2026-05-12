// ─── 鋼構簡支梁結構檢核引擎 ───
//
// 計算策略：站點離散化 + 線性疊加
//   1. 把跨距切成 N=100 段、101 個站點
//   2. 對每筆 LoadCase 在每站算 V(x)、M(x)，疊加得總值
//   3. 由曲率 κ = -M/EI 經兩次梯形積分得撓度 y(x)，邊界 y(0)=y(L)=0
//   4. 取 |M|、|V|、|y| 各自最大值與發生位置
//   5. 應力與撓度比檢核 → OK/NG 與利用率
//
// 單位約定：
//   長度 m / 力 kN / 力矩 kN·m / 撓度先 m 後轉 mm
//   斷面：A cm²、Ix cm⁴、Zx cm³、h tw mm、單位重 kg/m
//   應力：MPa (= N/mm²)
//
// 應力計算（單位換算速記）：
//   σb [MPa] = |M| [kN·m] × 1000 / Zx [cm³]
//   τ  [MPa] = |V| [kN]   × 10   / Aw [cm²]   ，Aw = h × tw / 100 (cm²)
// EI 速記（E=200 GPa 時）：EI [kN·m²] = 2 × Ix [cm⁴]

import { SteelSection, getSteelSection } from '../data/steelSections';
import { SteelGrade, STEEL_GRADES, E_STEEL_MPA, G_MS2 } from '../data/steelGrades';

// ─── 荷重型式 ───
export type LoadCase =
  | { kind: 'uniform'; w: number; a?: number; b?: number }  // w (kN/m)，a/b 為起訖位置 (m)，不填則整跨
  | { kind: 'point'; P: number; a: number };                // 集中載重 P (kN) 位於距左支 a (m)

// ─── 斷面來源 ───
export interface SectionPreset {
  mode: 'preset';
  label: string;
}
export interface SectionManual {
  mode: 'manual';
  h: number;          // mm
  tw: number;         // mm
  A: number;          // cm²
  Ix: number;         // cm⁴
  Zx: number;         // cm³
  unitWeight: number; // kg/m
}
export type SectionInput = SectionPreset | SectionManual;

// ─── 主輸入 ───
export interface SimpleBeamInput {
  L: number;                      // 跨距 (m)
  section: SectionInput;
  grade: SteelGrade;
  loads: LoadCase[];
  includeSelfWeight: boolean;
  deflectionLimitRatio: number;   // L/此數，例如 300 代表 L/300
}

// ─── 結果 ───
export interface SimpleBeamResult {
  // 輸入回顯
  L: number;
  section: SteelSection;
  grade: SteelGrade;

  // 最大值
  Mmax: number;       // kN·m
  xMmax: number;      // m
  Vmax: number;       // kN
  xVmax: number;      // m
  deltaMaxMm: number; // mm
  xDeltaMax: number;  // m
  deltaRatio: number; // L/δ 比值 (例如 513 表示 L/513)

  // 應力
  sigmaB: number;       // MPa
  sigmaBAllow: number;  // MPa
  bendingUtil: number;  // 0~1+
  bendingOK: boolean;

  tau: number;
  tauAllow: number;
  shearUtil: number;
  shearOK: boolean;

  // 撓度
  deflectionUtil: number;
  deflectionOK: boolean;

  // 綜合
  overallOK: boolean;
  maxUtil: number;

  // 站點資料 (給未來畫圖用)
  stations: {
    x: number[];      // m
    V: number[];      // kN
    M: number[];      // kN·m
    delta: number[];  // mm
  };

  // 計算過程提示
  selfWeightKnm: number;  // 實際納入的自重 (kN/m)
}

// ─── 內部工具 ───

const N_STATIONS = 101; // 100 段、101 點

function resolveSection(input: SectionInput): SteelSection | null {
  if (input.mode === 'preset') {
    return getSteelSection(input.label) ?? null;
  }
  if (input.A <= 0 || input.Ix <= 0 || input.Zx <= 0 || input.h <= 0 || input.tw <= 0) {
    return null;
  }
  return {
    label: '手動斷面',
    h: input.h,
    b: 0,
    tw: input.tw,
    tf: 0,
    A: input.A,
    Ix: input.Ix,
    Zx: input.Zx,
    unitWeight: input.unitWeight,
  };
}

function applyUniform(
  stations: number[],
  L: number,
  w: number,
  a: number,
  b: number,
  V: number[],
  M: number[],
) {
  if (w === 0 || b <= a) return;
  const p = b - a;
  const xc = (a + b) / 2;
  const RA = (w * p * (L - xc)) / L;
  const RB = w * p - RA;
  for (let i = 0; i < stations.length; i++) {
    const x = stations[i];
    if (x < a) {
      V[i] += RA;
      M[i] += RA * x;
    } else if (x <= b) {
      V[i] += RA - w * (x - a);
      M[i] += RA * x - (w * (x - a) * (x - a)) / 2;
    } else {
      V[i] += -RB;
      M[i] += RB * (L - x);
    }
  }
}

function applyPoint(
  stations: number[],
  L: number,
  P: number,
  a: number,
  V: number[],
  M: number[],
) {
  if (P === 0 || a < 0 || a > L) return;
  const RA = (P * (L - a)) / L;
  const RB = (P * a) / L;
  for (let i = 0; i < stations.length; i++) {
    const x = stations[i];
    if (x < a) {
      V[i] += RA;
      M[i] += RA * x;
    } else if (x === a) {
      // 載重點位置：剪力取載重左側值，避免跳階造成最大值搜尋誤差
      V[i] += RA;
      M[i] += RA * x;
    } else {
      V[i] += -RB;
      M[i] += RB * (L - x);
    }
  }
}

function cumtrapz(y: number[], dx: number): number[] {
  const out = new Array<number>(y.length).fill(0);
  for (let i = 1; i < y.length; i++) {
    out[i] = out[i - 1] + (y[i - 1] + y[i]) * 0.5 * dx;
  }
  return out;
}

function emptyResult(L: number, grade: SteelGrade): SimpleBeamResult {
  const placeholder: SteelSection = {
    label: '—', h: 0, b: 0, tw: 0, tf: 0, A: 0, Ix: 0, Zx: 0, unitWeight: 0,
  };
  return {
    L,
    section: placeholder,
    grade,
    Mmax: 0, xMmax: 0,
    Vmax: 0, xVmax: 0,
    deltaMaxMm: 0, xDeltaMax: 0,
    deltaRatio: Infinity,
    sigmaB: 0, sigmaBAllow: STEEL_GRADES[grade].fb, bendingUtil: 0, bendingOK: true,
    tau: 0, tauAllow: STEEL_GRADES[grade].fs, shearUtil: 0, shearOK: true,
    deflectionUtil: 0, deflectionOK: true,
    overallOK: true,
    maxUtil: 0,
    stations: { x: [], V: [], M: [], delta: [] },
    selfWeightKnm: 0,
  };
}

// ─── 主函式 ───

export function calcSimpleBeam(input: SimpleBeamInput): SimpleBeamResult {
  const { L, grade, loads, includeSelfWeight, deflectionLimitRatio } = input;

  if (!(L > 0)) return emptyResult(L, grade);

  const section = resolveSection(input.section);
  if (!section) return emptyResult(L, grade);

  // 站點
  const dx = L / (N_STATIONS - 1);
  const x = new Array<number>(N_STATIONS);
  for (let i = 0; i < N_STATIONS; i++) x[i] = i * dx;

  const V = new Array<number>(N_STATIONS).fill(0);
  const M = new Array<number>(N_STATIONS).fill(0);

  // 自重 (kg/m × m/s² → N/m → kN/m)
  const selfWeightKnm = includeSelfWeight
    ? (section.unitWeight * G_MS2) / 1000
    : 0;
  if (selfWeightKnm > 0) {
    applyUniform(x, L, selfWeightKnm, 0, L, V, M);
  }

  // 使用者荷重
  for (const lc of loads) {
    if (lc.kind === 'uniform') {
      const a = lc.a ?? 0;
      const b = lc.b ?? L;
      applyUniform(x, L, lc.w, Math.max(0, a), Math.min(L, b), V, M);
    } else {
      applyPoint(x, L, lc.P, lc.a, V, M);
    }
  }

  // 撓度：EI [kN·m²] = E [kN/m²] × Ix [m⁴] = (E_MPa × 1000) × (Ix_cm4 × 1e-8)
  //                  = E_MPa × Ix_cm4 × 1e-5
  // 例：E=200000 MPa, Ix=7210 → EI = 200000 × 7210 × 1e-5 = 14420 kN·m² ✓
  const EI = E_STEEL_MPA * section.Ix * 1e-5;

  // y" = -M/EI (y 以向下為正)
  let yMm: number[];
  if (EI > 0) {
    const kappa = M.map((m) => -m / EI);
    const theta0 = cumtrapz(kappa, dx);        // 不含積分常數的 y'
    const yUncorr = cumtrapz(theta0, dx);      // 不含積分常數的 y
    // BC: y(0)=0 → C2=0；y(L)=0 → C1 = -yUncorr[N-1]/L
    const C1 = -yUncorr[N_STATIONS - 1] / L;
    yMm = yUncorr.map((y, i) => (y + C1 * x[i]) * 1000); // m → mm
  } else {
    yMm = new Array<number>(N_STATIONS).fill(0);
  }

  // 找最大值
  let Mmax = 0, xMmax = 0;
  let Vmax = 0, xVmax = 0;
  let deltaMaxMm = 0, xDeltaMax = 0;
  for (let i = 0; i < N_STATIONS; i++) {
    const aM = Math.abs(M[i]);
    if (aM > Mmax) { Mmax = aM; xMmax = x[i]; }
    const aV = Math.abs(V[i]);
    if (aV > Vmax) { Vmax = aV; xVmax = x[i]; }
    const aD = Math.abs(yMm[i]);
    if (aD > deltaMaxMm) { deltaMaxMm = aD; xDeltaMax = x[i]; }
  }

  // 應力
  const Zx = section.Zx;
  const sigmaB = Zx > 0 ? (Mmax * 1000) / Zx : 0; // MPa
  const Aw = (section.h * section.tw) / 100;       // cm²
  const tau = Aw > 0 ? (Vmax * 10) / Aw : 0;       // MPa

  const fb = STEEL_GRADES[grade].fb;
  const fs = STEEL_GRADES[grade].fs;

  const bendingUtil = fb > 0 ? sigmaB / fb : 0;
  const shearUtil = fs > 0 ? tau / fs : 0;

  // 撓度比與檢核
  const deltaRatio = deltaMaxMm > 0 ? (L * 1000) / deltaMaxMm : Infinity;
  const deflectionUtil = deflectionLimitRatio > 0
    ? deflectionLimitRatio / Math.max(deltaRatio, 1e-9)
    : 0;

  const bendingOK = bendingUtil <= 1.0;
  const shearOK = shearUtil <= 1.0;
  const deflectionOK = deflectionUtil <= 1.0;
  const maxUtil = Math.max(bendingUtil, shearUtil, deflectionUtil);
  const overallOK = bendingOK && shearOK && deflectionOK;

  return {
    L,
    section,
    grade,
    Mmax, xMmax,
    Vmax, xVmax,
    deltaMaxMm, xDeltaMax,
    deltaRatio,
    sigmaB, sigmaBAllow: fb, bendingUtil, bendingOK,
    tau, tauAllow: fs, shearUtil, shearOK,
    deflectionUtil, deflectionOK,
    overallOK,
    maxUtil,
    stations: { x, V, M, delta: yMm },
    selfWeightKnm,
  };
}
