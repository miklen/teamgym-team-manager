export interface AccountReference {
  permissionId: string;
  email: string;
  name: string;
}
export interface FileReference {
  id: string;
  name: string;
  folderIds: string[];
}
export interface RememberedConnection {
  schemaVersion: 1;
  token: string | null;
  receivedAt: number;
  expiresAt: number;
  scopes: string[];
  account: AccountReference;
  file: FileReference | null;
}
export interface ConnectionRecord {
  epoch: string;
  connection: RememberedConnection | null;
}
export interface ConnectionStore {
  read(): Promise<ConnectionRecord>;
  /** Atomisk sammenligning med fælles epoch; gamle asynkrone svar kan ikke genoprette adgang. */
  write(connection: RememberedConnection, expectedEpoch: string): Promise<boolean>;
  clear(): Promise<string>;
}

function validConnection(value: unknown): value is RememberedConnection {
  if (!value || typeof value !== 'object') return false;
  const row = value as RememberedConnection;
  return (
    row.schemaVersion === 1 &&
    (typeof row.token === 'string' || row.token === null) &&
    Number.isFinite(row.receivedAt) &&
    Number.isFinite(row.expiresAt) &&
    row.expiresAt >= row.receivedAt &&
    Array.isArray(row.scopes) &&
    row.scopes.every((scope) => typeof scope === 'string') &&
    !!row.account &&
    typeof row.account.permissionId === 'string' &&
    typeof row.account.email === 'string' &&
    typeof row.account.name === 'string' &&
    (row.file === null ||
      (typeof row.file?.id === 'string' &&
        typeof row.file.name === 'string' &&
        Array.isArray(row.file.folderIds) &&
        row.file.folderIds.every((id) => typeof id === 'string')))
  );
}

export class IndexedConnectionStore implements ConnectionStore {
  private database: Promise<IDBDatabase> | undefined;
  constructor(private readonly factory?: IDBFactory) {}
  private db() {
    return (this.database ??= new Promise<IDBDatabase>((resolve, reject) => {
      const factory = this.factory ?? globalThis.indexedDB;
      if (!factory) {
        reject(new Error('Browserlageret er utilgængeligt.'));
        return;
      }
      const request = factory.open('teamgym-team-manager.connection.v1', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('connection');
      request.onsuccess = () => {
        request.result.onversionchange = () => request.result.close();
        resolve(request.result);
      };
      request.onerror = () => reject(new Error('Browserlageret kunne ikke åbnes.'));
      request.onblocked = () => reject(new Error('Browserlageret er blokeret.'));
    }));
  }
  private async transaction<T>(
    action: (store: IDBObjectStore, row: ConnectionRecord, done: (value: T) => void) => void,
  ): Promise<T> {
    const db = await this.db();
    return new Promise<T>((resolve, reject) => {
      const transaction = db.transaction('connection', 'readwrite');
      const store = transaction.objectStore('connection');
      let result: T;
      transaction.oncomplete = () => resolve(result);
      transaction.onerror = transaction.onabort = () =>
        reject(new Error('Forbindelsen kunne ikke huskes i browseren.'));
      const request = store.get('active');
      request.onsuccess = () => {
        const raw = request.result as Partial<ConnectionRecord> | undefined;
        const row: ConnectionRecord = {
          epoch: typeof raw?.epoch === 'string' ? raw.epoch : crypto.randomUUID(),
          connection: validConnection(raw?.connection) ? raw.connection : null,
        };
        if (!raw?.epoch) store.put(row, 'active');
        action(store, row, (value) => {
          result = value;
        });
      };
    });
  }
  read() {
    return this.transaction<ConnectionRecord>((_store, row, done) => done(row));
  }
  write(connection: RememberedConnection, expectedEpoch: string) {
    return this.transaction<boolean>((store, row, done) => {
      if (row.epoch !== expectedEpoch) {
        done(false);
        return;
      }
      store.put({ epoch: row.epoch, connection }, 'active');
      done(true);
    });
  }
  clear() {
    return this.transaction<string>((store, _row, done) => {
      const epoch = crypto.randomUUID();
      store.put({ epoch, connection: null }, 'active');
      done(epoch);
    });
  }
}

export class MemoryConnectionStore implements ConnectionStore {
  private row: ConnectionRecord = { epoch: crypto.randomUUID(), connection: null };
  async read() {
    return structuredClone(this.row);
  }
  async write(connection: RememberedConnection, epoch: string) {
    if (epoch !== this.row.epoch) return false;
    this.row.connection = structuredClone(connection);
    return true;
  }
  async clear() {
    this.row = { epoch: crypto.randomUUID(), connection: null };
    return this.row.epoch;
  }
}
