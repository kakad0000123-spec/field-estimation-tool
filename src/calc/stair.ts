import { StairData, CalcResult } from '../data/types';
import { getRebarSpec } from '../data/rebarSpecs';
import { BAR_LENGTH_M } from '../data/defaults';

export interface StairCalcDetail {
  diagonalLength: number;
  concrete: number;
  mainBarWt: number;
  distBarWt: number;
  formwork: number;
  trowel: number;
  spliceCount: number;
  spliceLength: number;
  totalRebarSD280: number;
  totalRebarSD420: number;
}

export function calcStair(s: StairData, barLengthM?: number): StairCalcDetail {
  const BAR_LEN = barLengthM ?? BAR_LENGTH_M;
  const SW = s.stairWidth / 100;
  const R = s.riser / 100;
  const T = s.tread / 100;
  const SL = s.slabThick / 100;
  const qty = s.quantity;

  const totalRise = s.steps * R;
  const totalRun = s.steps * T;
  const diagonalLength = Math.sqrt(totalRise * totalRise + totalRun * totalRun);

  // Concrete: slab portion + step triangles
  const concrete = (diagonalLength * SW * SL + s.steps * R * T * SW / 2) * qty;

  const mainSpec = getRebarSpec(s.mainBar);
  let mainBarWt = 0;
  let spliceCount = 0;
  let spliceLength = 0;
  let totalSD280 = 0;
  let totalSD420 = 0;

  if (mainSpec) {
    const mainLen = diagonalLength + 2 * (mainSpec.lap40D / 100);
    const barCount = s.stairWidth / s.barSpacing;
    mainBarWt = mainSpec.kgPerM * mainLen * barCount * qty;

    // Splice: each bar that exceeds 6m standard length needs splices
    spliceCount = Math.max(0, Math.ceil(mainLen / BAR_LEN) - 1) * barCount * qty;
    spliceLength = spliceCount * (mainSpec.lap40D / 100);

    if (mainSpec.grade === 'SD280') totalSD280 += mainBarWt;
    else totalSD420 += mainBarWt;
  }

  // Distribution bar: fixed #3@20cm
  const distBarWt = 0.56 / 0.2 * diagonalLength * SW * qty;
  totalSD280 += distBarWt; // #3 is SD280

  const formwork = diagonalLength * SW * qty;
  const trowel = s.steps * (T + R) * SW * qty;

  return { diagonalLength, concrete, mainBarWt, distBarWt, formwork, trowel, spliceCount, spliceLength, totalRebarSD280: totalSD280, totalRebarSD420: totalSD420 };
}

export function stairToCalcResult(s: StairData, barLengthM?: number): CalcResult {
  const d = calcStair(s, barLengthM);
  return {
    concrete280: d.concrete,
    concrete210: 0,
    rebarSD280: d.totalRebarSD280,
    rebarSD420: d.totalRebarSD420,
    formwork: d.formwork,
    trowel: d.trowel,
    wireMesh: 0,
    pcCushion: 0,
    excavation: 0,
    backfill: 0,
  };
}
