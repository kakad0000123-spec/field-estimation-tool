// AUTO-GENERATED from docs/鋼構容許荷重計算表_v10.xlsx (DB_Settings)
// 鋼材材質強度表 — 容許應力設計法 (ASD) 用
// 參考：鋼構造建築物鋼結構設計技術規範及解說 (內政部) / CNS 13812 / CNS 2473 / ASTM A572 / A36

export interface AllowGrade {
  label: string;
  Fy_MPa: number | null;   // 降伏強度 (MPa)
  E_MPa: number | null;    // 彈性模數 (MPa) — 鋼材通用 200000
  Fy_kgcm2: number | null; // 降伏強度 (kg/cm²) 公制工程慣用
  note: string;            // 適用範圍
}

export const ALLOW_GRADES: AllowGrade[] = [
  {
    "label": "CNS SN400B / SM400 (t≤40)",
    "Fy_MPa": 235.36,
    "E_MPa": 200000,
    "Fy_kgcm2": 2400,
    "note": "一般型鋼、鋼板"
  },
  {
    "label": "CNS SN400B / SM400 (t>40)",
    "Fy_MPa": 215.75,
    "E_MPa": 200000,
    "Fy_kgcm2": 2200,
    "note": "一般型鋼、鋼板"
  },
  {
    "label": "CNS SN490B",
    "Fy_MPa": 323.62,
    "E_MPa": 200000,
    "Fy_kgcm2": 3300,
    "note": "BH型鋼"
  },
  {
    "label": "ASTM A572 Gr.50",
    "Fy_MPa": 338.33,
    "E_MPa": 200000,
    "Fy_kgcm2": 3450,
    "note": "BH型鋼"
  },
  {
    "label": "A36（C型鋼、角鋼）",
    "Fy_MPa": 235.36,
    "E_MPa": 200000,
    "Fy_kgcm2": 2400,
    "note": "C型鋼、角鋼"
  }
];

// 設計常數 (DB_Settings 右半部)
export const N_PER_KG = 9.80665;   // 1 kgf = 9.80665 N
export const FB_FACTOR = 0.66;     // 容許彎曲應力係數: Fb = 0.66 × Fy
export const FV_FACTOR = 0.40;     // 容許剪應力係數: Fv = 0.40 × Fy
export const STEEL_DENSITY = 0.00785; // (kg/m) per (mm²): A(mm²) × 0.00785 = kg/m

export function getAllowGrade(label: string): AllowGrade | undefined {
  return ALLOW_GRADES.find((g) => g.label === label);
}
