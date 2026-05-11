import { ComponentType, ComponentData, ColumnData, BeamData, SlabData, WallData, FloorData, FoundationData, EquipFoundData, StairData, OpeningData, ManualRCData, CustomData, SteelMemberData, SteelPlateData } from '../data/types';

const TYPE_LABEL_MAP: Record<ComponentType, string> = {
  column: '柱',
  beam: '梁',
  slab: '樓板',
  wall: '牆',
  floor: '地坪',
  foundation: '基礎',
  equipFound: '設備基礎',
  stair: '樓梯',
  opening: '開口扣除',
  manualRC: '手填',
  custom: '自訂',
  steelMember: '鋼構件',
  steelPlate: '鋼板',
};

function generateAutoLabel(type: ComponentType, existingComponents: ComponentData[]): string {
  const prefix = TYPE_LABEL_MAP[type];
  const sameTypeCount = existingComponents.filter((c) => c.type === type).length;
  return `${prefix}-${sameTypeCount + 1}`;
}

export function createDefaultComponent(caseId: number, type: ComponentType, existingComponents: ComponentData[] = []): ComponentData {
  const base = {
    caseId,
    type,
    label: generateAutoLabel(type, existingComponents),
    note: '',
    createdAt: new Date().toISOString(),
  };

  switch (type) {
    case 'column':
      return { ...base, type: 'column', width: 0, depth: 0, height: 0, quantity: 1, mainBar: '#7 (D22)', mainBarCount: 0, tieBar: '#4 (D13)', tieSpacing: 0, crosstieCount: 0 } as ColumnData;
    case 'beam':
      return { ...base, type: 'beam', width: 0, depth: 0, span: 0, quantity: 1, topBar: '#7 (D22)', topBarCount: 0, bottomBar: '#7 (D22)', bottomBarCount: 0, stirrup: '#4 (D13)', denseSpacing: 0, sparseSpacing: 0, waistBarCount: 0 } as BeamData;
    case 'slab':
      return { ...base, type: 'slab', length: 0, width: 0, thickness: 0, cover: 4, quantity: 1, reinfType: 'rebar', layers: 1, upperBar: '#4 (D13)', upperSpacing: 0, lowerBar: '#4 (D13)', lowerSpacing: 0, wireMesh: '\u03C66@150x150' } as SlabData;
    case 'wall':
      return { ...base, type: 'wall', wallLength: 0, wallHeight: 0, thickness: 0, cover: 4, quantity: 1, vertBar: '#4 (D13)', vertSpacing: 0, horizBar: '#4 (D13)', horizSpacing: 0 } as WallData;
    case 'floor':
      return { ...base, type: 'floor', length: 0, width: 0, thickness: 0, cover: 4, slopeRatio: 0.5, excavDepth: 0, pcThickness: 0, quantity: 1, reinfType: 'rebar', layers: 1, upperBar: '#4 (D13)', upperSpacing: 0, lowerBar: '#4 (D13)', lowerSpacing: 0, wireMesh: '\u03C66@150x150' } as FloorData;
    case 'foundation':
      return { ...base, type: 'foundation', foundLength: 0, foundWidth: 0, foundDepth: 0, burialDepth: 0, slopeRatio: 0.5, pcThickness: 0, workWidth: 30, quantity: 1, bottomBar: '#5 (D16)', barSpacing: 0 } as FoundationData;
    case 'equipFound':
      return { ...base, type: 'equipFound', sizeType: 'small', equipWeight: 0, length: 0, width: 0, depth: 0, burialDepth: 0, slopeRatio: 0.5, workWidth: 30, pcThickness: 0, quantity: 1 } as EquipFoundData;
    case 'stair':
      return { ...base, type: 'stair', stairWidth: 0, steps: 0, riser: 0, tread: 0, slabThick: 0, quantity: 1, mainBar: '#5 (D16)', barSpacing: 0 } as StairData;
    case 'opening':
      return { ...base, type: 'opening', memberType: 'wall', openWidth: 0, openHeight: 0, thickness: 0, originalSpacing: 0, reinfBar: '#4 (D13)', quantity: 1 } as OpeningData;
    case 'manualRC':
      return { ...base, type: 'manualRC', concrete280: 0, concrete210: 0, rebarSD280: 0, rebarSD420: 0, formwork: 0, trowel: 0, wireMesh: 0, pcCushion: 0, excavation: 0, backfill: 0 } as ManualRCData;
    case 'custom':
      return { ...base, type: 'custom', unit: '\u5F0F', customQuantity: 1, unitPrice: 0, description: '' } as CustomData;
    case 'steelMember':
      return { ...base, type: 'steelMember', sectionType: 'H', section: 'H294\u00D7200', grade: 'SN490B', length: 0, quantity: 1, coating: '\u6CB9\u6F06', coatingLength: 0, deductTopArea: false } as SteelMemberData;
    case 'steelPlate':
      return { ...base, type: 'steelPlate', plateType: 'PL', plate: 'PL6', grade: 'SN400B', length: 0, width: 0, quantity: 1, coating: '\u6CB9\u6F06' } as SteelPlateData;
  }
}
