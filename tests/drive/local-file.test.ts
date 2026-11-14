import { describe, expect, it } from 'vitest';
import { createTeam, createWorkspace, serializeWorkspace } from '@teamgym/domain';
import { openLocalHandle, readLocalFile, saveLocalHandle, saveNewLocalHandle } from '@teamgym/drive';
import type { LocalHandle } from '@teamgym/drive';

const binding = { rulesetId: 'dk', packageVersion: '1.0.0', ageGroup: 'junior', teamType: 'girls' };
function fileHandle(initial = '') {
  let bytes = initial;
  let permission: PermissionState = 'granted';
  let missing = false;
  let writes = 0;
  const handle: LocalHandle = {
    name: 'syntetisk.json',
    async getFile() {
      if (missing) throw new DOMException('missing', 'NotFoundError');
      return new File([bytes], this.name, { type: 'application/json' });
    },
    async queryPermission() { return permission; },
    async requestPermission() { return permission; },
    async createWritable() {
      let next = '';
      return {
        async write(value: string) { next = value; },
        async close() { bytes = next; writes++; },
      };
    },
  };
  return {
    handle,
    get bytes() { return bytes; },
    get writes() { return writes; },
    replace(value: string) { bytes = value; },
    permission(value: PermissionState) { permission = value; },
    missing() { missing = true; },
  };
}

describe('lokalt filhåndtag', () => {
  it('læser, skriver til samme fil og efterlæser det bekræftede snapshot', async () => {
    const original = createWorkspace();
    const source = fileHandle(serializeWorkspace(original));
    const opened = await openLocalHandle(source.handle);
    const draft = createTeam(opened.workspace, 'Syntetisk hold', binding);
    const saved = await saveLocalHandle(source.handle, opened.basisBytes, draft, null);
    expect(saved.workspace.teams[0]?.name).toBe('Syntetisk hold');
    expect(saved.basisBytes).toBe(source.bytes);
    expect(source.writes).toBe(1);
  });

  it('afviser nægtet adgang, ekstern ændring og manglende fil uden skrivning', async () => {
    const original = createWorkspace();
    const source = fileHandle(serializeWorkspace(original));
    const opened = await openLocalHandle(source.handle);
    const draft = createTeam(original, 'Syntetisk hold', binding);
    source.permission('denied');
    await expect(saveLocalHandle(source.handle, opened.basisBytes, draft, null)).rejects.toMatchObject({ code: 'permission' });
    source.permission('granted');
    source.replace(serializeWorkspace(draft));
    await expect(saveLocalHandle(source.handle, opened.basisBytes, draft, null)).rejects.toMatchObject({ code: 'conflict' });
    source.missing();
    await expect(saveLocalHandle(source.handle, opened.basisBytes, draft, null)).rejects.toMatchObject({ code: 'missing' });
    expect(source.writes).toBe(0);
  });

  it('bevarer valgt fil og kladde ved ugyldig fil og afviser ny fil med indhold', async () => {
    const source = fileHandle('{');
    await expect(openLocalHandle(source.handle)).rejects.toThrow('ugyldig JSON');
    await expect(saveNewLocalHandle(source.handle, createWorkspace(), null)).rejects.toMatchObject({ code: 'conflict' });
    expect(source.bytes).toBe('{');
    const raw = new File([serializeWorkspace(createWorkspace())], 'test.json');
    expect((await readLocalFile(raw)).handle).toBeNull();
  });

  it('skelner annulleret filvalg fra nægtet læseadgang', async () => {
    const cancelled = fileHandle();
    cancelled.handle.getFile = async () => { throw new DOMException('cancelled', 'AbortError'); };
    await expect(openLocalHandle(cancelled.handle)).rejects.toMatchObject({ code: 'cancelled' });
    const denied = fileHandle(serializeWorkspace(createWorkspace()));
    denied.permission('denied');
    await expect(openLocalHandle(denied.handle)).rejects.toMatchObject({ code: 'permission' });
  });
});
