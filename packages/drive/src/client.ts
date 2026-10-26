import { migrateWorkspaceV1, parseWorkspace, serializeWorkspace, validateWorkspace } from '@teamgym/domain';
import type { Workspace } from '@teamgym/domain';
import type { BrowserFetch, DriveBasis } from './index';
import type { AccountReference, FileReference } from './storage';
import { DriveError, responseError } from './errors';

const api = 'https://www.googleapis.com/drive/v2';
const uploadApi = 'https://www.googleapis.com/upload/drive/v2/files';
const fields =
  'id,title,mimeType,etag,version,editable,labels(trashed),parents(id),capabilities(canAddChildren),resourceKey';
export interface FileMetadata extends FileReference {
  etag: string;
  version: string;
  writable: boolean;
  mimeType: string;
  canAddChildren: boolean;
}
export interface LoadedWorkspace {
  originalBytes?: string;
  basis: DriveBasis;
  metadata: FileMetadata;
  workspace: Workspace;
}
export interface WorkspaceClient {
  read(fileId: string): Promise<LoadedWorkspace>;
  upload(basis: DriveBasis, workspace: Workspace): Promise<void>;
}
export async function sha256(bytes: string): Promise<string> {
  const result = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(bytes));
  return Array.from(new Uint8Array(result), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
function validId(id: string) {
  if (!/^[\w-]+$/.test(id)) throw new DriveError('format', 'Ugyldig Google-filreference.');
  return encodeURIComponent(id);
}

export class DriveClient implements WorkspaceClient {
  constructor(
    private readonly token: () => string,
    private readonly fetcher: BrowserFetch = globalThis.fetch.bind(globalThis),
    private readonly unauthorized: () => void = () => {},
    private readonly context: () => number = () => 0,
    private readonly resourceKeys = new Map<string, string>(),
  ) {}
  rememberResourceKey(fileId: string, key: string) {
    validId(fileId);
    if (!/^[\w-]{1,256}$/.test(key)) throw new DriveError('format', 'Linkets adgangsnøgle er ugyldig.');
    this.resourceKeys.set(fileId, key);
  }
  private resourceHeaders(fileId: string): Record<string, string> {
    const key = this.resourceKeys.get(fileId);
    return key ? { 'X-Goog-Drive-Resource-Keys': `${fileId}/${key}` } : {};
  }
  private checkContext(generation: number) {
    if (generation !== this.context())
      throw new DriveError(
        'cancelled',
        'Forbindelsen er ændret. En allerede afsendt upload kan være gennemført; kontrollér resultatet efter genforbindelse.',
      );
  }
  private async request(url: string, init: RequestInit = {}, generation = this.context()) {
    this.checkContext(generation);
    const token = this.token(); // Kontrolleres umiddelbart før hvert netværkskald, også efter afbrydelse i anden fane.
    let response: Response;
    try {
      response = await this.fetcher(url, {
        ...init,
        headers: { ...init.headers, Authorization: `Bearer ${token}` },
        credentials: 'omit',
        cache: 'no-store',
      });
    } catch {
      throw new DriveError(
        'network',
        'Forbindelsen blev afbrudt. Et uploadsvar kan være mistet; kontrollér resultatet før genforsøg.',
      );
    }
    this.checkContext(generation);
    if (!response.ok) {
      if (response.status === 401) this.unauthorized();
      throw responseError(response.status);
    }
    return response;
  }
  async account(): Promise<AccountReference> {
    const response = await this.request(`${api}/about?fields=user(permissionId,emailAddress,displayName)`);
    const { user } = (await response.json()) as {
      user?: { permissionId?: unknown; emailAddress?: unknown; displayName?: unknown };
    };
    if (
      typeof user?.permissionId !== 'string' ||
      typeof user.emailAddress !== 'string' ||
      typeof user.displayName !== 'string'
    )
      throw new DriveError('format', 'Google returnerede ingen verificerbar konto.');
    return { permissionId: user.permissionId, email: user.emailAddress, name: user.displayName };
  }
  async metadata(fileId: string, generation = this.context()): Promise<FileMetadata> {
    const response = await this.request(
      `${api}/files/${validId(fileId)}?supportsAllDrives=true&fields=${encodeURIComponent(fields)}`,
      { headers: this.resourceHeaders(fileId) },
      generation,
    );
    const raw = (await response.json()) as {
      id?: unknown;
      title?: unknown;
      mimeType?: unknown;
      etag?: unknown;
      version?: unknown;
      editable?: unknown;
      labels?: { trashed?: unknown };
      parents?: { id?: unknown }[];
      capabilities?: { canAddChildren?: unknown };
      resourceKey?: unknown;
    };
    if (raw.labels?.trashed === true) throw new DriveError('missing', 'Filen er flyttet til papirkurven.');
    if (
      raw.id !== fileId ||
      typeof raw.title !== 'string' ||
      typeof raw.mimeType !== 'string' ||
      typeof raw.etag !== 'string' ||
      !raw.etag ||
      typeof raw.version !== 'string' ||
      !raw.version ||
      typeof raw.editable !== 'boolean' ||
      raw.labels?.trashed !== false
    )
      throw new DriveError('format', 'Google returnerede ufuldstændige filoplysninger.');
    if (typeof raw.resourceKey === 'string') this.rememberResourceKey(fileId, raw.resourceKey);
    const resourceKey = this.resourceKeys.get(fileId);
    return {
      id: fileId,
      name: raw.title,
      folderIds: (raw.parents ?? []).flatMap((item) => (typeof item.id === 'string' ? [item.id] : [])),
      mimeType: raw.mimeType,
      etag: raw.etag,
      version: raw.version,
      writable: raw.editable,
      canAddChildren: raw.capabilities?.canAddChildren === true,
      ...(resourceKey ? { resourceKey } : {}),
    };
  }
  async read(fileId: string): Promise<LoadedWorkspace> {
    const generation = this.context();
    for (let attempt = 0; attempt < 3; attempt++) {
      const before = await this.metadata(fileId, generation);
      if (before.mimeType !== 'application/json')
        throw new DriveError('format', 'Vælg arbejdsrummets JSON-datafil.');
      const response = await this.request(
        `${api}/files/${validId(fileId)}?alt=media&supportsAllDrives=true`,
        { headers: this.resourceHeaders(fileId) },
        generation,
      );
      const bytes = await response.text();
      const after = await this.metadata(fileId, generation);
      if (before.etag !== after.etag || before.version !== after.version) continue;
      let raw: unknown;
      try { raw = JSON.parse(bytes); } catch { throw new DriveError('format', 'Filen indeholder ugyldig JSON. Originalen ændres ikke.'); }
      const migration = !!raw && typeof raw === 'object' && 'schemaVersion' in raw && raw.schemaVersion === 1;
      const workspace = migration ? migrateWorkspaceV1(raw) : parseWorkspace(bytes);
      const contentHash = await sha256(bytes);
      this.checkContext(generation);
      return {
        workspace,
        ...(migration ? { originalBytes: bytes } : {}),
        metadata: after,
        basis: {
          fileId,
          etag: after.etag,
          version: after.version,
          contentHash,
          workspaceRevision: workspace.revision,
        },
      };
    }
    throw new DriveError('unstable', 'Filen ændredes under indlæsning. Prøv igen; kladden er bevaret.');
  }
  async upload(basis: DriveBasis, workspace: Workspace) {
    const generation = this.context();
    validateWorkspace(workspace);
    if (!basis.etag || workspace.revision !== basis.workspaceRevision + 1)
      throw new DriveError('format', 'Gemningen mangler en gyldig basisrevision.');
    const current = await this.metadata(basis.fileId, generation);
    if (!current.writable)
      throw new DriveError('permission', 'Du har læseadgang. Kladden kan eksporteres, men ikke gemmes her.');
    if (current.etag !== basis.etag || current.version !== basis.version)
      throw new DriveError('conflict', 'Filen er ændret af en anden session. Kladden er bevaret.');
    // Forkontrollen er ingen lås: basis-etag bevares i selve den betingede media-upload.
    await this.request(
      `${uploadApi}/${validId(basis.fileId)}?uploadType=media&supportsAllDrives=true`,
      {
        method: 'PUT',
        headers: {
          ...this.resourceHeaders(basis.fileId),
          'Content-Type': 'application/json; charset=UTF-8',
          'If-Match': basis.etag,
        },
        body: serializeWorkspace(workspace),
      },
      generation,
    );
  }
  async create(folderId: string, name: string, workspace: Workspace): Promise<LoadedWorkspace> {
    const generation = this.context();
    validateWorkspace(workspace);
    const folder = await this.metadata(folderId, generation);
    if (folder.mimeType !== 'application/vnd.google-apps.folder' || !folder.canAddChildren)
      throw new DriveError('permission', 'Vælg en mappe, hvor denne konto må oprette filer.');
    const title = name.trim();
    if (!title || title.length > 160)
      throw new DriveError('format', 'Giv arbejdsrummet et navn på højst 160 tegn.');
    const boundary = `teamgym_${crypto.randomUUID()}`;
    const body = [
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ title: title.endsWith('.json') ? title : `${title}.json`, mimeType: 'application/json', parents: [{ id: folderId }] })}`,
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n${serializeWorkspace(workspace)}`,
      `--${boundary}--`,
    ].join('\r\n');
    const response = await this.request(
      `${uploadApi}?uploadType=multipart&supportsAllDrives=true&fields=id`,
      {
        method: 'POST',
        headers: {
          ...this.resourceHeaders(folderId),
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
      },
      generation,
    );
    const result = (await response.json()) as { id?: unknown };
    if (typeof result.id !== 'string')
      throw new DriveError(
        'format',
        'Filoprettelsen returnerede intet fil-id. Vælg filen gennem Google før et nyt forsøg.',
      );
    this.checkContext(generation);
    return this.read(result.id);
  }
}
