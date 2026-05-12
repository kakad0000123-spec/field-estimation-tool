import { useMemo } from 'react';
import { OpeningData } from '../../data/types';
import { calcOpening } from '../../calc/opening';
import { getRebarSpec } from '../../data/rebarSpecs';
import { NumberField, RebarSelect, SelectField, ResultRow, RebarDetailSection, RebarLine, SectionHeader } from '../FormFields';
import { fmt2, fmt1 } from '../format';

interface Props {
  comp: OpeningData;
  onUpdate: (data: Partial<OpeningData>) => void;
  barLengthM?: number;
}

export default function OpeningForm({ comp, onUpdate, barLengthM }: Props) {
  const result = useMemo(() => calcOpening(comp, barLengthM), [comp, barLengthM]);

  const rebarLines = useMemo((): RebarLine[] => {
    const spec = getRebarSpec(comp.reinfBar);
    if (!spec) return [];
    const lines: RebarLine[] = [];
    if (result.vertReinf > 0) {
      lines.push({ label: `豎向補強 ${comp.reinfBar}`, weight: result.vertReinf, grade: spec.grade });
    }
    if (result.horizReinf > 0) {
      lines.push({ label: `橫向補強 ${comp.reinfBar}`, weight: result.horizReinf, grade: spec.grade });
    }
    if (result.diagReinf > 0) {
      lines.push({ label: `斜向補強 ${comp.reinfBar}`, weight: result.diagReinf, grade: spec.grade });
    }
    return lines;
  }, [comp, result]);

  return (
    <div className="space-y-2">
      <SelectField
        label="構件類型"
        value={comp.memberType}
        onChange={(v) => onUpdate({ memberType: v as 'slab' | 'wall' })}
        options={[{ value: 'wall', label: '牆' }, { value: 'slab', label: '樓板' }]}
      />

      <SectionHeader icon="📐" title="尺寸 (cm)" className="mt-3" />
      <NumberField label="開口寬" value={comp.openWidth} onChange={(v) => onUpdate({ openWidth: v })} unit="cm" placeholder="例: 100" />
      <NumberField label="開口高" value={comp.openHeight} onChange={(v) => onUpdate({ openHeight: v })} unit="cm" placeholder="例: 210" />
      <NumberField label="構件厚" value={comp.thickness} onChange={(v) => onUpdate({ thickness: v })} unit="cm" placeholder="例: 20" />
      <NumberField label="原間距" value={comp.originalSpacing} onChange={(v) => onUpdate({ originalSpacing: v })} unit="cm" placeholder="例: 20" />
      <NumberField label="數量" value={comp.quantity} onChange={(v) => onUpdate({ quantity: v })} step="1" placeholder="例: 1" />

      <SectionHeader icon="🔩" title="補強筋" className="mt-3" />
      <RebarSelect label="補強筋" value={comp.reinfBar} onChange={(v) => onUpdate({ reinfBar: v })} />

      <div className="bg-gray-50 rounded-lg p-3 mt-3">
        <SectionHeader icon="📊" title="扣除/補強結果" variant="inside" />
        <ResultRow label="扣除混凝土 fc'=280" value={`-${fmt2(result.deductConcrete)} m³`} highlight />
        <ResultRow label="扣除模板" value={`-${fmt2(result.deductFormwork)} m²`} />
        <RebarDetailSection lines={rebarLines} sd280Total={result.totalRebarSD280} sd420Total={result.totalRebarSD420} />
        {result.spliceCount > 0 && (
          <ResultRow label="搭接" value={`${result.spliceCount}次 / ${fmt1(result.spliceLength)} m`} />
        )}
      </div>
    </div>
  );
}
