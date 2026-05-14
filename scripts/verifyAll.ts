// Cross-check all 4 calculators vs Excel defaults
import { ALLOW_SECTIONS } from '../src/data/allowable/sections';
import { ALLOW_GRADES } from '../src/data/allowable/grades';
import { ALLOW_GRATINGS } from '../src/data/allowable/grating';
import { ALLOW_DECKS, ALLOW_WWMS } from '../src/data/allowable/deck';
import { calcColumn } from '../src/calc/allowable/column';
import { calcGrating } from '../src/calc/allowable/grating';
import { calcDeck } from '../src/calc/allowable/deck';

console.log('\n══════════ 鋼柱 (Excel 預設值對照) ══════════');
console.log('Excel 預設：H-200x200x8x12 / SN400B / H=3000mm / K=1 / P=5000 kg / Mx=200 kg·m');
const colSection = ALLOW_SECTIONS.find((s) => s.label === 'H-200x200x8x12')!;
const colGrade = ALLOW_GRADES.find((g) => g.label === 'CNS SN400B / SM400 (t≤40)')!;
const col = calcColumn({
  section: colSection, grade: colGrade,
  height: 3000, K: 1, P: 5000, Mx: 200, My: 0, includeSelfWeight: true,
});
console.log('Section A =', colSection.A, 'mm² | ry =', colSection.ry, 'mm | Sx =', colSection.Sx, 'mm³');
console.log('selfWeight =', col.selfWeight.toFixed(2), 'kg | P_total =', col.P_total.toFixed(2), 'kg');
console.log('KL/r =', col.KL_over_r.toFixed(2), '| Cc =', col.Cc.toFixed(2), '| governing:', col.governingFormula);
console.log('Fa =', col.Fa_MPa.toFixed(2), 'MPa | Pa =', col.Pa_kg.toFixed(0), 'kg');
console.log('fa =', col.fa_MPa.toFixed(2), 'MPa | fbx =', col.fbx_MPa.toFixed(2), 'MPa | fby =', col.fby_MPa.toFixed(2), 'MPa');
console.log('IR_axial =', (col.IR_axial * 100).toFixed(1), '% | IR_combined =', (col.IR_combined * 100).toFixed(1), '%');
console.log('overall:', col.overall, '| controlBy:', col.controlBy);

console.log('\n══════════ 格柵 (Excel 預設值對照) ══════════');
console.log('Excel 預設：25×3 @30 溝距200 / L=1000mm / 簡支 / L/n=200 / P=100 kg / w=500 kg/m² / 接觸寬225 / Fy=235.36');
const grating = ALLOW_GRATINGS.find((g) => g.label === '25×3 @30 溝距200')!;
const gr = calcGrating({
  grating, span: 1000, support: '簡支梁', L_over_n: 200,
  P: 100, w: 500, contactWidth: 225, Fy_MPa: 235.36,
});
console.log('rib I =', gr.I_rib.toFixed(0), 'mm⁴ | S =', gr.S_rib.toFixed(1), 'mm³ | A =', gr.A_rib, 'mm²');
console.log('M_allow/rib =', gr.M_allow_rib.toFixed(0), 'kg·mm | V_allow/rib =', gr.V_allow_rib.toFixed(1), 'kg | Δa =', gr.deflection_allow.toFixed(1), 'mm');
console.log('ribsPerMeter =', gr.ribsPerMeter.toFixed(2), '| ribsLoaded =', gr.ribsLoaded);
console.log('均佈: ratio_M =', (gr.ratio_w_M*100).toFixed(1), '% V=', (gr.ratio_w_V*100).toFixed(1), '% Δ=', (gr.ratio_w_delta*100).toFixed(1), '%', '|', gr.check_uniform, '|', gr.controlBy_uniform);
console.log('集中: ratio_M =', (gr.ratio_P_M*100).toFixed(1), '% V=', (gr.ratio_P_V*100).toFixed(1), '% Δ=', (gr.ratio_P_delta*100).toFixed(1), '%', '|', gr.check_concentrated, '|', gr.controlBy_concentrated);
console.log('w_max_allow =', gr.w_max_allow, 'kg/m² | P_max_allow =', gr.P_max_allow, 'kg');

console.log('\n══════════ Deck樓板 (Excel 預設值對照) ══════════');
console.log('Excel 預設：3.0W-1.2mm / f\'c=3000 psi / tc=80mm / WWM φ4.0@150×150 / L=2000mm / 單跨 / wL=500 / wD_add=50');
const deck = ALLOW_DECKS.find((d) => d.label === '3.0W-1.2mm')!;
const wwm = ALLOW_WWMS.find((w) => w.label === 'φ4.0@150×150')!;
const dk = calcDeck({
  deck, wwm,
  deckFy: 250, rebarAs: 0, rebarFy: 420,
  fc_psi: 3000, tc: 80, density: 2400, wwmCover: 20,
  span: 2000, support: '單跨', wL: 500, wD_add: 50,
  L_over_n: 240, phi: 0.9,
});
console.log('f\'c =', dk.fc_MPa.toFixed(2), 'MPa | total thk =', dk.totalThickness, 'mm');
console.log('混凝土自重 =', dk.concreteSelfWeight, 'kg/m² | wD_total =', dk.wD_total.toFixed(1), 'kg/m² | wu =', dk.wu_kgPerM2.toFixed(0), 'kg/m²');
console.log('φMn+ =', dk.phiMn_pos.toFixed(0), 'kg·m/m | φMn- =', dk.phiMn_neg.toFixed(0), 'kg·m/m | φVc =', dk.phiVc.toFixed(0), 'kg/m');
console.log('Mu+ =', dk.Mu_pos.toFixed(1), 'kg·m/m | Vu =', dk.Vu.toFixed(1), 'kg/m | Δ_act =', dk.delta_act.toFixed(2), 'mm (Δa =', dk.delta_allow.toFixed(2), ')');
console.log('IR: M+=', (dk.IR_M_pos*100).toFixed(1), '% V=', (dk.IR_V*100).toFixed(1), '% Δ=', (dk.IR_delta*100).toFixed(1), '%');
console.log('overall:', dk.overall, '| controlBy:', dk.controlBy, '| wL_max =', dk.wL_max, 'kg/m²');
