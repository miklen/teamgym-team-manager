import type { SourceReference } from '@teamgym/domain';
export type { RulesetBinding } from '@teamgym/domain';

/** Reglementsudgave og appens fortolkningsversion er forskellige identiteter. */
export interface RulesetManifest {
  rulesetId: string;
  packageVersion: string;
  officialEdition: string;
  algorithmVersions: Readonly<Record<string, string>>;
  sources: readonly SourceReference[];
}
