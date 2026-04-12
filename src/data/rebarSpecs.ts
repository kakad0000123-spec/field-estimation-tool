import { RebarSpec } from './types';

export const REBAR_SPECS: RebarSpec[] = [
  { label: '#3 (D10)', db: 9.53, area: 0.7133, kgPerM: 0.56, dbCm: 0.953, grade: 'SD280', fy: 2800, lap40D: 38.1, hook12D: 11.4 },
  { label: '#4 (D13)', db: 12.7, area: 1.267, kgPerM: 0.994, dbCm: 1.27, grade: 'SD280', fy: 2800, lap40D: 50.8, hook12D: 15.2 },
  { label: '#5 (D16)', db: 15.88, area: 1.979, kgPerM: 1.56, dbCm: 1.588, grade: 'SD280', fy: 2800, lap40D: 63.5, hook12D: 19.1 },
  { label: '#6 (D19)', db: 19.05, area: 2.85, kgPerM: 2.24, dbCm: 1.905, grade: 'SD420', fy: 4200, lap40D: 76.2, hook12D: 22.9 },
  { label: '#7 (D22)', db: 22.23, area: 3.871, kgPerM: 3.04, dbCm: 2.223, grade: 'SD420', fy: 4200, lap40D: 88.9, hook12D: 26.7 },
  { label: '#8 (D25)', db: 25.4, area: 5.067, kgPerM: 3.98, dbCm: 2.54, grade: 'SD420', fy: 4200, lap40D: 101.6, hook12D: 30.5 },
  { label: '#9 (D29)', db: 28.65, area: 6.469, kgPerM: 5.08, dbCm: 2.865, grade: 'SD420', fy: 4200, lap40D: 114.6, hook12D: 34.4 },
  { label: '#10 (D32)', db: 32.26, area: 8.143, kgPerM: 6.39, dbCm: 3.226, grade: 'SD420', fy: 4200, lap40D: 129, hook12D: 38.7 },
  { label: '#11 (D36)', db: 35.81, area: 10.07, kgPerM: 7.9, dbCm: 3.581, grade: 'SD420', fy: 4200, lap40D: 143.2, hook12D: 43 },
];

export function getRebarSpec(label: string): RebarSpec | undefined {
  return REBAR_SPECS.find((s) => s.label === label);
}

export const REBAR_LABELS = REBAR_SPECS.map((s) => s.label);
