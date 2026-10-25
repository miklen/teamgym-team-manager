import { expect, it } from 'vitest';
import example from '../../examples/arbejdsrum-v1.json';
import { diagnoseWorkspace, parseWorkspace, serializeWorkspace, validateWorkspace } from '@teamgym/domain';

it('det dokumenterede JSON-eksempel er en gyldig syntetisk kladde med intakt binding', () => {
  const workspace = validateWorkspace(example);
  expect(parseWorkspace(serializeWorkspace(workspace))).toEqual(example);
  expect(diagnoseWorkspace(workspace)).toEqual([]);
  expect(workspace.athleteSkills[0]?.stability).toBeNull();
  expect(workspace.plans[0]?.tumbling).toHaveLength(3);
  expect(workspace.plans[0]?.trampet).toHaveLength(3);
});
