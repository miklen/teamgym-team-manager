import type { SourceReference } from '@teamgym/domain';

/** Reglementsudgave og appens fortolkningsversion er forskellige identiteter. */
export interface RulesetBinding {
  rulesetId: string;
  packageVersion: string;
  ageGroup: string;
  teamType: string;
}

export interface RulesetManifest {
  rulesetId: string;
  packageVersion: string;
  officialEdition: string;
  algorithmVersions: Readonly<Record<string, string>>;
  sources: readonly SourceReference[];
}
