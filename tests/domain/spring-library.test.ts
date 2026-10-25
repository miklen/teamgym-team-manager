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
  registerSpringBatch,
  springRegistrationPlan,
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

  it('arver fra serien med lavest D, ikke fra højeste eller laveste sikkerhed', () => {
    const easy = choice('Rondat – flik – strakt 1/2 (180°)').definition;
    const hard = choice(fullName).definition;
    for (const [easyRating, hardRating] of [
      [2, 5],
      [5, 2],
    ] as const) {
      const selected = [
        { definition: easy, stability: easyRating, confirmed: true },
        { definition: hard, stability: hardRating, confirmed: true },
      ];
      const inherited = springRegistrationPlan(selected, DK_V1, true).filter((item) => !item.explicit);
      expect(inherited.map((item) => item.stability)).toEqual([easyRating, easyRating]);
      expect(
        springRegistrationPlan([...selected].reverse(), DK_V1, true)
          .filter((item) => !item.explicit)
          .map((item) => item.stability),
      ).toEqual([easyRating, easyRating]);
    }
    const explicit = shorterSeries(easy, DK_V1)[1]!;
    const plan = springRegistrationPlan(
      [
        { definition: easy, stability: 2, confirmed: true },
        { definition: hard, stability: 5, confirmed: true },
        { definition: explicit, stability: 4, confirmed: true },
      ],
      DK_V1,
      true,
    );
    expect(
      plan.find(
        (item) => DK_V1.evaluateSkill(item.definition).identity === DK_V1.evaluateSkill(explicit).identity,
      )?.stability,
    ).toBe(4);
    expect(
      springRegistrationPlan(
        [
          { definition: easy, stability: 2, confirmed: true },
          { definition: hard, stability: 5, confirmed: true },
        ],
        DK_V1,
        false,
      ),
    ).toHaveLength(2);
  });

  it('registrerer flere spring med individuelle vurderinger og fælles begyndelser én gang', () => {
    const fixture = syntheticWorkspace();
    const easy = choice('Rondat – flik – strakt 1/2 (180°)').definition;
    const hard = choice(fullName).definition;
    const selections = [
      { definition: easy, stability: 2 as const, confirmed: true },
      { definition: hard, stability: 5 as const, confirmed: true },
    ];
    const result = registerSpringBatch(fixture.workspace, fixture.athleteA.id, selections, DK_V1, {
      includeShorter: true,
      assessedAt: '2026-10-25',
    });
    const added = result.athleteSkills.slice(24);
    expect(added).toHaveLength(4);
    expect(added.map((item) => item.stability)).toEqual([2, 2, 2, 5]);
    expect(added.every((item) => item.assessedAt === '2026-10-25')).toBe(true);
    expect(result.athleteSkills.filter((item) => item.athleteId === fixture.athleteB.id)).toEqual(
      fixture.workspace.athleteSkills.filter((item) => item.athleteId === fixture.athleteB.id),
    );
    expect(fixture.workspace.athleteSkills).toHaveLength(24);
    expect(() =>
      registerSpringBatch(fixture.workspace, fixture.athleteA.id, selections, DK_V1, {
        includeShorter: true,
        assessedAt: 'ugyldig',
      }),
    ).toThrow();
    expect(fixture.workspace.athleteSkills).toHaveLength(24);
  });

  it('direkte vurdering har forrang, noter og arkivering bevares, og tom arv sletter ikke en kendt vurdering', () => {
    const fixture = syntheticWorkspace();
    const full = choice(fullName).definition;
    const prefix = shorterSeries(full, DK_V1)[1]!;
    const first = registerSpring(fixture.workspace, fixture.athleteA.id, prefix, DK_V1, false, null);
    const assessed = updateAssessment(first.workspace, first.registrationId, {
      stability: 5,
      assessedAt: '2026-10-24',
      note: 'Bevar min note',
    });
    const result = registerSpringBatch(
      assessed,
      fixture.athleteA.id,
      [
        { definition: full, stability: 2, confirmed: true },
        { definition: prefix, stability: 4, confirmed: true },
      ],
      DK_V1,
      { includeShorter: true, assessedAt: '2026-10-25' },
    );
    expect(result.athleteSkills.find((item) => item.id === first.registrationId)).toMatchObject({
      stability: 4,
      assessedAt: '2026-10-25',
      note: 'Bevar min note',
    });
    const inherited = registerSpringBatch(
      assessed,
      fixture.athleteA.id,
      [{ definition: full, stability: 2, confirmed: true }],
      DK_V1,
      { includeShorter: true, assessedAt: '2026-10-25' },
    );
    expect(inherited.athleteSkills.find((item) => item.id === first.registrationId)?.stability).toBe(2);
    const unrated = registerSpringBatch(
      assessed,
      fixture.athleteA.id,
      [{ definition: full, stability: null, confirmed: true }],
      DK_V1,
      { includeShorter: true, assessedAt: '2026-10-25' },
    );
    expect(unrated.athleteSkills.find((item) => item.id === first.registrationId)?.stability).toBe(5);
    const archived = setArchived(assessed, 'athleteSkills', first.registrationId, true);
    expect(
      registerSpringBatch(
        archived,
        fixture.athleteA.id,
        [{ definition: full, stability: 2, confirmed: true }],
        DK_V1,
        { includeShorter: true, assessedAt: '2026-10-25' },
      ).athleteSkills.find((item) => item.id === first.registrationId),
    ).toEqual(archived.athleteSkills.find((item) => item.id === first.registrationId));
  });
});
