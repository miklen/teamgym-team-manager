import { describe, expect, it } from 'vitest';
import { Fraction, fillAmbition, setRoundEntries } from '@teamgym/domain';
import type { RoundEntryInput, SkillDefinition, Workspace } from '@teamgym/domain';
import { DK_SPRING_CATALOG } from '../../packages/rules/src/catalog';
import { DK_DEFAULT_BINDING } from '../../packages/rules/src/dk-data';
import { DK_V1, DK_V2 } from '../../packages/rules/src/dk-v1';
import { mixQuotaWithAmbitions } from '../../packages/rules/src/dk-numeric';
import { AMBITION_ROUNDS_ISSUE } from '../../packages/rules/src/potential';
import { ambitionCandidates, ambitionCanNow, ambitionEnvironment } from '../../packages/rules/src/ambitions';
import { fromRows, workspaceBuilder } from '../fixtures/rule-workspace';

const f = (value: string) => Fraction.from(value);
const V2 = { rulesetId: 'dk', packageVersion: '1.1.0', ageGroup: 'junior', teamType: 'girls' };

function jump(sourceId: string, id = `syntetisk-${sourceId}`): SkillDefinition {
  const source = DK_SPRING_CATALOG.find((item) => item.referenceId === sourceId);
  if (!source) throw new Error(`Ukendt syntetisk spring: ${sourceId}`);
  return { id, name: `Syntetisk ${sourceId}`, archived: false, discipline: 'trampet', jump: structuredClone(source.execution) };
}

/** Trampetomgang med faste tabelværdier: a4-f-08 = 0,60 og a4-f-10 = 0,80. */
function setup(binding = V2, athleteCount = 8) {
  const builder = workspaceBuilder();
  const team = builder.team('Syntetisk ambition', binding, athleteCount);
  const athletes = builder.workspace.athletes.filter((athlete) => athlete.teamId === team.id);
  const plan = () => builder.workspace.plans.find((item) => item.teamId === team.id)!;
  const scenario = () => plan().trampet[0]!;
  const defined = new Map<string, string>();
  function definition(source: string) {
    if (!defined.has(source)) {
      // Kun definitionen i kartoteket; ingen gymnast har springet endnu.
      const skill = jump(source);
      const existing = builder.workspace.skills.find((item) => item.id === skill.id);
      if (!existing) builder.workspace = { ...builder.workspace, skills: [...builder.workspace.skills, skill] };
      defined.set(source, skill.id);
    }
    return defined.get(source)!;
  }
  /** Kilder med `?` foran er ambitioner. Gymnaster tildeles i rækkefølge til de besatte pladser. */
  function round(index: number, sources: string[], offset = 0) {
    let athlete = offset;
    const entries: RoundEntryInput[] = sources.map((source) => source.startsWith('?')
      ? { id: builder.environment.id(), athleteId: null, athleteSkillId: null, role: 'counting', plannedSkillId: definition(source.slice(1)) }
      : { id: builder.environment.id(), athleteId: athletes[athlete]!.id, athleteSkillId: builder.register(athletes[athlete++]!.id, jump(source)), role: 'counting' });
    builder.workspace = setRoundEntries(builder.workspace, plan().id, 'trampet', scenario().id, scenario().rounds[index]!.id, entries, { counting: 6, extra: 2 }, builder.environment);
  }
  const analyze = (rulePackage = DK_V2) => rulePackage.analyze(builder.workspace, team.id, 'trampet', scenario().id);
  return { builder, team, athletes, plan, scenario, round, analyze, definition };
}

describe('ambitioner i regelmotoren: faste facit', () => {
  it('fem besatte 0,60 og en ambition 0,80 giver omgangs-D 3,80 uden opdeling', () => {
    const s = setup();
    s.round(1, ['a4-f-08', 'a4-f-08', 'a4-f-08', 'a4-f-08', 'a4-f-08', '?a4-f-10']);
    const round = s.analyze().rounds[1]!;
    const ambition = round.counting[5]!;
    expect(ambition.athleteName).toBe('Mangler gymnast');
    expect(ambition.originalD.value!.toString()).toBe(f('0.80').toString());
    expect(ambition.diagnostics.map((item) => item.code)).toContain('athlete-missing');
    expect(ambition.eligibleForC).toBe(true);
    expect(round.difficulty.status).toBe('known');
    expect(round.difficulty.value!.toString()).toBe(f('3.80').toString());
  });

  it('en afvigende ambition i holdomgangen giver 0 som en afvigende gymnast', () => {
    const s = setup();
    s.round(0, ['a4-f-08', 'a4-f-08', 'a4-f-08', 'a4-f-08', 'a4-f-08', '?a4-f-10']);
    const round = s.analyze().rounds[0]!;
    expect(round.counting[5]!.adjustedD.value!.toString()).toBe('0');
    expect(round.difficulty.value!.toString()).toBe(f('3.00').toString());
    s.round(0, ['a4-f-08', 'a4-f-08', 'a4-f-08', 'a4-f-08', 'a4-f-08', '?a4-f-08']);
    expect(s.analyze().rounds[0]!.difficulty.value!.toString()).toBe(f('3.60').toString());
  });

  it('sikkerhed: fem vurderede af seks påkrævede er ufuldstændig, og ambitionen er ikke udfyldt', () => {
    const s = setup();
    s.round(1, ['a4-f-08', 'a4-f-08', 'a4-f-08', 'a4-f-08', 'a4-f-08', '?a4-f-10']);
    const stability = s.analyze().rounds[1]!.stability.counting;
    expect(stability).toMatchObject({ requiredCount: 6, filledCount: 5, assessedCount: 5, complete: false });
    expect(stability.mean).toBe(5);
  });

  it('mix: kun besatte pladser vurderes; opnåelig fordeling er ufuldstændig, brudt er ugyldig', () => {
    expect(mixQuotaWithAmbitions(['girl', 'girl', 'girl', 'boy', 'boy'], 3, 3)).toBe('incomplete');
    expect(mixQuotaWithAmbitions(['girl', 'girl', 'girl', 'girl', 'boy'], 3, 3)).toBe('invalid');
    const s = setup({ ...DK_DEFAULT_BINDING, packageVersion: '1.0.0', teamType: 'mix' });
    s.builder.workspace.athletes.forEach((athlete, index) => { athlete.mixCategory = index < 3 ? 'girl' : 'boy'; });
    s.round(1, ['a4-f-08', 'a4-f-08', 'a4-f-08', 'a4-f-08', 'a4-f-08', '?a4-f-08']);
    const attainable = s.analyze(DK_V1);
    expect(attainable.rounds[1]!.compositionReady).toBe(true);
    const roundId = s.scenario().rounds[1]!.id;
    const mixOf = (result: ReturnType<typeof s.analyze>) => result.diagnostics.find((item) => item.code === 'mix-quota' && item.affectedIds.includes(roundId))!;
    const mix = mixOf(attainable);
    expect(mix.status).toBe('incomplete');
    expect(mix.message).toContain('ambitionspladsen');
    s.builder.workspace.athletes.forEach((athlete, index) => { athlete.mixCategory = index < 4 ? 'girl' : 'boy'; });
    const broken = s.analyze(DK_V1);
    expect(mixOf(broken).status).toBe('invalid');
    expect(broken.rounds[1]!.compositionReady).toBe(false);
  });

  it('uafklaret gentagelse med ambition giver begge udfald: samme 1,20 og forskellige uafklaret', () => {
    const s = setup({ ...DK_DEFAULT_BINDING, packageVersion: '1.0.0' });
    s.round(0, Array(6).fill('a4-f-03'));
    s.round(1, ['a4-f-01', 'a4-f-01', 'a4-f-01', 'a4-f-01', 'a4-f-01', '?a4-f-01']);
    s.round(2, Array(6).fill('a4-f-01'));
    const repetition = s.analyze(DK_V1).contributions.find((item) => item.id === 'C-GENTAG')!.decision;
    expect(repetition.status).toBe('incomplete');
    expect(repetition.issues).toContain('AMBITION-ATHLETES');
    expect(repetition.alternatives.sameAthletes!.toString()).toBe(f('1.20').toString());
  });
});

describe('kan nu og match', () => {
  function candidates() {
    const s = setup();
    s.round(1, ['a4-f-08', 'a4-f-08', 'a4-f-08', '?a4-f-10', '?a4-f-10']);
    const round = () => s.scenario().rounds[1]!;
    const ambitions = () => round().entries.filter((entry) => entry.athleteId === null);
    return { ...s, round, ambitions };
  }

  it('grupperer efter faktisk match og sorterer efter sikkerhed og navn', () => {
    const s = candidates();
    expect(ambitionCanNow(s.builder.workspace, DK_V2, s.team.id, s.round(), s.ambitions()[0]!.id)).toBe(0);
    s.builder.register(s.athletes[5]!.id, jump('a4-f-10'), 2);
    s.builder.register(s.athletes[4]!.id, jump('a4-f-10'), 4);
    s.builder.register(s.athletes[0]!.id, jump('a4-f-10'), 5);
    const list = ambitionCandidates(s.builder.workspace, DK_V2, s.team.id, s.round(), s.ambitions()[0]!.id);
    expect(list.filter((item) => item.status === 'match').map((item) => item.athlete.id)).toEqual([s.athletes[4]!.id, s.athletes[5]!.id]);
    expect(list.find((item) => item.athlete.id === s.athletes[0]!.id)).toMatchObject({ status: 'not-yet', reason: 'in-round' });
    expect(list.find((item) => item.athlete.id === s.athletes[6]!.id)).toMatchObject({ status: 'not-yet', reason: 'missing-skill' });
    expect(ambitionCanNow(s.builder.workspace, DK_V2, s.team.id, s.round(), s.ambitions()[1]!.id)).toBe(2);
  });

  it('en besættelse fjerner gymnasten fra den anden ambitions tal', () => {
    const s = candidates();
    const registration = s.builder.register(s.athletes[4]!.id, jump('a4-f-10'), 4);
    const [first, second] = s.ambitions();
    expect(ambitionCanNow(s.builder.workspace, DK_V2, s.team.id, s.round(), first!.id)).toBe(1);
    expect(ambitionCanNow(s.builder.workspace, DK_V2, s.team.id, s.round(), second!.id)).toBe(1);
    s.builder.workspace = fillAmbition(s.builder.workspace, s.plan().id, 'trampet', s.scenario().id, s.round().id, first!.id, registration, { ...ambitionEnvironment(DK_V2), id: s.builder.environment.id });
    expect(ambitionCanNow(s.builder.workspace, DK_V2, s.team.id, s.round(), second!.id)).toBe(0);
  });

  it('arkiverede registreringer og gymnaster tæller ikke', () => {
    const s = candidates();
    const registration = s.builder.register(s.athletes[4]!.id, jump('a4-f-10'), 4);
    const archive = (mutate: (workspace: Workspace) => void) => {
      const copy = structuredClone(s.builder.workspace);
      mutate(copy);
      return ambitionCanNow(copy, DK_V2, s.team.id, s.round(), s.ambitions()[0]!.id);
    };
    expect(archive(() => {})).toBe(1);
    expect(archive((copy) => { copy.athleteSkills.find((item) => item.id === registration)!.archived = true; })).toBe(0);
    expect(archive((copy) => { copy.athletes.find((item) => item.id === s.athletes[4]!.id)!.archived = true; })).toBe(0);
  });
});

describe('potentialeforslag og ambitioner', () => {
  function scenario() {
    const builder = workspaceBuilder(); const team = builder.team('Potentiale');
    const basic = fromRows(['a3-b-01', 'a3-b-02', 'a3-b-06'], 'potential-basic');
    const twist = fromRows(['a3-b-01', 'a3-b-02', 'a3-b-11'], 'potential-twist');
    builder.fill(team.id, 'tumbling', 0, Array.from({ length: 6 }, () => basic));
    builder.fill(team.id, 'tumbling', 1, Array.from({ length: 6 }, (_, index) => index < 4 ? twist : basic));
    builder.fill(team.id, 'tumbling', 2, Array.from({ length: 6 }, () => basic));
    for (const athlete of builder.workspace.athletes.slice(0, 6)) builder.register(athlete.id, twist);
    const scenarioOf = () => builder.workspace.plans[0]!.tumbling[0]!;
    const basicId = builder.workspace.athleteSkills.find((item) => item.id === scenarioOf().rounds[0].entries[5]!.athleteSkillId)!.skillId;
    function ambitionIn(index: number) {
      const round = scenarioOf().rounds[index]!;
      builder.workspace = setRoundEntries(builder.workspace, builder.workspace.plans[0]!.id, 'tumbling', scenarioOf().id, round.id,
        [...round.entries.slice(0, 5), { id: `ambition-${index}`, athleteId: null, athleteSkillId: null, role: 'counting', plannedSkillId: basicId }], { counting: 6, extra: 2 }, builder.environment);
    }
    const potential = async () => (await DK_V1.potentials(builder.workspace, team.id, 'tumbling', scenarioOf().id)).find((item) => item.id === 'B-SKRUE')!;
    return { ambitionIn, potential, scenarioOf };
  }

  it('udskifter aldrig en omgang med ambitioner og bevarer dem i forslaget', async () => {
    const s = scenario();
    s.ambitionIn(2);
    const result = await s.potential();
    expect(result.preview).not.toBeNull();
    expect(result.preview!.after.rounds[2]!.entries.some((item) => item.entry.id === 'ambition-2' && item.entry.athleteId === null)).toBe(true);
    expect(result.preview!.changes.every((change) => change.roundId !== s.scenarioOf().rounds[2]!.id)).toBe(true);
  });

  it('forklarer, når ambitioner udelukker alle forslag', async () => {
    const s = scenario();
    expect((await s.potential()).status).toBe('proven');
    for (const index of [0, 1, 2]) s.ambitionIn(index);
    const result = await s.potential();
    expect(result).toMatchObject({ status: 'incomplete', issue: AMBITION_ROUNDS_ISSUE, preview: null });
  });
});
