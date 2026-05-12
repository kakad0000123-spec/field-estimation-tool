import { PriceTable, WasteRates, CalcSettings } from './types';

export const DEFAULT_PRICES: PriceTable = {
  concrete210: 2800,
  concrete280: 3500,
  rebarSD280: 26000,
  rebarSD420: 28000,
  formwork: 450,
  trowel: 250,
  pcCushion: 2500,
  excavation: 180,
  backfill: 150,
  wireMesh: 35000,
};

export const DEFAULT_WASTE_RATES: WasteRates = {
  rebarEnabled: false,
  rebarRate: 3,
  formworkEnabled: false,
  formworkRate: 5,
};

export const DEFAULT_CALC_SETTINGS: CalcSettings = {
  barLengthM: 6,  // 鋼筋標準料長 6m
};

/** Standard bar length in meters for splice calculations - fallback */
export const BAR_LENGTH_M = 6;

/** Component type labels in Chinese */
export const COMPONENT_TYPE_LABELS: Record<string, string> = {
  column: 'RC\u67F1',
  beam: 'RC\u6A11',
  slab: '\u6A13\u677F',
  wall: '\u7246',
  floor: '\u5730\u576A',
  foundation: '\u57FA\u790E',
  equipFound: '\u8A2D\u5099\u57FA\u790E',
  stair: '\u6A13\u68AF',
  opening: '\u958B\u53E3\u6263\u9664',
  manualRC: '\u624B\u586B',
  custom: '\u81EA\u8A02',
  steelMember: '\u92FC\u69CB\u4EF6',
  steelPlate: '\u92FC\u677F',
};
