import { createWorkspace, createTeam, createAthlete, registerAthleteSkill, updateAssessment, setRoundEntries } from '@teamgym/domain';
import type { CommandEnvironment, ElementExecution, SkillDefinition } from '@teamgym/domain';

export const binding = { rulesetId: 'dk', packageVersion: '1.0.0', ageGroup: 'junior', teamType: 'girls' };
export const limits = { counting: 6, extra: 2 };

export const salto: ElementExecution = {
  family: 'salto', direction: 'backward', rotationQuarterTurns: 4, bodyPositions: ['straight'], twistsHalfTurns: 2,
  twistDistribution: [2], apparatus: 'floor', takeoff: 'two-feet', landing: 'feet', variant: {},
};
export const tumblingSkill: SkillDefinition = {
  id: 'skill-tumbling', name: 'Syntetisk baneserie', archived: false, discipline: 'tumbling',
  elements: [salto], connection: { kind: 'standard', transitions: [] },
};
export const trampetSkill: SkillDefinition = { id: 'skill-trampet', name: 'Syntetisk trampetspring', archived: false, discipline: 'trampet', jump: { ...salto, apparatus: 'trampet' } };
export const rhythmSkill: SkillDefinition = { id: 'skill-rhythm', name: 'Syntetisk hovedstand', archived: false, discipline: 'rhythm', momentId: 'rh-hb-headstand', variant: { legs: 'together' } };

export function syntheticWorkspace() {
  let counter = 0;
  const environment: CommandEnvironment = { id: () => `test-${++counter}`, now: () => '2026-10-25T12:00:00.000Z' };
  let workspace = createWorkspace(environment);
  workspace = createTeam(workspace, 'Syntetisk hold A', binding, environment);
  workspace = createTeam(workspace, 'Syntetisk hold B', { rulesetId: 'test-only', packageVersion: '2.0.0', ageGroup: 'test', teamType: 'test' }, environment);
  const teamA = workspace.teams[0]!;
  const teamB = workspace.teams[1]!;
  for (let index = 0; index < 8; index++) workspace = createAthlete(workspace, { name: index < 2 ? 'Maja Test' : `Syntetisk gymnast ${index + 1}`, discriminator: `Test ${index + 1}`, teamId: teamA.id }, environment);
  const athleteA = workspace.athletes[0]!;
  const athleteB = workspace.athletes[1]!;
  for (const athlete of workspace.athletes) for (const definition of [tumblingSkill, trampetSkill, rhythmSkill]) {
    const result = registerAthleteSkill(workspace, athlete.id, definition, environment);
    workspace = updateAssessment(result.workspace, result.athleteSkillId, { stability: athlete.id === athleteA.id ? 1 : 5, assessedAt: '2026-10-25', note: 'Kun syntetiske testdata.' }, environment);
  }
  const plan = workspace.plans[0]!;
  for (const discipline of ['tumbling', 'trampet'] as const) for (const round of plan[discipline]) {
    const entries = workspace.athletes.slice(0, 6).map((athlete) => ({ id: environment.id(), athleteId: athlete.id,
      athleteSkillId: workspace.athleteSkills.find((item) => item.athleteId === athlete.id && item.skillId === (discipline === 'tumbling' ? tumblingSkill.id : trampetSkill.id))!.id,
      role: 'counting' as const }));
    workspace = setRoundEntries(workspace, plan.id, discipline, round.id, entries, limits, environment);
  }
  return { workspace, environment, teamA, teamB, athleteA, athleteB, planId: plan.id };
}
