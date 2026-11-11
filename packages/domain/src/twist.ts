import type { ElementExecution, SkillDefinition } from './schema';

/** Fra tre hele skruer bruges kun det samlede skruetal; under det er fordelingen en del af springets identitet. */
export const TWIST_DISTRIBUTION_LIMIT = 6;

/** En flersalto med skrue under tre hele skruer skal angive skruerne pr. salto. */
export function needsTwistDistribution(element: ElementExecution): boolean {
  return (
    element.bodyPositions.length > 1 &&
    element.twistsHalfTurns > 0 &&
    element.twistsHalfTurns < TWIST_DISTRIBUTION_LIMIT &&
    element.twistDistribution.length !== element.bodyPositions.length
  );
}

export function skillNeedsTwistDistribution(skill: SkillDefinition): boolean {
  if (skill.discipline === 'rhythm') return false;
  return (skill.discipline === 'trampet' ? [skill.jump] : skill.elements).some(needsTwistDistribution);
}

/** Har elementet et fordelingsvalg, uanset om det allerede er truffet? */
export function hasTwistDistributionChoice(element: ElementExecution): boolean {
  return (
    element.bodyPositions.length > 1 &&
    element.twistsHalfTurns > 0 &&
    element.twistsHalfTurns < TWIST_DISTRIBUTION_LIMIT
  );
}

/** Alle fordelinger af halve skruer på saltoerne, fra al skrue i første salto (in) til al skrue i sidste (out). */
export function twistDistributionOptions(saltos: number, halfTurns: number): number[][] {
  if (saltos < 1) return [];
  if (saltos === 1) return [[halfTurns]];
  const result: number[][] = [];
  for (let first = halfTurns; first >= 0; first--)
    for (const rest of twistDistributionOptions(saltos - 1, halfTurns - first)) result.push([first, ...rest]);
  return result;
}

/** Hele skruen på sidste salto. Bruges kun af den aftalte migrering af uafklarede fordelinger. */
export function outTwistDistribution(element: ElementExecution): number[] {
  return element.bodyPositions.map((_, index) =>
    index === element.bodyPositions.length - 1 ? element.twistsHalfTurns : 0,
  );
}
