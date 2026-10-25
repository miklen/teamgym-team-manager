import { createProbeClient, ProbeError, probeDocument } from './candidate';
import type { ProbeBasis, ProbeDocument } from './candidate';
import { loadGoogle, pick, tokenClient } from './google';
import './style.css';

function element<T extends HTMLElement>(id: string) {
  const result = document.getElementById(id);
  if (!result) throw new Error('Testsidens kontrol mangler.');
  return result as T;
}

const button = (id: string) => element<HTMLButtonElement>(id);
const actions = ['prepare', 'login', 'disconnect', 'create', 'pick', 'read', 'upload', 'wrong', 'inspect', 'export'] as const;
const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;
const projectNumber = import.meta.env.VITE_GOOGLE_PROJECT_NUMBER as string | undefined;
const apiKey = import.meta.env.VITE_GOOGLE_API_KEY as string | undefined;
const configured = Boolean(clientId && projectNumber && apiKey);
let ready = false;
let busy = false;
let authPending = false;
let connectionAbort = new AbortController();
let token = '';
let generation = 0;
let fileId = '';
let basis: ProbeBasis | null = null;
let draft: ProbeDocument | null = null;
let expiryTimer: ReturnType<typeof setTimeout> | undefined;
const events: Record<string, string | number | boolean>[] = [];

function log(event: string, details: Record<string, string | number | boolean> = {}) {
  events.push({ time: new Date().toISOString(), event, ...details });
  element('results').textContent = events.map((value) => JSON.stringify(value)).join('\n');
}

function controls() {
  for (const id of actions) {
    const allowed = id === 'prepare' ? configured && !ready : id === 'login' ? ready && !token && !authPending :
      id === 'disconnect' ? Boolean(token) || authPending :
      id === 'create' || id === 'pick' ? Boolean(token) :
      id === 'read' || id === 'inspect' ? Boolean(token && fileId) :
      id === 'export' ? Boolean(draft) : Boolean(token && basis);
    button(id).disabled = !allowed || (busy && id !== 'disconnect');
  }
}

function clearConnection() {
  generation++;
  connectionAbort.abort();
  authPending = false;
  token = '';
  fileId = '';
  basis = null;
  clearTimeout(expiryTimer);
  element('file-state').textContent = 'Ingen testfil valgt.';
  element('basis-state').textContent = 'Ingen basis indlæst. Syntetisk kladde kan fortsat eksporteres.';
  controls();
}

async function run(action: (client: ReturnType<typeof createProbeClient>, currentGeneration: number) => Promise<void>) {
  if (busy || !token) return;
  busy = true;
  controls();
  const currentGeneration = generation;
  try { await action(createProbeClient(token, globalThis.fetch.bind(globalThis), connectionAbort.signal), currentGeneration); }
  catch (error) {
    if (currentGeneration === generation) {
      log(error instanceof ProbeError ? error.message : 'Uventet testfejl; ingen automatisk gentagelse');
    }
  } finally { busy = false; controls(); }
}

function download(name: string, value: unknown) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

button('disconnect').onclick = () => { clearConnection(); log('Lokal forbindelse afbrudt; en afsendt upload kan stadig være gennemført'); };
button('create').onclick = () => void run(async (client, currentGeneration) => {
  const folderId = await pick(token, projectNumber!, apiKey!, true);
  if (!folderId || currentGeneration !== generation) return;
  const created = await client.create(folderId);
  if (currentGeneration !== generation) return;
  fileId = created;
  basis = null;
  element('file-state').textContent = `Syntetisk testfil: ${fileId}. Del den via Drive med testkonto B.`;
  log('Syntetisk testfil oprettet');
});
button('pick').onclick = () => void run(async (_client, currentGeneration) => {
  const picked = await pick(token, projectNumber!, apiKey!, false);
  if (!picked || currentGeneration !== generation) return;
  fileId = picked;
  basis = null;
  element('file-state').textContent = `Valgt testfil: ${fileId}`;
  element('basis-state').textContent = 'Ingen basis indlæst.';
  log('Testfil valgt; endnu ikke valideret');
});
button('read').onclick = () => void run(async (client, currentGeneration) => {
  const loaded = await client.read(fileId);
  if (currentGeneration !== generation) return;
  basis = loaded;
  element('basis-state').textContent = `Fastholdt version ${basis.version}; SHA-256 ${basis.sha256}`;
  log('Basis fastholdt', { version: basis.version, sha256: basis.sha256 });
});
button('inspect').onclick = () => void run(async (client, currentGeneration) => {
  const latest = await client.read(fileId);
  if (currentGeneration !== generation) return;
  const document = JSON.parse(latest.bytes) as ProbeDocument;
  log('Seneste fil læst; fastholdt basis uændret', { version: latest.version, sha256: latest.sha256, operationId: document.operationId, label: document.label });
});

function send(wrong: boolean) {
  return run(async (client, currentGeneration) => {
    if (!basis) return;
    const snapshot = basis;
    draft = probeDocument(element<HTMLSelectElement>('label').value === 'B' ? 'B' : 'A');
    const payload = draft;
    const scheduled = element<HTMLInputElement>('send-at').value.trim();
    if (scheduled) {
      const delay = Date.parse(scheduled) - Date.now();
      if (!Number.isFinite(delay) || delay < 0 || delay > 60000) throw new ProbeError('Vælg en UTC-tid højst 60 sekunder fremme');
      log('Upload planlagt', { sendAt: new Date(Date.now() + delay).toISOString() });
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
    if (currentGeneration !== generation) return;
    log('Upload starter', { operationId: payload.operationId, label: payload.label, wrongEtag: wrong });
    const result = await client.upload(snapshot, payload, wrong ? '"teamgym-t01-intentionally-wrong"' : snapshot.etag);
    if (currentGeneration !== generation) return;
    log('Råt uploadsvar; basis er fortsat uændret', { status: result.status, accepted: result.accepted, operationId: payload.operationId });
  });
}
button('upload').onclick = () => void send(false);
button('wrong').onclick = () => void send(true);
button('export').onclick = () => { if (draft) download('teamgym-t01-kladde.json', draft); };
button('report').onclick = () => download('teamgym-t01-testlog.json', { origin: location.origin, status: 'unverified', events });

element('origin').textContent = `Aktuel origin: ${location.origin}. Krævet frigivelsestest: https://miklen.github.io.`;
if (!configured) {
  log('Google-konfiguration mangler; ingen Google-scripts eller API-kald startes');
} else log('Offentlig Google-konfiguration findes; indlæs testværktøjet for at fortsætte');

button('prepare').onclick = () => {
  if (busy) return;
  busy = true;
  controls();
  const currentGeneration = generation;
  void loadGoogle().then(() => {
    if (currentGeneration !== generation) return;
    ready = true;
    log('Google-testværktøj klar; T01 er ikke udført');
  }).catch(() => log('Google-testværktøj kunne ikke indlæses')).finally(() => { busy = false; controls(); });
};

button('login').onclick = () => {
  const currentGeneration = ++generation;
  authPending = true;
  controls();
  tokenClient(clientId!, (accessToken, expiresIn) => {
    if (currentGeneration !== generation) return;
    authPending = false;
    if (!Number.isFinite(expiresIn) || expiresIn <= 60) { log('Tokenets gyldighed er utilstrækkelig'); controls(); return; }
    token = accessToken;
    connectionAbort = new AbortController();
    expiryTimer = setTimeout(() => { clearConnection(); log('Token udløbet; forbind igen og indlæs basis på ny'); }, (expiresIn - 60) * 1000);
    controls();
    log('Testkonto forbundet; token opbevares kun i hukommelsen');
  }, () => {
    if (currentGeneration !== generation) return;
    authPending = false;
    controls();
    log('Google-login afbrudt, popup blokeret eller scope mangler');
  }).requestAccessToken({ prompt: '' });
};
controls();
