import { canonicalJson, elementExecutionSchema, Fraction, skillIdentity } from '@teamgym/domain';
import type { AthleteSkill, ElementExecution, EvaluationStatus, SkillDefinition, SourceReference } from '@teamgym/domain';
import { DK_SPRING_CATALOG } from './catalog';
import type { NumericDecision } from './dk-numeric';
import { known, topThreeDifficulty, twistIncrement, uncertain, combineStatus } from './dk-numeric';

type Position = ElementExecution['bodyPositions'][number];
const ranks: Record<Position, number> = { tuck: 0, pike: 1, straight: 2 };
export function positionBasis(positions: readonly Position[]): Position {
  if (!positions.length) throw new Error('Kropsposition mangler.');
  return [...positions].sort((a, b) => ranks[a] - ranks[b])[0]!;
}

export function normalizeElement(input: ElementExecution): ElementExecution {
  const execution = structuredClone(elementExecutionSchema.parse(input));
  if (execution.family === 'kasamatsu' && execution.apparatus === 'pegasus' && execution.bodyPositions.length === 1 &&
    ['tuck', 'straight'].includes(execution.bodyPositions[0]!) && [0, 2].includes(execution.twistsHalfTurns)) {
    execution.family = 'tsukahara';
    execution.direction = 'backward';
    execution.twistsHalfTurns += 2;
    execution.twistDistribution = [execution.twistsHalfTurns];
  }
  if (execution.twistsHalfTurns >= 6 || execution.twistsHalfTurns === 0) execution.twistDistribution = [];
  else if (execution.bodyPositions.length === 1) execution.twistDistribution = [execution.twistsHalfTurns];
  return execution;
}

export function elementIdentity(input: ElementExecution, corrected = false): string {
  const element = normalizeElement(input);
  if (corrected && element.variant.twistAfterHandsHalfTurns === element.twistsHalfTurns) delete element.variant.twistAfterHandsHalfTurns;
  return canonicalJson(element);
}
export function springIdentity(skill: SkillDefinition, corrected = false): string {
  if (skill.discipline === 'rhythm') return skillIdentity(skill);
  return skill.discipline === 'trampet' ? elementIdentity(skill.jump, corrected) : canonicalJson(skill.elements.map((element) => elementIdentity(element, corrected)));
}

export function elementDifficulty(input: ElementExecution): NumericDecision {
  const element = normalizeElement(input);
  const fullRotations = element.rotationQuarterTurns / 4;
  const afterHands = element.variant.twistAfterHandsHalfTurns;
  if (Object.keys(element.variant).some((key) => key !== 'twistAfterHandsHalfTurns')) return uncertain('unresolved', ['UNKNOWN-VARIANT']);
  if (afterHands !== undefined && (element.apparatus !== 'pegasus' || typeof afterHands !== 'number' || !Number.isInteger(afterHands) || afterHands < 0 || afterHands > element.twistsHalfTurns)) return uncertain('invalid', ['TWIST-PLACEMENT']);
  if (afterHands !== undefined && afterHands !== element.twistsHalfTurns) return uncertain('unresolved', ['TWIST-PLACEMENT']);
  if (fullRotations >= 3) return uncertain('invalid', ['DK-TRIPLE-FORBIDDEN']);
  if (!Number.isInteger(fullRotations) || fullRotations < 1 || element.landing !== 'feet') return uncertain('invalid', ['ELEMENT-EXECUTION']);
  const position = positionBasis(element.bodyPositions);
  const shapeIndex = ranks[position];
  const noTwist = element.twistsHalfTurns === 0;
  const fixed: Record<string, string> = element.apparatus === 'floor' ? { cartwheel: '0.10', roundoff: '0.10', handspring: '0.20', flyspring: '0.20', flic: '0.20', whipback: '0.30' } :
    element.apparatus === 'pegasus' ? { 'cartwheel-vault': '0.30', 'handspring-vault': '0.40' } : {};
  const expectedDirection = ['roundoff', 'flic', 'whipback', 'tsukahara'].includes(element.family) ? 'backward' : 'forward';
  if (fixed[element.family] && element.direction !== expectedDirection || ['tsukahara', 'overslag-salto'].includes(element.family) && element.direction !== expectedDirection) return uncertain('invalid', ['ELEMENT-DIRECTION']);
  if (element.apparatus !== 'floor' && element.takeoff !== 'two-feet') return uncertain('invalid', ['ELEMENT-TAKEOFF']);
  if (fixed[element.family] && noTwist && fullRotations === 1 && position === 'straight' && element.bodyPositions.length === 1) return known(fixed[element.family]!);
  let bases: readonly string[] | undefined;
  if (element.family === 'salto' && element.bodyPositions.length === fullRotations) {
    if (element.apparatus === 'floor') bases = fullRotations === 1 ? ['0.20', '0.20', '0.30'] :
      element.direction === 'forward' ? ['1.20', '1.40', '1.60'] : element.direction === 'backward' ? ['0.80', '0.90', '1.10'] : undefined;
    if (element.apparatus === 'trampet' && element.direction === 'forward') bases = fullRotations === 1 ? ['0.10', '0.20', '0.30'] : ['0.70', '0.80', '0.90'];
  }
  if (element.apparatus === 'pegasus' && fullRotations === 2 && element.bodyPositions.length === 1) {
    if (element.family === 'tsukahara') bases = ['0.80', '0.90', '1.10'];
    if (element.family === 'overslag-salto') bases = ['0.90', '1.00', '1.20'];
  }
  if (!bases || (element.direction === 'sideways' && element.family === 'salto')) return uncertain('unresolved', ['UNKNOWN-ELEMENT']);
  if (element.family === 'overslag-salto' && position === 'pike' && element.twistsHalfTurns === 1) {
    return uncertain('unresolved', ['Q02'], 0, { table: Fraction.from('1.20'), formula: Fraction.from('1.10') });
  }
  return known(Fraction.from(bases[shapeIndex]!).add(twistIncrement(element.twistsHalfTurns)));
}

let officialRecordIndex: Map<string, (typeof DK_SPRING_CATALOG)[number]> | undefined;
export function officialSpringRecord(execution: ElementExecution) {
  if (!officialRecordIndex) {
    officialRecordIndex = new Map();
    for (const entry of DK_SPRING_CATALOG) {
      const key = canonicalJson({ ...normalizeElement(entry.execution), twistDistribution: [] });
      if (!officialRecordIndex.has(key)) officialRecordIndex.set(key, entry);
    }
  }
  const normalized = normalizeElement(execution);
  const key = canonicalJson({ ...normalized, twistDistribution: [] });
  return officialRecordIndex.get(key) ?? null;
}

export function connectionStatus(skill: Extract<SkillDefinition, { discipline: 'tumbling' }>, confirmation: AthleteSkill['connectionConfirmation'] = null, corrected = false): 'verified' | 'unverified' | 'invalid' {
  if (skill.elements.some((element) => element.apparatus !== 'floor' || element.landing !== 'feet')) return 'invalid';
  if (corrected && skill.connection.transitions.some((transition) => {
    const asserted = transition.replace(/\b(?:uden|ingen|intet|ikke)\s+(?:(?:et|noget)\s+)?(?:mellemtrin|mellemskridt|pause|fald|step)\b/gi, '');
    return /\b(?:mellemtrin|mellemskridt|pause|fald|step)\b/i.test(asserted);
  })) return 'invalid';
  let standard = skill.connection.transitions.every((transition) => transition === 'direct');
  for (let index = 1; index < skill.elements.length; index++) {
    const before = skill.elements[index - 1]!;
    const after = skill.elements[index]!;
    const backLead = ['roundoff', 'flic', 'whipback'].includes(before.family) && before.twistsHalfTurns % 2 === 0;
    const backFollow = after.family === 'flic' || after.family === 'whipback' || after.family === 'salto' && after.direction === 'backward';
    const frontLead = ['handspring', 'flyspring'].includes(before.family) && before.twistsHalfTurns % 2 === 0;
    const frontFollow = after.family === 'salto' && after.direction === 'forward';
    if (!(backLead && backFollow || frontLead && frontFollow)) standard = false;
  }
  if (standard) return 'verified';
  return confirmation?.executionIdentity === skillIdentity(skill) && confirmation.note.trim() ? 'verified' : 'unverified';
}

export interface SpringSkillEvaluation {
  difficulty: NumericDecision;
  status: EvaluationStatus;
  validity: EvaluationStatus;
  identity: string;
  rotationCategory: number | null;
  connection: 'verified' | 'unverified' | 'invalid';
  elementValues: readonly { identity: string; value: NumericDecision }[];
  distinctElementCount: number;
  pureForward: boolean;
  pureBackward: boolean;
  hasDouble: boolean;
  hasBaneTwist: boolean;
  apparatus: 'free' | 'vault' | 'floor';
  explanation: { countedElementIds: readonly string[]; excludedElementIds: readonly string[]; duplicateCount: number; sources: readonly SourceReference[]; notes: readonly string[] };
}

export function evaluateSpringSkill(skill: Exclude<SkillDefinition, { discipline: 'rhythm' }>, confirmation: AthleteSkill['connectionConfirmation'] = null, corrected = false): SpringSkillEvaluation {
  const elements = skill.discipline === 'tumbling' ? skill.elements : [skill.jump];
  const evaluated = elements.map((element) => ({ identity: elementIdentity(element, corrected), value: elementDifficulty(element) }));
  const baseStatus = combineStatus(evaluated.map((element) => element.value.status));
  const knownElements = evaluated.filter((element): element is { identity: string; value: NumericDecision & { value: Fraction } } => element.value.value !== null);
  const top = topThreeDifficulty(knownElements.map((element) => ({ identity: element.identity, value: element.value.value })));
  let difficulty: NumericDecision = baseStatus === 'known' ? known(top.value) : uncertain(baseStatus,
    [...new Set(evaluated.flatMap((element) => element.value.issues))], top.value);
  if (skill.discipline === 'trampet') difficulty = evaluated[0]!.value;
  const connection = skill.discipline === 'tumbling' ? connectionStatus(skill, confirmation, corrected) : 'verified';
  if (corrected && connection === 'invalid') difficulty = uncertain('invalid', ['INTERRUPTED-CONNECTION'], difficulty.knownSubtotal);
  const allocationMissing = elements.some((element) => element.bodyPositions.length > 1 && element.twistsHalfTurns > 0 && element.twistsHalfTurns < 6 && element.twistDistribution.length !== element.bodyPositions.length);
  const legalStatus = evaluated.every((element) => element.value.status === 'known' || element.value.issues.length === 1 && element.value.issues[0] === 'Q02') ? 'known' : baseStatus;
  const validity = skill.archived || connection === 'invalid' ? 'invalid' : combineStatus([legalStatus, connection === 'unverified' || allocationMissing ? 'incomplete' : 'known']);
  const status = combineStatus([baseStatus, validity]);
  const categories = elements.filter((element) => element.family === 'salto').map((element) => element.rotationQuarterTurns / 4);
  const rotationCategory = skill.discipline === 'trampet' ? skill.jump.rotationQuarterTurns / 4 : categories.length && new Set(categories).size === 1 ? categories[0]! : null;
  const sources: SourceReference[] = elements.flatMap((element) => {
    const record = officialSpringRecord(element);
    return record ? [record.source, { sourceId: 'H', section: skill.discipline === 'tumbling' ? '9.3.5–6' : '10.3.5–6', page: skill.discipline === 'tumbling' ? 33 : 43 }] :
      [{ sourceId: 'H', section: skill.discipline === 'tumbling' ? '9.3.5–6; formelvariant uden trykt kode' : '10.3.5–6; formelvariant uden trykt kode', page: skill.discipline === 'tumbling' ? 33 : 43 }];
  });
  return { difficulty, status, validity, identity: springIdentity(skill, corrected), rotationCategory, connection, elementValues: evaluated,
    distinctElementCount: new Set(evaluated.filter((item) => item.value.status === 'known').map((item) => item.identity)).size,
    pureForward: elements.every((element) => element.direction === 'forward'), pureBackward: elements.every((element) => element.direction === 'backward'),
    hasDouble: categories.includes(2), hasBaneTwist: elements.some((element) => element.twistsHalfTurns >= 2),
    apparatus: skill.discipline === 'tumbling' ? 'floor' : skill.jump.apparatus === 'pegasus' ? 'vault' : 'free',
    explanation: { countedElementIds: top.counted.map((item) => item.identity), excludedElementIds: top.excluded.map((item) => item.identity), duplicateCount: top.duplicates,
      sources, notes: [skill.discipline === 'tumbling' ? 'Højst tre forskellige elementer med højest værdi tæller i D; C bruger sit eget elementgrundlag.' : 'Redskabsspringet værdisættes som én komplet færdighed.',
        ...(allocationMissing ? ['Skruefordeling skal vælges, før den præcise identitet kan godkendes.'] : []),
        ...(connection === 'unverified' ? ['Enkeltfærdigheder godkender ikke den komplette forbindelse.'] : [])] } };
}
