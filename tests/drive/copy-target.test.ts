import { describe, expect, it } from 'vitest';
import { createTeam, createWorkspace, workspacePayload } from '@teamgym/domain';
import { overwriteDriveTarget } from '@teamgym/drive';
import type { LoadedWorkspace, WorkspaceClient } from '@teamgym/drive';

const binding = { rulesetId: 'dk', packageVersion: '1.0.0', ageGroup: 'junior', teamType: 'girls' };
function targetClient() {
  let target = createWorkspace();
  let version = 1;
  let lost = false;
  let writable = true;
  let uploads = 0;
  const read = async (fileId: string): Promise<LoadedWorkspace> => ({
    workspace: structuredClone(target),
    metadata: { id: fileId, name: 'Samme.json', folderIds: ['folder'], mimeType: 'application/json', etag: `"${version}"`, version: String(version), writable, canAddChildren: false },
    basis: { fileId, etag: `"${version}"`, version: String(version), contentHash: 'synthetic', workspaceRevision: target.revision },
  });
  const client: WorkspaceClient = {
    read,
    async upload(basis, workspace) {
      uploads++;
      if (basis.version !== String(version)) throw new Error('stale');
      target = structuredClone(workspace);
      version++;
      if (lost) { lost = false; throw new Error('response lost'); }
    },
  };
  return { client, read, get target() { return target; }, get uploads() { return uploads; }, change() { target = createTeam(target, 'Anden træner', binding); version++; }, drop() { lost = true; }, deny() { writable = false; } };
}

describe('Gem som til eksisterende Drive-fil', () => {
  it('erstatter præcis valgt fil og bevarer kildeobjekt og arbejdsrumsidentitet', async () => {
    const source = targetClient();
    const target = await source.read('file-b');
    const draft = createTeam(createWorkspace(), 'Syntetisk kilde', binding);
    const before = structuredClone(draft);
    const saved = await overwriteDriveTarget(source.client, target, draft, () => '2026-11-14T10:00:00.000Z', () => 'operation-1');
    expect(saved.basis.fileId).toBe('file-b');
    expect(saved.workspace.workspaceId).toBe(draft.workspaceId);
    expect(workspacePayload(saved.workspace)).toBe(workspacePayload(draft));
    expect(draft).toEqual(before);
    expect(source.uploads).toBe(1);
  });

  it('afviser ændring siden advarsel, før upload', async () => {
    const source = targetClient();
    const target = await source.read('file-a');
    source.change();
    const newer = structuredClone(source.target);
    await expect(overwriteDriveTarget(source.client, target, createWorkspace())).rejects.toMatchObject({ code: 'conflict' });
    expect(source.target).toEqual(newer);
    expect(source.uploads).toBe(0);
  });

  it('genkender gennemført operation efter mistet svar uden en ekstra upload', async () => {
    const source = targetClient();
    const target = await source.read('file-a');
    source.drop();
    const saved = await overwriteDriveTarget(source.client, target, createWorkspace());
    expect(saved.workspace.recentOperations).toHaveLength(1);
    expect(source.uploads).toBe(1);
  });

  it('afviser bortfaldet skriverettighed uden at ændre målfilen', async () => {
    const source = targetClient();
    const target = await source.read('file-a');
    source.deny();
    await expect(overwriteDriveTarget(source.client, target, createWorkspace())).rejects.toMatchObject({ code: 'permission' });
    expect(source.uploads).toBe(0);
  });
});
