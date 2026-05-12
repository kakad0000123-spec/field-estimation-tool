import { CoatingType } from './types';

// 鋼構塗裝類型（含單價建議值，NTD/m²）
export const COATING_TYPES: CoatingType[] = [
  { label: '無', unitPrice: 0 },
  { label: '油漆', unitPrice: 200 },
  { label: '防火漆1hr', unitPrice: 800 },
  { label: '防火漆2hr', unitPrice: 1500 },
  { label: '防火批覆', unitPrice: 2200 },
];

export const COATING_LABELS = COATING_TYPES.map((c) => c.label);

export function getCoatingType(label: string): CoatingType | undefined {
  return COATING_TYPES.find((c) => c.label === label);
}
