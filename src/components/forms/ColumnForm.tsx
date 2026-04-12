import { useMemo } from 'react';
import { ColumnData } from '../../data/types';
import { calcColumn } from '../../calc/column';
import { getRebarSpec } from '../../data/rebarSpecs';
import { NumberField, RebarSelect, ResultRow, RebarDetailSection, RebarLine } from '../FormFields';
import { fmt2, fmt1 } from '../format';

interface Props {
  comp: ColumnData;
  onUpdate: (data: Partial<ColumnData>) => void;
  barLengthM?: number;
}

export default function ColumnForm({ comp, onUpdate, barLengthM }: Props) {
  const result = useMemo(() => calcColumn(comp, barLengthM), [comp, barLengthM]);

  const rebarLines = useMemo((): RebarLine[] => {
    const mainSpec = getRebarSpec(comp.mainBar);
    const tieSpec = getRebarSpec(comp.tieBar);
    const lines: RebarLine[] = [];
    if (mainSpec && result.mainBarWt > 0) {
      lines.push({ label: `主筋 ${comp.mainBar} ×${comp.mainBarCount}根`, weight: result.mainBarWt, grade: mainSpec.grade });
    }
    if (tieSpec && result.tieBarWt > 0) {
      lines.push({ label: `箍筋 ${comp.tieBar} @${comp.tieSpacing}cm`, weight: result.tieBarWt, grade: tieSpec.grade });
    }
    if (tieSpec && comp.crosstieCount > 0 && result.crosstieWt > 0) {
      lines.push({ label: `繫筋 ${comp.tieBar} ×${comp.crosstieCount}`, weight: result.crosstieWt, grade: tieSpec.grade });
    }
    return lines;
  }, [comp, result]);

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">尺寸 (cm)</div>
      <NumberField label="寬 B" value={comp.width} onChange={(v) => onUpdate({ width: v })} unit="cm" placeholder="例: 40" />
      <NumberField label="深 D" value={comp.depth} onChange={(v) => onUpdate({ depth: v })} unit="cm" placeholder="例: 40" />
      <NumberField label="高 H" value={comp.height} onChange={(v) => onUpdate({ height: v })} unit="cm" placeholder="例: 350" />
      <NumberField label="數量" value={comp.quantity} onChange={(v) => onUpdate({ quantity: v })} step="1" placeholder="例: 1" />

      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3">配筋</div>
      <RebarSelect label="主筋" value={comp.mainBar} onChange={(v) => onUpdate({ mainBar: v })} />
      <NumberField label="主筋支數" value={comp.mainBarCount} onChange={(v) => onUpdate({ mainBarCount: v })} step="1" placeholder="例: 8" />
      <RebarSelect label="箍筋" value={comp.tieBar} onChange={(v) => onUpdate({ tieBar: v })} />
      <NumberField label="箍筋間距" value={comp.tieSpacing} onChange={(v) => onUpdate({ tieSpacing: v })} unit="cm" placeholder="例: 15" />
      <NumberField label="繫筋支數" value={comp.crosstieCount} onChange={(v) => onUpdate({ crosstieCount: v })} step="1" placeholder="例: 2" />

      <div className="bg-gray-50 rounded-lg p-3 mt-3">
        <div className="text-xs font-semibold text-gray-500 mb-2">計算結果</div>
        <ResultRow label="混凝土 fc'=280" value={`${fmt2(result.concrete)} m³`} highlight />
        <RebarDetailSection lines={rebarLines} sd280Total={result.totalRebarSD280} sd420Total={result.totalRebarSD420} />
        <ResultRow label="模板" value={`${fmt2(result.formwork)} m²`} />
        <ResultRow label="搭接" value={`${result.spliceCount}次 / ${fmt1(result.spliceLength)} m`} />
      </div>
    </div>
  );
}
