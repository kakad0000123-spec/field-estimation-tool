import { useRef, useCallback } from 'react';
import { REBAR_LABELS } from '../data/rebarSpecs';
import { WIRE_MESH_LABELS } from '../data/wireMeshSpecs';

interface NumberFieldProps {
  label: string;
  value: number;
  onChange: (v: number) => void;
  unit?: string;
  step?: string;
  placeholder?: string;
}

export function NumberField({ label, value, onChange, unit, step = 'any', placeholder }: NumberFieldProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const num = parseFloat(raw);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(isNaN(num) ? 0 : num);
    }, 300);
  }, [onChange]);

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-[#6b7280] w-20 shrink-0">{label}</label>
      <div className="flex-1 relative">
        <input
          type="number"
          inputMode="decimal"
          step={step}
          defaultValue={value === 0 ? '' : value}
          placeholder={placeholder}
          onChange={handleChange}
          className="w-full h-10 px-3 pr-10 border border-gray-200 rounded-lg text-base text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563eb] transition-all"
        />
        {unit && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-[#9ca3af] pointer-events-none">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}

interface TextFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}

export function TextField({ label, value, onChange, placeholder }: TextFieldProps) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(v), 300);
  }, [onChange]);

  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-[#6b7280] w-24 shrink-0">{label}</label>
      <input
        type="text"
        defaultValue={value}
        onChange={handleChange}
        placeholder={placeholder}
        className="flex-1 h-10 px-3 border border-gray-200 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563eb] transition-all"
      />
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}

export function SelectField({ label, value, onChange, options }: SelectFieldProps) {
  return (
    <div className="flex items-center gap-2">
      <label className="text-sm text-[#6b7280] w-24 shrink-0">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex-1 h-10 px-3 border border-gray-200 rounded-lg text-base bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563eb] transition-all"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

interface RebarSelectProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
}

export function RebarSelect({ label, value, onChange }: RebarSelectProps) {
  return (
    <SelectField
      label={label}
      value={value}
      onChange={onChange}
      options={REBAR_LABELS.map((l) => ({ value: l, label: l }))}
    />
  );
}

export function WireMeshSelect({ label, value, onChange }: RebarSelectProps) {
  return (
    <SelectField
      label={label}
      value={value}
      onChange={onChange}
      options={WIRE_MESH_LABELS.map((l) => ({ value: l, label: l }))}
    />
  );
}

interface ResultRowProps {
  label: string;
  value: string;
  highlight?: boolean;
}

export function ResultRow({ label, value, highlight }: ResultRowProps) {
  return (
    <div className="flex justify-between text-sm py-1.5">
      <span className="text-[#6b7280]">{label}</span>
      <span className={highlight ? 'font-semibold text-[#2563eb] tabular-nums' : 'text-[#1a1a2e] tabular-nums font-medium'}>{value}</span>
    </div>
  );
}

export interface RebarLine {
  label: string;
  weight: number;
  grade: 'SD280' | 'SD420';
}

interface RebarDetailSectionProps {
  lines: RebarLine[];
  sd280Total: number;
  sd420Total: number;
}

export function RebarDetailSection({ lines, sd280Total, sd420Total }: RebarDetailSectionProps) {
  const visibleLines = lines.filter((l) => l.weight > 0);
  if (visibleLines.length === 0 && sd280Total === 0 && sd420Total === 0) return null;

  return (
    <div className="mt-2 border border-gray-100 rounded-lg p-2.5 bg-gray-50/50">
      <div className="text-xs font-semibold text-[#6b7280] mb-1.5">鋼筋明細</div>
      {visibleLines.map((line, i) => (
        <div key={i} className="flex items-center justify-between text-sm py-0.5">
          <span className="text-[#6b7280]">{line.label}</span>
          <span className="flex items-center gap-1.5">
            <span className="text-[#1a1a2e] tabular-nums">{line.weight.toFixed(1)} kg</span>
            <span className={
              line.grade === 'SD280'
                ? 'bg-emerald-50 text-emerald-700 text-xs px-1.5 py-0.5 rounded-full font-medium'
                : 'bg-blue-50 text-blue-700 text-xs px-1.5 py-0.5 rounded-full font-medium'
            }>{line.grade}</span>
          </span>
        </div>
      ))}
      {(sd280Total > 0 || sd420Total > 0) && (
        <>
          <div className="border-t border-gray-200 my-1.5" />
          {sd280Total > 0 && (
            <div className="flex justify-between text-sm py-0.5">
              <span className="text-[#6b7280]">SD280</span>
              <span className="text-[#1a1a2e] font-medium tabular-nums">{sd280Total.toFixed(1)} kg</span>
            </div>
          )}
          {sd420Total > 0 && (
            <div className="flex justify-between text-sm py-0.5">
              <span className="text-[#6b7280]">SD420</span>
              <span className="text-[#1a1a2e] font-medium tabular-nums">{sd420Total.toFixed(1)} kg</span>
            </div>
          )}
        </>
      )}
    </div>
  );
}
