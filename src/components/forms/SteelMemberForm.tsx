import { useMemo } from 'react';
import { SteelMemberData } from '../../data/types';
import { calcSteelMember } from '../../calc/steelMember';
import { STEEL_SECTIONS, STEEL_TYPE_LABELS, getSteelSection } from '../../data/steelSections';
import { STEEL_GRADE_LABELS } from '../../data/steelGrades';
import { COATING_LABELS } from '../../data/coatingTypes';
import { NumberField, SelectField, ResultRow, SectionHeader } from '../FormFields';
import { fmt2, fmt1 } from '../format';

interface Props {
  comp: SteelMemberData;
  onUpdate: (data: Partial<SteelMemberData>) => void;
}

const SECTION_TYPES = ['H', 'I', 'C', 'P', 'L', 'BOX'] as const;

export default function SteelMemberForm({ comp, onUpdate }: Props) {
  const result = useMemo(() => calcSteelMember(comp), [comp]);
  const sectionSpec = useMemo(() => getSteelSection(comp.section), [comp.section]);

  // Filter sections matching current section type
  const availableSections = useMemo(
    () => STEEL_SECTIONS.filter((s) => s.type === comp.sectionType),
    [comp.sectionType],
  );

  const handleTypeChange = (newType: string) => {
    const t = newType as SteelMemberData['sectionType'];
    const firstSection = STEEL_SECTIONS.find((s) => s.type === t);
    onUpdate({
      sectionType: t,
      section: firstSection?.label ?? '',
    });
  };

  return (
    <div className="space-y-2">
      <SectionHeader icon="🏗️" title="斷面選擇" />
      <SelectField
        label="斷面類型"
        value={comp.sectionType}
        onChange={handleTypeChange}
        options={SECTION_TYPES.map((t) => ({ value: t, label: `${t} - ${STEEL_TYPE_LABELS[t] ?? t}` }))}
      />
      <SelectField
        label="尺寸規格"
        value={comp.section}
        onChange={(v) => onUpdate({ section: v })}
        options={availableSections.map((s) => ({ value: s.label, label: s.label }))}
      />
      {sectionSpec && (
        <div className="ml-26 -mt-1 mb-2 flex gap-3 text-xs text-[#6b7280] tabular-nums">
          <span>單位重 <span className="font-semibold text-[#1a1a2e]">{sectionSpec.weight}</span> kg/m</span>
          <span>表面積 <span className="font-semibold text-[#1a1a2e]">{sectionSpec.surfaceArea}</span> m²/m</span>
        </div>
      )}
      <SelectField
        label="材質"
        value={comp.grade}
        onChange={(v) => onUpdate({ grade: v })}
        options={STEEL_GRADE_LABELS.map((g) => ({ value: g, label: g }))}
      />

      <SectionHeader icon="📏" title="尺寸與數量" className="mt-3" />
      <NumberField label="長度" value={comp.length} onChange={(v) => onUpdate({ length: v })} unit="mm" placeholder="例: 7500" />
      <NumberField label="數量" value={comp.quantity} onChange={(v) => onUpdate({ quantity: v })} step="1" placeholder="例: 2" />

      <SectionHeader icon="🎨" title="塗裝" className="mt-3" />
      <SelectField
        label="塗裝類型"
        value={comp.coating}
        onChange={(v) => onUpdate({ coating: v })}
        options={COATING_LABELS.map((c) => ({ value: c, label: c }))}
      />
      <NumberField label="塗裝長度" value={comp.coatingLength} onChange={(v) => onUpdate({ coatingLength: v })} unit="mm" placeholder="0=全塗" />
      <SelectField
        label="扣梁上面積"
        value={comp.deductTopArea ? 'yes' : 'no'}
        onChange={(v) => onUpdate({ deductTopArea: v === 'yes' })}
        options={[{ value: 'no', label: '否' }, { value: 'yes', label: '是（梁頂接版）' }]}
      />

      <div className="bg-gray-50 rounded-lg p-3 mt-3">
        <SectionHeader icon="📊" title="計算結果" variant="inside" />
        <ResultRow label="總長度" value={`${fmt2(result.totalLength)} m`} />
        <ResultRow label="總重量" value={`${fmt1(result.totalWeight)} kg`} highlight />
        {result.paintArea > 0 && (
          <ResultRow label={`${comp.coating} 面積`} value={`${fmt2(result.paintArea)} m²`} />
        )}
      </div>
    </div>
  );
}
