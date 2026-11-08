import { describe, expect, it } from 'vitest';
import {
  approveSharedConnection, clearSharedConnectionApproval, confirmConnection, migrateWorkspace,
  parseWorkspace, registerAthleteSkill, serializeWorkspace, skillIdentity, validateWorkspace,
} from '@teamgym/domain';
import { salto, syntheticWorkspace, tumblingSkill } from '../fixtures/synthetic-workspace';
import type { SkillDefinition } from '@teamgym/domain';

describe('fælles forbindelsesgodkendelse', () => {
  it('migrerer format 5 deterministisk uden at opgradere gymnastens personlige bekræftelse', () => {
    const fixture = syntheticWorkspace();
    const registration = fixture.workspace.athleteSkills.find((item) => item.skillId === tumblingSkill.id)!;
    const withPersonal = confirmConnection(fixture.workspace, registration.id, 'Personlig prøve', fixture.environment);
    const legacy = {
      ...structuredClone(withPersonal), schemaVersion: 5,
      skills: withPersonal.skills.map((skill) => {
        if (skill.discipline !== 'tumbling') return skill;
        const { sharedConnectionApproval: _approval, ...old } = skill;
        void _approval;
        return old;
      }),
    };
    const migrated = migrateWorkspace(legacy);
    expect(migrated.schemaVersion).toBe(6);
    expect(migrated.skills.filter((skill) => skill.discipline === 'tumbling').every((skill) => skill.sharedConnectionApproval === null)).toBe(true);
    expect(migrated.athleteSkills).toEqual(withPersonal.athleteSkills);
    expect(migrated.skills.map((skill) => skill.id)).toEqual(withPersonal.skills.map((skill) => skill.id));
    expect(serializeWorkspace(migrated)).toBe(serializeWorkspace(migrateWorkspace(legacy)));
    expect(parseWorkspace(serializeWorkspace(migrated))).toEqual(migrated);
  });

  it('godkender kun den præcise kæde og bevarer beslutningen ved identitetsgenbrug', () => {
    const fixture = syntheticWorkspace();
    const base = fixture.workspace;
    const two: Extract<SkillDefinition, { discipline: 'tumbling' }> = {
      ...tumblingSkill, id: 'syntetisk-to-led',
      elements: [salto, salto], connection: { kind: 'custom' as const, transitions: ['direct'] },
    };
    const added = registerAthleteSkill(base, fixture.athleteA.id, two, fixture.environment);
    const original = added.workspace.skills.find((skill) => skill.id === two.id)!;
    const approved = approveSharedConnection(added.workspace, two.id, 'Afprøvet af holdets trænere', fixture.environment);
    const decision = approved.skills.find((skill) => skill.id === two.id)!;
    expect(decision.discipline === 'tumbling' && decision.sharedConnectionApproval).toMatchObject({ executionIdentity: skillIdentity(original), note: 'Afprøvet af holdets trænere' });
    const reused = registerAthleteSkill(approved, fixture.athleteB.id, { ...two, id: 'andet-id', sharedConnectionApproval: null }, fixture.environment);
    expect(reused.workspace.skills).toHaveLength(approved.skills.length);
    expect(reused.workspace.skills.find((skill) => skill.id === two.id)).toEqual(decision);
    const changed = structuredClone(approved);
    const edited = changed.skills.find((skill) => skill.id === two.id)!;
    if (edited.discipline !== 'tumbling') throw new Error('Forkert testdata');
    edited.elements[1] = { ...salto, bodyPositions: ['pike'] };
    expect(() => validateWorkspace(changed)).toThrow(/godkendelse/);
    const cleared = clearSharedConnectionApproval(approved, two.id, fixture.environment);
    expect(cleared.skills.find((skill) => skill.id === two.id)).toMatchObject({ sharedConnectionApproval: null });
    expect(approved.skills.find((skill) => skill.id === two.id)).toEqual(decision);
  });
});
