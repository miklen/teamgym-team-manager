import type { ElementExecution, SkillDefinition } from '@teamgym/domain';
import type { RulePackage } from '@teamgym/rules';

/*
 * Frosne kopier af tidligere automatiske navnegeneratorer. De bruges kun til at genkende gemte
 * automatiske navne ved visning og som søgealiaser. Ret dem ikke: Gemte filer indeholder deres output.
 * Generationer fra git-historikken for spring-library.ts:
 *  - v4 (344876e, 07dbb35): kaldenavne med "·", grader og "(retning)".
 *  - v3 (3332a17): "Rudy · strakt salto 540° (forlæns)" og "Lukket salto 0° (baglæns)".
 *  - v2 (3f8b1a6, 9caf779, a1701b4): katalognavn med "(retning)" efter saltoer.
 *  - v1 (d9ee672, 18a04d4): katalognavn med retning uden parentes og katalogets store bogstaver.
 */

type SpringSkill = Exclude<SkillDefinition, { discipline: 'rhythm' }>;

function directionWord(element: ElementExecution) {
  return element.direction === 'backward'
    ? 'baglæns'
    : element.direction === 'forward'
      ? 'forlæns'
      : 'sidelæns';
}

function records(element: ElementExecution, rulePackage: RulePackage) {
  const key = JSON.stringify(element);
  return rulePackage.springCatalog.filter((item) => JSON.stringify(item.execution) === key);
}

function v4Technical(element: ElementExecution, rulePackage: RulePackage, catalogName?: string): string {
  const record = records(element, rulePackage)[0];
  const direction = directionWord(element);
  if (element.family === 'salto') {
    const body = element.bodyPositions
      .map((position) => ({ tuck: 'lukket', pike: 'hoftebøjet', straight: 'strakt' })[position])
      .join(' → ');
    const rotation =
      element.rotationQuarterTurns === 8 ? 'dobbelt ' : element.rotationQuarterTurns === 12 ? 'trippel ' : '';
    const salto = record?.startRole || catalogName?.endsWith(' start') ? 'startsalto' : 'salto';
    const name = `${rotation}${body} ${salto} ${element.twistsHalfTurns * 180}° (${direction})${element.twistDistribution.length > 1 ? ` · ${element.twistDistribution.map((value) => `${value * 180}°`).join(' + ')}` : ''}`;
    return name.charAt(0).toLocaleUpperCase('da-DK') + name.slice(1);
  }
  return record
    ? `${(catalogName ?? record.name).replace(/\b(180|360|540|720|900|1080|1260|1440)(?!\d|°)/g, '$1°')}${['overslag-salto', 'tsukahara'].includes(element.family) ? ` (${direction})` : ''}`
    : `${element.family} · ${direction} · ${element.rotationQuarterTurns / 4} rotation · ${element.twistsHalfTurns * 180}°`;
}

function v4Element(element: ElementExecution, rulePackage: RulePackage, catalogName?: string): string {
  const technical = v4Technical(element, rulePackage, catalogName);
  const nickname = ({ 3: 'Rudy', 5: 'Randy', 7: 'Addy' } as Record<number, string>)[element.twistsHalfTurns];
  if (nickname && element.direction === 'forward' && element.bodyPositions.length === 1) {
    if (element.family === 'salto' && element.rotationQuarterTurns === 4) {
      const detail = technical.replace(/ (?:start)?salto /, ' ');
      return `${nickname} · ${detail.charAt(0).toLocaleLowerCase('da-DK')}${detail.slice(1)}`;
    }
    if (element.family === 'overslag-salto' && element.rotationQuarterTurns === 8) {
      return technical.replace(/^Overslag salto /, `Overslag ${nickname.toLocaleLowerCase('da-DK')} · `);
    }
  }
  return element.family === 'salto' &&
    element.direction === 'backward' &&
    element.rotationQuarterTurns === 8 &&
    element.twistsHalfTurns === 6
    ? `Miller · ${technical.charAt(0).toLocaleLowerCase('da-DK')}${technical.slice(1)}`
    : technical;
}

function v3Element(element: ElementExecution, rulePackage: RulePackage, catalogName?: string): string {
  const record = records(element, rulePackage)[0];
  const direction = directionWord(element);
  if (element.family === 'salto') {
    const body = element.bodyPositions
      .map((position) => ({ tuck: 'lukket', pike: 'hoftebøjet', straight: 'strakt' })[position])
      .join(' → ');
    const rotation =
      element.rotationQuarterTurns === 8 ? 'dobbelt ' : element.rotationQuarterTurns === 12 ? 'trippel ' : '';
    const rudy =
      element.direction === 'forward' &&
      element.rotationQuarterTurns === 4 &&
      body === 'strakt' &&
      element.twistsHalfTurns === 3;
    const salto = record?.startRole || catalogName?.endsWith(' start') ? 'startsalto' : 'salto';
    const name = `${rudy ? 'Rudy · ' : ''}${rotation}${body} ${salto} ${element.twistsHalfTurns * 180}° (${direction})${element.twistDistribution.length > 1 ? ` · ${element.twistDistribution.map((value) => `${value * 180}°`).join(' + ')}` : ''}`;
    return name.charAt(0).toLocaleUpperCase('da-DK') + name.slice(1);
  }
  return v2Element(element, rulePackage, catalogName);
}

function v2Element(element: ElementExecution, rulePackage: RulePackage, catalogName?: string): string {
  const record = records(element, rulePackage)[0];
  return record
    ? `${catalogName ?? record.name}${element.family === 'salto' ? ` (${directionWord(element)})` : ''}`
    : `${element.family} · ${directionWord(element)} · ${element.rotationQuarterTurns / 4} rotation · ${element.twistsHalfTurns * 180}°`;
}

type ElementNamer = (element: ElementExecution, rulePackage: RulePackage, catalogName?: string) => string;

/** Seriegeneratoren var ens i v2–v4; kun elementnavnene skiftede. */
function fixedTableSeries(
  elements: readonly ElementExecution[],
  rulePackage: RulePackage,
  named: ElementNamer,
) {
  const fixed: Record<string, string> = {
    roundoff: 'rondat',
    flic: 'flik',
    handspring: 'kraftspring',
    flyspring: 'flyvespring',
    whipback: 'whipback',
    cartwheel: 'vejrmølle',
  };
  const name = elements
    .map((element) => {
      if (fixed[element.family]) return fixed[element.family];
      if (
        element.family === 'salto' &&
        element.rotationQuarterTurns === 4 &&
        element.bodyPositions.length === 1 &&
        element.bodyPositions[0] === 'straight'
      ) {
        if (element.direction === 'forward')
          return (
            (
              {
                0: 'strakt',
                1: 'barani',
                2: 'forlæns helskrue',
                3: 'rudy',
                4: 'forlæns dobbeltskrue',
                5: 'randy',
                7: 'addy',
              } as Record<number, string>
            )[element.twistsHalfTurns] ?? named(element, rulePackage)
          );
        if (element.direction === 'backward')
          return (
            (
              {
                0: 'strakt baglæns',
                1: 'baglæns halvskrue',
                2: 'helskrue',
                3: 'baglæns 1½ skrue',
                4: 'dobbeltskrue',
              } as Record<number, string>
            )[element.twistsHalfTurns] ?? named(element, rulePackage)
          );
      }
      return named(element, rulePackage).replace(/ start/, '');
    })
    .join(' – ');
  return name.charAt(0).toLocaleUpperCase('da-DK') + name.slice(1);
}

/** v1: katalognavn pr. element med retning efter saltoer. */
function v1Element(element: ElementExecution, rulePackage: RulePackage): string[] {
  return records(element, rulePackage).map(
    (item) =>
      `${item.name.replace(/ start$/, '')}${item.execution.family === 'salto' ? ` ${directionWord(element)}` : ''}`,
  );
}

function product(parts: readonly string[][]): string[] {
  return parts.reduce<string[]>(
    (result, options) =>
      result.flatMap((prefix) => options.map((option) => (prefix ? `${prefix} – ${option}` : option))),
    [''],
  );
}

/** Alle navne, som tidligere versioner automatisk kunne give netop denne udførelse. */
export function legacySpringNames(definition: SpringSkill, rulePackage: RulePackage): string[] {
  const names = new Set<string>();
  if (definition.discipline === 'trampet') {
    const jump = definition.jump;
    const technical = v4Technical(jump, rulePackage);
    names.add(technical);
    names.add(v4Element(jump, rulePackage));
    names.add(v3Element(jump, rulePackage));
    names.add(v2Element(jump, rulePackage));
    for (const namer of [v4Element, v3Element, v2Element])
      names.add(fixedTableSeries([jump], rulePackage, namer));
    for (const record of records(jump, rulePackage)) {
      names.add(record.name);
      names.add(record.name.replace(/\b(\d+)(?!\d|°)/g, '$1°'));
      names.add(v4Element(jump, rulePackage, record.name));
      names.add(v2Element(jump, rulePackage, record.name));
    }
    for (const nickname of ['Rudy', 'Randy', 'Addy']) names.add(`${nickname} · ${technical}`);
    return [...names];
  }
  const elements = definition.elements;
  for (const namer of [v4Element, v3Element, v2Element]) {
    names.add(fixedTableSeries(elements, rulePackage, namer));
    if (elements.length === 1) {
      names.add(namer(elements[0]!, rulePackage));
      for (const record of records(elements[0]!, rulePackage))
        names.add(namer(elements[0]!, rulePackage, record.name));
    }
  }
  for (const name of product(elements.map((element) => v1Element(element, rulePackage)))) names.add(name);
  if (elements.length === 1)
    for (const record of records(elements[0]!, rulePackage)) {
      names.add(record.name);
      names.add(
        `${record.name}${record.execution.family === 'salto' ? ` ${directionWord(record.execution)}` : ''}`,
      );
    }
  return [...names].filter(Boolean);
}
