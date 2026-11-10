import { expect, it } from 'vitest';
import {
  createAthlete,
  createWorkspace,
  registerAthleteSkill,
  setArchived,
  setOwnAssessment,
  skillIdentity,
} from '@teamgym/domain';
import type { Round, Workspace } from '@teamgym/domain';
import { DK_V1 } from '@teamgym/rules';
import { matchesSpring, springLibrary, springRegistrationPlan } from '../../apps/web/src/spring-library';
import {
  matchesDirection,
  roundIdentityUsage,
  springPickerRows,
  springPurity,
  sortByTeamKnown,
  teamSkillRows,
  teamSpringCounts,
} from '../../apps/web/src/spring-picker-model';
import { syntheticWorkspace } from '../fixtures/synthetic-workspace';

const library = springLibrary(DK_V1, createWorkspace());
const full = library.find((choice) => choice.id === 'common-rf-full')!.definition;
const half = library.find((choice) => choice.id === 'common-rf-a3-b-10')!.definition;

it('samler bibliotek, direkte valg og fundament til én række pr. identitet', () => {
  const plan = springRegistrationPlan([{ definition: full, stability: 4, confirmed: true }], DK_V1, true);
  const rows = springPickerRows(library, library, plan);
  expect(new Set(rows.map((row) => row.identity)).size).toBe(rows.length);
  expect(new Set(rows.map((row) => row.key)).size).toBe(rows.length);
  for (const item of plan)
    expect(rows.filter((row) => row.identity === skillIdentity(item.definition))).toHaveLength(1);
  expect(rows[0]!.planned?.explicit).toBe(true);
});

it('delt fundament og fravalg findes én gang og bevares, når alle katalogresultater filtreres væk', () => {
  const selections = [
    { definition: full, stability: 5 as const, confirmed: true },
    { definition: half, stability: 2 as const, confirmed: true },
  ];
  const original = springRegistrationPlan(selections, DK_V1, true);
  const identity = skillIdentity(original.find((row) => !row.explicit)!.definition);
  const plan = springRegistrationPlan(selections, DK_V1, true, { excluded: [identity] });
  const rows = springPickerRows(library, [], plan);
  expect(rows).toHaveLength(7);
  expect(rows.find((row) => row.identity === identity)?.planned).toMatchObject({
    excluded: true,
    sourceIdentity: skillIdentity(half),
    stability: 2,
  });
  expect(new Set(rows.map((row) => row.identity)).size).toBe(rows.length);
});

it('præciseret dobbeltvalg erstatter den upræciserede katalogrække frem for at gentage springet', () => {
  const template = library.find(
    (choice) =>
      choice.definition.discipline === 'trampet' &&
      choice.definition.jump.family === 'salto' &&
      choice.definition.jump.rotationQuarterTurns === 8 &&
      choice.definition.jump.twistsHalfTurns === 3 &&
      choice.definition.jump.bodyPositions.every((position) => position === 'tuck'),
  )!;
  if (template.definition.discipline !== 'trampet') throw Error('fixture');
  const definition = {
    ...template.definition,
    jump: { ...template.definition.jump, twistDistribution: [2, 1] },
  };
  const plan = springRegistrationPlan([{ definition, stability: 3, confirmed: true }], DK_V1, true);
  const rows = springPickerRows(library, library, plan);
  expect(rows.filter((row) => row.choice?.id === template.id)).toHaveLength(1);
  expect(rows.find((row) => row.choice?.id === template.id)?.definition).toEqual(definition);
  expect(rows.find((row) => row.choice?.id === template.id)?.key).toBe(template.id);
  const second = { ...definition, jump: { ...definition.jump, twistDistribution: [3, 0] } };
  const variants = springPickerRows(
    library,
    library,
    springRegistrationPlan(
      [
        { definition, stability: 3, confirmed: true },
        { definition: second, stability: 4, confirmed: true },
      ],
      DK_V1,
      true,
    ),
  );
  expect(variants.filter((row) => row.choice?.id === template.id)).toHaveLength(2);
  expect(new Set(variants.map((row) => row.key)).size).toBe(variants.length);
});

it('samme kandidat tilbydes ikke to gange, selv om indgangen gentages med et alias', () => {
  const choice = library[0]!;
  const rows = springPickerRows(
    library,
    [
      choice,
      { ...choice, id: 'synthetic-alias', definition: { ...choice.definition, name: 'Syntetisk alias' } },
    ],
    [],
  );
  expect(rows).toHaveLength(1);
});

const tumbling = library.filter((choice) => choice.definition.discipline === 'tumbling');
it('holdkendte spring står efter valgte og før øvrige; andre hold og arkiverede tæller ikke', () => {
  const fixture = syntheticWorkspace();
  let workspace = fixture.workspace;
  const known = library.find((choice) => choice.id === 'common-sh-barani')!.definition;
  const plainBarani = library.find((choice) => choice.id === 'common-h-barani')!.definition;
  const [first, second, third] = workspace.athletes.filter((athlete) => athlete.id !== fixture.athleteA.id);
  for (const athlete of [first!, second!])
    workspace = registerAthleteSkill(workspace, athlete.id, {
      ...known,
      id: `skill-${athlete.id}`,
    }).workspace;
  const archived = registerAthleteSkill(workspace, third!.id, { ...half, id: 'skill-archived' });
  workspace = setArchived(archived.workspace, 'athleteSkills', archived.athleteSkillId, true);
  workspace = createAthlete(workspace, {
    name: 'Syntetisk anden',
    discriminator: 'B',
    teamId: fixture.teamB.id,
  });
  const other = workspace.athletes.at(-1)!;
  workspace = registerAthleteSkill(workspace, other.id, { ...half, id: 'skill-other-team' }).workspace;
  const counts = teamSpringCounts(workspace, fixture.teamA.id, fixture.athleteA.id);
  expect(counts.get(skillIdentity(known))).toBe(2);
  expect(counts.has(skillIdentity(half))).toBe(false);
  const self = teamSpringCounts(workspace, fixture.teamA.id, first!.id);
  expect(self.get(skillIdentity(known))).toBe(1);
  expect(teamSpringCounts(workspace, null).size).toBe(0);

  const plan = springRegistrationPlan([{ definition: full, stability: 4, confirmed: true }], DK_V1, false);
  const rows = springPickerRows(library, tumbling, plan, '', counts);
  expect(rows[0]!.identity).toBe(skillIdentity(full));
  const firstUnplanned = rows.find((row) => !row.planned)!;
  expect(firstUnplanned.identity).toBe(skillIdentity(known));
  // Med søgning går rangen forud; holdet afgør kun ved lige rang.
  const barani = tumbling.filter((choice) => matchesSpring(choice, 'barani'));
  const order = (rows: ReturnType<typeof springPickerRows>) =>
    rows
      .map((row) => row.identity)
      .filter((id) => [skillIdentity(known), skillIdentity(plainBarani)].includes(id));
  expect(order(springPickerRows(library, barani, [], 'barani'))).toEqual([
    skillIdentity(plainBarani),
    skillIdentity(known),
  ]);
  expect(order(springPickerRows(library, barani, [], 'barani', counts))).toEqual([
    skillIdentity(known),
    skillIdentity(plainBarani),
  ]);
  // En bedre søgerang slår holdkendskab.
  const exact = springPickerRows(library, barani, [], 'kraft barani', counts);
  expect(exact[0]!.identity).toBe(skillIdentity(plainBarani));
  // Ambitionskataloget: holdkendte først, ellers uændret rækkefølge.
  const catalog = sortByTeamKnown(tumbling, counts);
  expect(catalog[0]!.definition).toEqual(known);
  expect(catalog.slice(1)).toEqual(
    tumbling.filter((choice) => skillIdentity(choice.definition) !== skillIdentity(known)),
  );
  // Afledt: arbejdsrummet ændres ikke.
  expect(workspace.skills.some((skill) => 'teamCount' in skill)).toBe(false);
});

function teamFixture() {
  const fixture = syntheticWorkspace();
  let workspace = fixture.workspace;
  const [, , a, b, c, d, e] = workspace.athletes;
  for (const [athlete, stability] of [[a!, 4], [b!, 2], [c!, null], [d!, 3]] as const) {
    const added = registerAthleteSkill(workspace, athlete.id, full);
    workspace = stability
      ? setOwnAssessment(added.workspace, added.athleteSkillId, { stability, assessedAt: '2026-10-25', note: '' })
      : added.workspace;
  }
  // c og d har afledte registreringer; de tæller som egne.
  const derived = new Set([c!.id, d!.id]);
  workspace = {
    ...workspace,
    athleteSkills: workspace.athleteSkills.map((item) =>
      derived.has(item.athleteId) && workspace.skills.find((skill) => skill.id === item.skillId)?.name === full.name
        ? { ...item, assessmentOrigin: { kind: 'inherited' as const, sourceId: null, sourceChoice: null } }
        : item,
    ),
  };
  workspace = registerAthleteSkill(workspace, e!.id, half).workspace;
  return { ...fixture, workspace, a: a!, b: b!, c: c!, d: d!, e: e! };
}

it('holdets spring: én række pr. identitet, ledige med bedste registrering og antal placerede', () => {
  const { workspace, teamA, a, b, c, d, e } = teamFixture();
  const free = [a.id, b.id, c.id, e.id];
  const rows = teamSkillRows(workspace, teamA.id, 'tumbling', DK_V1, free);
  expect(new Set(rows.map((row) => row.identity)).size).toBe(rows.length);
  const fullIdentity = DK_V1.evaluateSkill(full).identity;
  const row = rows.find((item) => item.identity === fullIdentity)!;
  expect(row.available.map((item) => item.athleteId)).toEqual([a.id, b.id, c.id]);
  expect(row.available.map((item) => item.stability)).toEqual([4, 2, null]);
  expect(row.placed).toEqual([d.id]);
  expect(row.difficulty?.toString()).toBe(DK_V1.evaluateSkill(full).difficulty.value?.toString());
  // Flest ledige først: den syntetiske baneserie (4) før rondat-serien (3).
  expect(rows.slice(0, 2).map((item) => item.available.length)).toEqual([4, 3]);
  expect(rows[1]!.identity).toBe(fullIdentity);
  // Den syntetiske baneserie kan alle otte; kun ledige tæller.
  const synthetic = rows.find((item) => item.identity === DK_V1.evaluateSkill(workspace.skills.find((skill) => skill.id === 'skill-tumbling') as typeof full).identity)!;
  expect(synthetic.available).toHaveLength(4);
  expect(synthetic.placed).toHaveLength(4);
  // Spring uden ledige gymnaster udelades.
  const none = teamSkillRows(workspace, teamA.id, 'tumbling', DK_V1, [e.id, d.id].filter((id) => id !== d.id));
  expect(none.some((item) => item.identity === fullIdentity)).toBe(false);
  expect(none.find((item) => item.identity === DK_V1.evaluateSkill(half).identity)?.available).toHaveLength(1);
  expect(teamSkillRows(workspace, teamA.id, 'trampet', DK_V1, free).every((item) => item.identity !== fullIdentity)).toBe(true);
  // Bedste registrering pr. gymnast ved flere registreringer af samme identitet.
  const second = registerAthleteSkill(workspace, b.id, { ...full, id: 'skill-full-copy', name: 'Syntetisk kopi' });
  const twice = teamSkillRows(second.workspace, teamA.id, 'tumbling', DK_V1, free).find((item) => item.identity === fullIdentity)!;
  expect(twice.available.filter((item) => item.athleteId === b.id)).toHaveLength(1);
});

it('retningsfilteret følger C-RETNING: kun serier, hvor alle elementer går samme vej', () => {
  if (full.discipline !== 'tumbling') throw Error('fixture');
  const forward = library.find(
    (choice) =>
      choice.definition.discipline === 'tumbling' &&
      choice.definition.elements.length > 1 &&
      choice.definition.elements.every((element) => element.direction === 'forward'),
  )!.definition;
  const mixed = {
    ...full,
    elements: full.elements.map((element, index) =>
      index === full.elements.length - 1 ? { ...element, direction: 'forward' as const } : element,
    ),
  };
  expect(springPurity(DK_V1.evaluateSkill(full))).toBe('backward');
  expect(springPurity(DK_V1.evaluateSkill(forward))).toBe('forward');
  expect(springPurity(DK_V1.evaluateSkill(mixed))).toBeNull();
  expect(matchesDirection(null, 'all')).toBe(true);
  expect(matchesDirection(null, 'forward')).toBe(false);
  expect(matchesDirection('backward', 'forward')).toBe(false);
  expect(matchesDirection('backward', 'backward')).toBe(true);
  const { workspace, teamA, a } = teamFixture();
  const row = teamSkillRows(workspace, teamA.id, 'tumbling', DK_V1, [a.id]).find(
    (item) => item.identity === DK_V1.evaluateSkill(full).identity,
  );
  expect(row?.purity).toBe('backward');
});

function round(entries: Round['entries']): Pick<Round, 'entries'> {
  return { entries };
}

it('brug pr. omgang følger C-GENTAG og udelader ekstra, reserver og den redigerede plads', () => {
  const { workspace, teamA, a, b, c } = teamFixture();
  const registration = (athleteId: string) =>
    workspace.athleteSkills.find(
      (item) => item.athleteId === athleteId && workspace.skills.find((skill) => skill.id === item.skillId)?.discipline === 'tumbling' && DK_V1.evaluateSkill(workspace.skills.find((skill) => skill.id === item.skillId) as typeof full).identity === DK_V1.evaluateSkill(full).identity,
    )!.id;
  const fullSkillId = workspace.athleteSkills.find((item) => item.id === registration(a.id))!.skillId;
  const entry = (id: string, athleteId: string | null, role: 'counting' | 'extra' = 'counting') => ({
    id,
    athleteId,
    athleteSkillId: athleteId ? registration(athleteId) : null,
    role,
    plannedSpot: null,
    plannedSkillId: athleteId ? null : fullSkillId,
  });
  const rounds = [
    round([]),
    round([entry('e1', a.id), entry('e2', b.id), entry('ambition', null), entry('extra', c.id, 'extra')]),
    round([entry('e3', c.id)]),
  ];
  const identity = DK_V1.evaluateSkill(full).identity;
  const usage = roundIdentityUsage(workspace, teamA.id, 'tumbling', DK_V1, rounds);
  expect(usage.get(identity)).toEqual([0, 3, 1]);
  expect(roundIdentityUsage(workspace, teamA.id, 'tumbling', DK_V1, rounds, 'e3').get(identity)).toEqual([0, 3, 0]);
  const withoutAmbition = rounds.map((item) => round(item.entries.filter((entry) => entry.athleteId !== null)));
  expect(roundIdentityUsage(workspace, teamA.id, 'tumbling', DK_V1, withoutAmbition).get(identity)).toEqual([0, 2, 1]);
  // Reserver indgår ikke i omgangens pladser.
  const reserves = [round([]), round([]), round([])].map((item) => ({ ...item, reserves: [{ id: 'r', athleteId: a.id, athleteSkillId: registration(a.id) }] }));
  expect(roundIdentityUsage(workspace, teamA.id, 'tumbling', DK_V1, reserves).size).toBe(0);
  // Afledt: arbejdsrummet ændres ikke.
  expect((workspace as Workspace).plans).toEqual(teamFixture().workspace.plans);
});
