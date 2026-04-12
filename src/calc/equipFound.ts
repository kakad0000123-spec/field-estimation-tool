import { EquipFoundData, CalcResult } from '../data/types';

export interface EquipFoundCalcDetail {
  excavation: number;
  pc: number;
  concrete: number;
  foundWeight: number;
  requiredWeight: number;
  check: 'OK' | 'NG';
  rebarWt: number;
  wireMeshWt: number;
  backfill: number;
  formwork: number;
  trowel: number;
}

export function calcEquipFound(e: EquipFoundData): EquipFoundCalcDetail {
  const L = e.length / 100;
  const W = e.width / 100;
  const D = e.depth / 100;
  const WW = e.workWidth / 100;
  const PC = e.pcThickness / 100;
  const qty = e.quantity;
  const slope = e.slopeRatio ?? 0.5;

  // burialDepth: if 0, use depth for small, depth*0.5 for large as fallback
  let burialDepthCm = e.burialDepth ?? 0;
  if (burialDepthCm === 0) {
    burialDepthCm = e.sizeType === 'large' ? e.depth * 0.5 : e.depth;
  }
  const BD = burialDepthCm / 100;

  const H_excav = BD + PC; // total excavation depth in meters

  // Bottom area (at excavation base)
  const bottomL = L + 2 * WW;
  const bottomW = W + 2 * WW;
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

  // PC volume: rectangular at bottom
  const pc = bottomL * bottomW * PC * qty;

  const concrete = L * W * D * qty;
  const foundWeight = concrete * 2400;
  const requiredWeight = e.sizeType === 'large' ? e.equipWeight * 5 : e.equipWeight * 3;
  const check: 'OK' | 'NG' = foundWeight >= requiredWeight ? 'OK' : 'NG';

  // Rebar: 80 kg per m3, all SD420
  const rebarWt = concrete * 80;

  // Wire mesh: 1.65 kg/m2 on all surfaces
  const surfaceArea = L * W + 2 * L * D + 2 * W * D;
  const wireMeshWt = 1.65 * surfaceArea * qty;

  // Backfill = excavation - pc - underground concrete
  const undergroundConcrete = L * W * Math.min(BD, D) * qty;
  const backfill = Math.max(0, excavation - pc - undergroundConcrete);
  const formwork = 2 * (L + W) * D * qty;
  const trowel = L * W * qty;

  return { excavation, pc, concrete, foundWeight, requiredWeight, check, rebarWt, wireMeshWt, backfill, formwork, trowel };
}

export function equipFoundToCalcResult(e: EquipFoundData): CalcResult {
  const d = calcEquipFound(e);
  return {
    concrete280: d.concrete,
    concrete210: 0,
    rebarSD280: 0,
    rebarSD420: d.rebarWt,
    formwork: d.formwork,
    trowel: d.trowel,
    wireMesh: d.wireMeshWt,
    pcCushion: d.pc,
    excavation: d.excavation,
    backfill: d.backfill,
  };
}
