import { describe, expect, it } from 'vitest';
import { MemoryRecentStore, RecentWorkspaces } from '@teamgym/drive';
import type { LocalHandle, RecentStore } from '@teamgym/drive';

function recent(store: RecentStore = new MemoryRecentStore()) {
  let tick = 0;
  return new RecentWorkspaces(store, () => ++tick, () => `ref-${tick}`);
}

describe('Seneste-referencer', () => {
  it('holder Drive-identitet adskilt fra ens navne og fra konti', async () => {
    const list = recent();
    await list.addDrive('file-a', 'Samme.json', ['folder'], 'account-a');
    await list.addDrive('file-b', 'Samme.json', ['folder'], 'account-a');
    await list.addDrive('file-a', 'Samme.json', ['other'], 'account-b');
    await list.addDrive('file-a', 'Omdøbt.json', ['folder'], 'account-a');
    const entries = await list.list();
    expect(entries).toHaveLength(3);
    expect(entries.filter((item) => item.kind === 'drive' && item.fileId === 'file-a')).toHaveLength(2);
    expect(entries.find((item) => item.kind === 'drive' && item.accountId === 'account-a' && item.fileId === 'file-a')?.name).toBe('Omdøbt.json');
    expect(JSON.stringify(entries)).not.toContain('workspaceId');
    await list.removeDriveAccount('account-a');
    expect(await list.list()).toMatchObject([{ accountId: 'account-b' }]);
  });

  it('fjerner kun en reference og deduplikerer samme filhåndtag', async () => {
    const store = new MemoryRecentStore();
    const list = recent(store);
    const handle = { name: 'lokal.json', getFile: async () => new File([], 'lokal.json') } as LocalHandle;
    await list.addLocal('lokal.json', 'workspace-a', handle);
    await list.addLocal('omdøbt.json', 'workspace-a', handle);
    expect(await list.list()).toHaveLength(1);
    const id = (await list.list())[0]!.id;
    await list.remove(id);
    expect(await list.list()).toHaveLength(0);
    expect((await handle.getFile()).name).toBe('lokal.json');
  });

  it('sender lagerfejl videre uden at opfinde en gemt post', async () => {
    const store: RecentStore = {
      list: async () => { throw new Error('lagerfejl'); },
      put: async () => { throw new Error('lagerfejl'); },
      remove: async () => { throw new Error('lagerfejl'); },
    };
    await expect(recent(store).addDrive('file', 'Test', [], 'account')).rejects.toThrow('lagerfejl');
  });
});
