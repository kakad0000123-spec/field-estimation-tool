// 容許荷重四模組共用 UI 小元件

export function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-[13px] py-1">
      <span className={bold ? 'font-medium text-[#1a1a2e]' : 'text-[#6b7280]'}>{label}</span>
      <span className={(bold ? 'font-semibold text-[#2563eb]' : 'text-[#1a1a2e]') + ' tabular-nums'}>{value}</span>
    </div>
  );
}

export function Stat({ label, v, u }: { label: string; v: number | string | null; u: string }) {
  return (
    <div>
      <div className="text-[10px] text-[#9ca3af] leading-tight">{label}</div>
      <div className="text-[13px] text-[#1a1a2e] font-medium leading-tight">
        {v ?? '—'} <span className="text-[10px] text-[#9ca3af]">{u}</span>
      </div>
    </div>
  );
}

export function Hr() {
  return <div className="border-t border-gray-100 my-1" />;
}

export function VerdictBlock({
  overall, controlBy, okMsg, ngMsg, ngDetail,
}: {
  overall: 'OK' | 'NG' | '';
  controlBy: string;
  okMsg?: string;
  ngMsg?: string;
  ngDetail?: string;
}) {
  const tone = overall === 'NG' ? 'bg-red-50 border-red-200 text-red-700'
    : overall === 'OK' ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
    : 'bg-gray-50 border-gray-200 text-gray-500';
  return (
    <section className={`rounded-xl border p-4 ${tone}`}>
      <div className="flex items-center justify-between">
        <div>
          <div className="text-xs opacity-80">總判定</div>
          <div className="text-xl font-bold">
            {overall === 'OK' ? `🟢 ${okMsg ?? '安全'}` : overall === 'NG' ? `🔴 ${ngMsg ?? '不安全'}` : '—'}
          </div>
        </div>
        <div className="text-right text-sm">
          <div className="opacity-80">控制準則</div>
          <div className="font-semibold">{controlBy || '—'}</div>
        </div>
      </div>
      {overall === 'NG' && ngDetail && <div className="mt-2 text-[13px]">❌ {ngDetail}</div>}
    </section>
  );
}

export const fmt0 = (n: number) => (Number.isFinite(n) ? Math.round(n).toLocaleString() : '—');
export const fmt1 = (n: number) => (Number.isFinite(n) ? n.toFixed(1) : '—');
export const fmt2 = (n: number) => (Number.isFinite(n) ? n.toFixed(2) : '—');
export const fmtPct = (n: number) => (Number.isFinite(n) ? (n * 100).toFixed(1) + ' %' : '—');
