// AUTO-GENERATED from docs/鋼構容許荷重計算表_v10.xlsx (DB_Deck)
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

export const ALLOW_DECKS: AllowDeck[] = [
  {
    "label": "1.0W-0.8mm",
    "hr": 50,
    "bEff": 600,
    "thickness": 0.8,
    "As": 1017,
    "Ix": 234000,
    "selfWeight": 9.5,
    "note": "淺波50mm"
  },
  {
    "label": "1.0W-1.0mm",
    "hr": 50,
    "bEff": 600,
    "thickness": 1,
    "As": 1271,
    "Ix": 289000,
    "selfWeight": 11.8,
    "note": "淺波50mm"
  },
  {
    "label": "1.0W-1.2mm",
    "hr": 50,
    "bEff": 600,
    "thickness": 1.2,
    "As": 1525,
    "Ix": 342000,
    "selfWeight": 14.2,
    "note": "淺波50mm"
  },
  {
    "label": "1.5W-0.8mm",
    "hr": 75,
    "bEff": 600,
    "thickness": 0.8,
    "As": 1017,
    "Ix": 456000,
    "selfWeight": 10.2,
    "note": "中波75mm"
  },
  {
    "label": "1.5W-1.0mm",
    "hr": 75,
    "bEff": 600,
    "thickness": 1,
    "As": 1271,
    "Ix": 564000,
    "selfWeight": 12.7,
    "note": "中波75mm"
  },
  {
    "label": "1.5W-1.2mm",
    "hr": 75,
    "bEff": 600,
    "thickness": 1.2,
    "As": 1525,
    "Ix": 670000,
    "selfWeight": 15.2,
    "note": "中波75mm"
  },
  {
    "label": "2.0W-0.8mm",
    "hr": 75,
    "bEff": 600,
    "thickness": 0.8,
    "As": 1017,
    "Ix": 520000,
    "selfWeight": 10.8,
    "note": "深波75mm"
  },
  {
    "label": "2.0W-1.0mm",
    "hr": 75,
    "bEff": 600,
    "thickness": 1,
    "As": 1271,
    "Ix": 648000,
    "selfWeight": 13.5,
    "note": "深波75mm"
  },
  {
    "label": "2.0W-1.2mm",
    "hr": 75,
    "bEff": 600,
    "thickness": 1.2,
    "As": 1525,
    "Ix": 775000,
    "selfWeight": 16.2,
    "note": "深波75mm"
  },
  {
    "label": "3.0W-0.8mm",
    "hr": 100,
    "bEff": 600,
    "thickness": 0.8,
    "As": 1017,
    "Ix": 750000,
    "selfWeight": 12.5,
    "note": "深波100mm"
  },
  {
    "label": "3.0W-1.0mm",
    "hr": 100,
    "bEff": 600,
    "thickness": 1,
    "As": 1271,
    "Ix": 890000,
    "selfWeight": 14.8,
    "note": "深波100mm"
  },
  {
    "label": "3.0W-1.2mm",
    "hr": 100,
    "bEff": 600,
    "thickness": 1.2,
    "As": 1525,
    "Ix": 1060000,
    "selfWeight": 17.6,
    "note": "深波100mm"
  }
];

export const ALLOW_WWMS: AllowWWM[] = [
  {
    "label": "φ3.2@100×100",
    "diameter": 3.2,
    "spacingX": 100,
    "spacingY": 100,
    "AsX": 80.4,
    "AsY": 80.4,
    "fy": 490
  },
  {
    "label": "φ3.2@150×150",
    "diameter": 3.2,
    "spacingX": 150,
    "spacingY": 150,
    "AsX": 53.6,
    "AsY": 53.6,
    "fy": 490
  },
  {
    "label": "φ4.0@100×100",
    "diameter": 4,
    "spacingX": 100,
    "spacingY": 100,
    "AsX": 125.7,
    "AsY": 125.7,
    "fy": 490
  },
  {
    "label": "φ4.0@150×150",
    "diameter": 4,
    "spacingX": 150,
    "spacingY": 150,
    "AsX": 83.8,
    "AsY": 83.8,
    "fy": 490
  },
  {
    "label": "φ4.0@200×200",
    "diameter": 4,
    "spacingX": 200,
    "spacingY": 200,
    "AsX": 62.8,
    "AsY": 62.8,
    "fy": 490
  },
  {
    "label": "φ5.0@100×100",
    "diameter": 5,
    "spacingX": 100,
    "spacingY": 100,
    "AsX": 196.3,
    "AsY": 196.3,
    "fy": 490
  },
  {
    "label": "φ5.0@150×150",
    "diameter": 5,
    "spacingX": 150,
    "spacingY": 150,
    "AsX": 130.9,
    "AsY": 130.9,
    "fy": 490
  },
  {
    "label": "φ5.0@200×200",
    "diameter": 5,
    "spacingX": 200,
    "spacingY": 200,
    "AsX": 98.2,
    "AsY": 98.2,
    "fy": 490
  },
  {
    "label": "φ6.0@100×100",
    "diameter": 6,
    "spacingX": 100,
    "spacingY": 100,
    "AsX": 282.7,
    "AsY": 282.7,
    "fy": 490
  },
  {
    "label": "φ6.0@150×150",
    "diameter": 6,
    "spacingX": 150,
    "spacingY": 150,
    "AsX": 188.5,
    "AsY": 188.5,
    "fy": 490
  },
  {
    "label": "φ6.0@200×200",
    "diameter": 6,
    "spacingX": 200,
    "spacingY": 200,
    "AsX": 141.4,
    "AsY": 141.4,
    "fy": 490
  }
];

export function getAllowDeck(label: string): AllowDeck | undefined {
  return ALLOW_DECKS.find((d) => d.label === label);
}

export function getAllowWWM(label: string): AllowWWM | undefined {
  return ALLOW_WWMS.find((w) => w.label === label);
}
