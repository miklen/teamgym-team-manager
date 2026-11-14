import { describe, expect, it } from 'vitest';
import { createTeam, createWorkspace, serializeWorkspace } from '@teamgym/domain';
import { parseLocalWorkspace, serializeLocalWorkspace } from '@teamgym/drive';

const binding = { rulesetId: 'dk', packageVersion: '1.0.0', ageGroup: 'junior', teamType: 'girls' };

describe('lokal arbejdsrumsfil', () => {
  it('læser råt format 7 og rundtur af en Drive-kopi uden at ændre basis', () => {
    const base = createWorkspace();
    const local = createTeam(base, 'Syntetisk hold', binding);
    expect(parseLocalWorkspace(serializeWorkspace(local))).toMatchObject({ workspace: local, origin: null });
    const bytes = serializeLocalWorkspace(local, { fileId: 'source-42', base });
    const opened = parseLocalWorkspace(bytes);
    expect(opened).toMatchObject({ workspace: local, origin: { fileId: 'source-42', base } });
    expect(opened.origin?.base.teams).toHaveLength(0);
    expect(JSON.parse(serializeWorkspace(opened.workspace))).not.toHaveProperty('origin');
  });

  it('afviser beskadiget indpakning og en basis fra et andet arbejdsrum', () => {
    const base = createWorkspace();
    const other = createWorkspace();
    const valid = JSON.parse(serializeLocalWorkspace(base, { fileId: 'source', base }));
    expect(() => parseLocalWorkspace('{')).toThrow('ugyldig JSON');
    expect(() => parseLocalWorkspace(JSON.stringify({ ...valid, version: 2 }))).toThrow('ukendt');
    expect(() => parseLocalWorkspace(JSON.stringify({ ...valid, origin: { fileId: 'source', base: other } }))).toThrow('andet arbejdsrum');
    expect(() => parseLocalWorkspace(JSON.stringify({ ...valid, workspace: { ...base, schemaVersion: 99 } }))).toThrow();
  });

  it('bevarer ældre rå formats originale bytes til en særskilt migration', () => {
    const old = { ...createWorkspace(), schemaVersion: 6 };
    const bytes = JSON.stringify(old);
    const opened = parseLocalWorkspace(bytes);
    expect(opened.sourceSchemaVersion).toBe(6);
    expect(opened.originalBytes).toBe(bytes);
    expect(opened.workspace.schemaVersion).toBe(7);
  });
});
