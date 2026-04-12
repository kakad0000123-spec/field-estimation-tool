import { ComponentData } from '../data/types';
import ColumnForm from './forms/ColumnForm';
import BeamForm from './forms/BeamForm';
import SlabForm from './forms/SlabForm';
import WallForm from './forms/WallForm';
import FloorForm from './forms/FloorForm';
import FoundationForm from './forms/FoundationForm';
import EquipFoundForm from './forms/EquipFoundForm';
import StairForm from './forms/StairForm';
import OpeningForm from './forms/OpeningForm';
import ManualRCForm from './forms/ManualRCForm';
import CustomForm from './forms/CustomForm';

interface Props {
  comp: ComponentData;
  onUpdate: (data: Partial<ComponentData>) => void;
  barLengthM?: number;
}

export default function ComponentForm({ comp, onUpdate, barLengthM }: Props) {
  // Common fields: label and note
  const commonFields = (
    <div className="space-y-2 mb-3">
      <div className="flex items-center gap-2">
        <label className="text-sm text-[#6b7280] w-24 shrink-0">名稱</label>
        <input
          type="text"
          defaultValue={comp.label}
          onChange={(e) => {
            const v = e.target.value;
            setTimeout(() => onUpdate({ label: v }), 300);
          }}
          placeholder="例: P-101泵浦基座"
          className="flex-1 h-10 px-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563eb] transition-all"
        />
      </div>
      <div className="flex items-center gap-2">
        <label className="text-sm text-[#6b7280] w-24 shrink-0">備註</label>
        <input
          type="text"
          defaultValue={comp.note}
          onChange={(e) => {
            const v = e.target.value;
            setTimeout(() => onUpdate({ note: v }), 300);
          }}
          placeholder="位置/說明"
          className="flex-1 h-10 px-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563eb] transition-all"
        />
      </div>
    </div>
  );

  const renderForm = () => {
    switch (comp.type) {
      case 'column': return <ColumnForm comp={comp} onUpdate={onUpdate} barLengthM={barLengthM} />;
      case 'beam': return <BeamForm comp={comp} onUpdate={onUpdate} barLengthM={barLengthM} />;
      case 'slab': return <SlabForm comp={comp} onUpdate={onUpdate} barLengthM={barLengthM} />;
      case 'wall': return <WallForm comp={comp} onUpdate={onUpdate} barLengthM={barLengthM} />;
      case 'floor': return <FloorForm comp={comp} onUpdate={onUpdate} barLengthM={barLengthM} />;
      case 'foundation': return <FoundationForm comp={comp} onUpdate={onUpdate} barLengthM={barLengthM} />;
      case 'equipFound': return <EquipFoundForm comp={comp} onUpdate={onUpdate} />;
      case 'stair': return <StairForm comp={comp} onUpdate={onUpdate} barLengthM={barLengthM} />;
      case 'opening': return <OpeningForm comp={comp} onUpdate={onUpdate} barLengthM={barLengthM} />;
      case 'manualRC': return <ManualRCForm comp={comp} onUpdate={onUpdate} />;
      case 'custom': return <CustomForm comp={comp} onUpdate={onUpdate} />;
    }
  };

  return (
    <div>
      {commonFields}
      {renderForm()}
    </div>
  );
}
