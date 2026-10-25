/**
 * T01-kandidat, kun til syntetiske testfiler. Ikke en verificeret produktionsadapter.
 * Google-fejltekst, tokens, indhold og fil-id'er returneres aldrig som testlog.
 */
import type { BrowserFetch } from '@teamgym/drive';

const api = 'https://www.googleapis.com/drive/v2/files';
const uploadApi = 'https://www.googleapis.com/upload/drive/v2/files';
const metadataFields = 'id,title,mimeType,etag,version,editable,labels(trashed)';

export interface ProbeDocument {
  kind: 'teamgym-t01';
  schemaVersion: 1;
  operationId: string;
  label: 'initial' | 'A' | 'B';
}

export interface ProbeBasis {
  fileId: string;
  etag: string;
  version: string;
  bytes: string;
  sha256: string;
}

interface ProbeMetadata {
  id: string;
  title: string;
  mimeType: string;
  etag: string;
  version: string;
  editable: boolean;
  labels: { trashed: boolean };
}

export class ProbeError extends Error {
  constructor(public readonly code: string, public readonly status?: number) {
    super(status ? `${code} (HTTP ${status})` : code);
  }
}

export function probeDocument(label: ProbeDocument['label']): ProbeDocument {
  return { kind: 'teamgym-t01', schemaVersion: 1, operationId: crypto.randomUUID(), label };
}

export function validateProbeDocument(value: unknown): asserts value is ProbeDocument {
  if (!value || typeof value !== 'object') throw new ProbeError('Ikke en T01-testfil');
  const document = value as Partial<ProbeDocument>;
  if (document.kind !== 'teamgym-t01' || document.schemaVersion !== 1 ||
    typeof document.operationId !== 'string' || !['initial', 'A', 'B'].includes(document.label ?? '') ||
    Object.keys(value).sort().join(',') !== 'kind,label,operationId,schemaVersion') {
    throw new ProbeError('Ikke en T01-testfil');
  }
}

async function hash(bytes: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(bytes));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function createProbeClient(token: string, fetcher: BrowserFetch = globalThis.fetch.bind(globalThis), signal?: AbortSignal) {
  if (!token.trim()) throw new ProbeError('Google-adgang mangler');
  const headers = { Authorization: `Bearer ${token}` };

  async function request(url: string, init: RequestInit = {}) {
    if (signal?.aborted) throw new ProbeError('Testforbindelsen er afbrudt');
    try {
      return await fetcher(url, { ...init, ...(signal ? { signal } : {}), cache: 'no-store', credentials: 'omit' });
    } catch {
      throw new ProbeError('Netværk/CORS eller ukendt uploadudfald; ingen automatisk gentagelse');
    }
  }

  async function metadata(fileId: string): Promise<ProbeMetadata> {
    const response = await request(`${api}/${encodeURIComponent(fileId)}?fields=${encodeURIComponent(metadataFields)}`, { headers });
    if (!response.ok) throw new ProbeError('Metadata kunne ikke læses', response.status);
    const data = await response.json() as Partial<ProbeMetadata>;
    if (data.id !== fileId || !data.title?.startsWith('teamgym-t01-') || data.mimeType !== 'application/json' ||
      typeof data.etag !== 'string' || !data.etag || typeof data.version !== 'string' || !data.version ||
      data.editable !== true || data.labels?.trashed !== false) {
      throw new ProbeError('Filen er ikke en skrivbar T01-JSON-testfil med etag/version');
    }
    return data as ProbeMetadata;
  }

  async function read(fileId: string): Promise<ProbeBasis> {
    if (!/^[\w-]+$/.test(fileId)) throw new ProbeError('Ugyldigt fil-id');
    for (let attempt = 0; attempt < 3; attempt++) {
      const before = await metadata(fileId);
      const response = await request(`${api}/${encodeURIComponent(fileId)}?alt=media`, { headers });
      if (!response.ok) throw new ProbeError('Testindhold kunne ikke læses', response.status);
      const bytes = await response.text();
      const after = await metadata(fileId);
      if (before.etag !== after.etag || before.version !== after.version) continue;
      let document: unknown;
      try { document = JSON.parse(bytes); } catch { throw new ProbeError('Testfilen har ugyldig JSON'); }
      validateProbeDocument(document);
      return { fileId, etag: before.etag, version: before.version, bytes, sha256: await hash(bytes) };
    }
    throw new ProbeError('Filen ændredes under alle tre læseforsøg');
  }

  async function create(folderId: string): Promise<string> {
    if (!/^[\w-]+$/.test(folderId)) throw new ProbeError('Vælg en testmappe først');
    const boundary = `teamgym_${crypto.randomUUID()}`;
    const metadata = { title: `teamgym-t01-${crypto.randomUUID()}.json`, mimeType: 'application/json', parents: [{ id: folderId }] };
    const body = [
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}`,
      `--${boundary}\r\nContent-Type: application/json\r\n\r\n${JSON.stringify(probeDocument('initial'))}`,
      `--${boundary}--`,
    ].join('\r\n');
    const response = await request(`${uploadApi}?uploadType=multipart&fields=id`, {
      method: 'POST', headers: { ...headers, 'Content-Type': `multipart/related; boundary=${boundary}` }, body,
    });
    if (!response.ok) throw new ProbeError('Testfil kunne ikke oprettes', response.status);
    const result = await response.json() as { id?: unknown };
    if (typeof result.id !== 'string') throw new ProbeError('Google returnerede intet fil-id');
    return result.id;
  }

  async function upload(basis: ProbeBasis, document: ProbeDocument, condition = basis.etag) {
    validateProbeDocument(document);
    if (!condition || !basis.etag) throw new ProbeError('Betingelsen mangler');
    // Forkontrol beskytter almindelige filer. If-Match er selve T01-afprøvningsmålet.
    // Den aktuelle etag må aldrig erstatte den tidligere indlæste basis.
    await read(basis.fileId);
    const response = await request(`${uploadApi}/${encodeURIComponent(basis.fileId)}?uploadType=media`, {
      method: 'PUT',
      headers: { ...headers, 'Content-Type': 'application/json', 'If-Match': condition },
      body: JSON.stringify(document),
    });
    // Forventet afvisning er 412. Selv 2xx er kun råt testudfald, ikke frigivelsesbevis.
    return { status: response.status, accepted: response.ok };
  }

  return { read, create, upload };
}
