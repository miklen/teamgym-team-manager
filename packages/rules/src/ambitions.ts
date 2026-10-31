import { newEntityId, skillIdentity } from '@teamgym/domain';
import type { Athlete, AthleteSkill, CommandEnvironment, Round, SkillDefinition, Workspace } from '@teamgym/domain';
import type { RulePackage } from './registry';

export interface AmbitionCandidate {
  athlete: Athlete;
  /** Gymnastens bedste anvendelige registrering af ambitionens spring; null for Kan ikke endnu. */
  registration: AthleteSkill | null;
  status: 'match' | 'not-yet';
  /** Hvorfor gymnasten ikke kan vælges: allerede i omgangen eller uden springet. */
  reason: 'in-round' | 'missing-skill' | null;
}

/** Regelpakkens springidentitet til domænekommandoerne, så genbrug og match sker på samme identitet som i analysen. */
export function springIdentityFor(rulePackage: Pick<RulePackage, 'evaluateSkill'>) {
  return (skill: SkillDefinition) => skill.discipline === 'rhythm' ? skillIdentity(skill) : rulePackage.evaluateSkill(skill).identity;
}

export function ambitionEnvironment(rulePackage: Pick<RulePackage, 'evaluateSkill'>): CommandEnvironment {
  return { id: newEntityId, now: () => new Date().toISOString(), springIdentity: springIdentityFor(rulePackage) };
}

/** Kandidater til en ambition. Matches er afledte af de aktuelle registreringer og gemmes aldrig. */
export function ambitionCandidates(workspace: Workspace, rulePackage: Pick<RulePackage, 'evaluateSkill'>, teamId: string, round: Round, entryId: string): AmbitionCandidate[] {
  const entry = round.entries.find((item) => item.id === entryId);
  if (!entry || entry.athleteId !== null || entry.plannedSkillId === null) return [];
  const skills = new Map(workspace.skills.map((skill) => [skill.id, skill]));
  const planned = skills.get(entry.plannedSkillId);
  if (!planned || planned.discipline === 'rhythm') return [];
  const identity = rulePackage.evaluateSkill(planned).identity;
  const busy = new Set([...round.entries, ...round.reserves].flatMap((item) => item.athleteId === null ? [] : [item.athleteId]));
  const result = workspace.athletes.filter((athlete) => athlete.teamId === teamId && !athlete.archived).map((athlete): AmbitionCandidate => {
    const registrations = workspace.athleteSkills.filter((registration) => {
      const skill = skills.get(registration.skillId);
      return registration.athleteId === athlete.id && !registration.archived && skill && !skill.archived && skill.discipline === planned.discipline &&
        rulePackage.evaluateSkill(skill).identity === identity && rulePackage.evaluateSkill(skill, registration).validity === 'known';
    }).sort((a, b) => (b.stability ?? 0) - (a.stability ?? 0));
    const registration = registrations[0] ?? null;
    if (busy.has(athlete.id)) return { athlete, registration, status: 'not-yet', reason: 'in-round' };
    return registration ? { athlete, registration, status: 'match', reason: null } : { athlete, registration: null, status: 'not-yet', reason: 'missing-skill' };
  });
  return result.sort((a, b) => (a.status === 'match' ? 0 : 1) - (b.status === 'match' ? 0 : 1) ||
    (b.registration?.stability ?? 0) - (a.registration?.stability ?? 0) || a.athlete.name.localeCompare(b.athlete.name, 'da'));
}

/** Antal gymnaster, der kan tage netop denne plads nu. */
export function ambitionCanNow(workspace: Workspace, rulePackage: Pick<RulePackage, 'evaluateSkill'>, teamId: string, round: Round, entryId: string): number {
  return ambitionCandidates(workspace, rulePackage, teamId, round, entryId).filter((item) => item.status === 'match').length;
}
