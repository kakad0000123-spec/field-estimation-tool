import { SlabData, CalcResult } from '../data/types';
import { getRebarSpec } from '../data/rebarSpecs';
import { getWireMeshSpec } from '../data/wireMeshSpecs';
import { BAR_LENGTH_M } from '../data/defaults';

export interface SlabCalcDetail {
  area: number;
  concrete: number;
  upperBarWt: number;
  lowerBarWt: number;
  wireMeshWt: number;
  formwork: number;
  trowel: number;
  spliceCount: number;
  spliceLength: number;
  totalRebarSD280: number;
  totalRebarSD420: number;
}

export function calcSlab(s: SlabData, barLengthM?: number): SlabCalcDetail {
  const BAR_LEN = barLengthM ?? BAR_LENGTH_M;
  const area = (s.length / 100) * (s.width / 100);
  const qty = s.quantity;
  const concrete = area * (s.thickness / 100) * qty;
  const formwork = area * qty;
  const trowel = area * qty;

  let upperBarWt = 0;
  let lowerBarWt = 0;
  let wireMeshWt = 0;
  let totalSD280 = 0;
  let totalSD420 = 0;
  let spliceCount = 0;
  let spliceLength = 0;

  if (s.reinfType === 'rebar') {
    const cover = (s.cover || 4) / 100; // cover in meters
    const effL = s.length / 100 - 2 * cover; // effective length after deducting cover
    const effW = s.width / 100 - 2 * cover;  // effective width after deducting cover

    const lowerSpec = getRebarSpec(s.lowerBar);
    if (lowerSpec && s.lowerSpacing > 0 && effL > 0 && effW > 0) {
      // X-direction bars: length=effL, count=floor(effW/(spacing/100))+1
      // Y-direction bars: length=effW, count=floor(effL/(spacing/100))+1
      const sp = s.lowerSpacing / 100;
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

    if (s.layers === 2) {
      const upperSpec = getRebarSpec(s.upperBar);
      if (upperSpec && s.upperSpacing > 0 && effL > 0 && effW > 0) {
        const sp = s.upperSpacing / 100;
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
    const meshSpec = getWireMeshSpec(s.wireMesh);
    if (meshSpec) {
      wireMeshWt = meshSpec.kgPerM2 * area * qty;
    }
  }

  return {
    area,
    concrete,
    upperBarWt,
    lowerBarWt,
    wireMeshWt,
    formwork,
    trowel,
    spliceCount,
    spliceLength,
    totalRebarSD280: totalSD280,
    totalRebarSD420: totalSD420,
  };
}

export function slabToCalcResult(s: SlabData, barLengthM?: number): CalcResult {
  const d = calcSlab(s, barLengthM);
  return {
    concrete280: d.concrete,
    concrete210: 0,
    rebarSD280: d.totalRebarSD280,
    rebarSD420: d.totalRebarSD420,
    formwork: d.formwork,
    trowel: d.trowel,
    wireMesh: d.wireMeshWt,
    pcCushion: 0,
    excavation: 0,
    backfill: 0,
  };
}
