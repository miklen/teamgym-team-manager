import { describe, expect, it } from 'vitest';
import {
  createWorkspace,
  parseWorkspace,
  serializeWorkspace,
  setArchived,
  updateAssessment,
} from '@teamgym/domain';
import { DK_V1 } from '@teamgym/rules';
import {
  matchesSpring,
  registerSpring,
  shorterSeries,
  springLibrary,
} from '../../apps/web/src/spring-library';
import type { SpringDefinition } from '../../apps/web/src/spring-library';
import { syntheticWorkspace } from '../fixtures/synthetic-workspace';

function choice(query: string) {
  const found = springLibrary(DK_V1, createWorkspace()).find((item) => item.definition.name === query);
  if (!found) throw new Error(`Testens spring mangler: ${query}`);
  return found;
}
const fullName = 'Rondat – flik – strakt 1/1 (360°)';

describe('springbibliotek', () => {
  it('dækker de konkrete juniorfamilier med præcise udførelser og håndregnede D-værdier', () => {
    for (const [name, difficulty, count] of [
      [fullName, '4/5', 3],
      ['Rondat – flik – flik – strakt 1/1 (360°)', '4/5', 4],
      ['Rondat – flik – strakt 2/1 (720°)', '1', 3],
      ['Kraftspring – barani (strakt 180°)', '3/5', 2],
      ['Kraftspring – rudy (strakt 540°)', '4/5', 2],
      ['Strakt – kraftspring – barani (strakt 180°)', '9/10', 3],
      ['Strakt – kraftspring – rudy (strakt 540°)', '11/10', 3],
    ] as const) {
      const skill = choice(name).definition;
      expect(skill.discipline).toBe('tumbling');
      if (skill.discipline !== 'tumbling') throw Error('disciplin');
      expect(skill.elements).toHaveLength(count);
      expect(DK_V1.evaluateSkill(skill).difficulty.value?.toString()).toBe(difficulty);
    }
    expect(DK_V1.evaluateSkill(choice(fullName).definition).connection).toBe('verified');
    expect(matchesSpring(choice(fullName), 'rondat-flik-1/1')).toBe(true);
    expect(matchesSpring(choice('Kraftspring – rudy (strakt 540°)'), 'kraft rudy')).toBe(true);
  });

  it('registrerer kun præcise begyndelser og kopierer ingen vurdering eller lavere skruer', () => {
    const fixture = syntheticWorkspace();
    const full = choice(fullName).definition;
    const shorter = shorterSeries(full, DK_V1);
    expect(shorter.map((item) => item.name)).toEqual(['Rondat', 'Rondat – Flik-flak']);
    const result = registerSpring(fixture.workspace, fixture.athleteA.id, full, DK_V1, true, null);
    const added = result.workspace.athleteSkills.filter(
      (item) => !fixture.workspace.athleteSkills.some((old) => old.id === item.id),
    );
    expect(added).toHaveLength(3);
    expect(added.every((item) => item.stability === null && item.assessedAt === null)).toBe(true);
    expect(
      added.map((item) => result.workspace.skills.find((skill) => skill.id === item.skillId)!.name),
    ).toEqual([fullName, 'Rondat', 'Rondat – Flik-flak']);
    expect(fixture.workspace.athleteSkills).toHaveLength(24);
    expect(registerSpring(result.workspace, fixture.athleteA.id, full, DK_V1, true, null).workspace).toBe(
      result.workspace,
    );
  });

  it('bevarer eksisterende kortere seriers vurdering, id og arkivering og kan fravælge dem', () => {
    const fixture = syntheticWorkspace();
    const full = choice(fullName).definition;
    const first = registerSpring(
      fixture.workspace,
      fixture.athleteA.id,
      shorterSeries(full, DK_V1)[1]!,
      DK_V1,
      false,
      null,
    );
    const assessed = updateAssessment(first.workspace, first.registrationId, {
      stability: 4,
      assessedAt: '2026-10-25',
      note: 'Eksisterende vurdering',
    });
    const added = registerSpring(assessed, fixture.athleteA.id, full, DK_V1, true, null);
    expect(added.workspace.athleteSkills.find((item) => item.id === first.registrationId)).toEqual(
      assessed.athleteSkills.find((item) => item.id === first.registrationId),
    );
    const archived = setArchived(assessed, 'athleteSkills', first.registrationId, true);
    expect(
      registerSpring(archived, fixture.athleteA.id, full, DK_V1, true, null).workspace.athleteSkills.find(
        (item) => item.id === first.registrationId,
      )?.archived,
    ).toBe(true);
    const noPrefixes = registerSpring(fixture.workspace, fixture.athleteB.id, full, DK_V1, false, null);
    expect(noPrefixes.workspace.athleteSkills).toHaveLength(25);
  });

  it('genbruger en egen kæde efter fil-roundtrip uden at overføre gymnastens vurdering eller bekræftelse', () => {
    const fixture = syntheticWorkspace();
    const base = choice(fullName).definition;
    if (base.discipline !== 'tumbling') throw Error('disciplin');
    const own: SpringDefinition = {
      ...base,
      id: 'own-chain',
      name: 'Syntetisk egen lang serie',
      elements: [...base.elements.slice(0, 2), base.elements[1]!, ...base.elements.slice(1)],
      connection: {
        kind: 'custom',
        transitions: ['Egen overgang 1', 'Egen overgang 2', 'Egen overgang 3', 'Egen overgang 4'],
      },
    };
    const first = registerSpring(
      fixture.workspace,
      fixture.athleteA.id,
      own,
      DK_V1,
      false,
      'Bekræftet på gymnast A',
    );
    const assessed = updateAssessment(first.workspace, first.registrationId, {
      stability: 5,
      assessedAt: '2026-10-25',
      note: 'Kun gymnast A',
    });
    const reloaded = parseWorkspace(serializeWorkspace(assessed));
    const found = springLibrary(DK_V1, reloaded).find((item) => item.definition.name === own.name)!;
    expect(found.own).toBe(true);
    const second = registerSpring(reloaded, fixture.athleteB.id, found.definition, DK_V1, false, null);
    const registration = second.workspace.athleteSkills.find((item) => item.id === second.registrationId)!;
    expect(registration.skillId).toBe(
      second.workspace.athleteSkills.find((item) => item.id === first.registrationId)!.skillId,
    );
    expect(registration.stability).toBeNull();
    expect(registration.connectionConfirmation).toBeNull();
    expect(second.workspace.athleteSkills.find((item) => item.id === first.registrationId)?.stability).toBe(
      5,
    );
    expect(DK_V1.evaluateSkill(found.definition, registration).connection).toBe('unverified');
  });

  it('ingen forbudte elementer, nye permutationsforbindelser eller falske officielle koder', () => {
    const library = springLibrary(DK_V1, createWorkspace());
    expect(
      library.filter(
        (item) => item.definition.discipline === 'tumbling' && item.definition.elements.length > 1,
      ).length,
    ).toBeGreaterThan(70);
    const identities = library.map((item) => DK_V1.evaluateSkill(item.definition).identity);
    expect(new Set(identities).size).toBe(library.length);
    for (const item of library) {
      const result = DK_V1.evaluateSkill(item.definition);
      expect(result.difficulty.status).not.toBe('invalid');
      if (item.definition.discipline === 'tumbling' && result.connection === 'unverified')
        expect(item.definition.connection.kind).toBe('custom');
    }
  });
});
