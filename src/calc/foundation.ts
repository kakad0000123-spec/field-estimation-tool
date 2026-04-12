import { FoundationData, CalcResult } from '../data/types';
import { getRebarSpec } from '../data/rebarSpecs';
import { BAR_LENGTH_M } from '../data/defaults';

export interface FoundationCalcDetail {
  excavation: number;
  pc: number;
  concrete: number;
  backfill: number;
  rebarWt: number;
  formwork: number;
  spliceCount: number;
  spliceLength: number;
  totalRebarSD280: number;
  totalRebarSD420: number;
  suggestedWorkWidth: number | null;
}

export function calcFoundation(f: FoundationData, barLengthM?: number): FoundationCalcDetail {
  const BAR_LEN = barLengthM ?? BAR_LENGTH_M;
  const FL = f.foundLength / 100;
  const FW = f.foundWidth / 100;
  const FD = f.foundDepth / 100;
  const PC = f.pcThickness / 100;
  const WW = f.workWidth / 100;
  const qty = f.quantity;
  const slope = f.slopeRatio ?? 0.5;

  // burialDepth: if 0, use foundDepth as fallback (fully buried)
  const burialDepthCm = (f.burialDepth ?? 0) === 0 ? f.foundDepth : f.burialDepth;
  const H_excav = burialDepthCm / 100 + PC; // total excavation depth in meters

  // Bottom area (at excavation base)
  const bottomL = FL + 2 * WW;
  const bottomW = FW + 2 * WW;
  const A_bottom = bottomL * bottomW;

  // Top area (at ground level) - expanded by slope
  const topL = bottomL + 2 * H_excav * slope;
  const topW = bottomW + 2 * H_excav * slope;
  const A_top = topL * topW;

  // Middle area
  const midL = (bottomL + topL) / 2;
  const midW = (bottomW + topW) / 2;
  const A_mid = midL * midW;

  // Prismoidal formula
  const excavation = H_excav / 6 * (A_top + A_bottom + 4 * A_mid) * qty;

  // PC volume: rectangular at bottom of excavation
  const pc = bottomL * bottomW * PC * qty;

  const concrete = FL * FW * FD * qty;

  // Backfill = excavation - pc - concrete
  const backfill = Math.max(0, excavation - pc - concrete);

  const barSpec = getRebarSpec(f.bottomBar);
  let rebarWt = 0;
  let totalSD280 = 0;
  let totalSD420 = 0;
  let spliceCount = 0;
  let spliceLength = 0;

  if (barSpec && f.barSpacing > 0 && FL > 0 && FW > 0) {
    const spacing = f.barSpacing / 100;
    rebarWt = barSpec.kgPerM * ((FL / spacing) * FW + (FW / spacing) * FL) * 1.2 * qty;
    if (barSpec.grade === 'SD280') totalSD280 += rebarWt;
    else totalSD420 += rebarWt;

    // Splice calculation
    // Bars in L direction: length = FW, count = FL / spacing
    const lDirCount = Math.floor(FL / spacing);
    const lDirSplicesPerBar = FW > BAR_LEN ? Math.ceil(FW / BAR_LEN) - 1 : 0;
    // Bars in B direction: length = FL, count = FW / spacing
    const bDirCount = Math.floor(FW / spacing);
    const bDirSplicesPerBar = FL > BAR_LEN ? Math.ceil(FL / BAR_LEN) - 1 : 0;

    spliceCount = (lDirSplicesPerBar * lDirCount + bDirSplicesPerBar * bDirCount) * qty;
    spliceLength = spliceCount * barSpec.lap40D / 100;
  }

  const formwork = 2 * (FL + FW) * FD * qty;

  // Auto work width suggestion
  let suggestedWorkWidth: number | null = null;
  if (f.burialDepth > 0) {
    suggestedWorkWidth = (f.burialDepth + f.pcThickness) >= 100 ? 50 : 30;
  }

  return { excavation, pc, concrete, backfill, rebarWt, formwork, spliceCount, spliceLength, totalRebarSD280: totalSD280, totalRebarSD420: totalSD420, suggestedWorkWidth };
}

export function foundationToCalcResult(f: FoundationData, barLengthM?: number): CalcResult {
  const d = calcFoundation(f, barLengthM);
  return {
    concrete280: d.concrete,
    concrete210: 0,
    rebarSD280: d.totalRebarSD280,
    rebarSD420: d.totalRebarSD420,
    formwork: d.formwork,
    trowel: 0,
    wireMesh: 0,
    pcCushion: d.pc,
    excavation: d.excavation,
    backfill: d.backfill,
  };
}
