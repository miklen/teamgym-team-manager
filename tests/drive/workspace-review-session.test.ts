import { describe, expect, it } from 'vitest';
import { createTeam, createWorkspace, serializeWorkspace, workspacePayload } from '@teamgym/domain';
import type { MergeContext, Workspace } from '@teamgym/domain';
import { DriveError, WorkspaceSession } from '@teamgym/drive';
import type { DriveBasis, LoadedWorkspace, WorkspaceClient } from '@teamgym/drive';
import { binding } from '../fixtures/synthetic-workspace';

class MemoryClient implements WorkspaceClient {
  workspace = createWorkspace();
  version = 1;
  writable = true;
  puts = 0;
  conditions: string[] = [];
  fail = false;
  drop = false;
  onRead: (() => Promise<void>) | null = null;
  beforeUpload: (() => void) | null = null;
  external() {
    this.workspace = {
      ...createTeam(this.workspace, 'Eksternt hold', binding),
      revision: this.workspace.revision + 1,
    };
    this.version++;
  }
  async read(fileId: string): Promise<LoadedWorkspace> {
    if (this.fail) throw new DriveError('auth', 'Adgangen er udløbet. Kladden er bevaret.');
    const version = String(this.version),
      etag = `"${version}"`;
    const result: LoadedWorkspace = {
      workspace: structuredClone(this.workspace),
      basis: {
        fileId,
        etag,
        version,
        contentHash: serializeWorkspace(this.workspace),
        workspaceRevision: this.workspace.revision,
      },
      metadata: {
        id: fileId,
        name: 'Syntetisk.json',
        folderIds: [],
        writable: this.writable,
        etag,
        version,
        mimeType: 'application/json',
        canAddChildren: false,
      },
    };
    await this.onRead?.();
    return result;
  }
  async upload(basis: DriveBasis, workspace: Workspace) {
    this.beforeUpload?.();
    this.beforeUpload = null;
    this.conditions.push(basis.etag);
    if (basis.etag !== `"${this.version}"`) throw new DriveError('conflict', 'Nyere fil', 412);
    if (!this.writable) throw new DriveError('permission', 'Læseadgang');
    this.workspace = structuredClone(workspace);
    this.version++;
    this.puts++;
    if (this.drop) {
      this.drop = false;
      throw new DriveError('network', 'Mistet uploadsvar');
    }
  }
}
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
async function open(options: { context?: () => MergeContext; connection?: () => string } = {}) {
  const source = new MemoryClient();
  const session = new WorkspaceSession(
    source,
    undefined,
    undefined,
    undefined,
    options.context,
    options.connection,
  );
  await session.open('synthetic-file');
  return { source, session };
}
function add(session: WorkspaceSession, name = 'Lokalt hold') {
  session.edit(createTeam(session.snapshot().draft!, name, binding));
}

describe('gennemgangens snapshots, afstemning og revisionsbasis', () => {
  it('fokus-/baggrundskontrol accepterer samme gennemgåede R og afviser en tredje version', async () => {
    const { source, session } = await open();
    add(session);
    source.external();
    await session.beginReview();
    await session.checkRemote();
    expect(session.snapshot().review?.status).toBe('ready');
    source.external();
    await session.checkRemote();
    expect(session.snapshot().review?.status).toBe('stale');
    expect(await session.applyReview()).toBe(false);
    expect(session.snapshot().draft?.teams).toHaveLength(1);
    expect(source.puts).toBe(0);
  });
  it('hentning, annullering og anvendelse uploader intet; senere gemning bruger ny basis', async () => {
    const { source, session } = await open();
    add(session);
    source.external();
    const draft = session.exportDraft(),
      loaded = session.snapshot().loaded;
    await session.beginReview();
    expect(session.snapshot().review?.result?.status).toBe('valid');
    expect(session.exportDraft()).toBe(draft);
    expect(session.snapshot().loaded).toEqual(loaded);
    session.cancelReview();
    expect(session.snapshot().review).toBeNull();
    expect(session).toHaveProperty('comparison', null);
    expect(session.exportDraft()).toBe(draft);
    await session.beginReview();
    expect(await session.applyReview()).toBe(true);
    expect(source.puts).toBe(0);
    expect(session).toHaveProperty('comparison', null);
    expect(session.snapshot().draft?.teams).toHaveLength(2);
    expect(session.snapshot().loaded?.basis.etag).toBe('"2"');
    await session.save();
    expect(source.conditions).toEqual(['"2"']);
    expect(session.snapshot().state).toBe('saved');
    expect(source.workspace.teams).toHaveLength(2);
  });
  it.each([false, true])(
    'mistet svar med senere ekstern ændring=%s bruger eget bekræftet snapshot',
    async (external) => {
      const { source, session } = await open();
      add(session, 'Allerede gemt');
      source.drop = true;
      await session.save();
      add(session, 'Ny lokal');
      if (external) source.external();
      await session.beginReview();
      const result = session.snapshot().review?.result;
      expect(result?.status).toBe('valid');
      expect(result?.changes.some((change) => JSON.stringify(change).includes('Allerede gemt'))).toBe(false);
      expect(await session.applyReview()).toBe(true);
      expect(source.puts).toBe(1);
      expect(session.snapshot().draft?.teams).toHaveLength(external ? 3 : 2);
      await session.save();
      expect(source.puts).toBe(2);
      expect(source.workspace.recentOperations).toHaveLength(2);
      expect(new Set(source.workspace.recentOperations.map((op) => op.id)).size).toBe(2);
    },
  );
  it('uafklaret tidligere operation eller læsefejl blokerer med bevaret kladde', async () => {
    const { source, session } = await open();
    add(session);
    source.drop = true;
    await session.save();
    source.external();
    source.workspace.recentOperations = [];
    const draft = session.exportDraft();
    await session.beginReview();
    expect(session.snapshot().review?.status).toBe('error');
    expect(await session.applyReview()).toBe(false);
    expect(session.exportDraft()).toBe(draft);
    source.fail = true;
    await session.beginReview();
    expect(session.snapshot().review?.status).toBe('error');
    expect(session.exportDraft()).toBe(draft);
    expect(source.puts).toBe(1);
  });
  it('lokale ændringer under hentning og efter preview kan ikke anvendes med gamle valg', async () => {
    const { source, session } = await open();
    add(session);
    const basis = session.snapshot().loaded;
    const entered = deferred(),
      held = deferred();
    source.onRead = async () => {
      entered.resolve();
      await held.promise;
    };
    const reading = session.beginReview();
    await entered.promise;
    add(session, 'Under hentning');
    held.resolve();
    await reading;
    expect(session.snapshot().review?.status).toBe('stale');
    expect(session.snapshot().loaded).toEqual(basis);
    expect(session.snapshot().draft?.teams).toHaveLength(2);
    source.onRead = null;
    await session.beginReview();
    add(session, 'Efter preview');
    expect(await session.applyReview()).toBe(false);
    expect(source.puts).toBe(0);
  });
  it('tredje gemning og fjernet skriveadgang afvises ved genkontrol', async () => {
    const { source, session } = await open();
    add(session);
    await session.beginReview();
    source.external();
    expect(await session.applyReview()).toBe(false);
    expect(session.snapshot().review?.status).toBe('stale');
    await session.beginReview();
    source.writable = false;
    expect(await session.applyReview()).toBe(false);
    expect(session.snapshot().loaded?.metadata.writable).toBe(false);
    expect(session.snapshot().draft?.teams).toHaveLength(1);
    expect(source.puts).toBe(0);
  });
  it('kapløb efter anvendelse beholder If-Match og den flettede kladde', async () => {
    const { source, session } = await open();
    add(session);
    source.external();
    await session.beginReview();
    expect(await session.applyReview()).toBe(true);
    const draft = workspacePayload(session.snapshot().draft!);
    source.beforeUpload = () => source.external();
    await session.save();
    expect(source.conditions).toEqual(['"2"']);
    expect(session.snapshot().state).toBe('conflict');
    expect(workspacePayload(session.snapshot().draft!)).toBe(draft);
    await session.beginReview();
    expect(session.snapshot().review?.result?.status).toBe('valid');
    expect(source.puts).toBe(0);
  });
  it.each(['cancel', 'clear', 'file'])(
    '%s kasserer forsinket sammenligningssvar og frigiver snapshot',
    async (action) => {
      const { source, session } = await open();
      add(session);
      const replacement = await source.read('new-file');
      const entered = deferred(),
        held = deferred();
      source.onRead = async () => {
        entered.resolve();
        await held.promise;
      };
      const pending = session.beginReview();
      await entered.promise;
      if (action === 'cancel') session.cancelReview();
      else if (action === 'clear') session.clear();
      else session.adopt(replacement);
      held.resolve();
      await pending;
      expect(session.snapshot().review).toBeNull();
      expect(session).toHaveProperty('comparison', null);
      expect(source.puts).toBe(0);
      if (action === 'cancel') expect(session.snapshot().draft?.teams).toHaveLength(1);
      if (action === 'clear') expect(session.snapshot().draft).toBeNull();
      if (action === 'file') expect(session.snapshot().loaded?.basis.fileId).toBe('new-file');
    },
  );
  it('konto-/forbindelses- og regelkontekst gør gennemgangen forældet', async () => {
    let connection = 'account-a-connected',
      fingerprint = 'rules-v1';
    const { source, session } = await open({
      connection: () => connection,
      context: () => ({ fingerprint, reconcile: (w) => w }),
    });
    add(session);
    await session.beginReview();
    connection = 'account-a-expired';
    expect(await session.applyReview()).toBe(false);
    connection = 'account-b-connected';
    await session.beginReview();
    fingerprint = 'rules-v2';
    expect(await session.applyReview()).toBe(false);
    expect(session.snapshot().draft?.teams).toHaveLength(1);
    expect(source.puts).toBe(0);
  });
  it('identisk kandidat giver uændret og ingen upload', async () => {
    const { source, session } = await open();
    await session.beginReview();
    expect(await session.applyReview()).toBe(true);
    expect(session.snapshot().state).toBe('unchanged');
    expect(source.puts).toBe(0);
  });
});
