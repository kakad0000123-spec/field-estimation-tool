import { WireMeshSpec } from './types';

export const WIRE_MESH_SPECS: WireMeshSpec[] = [
  { label: 'φ3.2@100x100', kgPerM2: 1.58 },
  { label: 'φ3.2@150x150', kgPerM2: 1.05 },
  { label: 'φ4.0@100x100', kgPerM2: 2.47 },
  { label: 'φ4.0@150x150', kgPerM2: 1.65 },
  { label: 'φ4.0@200x200', kgPerM2: 1.23 },
  { label: 'φ5.0@100x100', kgPerM2: 3.85 },
  { label: 'φ5.0@150x150', kgPerM2: 2.57 },
  { label: 'φ5.0@200x200', kgPerM2: 1.93 },
  { label: 'φ6@100x100', kgPerM2: 5.55 },
  { label: 'φ6@150x150', kgPerM2: 3.70 },
  { label: 'φ6@200x200', kgPerM2: 2.78 },
];

export function getWireMeshSpec(label: string): WireMeshSpec | undefined {
  return WIRE_MESH_SPECS.find((s) => s.label === label);
}

export const WIRE_MESH_LABELS = WIRE_MESH_SPECS.map((s) => s.label);
