// 容許荷重四模組 + Summary 共用的 localStorage key
// 變更欄位請同步升 versions 後綴，避免讀到舊 schema
export const STORAGE_KEYS = {
  beam: 'allowable.beam.v2',  // v2: 加入 LRFD 模式 + 雙軸 + D/L/W/E 載重分項
  column: 'allowable.column.v1',
  grating: 'allowable.grating.v1',
  deck: 'allowable.deck.v1',
} as const;

export type StoredBeam = {
  method: 'ASD' | 'LRFD';
  usage: string;
  support: string;
  shape: string;
  sectionLabel: string;
  gradeLabel: string;
  span: number;
  includeSelfWeight: boolean;
  D_add: number;       // 附加靜載 (kg/m)
  L_uniform: number;   // 活載均佈 (kg/m)
  L_point: number;     // 活載集中 (kg)
  L_impact: number;    // 衝擊倍率 (天車 1.25 / 一般 1.0)
  W_uniform: number;   // 風均佈 (kg/m，可為負表上吸)
  W_point: number;     // 風集中 (kg)
  E_point: number;     // 地震反力 (kg, 設備反力)
  My_input: number;    // 弱軸彎矩直接輸入 (kg·m)
  compressionContinuous: boolean;  // 壓力側連續支撐？
  Lb_mm: number;       // 側向無支撐長度 (mm)
  Cb: number;          // 側向扭轉修正係數
  deflectionLabel: string;
};

export type StoredColumn = {
  shape: string; sectionLabel: string; gradeLabel: string;
  height: number; K: number; P: number; Mx: number; My: number;
  includeSelfWeight: boolean;
};

export type StoredGrating = {
  gratingLabel: string; span: number; support: string;
  L_over_n: number; P: number; w: number; contactWidth: number;
  gradeLabel: string;
};

export type StoredDeck = {
  deckLabel: string; wwmLabel: string;
  deckFy: number; rebarAs: number; rebarFy: number;
  fc_psi: number; tc: number; density: number; wwmCover: number;
  span: number; support: string; wL: number; wD_add: number;
  L_over_n: number; phi: number;
};

export function readStored<T>(key: string): Partial<T> | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Partial<T>) : null;
  } catch {
    return null;
  }
}

export function writeStored<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota / disabled — silently ignore
  }
}
