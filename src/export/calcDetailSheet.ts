import {
  ComponentData,
  EstimationCase,
  ColumnData,
  BeamData,
  SlabData,
  WallData,
  FloorData,
  FoundationData,
  EquipFoundData,
  StairData,
  OpeningData,
  ManualRCData,
  CustomData,
} from '../data/types';
import { getRebarSpec } from '../data/rebarSpecs';
import { getWireMeshSpec } from '../data/wireMeshSpecs';
import { COMPONENT_TYPE_LABELS, BAR_LENGTH_M } from '../data/defaults';
import { calcColumn } from '../calc/column';
import { calcBeam } from '../calc/beam';
import { calcSlab } from '../calc/slab';
import { calcWall } from '../calc/wall';
import { calcFloor } from '../calc/floor';
import { calcFoundation } from '../calc/foundation';
import { calcEquipFound } from '../calc/equipFound';
import { calcStair } from '../calc/stair';
import { calcOpening } from '../calc/opening';

type Row = (string | number | null)[];

function f2(v: number): string { return v.toFixed(2); }
function f1(v: number): string { return v.toFixed(1); }

function blankRow(): Row { return ['']; }
function separator(): Row { return ['════════════════════════════════']; }

function columnDetail(c: ColumnData, barLengthM: number): Row[] {
  const BAR_LEN = barLengthM;
  const mainSpec = getRebarSpec(c.mainBar);
  const tieSpec = getRebarSpec(c.tieBar);
  const r = calcColumn(c, barLengthM);
  const rows: Row[] = [];

  rows.push([`[構件名稱] ${c.label} (${COMPONENT_TYPE_LABELS.column})`]);
  rows.push([`[尺寸] B=${c.width}cm, D=${c.depth}cm, H=${c.height}cm, 數量=${c.quantity}`]);
  rows.push(blankRow());

  // Concrete
  const W = c.width / 100;
  const D = c.depth / 100;
  const H = c.height / 100;
  rows.push([`[混凝土 fc'=280]`]);
  rows.push([`= (B/100) × (D/100) × (H/100) × 數量`]);
  rows.push([`= (${c.width}/100) × (${c.depth}/100) × (${c.height}/100) × ${c.quantity}`]);
  rows.push([`= ${f2(W)} × ${f2(D)} × ${f2(H)} × ${c.quantity}`]);
  rows.push([`= ${f2(r.concrete)} m³`]);
  rows.push(blankRow());

  // Main bar
  if (mainSpec) {
    const mainBarLength = H + mainSpec.lap40D / 100;
    rows.push([`[主筋 ${c.mainBar} ×${c.mainBarCount}根 ${mainSpec.grade}]`]);
    rows.push([`單位重 = ${mainSpec.kgPerM} kg/m`]);
    rows.push([`搭接長度 40D = ${mainSpec.lap40D} cm`]);
    rows.push([`單根長度 = H/100 + 搭接40D/100 = ${c.height}/100 + ${mainSpec.lap40D}/100 = ${f2(mainBarLength).replace(/^0/, '')} m`]);
    const mainWt = mainSpec.kgPerM * mainBarLength * c.mainBarCount * c.quantity;
    rows.push([`= ${mainSpec.kgPerM} × ${f2(mainBarLength).replace(/^0/, '')} × ${c.mainBarCount} × ${c.quantity} = ${f1(mainWt)} kg`]);
    rows.push(blankRow());
  }

  // Tie bar
  if (tieSpec) {
    const tiePerimeter = 2 * ((W + D) - 0.08) + 2 * (tieSpec.hook12D / 100);
    const tieCount = Math.floor(c.height / c.tieSpacing) + 1;
    rows.push([`[箍筋 ${c.tieBar} @${c.tieSpacing}cm ${tieSpec.grade}]`]);
    rows.push([`單位重 = ${tieSpec.kgPerM} kg/m`]);
    rows.push([`彎鉤長度 12D = ${tieSpec.hook12D} cm`]);
    rows.push([`周長 = 2×((B+D)/100 - 0.08) + 2×(彎鉤12D/100)`]);
    rows.push([`     = 2×((${c.width}+${c.depth})/100 - 0.08) + 2×(${tieSpec.hook12D}/100)`]);
    rows.push([`     = 2×${f2((W + D) - 0.08)} + 2×${f2(tieSpec.hook12D / 100)} = ${f2(tiePerimeter).replace(/^0/, '')} m`]);
    rows.push([`組數 = H/間距 + 1 = ${c.height}/${c.tieSpacing} + 1 = ${f2(c.height / c.tieSpacing + 1)} → ${tieCount} 組`]);
    const tieWt = tieSpec.kgPerM * tiePerimeter * tieCount * c.quantity;
    rows.push([`= ${tieSpec.kgPerM} × ${f2(tiePerimeter).replace(/^0/, '')} × ${tieCount} × ${c.quantity} = ${f1(tieWt)} kg`]);
    rows.push(blankRow());

    // Crosstie
    if (c.crosstieCount > 0) {
      const crosstieLength = Math.max(c.width, c.depth) / 100 - 0.08 + 2 * (tieSpec.hook12D / 100);
      const crosstieWt = tieSpec.kgPerM * crosstieLength * c.crosstieCount * tieCount * c.quantity;
      rows.push([`[繫筋 ${c.tieBar} ×${c.crosstieCount} ${tieSpec.grade}]`]);
      rows.push([`單根長度 = max(B,D)/100 - 0.08 + 2×(彎鉤12D/100) = ${f2(crosstieLength)} m`]);
      rows.push([`= ${tieSpec.kgPerM} × ${f2(crosstieLength)} × ${c.crosstieCount} × ${tieCount} × ${c.quantity} = ${f1(crosstieWt)} kg`]);
      rows.push(blankRow());
    }
  }

  // Splice
  if (mainSpec) {
    const mainBarLength = H + mainSpec.lap40D / 100;
    const splicePerBar = Math.max(0, Math.ceil(mainBarLength / BAR_LEN) - 1);
    const totalSplices = splicePerBar * c.mainBarCount * c.quantity;
    rows.push([`[搭接統計]`]);
    rows.push([`主筋單根長 = ${f2(mainBarLength).replace(/^0/, '')} m, 標準料長 = ${BAR_LEN} m`]);
    rows.push([`段數 = ceil(${f2(mainBarLength).replace(/^0/, '')}/${BAR_LEN}) = ${Math.ceil(mainBarLength / BAR_LEN)}, 搭接次數 = ${Math.ceil(mainBarLength / BAR_LEN)}-1 = ${splicePerBar} 次/根`]);
    rows.push([`搭接總次數 = ${splicePerBar} × ${c.mainBarCount}根 × ${c.quantity} = ${totalSplices} 次`]);
    rows.push([`搭接總長度 = ${totalSplices} × ${mainSpec.lap40D}/100 = ${f2(totalSplices * mainSpec.lap40D / 100)} m`]);
    rows.push(blankRow());
  }

  // SD classification
  rows.push([`[SD 分類]`]);
  if (r.totalRebarSD280 > 0) rows.push([`SD280 = ${f1(r.totalRebarSD280)} kg`]);
  if (r.totalRebarSD420 > 0) rows.push([`SD420 = ${f1(r.totalRebarSD420)} kg`]);
  rows.push(blankRow());

  // Formwork
  rows.push([`[模板]`]);
  rows.push([`= 2×(B+D)/100 × (H/100) × 數量`]);
  rows.push([`= 2×(${c.width}+${c.depth})/100 × (${c.height}/100) × ${c.quantity}`]);
  rows.push([`= ${f2(2 * (W + D))} × ${f2(H)} × ${c.quantity} = ${f2(r.formwork)} m²`]);

  rows.push(separator());
  return rows;
}

function beamDetail(b: BeamData, barLengthM: number): Row[] {
  const BAR_LEN = barLengthM;
  const topSpec = getRebarSpec(b.topBar);
  const botSpec = getRebarSpec(b.bottomBar);
  const stirSpec = getRebarSpec(b.stirrup);
  const r = calcBeam(b, barLengthM);
  const rows: Row[] = [];

  rows.push([`[構件名稱] ${b.label} (${COMPONENT_TYPE_LABELS.beam})`]);
  rows.push([`[尺寸] B=${b.width}cm, D=${b.depth}cm, L=${b.span}cm, 數量=${b.quantity}`]);
  rows.push(blankRow());

  const W = b.width / 100;
  const D = b.depth / 100;
  const L = b.span / 100;

  // Concrete
  rows.push([`[混凝土 fc'=280]`]);
  rows.push([`= (B/100) × (D/100) × (L/100) × 數量`]);
  rows.push([`= ${f2(W)} × ${f2(D)} × ${f2(L)} × ${b.quantity}`]);
  rows.push([`= ${f2(r.concrete)} m³`]);
  rows.push(blankRow());

  // Top bar
  if (topSpec) {
    const topBarLen = L + 2 * (topSpec.lap40D / 100);
    rows.push([`[上層筋 ${b.topBar} ×${b.topBarCount}根 ${topSpec.grade}]`]);
    rows.push([`單位重 = ${topSpec.kgPerM} kg/m`]);
    rows.push([`單根長度 = L/100 + 2×搭接40D/100 = ${f2(L)} + 2×${f2(topSpec.lap40D / 100)} = ${f2(topBarLen)} m`]);
    rows.push([`= ${topSpec.kgPerM} × ${f2(topBarLen)} × ${b.topBarCount} × ${b.quantity} = ${f1(r.topBarWt)} kg`]);
    rows.push(blankRow());
  }

  // Bottom bar
  if (botSpec) {
    const botBarLen = L + 2 * (botSpec.lap40D / 100);
    rows.push([`[下層筋 ${b.bottomBar} ×${b.bottomBarCount}根 ${botSpec.grade}]`]);
    rows.push([`單位重 = ${botSpec.kgPerM} kg/m`]);
    rows.push([`單根長度 = L/100 + 2×搭接40D/100 = ${f2(L)} + 2×${f2(botSpec.lap40D / 100)} = ${f2(botBarLen)} m`]);
    rows.push([`= ${botSpec.kgPerM} × ${f2(botBarLen)} × ${b.bottomBarCount} × ${b.quantity} = ${f1(r.bottomBarWt)} kg`]);
    rows.push(blankRow());
  }

  // Stirrup
  if (stirSpec) {
    const stirPerimeter = 2 * ((W + D) - 0.08) + 2 * (stirSpec.hook12D / 100);
    const stirrupCount = (b.span * 0.4 / b.denseSpacing) + (b.span * 0.6 / b.sparseSpacing) + 2;
    rows.push([`[箍筋 ${b.stirrup} @密${b.denseSpacing}/疏${b.sparseSpacing}cm ${stirSpec.grade}]`]);
    rows.push([`單位重 = ${stirSpec.kgPerM} kg/m`]);
    rows.push([`周長 = 2×((B+D)/100 - 0.08) + 2×(彎鉤12D/100) = ${f2(stirPerimeter)} m`]);
    rows.push([`組數 = L×0.4/密距 + L×0.6/疏距 + 2 = ${b.span}×0.4/${b.denseSpacing} + ${b.span}×0.6/${b.sparseSpacing} + 2 = ${f1(stirrupCount)} 組`]);
    rows.push([`= ${stirSpec.kgPerM} × ${f2(stirPerimeter)} × ${f1(stirrupCount)} × ${b.quantity} = ${f1(r.stirrupWt)} kg`]);
    rows.push(blankRow());
  }

  // Splice
  rows.push([`[搭接統計]`]);
  rows.push([`搭接總次數 = ${r.spliceCount} 次, 搭接總長度 = ${f2(r.spliceLength)} m`]);
  rows.push(blankRow());

  // SD classification
  rows.push([`[SD 分類]`]);
  if (r.totalRebarSD280 > 0) rows.push([`SD280 = ${f1(r.totalRebarSD280)} kg`]);
  if (r.totalRebarSD420 > 0) rows.push([`SD420 = ${f1(r.totalRebarSD420)} kg`]);
  rows.push(blankRow());

  // Formwork
  rows.push([`[模板]`]);
  rows.push([`= (2D+B)/100 × (L/100) × 數量`]);
  rows.push([`= (2×${f2(D)}+${f2(W)}) × ${f2(L)} × ${b.quantity}`]);
  rows.push([`= ${f2(2 * D + W)} × ${f2(L)} × ${b.quantity} = ${f2(r.formwork)} m²`]);

  rows.push(separator());
  return rows;
}

function slabDetail(s: SlabData, barLengthM: number): Row[] {
  const r = calcSlab(s, barLengthM);
  const rows: Row[] = [];

  rows.push([`[構件名稱] ${s.label} (${COMPONENT_TYPE_LABELS.slab})`]);
  rows.push([`[尺寸] 長=${s.length}cm, 寬=${s.width}cm, 厚=${s.thickness}cm, 保護層=${s.cover}cm, 數量=${s.quantity}`]);
  rows.push(blankRow());

  const area = (s.length / 100) * (s.width / 100);

  // Concrete
  rows.push([`[混凝土 fc'=280]`]);
  rows.push([`面積 = ${s.length}/100 × ${s.width}/100 = ${f2(area)} m²`]);
  rows.push([`= ${f2(area)} × ${s.thickness}/100 × ${s.quantity} = ${f2(r.concrete)} m³`]);
  rows.push(blankRow());

  if (s.reinfType === 'rebar') {
    const cover = (s.cover || 4) / 100;
    const effL = s.length / 100 - 2 * cover;
    const effW = s.width / 100 - 2 * cover;

    if (s.layers === 2) {
      const upperSpec = getRebarSpec(s.upperBar);
      if (upperSpec) {
        const sp = s.upperSpacing / 100;
        const xCount = Math.floor(effW / sp) + 1;
        const yCount = Math.floor(effL / sp) + 1;
        rows.push([`[上層筋 ${s.upperBar} @${s.upperSpacing}cm ${upperSpec.grade}]`]);
        rows.push([`有效長 = ${f2(effL)} m, 有效寬 = ${f2(effW)} m`]);
        rows.push([`X向${xCount}根 × ${f2(effL)}m + Y向${yCount}根 × ${f2(effW)}m, ×1.15係數`]);
        rows.push([`= ${upperSpec.kgPerM} × (${f2(effL)}×${xCount} + ${f2(effW)}×${yCount}) × 1.15 × ${s.quantity} = ${f1(r.upperBarWt)} kg`]);
        rows.push(blankRow());
      }
    }

    const lowerSpec = getRebarSpec(s.lowerBar);
    if (lowerSpec) {
      const sp = s.lowerSpacing / 100;
      const xCount = Math.floor(effW / sp) + 1;
      const yCount = Math.floor(effL / sp) + 1;
      rows.push([`[下層筋 ${s.lowerBar} @${s.lowerSpacing}cm ${lowerSpec.grade}]`]);
      rows.push([`有效長 = ${f2(effL)} m, 有效寬 = ${f2(effW)} m`]);
      rows.push([`X向${xCount}根 × ${f2(effL)}m + Y向${yCount}根 × ${f2(effW)}m, ×1.15係數`]);
      rows.push([`= ${lowerSpec.kgPerM} × (${f2(effL)}×${xCount} + ${f2(effW)}×${yCount}) × 1.15 × ${s.quantity} = ${f1(r.lowerBarWt)} kg`]);
      rows.push(blankRow());
    }

    if (r.spliceCount > 0) {
      rows.push([`[搭接統計]`]);
      rows.push([`搭接總次數 = ${r.spliceCount} 次, 搭接總長度 = ${f2(r.spliceLength)} m`]);
      rows.push(blankRow());
    }
  } else {
    const meshSpec = getWireMeshSpec(s.wireMesh);
    if (meshSpec) {
      rows.push([`[鋼絲網 ${s.wireMesh}]`]);
      rows.push([`= ${meshSpec.kgPerM2} kg/m² × ${f2(area)} m² × ${s.quantity} = ${f1(r.wireMeshWt)} kg`]);
      rows.push(blankRow());
    }
  }

  // SD classification
  rows.push([`[SD 分類]`]);
  if (r.totalRebarSD280 > 0) rows.push([`SD280 = ${f1(r.totalRebarSD280)} kg`]);
  if (r.totalRebarSD420 > 0) rows.push([`SD420 = ${f1(r.totalRebarSD420)} kg`]);
  rows.push(blankRow());

  // Formwork
  rows.push([`[模板]`]);
  rows.push([`= 面積 × 數量 = ${f2(area)} × ${s.quantity} = ${f2(r.formwork)} m²`]);
  rows.push(blankRow());

  // Trowel
  rows.push([`[粉光]`]);
  rows.push([`= 面積 × 數量 = ${f2(area)} × ${s.quantity} = ${f2(r.trowel)} m²`]);

  rows.push(separator());
  return rows;
}

function wallDetail(w: WallData, barLengthM: number): Row[] {
  const r = calcWall(w, barLengthM);
  const rows: Row[] = [];

  rows.push([`[構件名稱] ${w.label} (${COMPONENT_TYPE_LABELS.wall})`]);
  rows.push([`[尺寸] L=${w.wallLength}cm, H=${w.wallHeight}cm, T=${w.thickness}cm, 保護層=${w.cover}cm, 數量=${w.quantity}`]);
  rows.push(blankRow());

  const L = w.wallLength / 100;
  const H = w.wallHeight / 100;
  const T = w.thickness / 100;

  // Concrete
  rows.push([`[混凝土 fc'=280]`]);
  rows.push([`= L/100 × H/100 × T/100 × 數量`]);
  rows.push([`= ${f2(L)} × ${f2(H)} × ${f2(T)} × ${w.quantity} = ${f2(r.concrete)} m³`]);
  rows.push(blankRow());

  const vertSpec = getRebarSpec(w.vertBar);
  const horizSpec = getRebarSpec(w.horizBar);
  const cover = (w.cover || 4) / 100;
  const effL = L - 2 * cover;
  const effH = H - 2 * cover;

  // Vertical bars
  if (vertSpec && w.vertSpacing > 0 && effL > 0 && effH > 0) {
    const vertCount = Math.floor(effL / (w.vertSpacing / 100)) + 1;
    rows.push([`[豎筋 ${w.vertBar} @${w.vertSpacing}cm ${vertSpec.grade}]`]);
    rows.push([`有效長 = ${f2(effL)} m, 有效高 = ${f2(effH)} m`]);
    rows.push([`根數 = floor(${f2(effL)}/${f2(w.vertSpacing / 100)}) + 1 = ${vertCount}`]);
    rows.push([`= ${vertSpec.kgPerM} × ${f2(effH)} × ${vertCount} × 2面 × 1.15 × ${w.quantity} = ${f1(r.vertBarWt)} kg`]);
    rows.push(blankRow());
  }

  // Horizontal bars
  if (horizSpec && w.horizSpacing > 0 && effL > 0 && effH > 0) {
    const horizCount = Math.floor(effH / (w.horizSpacing / 100)) + 1;
    rows.push([`[橫筋 ${w.horizBar} @${w.horizSpacing}cm ${horizSpec.grade}]`]);
    rows.push([`根數 = floor(${f2(effH)}/${f2(w.horizSpacing / 100)}) + 1 = ${horizCount}`]);
    rows.push([`= ${horizSpec.kgPerM} × ${f2(effL)} × ${horizCount} × 2面 × 1.15 × ${w.quantity} = ${f1(r.horizBarWt)} kg`]);
    rows.push(blankRow());
  }

  if (r.spliceCount > 0) {
    rows.push([`[搭接統計]`]);
    rows.push([`搭接總次數 = ${r.spliceCount} 次, 搭接總長度 = ${f2(r.spliceLength)} m`]);
    rows.push(blankRow());
  }

  // SD classification
  rows.push([`[SD 分類]`]);
  if (r.totalRebarSD280 > 0) rows.push([`SD280 = ${f1(r.totalRebarSD280)} kg`]);
  if (r.totalRebarSD420 > 0) rows.push([`SD420 = ${f1(r.totalRebarSD420)} kg`]);
  rows.push(blankRow());

  // Formwork
  rows.push([`[模板]`]);
  rows.push([`= 2 × L/100 × H/100 × 數量 = 2 × ${f2(L)} × ${f2(H)} × ${w.quantity} = ${f2(r.formwork)} m²`]);

  rows.push(separator());
  return rows;
}

function floorDetail(f: FloorData, barLengthM: number): Row[] {
  const r = calcFloor(f, barLengthM);
  const rows: Row[] = [];

  rows.push([`[構件名稱] ${f.label} (${COMPONENT_TYPE_LABELS.floor})`]);
  rows.push([`[尺寸] 長=${f.length}cm, 寬=${f.width}cm, 厚=${f.thickness}cm, 開挖深=${f.excavDepth}cm, PC厚=${f.pcThickness}cm, 數量=${f.quantity}`]);
  rows.push(blankRow());

  const area = (f.length / 100) * (f.width / 100);
  const slope = f.slopeRatio ?? 0.5;
  const H_excav = f.excavDepth / 100;
  const bottomL = f.length / 100;
  const bottomW = f.width / 100;
  const topL = bottomL + 2 * H_excav * slope;
  const topW = bottomW + 2 * H_excav * slope;

  // Excavation
  rows.push([`[開挖] (梯形體公式, 坡比=${slope})`]);
  rows.push([`底面 = ${f2(bottomL)} × ${f2(bottomW)} m`]);
  rows.push([`頂面 = ${f2(topL)} × ${f2(topW)} m`]);
  rows.push([`= ${f2(r.excavation)} m³`]);
  rows.push(blankRow());

  // PC
  rows.push([`[混凝土 fc'=140 (PC)]`]);
  rows.push([`= 面積 × PC厚/100 × 數量 = ${f2(area)} × ${f.pcThickness}/100 × ${f.quantity} = ${f2(r.pc)} m³`]);
  rows.push(blankRow());

  // Concrete
  rows.push([`[混凝土 fc'=210]`]);
  rows.push([`= 面積 × 厚/100 × 數量 = ${f2(area)} × ${f.thickness}/100 × ${f.quantity} = ${f2(r.concrete)} m³`]);
  rows.push(blankRow());

  // Backfill
  rows.push([`[回填]`]);
  rows.push([`= 開挖 - PC - 混凝土 = ${f2(r.excavation)} - ${f2(r.pc)} - ${f2(r.concrete)} = ${f2(r.backfill)} m³`]);
  rows.push(blankRow());

  // Reinforcement
  if (f.reinfType === 'rebar') {
    const cover = (f.cover || 4) / 100;
    const effL = f.length / 100 - 2 * cover;
    const effW = f.width / 100 - 2 * cover;

    if (f.layers === 2) {
      const upperSpec = getRebarSpec(f.upperBar);
      if (upperSpec) {
        const sp = f.upperSpacing / 100;
        const xCount = Math.floor(effW / sp) + 1;
        const yCount = Math.floor(effL / sp) + 1;
        rows.push([`[上層筋 ${f.upperBar} @${f.upperSpacing}cm ${upperSpec.grade}]`]);
        rows.push([`有效長 = ${f2(effL)} m, 有效寬 = ${f2(effW)} m`]);
        rows.push([`X向${xCount}根 × ${f2(effL)}m + Y向${yCount}根 × ${f2(effW)}m, ×1.15係數`]);
        rows.push([`= ${f1(r.upperBarWt)} kg`]);
        rows.push(blankRow());
      }
    }

    const lowerSpec = getRebarSpec(f.lowerBar);
    if (lowerSpec) {
      const sp = f.lowerSpacing / 100;
      const xCount = Math.floor(effW / sp) + 1;
      const yCount = Math.floor(effL / sp) + 1;
      rows.push([`[下層筋 ${f.lowerBar} @${f.lowerSpacing}cm ${lowerSpec.grade}]`]);
      rows.push([`有效長 = ${f2(effL)} m, 有效寬 = ${f2(effW)} m`]);
      rows.push([`X向${xCount}根 × ${f2(effL)}m + Y向${yCount}根 × ${f2(effW)}m, ×1.15係數`]);
      rows.push([`= ${f1(r.lowerBarWt)} kg`]);
      rows.push(blankRow());
    }

    if (r.spliceCount > 0) {
      rows.push([`[搭接統計]`]);
      rows.push([`搭接總次數 = ${r.spliceCount} 次, 搭接總長度 = ${f2(r.spliceLength)} m`]);
      rows.push(blankRow());
    }
  } else {
    const meshSpec = getWireMeshSpec(f.wireMesh);
    if (meshSpec) {
      rows.push([`[鋼絲網 ${f.wireMesh}]`]);
      rows.push([`= ${meshSpec.kgPerM2} kg/m² × ${f2(area)} m² × ${f.quantity} = ${f1(r.wireMeshWt)} kg`]);
      rows.push(blankRow());
    }
  }

  // SD classification
  rows.push([`[SD 分類]`]);
  if (r.totalRebarSD280 > 0) rows.push([`SD280 = ${f1(r.totalRebarSD280)} kg`]);
  if (r.totalRebarSD420 > 0) rows.push([`SD420 = ${f1(r.totalRebarSD420)} kg`]);
  rows.push(blankRow());

  // Trowel
  rows.push([`[粉光]`]);
  rows.push([`= 面積 × 數量 = ${f2(area)} × ${f.quantity} = ${f2(r.trowel)} m²`]);

  rows.push(separator());
  return rows;
}

function foundationDetail(fd: FoundationData, barLengthM: number): Row[] {
  const r = calcFoundation(fd, barLengthM);
  const rows: Row[] = [];

  rows.push([`[構件名稱] ${fd.label} (${COMPONENT_TYPE_LABELS.foundation})`]);
  rows.push([`[尺寸] L=${fd.foundLength}cm, B=${fd.foundWidth}cm, D=${fd.foundDepth}cm, PC厚=${fd.pcThickness}cm, 工作寬=${fd.workWidth}cm, 埋入深=${fd.burialDepth}cm, 數量=${fd.quantity}`]);
  rows.push(blankRow());

  const FL = fd.foundLength / 100;
  const FW = fd.foundWidth / 100;
  const FD = fd.foundDepth / 100;
  const PC = fd.pcThickness / 100;
  const WW = fd.workWidth / 100;
  const slope = fd.slopeRatio ?? 0.5;
  const burialDepthCm = (fd.burialDepth ?? 0) === 0 ? fd.foundDepth : fd.burialDepth;
  const H_excav = burialDepthCm / 100 + PC;

  const bottomL = FL + 2 * WW;
  const bottomW = FW + 2 * WW;
  const topL = bottomL + 2 * H_excav * slope;
  const topW = bottomW + 2 * H_excav * slope;

  // Excavation
  rows.push([`[開挖] (梯形體公式, 坡比=${slope})`]);
  rows.push([`開挖深 = 埋入深/100 + PC/100 = ${burialDepthCm}/100 + ${fd.pcThickness}/100 = ${f2(H_excav)} m`]);
  rows.push([`底面 = (${f2(FL)}+2×${f2(WW)}) × (${f2(FW)}+2×${f2(WW)}) = ${f2(bottomL)} × ${f2(bottomW)}`]);
  rows.push([`頂面 = ${f2(topL)} × ${f2(topW)}`]);
  rows.push([`= ${f2(r.excavation)} m³`]);
  rows.push(blankRow());

  // PC
  rows.push([`[混凝土 fc'=140 (PC)]`]);
  rows.push([`= ${f2(bottomL)} × ${f2(bottomW)} × ${f2(PC)} × ${fd.quantity} = ${f2(r.pc)} m³`]);
  rows.push(blankRow());

  // Concrete
  rows.push([`[混凝土 fc'=280]`]);
  rows.push([`= ${f2(FL)} × ${f2(FW)} × ${f2(FD)} × ${fd.quantity} = ${f2(r.concrete)} m³`]);
  rows.push(blankRow());

  // Backfill
  rows.push([`[回填]`]);
  rows.push([`= 開挖 - PC - 混凝土 = ${f2(r.excavation)} - ${f2(r.pc)} - ${f2(r.concrete)} = ${f2(r.backfill)} m³`]);
  rows.push(blankRow());

  // Rebar
  const barSpec = getRebarSpec(fd.bottomBar);
  if (barSpec && fd.barSpacing > 0) {
    rows.push([`[底筋 ${fd.bottomBar} @${fd.barSpacing}cm ${barSpec.grade}]`]);
    rows.push([`= ${barSpec.kgPerM} × ((${f2(FL)}/${f2(fd.barSpacing / 100)})×${f2(FW)} + (${f2(FW)}/${f2(fd.barSpacing / 100)})×${f2(FL)}) × 1.2 × ${fd.quantity}`]);
    rows.push([`= ${f1(r.rebarWt)} kg`]);
    rows.push(blankRow());
  }

  if (r.spliceCount > 0) {
    rows.push([`[搭接統計]`]);
    rows.push([`搭接總次數 = ${r.spliceCount} 次, 搭接總長度 = ${f2(r.spliceLength)} m`]);
    rows.push(blankRow());
  }

  // SD classification
  rows.push([`[SD 分類]`]);
  if (r.totalRebarSD280 > 0) rows.push([`SD280 = ${f1(r.totalRebarSD280)} kg`]);
  if (r.totalRebarSD420 > 0) rows.push([`SD420 = ${f1(r.totalRebarSD420)} kg`]);
  rows.push(blankRow());

  // Formwork
  rows.push([`[模板]`]);
  rows.push([`= 2×(L+B)/100 × D/100 × 數量 = 2×(${f2(FL)}+${f2(FW)}) × ${f2(FD)} × ${fd.quantity} = ${f2(r.formwork)} m²`]);

  rows.push(separator());
  return rows;
}

function equipFoundDetail(e: EquipFoundData): Row[] {
  const r = calcEquipFound(e);
  const rows: Row[] = [];

  rows.push([`[構件名稱] ${e.label} (${COMPONENT_TYPE_LABELS.equipFound})`]);
  rows.push([`[尺寸] 長=${e.length}cm, 寬=${e.width}cm, 深=${e.depth}cm, 類型=${e.sizeType}, 設備重=${e.equipWeight}kg, 數量=${e.quantity}`]);
  rows.push(blankRow());

  const L = e.length / 100;
  const W = e.width / 100;
  const D = e.depth / 100;
  const WW = e.workWidth / 100;
  const PC = e.pcThickness / 100;
  const slope = e.slopeRatio ?? 0.5;
  let burialDepthCm = e.burialDepth ?? 0;
  if (burialDepthCm === 0) {
    burialDepthCm = e.sizeType === 'large' ? e.depth * 0.5 : e.depth;
  }
  const BD = burialDepthCm / 100;
  const H_excav = BD + PC;
  const bottomL = L + 2 * WW;
  const bottomW = W + 2 * WW;
  const topL = bottomL + 2 * H_excav * slope;
  const topW = bottomW + 2 * H_excav * slope;

  // Excavation
  rows.push([`[開挖] (梯形體公式, 坡比=${slope})`]);
  rows.push([`埋入深 = ${burialDepthCm}cm, 開挖深 = ${f2(H_excav)} m`]);
  rows.push([`底面 = ${f2(bottomL)} × ${f2(bottomW)}, 頂面 = ${f2(topL)} × ${f2(topW)}`]);
  rows.push([`= ${f2(r.excavation)} m³`]);
  rows.push(blankRow());

  // PC
  rows.push([`[混凝土 fc'=140 (PC)]`]);
  rows.push([`= ${f2(bottomL)} × ${f2(bottomW)} × ${f2(PC)} × ${e.quantity} = ${f2(r.pc)} m³`]);
  rows.push(blankRow());

  // Concrete
  rows.push([`[混凝土 fc'=280]`]);
  rows.push([`= ${f2(L)} × ${f2(W)} × ${f2(D)} × ${e.quantity} = ${f2(r.concrete)} m³`]);
  rows.push(blankRow());

  // Weight check
  const multiplier = e.sizeType === 'large' ? 5 : 3;
  rows.push([`[重量檢核]`]);
  rows.push([`基礎重 = ${f2(r.concrete)} × 2400 = ${f1(r.foundWeight)} kg`]);
  rows.push([`需求重 = ${e.equipWeight} × ${multiplier} = ${f1(r.requiredWeight)} kg`]);
  rows.push([`結果: ${r.check}`]);
  rows.push(blankRow());

  // Rebar
  rows.push([`[鋼筋 (經驗值 80kg/m³) SD420]`]);
  rows.push([`= ${f2(r.concrete)} × 80 = ${f1(r.rebarWt)} kg`]);
  rows.push(blankRow());

  // Wire mesh
  const surfaceArea = L * W + 2 * L * D + 2 * W * D;
  rows.push([`[鋼絲網]`]);
  rows.push([`表面積 = ${f2(L)}×${f2(W)} + 2×${f2(L)}×${f2(D)} + 2×${f2(W)}×${f2(D)} = ${f2(surfaceArea)} m²`]);
  rows.push([`= 1.65 × ${f2(surfaceArea)} × ${e.quantity} = ${f1(r.wireMeshWt)} kg`]);
  rows.push(blankRow());

  // Backfill
  const undergroundConcrete = L * W * Math.min(BD, D) * e.quantity;
  rows.push([`[回填]`]);
  rows.push([`= 開挖 - PC - 地下部混凝土 = ${f2(r.excavation)} - ${f2(r.pc)} - ${f2(undergroundConcrete)} = ${f2(r.backfill)} m³`]);
  rows.push(blankRow());

  // Formwork
  rows.push([`[模板]`]);
  rows.push([`= 2×(${f2(L)}+${f2(W)}) × ${f2(D)} × ${e.quantity} = ${f2(r.formwork)} m²`]);
  rows.push(blankRow());

  // Trowel
  rows.push([`[粉光]`]);
  rows.push([`= ${f2(L)} × ${f2(W)} × ${e.quantity} = ${f2(r.trowel)} m²`]);
  rows.push(blankRow());

  // SD classification
  rows.push([`[SD 分類]`]);
  rows.push([`SD420 = ${f1(r.rebarWt)} kg`]);

  rows.push(separator());
  return rows;
}

function stairDetail(s: StairData, barLengthM: number): Row[] {
  const r = calcStair(s, barLengthM);
  const rows: Row[] = [];

  rows.push([`[構件名稱] ${s.label} (${COMPONENT_TYPE_LABELS.stair})`]);
  rows.push([`[尺寸] 梯寬=${s.stairWidth}cm, 階數=${s.steps}, 級高=${s.riser}cm, 級深=${s.tread}cm, 板厚=${s.slabThick}cm, 數量=${s.quantity}`]);
  rows.push(blankRow());

  const SW = s.stairWidth / 100;
  const R = s.riser / 100;
  const T = s.tread / 100;
  const SL = s.slabThick / 100;
  const totalRise = s.steps * R;
  const totalRun = s.steps * T;

  // Diagonal
  rows.push([`[斜長]`]);
  rows.push([`總升 = ${s.steps} × ${s.riser}/100 = ${f2(totalRise)} m`]);
  rows.push([`總跑 = ${s.steps} × ${s.tread}/100 = ${f2(totalRun)} m`]);
  rows.push([`斜長 = √(${f2(totalRise)}² + ${f2(totalRun)}²) = ${f2(r.diagonalLength)} m`]);
  rows.push(blankRow());

  // Concrete
  rows.push([`[混凝土 fc'=280]`]);
  rows.push([`= (斜長×梯寬×板厚 + 階數×級高×級深×梯寬/2) × 數量`]);
  rows.push([`= (${f2(r.diagonalLength)}×${f2(SW)}×${f2(SL)} + ${s.steps}×${f2(R)}×${f2(T)}×${f2(SW)}/2) × ${s.quantity}`]);
  rows.push([`= ${f2(r.concrete)} m³`]);
  rows.push(blankRow());

  // Main bar
  const mainSpec = getRebarSpec(s.mainBar);
  if (mainSpec) {
    const mainLen = r.diagonalLength + 2 * (mainSpec.lap40D / 100);
    const barCount = s.stairWidth / s.barSpacing;
    rows.push([`[主筋 ${s.mainBar} @${s.barSpacing}cm ${mainSpec.grade}]`]);
    rows.push([`單根長 = 斜長 + 2×搭接40D/100 = ${f2(r.diagonalLength)} + 2×${f2(mainSpec.lap40D / 100)} = ${f2(mainLen)} m`]);
    rows.push([`根數 = 梯寬/間距 = ${s.stairWidth}/${s.barSpacing} = ${f1(barCount)}`]);
    rows.push([`= ${mainSpec.kgPerM} × ${f2(mainLen)} × ${f1(barCount)} × ${s.quantity} = ${f1(r.mainBarWt)} kg`]);
    rows.push(blankRow());
  }

  // Distribution bar
  rows.push([`[分佈筋 #3 (D10) @20cm SD280]`]);
  rows.push([`= 0.56/0.2 × ${f2(r.diagonalLength)} × ${f2(SW)} × ${s.quantity} = ${f1(r.distBarWt)} kg`]);
  rows.push(blankRow());

  if (r.spliceCount > 0) {
    rows.push([`[搭接統計]`]);
    rows.push([`搭接總次數 = ${r.spliceCount} 次, 搭接總長度 = ${f2(r.spliceLength)} m`]);
    rows.push(blankRow());
  }

  // SD classification
  rows.push([`[SD 分類]`]);
  if (r.totalRebarSD280 > 0) rows.push([`SD280 = ${f1(r.totalRebarSD280)} kg`]);
  if (r.totalRebarSD420 > 0) rows.push([`SD420 = ${f1(r.totalRebarSD420)} kg`]);
  rows.push(blankRow());

  // Formwork
  rows.push([`[模板]`]);
  rows.push([`= 斜長 × 梯寬 × 數量 = ${f2(r.diagonalLength)} × ${f2(SW)} × ${s.quantity} = ${f2(r.formwork)} m²`]);
  rows.push(blankRow());

  // Trowel
  rows.push([`[粉光]`]);
  rows.push([`= 階數 × (級深+級高) × 梯寬 × 數量 = ${s.steps} × (${f2(T)}+${f2(R)}) × ${f2(SW)} × ${s.quantity} = ${f2(r.trowel)} m²`]);

  rows.push(separator());
  return rows;
}

function openingDetail(o: OpeningData, barLengthM: number): Row[] {
  const r = calcOpening(o, barLengthM);
  const rows: Row[] = [];

  rows.push([`[構件名稱] ${o.label} (${COMPONENT_TYPE_LABELS.opening})`]);
  rows.push([`[尺寸] 開口寬=${o.openWidth}cm, 開口高=${o.openHeight}cm, 構件厚=${o.thickness}cm, 構件類型=${o.memberType}, 數量=${o.quantity}`]);
  rows.push(blankRow());

  const OW = o.openWidth / 100;
  const OH = o.openHeight / 100;
  const T = o.thickness / 100;

  // Deduct concrete
  rows.push([`[扣混凝土 fc'=280]`]);
  rows.push([`= ${f2(OW)} × ${f2(OH)} × ${f2(T)} × ${o.quantity} = ${f2(r.deductConcrete)} m³`]);
  rows.push(blankRow());

  // Deduct formwork
  rows.push([`[扣模板]`]);
  if (o.memberType === 'wall') {
    rows.push([`= ${f2(OW)} × ${f2(OH)} × 2面 × ${o.quantity} = ${f2(r.deductFormwork)} m²`]);
  } else {
    rows.push([`= ${f2(OW)} × ${f2(OH)} × ${o.quantity} = ${f2(r.deductFormwork)} m²`]);
  }
  rows.push(blankRow());

  // Reinforcement
  const spec = getRebarSpec(o.reinfBar);
  if (spec) {
    const lap = spec.lap40D / 100;
    rows.push([`[豎向補強 ${o.reinfBar} ${spec.grade}]`]);
    rows.push([`= ${spec.kgPerM} × (${f2(OH)}+2×${f2(lap)}) × ${Math.ceil(o.openWidth / o.originalSpacing)} × 2 × ${o.quantity} = ${f1(r.vertReinf)} kg`]);
    rows.push(blankRow());

    rows.push([`[橫向補強 ${o.reinfBar} ${spec.grade}]`]);
    rows.push([`= ${spec.kgPerM} × (${f2(OW)}+2×${f2(lap)}) × ${Math.ceil(o.openHeight / o.originalSpacing)} × 2 × ${o.quantity} = ${f1(r.horizReinf)} kg`]);
    rows.push(blankRow());

    if (r.diagReinf > 0) {
      const diag = Math.sqrt(o.openWidth * o.openWidth + o.openHeight * o.openHeight) / 100;
      rows.push([`[斜向補強 ${o.reinfBar} ${spec.grade}]`]);
      rows.push([`對角線 = √(${o.openWidth}²+${o.openHeight}²)/100 = ${f2(diag)} m`]);
      rows.push([`= ${spec.kgPerM} × (${f2(diag)}+2×${f2(lap)}) × ${o.quantity} = ${f1(r.diagReinf)} kg`]);
      rows.push(blankRow());
    }

    if (r.spliceCount > 0) {
      rows.push([`[搭接統計]`]);
      rows.push([`搭接總次數 = ${r.spliceCount} 次, 搭接總長度 = ${f2(r.spliceLength)} m`]);
      rows.push(blankRow());
    }
  }

  // SD classification
  rows.push([`[SD 分類]`]);
  if (r.totalRebarSD280 > 0) rows.push([`SD280 = ${f1(r.totalRebarSD280)} kg`]);
  if (r.totalRebarSD420 > 0) rows.push([`SD420 = ${f1(r.totalRebarSD420)} kg`]);

  rows.push(separator());
  return rows;
}

function manualRCDetail(m: ManualRCData): Row[] {
  const rows: Row[] = [];
  rows.push([`[構件名稱] ${m.label} (${COMPONENT_TYPE_LABELS.manualRC})`]);
  rows.push(blankRow());
  if (m.concrete280 > 0) rows.push([`混凝土 fc'=280 = ${f2(m.concrete280)} m³`]);
  if (m.concrete210 > 0) rows.push([`混凝土 fc'=210 = ${f2(m.concrete210)} m³`]);
  if (m.rebarSD280 > 0) rows.push([`鋼筋 SD280 = ${f1(m.rebarSD280)} kg`]);
  if (m.rebarSD420 > 0) rows.push([`鋼筋 SD420 = ${f1(m.rebarSD420)} kg`]);
  if (m.formwork > 0) rows.push([`模板 = ${f2(m.formwork)} m²`]);
  if (m.trowel > 0) rows.push([`粉光 = ${f2(m.trowel)} m²`]);
  if (m.wireMesh > 0) rows.push([`鋼絲網 = ${f1(m.wireMesh)} kg`]);
  if (m.pcCushion > 0) rows.push([`混凝土 fc'=140 = ${f2(m.pcCushion)} m³`]);
  if (m.excavation > 0) rows.push([`開挖 = ${f2(m.excavation)} m³`]);
  if (m.backfill > 0) rows.push([`回填 = ${f2(m.backfill)} m³`]);
  rows.push(separator());
  return rows;
}

function customDetail(c: CustomData): Row[] {
  const rows: Row[] = [];
  rows.push([`[構件名稱] ${c.label} (${COMPONENT_TYPE_LABELS.custom})`]);
  rows.push(blankRow());
  const total = c.customQuantity * c.unitPrice;
  rows.push([`${c.description || c.label}: ${c.customQuantity} ${c.unit} × ${c.unitPrice} = ${f2(total)}`]);
  rows.push(separator());
  return rows;
}

export function generateComponentDetail(
  comp: ComponentData,
  caseData: EstimationCase,
): Row[] {
  const barLengthM = caseData.calcSettings?.barLengthM ?? BAR_LENGTH_M;
  switch (comp.type) {
    case 'column': return columnDetail(comp, barLengthM);
    case 'beam': return beamDetail(comp, barLengthM);
    case 'slab': return slabDetail(comp, barLengthM);
    case 'wall': return wallDetail(comp, barLengthM);
    case 'floor': return floorDetail(comp, barLengthM);
    case 'foundation': return foundationDetail(comp, barLengthM);
    case 'equipFound': return equipFoundDetail(comp);
    case 'stair': return stairDetail(comp, barLengthM);
    case 'opening': return openingDetail(comp, barLengthM);
    case 'manualRC': return manualRCDetail(comp);
    case 'custom': return customDetail(comp);
    default: return [];
  }
}

export function generateCalcDetailSheet(
  components: ComponentData[],
  caseData: EstimationCase,
): Row[] {
  const barLengthM = caseData.calcSettings?.barLengthM ?? BAR_LENGTH_M;
  const rows: Row[] = [];

  rows.push(['計算過程明細']);
  rows.push([`工程名稱: ${caseData.name}`, '', `日期: ${caseData.date}`]);
  rows.push([`標準料長: ${barLengthM} m`]);
  rows.push(blankRow());
  rows.push(separator());

  for (const comp of components) {
    switch (comp.type) {
      case 'column':
        rows.push(...columnDetail(comp, barLengthM));
        break;
      case 'beam':
        rows.push(...beamDetail(comp, barLengthM));
        break;
      case 'slab':
        rows.push(...slabDetail(comp, barLengthM));
        break;
      case 'wall':
        rows.push(...wallDetail(comp, barLengthM));
        break;
      case 'floor':
        rows.push(...floorDetail(comp, barLengthM));
        break;
      case 'foundation':
        rows.push(...foundationDetail(comp, barLengthM));
        break;
      case 'equipFound':
        rows.push(...equipFoundDetail(comp));
        break;
      case 'stair':
        rows.push(...stairDetail(comp, barLengthM));
        break;
      case 'opening':
        rows.push(...openingDetail(comp, barLengthM));
        break;
      case 'manualRC':
        rows.push(...manualRCDetail(comp));
        break;
      case 'custom':
        rows.push(...customDetail(comp));
        break;
    }
  }

  return rows;
}
