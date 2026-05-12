import { ComponentData, CalcResult, ManualRCData, CustomData, SteelMemberData, SteelPlateData, PriceTable, WasteRates, SummaryLine } from '../data/types';
import { columnToCalcResult } from './column';
import { beamToCalcResult } from './beam';
import { slabToCalcResult } from './slab';
import { wallToCalcResult } from './wall';
import { floorToCalcResult } from './floor';
import { foundationToCalcResult } from './foundation';
import { equipFoundToCalcResult } from './equipFound';
import { stairToCalcResult } from './stair';
import { openingToCalcResult } from './opening';
import { calcSteelMember, calcSteelPlate } from './steelMember';

export function calcComponentResult(comp: ComponentData, barLengthM?: number): CalcResult | null {
  switch (comp.type) {
    case 'column': return columnToCalcResult(comp, barLengthM);
    case 'beam': return beamToCalcResult(comp, barLengthM);
    case 'slab': return slabToCalcResult(comp, barLengthM);
    case 'wall': return wallToCalcResult(comp, barLengthM);
    case 'floor': return floorToCalcResult(comp, barLengthM);
    case 'foundation': return foundationToCalcResult(comp, barLengthM);
    case 'equipFound': return equipFoundToCalcResult(comp);
    case 'stair': return stairToCalcResult(comp, barLengthM);
    case 'opening': return openingToCalcResult(comp, barLengthM);
    case 'manualRC': return null; // handled separately
    case 'custom': return null;   // handled separately
    case 'steelMember': return null; // steel: aggregated separately
    case 'steelPlate': return null;
  }
}

function emptyResult(): CalcResult {
  return { concrete280: 0, concrete210: 0, rebarSD280: 0, rebarSD420: 0, formwork: 0, trowel: 0, wireMesh: 0, pcCushion: 0, excavation: 0, backfill: 0 };
}

export function aggregateResults(components: ComponentData[], barLengthM?: number): CalcResult {
  const total = emptyResult();

  for (const comp of components) {
    if (comp.type === 'manualRC') {
      const m = comp as ManualRCData;
      total.concrete280 += m.concrete280;
      total.concrete210 += m.concrete210;
      total.rebarSD280 += m.rebarSD280;
      total.rebarSD420 += m.rebarSD420;
      total.formwork += m.formwork;
      total.trowel += m.trowel;
      total.wireMesh += m.wireMesh;
      total.pcCushion += m.pcCushion;
      total.excavation += m.excavation;
      total.backfill += m.backfill;
      continue;
    }
    if (comp.type === 'custom') continue;
    if (comp.type === 'steelMember' || comp.type === 'steelPlate') continue;

    const r = calcComponentResult(comp, barLengthM);
    if (r) {
      total.concrete280 += r.concrete280;
      total.concrete210 += r.concrete210;
      total.rebarSD280 += r.rebarSD280;
      total.rebarSD420 += r.rebarSD420;
      total.formwork += r.formwork;
      total.trowel += r.trowel;
      total.wireMesh += r.wireMesh;
      total.pcCushion += r.pcCushion;
      total.excavation += r.excavation;
      total.backfill += r.backfill;
    }
  }

  return total;
}

export function buildSummaryLines(
  result: CalcResult,
  components: ComponentData[],
  prices: PriceTable,
  wasteRates: WasteRates
): SummaryLine[] {
  const lines: SummaryLine[] = [];

  const rebarSD280Qty = wasteRates.rebarEnabled
    ? result.rebarSD280 * (1 + wasteRates.rebarRate / 100)
    : result.rebarSD280;
  const rebarSD420Qty = wasteRates.rebarEnabled
    ? result.rebarSD420 * (1 + wasteRates.rebarRate / 100)
    : result.rebarSD420;
  const formworkQty = wasteRates.formworkEnabled
    ? result.formwork * (1 + wasteRates.formworkRate / 100)
    : result.formwork;

  if (result.concrete280 > 0) {
    lines.push({ item: '\u6DF7\u51DD\u571F fc\'=280', unit: 'm³', quantity: result.concrete280, unitPrice: prices.concrete280, amount: result.concrete280 * prices.concrete280 });
  }
  if (result.concrete210 > 0) {
    lines.push({ item: '\u6DF7\u51DD\u571F fc\'=210', unit: 'm³', quantity: result.concrete210, unitPrice: prices.concrete210, amount: result.concrete210 * prices.concrete210 });
  }
  if (rebarSD280Qty > 0) {
    const tons = rebarSD280Qty / 1000;
    lines.push({ item: '\u92FC\u7B4B SD280', unit: '\u5678', quantity: tons, unitPrice: prices.rebarSD280, amount: tons * prices.rebarSD280 });
  }
  if (rebarSD420Qty > 0) {
    const tons = rebarSD420Qty / 1000;
    lines.push({ item: '\u92FC\u7B4B SD420', unit: '\u5678', quantity: tons, unitPrice: prices.rebarSD420, amount: tons * prices.rebarSD420 });
  }
  if (result.wireMesh > 0) {
    const tons = result.wireMesh / 1000;
    lines.push({ item: '\u92FC\u7D72\u7DB2', unit: '\u5678', quantity: tons, unitPrice: prices.wireMesh, amount: tons * prices.wireMesh });
  }
  if (formworkQty > 0) {
    lines.push({ item: '\u6A21\u677F', unit: 'm²', quantity: formworkQty, unitPrice: prices.formwork, amount: formworkQty * prices.formwork });
  }
  if (result.trowel > 0) {
    lines.push({ item: '粉光', unit: 'm²', quantity: result.trowel, unitPrice: prices.trowel, amount: result.trowel * prices.trowel });
  }
  if (result.pcCushion > 0) {
    lines.push({ item: '混凝土 fc\'=140', unit: 'm³', quantity: result.pcCushion, unitPrice: prices.pcCushion, amount: result.pcCushion * prices.pcCushion });
  }
  if (result.excavation > 0) {
    lines.push({ item: '\u958B\u6316', unit: 'm³', quantity: result.excavation, unitPrice: prices.excavation, amount: result.excavation * prices.excavation });
  }
  if (result.backfill > 0) {
    lines.push({ item: '\u56DE\u586B', unit: 'm³', quantity: result.backfill, unitPrice: prices.backfill, amount: result.backfill * prices.backfill });
  }

  // Steel aggregation (group by section, then sum weight + paint area)
  let steelWeight = 0;
  let steelPaintArea = 0;
  let platePaintArea = 0;
  for (const comp of components) {
    if (comp.type === 'steelMember') {
      const d = calcSteelMember(comp as SteelMemberData);
      steelWeight += d.totalWeight;
      steelPaintArea += d.paintArea;
    } else if (comp.type === 'steelPlate') {
      const d = calcSteelPlate(comp as SteelPlateData);
      steelWeight += d.totalWeight;
      platePaintArea += d.paintArea;
    }
  }
  if (steelWeight > 0) {
    const tons = steelWeight / 1000;
    // Use a default steel price (NTD/ton) \u2014 could be made configurable later
    const steelUnitPrice = 32000;
    lines.push({ item: '\u92FC\u69CB\u4EF6', unit: '\u5678', quantity: tons, unitPrice: steelUnitPrice, amount: tons * steelUnitPrice });
  }
  const totalPaint = steelPaintArea + platePaintArea;
  if (totalPaint > 0) {
    // Default paint price NTD/m\u00B2 (avg)
    const paintUnitPrice = 300;
    lines.push({ item: '\u92FC\u69CB\u5857\u88DD', unit: 'm\u00B2', quantity: totalPaint, unitPrice: paintUnitPrice, amount: totalPaint * paintUnitPrice });
  }

  // Custom items
  for (const comp of components) {
    if (comp.type === 'custom') {
      const c = comp as CustomData;
      lines.push({ item: c.label || '\u81EA\u8A02\u9805\u76EE', unit: c.unit, quantity: c.customQuantity, unitPrice: c.unitPrice, amount: c.customQuantity * c.unitPrice });
    }
  }

  return lines;
}
