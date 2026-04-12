import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import { EstimationCase, ComponentData, ColumnData, BeamData, SlabData, WallData, FloorData, FoundationData, EquipFoundData, StairData, OpeningData, ManualRCData, CustomData } from '../data/types';
import { calcColumn } from '../calc/column';
import { calcBeam } from '../calc/beam';
import { calcSlab } from '../calc/slab';
import { calcWall } from '../calc/wall';
import { calcFloor } from '../calc/floor';
import { calcFoundation } from '../calc/foundation';
import { calcEquipFound } from '../calc/equipFound';
import { calcStair } from '../calc/stair';
import { calcOpening } from '../calc/opening';
import { aggregateResults, buildSummaryLines } from '../calc/summary';
import { generateCalcDetailSheet } from './calcDetailSheet';

function addSheet(wb: XLSX.WorkBook, name: string, data: (string | number | null)[][]) {
  const ws = XLSX.utils.aoa_to_sheet(data);
  XLSX.utils.book_append_sheet(wb, ws, name);
}

export async function exportToExcel(caseData: EstimationCase, components: ComponentData[]) {
  const wb = XLSX.utils.book_new();

  // 1. Summary sheet
  const result = aggregateResults(components);
  const lines = buildSummaryLines(result, components, caseData.prices, caseData.wasteRates);
  const summaryData: (string | number | null)[][] = [
    ['\u5F59\u7E3D\u8868', '', '', '', ''],
    ['\u6848\u4EF6', caseData.name, '', '\u65E5\u671F', caseData.date],
    ['\u516C\u53F8', caseData.company, '', '\u76E3\u9020', caseData.supervisor],
    [],
    ['\u9805\u76EE', '\u6578\u91CF', '\u55AE\u4F4D', '\u55AE\u50F9', '\u91D1\u984D'],
  ];
  for (const l of lines) {
    summaryData.push([l.item, l.quantity, l.unit, l.unitPrice, l.amount]);
  }
  const total = lines.reduce((s, l) => s + l.amount, 0);
  summaryData.push([], ['\u5408\u8A08', '', '', '', total]);
  addSheet(wb, '1-\u5F59\u7E3D', summaryData);

  // 2. Columns sheet
  const columns = components.filter((c) => c.type === 'column') as ColumnData[];
  if (columns.length > 0) {
    const colData: (string | number | null)[][] = [
      ['\u67F1', '\u540D\u7A31', 'B(cm)', 'D(cm)', 'H(cm)', '\u6578\u91CF', '\u4E3B\u7B4B', '\u652F\u6578', '\u7B8D\u7B4B', '\u7B8D\u8DDD(cm)', '\u7E6B\u7B4B\u652F\u6578', '\u6DF7\u51DD\u571F(m³)', '\u6A21\u677F(m²)', 'SD280(kg)', 'SD420(kg)'],
    ];
    for (const c of columns) {
      const r = calcColumn(c);
      colData.push([c.label, c.note, c.width, c.depth, c.height, c.quantity, c.mainBar, c.mainBarCount, c.tieBar, c.tieSpacing, c.crosstieCount, r.concrete, r.formwork, r.totalRebarSD280, r.totalRebarSD420]);
    }
    addSheet(wb, '3-\u67F1', colData);
  }

  // 3. Beams sheet
  const beams = components.filter((c) => c.type === 'beam') as BeamData[];
  if (beams.length > 0) {
    const beamData: (string | number | null)[][] = [
      ['\u6A11', '\u540D\u7A31', 'B(cm)', 'D(cm)', 'L(cm)', '\u6578\u91CF', '\u4E0A\u7B4B', '\u4E0A\u652F', '\u4E0B\u7B4B', '\u4E0B\u652F', '\u7B8D\u7B4B', '\u5BC6\u8DDD', '\u758F\u8DDD', '\u6DF7\u51DD\u571F(m³)', '\u6A21\u677F(m²)', 'SD280(kg)', 'SD420(kg)'],
    ];
    for (const b of beams) {
      const r = calcBeam(b);
      beamData.push([b.label, b.note, b.width, b.depth, b.span, b.quantity, b.topBar, b.topBarCount, b.bottomBar, b.bottomBarCount, b.stirrup, b.denseSpacing, b.sparseSpacing, r.concrete, r.formwork, r.totalRebarSD280, r.totalRebarSD420]);
    }
    addSheet(wb, '4-\u6A11', beamData);
  }

  // 4. Slabs sheet
  const slabs = components.filter((c) => c.type === 'slab') as SlabData[];
  if (slabs.length > 0) {
    const slabData: (string | number | null)[][] = [
      ['\u6A13\u677F', '\u540D\u7A31', '\u9577(cm)', '\u5BEC(cm)', '\u539A(cm)', '\u6578\u91CF', '\u914D\u7B4B\u65B9\u5F0F', '\u4E0B\u7B4B', '\u4E0B\u9593\u8DDD', '\u6DF7\u51DD\u571F(m³)', '\u6A21\u677F(m²)', '\u93DD\u5149(m²)', 'SD280(kg)', 'SD420(kg)', '\u92FC\u7D72\u7DB2(kg)'],
    ];
    for (const s of slabs) {
      const r = calcSlab(s);
      slabData.push([s.label, s.note, s.length, s.width, s.thickness, s.quantity, s.reinfType, s.lowerBar, s.lowerSpacing, r.concrete, r.formwork, r.trowel, r.totalRebarSD280, r.totalRebarSD420, r.wireMeshWt]);
    }
    addSheet(wb, '5-\u6A13\u677F', slabData);
  }

  // 5. Walls sheet
  const walls = components.filter((c) => c.type === 'wall') as WallData[];
  if (walls.length > 0) {
    const wallData: (string | number | null)[][] = [
      ['\u7246', '\u540D\u7A31', 'L(cm)', 'H(cm)', 'T(cm)', '\u6578\u91CF', '\u76F4\u7B4B', '\u76F4\u9593\u8DDD', '\u6A6B\u7B4B', '\u6A6B\u9593\u8DDD', '\u6DF7\u51DD\u571F(m³)', '\u6A21\u677F(m²)', 'SD280(kg)', 'SD420(kg)'],
    ];
    for (const w of walls) {
      const r = calcWall(w);
      wallData.push([w.label, w.note, w.wallLength, w.wallHeight, w.thickness, w.quantity, w.vertBar, w.vertSpacing, w.horizBar, w.horizSpacing, r.concrete, r.formwork, r.totalRebarSD280, r.totalRebarSD420]);
    }
    addSheet(wb, '6-\u7246', wallData);
  }

  // 6. Floor sheet
  const floors = components.filter((c) => c.type === 'floor') as FloorData[];
  if (floors.length > 0) {
    const floorData: (string | number | null)[][] = [
      ['\u5730\u576A', '\u540D\u7A31', '\u9577(cm)', '\u5BEC(cm)', '\u539A(cm)', '\u958B\u6316\u6DF1(cm)', 'PC\u539A(cm)', '\u6578\u91CF', '\u6DF7\u51DD\u571F210(m³)', '\u958B\u6316(m³)', 'PC(m³)', '\u56DE\u586B(m³)', '\u93DD\u5149(m²)', 'SD280(kg)', 'SD420(kg)'],
    ];
    for (const f of floors) {
      const r = calcFloor(f);
      floorData.push([f.label, f.note, f.length, f.width, f.thickness, f.excavDepth, f.pcThickness, f.quantity, r.concrete, r.excavation, r.pc, r.backfill, r.trowel, r.totalRebarSD280, r.totalRebarSD420]);
    }
    addSheet(wb, '7-\u5730\u576A', floorData);
  }

  // 7. Foundation sheet
  const founds = components.filter((c) => c.type === 'foundation') as FoundationData[];
  if (founds.length > 0) {
    const foundData: (string | number | null)[][] = [
      ['\u57FA\u790E', '\u540D\u7A31', 'L(cm)', 'B(cm)', 'D(cm)', 'PC\u539A(cm)', '\u5DE5\u4F5C\u5BEC(cm)', '\u6578\u91CF', '\u6DF7\u51DD\u571F(m³)', '\u958B\u6316(m³)', 'PC(m³)', '\u56DE\u586B(m³)', '\u6A21\u677F(m²)', 'SD280(kg)', 'SD420(kg)'],
    ];
    for (const f of founds) {
      const r = calcFoundation(f);
      foundData.push([f.label, f.note, f.foundLength, f.foundWidth, f.foundDepth, f.pcThickness, f.workWidth, f.quantity, r.concrete, r.excavation, r.pc, r.backfill, r.formwork, r.totalRebarSD280, r.totalRebarSD420]);
    }
    addSheet(wb, '8-\u57FA\u790E', foundData);
  }

  // 8. Equipment Foundation
  const equips = components.filter((c) => c.type === 'equipFound') as EquipFoundData[];
  if (equips.length > 0) {
    const equipData: (string | number | null)[][] = [
      ['\u8A2D\u5099\u57FA\u790E', '\u540D\u7A31', '\u985E\u578B', '\u8A2D\u5099\u91CD(kg)', '\u9577(cm)', '\u5BEC(cm)', '\u6DF1 D(cm)', '\u57CB\u5165\u6DF1\u5EA6(cm)', '\u6578\u91CF', '\u6DF7\u51DD\u571F(m³)', '\u6AA2\u6838', '\u958B\u6316(m³)', 'PC(m³)', '\u56DE\u586B(m³)', 'SD420(kg)', '\u92FC\u7D72\u7DB2(kg)', '\u6A21\u677F(m²)', '\u93DD\u5149(m²)'],
    ];
    for (const e of equips) {
      const r = calcEquipFound(e);
      equipData.push([e.label, e.note, e.sizeType, e.equipWeight, e.length, e.width, e.depth, e.burialDepth ?? 0, e.quantity, r.concrete, r.check, r.excavation, r.pc, r.backfill, r.rebarWt, r.wireMeshWt, r.formwork, r.trowel]);
    }
    addSheet(wb, '9-\u8A2D\u5099\u57FA\u790E', equipData);
  }

  // 9. Stairs
  const stairs = components.filter((c) => c.type === 'stair') as StairData[];
  if (stairs.length > 0) {
    const stairData: (string | number | null)[][] = [
      ['\u6A13\u68AF', '\u540D\u7A31', '\u68AF\u5BEC(cm)', '\u968E\u6578', '\u7D1A\u9AD8(cm)', '\u7D1A\u6DF1(cm)', '\u677F\u539A(cm)', '\u6578\u91CF', '\u6DF7\u51DD\u571F(m³)', '\u6A21\u677F(m²)', '\u93DD\u5149(m²)', 'SD280(kg)', 'SD420(kg)'],
    ];
    for (const s of stairs) {
      const r = calcStair(s);
      stairData.push([s.label, s.note, s.stairWidth, s.steps, s.riser, s.tread, s.slabThick, s.quantity, r.concrete, r.formwork, r.trowel, r.totalRebarSD280, r.totalRebarSD420]);
    }
    addSheet(wb, '10-\u6A13\u68AF', stairData);
  }

  // 10. Openings
  const openings = components.filter((c) => c.type === 'opening') as OpeningData[];
  if (openings.length > 0) {
    const openData: (string | number | null)[][] = [
      ['\u958B\u53E3\u6263\u9664', '\u540D\u7A31', '\u69CB\u4EF6', '\u5BEC(cm)', '\u9AD8(cm)', '\u539A(cm)', '\u6578\u91CF', '\u6263\u6DF7\u51DD\u571F(m³)', '\u6263\u6A21\u677F(m²)', '\u88DC\u5F37\u7B4B(kg)'],
    ];
    for (const o of openings) {
      const r = calcOpening(o);
      openData.push([o.label, o.note, o.memberType, o.openWidth, o.openHeight, o.thickness, o.quantity, r.deductConcrete, r.deductFormwork, r.totalReinf]);
    }
    addSheet(wb, '11-\u958B\u53E3', openData);
  }

  // 11. Manual + Custom
  const manuals = components.filter((c) => c.type === 'manualRC') as ManualRCData[];
  const customs = components.filter((c) => c.type === 'custom') as CustomData[];
  if (manuals.length > 0 || customs.length > 0) {
    const otherData: (string | number | null)[][] = [
      ['\u5176\u4ED6\u9805\u76EE'],
    ];
    if (manuals.length > 0) {
      otherData.push(['\u624B\u586B\u9805\u76EE', '\u540D\u7A31', '\u6DF7\u51DD\u571F280', '\u6DF7\u51DD\u571F210', 'SD280', 'SD420', '\u6A21\u677F', '\u93DD\u5149', '\u92FC\u7D72\u7DB2', '混凝土fc\'=140', '\u958B\u6316', '\u56DE\u586B']);
      for (const m of manuals) {
        otherData.push([m.label, m.note, m.concrete280, m.concrete210, m.rebarSD280, m.rebarSD420, m.formwork, m.trowel, m.wireMesh, m.pcCushion, m.excavation, m.backfill]);
      }
    }
    if (customs.length > 0) {
      otherData.push([], ['\u81EA\u8A02\u9805\u76EE', '\u540D\u7A31', '\u55AE\u4F4D', '\u6578\u91CF', '\u55AE\u50F9', '\u91D1\u984D', '\u8AAA\u660E']);
      for (const c of customs) {
        otherData.push([c.label, c.note, c.unit, c.customQuantity, c.unitPrice, c.customQuantity * c.unitPrice, c.description]);
      }
    }
    addSheet(wb, '12-\u5176\u4ED6', otherData);
  }

  // Calculation Detail sheet
  const calcDetailRows = generateCalcDetailSheet(components, caseData);
  if (calcDetailRows.length > 0) {
    addSheet(wb, '計算過程', calcDetailRows);
  }

  // Export
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([buf], { type: 'application/octet-stream' });
  saveAs(blob, `${caseData.name}_\u4F30\u50F9.xlsx`);
}
