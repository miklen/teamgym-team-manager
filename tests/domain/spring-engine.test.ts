import { describe, expect, it } from 'vitest';
import { createWorkspace, createTeam, createAthlete, registerAthleteSkill, setRoundEntries, updateAssessment, confirmConnection, Fraction, skillIdentity } from '@teamgym/domain';
import type { CommandEnvironment, ElementExecution, SkillDefinition, Workspace } from '@teamgym/domain';
import { DK_SPRING_CATALOG } from '../../packages/rules/src/catalog';
import { DK_PROFILES, DK_DEFAULT_BINDING } from '../../packages/rules/src/dk-data';
import { evaluateDiscipline } from '../../packages/rules/src/dk-engine';
import { resolvedElementBonus } from '../../packages/rules/src/dk-numeric';
import { DK_V1, DK_V2 } from '../../packages/rules/src/dk-v1';
import { elementDifficulty, elementIdentity, evaluateSpringSkill, normalizeElement } from '../../packages/rules/src/dk-spring';
import springCsv from '../../openspec/changes/archive/2026-10-25-build-teamgym-team-manager/reference/spring-source-catalog.csv?raw';

const row = (id: string): ElementExecution => structuredClone(DK_SPRING_CATALOG.find((item) => item.referenceId === id)!.execution);
function series(ids: string[], id = 'series'): SkillDefinition {
  return { id, name: `Syntetisk ${id}`, archived: false, discipline: 'tumbling', elements: ids.map(row), connection: { kind: 'standard', transitions: ids.slice(1).map(() => 'direct') } };
}
function spring(id: string, skillId = id): SkillDefinition { return { id: skillId, name: `Syntetisk ${id}`, archived: false, discipline: 'trampet', jump: row(id) }; }

function setup(binding = { ...DK_DEFAULT_BINDING, packageVersion: '1.0.0' }) {
  const selectedProfile = DK_PROFILES.find((item) => item.ageGroup === binding.ageGroup && item.teamType === binding.teamType)!;
  let next = 0;
  const environment: CommandEnvironment = { id: () => `engine-${++next}`, now: () => '2026-10-25T12:00:00Z' };
  let workspace = createTeam(createWorkspace(environment), 'Syntetisk beregningshold', binding, environment);
  for (let index = 0; index < 8; index++) workspace = createAthlete(workspace, { name: `Gymnast Test ${index + 1}`, teamId: workspace.teams[0]!.id }, environment);
  function fill(discipline: 'tumbling' | 'trampet', roundIndex: number, definitions: SkillDefinition[]) {
    const entries = definitions.map((definition, index) => {
      const athlete = workspace.athletes[index]!;
      const registration = registerAthleteSkill(workspace, athlete.id, definition, environment);
      workspace = registration.workspace;
      return { id: environment.id(), athleteId: athlete.id, athleteSkillId: registration.athleteSkillId, role: 'counting' as const };
    });
    const plan = workspace.plans[0]!;
    workspace = setRoundEntries(workspace, plan.id, discipline, plan[discipline][0]!.id, plan[discipline][0]!.rounds[roundIndex]!.id, entries, selectedProfile, environment);
  }
  function analyze(discipline: 'tumbling' | 'trampet', candidate: Workspace = workspace) { return evaluateDiscipline(candidate, candidate.teams[0]!.id, discipline, candidate.plans[0]![discipline][0]!.id, selectedProfile,
    { ruleCorrections: binding.packageVersion === '1.1.0', elementBonusResolved: binding.packageVersion === '1.1.0' }); }
  return { get workspace() { return workspace; }, environment, fill, analyze, selectedProfile };
}

describe('afledt kompositionsguide', () => {
  it('samler alle planens tillæg og fradrag til kompakt status uden at gøre delvis plan endelig', () => {
    const state = setup({ ...DK_DEFAULT_BINDING, packageVersion: '1.1.0' });
    const empty = DK_V2.guideOverview(state.analyze('tumbling'));
    expect(empty.started).toBe(false);
    expect(empty.readyRounds).toBe(0);
    expect(empty.complete).toBe(false);
    const skill = series(['a3-b-01', 'a3-b-02', 'a3-b-04'], 'overview');
    state.fill('tumbling', 0, Array.from({ length: 6 }, () => skill));
    const partial = DK_V2.guideOverview(state.analyze('tumbling'));
    expect(partial.readyRounds).toBe(1);
    expect(partial.complete).toBe(false);
    expect(partial.bonus.knownSubtotal.toString()).toBe('2/5');
    for (const index of [1, 2]) state.fill('tumbling', index, Array.from({ length: 6 }, () => skill));
    const complete = DK_V2.guideOverview(state.analyze('tumbling'));
    expect(complete.readyRounds).toBe(3);
    expect(complete.complete).toBe(true);
    expect(complete.bonus.value?.toString()).toBe('6/5');
    expect(complete.deduction.knownSubtotal.toString()).toBe('18/5');
  });

  it('viser træningsmål uden registreringer og ingen opdigtede planpoint', () => {
    const state = setup();
    const guide = DK_V1.guide(state.analyze('tumbling'), state.selectedProfile);
    const twist = guide.find((row) => row.id === 'B-SKRUE')!;
    expect(twist.status).toBe('Ikke påbegyndt');
    expect(twist.current).toBeNull();
    expect(twist.ruleMaximum?.toString()).toBe('3/5');
    expect(twist.documented).toBeNull();
    expect(twist.example?.code).toBeTruthy();
    expect(guide.find((row) => row.id === 'B-ELEMENT')?.ruleMaximum).toBeNull();
    expect(guide.find((row) => row.id === 'B-ELEMENT')?.example).toBeNull();
  });

  it('potentialer for nul registreringer giver ingen dokumenteret værdi eller samlet maksimum', async () => {
    const state = setup();
    const scenarioId = state.workspace.plans[0]!.tumbling[0]!.id;
    const potentials = await DK_V1.potentials(state.workspace, state.workspace.teams[0]!.id, 'tumbling', scenarioId);
    const guide = DK_V1.guide(state.analyze('tumbling'), state.selectedProfile, potentials);
    expect(guide.find((row) => row.id === 'B-SKRUE')?.ruleMaximum?.toString()).toBe('3/5');
    expect(guide.filter((row) => row.category === 'bonus').every((row) => row.documented === null)).toBe(true);
    expect(Object.hasOwn(guide, 'combinedMaximum')).toBe(false);
    expect(guide.every((row) => row.example === null || !('athleteId' in row.example))).toBe(true);
  });

  it('holder 2/6 foreløbigt adskilt fra endeligt 0,20 og finder egen bedste omgang', () => {
    const state = setup();
    const plain = series(['a3-b-01', 'a3-b-02', 'a3-b-06'], 'plain-1');
    const plain2 = series(['a3-b-01', 'a3-b-02', 'a3-b-06'], 'plain-2');
    const plain3 = series(['a3-b-01', 'a3-b-02', 'a3-b-06'], 'plain-3');
    const twist = series(['a3-b-01', 'a3-b-02', 'a3-b-11'], 'twist-2');
    const double = series(['a3-b-01', 'a3-b-02', 'a3-b-15'], 'double-3');
    state.fill('tumbling', 0, Array.from({ length: 6 }, () => plain));
    state.fill('tumbling', 1, [twist, twist, plain2, plain2, plain2, plain2]);
    let row = DK_V1.guide(state.analyze('tumbling'), state.selectedProfile).find((item) => item.id === 'B-SKRUE')!;
    expect(row.status).toBe('Foreløbig 2/6');
    expect(row.current).toBeNull();
    expect(row.preliminary?.toString()).toBe('1/5');
    state.fill('tumbling', 2, [double, double, double, plain3, plain3, plain3]);
    const guide = DK_V1.guide(state.analyze('tumbling'), state.selectedProfile);
    row = guide.find((item) => item.id === 'B-SKRUE')!;
    expect(row.current?.toString()).toBe('1/5');
    expect(row.status).toContain('0,20');
    expect(row.roundIds).toContain(state.analyze('tumbling').rounds[1]!.id);
    expect(guide.find((item) => item.id === 'B-DOBBELT')?.detail).toContain('3. omgang');
    expect(guide.find((item) => item.id === 'C-RETNING')?.counting).toBe('To hele omgange');
    expect(guide.find((item) => item.id === 'B-ELEMENT')?.counting).toBe('Uafklaret · over tre omgange');
  });

  it('viser Pegasus som omgangskrav og aldersbestemt skrue i begge installerede pakker', () => {
    for (const rulePackage of [DK_V1, DK_V2]) for (const ageGroup of ['U14', 'junior', 'senior']) for (const teamType of ['girls', 'mix']) {
      const state = setup({ rulesetId: 'dk', packageVersion: rulePackage.manifest.packageVersion, ageGroup, teamType });
      const guide = rulePackage.guide(state.analyze('trampet'), state.selectedProfile);
      expect(guide.find((row) => row.id === 'C-REDSKAB')?.counting).toBe('To hele omgange');
      expect(guide.find((row) => row.id === 'C-REDSKAB')?.status).toBe('Ikke påbegyndt');
      expect(guide.find((row) => row.id === 'T-SKRUE')?.requirement).toContain(ageGroup === 'U14' ? '360°' : '540°');
      expect(guide.find((row) => row.id === 'T-SKRUE')?.example).not.toBeNull();
      for (const row of guide.filter((item) => item.example)) {
        const catalog = DK_SPRING_CATALOG.find((entry) => entry.officialCode === row.example?.code && entry.name === row.example.label)!;
        expect(catalog.status).toBe('allowed');
        expect(catalog.issueId).toBeNull();
      }
    }
  });

  it('med/uden Pegasus afgøres på hele omgange og kan ikke behandles som pr.-gymnast-tillæg', () => {
    const state = setup();
    state.fill('trampet', 0, Array.from({ length: 6 }, () => spring('a4-f-08', 'free-0')));
    state.fill('trampet', 1, Array.from({ length: 6 }, () => spring('a4-f-08', 'free-1')));
    state.fill('trampet', 2, Array.from({ length: 6 }, () => spring('a4-f-08', 'free-2')));
    const missing = DK_V1.guide(state.analyze('trampet'), state.selectedProfile).find((row) => row.id === 'C-REDSKAB')!;
    expect(missing.counting).toBe('To hele omgange');
    expect(missing.status).toContain('fradrag');
    expect(missing.counts).toEqual([[0, 0, 0], [6, 6, 6]]);
    expect(missing.ruleMaximum).toBeNull();
  });
});

describe('afklaret elementtillæg i DK 1.1.0', () => {
  const latest = { ...DK_DEFAULT_BINDING, packageVersion: '1.1.0' };
  it('tæller også et fjerde forskelligt element, men aldrig det første eller gentagelser', () => {
    expect(resolvedElementBonus([[4], [1], [1]], true).value?.toString()).toBe('1/10');
    expect(resolvedElementBonus([[1], [1], [1]], true).value?.toString()).toBe('0');
    expect(resolvedElementBonus([[4], [], []], false).knownSubtotal.toString()).toBe('1/10');
  });

  it('giver 0,10 for rondat–flik–flik og 0,20 for rondat–flik–lukket pr. gymnast', () => {
    const state = setup(latest);
    state.fill('tumbling', 0, Array.from({ length: 6 }, () => series(['a3-b-01', 'a3-b-02', 'a3-b-02'], 'rff-0')));
    state.fill('tumbling', 1, Array.from({ length: 6 }, () => series(['a3-b-01', 'a3-b-02', 'a3-b-04'], 'rfo-1')));
    state.fill('tumbling', 2, Array.from({ length: 6 }, () => series(['a3-b-04'], 'single-2')));
    const result = state.analyze('tumbling');
    const bonus = result.contributions.find((item) => item.id === 'B-ELEMENT')!;
    expect(result.rounds[0]!.counting[0]!.evaluation?.distinctElementCount).toBe(2);
    expect(result.rounds[1]!.counting[0]!.evaluation?.distinctElementCount).toBe(3);
    expect(result.rounds[2]!.counting[0]!.evaluation?.distinctElementCount).toBe(1);
    expect(bonus.decision.status).toBe('known');
    expect(bonus.decision.value?.toString()).toBe('3/5');
    expect(bonus.guideCounts).toEqual([[6, 12, 0]]);
    expect(bonus.decision.issues).toEqual([]);
    const guide = DK_V2.guide(result, state.selectedProfile);
    const row = guide.find((item) => item.id === 'B-ELEMENT')!;
    expect(row.counting).toBe('Pr. serie · over tre omgange');
    expect(row.current?.toString()).toBe('3/5');
    expect(row.ruleMaximum).toBeNull();
    expect(row.example?.code).toBe('R–F–O');
    expect(row.example?.sources).toHaveLength(3);
    expect(DK_V2.knownIssues.some((issue) => issue.id === 'Q01')).toBe(false);
    expect(DK_V1.knownIssues.some((issue) => issue.id === 'Q01')).toBe(true);
  });

  it('holder delvis plan foreløbig og bevarer den ældre pakkes to fortolkningsspor', () => {
    const state = setup(latest);
    state.fill('tumbling', 0, Array.from({ length: 6 }, () => series(['a3-b-01', 'a3-b-02', 'a3-b-04'], 'partial-0')));
    const latestResult = state.analyze('tumbling');
    const latestBonus = latestResult.contributions.find((item) => item.id === 'B-ELEMENT')!.decision;
    expect(latestBonus.status).toBe('incomplete');
    expect(latestBonus.value).toBeNull();
    expect(latestBonus.knownSubtotal.toString()).toBe('2/5');
    const row = DK_V2.guide(latestResult, state.selectedProfile).find((item) => item.id === 'B-ELEMENT')!;
    expect(row.current).toBeNull();
    expect(row.preliminary?.toString()).toBe('2/5');
    expect(row.status).toBe('Foreløbig plan');
    const older = setup();
    older.fill('tumbling', 0, Array.from({ length: 6 }, () => series(['a3-b-01', 'a3-b-02', 'a3-b-04'], 'older-0')));
    const legacy = older.analyze('tumbling').contributions.find((item) => item.id === 'B-ELEMENT')!.decision;
    expect(legacy.status).toBe('unresolved');
    expect(legacy.alternatives.literal?.toString()).toBe('3/5');
    expect(legacy.alternatives.example?.toString()).toBe('2/5');
    expect(DK_V1.guide(older.analyze('tumbling'), older.selectedProfile).find((item) => item.id === 'B-ELEMENT')?.example).toBeNull();
  });

  it('lader det afklarede tillæg indgå i en kendt rå C uden at ændre D', () => {
    const state = setup(latest);
    for (let index = 0; index < 3; index++) state.fill('tumbling', index,
      Array.from({ length: 6 }, () => series(['a3-b-01', 'a3-b-02', 'a3-b-04'], `total-${index}`)));
    const result = state.analyze('tumbling');
    expect(result.contributions.find((item) => item.id === 'B-ELEMENT')?.decision.value?.toString()).toBe('6/5');
    expect(result.composition.status).toBe('known');
    expect(result.composition.raw?.toString()).toBe('-12/5');
    expect(result.composition.value?.toString()).toBe('0');
    expect(result.rounds.map((round) => round.difficulty.value?.toString())).toEqual(['3', '3', '3']);
  });
});

describe('katalogidentiteter, formler og forbindelser', () => {
  it('alle 83 tilladte trykte springværdier stemmer post for post med beregningen', () => {
    const sourceRows = springCsv.trim().split(/\r?\n/).slice(1).map((line) => line.split(';'));
    for (const source of sourceRows.filter((fields) => fields[7] === 'allowed')) {
      const entry = DK_SPRING_CATALOG.find((item) => item.referenceId === source[0])!;
      const calculated = elementDifficulty(entry.execution);
      expect(calculated.status, entry.referenceId).toBe('known');
      expect(calculated.value!.compare(source[6]!), entry.referenceId).toBe(0);
    }
    for (const entry of DK_SPRING_CATALOG.filter((item) => item.status === 'forbidden')) expect(elementDifficulty(entry.execution).status, entry.referenceId).toBe('invalid');
  });

  it('formelvariant uden trykt kode beregnes uden at opfinde en kode', () => {
    const execution = { ...row('a4-f-03'), twistsHalfTurns: 8, twistDistribution: [8] };
    expect(elementDifficulty(execution).value?.toString()).toBe('13/10');
    expect(normalizeElement(execution).twistDistribution).toEqual([]);
    expect(elementDifficulty({ ...execution, rotationQuarterTurns: 12, bodyPositions: ['straight', 'straight', 'straight'] }).status).toBe('invalid');
  });

  it('normaliserer kun de dokumenterede Kasamatsu-ækvivalenser', () => {
    const tsuk = row('a4-v-06');
    const kas = { ...tsuk, family: 'kasamatsu', twistsHalfTurns: 0, twistDistribution: [] };
    expect(elementIdentity(tsuk)).toBe(elementIdentity(kas));
    expect(elementDifficulty(kas).value?.compare('1.30')).toBe(0);
    expect(elementDifficulty({ ...kas, bodyPositions: ['pike'] }).status).toBe('unresolved');
  });

  it('kræver en konkret bekræftelse for specialforbindelser uden at ophæve forbud', () => {
    const special = series(['a3-f-02', 'a3-b-11'], 'custom');
    if (special.discipline !== 'tumbling') throw new Error('Testdefinition');
    special.connection.kind = 'custom';
    expect(evaluateSpringSkill(special).connection).toBe('unverified');
    const confirmation = { executionIdentity: skillIdentity(special), confirmedAt: '2026-10-25T12:00:00Z', note: 'Konkret trænerbekræftelse i syntetisk test.' };
    expect(evaluateSpringSkill(special, confirmation).status).toBe('known');
    const forbidden = series(['a3-b-23'], 'forbidden');
    if (forbidden.discipline !== 'tumbling') throw new Error('Testdefinition');
    forbidden.connection.kind = 'custom';
    expect(evaluateSpringSkill(forbidden, { ...confirmation, executionIdentity: skillIdentity(forbidden) }).status).toBe('invalid');
  });
});

describe('fulde opstillinger gennem filmodel, registrering og D/C-analyse', () => {
  it('5/1 i holdomgangen nulstiller D og bevarer C-berettigelse til skrue', () => {
    const state = setup();
    const basic = series(['a3-b-01', 'a3-b-02', 'a3-b-06'], 'basic');
    const twist = series(['a3-b-01', 'a3-b-02', 'a3-b-11'], 'twist');
    state.fill('tumbling', 0, [basic, basic, basic, basic, basic, twist]);
    const result = state.analyze('tumbling');
    expect(result.rounds[0]?.difficulty.value?.toString()).toBe('3');
    expect(result.rounds[0]?.counting[5]?.adjustedD.value?.toString()).toBe('0');
    expect(result.rounds[0]?.counting[5]?.eligibleForC).toBe(true);
    expect(result.contributions.find((item) => item.id === 'C-HOLD')?.decision.value?.toString()).toBe('1/5');
    expect(result.contributions.find((item) => item.id === 'B-SKRUE')?.decision.knownSubtotal.toString()).toBe('1/10');
    expect(result.composition.value).toBeNull();
    expect(result.contributions.find((item) => item.id === 'B-ELEMENT')?.decision.issues).toContain('Q01');
  });

  it('disciplin-D er tre omgangssummer divideret med tre og påvirkes ikke af stabilitet', () => {
    const state = setup();
    state.fill('tumbling', 0, Array.from({ length: 6 }, () => series(['a3-b-01', 'a3-b-02', 'a3-b-06'], 'first')));
    state.fill('tumbling', 1, Array.from({ length: 6 }, () => series(['a3-f-02', 'a3-f-14'], 'second')));
    state.fill('tumbling', 2, Array.from({ length: 6 }, () => series(['a3-b-01', 'a3-b-02', 'a3-b-11'], 'third')));
    const before = state.analyze('tumbling');
    expect(before.rounds.map((round) => round.difficulty.value?.toString())).toEqual(['18/5', '21/5', '24/5']);
    expect(before.difficulty.value?.toString()).toBe('21/5');
    const changed = updateAssessment(state.workspace, state.workspace.athleteSkills[0]!.id, { stability: 1, assessedAt: '2026-10-25', note: 'Lav stabilitet ændrer ikke officielle point.' }, state.environment);
    expect(state.analyze('tumbling', changed).difficulty.value?.toString()).toBe('21/5');
  });

  it('samme D er ikke samme holdomgangsidentitet', () => {
    const state = setup();
    const backwards = series(['a3-b-01', 'a3-b-02', 'a3-b-06'], 'same-d-backward');
    const forwards = series(['a3-f-02', 'a3-f-13'], 'same-d-forward');
    state.fill('tumbling', 0, [backwards, backwards, backwards, backwards, backwards, forwards]);
    const result = state.analyze('tumbling');
    expect(result.rounds[0]?.counting.map((entry) => entry.originalD.value?.toString())).toEqual(Array.from({ length: 6 }, () => '3/5'));
    expect(result.rounds[0]?.counting.at(-1)?.adjustedD.value?.toString()).toBe('0');
    expect(result.rounds[0]?.difficulty.value?.toString()).toBe('3');
  });

  it('viser kendt delresultat ved fem pladser uden opdigtet manglende-gymnast-fradrag', () => {
    const state = setup();
    state.fill('tumbling', 0, Array.from({ length: 5 }, () => series(['a3-b-01', 'a3-b-02', 'a3-b-06'])));
    const result = state.analyze('tumbling');
    expect(result.difficulty.status).not.toBe('known');
    expect(result.rounds[0]?.difficulty.knownSubtotal.toString()).toBe('3');
    expect(result.contributions.some((item) => item.id === 'missing-athlete')).toBe(false);
    expect(result.fullExecutionScore).toBe(false);
    expect(result.contributions.find((item) => item.id === 'C-FLOW')?.decision.value).toBeNull();
  });

  it('fire forskellige elementer tæller højst tre til D og alle fire til C-elementsporet', () => {
    const state = setup();
    const four = series(['a3-b-01', 'a3-b-02', 'a3-b-03', 'a3-b-11'], 'four-elements');
    state.fill('tumbling', 0, Array.from({ length: 6 }, () => four));
    const result = state.analyze('tumbling');
    expect(result.rounds[0]?.counting[0]?.originalD.value?.toString()).toBe('1');
    expect(result.rounds[0]?.counting[0]?.evaluation?.distinctElementCount).toBe(4);
    const bonus = result.contributions.find((item) => item.id === 'B-ELEMENT')!.decision;
    expect(bonus.alternatives.literal?.toString()).toBe('4/5');
    expect(bonus.alternatives.example?.toString()).toBe('3/5');
  });

  it('en selvstændig A4-værdikonflikt gør D uafklaret uden at fjerne kendte C-bidrag', () => {
    const state = setup();
    state.fill('trampet', 0, Array.from({ length: 6 }, () => spring('a4-v-12')));
    state.fill('trampet', 1, Array.from({ length: 6 }, () => spring('a4-f-08')));
    state.fill('trampet', 2, Array.from({ length: 6 }, () => spring('a4-f-03')));
    const result = state.analyze('trampet');
    expect(result.difficulty.status).toBe('unresolved');
    expect(result.difficulty.issues).toContain('Q02');
    expect(result.difficulty.alternatives.table?.compare('4.20')).toBe(0);
    expect(result.difficulty.alternatives.formula?.compare('4.00')).toBe(0);
    expect(result.contributions.find((item) => item.id === 'C-HOLD')?.decision.value?.toString()).toBe('0');
    expect(result.contributions.find((item) => item.id === 'C-REDSKAB')?.decision.value?.toString()).toBe('0');
    expect(result.contributions.find((item) => item.id === 'T-SKRUE')?.decision.value?.toString()).toBe('3/5');
    expect(result.contributions.find((item) => item.id === 'T-DOBBELT-REDSKAB')?.decision.value?.toString()).toBe('3/5');
    expect(result.composition.value?.compare('2.20')).toBe(0);
  });

  it('tillæg kan have hver sin bedste omgang, og rækkefølgeforslag flytter ikke data', () => {
    const state = setup();
    state.fill('tumbling', 0, Array.from({ length: 6 }, () => series(['a3-b-01', 'a3-b-02', 'a3-b-06'], 'base')));
    state.fill('tumbling', 1, Array.from({ length: 6 }, () => series(['a3-f-02', 'a3-f-14'], 'twisting')));
    state.fill('tumbling', 2, Array.from({ length: 6 }, () => series(['a3-b-01', 'a3-b-02', 'a3-b-15'], 'double')));
    const before = structuredClone(state.workspace);
    const result = state.analyze('tumbling');
    expect(result.contributions.find((item) => item.id === 'B-SKRUE')?.decision.value?.toString()).toBe('3/5');
    expect(result.contributions.find((item) => item.id === 'B-DOBBELT')?.decision.value?.toString()).toBe('3/5');
    expect(state.workspace).toEqual(before);
    expect(result.contributions.every((item) => item.sources.length > 0)).toBe(true);
    expect(result.difficulty.value).toBeInstanceOf(Fraction);
  });

  it('en trænerbekræftelse hører til den konkrete gymnast og ikke en global færdighed', () => {
    const state = setup();
    const special = series(['a3-f-02', 'a3-b-11'], 'custom');
    if (special.discipline !== 'tumbling') throw new Error('Testdefinition');
    special.connection.kind = 'custom';
    state.fill('tumbling', 0, Array.from({ length: 6 }, () => special));
    const registration = state.workspace.athleteSkills[0]!;
    const confirmed = confirmConnection(state.workspace, registration.id, 'Præcis forbindelse bekræftet i syntetisk test.', state.environment);
    const result = state.analyze('tumbling', confirmed);
    expect(result.rounds[0]?.counting[0]?.eligibleForC).toBe(true);
    expect(result.rounds[0]?.counting[1]?.eligibleForC).toBe(false);
  });
});
