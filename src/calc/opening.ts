import { OpeningData, CalcResult } from '../data/types';
import { getRebarSpec } from '../data/rebarSpecs';
import { BAR_LENGTH_M } from '../data/defaults';

export interface OpeningCalcDetail {
  deductConcrete: number;
  deductFormwork: number;
  vertReinf: number;
  horizReinf: number;
  diagReinf: number;
  totalReinf: number;
  spliceCount: number;
  spliceLength: number;
  totalRebarSD280: number;
  totalRebarSD420: number;
}

export function calcOpening(o: OpeningData, barLengthM?: number): OpeningCalcDetail {
  const BAR_LEN = barLengthM ?? BAR_LENGTH_M;
  const OW = o.openWidth / 100;
  const OH = o.openHeight / 100;
  const T = o.thickness / 100;
  const qty = o.quantity;

  const deductConcrete = OW * OH * T * qty;

  let deductFormwork: number;
  if (o.memberType === 'wall') {
    deductFormwork = OW * OH * 2 * qty;
  } else {
    deductFormwork = OW * OH * qty;
  }

  const spec = getRebarSpec(o.reinfBar);
  let vertReinf = 0;
  let horizReinf = 0;
  let diagReinf = 0;
  let totalSD280 = 0;
  let totalSD420 = 0;
  let spliceCount = 0;
  let spliceLength = 0;

  if (spec) {
    const lap = spec.lap40D / 100;

    vertReinf = spec.kgPerM * (OH + 2 * lap) * Math.ceil(o.openWidth / o.originalSpacing) * 2 * qty;
    horizReinf = spec.kgPerM * (OW + 2 * lap) * Math.ceil(o.openHeight / o.originalSpacing) * 2 * qty;

    if (o.openWidth >= 30) {
      const diag = Math.sqrt(o.openWidth * o.openWidth + o.openHeight * o.openHeight) / 100;
      diagReinf = spec.kgPerM * (diag + 2 * lap) * qty;
    }

    const total = vertReinf + horizReinf + diagReinf;
    if (spec.grade === 'SD280') totalSD280 += total;
    else totalSD420 += total;

    // Splice calculation: each bar length includes 2*lap already
    // Vertical bars: length = OH + 2*lap
    const vertBarLen = OH + 2 * lap;
    const vertBarCount = Math.ceil(o.openWidth / o.originalSpacing) * 2 * qty;
    const vertSplicesPerBar = vertBarLen > BAR_LEN ? Math.ceil(vertBarLen / BAR_LEN) - 1 : 0;
    // Horizontal bars: length = OW + 2*lap
    const horizBarLen = OW + 2 * lap;
    const horizBarCount = Math.ceil(o.openHeight / o.originalSpacing) * 2 * qty;
    const horizSplicesPerBar = horizBarLen > BAR_LEN ? Math.ceil(horizBarLen / BAR_LEN) - 1 : 0;
    // Diagonal bars
    let diagSplices = 0;
    if (o.openWidth >= 30) {
      const diagLen = Math.sqrt(o.openWidth * o.openWidth + o.openHeight * o.openHeight) / 100 + 2 * lap;
      diagSplices = diagLen > BAR_LEN ? (Math.ceil(diagLen / BAR_LEN) - 1) * qty : 0;
    }

    spliceCount = vertSplicesPerBar * vertBarCount + horizSplicesPerBar * horizBarCount + diagSplices;
    spliceLength = spliceCount * spec.lap40D / 100;
  }

  const totalReinf = vertReinf + horizReinf + diagReinf;

  return { deductConcrete, deductFormwork, vertReinf, horizReinf, diagReinf, totalReinf, spliceCount, spliceLength, totalRebarSD280: totalSD280, totalRebarSD420: totalSD420 };
}

export function openingToCalcResult(o: OpeningData, barLengthM?: number): CalcResult {
  const d = calcOpening(o, barLengthM);
  return {
    concrete280: -d.deductConcrete,
    concrete210: 0,
    rebarSD280: d.totalRebarSD280,
    rebarSD420: d.totalRebarSD420,
    formwork: -d.deductFormwork,
    trowel: 0,
    wireMesh: 0,
    pcCushion: 0,
    excavation: 0,
    backfill: 0,
  };
}
