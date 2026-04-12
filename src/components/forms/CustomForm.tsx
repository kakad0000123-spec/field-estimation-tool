import { CustomData } from '../../data/types';
import { NumberField, TextField, SelectField } from '../FormFields';
import { fmtCurrency } from '../format';

interface Props {
  comp: CustomData;
  onUpdate: (data: Partial<CustomData>) => void;
}

export default function CustomForm({ comp, onUpdate }: Props) {
  const total = comp.customQuantity * comp.unitPrice;

  return (
    <div className="space-y-2">
      <SelectField
        label="單位"
        value={comp.unit}
        onChange={(v) => onUpdate({ unit: v })}
        options={[
          { value: '\u5F0F', label: '\u5F0F' },
          { value: 'm³', label: 'm³' },
          { value: 'm²', label: 'm²' },
          { value: 'kg', label: 'kg' },
          { value: '\u5678', label: '\u5678' },
          { value: '\u7D44', label: '\u7D44' },
        ]}
      />
      <NumberField label="數量" value={comp.customQuantity} onChange={(v) => onUpdate({ customQuantity: v })} placeholder="例: 1" />
      <NumberField label="單價" value={comp.unitPrice} onChange={(v) => onUpdate({ unitPrice: v })} unit="NTD" placeholder="例: 5000" />
      <TextField label="說明" value={comp.description} onChange={(v) => onUpdate({ description: v })} />

      <div className="bg-gray-50 rounded-lg p-3 mt-3">
        <div className="flex justify-between text-sm font-semibold">
          <span className="text-gray-500">小計</span>
          <span className="text-blue-700">${fmtCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}
