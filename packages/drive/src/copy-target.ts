import { validateWorkspace, workspacePayload } from '@teamgym/domain';
import type { Workspace } from '@teamgym/domain';
import { sha256 } from './client';
import type { LoadedWorkspace, WorkspaceClient } from './client';
import { DriveError } from './errors';

/** Erstatning sker kun mod den version, brugeren har set. Et tabt svar afstemmes ved genlæsning. */
export async function overwriteDriveTarget(
  client: WorkspaceClient,
  target: LoadedWorkspace,
  source: Workspace,
  now = () => new Date().toISOString(),
  id: () => string = () => crypto.randomUUID(),
): Promise<LoadedWorkspace> {
  validateWorkspace(source);
  if (!target.metadata.writable) throw new DriveError('permission', 'Den valgte Drive-fil kan ikke redigeres.');
  const before = await client.read(target.basis.fileId);
  if (!before.metadata.writable) throw new DriveError('permission', 'Skriveadgangen til målfilen er fjernet.');
  if (before.basis.etag !== target.basis.etag || before.basis.version !== target.basis.version)
    throw new DriveError('conflict', 'Målfilen er ændret siden advarslen. Vælg og gennemgå den igen.');
  const payload = workspacePayload(source);
  const payloadHash = await sha256(payload);
  const revision = target.workspace.revision + 1;
  const savedAt = now();
  const operationId = id();
  const history = target.workspace.workspaceId === source.workspaceId ? target.workspace.recentOperations : [];
  const snapshot = validateWorkspace({
    ...source,
    revision,
    updatedAt: savedAt,
    recentOperations: [...history, { id: operationId, payloadHash, revision, savedAt }].slice(-30),
  });
  try { await client.upload(target.basis, snapshot); }
  catch (error) {
    if (error instanceof DriveError && ['conflict', 'permission', 'auth', 'format'].includes(error.code)) throw error;
    // En afsendt upload kan være gennemført, selv om svaret mangler.
  }
  const current = await client.read(target.basis.fileId);
  const recognized = current.workspace.recentOperations.some((item) => item.id === operationId && item.payloadHash === payloadHash && item.revision === revision);
  if (!recognized)
    throw new DriveError('conflict', 'Erstatningens udfald kunne ikke bekræftes. Kilden er bevaret. Kontrollér målfilen før et nyt forsøg.');
  if (workspacePayload(current.workspace) !== payload)
    throw new DriveError('conflict', 'Erstatningen blev gennemført, men målfilen har siden fået nyere ændringer. Kilden er bevaret.');
  return current;
}
