import { expect, it } from 'vitest';
import { createWorkspace } from '@teamgym/domain';
import { DK_V1 } from '@teamgym/rules';
import {
  matchesSpring,
  springLibrary,
  springSearchRank,
  springRegistrationPlan,
} from '../../apps/web/src/spring-library';
import { filterSpringChoices, springPickerRows } from '../../apps/web/src/spring-picker-model';
import { EMPTY_CHAIN, chainSlotValue, setChainPick } from '../../apps/web/src/spring-chain-model';

const library = springLibrary(DK_V1, createWorkspace());
it('ambition og gymnast bruger samme filtre og rangerer en præcis begyndelse først', () => {
  const choice = library.find((item) => item.id === 'common-a3-f-08-rf')!;
  const kind = chainSlotValue(choice.definition, 0)!.kind;
  const chain = setChainPick(EMPTY_CHAIN, 0, { kind });
  const candidates = filterSpringChoices(library, 'tumbling', 'strakt rondat', chain, '', false, DK_V1);
  const rows = springPickerRows(library, candidates, [], 'strakt rondat');
  expect(rows.slice(0, 2).map((row) => row.definition.name)).toEqual(['Strakt salto – rondat', 'Strakt salto – rondat – flik']);
  expect(filterSpringChoices(library, 'tumbling', 'strakt rondat', chain, '99', false, DK_V1)).toEqual([]);
});
it.each(['strakt rondat', 'STRAKT RONDAT', 'strakt-rondat', 'strakt‑rondat', '  strakt   rondat  '])(
  'finder og prioriterer indgangen for %s',
  (query) => {
    const matches = library.filter((choice) => matchesSpring(choice, query));
    const rows = springPickerRows(library, matches, [], query);
    expect(rows[0]!.definition.name).toBe('Strakt salto – rondat');
    expect(rows[1]!.definition.name).toBe('Strakt salto – rondat – flik');
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
  expect(rows[0]!.definition.name).toBe('Strakt salto – rondat');
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

function best(query: string, choices = library) {
  return choices
    .filter((choice) => matchesSpring(choice, query))
    .sort((a, b) => springSearchRank(a, query)! - springSearchRank(b, query)!);
}

it.each(['rf 1/1', 'rondat flik hel', 'rondat flik 360', 'RF helskrue', 'rondat-flik-1/1'])(
  '%s giver Rondat – flik – strakt 1/1 (360°) først',
  (query) => {
    expect(best(query)[0]!.definition.name).toBe('Rondat – flik – strakt 1/1 (360°)');
  },
);

it('skrueord matcher kun det skrueantal, ordet betyder', () => {
  for (const query of ['1/1', 'hel', '360']) {
    const twists = best(query).flatMap((choice) =>
      choice.definition.discipline === 'trampet'
        ? [choice.definition.jump.twistsHalfTurns]
        : choice.definition.elements.map((element) => element.twistsHalfTurns),
    );
    expect(twists).toContain(2);
    for (const choice of best(query)) {
      const elements =
        choice.definition.discipline === 'trampet' ? [choice.definition.jump] : choice.definition.elements;
      expect(elements.some((element) => element.twistsHalfTurns === 2)).toBe(true);
    }
  }
  const half = library.find((choice) => choice.definition.name === 'Rondat – flik – strakt 1/2 (180°)')!;
  const oneAndHalf = library.find((choice) => choice.definition.name === 'Rondat – flik – strakt 1½ (540°)')!;
  for (const query of ['rf 1/1', 'rondat flik hel', 'rondat flik 360', 'halv']) {
    if (query !== 'halv') expect(matchesSpring(half, query)).toBe(false);
    expect(matchesSpring(oneAndHalf, query)).toBe(false);
  }
  expect(matchesSpring(oneAndHalf, '1,5')).toBe(true);
  expect(matchesSpring(oneAndHalf, 'halvanden')).toBe(true);
});

it('kraft barani finder kraft-barani først, også når arbejdsrummet har et gammelt automatisk navn', () => {
  expect(best('kraft barani')[0]!.definition.name).toBe('Kraftspring – barani (strakt 180°)');
  const source = library.find((choice) => choice.id === 'common-h-barani')!.definition;
  const stored = springLibrary(DK_V1, { skills: [{ ...source, name: 'Kraftspring – barani' }] });
  expect(best('kraft barani', stored)[0]!.definition.name).toBe('Kraftspring – barani (strakt 180°)');
  expect(best('kraftspring barani')[0]!.definition.name).toBe('Kraftspring – barani (strakt 180°)');
});

it('lukket barani samler egenskaberne på samme salto og retning skelnes', () => {
  const lukket = best('lukket barani');
  expect(lukket[0]!.definition.name).toBe('Barani (lukket 180°)');
  for (const choice of lukket) {
    const elements =
      choice.definition.discipline === 'trampet' ? [choice.definition.jump] : choice.definition.elements;
    expect(
      elements.some((element) => element.bodyPositions.includes('tuck') && element.twistsHalfTurns === 1),
    ).toBe(true);
  }
  expect(best('db')[0]!.definition.name).toMatch(/dobbelt/i);
  for (const choice of best('db')) {
    const elements =
      choice.definition.discipline === 'trampet' ? [choice.definition.jump] : choice.definition.elements;
    expect(
      elements.some((element) => element.rotationQuarterTurns === 8 && element.direction === 'backward'),
    ).toBe(true);
  }
  expect(
    best('rondat salto salto forlæns').some(
      (choice) => choice.definition.name === 'Rondat – lukket salto – lukket salto',
    ),
  ).toBe(false);
});
