import { expect, it } from 'vitest';
import {
  createAthlete,
  createWorkspace,
  registerAthleteSkill,
  setArchived,
  skillIdentity,
} from '@teamgym/domain';
import { DK_V1 } from '@teamgym/rules';
import { matchesSpring, springLibrary, springRegistrationPlan } from '../../apps/web/src/spring-library';
import {
  springPickerRows,
  sortByTeamKnown,
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
