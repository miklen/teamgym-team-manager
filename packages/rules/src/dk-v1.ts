import { Fraction } from '@teamgym/domain';
import type { AthleteSkill, SkillDefinition, SpringDiscipline, Workspace } from '@teamgym/domain';
import { DK_RHYTHM_CATALOG, DK_SPRING_CATALOG } from './catalog';
import type { RhythmCatalogEntry } from './catalog';
import { DK_KNOWN_ISSUES, DK_PROFILES, DK_SOURCE_MANIFEST } from './dk-data';
import type { TeamProfile } from './dk-data';
import { evaluateDiscipline } from './dk-engine';
import type { EngineSettings } from './dk-engine';
import { evaluateSpringSkill, normalizeElement } from './dk-spring';
import type { SpringSkillEvaluation } from './dk-spring';
import { known, trampetTwistQualifies, uncertain } from './dk-numeric';
import type { NumericDecision } from './dk-numeric';
import { searchBonusPotentials } from './potential';
import type { BonusDefinition } from './potential';
import type { PackageManifest, RulePackage } from './registry';
import { bindRhythmSkill, rhythmCommonality } from './rhythm';

const manifest: PackageManifest = {
  rulesetId: 'dk', packageVersion: '1.0.0', name: 'Danmarksserien', officialEdition: 'DK/REG v1.4; vedtaget august 2026', season: '2026/27', production: true,
  algorithms: { identity: 'dk-identity-1', difficulty: 'dk-d-1', composition: 'dk-c-1', rhythm: 'dk-rhythm-1', potential: 'witness-1' },
  sources: DK_SOURCE_MANIFEST.sources.map(({ id, sha256, edition, file, officialUrl }) => ({ id, sha256, edition, file, officialUrl })),
  changeDescription: 'Første fastlåste DK-pakke med Q01–Q06 som eksplicitte uafklarede regler og K01/K02 bevaret.',
};

export interface DKPackageOptions { manifest?: PackageManifest; profiles?: readonly TeamProfile[]; rhythmCatalog?: readonly RhythmCatalogEntry[]; settings?: EngineSettings }

/** Afgrænset factory til DK-algoritmefamilien og tydelige kontrakttestpakker. */
export function createDKFamilyPackage(options: DKPackageOptions = {}): RulePackage {
  const packageManifest = options.manifest ?? manifest;
  const profiles = options.profiles ?? DK_PROFILES;
  const rhythmCatalog = options.rhythmCatalog ?? DK_RHYTHM_CATALOG;
  const settings = Object.freeze(structuredClone(options.settings ?? {}));
  function profileFor(workspace: Workspace, teamId: string) {
    const binding = workspace.teams.find((item) => item.id === teamId)?.rulesetBinding;
    const profile = profiles.find((item) => item.ageGroup === binding?.ageGroup && item.teamType === binding.teamType);
    if (!profile || binding?.rulesetId !== packageManifest.rulesetId || binding.packageVersion !== packageManifest.packageVersion) throw new Error('Vælg holdets præcise installerede pakke og profil.');
    return profile;
  }
  function scaled(decision: NumericDecision): NumericDecision {
    if (!settings.difficultyMultiplier) return decision;
    const factor = settings.difficultyMultiplier;
    return decision.value !== null ? known(decision.value.multiply(factor)) : uncertain(decision.status === 'known' ? 'incomplete' : decision.status,
      decision.issues, decision.knownSubtotal.multiply(factor), Object.fromEntries(Object.entries(decision.alternatives).map(([key, value]) => [key, value.multiply(factor)])));
  }
  const evaluateSkill = (skill: Exclude<SkillDefinition, { discipline: 'rhythm' }>, registration?: AthleteSkill): SpringSkillEvaluation => {
    const evaluation = evaluateSpringSkill(skill, registration?.connectionConfirmation);
    return { ...evaluation, difficulty: scaled(evaluation.difficulty) };
  };
  const analyze = (workspace: Workspace, teamId: string, discipline: SpringDiscipline, scenarioId: string) => evaluateDiscipline(workspace, teamId, discipline, scenarioId, profileFor(workspace, teamId), settings);
  function bonuses(profile: TeamProfile, discipline: SpringDiscipline): BonusDefinition[] {
    const maximum = Fraction.from(settings.bonusRate ?? '0.10').multiply(profile.counting);
    return discipline === 'tumbling' ? [
      { id: 'B-SKRUE', label: 'Skruetillæg', maximum, weight: (candidate) => Number(candidate.evaluation.hasBaneTwist), unresolvedIssue: null },
      { id: 'B-DOBBELT', label: 'Dobbelttillæg', maximum, weight: (candidate) => Number(candidate.evaluation.hasDouble), unresolvedIssue: null },
      { id: 'B-ELEMENT', label: 'Elementtillæg — kræver afklaring', maximum: null, weight: (candidate) => candidate.evaluation.distinctElementCount, unresolvedIssue: 'Q01' },
    ] : [
      { id: 'T-SKRUE', label: 'Skruetillæg', maximum, unresolvedIssue: null, weight: (candidate) => {
        if (candidate.definition.discipline !== 'trampet') return 0;
        const element = normalizeElement(candidate.definition.jump);
        const turns = typeof element.variant.twistAfterHandsHalfTurns === 'number' ? element.variant.twistAfterHandsHalfTurns : element.twistsHalfTurns;
        return Number(trampetTwistQualifies(profile.ageGroup, element.rotationQuarterTurns / 4, turns, element.family));
      } },
      { id: 'T-DOBBELT-FRI', label: 'Dobbelttillæg uden redskab', maximum, unresolvedIssue: null, weight: (candidate) => Number(candidate.evaluation.rotationCategory === 2 && candidate.evaluation.apparatus === 'free') },
      { id: 'T-DOBBELT-REDSKAB', label: 'Dobbelttillæg med redskab', maximum, unresolvedIssue: null, weight: (candidate) => Number(candidate.evaluation.rotationCategory === 2 && candidate.evaluation.apparatus === 'vault') },
    ];
  }
  return {
    manifest: packageManifest, profiles, springCatalog: DK_SPRING_CATALOG, rhythmCatalog, knownIssues: DK_KNOWN_ISSUES,
    evaluateSkill, analyze, bindRhythm: (skill) => bindRhythmSkill(skill, rhythmCatalog),
    rhythm: (workspace, teamId, threshold = null) => { profileFor(workspace, teamId); return rhythmCommonality(workspace, teamId, rhythmCatalog, threshold); },
    potentials: (workspace, teamId, discipline, scenarioId, searchOptions = {}) => {
      const profile = profileFor(workspace, teamId);
      return searchBonusPotentials(workspace, teamId, discipline, scenarioId, {
        profile, bonuses: bonuses(profile, discipline), analyze: (candidate) => analyze(candidate, teamId, discipline, scenarioId),
        evaluate: (candidate, registration) => {
          const skill = candidate.skills.find((item) => item.id === registration.skillId);
          return skill && skill.discipline === discipline ? evaluateSkill(skill, registration) : null;
        },
      }, searchOptions);
    },
  };
}

export const DK_V1 = createDKFamilyPackage();
