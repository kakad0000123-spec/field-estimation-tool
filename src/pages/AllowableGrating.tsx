import { useEffect, useMemo, useState } from 'react';
import { STORAGE_KEYS, StoredGrating, readStored, writeStored } from '../data/allowable/storageKeys';
import { ALLOW_GRATINGS, getAllowGrating } from '../data/allowable/grating';
import { ALLOW_GRADES, getAllowGrade } from '../data/allowable/grades';
import { calcGrating, GratingSupport } from '../calc/allowable/grating';
import { NumberField, SelectField, SafetyBanner, SectionHeader } from '../components/FormFields';
import { Row, Stat, Hr, VerdictBlock, fmt0, fmt1, fmt2, fmtPct } from '../components/allowable/uiHelpers';

interface Props {
  onBack: () => void;
}

const SUPPORTS: GratingSupport[] = ['簡支梁', '懸臂梁'];

export default function AllowableGrating({ onBack }: Props) {
  const stored = useMemo(() => readStored<StoredGrating>(STORAGE_KEYS.grating), []);
  const [gratingLabel, setGratingLabel] = useState(() => stored?.gratingLabel ?? '25×3 @30 溝距200');
  const [span, setSpan] = useState(() => stored?.span ?? 1000);
  const [support, setSupport] = useState<GratingSupport>(() => (stored?.support as GratingSupport) ?? '簡支梁');
  const [L_over_n, setLn] = useState(() => stored?.L_over_n ?? 200);
  const [P, setP] = useState(() => stored?.P ?? 100);
  const [w, setW] = useState(() => stored?.w ?? 500);
  const [contactWidth, setContactWidth] = useState(() => stored?.contactWidth ?? 225);
  const [gradeLabel, setGradeLabel] = useState(() => stored?.gradeLabel ?? 'CNS SN400B / SM400 (t≤40)');

  useEffect(() => {
    writeStored<StoredGrating>(STORAGE_KEYS.grating, {
      gratingLabel, span, support, L_over_n, P, w, contactWidth, gradeLabel,
    });
  }, [gratingLabel, span, support, L_over_n, P, w, contactWidth, gradeLabel]);

  const grating = useMemo(() => getAllowGrating(gratingLabel) ?? null, [gratingLabel]);
  const grade = useMemo(() => getAllowGrade(gradeLabel) ?? null, [gradeLabel]);
  const Fy_MPa = grade?.Fy_MPa ?? 235.36;

  const r = useMemo(() => calcGrating({
    grating, span, support, L_over_n, P, w, contactWidth, Fy_MPa,
  }), [grating, span, support, L_over_n, P, w, contactWidth, Fy_MPa]);

  const uniformBad = r.check_uniform === 'NG';
  const concBad = r.check_concentrated === 'NG';
  const overall: 'OK' | 'NG' | '' = !r.check_uniform ? '' : (uniformBad || concBad) ? 'NG' : 'OK';
  const worstControlBy = uniformBad && concBad
    ? `均佈/${r.controlBy_uniform} + 集中/${r.controlBy_concentrated}`
    : uniformBad ? `均佈 ${r.controlBy_uniform}`
    : concBad ? `集中 ${r.controlBy_concentrated}`
    : '無';

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-16" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button onClick={onBack} className="text-xl text-[#6b7280] w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">←</button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-[#1a1a2e] leading-tight">格柵 容許荷重檢核</h1>
            <p className="text-[11px] text-[#9ca3af] leading-tight">ASD 法 · 單條矩形承載條檢核</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
        <section className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <SectionHeader icon="📝" title="設計設定（輸入）" />
          <div className="mt-3 space-y-2">
            <SelectField label="格柵型號" value={gratingLabel} onChange={setGratingLabel}
              options={ALLOW_GRATINGS.map((g) => ({ value: g.label, label: g.label }))} />
            <NumberField label="跨距 L" value={span} onChange={setSpan} unit="mm" placeholder="例: 1000" />
            <SelectField label="支承條件" value={support} onChange={(v) => setSupport(v as GratingSupport)}
              options={SUPPORTS.map((s) => ({ value: s, label: s }))} />
            <NumberField label="撓度比 L/n" value={L_over_n} onChange={setLn} unit=""
              placeholder="走道 200，平台 240" />
            <NumberField label="集中荷重 P" value={P} onChange={setP} unit="kg" placeholder="腳踩 75~100" />
            <NumberField label="均佈荷重 w" value={w} onChange={setW} unit="kg/m²" placeholder="走道 300~500" />
            <NumberField label="集中接觸寬" value={contactWidth} onChange={setContactWidth} unit="mm"
              placeholder="鞋底 225" />
            <SelectField label="鋼材類別" value={gradeLabel} onChange={setGradeLabel}
              options={ALLOW_GRADES.map((g) => ({ value: g.label, label: g.label }))} />
          </div>
        </section>

        <section className="bg-gray-50 rounded-xl border border-gray-100 p-4">
          <SectionHeader icon="🏗️" title="承載條斷面（自動帶入）" />
          {grating ? (
            <div className="mt-2 grid grid-cols-3 gap-x-3 gap-y-1.5 text-[13px] tabular-nums">
              <Stat label="高 h" v={grating.h} u="mm" />
              <Stat label="厚 t" v={grating.t} u="mm" />
              <Stat label="間距 c/c" v={grating.spacing} u="mm" />
              <Stat label="I" v={fmt0(r.I_rib)} u="mm⁴" />
              <Stat label="S" v={fmt1(r.S_rib)} u="mm³" />
              <Stat label="A" v={r.A_rib} u="mm²" />
              <Stat label="Fb" v={fmt2(r.Fb_MPa)} u="MPa" />
              <Stat label="Fv" v={fmt2(r.Fv_MPa)} u="MPa" />
              <Stat label="每公尺條數" v={fmt2(r.ribsPerMeter)} u="支" />
            </div>
          ) : <div className="text-sm text-gray-400 mt-2">尚未選擇格柵</div>}
        </section>

        <section className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <SectionHeader icon="🔢" title="單條容許值" />
          <div className="mt-3 space-y-1">
            <Row label="容許彎矩 / 條" value={`${fmt0(r.M_allow_rib)} kg·mm`} bold />
            <Row label="容許剪力 / 條" value={`${fmt1(r.V_allow_rib)} kg`} bold />
            <Row label="容許撓度 Δa" value={`${fmt2(r.deflection_allow)} mm`} bold />
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <SectionHeader icon="✅" title="均佈荷重檢核" />
          <div className="mt-2 text-[12px] text-[#6b7280]">
            線載重 = {fmt2((w || 0) / 1000 * (grating?.spacing || 0))} kg/m（依承載條間距 tributary）
          </div>
          <div className="mt-3 space-y-2">
            <SafetyBanner label="均佈 ‒ 彎矩" ir={r.ratio_w_M} />
            <SafetyBanner label="均佈 ‒ 剪力" ir={r.ratio_w_V} />
            <SafetyBanner label="均佈 ‒ 撓度" ir={r.ratio_w_delta} />
          </div>
          <div className="mt-2 text-[12px] text-[#6b7280]">
            判定 <b className={uniformBad ? 'text-red-700' : 'text-emerald-700'}>{r.check_uniform || '—'}</b>，控制：{r.controlBy_uniform || '—'}
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <SectionHeader icon="✅" title="集中荷重檢核（腳踩或單點重物）" />
          <div className="mt-2 text-[12px] text-[#6b7280]">
            受力條數 {r.ribsLoaded}，單條分擔 {fmt2(r.P_per_rib)} kg
          </div>
          <div className="mt-3 space-y-2">
            <SafetyBanner label="集中 ‒ 彎矩" ir={r.ratio_P_M} />
            <SafetyBanner label="集中 ‒ 剪力" ir={r.ratio_P_V} />
            <SafetyBanner label="集中 ‒ 撓度" ir={r.ratio_P_delta} />
          </div>
          <div className="mt-2 text-[12px] text-[#6b7280]">
            判定 <b className={concBad ? 'text-red-700' : 'text-emerald-700'}>{r.check_concentrated || '—'}</b>，控制：{r.controlBy_concentrated || '—'}
          </div>
        </section>

        <VerdictBlock overall={overall} controlBy={worstControlBy}
          okMsg="地板可安全使用"
          ngMsg="格柵超載"
          ngDetail="請改大規格或加密承載條間距" />

        <section className="bg-amber-50 rounded-xl border border-amber-200 p-4">
          <SectionHeader icon="🏋" title="容許上限（白話翻譯）" />
          <div className="mt-2 space-y-1 text-[13px] text-amber-900">
            <Row label="最大均佈荷重" value={`${fmt0(r.w_max_allow)} kg/m²`} bold />
            <Row label="最大集中荷重" value={`${fmt0(r.P_max_allow)} kg`} bold />
            <Row label="均佈利用率（最大）" value={fmtPct(Math.max(r.ratio_w_M, r.ratio_w_V, r.ratio_w_delta))} />
            <Row label="集中利用率（最大）" value={fmtPct(Math.max(r.ratio_P_M, r.ratio_P_V, r.ratio_P_delta))} />
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 p-4">
          <SectionHeader icon="📖" title="引用依據與設計邊界" />
          <div className="mt-2 text-[12px] text-[#6b7280] leading-relaxed space-y-1">
            <div><b className="text-[#1a1a2e]">設計方法：</b>容許應力設計法 (ASD)，單條視為矩形斷面 (I=t·h³/12, S=t·h²/6)</div>
            <div><b className="text-[#1a1a2e]">材料規範：</b>CNS 2473 / CNS 13812（鋼材）</div>
            <div><b className="text-[#1a1a2e]">格柵規格：</b>業界常用熱浸鍍鋅格柵（h × t @承載條間距 / 橫條間距）</div>
            <div className="pt-1 border-t border-gray-100 mt-2">
              <b className="text-[#1a1a2e]">設計邊界（適用範圍）：</b>
              <ol className="ml-4 list-decimal mt-1 space-y-0.5">
                <li>承載條視為矩形斷面，未含焊接圓角與橫條交聯效應</li>
                <li>集中荷重接觸寬度預設 225 mm（鞋底）；換大型滾輪需調整</li>
                <li>未檢核横條的次要彎矩、跌落沖擊或疲勞</li>
                <li>本工具為初估用，最終設計請結構技師確認</li>
              </ol>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
