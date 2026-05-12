import { SteelMemberData, SteelPlateData } from '../data/types';
import { getSteelSection, getSteelPlate } from '../data/steelSections';

export interface SteelMemberCalcDetail {
  totalLength: number;      // m (length × quantity)
  totalWeight: number;      // kg
  paintArea: number;        // m²
}

/**
 * Steel linear member: weight = unitWeight × length × quantity
 * Paint area = surfaceArea × (coatingLength or full length) × quantity
 * If deductTopArea (for beams), subtract the top-flange-to-slab area
 *   (approximated as flange-width × length, but for MVP we use a simpler factor)
 */
export function calcSteelMember(m: SteelMemberData): SteelMemberCalcDetail {
  const spec = getSteelSection(m.section);
  if (!spec) {
    return { totalLength: 0, totalWeight: 0, paintArea: 0 };
  }

  const lengthM = m.length / 1000;
  const totalLength = lengthM * m.quantity;
  const totalWeight = spec.weight * lengthM * m.quantity;

  // Coating area: if coatingLength=0, use full length; else use coatingLength
  const coatLenM = (m.coatingLength > 0 ? m.coatingLength : m.length) / 1000;
  let paintArea = 0;
  if (m.coating && m.coating !== '無') {
    paintArea = spec.surfaceArea * coatLenM * m.quantity;
    // Deduct beam top (rough approximation: H-flange-width contact with slab)
    // For MVP we use a 15% reduction when deductTopArea is on
    if (m.deductTopArea) {
      paintArea *= 0.85;
    }
  }

  return { totalLength, totalWeight, paintArea };
}

export interface SteelPlateCalcDetail {
  totalArea: number;       // m²
  totalWeight: number;     // kg
  paintArea: number;       // m² (both sides usually)
}

export function calcSteelPlate(p: SteelPlateData): SteelPlateCalcDetail {
  const spec = getSteelPlate(p.plate);
  if (!spec) {
    return { totalArea: 0, totalWeight: 0, paintArea: 0 };
  }
  const areaPerPiece = (p.length / 1000) * (p.width / 1000);
  const totalArea = areaPerPiece * p.quantity;
  const totalWeight = spec.weight * totalArea;
  const paintArea = (p.coating && p.coating !== '無') ? totalArea * 2 : 0; // both sides
  return { totalArea, totalWeight, paintArea };
}
