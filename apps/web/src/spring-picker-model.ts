import { skillIdentity } from '@teamgym/domain';
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

/** Samme udførelse har én række på tværs af bibliotek, direkte valg og fundament. */
export function springPickerRows(
  library: readonly SpringChoice[],
  candidates: readonly SpringChoice[],
  plan: readonly PlannedSpring[],
  query = '',
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
  return query.trim()
    ? result.sort((a, b) => (springPickerRowRank(a, query) ?? 100) - (springPickerRowRank(b, query) ?? 100))
    : result;
}
