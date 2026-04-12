import { ManualRCData } from '../../data/types';
import { NumberField } from '../FormFields';

interface Props {
  comp: ManualRCData;
  onUpdate: (data: Partial<ManualRCData>) => void;
}

export default function ManualRCForm({ comp, onUpdate }: Props) {
  return (
    <div className="space-y-2">
      <div className="text-xs text-gray-400 mb-2">直接輸入各項數量，不經公式計算</div>
      <NumberField label="混凝土 fc'=280" value={comp.concrete280} onChange={(v) => onUpdate({ concrete280: v })} unit="m³" placeholder="例: 1.5" />
      <NumberField label="混凝土 fc'=210" value={comp.concrete210} onChange={(v) => onUpdate({ concrete210: v })} unit="m³" placeholder="例: 0.5" />
      <NumberField label="SD280鋼筋" value={comp.rebarSD280} onChange={(v) => onUpdate({ rebarSD280: v })} unit="kg" placeholder="例: 100" />
      <NumberField label="SD420鋼筋" value={comp.rebarSD420} onChange={(v) => onUpdate({ rebarSD420: v })} unit="kg" placeholder="例: 200" />
      <NumberField label="模板" value={comp.formwork} onChange={(v) => onUpdate({ formwork: v })} unit="m²" placeholder="例: 10" />
      <NumberField label="粉光" value={comp.trowel} onChange={(v) => onUpdate({ trowel: v })} unit="m²" placeholder="例: 5" />
      <NumberField label="鋼絲網" value={comp.wireMesh} onChange={(v) => onUpdate({ wireMesh: v })} unit="kg" placeholder="例: 10" />
      <NumberField label="混凝土 fc'=140" value={comp.pcCushion} onChange={(v) => onUpdate({ pcCushion: v })} unit="m³" placeholder="例: 0.3" />
      <NumberField label="開挖" value={comp.excavation} onChange={(v) => onUpdate({ excavation: v })} unit="m³" placeholder="例: 5" />
      <NumberField label="回填" value={comp.backfill} onChange={(v) => onUpdate({ backfill: v })} unit="m³" placeholder="例: 3" />
    </div>
  );
}
