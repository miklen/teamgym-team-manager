import { describe, expect, it } from 'vitest';
import { DK_SPRING_CATALOG } from '../../packages/rules/src/catalog';
import { DK_V1, DK_V2 } from '../../packages/rules/src/dk-v1';
import { workspaceBuilder } from '../fixtures/rule-workspace';

function jump(sourceId: string) {
  const source = DK_SPRING_CATALOG.find((item) => item.referenceId === sourceId)!;
  return { id: `syntetisk-${sourceId}`, name: `Syntetisk ${sourceId}`, archived: false, discipline: 'trampet' as const, jump: structuredClone(source.execution) };
}

describe('afklaret Q02: overslag-salto hoftebøjet 180° i DK 1.1.0', () => {
  it('følger reglementets formel 1,00 + 0,10 = 1,10; DK 1.0.0 bevarer konflikten', () => {
    const v2 = DK_V2.evaluateSkill(jump('a4-v-12'));
    expect(v2.difficulty.status).toBe('known');
    expect(v2.difficulty.value?.toString()).toBe('11/10');
    const v1 = DK_V1.evaluateSkill(jump('a4-v-12'));
    expect(v1.difficulty.status).toBe('unresolved');
    expect(v1.difficulty.issues).toEqual(['Q02']);
  });

  it('bevarer den trykte A4-værdi som kilde og viser den gældende værdi', () => {
    const entry = DK_V2.springCatalog.find((item) => item.referenceId === 'a4-v-12')!;
    expect(entry).toMatchObject({ printedValue: '1.20', appliedValue: '1.10', status: 'allowed', issueId: null });
    expect(DK_V2.knownIssues.some((issue) => issue.id === 'Q02')).toBe(false);
    expect(DK_V1.knownIssues.some((issue) => issue.id === 'Q02')).toBe(true);
  });

  it('giver en sikker omgangssum i planen', () => {
    const builder = workspaceBuilder();
    const team = builder.team('Syntetisk H>1', { rulesetId: 'dk', packageVersion: '1.1.0', ageGroup: 'junior', teamType: 'girls' }, 6);
    const free = jump('a4-f-03');
    builder.fill(team.id, 'trampet', 0, Array.from({ length: 6 }, () => jump('a4-v-12')));
    for (const index of [1, 2]) builder.fill(team.id, 'trampet', index, Array.from({ length: 6 }, () => free));
    const plan = builder.workspace.plans.find((item) => item.teamId === team.id)!;
    const round = DK_V2.analyze(builder.workspace, team.id, 'trampet', plan.trampet[0]!.id).rounds[0]!;
    expect(round.difficulty.status).toBe('known');
    expect(round.difficulty.value?.toString()).toBe('33/5');
  });
});
