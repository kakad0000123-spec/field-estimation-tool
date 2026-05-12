import { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../store/db';
import { EstimationCase, ComponentData, ComponentType } from '../data/types';
import { COMPONENT_TYPE_LABELS } from '../data/defaults';
import ComponentCard from '../components/ComponentCard';
import SummaryTab from '../components/SummaryTab';
import SettingsTab from '../components/SettingsTab';
import { exportToExcel } from '../export/excelExport';
import { createDefaultComponent } from '../components/componentDefaults';

interface Props {
  caseId: number;
  onBack: () => void;
}

type Tab = 'list' | 'summary' | 'settings';
type SortMode = 'time' | 'type' | 'name';

const TYPE_ORDER: ComponentType[] = [
  'column', 'beam', 'slab', 'wall', 'floor', 'foundation', 'equipFound', 'stair', 'opening', 'steelMember', 'steelPlate', 'manualRC', 'custom',
];

const SUMMARY_TYPE_LABELS: Record<ComponentType, string> = {
  column: '柱',
  beam: '梁',
  slab: '板',
  wall: '牆',
  floor: '地坪',
  foundation: '基礎',
  equipFound: '設備基礎',
  stair: '樓梯',
  opening: '開口',
  manualRC: '手填',
  custom: '自訂',
  steelMember: '鋼構件',
  steelPlate: '鋼板',
};

const TYPE_BADGE_COLORS: Record<ComponentType, string> = {
  column: 'bg-blue-50 text-blue-700',
  beam: 'bg-indigo-50 text-indigo-700',
  slab: 'bg-green-50 text-green-700',
  wall: 'bg-amber-50 text-amber-700',
  floor: 'bg-lime-50 text-lime-700',
  foundation: 'bg-purple-50 text-purple-700',
  equipFound: 'bg-violet-50 text-violet-700',
  stair: 'bg-cyan-50 text-cyan-700',
  opening: 'bg-rose-50 text-rose-700',
  manualRC: 'bg-gray-50 text-gray-700',
  custom: 'bg-orange-50 text-orange-700',
  steelMember: 'bg-slate-100 text-slate-700',
  steelPlate: 'bg-zinc-100 text-zinc-700',
};

const TYPE_BUTTON_COLORS: Record<ComponentType, string> = {
  column: 'bg-blue-50 text-blue-700 border border-blue-100 hover:bg-blue-100',
  beam: 'bg-indigo-50 text-indigo-700 border border-indigo-100 hover:bg-indigo-100',
  slab: 'bg-green-50 text-green-700 border border-green-100 hover:bg-green-100',
  wall: 'bg-amber-50 text-amber-700 border border-amber-100 hover:bg-amber-100',
  floor: 'bg-lime-50 text-lime-700 border border-lime-100 hover:bg-lime-100',
  foundation: 'bg-purple-50 text-purple-700 border border-purple-100 hover:bg-purple-100',
  equipFound: 'bg-violet-50 text-violet-700 border border-violet-100 hover:bg-violet-100',
  stair: 'bg-cyan-50 text-cyan-700 border border-cyan-100 hover:bg-cyan-100',
  opening: 'bg-rose-50 text-rose-700 border border-rose-100 hover:bg-rose-100',
  manualRC: 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200',
  custom: 'bg-orange-50 text-orange-700 border border-orange-100 hover:bg-orange-100',
  steelMember: 'bg-slate-100 text-slate-700 border border-slate-200 hover:bg-slate-200',
  steelPlate: 'bg-zinc-100 text-zinc-700 border border-zinc-200 hover:bg-zinc-200',
};

export default function CaseDetail({ caseId, onBack }: Props) {
  const [caseData, setCaseData] = useState<EstimationCase | null>(null);
  const [components, setComponents] = useState<ComponentData[]>([]);
  const [tab, setTab] = useState<Tab>('list');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('time');

  const load = useCallback(async () => {
    const c = await db.cases.get(caseId);
    if (c) setCaseData(c);
    const comps = await db.components.where('caseId').equals(caseId).sortBy('createdAt');
    setComponents(comps);
  }, [caseId]);

  useEffect(() => { load(); }, [load]);

  const saveCase = useCallback(async (updates: Partial<EstimationCase>) => {
    await db.cases.update(caseId, { ...updates, updatedAt: new Date().toISOString() });
    const c = await db.cases.get(caseId);
    if (c) setCaseData(c);
  }, [caseId]);

  const addComponent = async (type: ComponentType) => {
    const comp = createDefaultComponent(caseId, type, components);
    const id = await db.components.add(comp as ComponentData);
    setShowTypeSelector(false);
    setExpandedId(id as number);
    await load();
  };

  const updateComponent = useCallback(async (id: number, data: Partial<ComponentData>) => {
    await db.components.update(id, data);
    const comps = await db.components.where('caseId').equals(caseId).sortBy('createdAt');
    setComponents(comps);
  }, [caseId]);

  const deleteComponent = async (id: number) => {
    await db.components.delete(id);
    if (expandedId === id) setExpandedId(null);
    await load();
  };

  const duplicateComponent = async (comp: ComponentData) => {
    const { id, ...rest } = comp;
    const newComp = { ...rest, label: comp.label + ' (複製)', createdAt: new Date().toISOString() };
    const newId = await db.components.add(newComp as ComponentData);
    setExpandedId(newId as number);
    await load();
  };

  const handleExport = async () => {
    if (!caseData) return;
    await exportToExcel(caseData, components);
  };

  // Summary stats
  const typeCounts = useMemo(() => {
    const map: Partial<Record<ComponentType, number>> = {};
    for (const c of components) {
      map[c.type] = (map[c.type] || 0) + 1;
    }
    return map;
  }, [components]);

  const summaryText = useMemo(() => {
    const parts: string[] = [];
    for (const t of TYPE_ORDER) {
      const count = typeCounts[t];
      if (count) parts.push(`${SUMMARY_TYPE_LABELS[t]}${count}`);
    }
    return parts.join(' ');
  }, [typeCounts]);

  // Sorted components
  const sortedComponents = useMemo(() => {
    const arr = [...components];
    switch (sortMode) {
      case 'time':
        return arr.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      case 'name':
        return arr.sort((a, b) => (a.label || '').localeCompare(b.label || '', 'zh-Hant'));
      case 'type':
        return arr.sort((a, b) => TYPE_ORDER.indexOf(a.type) - TYPE_ORDER.indexOf(b.type));
    }
  }, [components, sortMode]);

  // Grouped for type sort
  const groupedComponents = useMemo(() => {
    if (sortMode !== 'type') return null;
    const groups: { type: ComponentType; items: ComponentData[] }[] = [];
    let currentType: ComponentType | null = null;
    let currentItems: ComponentData[] = [];
    for (const c of sortedComponents) {
      if (c.type !== currentType) {
        if (currentType !== null) {
          groups.push({ type: currentType, items: currentItems });
        }
        currentType = c.type;
        currentItems = [c];
      } else {
        currentItems.push(c);
      }
    }
    if (currentType !== null) {
      groups.push({ type: currentType, items: currentItems });
    }
    return groups;
  }, [sortedComponents, sortMode]);

  if (!caseData) return null;

  const tabs: { key: Tab; label: string }[] = [
    { key: 'list', label: '構件清單' },
    { key: 'summary', label: '彙總' },
    { key: 'settings', label: '設定' },
  ];

  const rcTypes: { type: ComponentType; label: string }[] = [
    { type: 'column', label: '柱' },
    { type: 'beam', label: '梁' },
    { type: 'slab', label: '樓板' },
    { type: 'wall', label: '牆' },
    { type: 'floor', label: '地坪' },
    { type: 'foundation', label: '基礎' },
    { type: 'equipFound', label: '設備基礎' },
    { type: 'stair', label: '樓梯' },
    { type: 'opening', label: '開口扣除' },
  ];
  const steelTypes: { type: ComponentType; label: string }[] = [
    { type: 'steelMember', label: '鋼構件' },
    { type: 'steelPlate', label: '鋼板/板材' },
  ];
  const otherTypes: { type: ComponentType; label: string }[] = [
    { type: 'manualRC', label: '標準手填' },
    { type: 'custom', label: '自訂項目' },
  ];

  const renderCard = (comp: ComponentData) => (
    <ComponentCard
      key={comp.id}
      comp={comp}
      caseData={caseData}
      expanded={expandedId === comp.id}
      onToggle={() => setExpandedId(expandedId === comp.id ? null : comp.id!)}
      onUpdate={(data) => updateComponent(comp.id!, data)}
      onDelete={() => {
        if (confirm('確定要刪除此構件？')) deleteComponent(comp.id!);
      }}
      onDuplicate={() => duplicateComponent(comp)}
      barLengthM={caseData?.calcSettings?.barLengthM}
      badgeColor={TYPE_BADGE_COLORS[comp.type]}
    />
  );

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-24" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center sticky top-0 z-20">
        <button onClick={onBack} className="mr-3 text-lg text-gray-500 hover:text-gray-800 transition-colors">&larr;</button>
        <h1 className="text-lg font-semibold tracking-tight text-[#1a1a2e] flex-1 truncate">{caseData.name}</h1>
        <button onClick={handleExport} className="ml-2 px-4 py-1.5 bg-[#2563eb] hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-all duration-200">
          匯出
        </button>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 flex sticky top-[52px] z-10">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 py-3 text-center text-sm font-medium transition-all duration-200 ${
              tab === t.key
                ? 'text-[#2563eb] border-b-2 border-[#2563eb]'
                : 'text-[#6b7280] hover:text-[#1a1a2e]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Summary bar + sort (list tab only) */}
      {tab === 'list' && components.length > 0 && (
        <div className="sticky top-[97px] z-[9] bg-[#f8f9fa] border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
          <div className="text-xs text-[#6b7280] truncate flex-1">
            <span className="font-medium text-[#1a1a2e]">共 {components.length} 個</span>
            {summaryText && <span className="ml-1.5 text-[#9ca3af]">{summaryText}</span>}
          </div>
          <select
            value={sortMode}
            onChange={(e) => setSortMode(e.target.value as SortMode)}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 bg-white text-[#6b7280] focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563eb] ml-2"
          >
            <option value="time">依新增時間</option>
            <option value="type">依類型</option>
            <option value="name">依名稱</option>
          </select>
        </div>
      )}

      {/* Tab Content */}
      {tab === 'list' && (
        <div className="p-4 space-y-3">
          {components.length === 0 && (
            <div className="text-center text-[#9ca3af] py-16">
              <div className="text-4xl mb-3 opacity-30">+</div>
              <div className="text-sm">尚無構件，點擊下方按鈕新增</div>
            </div>
          )}

          {sortMode === 'type' && groupedComponents ? (
            groupedComponents.map((group) => (
              <div key={group.type}>
                <div className="flex items-center gap-2 py-2 px-1">
                  <div className="h-px flex-1 bg-gray-200" />
                  <span className="text-xs font-medium text-[#6b7280] whitespace-nowrap">
                    {COMPONENT_TYPE_LABELS[group.type]} ({group.items.length})
                  </span>
                  <div className="h-px flex-1 bg-gray-200" />
                </div>
                <div className="space-y-3">
                  {group.items.map(renderCard)}
                </div>
              </div>
            ))
          ) : (
            sortedComponents.map(renderCard)
          )}
        </div>
      )}

      {tab === 'summary' && (
        <SummaryTab caseData={caseData} components={components} />
      )}

      {tab === 'settings' && (
        <SettingsTab caseData={caseData} onSave={saveCase} />
      )}

      {/* Type Selector Bottom Sheet */}
      {showTypeSelector && (
        <div className="fixed inset-0 z-30 flex items-end">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowTypeSelector(false)} />
          <div className="relative bg-white w-full rounded-t-2xl p-5 pb-8 max-h-[70vh] overflow-y-auto shadow-xl">
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mb-5" />
            <h3 className="font-semibold text-[#1a1a2e] mb-3 text-sm tracking-tight">RC 構件</h3>
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              {rcTypes.map((t) => (
                <button
                  key={t.type}
                  onClick={() => addComponent(t.type)}
                  className={`h-12 rounded-xl font-medium text-sm transition-all duration-200 active:scale-95 ${TYPE_BUTTON_COLORS[t.type]}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <h3 className="font-semibold text-[#1a1a2e] mb-3 text-sm tracking-tight">鋼構</h3>
            <div className="grid grid-cols-3 gap-2.5 mb-5">
              {steelTypes.map((t) => (
                <button
                  key={t.type}
                  onClick={() => addComponent(t.type)}
                  className={`h-12 rounded-xl font-medium text-sm transition-all duration-200 active:scale-95 ${TYPE_BUTTON_COLORS[t.type]}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <h3 className="font-semibold text-[#1a1a2e] mb-3 text-sm tracking-tight">其他</h3>
            <div className="grid grid-cols-3 gap-2.5">
              {otherTypes.map((t) => (
                <button
                  key={t.type}
                  onClick={() => addComponent(t.type)}
                  className={`h-12 rounded-xl font-medium text-sm transition-all duration-200 active:scale-95 ${TYPE_BUTTON_COLORS[t.type]}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add button */}
      {tab === 'list' && !showTypeSelector && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-10">
          <button
            onClick={() => setShowTypeSelector(true)}
            className="h-12 px-8 bg-[#2563eb] hover:bg-blue-700 active:bg-blue-800 text-white text-sm font-semibold rounded-xl shadow-lg transition-all duration-200 active:scale-95"
          >
            + 新增構件
          </button>
        </div>
      )}
    </div>
  );
}
