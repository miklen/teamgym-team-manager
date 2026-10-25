import { stabilitySchema } from './schema';
import type { Stability } from './schema';

export const STABILITY_ANCHORS = [
  'Måske klar til konkurrencen',
  'Usikkert, lykkes enkelte gange',
  'Lykkes ofte, men svingende',
  'Meget stabilt',
  'Sikkert og gennemprøvet under konkurrencelignende forhold',
] as const;

export interface StabilitySlot { filled: boolean; value: Stability | null }

export function aggregateStability(slots: readonly StabilitySlot[], requiredCount: number) {
  if (!Number.isInteger(requiredCount) || requiredCount < 0) throw new Error('Krævet antal skal være et ikke-negativt heltal.');
  const values: number[] = [];
  for (const slot of slots) {
    if (slot.value !== null) stabilitySchema.parse(slot.value);
    if (slot.filled && slot.value !== null) values.push(slot.value);
  }
  const filledCount = slots.filter((slot) => slot.filled).length;
  return {
    mean: values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null,
    minimum: values.length ? Math.min(...values) : null,
    lowCount: values.filter((value) => value <= 2).length,
    assessedCount: values.length,
    filledCount,
    requiredCount,
    complete: requiredCount > 0 && filledCount === requiredCount && values.length === requiredCount,
  };
}

export function formatStability(value: number | null): string {
  return value === null ? 'Ikke vurderet' : new Intl.NumberFormat('da-DK', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
}
