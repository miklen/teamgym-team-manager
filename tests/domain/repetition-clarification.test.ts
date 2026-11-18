import { describe, expect, it } from 'vitest';
import { DK_SPRING_CATALOG } from '../../packages/rules/src/catalog';
import { DK_V2 } from '../../packages/rules/src/dk-v1';
import { resolvedRepetitionDeduction } from '../../packages/rules/src/dk-numeric';
import { workspaceBuilder } from '../fixtures/rule-workspace';

function jump(sourceId: string) {
  const source = DK_SPRING_CATALOG.find((item) => item.referenceId === sourceId);
  if (!source) throw new Error(`Ukendt syntetisk spring: ${sourceId}`);
  return { id: `syntetisk-${sourceId}`, name: `Syntetisk ${sourceId}`, archived: false,
    discipline: 'trampet' as const, jump: structuredClone(source.execution) };
}

describe('afklaret gentagelse i DK 1.1.0', () => {
  it.each([
    [[0, 2, 3], '2/5'],
    [[6, 2, 0], '2/5'],
    [[0, 3, 3], '3/5'],
    [[6, 6, 6], '12/5'],
    [[0, 0, 3], '0'],
  ])('tæller pr. holdidentitet for %j', (counts, expected) => {
    expect(resolvedRepetitionDeduction(counts).value?.toString()).toBe(expected);
  });

  it('giver 0,40 for 2 mod 3, selv om ingen gymnast gentager springet', () => {
    const builder = workspaceBuilder();
    const team = builder.team('Syntetisk gentagelse', { rulesetId: 'dk', packageVersion: '1.1.0', ageGroup: 'junior', teamType: 'girls' });
    const x = jump('a4-f-01');
    const y = jump('a4-f-02');
    builder.fill(team.id, 'trampet', 0, Array.from({ length: 6 }, () => y));
    builder.fill(team.id, 'trampet', 1, [x, x, jump('a4-f-03'), jump('a4-f-04'), jump('a4-f-05'), jump('a4-f-06')]);
    builder.fill(team.id, 'trampet', 2, [jump('a4-f-07'), jump('a4-f-08'), x, x, x, jump('a4-f-09')]);
    const result = DK_V2.analyze(builder.workspace, team.id, 'trampet', builder.workspace.plans[0]!.trampet[0]!.id);
    const repetition = result.contributions.find((item) => item.id === 'C-GENTAG')!;
    expect(repetition.decision.status).toBe('known');
    expect(repetition.decision.value?.toString()).toBe('2/5');
    expect(repetition.decision.issues).toEqual([]);
    expect(repetition.affectedIds).toEqual([result.rounds[1]!.id]);
    expect(DK_V2.knownIssues.some((issue) => issue.id === 'Q03')).toBe(false);
  });

  it('stedfæster lige mange gentagelser i begge omgange og beløbet samlet', () => {
    const builder = workspaceBuilder();
    const team = builder.team('Syntetisk lige gentagelse', { rulesetId: 'dk', packageVersion: '1.1.0', ageGroup: 'junior', teamType: 'girls' });
    const x = jump('a4-f-01');
    const y = jump('a4-f-02');
    builder.fill(team.id, 'trampet', 0, [...Array(5).fill(y), jump('a4-f-10')]);
    builder.fill(team.id, 'trampet', 1, [x, x, jump('a4-f-03'), jump('a4-f-04'), jump('a4-f-05'), jump('a4-f-06')]);
    builder.fill(team.id, 'trampet', 2, [jump('a4-f-07'), jump('a4-f-08'), x, x, jump('a4-f-09'), jump('a4-f-11')]);
    const scenario = builder.workspace.plans[0]!.trampet[0]!;
    const result = DK_V2.analyze(builder.workspace, team.id, 'trampet', scenario.id);
    const repetition = result.planFindings.find((item) => item.id === 'C-GENTAG')!;
    expect(repetition).toMatchObject({
      status: 'deduction', action: 'change-spring',
      roundIds: [scenario.rounds[1].id, scenario.rounds[2].id],
      entryIds: [...scenario.rounds[1].entries.slice(0, 2), ...scenario.rounds[2].entries.slice(2, 4)].map((entry) => entry.id),
      sources: [{ sourceId: 'H', section: '10.2.2.3', page: 40 }],
    });
    expect(repetition.amount?.toString()).toBe('2/5');
    const hold = result.planFindings.find((item) => item.id === 'C-HOLD')!;
    expect(hold.entryIds).toEqual([scenario.rounds[0].entries[5]!.id]);
    expect(hold.amount?.toString()).toBe('1/5');
  });
});
