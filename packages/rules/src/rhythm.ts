import { canonicalJson, Fraction, aggregateStability, bindingFingerprint, stabilitySchema } from '@teamgym/domain';
import type { AthleteSkill, EvaluationStatus, SkillDefinition, Stability, Workspace } from '@teamgym/domain';
import type { RhythmCatalogEntry } from './catalog';

export interface RhythmBinding {
  status: EvaluationStatus;
  moment: RhythmCatalogEntry | null;
  key: string | null;
  variant: Readonly<Record<string, string | number | boolean>>;
  reason: string | null;
}

export function bindRhythmSkill(skill: Extract<SkillDefinition, { discipline: 'rhythm' }>, catalog: readonly RhythmCatalogEntry[]): RhythmBinding {
  const moment = catalog.find((entry) => entry.id === skill.momentId) ?? null;
  if (!moment) return { status: 'unresolved', moment: null, key: null, variant: skill.variant, reason: 'Momentet har ingen kendt regelkobling.' };
  if (skill.archived) return { status: 'invalid', moment, key: null, variant: skill.variant, reason: 'Færdigheden er arkiveret.' };
  const variant: Record<string, string | number | boolean> = {};
  for (const option of moment.options) {
    const value = skill.variant[option.key] ?? (option.values.length === 1 ? option.values[0] : undefined);
    if (value === undefined) return { status: 'incomplete', moment, key: null, variant: skill.variant, reason: `Vælg ${option.label.toLocaleLowerCase('da-DK')}.` };
    if (typeof value !== 'string' || !option.values.includes(value)) return { status: 'invalid', moment, key: null, variant: skill.variant, reason: `${option.label} opfylder ikke momentets krav.` };
    variant[option.key] = value;
  }
  for (const [key, value] of Object.entries(skill.variant)) {
    if (moment.options.some((option) => option.key === key)) continue;
    if (moment.mirrorAllowed && ['side', 'supportLeg'].includes(key) && ['left', 'right'].includes(String(value))) continue;
    return { status: 'unresolved', moment, key: null, variant: skill.variant, reason: 'Den registrerede variant kræver en kendt regelkobling.' };
  }
  return { status: 'known', moment, key: canonicalJson({ momentId: moment.id, variant }), variant, reason: null };
}

export interface RhythmCell {
  athleteId: string; athleteName: string; registrationId: string | null; stability: Stability | null;
  state: 'missing' | 'not-assessed' | 'assessed' | 'unresolved' | 'review';
}

export function summarizeRhythmCells(cells: readonly RhythmCell[], threshold: Stability | null = null) {
  if (threshold !== null) stabilitySchema.parse(threshold);
  const registered = cells.filter((cell) => cell.state === 'not-assessed' || cell.state === 'assessed');
  const values = registered.map((cell) => cell.stability).filter((value): value is Stability => value !== null);
  const sum = values.reduce((total, value) => total + value, 0);
  const aggregate = aggregateStability(cells.map((cell) => ({ filled: registered.includes(cell), value: registered.includes(cell) ? cell.stability : null })), cells.length);
  const common = cells.length > 0 && registered.length === cells.length;
  return { ...aggregate, meanExact: values.length ? new Fraction(sum, values.length) : null,
    coverage: `${registered.length}/${cells.length}`, ratingCoverage: `${values.length}/${cells.length}`,
    registeredCount: registered.length, common, passesThreshold: common && (threshold === null || registered.every((cell) => cell.stability !== null && cell.stability >= threshold)),
    missingNames: cells.filter((cell) => cell.state === 'missing').map((cell) => cell.athleteName),
    unassessedNames: cells.filter((cell) => cell.state === 'not-assessed').map((cell) => cell.athleteName),
    lowNames: registered.filter((cell) => cell.stability !== null && cell.stability <= 2).map((cell) => cell.athleteName),
    reviewNames: cells.filter((cell) => cell.state === 'review' || cell.state === 'unresolved').map((cell) => cell.athleteName),
  };
}

export interface RhythmFilter { mode?: 'all' | 'common' | 'partial'; category?: string; search?: string; threshold?: Stability | null }
export function filterRhythmRows(rows: readonly RhythmRow[], filter: RhythmFilter): RhythmRow[] {
  const query = (filter.search ?? '').trim().toLocaleLowerCase('da-DK');
  return rows.filter((row) => {
    if (filter.category && row.moment.category !== filter.category) return false;
    if (query && !`${row.moment.name} ${row.moment.officialCode} ${row.moment.specificRequirement}`.toLocaleLowerCase('da-DK').includes(query)) return false;
    const summary = summarizeRhythmCells(row.cells, filter.threshold ?? null);
    if (filter.threshold !== null && filter.threshold !== undefined && !summary.passesThreshold) return false;
    if (filter.mode === 'common' && !summary.common) return false;
    if (filter.mode === 'partial' && (summary.common || summary.registeredCount === 0)) return false;
    return true;
  });
}

export interface RhythmRow {
  key: string; moment: RhythmCatalogEntry; variant: Readonly<Record<string, string | number | boolean>>;
  cells: readonly RhythmCell[]; summary: ReturnType<typeof summarizeRhythmCells>;
}

export function rhythmCommonality(workspace: Workspace, teamId: string, catalog: readonly RhythmCatalogEntry[], threshold: Stability | null = null): RhythmRow[] {
  const athletes = workspace.athletes.filter((athlete) => athlete.teamId === teamId && !athlete.archived);
  if (!athletes.length) return [];
  const athleteIds = new Set(athletes.map((athlete) => athlete.id));
  const team = workspace.teams.find((item) => item.id === teamId);
  const fingerprint = team ? bindingFingerprint(team.rulesetBinding) : '';
  const registrations = workspace.athleteSkills.filter((item) => athleteIds.has(item.athleteId) && !item.archived);
  const definitions = new Map(workspace.skills.map((skill) => [skill.id, skill]));
  const keys = new Map<string, RhythmBinding>();
  const bound = new Map<string, { registration: AthleteSkill; binding: RhythmBinding }[]>();
  for (const registration of registrations) {
    const definition = definitions.get(registration.skillId);
    if (definition?.discipline !== 'rhythm') continue;
    const binding = bindRhythmSkill(definition, catalog);
    if (binding.key && binding.moment) keys.set(binding.key, binding);
    const list = bound.get(registration.athleteId) ?? [];
    list.push({ registration, binding });
    bound.set(registration.athleteId, list);
  }
  // Medtag katalogets konkrete standardvalg også ved nul dækning, så registrering er mulig fra matricen.
  for (const moment of catalog) {
    const variant = Object.fromEntries(moment.options.map((option) => [option.key, option.defaultValue]));
    const binding = bindRhythmSkill({ id: 'catalog-template', name: moment.name, archived: false, discipline: 'rhythm', momentId: moment.id, variant }, catalog);
    if (binding.key && !keys.has(binding.key)) keys.set(binding.key, binding);
  }
  return [...keys.entries()].map(([key, binding]) => {
    const cells: RhythmCell[] = athletes.map((athlete) => {
      const candidates = bound.get(athlete.id) ?? [];
      const exact = candidates.filter((item) => item.binding.key === key).sort((a, b) =>
        Number(a.registration.reviewRequiredFor.includes(fingerprint)) - Number(b.registration.reviewRequiredFor.includes(fingerprint)) ||
        (b.registration.stability ?? -1) - (a.registration.stability ?? -1))[0];
      if (exact) return { athleteId: athlete.id, athleteName: athlete.name, registrationId: exact.registration.id,
        stability: exact.registration.reviewRequiredFor.includes(fingerprint) ? null : exact.registration.stability,
        state: exact.registration.reviewRequiredFor.includes(fingerprint) ? 'review' : exact.registration.stability === null ? 'not-assessed' : 'assessed' };
      const unknown = candidates.find((item) => item.binding.moment?.id === binding.moment!.id && item.binding.status !== 'known');
      return { athleteId: athlete.id, athleteName: athlete.name, registrationId: unknown?.registration.id ?? null,
        stability: null, state: unknown ? 'review' : 'missing' };
    });
    return { key, moment: binding.moment!, variant: binding.variant, cells, summary: summarizeRhythmCells(cells, threshold) };
  });
}
