import { Fraction } from '@teamgym/domain';
import type { SourceReference, SpringDiscipline, SkillDefinition } from '@teamgym/domain';
import type { SpringCatalogEntry } from './catalog';
import type { TeamProfile } from './dk-data';
import type { DisciplineEvaluation, RuleContribution } from './dk-engine';
import type { NumericDecision } from './dk-numeric';
import { sumDecisions, trampetTwistQualifies } from './dk-numeric';
import { evaluateSpringSkill, normalizeElement } from './dk-spring';
import type { BonusPotential } from './potential';

export interface GuideExample { label: string; code: string; sources: readonly SourceReference[] }
export interface CompositionGuideRow {
  id: string; label: string; category: 'frame' | 'requirement' | 'bonus'; counting: string;
  requirement: string; status: string; detail: string; sources: readonly SourceReference[];
  counts: readonly (readonly number[])[]; roundIds: readonly string[];
  current: Fraction | null; preliminary: Fraction | null; ruleMaximum: Fraction | null;
  documented: Fraction | null; documentedStatus: BonusPotential['status'] | null;
  example: GuideExample | null; issues: readonly string[];
}

export interface CompositionGuideOverview {
  started: boolean; complete: boolean; contextInvalid: boolean; readyRounds: number; totalRounds: number;
  bonus: NumericDecision; deduction: NumericDecision; unresolved: boolean;
}

export function compositionGuideOverview(analysis: DisciplineEvaluation): CompositionGuideOverview {
  const scored = analysis.contributions.filter((item) => item.kind === 'bonus' || item.kind === 'deduction');
  return {
    started: analysis.rounds.some((round) => round.entries.length > 0),
    complete: analysis.rounds.every((round) => round.compositionReady),
    contextInvalid: analysis.composition.status === 'invalid' || analysis.diagnostics.some((item) => item.code === 'plan-context'),
    readyRounds: analysis.rounds.filter((round) => round.compositionReady).length,
    totalRounds: analysis.rounds.length,
    bonus: sumDecisions(scored.filter((item) => item.kind === 'bonus').map((item) => item.decision)),
    deduction: sumDecisions(scored.filter((item) => item.kind === 'deduction').map((item) => item.decision)),
    unresolved: scored.some((item) => item.decision.status === 'unresolved'),
  };
}

const bonusIds = new Set(['B-SKRUE', 'B-DOBBELT', 'B-ELEMENT', 'T-SKRUE', 'T-DOBBELT-FRI', 'T-DOBBELT-REDSKAB']);
const requirementIds = new Set(['C-HOLD', 'C-RETNING', 'C-REDSKAB', 'C-FLOW']);

function exampleFor(id: string, discipline: SpringDiscipline, profile: TeamProfile, catalog: readonly SpringCatalogEntry[], elementRuleResolved: boolean): GuideExample | null {
  if (!bonusIds.has(id)) return null;
  if (id === 'B-ELEMENT') {
    if (!elementRuleResolved) return null;
    const entries = ['a3-b-01', 'a3-b-02', 'a3-b-04'].map((referenceId) => catalog.find((entry) => entry.referenceId === referenceId));
    if (entries.some((entry) => !entry || entry.status !== 'allowed' || entry.issueId || entry.startRole)) return null;
    const safe = entries as SpringCatalogEntry[];
    const definition: Extract<SkillDefinition, { discipline: 'tumbling' }> = {
      id: 'guide-example', name: 'Rondat – flik-flak – lukket salto', archived: false, discipline: 'tumbling',
      elements: safe.map((entry) => entry.execution), connection: { kind: 'standard', transitions: ['direct', 'direct'] },
    };
    const evaluation = evaluateSpringSkill(definition);
    if (evaluation.validity !== 'known' || evaluation.difficulty.value === null || evaluation.distinctElementCount !== 3) return null;
    return { label: definition.name, code: safe.map((entry) => entry.officialCode).join('–'), sources: safe.map((entry) => entry.source) };
  }
  const entry = catalog.find((item) => {
    if (item.status !== 'allowed' || item.issueId || item.startRole) return false;
    if (discipline === 'tumbling' && item.execution.apparatus !== 'floor' || discipline === 'trampet' && item.execution.apparatus === 'floor') return false;
    const definition: Exclude<SkillDefinition, { discipline: 'rhythm' }> = discipline === 'tumbling'
      ? { id: 'guide-example', name: item.name, archived: false, discipline, elements: [item.execution], connection: { kind: 'standard', transitions: [] } }
      : { id: 'guide-example', name: item.name, archived: false, discipline, jump: item.execution };
    const evaluation = evaluateSpringSkill(definition);
    if (evaluation.validity !== 'known' || evaluation.difficulty.value === null) return false;
    if (id === 'B-SKRUE') return evaluation.hasBaneTwist;
    if (id === 'B-DOBBELT') return evaluation.hasDouble;
    if (id === 'T-DOBBELT-FRI') return evaluation.rotationCategory === 2 && evaluation.apparatus === 'free';
    if (id === 'T-DOBBELT-REDSKAB') return evaluation.rotationCategory === 2 && evaluation.apparatus === 'vault';
    if (id === 'T-SKRUE') {
      const element = normalizeElement(item.execution);
      const turns = typeof element.variant.twistAfterHandsHalfTurns === 'number' ? element.variant.twistAfterHandsHalfTurns : element.twistsHalfTurns;
      return trampetTwistQualifies(profile.ageGroup, element.rotationQuarterTurns / 4, turns, element.family);
    }
    return false;
  });
  return entry ? { label: entry.name, code: entry.officialCode, sources: [entry.source] } : null;
}

function metadata(id: string, profile: TeamProfile, elementRuleResolved: boolean): { label: string; counting: string; requirement: string } {
  const ageTwist = profile.ageGroup === 'U14' ? '360° ved enkeltsalto' : '540° ved enkeltsalto';
  switch (id) {
    case 'C-HOLD': return { label: 'Holdomgang', counting: 'Hel 1. omgang', requirement: 'Samme spring for de tællende i holdomgangen; afvigelser vurderes efter reglementet.' };
    case 'C-RETNING': return { label: 'Retninger', counting: 'To hele omgange', requirement: 'Én ren forlæns og én ren baglæns omgang.' };
    case 'C-REDSKAB': return { label: 'Med og uden Pegasus', counting: 'To hele omgange', requirement: 'Én hel omgang med Pegasus og én hel omgang uden.' };
    case 'C-FLOW': return { label: 'Flow', counting: 'Observation', requirement: 'Flow vurderes ved udførelsen, ikke ud fra den planlagte opstilling.' };
    case 'B-SKRUE': return { label: 'Skrue', counting: 'Pr. gymnast · bedste omgang', requirement: 'Mindst 360° skrue i ét baneelement. Hver kvalificerende tællende gymnast giver 0,10 i tillæggets bedste omgang.' };
    case 'B-DOBBELT': return { label: 'Dobbeltsalto', counting: 'Pr. gymnast · bedste omgang', requirement: 'Dobbeltsalto i banen. Hver kvalificerende tællende gymnast giver 0,10 i tillæggets bedste omgang.' };
    case 'B-ELEMENT': return elementRuleResolved
      ? { label: 'Elementer', counting: 'Pr. serie · over tre omgange', requirement: 'Hvert forskelligt gyldigt element ud over seriens første giver 0,10 i tillæg. Gentagelser tæller ikke igen; summen gennemsnittes over tre omgange.' }
      : { label: 'Elementer', counting: 'Uafklaret · over tre omgange', requirement: 'Forskellige gyldige elementer gennemsnittes over tre omgange. Satsen er uafklaret mellem regeltekst og eksempel.' };
    case 'T-SKRUE': return { label: 'Skrue', counting: 'Pr. gymnast · bedste omgang', requirement: `${ageTwist}, eller 180° ved dobbeltsalto; Tsukahara kræver 360° efter håndisæt. Hver kvalificerende tællende gymnast giver 0,10.` };
    case 'T-DOBBELT-FRI': return { label: 'Dobbelt uden redskab', counting: 'Pr. gymnast · bedste omgang', requirement: 'Dobbeltsalto uden Pegasus. Hver kvalificerende tællende gymnast giver 0,10 i tillæggets bedste omgang.' };
    case 'T-DOBBELT-REDSKAB': return { label: 'Dobbelt med Pegasus', counting: 'Pr. gymnast · bedste omgang', requirement: 'Dobbeltsalto med Pegasus. Hver kvalificerende tællende gymnast giver 0,10 i tillæggets bedste omgang.' };
    default: throw new Error(`Ukendt guiderække: ${id}`);
  }
}

function bestRound(contribution: RuleContribution): { count: number; index: number } {
  const values = contribution.guideCounts?.[0] ?? [];
  const count = Math.max(0, ...values);
  return { count, index: values.findIndex((value) => value === count && count > 0) };
}

export function compositionGuide(analysis: DisciplineEvaluation, profile: TeamProfile, catalog: readonly SpringCatalogEntry[], bonusRate: string, elementRuleResolved: boolean, potentials: readonly BonusPotential[] | null = null): CompositionGuideRow[] {
  const started = analysis.rounds.some((round) => round.entries.length > 0);
  const complete = analysis.rounds.every((round) => round.compositionReady);
  const contextInvalid = analysis.diagnostics.some((diagnostic) => diagnostic.code === 'plan-context');
  const maximum = Fraction.from(bonusRate).multiply(profile.counting);
  const frame: CompositionGuideRow = { id: 'G-RAMME', label: 'Planens ramme', category: 'frame', counting: 'Tre omgange',
    requirement: `${profile.counting} tællende og højst ${profile.extra} ekstra pr. omgang; første omgang er holdomgang.`,
    status: contextInvalid ? 'Regelgrundlag kræver gennemgang' : !started ? 'Ikke påbegyndt' : complete ? 'Planlagt' : 'Foreløbig plan',
    detail: `${analysis.rounds.filter((round) => round.compositionReady).length}/3 hele omgange klar.`, sources: profile.sources,
    counts: [analysis.rounds.map((round) => round.counting.length)], roundIds: analysis.rounds.map((round) => round.id),
    current: null, preliminary: null, ruleMaximum: null, documented: null, documentedStatus: null, example: null, issues: [] };
  const rows = analysis.contributions.filter((item) => requirementIds.has(item.id) || bonusIds.has(item.id)).map((item): CompositionGuideRow => {
    const meta = metadata(item.id, profile, elementRuleResolved);
    const isBonus = item.kind === 'bonus';
    const unresolved = item.decision.status === 'unresolved';
    const { count, index } = bestRound(item);
    const potential = potentials?.find((value) => value.id === item.id);
    const counts = item.guideCounts ?? [];
    const related = new Set<number>();
    for (const series of counts) series.forEach((value, roundIndex) => { if (value > 0) related.add(roundIndex); });
    const current = started && complete && !contextInvalid && item.decision.value !== null && !unresolved ? item.decision.value : null;
    const preliminary = started && !complete && !contextInvalid && !unresolved && isBonus ? item.decision.knownSubtotal : null;
    let status: string;
    if (contextInvalid) status = 'Regelgrundlag kræver gennemgang';
    else if (!started) status = 'Ikke påbegyndt';
    else if (unresolved) status = 'Uafklaret';
    else if (item.id === 'C-FLOW') status = 'Kræver observation';
    else if (item.id === 'B-ELEMENT' && current !== null) status = `${current.decimal(2).replace('.', ',')} point · tre omgange`;
    else if (item.id === 'B-ELEMENT') status = 'Foreløbig plan';
    else if (isBonus && current !== null) status = `${count}/${profile.counting} · ${current.decimal(2).replace('.', ',')} point`;
    else if (isBonus) status = `Foreløbig ${count}/${profile.counting}`;
    else if (current === null) status = 'Afventer fuld plan';
    else status = current.compare(0) === 0 ? 'Krav opfyldt i plan' : `Planlagt fradrag ${current.decimal(2).replace('.', ',')}`;
    const detail = isBonus && item.id !== 'B-ELEMENT'
      ? count > 0 ? `Bedste omgang: ${index + 1}. omgang med ${count}/${profile.counting} kvalificerende.` : 'Ingen kvalificerende i den aktuelle plan.'
      : item.id === 'C-RETNING' || item.id === 'C-REDSKAB'
        ? `${counts.map((series) => series.join('/')).join(' · ')} af ${profile.counting} tællende pr. omgang.`
        : item.id === 'B-ELEMENT' ? elementRuleResolved
          ? `Tillægsgivende forskellige elementer i de tre omgange: ${(counts[0] ?? []).join(' · ')}. Summen divideres med tre.`
          : 'Regeltekst og trykt eksempel giver forskellige beløb; ingen autoritativ sats.'
          : item.id === 'C-FLOW' ? 'Udførelsen skal observeres.' : 'Vurderes på den planlagte holdomgang.';
    return { id: item.id, label: meta.label, category: isBonus ? 'bonus' : 'requirement', counting: meta.counting,
      requirement: meta.requirement, status, detail, sources: item.sources, counts, roundIds: [...related].map((i) => analysis.rounds[i]!.id),
      current, preliminary, ruleMaximum: isBonus && item.id !== 'B-ELEMENT' && !unresolved ? maximum : null,
      documented: potential?.documentedValue ?? null, documentedStatus: potential?.status ?? null,
      example: exampleFor(item.id, analysis.discipline, profile, catalog, elementRuleResolved), issues: item.decision.issues };
  });
  return [frame, ...rows];
}
