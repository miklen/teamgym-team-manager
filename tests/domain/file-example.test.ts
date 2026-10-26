import { expect, it } from 'vitest';
import example from '../../examples/arbejdsrum-v1.json';
import exampleV2 from '../../examples/arbejdsrum-v2.json';
import { diagnoseWorkspace, parseWorkspace, serializeWorkspace, validateWorkspace, migrateWorkspaceV1, validateWorkspaceV1 } from '@teamgym/domain';

it('det dokumenterede JSON-eksempel er en gyldig syntetisk kladde med intakt binding', () => {
  validateWorkspaceV1(example);
  const workspace = validateWorkspace(migrateWorkspaceV1(example));
  expect(validateWorkspace(exampleV2)).toEqual(workspace);
  expect(parseWorkspace(serializeWorkspace(workspace))).toEqual(workspace);
  expect(diagnoseWorkspace(workspace)).toEqual([]);
  expect(workspace.athleteSkills[0]?.stability).toBeNull();
  expect(workspace.plans[0]?.tumbling).toHaveLength(3);
  expect(workspace.plans[0]?.trampet).toHaveLength(3);
});
