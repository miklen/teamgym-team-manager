import { describe, expect, it } from 'vitest';
import { DRIVE_SCOPE, GoogleConnection, MemoryConnectionStore } from '@teamgym/drive';
import type {
  BrowserFetch,
  ConnectionSignals,
  ConnectionStore,
  OAuthBridge,
  TokenResult,
} from '@teamgym/drive';

function harness(store: ConnectionStore = new MemoryConnectionStore()) {
  let time = 100_000;
  let success!: (result: TokenResult) => void;
  let fail!: () => void;
  let lastHint: string | undefined;
  let requests = 0;
  let account = 'A';
  let calls = 0;
  const fetcher: BrowserFetch = async () => {
    calls++;
    return Response.json({
      user: {
        permissionId: account,
        emailAddress: `${account}@example.invalid`,
        displayName: `Træner ${account}`,
      },
    });
  };
  const oauth: OAuthBridge = {
    request(hint, done, error) {
      requests++;
      lastHint = hint;
      success = done;
      fail = error;
    },
    async revoke() {},
  };
  const listeners = new Set<() => void>();
  const signals: ConnectionSignals = {
    send() {},
    listen(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
  const connection = new GoogleConnection(store, oauth, fetcher, () => time, signals);
  return {
    connection,
    store,
    oauth,
    fetcher,
    get requests() {
      return requests;
    },
    get calls() {
      return calls;
    },
    get hint() {
      return lastHint;
    },
    advance(ms: number) {
      time += ms;
    },
    account(value: string) {
      account = value;
    },
    token(overrides: Partial<TokenResult> = {}) {
      success({ token: 'synthetic-access', expiresIn: 3600, scopes: [DRIVE_SCOPE], ...overrides });
    },
    fail() {
      fail();
    },
    externalDisconnect() {
      for (const listener of listeners) listener();
    },
  };
}
describe('personlig Google-forbindelse uden automatisk popup', () => {
  it('husker gyldig forbindelse, verificerer faktisk konto og genbruger uden OAuth-kald', async () => {
    const h = harness();
    await h.connection.restore();
    const connecting = h.connection.connect(true);
    h.token();
    await connecting;
    await h.connection.rememberFile({ id: 'file', name: 'Test.json', folderIds: ['folder'] });
    const reopened = new GoogleConnection(h.store, h.oauth, h.fetcher, () => 200_000);
    await reopened.restore();
    expect(reopened.snapshot()).toMatchObject({
      status: 'connected',
      remembered: true,
      account: { permissionId: 'A' },
      file: { id: 'file' },
    });
    expect(h.requests).toBe(1);
    expect(h.calls).toBe(2);
    const stored = JSON.stringify(await h.store.read());
    expect(stored).not.toMatch(/refresh_token|client_secret|athletes|athleteSkills/);
  });
  it('udløb følger expires_in med margin, sletter token og bevarer kun konto/fil til ét brugerklik', async () => {
    const h = harness();
    await h.connection.restore();
    const connecting = h.connection.connect(true);
    h.token({ expiresIn: 60 });
    await connecting;
    await h.connection.rememberFile({ id: 'file', name: 'Test.json', folderIds: [] });
    h.advance(30_001);
    expect(() => h.connection.getToken()).toThrow('Fortsæt med Google');
    await Promise.resolve();
    expect(h.connection.snapshot().status).toBe('expired');
    expect((await h.store.read()).connection?.token).toBeNull();
    expect(h.requests).toBe(1);
    const retry = h.connection.connect(true);
    expect(h.hint).toBe('A@example.invalid');
    h.token();
    await retry;
    expect(h.requests).toBe(2);
    expect(h.connection.snapshot().file?.id).toBe('file');
  });
  it('afbrudt popup og manglende scope giver fejl uden popup-loop', async () => {
    const h = harness();
    await h.connection.restore();
    const first = h.connection.connect(true);
    h.fail();
    await first;
    expect(h.connection.snapshot().status).toBe('error');
    expect(h.requests).toBe(1);
    const second = h.connection.connect(true);
    h.token({ scopes: [] });
    await second;
    expect(h.connection.snapshot().status).toBe('error');
    expect(h.calls).toBe(0);
    expect(h.requests).toBe(2);
  });
  it('kasserer token fra gammel generation efter afbrydelse', async () => {
    const h = harness();
    await h.connection.restore();
    const connecting = h.connection.connect(true);
    await h.connection.disconnect();
    h.token();
    await connecting;
    expect(h.connection.snapshot().status).toBe('disconnected');
    expect((await h.store.read()).connection).toBeNull();
    expect(h.calls).toBe(0);
  });
  it('anden fane stopper straks nye kald, også før asynkrone lagersvar', async () => {
    const h = harness();
    await h.connection.restore();
    const connecting = h.connection.connect(true);
    h.token();
    await connecting;
    h.externalDisconnect();
    expect(() => h.connection.getToken()).toThrow();
    expect(h.connection.snapshot().account).toBeNull();
  });
  it('fælles lager-epoch afviser et sent svar efter rydning i anden fane', async () => {
    const h = harness();
    await h.connection.restore();
    const initial = await h.store.read();
    await h.store.clear();
    expect(
      await h.store.write(
        {
          schemaVersion: 1,
          token: 'synthetic-old',
          receivedAt: 1,
          expiresAt: 2,
          scopes: [DRIVE_SCOPE],
          account: { permissionId: 'A', email: 'a@example.invalid', name: 'A' },
          file: null,
        },
        initial.epoch,
      ),
    ).toBe(false);
  });
  it('kontoskift genbruger aldrig tidligere kontos filreference', async () => {
    const h = harness();
    await h.connection.restore();
    const first = h.connection.connect(true);
    h.token();
    await first;
    await h.connection.rememberFile({ id: 'old', name: 'Gammelt.json', folderIds: [] });
    h.connection.expire();
    h.account('B');
    const second = h.connection.connect(true);
    h.token();
    await second;
    expect(h.connection.snapshot()).toMatchObject({ account: { permissionId: 'B' }, file: null });
    expect((await h.store.read()).connection?.file).toBeNull();
  });
  it('lagerfejl understøtter kun hukommelsesbaseret adgang med tydelig besked', async () => {
    const bad: ConnectionStore = {
      async read() {
        throw Error('private mode');
      },
      async write() {
        throw Error('blocked');
      },
      async clear() {
        throw Error('blocked');
      },
    };
    const h = harness(bad);
    await h.connection.restore();
    const connecting = h.connection.connect(true);
    h.token();
    await connecting;
    expect(h.connection.snapshot()).toMatchObject({ status: 'connected', remembered: false });
    expect(h.connection.getToken()).toBe('synthetic-access');
    expect(h.connection.snapshot().message).toContain('huskes ikke');
  });
});
