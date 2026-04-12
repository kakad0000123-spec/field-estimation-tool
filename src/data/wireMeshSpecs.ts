import { WireMeshSpec } from './types';

export const WIRE_MESH_SPECS: WireMeshSpec[] = [
  { label: '\u03C66@150x150', kgPerM2: 3.70 },
];

export function getWireMeshSpec(label: string): WireMeshSpec | undefined {
  return WIRE_MESH_SPECS.find((s) => s.label === label);
}

export const WIRE_MESH_LABELS = WIRE_MESH_SPECS.map((s) => s.label);
