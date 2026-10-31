import { canonicalJson, skillIdentity, bindingFingerprint, newEntityId } from './identity';
import { CURRENT_SCHEMA_VERSION, WORKSPACE_FORMAT, workspaceSchema, workspaceV1Schema, workspaceV2Schema, workspaceV3Schema, workspaceV4Schema } from './schema';
import type { WorkspaceV1, WorkspaceV2, WorkspaceV3, WorkspaceV4, SpringDiscipline, ReserveEntry, RoundEntry } from './schema';
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
  const relationKeys = new Set<string>();
  const edges = new Map<string, string[]>();
  for (const relation of workspace.inheritanceRelations) {
    const source = registrations.get(relation.sourceId);
    const target = registrations.get(relation.targetId);
    if (!source || !target || source.id === target.id || source.athleteId !== target.athleteId) fail('Arvekilden skal være en anden registrering hos samme gymnast.');
    const sourceSkill = skills.get(source.skillId)!;
    const targetSkill = skills.get(target.skillId)!;
    if (sourceSkill.discipline !== targetSkill.discipline || sourceSkill.discipline === 'rhythm' || skillIdentity(sourceSkill) !== relation.sourceIdentity || skillIdentity(targetSkill) !== relation.targetIdentity) fail('Arverelationen svarer ikke til de præcise udførelser.');
    const key = canonicalJson(relation);
    if (relationKeys.has(key)) fail('Arverelationen er gentaget.');
    relationKeys.add(key);
    edges.set(source.id, [...edges.get(source.id) ?? [], target.id]);
  }
  const visiting = new Set<string>(); const visited = new Set<string>();
  function visit(id: string) {
    if (visiting.has(id)) fail('Arverelationer må ikke danne en cyklus.');
    if (visited.has(id)) return;
    visiting.add(id); for (const target of edges.get(id) ?? []) visit(target);
    visiting.delete(id); visited.add(id);
  }
  for (const id of edges.keys()) visit(id);
  const exclusions = new Set<string>();
  for (const exclusion of workspace.inheritanceExclusions) {
    const key = canonicalJson(exclusion);
    if (!athletes.has(exclusion.athleteId) || exclusions.has(key)) fail('Fravalget er ugyldigt eller gentaget.');
    exclusions.add(key);
  }
  for (const registration of workspace.athleteSkills) {
    if (registration.assessmentOrigin.kind !== 'inherited') continue;
    const choice = registration.assessmentOrigin.sourceChoice;
    if (choice && !workspace.inheritanceRelations.some((relation) => relation.sourceId === choice.sourceId && relation.targetId === registration.id)) fail('Det bevidste kildevalg skal henvise til en accepteret relation.');
    const sourceId = registration.assessmentOrigin.sourceId;
    if (sourceId === null) {
      if (registration.stability !== null || registration.assessedAt !== null) fail('Manglende arvekilde skal være Ikke vurderet.');
      continue;
    }
    const source = registrations.get(sourceId);
    if (!source || source.archived || skills.get(source.skillId)!.archived || !workspace.inheritanceRelations.some((relation) => relation.sourceId === sourceId && relation.targetId === registration.id)) fail('Den aktive arvekilde findes ikke.');
    if (source.stability !== registration.stability || source.assessedAt !== registration.assessedAt) fail('Den arvede vurdering svarer ikke til kilden.');
    if (workspace.inheritanceExclusions.some((item) => item.athleteId === registration.athleteId && item.targetIdentity === skillIdentity(skills.get(registration.skillId)!))) fail('Et fravalgt spring kan ikke følge arv.');
  }
  for (const plan of workspace.plans) {
    if (!teams.has(plan.teamId) || planTeams.has(plan.teamId)) fail('Hvert hold skal have én entydig plan.');
    planTeams.add(plan.teamId);
    for (const discipline of ['tumbling', 'trampet'] as const) {
      const names = new Set<string>();
      for (const scenario of plan[discipline]) {
        unique(scenario.id);
        const name = scenario.name.toLocaleLowerCase('da');
        if (names.has(name)) fail('Scenarienavne skal være entydige inden for disciplinen.');
        names.add(name);
        for (const round of scenario.rounds) {
      unique(round.id);
      const participants = new Set<string>();
      for (const entry of [...round.entries, ...round.reserves]) {
        unique(entry.id);
        if (entry.athleteId === null) {
          const planned = 'plannedSkillId' in entry && entry.plannedSkillId !== null ? skills.get(entry.plannedSkillId) : undefined;
          if (!planned || planned.discipline !== discipline) fail('Ambitionens planlagte spring er ukendt eller fra en anden disciplin.');
          continue;
        }
        if (!athletes.has(entry.athleteId)) fail('Omgangens gymnastreference findes ikke.');
        if (participants.has(entry.athleteId)) fail('Samme gymnast må ikke stå to gange i en omgang.');
        participants.add(entry.athleteId);
        if (entry.athleteSkillId !== null) {
          const registration = registrations.get(entry.athleteSkillId);
          if (!registration || registration.athleteId !== entry.athleteId) fail('Pladsens færdighed tilhører ikke den valgte gymnast.');
          if (skills.get(registration.skillId)?.discipline !== discipline) fail('Pladsens færdighed har forkert disciplin.');
        }
      }
      for (const entry of round.entries) {
        const spot = entry.plannedSpot;
        if (!spot) continue;
        if (entry.athleteSkillId === null) fail('En planlagt modtagning kræver et valgt spring på pladsen.');
        const spotSkill = skills.get(spot.skillId);
        if (!spotSkill || spotSkill.discipline !== discipline) fail('Den planlagte modtagning henviser til et ukendt spring eller en anden disciplin.');
        const needsElement = spot.grade === 'heavy' && spotSkill.discipline === 'tumbling';
        if (needsElement !== (spot.elementIndex !== null)) fail('Elementvalg hører kun til kraftig hjælp på bane.');
        if (spotSkill.discipline === 'tumbling' && spot.elementIndex !== null && spot.elementIndex >= spotSkill.elements.length) fail('Det modtagne element findes ikke i serien.');
      }
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

/** Strikt læser: version 1 må aldrig acceptere eller tabe version 2-felter. */
export function validateWorkspaceV1(input: unknown): WorkspaceV1 {
  const parsed = workspaceV1Schema.safeParse(input);
  if (!parsed.success) fail('Ugyldige format 1-data. Originalen bevares.');
  upgradeV1(parsed.data);
  return parsed.data;
}

function upgradeV1(original: WorkspaceV1): Workspace {
  return migrateWorkspaceV2({ ...original, schemaVersion: 2, athleteSkills: original.athleteSkills.map((item) => ({ ...item, assessmentOrigin: { kind: 'own' } })), inheritanceRelations: [], inheritanceExclusions: [] });
}

export function migrateWorkspaceV1(input: unknown): Workspace {
  return upgradeV1(validateWorkspaceV1(input));
}

/** Format 2 → 3 giver hver disciplin ét nyt Plan A-scenarie; kun de nye scenarier får nye id'er. */
function upgradeV2(original: WorkspaceV2): Workspace {
  const used = new Set<string>();
  const collect = (value: unknown): void => {
    if (!value || typeof value !== 'object') return;
    if ('id' in value && typeof value.id === 'string') used.add(value.id);
    for (const child of Object.values(value)) collect(child);
  };
  collect(original); used.add(original.workspaceId);
  const id = () => { let value: string; do { value = newEntityId(); } while (used.has(value)); used.add(value); return value; };
  return migrateWorkspaceV3({ ...structuredClone(original), schemaVersion: 3, plans: original.plans.map((plan) => ({ ...plan,
    ...Object.fromEntries((['tumbling', 'trampet'] as const).map((discipline) => [discipline, [{ id: id(), name: 'Plan A', rounds: plan[discipline].map((round) => ({ ...structuredClone(round), reserves: [] })) }]])),
  })) });
}

export function validateWorkspaceV2(input: unknown): WorkspaceV2 {
  const parsed = workspaceV2Schema.safeParse(input);
  if (!parsed.success) fail('Ugyldige format 2-data. Originalen bevares.');
  upgradeV2(parsed.data);
  return parsed.data;
}

export function migrateWorkspaceV2(input: unknown): Workspace {
  const parsed = workspaceV2Schema.safeParse(input);
  if (!parsed.success) fail('Ugyldige format 2-data. Originalen bevares.');
  return upgradeV2(parsed.data);
}

/** Deterministisk og tabsfri: ingen nye id'er, ur eller tilfældighed, så en format 3-basis kan bruges i fletning. */
function upgradeV3(original: WorkspaceV3): Workspace {
  const copy = structuredClone(original);
  return migrateWorkspaceV4({ ...copy, schemaVersion: 4, plans: copy.plans.map((plan) => ({ ...plan,
    ...Object.fromEntries((['tumbling', 'trampet'] as const).map((discipline) => [discipline, plan[discipline].map((scenario) => ({ ...scenario,
      rounds: scenario.rounds.map((round) => ({ ...round, entries: round.entries.map((entry) => ({ ...entry, plannedSpot: null })) })),
    }))])),
  })) });
}

export function validateWorkspaceV3(input: unknown): WorkspaceV3 {
  const parsed = workspaceV3Schema.safeParse(input);
  if (!parsed.success) fail('Ugyldige format 3-data. Originalen bevares.');
  upgradeV3(parsed.data);
  return parsed.data;
}

export function migrateWorkspaceV3(input: unknown): Workspace {
  const parsed = workspaceV3Schema.safeParse(input);
  if (!parsed.success) fail('Ugyldige format 3-data. Originalen bevares.');
  return upgradeV3(parsed.data);
}

/** Deterministisk og tabsfri: alle pladser får intet planlagt spring, uden nye id'er, ur eller tilfældighed. */
function upgradeV4(original: WorkspaceV4): Workspace {
  const copy = structuredClone(original);
  return validateWorkspace({ ...copy, schemaVersion: 5, plans: copy.plans.map((plan) => ({ ...plan,
    ...Object.fromEntries((['tumbling', 'trampet'] as const).map((discipline) => [discipline, plan[discipline].map((scenario) => ({ ...scenario,
      rounds: scenario.rounds.map((round) => ({ ...round, entries: round.entries.map((entry) => ({ ...entry, plannedSkillId: null })) })),
    }))])),
  })) });
}

export function validateWorkspaceV4(input: unknown): WorkspaceV4 {
  const parsed = workspaceV4Schema.safeParse(input);
  if (!parsed.success) fail('Ugyldige format 4-data. Originalen bevares.');
  upgradeV4(parsed.data);
  return parsed.data;
}

export function migrateWorkspaceV4(input: unknown): Workspace {
  const parsed = workspaceV4Schema.safeParse(input);
  if (!parsed.success) fail('Ugyldige format 4-data. Originalen bevares.');
  return upgradeV4(parsed.data);
}

/** Migrerer en ældre, gyldig arbejdsrumsværdi til det aktuelle format; aktuelle filer valideres uændret. */
export function migrateWorkspace(input: unknown): Workspace {
  const version = input && typeof input === 'object' && 'schemaVersion' in input ? input.schemaVersion : undefined;
  if (version === 1) return migrateWorkspaceV1(input);
  if (version === 2) return migrateWorkspaceV2(input);
  if (version === 3) return migrateWorkspaceV3(input);
  if (version === 4) return migrateWorkspaceV4(input);
  return validateWorkspace(input);
}

/** Fælles referencegrundlag for kartotek, konsekvenser og diagnoser. `plannedSkillId` er en ambitions direkte springreference. */
export function planReferences(workspace: Workspace) {
  const result: { teamId: string; planId: string; discipline: SpringDiscipline; scenarioId: string; scenarioName: string; roundId: string; roundIndex: number; kind: 'entry' | 'reserve'; entry: RoundEntry | ReserveEntry; plannedSkillId: string | null }[] = [];
  for (const plan of workspace.plans) for (const discipline of ['tumbling', 'trampet'] as const) for (const scenario of plan[discipline]) {
    for (const [roundIndex, round] of scenario.rounds.entries()) for (const kind of ['entry', 'reserve'] as const) {
      for (const entry of kind === 'entry' ? round.entries : round.reserves) result.push({ teamId: plan.teamId, planId: plan.id, discipline, scenarioId: scenario.id, scenarioName: scenario.name, roundId: round.id, roundIndex, kind, entry, plannedSkillId: 'plannedSkillId' in entry ? entry.plannedSkillId : null });
    }
  }
  return result;
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
  }
  for (const reference of planReferences(workspace)) {
    const { entry, teamId, planId, scenarioId, scenarioName, roundId, roundIndex, discipline, kind } = reference;
    const team = teams.get(teamId)!;
    const context = `${team.name} · ${discipline === 'tumbling' ? 'Bane' : 'Trampet'} · ${scenarioName} · ${roundIndex + 1}. omgang · ${kind === 'reserve' ? 'Reserve' : 'Udførende'}`;
    if (entry.athleteId === null) {
      const planned = skills.get(reference.plannedSkillId!)!;
      const affected = [teamId, planId, scenarioId, roundId, entry.id, planned.id];
      add('athlete-missing', `${context}: Mangler gymnast.`, affected, 'incomplete');
      if (planned.archived) add('skill-archived', `${context}: Færdigheden er arkiveret.`, affected);
      continue;
    }
    const athlete = athletes.get(entry.athleteId)!;
    const registration = entry.athleteSkillId ? registrations.get(entry.athleteSkillId) : undefined;
    const skill = registration ? skills.get(registration.skillId) : undefined;
    const affected = [teamId, planId, scenarioId, roundId, entry.id, athlete.id];
    const local = (code: string, message: string, status: Diagnostic['status'] = 'invalid') => add(code, `${context}: ${message}`, affected, status);
    if (athlete.archived) local('athlete-archived', 'Gymnasten er arkiveret.');
    if (athlete.teamId !== teamId) local('athlete-moved', 'Gymnasten er ikke længere på holdet.');
    if (!registration) local('skill-missing', 'Vælg en registreret færdighed.', 'incomplete');
    if (registration?.archived || skill?.archived) local('skill-archived', 'Færdigheden er arkiveret.');
    if (registration?.connectionConfirmation && skill && registration.connectionConfirmation.executionIdentity !== skillIdentity(skill)) local('confirmation-outdated', 'Forbindelsen er ændret siden trænerbekræftelsen.', 'unresolved');
  }
  return diagnostics;
}
