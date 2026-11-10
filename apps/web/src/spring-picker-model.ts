import { Fraction, skillIdentity } from '@teamgym/domain';
import type { Round, SkillDefinition, SpringDiscipline, Stability, Workspace } from '@teamgym/domain';
import type { RulePackage } from '@teamgym/rules';
import type { PlannedSpring, SpringChoice, SpringDefinition } from './spring-library';
import { matchesSpring, springDirectionText, springDisplayName, springSearchRank } from './spring-library';

type SpringSkill = Exclude<SkillDefinition, { discipline: 'rhythm' }>;

export interface TeamSkillAthlete {
  athleteId: string;
  /** Gymnastens bedste anvendelige registrering af identiteten. */
  registrationId: string;
  stability: Stability | null;
}

export interface TeamSkillRow {
  identity: string;
  name: string;
  /** Alle visningsnavne i identitetsgruppen, så søgning rammer enhver registrering. */
  names: string[];
  direction: string;
  difficulty: Fraction | null;
  /** Ledige gymnaster med springet; højeste sikkerhed først. */
  available: TeamSkillAthlete[];
  /** Gymnaster (id), der kan springet, men allerede står i omgangen; alfabetisk. */
  placed: string[];
}

const stabilityRank = (value: Stability | null) => value ?? 0;

/**
 * Holdets anvendelige spring i disciplinen, én række pr. regelidentitet.
 * Samme filter som gymnastens liste; kun spring med mindst én ledig gymnast. Afledt og gemmes aldrig.
 */
export function teamSkillRows(
  workspace: Pick<Workspace, 'athletes' | 'athleteSkills' | 'skills'>,
  teamId: string,
  discipline: SpringDiscipline,
  rulePackage: RulePackage,
  availableAthleteIds: Iterable<string>,
): TeamSkillRow[] {
  const available = new Set(availableAthleteIds);
  const athletes = new Map(
    workspace.athletes
      .filter((athlete) => athlete.teamId === teamId && !athlete.archived)
      .map((athlete) => [athlete.id, athlete]),
  );
  const skills = new Map(workspace.skills.map((skill) => [skill.id, skill]));
  const groups = new Map<
    string,
    {
      skill: SpringSkill;
      difficulty: Fraction | null;
      names: Set<string>;
      best: Map<string, TeamSkillAthlete>;
    }
  >();
  for (const registration of workspace.athleteSkills) {
    const skill = skills.get(registration.skillId);
    if (registration.archived || !athletes.has(registration.athleteId) || !skill || skill.archived) continue;
    if (skill.discipline !== discipline) continue;
    const evaluated = rulePackage.evaluateSkill(skill, registration);
    if (evaluated.validity !== 'known') continue;
    const group = groups.get(evaluated.identity) ?? {
      skill,
      difficulty: evaluated.difficulty.value,
      names: new Set<string>(),
      best: new Map<string, TeamSkillAthlete>(),
    };
    groups.set(evaluated.identity, group);
    group.names.add(springDisplayName(skill, rulePackage));
    const previous = group.best.get(registration.athleteId);
    // Ved lige sikkerhed vinder den første registrering.
    if (!previous || stabilityRank(registration.stability) > stabilityRank(previous.stability))
      group.best.set(registration.athleteId, {
        athleteId: registration.athleteId,
        registrationId: registration.id,
        stability: registration.stability,
      });
  }
  const name = (id: string) => athletes.get(id)?.name ?? '';
  const rows: TeamSkillRow[] = [];
  for (const [identity, group] of groups) {
    const all = [...group.best.values()];
    const free = all
      .filter((item) => available.has(item.athleteId))
      .sort(
        (a, b) =>
          stabilityRank(b.stability) - stabilityRank(a.stability) ||
          name(a.athleteId).localeCompare(name(b.athleteId), 'da'),
      );
    if (!free.length) continue;
    const names = [...group.names];
    rows.push({
      identity,
      name: names[0]!,
      names,
      direction: springDirectionText(group.skill),
      difficulty: group.difficulty,
      available: free,
      placed: all
        .filter((item) => !available.has(item.athleteId))
        .map((item) => item.athleteId)
        .sort((a, b) => name(a).localeCompare(name(b), 'da')),
    });
  }
  return rows.sort(
    (a, b) =>
      b.available.length - a.available.length ||
      (b.difficulty && a.difficulty
        ? b.difficulty.compare(a.difficulty)
        : (b.difficulty ? 1 : 0) - (a.difficulty ? 1 : 0)) ||
      a.name.localeCompare(b.name, 'da'),
  );
}

/**
 * Tællende pladser pr. regelidentitet og omgang (indeks i `rounds`) på samme grundlag som C-GENTAG:
 * tællende, tilgængelig og kendt gyldighed. Ambitioner tæller via deres planlagte spring.
 * Den redigerede plads, ekstra pladser og reserver udelades. Afledt og gemmes aldrig.
 */
export function roundIdentityUsage(
  workspace: Pick<Workspace, 'athletes' | 'athleteSkills' | 'skills'>,
  teamId: string,
  discipline: SpringDiscipline,
  rulePackage: Pick<RulePackage, 'evaluateSkill'>,
  rounds: readonly Pick<Round, 'entries'>[],
  editingEntryId?: string,
): Map<string, number[]> {
  const athletes = new Map(workspace.athletes.map((athlete) => [athlete.id, athlete]));
  const registrations = new Map(
    workspace.athleteSkills.map((registration) => [registration.id, registration]),
  );
  const skills = new Map(workspace.skills.map((skill) => [skill.id, skill]));
  const usage = new Map<string, number[]>();
  rounds.forEach((round, index) => {
    for (const entry of round.entries) {
      if (entry.role !== 'counting' || entry.id === editingEntryId) continue;
      let identity: string | null = null;
      if (entry.athleteId === null) {
        const skill = entry.plannedSkillId ? skills.get(entry.plannedSkillId) : undefined;
        if (!skill || skill.archived || skill.discipline !== discipline) continue;
        const evaluated = rulePackage.evaluateSkill(skill);
        if (evaluated.validity === 'known') identity = evaluated.identity;
      } else {
        const athlete = athletes.get(entry.athleteId);
        const registration = entry.athleteSkillId ? registrations.get(entry.athleteSkillId) : undefined;
        const skill = registration ? skills.get(registration.skillId) : undefined;
        if (
          !athlete ||
          athlete.archived ||
          athlete.teamId !== teamId ||
          !registration ||
          registration.archived
        )
          continue;
        if (!skill || skill.archived || skill.discipline !== discipline) continue;
        const evaluated = rulePackage.evaluateSkill(skill, registration);
        if (evaluated.validity === 'known') identity = evaluated.identity;
      }
      if (!identity) continue;
      const counts = usage.get(identity) ?? rounds.map(() => 0);
      counts[index]! += 1;
      usage.set(identity, counts);
    }
  });
  return usage;
}
import { listedSpring, matchesChain } from './spring-chain-model';
import type { ChainState } from './spring-chain-model';

/** Fælles ren filtrering for gymnast og ambition; et allerede valgt spring vises særskilt. */
export function filterSpringChoices(
  library: readonly SpringChoice[], discipline: 'tumbling' | 'trampet', query: string,
  chain: ChainState, minimum: string, unknown: boolean, rulePackage: Pick<RulePackage, 'evaluateSkill'>,
): SpringChoice[] {
  const threshold = /^\d+(?:[.,]\d+)?$/.test(minimum) ? Fraction.from(minimum.replace(',', '.')) : null;
  return library.filter((item) => {
    if (item.definition.discipline !== discipline || !listedSpring(item) || !matchesSpring(item, query) || !matchesChain(item.definition, chain)) return false;
    const difficulty = rulePackage.evaluateSkill(item.definition).difficulty.value;
    return unknown ? difficulty === null : !threshold || (difficulty?.compare(threshold) ?? -1) >= 0;
  });
}

export interface SpringPickerRow {
  identity: string;
  key: string;
  definition: SpringDefinition;
  choice?: SpringChoice;
  planned?: PlannedSpring;
}

export function springPickerRowRank(row: SpringPickerRow, query: string): number | null {
  return springSearchRank(
    {
      id: row.key,
      definition: row.definition,
      own: row.choice?.own ?? false,
      group: row.choice?.group ?? '',
      aliases: row.choice?.aliases ?? [],
    },
    query,
  );
}

/** En upræciseret katalogskabelon erstattes af dens valgte præcise variant. */
function templateIdentity(definition: SpringDefinition): string {
  if (definition.discipline !== 'trampet' || definition.jump.rotationQuarterTurns !== 8)
    return skillIdentity(definition);
  return skillIdentity({ ...definition, jump: { ...definition.jump, twistDistribution: [] } });
}

/**
 * Antal andre aktive gymnaster på holdet med en aktiv registrering pr. præcis udførelse.
 * Afledt ved visning; gemmes aldrig og viser ingen navne.
 */
export function teamSpringCounts(
  workspace: Pick<Workspace, 'athletes' | 'athleteSkills' | 'skills'>,
  teamId: string | null | undefined,
  excludeAthleteId?: string,
): Map<string, number> {
  const counts = new Map<string, number>();
  if (!teamId) return counts;
  const athletes = new Set(
    workspace.athletes
      .filter((athlete) => athlete.teamId === teamId && !athlete.archived && athlete.id !== excludeAthleteId)
      .map((athlete) => athlete.id),
  );
  const skills = new Map(
    workspace.skills.filter((skill) => !skill.archived).map((skill) => [skill.id, skillIdentity(skill)]),
  );
  const known = new Map<string, Set<string>>();
  for (const registration of workspace.athleteSkills) {
    const identity = skills.get(registration.skillId);
    if (registration.archived || !identity || !athletes.has(registration.athleteId)) continue;
    known.set(identity, (known.get(identity) ?? new Set()).add(registration.athleteId));
  }
  for (const [identity, ids] of known) counts.set(identity, ids.size);
  return counts;
}

/** Aktive gymnaster med en anvendelig registrering, opgjort efter regelpakkens springidentitet. */
export function teamUsableSpringCounts(
  workspace: Pick<Workspace, 'athletes' | 'athleteSkills' | 'skills'>,
  teamId: string,
  rulePackage: Pick<RulePackage, 'evaluateSkill'>,
): Map<string, number> {
  const athletes = new Set(workspace.athletes.filter((athlete) => athlete.teamId === teamId && !athlete.archived).map((athlete) => athlete.id));
  const skills = new Map(workspace.skills.filter((skill) => !skill.archived).map((skill) => [skill.id, skill]));
  const known = new Map<string, Set<string>>();
  for (const registration of workspace.athleteSkills) {
    const skill = skills.get(registration.skillId);
    if (registration.archived || !athletes.has(registration.athleteId) || !skill || skill.discipline === 'rhythm') continue;
    const evaluated = rulePackage.evaluateSkill(skill, registration);
    if (evaluated.validity !== 'known') continue;
    known.set(evaluated.identity, (known.get(evaluated.identity) ?? new Set()).add(registration.athleteId));
  }
  return new Map([...known].map(([identity, ids]) => [identity, ids.size]));
}

/** Holdkendte spring først (flest gymnaster øverst); ellers bevares rækkefølgen. */
export function sortByTeamKnown<T extends { definition: SpringDefinition }>(
  choices: readonly T[],
  counts: ReadonlyMap<string, number>,
): T[] {
  const known = (choice: T) => counts.get(skillIdentity(choice.definition)) ?? 0;
  return [...choices].sort((a, b) => known(b) - known(a));
}

/** Samme udførelse har én række på tværs af bibliotek, direkte valg og fundament. */
export function springPickerRows(
  library: readonly SpringChoice[],
  candidates: readonly SpringChoice[],
  plan: readonly PlannedSpring[],
  query = '',
  teamCounts: ReadonlyMap<string, number> = new Map(),
): SpringPickerRow[] {
  const exact = new Map(library.map((choice) => [skillIdentity(choice.definition), choice]));
  const rows = new Map<string, SpringPickerRow>();
  const addPlanned = (planned: PlannedSpring) => {
    const identity = skillIdentity(planned.definition);
    if (rows.has(identity)) return;
    const choice =
      exact.get(identity) ??
      library.find(
        (item) =>
          item.definition.discipline === 'trampet' &&
          item.definition.jump.twistDistribution.length === 0 &&
          templateIdentity(item.definition) === templateIdentity(planned.definition),
      );
    rows.set(identity, {
      identity,
      key: choice?.id ?? identity,
      definition: planned.definition,
      planned,
      ...(choice ? { choice } : {}),
    });
  };
  for (const parent of plan.filter((item) => item.explicit)) {
    addPlanned(parent);
    const identity = skillIdentity(parent.definition);
    for (const child of plan.filter(
      (item) =>
        !item.explicit &&
        (item.sourceIdentity === identity ||
          (!item.sourceIdentity && item.relations[0]?.sourceIdentity === identity)),
    ))
      addPlanned(child);
  }
  for (const planned of plan) addPlanned(planned);
  for (const choice of candidates) {
    const identity = skillIdentity(choice.definition);
    if (rows.has(identity) || [...rows.values()].some((row) => row.choice?.id === choice.id)) continue;
    rows.set(identity, { identity, key: choice.id, definition: choice.definition, choice });
  }
  const keys = new Map<string, number>();
  for (const row of rows.values()) keys.set(row.key, (keys.get(row.key) ?? 0) + 1);
  const result = [...rows.values()].map((row) =>
    keys.get(row.key)! > 1 ? { ...row, key: `${row.key}:${row.identity}` } : row,
  );
  const known = (row: SpringPickerRow) => (row.planned ? 0 : (teamCounts.get(row.identity) ?? 0));
  if (query.trim()) {
    const ranks = new Map(result.map((row) => [row.key, springPickerRowRank(row, query) ?? 100]));
    // Søgerangen går forud; holdkendskab afgør kun ved lige rang. Sorteringen er stabil.
    return result.sort((a, b) => ranks.get(a.key)! - ranks.get(b.key)! || known(b) - known(a));
  }
  // Planlagte → holdkendte → øvrige i biblioteksrækkefølge.
  const group = (row: SpringPickerRow) => (row.planned ? 0 : known(row) > 0 ? 1 : 2);
  return result.sort((a, b) => group(a) - group(b) || known(b) - known(a));
}
