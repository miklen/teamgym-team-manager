import { describe, expect, it } from 'vitest';
import { aggregateStability, athleteSkillSchema, formatStability, stabilitySchema, updateAssessment } from '@teamgym/domain';
import type { Stability } from '@teamgym/domain';
import { syntheticWorkspace } from '../fixtures/synthetic-workspace';

describe('stabilitet er en vurdering 1–5 eller eksplicit ikke vurderet', () => {
  it.each([0, 6, 1.5, -1, NaN, Infinity, '4', undefined])('afviser %s', (value) => expect(stabilitySchema.safeParse(value).success).toBe(false));
  it.each([1, 2, 3, 4, 5])('bevarer vurdering %s uden konkurrerende status', (value) => expect(stabilitySchema.parse(value)).toBe(value));

  it('fem femmere og én ener giver 4,3, minimum 1 og en lav vurdering', () => {
    const result = aggregateStability([5, 5, 5, 5, 5, 1].map((value) => ({ filled: true, value: value as Stability })), 6);
    expect(result).toMatchObject({ mean: 26 / 6, minimum: 1, lowCount: 1, assessedCount: 6, filledCount: 6, requiredCount: 6, complete: true });
    expect(formatStability(result.mean)).toBe('4,3');
  });

  it('fem femmere og null forbliver ufuldstændig 5/6 med gennemsnit 5,0', () => {
    const result = aggregateStability([5, 5, 5, 5, 5, null].map((value) => ({ filled: true, value: value as Stability | null })), 6);
    expect(result).toMatchObject({ mean: 5, minimum: 5, assessedCount: 5, filledCount: 6, complete: false });
    expect(formatStability(result.mean)).toBe('5,0');
  });

  it('tomt input har hverken numerisk gennemsnit, minimum eller fuld dækning', () => {
    expect(aggregateStability([], 6)).toMatchObject({ mean: null, minimum: null, assessedCount: 0, filledCount: 0, complete: false });
    expect(aggregateStability([], 0).complete).toBe(false);
    expect(formatStability(null)).toBe('Ikke vurderet');
  });

  it('skelner ikke registreret, registreret/null og vurderet 1', () => {
    expect(aggregateStability([{ filled: false, value: null }], 1)).toMatchObject({ filledCount: 0, assessedCount: 0 });
    expect(aggregateStability([{ filled: true, value: null }], 1)).toMatchObject({ filledCount: 1, assessedCount: 0 });
    expect(aggregateStability([{ filled: true, value: 1 }], 1)).toMatchObject({ filledCount: 1, assessedCount: 1, minimum: 1 });
  });

  it('vurderingsdato er obligatorisk ved en vurdering og valideres som kalenderdato', () => {
    const { workspace, environment } = syntheticWorkspace();
    const registration = workspace.athleteSkills[0]!;
    expect(athleteSkillSchema.safeParse({ ...registration, assessedAt: null }).success).toBe(false);
    for (const date of ['2026-02-30', '2026-99-99', '25/10/2026']) expect(athleteSkillSchema.safeParse({ ...registration, assessedAt: date }).success).toBe(false);
    const updated = updateAssessment(workspace, registration.id, { stability: null, assessedAt: null, note: 'Afventer vurdering' }, environment);
    expect(updated.athleteSkills[0]).toMatchObject({ stability: null, assessedAt: null, note: 'Afventer vurdering' });
    expect(workspace.athleteSkills[0]?.stability).toBe(1);
  });
});
