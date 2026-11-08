import type { ElementExecution } from '@teamgym/domain';

/** Trænerens katalog over kendte baneovergange; ændrer ikke elementernes D-værdier. */
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
    before.direction === 'backward' &&
    before.rotationQuarterTurns === 4 &&
    before.twistsHalfTurns === 0
  )
    return (
      after.family === 'salto' &&
      after.rotationQuarterTurns === 4 &&
      (after.direction === 'backward' || after.direction === 'forward')
    );
  if (
    before.family === 'salto' &&
    before.direction === 'forward' &&
    before.rotationQuarterTurns >= 4 &&
    before.rotationQuarterTurns % 4 === 0
  ) {
    if (before.rotationQuarterTurns === 4 && before.twistsHalfTurns === 0 &&
      before.bodyPositions.length === 1 && after.family === 'cartwheel') return true;
    // Hele skruer bevarer front til rondat/kraft/flyvespring; ulige halve skruer vender til flik/whip.
    return before.twistsHalfTurns % 2 === 0
      ? after.family === 'roundoff' || after.family === 'handspring' || after.family === 'flyspring'
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
