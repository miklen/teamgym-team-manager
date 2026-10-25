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
