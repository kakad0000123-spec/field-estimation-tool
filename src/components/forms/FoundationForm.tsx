import { useMemo } from 'react';
import { FoundationData } from '../../data/types';
import { calcFoundation } from '../../calc/foundation';
import { getRebarSpec } from '../../data/rebarSpecs';
import { NumberField, RebarSelect, ResultRow, RebarDetailSection, RebarLine, SectionHeader } from '../FormFields';
import { fmt2, fmt1 } from '../format';

interface Props {
  comp: FoundationData;
  onUpdate: (data: Partial<FoundationData>) => void;
  barLengthM?: number;
}

export default function FoundationForm({ comp, onUpdate, barLengthM }: Props) {
  const result = useMemo(() => calcFoundation(comp, barLengthM), [comp, barLengthM]);

  const rebarLines = useMemo((): RebarLine[] => {
    const barSpec = getRebarSpec(comp.bottomBar);
    const lines: RebarLine[] = [];
    if (barSpec && result.rebarWt > 0) {
      lines.push({ label: `底筋 ${comp.bottomBar} @${comp.barSpacing}cm`, weight: result.rebarWt, grade: barSpec.grade });
    }
    return lines;
  }, [comp, result]);

  return (
    <div className="space-y-2">
      <SectionHeader icon="📐" title="尺寸 (cm)" />
      <NumberField label="長 L" value={comp.foundLength} onChange={(v) => onUpdate({ foundLength: v })} unit="cm" placeholder="例: 150" />
      <NumberField label="寬 B" value={comp.foundWidth} onChange={(v) => onUpdate({ foundWidth: v })} unit="cm" placeholder="例: 150" />
      <NumberField label="深 D" value={comp.foundDepth} onChange={(v) => onUpdate({ foundDepth: v })} unit="cm" placeholder="例: 50" />
      <NumberField label="埋入深度" value={comp.burialDepth ?? 0} onChange={(v) => onUpdate({ burialDepth: v })} unit="cm" placeholder="0=全部埋入" />
      <NumberField label="開挖坡比" value={comp.slopeRatio ?? 0.5} onChange={(v) => onUpdate({ slopeRatio: v })} placeholder="例:0.5" />
      <NumberField label="PC厚" value={comp.pcThickness} onChange={(v) => onUpdate({ pcThickness: v })} unit="cm" placeholder="例: 5" />
      <NumberField label="工作寬" value={comp.workWidth} onChange={(v) => onUpdate({ workWidth: v })} unit="cm" placeholder="例: 30" />
      {result.suggestedWorkWidth !== null && comp.workWidth !== result.suggestedWorkWidth && (
        <div className="text-xs text-orange-600 ml-22 pl-1">建議工作寬: {result.suggestedWorkWidth} cm</div>
      )}
      <NumberField label="數量" value={comp.quantity} onChange={(v) => onUpdate({ quantity: v })} step="1" placeholder="例: 1" />

      <SectionHeader icon="🔩" title="配筋" className="mt-3" />
      <RebarSelect label="底筋" value={comp.bottomBar} onChange={(v) => onUpdate({ bottomBar: v })} />
      <NumberField label="筋間距" value={comp.barSpacing} onChange={(v) => onUpdate({ barSpacing: v })} unit="cm" placeholder="例: 15" />

      <div className="bg-gray-50 rounded-lg p-3 mt-3">
        <SectionHeader icon="📊" title="計算結果" variant="inside" />
        <ResultRow label="開挖" value={`${fmt2(result.excavation)} m³`} />
        <ResultRow label="混凝土 fc'=140" value={`${fmt2(result.pc)} m³`} />
        <ResultRow label="混凝土 fc'=280" value={`${fmt2(result.concrete)} m³`} highlight />
        <ResultRow label="回填" value={`${fmt2(result.backfill)} m³`} />
        <RebarDetailSection lines={rebarLines} sd280Total={result.totalRebarSD280} sd420Total={result.totalRebarSD420} />
        {result.spliceCount > 0 && (
          <ResultRow label="搭接" value={`${result.spliceCount}次 / ${fmt1(result.spliceLength)} m`} />
        )}
        <ResultRow label="模板" value={`${fmt2(result.formwork)} m²`} />
      </div>
    </div>
  );
}
