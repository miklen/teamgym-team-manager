/** Google-adgang, browserlager og netværk tilføjes gennem separate grænser. */
export type BrowserFetch = typeof globalThis.fetch;

export interface DriveBasis {
  fileId: string;
  etag: string;
  /** Opaque streng; må ikke konverteres til et JavaScript-tal. */
  version: string;
  contentHash: string;
  workspaceRevision: number;
}

export * from './errors';
export * from './storage';
export * from './client';
export * from './auth';
export * from './workspace-session';
