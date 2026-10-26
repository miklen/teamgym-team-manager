import { expect, it } from 'vitest';
import { createWorkspace } from '@teamgym/domain';
import { DK_V1 } from '@teamgym/rules';
import {
  matchesSpring,
  springLibrary,
  springSearchRank,
  springRegistrationPlan,
} from '../../apps/web/src/spring-library';
import { springPickerRows } from '../../apps/web/src/spring-picker-model';

const library = springLibrary(DK_V1, createWorkspace());
it.each(['strakt rondat', 'STRAKT RONDAT', 'strakt-rondat', 'strakt‑rondat', '  strakt   rondat  '])(
  'finder og prioriterer indgangen for %s',
  (query) => {
    const matches = library.filter((choice) => matchesSpring(choice, query));
    const rows = springPickerRows(library, matches, [], query);
    expect(rows[0]!.definition.name).toBe('Strakt – rondat');
    expect(rows[1]!.definition.name).toBe('Strakt – rondat – flik');
    const ordinary = library.find((choice) => choice.id === 'common-rf-full')!;
    expect(
      springSearchRank(
        library.find((choice) => choice.id === 'common-a3-f-08-rf')!,
        query,
      ),
    ).toBeLessThan(springSearchRank(ordinary, query)!);
  },
);

it('sammenhængende ord prioriteres foran ikke-matchende valg, som stadig bevares én gang', () => {
  const selected = library.find((choice) => choice.id === 'common-rf-full')!.definition;
  const plan = springRegistrationPlan([{ definition: selected, stability: 3, confirmed: true }], DK_V1, true);
  const rows = springPickerRows(
    library,
    library.filter((choice) => matchesSpring(choice, 'strakt rondat')),
    plan,
    'strakt rondat',
  );
  expect(rows[0]!.definition.name).toBe('Strakt – rondat');
  expect(rows.filter((row) => row.planned)).toHaveLength(6);
  expect(new Set(rows.map((row) => row.identity)).size).toBe(rows.length);
});

it('egne navne kan findes via den præcise series kanoniske navn uden at omskrive navnet', () => {
  const source = library.find((choice) => choice.id === 'common-a3-f-08-rf-a3-b-11')!.definition;
  const own = springLibrary(DK_V1, { skills: [{ ...source, name: 'Syntetisk favoritserie' }] });
  const choice = own.find((item) => item.definition.name === 'Syntetisk favoritserie')!;
  expect(matchesSpring(choice, 'strakt rondat')).toBe(true);
  expect(choice.definition.name).toBe('Syntetisk favoritserie');
});
