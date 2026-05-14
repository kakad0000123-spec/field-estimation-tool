// 容許荷重四模組 + Summary 共用的 localStorage key
// 變更欄位請同步升 versions 後綴，避免讀到舊 schema
export const STORAGE_KEYS = {
  beam: 'allowable.beam.v1',
  column: 'allowable.column.v1',
  grating: 'allowable.grating.v1',
  deck: 'allowable.deck.v1',
} as const;

export type StoredBeam = {
  usage: string; support: string; loadType: string;
  shape: string; sectionLabel: string; gradeLabel: string;
  span: number; includeSelfWeight: boolean; wD_add: number;
  P: number; wL: number; loadFactor: number; deflectionLabel: string;
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
