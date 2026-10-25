import { describe, expect, it } from 'vitest';
import { createTeam, createWorkspace, serializeWorkspace, workspacePayload } from '@teamgym/domain';
import { DriveClient, WorkspaceSession } from '@teamgym/drive';
import type { BrowserFetch } from '@teamgym/drive';

const binding = { rulesetId: 'dk', packageVersion: '1.0.0', ageGroup: 'junior', teamType: 'girls' };
function server() {
  let bytes = serializeWorkspace(createWorkspace());
  let version = 1;
  let writable = true;
  let status = 200;
  let puts = 0;
  let dropResponse = false;
  let afterPut: (() => Promise<void>) | undefined;
  let beforePut: (() => void) | undefined;
  let duringRead: (() => void) | undefined;
  const conditions: string[] = [];
  const fetcher: BrowserFetch = async (input, init) => {
    const url = new URL(String(input));
    if (status !== 200) return new Response('', { status });
    if (init?.method === 'PUT') {
      puts++;
      beforePut?.();
      beforePut = undefined;
      const condition = new Headers(init.headers).get('If-Match')!;
      conditions.push(condition);
      if (!writable) return new Response('', { status: 403 });
      if (condition !== `"${version}"`) return new Response('', { status: 412 });
      bytes = String(init.body);
      version++;
      await afterPut?.();
      if (dropResponse) {
        dropResponse = false;
        throw new TypeError('response lost');
      }
      return Response.json({ id: 'file' });
    }
    if (url.searchParams.get('alt') === 'media') {
      const result = bytes;
      duringRead?.();
      duringRead = undefined;
      return new Response(result);
    }
    return Response.json({
      id: 'file',
      title: 'Test.json',
      mimeType: 'application/json',
      etag: `"${version}"`,
      version: String(version),
      editable: writable,
      labels: { trashed: false },
      parents: [{ id: 'folder' }],
    });
  };
  const client = () => new DriveClient(() => 'synthetic-token', fetcher);
  return {
    client,
    conditions,
    get puts() {
      return puts;
    },
    get bytes() {
      return bytes;
    },
    get version() {
      return version;
    },
    setStatus(value: number) {
      status = value;
    },
    setWritable(value: boolean) {
      writable = value;
    },
    drop() {
      dropResponse = true;
    },
    afterPut(action: () => Promise<void>) {
      afterPut = action;
    },
    beforePut(action: () => void) {
      beforePut = action;
    },
    duringRead(action: () => void) {
      duringRead = action;
    },
    external(
      update = (workspace: ReturnType<typeof createWorkspace>) =>
        createTeam(workspace, 'Anden træners hold', binding),
    ) {
      bytes = serializeWorkspace(update(JSON.parse(bytes) as ReturnType<typeof createWorkspace>));
      version++;
    },
  };
}
async function open(source = server()) {
  const session = new WorkspaceSession(source.client());
  await session.open('file');
  return { source, session };
}
function add(session: WorkspaceSession, name = 'Junior') {
  session.edit(createTeam(session.snapshot().draft!, name, binding));
}
function deferred() {
  let resolve!: () => void;
  const promise = new Promise<void>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}

describe('produktionsadapterens konsistente læsning og skrivebetingelse', () => {
  it('kontoskift under rettighedskontrol kan ikke sende gammel kladde med den nye kontos token', async () => {
    let generation = 0;
    const held = deferred();
    const entered = deferred();
    const requests: string[] = [];
    const fetcher: BrowserFetch = async (_url, init) => {
      requests.push(init?.method ?? 'GET');
      entered.resolve();
      await held.promise;
      return Response.json({
        id: 'file',
        title: 'Test.json',
        mimeType: 'application/json',
        etag: '"1"',
        version: '1',
        editable: true,
        labels: { trashed: false },
      });
    };
    const client = new DriveClient(
      () => `synthetic-account-${generation}`,
      fetcher,
      undefined,
      () => generation,
    );
    const uploading = client.upload(
      { fileId: 'file', etag: '"1"', version: '1', contentHash: 'unused', workspaceRevision: 0 },
      { ...createWorkspace(), revision: 1 },
    );
    await entered.promise;
    generation++;
    held.resolve();
    await expect(uploading).rejects.toMatchObject({ code: 'cancelled' });
    expect(requests).toEqual(['GET']);
  });
  it('gentager når filen ændres under læsning og holder version som opaque streng', async () => {
    const source = server();
    source.duringRead(() => source.external());
    const loaded = await source.client().read('file');
    expect(loaded.workspace.teams).toHaveLength(1);
    expect(loaded.basis.version).toBe('2');
    expect(loaded.basis.etag).toBe('"2"');
    expect(loaded.basis.contentHash).toHaveLength(64);
  });
  it('ændrer ikke forkert/nyere fil og opretter intet erstatningsarbejdsrum', async () => {
    // Direkte respons bruges, fordi simulatorens normale ekstern-redigering også validerer.
    const fetcher: BrowserFetch = async (input) =>
      String(input).includes('alt=media')
        ? new Response('{"format":"teamgym-team-manager","schemaVersion":99}')
        : Response.json({
            id: 'file',
            title: 'Ny.json',
            mimeType: 'application/json',
            etag: '"1"',
            version: '1',
            editable: true,
            labels: { trashed: false },
          });
    await expect(new DriveClient(() => 'synthetic-token', fetcher).read('file')).rejects.toMatchObject({
      code: 'newer-schema',
    });
  });
  it('bevarer If-Match fra den oprindelige basis i kapløbet efter forkontrol', async () => {
    const { source, session } = await open();
    add(session);
    source.beforePut(() => source.external());
    await session.save();
    expect(source.conditions).toEqual(['"1"']);
    expect(session.snapshot().state).toBe('conflict');
    expect(session.snapshot().draft!.teams[0]!.name).toBe('Junior');
    expect(JSON.parse(source.bytes).teams[0].name).toBe('Anden træners hold');
  });
  it('to sessioner fra samme basis kan i simulatoren kun gemme én gang', async () => {
    const source = server();
    const a = (await open(source)).session;
    const b = (await open(source)).session;
    add(a, 'A');
    add(b, 'B');
    await Promise.all([a.save(), b.save()]);
    expect([a.snapshot().state, b.snapshot().state].sort()).toEqual(['conflict', 'saved']);
    expect(source.version).toBe(2);
    expect(source.puts).toBeLessThanOrEqual(2);
    expect(b.exportDraft()).toContain('B');
  });
});

describe('basis, snapshot, kladde og uklart svar', () => {
  it('serialiserer dobbeltklik og bevarer redigering under upload', async () => {
    const { source, session } = await open();
    const held = deferred();
    const entered = deferred();
    source.afterPut(async () => {
      entered.resolve();
      await held.promise;
    });
    add(session);
    const first = session.save();
    expect(session.save()).toBe(first);
    await entered.promise;
    add(session, 'Nyere lokal');
    held.resolve();
    await first;
    expect(session.snapshot().state).toBe('changed');
    expect(session.snapshot().draft!.teams).toHaveLength(2);
    expect(JSON.parse(source.bytes).teams).toHaveLength(1);
    expect(source.puts).toBe(1);
    await session.save();
    expect(session.snapshot().state).toBe('saved');
    expect(source.puts).toBe(2);
  });
  it('genkender operationen efter mistet svar uden endnu en upload', async () => {
    const { source, session } = await open();
    add(session);
    source.drop();
    await session.save();
    expect(session.snapshot().state).toBe('error');
    await session.save();
    expect(session.snapshot().state).toBe('saved');
    expect(source.puts).toBe(1);
    expect(session.snapshot().loaded!.workspace.recentOperations).toHaveLength(1);
  });
  it('genkender gennemført operation men giver aldrig gammel kladde en nyere basis', async () => {
    const { source, session } = await open();
    add(session);
    source.drop();
    await session.save();
    source.external();
    await session.save();
    expect(session.snapshot()).toMatchObject({ state: 'conflict', operationCompleted: true, newer: true });
    expect(session.snapshot().loaded!.basis.version).toBe('1');
    expect(session.snapshot().draft!.teams).toHaveLength(1);
    await session.save();
    expect(source.puts).toBe(1);
  });
  it('nyttelast-hash omfatter ingen afledte revisionsfelter', async () => {
    const { session } = await open();
    add(session);
    const original = workspacePayload(session.snapshot().draft!);
    await session.save();
    expect(workspacePayload(session.snapshot().draft!)).toBe(original);
    expect(session.snapshot().draft!.recentOperations[0]!.payloadHash).toMatch(/^[a-f0-9]{64}$/);
  });
  it.each([401, 403, 404])('bevarer kladde og sandfærdig fejl ved HTTP %i', async (status) => {
    const { source, session } = await open();
    add(session);
    const draft = session.exportDraft();
    source.setStatus(status);
    await session.save();
    expect(session.snapshot().state).toBe('error');
    expect(session.exportDraft()).toBe(draft);
    expect(source.puts).toBe(0);
  });
  it('kræver bevidst kassation før genindlæsning og gemmer aldrig i læsetilstand', async () => {
    const { source, session } = await open();
    add(session);
    source.external();
    await session.checkRemote();
    await expect(session.open('file')).rejects.toMatchObject({ code: 'cancelled' });
    expect(session.snapshot().draft!.teams[0]!.name).toBe('Junior');
    await session.open('file', true);
    expect(session.snapshot().draft!.teams[0]!.name).toBe('Anden træners hold');
    source.setWritable(false);
    await session.checkRemote();
    expect(() => add(session)).toThrow('læseadgang');
  });
  it('sent uploadsvar kan ikke genoprette et ryddet arbejdsrum', async () => {
    const { source, session } = await open();
    const held = deferred();
    const entered = deferred();
    source.afterPut(async () => {
      entered.resolve();
      await held.promise;
    });
    add(session);
    const save = session.save();
    await entered.promise;
    session.clear();
    held.resolve();
    await save;
    expect(session.snapshot().draft).toBeNull();
    expect(JSON.parse(source.bytes).teams).toHaveLength(1);
  });
});
