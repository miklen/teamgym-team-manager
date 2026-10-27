import { bindingFingerprint, canonicalJson, Fraction, validateWorkspace, workspacePayload } from '@teamgym/domain';
import type { AthleteSkill, RoundEntry, SkillDefinition, SpringDiscipline, Workspace } from '@teamgym/domain';
import type { DisciplineEvaluation, ParticipantEvaluation } from './dk-engine';
import type { SpringSkillEvaluation } from './dk-spring';
import type { TeamProfile } from './dk-data';

export interface PotentialCandidate {
  athleteId: string; athleteName: string; mixCategory: 'girl' | 'boy' | null;
  registration: AthleteSkill; evaluation: SpringSkillEvaluation;
  definition: Exclude<SkillDefinition, { discipline: 'rhythm' }>;
}
export interface BonusDefinition {
  id: string; label: string; maximum: Fraction | null;
  weight: (candidate: PotentialCandidate) => number;
  unresolvedIssue: string | null;
}
export interface PotentialKernel {
  profile: TeamProfile;
  bonuses: readonly BonusDefinition[];
  analyze: (workspace: Workspace) => DisciplineEvaluation;
  evaluate: (workspace: Workspace, registration: AthleteSkill) => SpringSkillEvaluation | null;
}
export interface PlannedChange {
  roundId: string; athleteId: string; athleteName: string; beforeRegistrationId: string | null; afterRegistrationId: string | null;
}
export interface PotentialPreview {
  teamId: string; discipline: SpringDiscipline; scenarioId: string; basisPayload: string; bindingFingerprint: string;
  workspace: Workspace; before: DisciplineEvaluation; after: DisciplineEvaluation; changes: readonly PlannedChange[];
  reserveChanges: readonly { roundId: string; reserveId: string; athleteId: string }[];
}
export interface BonusPotential {
  id: string; label: string; selected: Fraction | null; selectedKnownSubtotal: Fraction;
  ruleMaximum: Fraction | null; documentedValue: Fraction | null;
  status: 'proven' | 'lower-bound' | 'incomplete' | 'unresolved'; issue: string | null;
  preview: PotentialPreview | null; independent: true; searchedCandidates: number;
}
export interface PotentialOptions { signal?: AbortSignal; candidateBudget?: number }

function bestTeam(candidates: readonly PotentialCandidate[], profile: TeamProfile, weight: (candidate: PotentialCandidate) => number): PotentialCandidate[] | null {
  const bestPerAthlete = new Map<string, PotentialCandidate>();
  function compare(a: PotentialCandidate, b: PotentialCandidate) {
    return weight(b) - weight(a) || (b.registration.stability ?? -1) - (a.registration.stability ?? -1) ||
      (b.evaluation.difficulty.value && a.evaluation.difficulty.value ? b.evaluation.difficulty.value.compare(a.evaluation.difficulty.value) : 0);
  }
  for (const candidate of candidates) {
    const previous = bestPerAthlete.get(candidate.athleteId);
    if (!previous || compare(candidate, previous) < 0) bestPerAthlete.set(candidate.athleteId, candidate);
  }
  const unique = [...bestPerAthlete.values()].sort(compare);
  if (profile.mixQuota) {
    const girls = unique.filter((candidate) => candidate.mixCategory === 'girl').slice(0, profile.mixQuota.girl);
    const boys = unique.filter((candidate) => candidate.mixCategory === 'boy').slice(0, profile.mixQuota.boy);
    return girls.length === profile.mixQuota.girl && boys.length === profile.mixQuota.boy ? [...girls, ...boys] : null;
  }
  return unique.length >= profile.counting ? unique.slice(0, profile.counting) : null;
}

function witnessEntries(candidates: readonly PotentialCandidate[], current: readonly RoundEntry[], roundId: string): RoundEntry[] {
  return [...candidates].sort((a, b) => (a.evaluation.rotationCategory ?? 100) - (b.evaluation.rotationCategory ?? 100) ||
    a.evaluation.difficulty.value!.compare(b.evaluation.difficulty.value!)).map((candidate) => ({
      id: current.find((entry) => entry.athleteId === candidate.athleteId)?.id ?? `witness:${roundId}:${candidate.athleteId}`,
      athleteId: candidate.athleteId, athleteSkillId: candidate.registration.id, role: 'counting',
    }));
}

export async function searchBonusPotentials(workspace: Workspace, teamId: string, discipline: SpringDiscipline, scenarioId: string, kernel: PotentialKernel, options: PotentialOptions = {}): Promise<BonusPotential[]> {
  const budget = options.candidateBudget ?? 20000;
  if (!Number.isInteger(budget) || budget < 1) throw new Error('Søgebudgettet skal være et positivt heltal.');
  const team = workspace.teams.find((item) => item.id === teamId);
  const plan = workspace.plans.find((item) => item.teamId === teamId);
  if (!team || !plan || team.archived) return [];
  const scenario = plan[discipline].find((item) => item.id === scenarioId);
  if (!scenario) throw new Error('Scenariet findes ikke i holdets disciplin.');
  const athletes = new Map(workspace.athletes.filter((item) => item.teamId === teamId && !item.archived).map((item) => [item.id, item]));
  const candidates: PotentialCandidate[] = [];
  const definitions = new Map(workspace.skills.map((item) => [item.id, item]));
  const evaluations = new Map<string, SpringSkillEvaluation | null>();
  let examined = 0;
  let truncated = false;
  for (const registration of workspace.athleteSkills) {
    const athlete = athletes.get(registration.athleteId);
    if (!athlete || registration.archived) continue;
    if (examined >= budget || options.signal?.aborted) { truncated = true; break; }
    examined++;
    const definition = definitions.get(registration.skillId);
    if (!definition || definition.discipline !== discipline) continue;
    const evaluationKey = canonicalJson({ definition, confirmation: registration.connectionConfirmation });
    let evaluation = evaluations.get(evaluationKey);
    if (evaluation === undefined) { evaluation = kernel.evaluate(workspace, registration); evaluations.set(evaluationKey, evaluation); }
    if (evaluation?.status === 'known' && evaluation.validity === 'known' && evaluation.difficulty.value !== null) candidates.push({
      athleteId: athlete.id, athleteName: athlete.name, mixCategory: athlete.mixCategory, registration, evaluation, definition,
    });
    if (examined % 50 === 0) await new Promise<void>((resolve) => setTimeout(resolve, 0));
  }
  const before = kernel.analyze(workspace);
  const groups = new Map<string, PotentialCandidate[]>();
  for (const candidate of candidates) {
    const group = groups.get(candidate.evaluation.identity) ?? [];
    group.push(candidate); groups.set(candidate.evaluation.identity, group);
  }
  const currentFirst = before.rounds[0]!;
  const firstIsIdentical = currentFirst.compositionReady && currentFirst.difficulty.status === 'known' && new Set(currentFirst.counting.map((item) => item.identity)).size === 1;
  const uniform = [...groups.values()].map((group) => bestTeam(group, kernel.profile, () => 0)).find((group) => group !== null) ?? null;
  const basisPayload = workspacePayload(workspace);
  const fingerprint = bindingFingerprint(team.rulesetBinding);

  return kernel.bonuses.map((bonus) => {
    const selected = before.contributions.find((item) => item.id === bonus.id)?.decision;
    const base: BonusPotential = { id: bonus.id, label: bonus.label, selected: selected?.value ?? null, selectedKnownSubtotal: selected?.knownSubtotal ?? new Fraction(0),
      ruleMaximum: bonus.maximum, documentedValue: null, status: truncated ? 'lower-bound' : 'incomplete', issue: bonus.unresolvedIssue,
      preview: null, independent: true, searchedCandidates: examined };
    const optimal = bestTeam(candidates, kernel.profile, bonus.weight);
    if (plan.bindingFingerprint !== fingerprint) return { ...base, status: 'incomplete', issue: 'PLAN-CONTEXT' };
    if ((!firstIsIdentical && !uniform) || !optimal || options.signal?.aborted) return base;
    let chosen: PotentialPreview | null = null;
    let best: Fraction | null = null;
    for (const roundIndex of [1, 2]) {
      const copy = structuredClone(workspace);
      const copyPlan = copy.plans.find((item) => item.id === plan.id)!;
      const copyScenario = copyPlan[discipline].find((item) => item.id === scenarioId)!;
      if (!firstIsIdentical) copyScenario.rounds[0].entries = witnessEntries(uniform!, copyScenario.rounds[0].entries, copyScenario.rounds[0].id);
      for (const index of [1, 2]) {
        if (index === roundIndex || !before.rounds[index]?.compositionReady) {
          const round = copyScenario.rounds[index]!;
          round.entries = witnessEntries(optimal, round.entries, round.id);
        }
      }
      for (const round of copyScenario.rounds) round.reserves = round.reserves.filter((reserve) => !round.entries.some((entry) => entry.athleteId === reserve.athleteId));
      copyPlan.bindingFingerprint = fingerprint;
      validateWorkspace(copy);
      const after = kernel.analyze(copy);
      if (!after.rounds.every((round) => round.compositionReady && round.difficulty.status === 'known')) continue;
      const result = after.contributions.find((item) => item.id === bonus.id)?.decision;
      const amount = result?.value ?? result?.alternatives.literal ?? null;
      if (amount === null) continue;
      const changes: PlannedChange[] = [];
      for (const [index, round] of copyScenario.rounds.entries()) {
        const previous = scenario.rounds[index]!;
        const affected = new Set([...previous.entries, ...round.entries].map((entry) => entry.athleteId));
        for (const athleteId of affected) {
          const oldEntry = previous.entries.find((entry) => entry.athleteId === athleteId);
          const newEntry = round.entries.find((entry) => entry.athleteId === athleteId);
          if (oldEntry?.athleteSkillId !== newEntry?.athleteSkillId || oldEntry?.role !== newEntry?.role || previous.entries.findIndex((entry) => entry.athleteId === athleteId) !== round.entries.findIndex((entry) => entry.athleteId === athleteId)) changes.push({
            roundId: round.id, athleteId, athleteName: athletes.get(athleteId)?.name ?? 'Tidligere holdmedlem', beforeRegistrationId: oldEntry?.athleteSkillId ?? null, afterRegistrationId: newEntry?.athleteSkillId ?? null,
          });
        }
      }
      const reserveChanges = scenario.rounds.flatMap((round, index) => round.reserves.filter((reserve) => !copyScenario.rounds[index]!.reserves.some((item) => item.id === reserve.id)).map((reserve) => ({ roundId: round.id, reserveId: reserve.id, athleteId: reserve.athleteId })));
      const preview = { teamId, discipline, scenarioId, basisPayload, bindingFingerprint: fingerprint, workspace: copy, before, after, changes, reserveChanges };
      if (best === null || amount.compare(best) > 0 || amount.compare(best) === 0 && changes.length < chosen!.changes.length) { chosen = preview; best = amount; }
    }
    return { ...base, status: bonus.unresolvedIssue ? 'unresolved' : chosen ? truncated ? 'lower-bound' : 'proven' : base.status,
      documentedValue: bonus.unresolvedIssue ? null : best, preview: chosen };
  });
}

export function applyPotentialPreview(workspace: Workspace, preview: PotentialPreview): Workspace {
  const binding = workspace.teams.find((item) => item.id === preview.teamId)?.rulesetBinding;
  if (!binding || bindingFingerprint(binding) !== preview.bindingFingerprint || workspacePayload(workspace) !== preview.basisPayload) throw new Error('Data er ændret siden forhåndsvisningen. Beregn muligheden igen.');
  const result = structuredClone(preview.workspace);
  result.updatedAt = new Date().toISOString();
  return validateWorkspace(result);
}

export class PotentialCache {
  private readonly values = new Map<string, BonusPotential[]>();
  key(workspace: Workspace, teamId: string, discipline: SpringDiscipline, scenarioId: string): string {
    return canonicalJson({ teamId, discipline, scenarioId, payload: workspacePayload(workspace) });
  }
  get(key: string) { return this.values.get(key); }
  set(key: string, value: BonusPotential[]) {
    this.values.set(key, value);
    while (this.values.size > 10) this.values.delete(this.values.keys().next().value!);
  }
}

export function eligibleParticipantForPotential(participant: ParticipantEvaluation): boolean {
  return participant.eligibleForC && participant.originalD.status === 'known';
}
