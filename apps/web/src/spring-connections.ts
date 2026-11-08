import type { ElementExecution } from '@teamgym/domain';
import { knownSeries } from '@teamgym/rules';
export { knownSeries, standardTransition } from '@teamgym/rules';

/** Praktiske forbindelsesfamilier præciseret af træneren 2026-10-25.
 * Samme klassifikation bruges af springvælgeren og de korrigerede regelpakker.
 * Elementværdier og regelbinding ændres ikke.
 */
export const CONNECTION_CATALOG_VERSION = 'coach-connections-5';

export type PracticalConnectionStatus = 'known' | 'problematic' | 'unverified';

/** Forbindelsesviden vises her; regelpakkens elementværdier beregnes særskilt. */
export function practicalConnectionStatus(elements: readonly ElementExecution[]): PracticalConnectionStatus {
  if (knownSeries(elements)) return 'known';
  if (elements.slice(1).some((after, index) => {
    const before = elements[index]!;
    return before.family === 'salto' && before.direction === 'backward' && after.family === 'cartwheel';
  })) return 'problematic';
  return 'unverified';
}

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

export function connectionHint(elements: readonly ElementExecution[]): string | null {
  for (let index = 1; index < elements.length; index++) {
    const before = elements[index - 1]!;
    const after = elements[index]!;
    if (before.family === 'salto' && before.direction === 'backward' && after.family === 'cartwheel')
      return 'Baglæns salto efterfulgt af vejrmølle er en kendt problematisk forbindelse. Vurder den konkrete kæde, før den bruges i en plan.';
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
