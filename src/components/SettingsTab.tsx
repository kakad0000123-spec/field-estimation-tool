import { useCallback, useRef } from 'react';
import { EstimationCase, PriceTable, WasteRates, CalcSettings } from '../data/types';

interface Props {
  caseData: EstimationCase;
  onSave: (updates: Partial<EstimationCase>) => void;
}

function PriceField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-[#6b7280] flex-1">{label}</label>
      <input
        type="number"
        inputMode="decimal"
        defaultValue={value}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (timerRef.current) clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => onChange(isNaN(v) ? 0 : v), 500);
        }}
        className="w-28 h-10 px-3 border border-gray-200 rounded-lg text-base text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563eb] transition-all"
      />
    </div>
  );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 ${checked ? 'bg-[#2563eb]' : 'bg-gray-200'}`}
    >
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-200 shadow-sm ${checked ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  );
}

export default function SettingsTab({ caseData, onSave }: Props) {
  const prices = caseData.prices;
  const waste = caseData.wasteRates;

  const updatePrice = useCallback((key: keyof PriceTable, value: number) => {
    onSave({ prices: { ...caseData.prices, [key]: value } });
  }, [caseData.prices, onSave]);

  const updateWaste = useCallback((updates: Partial<WasteRates>) => {
    onSave({ wasteRates: { ...caseData.wasteRates, ...updates } });
  }, [caseData.wasteRates, onSave]);

  return (
    <div className="p-4 space-y-4">
      {/* Case Info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-2.5">
        <h3 className="font-semibold text-[#1a1a2e] text-sm tracking-tight mb-3">案件資訊</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[#6b7280] w-20">工程名稱</label>
          <input
            type="text"
            defaultValue={caseData.name}
            onChange={(e) => {
              const v = e.target.value;
              setTimeout(() => onSave({ name: v }), 500);
            }}
            className="flex-1 h-10 px-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563eb] transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[#6b7280] w-20">區域</label>
          <input
            type="text"
            defaultValue={caseData.company}
            onChange={(e) => {
              const v = e.target.value;
              setTimeout(() => onSave({ company: v }), 500);
            }}
            className="flex-1 h-10 px-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563eb] transition-all"
          />
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[#6b7280] w-20">監工</label>
          <input
            type="text"
            defaultValue={caseData.supervisor}
            onChange={(e) => {
              const v = e.target.value;
              setTimeout(() => onSave({ supervisor: v }), 500);
            }}
            className="flex-1 h-10 px-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563eb] transition-all"
          />
        </div>
      </div>

      {/* Price Table */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-2.5">
        <h3 className="font-semibold text-[#1a1a2e] text-sm tracking-tight mb-3">單價表 (NTD)</h3>
        <PriceField label="混凝土 fc'=280 (/m³)" value={prices.concrete280} onChange={(v) => updatePrice('concrete280', v)} />
        <PriceField label="混凝土 fc'=210 (/m³)" value={prices.concrete210} onChange={(v) => updatePrice('concrete210', v)} />
        <PriceField label="鋼筋 SD280 (/噸)" value={prices.rebarSD280} onChange={(v) => updatePrice('rebarSD280', v)} />
        <PriceField label="鋼筋 SD420 (/噸)" value={prices.rebarSD420} onChange={(v) => updatePrice('rebarSD420', v)} />
        <PriceField label="鋼絲網 (/噸)" value={prices.wireMesh} onChange={(v) => updatePrice('wireMesh', v)} />
        <PriceField label="模板 (/m²)" value={prices.formwork} onChange={(v) => updatePrice('formwork', v)} />
        <PriceField label="粉光 (/m²)" value={prices.trowel} onChange={(v) => updatePrice('trowel', v)} />
        <PriceField label="混凝土 fc'=140 (/m³)" value={prices.pcCushion} onChange={(v) => updatePrice('pcCushion', v)} />
        <PriceField label="開挖 (/m³)" value={prices.excavation} onChange={(v) => updatePrice('excavation', v)} />
        <PriceField label="回填 (/m³)" value={prices.backfill} onChange={(v) => updatePrice('backfill', v)} />
      </div>

      {/* Calc Settings */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-2.5">
        <h3 className="font-semibold text-[#1a1a2e] text-sm tracking-tight mb-3">計算設定</h3>
        <div className="flex items-center gap-2">
          <label className="text-sm text-[#6b7280] flex-1">鋼筋標準料長</label>
          <input
            type="number"
            inputMode="decimal"
            defaultValue={caseData.calcSettings?.barLengthM ?? 6}
            onChange={(e) => {
              const v = parseFloat(e.target.value);
              setTimeout(() => onSave({ calcSettings: { ...(caseData.calcSettings ?? { barLengthM: 6 }), barLengthM: isNaN(v) || v <= 0 ? 6 : v } }), 500);
            }}
            className="w-20 h-10 px-3 border border-gray-200 rounded-lg text-base text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563eb] transition-all"
          />
          <span className="text-sm text-[#9ca3af]">m</span>
        </div>
        <p className="text-xs text-[#9ca3af]">影響搭接次數計算，常見值：6m、9m、12m</p>
      </div>

      {/* Waste Rates */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-4">
        <h3 className="font-semibold text-[#1a1a2e] text-sm tracking-tight mb-1">損耗率</h3>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ToggleSwitch checked={waste.rebarEnabled} onChange={(v) => updateWaste({ rebarEnabled: v })} />
            <span className="text-sm text-[#1a1a2e]">鋼筋損耗</span>
          </div>
          {waste.rebarEnabled && (
            <div className="flex items-center gap-1">
              <input
                type="number"
                inputMode="decimal"
                defaultValue={waste.rebarRate}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setTimeout(() => updateWaste({ rebarRate: isNaN(v) ? 0 : v }), 500);
                }}
                className="w-16 h-8 px-2 border border-gray-200 rounded-lg text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563eb] transition-all"
              />
              <span className="text-sm text-[#9ca3af]">%</span>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ToggleSwitch checked={waste.formworkEnabled} onChange={(v) => updateWaste({ formworkEnabled: v })} />
            <span className="text-sm text-[#1a1a2e]">模板損耗</span>
          </div>
          {waste.formworkEnabled && (
            <div className="flex items-center gap-1">
              <input
                type="number"
                inputMode="decimal"
                defaultValue={waste.formworkRate}
                onChange={(e) => {
                  const v = parseFloat(e.target.value);
                  setTimeout(() => updateWaste({ formworkRate: isNaN(v) ? 0 : v }), 500);
                }}
                className="w-16 h-8 px-2 border border-gray-200 rounded-lg text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563eb] transition-all"
              />
              <span className="text-sm text-[#9ca3af]">%</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
