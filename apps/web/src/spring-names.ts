import type { ElementExecution, SkillDefinition } from '@teamgym/domain';

type SpringSkill = Exclude<SkillDefinition, { discipline: 'rhythm' }>;
type Direction = ElementExecution['direction'];

export interface SpringLabelContext {
  /** Forventet saltoretning ud fra det foregående element. `null` viser altid retningen. */
  expected: Direction | null;
}

const FIXED: Record<string, string> = {
  roundoff: 'rondat',
  flic: 'flik',
  whipback: 'whipback',
  handspring: 'kraftspring',
  flyspring: 'flyvespring',
  cartwheel: 'vejrmølle',
  'handspring-vault': 'overslag',
  'cartwheel-vault': 'mølleoverslag',
};
const BODY = { tuck: 'lukket', pike: 'hoftebøjet', straight: 'strakt' } as const;
export const SPRING_NICKNAMES: Readonly<Record<number, string>> = {
  1: 'barani',
  3: 'rudy',
  5: 'randy',
  7: 'addy',
};
const DIRECTION_WORD: Record<Direction, string> = {
  forward: 'forlæns',
  backward: 'baglæns',
  sideways: 'sidelæns',
};

export function isSaltoFamily(family: string) {
  return family === 'salto' || family === 'overslag-salto' || family === 'tsukahara';
}

/** Antal saltorotationer uden overslagets egen rotation. */
export function saltoRotations(element: ElementExecution) {
  return element.rotationQuarterTurns / 4 - (element.family === 'salto' ? 0 : 1);
}

export function twistFraction(halfTurns: number) {
  return halfTurns % 2 === 0 ? `${halfTurns / 2}/1` : halfTurns === 1 ? '1/2' : `${(halfTurns - 1) / 2}½`;
}

export function springNickname(element: ElementExecution): string | null {
  if (
    !isSaltoFamily(element.family) ||
    element.family === 'tsukahara' ||
    element.direction !== 'forward' ||
    saltoRotations(element) !== 1 ||
    element.bodyPositions.length !== 1
  )
    return null;
  return SPRING_NICKNAMES[element.twistsHalfTurns] ?? null;
}

function bodyText(element: ElementExecution) {
  const positions = element.bodyPositions.filter(
    (position, index, all) => index === 0 || position !== all[index - 1],
  );
  return positions.map((position) => BODY[position]).join(' → ');
}

/** Retningen, et saltoelement forventes at have efter `previous` på bane eller som trampetspring. */
export function expectedDirection(
  previous: ElementExecution | null | undefined,
  element?: ElementExecution,
): Direction {
  if (element?.family === 'tsukahara') return 'backward';
  if (!previous) return 'forward';
  if (['roundoff', 'flic', 'whipback'].includes(previous.family)) return 'backward';
  if (['handspring', 'flyspring'].includes(previous.family)) return 'forward';
  if (isSaltoFamily(previous.family)) return previous.direction === 'backward' ? 'backward' : 'forward';
  return 'forward';
}

/** Ét elements navn i den fælles grammatik med lille begyndelsesbogstav. */
export function springElementLabel(element: ElementExecution, context: SpringLabelContext): string {
  const fixed = FIXED[element.family];
  if (fixed) return fixed;
  if (!isSaltoFamily(element.family))
    return `${element.family} · ${DIRECTION_WORD[element.direction]} · ${element.rotationQuarterTurns / 4} rotation · ${element.twistsHalfTurns * 180}°`;
  const prefix =
    element.family === 'overslag-salto' ? 'overslag ' : element.family === 'tsukahara' ? 'tsukahara ' : '';
  const rotations = saltoRotations(element);
  const rotation =
    rotations === 2
      ? 'dobbelt '
      : rotations === 3
        ? 'trippel '
        : rotations > 3
          ? `${rotations}-dobbelt `
          : '';
  const body = bodyText(element);
  const degrees = `${element.twistsHalfTurns * 180}°`;
  const nickname = springNickname(element);
  let label: string;
  if (nickname) label = `${nickname} (${body} ${degrees})`;
  else if (element.twistsHalfTurns === 0) label = `${rotation}${body} salto`;
  else label = `${rotation}${body} ${twistFraction(element.twistsHalfTurns)} (${degrees})`;
  if (!nickname && (context.expected === null || element.direction !== context.expected))
    label += ` ${DIRECTION_WORD[element.direction]}`;
  if (element.twistDistribution.length > 1 && element.twistsHalfTurns > 0)
    label += ` · ${twistSplitName(element.twistDistribution).toLocaleLowerCase('da-DK')}`;
  return `${prefix}${label}`;
}

const TWIST_WORD = ['0', '½', 'hel', '1½', 'dobbelt', '2½'];

/** Fagsprogets navn for en skruefordeling: al skrue i første salto er in, al skrue i sidste er out. */
export function twistSplitName(distribution: readonly number[]): string {
  const total = distribution.reduce((sum, value) => sum + value, 0);
  if (distribution.length < 2 || total === 0) return `${total * 180}°`;
  if (distribution[0] === total) return 'In';
  if (distribution.at(-1) === total) return 'Out';
  if (distribution.length === 2 && total < TWIST_WORD.length)
    return `${TWIST_WORD[distribution[0]!]} in, ${TWIST_WORD[distribution[1]!]} out`;
  return distribution.map((value) => `${value * 180}°`).join(' + ');
}

export function capitalize(text: string) {
  return text.charAt(0).toLocaleUpperCase('da-DK') + text.slice(1);
}

export function seriesLabels(elements: readonly ElementExecution[]): string[] {
  return elements.map((element, index) =>
    springElementLabel(element, { expected: expectedDirection(elements[index - 1], element) }),
  );
}

/** Fælles navn for et spring på bane eller trampet, afledt af den præcise udførelse. */
export function springName(definition: SpringSkill): string {
  return springExecutionName(
    definition.discipline,
    definition.discipline === 'trampet' ? [definition.jump] : definition.elements,
  );
}

export function springExecutionName(
  discipline: SpringSkill['discipline'],
  elements: readonly ElementExecution[],
) {
  return capitalize(seriesLabels(discipline === 'trampet' ? elements.slice(0, 1) : elements).join(' – '));
}

/** Ét element i en serie, fx i elementlister og spotningsvalg. */
export function springElementInSeries(elements: readonly ElementExecution[], index: number) {
  return capitalize(seriesLabels(elements)[index] ?? '');
}

/** Et katalogelement uden sammenhæng; retningen vises altid for saltoer uden kaldenavn. */
export function springCatalogElementName(element: ElementExecution, options: { start?: boolean } = {}) {
  // Startsaltoen er en særskilt katalogrække med samme udførelse; navnet skal kunne skelnes.
  return `${capitalize(springElementLabel(element, { expected: null }))}${options.start ? ' · start' : ''}`;
}
