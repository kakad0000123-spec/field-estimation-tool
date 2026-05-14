import { useEffect, useMemo, useState } from 'react';
import { STORAGE_KEYS, StoredBeam, readStored, writeStored } from '../data/allowable/storageKeys';
import { getAllowSection } from '../data/allowable/sections';
import { ALLOW_GRADES, getAllowGrade } from '../data/allowable/grades';
import { ALLOW_DEFLECTIONS, getAllowDeflection } from '../data/allowable/deflection';
import { ALLOW_SECTION_DROPDOWN, ALLOW_SHAPE_TYPES } from '../data/allowable/dropdown';
import {
  calcBeam, BeamInput, SupportType, LoadType, BeamUsage,
} from '../calc/allowable/beam';
import { NumberField, SelectField, SafetyBanner, SectionHeader } from '../components/FormFields';

interface Props {
  onBack: () => void;
}

const SUPPORTS: SupportType[] = ['簡支梁', '懸臂梁'];
const LOAD_TYPES: LoadType[] = ['集中荷重', '均佈荷重'];
const USAGES: BeamUsage[] = ['一般鋼梁', '天車梁(Monorail)'];

// 範例預設值（依 Excel 使用說明 R59-91）
interface Preset {
  key: string;
  label: string;
  hint: string;
  patch: {
    usage: BeamUsage; support: SupportType; loadType: LoadType;
    shape: string; sectionLabel: string; gradeLabel: string;
    span: number; wD_add: number; P: number; wL: number;
    loadFactor: number; deflectionLabel: string;
  };
}

const PRESETS: Preset[] = [
  {
    key: 'general',
    label: '一般鋼梁',
    hint: '平台/走道/支撐小梁',
    patch: {
      usage: '一般鋼梁', support: '簡支梁', loadType: '均佈荷重',
      shape: 'H形鋼', sectionLabel: 'H-200x100x5.5x8', gradeLabel: 'CNS SN400B / SM400 (t≤40)',
      span: 4000, wD_add: 0, P: 0, wL: 200, loadFactor: 1.0,
      deflectionLabel: '一般鋼梁｜總載重撓度 L/240',
    },
  },
  {
    key: 'equipment',
    label: '設備支撐梁',
    hint: '設備反力集中荷重',
    patch: {
      usage: '一般鋼梁', support: '簡支梁', loadType: '集中荷重',
      shape: 'H形鋼', sectionLabel: 'H-300x150x6.5x9', gradeLabel: 'CNS SN400B / SM400 (t≤40)',
      span: 5000, wD_add: 0, P: 1500, wL: 0, loadFactor: 1.0,
      deflectionLabel: '設備支承梁｜其他設備 L/400 且 ≤ 21 mm',
    },
  },
  {
    key: 'crane',
    label: '天車梁 (Monorail)',
    hint: '單軌吊車／電動吊車',
    patch: {
      usage: '天車梁(Monorail)', support: '簡支梁', loadType: '集中荷重',
      shape: 'I型梁', sectionLabel: 'I-300x150x10x18.5', gradeLabel: 'CNS SN400B / SM400 (t≤40)',
      span: 6000, wD_add: 0, P: 2000, wL: 0, loadFactor: 1.25,
      deflectionLabel: '天車梁(Monorail)｜簡支單軌 L/800',
    },
  },
];

const fmt0 = (n: number) => (Number.isFinite(n) ? Math.round(n).toLocaleString() : '—');
const fmt1 = (n: number) => (Number.isFinite(n) ? n.toFixed(1) : '—');
const fmt2 = (n: number) => (Number.isFinite(n) ? n.toFixed(2) : '—');
const fmtPct = (n: number) => (Number.isFinite(n) ? (n * 100).toFixed(1) + ' %' : '—');

export default function AllowableBeam({ onBack }: Props) {
  // ── Form state (lazy load from localStorage) ──
  const stored = useMemo(() => readStored<StoredBeam>(STORAGE_KEYS.beam), []);
  const [usage, setUsage] = useState<BeamUsage>(() => (stored?.usage as BeamUsage) ?? '一般鋼梁');
  const [support, setSupport] = useState<SupportType>(() => (stored?.support as SupportType) ?? '簡支梁');
  const [loadType, setLoadType] = useState<LoadType>(() => (stored?.loadType as LoadType) ?? '集中荷重');
  const [shape, setShape] = useState<string>(() => stored?.shape ?? 'H形鋼');
  const [sectionLabel, setSectionLabel] = useState<string>(() => stored?.sectionLabel ?? 'H-100x50x5x7');
  const [gradeLabel, setGradeLabel] = useState<string>(() => stored?.gradeLabel ?? 'CNS SN400B / SM400 (t≤40)');
  const [span, setSpan] = useState<number>(() => stored?.span ?? 6000);
  const [includeSelfWeight, setIncludeSelfWeight] = useState<boolean>(() => stored?.includeSelfWeight ?? true);
  const [wD_add, setWDadd] = useState<number>(() => stored?.wD_add ?? 0);
  const [P, setP] = useState<number>(() => stored?.P ?? 100);
  const [wL, setWL] = useState<number>(() => stored?.wL ?? 100);
  const [loadFactor, setLoadFactor] = useState<number>(() => stored?.loadFactor ?? 1.0);
  const [deflectionLabel, setDeflectionLabel] = useState<string>(
    () => stored?.deflectionLabel ?? '一般鋼梁｜總載重撓度 L/240',
  );
  // Bump this on preset apply to force NumberField remount (uncontrolled inputs use defaultValue)
  const [formRev, setFormRev] = useState(0);

  // ── Persist to localStorage on every change ──
  useEffect(() => {
    writeStored<StoredBeam>(STORAGE_KEYS.beam, {
      usage, support, loadType, shape, sectionLabel, gradeLabel,
      span, includeSelfWeight, wD_add, P, wL, loadFactor, deflectionLabel,
    });
  }, [usage, support, loadType, shape, sectionLabel, gradeLabel,
      span, includeSelfWeight, wD_add, P, wL, loadFactor, deflectionLabel]);

  // ── Apply preset ──
  const applyPreset = (p: Preset) => {
    const x = p.patch;
    setUsage(x.usage); setSupport(x.support); setLoadType(x.loadType);
    setShape(x.shape); setSectionLabel(x.sectionLabel); setGradeLabel(x.gradeLabel);
    setSpan(x.span); setIncludeSelfWeight(true);
    setWDadd(x.wD_add); setP(x.P); setWL(x.wL); setLoadFactor(x.loadFactor);
    setDeflectionLabel(x.deflectionLabel);
    setFormRev((n) => n + 1);
  };

  // ── Derived ──
  const section = useMemo(() => getAllowSection(sectionLabel) ?? null, [sectionLabel]);
  const grade = useMemo(() => getAllowGrade(gradeLabel) ?? null, [gradeLabel]);
  const deflection = useMemo(() => getAllowDeflection(deflectionLabel) ?? null, [deflectionLabel]);

  const sectionsForShape = useMemo(
    () => (ALLOW_SECTION_DROPDOWN[shape] ?? []),
    [shape],
  );

  // 若切了形狀後當前 sectionLabel 不在此形狀清單裡，自動取第一個
  useEffect(() => {
    if (sectionsForShape.length && !sectionsForShape.includes(sectionLabel)) {
      setSectionLabel(sectionsForShape[0]);
    }
  }, [sectionsForShape, sectionLabel]);

  const input: BeamInput = {
    usage, support, loadType, section, grade, deflection,
    span, includeSelfWeight, wD_add, P, wL, loadFactor,
  };
  const r = useMemo(() => calcBeam(input), [input]);

  // ── Translations (白話) ──
  const verdictTone =
    r.overall === 'NG' ? 'bg-red-50 border-red-200 text-red-700'
    : r.overall === 'OK' ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
    : 'bg-gray-50 border-gray-200 text-gray-500';

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-16" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button onClick={onBack} className="text-xl text-[#6b7280] w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">←</button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-[#1a1a2e] leading-tight">鋼梁／天車梁 容許荷重檢核</h1>
            <p className="text-[11px] text-[#9ca3af] leading-tight">ASD 容許應力法 · 強軸彎曲初估</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
        {/* ── 範例快速套用 ── */}
        <section className="bg-blue-50 rounded-xl border border-blue-100 p-3">
          <div className="text-[11px] font-semibold text-[#6b7280] mb-2 px-1">快速套用範例</div>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.key}
                onClick={() => applyPreset(p)}
                className="bg-white rounded-lg border border-blue-100 px-2 py-2 text-left hover:border-[#2563eb]/40 active:scale-[0.98] transition-all"
              >
                <div className="text-[12px] font-semibold text-[#1a1a2e] leading-tight">{p.label}</div>
                <div className="text-[10px] text-[#9ca3af] leading-tight mt-0.5">{p.hint}</div>
              </button>
            ))}
          </div>
        </section>

        {/* ── 設計設定 (輸入區) ── */}
        <section className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <SectionHeader icon="📝" title="設計設定（輸入）" />
          <div className="mt-3 space-y-2">
            <SelectField label="梁別" value={usage} onChange={(v) => setUsage(v as BeamUsage)}
              options={USAGES.map((u) => ({ value: u, label: u }))} />
            <SelectField label="支承條件" value={support} onChange={(v) => setSupport(v as SupportType)}
              options={SUPPORTS.map((s) => ({ value: s, label: s }))} />
            <SelectField label="荷重型式" value={loadType} onChange={(v) => setLoadType(v as LoadType)}
              options={LOAD_TYPES.map((l) => ({ value: l, label: l }))} />
            <SelectField label="鋼構形式" value={shape} onChange={setShape}
              options={ALLOW_SHAPE_TYPES.map((t) => ({ value: t, label: t }))} />
            <SelectField label="斷面規格" value={sectionLabel} onChange={setSectionLabel}
              options={sectionsForShape.map((s) => ({ value: s, label: s }))} />
            <SelectField label="鋼材類別" value={gradeLabel} onChange={setGradeLabel}
              options={ALLOW_GRADES.map((g) => ({ value: g.label, label: g.label }))} />
            <NumberField key={`span-${formRev}`} label="跨距 L" value={span} onChange={setSpan} unit="mm" placeholder="例: 6000" />
            <SelectField label="納入自重" value={includeSelfWeight ? 'yes' : 'no'}
              onChange={(v) => setIncludeSelfWeight(v === 'yes')}
              options={[{ value: 'yes', label: '是' }, { value: 'no', label: '否' }]} />
            <NumberField key={`wd-${formRev}`} label="附加靜載 wD,add" value={wD_add} onChange={setWDadd} unit="kg/m" />
            {loadType === '集中荷重'
              ? <NumberField key={`p-${formRev}`} label="集中荷重 P" value={P} onChange={setP} unit="kg" />
              : <NumberField key={`wl-${formRev}`} label="均佈活載 wL" value={wL} onChange={setWL} unit="kg/m" />
            }
            <NumberField key={`lf-${formRev}`} label="載重倍率" value={loadFactor} onChange={setLoadFactor} unit="" placeholder="一般 1.0，天車 1.25" />
            <SelectField label="撓度基準" value={deflectionLabel} onChange={setDeflectionLabel}
              options={ALLOW_DEFLECTIONS.map((d) => ({ value: d.label, label: d.label }))} />
          </div>
        </section>

        {/* ── 斷面性質 (自動帶入) ── */}
        <section className="bg-gray-50 rounded-xl border border-gray-100 p-4">
          <SectionHeader icon="🏗️" title="斷面性質（自動帶入）" />
          {section ? (
            <div className="mt-2 grid grid-cols-3 gap-x-3 gap-y-1.5 text-[13px] tabular-nums">
              <Stat label="H/d" v={section.d} u="mm" />
              <Stat label="B/bf" v={section.bf} u="mm" />
              <Stat label="tw" v={section.tw} u="mm" />
              <Stat label="tf" v={section.tf} u="mm" />
              <Stat label="A" v={section.A} u="mm²" />
              <Stat label="單位重" v={section.weight} u="kg/m" />
              <Stat label="Ix" v={section.Ix} u="mm⁴" />
              <Stat label="Sx" v={section.Sx} u="mm³" />
              <Stat label="Aw" v={section.Aw} u="mm²" />
            </div>
          ) : <div className="text-sm text-gray-400 mt-2">尚未選擇斷面</div>}
        </section>

        {/* ── 材料強度 + 容許值 ── */}
        <section className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <SectionHeader icon="🔢" title="材料強度與容許值（自動計算）" />
          <div className="mt-3 space-y-1">
            <Row label="Fy 降伏強度" value={`${fmt2(grade?.Fy_MPa ?? NaN)} MPa`} />
            <Row label="E 彈性模數" value={`${fmt0(grade?.E_MPa ?? NaN)} MPa`} />
            <Row label="Fb = 0.66 Fy" value={`${fmt2(r.Fb_MPa)} MPa`} />
            <Row label="Fv = 0.40 Fy" value={`${fmt2(r.Fv_MPa)} MPa`} />
            <Hr />
            <Row label="容許彎矩 M_allow" value={`${fmt0(r.M_allow)} kg·m`} bold />
            <Row label="容許剪力 V_allow" value={`${fmt0(r.V_allow)} kg`} bold />
            <Row label={`容許撓度 Δa ${deflection ? `(${deflection.checkType})` : ''}`}
              value={`${fmt2(r.deflection_allow)} mm`} bold />
          </div>
        </section>

        {/* ── 實際檢核 ── */}
        <section className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <SectionHeader icon="✅" title="實際載重檢核" />
          <div className="mt-2 text-[12px] text-[#6b7280] space-y-0.5">
            <div>固定靜載 wD = {fmt2(r.wD)} kg/m（含自重 {includeSelfWeight ? '✓' : '✗'}）</div>
            <div>服務 {loadType === '集中荷重' ? `P` : `wL`} = {loadType === '集中荷重' ? fmt2(r.Ps_act) + ' kg' : fmt2(r.qs_act) + ' kg/m'}（含倍率 ×{loadFactor}）</div>
            <div>實際 M = {fmt2(r.M_act)} kg·m · V = {fmt2(r.V_act)} kg · Δ = {fmt2(r.delta_act)} mm</div>
          </div>
          <div className="mt-3 space-y-2">
            <SafetyBanner label="彎曲" ir={r.ratio_M}
              capacity={{ value: r.M_allow, unit: 'kg·m', label: 'M_allow' }}
              demand={{ value: r.M_act, unit: 'kg·m', label: 'M_act' }} />
            <SafetyBanner label="剪力" ir={r.ratio_V}
              capacity={{ value: r.V_allow, unit: 'kg', label: 'V_allow' }}
              demand={{ value: r.V_act, unit: 'kg', label: 'V_act' }} />
            <SafetyBanner label="撓度" ir={r.ratio_delta}
              capacity={{ value: r.deflection_allow, unit: 'mm', label: 'Δa' }}
              demand={{ value: r.delta_act, unit: 'mm', label: 'Δ_act' }} />
          </div>
        </section>

        {/* ── 總判定 + 白話翻譯 ── */}
        <section className={`rounded-xl border p-4 ${verdictTone}`}>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs opacity-80">總判定</div>
              <div className="text-xl font-bold">
                {r.overall === 'OK' ? '🟢 安全' : r.overall === 'NG' ? '🔴 不安全' : '—'}
              </div>
            </div>
            <div className="text-right text-sm">
              <div className="opacity-80">控制準則</div>
              <div className="font-semibold">{r.controlBy || '—'}</div>
            </div>
          </div>
          {r.overall && (
            <div className="mt-2 text-[13px]">
              {r.overall === 'OK'
                ? `✅ ${r.exceeded === '無' ? '全部通過' : r.exceeded} — 在容許範圍內`
                : `❌ ${r.exceeded} — 請改大斷面或降載`}
            </div>
          )}
        </section>

        {/* ── 容許服務值 / 額定值 ── */}
        <section className="bg-amber-50 rounded-xl border border-amber-200 p-4">
          <SectionHeader icon="🏋" title="容許上限（白話翻譯）" />
          <div className="mt-2 space-y-1 text-[13px] text-amber-900">
            <Row label="集中荷重 服務值 Ps" value={`${fmt0(r.Ps_service)} kg`} bold />
            <Row label={`集中荷重 額定值 Pr（÷${loadFactor}）`} value={`${fmt0(r.Pr_rated)} kg`} />
            <Row label="均佈活載 服務值 qs" value={`${fmt1(r.qs_service)} kg/m`} bold />
            <Hr />
            <div className="text-[12px] leading-relaxed">
              📌 服務值 = MIN(彎矩控制, 剪力控制, 撓度控制)<br />
              📌 額定值 = 服務值 ÷ 載重倍率 → 給填入用的「不要超過」上限
            </div>
          </div>
        </section>

        {/* ── 控制細節 ── */}
        <details className="bg-white rounded-xl border border-gray-100 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-[#6b7280]">
            ▶ 查看計算細節（含實際應力值）
          </summary>
          <div className="mt-3 space-y-1 text-[12px] text-[#6b7280]">
            {/* 實際應力（給技師直接對比 Fb/Fv） */}
            {section?.Sx && section?.Aw && (
              <>
                <div className="font-semibold text-[#1a1a2e] mt-1">實際應力</div>
                <Row label="σb 實際彎曲應力" value={`${fmt2(r.M_act * 9806.65 / section.Sx)} MPa（容許 ${fmt2(r.Fb_MPa)}）`} />
                <Row label="τ  實際剪應力" value={`${fmt2(r.V_act * 9.80665 / section.Aw)} MPa（容許 ${fmt2(r.Fv_MPa)}）`} />
                <Hr />
              </>
            )}
            <div className="font-semibold text-[#1a1a2e]">固定靜載</div>
            <Row label="固定靜載彎矩 MD" value={`${fmt2(r.MD)} kg·m`} />
            <Row label="固定靜載剪力 VD" value={`${fmt2(r.VD)} kg`} />
            <Row label="固定靜載撓度 ΔD" value={`${fmt2(r.deltaD)} mm`} />
            <Hr />
            <div className="font-semibold text-[#1a1a2e]">剩餘容許值</div>
            <Row label="剩餘容許彎矩" value={`${fmt2(r.M_remain)} kg·m`} />
            <Row label="剩餘容許剪力" value={`${fmt2(r.V_remain)} kg`} />
            <Row label="剩餘容許撓度" value={`${fmt2(r.delta_remain)} mm`} />
            <Hr />
            <div className="font-semibold text-[#1a1a2e]">利用率</div>
            <Row label="利用率 — 彎曲" value={fmtPct(r.ratio_M)} />
            <Row label="利用率 — 剪力" value={fmtPct(r.ratio_V)} />
            <Row label="利用率 — 撓度" value={fmtPct(r.ratio_delta)} />
            <Hr />
            <div className="font-semibold text-[#1a1a2e]">分項容許上限</div>
            <div>集中荷重：彎矩控制 {fmt0(r.Ps_M)} / 剪力控制 {fmt0(r.Ps_V)} / 撓度控制 {fmt0(r.Ps_delta)} kg</div>
            <div>均佈活載：彎矩控制 {fmt1(r.qs_M)} / 剪力控制 {fmt1(r.qs_V)} / 撓度控制 {fmt1(r.qs_delta)} kg/m</div>
          </div>
        </details>

        {/* ── 引用依據 + 設計邊界 ── */}
        <section className="bg-white rounded-xl border border-gray-100 p-4">
          <SectionHeader icon="📖" title="引用依據與設計邊界" />
          <div className="mt-2 text-[12px] text-[#6b7280] leading-relaxed space-y-1">
            <div><b className="text-[#1a1a2e]">設計方法：</b>容許應力設計法 (ASD)，Fb = 0.66 Fy、Fv = 0.40 Fy</div>
            <div><b className="text-[#1a1a2e]">設計規範：</b>鋼構造建築物鋼結構設計技術規範及解說（內政部營建署）</div>
            <div><b className="text-[#1a1a2e]">材料規範：</b>CNS 2473（SS400）／CNS 13812（SN400B、SN490B）／ASTM A36、A572 Gr.50</div>
            <div><b className="text-[#1a1a2e]">斷面尺寸來源：</b>JIS G 3192 / CNS 14165 熱軋型鋼斷面性質表</div>
            <div><b className="text-[#1a1a2e]">撓度基準：</b>{deflection?.label ?? '—'}（{deflection?.note ?? ''}）</div>
            <div className="pt-1 border-t border-gray-100 mt-2">
              <b className="text-[#1a1a2e]">設計邊界（適用範圍）：</b>
              <ol className="ml-4 list-decimal mt-1 space-y-0.5">
                <li>本表以單跨梁之強軸彎曲初估為主</li>
                <li>未另檢核側向扭轉挫屈、局部挫屈、疲勞與接頭</li>
                <li>P 型鋼與 L 型鋼之斷面性質為初估近似值</li>
                <li>天車梁 (Monorail) 建議以集中荷重模式輸入，倍率採 1.25</li>
                <li>本工具為初估用，最終設計請結構技師確認</li>
              </ol>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

// ─── small inline helpers ───
function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex justify-between text-[13px] py-1">
      <span className={bold ? 'font-medium text-[#1a1a2e]' : 'text-[#6b7280]'}>{label}</span>
      <span className={(bold ? 'font-semibold text-[#2563eb]' : 'text-[#1a1a2e]') + ' tabular-nums'}>{value}</span>
    </div>
  );
}

function Stat({ label, v, u }: { label: string; v: number | null; u: string }) {
  return (
    <div>
      <div className="text-[10px] text-[#9ca3af] leading-tight">{label}</div>
      <div className="text-[13px] text-[#1a1a2e] font-medium leading-tight">
        {v ?? '—'} <span className="text-[10px] text-[#9ca3af]">{u}</span>
      </div>
    </div>
  );
}

function Hr() {
  return <div className="border-t border-gray-100 my-1" />;
}
