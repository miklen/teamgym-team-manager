import { describe, expect, it } from 'vitest';
import {
  chooseInheritanceSource,
  createWorkspace,
  followAssessment,
  Fraction,
  migrateWorkspaceV1,
  parseWorkspace,
  reconcileInheritance,
  replaceAthleteSkill,
  roundStability,
  serializeWorkspace,
  setArchived,
  setOwnAssessment,
  skillIdentity,
  updateAssessment,
  validateWorkspace,
  validateWorkspaceV1,
} from '@teamgym/domain';
import type { InheritanceContext, Stability, Workspace } from '@teamgym/domain';
import { DK_V1 } from '@teamgym/rules';
import {
  FOUNDATION_CATALOG,
  registerSpringBatch,
  springFoundation,
  springInheritanceContext,
  springLibrary,
  springRegistrationPlan,
  matchesSpring,
} from '../../apps/web/src/spring-library';
import type { SpringDefinition } from '../../apps/web/src/spring-library';
import { skillOverview } from '../../apps/web/src/skill-overview';
import { reconcileWorkspace } from '../../apps/web/src/inheritance-context';
import { moveAthlete } from '@teamgym/domain';
import { syntheticWorkspace } from '../fixtures/synthetic-workspace';

const library = springLibrary(DK_V1, createWorkspace());
const full = library.find((item) => item.id === 'common-rf-full')!.definition;
const half = library.find((item) => item.id === 'common-rf-a3-b-10')!.definition;
const rudy = library.find(
  (item) =>
    item.definition.discipline === 'trampet' &&
    item.definition.jump.apparatus === 'trampet' &&
    item.definition.jump.family === 'salto' &&
    item.definition.jump.rotationQuarterTurns === 4 &&
    item.definition.jump.bodyPositions[0] === 'straight' &&
    item.definition.jump.twistsHalfTurns === 3,
)!.definition;
const context = springInheritanceContext(DK_V1);
const env = { id: () => crypto.randomUUID(), now: () => '2026-10-26T15:00:00.000Z', inheritance: context };
function setup() {
  const fixture = syntheticWorkspace();
  const workspace = registerSpringBatch(
    fixture.workspace,
    fixture.athleteA.id,
    [{ definition: full, stability: 3, confirmed: true }],
    DK_V1,
    { includeShorter: true, assessedAt: '2026-10-25' },
  );
  const added = workspace.athleteSkills.filter(
    (item) => !fixture.workspace.athleteSkills.some((old) => old.id === item.id),
  );
  const parent = added.find((item) => item.assessmentOrigin.kind === 'own')!;
  const children = added.filter((item) => item.assessmentOrigin.kind === 'inherited');
  return { ...fixture, workspace, parent, children };
}
function v1(workspace: Workspace) {
  const { inheritanceRelations: _relations, inheritanceExclusions: _exclusions, ...rest } = workspace;
  void _relations;
  void _exclusions;
  return {
    ...rest,
    plans: rest.plans.map((plan) => ({ ...plan, tumbling: plan.tumbling[0]!.rounds.map(({ reserves: _reserves, ...round }) => { void _reserves; return round; }), trampet: plan.trampet[0]!.rounds.map(({ reserves: _reserves, ...round }) => { void _reserves; return round; }) })),
    schemaVersion: 1,
    athleteSkills: workspace.athleteSkills.map(({ assessmentOrigin: _origin, ...item }) => {
      void _origin;
      return item;
    }),
  };
}

describe('strikt format 2 og eksplicit migration', () => {
  it('bevarer hele format 1, inklusive historik, arkivering, navne og null som egen', () => {
    const { workspace } = syntheticWorkspace();
    workspace.athleteSkills[0]!.archived = true;
    workspace.athleteSkills[1]!.stability = null;
    workspace.athleteSkills[1]!.assessedAt = null;
    workspace.athleteSkills[2]!.connectionConfirmation = {
      executionIdentity: skillIdentity(workspace.skills[0]!),
      confirmedAt: workspace.updatedAt,
      note: 'Syntetisk bekræftelse',
    };
    workspace.revision = 2;
    workspace.recentOperations = [
      { id: 'synthetic-operation', revision: 2, savedAt: workspace.updatedAt, payloadHash: 'b'.repeat(64) },
    ];
    const original = v1(workspace);
    const bytes = JSON.stringify(original);
    const migrated = migrateWorkspaceV1(original);
    expect(v1(migrated)).toEqual(original);
    expect(JSON.stringify(original)).toBe(bytes);
    expect(migrated.athleteSkills.every((item) => item.assessmentOrigin.kind === 'own')).toBe(true);
    expect(parseWorkspace(serializeWorkspace(migrated))).toEqual(migrated);
    expect(() => parseWorkspace(bytes)).toThrow('eksplicit migration');
    expect(() => validateWorkspaceV1(migrated)).toThrow();
    expect(() => migrateWorkspaceV1({ ...original, inheritanceRelations: [] })).toThrow();
  });
  it.each(['duplicate', 'cycle', 'foreign', 'identity', 'value', 'unknown-reference'] as const)(
    'afviser %s uden delvis adoption',
    (kind) => {
      const { workspace, children, parent, athleteB } = setup();
      const before = serializeWorkspace(workspace);
      const broken = structuredClone(workspace);
      const relation = broken.inheritanceRelations[0]!;
      if (kind === 'duplicate') broken.inheritanceRelations.push({ ...relation });
      if (kind === 'cycle')
        broken.inheritanceRelations.push({
          ...relation,
          sourceId: relation.targetId,
          targetId: relation.sourceId,
          sourceIdentity: relation.targetIdentity,
          targetIdentity: relation.sourceIdentity,
        });
      if (kind === 'foreign')
        broken.athleteSkills.find((item) => item.id === parent.id)!.athleteId = athleteB.id;
      if (kind === 'identity') relation.sourceIdentity = 'forged';
      if (kind === 'value') broken.athleteSkills.find((item) => item.id === children[0]!.id)!.stability = 5;
      if (kind === 'unknown-reference') relation.targetId = 'missing';
      expect(() => validateWorkspace(broken)).toThrow();
      expect(serializeWorkspace(workspace)).toBe(before);
    },
  );
});

describe('versionsmærket, afgrænset fundament', () => {
  it('gør ikke en ukendt udførelsesvariant gyldig ved at erstatte den med en katalogvariant', () => {
    if (rudy.discipline !== 'trampet' || full.discipline !== 'tumbling') throw Error('fixture');
    expect(
      springFoundation({ ...rudy, jump: { ...rudy.jump, variant: { syntheticUnknown: true } } }, DK_V1),
    ).toEqual([]);
    const modified = {
      ...full,
      elements: full.elements.map((element, index) =>
        index === 2 ? { ...element, variant: { syntheticUnknown: true } } : element,
      ),
    };
    expect(springFoundation(modified, DK_V1).every((item) => item.relationId === 'exact-prefix')).toBe(true);
  });
  it('har fem præcise børn til helskrue, inklusive tre positioner med håndfast D', () => {
    const entries = springFoundation(full, DK_V1);
    expect(entries).toHaveLength(5);
    // Rondat 0,10 + flik 0,20 + lukket/hofte 0,20 eller strakt 0,30.
    expect(entries.map((item) => DK_V1.evaluateSkill(item.definition).difficulty.value?.toString())).toEqual([
      '1/10',
      '3/10',
      '1/2',
      '1/2',
      '3/5',
    ]);
    expect(DK_V1.evaluateSkill(full).difficulty.value?.toString()).toBe('4/5');
  });
  it('rudy har præcis seks forlæns børn uden redskab og kan søges med rudi', () => {
    const entries = springFoundation(rudy, DK_V1);
    expect(entries).toHaveLength(6);
    expect(
      entries.map(
        (item) =>
          item.definition.discipline === 'trampet' && [
            item.definition.jump.bodyPositions[0],
            item.definition.jump.twistsHalfTurns,
          ],
      ),
    ).toEqual([
      ['tuck', 0],
      ['tuck', 1],
      ['pike', 0],
      ['pike', 1],
      ['straight', 0],
      ['straight', 1],
    ]);
    expect(
      entries.every(
        (item) =>
          item.definition.discipline === 'trampet' &&
          item.definition.jump.apparatus === 'trampet' &&
          item.definition.jump.direction === 'forward',
      ),
    ).toBe(true);
    expect(rudy.name).toContain('Rudy · strakt 540°');
    expect(
      library
        .filter((choice) => choice.definition.discipline === 'trampet' && matchesSpring(choice, 'rudi'))
        .map((choice) => choice.definition),
    ).toEqual([rudy]);
    expect(
      library
        .filter((choice) => choice.definition.discipline === 'trampet')
        .every((choice) => !/\b(?:180|360|540|720|900|1080|1260|1440)(?!\d|°)/.test(choice.definition.name)),
    ).toBe(true);
  });
  it.each([
    [3, 0, 1, 0],
    [1, 2, 1, 0],
    [2, 1, 0, 1],
    [0, 3, 0, 1],
  ])('bevarer paritet %s,%s → %s,%s og blandede positioner', (a, b, x, y) => {
    if (rudy.discipline !== 'trampet') throw Error('fixture');
    for (const first of ['tuck', 'pike', 'straight'] as const)
      for (const second of ['tuck', 'pike', 'straight'] as const) {
        const double: SpringDefinition = {
          ...rudy,
          jump: {
            ...rudy.jump,
            rotationQuarterTurns: 8,
            bodyPositions: [first, second],
            twistDistribution: [a!, b!],
          },
        };
        const children = springFoundation(double, DK_V1);
        expect(children).toHaveLength(1);
        expect(children[0]!.definition).toMatchObject({
          jump: {
            rotationQuarterTurns: 8,
            bodyPositions: [first, second],
            twistsHalfTurns: 1,
            twistDistribution: [x, y],
            apparatus: 'trampet',
          },
        });
      }
  });
  it('viser uafklaret barn og afviser registrering indtil afklaring eller fravalg', () => {
    if (rudy.discipline !== 'trampet') throw Error('fixture');
    const double: SpringDefinition = {
      ...rudy,
      jump: { ...rudy.jump, rotationQuarterTurns: 8, bodyPositions: ['tuck', 'pike'], twistDistribution: [] },
    };
    const selected = [{ definition: double, stability: 4 as Stability, confirmed: true }];
    const child = springRegistrationPlan(selected, DK_V1, true).find((item) => !item.explicit)!;
    expect(child.unresolved).toBe(true);
    const { workspace, athleteA } = syntheticWorkspace();
    expect(() =>
      registerSpringBatch(workspace, athleteA.id, selected, DK_V1, {
        includeShorter: true,
        assessedAt: '2026-10-25',
      }),
    ).toThrow('Afklar skruefordeling');
    const result = registerSpringBatch(workspace, athleteA.id, selected, DK_V1, {
      includeShorter: true,
      assessedAt: '2026-10-25',
      excluded: [skillIdentity(child.definition)],
    });
    expect(result.athleteSkills).toHaveLength(25);
    expect(DK_V1.evaluateSkill(double).validity).not.toBe('known');
    expect(springFoundation({ ...double, jump: { ...double.jump, apparatus: 'pegasus' } }, DK_V1)).toEqual(
      [],
    );
  });
  it('ingen enkeltregistrering sammensætter nye forbindelser', () => {
    const { workspace, athleteA } = syntheticWorkspace();
    const result = registerSpringBatch(workspace, athleteA.id, [], DK_V1, {
      includeShorter: true,
      assessedAt: '2026-10-25',
    });
    expect(result).toEqual(workspace);
  });
});

describe('levende arv, egne vurderinger og fravalg', () => {
  it('preview medtager allerede accepteret enklere kilde og svarer til registreringen', () => {
    const fixture = syntheticWorkspace();
    const existing = registerSpringBatch(
      fixture.workspace,
      fixture.athleteA.id,
      [{ definition: half, stability: 2, confirmed: true }],
      DK_V1,
      { includeShorter: true, assessedAt: '2026-10-25' },
    );
    const selections = [{ definition: full, stability: 5 as Stability, confirmed: true }];
    const plan = springRegistrationPlan(selections, DK_V1, true, {
      workspace: existing,
      athleteId: fixture.athleteA.id,
    });
    const rondat = plan.find(
      (item) => item.definition.discipline === 'tumbling' && item.definition.elements.length === 1,
    )!;
    expect(rondat.stability).toBe(2);
    expect(rondat.sourceIdentity).toBe(skillIdentity(half));
    const result = registerSpringBatch(existing, fixture.athleteA.id, selections, DK_V1, {
      includeShorter: true,
      assessedAt: '2026-10-26',
    });
    const registration = result.athleteSkills.find(
      (item) =>
        item.athleteId === fixture.athleteA.id &&
        result.skills.some(
          (skill) => skill.id === item.skillId && skillIdentity(skill) === skillIdentity(rondat.definition),
        ),
    )!;
    expect(registration.stability).toBe(rondat.stability);
  });
  it('propagerer 3 → 5, dato og null; bevarer egen 2, egen null, note og id', () => {
    const { workspace, parent, children } = setup();
    let next = setOwnAssessment(
      workspace,
      children[0]!.id,
      { stability: 2, assessedAt: '2026-10-24', note: 'Barnets note' },
      env,
    );
    next = setOwnAssessment(
      next,
      children[1]!.id,
      { stability: null, assessedAt: null, note: 'Eget fravalg af vurdering' },
      env,
    );
    next = updateAssessment(next, parent.id, { stability: 5, assessedAt: '2026-10-26', note: 'Parent' }, env);
    expect(next.athleteSkills.find((item) => item.id === children[0]!.id)).toMatchObject({
      stability: 2,
      assessedAt: '2026-10-24',
      note: 'Barnets note',
    });
    expect(next.athleteSkills.find((item) => item.id === children[1]!.id)?.stability).toBeNull();
    expect(next.athleteSkills.find((item) => item.id === children[2]!.id)).toMatchObject({
      stability: 5,
      assessedAt: '2026-10-26',
    });
    next = followAssessment(next, children[0]!.id, env);
    expect(next.athleteSkills.find((item) => item.id === children[0]!.id)).toMatchObject({
      stability: 5,
      note: 'Barnets note',
    });
    next = updateAssessment(next, parent.id, { stability: null, assessedAt: null, note: '' }, env);
    expect(next.athleteSkills.find((item) => item.id === children[0]!.id)).toMatchObject({
      stability: null,
      assessedAt: null,
      assessmentOrigin: { kind: 'inherited', sourceId: parent.id },
    });
    const reopened = parseWorkspace(serializeWorkspace(next));
    expect(reopened).toEqual(next);
  });
  it('noteændring bevarer ophav og dato', () => {
    const { workspace, children } = setup();
    const child = children[0]!;
    const next = updateAssessment(
      workspace,
      child.id,
      { stability: child.stability, assessedAt: child.assessedAt, note: 'Ny lokal note' },
      env,
    );
    expect(next.athleteSkills.find((item) => item.id === child.id)).toMatchObject({
      assessmentOrigin: child.assessmentOrigin,
      assessedAt: child.assessedAt,
      note: 'Ny lokal note',
    });
  });
  it('bruger kun direkte kilder, laveste D og uafhængig klikrækkefølge', () => {
    for (const selected of [
      [full, half],
      [half, full],
    ]) {
      const { workspace, athleteA } = syntheticWorkspace();
      const next = registerSpringBatch(
        workspace,
        athleteA.id,
        selected.map((definition) => ({
          definition,
          stability: definition === half ? 2 : 5,
          confirmed: true,
        })),
        DK_V1,
        { includeShorter: true, assessedAt: '2026-10-25' },
      );
      const rondat = next.athleteSkills.find(
        (item) =>
          item.athleteId === athleteA.id &&
          next.skills.some(
            (skill) =>
              skill.id === item.skillId &&
              skill.discipline === 'tumbling' &&
              skill.elements.length === 1 &&
              skill.elements[0]!.family === 'roundoff',
          ),
      )!;
      expect(rondat.stability).toBe(2);
      expect(rondat.assessmentOrigin).toMatchObject({
        sourceId: next.athleteSkills.find((item) =>
          next.skills.some(
            (skill) => skill.id === item.skillId && skillIdentity(skill) === skillIdentity(half),
          ),
        )!.id,
      });
    }
  });
  it('skifter til alternativ, derefter manglende kilde, uden ændring af andre gymnaster', () => {
    const { workspace, athleteA, parent, children, athleteB } = setup();
    const both = registerSpringBatch(
      workspace,
      athleteA.id,
      [{ definition: half, stability: 2, confirmed: true }],
      DK_V1,
      { includeShorter: true, assessedAt: '2026-10-26' },
    );
    const simpler = both.athleteSkills.find(
      (item) =>
        item.athleteId === athleteA.id &&
        both.skills.some(
          (skill) => skill.id === item.skillId && skillIdentity(skill) === skillIdentity(half),
        ),
    )!;
    const removed = setArchived(both, 'athleteSkills', simpler.id, true, env);
    expect(removed.athleteSkills.find((item) => item.id === children[0]!.id)?.assessmentOrigin).toMatchObject(
      { sourceId: parent.id },
    );
    const missing = setArchived(removed, 'athleteSkills', parent.id, true, env);
    expect(missing.athleteSkills.find((item) => item.id === children[0]!.id)).toMatchObject({
      stability: null,
      assessmentOrigin: { kind: 'inherited', sourceId: null },
    });
    expect(missing.athleteSkills.filter((item) => item.athleteId === athleteB.id)).toEqual(
      workspace.athleteSkills.filter((item) => item.athleteId === athleteB.id),
    );
  });
  it('ændret udførelse ugyldiggør gamle relationer og bevarer planreferencer', () => {
    const { workspace, parent, children } = setup();
    const changed = replaceAthleteSkill(workspace, parent.id, half, env);
    expect(changed.inheritanceRelations.some((item) => item.sourceId === parent.id)).toBe(false);
    expect(changed.athleteSkills.find((item) => item.id === children[0]!.id)?.stability).toBeNull();
    expect(changed.plans).toEqual(workspace.plans);
  });
  it('fravalg og fjernelse overlever ny kilde/genåbning, genvalg genbruger id og note', () => {
    const { workspace, athleteA, parent, children } = setup();
    const child = children[0]!;
    const noted = updateAssessment(
      workspace,
      child.id,
      { stability: child.stability, assessedAt: child.assessedAt, note: 'Bevar mig' },
      env,
    );
    const removed = setArchived(noted, 'athleteSkills', child.id, true, env);
    const next = registerSpringBatch(
      parseWorkspace(serializeWorkspace(removed)),
      athleteA.id,
      [{ definition: half, stability: 2, confirmed: true }],
      DK_V1,
      { includeShorter: true, assessedAt: '2026-10-25' },
    );
    expect(next.athleteSkills.find((item) => item.id === child.id)?.archived).toBe(true);
    const definition = next.skills.find((skill) => skill.id === child.skillId)! as SpringDefinition;
    const restored = registerSpringBatch(
      next,
      athleteA.id,
      [{ definition, stability: null, confirmed: true }],
      DK_V1,
      { includeShorter: false, assessedAt: '2026-10-26' },
    );
    expect(restored.athleteSkills.find((item) => item.id === child.id)).toMatchObject({
      archived: false,
      note: 'Bevar mig',
      stability: null,
      assessmentOrigin: { kind: 'own' },
    });
    expect(
      restored.athleteSkills.filter(
        (item) => item.athleteId === athleteA.id && item.skillId === child.skillId,
      ),
    ).toHaveLength(1);
    expect(restored.athleteSkills.find((item) => item.id === parent.id)?.stability).toBe(3);
  });
  it('ukendt D fastholder gyldig kilde og kræver eksplicit kildevalg ved ny binding', () => {
    const { workspace, children, parent } = setup();
    const unknown: InheritanceContext = { ...context, difficulty: () => null };
    const next = structuredClone(workspace);
    reconcileInheritance(next, unknown);
    expect(next.athleteSkills.find((item) => item.id === children[0]!.id)?.assessmentOrigin).toMatchObject({
      sourceId: parent.id,
    });
    const candidate = { id: 'source', identity: 'exact', stability: 3 as Stability, difficulty: null };
    expect(chooseInheritanceSource([candidate])).toBeUndefined();
    expect(chooseInheritanceSource([candidate], null, 'source')).toEqual(candidate);
    expect(
      chooseInheritanceSource([
        { ...candidate, id: 'high', difficulty: Fraction.from('0.8') },
        { ...candidate, id: 'low', difficulty: Fraction.from('0.8'), stability: null },
      ])?.id,
    ).toBe('low');
  });
  it('ukendt katalogversion bevares til gennemgang uden anvendelse eller nye børn', () => {
    const { workspace, children } = setup();
    const next = structuredClone(workspace);
    next.inheritanceRelations.forEach((item) => {
      item.catalogVersion = 'future';
    });
    reconcileInheritance(next, context);
    expect(next.inheritanceRelations).toHaveLength(5);
    expect(next.athleteSkills).toHaveLength(workspace.athleteSkills.length);
    expect(next.athleteSkills.find((item) => item.id === children[0]!.id)?.stability).toBeNull();
    expect(parseWorkspace(serializeWorkspace(next))).toEqual(next);
  });
  it('holdskift til manglende regelpakke bevarer gyldig kilde uden skjult D-fallback', () => {
    const { workspace, athleteA, teamB, parent, children } = setup();
    const moved = reconcileWorkspace(moveAthlete(workspace, athleteA.id, teamB.id));
    expect(moved.athleteSkills.find((item) => item.id === children[0]!.id)?.assessmentOrigin).toMatchObject({
      sourceId: parent.id,
    });
    const removed = reconcileWorkspace(setArchived(moved, 'athleteSkills', parent.id, true));
    expect(removed.athleteSkills.find((item) => item.id === children[0]!.id)).toMatchObject({
      stability: null,
      assessmentOrigin: { kind: 'inherited', sourceId: null },
    });
    expect(removed.athletes.find((item) => item.id === athleteA.id)?.teamId).toBe(teamB.id);
  });
  it('træet viser hvert barn én gang, også egen vurdering, og planaggregater følger effektiv værdi', () => {
    const { workspace, athleteA, parent, children, teamA } = setup();
    const child = children[0]!;
    let next = setOwnAssessment(
      workspace,
      child.id,
      { stability: 2, assessedAt: '2026-10-25', note: '' },
      env,
    );
    const rows = skillOverview(next, athleteA.id, DK_V1);
    expect(new Set(rows.map((row) => row.identity)).size).toBe(rows.length);
    expect(rows.find((row) => row.registration.id === child.id)?.parentId).toBe(parent.id);
    const entries = [
      {
        id: 'synthetic-slot',
        athleteId: athleteA.id,
        athleteSkillId: children[1]!.id,
        role: 'counting' as const,
      },
    ];
    expect(roundStability(next, entries, { counting: 1, extra: 0 }, teamA.id).counting.minimum).toBe(3);
    next = updateAssessment(next, parent.id, { stability: 5, assessedAt: '2026-10-26', note: '' }, env);
    expect(roundStability(next, entries, { counting: 1, extra: 0 }, teamA.id).counting.minimum).toBe(5);
    expect(FOUNDATION_CATALOG.version).toBe('2');
  });
});
