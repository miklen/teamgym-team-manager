import { expect, it } from 'vitest';
import example from '../../examples/arbejdsrum-v1.json';
import exampleV3 from '../../examples/arbejdsrum-v3.json';
import exampleV2 from '../../examples/arbejdsrum-v2.json';
import exampleV4 from '../../examples/arbejdsrum-v4.json';
import { diagnoseWorkspace, parseWorkspace, serializeWorkspace, validateWorkspace, migrateWorkspaceV1, validateWorkspaceV1, validateWorkspaceV2, validateWorkspaceV3 } from '@teamgym/domain';

it('det dokumenterede JSON-eksempel er en gyldig syntetisk kladde med intakt binding', () => {
  validateWorkspaceV1(example);
  const workspace = validateWorkspace(migrateWorkspaceV1(example));
  validateWorkspaceV2(exampleV2);
  validateWorkspaceV3(exampleV3);
  validateWorkspace(exampleV4);
  expect(parseWorkspace(serializeWorkspace(workspace))).toEqual(workspace);
  expect(diagnoseWorkspace(workspace)).toEqual([]);
  expect(workspace.athleteSkills[0]?.stability).toBeNull();
  expect(workspace.plans[0]?.tumbling[0]!.rounds).toHaveLength(3);
  expect(workspace.plans[0]?.trampet[0]!.rounds).toHaveLength(3);
});
