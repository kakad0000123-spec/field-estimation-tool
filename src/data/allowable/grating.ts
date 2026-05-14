// AUTO-GENERATED from docs/鋼構容許荷重計算表_v10.xlsx (DB_Grating)
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

export const ALLOW_GRATINGS: AllowGrating[] = [
  {
    "label": "20×3 @30 溝距100",
    "h": 20,
    "t": 3,
    "spacing": 30,
    "crossSpacing": 100,
    "selfWeight": 17.7,
    "note": "輕型水溝蓋"
  },
  {
    "label": "25×3 @30 溝距100",
    "h": 25,
    "t": 3,
    "spacing": 30,
    "crossSpacing": 100,
    "selfWeight": 21.6,
    "note": "一般水溝蓋"
  },
  {
    "label": "25×3 @30 溝距200",
    "h": 25,
    "t": 3,
    "spacing": 30,
    "crossSpacing": 200,
    "selfWeight": 21.6,
    "note": "一般水溝蓋(寬溝距)"
  },
  {
    "label": "25×3 @40 溝距200",
    "h": 25,
    "t": 3,
    "spacing": 40,
    "crossSpacing": 200,
    "selfWeight": 16.7,
    "note": "一般水溝蓋(寬溝距)"
  },
  {
    "label": "25×5 @30 溝距100",
    "h": 25,
    "t": 5,
    "spacing": 30,
    "crossSpacing": 100,
    "selfWeight": 34.7,
    "note": "重型水溝蓋"
  },
  {
    "label": "25×5 @30 溝距200",
    "h": 25,
    "t": 5,
    "spacing": 30,
    "crossSpacing": 200,
    "selfWeight": 34.7,
    "note": "重型水溝蓋(寬溝距)"
  },
  {
    "label": "25×5 @40 溝距200",
    "h": 25,
    "t": 5,
    "spacing": 40,
    "crossSpacing": 200,
    "selfWeight": 26.5,
    "note": "重型水溝蓋(寬溝距)"
  },
  {
    "label": "30×3 @30 溝距200",
    "h": 30,
    "t": 3,
    "spacing": 30,
    "crossSpacing": 200,
    "selfWeight": 25.6,
    "note": "標準平台格柵"
  },
  {
    "label": "30×5 @30 溝距100",
    "h": 30,
    "t": 5,
    "spacing": 30,
    "crossSpacing": 100,
    "selfWeight": 41.3,
    "note": "標準平台格柵"
  },
  {
    "label": "30×5 @40 溝距200",
    "h": 30,
    "t": 5,
    "spacing": 40,
    "crossSpacing": 200,
    "selfWeight": 31.4,
    "note": "標準平台格柵"
  },
  {
    "label": "32×5 @30 溝距100",
    "h": 32,
    "t": 5,
    "spacing": 30,
    "crossSpacing": 100,
    "selfWeight": 43.9,
    "note": "加強平台格柵"
  },
  {
    "label": "32×5 @40 溝距200",
    "h": 32,
    "t": 5,
    "spacing": 40,
    "crossSpacing": 200,
    "selfWeight": 33.4,
    "note": "加強平台格柵"
  },
  {
    "label": "40×5 @30 溝距100",
    "h": 40,
    "t": 5,
    "spacing": 30,
    "crossSpacing": 100,
    "selfWeight": 54.3,
    "note": "重載平台格柵"
  },
  {
    "label": "40×5 @40 溝距200",
    "h": 40,
    "t": 5,
    "spacing": 40,
    "crossSpacing": 200,
    "selfWeight": 41.3,
    "note": "重載平台格柵"
  },
  {
    "label": "40×6 @30 溝距100",
    "h": 40,
    "t": 6,
    "spacing": 30,
    "crossSpacing": 100,
    "selfWeight": 64.8,
    "note": "超重載格柵"
  },
  {
    "label": "50×5 @30 溝距100",
    "h": 50,
    "t": 5,
    "spacing": 30,
    "crossSpacing": 100,
    "selfWeight": 67.4,
    "note": "車道格柵"
  },
  {
    "label": "50×5 @40 溝距100",
    "h": 50,
    "t": 5,
    "spacing": 40,
    "crossSpacing": 100,
    "selfWeight": 51.1,
    "note": "車道格柵"
  },
  {
    "label": "50×6 @30 溝距100",
    "h": 50,
    "t": 6,
    "spacing": 30,
    "crossSpacing": 100,
    "selfWeight": 80.5,
    "note": "重車格柵"
  },
  {
    "label": "50×8 @30 溝距100",
    "h": 50,
    "t": 8,
    "spacing": 30,
    "crossSpacing": 100,
    "selfWeight": 106.7,
    "note": "超重車格柵"
  },
  {
    "label": "65×8 @30 溝距100",
    "h": 65,
    "t": 8,
    "spacing": 30,
    "crossSpacing": 100,
    "selfWeight": 138.1,
    "note": "特殊重載"
  }
];

export function getAllowGrating(label: string): AllowGrating | undefined {
  return ALLOW_GRATINGS.find((g) => g.label === label);
}
