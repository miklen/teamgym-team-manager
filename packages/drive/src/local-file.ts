import type { Workspace } from '@teamgym/domain';
import { DriveError } from './errors';
import { parseLocalWorkspace, serializeLocalWorkspace } from './local-workspace';
import type { LocalOrigin, LocalWorkspaceFile } from './local-workspace';

export interface LocalHandle {
  readonly name: string;
  getFile(): Promise<File>;
  queryPermission?(options: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
  requestPermission?(options: { mode: 'read' | 'readwrite' }): Promise<PermissionState>;
  createWritable(options?: { mode?: 'exclusive' }): Promise<{
    write(data: string): Promise<void>;
    close(): Promise<void>;
    abort?(): Promise<void>;
  }>;
}

export interface OpenLocalFile extends LocalWorkspaceFile {
  name: string;
  handle: LocalHandle | null;
  basisBytes: string;
}

function localError(error: unknown): DriveError {
  if (error instanceof DriveError) return error;
  if (error instanceof DOMException) {
    if (error.name === 'AbortError') return new DriveError('cancelled', 'Filvalget blev annulleret. Kladden er bevaret.');
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError')
      return new DriveError('permission', 'Browseren gav ikke adgang til filen. Kladden er bevaret.');
    if (error.name === 'NotFoundError') return new DriveError('missing', 'Den lokale fil blev ikke fundet. Kladden er bevaret.');
  }
  return new DriveError('network', 'Den lokale fil kunne ikke læses eller skrives. Kladden er bevaret.');
}

export async function readLocalFile(file: File, handle: LocalHandle | null = null): Promise<OpenLocalFile> {
  try {
    const basisBytes = await file.text();
    return { ...parseLocalWorkspace(basisBytes), name: file.name, handle, basisBytes };
  } catch (error) { throw localError(error); }
}

export async function openLocalHandle(handle: LocalHandle): Promise<OpenLocalFile> {
  try {
    const options = { mode: 'read' as const };
    let permission = await handle.queryPermission?.(options);
    if (permission !== 'granted') permission = await handle.requestPermission?.(options);
    if (permission !== undefined && permission !== 'granted')
      throw new DriveError('permission', 'Adgang til den lokale fil blev ikke givet. Kladden er bevaret.');
    return await readLocalFile(await handle.getFile(), handle);
  }
  catch (error) { throw localError(error); }
}

async function writePermission(handle: LocalHandle) {
  const options = { mode: 'readwrite' as const };
  let permission = await handle.queryPermission?.(options);
  if (permission !== 'granted') permission = await handle.requestPermission?.(options);
  if (permission !== undefined && permission !== 'granted')
    throw new DriveError('permission', 'Skriveadgang til den lokale fil blev ikke givet. Kladden er bevaret.');
}

/** Forventer præcis de bytes, som blev åbnet eller sidst efterlæst. */
export async function saveLocalHandle(
  handle: LocalHandle,
  expectedBytes: string,
  workspace: Workspace,
  origin: LocalOrigin | null,
): Promise<OpenLocalFile> {
  const bytes = serializeLocalWorkspace(workspace, origin);
  try {
    await writePermission(handle);
    const before = await handle.getFile();
    if (await before.text() !== expectedBytes)
      throw new DriveError('conflict', 'Filen er ændret uden for appen. Gem kladden som en anden fil, eller åbn den nyeste version.');
    let stream: Awaited<ReturnType<LocalHandle['createWritable']>>;
    try { stream = await handle.createWritable({ mode: 'exclusive' }); }
    catch (error) {
      if (!(error instanceof TypeError)) throw error;
      stream = await handle.createWritable();
    }
    try { await stream.write(bytes); await stream.close(); }
    catch (error) { await stream.abort?.().catch(() => {}); throw error; }
    const result = await openLocalHandle(handle);
    if (result.basisBytes !== bytes)
      throw new DriveError('conflict', 'Filen kunne ikke bekræftes efter gemning. Kladden er bevaret.');
    return result;
  } catch (error) { throw localError(error); }
}

/** Ny fil må ikke stiltiende erstatte indhold fra et filvalg. */
export async function saveNewLocalHandle(handle: LocalHandle, workspace: Workspace, origin: LocalOrigin | null) {
  let existing: File;
  try { existing = await handle.getFile(); }
  catch (error) { throw localError(error); }
  if (existing.size > 0)
    throw new DriveError('conflict', 'Den valgte fil har allerede indhold. Vælg et nyt filnavn, så kladden ikke overskriver den.');
  return saveLocalHandle(handle, '', workspace, origin);
}
