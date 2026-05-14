// Verification: cross-check TS port vs Excel sample cases
// Three load modes × two support types
import { ALLOW_SECTIONS } from '../src/data/allowable/sections';
import { ALLOW_GRADES } from '../src/data/allowable/grades';
import { ALLOW_DEFLECTIONS } from '../src/data/allowable/deflection';
import { calcBeam, BeamInput, SupportType, LoadType } from '../src/calc/allowable/beam';

const sn400b = ALLOW_GRADES.find((g) => g.label === 'CNS SN400B / SM400 (t≤40)')!;
const def240 = ALLOW_DEFLECTIONS.find((d) => d.label === '一般鋼梁｜總載重撓度 L/240')!;
const def800 = ALLOW_DEFLECTIONS.find((d) => d.label === '天車梁(Monorail)｜簡支單軌 L/800')!;

function run(name: string, params: Partial<BeamInput> & { sectionLabel: string }) {
  const section = ALLOW_SECTIONS.find((s) => s.label === params.sectionLabel)!;
  const input: BeamInput = {
    usage: '一般鋼梁', support: '簡支梁', loadType: '集中荷重',
    section, grade: sn400b, deflection: def240,
    span: 6000, includeSelfWeight: true, wD_add: 0,
    P: 0, wL: 0, loadFactor: 1.0,
    ...params,
  } as BeamInput;
  const r = calcBeam(input);

  console.log('\n=== ' + name + ' ===');
  console.log('section:', params.sectionLabel, '| support:', input.support, '| loadType:', input.loadType,
    '| span:', input.span, '| P:', input.P, '| wL:', input.wL, '| factor:', input.loadFactor);
  console.log('Fb/Fv:', r.Fb_MPa.toFixed(2), '/', r.Fv_MPa.toFixed(2), 'MPa');
  console.log('M_allow:', r.M_allow.toFixed(2), 'kg·m | V_allow:', r.V_allow.toFixed(0), 'kg | Δa:', r.deflection_allow.toFixed(2), 'mm');
  console.log('wD:', r.wD.toFixed(3), 'kg/m | MD:', r.MD.toFixed(2), 'kg·m | ΔD:', r.deltaD.toFixed(3), 'mm');
  console.log('M_act:', r.M_act.toFixed(2), 'kg·m | V_act:', r.V_act.toFixed(2), 'kg | Δ_act:', r.delta_act.toFixed(3), 'mm');
  console.log('ratios: M=' + (r.ratio_M*100).toFixed(1) + '% V=' + (r.ratio_V*100).toFixed(1) + '% Δ=' + (r.ratio_delta*100).toFixed(1) + '%');
  console.log('overall:', r.overall, '| controlBy:', r.controlBy, '| exceeded:', r.exceeded);
  console.log('Ps_service:', r.Ps_service.toFixed(2), 'kg | Pr:', r.Pr_rated.toFixed(2), 'kg | qs_service:', r.qs_service.toFixed(2), 'kg/m');
}

// 1. Excel 預設樣本 — 簡支 + 集中（已驗證 M_allow ≈ 564, ratio_δ ≈ 22.67%）
run('SAMPLE 1: 簡支+集中 (Excel default)', {
  sectionLabel: 'H-100x50x5x7', P: 10, loadFactor: 1.25,
});

// 2. 簡支 + 均佈
run('SAMPLE 2: 簡支+均佈', {
  sectionLabel: 'H-200x100x5.5x8', loadType: '均佈荷重' as LoadType,
  span: 4000, wL: 200, loadFactor: 1.0,
});

// 3. 懸臂 + 集中
run('SAMPLE 3: 懸臂+集中', {
  sectionLabel: 'H-200x100x5.5x8', support: '懸臂梁' as SupportType,
  span: 2000, P: 300, loadFactor: 1.0,
});

// 4. 懸臂 + 均佈
run('SAMPLE 4: 懸臂+均佈', {
  sectionLabel: 'H-300x150x6.5x9', support: '懸臂梁' as SupportType,
  loadType: '均佈荷重' as LoadType, span: 2500, wL: 100, loadFactor: 1.0,
});

// 5. 天車梁 — Excel 範例三
run('SAMPLE 5: 天車梁(Monorail) Excel R81-91', {
  sectionLabel: 'I-300x150x10x18.5', P: 2000, loadFactor: 1.25,
  deflection: def800 as never,
});

// 6. NG 案例 — 故意超載
run('SAMPLE 6: NG 故意超載', {
  sectionLabel: 'H-100x50x5x7', P: 5000, loadFactor: 1.0,
});
