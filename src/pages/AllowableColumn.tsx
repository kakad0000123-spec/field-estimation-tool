import { useEffect, useMemo, useState } from 'react';
import { STORAGE_KEYS, StoredColumn, readStored, writeStored } from '../data/allowable/storageKeys';
import { getAllowSection } from '../data/allowable/sections';
import { ALLOW_GRADES, getAllowGrade } from '../data/allowable/grades';
import { ALLOW_SECTION_DROPDOWN, ALLOW_SHAPE_TYPES } from '../data/allowable/dropdown';
import { calcColumn } from '../calc/allowable/column';
import { NumberField, SelectField, SafetyBanner, SectionHeader } from '../components/FormFields';
import { Row, Stat, Hr, VerdictBlock, fmt0, fmt1, fmt2, fmtPct } from '../components/allowable/uiHelpers';

interface Props {
  onBack: () => void;
}

export default function AllowableColumn({ onBack }: Props) {
  const stored = useMemo(() => readStored<StoredColumn>(STORAGE_KEYS.column), []);
  const [shape, setShape] = useState(() => stored?.shape ?? 'H形鋼');
  const [sectionLabel, setSectionLabel] = useState(() => stored?.sectionLabel ?? 'H-200x200x8x12');
  const [gradeLabel, setGradeLabel] = useState(() => stored?.gradeLabel ?? 'CNS SN400B / SM400 (t≤40)');
  const [height, setHeight] = useState(() => stored?.height ?? 3000);
  const [K, setK] = useState(() => stored?.K ?? 1.0);
  const [P, setP] = useState(() => stored?.P ?? 5000);
  const [Mx, setMx] = useState(() => stored?.Mx ?? 200);
  const [My, setMy] = useState(() => stored?.My ?? 0);
  const [includeSelfWeight, setIncludeSelfWeight] = useState(() => stored?.includeSelfWeight ?? true);

  useEffect(() => {
    writeStored<StoredColumn>(STORAGE_KEYS.column, {
      shape, sectionLabel, gradeLabel, height, K, P, Mx, My, includeSelfWeight,
    });
  }, [shape, sectionLabel, gradeLabel, height, K, P, Mx, My, includeSelfWeight]);

  const section = useMemo(() => getAllowSection(sectionLabel) ?? null, [sectionLabel]);
  const grade = useMemo(() => getAllowGrade(gradeLabel) ?? null, [gradeLabel]);

  const sectionsForShape = useMemo(() => ALLOW_SECTION_DROPDOWN[shape] ?? [], [shape]);
  useEffect(() => {
    if (sectionsForShape.length && !sectionsForShape.includes(sectionLabel)) {
      setSectionLabel(sectionsForShape[0]);
    }
  }, [sectionsForShape, sectionLabel]);

  const r = useMemo(() => calcColumn({
    section, grade, height, K, P, Mx, My, includeSelfWeight,
  }), [section, grade, height, K, P, Mx, My, includeSelfWeight]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-16" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button onClick={onBack} className="text-xl text-[#6b7280] w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">←</button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-[#1a1a2e] leading-tight">鋼柱 容許軸力與梁柱組合檢核</h1>
            <p className="text-[11px] text-[#9ca3af] leading-tight">ASD 法 · AISC 主公式/Euler + 線性疊加</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
        <section className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <SectionHeader icon="📝" title="設計設定（輸入）" />
          <div className="mt-3 space-y-2">
            <SelectField label="鋼構形式" value={shape} onChange={setShape}
              options={ALLOW_SHAPE_TYPES.map((t) => ({ value: t, label: t }))} />
            <SelectField label="斷面規格" value={sectionLabel} onChange={setSectionLabel}
              options={sectionsForShape.map((s) => ({ value: s, label: s }))} />
            <SelectField label="鋼材類別" value={gradeLabel} onChange={setGradeLabel}
              options={ALLOW_GRADES.map((g) => ({ value: g.label, label: g.label }))} />
            <NumberField label="柱淨高 H" value={height} onChange={setHeight} unit="mm" placeholder="例: 3000" />
            <NumberField label="K 有效長度" value={K} onChange={setK} unit=""
              placeholder="鉸接 1.0；柱頂自由 2.0；固接 0.5" />
            <NumberField label="軸力 P" value={P} onChange={setP} unit="kg" />
            <NumberField label="強軸彎矩 Mx" value={Mx} onChange={setMx} unit="kg·m" />
            <NumberField label="弱軸彎矩 My" value={My} onChange={setMy} unit="kg·m" />
            <SelectField label="納入自重" value={includeSelfWeight ? 'yes' : 'no'}
              onChange={(v) => setIncludeSelfWeight(v === 'yes')}
              options={[{ value: 'yes', label: '是' }, { value: 'no', label: '否' }]} />
          </div>
        </section>

        <section className="bg-gray-50 rounded-xl border border-gray-100 p-4">
          <SectionHeader icon="🏗️" title="斷面性質（自動帶入）" />
          {section ? (
            <div className="mt-2 grid grid-cols-3 gap-x-3 gap-y-1.5 text-[13px] tabular-nums">
              <Stat label="H/d" v={section.d} u="mm" />
              <Stat label="B/bf" v={section.bf} u="mm" />
              <Stat label="tw/tf" v={`${section.tw}/${section.tf}`} u="mm" />
              <Stat label="A" v={section.A} u="mm²" />
              <Stat label="單位重" v={section.weight} u="kg/m" />
              <Stat label="rx/ry" v={`${section.rx}/${section.ry}`} u="mm" />
              <Stat label="Ix" v={section.Ix} u="mm⁴" />
              <Stat label="Sx" v={section.Sx} u="mm³" />
              <Stat label="Iy" v={section.Iy} u="mm⁴" />
            </div>
          ) : <div className="text-sm text-gray-400 mt-2">尚未選擇斷面</div>}
        </section>

        <section className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <SectionHeader icon="🔢" title="細長比與容許壓應力" />
          <div className="mt-3 space-y-1">
            <Row label="自重" value={`${fmt1(r.selfWeight)} kg`} />
            <Row label="總壓力" value={`${fmt0(r.P_total)} kg`} bold />
            <Hr />
            <Row label="有效細長比 KL/r" value={fmt2(r.KL_over_r)} />
            <Row label="Cc 過渡細長比 √(2π²E/Fy)" value={fmt2(r.Cc)} />
            <Row label="採用公式" value={r.governingFormula || '—'} />
            <Hr />
            <Row label="Fa 容許壓應力" value={`${fmt2(r.Fa_MPa)} MPa`} bold />
            <Row label="Pa 容許軸力" value={`${fmt0(r.Pa_kg)} kg`} bold />
            <Row label="Fb 容許彎曲應力" value={`${fmt2(r.Fb_MPa)} MPa`} />
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <SectionHeader icon="✅" title="實際應力與檢核" />
          <div className="mt-2 text-[12px] text-[#6b7280] space-y-0.5">
            <div>fa = P_total × g / A = {fmt2(r.fa_MPa)} MPa（容許 {fmt2(r.Fa_MPa)}）</div>
            <div>fbx = Mx × g × 1000 / Sx = {fmt2(r.fbx_MPa)} MPa（容許 {fmt2(r.Fb_MPa)}）</div>
            {My > 0 && <div>fby = My × g × 1000 / Sy = {fmt2(r.fby_MPa)} MPa</div>}
          </div>
          <div className="mt-3 space-y-2">
            <SafetyBanner label="純軸力" ir={r.IR_axial}
              capacity={{ value: r.Pa_kg, unit: 'kg', label: 'Pa' }}
              demand={{ value: r.P_total, unit: 'kg', label: 'P_total' }} />
            <SafetyBanner label="梁柱組合 (fa/Fa + fbx/Fbx + fby/Fby)" ir={r.IR_combined}
              capacity={{ value: 1, unit: '', label: '上限' }}
              demand={{ value: r.IR_combined, unit: '', label: '組合比' }} />
          </div>
        </section>

        <VerdictBlock
          overall={r.overall}
          controlBy={r.controlBy}
          okMsg="柱子可以安全使用"
          ngMsg="不安全"
          ngDetail={r.check_axial === 'NG'
            ? '純壓力超標 — 換大斷面或減少軸力'
            : '梁柱組合應力超標 — 減少彎矩或加大斷面'}
        />

        <section className="bg-amber-50 rounded-xl border border-amber-200 p-4">
          <SectionHeader icon="🏋" title="容許上限（白話翻譯）" />
          <div className="mt-2 space-y-1 text-[13px] text-amber-900">
            <Row label="純軸力容許 Pa" value={`${fmt0(r.Pa_kg)} kg`} bold />
            <Row label="軸力利用率" value={fmtPct(r.IR_axial)} />
            <Row label="組合應力比 (≤1.0)" value={fmt2(r.IR_combined)} />
            <Hr />
            <div className="text-[12px] leading-relaxed">
              📌 純軸力時最多可承受 <b>{fmt0(r.Pa_kg)}</b> kg<br />
              📌 加上彎矩後，組合比需 ≤ 1.0；越接近 1 越危險
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 p-4">
          <SectionHeader icon="📖" title="引用依據與設計邊界" />
          <div className="mt-2 text-[12px] text-[#6b7280] leading-relaxed space-y-1">
            <div><b className="text-[#1a1a2e]">設計方法：</b>容許應力設計法 (ASD)，AISC 主公式（KL/r ≤ Cc）/ Euler（KL/r &gt; Cc）</div>
            <div><b className="text-[#1a1a2e]">設計規範：</b>鋼構造建築物鋼結構設計技術規範及解說（內政部營建署）／AISC 360</div>
            <div><b className="text-[#1a1a2e]">材料規範：</b>CNS 2473（SS400）／CNS 13812（SN 系列）／ASTM A36、A572</div>
            <div><b className="text-[#1a1a2e]">梁柱組合：</b>採簡化 H1 線性疊加 fa/Fa + fbx/Fbx + fby/Fby ≤ 1</div>
            <div className="pt-1 border-t border-gray-100 mt-2">
              <b className="text-[#1a1a2e]">設計邊界（適用範圍）：</b>
              <ol className="ml-4 list-decimal mt-1 space-y-0.5">
                <li>K 值：鉸接 1.0；柱頂自由 2.0；兩端固接 0.5（依端部約束選擇）</li>
                <li>細長比 KL/r 建議 ≤ 200（一般構材）；本表未自動檢核</li>
                <li>未檢核局部挫屈、扭轉挫屈、接頭強度</li>
                <li>未含 Cm 修正、P-Δ / P-δ 二次效應</li>
                <li>本工具為初估用，最終設計請結構技師確認</li>
              </ol>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
