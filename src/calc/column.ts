import { ColumnData, CalcResult } from '../data/types';
import { getRebarSpec } from '../data/rebarSpecs';
import { BAR_LENGTH_M } from '../data/defaults';


export interface ColumnCalcDetail {
  concrete: number;
  mainBarWt: number;
  tieBarWt: number;
  crosstieWt: number;
  formwork: number;
  spliceCount: number;
  spliceLength: number;
  totalRebarSD280: number;
  totalRebarSD420: number;
}

export function calcColumn(c: ColumnData, barLengthM?: number): ColumnCalcDetail {
  const BAR_LEN = barLengthM ?? BAR_LENGTH_M;
  const mainSpec = getRebarSpec(c.mainBar);
  const tieSpec = getRebarSpec(c.tieBar);

  if (!mainSpec || !tieSpec) {
    return { concrete: 0, mainBarWt: 0, tieBarWt: 0, crosstieWt: 0, formwork: 0, spliceCount: 0, spliceLength: 0, totalRebarSD280: 0, totalRebarSD420: 0 };
  }

  const W = c.width / 100;
  const D = c.depth / 100;
  const H = c.height / 100;
  const qty = c.quantity;

  const concrete = W * D * H * qty;

  const mainBarLength = H + mainSpec.lap40D / 100;
  const mainBarWt = mainSpec.kgPerM * mainBarLength * c.mainBarCount * qty;

  const tiePerimeter = 2 * ((W + D) - 0.08) + 2 * (tieSpec.hook12D / 100);
  const tieCount = Math.floor(c.height / c.tieSpacing) + 1;
  const tieBarWt = tieSpec.kgPerM * tiePerimeter * tieCount * qty;

  const crosstieLength = Math.max(c.width, c.depth) / 100 - 0.08 + 2 * (tieSpec.hook12D / 100);
  const crosstieWt = tieSpec.kgPerM * crosstieLength * c.crosstieCount * tieCount * qty;

  const formwork = 2 * (W + D) * H * qty;

  const spliceCount = Math.max(0, Math.ceil(mainBarLength / BAR_LEN) - 1) * c.mainBarCount * qty;
  const spliceLength = spliceCount * (mainSpec.lap40D / 100);

  // Classify rebar by grade
  let totalSD280 = 0;
  let totalSD420 = 0;
  const mainTotal = mainBarWt + spliceLength * mainSpec.kgPerM;
  if (mainSpec.grade === 'SD280') totalSD280 += mainTotal;
  else totalSD420 += mainTotal;

  const tieTotal = tieBarWt + crosstieWt;
  if (tieSpec.grade === 'SD280') totalSD280 += tieTotal;
  else totalSD420 += tieTotal;

  return {
    concrete,
    mainBarWt,
    tieBarWt,
    crosstieWt,
    formwork,
    spliceCount,
    spliceLength,
    totalRebarSD280: totalSD280,
    totalRebarSD420: totalSD420,
  };
}

export function columnToCalcResult(c: ColumnData, barLengthM?: number): CalcResult {
  const d = calcColumn(c, barLengthM);
  return {
    concrete280: d.concrete,
    concrete210: 0,
    rebarSD280: d.totalRebarSD280,
    rebarSD420: d.totalRebarSD420,
    formwork: d.formwork,
    trowel: 0,
    wireMesh: 0,
    pcCushion: 0,
    excavation: 0,
    backfill: 0,
  };
}
