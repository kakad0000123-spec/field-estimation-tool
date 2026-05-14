import { SteelGrade } from './types';

// 常用鋼材材質（依 CNS / ASTM）
export const STEEL_GRADES: SteelGrade[] = [
  { label: 'SS400', fy: 245, fu: 400, standard: 'CNS 2473 一般構造用碳鋼（對應 JIS G 3101）' },
  { label: 'SN400B', fy: 235, fu: 400, standard: 'CNS 13812 建築結構用碳鋼（對應 JIS G 3136）' },
  { label: 'SN490B', fy: 325, fu: 490, standard: 'CNS 13812 建築結構用高張力鋼' },
  { label: 'SN490C', fy: 325, fu: 490, standard: 'CNS 13812 建築結構用高張力鋼' },
  { label: 'A36', fy: 250, fu: 400, standard: 'ASTM A36 一般構造用碳鋼' },
  { label: 'A572-50', fy: 345, fu: 450, standard: 'ASTM A572 Grade 50 高張力鋼' },
];

export const STEEL_GRADE_LABELS = STEEL_GRADES.map((g) => g.label);

export function getSteelGrade(label: string): SteelGrade | undefined {
  return STEEL_GRADES.find((g) => g.label === label);
}
