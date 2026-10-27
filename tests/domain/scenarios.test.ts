import { describe, expect, it } from 'vitest';
import {
  createScenario,
  duplicateScenario,
  deleteScenario,
  renameScenario,
  suggestScenarioCopyName,
  requireScenario,
  setRoundEntries,
  setRoundReserves,
  insertReserve,
  moveRoundFirst,
  validateWorkspace,
  validateWorkspaceV1,
  validateWorkspaceV2,
  migrateWorkspaceV1,
  migrateWorkspaceV2,
  serializeWorkspace,
  parseWorkspace,
  workspacePayload,
  planReferences,
  moveAthlete,
  setArchived,
  updateAssessment,
} from '@teamgym/domain';
import {
  DK_V1,
  applyPotentialPreview,
  previewVersionChange,
  RuleRegistry,
  createDKFamilyPackage,
  applyVersionChange,
} from '@teamgym/rules';
import { syntheticWorkspace, limits } from '../fixtures/synthetic-workspace';
import v1 from '../../examples/arbejdsrum-v1.json';
import v2 from '../../examples/arbejdsrum-v2.json';
import legacyInheritance from '../fixtures/legacy-v2-inheritance.json';
import scenarioExample from '../../examples/scenarier-og-reserver-v3.json';

function setup() {
  const fixture = syntheticWorkspace();
  const plan = fixture.workspace.plans[0]!;
  const scenario = plan.tumbling[0]!;
  const round = scenario.rounds[0];
  const reserve = {
    id: 'reserve-test',
    athleteId: fixture.workspace.athletes[6]!.id,
    athleteSkillId: fixture.workspace.athleteSkills.find(
      (item) => item.athleteId === fixture.workspace.athletes[6]!.id && item.skillId === 'skill-tumbling',
    )!.id,
  };
  return { ...fixture, plan, scenario, round, reserve };
}

describe('format 3, scenarier og reserver', () => {
  it('bevarer faste format 2-arvedata, egne null-vurderinger, fravalg og historik uændret', () => {
    const original = JSON.stringify(legacyInheritance);
    const migrated = migrateWorkspaceV2(legacyInheritance);
    expect(migrated.athleteSkills).toEqual(legacyInheritance.athleteSkills);
    expect(migrated.inheritanceRelations).toEqual(legacyInheritance.inheritanceRelations);
    expect(migrated.inheritanceExclusions).toEqual(legacyInheritance.inheritanceExclusions);
    expect(migrated.recentOperations).toEqual(legacyInheritance.recentOperations);
    expect(migrated.athleteSkills.some((item) => item.assessmentOrigin.kind === 'inherited')).toBe(true);
    expect(
      migrated.athleteSkills.some((item) => item.assessmentOrigin.kind === 'own' && item.stability === null),
    ).toBe(true);
    expect(JSON.stringify(legacyInheritance)).toBe(original);
    const example = validateWorkspace(scenarioExample);
    expect(example.plans[0]!.tumbling).toHaveLength(12);
    expect(parseWorkspace(serializeWorkspace(example))).toEqual(example);
  });
  it('har selvstændige strikte gamle skemaer og accepterer ikke nye felter under gamle versionsmærker', () => {
    const { workspace } = setup();
    expect(validateWorkspace(workspace).schemaVersion).toBe(3);
    for (const version of [1, 2]) {
      const mixed = { ...workspace, schemaVersion: version };
      expect(() => (version === 1 ? validateWorkspaceV1(mixed) : validateWorkspaceV2(mixed))).toThrow();
    }
    const mixed = structuredClone(v2);
    Object.assign(mixed.plans[0]!.tumbling[0]!, { reserves: [] });
    expect(() => validateWorkspaceV2(mixed)).toThrow();
  });

  it.each([1, 2])('migrerer faste format %i-bytes uden tab eller mutation', (version) => {
    const original = version === 1 ? v1 : v2;
    const bytes = JSON.stringify(original);
    const result = version === 1 ? migrateWorkspaceV1(original) : migrateWorkspaceV2(original);
    expect(JSON.stringify(original)).toBe(bytes);
    expect(result).toMatchObject({
      workspaceId: original.workspaceId,
      revision: original.revision,
      updatedAt: original.updatedAt,
      recentOperations: original.recentOperations,
      teams: original.teams,
      athletes: original.athletes,
      skills: original.skills,
    });
    for (const [index, plan] of original.plans.entries())
      for (const discipline of ['tumbling', 'trampet'] as const) {
        expect(result.plans[index]![discipline]).toHaveLength(1);
        expect(result.plans[index]![discipline][0]).toMatchObject({
          name: 'Plan A',
          rounds: plan[discipline].map((round) => ({ ...round, reserves: [] })),
        });
      }
    expect(result.athleteSkills).toEqual(
      original.athleteSkills.map((registration) =>
        version === 1 ? { ...registration, assessmentOrigin: { kind: 'own' } } : registration,
      ),
    );
    if (version === 2) {
      expect(result.inheritanceRelations).toEqual(v2.inheritanceRelations);
      expect(result.inheritanceExclusions).toEqual(v2.inheritanceExclusions);
    }
  });

  it('opretter efter kilden med tre tomme omgange, lokale navne og annullerer via uændret input', () => {
    const { workspace, plan, scenario, environment } = setup();
    const created = createScenario(workspace, plan.id, 'tumbling', scenario.id, '  Plan B  ', environment);
    expect(created.plans[0]!.tumbling.map((item) => item.name)).toEqual(['Plan A', 'Plan B']);
    expect(created.plans[0]!.tumbling[1]!.rounds.map((round) => [round.entries, round.reserves])).toEqual([
      [[], []],
      [[], []],
      [[], []],
    ]);
    expect(workspace.plans[0]!.tumbling).toHaveLength(1);
    for (const name of ['', '  ', 'a'.repeat(201), ' plan a '])
      expect(() => createScenario(workspace, plan.id, 'tumbling', scenario.id, name, environment)).toThrow();
    expect(
      renameScenario(created, plan.id, 'trampet', plan.trampet[0]!.id, 'Plan B', environment).plans[0]!
        .tumbling,
    ).toEqual(created.plans[0]!.tumbling);
    expect(() => deleteScenario(workspace, plan.id, 'tumbling', scenario.id)).toThrow('mindst ét');
    expect(deleteScenario(created, plan.id, 'tumbling', scenario.id).plans[0]!.tumbling[0]!.name).toBe(
      'Plan B',
    );
  });

  it('kopierer alle data med nye id-er og ledige kopinavne ved 200 tegn', () => {
    const { workspace, plan, scenario, round, reserve, environment } = setup();
    const withReserve = setRoundReserves(
      workspace,
      plan.id,
      'tumbling',
      scenario.id,
      round.id,
      [reserve],
      environment,
    );
    const named = renameScenario(withReserve, plan.id, 'tumbling', scenario.id, 'A'.repeat(200), environment);
    const name = suggestScenarioCopyName(named.plans[0]!.tumbling, scenario.id);
    expect(name).toHaveLength(200);
    const copied = duplicateScenario(named, plan.id, 'tumbling', scenario.id, name, environment);
    const copy = copied.plans[0]!.tumbling[1]!;
    expect(suggestScenarioCopyName(copied.plans[0]!.tumbling, scenario.id)).toMatch(/ - kopi 2$/);
    expect(
      copy.rounds[0].entries.map(({ id: _id, ...entry }) => {
        void _id;
        return entry;
      }),
    ).toEqual(
      round.entries.map(({ id: _id, ...entry }) => {
        void _id;
        return entry;
      }),
    );
    expect(copy.rounds[0].reserves[0]).toMatchObject({
      athleteId: reserve.athleteId,
      athleteSkillId: reserve.athleteSkillId,
    });
    const ids = (value: typeof copy) => [
      value.id,
      ...value.rounds.flatMap((item) => [
        item.id,
        ...item.entries.map((entry) => entry.id),
        ...item.reserves.map((entry) => entry.id),
      ]),
    ];
    expect(ids(copy).some((id) => ids(named.plans[0]!.tumbling[0]!).includes(id))).toBe(false);
    const edited = setRoundEntries(
      copied,
      plan.id,
      'tumbling',
      copy.id,
      copy.rounds[0].id,
      [],
      limits,
      environment,
    );
    expect(edited.plans[0]!.tumbling[0]).toEqual(named.plans[0]!.tumbling[0]);
    expect(DK_V1.analyze(edited, plan.teamId, 'tumbling', scenario.id).difficulty.status).toBe('known');
    expect(DK_V1.analyze(edited, plan.teamId, 'tumbling', copy.id).difficulty.status).toBe('incomplete');
    expect(() => requireScenario(copied, plan.id, 'trampet', copy.id)).toThrow();
    expect(() => setRoundEntries(copied, plan.id, 'tumbling', 'unknown', round.id, [], limits)).toThrow();
  });

  it('afviser fejl i lukkede scenarier og bevarer springløse og historiske reserver', () => {
    const { workspace, plan, scenario, round, reserve, environment, teamB } = setup();
    let current = setRoundReserves(
      workspace,
      plan.id,
      'tumbling',
      scenario.id,
      round.id,
      [reserve],
      environment,
    );
    current = duplicateScenario(current, plan.id, 'tumbling', scenario.id, 'Plan B', environment);
    const closed = current.plans[0]!.tumbling[1]!;
    const bad = (mutate: (value: typeof current) => void) => {
      const copy = structuredClone(current);
      mutate(copy);
      expect(() => validateWorkspace(copy)).toThrow();
    };
    bad((copy) => {
      copy.plans[0]!.tumbling[1]!.name = 'plan a';
    });
    bad((copy) => {
      copy.plans[0]!.tumbling[1]!.id = scenario.id;
    });
    bad((copy) => {
      copy.plans[0]!.tumbling[1]!.rounds.pop();
    });
    bad((copy) => {
      copy.plans[0]!.tumbling[1]!.rounds[0].reserves[0]!.athleteSkillId = 'unknown';
    });
    bad((copy) => {
      copy.plans[0]!.tumbling[1]!.rounds[0].reserves[0]!.athleteSkillId = round.entries[0]!.athleteSkillId;
    });
    bad((copy) => {
      copy.plans[0]!.tumbling[1]!.rounds[0].reserves[0]!.athleteSkillId = current.athleteSkills.find(
        (item) => item.athleteId === reserve.athleteId && item.skillId === 'skill-trampet',
      )!.id;
    });
    expect(() =>
      setRoundReserves(current, plan.id, 'tumbling', closed.id, closed.rounds[0].id, [
        { ...reserve, id: 'duplicate', athleteId: round.entries[0]!.athleteId, athleteSkillId: null },
      ]),
    ).toThrow('to gange');
    const moved = moveAthlete(current, reserve.athleteId, teamB.id, environment);
    expect(parseWorkspace(serializeWorkspace(moved))).toEqual(moved);
    expect(
      planReferences(moved).filter(
        (item) => item.kind === 'reserve' && item.entry.athleteId === reserve.athleteId,
      ),
    ).toHaveLength(2);
    expect(() =>
      insertReserve(
        moved,
        plan.id,
        'tumbling',
        scenario.id,
        round.id,
        reserve.id,
        round.entries[0]!.id,
        workspacePayload(moved),
        limits,
      ),
    ).toThrow('aktiv gymnast');
    expect(() =>
      setRoundReserves(moved, plan.id, 'tumbling', scenario.id, round.id, [reserve], environment),
    ).not.toThrow();
  });

  it('adskiller reserver fra grænser og beregninger og tager dem med ved flytning af holdomgang', () => {
    const { workspace, plan, scenario, round, reserve, environment } = setup();
    const before = DK_V1.analyze(workspace, plan.teamId, 'tumbling', scenario.id);
    const added = setRoundReserves(
      workspace,
      plan.id,
      'tumbling',
      scenario.id,
      round.id,
      [{ ...reserve, athleteSkillId: null }],
      environment,
    );
    const after = DK_V1.analyze(added, plan.teamId, 'tumbling', scenario.id);
    const { reserves: _before, ...beforeRound } = before.rounds[0]!;
    void _before;
    const { reserves: _after, ...afterRound } = after.rounds[0]!;
    void _after;
    expect(afterRound).toEqual(beforeRound);
    expect(after.difficulty).toEqual(before.difficulty);
    expect(after.composition).toEqual(before.composition);
    expect(after.rounds[0]!.reserves[0]!.status).toBe('incomplete');
    expect(() => DK_V1.analyze(added, plan.teamId, 'trampet', scenario.id)).toThrow('Scenariet');
    const moved = moveRoundFirst(added, plan.id, 'tumbling', scenario.id, scenario.rounds[2].id, environment);
    expect(moved.plans[0]!.tumbling[0]!.rounds[1].reserves).toEqual([{ ...reserve, athleteSkillId: null }]);
    const filled = setRoundEntries(
      workspace,
      plan.id,
      'tumbling',
      scenario.id,
      round.id,
      [
        ...[6, 7].map((i) => ({
          id: `extra-${i}`,
          athleteId: workspace.athletes[i]!.id,
          athleteSkillId: null,
          role: 'extra' as const,
        })),
        ...round.entries,
      ],
      limits,
      environment,
    );
    expect(() => setRoundReserves(filled, plan.id, 'tumbling', scenario.id, round.id, [reserve])).toThrow(
      'to gange',
    );
  });

  it.each(['counting', 'extra'] as const)(
    'indsætter samlet på %s-plads og afviser forældet basis',
    (role) => {
      const { workspace, plan, scenario, round, reserve, environment } = setup();
      if (role === 'extra') round.entries[0]!.role = 'extra';
      const current = setRoundReserves(
        workspace,
        plan.id,
        'tumbling',
        scenario.id,
        round.id,
        [{ ...reserve, athleteSkillId: null }],
        environment,
      );
      const result = insertReserve(
        current,
        plan.id,
        'tumbling',
        scenario.id,
        round.id,
        reserve.id,
        round.entries[0]!.id,
        workspacePayload(current),
        limits,
        environment,
      );
      const changed = result.plans[0]!.tumbling[0]!.rounds[0];
      expect(changed.entries[0]).toEqual({
        ...round.entries[0],
        athleteId: reserve.athleteId,
        athleteSkillId: null,
      });
      expect(changed.entries.slice(1)).toEqual(round.entries.slice(1));
      expect(changed.reserves).toEqual([]);
      expect(() =>
        insertReserve(
          current,
          plan.id,
          'tumbling',
          scenario.id,
          round.id,
          reserve.id,
          round.entries[0]!.id,
          workspacePayload(workspace),
          limits,
        ),
      ).toThrow('Beregn igen');
      const archived = setArchived(current, 'athleteSkills', reserve.athleteSkillId, true, environment);
      const withArchived = structuredClone(archived);
      withArchived.plans[0]!.tumbling[0]!.rounds[0].reserves[0]!.athleteSkillId = reserve.athleteSkillId;
      expect(() =>
        insertReserve(
          withArchived,
          plan.id,
          'tumbling',
          scenario.id,
          round.id,
          reserve.id,
          round.entries[0]!.id,
          workspacePayload(withArchived),
          limits,
        ),
      ).toThrow('aktive færdighed');
    },
  );

  it('rundtur bevarer forskellige samlinger og versionsskift gennemgår alle scenarier', () => {
    const { workspace, plan, scenario, round, reserve, environment } = setup();
    let current = setRoundReserves(
      workspace,
      plan.id,
      'tumbling',
      scenario.id,
      round.id,
      [reserve, { id: 'second-reserve', athleteId: workspace.athletes[7]!.id, athleteSkillId: null }],
      environment,
    );
    current = duplicateScenario(current, plan.id, 'tumbling', scenario.id, 'Plan B', environment);
    expect(parseWorkspace(serializeWorkspace(current))).toEqual(current);
    const registry = new RuleRegistry();
    registry.register(DK_V1);
    const next = createDKFamilyPackage({
      manifest: { ...DK_V1.manifest, packageVersion: 'synthetic-next', production: false },
    });
    registry.register(next);
    const preview = previewVersionChange(
      current,
      plan.teamId,
      { ...workspace.teams[0]!.rulesetBinding, packageVersion: 'synthetic-next' },
      registry,
    );
    expect(preview.before.tumbling.map((item) => item.name)).toEqual(['Plan A', 'Plan B']);
    expect(preview.after.tumbling[1]!.evaluation.rounds[0]!.reserves).toHaveLength(2);
    expect(preview.workspace.plans[1]).toEqual(current.plans[1]);
    const newer = renameScenario(
      current,
      plan.id,
      'tumbling',
      current.plans[0]!.tumbling[1]!.id,
      'Nyere Plan B',
      environment,
    );
    expect(() => applyVersionChange(newer, preview)).toThrow('Beregn igen');
  });

  it('fælles vurdering opdaterer begge scenariers reserve uden at ændre udførende eller opstillinger', () => {
    const { workspace, plan, scenario, round, reserve, environment } = setup();
    const added = setRoundReserves(
      workspace,
      plan.id,
      'tumbling',
      scenario.id,
      round.id,
      [reserve],
      environment,
    );
    const copied = duplicateScenario(added, plan.id, 'tumbling', scenario.id, 'Plan B', environment);
    const changed = updateAssessment(
      copied,
      reserve.athleteSkillId,
      { stability: 2, assessedAt: '2026-10-26', note: 'Syntetisk ny fælles vurdering' },
      environment,
    );
    expect(changed.plans).toEqual(copied.plans);
    for (const item of changed.plans[0]!.tumbling) {
      const before = DK_V1.analyze(copied, plan.teamId, 'tumbling', item.id);
      const after = DK_V1.analyze(changed, plan.teamId, 'tumbling', item.id);
      expect(after.rounds[0]!.reserves[0]!.registration?.stability).toBe(2);
      expect(after.rounds[0]!.stability).toEqual(before.rounds[0]!.stability);
      expect(after.difficulty).toEqual(before.difficulty);
    }
  });

  it('potentialer ændrer kun målscenariet og fjerner nyudførende fra netop dets reserver', async () => {
    const { workspace, plan, scenario, environment } = setup();
    const current = duplicateScenario(workspace, plan.id, 'tumbling', scenario.id, 'Plan B', environment);
    const target = current.plans[0]!.tumbling[1]!;
    const removed = target.rounds[1].entries.pop()!;
    target.rounds[1].reserves.push({
      id: 'potential-reserve',
      athleteId: removed.athleteId,
      athleteSkillId: removed.athleteSkillId,
    });
    const suggestions = await DK_V1.potentials(current, plan.teamId, 'tumbling', target.id);
    const preview = suggestions.find((item) => item.preview)!.preview!;
    const result = applyPotentialPreview(current, preview);
    expect(result.plans[0]!.tumbling[0]).toEqual(current.plans[0]!.tumbling[0]);
    expect(result.athleteSkills).toEqual(current.athleteSkills);
    for (const round of result.plans[0]!.tumbling[1]!.rounds)
      expect(
        round.reserves.some((reserve) =>
          round.entries.some((entry) => entry.athleteId === reserve.athleteId),
        ),
      ).toBe(false);
    expect(preview.scenarioId).toBe(target.id);
  });
});
