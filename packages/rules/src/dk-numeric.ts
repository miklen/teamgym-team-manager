import { Fraction, sumFractions } from '@teamgym/domain';
import type { EvaluationStatus } from '@teamgym/domain';

export interface NumericDecision {
  status: EvaluationStatus;
  value: Fraction | null;
  knownSubtotal: Fraction;
  issues: readonly string[];
  alternatives: Readonly<Record<string, Fraction>>;
}

export function known(value: Fraction | string | number): NumericDecision {
  const exact = Fraction.from(value);
  return { status: 'known', value: exact, knownSubtotal: exact, issues: [], alternatives: {} };
}

export function uncertain(status: Exclude<EvaluationStatus, 'known'>, issues: readonly string[] = [], subtotal: Fraction | string | number = 0, alternatives: Readonly<Record<string, Fraction>> = {}): NumericDecision {
  return { status, value: null, knownSubtotal: Fraction.from(subtotal), issues, alternatives };
}

export function combineStatus(statuses: readonly EvaluationStatus[]): EvaluationStatus {
  return statuses.includes('invalid') ? 'invalid' : statuses.includes('unresolved') ? 'unresolved' : statuses.includes('incomplete') ? 'incomplete' : 'known';
}

function counts(values: readonly number[], maximum: number) {
  if (values.some((value) => !Number.isInteger(value) || value < 0 || value > maximum)) throw new Error('Optællingen ligger uden for tælleuniverset.');
}

export function twistIncrement(halfTurns: number): Fraction {
  if (!Number.isInteger(halfTurns) || halfTurns < 0) throw new Error('Skruer angives i hele halve omgange.');
  return new Fraction(halfTurns + Math.max(0, 1 + Math.floor((halfTurns - 6) / 2)), 10);
}

export function topThreeDifficulty(elements: readonly { identity: string; value: Fraction }[]) {
  const unique = new Map<string, { identity: string; value: Fraction }>();
  for (const element of elements) {
    const existing = unique.get(element.identity);
    if (existing && existing.value.compare(element.value) !== 0) throw new Error('Samme elementidentitet har modstridende værdier.');
    unique.set(element.identity, element);
  }
  const sorted = [...unique.values()].sort((a, b) => b.value.compare(a.value));
  return { value: sumFractions(sorted.slice(0, 3).map((element) => element.value)), counted: sorted.slice(0, 3), excluded: sorted.slice(3), duplicates: elements.length - unique.size };
}

export function disciplineMean(roundSums: readonly Fraction[]): Fraction {
  if (roundSums.length !== 3) throw new Error('Disciplinen skal have tre omgange.');
  return sumFractions(roundSums).divide(3);
}

export function bestBonus(qualifyingCounts: readonly number[], required = 6, rate = '0.10'): Fraction {
  counts(qualifyingCounts, required);
  return Fraction.from(rate).multiply(Math.max(0, ...qualifyingCounts));
}

export function pureDirectionDeduction(forward: readonly number[], backward: readonly number[], required = 6): NumericDecision {
  if (forward.length !== 3 || backward.length !== 3) throw new Error('Retning kræver tre omgange.');
  counts(forward, required); counts(backward, required);
  return known(new Fraction((required - Math.max(...forward)) + (required - Math.max(...backward)), 5));
}

export function apparatusDeduction(vault: readonly number[], free: readonly number[], required = 6): NumericDecision {
  if (vault.length !== 3 || free.length !== 3) throw new Error('Redskabskrav kræver tre omgange.');
  counts(vault, required); counts(free, required);
  if (vault.some((value, index) => value + free[index]! !== required)) return uncertain('incomplete');
  if (vault.includes(required) && free.includes(required)) return known(0);
  if (vault.every((value) => value === 0) || free.every((value) => value === 0)) return known(new Fraction(required, 5));
  return uncertain('unresolved', ['Q04']);
}

export function repetitionDeduction(identityCounts: readonly number[], sameAthletes: boolean, required = 6): NumericDecision {
  counts(identityCounts, required);
  const used = identityCounts.filter((count) => count > 0);
  if (used.length <= 1) return known(0);
  if (sameAthletes && used.every((count) => count === required)) return known(new Fraction(required * (used.length - 1), 5));
  return uncertain('unresolved', ['Q03']);
}

/** DK 1.1.0: Gentagelser tælles på holdets præcise springidentitet på tværs af omgange. */
export function resolvedRepetitionDeduction(identityCounts: readonly number[], required = 6): NumericDecision {
  if (identityCounts.length !== 3) throw new Error('Gentagelse kræver tre omgange.');
  counts(identityCounts, required);
  return known(new Fraction(identityCounts.reduce((sum, count) => sum + count, 0) - Math.max(...identityCounts), 5));
}

export function holdReference(identityCounts: readonly number[], required = 6): { status: EvaluationStatus; index: number | null; issues: readonly string[] } {
  counts(identityCounts, required);
  if (identityCounts.reduce((sum, count) => sum + count, 0) > required) throw new Error('Flertalsoptællingen overskrider antallet af tællende.');
  const largest = Math.max(0, ...identityCounts);
  if (largest > required / 2) return { status: 'known', index: identityCounts.indexOf(largest), issues: [] };
  return { status: identityCounts.reduce((sum, count) => sum + count, 0) < required ? 'incomplete' : 'unresolved', index: null,
    issues: identityCounts.reduce((sum, count) => sum + count, 0) < required ? [] : ['Q05'] };
}

export function holdRound(identities: readonly (string | null)[], values: readonly (Fraction | null)[], required = 6) {
  const groups = [...new Set(identities.filter((identity): identity is string => identity !== null))];
  const reference = holdReference(groups.map((identity) => identities.filter((item) => item === identity).length), required);
  if (reference.index === null) return { ...reference, adjusted: values.map(() => null), sum: uncertain(reference.status === 'known' ? 'incomplete' : reference.status, reference.issues), deduction: uncertain(reference.status === 'known' ? 'incomplete' : reference.status, reference.issues), referenceIdentity: null };
  const referenceIdentity = groups[reference.index]!;
  const adjusted = values.map((value, index) => identities[index] === null ? null : identities[index] === referenceIdentity ? value : new Fraction(0));
  const deviating = identities.filter((identity) => identity !== null && identity !== referenceIdentity).length;
  const identityComplete = identities.length === required && identities.every((identity) => identity !== null);
  const complete = identityComplete && adjusted.every((value) => value !== null);
  const subtotal = sumFractions(adjusted.filter((value): value is Fraction => value !== null));
  return { ...reference, adjusted, sum: complete ? known(subtotal) : uncertain('incomplete', [], subtotal),
    deduction: identityComplete ? known(new Fraction(deviating, 5)) : uncertain('incomplete', [], new Fraction(deviating, 5)), referenceIdentity };
}

export function orderCheck(rotations: readonly (number | null)[], difficulties: readonly (Fraction | null)[], roundNumber: number): OrderResult {
  if (roundNumber === 1) return { compliant: true, applies: false, deduction: known(0), faultIndexes: [] };
  if (rotations.length !== difficulties.length || rotations.some((rotation) => rotation === null) || difficulties.some((value) => value === null)) {
    return { compliant: null, applies: true, deduction: uncertain('unresolved', ['Q06']), faultIndexes: [] };
  }
  const compliant = rotations.every((rotation, index) => index === 0 || rotation! > rotations[index - 1]! ||
    (rotation === rotations[index - 1] && difficulties[index]!.compare(difficulties[index - 1]!) >= 0));
  return { compliant, applies: true, deduction: compliant ? known(0) : uncertain('unresolved', ['Q06']), faultIndexes: [] };
}

/** DK 1.1.0: Hvert tællende spring, der står efter en højere kategori eller et sværere spring i samme kategori, giver ét fradrag. */
export interface OrderResult { compliant: boolean | null; applies: boolean; deduction: NumericDecision; faultIndexes: readonly number[] }

export function resolvedOrderCheck(categories: readonly (number | null)[], difficulties: readonly NumericDecision[], roundNumber: number): OrderResult {
  if (categories.length !== difficulties.length) throw new Error('Rækkefølgen kræver én kategori og én sværhed pr. spring.');
  if (roundNumber === 1) return { compliant: true, applies: false, deduction: known(0), faultIndexes: [] };
  const faultIndexes: number[] = [];
  const unknown: NumericDecision[] = [];
  for (const [index, category] of categories.entries()) {
    const value = difficulties[index]!.value;
    if (category === null || value === null) { unknown.push(difficulties[index]!); continue; }
    const fault = categories.slice(0, index).some((earlier, earlierIndex) => {
      const earlierValue = difficulties[earlierIndex]!.value;
      return earlier !== null && earlierValue !== null && (earlier > category || earlier === category && earlierValue.compare(value) > 0);
    });
    if (fault) faultIndexes.push(index);
  }
  const amount = new Fraction(faultIndexes.length, 10);
  if (unknown.length) {
    const status = combineStatus(unknown.map((decision) => decision.status === 'known' ? 'incomplete' : decision.status));
    return { compliant: faultIndexes.length ? false : null, applies: true, faultIndexes,
      deduction: uncertain(status === 'known' ? 'incomplete' : status, [...new Set(unknown.flatMap((decision) => decision.issues))], amount) };
  }
  return { compliant: faultIndexes.length === 0, applies: true, deduction: known(amount), faultIndexes };
}

export function elementBonus(distinctCountsByRound: readonly (readonly number[])[]): NumericDecision {
  if (distinctCountsByRound.length !== 3) throw new Error('Elementtillæg kræver tre omgange.');
  for (const round of distinctCountsByRound) counts(round, 30);
  const perAthlete = distinctCountsByRound.flat().map(elementBonusForAthlete);
  const literal = sumFractions(perAthlete.map((result) => result.alternatives.literal!)).divide(3);
  const example = sumFractions(perAthlete.map((result) => result.alternatives.example!)).divide(3);
  return uncertain('unresolved', ['Q01'], 0, { literal, example });
}

export function elementBonusForAthlete(distinctCount: number): NumericDecision {
  counts([distinctCount], 30);
  return uncertain('unresolved', ['Q01'], 0, { literal: new Fraction(distinctCount, 10), example: new Fraction(Math.max(0, distinctCount - 1), 10) });
}

/** Afklaret DK 1.1.0: første forskellige element giver intet tillæg. */
export function resolvedElementBonus(distinctCountsByRound: readonly (readonly number[])[], complete: boolean): NumericDecision {
  if (distinctCountsByRound.length !== 3) throw new Error('Elementtillæg kræver tre omgange.');
  for (const round of distinctCountsByRound) counts(round, 30);
  const amount = sumFractions(distinctCountsByRound.flat().map((distinctCount) => new Fraction(Math.max(0, distinctCount - 1), 10))).divide(3);
  return complete ? known(amount) : uncertain('incomplete', [], amount);
}

export function trampetTwistQualifies(ageGroup: string, rotations: number, halfTurnsAfterHands: number, family = 'salto'): boolean {
  if (!['U14', 'junior', 'senior'].includes(ageGroup)) throw new Error('Ukendt DK-aldersprofil.');
  if (![1, 2].includes(rotations)) return false;
  if (family === 'tsukahara') return halfTurnsAfterHands >= 2;
  return rotations === 1 ? halfTurnsAfterHands >= (ageGroup === 'U14' ? 2 : 3) : rotations === 2 && halfTurnsAfterHands >= 1;
}

export function participantStructure(roles: readonly ('counting' | 'extra')[], counting = 6, extra = 2) {
  const count = roles.filter((role) => role === 'counting').length;
  const extraCount = roles.length - count;
  const firstCounting = roles.indexOf('counting');
  return count <= counting && extraCount <= extra && (firstCounting < 0 || roles.slice(firstCounting).every((role) => role === 'counting'));
}

export function mixQuotaCheck(categories: readonly ('girl' | 'boy' | null)[], requiredGirls = 3, requiredBoys = 3): EvaluationStatus {
  if (categories.length < requiredGirls + requiredBoys || categories.includes(null)) return 'incomplete';
  return categories.filter((category) => category === 'girl').length === requiredGirls && categories.filter((category) => category === 'boy').length === requiredBoys ? 'known' : 'invalid';
}

/** Kun de besatte tællende pladser vurderes; ambitionerne kan stadig udfylde kvoten. */
export function mixQuotaWithAmbitions(filled: readonly ('girl' | 'boy' | null)[], requiredGirls = 3, requiredBoys = 3): EvaluationStatus {
  if (filled.filter((category) => category === 'girl').length > requiredGirls || filled.filter((category) => category === 'boy').length > requiredBoys) return 'invalid';
  return 'incomplete';
}

export const PLANNING_BOUNDARIES = Object.freeze({ flow: 'requires-observation', flowDeduction: null, inventMissingAthleteCDeduction: false } as const);

export function sumDecisions(decisions: readonly NumericDecision[]): NumericDecision {
  const status = combineStatus(decisions.map((decision) => decision.status));
  const subtotal = sumFractions(decisions.map((decision) => decision.knownSubtotal));
  if (status === 'known') return known(subtotal);
  const unknown = decisions.filter((decision) => decision.value === null);
  const keys = Object.keys(unknown[0]?.alternatives ?? {});
  const completeAlternatives = keys.length > 0 && unknown.every((decision) => keys.length === Object.keys(decision.alternatives).length && keys.every((key) => decision.alternatives[key] !== undefined));
  const alternatives = completeAlternatives ? Object.fromEntries(keys.map((key) => [key, sumFractions(decisions.map((decision) => decision.value ?? decision.alternatives[key]!))])) : {};
  return uncertain(status, [...new Set(decisions.flatMap((decision) => decision.issues))], subtotal, alternatives);
}

export function divideDecision(decision: NumericDecision, denominator: number): NumericDecision {
  if (decision.value !== null) return known(decision.value.divide(denominator));
  return uncertain(decision.status === 'known' ? 'incomplete' : decision.status, decision.issues, decision.knownSubtotal.divide(denominator),
    Object.fromEntries(Object.entries(decision.alternatives).map(([key, value]) => [key, value.divide(denominator)])));
}

export function compositionTotal(base: Fraction, bonuses: readonly NumericDecision[], deductions: readonly NumericDecision[]) {
  const status = combineStatus([...bonuses, ...deductions].map((decision) => decision.status));
  const raw = base.add(sumFractions(bonuses.map((decision) => decision.knownSubtotal))).subtract(sumFractions(deductions.map((decision) => decision.knownSubtotal)));
  return { status, raw: status === 'known' ? raw : null, knownSubtotal: raw, value: status === 'known' ? raw.max(0) : null, panel: status === 'known' ? raw.max(0).panelFloor() : null };
}

/** Kraftig hjælp på bane: seriens tre bedste genberegnes med det modtagne elements D halveret (H 9.3.3). */
export function spottedTopThreeDifficulty(elements: readonly { identity: string; value: Fraction }[], spottedIndex: number): NumericDecision {
  const spotted = elements[spottedIndex];
  if (!spotted) throw new Error('Det modtagne element findes ikke i serien.');
  const halve = (predicate: (index: number, identity: string) => boolean) =>
    elements.map((element, index) => predicate(index, element.identity) ? { ...element, value: element.value.divide(2) } : element);
  if (!elements.some((element, index) => index !== spottedIndex && element.identity === spotted.identity)) return known(topThreeDifficulty(halve((index) => index === spottedIndex)).value);
  const halved = topThreeDifficulty(halve((_index, identity) => identity === spotted.identity)).value;
  const unhalved = topThreeDifficulty(elements).value;
  return uncertain('unresolved', ['Q-SPOT-DUP'], halved, { halved, unhalved });
}

/** Planlagt E-loft for én omgang: 10,0 minus planlagte fradrag, mindst 0,0. */
export function plannedExecutionCeiling(deduction: NumericDecision): NumericDecision {
  const ten = new Fraction(10);
  return deduction.value !== null ? known(ten.subtract(deduction.value).max(0)) :
    uncertain(deduction.status === 'known' ? 'incomplete' : deduction.status, deduction.issues, ten.subtract(deduction.knownSubtotal).max(0));
}

/** Maks. mulig karakter: C (mindst 0) + D + gennemsnittet af omgangenes planlagte E-loft. Et loft, ikke en forventet karakter. */
export function plannedMaximumScore(composition: { status: EvaluationStatus; value: Fraction | null; knownSubtotal: Fraction }, difficulty: NumericDecision, ceilings: readonly NumericDecision[]): NumericDecision {
  if (ceilings.length !== 3) throw new Error('Maks. mulig karakter kræver tre omgange.');
  const c = composition.value !== null ? known(composition.value) : uncertain(composition.status === 'known' ? 'incomplete' : composition.status, [], composition.knownSubtotal.max(0));
  return sumDecisions([c, difficulty, divideDecision(sumDecisions(ceilings), 3)]);
}
