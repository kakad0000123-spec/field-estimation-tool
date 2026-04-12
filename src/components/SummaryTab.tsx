import { useMemo } from 'react';
import { EstimationCase, ComponentData, ComponentType } from '../data/types';
import { aggregateResults, buildSummaryLines } from '../calc/summary';
import { calcEquipFound } from '../calc/equipFound';
import { fmt2, fmtCurrency } from './format';

interface Props {
  caseData: EstimationCase;
  components: ComponentData[];
}

function getSpacingFields(comp: ComponentData): number[] {
  switch (comp.type) {
    case 'column': return [comp.tieSpacing];
    case 'beam': return [comp.denseSpacing, comp.sparseSpacing];
    case 'slab': return comp.reinfType === 'rebar' ? [comp.upperSpacing, comp.lowerSpacing] : [];
    case 'wall': return [comp.vertSpacing, comp.horizSpacing];
    case 'floor': return comp.reinfType === 'rebar' ? [comp.upperSpacing, comp.lowerSpacing] : [];
    case 'foundation': return [comp.barSpacing];
    case 'stair': return [comp.barSpacing];
    case 'opening': return [comp.originalSpacing];
    default: return [];
  }
}

function isAllDimensionsZero(comp: ComponentData): boolean {
  switch (comp.type) {
    case 'column': return comp.width === 0 && comp.depth === 0 && comp.height === 0;
    case 'beam': return comp.width === 0 && comp.depth === 0 && comp.span === 0;
    case 'slab': return comp.length === 0 && comp.width === 0 && comp.thickness === 0;
    case 'wall': return comp.wallLength === 0 && comp.wallHeight === 0 && comp.thickness === 0;
    case 'floor': return comp.length === 0 && comp.width === 0 && comp.thickness === 0;
    case 'foundation': return comp.foundLength === 0 && comp.foundWidth === 0 && comp.foundDepth === 0;
    case 'equipFound': return comp.length === 0 && comp.width === 0 && comp.depth === 0;
    case 'stair': return comp.stairWidth === 0 && comp.steps === 0 && comp.slabThick === 0;
    case 'opening': return comp.openWidth === 0 && comp.openHeight === 0 && comp.thickness === 0;
    default: return false;
  }
}

export default function SummaryTab({ caseData, components }: Props) {
  const barLengthM = caseData.calcSettings?.barLengthM;
  const result = useMemo(() => aggregateResults(components, barLengthM), [components, barLengthM]);
  const lines = useMemo(
    () => buildSummaryLines(result, components, caseData.prices, caseData.wasteRates),
    [result, components, caseData.prices, caseData.wasteRates]
  );
  const grandTotal = useMemo(() => lines.reduce((s, l) => s + l.amount, 0), [lines]);

  // Data summary calculations
  const dataSummary = useMemo(() => {
    const totalConcrete = result.concrete280 + result.concrete210;
    const totalRebar = result.rebarSD280 + result.rebarSD420;
    const totalFormwork = result.formwork;

    const rebarRatio = totalConcrete > 0 ? totalRebar / totalConcrete : 0;
    const formworkRatio = totalConcrete > 0 ? totalFormwork / totalConcrete : 0;
    const sd420Ratio = (result.rebarSD280 + result.rebarSD420) > 0
      ? result.rebarSD420 / (result.rebarSD280 + result.rebarSD420) * 100
      : 0;

    // Opening deduction ratio
    const slabWallConcrete = components
      .filter((c) => c.type === 'slab' || c.type === 'wall')
      .reduce((sum, c) => {
        if (c.type === 'slab') {
          const { length, width, thickness, quantity } = c;
          return sum + (length / 100) * (width / 100) * (thickness / 100) * quantity;
        }
        if (c.type === 'wall') {
          const { wallLength, wallHeight, thickness, quantity } = c;
          return sum + (wallLength / 100) * (wallHeight / 100) * (thickness / 100) * quantity;
        }
        return sum;
      }, 0);

    const openingConcrete = components
      .filter((c) => c.type === 'opening')
      .reduce((sum, c) => {
        if (c.type === 'opening') {
          return sum + (c.openWidth / 100) * (c.openHeight / 100) * (c.thickness / 100) * c.quantity;
        }
        return sum;
      }, 0);

    const openingRatio = slabWallConcrete > 0 ? (openingConcrete / slabWallConcrete) * 100 : 0;

    const backfillExcavRatio = result.excavation > 0 ? result.backfill / result.excavation : 0;

    return { rebarRatio, formworkRatio, sd420Ratio, openingRatio, backfillExcavRatio, totalConcrete };
  }, [result, components]);

  // Logic checks
  const logicChecks = useMemo(() => {
    const checks: { icon: string; message: string; type: 'error' | 'warning' | 'ok' }[] = [];

    // Backfill > excavation
    if (result.backfill > result.excavation && result.excavation > 0) {
      checks.push({ icon: '\u274C', message: '回填量 > 開挖量（物理上不可能）', type: 'error' });
    }

    // Any spacing = 0 (only for components that have been started)
    let zeroSpacingCount = 0;
    for (const comp of components) {
      const spacings = getSpacingFields(comp);
      if (spacings.some((s) => s === 0) && !isAllDimensionsZero(comp)) {
        zeroSpacingCount++;
      }
    }
    if (zeroSpacingCount > 0) {
      checks.push({ icon: '\u274C', message: `${zeroSpacingCount} 個構件筋間距 = 0（計算可能有誤）`, type: 'error' });
    }

    // Unnamed components
    const unnamedCount = components.filter((c) => !c.label.trim()).length;
    if (unnamedCount > 0) {
      checks.push({ icon: '\u26A0\uFE0F', message: `有 ${unnamedCount} 個構件未命名`, type: 'warning' });
    }

    // Components with all dimensions zero
    const emptyCount = components.filter((c) => c.type !== 'manualRC' && c.type !== 'custom' && isAllDimensionsZero(c)).length;
    if (emptyCount > 0) {
      checks.push({ icon: '\u26A0\uFE0F', message: `有 ${emptyCount} 個構件尺寸未填寫`, type: 'warning' });
    }

    // Equipment foundation check
    const equipComps = components.filter((c) => c.type === 'equipFound');
    if (equipComps.length > 0) {
      const allOk = equipComps.every((c) => {
        if (c.type === 'equipFound') {
          const d = calcEquipFound(c);
          return d.check === 'OK';
        }
        return true;
      });
      if (allOk) {
        checks.push({ icon: '\u2705', message: '設備基礎檢核全部 OK', type: 'ok' });
      } else {
        checks.push({ icon: '\u274C', message: '設備基礎檢核有 NG', type: 'error' });
      }
    }

    return checks;
  }, [components, result]);

  return (
    <div className="p-4 space-y-4">
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Header row */}
        <div className="grid grid-cols-12 gap-1 px-3 py-2.5 bg-gray-50 text-xs font-semibold text-[#6b7280] border-b border-gray-100">
          <div className="col-span-4">項目</div>
          <div className="col-span-2 text-right">數量</div>
          <div className="col-span-1 text-center">單位</div>
          <div className="col-span-2 text-right">單價</div>
          <div className="col-span-3 text-right">金額</div>
        </div>

        {lines.length === 0 && (
          <div className="text-center text-[#9ca3af] py-8 text-sm">
            尚無計算結果
          </div>
        )}

        {lines.map((line, i) => (
          <div key={i} className={`grid grid-cols-12 gap-1 px-3 py-2.5 text-sm ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
            <div className="col-span-4 text-[#1a1a2e] truncate">{line.item}</div>
            <div className="col-span-2 text-right text-[#1a1a2e] tabular-nums">{fmt2(line.quantity)}</div>
            <div className="col-span-1 text-center text-[#9ca3af]">{line.unit}</div>
            <div className="col-span-2 text-right text-[#6b7280] tabular-nums">{fmtCurrency(line.unitPrice)}</div>
            <div className="col-span-3 text-right text-[#1a1a2e] font-medium tabular-nums">{fmtCurrency(line.amount)}</div>
          </div>
        ))}

        {/* Grand total */}
        <div className="grid grid-cols-12 gap-1 px-3 py-3 border-t-2 border-[#2563eb] bg-blue-50">
          <div className="col-span-9 font-semibold text-[#2563eb]">合計</div>
          <div className="col-span-3 text-right font-bold text-[#2563eb] text-base tabular-nums">
            ${fmtCurrency(grandTotal)}
          </div>
        </div>
      </div>

      {/* Waste rate notes */}
      {(caseData.wasteRates.rebarEnabled || caseData.wasteRates.formworkEnabled) && (
        <div className="text-xs text-[#9ca3af]">
          {caseData.wasteRates.rebarEnabled && <div>* 鋼筋已加計 {caseData.wasteRates.rebarRate}% 損耗</div>}
          {caseData.wasteRates.formworkEnabled && <div>* 模板已加計 {caseData.wasteRates.formworkRate}% 損耗</div>}
        </div>
      )}

      {/* Data Summary */}
      {components.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 space-y-3">
          <h3 className="font-semibold text-[#1a1a2e] text-sm tracking-tight">數據摘要</h3>

          <div className="space-y-2">
            {dataSummary.totalConcrete > 0 && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6b7280]">鋼筋量比</span>
                  <span className="text-[#1a1a2e] font-medium tabular-nums">{fmt2(dataSummary.rebarRatio)} kg/m&#179;</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-[#6b7280]">模板量比</span>
                  <span className="text-[#1a1a2e] font-medium tabular-nums">{fmt2(dataSummary.formworkRatio)} m&#178;/m&#179;</span>
                </div>
              </>
            )}
            {(result.rebarSD280 + result.rebarSD420) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#6b7280]">SD420 佔比</span>
                <span className="text-[#1a1a2e] font-medium tabular-nums">{fmt2(dataSummary.sd420Ratio)}%</span>
              </div>
            )}
            {dataSummary.openingRatio > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#6b7280]">開口扣除比</span>
                <span className="text-[#1a1a2e] font-medium tabular-nums">{fmt2(dataSummary.openingRatio)}%</span>
              </div>
            )}
            {result.excavation > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-[#6b7280]">回填/開挖比</span>
                <span className="text-[#1a1a2e] font-medium tabular-nums">{fmt2(dataSummary.backfillExcavRatio)}</span>
              </div>
            )}
          </div>

          {/* Logic checks */}
          {logicChecks.length > 0 && (
            <div className="border-t border-gray-100 pt-3 mt-3 space-y-1.5">
              {logicChecks.map((check, i) => (
                <div key={i} className={`text-sm flex items-start gap-2 ${
                  check.type === 'error' ? 'text-red-600' :
                  check.type === 'warning' ? 'text-amber-600' :
                  'text-emerald-600'
                }`}>
                  <span className="flex-shrink-0">{check.icon}</span>
                  <span>{check.message}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
