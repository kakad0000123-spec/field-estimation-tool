// Verification v2: ASD / LRFD / biaxial / load combination scenarios
import { ALLOW_SECTIONS, getPlasticZx, getElasticSy } from '../src/data/allowable/sections';
import { ALLOW_GRADES } from '../src/data/allowable/grades';
import { ALLOW_DEFLECTIONS } from '../src/data/allowable/deflection';
import { calcBeam, BeamInput, DesignMethod, SupportType } from '../src/calc/allowable/beam';

const sn400b = ALLOW_GRADES.find((g) => g.label === 'CNS SN400B / SM400 (t≤40)')!;
const def240 = ALLOW_DEFLECTIONS.find((d) => d.label === '一般鋼梁｜總載重撓度 L/240')!;
const def800 = ALLOW_DEFLECTIONS.find((d) => d.label === '天車梁(Monorail)｜簡支單軌 L/800')!;

function run(name: string, params: Partial<BeamInput> & { sectionLabel: string }) {
  const section = ALLOW_SECTIONS.find((s) => s.label === params.sectionLabel)!;
  const input: BeamInput = {
    method: 'ASD' as DesignMethod,
    usage: '一般鋼梁', support: '簡支梁' as SupportType,
    section, grade: sn400b, deflection: def240,
    span: 6000, includeSelfWeight: true,
    D_add: 0,
    L_uniform: 0, L_point: 0, L_impact: 1.0,
    W_uniform: 0, W_point: 0,
    E_point: 0,
    My_input: 0,
    compressionContinuous: false,
    Lb_mm: 0, Cb: 1.0,
    ...params,
  } as BeamInput;
  const r = calcBeam(input);

  console.log('\n=== ' + name + ' ===');
  console.log('method:', r.method, '| section:', params.sectionLabel, '| support:', input.support);
  console.log('Sx:', r.Sx, 'mm³ | Zx:', r.Zx.toFixed(0), 'mm³ | Sy:', r.Sy.toFixed(0), '| Zy:', r.Zy.toFixed(0));
  console.log('Classification:', r.classification, '| LTB zone:', r.ltbZone, '| Lb used:', r.Lb_used_mm.toFixed(0), 'mm');
  console.log('Lp:', r.Lp_mm.toFixed(0), 'mm | Lr:', Number.isFinite(r.Lr_mm) ? r.Lr_mm.toFixed(0) : '∞', 'mm | Reduction factor:', (r.reductionFactor*100).toFixed(1)+'%');
  console.log('Mcx:', r.Mcx_kgm.toFixed(1), 'kg·m (full:', r.Mcx_full_kgm.toFixed(1), ') | Mcy:', r.Mcy_kgm.toFixed(1), 'kg·m | Vc:', r.Vc_kg.toFixed(0), 'kg | Δa:', r.delta_allow.toFixed(2), 'mm');
  console.log('wD:', r.wD_total.toFixed(3), 'kg/m');
  console.log('Combinations:');
  for (const c of r.combos) {
    const star = c === r.controlCombo ? ' ★控制' : '';
    console.log(`  ${c.label.padEnd(20)} w=${c.w_kgPerM.toFixed(1).padStart(7)} kg/m  p=${c.p_kg.toFixed(0).padStart(6)} kg  M=${c.M_kgm.toFixed(1).padStart(8)} V=${c.V_kg.toFixed(1).padStart(7)}${star}`);
  }
  console.log('Control combo:', r.controlCombo?.label, '| M_act:', r.M_act.toFixed(1), '| V_act:', r.V_act.toFixed(1), '| Δ_act:', r.delta_act.toFixed(2));
  console.log('IR_x:', (r.IR_M_x*100).toFixed(1)+'%', '| IR_y:', (r.IR_M_y*100).toFixed(1)+'%', '| IR_biax:', (r.IR_biaxial*100).toFixed(1)+'%', '| IR_V:', (r.IR_V*100).toFixed(1)+'%', '| IR_Δ:', (r.IR_delta*100).toFixed(1)+'%');
  console.log('overall:', r.overall, '| controlBy:', r.controlBy);
}

// ── 1. ASD vs LRFD 容量比對 (同一梁、無載重組合差異)
console.log('\n══════════════ Capacity comparison ASD vs LRFD ══════════════');
console.log('Section H-200x100x5.5x8, SN400B (Fy=235 MPa)');
const s = ALLOW_SECTIONS.find(x => x.label === 'H-200x100x5.5x8')!;
console.log('Sx =', s.Sx, '| Zx =', getPlasticZx(s).toFixed(0), '| ratio Zx/Sx =', (getPlasticZx(s)/s.Sx!).toFixed(3));
console.log('Sy =', getElasticSy(s).toFixed(0));

// ── 2. ASD 簡支 + 集中 + 均佈（沿用舊測試的等價）
run('SAMPLE 1: ASD 一般梁 D+L', {
  method: 'ASD', sectionLabel: 'H-200x100x5.5x8',
  span: 4000, L_uniform: 200, L_impact: 1.0,
});

// ── 3. LRFD 同樣案例 (預期容量大 ≈ 0.9 × 1.12 × Fy/(0.66 Fy) = 1.53 倍)
run('SAMPLE 2: LRFD 一般梁 D+L (相同輸入)', {
  method: 'LRFD', sectionLabel: 'H-200x100x5.5x8',
  span: 4000, L_uniform: 200, L_impact: 1.0,
});

// ── 4. 天車梁 LRFD 含衝擊
run('SAMPLE 3: LRFD 天車梁 集中 2000 kg × 1.25', {
  method: 'LRFD', usage: '天車梁(Monorail)' as never,
  sectionLabel: 'I-300x150x10x18.5',
  span: 6000, L_point: 2000, L_impact: 1.25,
  deflection: def800 as never,
});

// ── 5. LRFD + 雙軸彎矩 (My)
run('SAMPLE 4: LRFD 雙軸 My=300 kg·m', {
  method: 'LRFD', sectionLabel: 'H-200x200x8x12',
  span: 5000, L_uniform: 300, My_input: 300,
});

// ── 6. ASD + 風力組合
run('SAMPLE 5: ASD 含風 W (上吸 -150 kg/m)', {
  method: 'ASD', sectionLabel: 'H-300x150x6.5x9',
  span: 4000, L_uniform: 150, W_uniform: -150,
});

// ── 7. LRFD 含地震反力
run('SAMPLE 6: LRFD 設備梁含地震反力 E=800 kg', {
  method: 'LRFD', sectionLabel: 'H-300x150x6.5x9',
  span: 5000, L_point: 1500, E_point: 800,
  deflection: ALLOW_DEFLECTIONS.find(d => d.label === '設備支承梁｜其他設備 L/400 且 ≤ 21 mm') as never,
});

// ── 8. 故意 NG: LRFD 超載
run('SAMPLE 7: LRFD NG 超載', {
  method: 'LRFD', sectionLabel: 'H-100x50x5x7',
  span: 6000, L_point: 5000, L_impact: 1.0,
});

// ── 9. 結實性分類測試（短跨 + 壓力翼板連續）
run('SAMPLE 8: Compact, 壓力側連續支撐 (無 LTB)', {
  method: 'LRFD', sectionLabel: 'H-200x200x8x12',
  span: 4000, L_uniform: 300,
  compressionContinuous: true,
});

// ── 10. LTB 塑性區 (Lb < Lp)
run('SAMPLE 9: 短 Lb=500mm，預期 Plastic LTB', {
  method: 'LRFD', sectionLabel: 'H-200x200x8x12',
  span: 4000, L_uniform: 300,
  Lb_mm: 500,
});

// ── 11. LTB 非彈性區 (Lp < Lb < Lr)
run('SAMPLE 10: 中等 Lb=3000mm，預期 Inelastic LTB', {
  method: 'LRFD', sectionLabel: 'H-300x150x6.5x9',
  span: 6000, L_uniform: 200,
  Lb_mm: 3000,
});

// ── 12. LTB 彈性區 (Lb > Lr，大幅折減)
run('SAMPLE 11: 長 Lb=8000mm，預期 Elastic LTB', {
  method: 'LRFD', sectionLabel: 'H-300x150x6.5x9',
  span: 8000, L_uniform: 100,
  Lb_mm: 8000,
});

// ── 13. 細長腹板測試
run('SAMPLE 12: 嘗試一根薄腹板 H 形（看是否 Non-compact）', {
  method: 'LRFD', sectionLabel: 'H-700x300x13x24',
  span: 6000, L_uniform: 500,
  compressionContinuous: true,
});
