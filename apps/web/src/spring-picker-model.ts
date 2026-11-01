import { skillIdentity } from '@teamgym/domain';
import type { Workspace } from '@teamgym/domain';
import type { PlannedSpring, SpringChoice, SpringDefinition } from './spring-library';
import { springSearchRank } from './spring-library';

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
