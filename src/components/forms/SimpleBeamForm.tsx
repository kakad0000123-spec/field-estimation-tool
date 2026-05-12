import { useMemo, useState } from 'react';
import { NumberField, SelectField, ResultRow } from '../FormFields';
import LoadCaseEditor, { LoadEntry } from '../LoadCaseEditor';
import { STEEL_SECTIONS, STEEL_SECTION_LABELS, getSteelSection } from '../../data/steelSections';
import { STEEL_GRADE_LABELS, SteelGrade } from '../../data/steelGrades';
import { calcSimpleBeam, SectionInput, LoadCase } from '../../calc/simpleBeam';
import { fmt1, fmt2 } from '../format';

type SectionMode = 'preset' | 'manual';

interface ManualSection {
  h: number;
  tw: number;
  A: number;
  Ix: number;
  Zx: number;
  unitWeight: number;
}

const DEFAULT_PRESET = 'H300x150x6.5x9';
const DEFAULT_MANUAL: ManualSection = { h: 0, tw: 0, A: 0, Ix: 0, Zx: 0, unitWeight: 0 };
const DEFLECTION_OPTIONS = [
  { value: '240', label: 'L/240' },
  { value: '300', label: 'L/300（預設）' },
  { value: '360', label: 'L/360' },
  { value: '500', label: 'L/500' },
];

function fmtUtil(u: number): string {
  return `${(u * 100).toFixed(1)}%`;
}
function fmtRatio(r: number): string {
  if (!isFinite(r) || r <= 0) return '—';
  return `L/${Math.round(r)}`;
}

function StatusPill({ ok }: { ok: boolean }) {
  return ok ? (
    <span className="bg-emerald-50 text-emerald-700 text-xs px-2 py-0.5 rounded-full font-medium">✓ OK</span>
  ) : (
    <span className="bg-rose-50 text-rose-700 text-xs px-2 py-0.5 rounded-full font-medium">✗ NG</span>
  );
}

function CheckRow({
  label, demand, allowable, util, ok,
}: {
  label: string;
  demand: string;
  allowable: string;
  util: number;
  ok: boolean;
}) {
  const barColor = util > 1 ? 'bg-rose-500' : util > 0.85 ? 'bg-amber-500' : 'bg-emerald-500';
  const widthPct = Math.min(100, util * 100);
  return (
    <div className="py-1.5">
      <div className="flex justify-between items-center text-sm">
        <span className="text-[#6b7280]">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-[#1a1a2e] tabular-nums">{demand} / {allowable}</span>
          <StatusPill ok={ok} />
        </div>
      </div>
      <div className="mt-1 flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className={`h-full ${barColor} transition-all`} style={{ width: `${widthPct}%` }} />
        </div>
        <span className="text-xs text-[#6b7280] tabular-nums w-12 text-right">{fmtUtil(util)}</span>
      </div>
    </div>
  );
}

export default function SimpleBeamForm() {
  // ─── 基本 ───
  const [L, setL] = useState(6);

  // ─── 斷面 ───
  const [sectionMode, setSectionMode] = useState<SectionMode>('preset');
  const [presetLabel, setPresetLabel] = useState(DEFAULT_PRESET);
  const [manualSection, setManualSection] = useState<ManualSection>(DEFAULT_MANUAL);

  // ─── 鋼材 ───
  const [grade, setGrade] = useState<SteelGrade>('SS400');

  // ─── 荷重 ───
  const [loads, setLoads] = useState<LoadEntry[]>([
    { id: 1, kind: 'uniform', w: 10, P: 0, a: 0 },
  ]);
  const [includeSelfWeight, setIncludeSelfWeight] = useState(true);

  // ─── 撓度限制 ───
  const [deflectionLimit, setDeflectionLimit] = useState('300');

  // ─── 即時計算 ───
  const sectionInput: SectionInput = useMemo(() => {
    if (sectionMode === 'preset') {
      return { mode: 'preset', label: presetLabel };
    }
    return { mode: 'manual', ...manualSection };
  }, [sectionMode, presetLabel, manualSection]);

  const loadCases: LoadCase[] = useMemo(() => {
    return loads.map((l): LoadCase => {
      if (l.kind === 'uniform') return { kind: 'uniform', w: l.w };
      return { kind: 'point', P: l.P, a: l.a };
    });
  }, [loads]);

  const result = useMemo(() => {
    return calcSimpleBeam({
      L,
      section: sectionInput,
      grade,
      loads: loadCases,
      includeSelfWeight,
      deflectionLimitRatio: parseFloat(deflectionLimit) || 300,
    });
  }, [L, sectionInput, grade, loadCases, includeSelfWeight, deflectionLimit]);

  // ─── 顯示：所選預設斷面的參數 ───
  const presetInfo = useMemo(() => {
    return sectionMode === 'preset' ? getSteelSection(presetLabel) : null;
  }, [sectionMode, presetLabel]);

  const hasValidInput = result.section.A > 0 && L > 0;

  return (
    <div className="space-y-4">
      {/* ─── 區塊 1：基本 ─── */}
      <section className="bg-white border border-gray-100 rounded-xl p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">基本</div>
        <div className="space-y-2">
          <NumberField label="跨距 L" value={L} onChange={setL} unit="m" placeholder="例: 6" />
        </div>
      </section>

      {/* ─── 區塊 2：斷面 ─── */}
      <section className="bg-white border border-gray-100 rounded-xl p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">斷面</div>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            <button
              onClick={() => setSectionMode('preset')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                sectionMode === 'preset' ? 'bg-white text-[#1a1a2e] shadow-sm' : 'text-[#6b7280]'
              }`}
            >
              內建型錄
            </button>
            <button
              onClick={() => setSectionMode('manual')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-all ${
                sectionMode === 'manual' ? 'bg-white text-[#1a1a2e] shadow-sm' : 'text-[#6b7280]'
              }`}
            >
              手動輸入
            </button>
          </div>
        </div>

        {sectionMode === 'preset' ? (
          <div className="space-y-2">
            <SelectField
              label="斷面規格"
              value={presetLabel}
              onChange={setPresetLabel}
              options={STEEL_SECTION_LABELS.map((l) => ({ value: l, label: l }))}
            />
            {presetInfo && (
              <div className="grid grid-cols-2 gap-x-3 gap-y-1 mt-2 px-1 text-xs text-[#6b7280]">
                <div className="flex justify-between"><span>單位重</span><span className="tabular-nums text-[#1a1a2e]">{presetInfo.unitWeight} kg/m</span></div>
                <div className="flex justify-between"><span>A</span><span className="tabular-nums text-[#1a1a2e]">{presetInfo.A} cm²</span></div>
                <div className="flex justify-between"><span>Ix</span><span className="tabular-nums text-[#1a1a2e]">{presetInfo.Ix} cm⁴</span></div>
                <div className="flex justify-between"><span>Zx</span><span className="tabular-nums text-[#1a1a2e]">{presetInfo.Zx} cm³</span></div>
                <div className="flex justify-between"><span>h × tw</span><span className="tabular-nums text-[#1a1a2e]">{presetInfo.h} × {presetInfo.tw}</span></div>
              </div>
            )}
            <div className="mt-2 text-xs text-[#9ca3af]">
              註：型錄共 {STEEL_SECTIONS.length} 種規格，依 JIS/CNS 通用尺寸。
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <NumberField label="高 h" value={manualSection.h} onChange={(v) => setManualSection({ ...manualSection, h: v })} unit="mm" />
            <NumberField label="腹板厚 tw" value={manualSection.tw} onChange={(v) => setManualSection({ ...manualSection, tw: v })} unit="mm" />
            <NumberField label="斷面積 A" value={manualSection.A} onChange={(v) => setManualSection({ ...manualSection, A: v })} unit="cm²" />
            <NumberField label="慣性矩 Ix" value={manualSection.Ix} onChange={(v) => setManualSection({ ...manualSection, Ix: v })} unit="cm⁴" />
            <NumberField label="斷面模數 Zx" value={manualSection.Zx} onChange={(v) => setManualSection({ ...manualSection, Zx: v })} unit="cm³" />
            <NumberField label="單位重" value={manualSection.unitWeight} onChange={(v) => setManualSection({ ...manualSection, unitWeight: v })} unit="kg/m" />
          </div>
        )}
      </section>

      {/* ─── 區塊 3：鋼材等級 ─── */}
      <section className="bg-white border border-gray-100 rounded-xl p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">鋼材</div>
        <SelectField
          label="鋼材等級"
          value={grade}
          onChange={(v) => setGrade(v as SteelGrade)}
          options={STEEL_GRADE_LABELS.map((g) => ({ value: g, label: g }))}
        />
      </section>

      {/* ─── 區塊 4：荷重 ─── */}
      <section className="bg-white border border-gray-100 rounded-xl p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">荷重</div>
        <label className="flex items-center gap-2 mb-3 cursor-pointer">
          <input
            type="checkbox"
            checked={includeSelfWeight}
            onChange={(e) => setIncludeSelfWeight(e.target.checked)}
            className="w-4 h-4 accent-[#2563eb]"
          />
          <span className="text-sm text-[#1a1a2e]">
            自重自動計入
            {includeSelfWeight && result.selfWeightKnm > 0 && (
              <span className="text-xs text-[#6b7280] ml-1">（{fmt2(result.selfWeightKnm)} kN/m）</span>
            )}
          </span>
        </label>
        <LoadCaseEditor loads={loads} onChange={setLoads} />
      </section>

      {/* ─── 區塊 5：撓度限制 ─── */}
      <section className="bg-white border border-gray-100 rounded-xl p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">撓度限制</div>
        <SelectField
          label="限制比"
          value={deflectionLimit}
          onChange={setDeflectionLimit}
          options={DEFLECTION_OPTIONS}
        />
      </section>

      {/* ─── 區塊 6：結果 ─── */}
      <section className="bg-white border border-gray-100 rounded-xl p-4">
        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">計算結果</div>

        {!hasValidInput ? (
          <div className="text-sm text-[#9ca3af] py-3 text-center">
            請完成基本與斷面輸入
          </div>
        ) : (
          <>
            {/* 最大值 */}
            <div className="bg-gray-50/60 rounded-lg p-3 mb-3">
              <ResultRow label="最大彎矩 Mmax" value={`${fmt2(result.Mmax)} kN·m  @ x=${fmt2(result.xMmax)} m`} highlight />
              <ResultRow label="最大剪力 Vmax" value={`${fmt2(result.Vmax)} kN  @ x=${fmt2(result.xVmax)} m`} />
              <ResultRow label="最大撓度 δmax" value={`${fmt1(result.deltaMaxMm)} mm  @ x=${fmt2(result.xDeltaMax)} m`} />
              <ResultRow label="撓度比" value={fmtRatio(result.deltaRatio)} />
            </div>

            {/* 應力檢核 */}
            <div className="border-t border-gray-100 pt-2">
              <div className="text-xs font-semibold text-[#6b7280] mb-1">應力與撓度檢核</div>
              <CheckRow
                label="彎曲應力 σb"
                demand={`${fmt1(result.sigmaB)} MPa`}
                allowable={`${result.sigmaBAllow} MPa`}
                util={result.bendingUtil}
                ok={result.bendingOK}
              />
              <CheckRow
                label="剪應力 τ"
                demand={`${fmt1(result.tau)} MPa`}
                allowable={`${result.tauAllow} MPa`}
                util={result.shearUtil}
                ok={result.shearOK}
              />
              <CheckRow
                label="撓度"
                demand={fmtRatio(result.deltaRatio)}
                allowable={`L/${deflectionLimit}`}
                util={result.deflectionUtil}
                ok={result.deflectionOK}
              />
            </div>

            {/* 綜合 */}
            <div className={`mt-3 p-3 rounded-lg flex items-center justify-between ${
              result.overallOK ? 'bg-emerald-50 border border-emerald-100' : 'bg-rose-50 border border-rose-100'
            }`}>
              <div>
                <div className={`text-base font-semibold ${result.overallOK ? 'text-emerald-700' : 'text-rose-700'}`}>
                  {result.overallOK ? '✓ 整體 OK' : '✗ 整體 NG'}
                </div>
                <div className="text-xs text-[#6b7280] mt-0.5">最大利用率 {fmtUtil(result.maxUtil)}</div>
              </div>
              <div className="text-xs text-right text-[#6b7280]">
                <div>斷面：{result.section.label}</div>
                <div>鋼材：{grade}</div>
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
