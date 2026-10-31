import { Fraction, activePlannedSpot, bindingFingerprint, roundStability, sumFractions } from '@teamgym/domain';
import type { AthleteSkill, Diagnostic, EvaluationStatus, PlannedSpot, RoundEntry, ReserveEntry, SkillDefinition, SourceReference, SpringDiscipline, Workspace } from '@teamgym/domain';
import type { SpotRate, SpotRates, TeamProfile } from './dk-data';
import type { NumericDecision, OrderResult } from './dk-numeric';
import { apparatusDeduction, bestBonus, combineStatus, compositionTotal, divideDecision, elementBonus, holdRound, known, mixQuotaCheck, orderCheck, resolvedOrderCheck, participantStructure,
  PLANNING_BOUNDARIES, plannedExecutionCeiling, plannedMaximumScore, pureDirectionDeduction, spottedTopThreeDifficulty, repetitionDeduction, resolvedElementBonus, resolvedRepetitionDeduction, sumDecisions, trampetTwistQualifies, uncertain } from './dk-numeric';
import { evaluateSpringSkill, normalizeElement } from './dk-spring';
import type { SpringSkillEvaluation } from './dk-spring';

export interface RuleContribution {
  id: string; label: string; kind: 'base' | 'bonus' | 'deduction' | 'observation';
  decision: NumericDecision; sources: readonly SourceReference[]; affectedIds: readonly string[];
  guideCounts?: readonly (readonly number[])[];
}

export interface ParticipantEvaluation {
  entry: RoundEntry;
  athleteName: string;
  registration: AthleteSkill | null;
  skill: Exclude<SkillDefinition, { discipline: 'rhythm' }> | null;
  evaluation: SpringSkillEvaluation | null;
  status: EvaluationStatus;
  identity: string | null;
  originalD: NumericDecision;
  adjustedD: NumericDecision;
  /** Pladsens bidrag til omgangens D efter planlagt modtagning. Rækkefølge, C-HOLD og C bruger fortsat originalD/adjustedD. */
  spotD: NumericDecision;
  plannedSpot: PlannedSpotEvaluation | null;
  eligibleForC: boolean;
  diagnostics: readonly Diagnostic[];
}

/** En gyldig, aktiv planlagt modtagning. Ekstra gymnaster vises, men deres fradrag tæller 0 (A6-08). */
export interface PlannedSpotEvaluation {
  spot: PlannedSpot; rate: SpotRate | null; counts: boolean;
  executionDeduction: NumericDecision;
}

export interface PlannedExecution { deduction: NumericDecision; count: number; ceiling: NumericDecision }

export interface RoundEvaluation {
  id: string; entries: readonly ParticipantEvaluation[]; counting: readonly ParticipantEvaluation[];
  reserves: readonly ReserveEvaluation[];
  difficulty: NumericDecision; panelD: Fraction | null; status: EvaluationStatus;
  /** Samme omgangssum uden planlagte modtagninger; bruges til modtagningens pris. */
  unspottedDifficulty: NumericDecision;
  plannedExecution: PlannedExecution;
  compositionReady: boolean;
  holdDeduction: NumericDecision; order: OrderResult; orderFaultIds: readonly string[]; sortedEntryIds: readonly string[];
  stability: ReturnType<typeof roundStability>;
}
export type ReserveEvaluation = Omit<ParticipantEvaluation, 'entry'> & { entry: ReserveEntry };

export interface DisciplineEvaluation {
  discipline: SpringDiscipline; status: EvaluationStatus; rounds: readonly RoundEvaluation[];
  difficulty: NumericDecision; panelD: Fraction | null;
  composition: ReturnType<typeof compositionTotal>;
  contributions: readonly RuleContribution[]; diagnostics: readonly Diagnostic[];
  /** Loft: C + D + gennemsnitligt planlagt E-loft. Aldrig en forventet karakter. */
  maximumScore: NumericDecision;
  /** Forskellen til samme loft uden planlagte modtagninger. */
  spotCost: NumericDecision;
  invalidRoundIds: readonly string[];
  planned: true; fullExecutionScore: false;
}

export interface EngineSettings {
  ruleCorrections?: boolean;
  difficultyMultiplier?: string;
  bonusRate?: string;
  baseTumbling?: string;
  baseTrampet?: string;
  elementBonusResolved?: boolean;
  repetitionResolved?: boolean;
  orderResolved?: boolean;
  apparatusRoundsResolved?: boolean;
  spotRates?: SpotRates | null;
}

function scaleDecision(value: NumericDecision, scale: string): NumericDecision {
  if (value.value !== null) return known(value.value.multiply(scale));
  return uncertain(value.status === 'known' ? 'incomplete' : value.status, value.issues, value.knownSubtotal.multiply(scale), Object.fromEntries(Object.entries(value.alternatives).map(([key, amount]) => [key, amount.multiply(scale)])));
}

function diagnostic(code: string, message: string, affectedIds: string[], status: Diagnostic['status'] = 'invalid'): Diagnostic {
  return { code, message, affectedIds, status, sources: [] };
}

export function evaluateDiscipline(workspace: Workspace, teamId: string, discipline: SpringDiscipline, scenarioId: string, profile: TeamProfile, settings: EngineSettings = {}): DisciplineEvaluation {
  const team = workspace.teams.find((item) => item.id === teamId);
  const plan = workspace.plans.find((item) => item.teamId === teamId);
  if (!team || !plan) throw new Error('Holdets plan findes ikke.');
  const athletes = new Map(workspace.athletes.map((item) => [item.id, item]));
  const registrations = new Map(workspace.athleteSkills.map((item) => [item.id, item]));
  const definitions = new Map(workspace.skills.map((item) => [item.id, item]));
  const diagnostics: Diagnostic[] = [];
  const contributions: RuleContribution[] = [];
  const bonusRate = settings.bonusRate ?? '0.10';
  const scenario = plan[discipline].find((item) => item.id === scenarioId);
  if (!scenario) throw new Error('Scenariet findes ikke i holdets disciplin.');
  const rawRounds = scenario.rounds;

  function evaluateEntry<T extends RoundEntry | ReserveEntry>(entry: T): Omit<ParticipantEvaluation, 'entry'> & { entry: T } {
    const athlete = athletes.get(entry.athleteId);
    const registration = entry.athleteSkillId ? registrations.get(entry.athleteSkillId) : undefined;
    const definition = registration ? definitions.get(registration.skillId) : undefined;
    const skill = definition && definition.discipline === discipline ? definition : null;
    const local: Diagnostic[] = [];
    if (!athlete || athlete.archived || athlete.teamId !== teamId) local.push(diagnostic('athlete-unavailable', 'Gymnasten er arkiveret eller ikke længere på holdet.', [entry.id, entry.athleteId]));
    if (!registration || !skill) local.push(diagnostic('skill-missing', 'Vælg gymnastens registrerede færdighed i denne disciplin.', [entry.id], 'incomplete'));
    if (registration?.archived || skill?.archived) local.push(diagnostic('skill-archived', 'Færdigheden er arkiveret.', [entry.id, ...(registration ? [registration.id] : [])]));
    const evaluation = skill ? evaluateSpringSkill(skill, registration?.connectionConfirmation, settings.ruleCorrections) : null;
    let originalD = evaluation?.difficulty ?? uncertain('incomplete');
    if (settings.difficultyMultiplier) originalD = scaleDecision(originalD, settings.difficultyMultiplier);
    const status = combineStatus([evaluation?.status ?? 'incomplete', ...local.map((item) => item.status)]);
    const available = !local.some((item) => item.status === 'invalid' || item.status === 'incomplete');
    if (evaluation?.validity !== 'known') local.push(diagnostic('skill-validity', evaluation?.connection === 'unverified' ? 'Forbindelsen skal registreres og bekræftes konkret.' : 'Færdighedens variant eller regelkobling kræver gennemgang.', [entry.id], evaluation?.validity === 'invalid' ? 'invalid' : 'unresolved'));
    if (!available || evaluation?.validity === 'invalid' || settings.ruleCorrections && evaluation?.validity !== 'known')
      originalD = uncertain(status === 'known' ? 'incomplete' : status, originalD.issues, originalD.knownSubtotal, originalD.alternatives);
    return { entry, athleteName: athlete?.name ?? 'Ukendt gymnast', registration: registration ?? null, skill, evaluation, status,
      identity: available && evaluation?.validity === 'known' ? evaluation.identity : null, originalD, adjustedD: originalD, spotD: originalD, plannedSpot: null,
      eligibleForC: available && evaluation?.validity === 'known', diagnostics: local };
  }

  function applyPlannedSpot(item: ParticipantEvaluation) {
    const spot = item.registration ? activePlannedSpot(item.entry, item.registration) : null;
    if (!spot || !item.skill) return;
    const counts = item.entry.role === 'counting';
    const rate = settings.spotRates?.find((candidate) => candidate.grade === spot.grade) ?? null;
    const missing = uncertain('unresolved', ['SPOT-RATES']);
    item.plannedSpot = { spot, rate, counts, executionDeduction: !counts ? known(0) : rate ? known(rate.executionDeduction) : missing };
    if (!rate) { item.spotD = uncertain('unresolved', ['SPOT-RATES'], item.adjustedD.knownSubtotal); return; }
    // Afvigelse i holdomgangen vurderes før modtagningen; et nulstillet bidrag forbliver 0.
    if (!rate.halvesDifficulty || item.adjustedD !== item.originalD) { item.spotD = item.adjustedD; return; }
    if (item.skill.discipline === 'trampet' || item.adjustedD.value === null) {
      item.spotD = item.skill.discipline === 'trampet' ? scaleDecision(item.adjustedD, '1/2') : item.adjustedD;
      return;
    }
    const elements = item.evaluation!.elementValues.map((element) => ({ identity: element.identity, value: element.value.value! }));
    const halved = spottedTopThreeDifficulty(elements, spot.elementIndex ?? elements.length - 1);
    item.spotD = settings.difficultyMultiplier ? scaleDecision(halved, settings.difficultyMultiplier) : halved;
  }

  const rounds: RoundEvaluation[] = rawRounds.map((round, roundIndex) => {
    const entries = round.entries.map(evaluateEntry);
    const counting = entries.filter((item) => item.entry.role === 'counting');
    const invalidStructure = !participantStructure(entries.map((item) => item.entry.role), profile.counting, profile.extra);
    let status = combineStatus([counting.length === profile.counting ? 'known' : 'incomplete', ...counting.map((item) => item.status)]);
    if (invalidStructure) { status = 'invalid'; diagnostics.push(diagnostic('participant-limits', 'Antal tællende/ekstra eller rækkefølgen opfylder ikke holdprofilen.', [round.id])); }
    if (profile.mixQuota) {
      const mix = mixQuotaCheck(counting.map((item) => athletes.get(item.entry.athleteId)?.mixCategory ?? null), profile.mixQuota.girl, profile.mixQuota.boy);
      status = combineStatus([status, mix]);
      if (mix !== 'known') diagnostics.push(diagnostic('mix-quota', 'De tællende skal opfylde holdprofilens eksplicitte mixfordeling.', [round.id], mix === 'invalid' ? 'invalid' : 'incomplete'));
    }
    const apparatuses = new Set(entries.map((item) => item.evaluation?.apparatus).filter((value) => value === 'vault' || value === 'free'));
    const mixedApparatus = discipline === 'trampet' && Boolean(settings.apparatusRoundsResolved) && apparatuses.size > 1;
    if (mixedApparatus) {
      status = 'invalid';
      diagnostics.push(diagnostic('mixed-apparatus', `${roundIndex + 1}. omgang blander spring med og uden Pegasus. Pegasus står foran trampolinen hele omgangen eller slet ikke.`, [round.id]));
    }
    const compositionReady = !invalidStructure && !mixedApparatus && counting.length === profile.counting && counting.every((item) => item.eligibleForC) &&
      (!profile.mixQuota || mixQuotaCheck(counting.map((item) => athletes.get(item.entry.athleteId)?.mixCategory ?? null), profile.mixQuota.girl, profile.mixQuota.boy) === 'known');
    let holdDeduction = known(0);
    if (roundIndex === 0) {
      const hold = holdRound(counting.map((item) => item.identity), counting.map((item) => item.originalD.value), profile.counting);
      holdDeduction = hold.deduction;
      for (const item of counting) {
        if (hold.referenceIdentity === null) item.adjustedD = uncertain(hold.status === 'known' ? 'incomplete' : hold.status, hold.issues);
        else if (item.identity !== null && item.identity !== hold.referenceIdentity) item.adjustedD = known(0);
        else item.adjustedD = item.originalD;
      }
    }
    for (const item of entries) { item.spotD = item.adjustedD; applyPlannedSpot(item); }
    const roundSum = (values: readonly NumericDecision[]) => {
      let sum = sumDecisions(values);
      if (counting.length !== profile.counting && sum.status === 'known') sum = uncertain('incomplete', [], sum.knownSubtotal);
      if (status === 'invalid') sum = uncertain('invalid', sum.issues, sum.knownSubtotal, sum.alternatives);
      return sum;
    };
    const difficulty = roundSum(counting.map((item) => item.spotD));
    const unspottedDifficulty = roundSum(counting.map((item) => item.adjustedD));
    const spotted = counting.filter((item) => item.plannedSpot);
    const executionDeduction = sumDecisions(spotted.map((item) => item.plannedSpot!.executionDeduction));
    const plannedExecution: PlannedExecution = { deduction: executionDeduction, count: spotted.length, ceiling: plannedExecutionCeiling(executionDeduction) };
    const order = settings.orderResolved
      ? resolvedOrderCheck(counting.map((item) => item.evaluation?.orderCategory ?? null), counting.map((item) => item.originalD), roundIndex + 1)
      : orderCheck(entries.map((item) => item.evaluation?.rotationCategory ?? null), entries.map((item) => item.originalD.value), roundIndex + 1);
    const orderFaultIds = order.faultIndexes.map((index) => counting[index]!.entry.id);
    if (counting.length !== profile.counting && roundIndex > 0 && (settings.ruleCorrections || order.deduction.status === 'known')) order.deduction = uncertain('incomplete');
    const sorted = [...entries].sort((a, b) => (a.entry.role === 'extra' ? 0 : 1) - (b.entry.role === 'extra' ? 0 : 1) ||
      ((settings.orderResolved ? a.evaluation?.orderCategory : a.evaluation?.rotationCategory) ?? Number.MAX_SAFE_INTEGER) -
        ((settings.orderResolved ? b.evaluation?.orderCategory : b.evaluation?.rotationCategory) ?? Number.MAX_SAFE_INTEGER) ||
      (a.originalD.value && b.originalD.value ? a.originalD.value.compare(b.originalD.value) : 0));
    diagnostics.push(...entries.flatMap((item) => item.diagnostics));
    return { id: round.id, entries, counting, reserves: round.reserves.map((entry) => evaluateEntry(entry)), difficulty, panelD: difficulty.value?.panelFloor() ?? null, status, unspottedDifficulty, plannedExecution, compositionReady,
      holdDeduction, order, orderFaultIds, sortedEntryIds: sorted.map((item) => item.entry.id), stability: roundStability(workspace, round.entries, profile, teamId) };
  });

  function add(id: string, label: string, kind: RuleContribution['kind'], decision: NumericDecision, section: string, affectedIds: string[], page: number, guideCounts?: readonly (readonly number[])[]) {
    contributions.push({ id, label, kind, decision, sources: [{ sourceId: 'H', section, page }], affectedIds, ...(guideCounts ? { guideCounts } : {}) });
  }
  const prefix = discipline === 'tumbling' ? '9' : '10';
  const page = discipline === 'tumbling' ? 30 : 40;
  const allEntryIds = rounds.flatMap((round) => round.counting.map((item) => item.entry.id));
  const base = Fraction.from(discipline === 'tumbling' ? settings.baseTumbling ?? '0' : settings.baseTrampet ?? '1');
  add('C-GRUND', 'Grundværdi', 'base', known(base), `${prefix}.2.1`, [plan.id], page);
  add('C-HOLD', 'Afvigelser i holdomgangen', 'deduction', rounds[0]!.holdDeduction, `${prefix}.2.2.1`, [rounds[0]!.id, ...rounds[0]!.counting.filter((item) => item.adjustedD.value?.compare(0) === 0).map((item) => item.entry.id)], page);

  const identities = [...new Set(rounds.flatMap((round) => round.counting.filter((item) => item.eligibleForC && item.identity).map((item) => item.identity!)))];
  const repeatResults = identities.map((identity) => {
    const matches = rounds.map((round) => round.counting.filter((item) => item.eligibleForC && item.identity === identity));
    const identityCounts = matches.map((items) => items.length);
    if (settings.repetitionResolved) return resolvedRepetitionDeduction(identityCounts, profile.counting);
    const nonempty = matches.filter((items) => items.length > 0);
    const sameAthletes = nonempty.length <= 1 || nonempty.every((items) => items.map((item) => item.entry.athleteId).sort().join('|') === nonempty[0]!.map((item) => item.entry.athleteId).sort().join('|'));
    return repetitionDeduction(identityCounts, sameAthletes, profile.counting);
  });
  let repeat = sumDecisions(repeatResults);
  const allComplete = rounds.every((round) => round.compositionReady);
  if (!allComplete && repeat.status === 'known') repeat = uncertain('incomplete', [], repeat.knownSubtotal);
  const repeatRoundIds = settings.repetitionResolved ? rounds.flatMap((round, roundIndex) => {
    const relevant = identities.some((identity) => {
      const identityCounts = rounds.map((candidate) => candidate.counting.filter((item) => item.eligibleForC && item.identity === identity).length);
      const maximum = Math.max(...identityCounts);
      const tiedMaximum = identityCounts.filter((count) => count === maximum).length > 1;
      return identityCounts[roundIndex]! > 0 && identityCounts.filter((count) => count > 0).length > 1 &&
        (tiedMaximum || identityCounts[roundIndex] !== maximum);
    });
    return relevant ? [round.id] : [];
  }) : allEntryIds;
  add('C-GENTAG', 'Gentagne serier eller spring mellem omgange', 'deduction', repeat, `${prefix}.2.2.3`, repeatRoundIds, page);
  for (const [index, round] of rounds.entries()) if (index > 0) add(`C-ORDEN-${index + 1}`, `Rækkefølge i omgang ${index + 1}`, 'deduction', round.order.deduction, `${prefix}.2.2.2`,
    settings.orderResolved ? [round.id, ...round.orderFaultIds] : [round.id, ...round.entries.map((item) => item.entry.id)], page);

  function qualifyingBonus(predicate: (participant: ParticipantEvaluation) => boolean) {
    const counts = rounds.map((round) => round.counting.filter((item) => item.eligibleForC && predicate(item)).length);
    const value = bestBonus(counts, profile.counting, bonusRate);
    // Et fuldt maksimum kan være kendt trods mangler i andre omgange.
    return { decision: allComplete || rounds.some((round, index) => round.compositionReady && counts[index] === profile.counting) ? known(value) : uncertain('incomplete', [], value), counts };
  }
  if (discipline === 'tumbling') {
    const forwards = rounds.map((round) => round.counting.filter((item) => item.eligibleForC && item.evaluation?.pureForward).length);
    const backwards = rounds.map((round) => round.counting.filter((item) => item.eligibleForC && item.evaluation?.pureBackward).length);
    let direction = allComplete || rounds.some((round, index) => round.compositionReady && forwards[index] === profile.counting) && rounds.some((round, index) => round.compositionReady && backwards[index] === profile.counting) ?
      pureDirectionDeduction(forwards, backwards, profile.counting) : uncertain('incomplete');
    const bestForward = forwards.flatMap((count, index) => count === Math.max(...forwards) ? [index] : []);
    const bestBackward = backwards.flatMap((count, index) => count === Math.max(...backwards) ? [index] : []);
    if (settings.ruleCorrections && allComplete && direction.value !== null &&
      Math.max(...forwards) < profile.counting && Math.max(...backwards) < profile.counting &&
      !bestForward.some((forwardIndex) => bestBackward.some((backwardIndex) => forwardIndex !== backwardIndex))) {
      direction = uncertain('unresolved', ['C-RETNING-VALG'], 0, { independentMaxima: direction.value });
    }
    add('C-RETNING', 'Ren forlæns og ren baglæns omgang', 'deduction', direction, '9.2.2.4', allEntryIds, page, [forwards, backwards]);
    const twist = qualifyingBonus((item) => Boolean(item.evaluation?.hasBaneTwist));
    add('B-SKRUE', 'Mindst 360° i ét element', 'bonus', twist.decision, '9.2.3.1', allEntryIds, 31, [twist.counts]);
    const double = qualifyingBonus((item) => Boolean(item.evaluation?.hasDouble));
    add('B-DOBBELT', 'Dobbeltsalto', 'bonus', double.decision, '9.2.3.2', allEntryIds, 31, [double.counts]);
    const countedElements = rounds.map((round) => round.counting.filter((item) => item.eligibleForC).map((item) => item.evaluation!.distinctElementCount));
    const bonus = settings.elementBonusResolved ? resolvedElementBonus(countedElements, allComplete) :
      settings.ruleCorrections && countedElements.every((round) => round.length === 0) ? uncertain('incomplete') : elementBonus(countedElements);
    add('B-ELEMENT', settings.elementBonusResolved ? 'Forskellige elementer efter seriens første' : 'Forskellige elementer — to fortolkningsspor', 'bonus', bonus, '9.2.3.3', allEntryIds, 31,
      [countedElements.map((round) => round.reduce((sum, value) => sum + Math.max(0, value - 1), 0))]);
  } else {
    const vault = rounds.map((round) => round.counting.filter((item) => item.eligibleForC && item.evaluation?.apparatus === 'vault').length);
    const free = rounds.map((round) => round.counting.filter((item) => item.eligibleForC && item.evaluation?.apparatus === 'free').length);
    const apparatusSatisfied = rounds.some((round, index) => round.compositionReady && vault[index] === profile.counting) && rounds.some((round, index) => round.compositionReady && free[index] === profile.counting);
    const mixedRoundIds = settings.apparatusRoundsResolved ? diagnostics.filter((item) => item.code === 'mixed-apparatus').flatMap((item) => item.affectedIds) : [];
    const apparatus = mixedRoundIds.length > 0 ? uncertain('invalid') : allComplete ? apparatusDeduction(vault, free, profile.counting) : apparatusSatisfied ? known(0) : uncertain('incomplete');
    add('C-REDSKAB', 'Omgang med og uden Pegasus', 'deduction', apparatus, '10.2.2.5', mixedRoundIds.length > 0 ? mixedRoundIds : allEntryIds, page, [vault, free]);
    const twist = qualifyingBonus((item) => {
      if (item.skill?.discipline !== 'trampet') return false;
      const element = normalizeElement(item.skill.jump);
      const halfTurnsAfterHands = typeof element.variant.twistAfterHandsHalfTurns === 'number' ? element.variant.twistAfterHandsHalfTurns : element.twistsHalfTurns;
      return trampetTwistQualifies(profile.ageGroup, element.rotationQuarterTurns / 4, halfTurnsAfterHands, element.family);
    });
    add('T-SKRUE', 'Skruetillæg efter aldersprofil', 'bonus', twist.decision, '10.2.3.1 og 10.2.4', allEntryIds, 41, [twist.counts]);
    const freeDouble = qualifyingBonus((item) => item.evaluation?.rotationCategory === 2 && item.evaluation.apparatus === 'free');
    add('T-DOBBELT-FRI', 'Dobbeltspring uden redskab', 'bonus', freeDouble.decision, '10.2.3.2', allEntryIds, 41, [freeDouble.counts]);
    const vaultDouble = qualifyingBonus((item) => item.evaluation?.rotationCategory === 2 && item.evaluation.apparatus === 'vault');
    add('T-DOBBELT-REDSKAB', 'Dobbeltspring med redskab', 'bonus', vaultDouble.decision, '10.2.3.3', allEntryIds, 41, [vaultDouble.counts]);
  }
  add('C-FLOW', 'Flow kræver observation', 'observation', uncertain('incomplete', ['REQUIRES-OBSERVATION']), `${prefix}.2.2.${discipline === 'tumbling' ? '5' : '4'}`, [], page);
  const bonuses = contributions.filter((item) => item.kind === 'bonus').map((item) => item.decision);
  const deductions = contributions.filter((item) => item.kind === 'deduction').map((item) => item.decision);
  const composition = compositionTotal(base, bonuses, deductions);
  if (rounds.some((round) => round.status === 'invalid')) Object.assign(composition, { status: 'invalid', raw: null, value: null, panel: null });
  let difficulty = divideDecision(sumDecisions(rounds.map((round) => round.difficulty)), 3);
  let unspottedDifficulty = divideDecision(sumDecisions(rounds.map((round) => round.unspottedDifficulty)), 3);
  if (team.archived || plan.bindingFingerprint !== bindingFingerprint(team.rulesetBinding)) {
    const status = team.archived ? 'invalid' : 'unresolved';
    difficulty = uncertain(status, ['PLAN-CONTEXT'], difficulty.knownSubtotal, difficulty.alternatives);
    unspottedDifficulty = uncertain(status, ['PLAN-CONTEXT'], unspottedDifficulty.knownSubtotal);
    Object.assign(composition, { status, raw: null, value: null, panel: null });
    diagnostics.push(diagnostic('plan-context', team.archived ? 'Holdet er arkiveret.' : 'Planens regelgrundlag kræver gennemgang.', [plan.id], status));
  }
  const invalidRoundIds = rounds.filter((round) => round.status === 'invalid').map((round) => round.id);
  const roundStatus = combineStatus(rounds.map((round) => round.status));
  const withRounds = (decision: NumericDecision) => invalidRoundIds.length > 0 ? uncertain('invalid', decision.issues, decision.knownSubtotal) :
    roundStatus !== 'known' && decision.value !== null ? uncertain(roundStatus, decision.issues, decision.knownSubtotal) : decision;
  const maximumScore = withRounds(plannedMaximumScore(composition, difficulty, rounds.map((round) => round.plannedExecution.ceiling)));
  const unspottedMaximum = withRounds(plannedMaximumScore(composition, unspottedDifficulty, rounds.map(() => known(10))));
  const spotCost = maximumScore.value !== null && unspottedMaximum.value !== null ? known(unspottedMaximum.value.subtract(maximumScore.value)) :
    uncertain(combineStatus([maximumScore.status, unspottedMaximum.status, 'incomplete']) as Exclude<EvaluationStatus, 'known'>, [...new Set([...maximumScore.issues, ...unspottedMaximum.issues])], unspottedMaximum.knownSubtotal.subtract(maximumScore.knownSubtotal));
  return { discipline, rounds, difficulty, panelD: difficulty.value?.panelFloor() ?? null, composition, contributions, diagnostics, maximumScore, spotCost, invalidRoundIds,
    status: combineStatus([difficulty.status, composition.status, ...rounds.map((round) => round.status)]), planned: true, fullExecutionScore: false };
}

export function knownContributionSum(analysis: DisciplineEvaluation, kind: 'bonus' | 'deduction'): Fraction {
  return sumFractions(analysis.contributions.filter((item) => item.kind === kind).map((item) => item.decision.knownSubtotal));
}

export { PLANNING_BOUNDARIES };
