import { describe, expect, it } from 'vitest';
import {
  clearPlannedSpot, duplicateScenario, insertReserve, migrateWorkspace, migrateWorkspaceV3, moveRoundFirst, plannedSpotState, registerAthleteSkill,
  replaceAthleteSkill, serializeWorkspace, setPlannedSpot, setRoundEntries, setRoundReserves, updateAssessment, validateWorkspace, workspacePayload,
} from '@teamgym/domain';
import type { PlannedSpotInput, SpringDiscipline, Workspace } from '@teamgym/domain';
import { DK_V1 } from '../../packages/rules/src/dk-v1';
import { applyPotentialPreview } from '../../packages/rules/src/potential';
import { fromRows, workspaceBuilder } from '../fixtures/rule-workspace';
import { limits, syntheticWorkspace, tumblingSkill } from '../fixtures/synthetic-workspace';
import v1 from '../../examples/arbejdsrum-v1.json';
import v2 from '../../examples/arbejdsrum-v2.json';
import v3 from '../../examples/arbejdsrum-v3.json';
import scenarioExample from '../../examples/scenarier-og-reserver-v3.json';
import v4 from '../../examples/arbejdsrum-v4.json';

const series = { ...fromRows(['a3-b-01', 'a3-b-02', 'a3-b-03'], 'syntetisk-tre-elementer'), name: 'Syntetisk serie med tre elementer' };

function setup() {
  const fixture = syntheticWorkspace();
  const plan = fixture.workspace.plans[0]!;
  const tumbling = plan.tumbling[0]!;
  return { ...fixture, plan, tumbling, round: tumbling.rounds[1]! };
}
const scenarioOf = (workspace: Workspace, discipline: SpringDiscipline = 'tumbling', index = 0) => workspace.plans[0]![discipline][index]!;
const entriesOf = (workspace: Workspace, roundIndex = 1, discipline: SpringDiscipline = 'tumbling', scenarioIndex = 0) => scenarioOf(workspace, discipline, scenarioIndex).rounds[roundIndex]!.entries;
const spot = (fixture: ReturnType<typeof setup>, workspace: Workspace, entryIndex: number, input: PlannedSpotInput, discipline: SpringDiscipline = 'tumbling', roundIndex = 1) => {
  const scenario = scenarioOf(workspace, discipline);
  const round = scenario.rounds[roundIndex]!;
  return setPlannedSpot(workspace, fixture.planId, discipline, scenario.id, round.id, round.entries[entryIndex]!.id, input, fixture.environment);
};
function withSeries(fixture: ReturnType<typeof setup>, workspace: Workspace, entryIndex = 0) {
  const athleteId = entriesOf(workspace)[entryIndex]!.athleteId;
  const registered = registerAthleteSkill(workspace, athleteId, series, fixture.environment);
  const entries = entriesOf(registered.workspace).map((entry, index) => index === entryIndex ? { ...entry, athleteSkillId: registered.athleteSkillId } : entry);
  return { workspace: setRoundEntries(registered.workspace, fixture.planId, 'tumbling', fixture.tumbling.id, fixture.round.id, entries, limits, fixture.environment), registrationId: registered.athleteSkillId };
}
function rejects(mutate: (copy: Workspace) => void) {
  const fixture = setup();
  const copy = structuredClone(spot(fixture, fixture.workspace, 0, { grade: 'support' }));
  mutate(copy);
  expect(() => validateWorkspace(copy)).toThrow();
}

describe('format 4: gyldig planlagt modtagning', () => {
  it('afviser modtagning uden spring, ukendt eller anden disciplins spring og elementer uden for serien', () => {
    rejects((copy) => { entriesOf(copy)[0]!.athleteSkillId = null; });
    rejects((copy) => { entriesOf(copy)[0]!.plannedSpot!.skillId = 'ukendt-spring'; });
    rejects((copy) => { entriesOf(copy)[0]!.plannedSpot!.skillId = 'skill-trampet'; });
    rejects((copy) => { entriesOf(copy)[0]!.plannedSpot!.skillId = 'skill-rhythm'; });
    rejects((copy) => { Object.assign(entriesOf(copy)[0]!.plannedSpot!, { grade: 'heavy', elementIndex: 1 }); });
    rejects((copy) => { entriesOf(copy)[0]!.plannedSpot!.elementIndex = 0; });
    rejects((copy) => { entriesOf(copy)[0]!.plannedSpot!.grade = 'heavy'; });
    rejects((copy) => { Object.assign(entriesOf(copy)[0]!.plannedSpot!, { grade: 'unknown' }); });
  });

  it('afviser elementvalg på trampet og felt på reserver', () => {
    const fixture = setup();
    const trampet = spot(fixture, fixture.workspace, 0, { grade: 'heavy' }, 'trampet');
    expect(entriesOf(trampet, 1, 'trampet')[0]!.plannedSpot).toEqual({ grade: 'heavy', skillId: 'skill-trampet', elementIndex: null });
    const invalid = structuredClone(trampet);
    entriesOf(invalid, 1, 'trampet')[0]!.plannedSpot!.elementIndex = 0;
    expect(() => validateWorkspace(invalid)).toThrow();
    const reserve = { id: 'reserve-spot', athleteId: fixture.workspace.athletes[6]!.id, athleteSkillId: null };
    const withReserve = setRoundReserves(fixture.workspace, fixture.planId, 'tumbling', fixture.tumbling.id, fixture.round.id, [reserve], fixture.environment);
    const copy = structuredClone(withReserve);
    Object.assign(scenarioOf(copy).rounds[1]!.reserves[0]!, { plannedSpot: { grade: 'support', skillId: tumblingSkill.id, elementIndex: null } });
    expect(() => validateWorkspace(copy)).toThrow();
  });

  it('gemmer ikke modtagningen på registreringen og ændrer ikke sikkerheden', () => {
    const fixture = setup();
    const result = spot(fixture, fixture.workspace, 2, { grade: 'assist' });
    expect(result.athleteSkills).toEqual(fixture.workspace.athleteSkills);
    expect(result.athleteSkills.find((item) => item.id === entriesOf(result)[2]!.athleteSkillId)!.stability).toBe(5);
  });

  it('har et gyldigt format 4-eksempel', () => {
    const example = validateWorkspace(v4);
    expect(example.schemaVersion).toBe(4);
    expect(example.plans.flatMap((plan) => plan.tumbling.flatMap((scenario) => scenario.rounds.flatMap((round) => round.entries))).some((entry) => entry.plannedSpot?.grade === 'heavy')).toBe(true);
  });
});

describe('migration til format 4', () => {
  it('bevarer id-er, scenarier, reserver og vurderinger og giver alle pladser null', () => {
    const migrated = migrateWorkspaceV3(scenarioExample);
    expect(migrated.schemaVersion).toBe(4);
    expect(migrated.athleteSkills).toEqual(scenarioExample.athleteSkills);
    expect(migrated.plans.map((plan) => plan.id)).toEqual(scenarioExample.plans.map((plan) => plan.id));
    for (const discipline of ['tumbling', 'trampet'] as const) migrated.plans.forEach((plan, planIndex) => plan[discipline].forEach((scenario, scenarioIndex) => {
      const original = scenarioExample.plans[planIndex]![discipline][scenarioIndex]!;
      expect(scenario.id).toBe(original.id);
      scenario.rounds.forEach((round, roundIndex) => {
        expect(round.reserves).toEqual(original.rounds[roundIndex]!.reserves);
        expect(round.entries).toEqual(original.rounds[roundIndex]!.entries.map((entry) => ({ ...entry, plannedSpot: null })));
      });
    }));
  });

  it('er deterministisk og kæder format 1, 2 og 3', () => {
    const bytes = JSON.stringify(v3);
    expect(serializeWorkspace(migrateWorkspaceV3(JSON.parse(bytes)))).toBe(serializeWorkspace(migrateWorkspaceV3(JSON.parse(bytes))));
    for (const example of [v1, v2, v3, scenarioExample]) {
      const migrated = migrateWorkspace(structuredClone(example));
      expect(migrated.schemaVersion).toBe(4);
      expect(migrated.plans.flatMap((plan) => [...plan.tumbling, ...plan.trampet].flatMap((scenario) => scenario.rounds.flatMap((round) => round.entries))).every((entry) => entry.plannedSpot === null)).toBe(true);
    }
    expect(() => migrateWorkspace({ ...v4, schemaVersion: 5 })).toThrow();
  });
});

describe('kommandoer for planlagt modtagning', () => {
  it('tager springet fra registreringen og bruger sidste element som standard ved kraftig hjælp', () => {
    const fixture = setup();
    const { workspace, registrationId } = withSeries(fixture, fixture.workspace);
    const skillId = workspace.athleteSkills.find((item) => item.id === registrationId)!.skillId;
    expect(entriesOf(spot(fixture, workspace, 0, { grade: 'heavy' }))[0]!.plannedSpot).toEqual({ grade: 'heavy', skillId, elementIndex: 2 });
    expect(entriesOf(spot(fixture, workspace, 0, { grade: 'heavy', elementIndex: 1 }))[0]!.plannedSpot!.elementIndex).toBe(1);
    expect(entriesOf(spot(fixture, workspace, 0, { grade: 'support' }))[0]!.plannedSpot).toEqual({ grade: 'support', skillId, elementIndex: null });
    expect(() => spot(fixture, workspace, 0, { grade: 'support', elementIndex: 0 })).toThrow();
    expect(() => spot(fixture, workspace, 0, { grade: 'heavy', elementIndex: 3 })).toThrow();
    expect(() => spot(fixture, workspace, 0, { grade: 'heavy', elementIndex: 0 }, 'trampet')).toThrow();
  });

  it('afviser modtagning på en plads uden spring og kan fjerne en modtagning', () => {
    const fixture = setup();
    const entries = entriesOf(fixture.workspace).map((entry, index) => index === 0 ? { ...entry, athleteSkillId: null } : entry);
    const empty = setRoundEntries(fixture.workspace, fixture.planId, 'tumbling', fixture.tumbling.id, fixture.round.id, entries, limits, fixture.environment);
    expect(() => spot(fixture, empty, 0, { grade: 'support' })).toThrow('Vælg et spring');
    const spotted = spot(fixture, fixture.workspace, 1, { grade: 'assist' });
    const cleared = clearPlannedSpot(spotted, fixture.planId, 'tumbling', fixture.tumbling.id, fixture.round.id, entriesOf(spotted)[1]!.id, fixture.environment);
    expect(entriesOf(cleared)[1]!.plannedSpot).toBeNull();
  });

  it('nulstiller ved skift af gymnast eller spring og ignorerer modtagning i input', () => {
    const fixture = setup();
    const spotted = spot(fixture, fixture.workspace, 0, { grade: 'assist' });
    const entries = entriesOf(spotted);
    const otherAthlete = fixture.workspace.athletes[6]!;
    const otherRegistration = fixture.workspace.athleteSkills.find((item) => item.athleteId === otherAthlete.id && item.skillId === tumblingSkill.id)!;
    const swapped = setRoundEntries(spotted, fixture.planId, 'tumbling', fixture.tumbling.id, fixture.round.id,
      entries.map((entry, index) => index === 0 ? { ...entry, athleteId: otherAthlete.id, athleteSkillId: otherRegistration.id } : entry), limits, fixture.environment);
    expect(entriesOf(swapped)[0]!.plannedSpot).toBeNull();
    const { workspace: changedSkill } = withSeries(fixture, spotted);
    expect(entriesOf(changedSkill)[0]!.plannedSpot).toBeNull();
    const injected = setRoundEntries(fixture.workspace, fixture.planId, 'tumbling', fixture.tumbling.id, fixture.round.id,
      entriesOf(fixture.workspace).map((entry) => ({ ...entry, plannedSpot: { grade: 'support' as const, skillId: tumblingSkill.id, elementIndex: null } })), limits, fixture.environment);
    expect(entriesOf(injected).every((entry) => entry.plannedSpot === null)).toBe(true);
  });

  it('bevarer modtagningen ved ny rækkefølge, rolle, holdomgang, sikkerhed og note', () => {
    const fixture = setup();
    const spotted = spot(fixture, fixture.workspace, 0, { grade: 'assist' });
    const expected = entriesOf(spotted)[0]!.plannedSpot;
    const [first, ...rest] = entriesOf(spotted);
    const reordered = setRoundEntries(spotted, fixture.planId, 'tumbling', fixture.tumbling.id, fixture.round.id,
      [{ ...rest[0]!, role: 'extra' as const }, ...rest.slice(1), first!, { ...rest[0]!, id: 'ny-plads', role: 'counting' as const, athleteId: fixture.workspace.athletes[6]!.id,
        athleteSkillId: fixture.workspace.athleteSkills.find((item) => item.athleteId === fixture.workspace.athletes[6]!.id && item.skillId === tumblingSkill.id)!.id }], limits, fixture.environment);
    expect(entriesOf(reordered).find((entry) => entry.id === first!.id)!.plannedSpot).toEqual(expected);
    const roleChanged = setRoundEntries(spotted, fixture.planId, 'tumbling', fixture.tumbling.id, fixture.round.id,
      entriesOf(spotted).map((entry, index) => index === 0 ? { ...entry, role: 'extra' as const } : entry).concat([{ id: 'syvende', athleteId: fixture.workspace.athletes[6]!.id, role: 'counting', plannedSpot: null,
        athleteSkillId: fixture.workspace.athleteSkills.find((item) => item.athleteId === fixture.workspace.athletes[6]!.id && item.skillId === tumblingSkill.id)!.id }]).sort((a, b) => (a.role === 'extra' ? 0 : 1) - (b.role === 'extra' ? 0 : 1)), limits, fixture.environment);
    expect(entriesOf(roleChanged).find((entry) => entry.id === first!.id)!.plannedSpot).toEqual(expected);
    const moved = moveRoundFirst(spotted, fixture.planId, 'tumbling', fixture.tumbling.id, fixture.round.id, fixture.environment);
    expect(scenarioOf(moved).rounds.find((round) => round.id === fixture.round.id)!.entries[0]!.plannedSpot).toEqual(expected);
    const assessed = updateAssessment(spotted, first!.athleteSkillId!, { stability: 2, assessedAt: '2026-10-26', note: 'Syntetisk ny note' }, fixture.environment);
    expect(entriesOf(assessed)[0]!.plannedSpot).toEqual(expected);
  });

  it('nulstiller ved indsættelse af reserve', () => {
    const fixture = setup();
    const spotted = spot(fixture, fixture.workspace, 0, { grade: 'assist' });
    const athlete = fixture.workspace.athletes[6]!;
    const reserve = { id: 'reserve-spot', athleteId: athlete.id, athleteSkillId: fixture.workspace.athleteSkills.find((item) => item.athleteId === athlete.id && item.skillId === tumblingSkill.id)!.id };
    const withReserve = setRoundReserves(spotted, fixture.planId, 'tumbling', fixture.tumbling.id, fixture.round.id, [reserve], fixture.environment);
    const inserted = insertReserve(withReserve, fixture.planId, 'tumbling', fixture.tumbling.id, fixture.round.id, reserve.id, entriesOf(withReserve)[0]!.id, workspacePayload(withReserve), limits, fixture.environment);
    expect(entriesOf(inserted)[0]!.athleteId).toBe(athlete.id);
    expect(entriesOf(inserted)[0]!.plannedSpot).toBeNull();
  });

  it('fjerner modtagninger i alle planer og scenarier, når registreringens spring ændres', () => {
    const fixture = setup();
    let workspace = spot(fixture, fixture.workspace, 0, { grade: 'assist' });
    workspace = duplicateScenario(workspace, fixture.planId, 'tumbling', fixture.tumbling.id, 'Kopi', fixture.environment);
    const registrationId = entriesOf(workspace)[0]!.athleteSkillId!;
    expect(entriesOf(workspace, 1, 'tumbling', 1)[0]!.plannedSpot).not.toBeNull();
    const sameIdentity = replaceAthleteSkill(workspace, registrationId, { ...tumblingSkill, name: 'Nyt navn' }, fixture.environment);
    expect(entriesOf(sameIdentity)[0]!.plannedSpot).not.toBeNull();
    const changed = replaceAthleteSkill(workspace, registrationId, { ...series, id: 'ny-serie' }, fixture.environment);
    expect(entriesOf(changed)[0]!.plannedSpot).toBeNull();
    expect(entriesOf(changed, 1, 'tumbling', 1)[0]!.plannedSpot).toBeNull();
  });

  it('afleder nulstillet modtagning, når registreringen peger på et andet spring', () => {
    const fixture = setup();
    const workspace = spot(fixture, fixture.workspace, 0, { grade: 'assist' });
    const entry = entriesOf(workspace)[0]!;
    const registration = workspace.athleteSkills.find((item) => item.id === entry.athleteSkillId)!;
    expect(plannedSpotState(entry, registration)).toBe('active');
    expect(plannedSpotState(entry, { ...registration, skillId: 'andet-spring' })).toBe('reset');
    expect(plannedSpotState({ ...entry, plannedSpot: null }, registration)).toBe('none');
    expect(plannedSpotState(entry, undefined)).toBe('reset');
  });

  it('kopierer modtagninger til et duplikeret scenarie uden at dele dem', () => {
    const fixture = setup();
    const spotted = spot(fixture, fixture.workspace, 0, { grade: 'assist' });
    const duplicated = duplicateScenario(spotted, fixture.planId, 'tumbling', fixture.tumbling.id, 'Kopi', fixture.environment);
    expect(entriesOf(duplicated, 1, 'tumbling', 1)[0]!.plannedSpot).toEqual(entriesOf(duplicated)[0]!.plannedSpot);
    const copy = scenarioOf(duplicated, 'tumbling', 1);
    const cleared = clearPlannedSpot(duplicated, fixture.planId, 'tumbling', copy.id, copy.rounds[1]!.id, copy.rounds[1]!.entries[0]!.id, fixture.environment);
    expect(entriesOf(cleared)[0]!.plannedSpot).toEqual({ grade: 'assist', skillId: tumblingSkill.id, elementIndex: null });
    expect(entriesOf(cleared, 1, 'tumbling', 1)[0]!.plannedSpot).toBeNull();
  });

  it('anvendt potentialeforslag nulstiller kun pladser med ændret spring', async () => {
    const builder = workspaceBuilder(); const team = builder.team('Potentiale med modtagning');
    const basic = fromRows(['a3-b-01', 'a3-b-02', 'a3-b-06'], 'potential-basic');
    const twist = fromRows(['a3-b-01', 'a3-b-02', 'a3-b-11'], 'potential-twist');
    builder.fill(team.id, 'tumbling', 0, Array.from({ length: 6 }, () => basic));
    builder.fill(team.id, 'tumbling', 1, Array.from({ length: 6 }, (_, index) => index < 4 ? twist : basic));
    builder.fill(team.id, 'tumbling', 2, Array.from({ length: 6 }, () => basic));
    for (const athlete of builder.workspace.athletes.filter((item) => item.teamId === team.id).slice(0, 6)) builder.register(athlete.id, twist);
    const plan = builder.workspace.plans.find((item) => item.teamId === team.id)!;
    const scenario = plan.tumbling[0]!;
    for (const index of [0, 4]) builder.workspace = setPlannedSpot(builder.workspace, plan.id, 'tumbling', scenario.id, scenario.rounds[1]!.id, scenario.rounds[1]!.entries[index]!.id, { grade: 'assist' }, builder.environment);
    const kept = scenario.rounds[1]!.entries[0]!;
    const changed = scenario.rounds[1]!.entries[4]!;
    const result = (await DK_V1.potentials(builder.workspace, team.id, 'tumbling', scenario.id)).find((item) => item.id === 'B-SKRUE')!;
    expect(result.preview!.changes.find((change) => change.athleteId === changed.athleteId)!.plannedSpotRemoved).toBe(true);
    const applied = applyPotentialPreview(builder.workspace, result.preview!);
    const round = applied.plans.find((item) => item.teamId === team.id)!.tumbling[0]!.rounds[1]!;
    expect(round.entries.find((entry) => entry.athleteId === kept.athleteId)!.plannedSpot).not.toBeNull();
    expect(round.entries.find((entry) => entry.athleteId === changed.athleteId)!.plannedSpot).toBeNull();
  });
});
