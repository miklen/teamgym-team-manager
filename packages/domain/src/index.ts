/** Stabile identiteter er uafhængige af navn og officielle reglementskoder. */
export type EntityId = string;

export type EvaluationStatus = 'known' | 'incomplete' | 'invalid' | 'unresolved';

export interface SourceReference {
  sourceId: string;
  section: string;
  page?: number;
}

export interface Diagnostic {
  code: string;
  status: Exclude<EvaluationStatus, 'known'>;
  message: string;
  affectedIds: readonly EntityId[];
  sources: readonly SourceReference[];
}

export * from './schema';
export * from './identity';
export * from './workspace';
export * from './stability';
export * from './spotting';
export * from './commands';
export * from './fraction';
export * from './inheritance';
export * from './merge-policy';
export * from './workspace-merge';
