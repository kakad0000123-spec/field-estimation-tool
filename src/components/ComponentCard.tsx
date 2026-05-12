import { useState } from 'react';
import { ComponentData, EstimationCase } from '../data/types';
import { COMPONENT_TYPE_LABELS } from '../data/defaults';
import { calcComponentResult } from '../calc/summary';
import { calcColumn } from '../calc/column';
import { calcBeam } from '../calc/beam';
import { calcSlab } from '../calc/slab';
import { calcWall } from '../calc/wall';
import { calcFloor } from '../calc/floor';
import { calcFoundation } from '../calc/foundation';
import { calcEquipFound } from '../calc/equipFound';
import { calcStair } from '../calc/stair';
import { calcOpening } from '../calc/opening';
import { calcSteelMember, calcSteelPlate } from '../calc/steelMember';
import ComponentForm from './ComponentForm';
import CalcDetailView from './CalcDetailView';
import { fmt2, fmt1 } from './format';
import { getComponentWarnings } from './validation';

interface Props {
  comp: ComponentData;
  caseData: EstimationCase;
  expanded: boolean;
  onToggle: () => void;
  onUpdate: (data: Partial<ComponentData>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  barLengthM?: number;
  badgeColor?: string;
}

function getCompactSummary(comp: ComponentData): string {
  switch (comp.type) {
    case 'column':
      return `${comp.width}x${comp.depth}x${comp.height}cm, ${fmt2(calcColumn(comp).concrete)}m\u00B3`;
    case 'beam':
      return `${comp.width}x${comp.depth}, L=${comp.span}cm, ${fmt2(calcBeam(comp).concrete)}m\u00B3`;
    case 'slab':
      return `${comp.length}x${comp.width}x${comp.thickness}cm, ${fmt2(calcSlab(comp).concrete)}m\u00B3`;
    case 'wall':
      return `L=${comp.wallLength}, H=${comp.wallHeight}, T=${comp.thickness}cm, ${fmt2(calcWall(comp).concrete)}m\u00B3`;
    case 'floor':
      return `${comp.length}x${comp.width}x${comp.thickness}cm, ${fmt2(calcFloor(comp).concrete)}m\u00B3`;
    case 'foundation':
      return `${comp.foundLength}x${comp.foundWidth}x${comp.foundDepth}cm, ${fmt2(calcFoundation(comp).concrete)}m\u00B3`;
    case 'equipFound': {
      const d = calcEquipFound(comp);
      return `${comp.length}x${comp.width}x${comp.depth}cm, ${d.check}`;
    }
    case 'stair':
      return `${comp.steps}\u968E, W=${comp.stairWidth}cm, ${fmt2(calcStair(comp).concrete)}m\u00B3`;
    case 'opening':
      return `${comp.openWidth}x${comp.openHeight}cm, -${fmt2(calcOpening(comp).deductConcrete)}m\u00B3`;
    case 'manualRC':
      return '\u624B\u52D5\u8F38\u5165\u6578\u91CF';
    case 'custom':
      return `${comp.customQuantity} ${comp.unit} x $${comp.unitPrice}`;
    case 'steelMember': {
      const d = calcSteelMember(comp);
      return `${comp.section} \u00D7${comp.quantity}, L=${comp.length}mm, ${fmt1(d.totalWeight)} kg`;
    }
    case 'steelPlate': {
      const d = calcSteelPlate(comp);
      return `${comp.plate} ${comp.length}\u00D7${comp.width}mm \u00D7${comp.quantity}, ${fmt1(d.totalWeight)} kg`;
    }
  }
}

export default function ComponentCard({ comp, caseData, expanded, onToggle, onUpdate, onDelete, onDuplicate, barLengthM, badgeColor }: Props) {
  const [showDetail, setShowDetail] = useState(false);
  const typeLabel = COMPONENT_TYPE_LABELS[comp.type] || comp.type;
  const colorClass = badgeColor || 'bg-blue-50 text-blue-700';
  const warnings = getComponentWarnings(comp);

  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* Collapsed header */}
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 flex items-center gap-3 active:bg-gray-50 transition-colors"
      >
        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colorClass}`}>
          {typeLabel}
        </span>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-[#1a1a2e] truncate text-sm">
            {comp.label || '\u672A\u547D\u540D'}
          </div>
          <div className="text-xs text-[#9ca3af] truncate mt-0.5 tabular-nums">
            {getCompactSummary(comp)}
          </div>
        </div>
        {warnings.length > 0 && !expanded && (
          <span className="text-amber-500 text-xs flex-shrink-0" title={`${warnings.length} 個警告`}>
            {warnings.length}
          </span>
        )}
        <span className="text-[#9ca3af] text-sm transition-transform duration-200" style={{ transform: expanded ? 'rotate(180deg)' : 'none' }}>
          &#9662;
        </span>
      </button>

      {/* Expanded form */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 py-3">
          <ComponentForm comp={comp} onUpdate={onUpdate} barLengthM={barLengthM} />

          {/* Validation warnings */}
          {warnings.length > 0 && (
            <div className="space-y-1 mt-3 p-2.5 bg-amber-50 rounded-lg border border-amber-100">
              {warnings.map((w, i) => (
                <div key={i} className="text-xs text-amber-600 flex items-center gap-1.5">
                  <span className="flex-shrink-0">&#9888;</span>
                  <span>{w}</span>
                </div>
              ))}
            </div>
          )}

          <button
            onClick={() => setShowDetail(!showDetail)}
            className="w-full text-left text-xs text-[#2563eb] font-medium mt-3 py-2 active:text-blue-800 transition-colors"
          >
            {showDetail ? '\u25BC \u96B1\u85CF\u8A08\u7B97\u904E\u7A0B' : '\u25B6 \u67E5\u770B\u8A08\u7B97\u904E\u7A0B'}
          </button>
          {showDetail && <CalcDetailView comp={comp} caseData={caseData} />}

          <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
            <button
              onClick={onDuplicate}
              className="flex-1 h-10 bg-gray-50 text-[#6b7280] rounded-lg text-sm font-medium hover:bg-gray-100 active:bg-gray-200 transition-all duration-200 border border-gray-200"
            >
              複製
            </button>
            <button
              onClick={onDelete}
              className="flex-1 h-10 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 active:bg-red-200 transition-all duration-200 border border-red-100"
            >
              刪除
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
