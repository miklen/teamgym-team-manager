import { describe, expect, it } from 'vitest';
import { createWorkspace, createTeam, createAthlete, registerAthleteSkill, setRoundEntries, updateAssessment, confirmConnection, Fraction, skillIdentity } from '@teamgym/domain';
import type { CommandEnvironment, ElementExecution, SkillDefinition, Workspace } from '@teamgym/domain';
import { DK_SPRING_CATALOG } from '../../packages/rules/src/catalog';
import { DK_PROFILES, DK_DEFAULT_BINDING } from '../../packages/rules/src/dk-data';
import { evaluateDiscipline } from '../../packages/rules/src/dk-engine';
import { elementDifficulty, elementIdentity, evaluateSpringSkill, normalizeElement } from '../../packages/rules/src/dk-spring';
import springCsv from '../../openspec/changes/archive/2026-10-25-build-teamgym-team-manager/reference/spring-source-catalog.csv?raw';

const profile = DK_PROFILES.find((item) => item.ageGroup === 'junior' && item.teamType === 'girls')!;
const row = (id: string): ElementExecution => structuredClone(DK_SPRING_CATALOG.find((item) => item.referenceId === id)!.execution);
function series(ids: string[], id = 'series'): SkillDefinition {
  return { id, name: `Syntetisk ${id}`, archived: false, discipline: 'tumbling', elements: ids.map(row), connection: { kind: 'standard', transitions: ids.slice(1).map(() => 'direct') } };
}
function spring(id: string, skillId = id): SkillDefinition { return { id: skillId, name: `Syntetisk ${id}`, archived: false, discipline: 'trampet', jump: row(id) }; }

function setup() {
  let next = 0;
  const environment: CommandEnvironment = { id: () => `engine-${++next}`, now: () => '2026-10-25T12:00:00Z' };
  let workspace = createTeam(createWorkspace(environment), 'Syntetisk beregningshold', DK_DEFAULT_BINDING, environment);
  for (let index = 0; index < 8; index++) workspace = createAthlete(workspace, { name: `Gymnast Test ${index + 1}`, teamId: workspace.teams[0]!.id }, environment);
  function fill(discipline: 'tumbling' | 'trampet', roundIndex: number, definitions: SkillDefinition[]) {
    const entries = definitions.map((definition, index) => {
      const athlete = workspace.athletes[index]!;
      const registration = registerAthleteSkill(workspace, athlete.id, definition, environment);
      workspace = registration.workspace;
      return { id: environment.id(), athleteId: athlete.id, athleteSkillId: registration.athleteSkillId, role: 'counting' as const };
    });
    const plan = workspace.plans[0]!;
    workspace = setRoundEntries(workspace, plan.id, discipline, plan[discipline][roundIndex]!.id, entries, profile, environment);
  }
  function analyze(discipline: 'tumbling' | 'trampet', candidate: Workspace = workspace) { return evaluateDiscipline(candidate, candidate.teams[0]!.id, discipline, profile); }
  return { get workspace() { return workspace; }, environment, fill, analyze };
}

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
