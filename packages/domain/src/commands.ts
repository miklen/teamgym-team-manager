import { bindingFingerprint, newEntityId, skillIdentity } from './identity';
import { CURRENT_SCHEMA_VERSION, WORKSPACE_FORMAT, athleteSkillSchema, rulesetBindingSchema, skillDefinitionSchema } from './schema';
import type { Athlete, AthleteSkill, PlannedSpot, RoundEntry, RoundEntryInput, ReserveEntry, SpotGrade, Scenario, RulesetBinding, SkillDefinition, SpringDiscipline, Stability, Workspace } from './schema';
import { validateWorkspace, workspacePayload } from './workspace';
import { aggregateStability } from './stability';
import { reconcileInheritance } from './inheritance';
import type { InheritanceContext } from './inheritance';

/** `springIdentity` er regelpakkens springidentitet. Den injiceres, fordi domænet ikke må afhænge af regelpakkerne;
 * uden den bruges den præcise udførelsesidentitet. */
export interface CommandEnvironment { id: () => string; now: () => string; inheritance?: InheritanceContext; springIdentity?: (skill: SkillDefinition) => string }
const defaultEnvironment: CommandEnvironment = { id: newEntityId, now: () => new Date().toISOString() };

function edit(workspace: Workspace, action: (copy: Workspace) => void, environment = defaultEnvironment): Workspace {
  const copy = structuredClone(workspace);
  action(copy);
  copy.updatedAt = environment.now();
  reconcileInheritance(copy, environment.inheritance, environment.now());
  return validateWorkspace(copy);
}

function requireItem<T extends { id: string }>(items: T[], id: string): T {
  const item = items.find((candidate) => candidate.id === id);
  if (!item) throw new Error('Den valgte registrering findes ikke.');
  return item;
}

export function createWorkspace(environment = defaultEnvironment): Workspace {
  return validateWorkspace({ format: WORKSPACE_FORMAT, schemaVersion: CURRENT_SCHEMA_VERSION, workspaceId: environment.id(), revision: 0,
    updatedAt: environment.now(), recentOperations: [], teams: [], athletes: [], skills: [], athleteSkills: [], plans: [], inheritanceRelations: [], inheritanceExclusions: [] });
}

export function createTeam(workspace: Workspace, name: string, binding: RulesetBinding, environment = defaultEnvironment): Workspace {
  return edit(workspace, (copy) => {
    const teamId = environment.id();
    const rulesetBinding = rulesetBindingSchema.parse(binding);
    copy.teams.push({ id: teamId, name, archived: false, rulesetBinding });
    copy.plans.push({ id: environment.id(), teamId, bindingFingerprint: bindingFingerprint(rulesetBinding),
      tumbling: [emptyScenario('Plan A', environment)], trampet: [emptyScenario('Plan A', environment)] });
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
  return edit(workspace, (copy) => {
    requireItem<{ id: string; archived: boolean }>(copy[collection], id).archived = archived;
    if (collection === 'athleteSkills' && archived) {
      const registration = requireItem(copy.athleteSkills, id);
      const targetIdentity = skillIdentity(requireItem(copy.skills, registration.skillId));
      if (!copy.inheritanceExclusions.some((item) => item.athleteId === registration.athleteId && item.targetIdentity === targetIdentity)) copy.inheritanceExclusions.push({ athleteId: registration.athleteId, targetIdentity });
      registration.assessmentOrigin = { kind: 'own' };
    }
  }, environment);
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
      note: '', updatedAt: environment.now(), connectionConfirmation: null, reviewRequiredFor: [], assessmentOrigin: { kind: 'own' } });
  }, environment);
  return { workspace: existed ? workspace : result, athleteSkillId, existed };
}

export function updateAssessment(workspace: Workspace, athleteSkillId: string, input: Pick<AthleteSkill, 'stability' | 'assessedAt' | 'note'>, environment = defaultEnvironment) {
  return edit(workspace, (copy) => {
    const registration = requireItem(copy.athleteSkills, athleteSkillId);
    if (registration.stability !== input.stability || registration.assessedAt !== input.assessedAt) registration.assessmentOrigin = { kind: 'own' };
    Object.assign(registration, input, { updatedAt: environment.now() });
    athleteSkillSchema.parse(registration);
  }, environment);
}

/** En ændret konkret udførelse er en ny definition, men pladser beholder registreringens id. */
export function replaceAthleteSkill(workspace: Workspace, registrationId: string, definition: SkillDefinition, environment = defaultEnvironment) {
  return edit(workspace, (copy) => {
    const registration = requireItem(copy.athleteSkills, registrationId);
    const previous = requireItem(copy.skills, registration.skillId);
    const parsed = skillDefinitionSchema.parse(definition);
    if (parsed.discipline !== previous.discipline) throw new Error('Bevar disciplinen ved redigering.');
    const identity = skillIdentity(parsed);
    const existing = copy.skills.find((skill) => skillIdentity(skill) === identity);
    const targetId = existing?.id ?? parsed.id;
    if (copy.athleteSkills.some((item) => item.id !== registrationId && item.athleteId === registration.athleteId && item.skillId === targetId)) throw new Error('Gymnasten har allerede den præcise færdighed. Vælg den eksisterende registrering.');
    if (!existing) copy.skills.push(parsed);
    if (skillIdentity(previous) !== identity) {
      registration.assessmentOrigin = { kind: 'own' };
      registration.stability = null; registration.assessedAt = null; registration.connectionConfirmation = null; registration.reviewRequiredFor = [];
    }
    registration.skillId = targetId; registration.updatedAt = environment.now();
    if (skillIdentity(previous) !== identity) {
      for (const plan of copy.plans) for (const discipline of ['tumbling', 'trampet'] as const) for (const scenario of plan[discipline]) for (const round of scenario.rounds) {
        for (const entry of round.entries) if (entry.athleteSkillId === registrationId && entry.plannedSpot) entry.plannedSpot = null;
      }
    }
  }, environment);
}

export function setOwnAssessment(workspace: Workspace, registrationId: string, input: Pick<AthleteSkill, 'stability' | 'assessedAt' | 'note'>, environment = defaultEnvironment) {
  return edit(workspace, (copy) => {
    Object.assign(requireItem(copy.athleteSkills, registrationId), input, { assessmentOrigin: { kind: 'own' }, updatedAt: environment.now() });
  }, environment);
}

export function followAssessment(workspace: Workspace, registrationId: string, environment: CommandEnvironment = defaultEnvironment, sourceId?: string) {
  const result = edit(workspace, (copy) => {
    const registration = requireItem(copy.athleteSkills, registrationId);
    const targetIdentity = skillIdentity(requireItem(copy.skills, registration.skillId));
    copy.inheritanceExclusions = copy.inheritanceExclusions.filter((item) => item.athleteId !== registration.athleteId || item.targetIdentity !== targetIdentity);
    if (sourceId && !copy.inheritanceRelations.some((relation) => relation.targetId === registrationId && relation.sourceId === sourceId)) throw new Error('Vælg en accepteret arvekilde.');
    registration.assessmentOrigin = { kind: 'inherited', sourceId: null, sourceChoice: sourceId ? { sourceId, context: environment.inheritance?.fingerprint ?? 'explicit' } : null };
  }, environment);
  const origin = requireItem(result.athleteSkills, registrationId).assessmentOrigin;
  if (origin.kind === 'inherited' && origin.sourceId === null) throw new Error('Vælg en gyldig arvekilde. Ukendt D kræver et bevidst kildevalg.');
  return result;
}

export function confirmRuleReview(workspace: Workspace, athleteSkillId: string, binding: RulesetBinding, input: Pick<AthleteSkill, 'stability' | 'assessedAt' | 'note'>, environment = defaultEnvironment) {
  const assessed = updateAssessment(workspace, athleteSkillId, input, environment);
  return edit(assessed, (copy) => {
    const registration = requireItem(copy.athleteSkills, athleteSkillId);
    registration.reviewRequiredFor = registration.reviewRequiredFor.filter((fingerprint) => fingerprint !== bindingFingerprint(binding));
  }, environment);
}

export function confirmConnection(workspace: Workspace, athleteSkillId: string, note: string, environment = defaultEnvironment) {
  return edit(workspace, (copy) => {
    const registration = requireItem(copy.athleteSkills, athleteSkillId);
    const skill = requireItem(copy.skills, registration.skillId);
    if (skill.discipline !== 'tumbling') throw new Error('Kun en konkret baneserie kan bekræftes.');
    registration.connectionConfirmation = { executionIdentity: skillIdentity(skill), confirmedAt: environment.now(), note };
    registration.updatedAt = environment.now();
    // Bekræftelsen er ikke en regelgodkendelse. Regelpakken skal fortsat kontrollere gyldighed.
  }, environment);
}

export interface ParticipantLimits { counting: number; extra: number }

function emptyScenario(name: string, environment: CommandEnvironment): Scenario {
  const round = () => ({ id: environment.id(), entries: [], reserves: [] });
  return { id: environment.id(), name, rounds: [round(), round(), round()] };
}

export function requireScenario(workspace: Workspace, planId: string, discipline: SpringDiscipline, scenarioId: string): Scenario {
  return requireItem(requireItem(workspace.plans, planId)[discipline], scenarioId);
}

function scenarioName(scenarios: Scenario[], name: string, exceptId?: string): string {
  const trimmed = name.trim();
  if (!trimmed || trimmed.length > 200) throw new Error('Skriv et navn på 1–200 tegn.');
  if (scenarios.some((item) => item.id !== exceptId && item.name.toLocaleLowerCase('da') === trimmed.toLocaleLowerCase('da'))) throw new Error('Der findes allerede et scenarie med dette navn.');
  return trimmed;
}

export function suggestScenarioCopyName(scenarios: Scenario[], sourceId: string): string {
  const source = requireItem(scenarios, sourceId);
  for (let index = 1; ; index++) {
    const suffix = index === 1 ? ' - kopi' : ` - kopi ${index}`;
    const name = source.name.slice(0, 200 - suffix.length).trimEnd() + suffix;
    if (!scenarios.some((item) => item.name.toLocaleLowerCase('da') === name.toLocaleLowerCase('da'))) return name;
  }
}

export function createScenario(workspace: Workspace, planId: string, discipline: SpringDiscipline, afterId: string, name: string, environment = defaultEnvironment) {
  return edit(workspace, (copy) => {
    const plan = requireItem(copy.plans, planId);
    if (requireItem(copy.teams, plan.teamId).archived) throw new Error('Genaktivér holdet før redigering.');
    requireItem(plan[discipline], afterId);
    const created = emptyScenario(scenarioName(plan[discipline], name), environment);
    plan[discipline].splice(plan[discipline].findIndex((item) => item.id === afterId) + 1, 0, created);
  }, environment);
}

export function duplicateScenario(workspace: Workspace, planId: string, discipline: SpringDiscipline, sourceId: string, name: string, environment = defaultEnvironment) {
  return edit(workspace, (copy) => {
    const plan = requireItem(copy.plans, planId);
    if (requireItem(copy.teams, plan.teamId).archived) throw new Error('Genaktivér holdet før redigering.');
    const source = requireItem(plan[discipline], sourceId);
    const created = structuredClone(source);
    created.id = environment.id(); created.name = scenarioName(plan[discipline], name);
    for (const round of created.rounds) {
      round.id = environment.id();
      for (const entry of [...round.entries, ...round.reserves]) entry.id = environment.id();
    }
    plan[discipline].splice(plan[discipline].indexOf(source) + 1, 0, created);
  }, environment);
}

export function renameScenario(workspace: Workspace, planId: string, discipline: SpringDiscipline, scenarioId: string, name: string, environment = defaultEnvironment) {
  return edit(workspace, (copy) => {
    const plan = requireItem(copy.plans, planId);
    if (requireItem(copy.teams, plan.teamId).archived) throw new Error('Genaktivér holdet før redigering.');
    requireItem(plan[discipline], scenarioId).name = scenarioName(plan[discipline], name, scenarioId);
  }, environment);
}

export function deleteScenario(workspace: Workspace, planId: string, discipline: SpringDiscipline, scenarioId: string, environment = defaultEnvironment) {
  return edit(workspace, (copy) => {
    const plan = requireItem(copy.plans, planId);
    if (requireItem(copy.teams, plan.teamId).archived) throw new Error('Genaktivér holdet før redigering.');
    requireItem(plan[discipline], scenarioId);
    if (plan[discipline].length === 1) throw new Error('Bevar mindst ét scenarie i hver disciplin.');
    plan[discipline] = plan[discipline].filter((item) => item.id !== scenarioId);
  }, environment);
}

export function setRoundEntries(workspace: Workspace, planId: string, discipline: SpringDiscipline, scenarioId: string, roundId: string, entries: RoundEntryInput[], limits: ParticipantLimits, environment = defaultEnvironment) {
  return edit(workspace, (copy) => { applyRoundEntries(copy, planId, discipline, scenarioId, roundId, entries, limits); }, environment);
}

function applyRoundEntries(copy: Workspace, planId: string, discipline: SpringDiscipline, scenarioId: string, roundId: string, entries: RoundEntryInput[], limits: ParticipantLimits) {
  const plan = requireItem(copy.plans, planId);
  const team = requireItem(copy.teams, plan.teamId);
  const scenario = requireScenario(copy, planId, discipline, scenarioId);
  if (team.archived) throw new Error('Genaktivér holdet før redigering.');
  const counting = entries.filter((entry) => entry.role === 'counting').length;
  const extras = entries.length - counting;
  if (counting > limits.counting || extras > limits.extra) throw new Error(`Omgangen tillader ${limits.counting} tællende og højst ${limits.extra} ekstra.`);
  const round = requireItem(scenario.rounds, roundId);
  let countingStarted = false;
  for (const entry of entries) {
    const previous = round.entries.find((item) => item.id === entry.id);
    // Besættelse sker kun med matchkontrol, og en besat plads bliver aldrig til en ambition.
    if (previous && (previous.athleteId === null) !== (entry.athleteId === null)) {
      throw new Error(previous.athleteId === null ? 'Besæt ambitionen med en gymnast, der kan springet.' : 'En besat plads kan ikke blive en ambition. Fjern pladsen, og opret en ny ambition.');
    }
    if (entry.role === 'counting') countingStarted = true;
    else if (countingStarted) throw new Error('Ekstra gymnaster skal stå først.');
    if (entry.athleteId === null) {
      if (!entry.plannedSkillId || entry.athleteSkillId !== null) throw new Error('En ambition kræver et spring.');
      const retained = previous?.athleteId === null && previous.plannedSkillId === entry.plannedSkillId;
      const skill = requireItem(copy.skills, entry.plannedSkillId);
      if (!retained && (skill.archived || skill.discipline !== discipline)) throw new Error('Vælg et aktivt spring i disciplinen.');
      continue;
    }
    if (entry.plannedSkillId) throw new Error('En plads med gymnast har ikke et planlagt spring.');
    const athlete = requireItem(copy.athletes, entry.athleteId);
    const retained = previous?.athleteId === entry.athleteId && previous.athleteSkillId === entry.athleteSkillId;
    if (!retained && (athlete.archived || athlete.teamId !== team.id)) throw new Error('Vælg en aktiv gymnast på holdet.');
    if (entry.athleteSkillId !== null) {
      const registration = requireItem(copy.athleteSkills, entry.athleteSkillId);
      if (!retained && (registration.archived || requireItem(copy.skills, registration.skillId).archived)) throw new Error('Vælg en aktiv færdighed.');
    }
  }
  // Modtagningen gælder netop gymnast og spring på pladsen; rækkefølge og rolle bevarer den.
  round.entries = entries.map(({ id, athleteId, athleteSkillId, role, plannedSkillId }) => {
    if (athleteId === null) return { id, athleteId, athleteSkillId: null, role, plannedSpot: null, plannedSkillId: plannedSkillId! };
    const previous = round.entries.find((item) => item.id === id);
    const retained = previous && previous.athleteId === athleteId && previous.athleteSkillId === athleteSkillId;
    return { id, athleteId, athleteSkillId, role, plannedSpot: retained ? structuredClone(previous.plannedSpot) : null, plannedSkillId: null };
  });
}

function springIdentityOf(environment: CommandEnvironment) {
  return environment.springIdentity ?? skillIdentity;
}

/** Genbruger et aktivt spring med samme springidentitet, ellers den præcise definition, ellers oprettes en ny. */
function ambitionDefinition(copy: Workspace, discipline: SpringDiscipline, definition: SkillDefinition, environment: CommandEnvironment): string {
  const parsed = skillDefinitionSchema.parse(definition);
  if (parsed.discipline !== discipline) throw new Error('Vælg et spring i disciplinen.');
  const identity = springIdentityOf(environment);
  const wanted = identity(parsed);
  const reusable = copy.skills.find((skill) => !skill.archived && skill.discipline === discipline && identity(skill) === wanted);
  if (reusable) return reusable.id;
  const exact = copy.skills.find((skill) => skillIdentity(skill) === skillIdentity(parsed));
  if (exact) throw new Error('Springet er fjernet fra kartoteket. Genaktivér det, før det bruges som ambition.');
  const id = copy.skills.some((skill) => skill.id === parsed.id) ? environment.id() : parsed.id;
  copy.skills.push({ ...parsed, id });
  return id;
}

/** Opretter en plads uden gymnast; definitionen genbruges eller oprettes i samme ændring. */
export function addAmbition(workspace: Workspace, planId: string, discipline: SpringDiscipline, scenarioId: string, roundId: string, definition: SkillDefinition, role: RoundEntry['role'], position: number, limits: ParticipantLimits, environment = defaultEnvironment) {
  const entryId = environment.id();
  const result = edit(workspace, (copy) => {
    const round = requireItem(requireScenario(copy, planId, discipline, scenarioId).rounds, roundId);
    const plannedSkillId = ambitionDefinition(copy, discipline, definition, environment);
    const next: RoundEntryInput[] = [...round.entries];
    next.splice(Math.max(0, Math.min(position, next.length)), 0, { id: entryId, athleteId: null, athleteSkillId: null, role, plannedSkillId });
    applyRoundEntries(copy, planId, discipline, scenarioId, roundId, next, limits);
  }, environment);
  return { workspace: result, entryId };
}

function requireAmbition(copy: Workspace, planId: string, discipline: SpringDiscipline, scenarioId: string, roundId: string, entryId: string) {
  const entry = requireEntry(copy, planId, discipline, scenarioId, roundId, entryId);
  if (entry.athleteId !== null) throw new Error('Pladsen er allerede besat.');
  return entry;
}

/** Skifter springet på en ubesat ambition, eventuelt sammen med rollen. */
export function changeAmbitionSkill(workspace: Workspace, planId: string, discipline: SpringDiscipline, scenarioId: string, roundId: string, entryId: string, definition: SkillDefinition, role: RoundEntry['role'] | undefined, limits: ParticipantLimits, environment = defaultEnvironment) {
  return edit(workspace, (copy) => {
    requireAmbition(copy, planId, discipline, scenarioId, roundId, entryId);
    const plannedSkillId = ambitionDefinition(copy, discipline, definition, environment);
    const round = requireItem(requireScenario(copy, planId, discipline, scenarioId).rounds, roundId);
    applyRoundEntries(copy, planId, discipline, scenarioId, roundId, round.entries.map((entry) => entry.id === entryId ? { ...entry, plannedSkillId, role: role ?? entry.role } : entry), limits);
  }, environment);
}

/** Besætter en ambition med en gymnast, der faktisk kan springet. Plads-id, rolle og position bevares. */
export function fillAmbition(workspace: Workspace, planId: string, discipline: SpringDiscipline, scenarioId: string, roundId: string, entryId: string, athleteSkillId: string, environment = defaultEnvironment) {
  return edit(workspace, (copy) => {
    const entry = requireAmbition(copy, planId, discipline, scenarioId, roundId, entryId);
    const plan = requireItem(copy.plans, planId);
    const round = requireItem(requireScenario(copy, planId, discipline, scenarioId).rounds, roundId);
    const registration = requireItem(copy.athleteSkills, athleteSkillId);
    const athlete = requireItem(copy.athletes, registration.athleteId);
    const skill = requireItem(copy.skills, registration.skillId);
    const planned = requireItem(copy.skills, entry.plannedSkillId!);
    if (athlete.archived || athlete.teamId !== plan.teamId) throw new Error('Vælg en aktiv gymnast på holdet.');
    if ([...round.entries, ...round.reserves].some((item) => item.athleteId === athlete.id)) throw new Error('Gymnasten er allerede med i omgangen.');
    if (registration.archived || skill.archived || skill.discipline !== discipline) throw new Error('Vælg gymnastens aktive registrering af springet.');
    const identity = springIdentityOf(environment);
    if (identity(skill) !== identity(planned)) throw new Error('Gymnastens registrering er ikke ambitionens spring.');
    Object.assign(entry, { athleteId: athlete.id, athleteSkillId: registration.id, plannedSkillId: null, plannedSpot: null });
  }, environment);
}

export interface PlannedSpotInput { grade: SpotGrade; elementIndex?: number | null }

function requireEntry(copy: Workspace, planId: string, discipline: SpringDiscipline, scenarioId: string, roundId: string, entryId: string): RoundEntry {
  const plan = requireItem(copy.plans, planId);
  if (requireItem(copy.teams, plan.teamId).archived) throw new Error('Genaktivér holdet før redigering.');
  return requireItem(requireItem(requireScenario(copy, planId, discipline, scenarioId).rounds, roundId).entries, entryId);
}

export function setPlannedSpot(workspace: Workspace, planId: string, discipline: SpringDiscipline, scenarioId: string, roundId: string, entryId: string, input: PlannedSpotInput, environment = defaultEnvironment) {
  return edit(workspace, (copy) => {
    const entry = requireEntry(copy, planId, discipline, scenarioId, roundId, entryId);
    if (entry.athleteId === null) throw new Error('En ambition uden gymnast kan ikke have en modtagning.');
    if (entry.athleteSkillId === null) throw new Error('Vælg et spring på pladsen før en modtagning.');
    const skill = requireItem(copy.skills, requireItem(copy.athleteSkills, entry.athleteSkillId).skillId);
    if (skill.discipline !== discipline) throw new Error('Modtagning kan kun planlægges på bane og trampet.');
    let elementIndex: number | null = null;
    if (input.grade === 'heavy' && skill.discipline === 'tumbling') {
      elementIndex = input.elementIndex ?? skill.elements.length - 1;
      if (!Number.isInteger(elementIndex) || elementIndex < 0 || elementIndex >= skill.elements.length) throw new Error('Vælg et element i serien.');
    } else if (input.elementIndex !== undefined && input.elementIndex !== null) throw new Error('Elementvalg hører kun til kraftig hjælp på bane.');
    entry.plannedSpot = { grade: input.grade, skillId: skill.id, elementIndex } satisfies PlannedSpot;
  }, environment);
}

export function clearPlannedSpot(workspace: Workspace, planId: string, discipline: SpringDiscipline, scenarioId: string, roundId: string, entryId: string, environment = defaultEnvironment) {
  return edit(workspace, (copy) => { requireEntry(copy, planId, discipline, scenarioId, roundId, entryId).plannedSpot = null; }, environment);
}

export function moveRoundFirst(workspace: Workspace, planId: string, discipline: SpringDiscipline, scenarioId: string, roundId: string, environment = defaultEnvironment) {
  return edit(workspace, (copy) => {
    const plan = requireItem(copy.plans, planId);
    if (requireItem(copy.teams, plan.teamId).archived) throw new Error('Genaktivér holdet før redigering.');
    const rounds = requireScenario(copy, planId, discipline, scenarioId).rounds;
    const index = rounds.findIndex((round) => round.id === roundId);
    if (index < 0) throw new Error('Omgangen findes ikke.');
    const [round] = rounds.splice(index, 1);
    rounds.unshift(round!);
  }, environment);
}

function checkReserve(workspace: Workspace, teamId: string, discipline: SpringDiscipline, entry: ReserveEntry) {
  const athlete = requireItem(workspace.athletes, entry.athleteId);
  if (athlete.archived || athlete.teamId !== teamId) throw new Error('Vælg en aktiv gymnast på holdet.');
  if (entry.athleteSkillId !== null) {
    const registration = requireItem(workspace.athleteSkills, entry.athleteSkillId);
    const skill = requireItem(workspace.skills, registration.skillId);
    if (registration.athleteId !== entry.athleteId || registration.archived || skill.archived || skill.discipline !== discipline) throw new Error('Vælg gymnastens aktive færdighed i denne disciplin.');
  }
}

export function setRoundReserves(workspace: Workspace, planId: string, discipline: SpringDiscipline, scenarioId: string, roundId: string, reserves: ReserveEntry[], environment = defaultEnvironment) {
  return edit(workspace, (copy) => {
    const plan = requireItem(copy.plans, planId);
    if (requireItem(copy.teams, plan.teamId).archived) throw new Error('Genaktivér holdet før redigering.');
    const round = requireItem(requireScenario(copy, planId, discipline, scenarioId).rounds, roundId);
    for (const reserve of reserves) {
      const previous = round.reserves.find((item) => item.id === reserve.id);
      if (previous?.athleteId !== reserve.athleteId || previous.athleteSkillId !== reserve.athleteSkillId) checkReserve(copy, plan.teamId, discipline, reserve);
    }
    round.reserves = structuredClone(reserves);
  }, environment);
}

export function insertReserve(workspace: Workspace, planId: string, discipline: SpringDiscipline, scenarioId: string, roundId: string, reserveId: string, entryId: string, basisPayload: string, limits: ParticipantLimits, environment = defaultEnvironment) {
  if (workspacePayload(workspace) !== basisPayload) throw new Error('Data er ændret siden forhåndsvisningen. Beregn igen.');
  const plan = requireItem(workspace.plans, planId);
  const round = requireItem(requireScenario(workspace, planId, discipline, scenarioId).rounds, roundId);
  const reserve = requireItem(round.reserves, reserveId);
  checkReserve(workspace, plan.teamId, discipline, reserve);
  if (requireItem(round.entries, entryId).athleteId === null) throw new Error('En reserve kan ikke erstatte en ambition. Besæt ambitionen i stedet.');
  const removed = setRoundReserves(workspace, planId, discipline, scenarioId, roundId, round.reserves.filter((item) => item.id !== reserveId), environment);
  return setRoundEntries(removed, planId, discipline, scenarioId, roundId, round.entries.map((entry) => entry.id === entryId ? { ...entry, athleteId: reserve.athleteId, athleteSkillId: reserve.athleteSkillId } : entry), limits, environment);
}

export function roundStability(workspace: Workspace, entries: readonly RoundEntryInput[], limits: ParticipantLimits, teamId: string) {
  const registrations = new Map(workspace.athleteSkills.map((item) => [item.id, item]));
  const athletes = new Map(workspace.athletes.map((item) => [item.id, item]));
  const skills = new Map(workspace.skills.map((item) => [item.id, item]));
  function slots(selected: readonly RoundEntryInput[]) {
    return selected.map((entry) => {
      const registration = entry.athleteSkillId ? registrations.get(entry.athleteSkillId) : undefined;
      const athlete = entry.athleteId === null ? undefined : athletes.get(entry.athleteId);
      const valid = Boolean(athlete && !athlete.archived && athlete.teamId === teamId && registration && !registration.archived && !skills.get(registration.skillId)?.archived);
      return { filled: valid, value: valid ? registration?.stability ?? null : null as Stability | null };
    });
  }
  const counting = entries.filter((entry) => entry.role === 'counting');
  const extras = entries.filter((entry) => entry.role === 'extra');
  return { counting: aggregateStability(slots(counting), limits.counting), extra: aggregateStability(slots(extras), extras.length) };
}
