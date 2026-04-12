import { FloorData, CalcResult } from '../data/types';
import { getRebarSpec } from '../data/rebarSpecs';
import { getWireMeshSpec } from '../data/wireMeshSpecs';
import { BAR_LENGTH_M } from '../data/defaults';

export interface FloorCalcDetail {
  area: number;
  excavation: number;
  pc: number;
  concrete: number;
  backfill: number;
  upperBarWt: number;
  lowerBarWt: number;
  wireMeshWt: number;
  trowel: number;
  spliceCount: number;
  spliceLength: number;
  totalRebarSD280: number;
  totalRebarSD420: number;
}

export function calcFloor(f: FloorData, barLengthM?: number): FloorCalcDetail {
  const BAR_LEN = barLengthM ?? BAR_LENGTH_M;
  const area = (f.length / 100) * (f.width / 100);
  const qty = f.quantity;
  const slope = f.slopeRatio ?? 0.5;

  // Trapezoidal excavation
  const H_excav = f.excavDepth / 100;
  const bottomL = f.length / 100;
  const bottomW = f.width / 100;

  const topL = bottomL + 2 * H_excav * slope;
  const topW = bottomW + 2 * H_excav * slope;

  const A_bottom = bottomL * bottomW;
  const A_top = topL * topW;
  const midL = (bottomL + topL) / 2;
  const midW = (bottomW + topW) / 2;
  const A_mid = midL * midW;

  const excavation = H_excav / 6 * (A_top + A_bottom + 4 * A_mid) * qty;

  const pc = area * (f.pcThickness / 100) * qty;
  const concrete = area * (f.thickness / 100) * qty;
  const backfill = excavation - pc - concrete;
  const trowel = area * qty;

  let upperBarWt = 0;
  let lowerBarWt = 0;
  let wireMeshWt = 0;
  let totalSD280 = 0;
  let totalSD420 = 0;
  let spliceCount = 0;
  let spliceLength = 0;

  if (f.reinfType === 'rebar') {
    const cover = (f.cover || 4) / 100;
    const effL = f.length / 100 - 2 * cover;
    const effW = f.width / 100 - 2 * cover;

    const lowerSpec = getRebarSpec(f.lowerBar);
    if (lowerSpec && f.lowerSpacing > 0 && effL > 0 && effW > 0) {
      const sp = f.lowerSpacing / 100;
      const xCount = Math.floor(effW / sp) + 1;
      const yCount = Math.floor(effL / sp) + 1;
      lowerBarWt = lowerSpec.kgPerM * (effL * xCount + effW * yCount) * 1.15 * qty;
      if (lowerSpec.grade === 'SD280') totalSD280 += lowerBarWt;
      else totalSD420 += lowerBarWt;

      // Splice calculation for lower layer
      const xSplicesPerBar = effL > BAR_LEN ? Math.ceil(effL / BAR_LEN) - 1 : 0;
      const ySplicesPerBar = effW > BAR_LEN ? Math.ceil(effW / BAR_LEN) - 1 : 0;
      const lowerSpliceCount = (xSplicesPerBar * xCount + ySplicesPerBar * yCount) * qty;
      spliceCount += lowerSpliceCount;
      spliceLength += lowerSpliceCount * lowerSpec.lap40D / 100;
    }

    if (f.layers === 2) {
      const upperSpec = getRebarSpec(f.upperBar);
      if (upperSpec && f.upperSpacing > 0 && effL > 0 && effW > 0) {
        const sp = f.upperSpacing / 100;
        const xCount = Math.floor(effW / sp) + 1;
        const yCount = Math.floor(effL / sp) + 1;
        upperBarWt = upperSpec.kgPerM * (effL * xCount + effW * yCount) * 1.15 * qty;
        if (upperSpec.grade === 'SD280') totalSD280 += upperBarWt;
        else totalSD420 += upperBarWt;

        // Splice calculation for upper layer
        const xSplicesPerBar = effL > BAR_LEN ? Math.ceil(effL / BAR_LEN) - 1 : 0;
        const ySplicesPerBar = effW > BAR_LEN ? Math.ceil(effW / BAR_LEN) - 1 : 0;
        const upperSpliceCount = (xSplicesPerBar * xCount + ySplicesPerBar * yCount) * qty;
        spliceCount += upperSpliceCount;
        spliceLength += upperSpliceCount * upperSpec.lap40D / 100;
      }
    }
  } else {
    const meshSpec = getWireMeshSpec(f.wireMesh);
    if (meshSpec) {
      wireMeshWt = meshSpec.kgPerM2 * area * qty;
    }
  }

  return {
    area,
    excavation,
    pc,
    concrete,
    backfill: Math.max(0, backfill),
    upperBarWt,
    lowerBarWt,
    wireMeshWt,
    trowel,
    spliceCount,
    spliceLength,
    totalRebarSD280: totalSD280,
    totalRebarSD420: totalSD420,
  };
}

export function floorToCalcResult(f: FloorData, barLengthM?: number): CalcResult {
  const d = calcFloor(f, barLengthM);
  return {
    concrete280: 0,
    concrete210: d.concrete, // floor uses fc'=210
    rebarSD280: d.totalRebarSD280,
    rebarSD420: d.totalRebarSD420,
    formwork: 0, // ground slab, no formwork
    trowel: d.trowel,
    wireMesh: d.wireMeshWt,
    pcCushion: d.pc,
    excavation: d.excavation,
    backfill: d.backfill,
  };
}
