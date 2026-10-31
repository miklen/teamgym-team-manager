import { canonicalJson } from '@teamgym/domain';
import type { AthleteSkill, Diagnostic, RulesetBinding, SkillDefinition, SpringDiscipline, Workspace } from '@teamgym/domain';
import type { RhythmCatalogEntry, SpringCatalogEntry } from './catalog';
import { freezeData } from './catalog';
import type { KnownIssue, SpotRates, TeamProfile } from './dk-data';
import type { DisciplineEvaluation } from './dk-engine';
import type { CompositionGuideOverview, CompositionGuideRow } from './dk-guide';
import type { SpringSkillEvaluation } from './dk-spring';
import type { BonusPotential, PotentialOptions } from './potential';
import type { RhythmBinding, RhythmRow } from './rhythm';

export interface PackageManifest {
  rulesetId: string; packageVersion: string; name: string; officialEdition: string; season: string; production: boolean;
  algorithms: Readonly<Record<string, string>>;
  sources: readonly { id: string; sha256: string; edition: string; file: string; officialUrl: string }[];
  changeDescription: string;
}
export interface RulePackage {
  manifest: PackageManifest;
  profiles: readonly TeamProfile[];
  springCatalog: readonly SpringCatalogEntry[];
  rhythmCatalog: readonly RhythmCatalogEntry[];
  knownIssues: readonly KnownIssue[];
  /** Satser for planlagt modtagning; null betyder, at konsekvensen er uafklaret. */
  spotRates: SpotRates | null;
  evaluateSkill: (skill: Exclude<SkillDefinition, { discipline: 'rhythm' }>, registration?: AthleteSkill) => SpringSkillEvaluation;
  bindRhythm: (skill: Extract<SkillDefinition, { discipline: 'rhythm' }>) => RhythmBinding;
  analyze: (workspace: Workspace, teamId: string, discipline: SpringDiscipline, scenarioId: string) => DisciplineEvaluation;
  guide: (analysis: DisciplineEvaluation, profile: TeamProfile, potentials?: readonly BonusPotential[] | null) => CompositionGuideRow[];
  guideOverview: (analysis: DisciplineEvaluation) => CompositionGuideOverview;
  rhythm: (workspace: Workspace, teamId: string, threshold?: 1 | 2 | 3 | 4 | 5 | null) => RhythmRow[];
  potentials: (workspace: Workspace, teamId: string, discipline: SpringDiscipline, scenarioId: string, options?: PotentialOptions) => Promise<BonusPotential[]>;
}

const behaviorKeys = ['evaluateSkill', 'bindRhythm', 'analyze', 'guide', 'guideOverview', 'rhythm', 'potentials'] as const;
function packageData(rulePackage: RulePackage) {
  return { manifest: rulePackage.manifest, profiles: rulePackage.profiles, springCatalog: rulePackage.springCatalog, rhythmCatalog: rulePackage.rhythmCatalog, knownIssues: rulePackage.knownIssues, spotRates: rulePackage.spotRates };
}

export class RuleRegistry {
  private readonly packages = new Map<string, { value: RulePackage; fingerprint: string; retired: boolean }>();
  /** En udfaset pakke kan stadig beregne eksisterende bindinger, men tilbydes ikke som nyt valg. */
  register(rulePackage: RulePackage, options: { retired?: boolean } = {}) {
    const key = canonicalJson([rulePackage.manifest.rulesetId, rulePackage.manifest.packageVersion]);
    const fingerprint = canonicalJson(packageData(rulePackage));
    const existing = this.packages.get(key);
    if (existing) {
      if (existing.fingerprint !== fingerprint || behaviorKeys.some((method) => existing.value[method] !== rulePackage[method])) throw new Error('Samme reglements-id/pakkeversion må ikke få ændret data eller algoritmer. Opret en ny version.');
      return existing.value;
    }
    freezeData(rulePackage);
    this.packages.set(key, { value: rulePackage, fingerprint, retired: options.retired ?? false });
    return rulePackage;
  }
  get(rulesetId: string, packageVersion: string): RulePackage | null { return this.packages.get(canonicalJson([rulesetId, packageVersion]))?.value ?? null; }
  list(productionOnly = true): RulePackage[] { return [...this.packages.values()].filter((entry) => !productionOnly || entry.value.manifest.production && !entry.retired).map((entry) => entry.value); }
  isRetired(rulesetId: string, packageVersion: string): boolean { return this.packages.get(canonicalJson([rulesetId, packageVersion]))?.retired ?? false; }
  resolve(binding: RulesetBinding): { status: 'known'; rulePackage: RulePackage; profile: TeamProfile } | { status: 'unresolved'; diagnostics: Diagnostic[] } {
    const rulePackage = this.get(binding.rulesetId, binding.packageVersion);
    const profile = rulePackage?.profiles.find((item) => item.ageGroup === binding.ageGroup && item.teamType === binding.teamType);
    if (!rulePackage || !profile) return { status: 'unresolved', diagnostics: [{ code: 'unknown-ruleset', status: 'unresolved',
      message: !rulePackage ? 'Den præcise regelpakke er ikke installeret. Data og binding bevares.' : 'Holdprofilen findes ikke i den valgte regelpakke.', affectedIds: [], sources: [] }] };
    return { status: 'known', rulePackage, profile };
  }
}
