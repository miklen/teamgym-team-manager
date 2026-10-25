import { canonicalJson, skillIdentity, bindingFingerprint } from './identity';
import { CURRENT_SCHEMA_VERSION, WORKSPACE_FORMAT, workspaceSchema } from './schema';
import type { Workspace } from './schema';
import type { Diagnostic } from './index';

export class WorkspaceFormatError extends Error {
  constructor(public readonly code: 'invalid-json' | 'wrong-format' | 'newer-schema' | 'migration-required' | 'invalid-data', message: string) { super(message); }
}

function fail(message: string): never { throw new WorkspaceFormatError('invalid-data', message); }

export function validateWorkspace(input: unknown): Workspace {
  if (!input || typeof input !== 'object' || !('format' in input) || input.format !== WORKSPACE_FORMAT) {
    throw new WorkspaceFormatError('wrong-format', 'Filen er ikke et TeamGym-arbejdsrum.');
  }
  const version = 'schemaVersion' in input ? input.schemaVersion : undefined;
  if (typeof version === 'number' && version > CURRENT_SCHEMA_VERSION) throw new WorkspaceFormatError('newer-schema', 'Filen bruger et nyere format. Brug en nyere app; filen må ikke overskrives.');
  if (typeof version === 'number' && Number.isInteger(version) && version < CURRENT_SCHEMA_VERSION) throw new WorkspaceFormatError('migration-required', 'Filformatet kræver en eksplicit migration. Originalen bevares.');
  const parsed = workspaceSchema.safeParse(input);
  if (!parsed.success) fail(`Ugyldige arbejdsrumsdata: ${parsed.error.issues.map((issue) => issue.path.join('.') || 'fil').join(', ')}.`);
  const workspace = parsed.data;
  const seenIds = new Set<string>();
  function unique(id: string) { if (seenIds.has(id)) fail('Identiteter må ikke forekomme flere gange.'); seenIds.add(id); }
  unique(workspace.workspaceId);
  for (const item of [...workspace.teams, ...workspace.athletes, ...workspace.skills, ...workspace.athleteSkills, ...workspace.plans]) unique(item.id);
  const teams = new Map(workspace.teams.map((team) => [team.id, team]));
  const athletes = new Map(workspace.athletes.map((athlete) => [athlete.id, athlete]));
  const skills = new Map(workspace.skills.map((skill) => [skill.id, skill]));
  const registrations = new Map(workspace.athleteSkills.map((registration) => [registration.id, registration]));
  const exactSkills = new Set<string>();
  for (const skill of workspace.skills) {
    const key = skillIdentity(skill);
    if (exactSkills.has(key)) fail('Den samme præcise færdighed har flere identiteter.');
    exactSkills.add(key);
  }
  for (const athlete of workspace.athletes) if (athlete.teamId !== null && !teams.has(athlete.teamId)) fail('Gymnastens holdreference findes ikke.');
  const pairs = new Set<string>();
  for (const registration of workspace.athleteSkills) {
    if (!athletes.has(registration.athleteId) || !skills.has(registration.skillId)) fail('En færdighedsregistrering har en ukendt reference.');
    const key = canonicalJson([registration.athleteId, registration.skillId]);
    if (pairs.has(key)) fail('Gymnasten har flere registreringer af samme færdighed.');
    pairs.add(key);
  }
  const planTeams = new Set<string>();
  for (const plan of workspace.plans) {
    if (!teams.has(plan.teamId) || planTeams.has(plan.teamId)) fail('Hvert hold skal have én entydig plan.');
    planTeams.add(plan.teamId);
    for (const discipline of ['tumbling', 'trampet'] as const) for (const round of plan[discipline]) {
      unique(round.id);
      const participants = new Set<string>();
      for (const entry of round.entries) {
        unique(entry.id);
        if (!athletes.has(entry.athleteId)) fail('Omgangens gymnastreference findes ikke.');
        if (participants.has(entry.athleteId)) fail('Samme gymnast må ikke stå to gange i en omgang.');
        participants.add(entry.athleteId);
        if (entry.athleteSkillId !== null) {
          const registration = registrations.get(entry.athleteSkillId);
          if (!registration || registration.athleteId !== entry.athleteId) fail('Pladsens færdighed tilhører ikke den valgte gymnast.');
          if (skills.get(registration.skillId)?.discipline !== discipline) fail('Pladsens færdighed har forkert disciplin.');
        }
      }
    }
  }
  if (planTeams.size !== teams.size) fail('Et hold mangler sine seks omgange.');
  const operations = new Set<string>();
  for (const operation of workspace.recentOperations) {
    if (operations.has(operation.id) || operation.revision > workspace.revision) fail('Operationshistorikken er ugyldig.');
    operations.add(operation.id);
  }
  return workspace;
}

export function parseWorkspace(bytes: string): Workspace {
  let value: unknown;
  try { value = JSON.parse(bytes); } catch { throw new WorkspaceFormatError('invalid-json', 'Filen indeholder ugyldig JSON. Originalen ændres ikke.'); }
  return validateWorkspace(value);
}

export function serializeWorkspace(workspace: Workspace): string { return canonicalJson(validateWorkspace(workspace)); }

/** Revision/tid/operationshistorik er afledte gemmefelter, ikke deres egen hash. */
export function workspacePayload(workspace: Workspace): string {
  const content = Object.fromEntries(Object.entries(validateWorkspace(workspace)).filter(([key]) => !['revision', 'updatedAt', 'recentOperations'].includes(key)));
  return canonicalJson(content);
}

export function diagnoseWorkspace(workspace: Workspace): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  const teams = new Map(workspace.teams.map((team) => [team.id, team]));
  const athletes = new Map(workspace.athletes.map((athlete) => [athlete.id, athlete]));
  const registrations = new Map(workspace.athleteSkills.map((registration) => [registration.id, registration]));
  const skills = new Map(workspace.skills.map((skill) => [skill.id, skill]));
  function add(code: string, message: string, affectedIds: string[], status: Diagnostic['status'] = 'invalid') { diagnostics.push({ code, message, affectedIds, status, sources: [] }); }
  for (const plan of workspace.plans) {
    const team = teams.get(plan.teamId)!;
    if (team.archived) add('team-archived', 'Holdet er arkiveret.', [team.id, plan.id]);
    if (bindingFingerprint(team.rulesetBinding) !== plan.bindingFingerprint) add('binding-changed', 'Planens regelgrundlag kræver gennemgang.', [team.id, plan.id], 'unresolved');
    for (const discipline of ['tumbling', 'trampet'] as const) for (const round of plan[discipline]) {
      for (const entry of round.entries) {
        const athlete = athletes.get(entry.athleteId)!;
        const registration = entry.athleteSkillId ? registrations.get(entry.athleteSkillId) : undefined;
        const skill = registration ? skills.get(registration.skillId) : undefined;
        const affected = [team.id, plan.id, round.id, entry.id, athlete.id];
        if (athlete.archived) add('athlete-archived', 'Gymnasten er arkiveret.', affected);
        if (athlete.teamId !== team.id) add('athlete-moved', 'Gymnasten er ikke længere på holdet.', affected);
        if (!registration) add('skill-missing', 'Vælg en registreret færdighed.', affected, 'incomplete');
        if (registration?.archived || skill?.archived) add('skill-archived', 'Færdigheden er arkiveret.', affected);
        if (registration?.connectionConfirmation && skill && registration.connectionConfirmation.executionIdentity !== skillIdentity(skill)) {
          add('confirmation-outdated', 'Forbindelsen er ændret siden trænerbekræftelsen.', affected, 'unresolved');
        }
      }
    }
  }
  return diagnostics;
}
