import { useEffect, useMemo, useState } from 'react';
import { STORAGE_KEYS, StoredDeck, readStored, writeStored } from '../data/allowable/storageKeys';
import { ALLOW_DECKS, ALLOW_WWMS, getAllowDeck, getAllowWWM } from '../data/allowable/deck';
import { calcDeck, DeckSupport } from '../calc/allowable/deck';
import { NumberField, SelectField, SafetyBanner, SectionHeader } from '../components/FormFields';
import { Row, Stat, Hr, VerdictBlock, fmt0, fmt1, fmt2, fmtPct } from '../components/allowable/uiHelpers';

interface Props {
  onBack: () => void;
}

const SUPPORTS: DeckSupport[] = ['單跨', '雙跨連續', '三跨以上'];

export default function AllowableDeck({ onBack }: Props) {
  const stored = useMemo(() => readStored<StoredDeck>(STORAGE_KEYS.deck), []);
  const [deckLabel, setDeckLabel] = useState(() => stored?.deckLabel ?? '3.0W-1.2mm');
  const [wwmLabel, setWwmLabel] = useState(() => stored?.wwmLabel ?? 'φ4.0@150×150');
  const [deckFy, setDeckFy] = useState(() => stored?.deckFy ?? 250);
  const [rebarAs, setRebarAs] = useState(() => stored?.rebarAs ?? 0);
  const [rebarFy, setRebarFy] = useState(() => stored?.rebarFy ?? 420);
  const [fc_psi, setFcPsi] = useState(() => stored?.fc_psi ?? 3000);
  const [tc, setTc] = useState(() => stored?.tc ?? 80);
  const [density, setDensity] = useState(() => stored?.density ?? 2400);
  const [wwmCover, setWwmCover] = useState(() => stored?.wwmCover ?? 20);
  const [span, setSpan] = useState(() => stored?.span ?? 2000);
  const [support, setSupport] = useState<DeckSupport>(() => (stored?.support as DeckSupport) ?? '單跨');
  const [wL, setWL] = useState(() => stored?.wL ?? 500);
  const [wD_add, setWDadd] = useState(() => stored?.wD_add ?? 50);
  const [L_over_n, setLn] = useState(() => stored?.L_over_n ?? 240);
  const [phi, setPhi] = useState(() => stored?.phi ?? 0.9);

  useEffect(() => {
    writeStored<StoredDeck>(STORAGE_KEYS.deck, {
      deckLabel, wwmLabel, deckFy, rebarAs, rebarFy, fc_psi, tc, density,
      wwmCover, span, support, wL, wD_add, L_over_n, phi,
    });
  }, [deckLabel, wwmLabel, deckFy, rebarAs, rebarFy, fc_psi, tc, density,
      wwmCover, span, support, wL, wD_add, L_over_n, phi]);

  const deck = useMemo(() => getAllowDeck(deckLabel) ?? null, [deckLabel]);
  const wwm = useMemo(() => getAllowWWM(wwmLabel) ?? null, [wwmLabel]);

  const r = useMemo(() => calcDeck({
    deck, wwm, deckFy, rebarAs, rebarFy, fc_psi, tc, density,
    wwmCover, span, support, wL, wD_add, L_over_n, phi,
  }), [deck, wwm, deckFy, rebarAs, rebarFy, fc_psi, tc, density,
       wwmCover, span, support, wL, wD_add, L_over_n, phi]);

  return (
    <div className="min-h-screen bg-[#f8f9fa] pb-16" style={{ fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif" }}>
      <header className="bg-white border-b border-gray-200 px-4 py-3 sticky top-0 z-10">
        <div className="flex items-center gap-3 max-w-2xl mx-auto">
          <button onClick={onBack} className="text-xl text-[#6b7280] w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100">←</button>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-[#1a1a2e] leading-tight">Deck 樓板 使用階段荷重檢核</h1>
            <p className="text-[11px] text-[#9ca3af] leading-tight">LRFD 法 · ACI 318 / 混凝土結構設計規範</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-4 space-y-3">
        <section className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <SectionHeader icon="📝" title="Deck + 混凝土設定" />
          <div className="mt-3 space-y-2">
            <SelectField label="Deck 型號" value={deckLabel} onChange={setDeckLabel}
              options={ALLOW_DECKS.map((d) => ({ value: d.label, label: d.label }))} />
            <NumberField label="Deck fy" value={deckFy} onChange={setDeckFy} unit="MPa" placeholder="一般 250" />
            <NumberField label="底層鋼筋 As" value={rebarAs} onChange={setRebarAs} unit="mm²/m" placeholder="無填 0" />
            <NumberField label="底筋 fy" value={rebarFy} onChange={setRebarFy} unit="MPa" placeholder="SD420=420" />
            <NumberField label="f'c" value={fc_psi} onChange={setFcPsi} unit="psi" placeholder="3000/4000/5000" />
            <NumberField label="波頂以上淨厚 tc" value={tc} onChange={setTc} unit="mm" placeholder="例: 80" />
            <NumberField label="混凝土密度" value={density} onChange={setDensity} unit="kg/m³" placeholder="一般 2400" />
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <SectionHeader icon="🕸" title="WWM 電焊鋼絲網" />
          <div className="mt-3 space-y-2">
            <SelectField label="WWM 規格" value={wwmLabel} onChange={setWwmLabel}
              options={ALLOW_WWMS.map((w) => ({ value: w.label, label: w.label }))} />
            <NumberField label="WWM 自版頂保護層" value={wwmCover} onChange={setWwmCover} unit="mm" placeholder="一般 20" />
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <SectionHeader icon="📏" title="跨度與荷重" />
          <div className="mt-3 space-y-2">
            <NumberField label="跨距 L" value={span} onChange={setSpan} unit="mm" placeholder="例: 2000" />
            <SelectField label="支承條件" value={support} onChange={(v) => setSupport(v as DeckSupport)}
              options={SUPPORTS.map((s) => ({ value: s, label: s }))} />
            <NumberField label="活載重 wL" value={wL} onChange={setWL} unit="kg/m²" placeholder="辦公 250 / 倉庫 500~1000" />
            <NumberField label="附加靜載 wD,add" value={wD_add} onChange={setWDadd} unit="kg/m²" placeholder="地磚/管線" />
            <NumberField label="撓度比 L/n" value={L_over_n} onChange={setLn} unit="" placeholder="一般 240" />
            <NumberField label="強度折減 φ" value={phi} onChange={setPhi} unit="" placeholder="彎曲 0.9" />
          </div>
        </section>

        <section className="bg-gray-50 rounded-xl border border-gray-100 p-4">
          <SectionHeader icon="🏗️" title="自動帶入" />
          <div className="mt-2 grid grid-cols-3 gap-x-3 gap-y-1.5 text-[13px] tabular-nums">
            <Stat label="Deck 波高 hr" v={deck?.hr ?? null} u="mm" />
            <Stat label="Deck As" v={deck?.As ?? null} u="mm²/m" />
            <Stat label="Deck 自重" v={deck?.selfWeight ?? null} u="kg/m²" />
            <Stat label="總版厚" v={r.totalThickness} u="mm" />
            <Stat label="f'c 換算" v={fmt2(r.fc_MPa)} u="MPa" />
            <Stat label="WWM As" v={wwm?.AsY ?? null} u="mm²/m" />
            <Stat label="混凝土自重" v={r.concreteSelfWeight} u="kg/m²" />
            <Stat label="總靜載 wD" v={fmt1(r.wD_total)} u="kg/m²" />
            <Stat label="設計載重 wu" v={fmt0(r.wu_kgPerM2)} u="kg/m²" />
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <SectionHeader icon="🔢" title="斷面強度（自動計算）" />
          <div className="mt-3 space-y-1">
            <Row label="正彎矩強度 φMn+" value={`${fmt0(r.phiMn_pos)} kg·m/m`} bold />
            <Row label="負彎矩強度 φMn-" value={`${fmt0(r.phiMn_neg)} kg·m/m`} bold />
            <Row label="剪力強度 φVc" value={`${fmt0(r.phiVc)} kg/m`} bold />
            <Hr />
            <Row label="設計組合 wu = 1.2 wD + 1.6 wL" value={`${fmt0(r.wu_kgPerM2)} kg/m²`} />
            <Row label="正彎矩需求 Mu+" value={`${fmt1(r.Mu_pos)} kg·m/m`} />
            <Row label="負彎矩需求 Mu-" value={`${fmt1(r.Mu_neg)} kg·m/m`} />
            <Row label="剪力需求 Vu" value={`${fmt1(r.Vu)} kg/m`} />
            <Hr />
            <Row label="實際撓度 Δ" value={`${fmt2(r.delta_act)} mm`} />
            <Row label="容許撓度 Δa = L / n" value={`${fmt2(r.delta_allow)} mm`} />
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <SectionHeader icon="✅" title="檢核" />
          <div className="mt-3 space-y-2">
            <SafetyBanner label="正彎矩" ir={r.IR_M_pos}
              capacity={{ value: r.phiMn_pos, unit: 'kg·m/m', label: 'φMn+' }}
              demand={{ value: r.Mu_pos, unit: 'kg·m/m', label: 'Mu+' }} />
            <SafetyBanner label="剪力" ir={r.IR_V}
              capacity={{ value: r.phiVc, unit: 'kg/m', label: 'φVc' }}
              demand={{ value: r.Vu, unit: 'kg/m', label: 'Vu' }} />
            <SafetyBanner label="撓度" ir={r.IR_delta}
              capacity={{ value: r.delta_allow, unit: 'mm', label: 'Δa' }}
              demand={{ value: r.delta_act, unit: 'mm', label: 'Δ' }} />
          </div>
        </section>

        <VerdictBlock overall={r.overall} controlBy={r.controlBy}
          okMsg="樓板安全"
          ngMsg="樓板超標"
          ngDetail="加厚混凝土、換大號 Deck 或加底筋" />

        <section className="bg-amber-50 rounded-xl border border-amber-200 p-4">
          <SectionHeader icon="🏋" title="容許上限（白話翻譯）" />
          <div className="mt-2 space-y-1 text-[13px] text-amber-900">
            <Row label="最大容許活載 wL,max" value={`${fmt0(r.wL_max)} kg/m²`} bold />
            <Row label="最大利用率" value={fmtPct(Math.max(r.IR_M_pos, r.IR_V, r.IR_delta))} />
            <div className="text-[12px] leading-relaxed mt-2">
              📌 wL,max = wL ÷ 最大利用率<br />
              📌 控制準則「{r.controlBy || '—'}」決定樓板承載力上限
            </div>
          </div>
        </section>

        <section className="bg-white rounded-xl border border-gray-100 p-4">
          <SectionHeader icon="📖" title="引用依據與設計邊界" />
          <div className="mt-2 text-[12px] text-[#6b7280] leading-relaxed space-y-1">
            <div><b className="text-[#1a1a2e]">設計方法：</b>LRFD 極限強度設計法（1.2 wD + 1.6 wL）</div>
            <div><b className="text-[#1a1a2e]">設計規範：</b>混凝土結構設計規範（內政部）／ACI 318</div>
            <div><b className="text-[#1a1a2e]">材料：</b>Deck 鋼板 fy 預設 250 MPa；WWM 預設 fy 490 MPa；底筋 SD280/SD420</div>
            <div><b className="text-[#1a1a2e]">混凝土：</b>常用 3000/4000/5000 psi（≈ 20.7/27.6/34.5 MPa）；密度 2400 kg/m³</div>
            <div className="pt-1 border-t border-gray-100 mt-2">
              <b className="text-[#1a1a2e]">設計邊界（適用範圍）：</b>
              <ol className="ml-4 list-decimal mt-1 space-y-0.5">
                <li>採張力鋼控制（under-reinforced），未驗算最大鋼筋比 ρmax</li>
                <li>連續跨採簡化彎矩係數（雙跨 L²/8，三跨 L²/10）</li>
                <li>未檢核施工載重、振動、火害、剪力黏結滑動</li>
                <li>撓度採開裂斷面轉換 (cracked section transformed)，活載完整套用較保守</li>
                <li>本工具為初估用，最終設計請結構技師確認</li>
              </ol>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
