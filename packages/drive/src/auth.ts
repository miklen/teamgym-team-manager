/// <reference types="google.accounts" />
/// <reference types="google.picker" />
/// <reference types="gapi" />
import { DriveClient } from './client';
import { DriveError } from './errors';
import { IndexedConnectionStore, MemoryConnectionStore } from './storage';
import type { AccountReference, ConnectionStore, FileReference, RememberedConnection } from './storage';
import type { BrowserFetch } from './index';

export const DRIVE_SCOPE = 'https://www.googleapis.com/auth/drive.file';
const EXPIRY_MARGIN = 30_000;
export interface GoogleConfiguration {
  clientId: string;
  projectNumber: string;
  apiKey: string;
}
export interface TokenResult {
  token: string;
  expiresIn: number;
  scopes: string[];
}
export interface OAuthBridge {
  /** Skal kaldes direkte fra brugerens klik, efter scripts er klar. */
  request(hint: string | undefined, success: (result: TokenResult) => void, failure: () => void): void;
  revoke(token: string): Promise<void>;
}
export interface ConnectionSignals {
  send(): void;
  listen(callback: () => void): () => void;
}
export class BrowserConnectionSignals implements ConnectionSignals {
  private channel = new BroadcastChannel('teamgym-team-manager.connection.v1');
  send() {
    this.channel.postMessage('disconnected');
  }
  listen(callback: () => void) {
    const handler = (event: MessageEvent<unknown>) => {
      if (event.data === 'disconnected') callback();
    };
    this.channel.addEventListener('message', handler);
    return () => this.channel.removeEventListener('message', handler);
  }
}
export interface ConnectionView {
  status: 'disconnected' | 'connecting' | 'connected' | 'expired' | 'error';
  account: AccountReference | null;
  file: FileReference | null;
  remembered: boolean;
  message: string;
  generation: number;
}

export class GoogleConnection {
  private record: RememberedConnection | null = null;
  private epoch = '';
  private generation = 0;
  private listeners = new Set<() => void>();
  private view: ConnectionView = {
    status: 'disconnected',
    account: null,
    file: null,
    remembered: false,
    message: '',
    generation: 0,
  };
  private persistent = true;
  private remember = false;
  private stopSignals: (() => void) | undefined;
  constructor(
    private store: ConnectionStore,
    private readonly oauth: OAuthBridge,
    private readonly fetcher: BrowserFetch = globalThis.fetch.bind(globalThis),
    private readonly now = () => Date.now(),
    private readonly signals?: ConnectionSignals,
  ) {
    this.stopSignals = signals?.listen(() => {
      this.generation++;
      this.record = null;
      this.publish({
        status: 'disconnected',
        account: null,
        file: null,
        remembered: false,
        message: 'Forbindelsen er afbrudt i en anden fane. En allerede afsendt upload kan være gennemført.',
      });
    });
  }
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  snapshot = () => this.view;
  private publish(change: Partial<ConnectionView>) {
    this.view = { ...this.view, ...change, generation: this.generation };
    if (!this.persistent && !this.view.message)
      this.view.message =
        'Browserlageret er utilgængeligt. Forbindelsen virker i denne side, men huskes ikke efter lukning.';
    for (const listener of this.listeners) listener();
  }
  private async storage<T>(action: (store: ConnectionStore) => Promise<T>): Promise<T> {
    try {
      return await action(this.store);
    } catch {
      this.store = new MemoryConnectionStore();
      this.persistent = false;
      this.epoch = (await this.store.read()).epoch;
      this.publish({
        remembered: false,
        message:
          'Browserlageret er utilgængeligt. Forbindelsen virker i denne side, men huskes ikke efter lukning.',
      });
      return action(this.store);
    }
  }
  async restore() {
    const generation = this.generation;
    const stored = await this.storage((store) => store.read());
    if (generation !== this.generation) return;
    this.epoch = stored.epoch;
    this.record = stored.connection;
    this.remember = !!stored.connection;
    if (!this.record) return;
    this.publish({
      status: 'connecting',
      account: this.record.account,
      file: this.record.file,
      remembered: this.persistent,
    });
    if (!this.isValid()) {
      this.expire();
      return;
    }
    try {
      const account = await this.client().account();
      if (generation !== this.generation) return;
      if (account.permissionId !== this.record?.account.permissionId) {
        await this.disconnect();
        this.publish({ message: 'Den gemte konto kunne ikke verificeres. Forbind igen.' });
        return;
      }
      this.record.account = account;
      this.publish({ status: 'connected', account });
    } catch (error) {
      if (generation === this.generation)
        this.publish({
          status: error instanceof DriveError && error.code === 'auth' ? 'expired' : 'error',
          message: error instanceof Error ? error.message : 'Google-adgangen kunne ikke kontrolleres.',
        });
    }
  }
  private isValid() {
    return (
      !!this.record?.token &&
      this.record.expiresAt - EXPIRY_MARGIN > this.now() &&
      this.record.scopes.includes(DRIVE_SCOPE)
    );
  }
  getToken = (): string => {
    if (!this.isValid()) {
      this.expire();
      throw new DriveError('auth', 'Fortsæt med Google for at få adgang. Kladden er bevaret.');
    }
    return this.record!.token!;
  };
  client() {
    return new DriveClient(
      this.getToken,
      this.fetcher,
      () => this.expire(),
      () => this.generation,
    );
  }
  expire() {
    if (!this.record) return;
    this.generation++;
    this.record = { ...this.record, token: null };
    this.publish({
      status: 'expired',
      message: 'Google-adgangen er udløbet. Fortsæt med Google; kladden er bevaret.',
    });
    void this.persist(this.generation);
  }
  private async persist(generation: number) {
    if (!this.remember || !this.record || generation !== this.generation) return;
    const record = structuredClone(this.record);
    const accepted = await this.storage((store) => store.write(record, this.epoch));
    if (generation !== this.generation) return;
    if (!accepted) {
      this.generation++;
      this.record = null;
      this.publish({
        status: 'disconnected',
        account: null,
        file: null,
        remembered: false,
        message: 'Forbindelsen blev afbrudt i en anden fane.',
      });
      return;
    }
    this.publish({ remembered: this.persistent });
  }
  connect(remember: boolean): Promise<void> {
    const generation = ++this.generation;
    const previous = this.record;
    this.remember = remember;
    this.publish({ status: 'connecting', message: '' });
    return new Promise<void>((resolve) => {
      const fail = () => {
        if (generation === this.generation)
          this.publish({
            status: 'error',
            message:
              'Google-vinduet blev lukket eller blokeret, eller den nødvendige filadgang blev ikke givet. Prøv igen fra knappen; kladden er bevaret.',
          });
        resolve();
      };
      try {
        this.oauth.request(
          previous?.account.email,
          (result) => {
            void (async () => {
              if (generation !== this.generation) return;
              if (
                !result.token ||
                !Number.isFinite(result.expiresIn) ||
                result.expiresIn <= 30 ||
                !result.scopes.includes(DRIVE_SCOPE)
              ) {
                fail();
                return;
              }
              const receivedAt = this.now();
              // Kontoen verificeres med det nye token, før det kan blive husket eller få filreference.
              const account = await new DriveClient(() => {
                if (generation !== this.generation)
                  throw new DriveError('cancelled', 'Google-forbindelsen er afbrudt.');
                return result.token;
              }, this.fetcher).account();
              if (generation !== this.generation) return;
              const sameAccount = previous?.account.permissionId === account.permissionId;
              if (!sameAccount || !remember) {
                this.epoch = await this.storage((store) => store.clear());
                this.signals?.send();
              }
              if (generation !== this.generation) return;
              if (!this.epoch) this.epoch = (await this.storage((store) => store.read())).epoch;
              if (generation !== this.generation) return;
              this.record = {
                schemaVersion: 1,
                token: result.token,
                receivedAt,
                expiresAt: receivedAt + result.expiresIn * 1000,
                scopes: result.scopes,
                account,
                file: sameAccount ? previous.file : null,
              };
              this.publish({ status: 'connected', account, file: this.record.file });
              await this.persist(generation);
            })()
              .catch(fail)
              .finally(resolve);
          },
          fail,
        );
      } catch {
        fail();
      }
    });
  }
  async rememberFile(file: FileReference) {
    if (!this.record || !this.isValid()) throw new DriveError('auth', 'Forbind Google før filvalg.');
    this.record.file = structuredClone(file);
    this.publish({ file });
    await this.persist(this.generation);
  }
  async disconnect(revoke = false) {
    const token = this.record?.token;
    this.generation++;
    this.record = null;
    this.publish({
      status: 'disconnected',
      account: null,
      file: null,
      remembered: false,
      message: 'Forbindelsen er afbrudt. En allerede afsendt upload kan være gennemført.',
    });
    this.epoch = await this.storage((store) => store.clear());
    this.signals?.send();
    if (revoke && token) await this.oauth.revoke(token);
  }
  dispose() {
    this.stopSignals?.();
    this.listeners.clear();
  }
}

let loading: Promise<void> | undefined;
function script(src: string) {
  return new Promise<void>((resolve, reject) => {
    const element = document.createElement('script');
    element.src = src;
    element.async = true;
    element.onload = () => resolve();
    element.onerror = () =>
      reject(new DriveError('network', 'Google kunne ikke indlæses. Kontrollér internetforbindelsen.'));
    document.head.append(element);
  });
}
export function prepareGoogle() {
  return (loading ??= Promise.all([
    script('https://accounts.google.com/gsi/client'),
    script('https://apis.google.com/js/api.js'),
  ])
    .then(
      () =>
        new Promise<void>((resolve, reject) => {
          gapi.load('picker', {
            callback: resolve,
            onerror: () => reject(new DriveError('network', 'Google-filvælgeren kunne ikke åbnes.')),
            timeout: 10000,
            ontimeout: () => reject(new DriveError('network', 'Google-filvælgeren svarede ikke.')),
          });
        }),
    )
    .catch((error: unknown) => {
      loading = undefined;
      throw error;
    }));
}
export function browserOAuth(config: GoogleConfiguration): OAuthBridge {
  return {
    request(hint, success, failure) {
      const client = google.accounts.oauth2.initTokenClient({
        client_id: config.clientId,
        scope: DRIVE_SCOPE,
        include_granted_scopes: true,
        callback: (response) => {
          if (
            response.error ||
            !response.access_token ||
            !google.accounts.oauth2.hasGrantedAllScopes(response, DRIVE_SCOPE)
          ) {
            failure();
            return;
          }
          success({
            token: response.access_token,
            expiresIn: Number(response.expires_in),
            scopes: response.scope.split(/\s+/),
          });
        },
        error_callback: failure,
      });
      client.requestAccessToken({ ...(hint ? { login_hint: hint } : {}), prompt: '' });
    },
    revoke(token) {
      return new Promise<void>((resolve) => google.accounts.oauth2.revoke(token, resolve));
    },
  };
}
export function pickGoogleResource(
  config: GoogleConfiguration,
  token: string,
  folder: boolean,
): Promise<string | null> {
  return new Promise((resolve) => {
    const view = new google.picker.DocsView(folder ? google.picker.ViewId.FOLDERS : google.picker.ViewId.DOCS)
      .setIncludeFolders(folder)
      .setSelectFolderEnabled(folder);
    if (!folder) view.setMimeTypes('application/json');
    const picker = new google.picker.PickerBuilder()
      .setAppId(config.projectNumber)
      .setDeveloperKey(config.apiKey)
      .setOAuthToken(token)
      .setOrigin(location.origin)
      .setLocale('da')
      .addView(view)
      .setCallback((data) => {
        if (data.action === google.picker.Action.PICKED || data.action === google.picker.Action.CANCEL) {
          picker.dispose();
          resolve(data.action === google.picker.Action.PICKED ? (data.docs?.[0]?.id ?? null) : null);
        }
      })
      .build();
    picker.setVisible(true);
  });
}
export function createBrowserConnection(config: GoogleConfiguration) {
  let store: ConnectionStore;
  try {
    store = new IndexedConnectionStore();
  } catch {
    store = new MemoryConnectionStore();
  }
  let signals: ConnectionSignals | undefined;
  try {
    signals = new BrowserConnectionSignals();
  } catch {
    /* Lager-epoch beskytter stadig asynkrone lagersvar. */
  }
  return new GoogleConnection(store, browserOAuth(config), undefined, undefined, signals);
}
