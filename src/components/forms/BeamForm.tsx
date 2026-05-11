import { useMemo } from 'react';
import { BeamData } from '../../data/types';
import { calcBeam } from '../../calc/beam';
import { getRebarSpec } from '../../data/rebarSpecs';
import { NumberField, RebarSelect, ResultRow, RebarDetailSection, RebarLine, SectionHeader } from '../FormFields';
import { fmt2, fmt1 } from '../format';

interface Props {
  comp: BeamData;
  onUpdate: (data: Partial<BeamData>) => void;
  barLengthM?: number;
}

export default function BeamForm({ comp, onUpdate, barLengthM }: Props) {
  const result = useMemo(() => calcBeam(comp, barLengthM), [comp, barLengthM]);

  const rebarLines = useMemo((): RebarLine[] => {
    const topSpec = getRebarSpec(comp.topBar);
    const botSpec = getRebarSpec(comp.bottomBar);
    const stirSpec = getRebarSpec(comp.stirrup);
    const lines: RebarLine[] = [];
    if (topSpec && result.topBarWt > 0) {
      lines.push({ label: `上層筋 ${comp.topBar} ×${comp.topBarCount}根`, weight: result.topBarWt, grade: topSpec.grade });
    }
    if (botSpec && result.bottomBarWt > 0) {
      lines.push({ label: `下層筋 ${comp.bottomBar} ×${comp.bottomBarCount}根`, weight: result.bottomBarWt, grade: botSpec.grade });
    }
    if (stirSpec && result.stirrupWt > 0) {
      lines.push({ label: `箍筋 ${comp.stirrup} @密${comp.denseSpacing}/疏${comp.sparseSpacing}cm`, weight: result.stirrupWt, grade: stirSpec.grade });
    }
    return lines;
  }, [comp, result]);

  return (
    <div className="space-y-2">
      <SectionHeader icon="📐" title="尺寸 (cm)" />
      <NumberField label="寬 B" value={comp.width} onChange={(v) => onUpdate({ width: v })} unit="cm" placeholder="例: 30" />
      <NumberField label="深 D" value={comp.depth} onChange={(v) => onUpdate({ depth: v })} unit="cm" placeholder="例: 60" />
      <NumberField label="跨距 L" value={comp.span} onChange={(v) => onUpdate({ span: v })} unit="cm" placeholder="例: 600" />
      <NumberField label="數量" value={comp.quantity} onChange={(v) => onUpdate({ quantity: v })} step="1" placeholder="例: 1" />

      <SectionHeader icon="🔩" title="配筋" className="mt-3" />
      <RebarSelect label="上層筋" value={comp.topBar} onChange={(v) => onUpdate({ topBar: v })} />
      <NumberField label="上層支數" value={comp.topBarCount} onChange={(v) => onUpdate({ topBarCount: v })} step="1" placeholder="例: 3" />
      <RebarSelect label="下層筋" value={comp.bottomBar} onChange={(v) => onUpdate({ bottomBar: v })} />
      <NumberField label="下層支數" value={comp.bottomBarCount} onChange={(v) => onUpdate({ bottomBarCount: v })} step="1" placeholder="例: 3" />
      <RebarSelect label="箍筋" value={comp.stirrup} onChange={(v) => onUpdate({ stirrup: v })} />
      <NumberField label="密箍間距" value={comp.denseSpacing} onChange={(v) => onUpdate({ denseSpacing: v })} unit="cm" placeholder="例: 10" />
      <NumberField label="疏箍間距" value={comp.sparseSpacing} onChange={(v) => onUpdate({ sparseSpacing: v })} unit="cm" placeholder="例: 15" />

      <div className="bg-gray-50 rounded-lg p-3 mt-3">
        <SectionHeader icon="📊" title="計算結果" variant="inside" />
        <ResultRow label="混凝土 fc'=280" value={`${fmt2(result.concrete)} m³`} highlight />
        <RebarDetailSection lines={rebarLines} sd280Total={result.totalRebarSD280} sd420Total={result.totalRebarSD420} />
        <ResultRow label="模板" value={`${fmt2(result.formwork)} m²`} />
        <ResultRow label="搭接" value={`${result.spliceCount}次 / ${fmt1(result.spliceLength)} m`} />
      </div>
    </div>
  );
}
