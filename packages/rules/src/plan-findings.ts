import type { Diagnostic, Fraction, SourceReference } from '@teamgym/domain';
import type { RoundEvaluation, RuleContribution } from './dk-engine';

export type PlanFindingStatus = 'deduction' | 'preliminary' | 'unresolved' | 'missing' | 'invalid' | 'opportunity';
export interface PlanFinding {
  id: string;
  contributionId: string;
  label: string;
  detail: string;
  status: PlanFindingStatus;
  amount: Fraction | null;
  sources: readonly SourceReference[];
  issues: readonly string[];
  roundIds: readonly string[];
  entryIds: readonly string[];
  action: 'change-spring' | 'order' | 'rounds' | 'apparatus' | 'guide';
}

export function analyzePlanFindings(rounds: readonly RoundEvaluation[], contributions: readonly RuleContribution[], diagnostics: readonly Diagnostic[], profile: { counting: number; sources: readonly SourceReference[] }, repeatPlacements: readonly (readonly string[])[], apparatusMixes: readonly (readonly string[])[]): PlanFinding[] {
  const findings: PlanFinding[] = [];
  const started = rounds.some((round) => round.entries.length > 0);
  const required = profile.counting;
  const add = (rule: RuleContribution, scope: Pick<PlanFinding, 'roundIds' | 'entryIds' | 'action' | 'detail'>, status?: PlanFindingStatus, id = rule.id) => {
    const decision = rule.decision;
    const findingStatus = status ?? (decision.status === 'known' ? 'deduction' : decision.status === 'incomplete' ? 'preliminary' : decision.status);
    findings.push({ id, contributionId: rule.id, label: rule.label, ...scope, status: findingStatus,
      amount: findingStatus === 'deduction' ? decision.value : null, sources: rule.sources, issues: decision.issues });
  };

  for (const rule of contributions) {
    const { decision } = rule;
    if (rule.kind === 'base' || rule.kind === 'observation') continue;
    if (rule.kind === 'bonus') {
      const counts = rule.guideCounts?.[0];
      if (!counts || !started) continue;
      const best = Math.max(...counts);
      if (rule.id === 'B-ELEMENT' ? decision.status !== 'unresolved' : best === 0 || best >= required) continue;
      add(rule, { roundIds: rounds.filter((_round, index) => counts[index] === best).map((round) => round.id), entryIds: [],
        action: 'guide', detail: 'Se hvilke spring der kan opfylde tillægget, og hvilke muligheder holdet har registreret.' },
      decision.status === 'unresolved' ? 'unresolved' : 'opportunity');
      continue;
    }
    if (decision.value?.compare(0) === 0 && !(rule.id === 'C-REDSKAB' && apparatusMixes.some((ids) => ids.length))) continue;
    if (rule.id === 'C-HOLD') {
      const first = rounds[0]!;
      if (!first.entries.length) continue;
      add(rule, { roundIds: [first.id], entryIds: first.holdDeviationIds, action: 'change-spring',
        detail: first.holdDeviationIds.length ? 'Vælg holdomgangens fælles spring på de markerede pladser.' : 'Gennemgå de tællende spring, så holdomgangen har en fælles springidentitet.' });
    } else if (rule.id === 'C-GENTAG') {
      const entryIds = repeatPlacements.flat();
      if (!entryIds.length) continue;
      add(rule, { roundIds: rounds.filter((_round, index) => repeatPlacements[index]!.length > 0).map((round) => round.id), entryIds,
        action: 'change-spring', detail: 'Springet er valgt i flere omgange. Et andet spring på en markeret plads kan mindske fradraget.' });
    } else if (rule.id.startsWith('C-ORDEN-')) {
      const round = rounds.find((item) => item.id === rule.affectedIds[0])!;
      if (!round.entries.length) continue;
      const entryIds = round.order.inversionIndexes?.map((index) => round.entries[index]!.entry.id) ?? round.orderFaultIds;
      add(rule, { roundIds: [round.id], entryIds, action: 'order', detail: 'Sæt de laveste rotationskategorier først. Inden for samme kategori kommer de letteste spring først.' });
    } else if (rule.id === 'C-RETNING' || rule.id === 'C-REDSKAB') {
      if (!started) continue;
      const apparatus = rule.id === 'C-REDSKAB';
      const mixed = apparatusMixes.flat();
      if (apparatus && mixed.length) {
        add(rule, { roundIds: rounds.filter((_round, index) => apparatusMixes[index]!.length > 0).map((round) => round.id), entryIds: mixed,
          action: 'apparatus', detail: 'Omgangen blander spring med og uden Pegasus. Brug Skift redskab til at gennemgå de valgte spring.' },
        decision.status === 'unresolved' ? 'unresolved' : 'invalid', 'mixed-apparatus');
        if (decision.status === 'invalid') continue;
      }
      const labels = apparatus ? ['med Pegasus', 'uden Pegasus'] : ['rent forlæns', 'rent baglæns'];
      const missing = (rule.guideCounts ?? []).flatMap((counts, index) => {
        const best = Math.max(...counts);
        if (best === required && counts.some((count, roundIndex) => count === required && rounds[roundIndex]!.compositionReady)) return [];
        return [{ label: labels[index]!, roundIds: rounds.filter((_round, roundIndex) => counts[roundIndex] === best).map((round) => round.id) }];
      });
      if (!missing.length) continue;
      add(rule, { roundIds: [...new Set(missing.flatMap((item) => item.roundIds))], entryIds: [], action: 'rounds',
        detail: `Planen mangler en fuld omgang ${missing.map((item) => item.label).join(' og en fuld omgang ')}. Gennemgå valgene på tværs af de tre omgange.` });
    }
  }

  const base = { ...contributions.find((item) => item.id === 'C-GRUND')!, sources: profile.sources };
  for (const round of rounds) {
    if (started && round.counting.length < required) add(base, { roundIds: [round.id], entryIds: [], action: 'rounds',
      detail: `Der mangler ${required - round.counting.length} tællende pladser.` }, 'missing', `missing-count:${round.id}`);
    for (const { entry } of round.entries) {
      const issue = diagnostics.find((item) => item.affectedIds[0] === entry.id);
      if (!issue) continue;
      findings.push({ id: `${issue.code}:${entry.id}`, contributionId: base.id, label: 'Valg på pladsen', detail: issue.message,
        roundIds: [round.id], entryIds: [entry.id], status: issue.status === 'incomplete' ? 'missing' : issue.status,
        amount: null, sources: issue.sources.length ? issue.sources : profile.sources, issues: [], action: 'change-spring' });
    }
  }
  return findings;
}
