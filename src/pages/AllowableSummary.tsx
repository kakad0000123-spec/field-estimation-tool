// 構件綜合檢核總表 — 一次看完 4 個容許荷重模組的最終判定
// 對應 docs/鋼構容許荷重計算表_v10.xlsx [Summary] 工作表
import { useMemo, useState, useEffect } from 'react';
import {
  STORAGE_KEYS, StoredBeam, StoredColumn, StoredGrating, StoredDeck, readStored,
} from '../data/allowable/storageKeys';
import { getAllowSection } from '../data/allowable/sections';
import { getAllowGrade } from '../data/allowable/grades';
import { getAllowDeflection } from '../data/allowable/deflection';
import { getAllowGrating } from '../data/allowable/grating';
import { getAllowDeck, getAllowWWM } from '../data/allowable/deck';
import { calcBeam, BeamUsage, SupportType, DesignMethod } from '../calc/allowable/beam';
import { calcColumn } from '../calc/allowable/column';
import { calcGrating, GratingSupport } from '../calc/allowable/grating';
import { calcDeck, DeckSupport } from '../calc/allowable/deck';
import { fmt2, fmtPct } from '../components/allowable/uiHelpers';

interface Props {
  onBack: () => void;
  onNavigate: (target: 'beam' | 'column' | 'grating' | 'deck') => void;
}

interface SummaryRow {
  no: number;
  module: string;
  section: string;
  IR_M: number | null;
  IR_V: number | null;
  IR_delta: number | null;
  IR_max: number;
  verdict: 'OK' | 'NG' | '—';
  controlBy: string;
  maxAllow: string;
  whitelang: string;
  navigate: 'beam' | 'column' | 'grating' | 'deck';
}

function fmtIR(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return '—';
  return fmtPct(n);
}

function buildBeamRow(): SummaryRow {
  const s = readStored<StoredBeam>(STORAGE_KEYS.beam);
  if (!s) return emptyRow(1, '鋼梁', 'beam');
  const section = getAllowSection(s.sectionLabel ?? '') ?? null;
  const grade = getAllowGrade(s.gradeLabel ?? '') ?? null;
  const deflection = getAllowDeflection(s.deflectionLabel ?? '') ?? null;
  if (!section || !grade || !deflection) return emptyRow(1, '鋼梁', 'beam');

  const r = calcBeam({
    method: (s.method as DesignMethod) ?? 'ASD',
    usage: (s.usage as BeamUsage) ?? '一般鋼梁',
    support: (s.support as SupportType) ?? '簡支梁',
    section, grade, deflection,
    span: s.span ?? 0,
    includeSelfWeight: s.includeSelfWeight ?? true,
    D_add: s.D_add ?? 0,
    L_uniform: s.L_uniform ?? 0,
    L_point: s.L_point ?? 0,
    L_impact: s.L_impact ?? 1.0,
    W_uniform: s.W_uniform ?? 0,
    W_point: s.W_point ?? 0,
    E_point: s.E_point ?? 0,
    My_input: s.My_input ?? 0,
  });
  const IR_max = Math.max(r.IR_biaxial, r.IR_V, r.IR_delta);
  const verdict = r.overall || '—';
  const maxAllow = r.controlCombo
    ? `${r.controlCombo.label} · M=${Math.round(r.M_act).toLocaleString()} kg·m`
    : '—';
  return {
    no: 1, module: '鋼梁/天車梁',
    section: `${section.label} (${s.method ?? 'ASD'})`,
    IR_M: r.IR_biaxial, IR_V: r.IR_V, IR_delta: r.IR_delta, IR_max,
    verdict, controlBy: r.controlBy,
    maxAllow,
    whitelang: verdict === 'OK'
      ? `✅ 鋼梁安全（用了 ${(IR_max*100).toFixed(1)}%）`
      : verdict === 'NG' ? `❌ 鋼梁超標！${r.controlBy}先壞` : '尚未輸入',
    navigate: 'beam',
  };
}

function buildColumnRow(): SummaryRow {
  const s = readStored<StoredColumn>(STORAGE_KEYS.column);
  if (!s) return emptyRow(2, '鋼柱', 'column');
  const section = getAllowSection(s.sectionLabel ?? '') ?? null;
  const grade = getAllowGrade(s.gradeLabel ?? '') ?? null;
  if (!section || !grade) return emptyRow(2, '鋼柱', 'column');

  const r = calcColumn({
    section, grade,
    height: s.height ?? 0, K: s.K ?? 1, P: s.P ?? 0,
    Mx: s.Mx ?? 0, My: s.My ?? 0,
    includeSelfWeight: s.includeSelfWeight ?? true,
  });
  const IR_max = Math.max(r.IR_axial, r.IR_combined);
  const verdict = r.overall || '—';
  return {
    no: 2, module: '鋼柱',
    section: section.label,
    IR_M: r.IR_combined, IR_V: null, IR_delta: null, IR_max,
    verdict, controlBy: r.controlBy,
    maxAllow: `Pa ${Math.round(r.Pa_kg).toLocaleString()} kg`,
    whitelang: verdict === 'OK'
      ? `✅ 鋼柱安全（用了 ${(IR_max*100).toFixed(1)}%）`
      : verdict === 'NG' ? `❌ 鋼柱超標！${r.controlBy}` : '尚未輸入',
    navigate: 'column',
  };
}

function buildGratingRow(): SummaryRow {
  const s = readStored<StoredGrating>(STORAGE_KEYS.grating);
  if (!s) return emptyRow(3, '格柵', 'grating');
  const grating = getAllowGrating(s.gratingLabel ?? '') ?? null;
  const grade = getAllowGrade(s.gradeLabel ?? '') ?? null;
  if (!grating || !grade) return emptyRow(3, '格柵', 'grating');

  const r = calcGrating({
    grating, span: s.span ?? 0,
    support: (s.support as GratingSupport) ?? '簡支梁',
    L_over_n: s.L_over_n ?? 200,
    P: s.P ?? 0, w: s.w ?? 0,
    contactWidth: s.contactWidth ?? 225,
    Fy_MPa: grade.Fy_MPa ?? 235.36,
  });
  const IR_w_max = Math.max(r.ratio_w_M, r.ratio_w_V, r.ratio_w_delta);
  const IR_P_max = Math.max(r.ratio_P_M, r.ratio_P_V, r.ratio_P_delta);
  const IR_max = Math.max(IR_w_max, IR_P_max);
  const verdict: 'OK' | 'NG' | '—' = !r.check_uniform ? '—'
    : (r.check_uniform === 'NG' || r.check_concentrated === 'NG') ? 'NG' : 'OK';
  const cb = r.check_uniform === 'NG' && r.check_concentrated === 'NG'
    ? `均佈/${r.controlBy_uniform} + 集中/${r.controlBy_concentrated}`
    : r.check_uniform === 'NG' ? `均佈 ${r.controlBy_uniform}`
    : r.check_concentrated === 'NG' ? `集中 ${r.controlBy_concentrated}`
    : r.controlBy_uniform || '';
  return {
    no: 3, module: '格柵',
    section: grating.label,
    IR_M: Math.max(r.ratio_w_M, r.ratio_P_M),
    IR_V: Math.max(r.ratio_w_V, r.ratio_P_V),
    IR_delta: Math.max(r.ratio_w_delta, r.ratio_P_delta),
    IR_max,
    verdict, controlBy: cb,
    maxAllow: `w ${r.w_max_allow} kg/m² · P ${r.P_max_allow} kg`,
    whitelang: verdict === 'OK'
      ? `✅ 格柵安全（用了 ${(IR_max*100).toFixed(1)}%）`
      : verdict === 'NG' ? `❌ 格柵超載！${cb}` : '尚未輸入',
    navigate: 'grating',
  };
}

function buildDeckRow(): SummaryRow {
  const s = readStored<StoredDeck>(STORAGE_KEYS.deck);
  if (!s) return emptyRow(4, 'Deck樓板', 'deck');
  const deck = getAllowDeck(s.deckLabel ?? '') ?? null;
  const wwm = getAllowWWM(s.wwmLabel ?? '') ?? null;
  if (!deck) return emptyRow(4, 'Deck樓板', 'deck');

  const r = calcDeck({
    deck, wwm,
    deckFy: s.deckFy ?? 250,
    rebarAs: s.rebarAs ?? 0,
    rebarFy: s.rebarFy ?? 420,
    fc_psi: s.fc_psi ?? 3000,
    tc: s.tc ?? 80,
    density: s.density ?? 2400,
    wwmCover: s.wwmCover ?? 20,
    span: s.span ?? 0,
    support: (s.support as DeckSupport) ?? '單跨',
    wL: s.wL ?? 0, wD_add: s.wD_add ?? 0,
    L_over_n: s.L_over_n ?? 240,
    phi: s.phi ?? 0.9,
  });
  const IR_max = Math.max(r.IR_M_pos, r.IR_V, r.IR_delta);
  const verdict = r.overall || '—';
  return {
    no: 4, module: 'Deck樓板',
    section: deck.label,
    IR_M: r.IR_M_pos, IR_V: r.IR_V, IR_delta: r.IR_delta, IR_max,
    verdict, controlBy: r.controlBy,
    maxAllow: `wL,max ${r.wL_max} kg/m²`,
    whitelang: verdict === 'OK'
      ? `✅ 樓板安全（用了 ${(IR_max*100).toFixed(1)}%）`
      : verdict === 'NG' ? `❌ 樓板超標！${r.controlBy}` : '尚未輸入',
    navigate: 'deck',
  };
}

function emptyRow(no: number, module: string, navigate: SummaryRow['navigate']): SummaryRow {
  return {
    no, module, section: '—',
    IR_M: null, IR_V: null, IR_delta: null, IR_max: 0,
    verdict: '—', controlBy: '—', maxAllow: '—',
    whitelang: '尚未填寫此構件',
    navigate,
  };
}

function irColor(v: number | null): string {
  if (v === null || !Number.isFinite(v) || v === 0) return 'text-gray-400';
  if (v > 1) return 'text-red-600 font-semibold';
  if (v > 0.85) return 'text-amber-600 font-semibold';
  return 'text-emerald-700';
}

export default function AllowableSummary({ onBack, onNavigate }: Props) {
  // 重新計算的觸發器：每次頁面 mount 都讀最新 localStorage
  const [tick, setTick] = useState(0);
  useEffect(() => {
    // 監聽 visibility 變化（從別頁切回）
    const onVis = () => { if (document.visibilityState === 'visible') setTick((t) => t + 1); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  const rows = useMemo(() => {
    void tick;
    return [buildBeamRow(), buildColumnRow(), buildGratingRow(), buildDeckRow()];
  }, [tick]);

  const validRows = rows.filter((r) => r.verdict !== '—');
  const worst = validRows.length
    ? validRows.reduce((max, r) => r.IR_max > max.IR_max ? r : max)
    : null;
  const overall: 'OK' | 'NG' | '—' = validRows.length === 0 ? '—'
    : validRows.some((r) => r.verdict === 'NG') ? 'NG' : 'OK';

  const overallTone =
    overall === 'NG' ? 'bg-red-50 border-red-200 text-red-700'
    : overall === 'OK' ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
    : 'bg-gray-50 border-gray-200 text-gray-500';

  const refresh = () => setTick((t) => t + 1);

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-16" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button onClick={onBack} className="text-xl text-[#6b7280] w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">←</button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-[#1a1a2e] leading-tight">構件綜合檢核總表</h1>
            <p className="text-[11px] text-[#9ca3af] leading-tight">讀取已填寫之 4 個構件 · 即時重算</p>
          </div>
          <button onClick={refresh}
            className="text-xs px-2 py-1 rounded-md bg-gray-100 text-[#6b7280] hover:bg-gray-200">
            🔄 重整
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
        {/* 整體判定 */}
        <section className={`rounded-xl border p-4 ${overallTone}`}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <div className="text-xs opacity-80">整體判定</div>
              <div className="text-xl font-bold">
                {overall === 'OK' ? '🟢 全部安全'
                  : overall === 'NG' ? '🔴 有構件超標'
                  : '⚪ 尚無資料'}
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="opacity-80">最危險構件</div>
              <div className="font-semibold">{worst?.module ?? '—'}</div>
            </div>
          </div>
          {worst && (
            <div className="text-[13px] opacity-90">
              最高利用率 {fmtPct(worst.IR_max)} · {worst.controlBy}
            </div>
          )}
          {validRows.length === 0 && (
            <div className="text-[13px] mt-1">尚未填寫任何構件 — 請先進入各計算器輸入數值，回到此處會自動帶入</div>
          )}
        </section>

        {/* 構件清單 */}
        <section className="bg-white rounded-xl border border-gray-100 overflow-hidden shadow-sm">
          <div className="grid grid-cols-12 gap-1 px-3 py-2 bg-gray-50 text-[11px] font-semibold text-[#6b7280] border-b border-gray-100">
            <div className="col-span-3">構件 / 斷面</div>
            <div className="col-span-2 text-right">IR 彎/M+</div>
            <div className="col-span-2 text-right">IR 剪/V</div>
            <div className="col-span-2 text-right">IR 撓</div>
            <div className="col-span-2 text-right">最大 IR</div>
            <div className="col-span-1 text-right">判定</div>
          </div>
          {rows.map((r) => (
            <button
              key={r.no}
              onClick={() => onNavigate(r.navigate)}
              className="w-full text-left grid grid-cols-12 gap-1 px-3 py-2 border-b border-gray-50 hover:bg-blue-50/50 active:bg-blue-100/50 transition-colors"
            >
              <div className="col-span-3">
                <div className="text-[12px] font-semibold text-[#1a1a2e] leading-tight">{r.module}</div>
                <div className="text-[10px] text-[#9ca3af] leading-tight">{r.section}</div>
              </div>
              <div className={`col-span-2 text-right text-[12px] tabular-nums ${irColor(r.IR_M)}`}>{fmtIR(r.IR_M)}</div>
              <div className={`col-span-2 text-right text-[12px] tabular-nums ${irColor(r.IR_V)}`}>{fmtIR(r.IR_V)}</div>
              <div className={`col-span-2 text-right text-[12px] tabular-nums ${irColor(r.IR_delta)}`}>{fmtIR(r.IR_delta)}</div>
              <div className={`col-span-2 text-right text-[13px] tabular-nums font-bold ${irColor(r.IR_max || null)}`}>
                {r.IR_max > 0 ? fmtPct(r.IR_max) : '—'}
              </div>
              <div className="col-span-1 text-right text-[12px] font-bold">
                {r.verdict === 'OK' ? <span className="text-emerald-700">OK</span>
                  : r.verdict === 'NG' ? <span className="text-red-600">NG</span>
                  : <span className="text-gray-400">—</span>}
              </div>
            </button>
          ))}
        </section>

        {/* 詳細逐項 */}
        <section className="bg-white rounded-xl border border-gray-100 p-3 space-y-2">
          <div className="text-[11px] font-semibold text-[#6b7280] mb-1">逐項白話說明</div>
          {rows.map((r) => (
            <div key={r.no} className="flex items-start gap-2 text-[12px] py-1 border-b border-gray-50 last:border-0">
              <div className="text-[#9ca3af] w-4 shrink-0">{r.no}.</div>
              <div className="flex-1">
                <div className="font-medium text-[#1a1a2e]">{r.module}</div>
                <div className="text-[#6b7280]">{r.whitelang}</div>
                <div className="text-[10px] text-[#9ca3af] mt-0.5">控制：{r.controlBy} · 容許上限：{r.maxAllow}</div>
              </div>
            </div>
          ))}
        </section>

        {/* 整體評估註腳 */}
        <section className="bg-amber-50 rounded-xl border border-amber-200 p-3 text-[11px] text-amber-900 leading-relaxed">
          💡 點任一列可跳到對應計算器修改 ·
          💡 任何構件 IR &gt; 1 = NG ·
          💡 IR 0.85~1.0 已黃燈，建議放大斷面 ·
          💡 本總表僅匯整本工具填寫的 4 個構件，實際工程請結構技師簽證
        </section>
      </div>
    </div>
  );
}
