import { expect, it } from 'vitest';
import { createWorkspace } from '@teamgym/domain';
import type { ElementExecution } from '@teamgym/domain';
import { DK_V1 } from '@teamgym/rules';
import { springLibrary } from '../../apps/web/src/spring-library';
import type { SpringDefinition } from '../../apps/web/src/spring-library';
import {
  EMPTY_CHAIN,
  chainOptions,
  chainPickLabel,
  chainPrefill,
  matchesChain,
  listedSpring,
  setChainPick,
  springListExclusion,
} from '../../apps/web/src/spring-chain-model';

const all = springLibrary(DK_V1, createWorkspace());
// Som i vælgeren: kun serier i listen.
const library = all.filter(listedSpring).map((choice) => choice.definition);
const tumbling = library.filter((d) => d.discipline === 'tumbling');
const trampet = library.filter((d) => d.discipline === 'trampet');

const el = (family: string, extra: Partial<ElementExecution> = {}): ElementExecution =>
  ({
    family,
    direction: 'forward',
    rotationQuarterTurns: family === 'salto' ? 4 : 2,
    twistsHalfTurns: 0,
    twistDistribution: [],
    bodyPositions: family === 'salto' ? ['tuck'] : [],
    ...extra,
  }) as ElementExecution;
const salto = (extra: Partial<ElementExecution> = {}) => el('salto', extra);
const series = (...elements: ElementExecution[]) =>
  ({ id: 's', name: 's', discipline: 'tumbling', elements }) as unknown as SpringDefinition;
const back = { direction: 'backward' } as const;

it('kæden afgrænser rondat → flik → strakt salto med varianter og typiske antal', () => {
  const first = chainOptions(tumbling, EMPTY_CHAIN, 0);
  expect(first.map((o) => o.label)).toContain('Rondat');
  let state = setChainPick(EMPTY_CHAIN, 0, { kind: 'roundoff' });
  const second = chainOptions(tumbling, state, 1);
  expect(second.map((o) => o.label)).toContain('Flik');
  state = setChainPick(state, 1, { kind: 'flic' });
  const third = chainOptions(tumbling, state, 2).find((o) => o.label === 'Strakt salto')!;
  expect(third.variants.map((v) => v.label)).toEqual(
    expect.arrayContaining(['Strakt salto', 'Strakt 1/1 (360°)']),
  );
  state = setChainPick(state, 2, { kind: third.kind });
  const matched = tumbling.filter((d) => matchesChain(d, state));
  expect(matched.length).toBe(third.count);
  expect(matched.map((d) => d.name)).toContain('Rondat – flik – strakt 1/1 (360°)');
  const full = third.variants.find((v) => v.label === 'Strakt 1/1 (360°)')!;
  expect(chainPickLabel(tumbling, 2, { kind: third.kind, variant: full.key })).toBe('Strakt 1/1 (360°)');
});

it('Byg selv forudfyldes kun med sammenhængende, entydige valg fra kædens start', () => {
  let state = setChainPick(EMPTY_CHAIN, 0, { kind: 'roundoff' });
  state = setChainPick(state, 1, { kind: 'flic' });
  const saltoKind = chainOptions(tumbling, state, 2).find((o) => o.label === 'Strakt salto')!;
  // Strakt salto uden variant er flertydig og stopper forudfyldningen.
  state = setChainPick(state, 2, { kind: saltoKind.kind });
  expect(chainPrefill(tumbling, state).map((e) => e.family)).toEqual(['roundoff', 'flic']);
  const full = saltoKind.variants.find((v) => v.label === 'Strakt 1/1 (360°)')!;
  state = setChainPick(state, 2, { kind: saltoKind.kind, variant: full.key });
  const filled = chainPrefill(tumbling, state);
  expect(filled.map((e) => e.family)).toEqual(['roundoff', 'flic', 'salto']);
  expect(filled[2]).toMatchObject({ twistsHalfTurns: 2, bodyPositions: ['straight'] });
  // Et hul i kæden: kun begyndelsen før hullet tages med.
  const gap = setChainPick(EMPTY_CHAIN, 1, { kind: 'flic' });
  expect(chainPrefill(tumbling, gap)).toEqual([]);
  const endingOnly = setChainPick(EMPTY_CHAIN, 'ending', { kind: saltoKind.kind, variant: full.key });
  expect(chainPrefill(tumbling, endingOnly)).toEqual([]);
});

it('spring frem: en senere plads og "slutter med" kan vælges uden mellemled og ryddes igen', () => {
  const kind = chainOptions(tumbling, EMPTY_CHAIN, 'ending').find((o) => o.label === 'Strakt salto')!.kind;
  let state = setChainPick(EMPTY_CHAIN, 'ending', { kind });
  state = setChainPick(state, 0, { kind: 'roundoff' });
  const matched = tumbling.filter((d) => matchesChain(d, state));
  expect(matched.length).toBeGreaterThan(0);
  expect(matched.every((d) => d.discipline === 'tumbling' && d.elements[0]!.family === 'roundoff')).toBe(
    true,
  );
  // Plads 2 uden plads 1: rondat – (hvad som helst) – strakt salto.
  const skip = setChainPick(setChainPick(EMPTY_CHAIN, 0, { kind: 'roundoff' }), 2, { kind });
  expect(skip.slots).toEqual([{ kind: 'roundoff' }, null, { kind }]);
  expect(tumbling.filter((d) => matchesChain(d, skip)).map((d) => d.name)).toContain(
    'Rondat – flik – strakt salto',
  );
  // Rydning fjerner tomme pladser i enden og giver alle spring igen.
  const cleared = setChainPick(setChainPick(skip, 2, null), 0, null);
  expect(cleared.slots).toEqual([]);
  const none = setChainPick(cleared, 'ending', null);
  expect(tumbling.filter((d) => matchesChain(d, none))).toHaveLength(tumbling.length);
});

it('tabellen over serier uden for listen rammer hver godkendt regel og intet typisk', () => {
  const x = springListExclusion;
  expect(x(series(salto({ rotationQuarterTurns: 8 })))).toBe('Start med dobbeltsalto');
  expect(x(series(salto({ rotationQuarterTurns: 8 }), el('roundoff')))).toBe('Start med dobbeltsalto');
  expect(x(series(el('handspring'), salto(), salto(back)))).toBe('Baglæns salto direkte efter forlæns salto');
  // Alt andet er åbent.
  expect(x(series(el('roundoff'), salto(back), salto()))).toBeNull();
  expect(x(series(el('roundoff'), salto({ rotationQuarterTurns: 8, ...back })))).toBeNull();
  expect(x(series(salto()))).toBeNull();
  expect(x(series(salto({ twistsHalfTurns: 3 }), el('flic')))).toBeNull();
  expect(x(series(salto({ twistsHalfTurns: 1, bodyPositions: ['straight'] }), el('whipback')))).toBeNull();
  expect(x(series(el('roundoff'), salto({ ...back, twistsHalfTurns: 4 })))).toBeNull();
  expect(x(series(el('handspring'), salto({ twistsHalfTurns: 5 })))).toBeNull();
  expect(trampet.every((d) => x(d) === null)).toBe(true);
  // Arbejdsrummets egne serier vises altid, også når de ligner en atypisk opskrift.
  expect(
    listedSpring({ definition: series(salto({ twistsHalfTurns: 3 }), el('flic')), fromWorkspace: true }),
  ).toBe(true);
  expect(
    library.some(
      (d) =>
        d.discipline === 'tumbling' &&
        d.elements[0]!.family === 'salto' &&
        d.elements[0]!.rotationQuarterTurns >= 8,
    ),
  ).toBe(false);
});

it('typiske kæder: startsalto → rondat/kraftspring/flyvespring, rondat → flik/whipback og dobbeltsaltoer med skrue', () => {
  const straight = chainOptions(tumbling, EMPTY_CHAIN, 0).find((o) => o.label === 'Strakt salto')!;
  const afterStart = chainOptions(tumbling, setChainPick(EMPTY_CHAIN, 0, { kind: straight.kind }), 1);
  expect(afterStart.map((o) => o.label)).toEqual(
    expect.arrayContaining(['Rondat', 'Kraftspring', 'Flyvespring']),
  );
  const ends = (lead: string) =>
    chainOptions(
      tumbling,
      setChainPick(setChainPick(EMPTY_CHAIN, 0, { kind: straight.kind }), 1, { kind: lead }),
      2,
    ).flatMap((o) => o.variants.map((v) => v.label));
  expect(ends('flyspring').sort()).toEqual(ends('handspring').sort());
  // Strakt helskrue som start har samme efterfølgere som de andre startsaltoer.
  const full = straight.variants.find((v) => v.label === 'Strakt 1/1 (360°)')!;
  const plain = straight.variants.find((v) => v.label === 'Strakt salto')!;
  const fullStart = setChainPick(EMPTY_CHAIN, 0, { kind: straight.kind, variant: full.key });
  expect(
    chainOptions(tumbling, fullStart, 1)
      .map((o) => o.label)
      .sort(),
  ).toEqual(
    chainOptions(tumbling, setChainPick(EMPTY_CHAIN, 0, { kind: straight.kind, variant: plain.key }), 1)
      .map((o) => o.label)
      .filter((label) => label !== 'Vejrmølle')
      .sort(),
  );
  const fullEnds = (lead: string) =>
    chainOptions(tumbling, setChainPick(fullStart, 1, { kind: lead }), 2).flatMap((o) =>
      o.variants.map((v) => v.label),
    );
  expect(fullEnds('handspring').sort()).toEqual(ends('handspring').sort());
  expect(fullEnds('handspring').filter((label) => /rudy|randy|2\/1/i.test(label))).toHaveLength(3);
  expect(fullEnds('roundoff').sort()).toEqual(ends('roundoff').sort());
  const roundoff = setChainPick(EMPTY_CHAIN, 0, { kind: 'roundoff' });
  expect(chainOptions(tumbling, roundoff, 1).map((o) => o.label)).toEqual(
    expect.arrayContaining(['Flik', 'Whipback']),
  );
  const startRw = setChainPick(setChainPick(EMPTY_CHAIN, 0, { kind: straight.kind }), 2, {
    kind: 'whipback',
  });
  expect(tumbling.filter((d) => matchesChain(d, startRw)).length).toBeGreaterThan(1);
  const double = chainOptions(tumbling, setChainPick(roundoff, 1, { kind: 'flic' }), 2).find(
    (o) => o.label === 'Dobbelt strakt',
  )!;
  expect(double.variants.map((v) => v.label)).toEqual(
    expect.arrayContaining([
      'Dobbelt strakt salto',
      'Dobbelt strakt 1/1 (360°)',
      'Dobbelt strakt 2/1 (720°)',
    ]),
  );
  const forward = chainOptions(tumbling, setChainPick(EMPTY_CHAIN, 0, { kind: 'handspring' }), 1).find(
    (o) => o.label === 'Dobbelt lukket',
  )!;
  expect(forward.variants.map((v) => v.label)).toEqual(expect.arrayContaining(['Dobbelt lukket 1/2 (180°)']));
});

it('valg tæller kun serier i listen', () => {
  const singles = chainOptions(tumbling, EMPTY_CHAIN, 0).reduce((sum, o) => sum + o.count, 0);
  expect(singles).toBe(tumbling.length);
  expect(all.length).toBeGreaterThan(library.length);
});

it('trampet går fra redskab til springtype og præcist spring', () => {
  expect(
    chainOptions(trampet, EMPTY_CHAIN, 0)
      .map((o) => o.label)
      .sort(),
  ).toEqual(['Med redskab', 'Uden redskab']);
  const withApparatus = setChainPick(EMPTY_CHAIN, 0, { kind: 'pegasus' });
  const types = chainOptions(trampet, withApparatus, 1);
  expect(types.map((o) => o.label).sort()).toEqual(['Overslag', 'Tsukahara']);
  const tsuka = types.find((o) => o.kind === 'tsukahara')!;
  expect(tsuka.variants.length).toBe(tsuka.count);
  expect(chainOptions(trampet, withApparatus, 2)).toEqual([]);
  expect(chainOptions(trampet, EMPTY_CHAIN, 'ending')).toEqual([]);
});
