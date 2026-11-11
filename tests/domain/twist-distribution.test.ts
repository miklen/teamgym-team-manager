import { describe, expect, it } from 'vitest';
import {
  confirmConnection, migrateWorkspace, registerAthleteSkill, serializeWorkspace, setRoundEntries, skillIdentity,
  twistDistributionOptions, validateWorkspace,
} from '@teamgym/domain';
import type { ElementExecution, SkillDefinition, Workspace } from '@teamgym/domain';
import { limits, syntheticWorkspace } from '../fixtures/synthetic-workspace';

const double = (twistsHalfTurns: number, twistDistribution: number[]): ElementExecution => ({
  family: 'salto', direction: 'forward', rotationQuarterTurns: 8, bodyPositions: ['tuck', 'tuck'], twistsHalfTurns,
  twistDistribution, apparatus: 'trampet', takeoff: 'two-feet', landing: 'feet', variant: {},
});
const jump = (id: string, execution: ElementExecution): SkillDefinition =>
  ({ id, name: `Syntetisk ${id}`, archived: false, discipline: 'trampet', jump: execution });

/** Format 6-fil, hvor de angivne spring var gemt uden skruefordeling. */
function legacy(workspace: Workspace, skillIds: string[]) {
  const clear = (element: ElementExecution) => ({ ...element, twistDistribution: [] });
  return {
    ...structuredClone(workspace), schemaVersion: 6,
    skills: workspace.skills.map((skill): SkillDefinition => !skillIds.includes(skill.id) ? skill
      : skill.discipline === 'trampet' ? { ...skill, jump: clear(skill.jump) }
        : skill.discipline === 'tumbling' ? { ...skill, elements: skill.elements.map(clear) } : skill),
  };
}

describe('skruefordeling i format 7', () => {
  it('tilbyder alle fordelinger fra in til out', () => {
    expect(twistDistributionOptions(2, 1)).toEqual([[1, 0], [0, 1]]);
    expect(twistDistributionOptions(2, 3)).toEqual([[3, 0], [2, 1], [1, 2], [0, 3]]);
    expect(twistDistributionOptions(3, 1)).toEqual([[1, 0, 0], [0, 1, 0], [0, 0, 1]]);
  });

  it('afviser en flersalto med skrue uden fordeling, men ikke fra tre hele skruer', () => {
    const { workspace, athleteA, environment } = syntheticWorkspace();
    expect(() => registerAthleteSkill(workspace, athleteA.id, jump('uden', double(1, [])), environment)).toThrow(/Vælg hvor skruen sker/);
    expect(() => registerAthleteSkill(workspace, athleteA.id, jump('tre-hele', double(6, [])), environment)).not.toThrow();
    expect(() => registerAthleteSkill(workspace, athleteA.id, jump('out', double(1, [0, 1])), environment)).not.toThrow();
  });

  it('migrerer uafklarede spring til out og flytter identitetsreferencer med', () => {
    const fixture = syntheticWorkspace();
    let { workspace } = fixture;
    const series: SkillDefinition = { id: 'dobbelt-540', name: 'Syntetisk dobbelt 540', archived: false, discipline: 'tumbling',
      elements: [{ ...double(3, [1, 2]), apparatus: 'floor' }], connection: { kind: 'standard', transitions: [] }, sharedConnectionApproval: null };
    const added = registerAthleteSkill(workspace, fixture.athleteA.id, series, fixture.environment);
    workspace = confirmConnection(added.workspace, added.athleteSkillId, 'Syntetisk bekræftelse', fixture.environment);
    const old = legacy(workspace, ['dobbelt-540']);
    const oldIdentity = skillIdentity(old.skills.find((skill) => skill.id === 'dobbelt-540')!);
    old.athleteSkills = old.athleteSkills.map((item) => item.id === added.athleteSkillId
      ? { ...item, connectionConfirmation: { ...item.connectionConfirmation!, executionIdentity: oldIdentity } } : item);
    old.inheritanceExclusions = [{ athleteId: fixture.athleteB.id, targetIdentity: oldIdentity }];
    const original = JSON.stringify(old);
    const migrated = migrateWorkspace(old);
    const skill = migrated.skills.find((item) => item.id === 'dobbelt-540')!;
    expect(skill.discipline === 'tumbling' && skill.elements[0]!.twistDistribution).toEqual([0, 3]);
    expect(migrated.athleteSkills.find((item) => item.id === added.athleteSkillId)!.connectionConfirmation!.executionIdentity).toBe(skillIdentity(skill));
    expect(migrated.inheritanceExclusions).toEqual([{ athleteId: fixture.athleteB.id, targetIdentity: skillIdentity(skill) }]);
    expect(migrated.athleteSkills).toHaveLength(old.athleteSkills.length);
    expect(JSON.stringify(old)).toBe(original);
    expect(serializeWorkspace(migrateWorkspace(old))).toBe(serializeWorkspace(migrated));
  });

  it('samler et migreret spring med en eksisterende out-definition uden at miste plan eller vurdering', () => {
    const fixture = syntheticWorkspace();
    const { athleteA, athleteB, environment, planId } = fixture;
    let workspace = registerAthleteSkill(fixture.workspace, athleteA.id, jump('uafklaret', double(1, [1, 0])), environment).workspace;
    workspace = registerAthleteSkill(workspace, athleteB.id, jump('uafklaret', double(1, [1, 0])), environment).workspace;
    workspace = registerAthleteSkill(workspace, athleteB.id, jump('praecis-out', double(1, [0, 1])), environment).workspace;
    const registration = (athleteId: string, skillId: string) =>
      workspace.athleteSkills.find((item) => item.athleteId === athleteId && item.skillId === skillId)!;
    const plan = workspace.plans.find((item) => item.id === planId)!;
    const round = plan.trampet[0]!.rounds[0]!;
    workspace = setRoundEntries(workspace, planId, 'trampet', plan.trampet[0]!.id, round.id,
      [{ id: 'syntetisk-plads', athleteId: athleteB.id, athleteSkillId: registration(athleteB.id, 'uafklaret').id, role: 'counting' }], limits, environment);
    const old = legacy(workspace, ['uafklaret']);
    const migrated = migrateWorkspace(old);
    expect(migrated.skills.some((skill) => skill.id === 'uafklaret')).toBe(false);
    const athleteASkill = migrated.athleteSkills.find((item) => item.id === registration(athleteA.id, 'uafklaret').id)!;
    expect(athleteASkill.skillId).toBe('praecis-out');
    expect(migrated.athleteSkills.some((item) => item.id === registration(athleteB.id, 'uafklaret').id)).toBe(false);
    const entry = migrated.plans.find((item) => item.id === planId)!.trampet[0]!.rounds[0]!.entries[0]!;
    expect(entry.athleteSkillId).toBe(registration(athleteB.id, 'praecis-out').id);
    expect(validateWorkspace(migrated)).toEqual(migrated);
  });
});
