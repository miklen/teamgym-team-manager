import { Fraction } from '@teamgym/domain';
import type { AthleteSkill, SkillDefinition, SpringDiscipline, Workspace } from '@teamgym/domain';
import { DK_RHYTHM_CATALOG, DK_RHYTHM_CATALOG_V2, DK_SPRING_CATALOG, DK_SPRING_CATALOG_V2 } from './catalog';
import type { RhythmCatalogEntry, SpringCatalogEntry } from './catalog';
import { DK_KNOWN_ISSUES, DK_PROFILES, DK_SOURCE_MANIFEST, DK_SPOT_RATES } from './dk-data';
import type { KnownIssue, SpotRates, TeamProfile } from './dk-data';
import { evaluateDiscipline } from './dk-engine';
import type { EngineSettings } from './dk-engine';
import { compositionGuide, compositionGuideOverview } from './dk-guide';
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

export interface DKPackageOptions { manifest?: PackageManifest; profiles?: readonly TeamProfile[]; springCatalog?: readonly SpringCatalogEntry[]; rhythmCatalog?: readonly RhythmCatalogEntry[]; knownIssues?: readonly KnownIssue[]; settings?: EngineSettings; spotRates?: SpotRates | null }

/** Afgrænset factory til DK-algoritmefamilien og tydelige kontrakttestpakker. */
export function createDKFamilyPackage(options: DKPackageOptions = {}): RulePackage {
  const packageManifest = options.manifest ?? manifest;
  const profiles = options.profiles ?? DK_PROFILES;
  const springCatalog = options.springCatalog ?? DK_SPRING_CATALOG;
  const rhythmCatalog = options.rhythmCatalog ?? DK_RHYTHM_CATALOG;
  const spotRates = options.spotRates === undefined ? DK_SPOT_RATES : options.spotRates;
  const settings: EngineSettings = Object.freeze({ ...structuredClone(options.settings ?? {}), spotRates });
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
    const evaluation = evaluateSpringSkill(skill, registration?.connectionConfirmation, settings.ruleCorrections, settings.vaultPikeHalfTwistResolved);
    return { ...evaluation, difficulty: scaled(evaluation.difficulty) };
  };
  const analyze = (workspace: Workspace, teamId: string, discipline: SpringDiscipline, scenarioId: string) => evaluateDiscipline(workspace, teamId, discipline, scenarioId, profileFor(workspace, teamId), settings);
  function bonuses(profile: TeamProfile, discipline: SpringDiscipline): BonusDefinition[] {
    const maximum = Fraction.from(settings.bonusRate ?? '0.10').multiply(profile.counting);
    return discipline === 'tumbling' ? [
      { id: 'B-SKRUE', label: 'Skruetillæg', maximum, weight: (candidate) => Number(candidate.evaluation.hasBaneTwist), unresolvedIssue: null },
      { id: 'B-DOBBELT', label: 'Dobbelttillæg', maximum, weight: (candidate) => Number(candidate.evaluation.hasDouble), unresolvedIssue: null },
      { id: 'B-ELEMENT', label: settings.elementBonusResolved ? 'Elementtillæg' : 'Elementtillæg — kræver afklaring', maximum: null,
        weight: (candidate) => settings.elementBonusResolved ? Math.max(0, candidate.evaluation.distinctElementCount - 1) : candidate.evaluation.distinctElementCount,
        unresolvedIssue: settings.elementBonusResolved ? null : 'Q01' },
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
    manifest: packageManifest, profiles, springCatalog, rhythmCatalog, knownIssues: options.knownIssues ?? DK_KNOWN_ISSUES, spotRates,
    evaluateSkill, analyze, guide: (analysis, profile, potentials) => compositionGuide(analysis, profile, springCatalog, settings.bonusRate ?? '0.10', Boolean(settings.elementBonusResolved), potentials),
    guideOverview: compositionGuideOverview,
    bindRhythm: (skill) => bindRhythmSkill(skill, rhythmCatalog),
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

export const DK_V2 = createDKFamilyPackage({
  manifest: {
    ...structuredClone(manifest), packageVersion: '1.1.0',
    algorithms: { identity: 'dk-identity-2', difficulty: 'dk-d-2', composition: 'dk-c-6', rhythm: 'dk-rhythm-2', potential: 'witness-2' },
    changeDescription: 'Korrigerer forbindelsesgyldighed, identitet, rytmens skridtkrav og sissones startfront. Afklarer banens elementtillæg, gentagelsesfradrag og rækkefølgefradrag. Overslag-salto hoftebøjet 180° følger reglementets formel (1,10) frem for A4-tabellen. En trampetomgang er hel med eller hel uden Pegasus; øvrige åbne regelfortolkninger vises ved berørte resultater.',
  },
  springCatalog: DK_SPRING_CATALOG_V2,
  rhythmCatalog: DK_RHYTHM_CATALOG_V2,
  knownIssues: [
    ...DK_KNOWN_ISSUES.filter((issue) => issue.id !== 'Q01' && issue.id !== 'Q03' && issue.id !== 'Q02' && issue.id !== 'Q04' && issue.id !== 'Q06'),
    { id: 'H-U06', title: 'Afrunding af dommernes tal', detail: 'Planlagt D og C beregnes eksakt og rundes direkte ned til nærmeste 0,005. Det er uafklaret, om dommernes værdier først skal behandles til to decimaler.', scope: 'rule', sources: [{ sourceId: 'H', section: '4.4.a', page: 11 }, { sourceId: 'H', section: '4.6', page: 13 }] },
    { id: 'A71-U01', title: 'Licens ved visse dobbeltspring', detail: 'Nogle dobbeltspring kræver licens og særskilt godkendelse. Appen kontrollerer ikke licens, og den gældende ordning for 2026/27 er ikke bekræftet. Bilag A7.1 indgår endnu ikke i pakkens fastlåste kilder.', scope: 'rule', sources: [] },
    { id: 'A1DK-U06', title: 'Gumbis startvalg', detail: 'Den nyere tabel og et ældre spørgsmål og svar beskriver startvalgene forskelligt. Appen tillader knælende start, men den fortolkning er endnu ikke bekræftet.', scope: 'catalog', sources: [{ sourceId: 'A1.1', section: 'A807 Gumbi', page: 11 }, { sourceId: 'QA', section: 'Gumbi (A807)', page: 3 }] },
    { id: 'A1DK-U03', title: 'J822 og spagatrækken', detail: 'J822 står trykt i spagatrækken med en anderledes kode. Appen bevarer den trykte kode og afgør ikke, om momentet kan vælges sammen med J211 og J611.', scope: 'catalog', sources: [{ sourceId: 'A1.1', section: 'J822', page: 8 }] },
    { id: 'A1DK-U02', title: 'To trykte G802', detail: 'Kast uden rotation (0,60) og kast med rotation (0,80) har begge trykt kode G802. Appen tilbyder ikke gruppeelementer og giver ingen automatisk værdi ud fra koden.', scope: 'catalog', sources: [{ sourceId: 'A1.1', section: 'G802', page: 12 }] },
    { id: 'A1DK-U05', title: 'Balancer fra forskellige rækker', detail: 'Balancer skal vælges fra forskellige rækker, men rækkenumre går igen på tværs af HB, SB og DB. Det er uafklaret, om eksempelvis HB201 og SB201 må vælges sammen. Appen sammensætter ikke rytmeprogrammer og afgør ikke rækkeidentiteten.', scope: 'catalog', sources: [{ sourceId: 'H', section: '8.3.7.1', page: 23 }, { sourceId: 'A1.1', section: 'HB201', page: 2 }, { sourceId: 'A1.1', section: 'SB201', page: 5 }] },
    { id: 'A1DK-U04', title: 'Vandret balance og vinkeltolerance', detail: 'Den generelle tekst nævner 15° for overkroppen og 30° for kroppen. Nogle balancekrav blander ordene; appen måler ikke vinklen eller afgør grænsetilfælde.', scope: 'catalog', sources: [{ sourceId: 'A1.1', section: 'Generelle krav og balancefelter', page: 1 }] },
    { id: 'A3-U01', title: 'Startsaltoens identitet', detail: 'Appen regner en startsalto og en tilsvarende almindelig salto som samme element. En officiel afklaring mangler.', scope: 'catalog', sources: [{ sourceId: 'A3', section: 'Startsalto', page: 1 }] },
    { id: 'C-RETNING-VALG', title: 'Blandet omgang i begge retningskrav', detail: 'Når samme blandede omgang er nærmest begge retningskrav, bruger appen den i begge optællinger. Det er uafklaret, om to forskellige omgange kræves.', scope: 'rule', sources: [{ sourceId: 'H', section: '9.2.2.4', page: 30 }] },
  ],
  settings: { ruleCorrections: true, elementBonusResolved: true, repetitionResolved: true, orderResolved: true, apparatusRoundsResolved: true, vaultPikeHalfTwistResolved: true },
});
