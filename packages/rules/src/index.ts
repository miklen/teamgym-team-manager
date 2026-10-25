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

export * from './registry';
export * from './catalog';
export * from './dk-data';
export * from './dk-v1';
export * from './dk-engine';
export type { NumericDecision } from './dk-numeric';
export type { SpringSkillEvaluation } from './dk-spring';
export * from './potential';
export * from './rhythm';
export * from './version-change';
export * from './traceability';
