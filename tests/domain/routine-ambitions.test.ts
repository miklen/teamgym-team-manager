import { describe, expect, it } from 'vitest';
import {
  addAmbition, addAmbitions, changeAmbitionSkill, duplicateScenario, fillAmbition, insertReserve, migrateWorkspace, moveRoundFirst, registerAthleteSkill,
  roundStability, serializeWorkspace, setArchived, setPlannedSpot, setRoundEntries, setRoundReserves, validateWorkspace, workspacePayload,
} from '@teamgym/domain';
import type { SkillDefinition, Workspace } from '@teamgym/domain';
import v1 from '../../examples/arbejdsrum-v1.json';
import v2 from '../../examples/arbejdsrum-v2.json';
import v3 from '../../examples/arbejdsrum-v3.json';
import v4 from '../../examples/arbejdsrum-v4.json';
import { limits, salto, syntheticWorkspace, trampetSkill } from '../fixtures/synthetic-workspace';

const newJump: Extract<SkillDefinition, { discipline: 'trampet' }> = { id: 'skill-ny-ambition', name: 'Syntetisk ambitionsspring', archived: false, discipline: 'trampet', jump: { ...salto, apparatus: 'trampet', twistsHalfTurns: 4, twistDistribution: [4] } };

function setup() {
  const base = syntheticWorkspace();
  const plan = base.workspace.plans[0]!;
  const scenario = plan.trampet[0]!;
  const round = scenario.rounds[1]!;
  const at = (workspace: Workspace) => workspace.plans[0]!.trampet[0]!.rounds[1]!;
  // Ryd én tællende plads, så der er plads til en ambition.
  const workspace = setRoundEntries(base.workspace, plan.id, 'trampet', scenario.id, round.id, round.entries.slice(0, 5), limits, base.environment);
  const add = (current: Workspace, definition: SkillDefinition = trampetSkill, role: 'counting' | 'extra' = 'counting', position = 5) =>
    addAmbition(current, plan.id, 'trampet', scenario.id, round.id, definition, role, position, limits, base.environment);
  const fill = (current: Workspace, entryId: string, registrationId: string) => fillAmbition(current, plan.id, 'trampet', scenario.id, round.id, entryId, registrationId, base.environment);
  const registrationOf = (current: Workspace, athleteIndex: number, skillId = trampetSkill.id) =>
    current.athleteSkills.find((item) => item.athleteId === current.athletes[athleteIndex]!.id && item.skillId === skillId)!.id;
  return { ...base, workspace, plan, scenario, round, at, add, fill, registrationOf };
}

describe('ambitioner i arbejdsrummet', () => {
  it('opretter 2 + 2 + 2 og 3 + 3 som atomiske blokke med selvstændige plads-id’er', () => {
    const s = setup();
    const empty = setRoundEntries(s.workspace, s.plan.id, 'trampet', s.scenario.id, s.round.id, [], limits, s.environment);
    const second: SkillDefinition = { ...newJump, id: 'syntetisk-anden', jump: { ...newJump.jump, twistsHalfTurns: 6, twistDistribution: [6] } };
    const third: SkillDefinition = { ...newJump, id: 'syntetisk-tredje', jump: { ...newJump.jump, twistsHalfTurns: 8, twistDistribution: [8] } };
    for (const counts of [[2, 2, 2], [3, 3]]) {
      let current = empty;
      const definitions = [newJump, second, third];
      const blocks: string[][] = [];
      for (const [index, count] of counts.entries()) {
        const result = addAmbitions(current, s.plan.id, 'trampet', s.scenario.id, s.round.id, definitions[index]!, 'counting', count!, s.at(current).entries.length, limits, null, s.environment);
        current = result.workspace;
        blocks.push(result.entryIds);
      }
      const entries = s.at(current).entries;
      expect(entries.map((item) => item.id)).toEqual(blocks.flat());
      expect(new Set(entries.map((item) => item.id)).size).toBe(6);
      expect(entries.map((item) => item.plannedSkillId)).toEqual(counts.flatMap((count, index) => Array(count).fill(definitions[index]!.id)));
      expect(entries.every((item) => item.athleteId === null && item.athleteSkillId === null && item.plannedSpot === null)).toBe(true);
      expect(current.plans[0]!.tumbling).toEqual(empty.plans[0]!.tumbling);
    }
    const before = serializeWorkspace(empty);
    expect(() => addAmbitions(empty, s.plan.id, 'trampet', s.scenario.id, s.round.id, newJump, 'counting', 7, 0, limits, null, s.environment)).toThrow();
    expect(serializeWorkspace(empty)).toBe(before);
    expect(empty.skills.find((item) => item.id === newJump.id)).toBeUndefined();
    const beforeExisting = s.at(s.workspace).entries.map((item) => item.id);
    const withOne = addAmbitions(s.workspace, s.plan.id, 'trampet', s.scenario.id, s.round.id, newJump, 'counting', 1, beforeExisting.length, limits, null, s.environment).workspace;
    expect(s.at(withOne).entries.slice(0, beforeExisting.length).map((item) => item.id)).toEqual(beforeExisting);
    expect(() => addAmbitions(s.workspace, s.plan.id, 'trampet', s.scenario.id, s.round.id, newJump, 'counting', 2, beforeExisting.length, limits, null, s.environment)).toThrow();
    const extras = addAmbitions(s.workspace, s.plan.id, 'trampet', s.scenario.id, s.round.id, newJump, 'extra', 2, 0, limits, null, s.environment).workspace;
    expect(s.at(extras).entries.map((item) => item.role)).toEqual(['extra', 'extra', ...Array(5).fill('counting')]);
  });
  it('validering afviser ambitioner med registrering, modtagning, ukendt eller forkert spring og reserver uden gymnast', () => {
    const s = setup();
    const { workspace, entryId } = s.add(s.workspace);
    type Loose = Record<string, unknown>;
    const roundOf = (copy: Workspace) => copy.plans[0]!.trampet[0]!.rounds[1]! as unknown as { entries: Loose[]; reserves: Loose[] };
    const mutate = (change: (copy: Workspace) => void) => {
      const copy = structuredClone(workspace);
      change(copy);
      return () => validateWorkspace(copy);
    };
    const ambition = (copy: Workspace) => roundOf(copy).entries.find((item) => item.id === entryId)!;
    expect(() => validateWorkspace(structuredClone(workspace))).not.toThrow();
    expect(mutate((copy) => { ambition(copy).athleteSkillId = s.registrationOf(workspace, 6); })).toThrow();
    expect(mutate((copy) => { ambition(copy).plannedSpot = { grade: 'heavy', elementIndex: null }; })).toThrow();
    expect(mutate((copy) => { ambition(copy).plannedSkillId = 'ukendt-spring'; })).toThrow();
    expect(mutate((copy) => { ambition(copy).plannedSkillId = 'skill-tumbling'; })).toThrow();
    expect(mutate((copy) => { ambition(copy).plannedSkillId = null; })).toThrow();
    expect(mutate((copy) => { roundOf(copy).reserves.push({ id: 'reserve-uden', athleteId: null, athleteSkillId: null }); })).toThrow();
  });

  it('migrering af format 1-4 bevarer id\'er og tilføjer plannedSkillId: null; format 7 afvises', () => {
    for (const example of [v1, v2, v3, v4]) {
      const migrated = migrateWorkspace(structuredClone(example));
      expect(migrated.schemaVersion).toBe(7);
      const entries = migrated.plans.flatMap((plan) => [...plan.tumbling, ...plan.trampet].flatMap((scenario) => scenario.rounds.flatMap((round) => round.entries)));
      expect(entries.every((entry) => entry.plannedSkillId === null && entry.athleteId !== null)).toBe(true);
      expect(migrated.athletes.map((item) => item.id)).toEqual((example as { athletes: { id: string }[] }).athletes.map((item) => item.id));
    }
    expect(() => migrateWorkspace({ ...v4, schemaVersion: 7 })).toThrow();
  });

  it('addAmbition genbruger en definition med samme identitet, opretter ellers én og overholder grænserne', () => {
    const s = setup();
    const skills = s.workspace.skills.length;
    const reused = s.add(s.workspace, { ...trampetSkill, id: 'kopi-fra-katalog', name: 'Andet navn' });
    const entry = s.at(reused.workspace).entries.find((item) => item.id === reused.entryId)!;
    expect(entry).toMatchObject({ athleteId: null, athleteSkillId: null, plannedSpot: null, plannedSkillId: trampetSkill.id, role: 'counting' });
    expect(reused.workspace.skills).toHaveLength(skills);
    const created = s.add(s.workspace, newJump);
    expect(created.workspace.skills.map((item) => item.id)).toContain(newJump.id);
    expect(() => s.add(reused.workspace)).toThrow();
    const extra = s.add(reused.workspace, trampetSkill, 'extra', 0);
    expect(s.at(extra.workspace).entries[0]).toMatchObject({ id: extra.entryId, role: 'extra' });
  });

  it('afviser et spring, hvis den præcise definition er arkiveret', () => {
    const s = setup();
    const archived = setArchived(s.workspace, 'skills', trampetSkill.id, true, s.environment);
    expect(() => s.add(archived)).toThrow(/fjernet fra kartoteket/);
  });

  it('changeAmbitionSkill skifter spring og rolle, men aldrig på en besat plads', () => {
    const s = setup();
    const { workspace, entryId } = s.add(s.workspace);
    const changed = changeAmbitionSkill(workspace, s.plan.id, 'trampet', s.scenario.id, s.round.id, entryId, newJump, undefined, limits, s.environment);
    expect(s.at(changed).entries.find((item) => item.id === entryId)!.plannedSkillId).toBe(newJump.id);
    const filledId = s.at(workspace).entries[0]!.id;
    expect(() => changeAmbitionSkill(workspace, s.plan.id, 'trampet', s.scenario.id, s.round.id, filledId, newJump, undefined, limits, s.environment)).toThrow(/besat/);
  });

  it('fillAmbition bevarer id, rolle og position og fjerner det planlagte spring', () => {
    const s = setup();
    const { workspace, entryId } = s.add(s.workspace, trampetSkill, 'counting', 2);
    const filled = s.fill(workspace, entryId, s.registrationOf(workspace, 6));
    const entries = s.at(filled).entries;
    expect(entries[2]).toEqual({ id: entryId, athleteId: filled.athletes[6]!.id, athleteSkillId: s.registrationOf(workspace, 6), role: 'counting', plannedSpot: null, plannedSkillId: null });
    expect(() => s.fill(filled, entryId, s.registrationOf(workspace, 7))).toThrow(/besat/);
  });

  it('fillAmbition afviser forkert spring, gymnast i omgangen eller reserverne og arkiveret gymnast', () => {
    const s = setup();
    const { workspace, entryId } = s.add(s.workspace);
    const other = registerAthleteSkill(workspace, workspace.athletes[6]!.id, newJump, s.environment);
    expect(() => s.fill(other.workspace, entryId, other.athleteSkillId)).toThrow(/ikke ambitionens spring/);
    expect(() => s.fill(workspace, entryId, s.registrationOf(workspace, 0))).toThrow(/allerede med/);
    const withReserve = setRoundReserves(workspace, s.plan.id, 'trampet', s.scenario.id, s.round.id, [{ id: 'reserve-1', athleteId: workspace.athletes[6]!.id, athleteSkillId: s.registrationOf(workspace, 6) }], s.environment);
    expect(() => s.fill(withReserve, entryId, s.registrationOf(workspace, 6))).toThrow(/allerede med/);
    const archived = setArchived(workspace, 'athletes', workspace.athletes[7]!.id, true, s.environment);
    expect(() => s.fill(archived, entryId, s.registrationOf(workspace, 7))).toThrow();
  });

  it('setRoundEntries kan ikke omdanne en plads mellem ambition og besat', () => {
    const s = setup();
    const { workspace, entryId } = s.add(s.workspace);
    const entries = s.at(workspace).entries;
    const set = (next: typeof entries) => () => setRoundEntries(workspace, s.plan.id, 'trampet', s.scenario.id, s.round.id, next, limits, s.environment);
    expect(set(entries.map((entry) => entry.id === entryId ? { ...entry, athleteId: workspace.athletes[6]!.id, athleteSkillId: s.registrationOf(workspace, 6), plannedSkillId: null } : entry))).toThrow();
    expect(set(entries.map((entry, index) => index === 0 ? { ...entry, athleteId: null, athleteSkillId: null, plannedSkillId: trampetSkill.id } : entry))).toThrow();
    expect(set([entries[5]!, ...entries.slice(0, 5)])).not.toThrow();
  });

  it('modtagning og reserveindsættelse afviser ambitioner', () => {
    const s = setup();
    const { workspace, entryId } = s.add(s.workspace);
    expect(() => setPlannedSpot(workspace, s.plan.id, 'trampet', s.scenario.id, s.round.id, entryId, { grade: 'heavy' }, s.environment)).toThrow();
    const withReserve = setRoundReserves(workspace, s.plan.id, 'trampet', s.scenario.id, s.round.id, [{ id: 'reserve-1', athleteId: workspace.athletes[6]!.id, athleteSkillId: s.registrationOf(workspace, 6) }], s.environment);
    expect(() => insertReserve(withReserve, s.plan.id, 'trampet', s.scenario.id, s.round.id, 'reserve-1', entryId, workspacePayload(withReserve), limits, s.environment)).toThrow();
  });

  it('kopiering af scenarie og flytning af omgang bevarer ambitioner', () => {
    const s = setup();
    const { workspace, entryId } = s.add(s.workspace);
    const copied = duplicateScenario(workspace, s.plan.id, 'trampet', s.scenario.id, 'Kopi', s.environment);
    const copy = copied.plans[0]!.trampet.at(-1)!;
    expect(copy.rounds[1]!.entries.filter((entry) => entry.athleteId === null)).toEqual([expect.objectContaining({ plannedSkillId: trampetSkill.id })]);
    expect(copy.rounds[1]!.entries.some((entry) => entry.id === entryId)).toBe(false);
    const moved = moveRoundFirst(workspace, s.plan.id, 'trampet', s.scenario.id, s.round.id, s.environment);
    expect(moved.plans[0]!.trampet[0]!.rounds[0]!.entries.find((entry) => entry.id === entryId)).toMatchObject({ athleteId: null, plannedSkillId: trampetSkill.id });
    expect(serializeWorkspace(validateWorkspace(JSON.parse(serializeWorkspace(moved))))).toBe(serializeWorkspace(moved));
  });

  it('sikkerheden tæller ambitionen som ubesat', () => {
    const s = setup();
    const { workspace } = s.add(s.workspace);
    const stability = roundStability(workspace, s.at(workspace).entries, limits, s.workspace.teams[0]!.id).counting;
    expect(stability).toMatchObject({ requiredCount: 6, filledCount: 5, complete: false });
  });
});
