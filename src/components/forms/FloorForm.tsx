import { useMemo } from 'react';
import { FloorData } from '../../data/types';
import { calcFloor } from '../../calc/floor';
import { getRebarSpec } from '../../data/rebarSpecs';
import { NumberField, RebarSelect, WireMeshSelect, SelectField, ResultRow, RebarDetailSection, RebarLine, SectionHeader } from '../FormFields';
import { fmt2, fmt1 } from '../format';

interface Props {
  comp: FloorData;
  onUpdate: (data: Partial<FloorData>) => void;
  barLengthM?: number;
}

export default function FloorForm({ comp, onUpdate, barLengthM }: Props) {
  const result = useMemo(() => calcFloor(comp, barLengthM), [comp, barLengthM]);

  const rebarLines = useMemo((): RebarLine[] => {
    if (comp.reinfType !== 'rebar') return [];
    const lines: RebarLine[] = [];
    if (comp.layers === 2) {
      const upperSpec = getRebarSpec(comp.upperBar);
      if (upperSpec && result.upperBarWt > 0) {
        lines.push({ label: `上層筋 ${comp.upperBar} @${comp.upperSpacing}cm`, weight: result.upperBarWt, grade: upperSpec.grade });
      }
    }
    const lowerSpec = getRebarSpec(comp.lowerBar);
    if (lowerSpec && result.lowerBarWt > 0) {
      lines.push({ label: `下層筋 ${comp.lowerBar} @${comp.lowerSpacing}cm`, weight: result.lowerBarWt, grade: lowerSpec.grade });
    }
    return lines;
  }, [comp, result]);

  return (
    <div className="space-y-2">
      <SectionHeader icon="📐" title="尺寸 (cm)" />
      <NumberField label="長" value={comp.length} onChange={(v) => onUpdate({ length: v })} unit="cm" placeholder="例: 500" />
      <NumberField label="寬" value={comp.width} onChange={(v) => onUpdate({ width: v })} unit="cm" placeholder="例: 400" />
      <NumberField label="厚" value={comp.thickness} onChange={(v) => onUpdate({ thickness: v })} unit="cm" placeholder="例: 15" />
      <NumberField label="保護層" value={comp.cover} onChange={(v) => onUpdate({ cover: v })} unit="cm" placeholder="預設: 4" />
      <NumberField label="開挖深" value={comp.excavDepth} onChange={(v) => onUpdate({ excavDepth: v })} unit="cm" placeholder="例: 30" />
      <NumberField label="開挖坡比" value={comp.slopeRatio ?? 0.5} onChange={(v) => onUpdate({ slopeRatio: v })} placeholder="例:0.5" />
      <NumberField label="PC厚" value={comp.pcThickness} onChange={(v) => onUpdate({ pcThickness: v })} unit="cm" placeholder="例: 5" />
      <NumberField label="數量" value={comp.quantity} onChange={(v) => onUpdate({ quantity: v })} step="1" placeholder="例: 1" />

      <SectionHeader icon="🔩" title="配筋" className="mt-3" />
      <SelectField
        label="配筋方式"
        value={comp.reinfType}
        onChange={(v) => onUpdate({ reinfType: v as 'rebar' | 'wireMesh' })}
        options={[{ value: 'rebar', label: '鋼筋' }, { value: 'wireMesh', label: '鋼絲網' }]}
      />

      {comp.reinfType === 'rebar' && (
        <>
          <SelectField
            label="配筋層數"
            value={String(comp.layers)}
            onChange={(v) => onUpdate({ layers: Number(v) as 1 | 2 })}
            options={[{ value: '1', label: '單層' }, { value: '2', label: '雙層' }]}
          />
          {comp.layers === 2 && (
            <>
              <RebarSelect label="上層筋" value={comp.upperBar} onChange={(v) => onUpdate({ upperBar: v })} />
              <NumberField label="上層間距" value={comp.upperSpacing} onChange={(v) => onUpdate({ upperSpacing: v })} unit="cm" placeholder="例: 15" />
            </>
          )}
          <RebarSelect label="下層筋" value={comp.lowerBar} onChange={(v) => onUpdate({ lowerBar: v })} />
          <NumberField label="下層間距" value={comp.lowerSpacing} onChange={(v) => onUpdate({ lowerSpacing: v })} unit="cm" placeholder="例: 15" />
        </>
      )}

      {comp.reinfType === 'wireMesh' && (
        <WireMeshSelect label="鋼絲網" value={comp.wireMesh} onChange={(v) => onUpdate({ wireMesh: v })} />
      )}

      <div className="bg-gray-50 rounded-lg p-3 mt-3">
        <SectionHeader icon="📊" title="計算結果" variant="inside" />
        <ResultRow label="開挖" value={`${fmt2(result.excavation)} m³`} />
        <ResultRow label="混凝土 fc'=140" value={`${fmt2(result.pc)} m³`} />
        <ResultRow label="混凝土 fc'=210" value={`${fmt2(result.concrete)} m³`} highlight />
        <ResultRow label="回填" value={`${fmt2(result.backfill)} m³`} />
        {comp.reinfType === 'rebar' && (
          <>
            <RebarDetailSection lines={rebarLines} sd280Total={result.totalRebarSD280} sd420Total={result.totalRebarSD420} />
            {result.spliceCount > 0 && (
              <ResultRow label="搭接" value={`${result.spliceCount}次 / ${fmt1(result.spliceLength)} m`} />
            )}
          </>
        )}
        {comp.reinfType === 'wireMesh' && result.wireMeshWt > 0 && (
          <ResultRow label={`鋼絲網 ${comp.wireMesh}`} value={`${fmt1(result.wireMeshWt)} kg`} />
        )}
        <ResultRow label="粉光" value={`${fmt2(result.trowel)} m²`} />
      </div>
    </div>
  );
}
