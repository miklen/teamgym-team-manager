import type { ElementExecution } from '@teamgym/domain';
import type { SpringChoice } from './spring-library';
import { isSaltoFamily, saltoRotations, springNickname } from './spring-names';

/** Normaliserer tegn: bindestreger, tankestreger og mellemrum er ens; ½ og decimalkomma bliver ".5". */
export function normalizeSpringSearch(text: string) {
  return text
    .replace(/½/g, '.5')
    .normalize('NFKC')
    .toLocaleLowerCase('da-DK')
    .replace(/(\d),(\d)/g, '$1.$2')
    .replace(/[\u2010-\u2015\u2212-]/g, ' ')
    .replace(/[°()·→,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Flerordsudtryk og forkortelser udvides før opslag i synonymtabellen.
const EXPANSIONS: [RegExp, string][] = [
  [/\brf\b/g, 'rondat flik'],
  [/\bdb\b/g, 'dobbelt baglæns'],
  [/\bdobbeltbaglænder\b/g, 'dobbelt baglæns'],
  [/\bflik flak\b/g, 'flik'],
  [/\bround off\b/g, 'rondat'],
];

type Kind = 'family' | 'salto' | 'body' | 'direction' | 'rotation' | 'twist' | 'nickname';
interface Predicate {
  kind: Kind;
  test: (element: ElementExecution) => boolean;
}

const saltoLike = (element: ElementExecution) => isSaltoFamily(element.family);
const family = (...families: string[]): Predicate => ({
  kind: 'family',
  test: (element) => families.includes(element.family),
});
const body = (position: string): Predicate => ({
  kind: 'body',
  test: (element) => saltoLike(element) && element.bodyPositions.includes(position as never),
});
const direction = (value: ElementExecution['direction']): Predicate => ({
  kind: 'direction',
  test: (element) => saltoLike(element) && element.direction === value,
});
const rotation = (value: number): Predicate => ({
  kind: 'rotation',
  test: (element) => saltoLike(element) && saltoRotations(element) === value,
});
const twist = (halfTurns: number): Predicate => ({
  kind: 'twist',
  test: (element) => saltoLike(element) && element.twistsHalfTurns === halfTurns,
});
const nickname = (value: string): Predicate => ({
  kind: 'nickname',
  test: (element) => springNickname(element) === value,
});

/** Fast synonymtabel. Ord i tabellen matcher kun strukturelt, aldrig som tekst. */
const SYNONYMS = new Map<string, Predicate>();
function define(words: string[], predicate: Predicate) {
  for (const word of words) SYNONYMS.set(word, predicate);
}
define(['rondat', 'roundoff', 'ronde'], family('roundoff'));
define(['flik', 'flic', 'flikflak'], family('flic'));
define(['whipback', 'whip'], family('whipback'));
define(['kraft', 'kraftspring', 'handspring'], family('handspring'));
define(['flyvespring', 'flyspring'], family('flyspring'));
define(['vejrmølle', 'cartwheel'], family('cartwheel'));
define(['mølleoverslag'], family('cartwheel-vault'));
define(['overslag'], family('handspring-vault', 'overslag-salto'));
define(['tsukahara', 'tsuk'], family('tsukahara'));
define(['salto', 'saltoer', 'startsalto'], { kind: 'salto', test: saltoLike });
define(['lukket', 'tuck'], body('tuck'));
define(['hofte', 'hoftebøjet', 'pike'], body('pike'));
define(['strakt', 'straight'], body('straight'));
define(['forlæns', 'forlænder', 'front'], direction('forward'));
define(['baglæns', 'baglænder', 'back'], direction('backward'));
define(['sidelæns'], direction('sideways'));
define(['enkelt'], rotation(1));
define(['dobbelt'], rotation(2));
define(['trippel'], rotation(3));
define(['1/2', 'halv', 'halvskrue', '180'], twist(1));
define(['1/1', 'hel', 'helskrue', '360'], twist(2));
define(['1.5', 'halvanden', '540'], twist(3));
define(['2/1', 'dobbeltskrue', '720'], twist(4));
define(['2.5', '900'], twist(5));
define(['3/1', '1080'], twist(6));
define(['3.5', '1260'], twist(7));
define(['skrue', 'skruer'], {
  kind: 'twist',
  test: (element) => saltoLike(element) && element.twistsHalfTurns > 0,
});
define(['barani'], nickname('barani'));
define(['rudy', 'rudi'], nickname('rudy'));
define(['randy', 'randolph'], nickname('randy'));
define(['addy'], nickname('addy'));
define(['miller'], {
  kind: 'nickname',
  test: (element) =>
    element.family === 'salto' &&
    element.direction === 'backward' &&
    saltoRotations(element) === 2 &&
    element.twistsHalfTurns === 6,
});

const SALTO_CAPABLE = new Set(['overslag', 'tsukahara', 'tsuk']);

interface ParsedQuery {
  needle: string;
  words: string[];
  structural: boolean[];
  groups: Predicate[][];
  text: string[];
}

function parseQuery(query: string): ParsedQuery {
  let needle = normalizeSpringSearch(query);
  for (const [pattern, replacement] of EXPANSIONS) needle = needle.replace(pattern, replacement);
  const words = needle ? needle.split(' ') : [];
  const groups: Predicate[][] = [];
  const text: string[] = [];
  let current: Predicate[] = [];
  let closed = true;
  const structural = words.map((word) => {
    const predicate = SYNONYMS.get(word);
    if (!predicate) {
      text.push(word);
      return false;
    }
    // Faste elementer står alene; egenskaber samles på samme salto, indtil en egenskab gentages.
    const fixedElement = predicate.kind === 'family' && !SALTO_CAPABLE.has(word);
    const repeats = current.some((item) => item.kind === predicate.kind);
    if (fixedElement || closed || repeats) {
      if (current.length) groups.push(current);
      current = [];
    }
    current.push(predicate);
    closed = fixedElement;
    return true;
  });
  if (current.length) groups.push(current);
  return { needle, words, structural, groups, text };
}

const groupMatches = (group: Predicate[], element: ElementExecution) =>
  group.every((item) => item.test(element));

/** Strukturelt match: 0 dækker hele serien, 1 er begyndelse (ikke-nævnte skruer under 2), 6 i rækkefølge, 7 løst. */
function structuralRank(groups: Predicate[][], elements: readonly ElementExecution[]) {
  if (!groups.length) return null;
  if (
    groups.length <= elements.length &&
    groups.every((group, index) => groupMatches(group, elements[index]!))
  ) {
    // Et overslag eller en Tsukahara, som søgningen ikke nævner, rangeres efter den rene salto.
    const unnamedVault = groups.some(
      (group, index) =>
        ['overslag-salto', 'tsukahara'].includes(elements[index]!.family) &&
        !group.some((item) => item.kind === 'family'),
    );
    // Ligeså med skruer, som søgningen ikke nævner: "strakt" foretrækker den rene strakte salto.
    const unnamedTwist = groups.some(
      (group, index) =>
        elements[index]!.twistsHalfTurns > 0 &&
        !group.some((item) => item.kind === 'twist' || item.kind === 'nickname'),
    );
    const exact = groups.length === elements.length;
    // Skruede varianter efter alle rene match, men før aliasmatch (2+).
    const twistPenalty = unnamedTwist ? (exact ? 1.5 : 0.6) : 0;
    return (
      (exact ? 0 : 1) + (elements.length - groups.length) / 100 + (unnamedVault ? 0.005 : 0) + twistPenalty
    );
  }
  let next = 0;
  const ordered = groups.every((group) => {
    while (next < elements.length && !groupMatches(group, elements[next]!)) next++;
    return next++ < elements.length;
  });
  if (ordered) return 6;
  return groups.every((group) => elements.some((element) => groupMatches(group, element))) ? 7 : null;
}

/** Hele ord; kun et sidste tekstord må være en begyndelse, så "halv" ikke rammer "halvanden". */
function wordPosition(haystack: string[], parsed: ParsedQuery): number | null {
  const { words, structural } = parsed;
  for (let start = 0; start + words.length <= haystack.length; start++) {
    const fits = words.every((word, index) => {
      const candidate = haystack[start + index]!;
      return (
        candidate === word || (index === words.length - 1 && !structural[index] && candidate.startsWith(word))
      );
    });
    if (fits) return start;
  }
  return null;
}

function textRank(text: string, parsed: ParsedQuery, exact: number) {
  const words = text ? text.split(' ') : [];
  if (text === parsed.needle) return exact;
  const position = wordPosition(words, parsed);
  if (position === null) return null;
  return position === 0 ? exact + 1 : exact + 4;
}

/** Navnets begyndelse og strukturelle begyndelser prioriteres før løse ord på tværs af serien. */
export function springSearchRank(choice: SpringChoice, query: string): number | null {
  const parsed = parseQuery(query);
  if (!parsed.needle) return 0;
  const definition = choice.definition;
  const elements = definition.discipline === 'trampet' ? [definition.jump] : definition.elements;
  const name = normalizeSpringSearch(definition.name);
  const aliases = choice.aliases.map(normalizeSpringSearch);
  // Navn: 0 præcis, 1 begyndelse, 4 indeholder. Aliaser: 2, 3 og 5.
  const nameRank = textRank(name, parsed, 0);
  const aliasRank = aliases.reduce<number | null>((best, alias) => {
    const rank = textRank(alias, parsed, 2);
    const shifted = rank === 6 ? 5 : rank;
    return shifted !== null && (best === null || shifted < best) ? shifted : best;
  }, null);
  const textual = [nameRank, aliasRank].filter((rank): rank is number => rank !== null);
  let combined: number | null = null;
  const haystack = [name, normalizeSpringSearch(choice.group), ...aliases].join(' ');
  const textOk = parsed.text.every((word) => haystack.includes(word));
  if (textOk) {
    if (parsed.groups.length) {
      const structure = structuralRank(parsed.groups, elements);
      if (structure !== null) combined = parsed.text.length ? Math.max(structure, 6) : structure;
    } else combined = 7;
  }
  const ranks = combined === null ? textual : [...textual, combined];
  return ranks.length ? Math.min(...ranks) : null;
}

export function matchesSpring(choice: SpringChoice, query: string) {
  return springSearchRank(choice, query) !== null;
}
