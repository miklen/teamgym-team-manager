import { createWorkspace, createTeam, createAthlete, registerAthleteSkill, setRoundEntries, updateAssessment } from '@teamgym/domain';
import type { CommandEnvironment, RulesetBinding, SkillDefinition, Workspace } from '@teamgym/domain';
import { DK_SPRING_CATALOG } from '../../packages/rules/src/catalog';

// Historiske versionsprøver bruger fortsat 1.0.0 som syntetisk udgangspunkt.
const LEGACY_TEST_BINDING: RulesetBinding = { rulesetId: 'dk', packageVersion: '1.0.0', ageGroup: 'junior', teamType: 'girls' };

export function fromRows(ids: string[], id: string): Exclude<SkillDefinition, { discipline: 'rhythm' }> {
  return { id, name: `Syntetisk ${id}`, archived: false, discipline: 'tumbling', elements: ids.map((sourceId) => structuredClone(DK_SPRING_CATALOG.find((item) => item.referenceId === sourceId)!.execution)),
    connection: { kind: 'standard', transitions: ids.slice(1).map(() => 'direct') } };
}

export function workspaceBuilder() {
  let next = 0;
  const environment: CommandEnvironment = { id: () => `builder-${++next}`, now: () => '2026-10-25T12:00:00Z' };
  let workspace = createWorkspace(environment);
  function team(name: string, binding: RulesetBinding = LEGACY_TEST_BINDING, athleteCount = 8) {
    workspace = createTeam(workspace, name, binding, environment);
    const created = workspace.teams.at(-1)!;
    for (let index = 0; index < athleteCount; index++) workspace = createAthlete(workspace, { name: `${name} Testgymnast ${index + 1}`, teamId: created.id }, environment);
    return created;
  }
  function register(athleteId: string, definition: SkillDefinition, stability: 1 | 2 | 3 | 4 | 5 | null = 5) {
    const result = registerAthleteSkill(workspace, athleteId, definition, environment);
    workspace = updateAssessment(result.workspace, result.athleteSkillId, { stability, assessedAt: stability === null ? null : '2026-10-25', note: 'Syntetisk regelfixture' }, environment);
    return result.athleteSkillId;
  }
  function fill(teamId: string, discipline: 'tumbling' | 'trampet', roundIndex: number, definitions: SkillDefinition[], counting = 6) {
    const athletes = workspace.athletes.filter((athlete) => athlete.teamId === teamId);
    const entries = definitions.map((definition, index) => ({ id: environment.id(), athleteId: athletes[index]!.id, athleteSkillId: register(athletes[index]!.id, definition), role: 'counting' as const }));
    const plan = workspace.plans.find((item) => item.teamId === teamId)!;
    workspace = setRoundEntries(workspace, plan.id, discipline, plan[discipline][0]!.id, plan[discipline][0]!.rounds[roundIndex]!.id, entries, { counting, extra: 2 }, environment);
  }
  return { get workspace() { return workspace; }, set workspace(value: Workspace) { workspace = value; }, environment, team, register, fill };
}
