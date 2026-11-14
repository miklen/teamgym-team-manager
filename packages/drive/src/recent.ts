import type { LocalHandle } from './local-file';

export type RecentWorkspace = {
  schemaVersion: 1;
  id: string;
  name: string;
  openedAt: number;
} & (
  | { kind: 'drive'; fileId: string; folderIds: string[]; accountId: string; resourceKey?: string }
  | { kind: 'local-handle'; handle: LocalHandle; workspaceId: string }
  | { kind: 'local-fallback'; workspaceId: string }
);

export interface RecentStore {
  list(): Promise<RecentWorkspace[]>;
  put(entry: RecentWorkspace): Promise<void>;
  remove(id: string): Promise<void>;
}

export class MemoryRecentStore implements RecentStore {
  private entries: RecentWorkspace[] = [];
  async list() { return [...this.entries]; }
  async put(entry: RecentWorkspace) { this.entries = [entry, ...this.entries.filter((item) => item.id !== entry.id)]; }
  async remove(id: string) { this.entries = this.entries.filter((item) => item.id !== id); }
}

export class IndexedRecentStore implements RecentStore {
  private database: Promise<IDBDatabase> | undefined;
  constructor(private readonly factory: IDBFactory = globalThis.indexedDB) {}
  private db() {
    return (this.database ??= new Promise<IDBDatabase>((resolve, reject) => {
      if (!this.factory) { reject(new Error('Browserlageret er utilgængeligt.')); return; }
      const request = this.factory.open('teamgym-team-manager.recent.v1', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('recent', { keyPath: 'id' });
      request.onsuccess = () => { request.result.onversionchange = () => request.result.close(); resolve(request.result); };
      request.onerror = request.onblocked = () => reject(new Error('Seneste kunne ikke åbnes i browseren.'));
    }));
  }
  private async transaction<T>(mode: IDBTransactionMode, request: (store: IDBObjectStore, done: (value: T) => void) => void): Promise<T> {
    const db = await this.db();
    return new Promise<T>((resolve, reject) => {
      const tx = db.transaction('recent', mode);
      let result: T;
      tx.oncomplete = () => resolve(result);
      tx.onerror = tx.onabort = () => reject(new Error('Seneste kunne ikke opdateres i browseren.'));
      request(tx.objectStore('recent'), (value) => { result = value; });
    });
  }
  list() {
    return this.transaction<RecentWorkspace[]>('readonly', (store, done) => {
      const request = store.getAll();
      request.onsuccess = () => done((request.result as RecentWorkspace[]).filter(validRecent));
    });
  }
  put(entry: RecentWorkspace) { return this.transaction<void>('readwrite', (store, done) => { store.put(entry); done(); }); }
  remove(id: string) { return this.transaction<void>('readwrite', (store, done) => { store.delete(id); done(); }); }
}

function validRecent(value: unknown): value is RecentWorkspace {
  if (!value || typeof value !== 'object') return false;
  const row = value as RecentWorkspace;
  if (row.schemaVersion !== 1 || typeof row.id !== 'string' || typeof row.name !== 'string' || !Number.isFinite(row.openedAt)) return false;
  if (row.kind === 'drive') return typeof row.fileId === 'string' && typeof row.accountId === 'string' && Array.isArray(row.folderIds) && row.folderIds.every((id) => typeof id === 'string');
  if (row.kind === 'local-handle') return typeof row.workspaceId === 'string' && !!row.handle && typeof row.handle.getFile === 'function';
  return row.kind === 'local-fallback' && typeof row.workspaceId === 'string';
}

export class RecentWorkspaces {
  constructor(private store: RecentStore, private readonly now = () => Date.now(), private readonly id: () => string = () => crypto.randomUUID()) {}
  private async entries() { return (await this.store.list()).sort((a, b) => b.openedAt - a.openedAt).slice(0, 12); }
  list() { return this.entries(); }
  async addDrive(fileId: string, name: string, folderIds: string[], accountId: string, resourceKey?: string) {
    const entries = await this.entries();
    const old = entries.find((item) => item.kind === 'drive' && item.fileId === fileId && item.accountId === accountId);
    const entry: RecentWorkspace = { schemaVersion: 1, id: old?.id ?? this.id(), kind: 'drive', fileId, name, folderIds, accountId, openedAt: this.now(), ...(resourceKey ? { resourceKey } : {}) };
    await this.store.put(entry);
    await this.trim();
    return entry;
  }
  async addLocal(name: string, workspaceId: string, handle: LocalHandle | null) {
    const entries = await this.entries();
    let old: RecentWorkspace | undefined;
    if (handle) {
      for (const item of entries) {
        if (item.kind !== 'local-handle') continue;
        const same = (handle as LocalHandle & { isSameEntry?: (other: LocalHandle) => Promise<boolean> }).isSameEntry;
        if (item.handle === handle || (same && await same.call(handle, item.handle))) { old = item; break; }
      }
    }
    const entry: RecentWorkspace = { schemaVersion: 1, id: old?.id ?? this.id(), kind: handle ? 'local-handle' : 'local-fallback', name, workspaceId, openedAt: this.now(), ...(handle ? { handle } : {}) } as RecentWorkspace;
    await this.store.put(entry);
    await this.trim();
    return entry;
  }
  remove(id: string) { return this.store.remove(id); }
  async removeDriveAccount(accountId: string) {
    for (const entry of await this.entries()) if (entry.kind === 'drive' && entry.accountId === accountId) await this.store.remove(entry.id);
  }
  private async trim() {
    const entries = (await this.store.list()).sort((a, b) => b.openedAt - a.openedAt);
    for (const entry of entries.slice(12)) await this.store.remove(entry.id);
  }
}
