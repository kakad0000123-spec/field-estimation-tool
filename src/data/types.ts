// ─── Rebar Specification ───
export interface RebarSpec {
  label: string;
  db: number;
  area: number;
  kgPerM: number;
  dbCm: number;
  grade: 'SD280' | 'SD420';
  fy: number;
  lap40D: number;
  hook12D: number;
}

// ─── Wire Mesh Specification ───
export interface WireMeshSpec {
  label: string;
  kgPerM2: number;
}

// ─── Steel Section (linear: H, I, C, P, L, BOX) ───
export interface SteelSection {
  label: string;       // e.g. 'H294×200'
  type: 'H' | 'I' | 'C' | 'P' | 'L' | 'BOX';
  weight: number;      // kg/m
  surfaceArea: number; // m²/m (for painting)
}

// ─── Steel Plate (PL, CP, GR, DK — by area) ───
export interface SteelPlate {
  label: string;       // e.g. 'PL6'
  type: 'PL' | 'CP' | 'GR' | 'DK';
  weight: number;      // kg/m²
}

// ─── Steel Grade ───
export interface SteelGrade {
  label: string;       // e.g. 'SN490B'
  fy: number;          // 降伏強度 MPa
  fu: number;          // 抗拉強度 MPa
  standard?: string;   // 引用規範，例如 'CNS 13812 建築結構用軋鋼料'
}

// ─── Coating Type ───
export interface CoatingType {
  label: string;       // e.g. '防火漆2hr'
  unitPrice?: number;  // NTD/m²
}

// ─── Default Prices (NTD) ───
export interface PriceTable {
  concrete210: number;
  concrete280: number;
  rebarSD280: number;
  rebarSD420: number;
  formwork: number;
  trowel: number;
  pcCushion: number;
  excavation: number;
  backfill: number;
  wireMesh: number;
}

export interface WasteRates {
  rebarEnabled: boolean;
  rebarRate: number;
  formworkEnabled: boolean;
  formworkRate: number;
}

// ─── Calculation Settings ───
export interface CalcSettings {
  barLengthM: number;  // 鋼筋標準料長 (m)，預設 6
}

// ─── Estimation Case ───
export interface EstimationCase {
  id?: number;
  name: string;
  company: string;
  supervisor: string;
  date: string;
  prices: PriceTable;
  wasteRates: WasteRates;
  calcSettings: CalcSettings;
  createdAt: string;
  updatedAt: string;
}

// ─── Component Types ───
export type ComponentType =
  | 'column'
  | 'beam'
  | 'slab'
  | 'wall'
  | 'floor'
  | 'foundation'
  | 'equipFound'
  | 'stair'
  | 'opening'
  | 'manualRC'
  | 'custom'
  | 'steelMember'
  | 'steelPlate';

export interface BaseComponent {
  id?: number;
  caseId: number;
  type: ComponentType;
  label: string;
  note: string;
  createdAt: string;
}

export interface ColumnData extends BaseComponent {
  type: 'column';
  width: number;
  depth: number;
  height: number;
  quantity: number;
  mainBar: string;
  mainBarCount: number;
  tieBar: string;
  tieSpacing: number;
  crosstieCount: number;
}

export interface BeamData extends BaseComponent {
  type: 'beam';
  width: number;
  depth: number;
  span: number;
  quantity: number;
  topBar: string;
  topBarCount: number;
  bottomBar: string;
  bottomBarCount: number;
  stirrup: string;
  denseSpacing: number;
  sparseSpacing: number;
  waistBarCount: number;
}

export interface SlabData extends BaseComponent {
  type: 'slab';
  length: number;
  width: number;
  thickness: number;
  cover: number;
  quantity: number;
  reinfType: 'rebar' | 'wireMesh';
  layers: 1 | 2;
  upperBar: string;
  upperSpacing: number;
  lowerBar: string;
  lowerSpacing: number;
  wireMesh: string;
}

export interface WallData extends BaseComponent {
  type: 'wall';
  wallLength: number;
  wallHeight: number;
  thickness: number;
  cover: number;
  quantity: number;
  vertBar: string;
  vertSpacing: number;
  horizBar: string;
  horizSpacing: number;
}

export interface FloorData extends BaseComponent {
  type: 'floor';
  length: number;
  width: number;
  thickness: number;
  cover: number;
  slopeRatio: number;
  excavDepth: number;
  pcThickness: number;
  quantity: number;
  reinfType: 'rebar' | 'wireMesh';
  layers: 1 | 2;
  upperBar: string;
  upperSpacing: number;
  lowerBar: string;
  lowerSpacing: number;
  wireMesh: string;
}

export interface FoundationData extends BaseComponent {
  type: 'foundation';
  foundLength: number;
  foundWidth: number;
  foundDepth: number;
  burialDepth: number;
  slopeRatio: number;
  pcThickness: number;
  workWidth: number;
  quantity: number;
  bottomBar: string;
  barSpacing: number;
}

export interface EquipFoundData extends BaseComponent {
  type: 'equipFound';
  sizeType: 'small' | 'large';
  equipWeight: number;
  length: number;
  width: number;
  depth: number;
  burialDepth: number;
  slopeRatio: number;
  workWidth: number;
  pcThickness: number;
  quantity: number;
}

export interface StairData extends BaseComponent {
  type: 'stair';
  stairWidth: number;
  steps: number;
  riser: number;
  tread: number;
  slabThick: number;
  quantity: number;
  mainBar: string;
  barSpacing: number;
}

export interface OpeningData extends BaseComponent {
  type: 'opening';
  memberType: 'slab' | 'wall';
  openWidth: number;
  openHeight: number;
  thickness: number;
  originalSpacing: number;
  reinfBar: string;
  quantity: number;
}

export interface ManualRCData extends BaseComponent {
  type: 'manualRC';
  concrete280: number;
  concrete210: number;
  rebarSD280: number;
  rebarSD420: number;
  formwork: number;
  trowel: number;
  wireMesh: number;
  pcCushion: number;
  excavation: number;
  backfill: number;
}

export interface CustomData extends BaseComponent {
  type: 'custom';
  unit: string;
  customQuantity: number;
  unitPrice: number;
  description: string;
}

// ─── Steel Member (linear: H/I/C/P/L/BOX) ───
export interface SteelMemberData extends BaseComponent {
  type: 'steelMember';
  sectionType: 'H' | 'I' | 'C' | 'P' | 'L' | 'BOX';
  section: string;        // e.g. 'H294×200'
  grade: string;          // e.g. 'SN490B'
  length: number;         // mm
  quantity: number;
  coating: string;        // e.g. '油漆' / '防火漆2hr' / '無'
  coatingLength: number;  // mm, 0 = full length
  deductTopArea: boolean; // 扣梁上面積 (for beam top to deduct slab interface)
}

// ─── Steel Plate (PL/CP/GR/DK by area) ───
export interface SteelPlateData extends BaseComponent {
  type: 'steelPlate';
  plateType: 'PL' | 'CP' | 'GR' | 'DK';
  plate: string;          // e.g. 'PL6'
  grade: string;          // e.g. 'SN400B'
  length: number;         // mm
  width: number;          // mm
  quantity: number;
  coating: string;
}

export type ComponentData =
  | ColumnData
  | BeamData
  | SlabData
  | WallData
  | FloorData
  | FoundationData
  | EquipFoundData
  | StairData
  | OpeningData
  | ManualRCData
  | CustomData
  | SteelMemberData
  | SteelPlateData;

// ─── Calculation Result ───
export interface CalcResult {
  concrete280: number;
  concrete210: number;
  rebarSD280: number;
  rebarSD420: number;
  formwork: number;
  trowel: number;
  wireMesh: number;
  pcCushion: number;
  excavation: number;
  backfill: number;
}

export interface SummaryLine {
  item: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}
