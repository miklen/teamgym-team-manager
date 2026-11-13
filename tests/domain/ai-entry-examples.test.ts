import { expect, it } from 'vitest';
import {
  createScenario, duplicateScenario, reconcileInheritance, registerAthleteSkill, serializeWorkspace,
  setOwnAssessment, setPlannedSpot, setRoundEntries, setRoundReserves, skillIdentity, validateWorkspace,
} from '@teamgym/domain';
import { DK_V2 } from '@teamgym/rules';
import { limits, syntheticWorkspace, tumblingSkill } from '../fixtures/synthetic-workspace';

it('genbruger præcis registrering, bevarer egen null og afstemmer aktive arvede børn', () => {
  const fixture = syntheticWorkspace();
  const source = fixture.workspace.athleteSkills.find((item) => item.athleteId === fixture.athleteA.id && item.skillId === tumblingSkill.id)!;
  const existing = registerAthleteSkill(fixture.workspace, fixture.athleteA.id, tumblingSkill, fixture.environment);
  expect(existing.existed).toBe(true);
  expect(existing.athleteSkillId).toBe(source.id);
  const childSkill = {
    ...tumblingSkill, id: 'skill-test-child', name: 'Syntetisk lettere serie',
    elements: [{ ...tumblingSkill.elements[0]!, twistsHalfTurns: 0, twistDistribution: [] }],
  };
  const created = registerAthleteSkill(existing.workspace, fixture.athleteA.id, childSkill, fixture.environment);
  expect(created.workspace.athleteSkills.find((item) => item.id === created.athleteSkillId)).toMatchObject({
    stability: null, assessedAt: null, connectionConfirmation: null,
    reviewRequiredFor: [], assessmentOrigin: { kind: 'own' },
  });
  const inherited = structuredClone(created.workspace);
  const child = inherited.athleteSkills.find((item) => item.id === created.athleteSkillId)!;
  child.note = 'Barnets egen syntetiske note.';
  child.assessmentOrigin = { kind: 'inherited', sourceId: source.id, sourceChoice: null };
  child.stability = source.stability;
  child.assessedAt = source.assessedAt;
  inherited.inheritanceRelations.push({
    sourceId: source.id, targetId: child.id, sourceIdentity: skillIdentity(tumblingSkill),
    targetIdentity: skillIdentity(childSkill), catalogId: 'spring-foundation', catalogVersion: '2', relationId: 'full-twist-positions',
  });
  validateWorkspace(inherited);
  const changed = setOwnAssessment(inherited, source.id, { stability: 5, assessedAt: '2026-11-10', note: source.note }, fixture.environment);
  const reconciled = structuredClone(changed);
  reconcileInheritance(reconciled, undefined, '2026-11-10T12:00:00.000Z');
  const next = reconciled.athleteSkills.find((item) => item.id === child.id)!;
  expect(next).toMatchObject({ id: child.id, note: child.note, stability: 5, assessedAt: '2026-11-10' });
  validateWorkspace(reconciled);
  const ownNull = setOwnAssessment(reconciled, child.id, { stability: null, assessedAt: null, note: child.note }, fixture.environment);
  const ownCopy = structuredClone(ownNull);
  reconcileInheritance(ownCopy);
  expect(ownCopy.athleteSkills.find((item) => item.id === child.id)).toMatchObject({ stability: null, assessedAt: null, assessmentOrigin: { kind: 'own' } });
  expect(() => validateWorkspace({ ...reconciled, athleteSkills: reconciled.athleteSkills.map((item) => item.id === child.id ? { ...item, stability: 1 } : item) })).toThrow();
});

it('kræver katalog-id og variant ved tvetydig officiel rytmekode', () => {
  const matches = DK_V2.rhythmCatalog.filter((item) => item.officialCode === 'DB804');
  expect(matches.map((item) => item.id)).toEqual(['rh-db-turn-leg90-540', 'rh-db-press-together']);
  expect(matches[0]!.options).not.toEqual(matches[1]!.options);
});

it('skelner in og out som præcise spring og afviser gættet skruefordeling', () => {
  const fixture = syntheticWorkspace();
  const element = {
    ...tumblingSkill.elements[0]!, rotationQuarterTurns: 8,
    bodyPositions: ['tuck', 'tuck'] as ['tuck', 'tuck'], twistsHalfTurns: 1,
    twistDistribution: [1, 0],
  };
  const definition = (id: string, distribution: number[]) => ({
    ...tumblingSkill, id, name: `Syntetisk ${id}`,
    elements: [{ ...element, twistDistribution: distribution }],
  });
  const inSkill = definition('skill-test-in', [1, 0]);
  const outSkill = definition('skill-test-out', [0, 1]);
  expect(skillIdentity(inSkill)).not.toBe(skillIdentity(outSkill));
  const withIn = registerAthleteSkill(fixture.workspace, fixture.athleteA.id, inSkill, fixture.environment);
  const withOut = registerAthleteSkill(withIn.workspace, fixture.athleteA.id, outSkill, fixture.environment);
  expect(withOut.athleteSkillId).not.toBe(withIn.athleteSkillId);
  expect(validateWorkspace(withOut.workspace).skills.map(skillIdentity)).toContain(skillIdentity(outSkill));
  expect(() => registerAthleteSkill(fixture.workspace, fixture.athleteA.id, definition('skill-test-uklar', []), fixture.environment)).toThrow();
});

it('omsætter en besluttet syntetisk note til tre ordnede omgange uden at ændre andre scenarier', () => {
  const { workspace: original, environment } = syntheticWorkspace();
  const plan = original.plans[0]!;
  const previous = structuredClone(plan.tumbling);
  let current = createScenario(original, plan.id, 'tumbling', plan.tumbling[0]!.id, 'Sikker A', environment);
  const scenario = current.plans[0]!.tumbling[1]!;
  const athleteIds = current.athletes.slice(0, 6).map((item) => item.id);
  for (const [index, round] of scenario.rounds.entries()) {
    const entries = athleteIds.map((athleteId, place) => ({
      id: `synthetic-entry-${index}-${place}`, athleteId,
      athleteSkillId: current.athleteSkills.find((item) => item.athleteId === athleteId && item.skillId === tumblingSkill.id)!.id,
      role: 'counting' as const,
    }));
    current = setRoundEntries(current, plan.id, 'tumbling', scenario.id, round.id, entries, limits, environment);
    const reserve = current.athletes[6]!;
    current = setRoundReserves(current, plan.id, 'tumbling', scenario.id, round.id, [{
      id: `synthetic-reserve-${index}`, athleteId: reserve.id,
      athleteSkillId: current.athleteSkills.find((item) => item.athleteId === reserve.id && item.skillId === tumblingSkill.id)!.id,
    }], environment);
  }
  const second = current.plans[0]!.tumbling[1]!.rounds[1]!;
  current = setPlannedSpot(current, plan.id, 'tumbling', scenario.id, second.id, second.entries[2]!.id, { grade: 'support' }, environment);
  const saved = validateWorkspace(JSON.parse(serializeWorkspace(current)));
  expect(saved.plans[0]!.tumbling[0]).toEqual(previous[0]);
  expect(saved.plans[0]!.trampet).toEqual(original.plans[0]!.trampet);
  expect(saved.plans[0]!.tumbling[1]!.rounds.map((round) => round.entries.map((entry) => entry.athleteId))).toEqual([athleteIds, athleteIds, athleteIds]);
  expect(saved.plans[0]!.tumbling[1]!.rounds[1]!.entries[2]!.plannedSpot).toEqual({ grade: 'support', skillId: tumblingSkill.id, elementIndex: null });
  const copied = duplicateScenario(saved, plan.id, 'tumbling', scenario.id, 'Sikker B', environment);
  const copy = copied.plans[0]!.tumbling[2]!;
  expect(copy.rounds.map((round) => round.entries.map((entry) => entry.athleteId))).toEqual([athleteIds, athleteIds, athleteIds]);
  expect(new Set(copy.rounds.flatMap((round) => [round.id, ...round.entries.map((entry) => entry.id), ...round.reserves.map((entry) => entry.id)])).size).toBe(24);
  expect(copy.id).not.toBe(scenario.id);
});

it('en syvende udførende ændrer den første plads til ekstra uanset angivne roller', () => {
  const { workspace, environment } = syntheticWorkspace();
  const plan = workspace.plans[0]!;
  const scenario = plan.tumbling[0]!;
  const round = scenario.rounds[0]!;
  const seventh = workspace.athletes[6]!;
  const registration = workspace.athleteSkills.find((item) => item.athleteId === seventh.id && item.skillId === tumblingSkill.id)!;
  const changed = setRoundEntries(workspace, plan.id, 'tumbling', scenario.id, round.id, [
    ...round.entries,
    { id: 'synthetic-seventh', athleteId: seventh.id, athleteSkillId: registration.id, role: 'counting' },
  ], limits, environment);
  expect(changed.plans[0]!.tumbling[0]!.rounds[0]!.entries.map((entry) => entry.role)).toEqual([
    'extra', 'counting', 'counting', 'counting', 'counting', 'counting', 'counting',
  ]);
  validateWorkspace(changed);
});
