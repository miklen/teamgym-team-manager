import { describe, expect, it } from 'vitest';
import { DK_V1 } from '@teamgym/rules';
import type { ElementExecution } from '@teamgym/domain';
import { springCatalogElementName, springExecutionName } from '../../apps/web/src/spring-names';

function element(referenceId: string): ElementExecution {
  const found = DK_V1.springCatalog.find((entry) => entry.referenceId === referenceId);
  if (!found) throw new Error(`Testens element mangler: ${referenceId}`);
  return structuredClone(found.execution);
}
const bane = (...ids: string[]) => springExecutionName('tumbling', ids.map(element));
const trampet = (id: string, change: Partial<ElementExecution> = {}) =>
  springExecutionName('trampet', [{ ...element(id), ...change }]);

describe('fælles springnavne', () => {
  it('navngiver baneserier med faste elementnavne, kaldenavne og skruebrøker', () => {
    expect(bane('a3-f-02', 'a3-f-13')).toBe('Kraftspring – barani (strakt 180°)');
    expect(bane('a3-f-08', 'a3-f-02', 'a3-f-13')).toBe('Strakt salto – kraftspring – barani (strakt 180°)');
    expect(bane('a3-b-01', 'a3-b-02', 'a3-b-11')).toBe('Rondat – flik – strakt 1/1 (360°)');
    expect(bane('a3-f-10', 'a3-b-02')).toBe('Barani (lukket 180°) – flik');
    expect(bane('a3-f-08', 'a3-b-01')).toBe('Strakt salto – rondat');
    expect(bane('a3-b-01', 'a3-b-03', 'a3-b-12')).toBe('Rondat – whipback – strakt 1½ (540°)');
    expect(bane('a3-f-01')).toBe('Vejrmølle');
    expect(bane('a3-f-03', 'a3-f-18')).toBe('Flyvespring – randy (strakt 900°)');
  });

  it('viser kun retning, når saltoen går imod det forventede', () => {
    expect(bane('a3-b-01', 'a3-b-04', 'a3-f-08')).toBe('Rondat – lukket salto – strakt salto forlæns');
    expect(bane('a3-b-01', 'a3-b-04', 'a3-b-06')).toBe('Rondat – lukket salto – strakt salto');
    expect(bane('a3-f-02', 'a3-f-04')).toBe('Kraftspring – lukket salto');
    expect(bane('a3-f-02', 'a3-b-04')).toBe('Kraftspring – lukket salto baglæns');
    expect(trampet('a4-f-01', { direction: 'backward' })).toBe('Lukket salto baglæns');
    expect(trampet('a4-f-01', { direction: 'sideways' })).toBe('Lukket salto sidelæns');
  });

  it('samler ens kropsstillinger, viser skiftende stillinger og skruefordeling', () => {
    expect(trampet('a4-f-11')).toBe('Dobbelt lukket salto');
    expect(trampet('a4-f-14', { twistDistribution: [0, 1] })).toBe('Dobbelt lukket 1/2 (180°) · out');
    expect(trampet('a4-f-11', { bodyPositions: ['tuck', 'straight'] })).toBe('Dobbelt lukket → strakt salto');
    expect(bane('a3-b-01', 'a3-b-22')).toBe('Rondat – dobbelt strakt 3/1 (1080°)');
    expect(trampet('a4-f-21')).toBe('Trippel lukket 1/2 (180°)');
  });

  it('bruger kaldenavne kun for forlæns enkeltsaltoer med ulige halve skruer', () => {
    expect(trampet('a4-f-08')).toBe('Rudy (strakt 540°)');
    expect(bane('a3-f-02', 'a3-f-16')).toBe('Kraftspring – rudy (strakt 540°)');
    expect(trampet('a4-f-10')).toBe('Randy (strakt 900°)');
    expect(trampet('a4-f-08', { twistsHalfTurns: 7, twistDistribution: [7] })).toBe('Addy (strakt 1260°)');
    expect(trampet('a4-f-04')).toBe('Barani (lukket 180°)');
    expect(trampet('a4-f-07')).toBe('Strakt 1/1 (360°)');
    expect(trampet('a4-f-16')).toBe('Dobbelt lukket 1½ (540°)');
    expect(bane('a3-b-01', 'a3-b-12')).toBe('Rondat – strakt 1½ (540°)');
  });

  it('navngiver redskabsspring med overslag og tsukahara foran saltoen', () => {
    expect(trampet('a4-v-01')).toBe('Mølleoverslag');
    expect(trampet('a4-v-02')).toBe('Overslag');
    expect(trampet('a4-v-08')).toBe('Overslag lukket salto');
    expect(trampet('a4-v-14')).toBe('Overslag rudy (strakt 540°)');
    expect(trampet('a4-v-03')).toBe('Tsukahara lukket salto');
    expect(trampet('a4-v-06')).toBe('Tsukahara strakt 1/1 (360°)');
    expect(trampet('a4-v-20')).toBe('Overslag dobbelt lukket 1/2 (180°)');
  });

  it('katalogets startsalto kan skelnes fra samme udførelse i Byg selv', () => {
    const [plain, start] = ['a3-f-08', 'a3-f-09'].map((id) =>
      DK_V1.springCatalog.find((entry) => entry.referenceId === id)!,
    );
    expect(springCatalogElementName(plain!.execution, { start: plain!.startRole })).toBe(
      'Strakt salto forlæns',
    );
    expect(springCatalogElementName(start!.execution, { start: start!.startRole })).toBe(
      'Strakt salto forlæns · start',
    );
  });
});
