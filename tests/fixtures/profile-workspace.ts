import { createAthlete, createTeam, createWorkspace, registerAthleteSkill, setOwnAssessment } from '@teamgym/domain';
import type { ElementExecution, SkillDefinition, Stability, Workspace } from '@teamgym/domain';
import { binding } from './synthetic-workspace';

const salto: ElementExecution = {
  family: 'salto',
  direction: 'backward',
  rotationQuarterTurns: 4,
  bodyPositions: ['straight'],
  twistsHalfTurns: 0,
  twistDistribution: [],
  apparatus: 'floor',
  takeoff: 'two-feet',
  landing: 'feet',
  variant: {},
};
const rondat: ElementExecution = { ...salto, family: 'roundoff', takeoff: 'one-foot' };
const flic: ElementExecution = { ...salto, family: 'flic' };
const whip: ElementExecution = { ...salto, family: 'whipback' };
const twisted = (halfTurns: number): ElementExecution => ({ ...salto, twistsHalfTurns: halfTurns, twistDistribution: [halfTurns] });
const tumbling = (id: string, name: string, elements: ElementExecution[]): SkillDefinition => ({
  id,
  name,
  discipline: 'tumbling',
  archived: false,
  elements,
  connection: { kind: 'standard', transitions: elements.slice(1).map(() => 'direct' as const) },
  sharedConnectionApproval: null,
});

export const profileSprings = {
  flik: tumbling('synthetic-profile-flik', 'Rondat – flik', [rondat, flic]),
  layout: tumbling('synthetic-profile-layout', 'Rondat – flik – strakt salto', [rondat, flic, salto]),
  full: tumbling('synthetic-profile-full', 'Rondat – flik – strakt 1/1 (360°)', [rondat, flic, twisted(2)]),
  double: tumbling('synthetic-profile-double', 'Rondat – flik – strakt 2/1 (720°)', [rondat, flic, twisted(4)]),
  whipFull: tumbling('synthetic-profile-whip', 'Rondat – whipback – strakt 1/1 (360°)', [rondat, whip, twisted(2)]),
};

function give(workspace: Workspace, teamId: string, definition: SkillDefinition, stabilities: readonly Stability[]) {
  const athletes = workspace.athletes.filter((athlete) => athlete.teamId === teamId);
  let next = workspace;
  stabilities.forEach((stability, index) => {
    const added = registerAthleteSkill(next, athletes[index]!.id, definition);
    next = setOwnAssessment(added.workspace, added.athleteSkillId, { stability, assessedAt: '2026-11-11', note: '' });
  });
  return next;
}

/** Blandet hold A (8 gymnaster) og et lille hold B (6) med kun Bane; begge med N = 6. Kun syntetiske data. */
export function profileWorkspace() {
  let workspace = createTeam(createWorkspace(), 'Syntetisk profilhold A', binding);
  workspace = createTeam(workspace, 'Syntetisk profilhold B', binding);
  const [teamA, teamB] = workspace.teams;
  for (let index = 1; index <= 8; index++)
    workspace = createAthlete(workspace, { name: `Syntetisk profil ${index}`, teamId: teamA!.id });
  for (let index = 1; index <= 6; index++)
    workspace = createAthlete(workspace, { name: `Syntetisk B-gymnast ${index}`, teamId: teamB!.id });
  const five = (count: number) => Array.from({ length: count }, (): Stability => 5);
  const { flik, layout, full, double, whipFull } = profileSprings;
  workspace = give(workspace, teamA!.id, flik, five(8));
  workspace = give(workspace, teamA!.id, layout, five(8));
  workspace = give(workspace, teamA!.id, full, [...five(7), 2]);
  workspace = give(workspace, teamA!.id, double, five(5));
  workspace = give(workspace, teamA!.id, whipFull, [5, 5, 5, 5, 2, 1]);
  workspace = give(workspace, teamB!.id, flik, five(6));
  return workspace;
}
