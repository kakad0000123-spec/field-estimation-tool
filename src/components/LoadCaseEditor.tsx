import { useRef, useCallback } from 'react';

export type LoadKind = 'uniform' | 'point';

export interface LoadEntry {
  id: number;
  kind: LoadKind;
  w: number;   // 均佈用，kN/m
  P: number;   // 集中用，kN
  a: number;   // 集中位置，m（距左支）
}

interface Props {
  loads: LoadEntry[];
  onChange: (loads: LoadEntry[]) => void;
}

function NumInput({
  value, onChange, unit, placeholder, widthClass = 'w-24',
}: {
  value: number;
  onChange: (v: number) => void;
  unit: string;
  placeholder?: string;
  widthClass?: string;
}) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const num = parseFloat(raw);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => onChange(isNaN(num) ? 0 : num), 200);
  }, [onChange]);
  return (
    <div className={`relative ${widthClass}`}>
      <input
        type="number"
        inputMode="decimal"
        step="any"
        defaultValue={value === 0 ? '' : value}
        placeholder={placeholder}
        onChange={handle}
        className="w-full h-9 px-2 pr-8 border border-gray-200 rounded-lg text-sm text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563eb] transition-all"
      />
      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[#9ca3af] pointer-events-none">{unit}</span>
    </div>
  );
}

export default function LoadCaseEditor({ loads, onChange }: Props) {
  const nextId = useRef(1);
  // 確保 nextId 大於目前所有 id，避免新增時撞鍵
  for (const l of loads) {
    if (l.id >= nextId.current) nextId.current = l.id + 1;
  }

  const addUniform = () => {
    onChange([...loads, { id: nextId.current++, kind: 'uniform', w: 0, P: 0, a: 0 }]);
  };
  const addPoint = () => {
    onChange([...loads, { id: nextId.current++, kind: 'point', w: 0, P: 0, a: 0 }]);
  };
  const remove = (id: number) => {
    onChange(loads.filter((l) => l.id !== id));
  };
  const update = (id: number, patch: Partial<LoadEntry>) => {
    onChange(loads.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  };

  return (
    <div className="space-y-2">
      {loads.length === 0 && (
        <div className="text-xs text-[#9ca3af] py-2 text-center border border-dashed border-gray-200 rounded-lg">
          尚未新增荷重，請按下方按鈕新增
        </div>
      )}

      {loads.map((l) => (
        <div key={l.id} className="flex items-center gap-2 p-2 bg-gray-50/50 border border-gray-100 rounded-lg">
          <select
            value={l.kind}
            onChange={(e) => update(l.id, { kind: e.target.value as LoadKind })}
            className="h-9 px-2 border border-gray-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-[#2563eb] transition-all"
          >
            <option value="uniform">均佈</option>
            <option value="point">集中</option>
          </select>

          {l.kind === 'uniform' ? (
            <NumInput
              key={`u-${l.id}`}
              value={l.w}
              onChange={(v) => update(l.id, { w: v })}
              unit="kN/m"
              placeholder="w"
              widthClass="flex-1"
            />
          ) : (
            <>
              <NumInput
                key={`pP-${l.id}`}
                value={l.P}
                onChange={(v) => update(l.id, { P: v })}
                unit="kN"
                placeholder="P"
                widthClass="flex-1"
              />
              <NumInput
                key={`pA-${l.id}`}
                value={l.a}
                onChange={(v) => update(l.id, { a: v })}
                unit="m"
                placeholder="位置"
                widthClass="flex-1"
              />
            </>
          )}

          <button
            onClick={() => remove(l.id)}
            aria-label="刪除"
            className="shrink-0 w-8 h-8 flex items-center justify-center text-gray-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>
      ))}

      <div className="flex gap-2">
        <button
          onClick={addUniform}
          className="flex-1 h-9 text-sm font-medium text-[#2563eb] bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg transition-colors"
        >
          + 均佈荷重
        </button>
        <button
          onClick={addPoint}
          className="flex-1 h-9 text-sm font-medium text-[#2563eb] bg-blue-50 hover:bg-blue-100 border border-blue-100 rounded-lg transition-colors"
        >
          + 集中荷重
        </button>
      </div>
    </div>
  );
}
