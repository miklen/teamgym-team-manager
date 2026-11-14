import { migrateWorkspace, parseWorkspace, serializeWorkspace, validateWorkspace } from '@teamgym/domain';
import type { Workspace } from '@teamgym/domain';
import { DriveError } from './errors';

export interface LocalOrigin {
  fileId: string;
  base: Workspace;
}

export interface LocalWorkspaceFile {
  workspace: Workspace;
  origin: LocalOrigin | null;
  originalBytes?: string;
  sourceSchemaVersion?: 1 | 2 | 3 | 4 | 5 | 6;
}

const localFormat = 'teamgym-local-copy';
const localVersion = 1;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parsePayload(value: unknown, bytes: string): LocalWorkspaceFile {
  const version = isRecord(value) ? value.schemaVersion : undefined;
  if (version === 1 || version === 2 || version === 3 || version === 4 || version === 5 || version === 6) {
    return { workspace: migrateWorkspace(value), origin: null, originalBytes: bytes, sourceSchemaVersion: version };
  }
  return { workspace: parseWorkspace(bytes), origin: null };
}

/** Lokal kopi er transportmetadata; Drive modtager altid kun serialiseret Workspace. */
export function parseLocalWorkspace(bytes: string): LocalWorkspaceFile {
  let value: unknown;
  try { value = JSON.parse(bytes); }
  catch { throw new DriveError('format', 'Filen indeholder ugyldig JSON. Originalen ændres ikke.'); }
  if (!isRecord(value) || value.format !== localFormat) return parsePayload(value, bytes);
  if (value.version !== localVersion || !isRecord(value.origin) || !isRecord(value.workspace))
    throw new DriveError('format', 'Den lokale kopi har et ukendt eller ufuldstændigt format. Originalen ændres ikke.');
  const { origin } = value;
  if (typeof origin.fileId !== 'string' || !/^[\w-]+$/.test(origin.fileId))
    throw new DriveError('format', 'Den lokale kopis Drive-reference er ugyldig.');
  const workspace = validateWorkspace(value.workspace);
  const base = validateWorkspace(origin.base);
  if (workspace.workspaceId !== base.workspaceId)
    throw new DriveError('format', 'Den lokale kopis kildebasis tilhører et andet arbejdsrum.');
  return { workspace, origin: { fileId: origin.fileId, base } };
}

export function serializeLocalWorkspace(workspace: Workspace, origin: LocalOrigin | null = null): string {
  const valid = validateWorkspace(workspace);
  if (!origin) return serializeWorkspace(valid);
  if (!/^[\w-]+$/.test(origin.fileId)) throw new DriveError('format', 'Ugyldig Drive-reference.');
  const base = validateWorkspace(origin.base);
  if (valid.workspaceId !== base.workspaceId)
    throw new DriveError('format', 'Kildebasis tilhører et andet arbejdsrum.');
  return JSON.stringify({ format: localFormat, version: localVersion, workspace: valid, origin: { fileId: origin.fileId, base } });
}
