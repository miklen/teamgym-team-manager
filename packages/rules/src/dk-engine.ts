import { Fraction, bindingFingerprint, roundStability, sumFractions } from '@teamgym/domain';
import type { AthleteSkill, Diagnostic, EvaluationStatus, RoundEntry, SkillDefinition, SourceReference, SpringDiscipline, Workspace } from '@teamgym/domain';
import type { TeamProfile } from './dk-data';
import type { NumericDecision } from './dk-numeric';
import { apparatusDeduction, bestBonus, combineStatus, compositionTotal, divideDecision, elementBonus, holdRound, known, mixQuotaCheck, orderCheck, participantStructure,
  PLANNING_BOUNDARIES, pureDirectionDeduction, repetitionDeduction, sumDecisions, trampetTwistQualifies, uncertain } from './dk-numeric';
import { evaluateSpringSkill, normalizeElement } from './dk-spring';
import type { SpringSkillEvaluation } from './dk-spring';

export interface RuleContribution {
  id: string; label: string; kind: 'base' | 'bonus' | 'deduction' | 'observation';
  decision: NumericDecision; sources: readonly SourceReference[]; affectedIds: readonly string[];
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
  eligibleForC: boolean;
  diagnostics: readonly Diagnostic[];
}

export interface RoundEvaluation {
  id: string; entries: readonly ParticipantEvaluation[]; counting: readonly ParticipantEvaluation[];
  difficulty: NumericDecision; panelD: Fraction | null; status: EvaluationStatus;
  compositionReady: boolean;
  holdDeduction: NumericDecision; order: ReturnType<typeof orderCheck>; sortedEntryIds: readonly string[];
  stability: ReturnType<typeof roundStability>;
}

export interface DisciplineEvaluation {
  discipline: SpringDiscipline; status: EvaluationStatus; rounds: readonly RoundEvaluation[];
  difficulty: NumericDecision; panelD: Fraction | null;
  composition: ReturnType<typeof compositionTotal>;
  contributions: readonly RuleContribution[]; diagnostics: readonly Diagnostic[];
  planned: true; fullExecutionScore: false;
}

export interface EngineSettings {
  difficultyMultiplier?: string;
  bonusRate?: string;
  baseTumbling?: string;
  baseTrampet?: string;
}

function scaleDecision(value: NumericDecision, scale: string): NumericDecision {
  if (value.value !== null) return known(value.value.multiply(scale));
  return uncertain(value.status === 'known' ? 'incomplete' : value.status, value.issues, value.knownSubtotal.multiply(scale), Object.fromEntries(Object.entries(value.alternatives).map(([key, amount]) => [key, amount.multiply(scale)])));
}

function diagnostic(code: string, message: string, affectedIds: string[], status: Diagnostic['status'] = 'invalid'): Diagnostic {
  return { code, message, affectedIds, status, sources: [] };
}

export function evaluateDiscipline(workspace: Workspace, teamId: string, discipline: SpringDiscipline, profile: TeamProfile, settings: EngineSettings = {}): DisciplineEvaluation {
  const team = workspace.teams.find((item) => item.id === teamId);
  const plan = workspace.plans.find((item) => item.teamId === teamId);
  if (!team || !plan) throw new Error('Holdets plan findes ikke.');
  const athletes = new Map(workspace.athletes.map((item) => [item.id, item]));
  const registrations = new Map(workspace.athleteSkills.map((item) => [item.id, item]));
  const definitions = new Map(workspace.skills.map((item) => [item.id, item]));
  const diagnostics: Diagnostic[] = [];
  const contributions: RuleContribution[] = [];
  const bonusRate = settings.bonusRate ?? '0.10';
  const rawRounds = plan[discipline];

  function evaluateEntry(entry: RoundEntry): ParticipantEvaluation {
    const athlete = athletes.get(entry.athleteId);
    const registration = entry.athleteSkillId ? registrations.get(entry.athleteSkillId) : undefined;
    const definition = registration ? definitions.get(registration.skillId) : undefined;
    const skill = definition && definition.discipline === discipline ? definition : null;
    const local: Diagnostic[] = [];
    if (!athlete || athlete.archived || athlete.teamId !== teamId) local.push(diagnostic('athlete-unavailable', 'Gymnasten er arkiveret eller ikke længere på holdet.', [entry.id, entry.athleteId]));
    if (!registration || !skill) local.push(diagnostic('skill-missing', 'Vælg gymnastens registrerede færdighed i denne disciplin.', [entry.id], 'incomplete'));
    if (registration?.archived || skill?.archived) local.push(diagnostic('skill-archived', 'Færdigheden er arkiveret.', [entry.id, ...(registration ? [registration.id] : [])]));
    const evaluation = skill ? evaluateSpringSkill(skill, registration?.connectionConfirmation) : null;
    let originalD = evaluation?.difficulty ?? uncertain('incomplete');
    if (settings.difficultyMultiplier) originalD = scaleDecision(originalD, settings.difficultyMultiplier);
    const status = combineStatus([evaluation?.status ?? 'incomplete', ...local.map((item) => item.status)]);
    const available = !local.some((item) => item.status === 'invalid' || item.status === 'incomplete');
    if (evaluation?.validity !== 'known') local.push(diagnostic('skill-validity', evaluation?.connection === 'unverified' ? 'Forbindelsen skal registreres og bekræftes konkret.' : 'Færdighedens variant eller regelkobling kræver gennemgang.', [entry.id], evaluation?.validity === 'invalid' ? 'invalid' : 'unresolved'));
    if (!available || evaluation?.validity === 'invalid') originalD = uncertain(status === 'known' ? 'incomplete' : status, originalD.issues);
    return { entry, athleteName: athlete?.name ?? 'Ukendt gymnast', registration: registration ?? null, skill, evaluation, status,
      identity: available && evaluation?.validity === 'known' ? evaluation.identity : null, originalD, adjustedD: originalD,
      eligibleForC: available && evaluation?.validity === 'known', diagnostics: local };
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
    const compositionReady = !invalidStructure && counting.length === profile.counting && counting.every((item) => item.eligibleForC) &&
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
    let difficulty = sumDecisions(counting.map((item) => item.adjustedD));
    if (counting.length !== profile.counting && difficulty.status === 'known') difficulty = uncertain('incomplete', [], difficulty.knownSubtotal);
    if (status === 'invalid') difficulty = uncertain('invalid', difficulty.issues, difficulty.knownSubtotal, difficulty.alternatives);
    const order = orderCheck(entries.map((item) => item.evaluation?.rotationCategory ?? null), entries.map((item) => item.originalD.value), roundIndex + 1);
    if (counting.length !== profile.counting && roundIndex > 0 && order.deduction.status === 'known') order.deduction = uncertain('incomplete');
    const sorted = [...entries].sort((a, b) => (a.entry.role === 'extra' ? 0 : 1) - (b.entry.role === 'extra' ? 0 : 1) ||
      (a.evaluation?.rotationCategory ?? Number.MAX_SAFE_INTEGER) - (b.evaluation?.rotationCategory ?? Number.MAX_SAFE_INTEGER) ||
      (a.originalD.value && b.originalD.value ? a.originalD.value.compare(b.originalD.value) : 0));
    diagnostics.push(...entries.flatMap((item) => item.diagnostics));
    return { id: round.id, entries, counting, difficulty, panelD: difficulty.value?.panelFloor() ?? null, status, compositionReady,
      holdDeduction, order, sortedEntryIds: sorted.map((item) => item.entry.id), stability: roundStability(workspace, round.entries, profile, teamId) };
  });

  function add(id: string, label: string, kind: RuleContribution['kind'], decision: NumericDecision, section: string, affectedIds: string[], page: number) {
    contributions.push({ id, label, kind, decision, sources: [{ sourceId: 'H', section, page }], affectedIds });
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
    const nonempty = matches.filter((items) => items.length > 0);
    const sameAthletes = nonempty.length <= 1 || nonempty.every((items) => items.map((item) => item.entry.athleteId).sort().join('|') === nonempty[0]!.map((item) => item.entry.athleteId).sort().join('|'));
    return repetitionDeduction(matches.map((items) => items.length), sameAthletes, profile.counting);
  });
  let repeat = sumDecisions(repeatResults);
  const allComplete = rounds.every((round) => round.compositionReady);
  if (!allComplete && repeat.status === 'known') repeat = uncertain('incomplete', [], repeat.knownSubtotal);
  add('C-GENTAG', 'Gentagne serier eller spring mellem omgange', 'deduction', repeat, `${prefix}.2.2.3`, allEntryIds, page);
  for (const [index, round] of rounds.entries()) if (index > 0) add(`C-ORDEN-${index + 1}`, `Rækkefølge i omgang ${index + 1}`, 'deduction', round.order.deduction, `${prefix}.2.2.2`, [round.id, ...round.entries.map((item) => item.entry.id)], page);

  function qualifyingBonus(predicate: (participant: ParticipantEvaluation) => boolean) {
    const counts = rounds.map((round) => round.counting.filter((item) => item.eligibleForC && predicate(item)).length);
    const value = bestBonus(counts, profile.counting, bonusRate);
    // Et fuldt maksimum kan være kendt trods mangler i andre omgange.
    return allComplete || rounds.some((round, index) => round.compositionReady && counts[index] === profile.counting) ? known(value) : uncertain('incomplete', [], value);
  }
  if (discipline === 'tumbling') {
    const forwards = rounds.map((round) => round.counting.filter((item) => item.eligibleForC && item.evaluation?.pureForward).length);
    const backwards = rounds.map((round) => round.counting.filter((item) => item.eligibleForC && item.evaluation?.pureBackward).length);
    const direction = allComplete || rounds.some((round, index) => round.compositionReady && forwards[index] === profile.counting) && rounds.some((round, index) => round.compositionReady && backwards[index] === profile.counting) ?
      pureDirectionDeduction(forwards, backwards, profile.counting) : uncertain('incomplete');
    add('C-RETNING', 'Ren forlæns og ren baglæns omgang', 'deduction', direction, '9.2.2.4', allEntryIds, page);
    add('B-SKRUE', 'Mindst 360° i ét element', 'bonus', qualifyingBonus((item) => Boolean(item.evaluation?.hasBaneTwist)), '9.2.3.1', allEntryIds, 31);
    add('B-DOBBELT', 'Dobbeltsalto', 'bonus', qualifyingBonus((item) => Boolean(item.evaluation?.hasDouble)), '9.2.3.2', allEntryIds, 31);
    const bonus = elementBonus(rounds.map((round) => round.counting.filter((item) => item.eligibleForC).map((item) => item.evaluation!.distinctElementCount)));
    add('B-ELEMENT', 'Forskellige elementer — to fortolkningsspor', 'bonus', bonus, '9.2.3.3', allEntryIds, 31);
  } else {
    const vault = rounds.map((round) => round.counting.filter((item) => item.eligibleForC && item.evaluation?.apparatus === 'vault').length);
    const free = rounds.map((round) => round.counting.filter((item) => item.eligibleForC && item.evaluation?.apparatus === 'free').length);
    const apparatusSatisfied = rounds.some((round, index) => round.compositionReady && vault[index] === profile.counting) && rounds.some((round, index) => round.compositionReady && free[index] === profile.counting);
    add('C-REDSKAB', 'Omgang med og uden Pegasus', 'deduction', allComplete ? apparatusDeduction(vault, free, profile.counting) : apparatusSatisfied ? known(0) : uncertain('incomplete'), '10.2.2.5', allEntryIds, page);
    add('T-SKRUE', 'Skruetillæg efter aldersprofil', 'bonus', qualifyingBonus((item) => {
      if (item.skill?.discipline !== 'trampet') return false;
      const element = normalizeElement(item.skill.jump);
      const halfTurnsAfterHands = typeof element.variant.twistAfterHandsHalfTurns === 'number' ? element.variant.twistAfterHandsHalfTurns : element.twistsHalfTurns;
      return trampetTwistQualifies(profile.ageGroup, element.rotationQuarterTurns / 4, halfTurnsAfterHands, element.family);
    }), '10.2.3.1 og 10.2.4', allEntryIds, 41);
    add('T-DOBBELT-FRI', 'Dobbeltspring uden redskab', 'bonus', qualifyingBonus((item) => item.evaluation?.rotationCategory === 2 && item.evaluation.apparatus === 'free'), '10.2.3.2', allEntryIds, 41);
    add('T-DOBBELT-REDSKAB', 'Dobbeltspring med redskab', 'bonus', qualifyingBonus((item) => item.evaluation?.rotationCategory === 2 && item.evaluation.apparatus === 'vault'), '10.2.3.3', allEntryIds, 41);
  }
  add('C-FLOW', 'Flow kræver observation', 'observation', uncertain('incomplete', ['REQUIRES-OBSERVATION']), `${prefix}.2.2.${discipline === 'tumbling' ? '5' : '4'}`, [], page);
  const bonuses = contributions.filter((item) => item.kind === 'bonus').map((item) => item.decision);
  const deductions = contributions.filter((item) => item.kind === 'deduction').map((item) => item.decision);
  const composition = compositionTotal(base, bonuses, deductions);
  if (rounds.some((round) => round.status === 'invalid')) Object.assign(composition, { status: 'invalid', raw: null, value: null, panel: null });
  let difficulty = divideDecision(sumDecisions(rounds.map((round) => round.difficulty)), 3);
  if (team.archived || plan.bindingFingerprint !== bindingFingerprint(team.rulesetBinding)) {
    const status = team.archived ? 'invalid' : 'unresolved';
    difficulty = uncertain(status, ['PLAN-CONTEXT'], difficulty.knownSubtotal, difficulty.alternatives);
    Object.assign(composition, { status, raw: null, value: null, panel: null });
    diagnostics.push(diagnostic('plan-context', team.archived ? 'Holdet er arkiveret.' : 'Planens regelgrundlag kræver gennemgang.', [plan.id], status));
  }
  return { discipline, rounds, difficulty, panelD: difficulty.value?.panelFloor() ?? null, composition, contributions, diagnostics,
    status: combineStatus([difficulty.status, composition.status, ...rounds.map((round) => round.status)]), planned: true, fullExecutionScore: false };
}

export function knownContributionSum(analysis: DisciplineEvaluation, kind: 'bonus' | 'deduction'): Fraction {
  return sumFractions(analysis.contributions.filter((item) => item.kind === kind).map((item) => item.decision.knownSubtotal));
}

export { PLANNING_BOUNDARIES };
