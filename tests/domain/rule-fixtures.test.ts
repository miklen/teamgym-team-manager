import { describe, expect, it } from 'vitest';
import { Fraction, canonicalJson, createWorkspace, formatPoints } from '@teamgym/domain';
import type { ElementExecution, Stability } from '@teamgym/domain';
import fixtures from '../../openspec/changes/build-teamgym-team-manager/reference/fixtures.json';
import { DK_RHYTHM_CATALOG, DK_SPRING_CATALOG } from '../../packages/rules/src/catalog';
import { elementDifficulty, elementIdentity, evaluateSpringSkill, normalizeElement, positionBasis, springIdentity } from '../../packages/rules/src/dk-spring';
import { apparatusDeduction, bestBonus, compositionTotal, disciplineMean, elementBonus, elementBonusForAthlete, holdReference, holdRound,
  known, mixQuotaCheck, orderCheck, participantStructure, PLANNING_BOUNDARIES, pureDirectionDeduction, repetitionDeduction, topThreeDifficulty,
  trampetTwistQualifies, twistIncrement } from '../../packages/rules/src/dk-numeric';
import { rhythmCommonality, summarizeRhythmCells } from '../../packages/rules/src/rhythm';
import type { RhythmCell } from '../../packages/rules/src/rhythm';

interface FacitCase { id: string; rule: string; input: Record<string, unknown>; expected: Record<string, unknown> }
const cases = fixtures.cases as unknown as FacitCase[];
function number(input: Record<string, unknown>, key: string, fallback = 0) { return typeof input[key] === 'number' ? input[key] as number : fallback; }
function string(input: Record<string, unknown>, key: string, fallback = '') { return typeof input[key] === 'string' ? input[key] as string : fallback; }
function numbers(input: Record<string, unknown>, key: string): number[] { return input[key] as number[]; }
function strings(input: Record<string, unknown>, key: string): string[] { return input[key] as string[]; }
function source(id: string) {
  const row = DK_SPRING_CATALOG.find((item) => item.referenceId === id);
  if (!row) throw new Error(`Ukendt kildepost i facitinput: ${id}`);
  return row;
}
function series(rows: string[]) { return { id: 'fixture-series', name: 'Syntetisk facitserie', archived: false, discipline: 'tumbling' as const, elements: rows.map((id) => structuredClone(source(id).execution)), connection: { kind: 'standard' as const, transitions: rows.slice(1).map(() => 'direct') } }; }

/** Kun semantisk inputadapter. Ingen produktionsfunktion må læse dette facit. */
function actual(test: FacitCase): Record<string, unknown> {
  const input = test.input;
  if (test.rule === 'D-BANE') {
    if (input.distinctElementValues) {
      const result = topThreeDifficulty(strings(input, 'distinctElementValues').map((value, index) => ({ identity: `element-${index}`, value: Fraction.from(value) })));
      return { rawD: result.value, countedValues: result.counted.map((item) => item.value) };
    }
    const definition = series(strings(input, 'sourceRows'));
    const result = evaluateSpringSkill(definition);
    if (input.stabilities) {
      const values = numbers(input, 'stabilities').map(() => evaluateSpringSkill(definition).difficulty.value!.toString());
      expect(new Set(values).size).toBe(1);
      return { rawDForBoth: result.difficulty.value };
    }
    return { rawD: result.difficulty.value, sameSeriesAsD02: springIdentity(definition) === springIdentity(series(strings(cases.find((item) => item.id === 'D02')!.input, 'sourceRows'))) };
  }
  if (test.rule === 'D-BASIS') {
    const row = source(string(input, 'sourceRow'));
    const result = elementDifficulty(row.execution);
    return { rawD: result.value, rotationCategory: row.execution.rotationQuarterTurns / 4,
      status: result.status, issue: result.issues[0], officialD: result.value, alternatives: result.alternatives,
      validity: result.status === 'invalid' ? 'forbidden' : result.status, safeCandidate: result.status === 'known' };
  }
  if (test.rule === 'D-SKRUE') return { twistIncrement: twistIncrement(number(input, 'halfTurns')) };
  if (test.rule === 'D-MIDDEL') return input.roundSums ? { rawD: disciplineMean(strings(input, 'roundSums').map(Fraction.from)) } :
    { rawDisciplineDelta: disciplineMean([Fraction.from(string(input, 'oneAthleteDelta')).multiply(number(input, 'changedRounds')), new Fraction(0), new Fraction(0)]) };
  if (test.rule === 'C-HOLD') {
    const definitions = strings(input, 'seriesCases').map((id) => series(strings(cases.find((item) => item.id === id)!.input, 'sourceRows')));
    const evaluated = definitions.map((definition) => evaluateSpringSkill(definition));
    const result = holdRound(evaluated.map((item) => item.identity), evaluated.map((item) => item.difficulty.value));
    return { adjustedRoundD: result.sum.value, teamDeduction: result.deduction.value, lastAthleteAdjustedD: result.adjusted.at(-1),
      lastAthleteEligibleForTwistBonus: evaluated.at(-1)!.status === 'known' && evaluated.at(-1)!.hasBaneTwist };
  }
  if (test.rule === 'C-FLOW') return PLANNING_BOUNDARIES;
  if (test.rule === 'C-GRUND') {
    const result = compositionTotal(Fraction.from(string(input, 'base')), [known(string(input, 'bonuses'))], [known(string(input, 'deductions'))]);
    return { rawC: result.raw, clampedC: result.value };
  }
  if (test.rule === 'B-SKRUE') {
    if (input.elementHalfTurns) return { qualifies: numbers(input, 'elementHalfTurns').some((turns) => turns >= 2) };
    return { bonus: bestBonus(numbers(input, 'qualifyingCounts')), twistBonus: input.twistCounts ? bestBonus(numbers(input, 'twistCounts')) : null };
  }
  if (test.rule === 'B-DOBBELT') return input.qualifyingCounts ? { bonus: bestBonus(numbers(input, 'qualifyingCounts')) } :
    { twistBonus: bestBonus(numbers(input, 'twistCounts')), doubleBonus: bestBonus(numbers(input, 'doubleCounts')) };
  if (test.rule === 'T-SKRUE') {
    const rotations = number(input, 'rotationCategory');
    const qualifies = trampetTwistQualifies(string(input, 'profile'), rotations, number(input, 'halfTurns'));
    return { bonus: bestBonus([qualifies ? number(input, 'count') : 0]), twistBonus: bestBonus([qualifies ? number(input, 'count') : 0]), freeDoubleBonus: bestBonus([rotations === 2 ? number(input, 'count') : 0]) };
  }
  if (test.rule === 'T-DOBBELT-REDSKAB') {
    const execution = normalizeElement(source(string(input, 'sourceRow')).execution);
    const qualifies = trampetTwistQualifies('junior', execution.rotationQuarterTurns / 4, execution.twistsHalfTurns, execution.family);
    return { twistBonus: bestBonus([qualifies ? number(input, 'count') : 0]), vaultDoubleBonus: bestBonus([execution.rotationQuarterTurns === 8 ? number(input, 'count') : 0]) };
  }
  if (test.rule === 'T-DOBBELT-FRI') return { freeDoubleBonus: bestBonus(numbers(input, 'freeDoubleCounts')), vaultDoubleBonus: bestBonus(numbers(input, 'vaultDoubleCounts')) };
  if (test.rule === 'C-RETNING') return { deduction: pureDirectionDeduction(numbers(input, 'pureForwardCounts'), numbers(input, 'pureBackwardCounts')).value };
  if (test.rule === 'C-REDSKAB') {
    const vault = input.vaultCounts ? numbers(input, 'vaultCounts') : strings(input, 'apparatusByRound').map((item) => item === 'vault' ? 6 : 0);
    const free = input.freeCounts ? numbers(input, 'freeCounts') : strings(input, 'apparatusByRound').map((item) => item === 'free' ? 6 : 0);
    const result = apparatusDeduction(vault, free);
    return { deduction: result.value, officialDeduction: result.value, status: result.status, issue: result.issues[0] };
  }
  if (test.rule === 'C-GENTAG') {
    const result = repetitionDeduction(numbers(input, 'identityCounts'), input.sameAthletes === true);
    return { deduction: result.value, officialDeduction: result.value, status: result.status, issue: result.issues[0] };
  }
  if (test.rule === 'C-ORDEN') {
    const round = number(input, 'round');
    const result = orderCheck(input.rotations ? numbers(input, 'rotations') : input.rotationCategories ? numbers(input, 'rotationCategories') : [], input.D ? strings(input, 'D').map(Fraction.from) : [], round);
    return { compliant: result.compliant, deduction: result.deduction.value, officialDeduction: result.deduction.value, status: result.deduction.status, issue: result.deduction.issues[0], applyRound2And3OrderDeduction: result.applies };
  }
  if (test.rule === 'D-HOLD') {
    const result = holdReference(numbers(input, 'identityCounts'));
    return { status: result.status, issue: result.issues[0], officialAdjustedD: null };
  }
  if (test.rule === 'B-ELEMENT') {
    const result = input.distinctCountsByRound ? elementBonus(input.distinctCountsByRound as number[][]) : elementBonusForAthlete(number(input, 'distinctCount'));
    return { status: result.status, issue: result.issues[0], officialBonus: result.value, alternatives: result.alternatives, alternativesPerAthlete: result.alternatives };
  }
  if (test.rule === 'P01') {
    if (input.profile === 'mix') return { countingMixCompliant: mixQuotaCheck(strings(input, 'countingCategories').map((item) => item === 'pige' ? 'girl' : 'boy')) === 'known' };
    const extra = number(input, 'extraFirst');
    const counting = number(input, 'countingLast', number(input, 'entries'));
    return { validStructure: participantStructure([...Array.from({ length: extra }, () => 'extra' as const), ...Array.from({ length: counting }, () => 'counting' as const)]) };
  }
  if (test.rule === 'P03') return { analysisStatus: number(input, 'countingFilled') < 6 ? 'incomplete' : 'known', inventMissingAthleteCDeduction: PLANNING_BOUNDARIES.inventMissingAthleteCDeduction };
  if (test.rule === 'TAL') { const panel = Fraction.from(string(input, 'raw')).panelFloor(); return { panel, display: formatPoints(panel) }; }
  if (test.rule === 'ID01') {
    if (input.sourceRowA) return { sameIdentity: elementIdentity(source(string(input, 'sourceRowA')).execution) === elementIdentity(source(string(input, 'sourceRowB')).execution) };
    const base = structuredClone(source('a3-b-16').execution);
    if (input.positionsA) {
      const a = { ...base, bodyPositions: input.positionsA as ElementExecution['bodyPositions'] };
      const b = { ...base, bodyPositions: input.positionsB as ElementExecution['bodyPositions'] };
      return { sameDPositionBasis: positionBasis(a.bodyPositions) === positionBasis(b.bodyPositions), sameCIdentity: elementIdentity(a) === elementIdentity(b) };
    }
    const a = numbers(input, 'twistHalfTurnsA'); const b = numbers(input, 'twistHalfTurnsB');
    return { sameIdentity: elementIdentity({ ...base, twistsHalfTurns: a.reduce((sum, value) => sum + value, 0), twistDistribution: a }) === elementIdentity({ ...base, twistsHalfTurns: b.reduce((sum, value) => sum + value, 0), twistDistribution: b }) };
  }
  if (test.rule === 'rhythm') {
    if (input.momentA) {
      const a = DK_RHYTHM_CATALOG.find((item) => item.id === input.momentA)!;
      const b = DK_RHYTHM_CATALOG.find((item) => item.id === input.momentB)!;
      expect(Fraction.from(a.value).compare(b.value)).toBe(0);
      return { sameMoment: a.id === b.id, valueForBoth: Fraction.from(a.value) };
    }
    if (input.category) return { included: DK_RHYTHM_CATALOG.some((item) => item.category === input.category) };
    const ratings = (input.ratings ?? []) as (Stability | null)[];
    const cells: RhythmCell[] = Array.from({ length: number(input, 'teamSize') }, (_, index) => ({ athleteId: `synthetic-${index}`, athleteName: `Test ${index}`, registrationId: index < ratings.length ? `registration-${index}` : null,
      stability: ratings[index] ?? null, state: index >= ratings.length ? 'missing' : ratings[index] === null ? 'not-assessed' : 'assessed' }));
    const result = summarizeRhythmCells(cells, (input.threshold ?? null) as Stability | null);
    return { coverage: result.coverage, ratingCoverage: result.ratingCoverage, commonForAll: result.common, commonWithoutThreshold: result.common,
      mean: result.meanExact, minimum: result.minimum, lowCount: result.lowCount, passesThreshold: result.passesThreshold,
      commonMoments: cells.length ? undefined : rhythmCommonality(createWorkspace(), 'empty-team', DK_RHYTHM_CATALOG) };
  }
  throw new Error(`Facitreglen mangler inputadapter: ${test.rule}`);
}

function compare(actualValue: unknown, expectedValue: unknown) {
  if (actualValue instanceof Fraction && typeof expectedValue === 'string') { expect(actualValue.compare(Fraction.from(expectedValue))).toBe(0); return; }
  if (Array.isArray(expectedValue)) { expect(Array.isArray(actualValue)).toBe(true); expect((actualValue as unknown[]).length).toBe(expectedValue.length); expectedValue.forEach((value, index) => compare((actualValue as unknown[])[index], value)); return; }
  if (expectedValue && typeof expectedValue === 'object') { for (const [key, value] of Object.entries(expectedValue)) compare((actualValue as Record<string, unknown>)[key], value); return; }
  expect(actualValue).toEqual(expectedValue);
}

describe('77 faste facitcases — forventninger fra den separate referencefil', () => {
  it('har præcis 77 forskellige facit-id-er og ingen udeladte adapters', () => { expect(cases).toHaveLength(77); expect(new Set(cases.map((test) => test.id)).size).toBe(77); });
  it.each(cases)('$id · $rule', (test) => {
    const result = actual(test);
    for (const [key, expected] of Object.entries(test.expected)) {
      expect(Object.hasOwn(result, key), `${test.id}: mangler ${key}; ${canonicalJson(test.input)}`).toBe(true);
      compare(result[key], expected);
    }
  });
});
