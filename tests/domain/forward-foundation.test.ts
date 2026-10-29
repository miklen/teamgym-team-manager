import { describe, expect, it } from 'vitest';
import {
  createWorkspace,
  mergeWorkspace,
  parseWorkspace,
  reconcileInheritance,
  registerAthleteSkill,
  serializeWorkspace,
  setArchived,
  setOwnAssessment,
  skillIdentity,
  updateAssessment,
  validateWorkspace,
} from '@teamgym/domain';
import type { MergeContext, Workspace } from '@teamgym/domain';
import { DK_V1 } from '@teamgym/rules';
import {
  registerSpringBatch,
  springFoundation,
  springInheritanceContext,
  springLibrary,
  springRegistrationPlan,
} from '../../apps/web/src/spring-library';
import type { SpringDefinition } from '../../apps/web/src/spring-library';
import { reconcileWorkspace } from '../../apps/web/src/inheritance-context';
import { syntheticWorkspace } from '../fixtures/synthetic-workspace';

const library = springLibrary(DK_V1, createWorkspace());
const context = springInheritanceContext(DK_V1);
const mergeContext: MergeContext = {
  fingerprint: 'forward-foundation-3',
  reconcile: (workspace) => reconcileWorkspace(workspace, workspace.updatedAt),
};
function source(reference: string): SpringDefinition {
  return structuredClone(library.find((item) => item.id === `common-${reference}`)!.definition);
}
function jump(skill: SpringDefinition) {
  return skill.discipline === 'trampet' ? skill.jump : skill.elements.at(-1)!;
}
function signatures(skill: SpringDefinition, version = '3') {
  return springFoundation(skill, DK_V1, version)
    .map((entry) => {
      const element = jump(entry.definition);
      return `${element.bodyPositions.join(',')}:${element.twistsHalfTurns}:${element.twistDistribution.join(',')}`;
    })
    .sort();
}
function registration(workspace: Workspace, skill: SpringDefinition) {
  const found = workspace.athleteSkills.find((item) =>
    workspace.skills.some(
      (definition) => definition.id === item.skillId && skillIdentity(definition) === skillIdentity(skill),
    ),
  );
  if (!found) throw Error('Testens registrering mangler');
  return found;
}
function setup(skill: SpringDefinition) {
  const fixture = syntheticWorkspace();
  const workspace = registerSpringBatch(
    fixture.workspace,
    fixture.athleteA.id,
    [{ definition: skill, stability: 3, confirmed: true }],
    DK_V1,
    { includeShorter: true, assessedAt: '2026-10-28' },
  );
  return { ...fixture, workspace, parent: registration(workspace, skill) };
}

describe('forlæns fundament version 3', () => {
  it.each([
    ['a4-f-06', 1, ['tuck:0:', 'tuck:1:1', 'pike:0:', 'pike:1:1', 'straight:0:']],
    ['a4-f-08', 3, ['tuck:0:', 'tuck:1:1', 'pike:0:', 'pike:1:1', 'straight:0:', 'straight:1:1']],
    [
      'a4-f-10',
      5,
      ['tuck:0:', 'tuck:1:1', 'pike:0:', 'pike:1:1', 'straight:0:', 'straight:1:1', 'straight:3:3'],
    ],
    [
      'a4-f-10',
      7,
      [
        'tuck:0:',
        'tuck:1:1',
        'pike:0:',
        'pike:1:1',
        'straight:0:',
        'straight:1:1',
        'straight:3:3',
        'straight:5:5',
      ],
    ],
  ] as const)('giver præcist fundament til %s med %s halve skruer', (id, twists, expected) => {
    const skill = source(id);
    Object.assign(jump(skill), { twistsHalfTurns: twists, twistDistribution: [twists] });
    const before = JSON.stringify(skill);
    expect(signatures(skill)).toEqual([...expected].sort());
    const entries = springFoundation(skill, DK_V1);
    expect(new Set(entries.map((entry) => skillIdentity(entry.definition))).size).toBe(expected.length);
    expect(
      entries.every(
        (entry) => !entry.unresolved && DK_V1.evaluateSkill(entry.definition).validity === 'known',
      ),
    ).toBe(true);
    expect(JSON.stringify(skill)).toBe(before);
  });

  it.each(['a4-f-14', 'a4-f-15'])(
    'dobbelt 180° %s giver enkeltsaltoer, barani og dobbelt uden skrue',
    (id) => {
      const skill = source(id);
      jump(skill).twistDistribution = [0, 1];
      const expected = [
        'tuck:0:',
        'tuck:1:1',
        'pike:0:',
        'pike:1:1',
        'straight:0:',
        'straight:1:1',
        ...(id === 'a4-f-15' ? ['pike,pike:0:', 'tuck,tuck:1:0,1'] : []),
        'tuck,tuck:0:',
      ];
      expect(signatures(skill)).toEqual(expected.sort());
      // Håndfast trampet-D: lukket/hofte/strakt 0,10/0,20/0,30 + 0,10 pr. halvskrue.
      const singleValues = springFoundation(skill, DK_V1)
        .filter((entry) => jump(entry.definition).rotationQuarterTurns === 4)
        .map((entry) => DK_V1.evaluateSkill(entry.definition).difficulty.value?.toString())
        .sort();
      expect(singleValues).toEqual(['1/10', '1/5', '1/5', '3/10', '3/10', '2/5'].sort());
    },
  );

  it.each(['a4-f-11', 'a4-f-12'])('dobbelt uden skrue %s giver de tre enkeltsaltoer', (id) => {
    expect(signatures(source(id))).toEqual(
      ['tuck:0:', 'pike:0:', 'straight:0:', ...(id === 'a4-f-12' ? ['tuck,tuck:0:'] : [])].sort(),
    );
  });

  it.each([
    [1, 0],
    [0, 1],
  ])('bevarer 180°-fordelingen %s,%s ved hofte → lukket', (a, b) => {
    const skill = source('a4-f-15');
    jump(skill).twistDistribution = [a!, b!];
    const tucked = springFoundation(skill, DK_V1).find((entry) => entry.relationId === 'double-pike-tuck')!;
    expect(jump(tucked.definition).twistDistribution).toEqual([a, b]);
    expect(tucked.unresolved).toBe(false);
  });

  it('opfinder ikke fordeling eller ændrer blandede dobbeltsaltoers positioner', () => {
    const skill = source('a4-f-15');
    const entries = springFoundation(skill, DK_V1);
    expect(entries.find((entry) => entry.relationId === 'double-pike-tuck')).toMatchObject({
      unresolved: true,
    });
    expect(
      jump(entries.find((entry) => entry.relationId === 'double-without-twist')!.definition)
        .twistDistribution,
    ).toEqual([]);
    const selected = [{ definition: skill, stability: 3 as const, confirmed: true }];
    expect(springRegistrationPlan(selected, DK_V1, true).some((item) => item.unresolved)).toBe(true);
    jump(skill).bodyPositions = ['pike', 'straight'];
    jump(skill).twistDistribution = [1, 0];
    expect(
      springFoundation(skill, DK_V1)
        .filter((entry) => jump(entry.definition).rotationQuarterTurns === 8)
        .map((entry) => jump(entry.definition).bodyPositions),
    ).toEqual([['pike', 'straight']]);
  });

  it('bevarer 540° → 180° og medtager nu hele fundamentet nedenunder', () => {
    const skill = source('a4-f-18');
    jump(skill).twistDistribution = [2, 1];
    const entries = springFoundation(skill, DK_V1);
    expect(entries[0]!.relationId).toBe('double-540-180');
    expect(jump(entries[0]!.definition).twistDistribution).toEqual([0, 1]);
    expect(entries).toHaveLength(8);
    expect(entries.filter((entry) => jump(entry.definition).rotationQuarterTurns === 4)).toHaveLength(6);
  });

  it('bevarer indgang og overgange på bane og ændrer aldrig tidligere elementers skruer', () => {
    const skill = library.find((item) => item.id === 'common-sh-barani')!.definition;
    if (skill.discipline !== 'tumbling') throw Error('fixture');
    const children = springFoundation(skill, DK_V1).filter(
      (entry) => entry.relationId === 'forward-salto-foundation',
    );
    expect(children).toHaveLength(5);
    for (const child of children) {
      if (child.definition.discipline !== 'tumbling') throw Error('fixture');
      expect(child.definition.elements.slice(0, -1)).toEqual(skill.elements.slice(0, -1));
      expect(child.definition.connection).toEqual(skill.connection);
    }
  });

  it('afgrænser varianter, retning, afsæt, redskab og rotation', () => {
    for (const patch of [
      { variant: { syntheticUnknown: true } },
      { direction: 'backward' as const },
      { apparatus: 'pegasus' as const },
      { takeoff: 'one-foot' as const },
      { landing: 'seat' as const },
      { rotationQuarterTurns: 12 },
      { twistDistribution: [1, 2] },
    ]) {
      const skill = source('a4-f-10');
      Object.assign(jump(skill), patch);
      expect(springFoundation(skill, DK_V1)).toEqual([]);
    }
  });

  it('bevarer katalog 1/2; genåbning tilføjer intet, og genvalg udvider uden dubletter', () => {
    const skill = source('a4-f-08');
    const fixture = syntheticWorkspace();
    const added = registerAthleteSkill(fixture.workspace, fixture.athleteA.id, skill);
    let workspace = setOwnAssessment(added.workspace, added.athleteSkillId, {
      stability: 3,
      assessedAt: '2026-10-28',
      note: '',
    });
    for (const entry of springFoundation(skill, DK_V1, '2')) {
      const child = registerAthleteSkill(workspace, fixture.athleteA.id, entry.definition);
      workspace = setOwnAssessment(child.workspace, child.athleteSkillId, {
        stability: 3,
        assessedAt: '2026-10-28',
        note: 'Bevar note',
      });
      registration(workspace, entry.definition).assessmentOrigin = {
        kind: 'inherited',
        sourceId: added.athleteSkillId,
        sourceChoice: null,
      };
      workspace.inheritanceRelations.push({
        sourceId: added.athleteSkillId,
        targetId: child.athleteSkillId,
        sourceIdentity: skillIdentity(skill),
        targetIdentity: skillIdentity(entry.definition),
        catalogId: 'spring-foundation',
        catalogVersion: '2',
        relationId: entry.relationId,
      });
    }
    const reopened = reconcileWorkspace(parseWorkspace(serializeWorkspace(workspace)), workspace.updatedAt);
    expect(reopened).toEqual(workspace);
    expect(signatures(source('a4-f-06'), '2')).toEqual([]);
    expect(signatures(source('a4-f-10'), '1')).toEqual([]);
    const next = registerSpringBatch(
      reopened,
      fixture.athleteA.id,
      [{ definition: skill, stability: 5, confirmed: true }],
      DK_V1,
      { includeShorter: true, assessedAt: '2026-10-29' },
    );
    expect(next.inheritanceRelations).toEqual(workspace.inheritanceRelations);
    expect(next.athleteSkills.map((item) => item.id)).toEqual(workspace.athleteSkills.map((item) => item.id));
    const randy = source('a4-f-10');
    const expanded = registerSpringBatch(
      next,
      fixture.athleteA.id,
      [{ definition: randy, stability: 4, confirmed: true }],
      DK_V1,
      { includeShorter: true, assessedAt: '2026-10-29' },
    );
    expect(expanded.inheritanceRelations.some((relation) => relation.catalogVersion === '3')).toBe(true);
    expect(expanded.athleteSkills).toHaveLength(next.athleteSkills.length + 1);
    for (const child of workspace.athleteSkills.filter((item) => item.note === 'Bevar note'))
      expect(expanded.athleteSkills.find((item) => item.id === child.id)?.note).toBe('Bevar note');
  });

  it.each(['note', 'own', 'exclude'] as const)(
    'fælles fletning håndterer kildeændring samtidig med %s i begge retninger',
    (kind) => {
      const skill = source('a4-f-10');
      const { workspace: base, parent, environment } = setup(skill);
      const child = registration(base, source('a4-f-08'));
      const env = { ...environment, inheritance: context };
      const local = updateAssessment(
        base,
        parent.id,
        { stability: 5, assessedAt: '2026-10-29', note: '' },
        env,
      );
      const remote =
        kind === 'own'
          ? setOwnAssessment(base, child.id, { stability: 2, assessedAt: '2026-10-29', note: '' }, env)
          : kind === 'exclude'
            ? setArchived(base, 'athleteSkills', child.id, true, env)
            : structuredClone(base);
      if (kind === 'note') remote.athleteSkills.find((item) => item.id === child.id)!.note = 'Samtidig note';
      for (const [left, right] of [
        [local, remote],
        [remote, local],
      ]) {
        const review = mergeWorkspace(base, left!, right!, mergeContext);
        expect(review.conflicts).toHaveLength(kind === 'note' ? 0 : 1);
        const side = right === remote ? 'remote' : 'local';
        const result = mergeWorkspace(
          base,
          left!,
          right!,
          mergeContext,
          Object.fromEntries(review.conflicts.map((conflict) => [conflict.id, side])),
        );
        expect(result.status).toBe('valid');
        if (result.status !== 'valid') throw Error('Fletning fejlede');
        const inherited = result.candidate.athleteSkills.find((item) => item.id === child.id)!;
        expect(inherited.stability).toBe(kind === 'own' ? 2 : kind === 'exclude' ? 3 : 5);
        expect(inherited.archived).toBe(kind === 'exclude');
        if (kind === 'note') expect(inherited.note).toBe('Samtidig note');
        if (kind === 'exclude')
          expect(result.candidate.inheritanceExclusions).toContainEqual({
            athleteId: child.athleteId,
            targetIdentity: skillIdentity(source('a4-f-08')),
          });
        expect(validateWorkspace(result.candidate)).toEqual(result.candidate);
      }
    },
  );

  it('alle nye børn følger direkte kilde efter filrundtur; egen vurdering og fravalg bevares', () => {
    const skill = source('a4-f-15');
    jump(skill).twistDistribution = [1, 0];
    const { workspace, parent, environment, athleteA } = setup(skill);
    expect(workspace.inheritanceRelations.every((relation) => relation.sourceId === parent.id)).toBe(true);
    const barani = registration(workspace, source('a4-f-06'));
    let next = setOwnAssessment(workspace, barani.id, {
      stability: null,
      assessedAt: null,
      note: 'Egen note',
    });
    const double = registration(next, source('a4-f-11'));
    next = setArchived(next, 'athleteSkills', double.id, true, { ...environment, inheritance: context });
    next = updateAssessment(
      parseWorkspace(serializeWorkspace(next)),
      parent.id,
      { stability: 5, assessedAt: '2026-10-29', note: '' },
      { ...environment, inheritance: context },
    );
    reconcileInheritance(next, context);
    expect(next.athleteSkills.find((item) => item.id === barani.id)).toMatchObject({
      stability: null,
      note: 'Egen note',
      assessmentOrigin: { kind: 'own' },
    });
    const plan = springRegistrationPlan([{ definition: skill, stability: 5, confirmed: true }], DK_V1, true, {
      workspace: next,
      athleteId: athleteA.id,
    });
    expect(
      plan.find((item) => skillIdentity(item.definition) === skillIdentity(source('a4-f-11')))?.excluded,
    ).toBe(true);
    expect(
      next.athleteSkills
        .filter((item) => item.assessmentOrigin.kind === 'inherited' && !item.archived)
        .every((item) => item.stability === 5 && item.assessedAt === '2026-10-29'),
    ).toBe(true);
  });
});
