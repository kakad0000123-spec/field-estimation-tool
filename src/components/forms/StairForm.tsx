import { useMemo } from 'react';
import { StairData } from '../../data/types';
import { calcStair } from '../../calc/stair';
import { getRebarSpec } from '../../data/rebarSpecs';
import { NumberField, RebarSelect, ResultRow, RebarDetailSection, RebarLine } from '../FormFields';
import { fmt2, fmt1 } from '../format';

interface Props {
  comp: StairData;
  onUpdate: (data: Partial<StairData>) => void;
  barLengthM?: number;
}

export default function StairForm({ comp, onUpdate, barLengthM }: Props) {
  const result = useMemo(() => calcStair(comp, barLengthM), [comp, barLengthM]);

  const rebarLines = useMemo((): RebarLine[] => {
    const mainSpec = getRebarSpec(comp.mainBar);
    const lines: RebarLine[] = [];
    if (mainSpec && result.mainBarWt > 0) {
      lines.push({ label: `主筋 ${comp.mainBar} @${comp.barSpacing}cm`, weight: result.mainBarWt, grade: mainSpec.grade });
    }
    if (result.distBarWt > 0) {
      lines.push({ label: `分佈筋 #3 (D10) @20cm`, weight: result.distBarWt, grade: 'SD280' });
    }
    return lines;
  }, [comp, result]);

  return (
    <div className="space-y-2">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">尺寸 (cm)</div>
      <NumberField label="梯寬" value={comp.stairWidth} onChange={(v) => onUpdate({ stairWidth: v })} unit="cm" placeholder="例: 120" />
      <NumberField label="階數" value={comp.steps} onChange={(v) => onUpdate({ steps: v })} step="1" placeholder="例: 12" />
      <NumberField label="級高" value={comp.riser} onChange={(v) => onUpdate({ riser: v })} unit="cm" placeholder="例: 17" />
      <NumberField label="級深" value={comp.tread} onChange={(v) => onUpdate({ tread: v })} unit="cm" placeholder="例: 25" />
      <NumberField label="板厚" value={comp.slabThick} onChange={(v) => onUpdate({ slabThick: v })} unit="cm" placeholder="例: 15" />
      <NumberField label="數量" value={comp.quantity} onChange={(v) => onUpdate({ quantity: v })} step="1" placeholder="例: 1" />

      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3">配筋</div>
      <RebarSelect label="主筋" value={comp.mainBar} onChange={(v) => onUpdate({ mainBar: v })} />
      <NumberField label="主筋間距" value={comp.barSpacing} onChange={(v) => onUpdate({ barSpacing: v })} unit="cm" placeholder="例: 15" />

      <div className="bg-gray-50 rounded-lg p-3 mt-3">
        <div className="text-xs font-semibold text-gray-500 mb-2">計算結果</div>
        <ResultRow label="斜長" value={`${fmt2(result.diagonalLength)} m`} />
        <ResultRow label="混凝土 fc'=280" value={`${fmt2(result.concrete)} m³`} highlight />
        <RebarDetailSection lines={rebarLines} sd280Total={result.totalRebarSD280} sd420Total={result.totalRebarSD420} />
        {result.spliceCount > 0 && (
          <ResultRow label="搭接" value={`${result.spliceCount}次 / ${fmt1(result.spliceLength)} m`} />
        )}
        <ResultRow label="模板" value={`${fmt2(result.formwork)} m²`} />
        <ResultRow label="粉光" value={`${fmt2(result.trowel)} m²`} />
      </div>
    </div>
  );
}
