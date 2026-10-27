import { createScenario, duplicateScenario, setRoundReserves, createAthlete } from '@teamgym/domain';
import { syntheticWorkspace } from './synthetic-workspace';

export function scenarioWorkspace(count = 2) {
  const fixture = syntheticWorkspace();
  let workspace = fixture.workspace;
  const plan = workspace.plans[0]!;
  const scenario = plan.tumbling[0]!;
  const reserves = [6, 7].map((index) => ({
    id: `synthetic-reserve-${index}`,
    athleteId: workspace.athletes[index]!.id,
    athleteSkillId:
      index === 7
        ? null
        : workspace.athleteSkills.find(
            (item) => item.athleteId === workspace.athletes[index]!.id && item.skillId === 'skill-tumbling',
          )!.id,
  }));
  workspace = setRoundReserves(
    workspace,
    plan.id,
    'tumbling',
    scenario.id,
    scenario.rounds[0].id,
    reserves,
    fixture.environment,
  );
  for (let index = 1; index < count; index++)
    workspace = duplicateScenario(
      workspace,
      plan.id,
      'tumbling',
      workspace.plans[0]!.tumbling.at(-1)!.id,
      index === 1 ? 'Plan B' : `${index + 1}. Alternativ ${'Langt navn '.repeat(20)}`.slice(0, 200),
      fixture.environment,
    );
  workspace = createScenario(
    workspace,
    plan.id,
    'trampet',
    plan.trampet[0]!.id,
    'Sikker',
    fixture.environment,
  );
  workspace = createAthlete(
    workspace,
    { name: 'Syntetisk reserve', discriminator: 'Test 9', teamId: plan.teamId },
    fixture.environment,
  );
  return workspace;
}
