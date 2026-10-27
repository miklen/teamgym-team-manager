import { expect, it } from 'vitest';
import { moveAthlete, replaceAthleteSkill, setRoundEntries } from '@teamgym/domain';
import { limits, syntheticWorkspace, tumblingSkill } from '../fixtures/synthetic-workspace';

it('ændret udførelse bevarer registrering/pladser, men kræver ny vurdering uden at ændre andre gymnaster', () => {
  const { workspace, athleteA } = syntheticWorkspace();
  const registration = workspace.athleteSkills.find(
    (item) => item.athleteId === athleteA.id && item.skillId === tumblingSkill.id,
  )!;
  if (tumblingSkill.discipline !== 'tumbling') throw Error('fixture');
  const changed = replaceAthleteSkill(workspace, registration.id, {
    ...tumblingSkill,
    id: 'changed-definition',
    elements: [{ ...tumblingSkill.elements[0]!, twistsHalfTurns: 4, twistDistribution: [4] }],
  });
  expect(changed.plans).toEqual(workspace.plans);
  expect(changed.athleteSkills.find((item) => item.id === registration.id)).toMatchObject({
    skillId: 'changed-definition',
    stability: null,
    assessedAt: null,
    connectionConfirmation: null,
  });
  expect(changed.athleteSkills.filter((item) => item.id !== registration.id)).toEqual(
    workspace.athleteSkills.filter((item) => item.id !== registration.id),
  );
});
it('to flyttede gymnaster kan fjernes en ad gangen, og kan ikke vælges på ny som nye pladser', () => {
  const fixture = syntheticWorkspace();
  let workspace = moveAthlete(fixture.workspace, fixture.athleteA.id, fixture.teamB.id);
  workspace = moveAthlete(workspace, fixture.athleteB.id, fixture.teamB.id);
  const plan = workspace.plans[0]!;
  const original = plan.tumbling[0]!.rounds[0].entries;
  workspace = setRoundEntries(workspace, plan.id, 'tumbling', plan.tumbling[0]!.id, plan.tumbling[0]!.rounds[0].id, original.slice(1), limits);
  expect(workspace.plans[0]!.tumbling[0]!.rounds[0].entries).toHaveLength(5);
  expect(() =>
    setRoundEntries(
      workspace,
      plan.id,
      'tumbling',
      plan.tumbling[0]!.id, plan.tumbling[0]!.rounds[0].id,
      [...workspace.plans[0]!.tumbling[0]!.rounds[0].entries, { ...original[0]!, id: 'new-invalid-entry' }],
      limits,
    ),
  ).toThrow('aktiv gymnast');
});
