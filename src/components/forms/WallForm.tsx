import { useMemo } from 'react';
import { WallData } from '../../data/types';
import { calcWall } from '../../calc/wall';
import { getRebarSpec } from '../../data/rebarSpecs';
import { NumberField, RebarSelect, ResultRow, RebarDetailSection, RebarLine, SectionHeader } from '../FormFields';
import { fmt2, fmt1 } from '../format';

interface Props {
  comp: WallData;
  onUpdate: (data: Partial<WallData>) => void;
  barLengthM?: number;
}

export default function WallForm({ comp, onUpdate, barLengthM }: Props) {
  const result = useMemo(() => calcWall(comp, barLengthM), [comp, barLengthM]);

  const rebarLines = useMemo((): RebarLine[] => {
    const vertSpec = getRebarSpec(comp.vertBar);
    const horizSpec = getRebarSpec(comp.horizBar);
    const lines: RebarLine[] = [];
    if (vertSpec && result.vertBarWt > 0) {
      lines.push({ label: `豎筋 ${comp.vertBar} @${comp.vertSpacing}cm`, weight: result.vertBarWt, grade: vertSpec.grade });
    }
    if (horizSpec && result.horizBarWt > 0) {
      lines.push({ label: `橫筋 ${comp.horizBar} @${comp.horizSpacing}cm`, weight: result.horizBarWt, grade: horizSpec.grade });
    }
    return lines;
  }, [comp, result]);

  return (
    <div className="space-y-2">
      <SectionHeader icon="📐" title="尺寸 (cm)" />
      <NumberField label="長 L" value={comp.wallLength} onChange={(v) => onUpdate({ wallLength: v })} unit="cm" placeholder="例: 300" />
      <NumberField label="高 H" value={comp.wallHeight} onChange={(v) => onUpdate({ wallHeight: v })} unit="cm" placeholder="例: 300" />
      <NumberField label="厚 T" value={comp.thickness} onChange={(v) => onUpdate({ thickness: v })} unit="cm" placeholder="例: 20" />
      <NumberField label="保護層" value={comp.cover} onChange={(v) => onUpdate({ cover: v })} unit="cm" placeholder="預設: 4" />
      <NumberField label="數量" value={comp.quantity} onChange={(v) => onUpdate({ quantity: v })} step="1" placeholder="例: 1" />

      <SectionHeader icon="🔩" title="配筋" className="mt-3" />
      <RebarSelect label="直筋" value={comp.vertBar} onChange={(v) => onUpdate({ vertBar: v })} />
      <NumberField label="直筋間距" value={comp.vertSpacing} onChange={(v) => onUpdate({ vertSpacing: v })} unit="cm" placeholder="例: 20" />
      <RebarSelect label="橫筋" value={comp.horizBar} onChange={(v) => onUpdate({ horizBar: v })} />
      <NumberField label="橫筋間距" value={comp.horizSpacing} onChange={(v) => onUpdate({ horizSpacing: v })} unit="cm" placeholder="例: 20" />

      <div className="bg-gray-50 rounded-lg p-3 mt-3">
        <SectionHeader icon="📊" title="計算結果" variant="inside" />
        <ResultRow label="混凝土 fc'=280" value={`${fmt2(result.concrete)} m³`} highlight />
        <RebarDetailSection lines={rebarLines} sd280Total={result.totalRebarSD280} sd420Total={result.totalRebarSD420} />
        {result.spliceCount > 0 && (
          <ResultRow label="搭接" value={`${result.spliceCount}次 / ${fmt1(result.spliceLength)} m`} />
        )}
        <ResultRow label="模板" value={`${fmt2(result.formwork)} m²`} />
      </div>
    </div>
  );
}
