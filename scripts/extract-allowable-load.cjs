// One-shot extractor: 鋼構容許荷重計算表_v10.xlsx → TS data files
// Run from project root: node scripts/extract-allowable-load.cjs

const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const xlsxPath = path.join(__dirname, '..', 'docs', '鋼構容許荷重計算表_v10.xlsx');
const outDir = path.join(__dirname, '..', 'src', 'data', 'allowable');

const wb = XLSX.readFile(xlsxPath);

function num(v, digits = 4) {
  if (v === '' || v === null || v === undefined) return null;
  if (typeof v !== 'number') return null;
  if (!isFinite(v)) return null;
  // Round to avoid 8.870500000000001 style noise
  const factor = Math.pow(10, digits);
  return Math.round(v * factor) / factor;
}

function tsStr(s) {
  return JSON.stringify(s ?? '');
}

// ─── DB_Sections ───
function extractSections() {
  const ws = wb.Sheets['DB_Sections'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    const label = r[0];
    const shape = r[1];
    if (!label || !shape) continue;
    out.push({
      label: String(label),
      shape: String(shape),
      d: num(r[2], 2),
      bf: num(r[3], 2),
      tw: num(r[4], 2),
      tf: num(r[5], 2),
      extra: num(r[6], 2),
      A: num(r[7], 1),
      weight: num(r[8], 3),
      Ix: num(r[9], 0),
      Sx: num(r[10], 0),
      Aw: num(r[11], 1),
      Iy: num(r[14], 0),
      rx: num(r[15], 2),
      ry: num(r[16], 2),
    });
  }
  return out;
}

// ─── DB_Settings (steel grades part: cols A-E) ───
function extractGrades() {
  const ws = wb.Sheets['DB_Settings'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[0]) continue;
    out.push({
      label: String(r[0]),
      Fy_MPa: num(r[1], 2),
      E_MPa: num(r[2], 0),
      Fy_kgcm2: num(r[3], 0),
      note: String(r[4] ?? ''),
    });
  }
  return out;
}

// ─── DB_Deflection ───
function extractDeflection() {
  const ws = wb.Sheets['DB_Deflection'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[0]) continue;
    out.push({
      label: String(r[0]),
      category: String(r[1] ?? ''),
      ratio: num(r[2], 0),
      absoluteLimit: num(r[3], 0),
      checkType: String(r[4] ?? ''),
      note: String(r[5] ?? ''),
    });
  }
  return out;
}

// ─── DB_Dropdown — section options by shape ───
function extractDropdown() {
  const ws = wb.Sheets['DB_Dropdown'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const headers = rows[0]; // ['H形鋼','I型梁','槽鋼','P型鋼','L型鋼','BOX柱']
  const byShape = {};
  for (const h of headers) byShape[h] = [];
  for (let i = 1; i < rows.length; i++) {
    for (let c = 0; c < headers.length; c++) {
      const v = rows[i][c];
      if (v) byShape[headers[c]].push(String(v));
    }
  }
  return byShape;
}

// ─── DB_Grating ───
function extractGrating() {
  const ws = wb.Sheets['DB_Grating'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const out = [];
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[0]) continue;
    out.push({
      label: String(r[0]),
      h: num(r[1], 1),       // 承載條高 mm
      t: num(r[2], 1),       // 承載條厚 mm
      spacing: num(r[3], 1), // 承載條間距 c/c mm
      crossSpacing: num(r[4], 1), // 橫條間距 mm
      selfWeight: num(r[5], 1),   // kg/m²
      note: String(r[6] ?? ''),
    });
  }
  return out;
}

// ─── DB_Deck (two tables: Deck rows then WWM rows) ───
function extractDeck() {
  const ws = wb.Sheets['DB_Deck'];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const decks = [];
  const wwm = [];
  let mode = 'deck';
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r[0]) continue;
    const first = String(r[0]);
    if (first.includes('WWM') || first === 'WWM規格') {
      mode = 'wwm';
      continue;
    }
    if (mode === 'deck' && first.match(/W-/)) {
      decks.push({
        label: first,
        hr: num(r[1], 0),
        bEff: num(r[2], 0),
        thickness: num(r[3], 1),
        As: num(r[4], 0),
        Ix: num(r[5], 0),
        selfWeight: num(r[6], 1),
        note: String(r[7] ?? ''),
      });
    } else if (mode === 'wwm' && first.match(/^φ/)) {
      wwm.push({
        label: first,
        diameter: num(r[1], 1),
        spacingX: num(r[2], 0),
        spacingY: num(r[3], 0),
        AsX: num(r[4], 1),
        AsY: num(r[5], 1),
        fy: num(r[6], 0),
      });
    }
  }
  return { decks, wwm };
}

// ─── Write TS files ───
function writeSections() {
  const data = extractSections();
  const ts =
`// AUTO-GENERATED from docs/鋼構容許荷重計算表_v10.xlsx (DB_Sections)
// Run: node scripts/extract-allowable-load.cjs
// 斷面性質資料表（H形鋼／I型梁／槽鋼／P型鋼／L型鋼／BOX柱）

export interface AllowSection {
  label: string;
  shape: string;          // H形鋼, I型梁, 槽鋼, P型鋼, L型鋼, BOX柱
  d: number | null;       // H / 直徑 (mm)
  bf: number | null;      // B / bf (mm)
  tw: number | null;      // 腹板厚 (mm)
  tf: number | null;      // 翼板厚 (mm)
  extra: number | null;   // 附加尺寸 (mm)
  A: number | null;       // 斷面積 (mm²)
  weight: number | null;  // 單位重 (kg/m)
  Ix: number | null;      // 強軸慣性矩 (mm⁴)
  Sx: number | null;      // 強軸斷面模數 (mm³)
  Aw: number | null;      // 腹板有效剪面積 (mm²)
  Iy: number | null;      // 弱軸慣性矩 (mm⁴)
  rx: number | null;      // 強軸迴轉半徑 (mm)
  ry: number | null;      // 弱軸迴轉半徑 (mm)
}

export const ALLOW_SECTIONS: AllowSection[] = ${JSON.stringify(data, null, 2)};

export function getAllowSection(label: string): AllowSection | undefined {
  return ALLOW_SECTIONS.find((s) => s.label === label);
}
`;
  fs.writeFileSync(path.join(outDir, 'sections.ts'), ts);
  console.log('sections.ts: ' + data.length + ' rows');
}

function writeGrades() {
  const data = extractGrades();
  const ts =
`// AUTO-GENERATED from docs/鋼構容許荷重計算表_v10.xlsx (DB_Settings)
// 鋼材材質強度表 — 容許應力設計法 (ASD) 用
// 參考：鋼構造建築物鋼結構設計技術規範及解說 (內政部) / CNS 13812 / CNS 2473 / ASTM A572 / A36

export interface AllowGrade {
  label: string;
  Fy_MPa: number | null;   // 降伏強度 (MPa)
  E_MPa: number | null;    // 彈性模數 (MPa) — 鋼材通用 200000
  Fy_kgcm2: number | null; // 降伏強度 (kg/cm²) 公制工程慣用
  note: string;            // 適用範圍
}

export const ALLOW_GRADES: AllowGrade[] = ${JSON.stringify(data, null, 2)};

// 設計常數 (DB_Settings 右半部)
export const N_PER_KG = 9.80665;   // 1 kgf = 9.80665 N
export const FB_FACTOR = 0.66;     // 容許彎曲應力係數: Fb = 0.66 × Fy
export const FV_FACTOR = 0.40;     // 容許剪應力係數: Fv = 0.40 × Fy
export const STEEL_DENSITY = 0.00785; // (kg/m) per (mm²): A(mm²) × 0.00785 = kg/m

export function getAllowGrade(label: string): AllowGrade | undefined {
  return ALLOW_GRADES.find((g) => g.label === label);
}
`;
  fs.writeFileSync(path.join(outDir, 'grades.ts'), ts);
  console.log('grades.ts: ' + data.length + ' rows');
}

function writeDeflection() {
  const data = extractDeflection();
  const ts =
`// AUTO-GENERATED from docs/鋼構容許荷重計算表_v10.xlsx (DB_Deflection)
// 容許撓度基準表 — 一般鋼梁／平台梁／天車梁／設備支承梁／管線支承梁
// 參考：鋼構造設計技術規範常用值 + 公司實務慣用值

export interface AllowDeflection {
  label: string;          // 下拉顯示文字
  category: string;       // 梁類別
  ratio: number | null;   // L/n 值（0 表示無 L/n 限制）
  absoluteLimit: number | null; // 絕對上限 (mm)，null 表示無
  checkType: string;      // 總載重撓度 / 活載重撓度 / 服務性撓度
  note: string;
}

export const ALLOW_DEFLECTIONS: AllowDeflection[] = ${JSON.stringify(data, null, 2)};

export function getAllowDeflection(label: string): AllowDeflection | undefined {
  return ALLOW_DEFLECTIONS.find((d) => d.label === label);
}
`;
  fs.writeFileSync(path.join(outDir, 'deflection.ts'), ts);
  console.log('deflection.ts: ' + data.length + ' rows');
}

function writeDropdown() {
  const data = extractDropdown();
  const ts =
`// AUTO-GENERATED from docs/鋼構容許荷重計算表_v10.xlsx (DB_Dropdown)
// 各鋼構形式可選的斷面規格清單

export const ALLOW_SECTION_DROPDOWN: Record<string, string[]> = ${JSON.stringify(data, null, 2)};

export const ALLOW_SHAPE_TYPES = Object.keys(ALLOW_SECTION_DROPDOWN);
`;
  fs.writeFileSync(path.join(outDir, 'dropdown.ts'), ts);
  console.log('dropdown.ts: ' + Object.keys(data).length + ' shape groups');
}

function writeGrating() {
  const data = extractGrating();
  const ts =
`// AUTO-GENERATED from docs/鋼構容許荷重計算表_v10.xlsx (DB_Grating)
// 格柵 (Steel Grating) 規格表

export interface AllowGrating {
  label: string;
  h: number | null;            // 承載條高 (mm)
  t: number | null;            // 承載條厚 (mm)
  spacing: number | null;      // 承載條間距 c/c (mm)
  crossSpacing: number | null; // 橫條間距 (mm)
  selfWeight: number | null;   // 自重 (kg/m²)
  note: string;
}

export const ALLOW_GRATINGS: AllowGrating[] = ${JSON.stringify(data, null, 2)};

export function getAllowGrating(label: string): AllowGrating | undefined {
  return ALLOW_GRATINGS.find((g) => g.label === label);
}
`;
  fs.writeFileSync(path.join(outDir, 'grating.ts'), ts);
  console.log('grating.ts: ' + data.length + ' rows');
}

function writeDeck() {
  const { decks, wwm } = extractDeck();
  const ts =
`// AUTO-GENERATED from docs/鋼構容許荷重計算表_v10.xlsx (DB_Deck)
// Composite Deck 鋼浪板 + 電焊鋼絲網 (WWM) 規格表

export interface AllowDeck {
  label: string;
  hr: number | null;          // 波高 (mm)
  bEff: number | null;        // 有效寬 (mm/m)
  thickness: number | null;   // 板厚 (mm)
  As: number | null;          // 斷面積 (mm²/m)
  Ix: number | null;          // 慣性矩 (mm⁴/m)
  selfWeight: number | null;  // 自重 (kg/m²)
  note: string;
}

export interface AllowWWM {
  label: string;
  diameter: number | null;  // 鋼絲直徑 φ (mm)
  spacingX: number | null;  // 經向間距 (mm)
  spacingY: number | null;  // 緯向間距 (mm)
  AsX: number | null;       // As 經 (mm²/m)
  AsY: number | null;       // As 緯 (mm²/m)
  fy: number | null;        // (MPa)
}

export const ALLOW_DECKS: AllowDeck[] = ${JSON.stringify(decks, null, 2)};

export const ALLOW_WWMS: AllowWWM[] = ${JSON.stringify(wwm, null, 2)};

export function getAllowDeck(label: string): AllowDeck | undefined {
  return ALLOW_DECKS.find((d) => d.label === label);
}

export function getAllowWWM(label: string): AllowWWM | undefined {
  return ALLOW_WWMS.find((w) => w.label === label);
}
`;
  fs.writeFileSync(path.join(outDir, 'deck.ts'), ts);
  console.log('deck.ts: ' + decks.length + ' decks + ' + wwm.length + ' WWMs');
}

writeSections();
writeGrades();
writeDeflection();
writeDropdown();
writeGrating();
writeDeck();
console.log('Done.');
