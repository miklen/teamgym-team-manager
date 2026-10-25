import type { ElementExecution } from '@teamgym/domain';

/** Praktiske forbindelsesfamilier præciseret af træneren 2026-10-25.
 * Adskilt fra den uforanderlige DK-regelpakke: ændrer hverken D/C eller regelbinding.
 */
export const CONNECTION_CATALOG_VERSION = 'coach-connections-2';

/** Færdige banevalg skal have en indgang fra tilløb; afslutningselementer hører til i byggeren. */
export function canStartFloorSeries(elements: readonly ElementExecution[]): boolean {
  const first = elements[0];
  return (
    !!first &&
    first.apparatus === 'floor' &&
    (['cartwheel', 'roundoff', 'handspring', 'flyspring'].includes(first.family) ||
      (first.family === 'salto' && first.direction === 'forward'))
  );
}

export function standardTransition(before: ElementExecution, after: ElementExecution): boolean {
  if (
    before.apparatus !== 'floor' ||
    after.apparatus !== 'floor' ||
    before.landing !== 'feet' ||
    after.landing !== 'feet'
  )
    return false;
  const backFollow =
    after.family === 'flic' ||
    after.family === 'whipback' ||
    (after.family === 'salto' && after.direction === 'backward');
  if (['roundoff', 'flic', 'whipback'].includes(before.family) && before.twistsHalfTurns % 2 === 0)
    return backFollow;
  if (['handspring', 'flyspring'].includes(before.family) && before.twistsHalfTurns % 2 === 0)
    return after.family === 'salto' && after.direction === 'forward';
  if (
    before.family === 'salto' &&
    before.direction === 'forward' &&
    before.rotationQuarterTurns >= 4 &&
    before.rotationQuarterTurns % 4 === 0
  ) {
    // Hele skruer bevarer front til rondat/kraft; ulige halve skruer vender til flik/whip.
    return before.twistsHalfTurns % 2 === 0
      ? after.family === 'roundoff' || after.family === 'handspring'
      : after.family === 'flic' || after.family === 'whipback';
  }
  return false;
}

export function knownSeries(elements: readonly ElementExecution[]): boolean {
  return (
    elements.length > 0 &&
    elements.every((element) => element.apparatus === 'floor' && element.landing === 'feet') &&
    elements.slice(1).every((element, index) => standardTransition(elements[index]!, element))
  );
}

export function connectionHint(elements: readonly ElementExecution[]): string | null {
  for (let index = 1; index < elements.length; index++) {
    const before = elements[index - 1]!;
    const after = elements[index]!;
    if (
      ['roundoff', 'flic', 'whipback'].includes(before.family) &&
      after.family === 'salto' &&
      after.direction === 'forward'
    ) {
      return `Element ${index + 1} er valgt som forlæns salto efter ${before.family === 'roundoff' ? 'rondat' : before.family === 'flic' ? 'flik' : 'whipback'}. Til en almindelig baglæns afslutning skal du vælge den baglæns variant i kataloget.`;
    }
  }
  return null;
}
