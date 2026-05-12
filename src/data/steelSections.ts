// ─── 鋼構 H 型鋼斷面表 (CNS / JIS 慣用) ───
// 來源：JIS G 3192 + CNS 通用尺寸；以最常用之公稱規格為主。
// 欄位單位：h, b, tw, tf (mm)；A (cm²)；Ix (cm⁴)；Zx (cm³)；unitWeight (kg/m)

export interface SteelSection {
  label: string;        // 顯示名稱 (例：H300x150x6.5x9)
  h: number;            // 全深 (mm)
  b: number;            // 翼緣寬 (mm)
  tw: number;           // 腹板厚 (mm)
  tf: number;           // 翼緣厚 (mm)
  A: number;            // 斷面積 (cm²)
  Ix: number;           // 強軸慣性矩 (cm⁴)
  Zx: number;           // 強軸斷面模數 (cm³)
  unitWeight: number;   // 單位重 (kg/m)
}

export const STEEL_SECTIONS: SteelSection[] = [
  { label: 'H100x100x6x8',     h: 100, b: 100, tw: 6,    tf: 8,  A: 21.59, Ix:  378, Zx:  75.6, unitWeight: 16.9 },
  { label: 'H125x125x6.5x9',   h: 125, b: 125, tw: 6.5,  tf: 9,  A: 30.00, Ix:  847, Zx: 135,   unitWeight: 23.6 },
  { label: 'H150x75x5x7',      h: 150, b:  75, tw: 5,    tf: 7,  A: 17.85, Ix:  666, Zx:  88.8, unitWeight: 14.0 },
  { label: 'H150x150x7x10',    h: 150, b: 150, tw: 7,    tf: 10, A: 40.14, Ix: 1640, Zx: 219,   unitWeight: 31.5 },
  { label: 'H175x90x5x8',      h: 175, b:  90, tw: 5,    tf: 8,  A: 23.04, Ix: 1210, Zx: 138,   unitWeight: 18.0 },
  { label: 'H200x100x5.5x8',   h: 200, b: 100, tw: 5.5,  tf: 8,  A: 26.66, Ix: 1810, Zx: 181,   unitWeight: 20.9 },
  { label: 'H200x200x8x12',    h: 200, b: 200, tw: 8,    tf: 12, A: 63.53, Ix: 4720, Zx: 472,   unitWeight: 49.9 },
  { label: 'H250x125x6x9',     h: 250, b: 125, tw: 6,    tf: 9,  A: 36.97, Ix: 3960, Zx: 317,   unitWeight: 29.0 },
  { label: 'H250x250x9x14',    h: 250, b: 250, tw: 9,    tf: 14, A: 91.43, Ix: 10700,Zx: 860,   unitWeight: 71.8 },
  { label: 'H300x150x6.5x9',   h: 300, b: 150, tw: 6.5,  tf: 9,  A: 46.78, Ix: 7210, Zx: 481,   unitWeight: 36.7 },
  { label: 'H300x300x10x15',   h: 300, b: 300, tw: 10,   tf: 15, A: 119.8, Ix: 20400,Zx: 1360,  unitWeight: 94.0 },
  { label: 'H350x175x7x11',    h: 350, b: 175, tw: 7,    tf: 11, A: 62.91, Ix: 13600,Zx: 775,   unitWeight: 49.4 },
  { label: 'H350x350x12x19',   h: 350, b: 350, tw: 12,   tf: 19, A: 171.9, Ix: 39800,Zx: 2280,  unitWeight: 135  },
  { label: 'H400x200x8x13',    h: 400, b: 200, tw: 8,    tf: 13, A: 83.37, Ix: 23500,Zx: 1170,  unitWeight: 65.4 },
  { label: 'H400x400x13x21',   h: 400, b: 400, tw: 13,   tf: 21, A: 218.7, Ix: 66600,Zx: 3330,  unitWeight: 172  },
  { label: 'H450x200x9x14',    h: 450, b: 200, tw: 9,    tf: 14, A: 95.43, Ix: 32900,Zx: 1460,  unitWeight: 74.9 },
  { label: 'H500x200x10x16',   h: 500, b: 200, tw: 10,   tf: 16, A: 114.2, Ix: 47800,Zx: 1910,  unitWeight: 89.6 },
  { label: 'H600x200x11x17',   h: 600, b: 200, tw: 11,   tf: 17, A: 131.7, Ix: 75600,Zx: 2520,  unitWeight: 103  },
  { label: 'H700x300x13x24',   h: 700, b: 300, tw: 13,   tf: 24, A: 235.5, Ix: 201000,Zx: 5760, unitWeight: 185  },
  { label: 'H800x300x14x26',   h: 800, b: 300, tw: 14,   tf: 26, A: 267.4, Ix: 286000,Zx: 7160, unitWeight: 210  },
];

export const STEEL_SECTION_LABELS = STEEL_SECTIONS.map((s) => s.label);

export function getSteelSection(label: string): SteelSection | undefined {
  return STEEL_SECTIONS.find((s) => s.label === label);
}
