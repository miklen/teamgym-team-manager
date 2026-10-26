import {
  createAthlete,
  createTeam,
  createWorkspace,
  registerAthleteSkill,
  setOwnAssessment,
} from '@teamgym/domain';
import type { ElementExecution, SkillDefinition } from '@teamgym/domain';
import { binding } from './synthetic-workspace';

const element: ElementExecution = {
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
const rondat: ElementExecution = { ...element, family: 'roundoff', takeoff: 'one-foot' };
const flik: ElementExecution = { ...element, family: 'flic' };
export const overviewFull: SkillDefinition = {
  id: 'synthetic-full',
  name: 'Rondat – flik – strakt 1/1 (360°)',
  discipline: 'tumbling',
  archived: false,
  elements: [rondat, flik, { ...element, twistsHalfTurns: 2, twistDistribution: [2] }],
  connection: { kind: 'standard', transitions: ['direct', 'direct'] },
};
export const overviewHard: SkillDefinition = {
  ...overviewFull,
  id: 'synthetic-hard',
  name: 'Rondat – flik – strakt 2/1 (720°)',
  elements: [rondat, flik, { ...element, twistsHalfTurns: 4, twistDistribution: [4] }],
};

/** Selvstændigt konstrueret repertoire; ingen data eller forventninger fra produktionsregler. */
export function overviewWorkspace(count: number) {
  let workspace = createTeam(createWorkspace(), 'Syntetisk elegance', binding);
  workspace = createAthlete(workspace, { name: 'Alma Eksempel', teamId: workspace.teams[0]!.id });
  const definitions: SkillDefinition[] = [];
  const floorCount = count === 120 ? 79 : count === 22 ? 13 : count;
  const trampetCount = count === 120 ? 40 : count === 22 ? 8 : 0;
  for (let index = 0; index < floorCount; index++) {
    const repetitions = Math.floor(index / 5) + 1;
    const twists = index % 5;
    const elements = [
      rondat,
      ...Array.from({ length: repetitions }, () => flik),
      { ...element, twistsHalfTurns: twists, twistDistribution: twists ? [twists] : [] },
    ];
    definitions.push({
      id: `synthetic-floor-${index}`,
      name: `Rondat – ${repetitions > 1 ? `${repetitions} × ` : ''}flik – strakt ${twists * 180}°`,
      discipline: 'tumbling',
      archived: false,
      elements,
      connection: { kind: 'standard', transitions: elements.slice(1).map(() => 'direct') },
    });
  }
  for (let index = 0; index < trampetCount; index++) {
    const position = (['tuck', 'pike', 'straight'] as const)[index % 3]!;
    const twists = Math.floor(index / 3) % 7;
    const double = index >= 21;
    const jump: ElementExecution = {
      ...element,
      direction: 'forward',
      apparatus: 'trampet',
      rotationQuarterTurns: double ? 8 : 4,
      bodyPositions: double ? [position, position] : [position],
      twistsHalfTurns: twists,
      twistDistribution: double ? [twists, 0] : twists ? [twists] : [],
    };
    definitions.push({
      id: `synthetic-trampet-${index}`,
      name: `${double ? 'Dobbelt ' : ''}${{ tuck: 'Lukket', pike: 'Hoftebøjet', straight: 'Strakt' }[position]} salto ${twists * 180}°`,
      discipline: 'trampet',
      archived: false,
      jump,
    });
  }
  if (count > 1)
    definitions.push({
      id: 'synthetic-rhythm',
      name: 'Hovedstand',
      discipline: 'rhythm',
      archived: false,
      momentId: 'rh-hb-headstand',
      variant: { legs: 'together' },
    });
  for (const [index, definition] of definitions.entries()) {
    const added = registerAthleteSkill(workspace, workspace.athletes[0]!.id, {
      ...definition,
      name: index === definitions.length - 1 ? 'Syntetisk søgevariant' : definition.name,
    });
    workspace = setOwnAssessment(added.workspace, added.athleteSkillId, {
      stability: ((index % 5) + 1) as 1 | 2 | 3 | 4 | 5,
      assessedAt: '2026-10-26',
      note: '',
    });
  }
  return workspace;
}
