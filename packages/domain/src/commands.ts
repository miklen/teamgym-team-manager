import { bindingFingerprint, newEntityId, skillIdentity } from './identity';
import { CURRENT_SCHEMA_VERSION, WORKSPACE_FORMAT, athleteSkillSchema, rulesetBindingSchema, skillDefinitionSchema } from './schema';
import type { Athlete, AthleteSkill, RoundEntry, RulesetBinding, SkillDefinition, SpringDiscipline, Stability, Workspace } from './schema';
import { validateWorkspace } from './workspace';
import { aggregateStability } from './stability';

export interface CommandEnvironment { id: () => string; now: () => string }
const defaultEnvironment: CommandEnvironment = { id: newEntityId, now: () => new Date().toISOString() };

function edit(workspace: Workspace, action: (copy: Workspace) => void, environment = defaultEnvironment): Workspace {
  const copy = structuredClone(workspace);
  action(copy);
  copy.updatedAt = environment.now();
  return validateWorkspace(copy);
}

function requireItem<T extends { id: string }>(items: T[], id: string): T {
  const item = items.find((candidate) => candidate.id === id);
  if (!item) throw new Error('Den valgte registrering findes ikke.');
  return item;
}

export function createWorkspace(environment = defaultEnvironment): Workspace {
  return validateWorkspace({ format: WORKSPACE_FORMAT, schemaVersion: CURRENT_SCHEMA_VERSION, workspaceId: environment.id(), revision: 0,
    updatedAt: environment.now(), recentOperations: [], teams: [], athletes: [], skills: [], athleteSkills: [], plans: [] });
}

export function createTeam(workspace: Workspace, name: string, binding: RulesetBinding, environment = defaultEnvironment): Workspace {
  return edit(workspace, (copy) => {
    const teamId = environment.id();
    const rulesetBinding = rulesetBindingSchema.parse(binding);
    copy.teams.push({ id: teamId, name, archived: false, rulesetBinding });
    const round = () => ({ id: environment.id(), entries: [] });
    copy.plans.push({ id: environment.id(), teamId, bindingFingerprint: bindingFingerprint(rulesetBinding),
      tumbling: [round(), round(), round()], trampet: [round(), round(), round()] });
  }, environment);
}

export function renameTeam(workspace: Workspace, teamId: string, name: string, environment = defaultEnvironment) {
  return edit(workspace, (copy) => { requireItem(copy.teams, teamId).name = name; }, environment);
}

export function createAthlete(workspace: Workspace, input: Pick<Athlete, 'name'> & Partial<Pick<Athlete, 'teamId' | 'discriminator' | 'mixCategory'>>, environment = defaultEnvironment): Workspace {
  return edit(workspace, (copy) => {
    if (input.teamId && requireItem(copy.teams, input.teamId).archived) throw new Error('Vælg et aktivt hold.');
    copy.athletes.push({ id: environment.id(), name: input.name, discriminator: input.discriminator ?? '', mixCategory: input.mixCategory ?? null,
      teamId: input.teamId ?? null, archived: false });
  }, environment);
}

export function updateAthlete(workspace: Workspace, athleteId: string, input: Pick<Athlete, 'name' | 'discriminator' | 'mixCategory'>, environment = defaultEnvironment) {
  return edit(workspace, (copy) => { Object.assign(requireItem(copy.athletes, athleteId), input); }, environment);
}

export function moveAthlete(workspace: Workspace, athleteId: string, teamId: string | null, environment = defaultEnvironment): Workspace {
  return edit(workspace, (copy) => {
    const athlete = requireItem(copy.athletes, athleteId);
    if (athlete.archived) throw new Error('Genaktivér gymnasten før en flytning.');
    if (teamId !== null && requireItem(copy.teams, teamId).archived) throw new Error('Vælg et aktivt hold.');
    athlete.teamId = teamId;
  }, environment);
}

export function setArchived(workspace: Workspace, collection: 'teams' | 'athletes' | 'skills' | 'athleteSkills', id: string, archived: boolean, environment = defaultEnvironment) {
  return edit(workspace, (copy) => { requireItem<{ id: string; archived: boolean }>(copy[collection], id).archived = archived; }, environment);
}

/** Returnerer den eksisterende præcise registrering uden at nulstille vurderingen. */
export function registerAthleteSkill(workspace: Workspace, athleteId: string, definition: SkillDefinition, environment = defaultEnvironment) {
  let athleteSkillId = '';
  let existed = false;
  const result = edit(workspace, (copy) => {
    if (requireItem(copy.athletes, athleteId).archived) throw new Error('Genaktivér gymnasten før registrering.');
    const skill = skillDefinitionSchema.parse(definition);
    const identity = skillIdentity(skill);
    const existingDefinition = copy.skills.find((item) => skillIdentity(item) === identity);
    const skillId = existingDefinition?.id ?? skill.id;
    if (!existingDefinition) copy.skills.push(skill);
    const registration = copy.athleteSkills.find((item) => item.athleteId === athleteId && item.skillId === skillId);
    if (registration) { athleteSkillId = registration.id; existed = true; return; }
    athleteSkillId = environment.id();
    copy.athleteSkills.push({ id: athleteSkillId, athleteId, skillId, archived: false, stability: null, assessedAt: null,
      note: '', updatedAt: environment.now(), connectionConfirmation: null });
  }, environment);
  return { workspace: existed ? workspace : result, athleteSkillId, existed };
}

export function updateAssessment(workspace: Workspace, athleteSkillId: string, input: Pick<AthleteSkill, 'stability' | 'assessedAt' | 'note'>, environment = defaultEnvironment) {
  return edit(workspace, (copy) => {
    const registration = requireItem(copy.athleteSkills, athleteSkillId);
    Object.assign(registration, input, { updatedAt: environment.now() });
    athleteSkillSchema.parse(registration);
  }, environment);
}

export function confirmConnection(workspace: Workspace, athleteSkillId: string, note: string, environment = defaultEnvironment) {
  return edit(workspace, (copy) => {
    const registration = requireItem(copy.athleteSkills, athleteSkillId);
    const skill = requireItem(copy.skills, registration.skillId);
    if (skill.discipline !== 'tumbling' || skill.connection.kind !== 'custom') throw new Error('Kun en konkret specialforbindelse kan bekræftes.');
    registration.connectionConfirmation = { executionIdentity: skillIdentity(skill), confirmedAt: environment.now(), note };
    registration.updatedAt = environment.now();
    // Bekræftelsen er ikke en regelgodkendelse. Regelpakken skal fortsat kontrollere gyldighed.
  }, environment);
}

export interface ParticipantLimits { counting: number; extra: number }

export function setRoundEntries(workspace: Workspace, planId: string, discipline: SpringDiscipline, roundId: string, entries: RoundEntry[], limits: ParticipantLimits, environment = defaultEnvironment) {
  return edit(workspace, (copy) => {
    const plan = requireItem(copy.plans, planId);
    const team = requireItem(copy.teams, plan.teamId);
    if (team.archived) throw new Error('Genaktivér holdet før redigering.');
    const counting = entries.filter((entry) => entry.role === 'counting').length;
    const extras = entries.length - counting;
    if (counting > limits.counting || extras > limits.extra) throw new Error(`Omgangen tillader ${limits.counting} tællende og højst ${limits.extra} ekstra.`);
    let countingStarted = false;
    for (const entry of entries) {
      const athlete = requireItem(copy.athletes, entry.athleteId);
      if (athlete.archived || athlete.teamId !== team.id) throw new Error('Vælg en aktiv gymnast på holdet.');
      if (entry.role === 'counting') countingStarted = true;
      else if (countingStarted) throw new Error('Ekstra gymnaster skal stå først.');
      if (entry.athleteSkillId !== null) {
        const registration = requireItem(copy.athleteSkills, entry.athleteSkillId);
        if (registration.archived || requireItem(copy.skills, registration.skillId).archived) throw new Error('Vælg en aktiv færdighed.');
      }
    }
    requireItem(plan[discipline], roundId).entries = structuredClone(entries);
  }, environment);
}

export function moveRoundFirst(workspace: Workspace, planId: string, discipline: SpringDiscipline, roundId: string, environment = defaultEnvironment) {
  return edit(workspace, (copy) => {
    const plan = requireItem(copy.plans, planId);
    const rounds = plan[discipline];
    const index = rounds.findIndex((round) => round.id === roundId);
    if (index < 0) throw new Error('Omgangen findes ikke.');
    const [round] = rounds.splice(index, 1);
    rounds.unshift(round!);
  }, environment);
}

export function roundStability(workspace: Workspace, entries: readonly RoundEntry[], limits: ParticipantLimits, teamId: string) {
  const registrations = new Map(workspace.athleteSkills.map((item) => [item.id, item]));
  const athletes = new Map(workspace.athletes.map((item) => [item.id, item]));
  const skills = new Map(workspace.skills.map((item) => [item.id, item]));
  function slots(selected: readonly RoundEntry[]) {
    return selected.map((entry) => {
      const registration = entry.athleteSkillId ? registrations.get(entry.athleteSkillId) : undefined;
      const athlete = athletes.get(entry.athleteId);
      const valid = Boolean(athlete && !athlete.archived && athlete.teamId === teamId && registration && !registration.archived && !skills.get(registration.skillId)?.archived);
      return { filled: valid, value: valid ? registration?.stability ?? null : null as Stability | null };
    });
  }
  const counting = entries.filter((entry) => entry.role === 'counting');
  const extras = entries.filter((entry) => entry.role === 'extra');
  return { counting: aggregateStability(slots(counting), limits.counting), extra: aggregateStability(slots(extras), extras.length) };
}
