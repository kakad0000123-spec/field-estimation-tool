import { WallData, CalcResult } from '../data/types';
import { getRebarSpec } from '../data/rebarSpecs';
import { BAR_LENGTH_M } from '../data/defaults';

export interface WallCalcDetail {
  concrete: number;
  rebarWt: number;
  vertBarWt: number;
  horizBarWt: number;
  formwork: number;
  spliceCount: number;
  spliceLength: number;
  totalRebarSD280: number;
  totalRebarSD420: number;
}

export function calcWall(w: WallData, barLengthM?: number): WallCalcDetail {
  const BAR_LEN = barLengthM ?? BAR_LENGTH_M;
  const L = w.wallLength / 100;
  const H = w.wallHeight / 100;
  const T = w.thickness / 100;
  const qty = w.quantity;

  const concrete = L * H * T * qty;

  const vertSpec = getRebarSpec(w.vertBar);
  const horizSpec = getRebarSpec(w.horizBar);

  let rebarWt = 0;
  let vertBarWt = 0;
  let horizBarWt = 0;
  let totalSD280 = 0;
  let totalSD420 = 0;
  let spliceCount = 0;
  let spliceLength = 0;

  if (vertSpec && horizSpec && w.vertSpacing > 0 && w.horizSpacing > 0) {
    const cover = (w.cover || 4) / 100; // cover in meters
    const effL = L - 2 * cover; // effective length after cover
    const effH = H - 2 * cover; // effective height after cover

    if (effL > 0 && effH > 0) {
      // Vertical bars: each bar length = effH, count = floor(effL / vertSpacing) + 1
      const vertCount = Math.floor(effL / (w.vertSpacing / 100)) + 1;
      const vertWtRaw = vertSpec.kgPerM * effH * vertCount;
      // Horizontal bars: each bar length = effL, count = floor(effH / horizSpacing) + 1
      const horizCount = Math.floor(effH / (w.horizSpacing / 100)) + 1;
      const horizWtRaw = horizSpec.kgPerM * effL * horizCount;
      // 2 faces x 1.15 factor
      vertBarWt = vertWtRaw * 2 * 1.15 * qty;
      horizBarWt = horizWtRaw * 2 * 1.15 * qty;
      rebarWt = vertBarWt + horizBarWt;

      // Classify by grade
      if (vertSpec.grade === 'SD280') totalSD280 += vertBarWt;
      else totalSD420 += vertBarWt;
      if (horizSpec.grade === 'SD280') totalSD280 += horizBarWt;
      else totalSD420 += horizBarWt;

      // Splice calculations
      // Vertical bars: length = effH, 2 faces
      const vertSplicesPerBar = effH > BAR_LEN ? Math.ceil(effH / BAR_LEN) - 1 : 0;
      const vertTotalSplices = vertSplicesPerBar * vertCount * 2 * qty;
      // Horizontal bars: length = effL, 2 faces
      const horizSplicesPerBar = effL > BAR_LEN ? Math.ceil(effL / BAR_LEN) - 1 : 0;
      const horizTotalSplices = horizSplicesPerBar * horizCount * 2 * qty;

      spliceCount = vertTotalSplices + horizTotalSplices;
      spliceLength = vertTotalSplices * vertSpec.lap40D / 100 + horizTotalSplices * horizSpec.lap40D / 100;
    }
  }

  const formwork = 2 * L * H * qty;

  return { concrete, rebarWt, vertBarWt, horizBarWt, formwork, spliceCount, spliceLength, totalRebarSD280: totalSD280, totalRebarSD420: totalSD420 };
}

export function wallToCalcResult(w: WallData, barLengthM?: number): CalcResult {
  const d = calcWall(w, barLengthM);
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
