import type { Fraction, SpringDiscipline, Stability, Workspace } from '@teamgym/domain';
import type { RulePackage } from '@teamgym/rules';
import { skillFamily } from './skill-overview';
import { teamSkillRows } from './spring-picker-model';
import type { TeamSkillAthlete } from './spring-picker-model';

/** Status mod holdomgangens krav N; `null` betyder nedtonet uden status. */
export type ProfileStatus = 'ready' | 'fragile' | 'unassessed' | 'unstable' | 'close' | null;

export interface ProfileRow {
  identity: string;
  name: string;
  direction: string;
  difficulty: Fraction | null;
  family: string;
  can: number;
  safe: number;
  low: number;
  unassessed: number;
  status: ProfileStatus;
  /** Bedste registrering pr. gymnast; sikre, lave og Ikke vurderet i den rækkefølge. */
  athletes: TeamSkillAthlete[];
}

export interface ProfileDistribution {
  safe: number;
  low: number;
  unassessed: number;
}

export interface ProfileLine {
  family: string;
  /** Rækker med kendt D, sværeste først; både synlige og overgåede. */
  rows: ProfileRow[];
  visible: ProfileRow[];
  /** Overgået af et sværere spring i linjen med mindst lige så mange (beskåret ved N + 2). */
  hidden: ProfileRow[];
  /** Ukendt D: overgår aldrig og overgås aldrig. */
  unknown: ProfileRow[];
  distribution: ProfileDistribution;
  /** Linjens sværeste Klar-spring. */
  level: ProfileRow | null;
}

export type FocusKind = 'close' | 'unstable' | 'fragile' | 'low-line' | 'unassessed';
export interface FocusPoint {
  kind: FocusKind;
  text: string;
  family: string;
  identity: string | null;
}

export interface TeamProfile {
  n: number;
  cap: number;
  athletes: { id: string; name: string }[];
  lines: ProfileLine[];
  level: { tops: ProfileRow[]; openLines: number };
  focus: FocusPoint[];
}

const FAMILY_ORDER = [
  'Rondat-flik',
  'Rondat-whipback',
  'Rondat direkte',
  'Kraftspring',
  'Flyvespring',
  'Whipback',
  'Startsalto · baglæns',
  'Startsalto · forlæns',
  'Øvrige egne spring',
  'Uden redskab · Enkelt salto',
  'Uden redskab · Dobbelt salto',
  'Uden redskab · Øvrige saltoer',
  'Uden redskab · Tsukahara',
  'Uden redskab · Overslag og øvrige spring',
  'Med redskab · Enkelt salto',
  'Med redskab · Dobbelt salto',
  'Med redskab · Øvrige saltoer',
  'Med redskab · Tsukahara',
  'Med redskab · Overslag og øvrige spring',
];

export function stabilityGroup(stability: Stability | null): 'safe' | 'low' | 'unassessed' {
  return stability === null ? 'unassessed' : stability >= 3 ? 'safe' : 'low';
}

export function profileStatus(
  counts: Pick<ProfileRow, 'can' | 'safe' | 'unassessed'>,
  n: number,
): ProfileStatus {
  const { can, safe, unassessed } = counts;
  if (can >= n) {
    if (safe >= n + 1) return 'ready';
    if (safe === n) return 'fragile';
    return safe + unassessed >= n ? 'unassessed' : 'unstable';
  }
  return can === n - 1 ? 'close' : null;
}

const byDifficulty = (a: ProfileRow, b: ProfileRow) =>
  (a.difficulty && b.difficulty ? b.difficulty.compare(a.difficulty) : 0) || a.name.localeCompare(b.name, 'da');

function familyRank(family: string) {
  const index = FAMILY_ORDER.indexOf(family);
  return index < 0 ? FAMILY_ORDER.length : index;
}

/**
 * Holdprofil for én disciplin: ren afledning af aktive registreringer under holdets regelpakke.
 * Gemmes aldrig og ændrer ikke arbejdsrummet.
 */
export function teamProfile(
  workspace: Pick<Workspace, 'athletes' | 'athleteSkills' | 'skills'>,
  teamId: string,
  discipline: SpringDiscipline,
  rulePackage: RulePackage,
): TeamProfile {
  const n = rulePackage.springRules.participants.counting;
  const cap = n + 2;
  const athletes = workspace.athletes
    .filter((athlete) => athlete.teamId === teamId && !athlete.archived)
    .map((athlete) => ({ id: athlete.id, name: athlete.name }))
    .sort((a, b) => a.name.localeCompare(b.name, 'da'));
  const groups = new Map<string, ProfileRow[]>();
  for (const source of teamSkillRows(
    workspace,
    teamId,
    discipline,
    rulePackage,
    athletes.map((athlete) => athlete.id),
  )) {
    const counts = { safe: 0, low: 0, unassessed: 0 };
    for (const athlete of source.available) counts[stabilityGroup(athlete.stability)]++;
    const can = source.available.length;
    const row: ProfileRow = {
      identity: source.identity,
      name: source.name,
      direction: source.direction,
      difficulty: source.difficulty,
      family: skillFamily(source.definition, rulePackage),
      can,
      ...counts,
      status: profileStatus({ can, ...counts }, n),
      athletes: source.available,
    };
    groups.set(row.family, [...(groups.get(row.family) ?? []), row]);
  }
  const clip = (value: number) => Math.min(value, cap);
  const lines = [...groups]
    .sort(([a], [b]) => familyRank(a) - familyRank(b) || a.localeCompare(b, 'da'))
    .map(([family, all]): ProfileLine => {
      const rows = all.filter((row) => row.difficulty).sort(byDifficulty);
      const unknown = all.filter((row) => !row.difficulty).sort((a, b) => a.name.localeCompare(b.name, 'da'));
      const hidden = rows.filter((a) =>
        rows.some(
          (b) =>
            b.difficulty!.compare(a.difficulty!) > 0 &&
            clip(b.can) >= clip(a.can) &&
            clip(b.safe) >= clip(a.safe),
        ),
      );
      const distribution = { safe: 0, low: 0, unassessed: 0 };
      for (const row of all) {
        distribution.safe += row.safe;
        distribution.low += row.low;
        distribution.unassessed += row.unassessed;
      }
      return {
        family,
        rows,
        visible: rows.filter((row) => !hidden.includes(row)),
        hidden,
        unknown,
        distribution,
        level: rows.find((row) => row.status === 'ready') ?? null,
      };
    });
  const above = (line: ProfileLine, row: ProfileRow) =>
    !line.level || row.difficulty!.compare(line.level.difficulty!) > 0;
  const tops = lines
    .flatMap((line) => (line.level ? [line.level] : []))
    .sort(byDifficulty)
    .slice(0, 3);
  const openLines = lines.filter((line) =>
    line.visible.some((row) => (row.status === 'close' || row.status === 'unstable') && above(line, row)),
  ).length;
  type Candidate = FocusPoint & { difficulty: Fraction | null };
  const point = (kind: FocusKind, row: ProfileRow, suffix: string): Candidate => ({
    kind,
    text: `${row.name} · ${suffix}`,
    family: row.family,
    identity: row.identity,
    difficulty: row.difficulty,
  });
  const candidates: Candidate[][] = [
    lines.flatMap((line) =>
      line.visible.filter((row) => row.status === 'close' && above(line, row)).map((row) => point('close', row, 'mangler 1')),
    ),
    lines.flatMap((line) =>
      line.visible
        .filter((row) => row.status === 'unstable' && above(line, row))
        .map((row) => point('unstable', row, `${row.low} ${row.low === 1 ? 'lav' : 'lave'}`)),
    ),
    lines.flatMap((line) =>
      line.visible
        .filter((row) => row.status === 'fragile' && above(line, row))
        .map((row) => point('fragile', row, 'ingen margin')),
    ),
    lines.flatMap((line) => {
      const assessed = line.distribution.safe + line.distribution.low;
      return assessed > 0 && line.distribution.low * 2 >= assessed
        ? [
            {
              kind: 'low-line' as const,
              text: `${line.family} · lav sikkerhed i linjen`,
              family: line.family,
              identity: null,
              difficulty: line.rows[0]?.difficulty ?? null,
            },
          ]
        : [];
    }),
    lines.flatMap((line) =>
      [...line.visible, ...line.unknown]
        .filter((row) => row.status === 'unassessed')
        .map((row) => point('unassessed', row, 'mangler vurdering')),
    ),
  ];
  const focus = candidates
    .flatMap((group) =>
      group.sort((a, b) =>
        a.difficulty && b.difficulty
          ? b.difficulty.compare(a.difficulty)
          : (b.difficulty ? 1 : 0) - (a.difficulty ? 1 : 0),
      ),
    )
    .slice(0, 5)
    .map(({ difficulty: _difficulty, ...item }) => {
      void _difficulty;
      return item;
    });
  return { n, cap, athletes, lines, level: { tops, openLines }, focus };
}
