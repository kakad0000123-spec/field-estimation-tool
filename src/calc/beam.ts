import { BeamData, CalcResult } from '../data/types';
import { getRebarSpec } from '../data/rebarSpecs';
import { BAR_LENGTH_M } from '../data/defaults';

export interface BeamCalcDetail {
  concrete: number;
  topBarWt: number;
  bottomBarWt: number;
  stirrupWt: number;
  formwork: number;
  spliceCount: number;
  spliceLength: number;
  totalRebarSD280: number;
  totalRebarSD420: number;
}

export function calcBeam(b: BeamData, barLengthM?: number): BeamCalcDetail {
  const BAR_LEN = barLengthM ?? BAR_LENGTH_M;
  const topSpec = getRebarSpec(b.topBar);
  const botSpec = getRebarSpec(b.bottomBar);
  const stirSpec = getRebarSpec(b.stirrup);

  if (!topSpec || !botSpec || !stirSpec) {
    return { concrete: 0, topBarWt: 0, bottomBarWt: 0, stirrupWt: 0, formwork: 0, spliceCount: 0, spliceLength: 0, totalRebarSD280: 0, totalRebarSD420: 0 };
  }

  const W = b.width / 100;
  const D = b.depth / 100;
  const L = b.span / 100;
  const qty = b.quantity;

  const concrete = W * D * L * qty;

  const topBarLen = L + 2 * (topSpec.lap40D / 100);
  const topBarWt = topSpec.kgPerM * topBarLen * b.topBarCount * qty;

  const botBarLen = L + 2 * (botSpec.lap40D / 100);
  const bottomBarWt = botSpec.kgPerM * botBarLen * b.bottomBarCount * qty;

  const stirPerimeter = 2 * ((W + D) - 0.08) + 2 * (stirSpec.hook12D / 100);
  const stirrupCount = (b.span * 0.4 / b.denseSpacing) + (b.span * 0.6 / b.sparseSpacing) + 2;
  const stirrupWt = stirSpec.kgPerM * stirPerimeter * stirrupCount * qty;

  // Formwork: 3 faces (bottom + 2 sides)
  const formwork = (2 * D + W) * L * qty;

  // Splice for main bars
  const topSplice = (Math.ceil(topBarLen / BAR_LEN) - 1) * b.topBarCount * qty;
  const botSplice = (Math.ceil(botBarLen / BAR_LEN) - 1) * b.bottomBarCount * qty;
  const spliceCount = Math.max(0, topSplice) + Math.max(0, botSplice);

  // Use the top bar lap for top splices and bot bar lap for bot splices
  const spliceLength = (Math.max(0, topSplice) * (topSpec.lap40D / 100)) + (Math.max(0, botSplice) * (botSpec.lap40D / 100));

  let totalSD280 = 0;
  let totalSD420 = 0;

  const topTotal = topBarWt + Math.max(0, topSplice) * (topSpec.lap40D / 100) * topSpec.kgPerM;
  if (topSpec.grade === 'SD280') totalSD280 += topTotal;
  else totalSD420 += topTotal;

  const botTotal = bottomBarWt + Math.max(0, botSplice) * (botSpec.lap40D / 100) * botSpec.kgPerM;
  if (botSpec.grade === 'SD280') totalSD280 += botTotal;
  else totalSD420 += botTotal;

  if (stirSpec.grade === 'SD280') totalSD280 += stirrupWt;
  else totalSD420 += stirrupWt;

  return {
    concrete,
    topBarWt,
    bottomBarWt,
    stirrupWt,
    formwork,
    spliceCount,
    spliceLength,
    totalRebarSD280: totalSD280,
    totalRebarSD420: totalSD420,
  };
}

export function beamToCalcResult(b: BeamData, barLengthM?: number): CalcResult {
  const d = calcBeam(b, barLengthM);
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
