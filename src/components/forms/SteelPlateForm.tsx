import { useMemo } from 'react';
import { SteelPlateData } from '../../data/types';
import { calcSteelPlate } from '../../calc/steelMember';
import { STEEL_PLATES, STEEL_TYPE_LABELS, getSteelPlate } from '../../data/steelSections';
import { STEEL_GRADE_LABELS } from '../../data/steelGrades';
import { COATING_LABELS } from '../../data/coatingTypes';
import { NumberField, SelectField, ResultRow, SectionHeader } from '../FormFields';
import { fmt2, fmt1 } from '../format';

interface Props {
  comp: SteelPlateData;
  onUpdate: (data: Partial<SteelPlateData>) => void;
}

const PLATE_TYPES = ['PL', 'CP', 'GR', 'DK'] as const;

export default function SteelPlateForm({ comp, onUpdate }: Props) {
  const result = useMemo(() => calcSteelPlate(comp), [comp]);
  const plateSpec = useMemo(() => getSteelPlate(comp.plate), [comp.plate]);

  const availablePlates = useMemo(
    () => STEEL_PLATES.filter((p) => p.type === comp.plateType),
    [comp.plateType],
  );

  const handleTypeChange = (newType: string) => {
    const t = newType as SteelPlateData['plateType'];
    const firstPlate = STEEL_PLATES.find((p) => p.type === t);
    onUpdate({
      plateType: t,
      plate: firstPlate?.label ?? '',
    });
  };

  return (
    <div className="space-y-2">
      <SectionHeader icon="🏗️" title="鋼板規格" />
      <SelectField
        label="板類型"
        value={comp.plateType}
        onChange={handleTypeChange}
        options={PLATE_TYPES.map((t) => ({ value: t, label: `${t} - ${STEEL_TYPE_LABELS[t] ?? t}` }))}
      />
      <SelectField
        label="厚度/規格"
        value={comp.plate}
        onChange={(v) => onUpdate({ plate: v })}
        options={availablePlates.map((p) => ({ value: p.label, label: p.label }))}
      />
      {plateSpec && (
        <div className="ml-26 -mt-1 mb-2 text-xs text-[#6b7280] tabular-nums">
          單位重 <span className="font-semibold text-[#1a1a2e]">{plateSpec.weight}</span> kg/m²
        </div>
      )}
      <SelectField
        label="材質"
        value={comp.grade}
        onChange={(v) => onUpdate({ grade: v })}
        options={STEEL_GRADE_LABELS.map((g) => ({ value: g, label: g }))}
      />

      <SectionHeader icon="📏" title="尺寸與數量" className="mt-3" />
      <NumberField label="長" value={comp.length} onChange={(v) => onUpdate({ length: v })} unit="mm" placeholder="例: 2000" />
      <NumberField label="寬" value={comp.width} onChange={(v) => onUpdate({ width: v })} unit="mm" placeholder="例: 1000" />
      <NumberField label="數量" value={comp.quantity} onChange={(v) => onUpdate({ quantity: v })} step="1" placeholder="例: 1" />

      <SectionHeader icon="🎨" title="塗裝" className="mt-3" />
      <SelectField
        label="塗裝類型"
        value={comp.coating}
        onChange={(v) => onUpdate({ coating: v })}
        options={COATING_LABELS.map((c) => ({ value: c, label: c }))}
      />

      <div className="bg-gray-50 rounded-lg p-3 mt-3">
        <SectionHeader icon="📊" title="計算結果" variant="inside" />
        <ResultRow label="總面積" value={`${fmt2(result.totalArea)} m²`} />
        <ResultRow label="總重量" value={`${fmt1(result.totalWeight)} kg`} highlight />
        {result.paintArea > 0 && (
          <ResultRow label={`${comp.coating} 面積 (雙面)`} value={`${fmt2(result.paintArea)} m²`} />
        )}
      </div>
    </div>
  );
}
