import { describe, expect, it } from 'vitest';
import { Fraction, setPlannedSpot, setRoundEntries } from '@teamgym/domain';
import type { PlannedSpotInput, SkillDefinition, Workspace } from '@teamgym/domain';
import { DK_SPRING_CATALOG } from '../../packages/rules/src/catalog';
import { DK_SPOT_RATES } from '../../packages/rules/src/dk-data';
import { known, plannedExecutionCeiling, plannedMaximumScore, spottedTopThreeDifficulty } from '../../packages/rules/src/dk-numeric';
import { DK_V2, createDKFamilyPackage } from '../../packages/rules/src/dk-v1';
import { fromRows, workspaceBuilder } from '../fixtures/rule-workspace';

const f = (value: string) => Fraction.from(value);
const elements = (values: string[], identities = values.map((_value, index) => `element-${index}`)) => values.map((value, index) => ({ identity: identities[index]!, value: f(value) }));
const V2 = { rulesetId: 'dk', packageVersion: '1.1.0', ageGroup: 'junior', teamType: 'girls' };

function jump(sourceId: string): SkillDefinition {
  const source = DK_SPRING_CATALOG.find((item) => item.referenceId === sourceId);
  if (!source) throw new Error(`Ukendt syntetisk spring: ${sourceId}`);
  return { id: `syntetisk-${sourceId}`, name: `Syntetisk ${sourceId}`, archived: false, discipline: 'trampet', jump: structuredClone(source.execution) };
}

/** Syntetisk trampetomgang: tabelværdierne er aflæst som faste facit (a4-f-08 = 0,60, a4-f-10 = 0,80). */
function trampetSetup(binding = V2) {
  const builder = workspaceBuilder();
  const team = builder.team('Syntetisk modtagning', binding);
  const athletes = builder.workspace.athletes.filter((athlete) => athlete.teamId === team.id);
  const plan = () => builder.workspace.plans.find((item) => item.teamId === team.id)!;
  const scenario = () => plan().trampet[0]!;
  function round(index: number, sources: string[], extras: string[] = []) {
    const entries = [...extras.map((source, offset) => ({ source, role: 'extra' as const, athlete: athletes[sources.length + offset]! })),
      ...sources.map((source, offset) => ({ source, role: 'counting' as const, athlete: athletes[offset]! }))].map((item) => ({
      id: builder.environment.id(), athleteId: item.athlete.id, athleteSkillId: builder.register(item.athlete.id, jump(item.source)), role: item.role }));
    builder.workspace = setRoundEntries(builder.workspace, plan().id, 'trampet', scenario().id, scenario().rounds[index]!.id, entries, { counting: 6, extra: 2 }, builder.environment);
  }
  function spot(roundIndex: number, entryIndex: number, input: PlannedSpotInput, discipline: 'tumbling' | 'trampet' = 'trampet') {
    const target = plan()[discipline][0]!.rounds[roundIndex]!;
    builder.workspace = setPlannedSpot(builder.workspace, plan().id, discipline, plan()[discipline][0]!.id, target.id, target.entries[entryIndex]!.id, input, builder.environment);
  }
  const analyze = (workspace: Workspace = builder.workspace, rulePackage = DK_V2, discipline: 'tumbling' | 'trampet' = 'trampet') =>
    rulePackage.analyze(workspace, team.id, discipline, plan()[discipline][0]!.id);
  return { builder, team, athletes, plan, scenario, round, spot, analyze };
}

describe('planlagt modtagning: faste facit', () => {
  it('halverer afslutningen og genberegner tre bedste: 0,10/0,20/1,40 → 1,00', () => {
    expect(spottedTopThreeDifficulty(elements(['0.10', '0.20', '1.40']), 2)).toEqual(known('1.00'));
  });

  it('lader det halverede element falde ud: 0,20/0,30/0,40/0,50 → 0,95', () => {
    expect(spottedTopThreeDifficulty(elements(['0.20', '0.30', '0.40', '0.50']), 3)).toEqual(known('0.95'));
  });

  it('viser dublet-identitet som uafklaret interval', () => {
    const result = spottedTopThreeDifficulty(elements(['0.20', '0.40', '0.20'], ['a', 'b', 'a']), 2);
    expect(result.status).toBe('unresolved');
    expect(result.issues).toEqual(['Q-SPOT-DUP']);
    expect(result.alternatives.halved!.toString()).toBe('1/2');
    expect(result.alternatives.unhalved!.toString()).toBe('3/5');
  });

  it('beregner E-loft som 10,0 minus planlagte fradrag og mindst 0,0', () => {
    expect(plannedExecutionCeiling(known('1.5'))).toEqual(known('8.5'));
    expect(plannedExecutionCeiling(known('11'))).toEqual(known(0));
  });

  it('giver C 1,20, D 4,00 og E-loft 9,50 → maks. 14,70 og pris 0,70', () => {
    const composition = { status: 'known' as const, value: f('1.20'), knownSubtotal: f('1.20') };
    const spotted = plannedMaximumScore(composition, known('4.00'), [known(10), known(10), known('8.5')]);
    const unspotted = plannedMaximumScore(composition, known('4.20'), [known(10), known(10), known(10)]);
    expect(spotted.value!.toString()).toBe(f('14.70').toString());
    expect(unspotted.value!.toString()).toBe(f('15.40').toString());
    expect(unspotted.value!.subtract(spotted.value!).toString()).toBe(f('0.70').toString());
  });

  it('beregner eksakt og nedrunder kun visningen', () => {
    const composition = { status: 'known' as const, value: f('1.20'), knownSubtotal: f('1.20') };
    const result = plannedMaximumScore(composition, known('4.00'), [known(10), known(10), known('9.5')]);
    expect(result.value!.toString()).toBe(new Fraction(451, 30).toString());
    expect(result.value!.panelFloor().toString()).toBe(f('15.03').toString());
  });

  it('har pakkebundne satser med kilder for alle tre grader', () => {
    expect(DK_SPOT_RATES.map((rate) => [rate.grade, rate.executionDeduction, rate.halvesDifficulty])).toEqual([['support', '0.5', false], ['assist', '1.0', false], ['heavy', '1.0', true]]);
    expect(DK_SPOT_RATES.every((rate) => rate.sources.length > 0 && rate.explanation.includes('fødderne først'))).toBe(true);
    expect(DK_V2.spotRates).toBe(DK_SPOT_RATES);
    expect(DK_V2.knownIssues.some((issue) => issue.id === 'Q-SPOT-DUP')).toBe(true);
  });
});

describe('planlagt modtagning i regelmotoren', () => {
  const ascending = ['a4-f-08', 'a4-f-08', 'a4-f-08', 'a4-f-08', 'a4-f-08', 'a4-f-10'];

  it('kraftig hjælp på trampet halverer bidraget, men ikke rækkefølge eller sortering', () => {
    const setup = trampetSetup();
    setup.round(1, ascending);
    const before = setup.analyze();
    setup.spot(1, 5, { grade: 'heavy' });
    const after = setup.analyze();
    const round = after.rounds[1]!;
    const last = round.counting[5]!;
    expect(last.evaluation!.orderCategory).toBe(round.counting[0]!.evaluation!.orderCategory);
    expect(last.originalD.value!.toString()).toBe(f('0.80').toString());
    expect(last.spotD.value!.toString()).toBe(f('0.40').toString());
    expect(round.difficulty.value!.toString()).toBe(f('3.40').toString());
    expect(round.unspottedDifficulty.value!.toString()).toBe(f('3.80').toString());
    expect(round.order.deduction).toEqual(known(0));
    expect(round.sortedEntryIds).toEqual(before.rounds[1]!.sortedEntryIds);
    expect(round.plannedExecution.deduction).toEqual(known('1.0'));
    expect(round.plannedExecution.count).toBe(1);
    expect(round.plannedExecution.ceiling).toEqual(known(9));
    expect(after.contributions).toEqual(before.contributions);
  });

  it('let støtte bevarer D og lægger 0,50 til omgangens planlagte E-fradrag', () => {
    const setup = trampetSetup();
    setup.round(1, ascending);
    setup.spot(1, 0, { grade: 'support' });
    const round = setup.analyze().rounds[1]!;
    expect(round.counting[0]!.spotD).toEqual(round.counting[0]!.originalD);
    expect(round.plannedExecution.deduction).toEqual(known('0.5'));
  });

  it('ekstra gymnasts modtagning vises, men tæller 0', () => {
    const setup = trampetSetup();
    setup.round(1, ascending, ['a4-f-08']);
    setup.spot(1, 0, { grade: 'assist' });
    setup.spot(1, 1, { grade: 'assist' });
    const round = setup.analyze().rounds[1]!;
    const extra = round.entries.find((item) => item.entry.role === 'extra')!;
    expect(extra.plannedSpot).toMatchObject({ counts: false, executionDeduction: known(0) });
    expect(round.plannedExecution.deduction).toEqual(known('1.0'));
    expect(round.plannedExecution.count).toBe(1);
  });

  it('afvigelse i holdomgangen vurderes før modtagningen og forbliver 0', () => {
    const setup = trampetSetup();
    setup.round(0, ascending);
    setup.spot(0, 5, { grade: 'heavy' });
    const result = setup.analyze();
    const deviating = result.rounds[0]!.counting[5]!;
    expect(deviating.adjustedD).toEqual(known(0));
    expect(deviating.spotD).toEqual(known(0));
    expect(result.contributions.find((item) => item.id === 'C-HOLD')!.affectedIds).toContain(deviating.entry.id);
  });

  it('beregner maks. og pris for en fuld plan', () => {
    const setup = trampetSetup();
    for (const index of [0, 1, 2]) setup.round(index, index === 0 ? Array(6).fill('a4-f-08') : ascending);
    const before = setup.analyze();
    setup.spot(2, 5, { grade: 'heavy' });
    setup.spot(2, 0, { grade: 'support' });
    const after = setup.analyze();
    expect(before.spotCost).toEqual(known(0));
    expect(after.difficulty.value!.toString()).toBe(before.difficulty.value!.subtract(f('0.40').divide(3)).toString());
    expect(after.maximumScore.value!.toString()).toBe(before.maximumScore.value!.subtract(f('0.40').divide(3)).subtract(f('1.5').divide(3)).toString());
    expect(after.spotCost.value!.toString()).toBe(f('1.9').divide(3).toString());
    expect(after.composition).toEqual(before.composition);
  });

  it('potentialesøgning og C er uændrede med modtagninger', async () => {
    const setup = trampetSetup();
    for (const index of [0, 1, 2]) setup.round(index, index === 0 ? Array(6).fill('a4-f-08') : ascending);
    const summary = async () => (await DK_V2.potentials(setup.builder.workspace, setup.team.id, 'trampet', setup.scenario().id))
      .map((item) => [item.id, item.status, item.documentedValue?.toString() ?? null]);
    const before = await summary();
    const analysisBefore = setup.analyze();
    setup.spot(0, 0, { grade: 'heavy' });
    setup.spot(2, 5, { grade: 'heavy' });
    expect(await summary()).toEqual(before);
    expect(setup.analyze().contributions).toEqual(analysisBefore.contributions);
  });

  it('viser ugyldig maks. ved blandet Pegasus-omgang', () => {
    const setup = trampetSetup();
    for (const index of [0, 1, 2]) setup.round(index, index === 1 ? ['a4-f-08', 'a4-f-08', 'a4-f-08', 'a4-f-08', 'a4-f-08', 'a4-v-01'] : Array(6).fill('a4-f-08'));
    const result = setup.analyze();
    expect(result.maximumScore.status).toBe('invalid');
    expect(result.maximumScore.value).toBeNull();
    expect(result.invalidRoundIds).toEqual([setup.scenario().rounds[1]!.id]);
  });

  it('giver uafklaret konsekvens i en pakke uden satser', () => {
    const setup = trampetSetup();
    for (const index of [0, 1, 2]) setup.round(index, Array(6).fill('a4-f-08'));
    setup.spot(1, 0, { grade: 'support' });
    const withoutRates = createDKFamilyPackage({ manifest: DK_V2.manifest, rhythmCatalog: DK_V2.rhythmCatalog, knownIssues: DK_V2.knownIssues, spotRates: null,
      settings: { ruleCorrections: true, elementBonusResolved: true, repetitionResolved: true, orderResolved: true, apparatusRoundsResolved: true } });
    const result = setup.analyze(setup.builder.workspace, withoutRates);
    expect(result.rounds[1]!.plannedExecution.deduction.status).toBe('unresolved');
    expect(result.rounds[1]!.counting[0]!.spotD.status).toBe('unresolved');
    expect(result.maximumScore.status).toBe('unresolved');
  });

  it('kraftig hjælp på bane bruger sidste element som standard og anvender multiplikatoren', () => {
    const setup = trampetSetup();
    const series = fromRows(['a3-b-01', 'a3-b-02', 'a3-b-03'], 'syntetisk-serie');
    setup.builder.fill(setup.team.id, 'tumbling', 1, Array(6).fill(series));
    const plain = setup.analyze(setup.builder.workspace, DK_V2, 'tumbling').rounds[1]!.counting[5]!;
    expect(plain.originalD.value!.toString()).toBe(f('0.60').toString());
    setup.spot(1, 5, { grade: 'heavy' }, 'tumbling');
    setup.spot(1, 4, { grade: 'heavy', elementIndex: 0 }, 'tumbling');
    const round = setup.analyze(setup.builder.workspace, DK_V2, 'tumbling').rounds[1]!;
    expect(round.counting[5]!.spotD.value!.toString()).toBe(f('0.45').toString());
    expect(round.counting[4]!.spotD.value!.toString()).toBe(f('0.55').toString());
    const doubled = createDKFamilyPackage({ manifest: DK_V2.manifest, rhythmCatalog: DK_V2.rhythmCatalog, knownIssues: DK_V2.knownIssues,
      settings: { ruleCorrections: true, elementBonusResolved: true, repetitionResolved: true, orderResolved: true, apparatusRoundsResolved: true, difficultyMultiplier: '2' } });
    expect(setup.analyze(setup.builder.workspace, doubled, 'tumbling').rounds[1]!.counting[5]!.spotD.value!.toString()).toBe(f('0.90').toString());
  });
});
