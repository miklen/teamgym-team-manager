import { expect, it } from 'vitest';
import { createWorkspace } from '@teamgym/domain';
import { DK_V1, DK_V2 } from '@teamgym/rules';
import { springLibrary } from '../../apps/web/src/spring-library';
import { repeatedStartSaltoIssue } from '../../apps/web/src/start-salto-uncertainty';

it('viser kun startmarkeringens identitetstvivl, når samme forlæns salto gentages', () => {
  const ordinary = springLibrary(DK_V1, createWorkspace())
    .find((choice) => choice.definition.name === 'Strakt salto – rondat – flik')!.definition;
  if (ordinary.discipline !== 'tumbling') throw Error('Syntetisk banevalg mangler');
  expect(repeatedStartSaltoIssue(ordinary, DK_V1.evaluateSkill(ordinary))).toBe(false);

  const repeated = {
    ...ordinary,
    elements: [...ordinary.elements, structuredClone(ordinary.elements[0]!)],
    connection: { kind: 'custom' as const, transitions: [...ordinary.connection.transitions, 'direct'] },
  };
  expect(repeatedStartSaltoIssue(repeated, DK_V1.evaluateSkill(repeated))).toBe(true);
  expect(repeatedStartSaltoIssue(repeated, DK_V2.evaluateSkill(repeated))).toBe(false);

  const different = {
    ...repeated,
    elements: [...ordinary.elements, { ...ordinary.elements[0]!, twistsHalfTurns: 2, twistDistribution: [2] }],
  };
  expect(repeatedStartSaltoIssue(different, DK_V1.evaluateSkill(different))).toBe(false);
});
