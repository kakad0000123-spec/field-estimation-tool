// AUTO-GENERATED from docs/鋼構容許荷重計算表_v10.xlsx (DB_Deflection)
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

export const ALLOW_DEFLECTIONS: AllowDeflection[] = [
  {
    "label": "一般鋼梁｜總載重撓度 L/240",
    "category": "一般鋼梁",
    "ratio": 240,
    "absoluteLimit": null,
    "checkType": "總載重撓度",
    "note": "容許撓度 Δa = L/240"
  },
  {
    "label": "一般鋼梁｜活載重撓度 L/360",
    "category": "一般鋼梁",
    "ratio": 360,
    "absoluteLimit": null,
    "checkType": "活載重撓度",
    "note": "容許撓度 Δa = L/360"
  },
  {
    "label": "平台梁／走道梁｜L/360 且 ≤ 25 mm",
    "category": "平台梁／走道梁",
    "ratio": 360,
    "absoluteLimit": 25,
    "checkType": "活載重撓度",
    "note": "取 Min(L/360, 25 mm)"
  },
  {
    "label": "格柵板/花紋鋼板/面板｜≤ 6 mm",
    "category": "面板",
    "ratio": 0,
    "absoluteLimit": 6,
    "checkType": "總載重撓度",
    "note": "容許撓度 Δa = 6 mm"
  },
  {
    "label": "天車梁(Monorail)｜簡支單軌 L/800",
    "category": "天車梁(Monorail)",
    "ratio": 800,
    "absoluteLimit": null,
    "checkType": "服務性撓度",
    "note": "依單軌天車梁簡支條件"
  },
  {
    "label": "天車梁｜簡支雙軌 L/1000",
    "category": "天車梁",
    "ratio": 1000,
    "absoluteLimit": null,
    "checkType": "服務性撓度",
    "note": "依雙軌天車梁簡支條件"
  },
  {
    "label": "天車梁(Monorail)｜懸臂梁 L/500",
    "category": "天車梁(Monorail)",
    "ratio": 500,
    "absoluteLimit": null,
    "checkType": "服務性撓度",
    "note": "依單軌天車懸臂梁條件"
  },
  {
    "label": "設備支承梁｜熱交換器 L/400 且 ≤ 21 mm",
    "category": "設備支承梁",
    "ratio": 400,
    "absoluteLimit": 21,
    "checkType": "總載重撓度",
    "note": "取 Min(L/400, 21 mm)"
  },
  {
    "label": "設備支承梁｜高塔槽體 L/600 且 ≤ 21 mm",
    "category": "設備支承梁",
    "ratio": 600,
    "absoluteLimit": 21,
    "checkType": "總載重撓度",
    "note": "取 Min(L/600, 21 mm)"
  },
  {
    "label": "設備支承梁｜轉動或振動設備 L/900 且 ≤ 21 mm",
    "category": "設備支承梁",
    "ratio": 900,
    "absoluteLimit": 21,
    "checkType": "總載重撓度",
    "note": "取 Min(L/900, 21 mm)"
  },
  {
    "label": "設備支承梁｜其他設備 L/400 且 ≤ 21 mm",
    "category": "設備支承梁",
    "ratio": 400,
    "absoluteLimit": 21,
    "checkType": "總載重撓度",
    "note": "取 Min(L/400, 21 mm)"
  },
  {
    "label": "管線支承梁｜與管線直交 L/300 且 ≤ 25 mm",
    "category": "管線支承梁",
    "ratio": 300,
    "absoluteLimit": 25,
    "checkType": "總載重撓度",
    "note": "取 Min(L/300, 25 mm)"
  },
  {
    "label": "管線支承梁｜與管線平行 L/600 且 ≤ 25 mm",
    "category": "管線支承梁",
    "ratio": 600,
    "absoluteLimit": 25,
    "checkType": "總載重撓度",
    "note": "取 Min(L/600, 25 mm)"
  }
];

export function getAllowDeflection(label: string): AllowDeflection | undefined {
  return ALLOW_DEFLECTIONS.find((d) => d.label === label);
}
