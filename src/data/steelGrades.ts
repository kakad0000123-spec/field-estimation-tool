// ─── 鋼材等級允許應力表 (AIJ ASD 慣用) ───
// 假設板厚 ≤ 40mm；fb = fy / 1.5；fs = fb / √3 ≈ fy / 2.598
// 第一版未做側向扭轉挫屈折減 (假設連續側向支撐)。

export type SteelGrade = 'SS400' | 'SN400B' | 'SM490' | 'SN490B';

export interface SteelGradeSpec {
  label: string;
  fy: number;       // 降伏強度 (MPa, = N/mm²)
  fb: number;       // 允許彎曲應力 (MPa)
  fs: number;       // 允許剪應力 (MPa)
}

export const STEEL_GRADES: Record<SteelGrade, SteelGradeSpec> = {
  SS400:  { label: 'SS400',  fy: 235, fb: 156, fs: 90  },
  SN400B: { label: 'SN400B', fy: 235, fb: 156, fs: 90  },
  SM490:  { label: 'SM490',  fy: 325, fb: 216, fs: 125 },
  SN490B: { label: 'SN490B', fy: 325, fb: 216, fs: 125 },
};

export const STEEL_GRADE_LABELS: SteelGrade[] = ['SS400', 'SN400B', 'SM490', 'SN490B'];

// 楊氏模數 (MPa = N/mm²)，所有結構用鋼通用
export const E_STEEL_MPA = 200000;

// 鋼材密度 (kg/m³)，內部僅供參考；單位重直接用斷面表的 unitWeight
export const STEEL_DENSITY_KGM3 = 7850;

// 重力加速度 (m/s²)，把 kg/m 換成 kN/m 時使用
export const G_MS2 = 9.81;
