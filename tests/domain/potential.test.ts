import { describe, expect, it } from 'vitest';
import { updateAssessment } from '@teamgym/domain';
import { DK_V1, DK_V2 } from '../../packages/rules/src/dk-v1';
import { DK_SPRING_CATALOG } from '../../packages/rules/src/catalog';
import { DK_DEFAULT_BINDING } from '../../packages/rules/src/dk-data';
import { applyPotentialPreview, PotentialCache } from '../../packages/rules/src/potential';
import { fromRows, workspaceBuilder } from '../fixtures/rule-workspace';

function scenario() {
  const builder = workspaceBuilder(); const team = builder.team('Potentiale');
  const basic = fromRows(['a3-b-01', 'a3-b-02', 'a3-b-06'], 'potential-basic');
  const twist = fromRows(['a3-b-01', 'a3-b-02', 'a3-b-11'], 'potential-twist');
  builder.fill(team.id, 'tumbling', 0, Array.from({ length: 6 }, () => basic));
  builder.fill(team.id, 'tumbling', 1, Array.from({ length: 6 }, (_, index) => index < 4 ? twist : basic));
  builder.fill(team.id, 'tumbling', 2, Array.from({ length: 6 }, () => basic));
  const members = builder.workspace.athletes.filter((athlete) => athlete.teamId === team.id);
  for (const athlete of members.slice(0, 6)) builder.register(athlete.id, twist);
  return { builder, team, basic, twist, members };
}

describe('konkrete individuelle tillægsmuligheder med fulde vidneopstillinger', () => {
  it('afklaret DK 1.1-elementtillæg får et selvstændigt vidne uden opdigtet regelmaksimum', async () => {
    const builder = workspaceBuilder();
    const team = builder.team('Afklaret elementtest', { ...DK_DEFAULT_BINDING, packageVersion: '1.1.0' });
    const basic = fromRows(['a3-b-01', 'a3-b-02', 'a3-b-04'], 'resolved-basic');
    const richer = fromRows(['a3-b-01', 'a3-b-02', 'a3-b-03', 'a3-b-11'], 'resolved-richer');
    for (let index = 0; index < 3; index++) builder.fill(team.id, 'tumbling', index, Array.from({ length: 6 }, () => basic));
    for (const athlete of builder.workspace.athletes.filter((item) => item.teamId === team.id).slice(0, 6)) builder.register(athlete.id, richer);
    const scenarioId = builder.workspace.plans[0]!.tumbling[0]!.id;
    const potentials = await DK_V2.potentials(builder.workspace, team.id, 'tumbling', scenarioId);
    const element = potentials.find((item) => item.id === 'B-ELEMENT')!;
    expect(element.selected?.toString()).toBe('6/5');
    expect(element.documentedValue?.toString()).toBe('7/5');
    expect(element.status).toBe('proven');
    expect(element.ruleMaximum).toBeNull();
    expect(element.issue).toBeNull();
    expect(element.preview?.after.contributions.find((item) => item.id === 'B-ELEMENT')?.decision.value?.toString()).toBe('7/5');
    const guide = DK_V2.guide(DK_V2.analyze(builder.workspace, team.id, 'tumbling', scenarioId), DK_V2.profiles.find((item) => item.ageGroup === 'junior' && item.teamType === 'girls')!, potentials);
    expect(guide.find((item) => item.id === 'B-ELEMENT')?.documented?.toString()).toBe('7/5');
  });

  it('viser valgt 4/6 og dokumenteret 6/6 med to ændrede registreringer', async () => {
    const { builder, team } = scenario();
    const original = structuredClone(builder.workspace);
    const result = (await DK_V1.potentials(builder.workspace, team.id, 'tumbling', builder.workspace.plans.find((plan) => plan.teamId === team.id)!.tumbling[0]!.id)).find((item) => item.id === 'B-SKRUE')!;
    expect(result.selected?.toString()).toBe('2/5');
    expect(result.documentedValue?.toString()).toBe('3/5');
    expect(result.ruleMaximum?.toString()).toBe('3/5');
    expect(result.status).toBe('proven');
    expect(result.preview?.changes.filter((change) => change.beforeRegistrationId !== change.afterRegistrationId)).toHaveLength(2);
    expect(result.preview?.after.rounds.every((round) => round.counting.length === 6 && new Set(round.counting.map((entry) => entry.entry.athleteId)).size === 6)).toBe(true);
    expect(builder.workspace).toEqual(original);
    expect(result.preview?.before.difficulty.value?.compare(result.preview.after.difficulty.value!)).not.toBe(0);
    const applied = applyPotentialPreview(builder.workspace, result.preview!);
    expect(DK_V1.analyze(applied, team.id, 'tumbling', applied.plans.find((plan) => plan.teamId === team.id)!.tumbling[0]!.id).contributions.find((item) => item.id === 'B-SKRUE')?.decision.value?.toString()).toBe('3/5');
  });

  it('en vurdering på 1 er stadig en registreret mulighed med synlig lav stabilitet', async () => {
    const { builder, team, members, twist } = scenario();
    const registration = builder.workspace.athleteSkills.find((item) => item.athleteId === members[5]!.id && item.skillId === twist.id)!;
    builder.workspace = updateAssessment(builder.workspace, registration.id, { stability: 1, assessedAt: '2026-10-25', note: 'Lav vurdering skal ikke skjules.' }, builder.environment);
    const result = (await DK_V1.potentials(builder.workspace, team.id, 'tumbling', builder.workspace.plans.find((plan) => plan.teamId === team.id)!.tumbling[0]!.id)).find((item) => item.id === 'B-SKRUE')!;
    expect(result.documentedValue?.toString()).toBe('3/5');
    expect(result.preview?.after.rounds.some((round) => round.stability.counting.minimum === 1)).toBe(true);
  });

  it('andre holds gymnaster og uregistrerede serier skaber ikke sikre muligheder', async () => {
    const builder = workspaceBuilder(); const teamA = builder.team('A', undefined, 6); const teamB = builder.team('B', undefined, 6);
    const basic = fromRows(['a3-b-01', 'a3-b-02', 'a3-b-06'], 'shared-basic');
    const twist = fromRows(['a3-b-01', 'a3-b-02', 'a3-b-11'], 'only-team-b-twist');
    for (let index = 0; index < 3; index++) builder.fill(teamA.id, 'tumbling', index, Array.from({ length: 6 }, () => basic));
    for (const athlete of builder.workspace.athletes.filter((athlete) => athlete.teamId === teamB.id)) builder.register(athlete.id, twist);
    const result = (await DK_V1.potentials(builder.workspace, teamA.id, 'tumbling', builder.workspace.plans.find((plan) => plan.teamId === teamA.id)!.tumbling[0]!.id)).find((item) => item.id === 'B-SKRUE')!;
    expect(result.documentedValue?.toString()).toBe('0');
    expect(result.preview?.changes.every((change) => builder.workspace.athletes.find((athlete) => athlete.id === change.athleteId)?.teamId === teamA.id)).toBe(true);
    expect(result.ruleMaximum?.toString()).toBe('3/5');
  });

  it('for få kandidater giver ingen opdigtet fuld vidneopstilling', async () => {
    const builder = workspaceBuilder(); const team = builder.team('Lille hold', undefined, 5);
    const basic = fromRows(['a3-b-01', 'a3-b-02', 'a3-b-06'], 'few-basic');
    for (const athlete of builder.workspace.athletes) builder.register(athlete.id, basic);
    const result = await DK_V1.potentials(builder.workspace, team.id, 'tumbling', builder.workspace.plans.find((plan) => plan.teamId === team.id)!.tumbling[0]!.id);
    expect(result.every((item) => item.preview === null && item.documentedValue === null && item.status === 'incomplete')).toBe(true);
  });

  it('begrænset eller afbrudt søgning hævder ikke et bevist maksimum', async () => {
    const { builder, team } = scenario();
    const limited = await DK_V1.potentials(builder.workspace, team.id, 'tumbling', builder.workspace.plans.find((plan) => plan.teamId === team.id)!.tumbling[0]!.id, { candidateBudget: 1 });
    expect(limited.every((item) => item.status === 'lower-bound' && item.searchedCandidates === 1)).toBe(true);
    const controller = new AbortController(); controller.abort();
    const aborted = await DK_V1.potentials(builder.workspace, team.id, 'tumbling', builder.workspace.plans.find((plan) => plan.teamId === team.id)!.tumbling[0]!.id, { signal: controller.signal });
    expect(aborted.every((item) => item.status !== 'proven' && item.preview === null)).toBe(true);
  });

  it('cache er bundet til hold, pakke og relevante data; en gammel preview kan ikke anvendes', async () => {
    const { builder, team } = scenario();
    const cache = new PotentialCache(); const key = cache.key(builder.workspace, team.id, 'tumbling', builder.workspace.plans[0]!.tumbling[0]!.id);
    const results = await DK_V1.potentials(builder.workspace, team.id, 'tumbling', builder.workspace.plans.find((plan) => plan.teamId === team.id)!.tumbling[0]!.id);
    cache.set(key, results); expect(cache.get(key)).toBe(results);
    const changed = updateAssessment(builder.workspace, builder.workspace.athleteSkills[0]!.id, { stability: 2, assessedAt: '2026-10-25', note: 'Ny kladde' }, builder.environment);
    expect(cache.key(changed, team.id, 'tumbling', builder.workspace.plans[0]!.tumbling[0]!.id)).not.toBe(key);
    expect(cache.key(changed, 'other-team', 'tumbling', builder.workspace.plans[0]!.tumbling[0]!.id)).not.toBe(key);
    expect(() => applyPotentialPreview(changed, results.find((item) => item.id === 'B-SKRUE')!.preview!)).toThrow('Beregn muligheden igen');
  });

  it('tillægsmuligheder er separate og uafklaret elementtillæg får ingen sikker værdi', async () => {
    const { builder, team } = scenario();
    const results = await DK_V1.potentials(builder.workspace, team.id, 'tumbling', builder.workspace.plans.find((plan) => plan.teamId === team.id)!.tumbling[0]!.id);
    expect(results.every((item) => item.independent)).toBe(true);
    const unresolved = results.find((item) => item.id === 'B-ELEMENT')!;
    expect(unresolved.status).toBe('unresolved');
    expect(unresolved.documentedValue).toBeNull();
    expect(unresolved.ruleMaximum).toBeNull();
    expect(unresolved.issue).toBe('Q01');
    expect(Object.hasOwn(results, 'combinedMaximum')).toBe(false);
  });

  it('en uafklaret A4-værdi bliver ikke en sikker sjette redskabskandidat', async () => {
    const builder = workspaceBuilder(); const team = builder.team('Trampet', undefined, 6);
    const jump = (sourceId: string) => ({ id: sourceId, name: 'Syntetisk trampetspring', archived: false, discipline: 'trampet' as const, jump: structuredClone(DK_SPRING_CATALOG.find((entry) => entry.referenceId === sourceId)!.execution) });
    const basic = jump('a4-f-03');
    for (let index = 0; index < 3; index++) builder.fill(team.id, 'trampet', index, Array.from({ length: 6 }, () => basic));
    for (const [index, athlete] of builder.workspace.athletes.entries()) builder.register(athlete.id, jump(index === 5 ? 'a4-v-12' : 'a4-v-03'));
    const result = (await DK_V1.potentials(builder.workspace, team.id, 'trampet', builder.workspace.plans.find((plan) => plan.teamId === team.id)!.trampet[0]!.id)).find((item) => item.id === 'T-DOBBELT-REDSKAB')!;
    expect(result.documentedValue?.toString()).toBe('1/2');
    expect(result.preview?.after.rounds.flatMap((round) => round.counting).some((item) => item.skill?.id === 'a4-v-12')).toBe(false);
  });

  it('mix-vidner har seks forskellige gymnaster og 3+3 eksplicitte kategorier', async () => {
    const builder = workspaceBuilder(); const team = builder.team('Mix', { ...DK_DEFAULT_BINDING, teamType: 'mix' }, 8);
    builder.workspace.athletes.forEach((athlete, index) => { athlete.mixCategory = index < 4 ? 'girl' : 'boy'; });
    const basic = fromRows(['a3-b-01', 'a3-b-02', 'a3-b-06'], 'mix-basic');
    const twist = fromRows(['a3-b-01', 'a3-b-02', 'a3-b-11'], 'mix-twist');
    for (const athlete of builder.workspace.athletes) { builder.register(athlete.id, basic); builder.register(athlete.id, twist); }
    const result = (await DK_V1.potentials(builder.workspace, team.id, 'tumbling', builder.workspace.plans.find((plan) => plan.teamId === team.id)!.tumbling[0]!.id)).find((item) => item.id === 'B-SKRUE')!;
    expect(result.documentedValue?.toString()).toBe('3/5');
    for (const round of result.preview!.after.rounds) {
      const categories = round.counting.map((entry) => builder.workspace.athletes.find((athlete) => athlete.id === entry.entry.athleteId)!.mixCategory);
      expect(categories.filter((category) => category === 'girl')).toHaveLength(3);
      expect(categories.filter((category) => category === 'boy')).toHaveLength(3);
    }
  });
});
