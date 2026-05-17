import { useEffect, useMemo, useState } from 'react';
import { STORAGE_KEYS, StoredBeam, readStored, writeStored } from '../data/allowable/storageKeys';
import { getAllowSection } from '../data/allowable/sections';
import { ALLOW_GRADES, getAllowGrade } from '../data/allowable/grades';
import { ALLOW_DEFLECTIONS, getAllowDeflection } from '../data/allowable/deflection';
import { ALLOW_SECTION_DROPDOWN, ALLOW_SHAPE_TYPES } from '../data/allowable/dropdown';
import {
  calcBeam, BeamInput, SupportType, BeamUsage, DesignMethod,
} from '../calc/allowable/beam';
import { NumberField, SelectField, SafetyBanner, SectionHeader } from '../components/FormFields';
import { Row, Stat, Hr, fmt0, fmt1, fmt2, fmtPct } from '../components/allowable/uiHelpers';
import type { Classification, LTBZone } from '../calc/allowable/sectionLimits';

function ClassificationBadge({ cls }: { cls: Classification }) {
  const map: Record<Classification, { txt: string; cls: string }> = {
    'Compact':     { txt: 'Compact 結實',       cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    'Non-compact': { txt: 'Non-compact 非結實', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    'Slender':     { txt: 'Slender 細長',       cls: 'bg-red-50 text-red-700 border-red-200' },
    'N/A':         { txt: 'N/A 未判定',          cls: 'bg-gray-50 text-gray-500 border-gray-200' },
  };
  const m = map[cls];
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${m.cls}`}>{m.txt}</span>
  );
}

function LTBBadge({ zone }: { zone: LTBZone }) {
  const map: Record<LTBZone, { txt: string; cls: string }> = {
    'No LTB':        { txt: '無 LTB',        cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    'Plastic':       { txt: '塑性區（無折減）', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    'Inelastic LTB': { txt: '非彈性 LTB（折減）', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
    'Elastic LTB':   { txt: '彈性 LTB（顯著折減）', cls: 'bg-red-50 text-red-700 border-red-200' },
    'N/A':           { txt: 'N/A',           cls: 'bg-gray-50 text-gray-500 border-gray-200' },
  };
  const m = map[zone];
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${m.cls}`}>{m.txt}</span>
  );
}

interface Props {
  onBack: () => void;
}

const METHODS: DesignMethod[] = ['ASD', 'LRFD'];
const SUPPORTS: SupportType[] = ['簡支梁', '懸臂梁'];
const USAGES: BeamUsage[] = ['一般鋼梁', '天車梁(Monorail)'];

interface Preset {
  key: string;
  label: string;
  hint: string;
  patch: Partial<StoredBeam>;
}

const PRESETS: Preset[] = [
  {
    key: 'general',
    label: '一般鋼梁',
    hint: '平台/走道/支撐小梁',
    patch: {
      method: 'ASD',
      usage: '一般鋼梁', support: '簡支梁',
      shape: 'H形鋼', sectionLabel: 'H-200x100x5.5x8', gradeLabel: 'CNS SN400B / SM400 (t≤40)',
      span: 4000, D_add: 0,
      L_uniform: 200, L_point: 0, L_impact: 1.0,
      W_uniform: 0, W_point: 0, E_point: 0,
      My_input: 0,
      compressionContinuous: true,  // 平台梁假設樓板焊接支撐壓力翼板
      Lb_mm: 0, Cb: 1.0,
      deflectionLabel: '一般鋼梁｜總載重撓度 L/240',
    },
  },
  {
    key: 'equipment',
    label: '設備支撐梁',
    hint: '設備反力集中荷重',
    patch: {
      method: 'LRFD',
      usage: '一般鋼梁', support: '簡支梁',
      shape: 'H形鋼', sectionLabel: 'H-300x150x6.5x9', gradeLabel: 'CNS SN400B / SM400 (t≤40)',
      span: 5000, D_add: 0,
      L_uniform: 0, L_point: 1500, L_impact: 1.0,
      W_uniform: 0, W_point: 0, E_point: 800,
      My_input: 0,
      compressionContinuous: false,  // 設備梁通常無壓力側連續支撐
      Lb_mm: 0, Cb: 1.32,            // 跨中集中：Cb ≈ 1.32
      deflectionLabel: '設備支承梁｜其他設備 L/400 且 ≤ 21 mm',
    },
  },
  {
    key: 'crane',
    label: '天車梁 (Monorail)',
    hint: '單軌吊車／電動吊車',
    patch: {
      method: 'LRFD',
      usage: '天車梁(Monorail)', support: '簡支梁',
      shape: 'I型梁', sectionLabel: 'I-300x150x10x18.5', gradeLabel: 'CNS SN400B / SM400 (t≤40)',
      span: 6000, D_add: 0,
      L_uniform: 0, L_point: 2000, L_impact: 1.25,
      W_uniform: 0, W_point: 0, E_point: 0,
      My_input: 0,
      compressionContinuous: false,  // 天車梁底翼受壓，無樓板支撐
      Lb_mm: 0, Cb: 1.0,             // 保守
      deflectionLabel: '天車梁(Monorail)｜簡支單軌 L/800',
    },
  },
];

export default function AllowableBeam({ onBack }: Props) {
  const stored = useMemo(() => readStored<StoredBeam>(STORAGE_KEYS.beam), []);
  const [method, setMethod] = useState<DesignMethod>(() => (stored?.method as DesignMethod) ?? 'ASD');
  const [usage, setUsage] = useState<BeamUsage>(() => (stored?.usage as BeamUsage) ?? '一般鋼梁');
  const [support, setSupport] = useState<SupportType>(() => (stored?.support as SupportType) ?? '簡支梁');
  const [shape, setShape] = useState<string>(() => stored?.shape ?? 'H形鋼');
  const [sectionLabel, setSectionLabel] = useState<string>(() => stored?.sectionLabel ?? 'H-100x50x5x7');
  const [gradeLabel, setGradeLabel] = useState<string>(() => stored?.gradeLabel ?? 'CNS SN400B / SM400 (t≤40)');
  const [span, setSpan] = useState<number>(() => stored?.span ?? 6000);
  const [includeSelfWeight, setIncludeSelfWeight] = useState<boolean>(() => stored?.includeSelfWeight ?? true);
  const [D_add, setDadd] = useState<number>(() => stored?.D_add ?? 0);
  const [L_uniform, setLU] = useState<number>(() => stored?.L_uniform ?? 0);
  const [L_point, setLP] = useState<number>(() => stored?.L_point ?? 100);
  const [L_impact, setLImpact] = useState<number>(() => stored?.L_impact ?? 1.0);
  const [W_uniform, setWU] = useState<number>(() => stored?.W_uniform ?? 0);
  const [W_point, setWP] = useState<number>(() => stored?.W_point ?? 0);
  const [E_point, setEP] = useState<number>(() => stored?.E_point ?? 0);
  const [My_input, setMy] = useState<number>(() => stored?.My_input ?? 0);
  const [compressionContinuous, setCompressionContinuous] = useState<boolean>(
    () => stored?.compressionContinuous ?? false,
  );
  const [Lb_mm, setLb] = useState<number>(() => stored?.Lb_mm ?? 0);  // 0 = 用 span
  const [Cb, setCb] = useState<number>(() => stored?.Cb ?? 1.0);
  const [deflectionLabel, setDeflectionLabel] = useState<string>(
    () => stored?.deflectionLabel ?? '一般鋼梁｜總載重撓度 L/240',
  );
  const [formRev, setFormRev] = useState(0);
  const [showAdvanced, setShowAdvanced] = useState<boolean>(
    () => (stored?.W_uniform ?? 0) !== 0 || (stored?.W_point ?? 0) !== 0
       || (stored?.E_point ?? 0) !== 0 || (stored?.My_input ?? 0) !== 0,
  );

  // Persist to localStorage
  useEffect(() => {
    writeStored<StoredBeam>(STORAGE_KEYS.beam, {
      method, usage, support, shape, sectionLabel, gradeLabel,
      span, includeSelfWeight, D_add,
      L_uniform, L_point, L_impact,
      W_uniform, W_point, E_point, My_input,
      compressionContinuous, Lb_mm, Cb,
      deflectionLabel,
    });
  }, [method, usage, support, shape, sectionLabel, gradeLabel, span, includeSelfWeight,
      D_add, L_uniform, L_point, L_impact, W_uniform, W_point, E_point, My_input,
      compressionContinuous, Lb_mm, Cb, deflectionLabel]);

  const applyPreset = (p: Preset) => {
    const x = p.patch;
    if (x.method) setMethod(x.method as DesignMethod);
    if (x.usage) setUsage(x.usage as BeamUsage);
    if (x.support) setSupport(x.support as SupportType);
    if (x.shape) setShape(x.shape);
    if (x.sectionLabel) setSectionLabel(x.sectionLabel);
    if (x.gradeLabel) setGradeLabel(x.gradeLabel);
    if (x.span !== undefined) setSpan(x.span);
    setIncludeSelfWeight(true);
    setDadd(x.D_add ?? 0);
    setLU(x.L_uniform ?? 0); setLP(x.L_point ?? 0); setLImpact(x.L_impact ?? 1.0);
    setWU(x.W_uniform ?? 0); setWP(x.W_point ?? 0);
    setEP(x.E_point ?? 0); setMy(x.My_input ?? 0);
    setCompressionContinuous(x.compressionContinuous ?? false);
    setLb(x.Lb_mm ?? 0);
    setCb(x.Cb ?? 1.0);
    if (x.deflectionLabel) setDeflectionLabel(x.deflectionLabel);
    if ((x.W_uniform ?? 0) !== 0 || (x.W_point ?? 0) !== 0 || (x.E_point ?? 0) !== 0 || (x.My_input ?? 0) !== 0) {
      setShowAdvanced(true);
    }
    setFormRev((n) => n + 1);
  };

  const section = useMemo(() => getAllowSection(sectionLabel) ?? null, [sectionLabel]);
  const grade = useMemo(() => getAllowGrade(gradeLabel) ?? null, [gradeLabel]);
  const deflection = useMemo(() => getAllowDeflection(deflectionLabel) ?? null, [deflectionLabel]);

  const sectionsForShape = useMemo(() => (ALLOW_SECTION_DROPDOWN[shape] ?? []), [shape]);
  useEffect(() => {
    if (sectionsForShape.length && !sectionsForShape.includes(sectionLabel)) {
      setSectionLabel(sectionsForShape[0]);
    }
  }, [sectionsForShape, sectionLabel]);

  const input: BeamInput = {
    method, usage, support, section, grade, deflection,
    span, includeSelfWeight, D_add,
    L_uniform, L_point, L_impact,
    W_uniform, W_point, E_point, My_input,
    compressionContinuous, Lb_mm, Cb,
  };
  const r = useMemo(() => calcBeam(input), [input]);

  const verdictTone =
    r.overall === 'NG' ? 'bg-red-50 border-red-200 text-red-700'
    : r.overall === 'OK' ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
    : 'bg-gray-50 border-gray-200 text-gray-500';

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-16" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button onClick={onBack} className="text-xl text-[#6b7280] w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">←</button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-[#1a1a2e] leading-tight">鋼梁／天車梁 容許荷重檢核</h1>
            <p className="text-[11px] text-[#9ca3af] leading-tight">
              {method === 'ASD' ? 'ASD 容許應力法' : 'LRFD 極限設計法'} · 雙軸彎矩 + 載重組合包絡
            </p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
        {/* 設計方法切換 */}
        <section className="bg-white rounded-xl border border-gray-200 p-1 shadow-sm flex">
          {METHODS.map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                method === m
                  ? 'bg-[#2563eb] text-white shadow-sm'
                  : 'bg-transparent text-[#6b7280] hover:bg-gray-50'
              }`}
            >
              {m === 'ASD' ? 'ASD 容許應力法（快算）' : 'LRFD 極限設計法（主流）'}
            </button>
          ))}
        </section>

        {/* 範例快速套用 */}
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

        {/* 跨度與斷面 */}
        <section className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <SectionHeader icon="🏗️" title="跨度與斷面" />
          <div className="mt-3 space-y-2">
            <SelectField label="梁別" value={usage} onChange={(v) => setUsage(v as BeamUsage)}
              options={USAGES.map((u) => ({ value: u, label: u }))} />
            <SelectField label="支承條件" value={support} onChange={(v) => setSupport(v as SupportType)}
              options={SUPPORTS.map((s) => ({ value: s, label: s }))} />
            <SelectField label="鋼構形式" value={shape} onChange={setShape}
              options={ALLOW_SHAPE_TYPES.map((t) => ({ value: t, label: t }))} />
            <SelectField label="斷面規格" value={sectionLabel} onChange={setSectionLabel}
              options={sectionsForShape.map((s) => ({ value: s, label: s }))} />
            <SelectField label="鋼材類別" value={gradeLabel} onChange={setGradeLabel}
              options={ALLOW_GRADES.map((g) => ({ value: g.label, label: g.label }))} />
            <NumberField key={`span-${formRev}`} label="跨距 L" value={span} onChange={setSpan} unit="mm" placeholder="例: 6000" />
            <SelectField label="撓度基準" value={deflectionLabel} onChange={setDeflectionLabel}
              options={ALLOW_DEFLECTIONS.map((d) => ({ value: d.label, label: d.label }))} />
          </div>
        </section>

        {/* 靜載重 D */}
        <section className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <SectionHeader icon="📐" title="靜載重 D（Dead）" />
          <div className="mt-3 space-y-2">
            <SelectField label="納入自重" value={includeSelfWeight ? 'yes' : 'no'}
              onChange={(v) => setIncludeSelfWeight(v === 'yes')}
              options={[{ value: 'yes', label: '是' }, { value: 'no', label: '否' }]} />
            <NumberField key={`Dadd-${formRev}`} label="附加均佈 wD,add" value={D_add} onChange={setDadd} unit="kg/m"
              placeholder="管線/鋼板/裝修等固定重" />
          </div>
        </section>

        {/* 活載重 L */}
        <section className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <SectionHeader icon="📦" title="活載重 L（Live）" />
          <div className="mt-3 space-y-2">
            <NumberField key={`LU-${formRev}`} label="均佈 wL" value={L_uniform} onChange={setLU} unit="kg/m"
              placeholder="平台使用載重" />
            <NumberField key={`LP-${formRev}`} label="集中 PL" value={L_point} onChange={setLP} unit="kg"
              placeholder="設備重 / 吊重" />
            <NumberField key={`Limp-${formRev}`} label="衝擊倍率" value={L_impact} onChange={setLImpact} unit=""
              placeholder="一般 1.0；天車 1.25" />
          </div>
        </section>

        {/* 進階：W / E / My */}
        <section className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <button onClick={() => setShowAdvanced((v) => !v)} className="flex items-center gap-2 w-full text-left">
            <span className="text-sm font-semibold text-[#6b7280]">
              {showAdvanced ? '▼' : '▶'} 進階載重（W 風力 / E 地震 / My 弱軸）
            </span>
            {!showAdvanced && (W_uniform || W_point || E_point || My_input) ? (
              <span className="text-[10px] text-amber-600">有資料</span>
            ) : null}
          </button>
          {showAdvanced && (
            <div className="mt-3 space-y-3">
              <div>
                <div className="text-[11px] font-semibold text-[#9ca3af] mb-1">風荷重 W（可負值代表上吸）</div>
                <NumberField key={`WU-${formRev}`} label="均佈 wW" value={W_uniform} onChange={setWU} unit="kg/m" />
                <NumberField key={`WP-${formRev}`} label="集中 PW" value={W_point} onChange={setWP} unit="kg" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[#9ca3af] mb-1">地震反力 E（由結構技師提供）</div>
                <NumberField key={`EP-${formRev}`} label="集中 PE" value={E_point} onChange={setEP} unit="kg" />
              </div>
              <div>
                <div className="text-[11px] font-semibold text-[#9ca3af] mb-1">弱軸彎矩（雙軸載重時）</div>
                <NumberField key={`My-${formRev}`} label="My 直輸入" value={My_input} onChange={setMy} unit="kg·m" />
              </div>
            </div>
          )}
        </section>

        {/* 側向支撐（LTB 用） */}
        <section className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <SectionHeader icon="↔️" title="側向支撐（LTB 檢核）" />
          <div className="mt-3 space-y-2">
            <SelectField
              label="壓力側連續支撐？"
              value={compressionContinuous ? 'yes' : 'no'}
              onChange={(v) => setCompressionContinuous(v === 'yes')}
              options={[
                { value: 'yes', label: '是（樓板/鋼承板焊接，無 LTB）' },
                { value: 'no', label: '否（梁兩端支承，採實際 Lb）' },
              ]}
            />
            {!compressionContinuous && (
              <>
                <NumberField key={`Lb-${formRev}`} label="無支撐長 Lb" value={Lb_mm} onChange={setLb} unit="mm"
                  placeholder={`留 0 採跨距 ${span} mm`} />
                <NumberField key={`Cb-${formRev}`} label="Cb 修正係數" value={Cb} onChange={setCb} unit=""
                  placeholder="保守 1.0；簡支均佈 1.14；中間集中 1.32" />
              </>
            )}
            {compressionContinuous && (
              <div className="text-[11px] text-emerald-700 px-1">✅ 壓力翼板連續支撐 → 不發生側向扭轉挫屈</div>
            )}
          </div>
        </section>

        {/* 斷面性質 */}
        <section className="bg-gray-50 rounded-xl border border-gray-100 p-4">
          <SectionHeader icon="📊" title="斷面性質（自動帶入）" />
          {section ? (
            <>
              <div className="mt-2 grid grid-cols-3 gap-x-3 gap-y-1.5 text-[13px] tabular-nums">
                <Stat label="H/d" v={section.d} u="mm" />
                <Stat label="B/bf" v={section.bf} u="mm" />
                <Stat label="A" v={section.A} u="mm²" />
                <Stat label="單位重" v={section.weight} u="kg/m" />
                <Stat label="Sx" v={section.Sx} u="mm³" />
                <Stat label="Zx (近似)" v={fmt0(r.Zx)} u="mm³" />
                <Stat label="Sy" v={fmt0(r.Sy)} u="mm³" />
                <Stat label="Zy (近似)" v={fmt0(r.Zy)} u="mm³" />
                <Stat label="Aw" v={section.Aw} u="mm²" />
              </div>

              {/* 結實性 + LTB 徽章 */}
              {r.bendingDetail && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex flex-wrap gap-2 items-center">
                    <span className="text-[11px] text-[#6b7280]">結實性：</span>
                    <ClassificationBadge cls={r.classification} />
                    <span className="text-[11px] text-[#6b7280] ml-2">LTB：</span>
                    <LTBBadge zone={r.ltbZone} />
                    {r.reductionFactor < 1 && (
                      <span className="text-[11px] text-amber-700 font-medium">
                        折減因子 {(r.reductionFactor * 100).toFixed(1)}%
                      </span>
                    )}
                  </div>
                  {r.bendingDetail.classification.classification !== 'N/A' && r.bendingDetail.classification.classification !== 'Compact' && (
                    <div className="text-[11px] text-[#9ca3af] mt-1">
                      翼板 λ = {fmt2(r.bendingDetail.classification.flangeRatio)}
                      （λp = {fmt2(r.bendingDetail.classification.flangeLambdaP)}, λr = {fmt2(r.bendingDetail.classification.flangeLambdaR)}）
                      <br />
                      腹板 λ = {fmt2(r.bendingDetail.classification.webRatio)}
                      （λp = {fmt2(r.bendingDetail.classification.webLambdaP)}, λr = {fmt2(r.bendingDetail.classification.webLambdaR)}）
                    </div>
                  )}
                  {r.ltbZone !== 'No LTB' && r.ltbZone !== 'N/A' && (
                    <div className="text-[11px] text-[#9ca3af] mt-1">
                      Lp = {fmt0(r.Lp_mm)} mm, Lr = {Number.isFinite(r.Lr_mm) ? fmt0(r.Lr_mm) : '∞'} mm,
                      Lb = {fmt0(r.Lb_used_mm)} mm
                    </div>
                  )}
                </div>
              )}
            </>
          ) : <div className="text-sm text-gray-400 mt-2">尚未選擇斷面</div>}
        </section>

        {/* 容量 */}
        <section className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <SectionHeader icon="🔢" title={method === 'ASD' ? '容許值（ASD）' : '設計強度（LRFD）'} />
          <div className="mt-3 space-y-1">
            <Row label="Fy 降伏強度" value={`${fmt2(grade?.Fy_MPa ?? NaN)} MPa`} />
            {method === 'ASD' && (
              <>
                <Row label="Fb = 0.66 Fy" value={`${fmt2(r.Fb_MPa)} MPa`} />
                <Row label="Fv = 0.40 Fy" value={`${fmt2(r.Fv_MPa)} MPa`} />
              </>
            )}
            {method === 'LRFD' && (
              <>
                <Row label="φ_b (彎曲)" value="0.9" />
                <Row label="φ_v (剪力)" value="0.9" />
              </>
            )}
            <Hr />
            <Row label={method === 'ASD' ? '強軸容許彎矩 M_allow,x' : '強軸 φMnx'}
              value={
                r.reductionFactor < 1
                  ? `${fmt0(r.Mcx_kgm)} kg·m（折減 ${(r.reductionFactor*100).toFixed(1)}% × ${fmt0(r.Mcx_full_kgm)}）`
                  : `${fmt0(r.Mcx_kgm)} kg·m`
              } bold />
            {r.Mcy_kgm > 0 && (
              <Row label={method === 'ASD' ? '弱軸容許彎矩 M_allow,y' : '弱軸 φMny'}
                value={`${fmt0(r.Mcy_kgm)} kg·m`} bold />
            )}
            <Row label={method === 'ASD' ? '容許剪力 V_allow' : '剪力強度 φVn'}
              value={`${fmt0(r.Vc_kg)} kg`} bold />
            <Row label="容許撓度 Δa" value={`${fmt2(r.delta_allow)} mm`} bold />
          </div>
        </section>

        {/* 載重組合表 */}
        <section className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <SectionHeader icon="📋" title={`載重組合（${method}）`} />
          <div className="mt-2 text-[11px] text-[#9ca3af]">
            自重 + 附加靜載 wD = {fmt2(r.wD_total)} kg/m
          </div>
          <div className="mt-2 overflow-x-auto -mx-1">
            <table className="w-full text-[11px] tabular-nums">
              <thead>
                <tr className="border-b border-gray-100 text-[#6b7280]">
                  <th className="text-left py-1 px-1">組合</th>
                  <th className="text-right py-1 px-1">w (kg/m)</th>
                  <th className="text-right py-1 px-1">P (kg)</th>
                  <th className="text-right py-1 px-1">M (kg·m)</th>
                  <th className="text-right py-1 px-1">V (kg)</th>
                </tr>
              </thead>
              <tbody>
                {r.combos.map((c) => {
                  const isControl = c === r.controlCombo;
                  return (
                    <tr key={c.label} className={`border-b border-gray-50 ${isControl ? 'bg-amber-50 font-semibold' : ''}`}>
                      <td className="py-1 px-1 text-[11px]">{isControl ? '★ ' : '  '}{c.label}</td>
                      <td className="py-1 px-1 text-right">{c.w_kgPerM.toFixed(1)}</td>
                      <td className="py-1 px-1 text-right">{c.p_kg.toFixed(0)}</td>
                      <td className="py-1 px-1 text-right">{c.M_kgm.toFixed(1)}</td>
                      <td className="py-1 px-1 text-right">{c.V_kg.toFixed(1)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {r.controlCombo && (
            <div className="mt-2 text-[12px] text-amber-700">
              ★ 控制組合：<b>{r.controlCombo.label}</b> → M_act = {fmt0(r.M_act)} kg·m
            </div>
          )}
        </section>

        {/* 檢核 */}
        <section className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <SectionHeader icon="✅" title="檢核" />
          <div className="mt-3 space-y-2">
            {(r.My_act > 0 || My_input > 0) ? (
              <SafetyBanner label={`雙軸彎矩 (Mx/${method === 'ASD' ? 'Mcx' : 'φMnx'} + My/${method === 'ASD' ? 'Mcy' : 'φMny'})`}
                ir={r.IR_biaxial}
                capacity={{ value: 1, unit: '', label: '上限' }}
                demand={{ value: r.IR_biaxial, unit: '', label: '組合' }} />
            ) : (
              <SafetyBanner label="彎曲" ir={r.IR_M_x}
                capacity={{ value: r.Mcx_kgm, unit: 'kg·m', label: method === 'ASD' ? 'M_allow' : 'φMnx' }}
                demand={{ value: r.M_act, unit: 'kg·m', label: 'M_act' }} />
            )}
            <SafetyBanner label="剪力" ir={r.IR_V}
              capacity={{ value: r.Vc_kg, unit: 'kg', label: method === 'ASD' ? 'V_allow' : 'φVn' }}
              demand={{ value: r.V_act, unit: 'kg', label: 'V_act' }} />
            <SafetyBanner label="撓度" ir={r.IR_delta}
              capacity={{ value: r.delta_allow, unit: 'mm', label: 'Δa' }}
              demand={{ value: r.delta_act, unit: 'mm', label: 'Δ_act' }} />
          </div>
        </section>

        {/* 總判定 */}
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
          {r.controlCombo && (
            <div className="mt-2 text-[12px] opacity-90">
              {r.overall === 'OK' ? '✅ 由 ' : '❌ 由 '}
              <b>{r.controlCombo.label}</b> 控制 · 最大利用率 {fmtPct(Math.max(r.IR_biaxial, r.IR_V, r.IR_delta))}
            </div>
          )}
        </section>

        {/* 詳細 */}
        <details className="bg-white rounded-xl border border-gray-100 p-4">
          <summary className="cursor-pointer text-sm font-semibold text-[#6b7280]">
            ▶ 查看計算細節
          </summary>
          <div className="mt-3 space-y-1 text-[12px] text-[#6b7280]">
            {section?.Sx && section?.Aw && (
              <>
                <div className="font-semibold text-[#1a1a2e]">實際應力（控制組合）</div>
                <Row label="σbx 強軸彎曲應力" value={`${fmt2(r.M_act * 9806.65 / section.Sx)} MPa`} />
                {r.My_act > 0 && r.Sy > 0 && (
                  <Row label="σby 弱軸彎曲應力" value={`${fmt2(r.My_act * 9806.65 / r.Sy)} MPa`} />
                )}
                <Row label="τ  實際剪應力" value={`${fmt2(r.V_act * 9.80665 / section.Aw)} MPa`} />
                <Hr />
              </>
            )}
            <div className="font-semibold text-[#1a1a2e]">利用率</div>
            <Row label="IR 強軸 Mx" value={fmtPct(r.IR_M_x)} />
            {r.My_act > 0 && <Row label="IR 弱軸 My" value={fmtPct(r.IR_M_y)} />}
            <Row label="IR 雙軸合計" value={fmtPct(r.IR_biaxial)} />
            <Row label="IR 剪力" value={fmtPct(r.IR_V)} />
            <Row label="IR 撓度" value={fmtPct(r.IR_delta)} />
            <Hr />
            <Row label="實際撓度 Δ_act" value={`${fmt2(r.delta_act)} mm（服務值）`} />
          </div>
        </details>

        {/* 引用依據 */}
        <section className="bg-white rounded-xl border border-gray-100 p-4">
          <SectionHeader icon="📖" title="引用依據與設計邊界" />
          <div className="mt-2 text-[12px] text-[#6b7280] leading-relaxed space-y-1">
            <div><b className="text-[#1a1a2e]">設計方法：</b>
              {method === 'ASD'
                ? '容許應力法 (ASD)，Fb = 0.66 Fy、Fv = 0.40 Fy'
                : '極限設計法 (LRFD)，φMn = 0.9·Fy·Zx、φVn = 0.9·0.6·Fy·Aw'}
            </div>
            <div><b className="text-[#1a1a2e]">設計規範：</b>
              {method === 'ASD'
                ? '鋼結構容許應力設計法規範及解說（內政部營建署）'
                : '鋼結構極限設計法規範及解說（內政部營建署）/ AISC 360'}
            </div>
            <div><b className="text-[#1a1a2e]">載重組合：</b>
              {method === 'ASD' ? '依 ASCE 7 容許組合（D, D+L, D+0.75L+0.75W/E, D+0.6W/E, 0.6D+0.6W/E）'
                : '依 IBC / LRFD（1.4D, 1.2D+1.6L, 1.2D+L+W/E, 0.9D+W/E）自動包絡'}
            </div>
            <div><b className="text-[#1a1a2e]">材料規範：</b>CNS 2473 / CNS 13812 / ASTM A36, A572 Gr.50</div>
            <div><b className="text-[#1a1a2e]">斷面尺寸：</b>JIS G 3192 / CNS 14165</div>
            <div className="pt-1 border-t border-gray-100 mt-2">
              <b className="text-[#1a1a2e]">設計邊界（適用範圍）：</b>
              <ol className="ml-4 list-decimal mt-1 space-y-0.5">
                <li>結實性自動分類 (Compact / Non-compact / Slender) 適用於 H/I/槽鋼/BOX；P 圓管、L 角鋼視為 compact</li>
                <li>LTB 適用於 H/I/槽鋼；BOX (扭轉剛度高) 與 P (軸對稱) 不發生 LTB</li>
                <li>LTB 計算採 AISC F2 公式 + Cb 修正；Cb 預設 1.0 保守，簡支均佈可採 1.14，集中可採 1.32</li>
                <li>Zx / Zy 採塑性係數近似（Sx × 1.10~1.27 視形狀），精確值請查 CNS 14165 表訂</li>
                <li>雙軸互制採線性疊加 H1 = (Mux/φMnx)+(Muy/φMny)；高軸壓力時應改用完整 H1-1b</li>
                <li>地震力 E 為「結構技師提供之構件反力」，非由本工具計算建築物耐震反應</li>
                <li>本工具為初估用，最終設計請結構技師確認</li>
              </ol>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
