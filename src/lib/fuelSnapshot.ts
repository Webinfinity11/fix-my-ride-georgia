import type { FuelImporter } from '@/hooks/useFuelImporters';
export type FuelSnapshot = { data: FuelImporter[]; ts: number };
declare global { interface Window { __fixupFuelSnapshotCapture?: FuelSnapshot } }

export function readFuelSnapshot(): FuelSnapshot | null {
  if (typeof document === 'undefined') return null;
  try {
    const raw = document.getElementById('fuel-initial-data')?.textContent;
    if (!raw) return null;
    const value = JSON.parse(raw) as FuelSnapshot;
    if (!Array.isArray(value.data) || !Number.isFinite(value.ts) || value.ts > Date.now()) return null;
    return value;
  } catch { return null; }
}
