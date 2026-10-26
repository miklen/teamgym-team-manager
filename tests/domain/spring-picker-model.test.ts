import { expect, it } from 'vitest';
import { createWorkspace, skillIdentity } from '@teamgym/domain';
import { DK_V1 } from '@teamgym/rules';
import { springLibrary, springRegistrationPlan } from '../../apps/web/src/spring-library';
import { springPickerRows } from '../../apps/web/src/spring-picker-model';

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
