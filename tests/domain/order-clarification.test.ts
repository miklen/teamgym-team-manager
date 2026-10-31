import { describe, expect, it } from 'vitest';
import { Fraction, setRoundEntries } from '@teamgym/domain';
import { DK_SPRING_CATALOG } from '../../packages/rules/src/catalog';
import { DK_V2 } from '../../packages/rules/src/dk-v1';
import { known, resolvedOrderCheck, uncertain } from '../../packages/rules/src/dk-numeric';
import { evaluateSpringSkill } from '../../packages/rules/src/dk-spring';
import { fromRows, workspaceBuilder } from '../fixtures/rule-workspace';

const d = (values: string[]) => values.map((value) => known(Fraction.from(value)));

function jump(sourceId: string) {
  const source = DK_SPRING_CATALOG.find((item) => item.referenceId === sourceId);
  if (!source) throw new Error(`Ukendt syntetisk spring: ${sourceId}`);
  return { id: `syntetisk-${sourceId}`, name: `Syntetisk ${sourceId}`, archived: false,
    discipline: 'trampet' as const, jump: structuredClone(source.execution) };
}

describe('afklaret rækkefølge i DK 1.1.0', () => {
  it.each([
    ['0,8 → 0,6 → 0,7 giver to fejl', [1, 1, 1], ['0.8', '0.6', '0.7'], '1/5', [1, 2]],
    ['dobbelt → enkelt → enkelt giver to fejl', [2, 1, 1], ['1.0', '0.3', '0.4'], '1/5', [1, 2]],
    ['stigende kategori og sværhed giver intet fradrag', [0, 1, 1, 2], ['0.3', '0.2', '0.2', '0.8'], '0', []],
    ['et fald tilbage under højeste tidligere tæller hver gang', [1, 1, 1, 1], ['0.5', '0.6', '0.5', '0.6'], '1/10', [2]],
  ])('%s', (_name, categories, values, expected, faults) => {
    const result = resolvedOrderCheck(categories, d(values), 2);
    expect(result.deduction.status).toBe('known');
    expect(result.deduction.value?.toString()).toBe(expected);
    expect(result.faultIndexes).toEqual(faults);
  });

  it('gælder ikke første omgang', () => {
    expect(resolvedOrderCheck([2, 1], d(['1.0', '0.2']), 1).deduction.value?.toString()).toBe('0');
  });

  it('bevarer sikre fejl som delsum, når en sværhed mangler', () => {
    const result = resolvedOrderCheck([1, 1, 1], [known('0.8'), uncertain('unresolved', ['Q02']), known('0.6')], 3);
    expect(result.deduction.status).toBe('unresolved');
    expect(result.deduction.issues).toEqual(['Q02']);
    expect(result.deduction.knownSubtotal.toString()).toBe('1/10');
  });

  it('placerer blandet serie ved højeste saltokategori og serie uden salto først', () => {
    const mixed = evaluateSpringSkill(fromRows(['a3-b-01', 'a3-b-02', 'a3-b-04', 'a3-b-15'], 'blandet'), null, true);
    const noSalto = evaluateSpringSkill(fromRows(['a3-b-01', 'a3-b-02', 'a3-b-02'], 'uden-salto'), null, true);
    expect(mixed.rotationCategory).toBeNull();
    expect(mixed.orderCategory).toBe(2);
    expect(noSalto.orderCategory).toBe(0);
  });

  it('tæller kun tællende gymnaster og peger på de berørte pladser', () => {
    const builder = workspaceBuilder();
    const team = builder.team('Syntetisk rækkefølge', { rulesetId: 'dk', packageVersion: '1.1.0', ageGroup: 'junior', teamType: 'girls' });
    const athletes = builder.workspace.athletes.filter((athlete) => athlete.teamId === team.id);
    const entries = ['a4-f-09', 'a4-f-03', 'a4-f-01', 'a4-f-02', 'a4-f-06', 'a4-f-07', 'a4-f-08'].map((sourceId, index) => ({
      id: `plads-${index}`, athleteId: athletes[index]!.id, athleteSkillId: builder.register(athletes[index]!.id, jump(sourceId)),
      role: index === 0 ? 'extra' as const : 'counting' as const }));
    const plan = builder.workspace.plans[0]!;
    const scenario = plan.trampet[0]!;
    const workspace = setRoundEntries(builder.workspace, plan.id, 'trampet', scenario.id, scenario.rounds[1]!.id, entries, { counting: 6, extra: 2 }, builder.environment);
    const round = workspace.plans[0]!.trampet[0]!.rounds[1]!;
    const result = DK_V2.analyze(workspace, team.id, 'trampet', workspace.plans[0]!.trampet[0]!.id);
    const order = result.contributions.find((item) => item.id === 'C-ORDEN-2')!;
    expect(order.decision.status).toBe('known');
    expect(order.decision.value?.toString()).toBe('1/5');
    expect(order.affectedIds).toEqual([round.id, round.entries[2]!.id, round.entries[3]!.id]);
    expect(DK_V2.knownIssues.some((issue) => issue.id === 'Q06')).toBe(false);
  });
});
