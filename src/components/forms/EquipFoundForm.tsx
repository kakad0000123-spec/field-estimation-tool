import { useMemo } from 'react';
import { EquipFoundData } from '../../data/types';
import { calcEquipFound } from '../../calc/equipFound';
import { NumberField, SelectField, ResultRow, RebarDetailSection, RebarLine } from '../FormFields';
import { fmt2, fmt1 } from '../format';

interface Props {
  comp: EquipFoundData;
  onUpdate: (data: Partial<EquipFoundData>) => void;
}

export default function EquipFoundForm({ comp, onUpdate }: Props) {
  const result = useMemo(() => calcEquipFound(comp), [comp]);

  const rebarLines = useMemo((): RebarLine[] => {
    const lines: RebarLine[] = [];
    if (result.rebarWt > 0) {
      lines.push({ label: `鋼筋(經驗值 80kg/m³)`, weight: result.rebarWt, grade: 'SD420' });
    }
    return lines;
  }, [result]);

  return (
    <div className="space-y-2">
      <SelectField
        label="類型"
        value={comp.sizeType}
        onChange={(v) => onUpdate({ sizeType: v as 'small' | 'large' })}
        options={[{ value: 'small', label: '小型 (3倍)' }, { value: 'large', label: '大型 (5倍)' }]}
      />
      <NumberField label="設備重" value={comp.equipWeight} onChange={(v) => onUpdate({ equipWeight: v })} unit="kg" placeholder="例: 500" />

      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mt-3">尺寸 (cm)</div>
      <NumberField label="長" value={comp.length} onChange={(v) => onUpdate({ length: v })} unit="cm" placeholder="例: 120" />
      <NumberField label="寬" value={comp.width} onChange={(v) => onUpdate({ width: v })} unit="cm" placeholder="例: 80" />
      <NumberField label="深 D" value={comp.depth} onChange={(v) => onUpdate({ depth: v })} unit="cm" placeholder="例: 40" />
      <NumberField label="埋入深度" value={comp.burialDepth ?? 0} onChange={(v) => onUpdate({ burialDepth: v })} unit="cm" placeholder="0=依類型自動" />
      <NumberField label="開挖坡比" value={comp.slopeRatio ?? 0.5} onChange={(v) => onUpdate({ slopeRatio: v })} placeholder="例:0.5" />
      <NumberField label="工作寬" value={comp.workWidth} onChange={(v) => onUpdate({ workWidth: v })} unit="cm" placeholder="例: 30" />
      <NumberField label="PC厚" value={comp.pcThickness} onChange={(v) => onUpdate({ pcThickness: v })} unit="cm" placeholder="例: 5" />
      <NumberField label="數量" value={comp.quantity} onChange={(v) => onUpdate({ quantity: v })} step="1" placeholder="例: 1" />

      <div className="bg-gray-50 rounded-lg p-3 mt-3">
        <div className="text-xs font-semibold text-gray-500 mb-2">計算結果</div>
        <ResultRow label="開挖" value={`${fmt2(result.excavation)} m³`} />
        <ResultRow label="混凝土 fc'=140" value={`${fmt2(result.pc)} m³`} />
        <ResultRow label="混凝土 fc'=280" value={`${fmt2(result.concrete)} m³`} highlight />
        <ResultRow label="回填" value={`${fmt2(result.backfill)} m³`} />
        <RebarDetailSection lines={rebarLines} sd280Total={0} sd420Total={result.rebarWt} />
        {result.wireMeshWt > 0 && <ResultRow label="鋼絲網" value={`${fmt1(result.wireMeshWt)} kg`} />}
        <ResultRow
          label="重量檢核"
          value={`${result.check} (基礎${fmt1(result.foundWeight)}kg / 需求${fmt1(result.requiredWeight)}kg)`}
          highlight
        />
        <ResultRow label="模板" value={`${fmt2(result.formwork)} m²`} />
        <ResultRow label="粉光" value={`${fmt2(result.trowel)} m²`} />
      </div>
    </div>
  );
}
