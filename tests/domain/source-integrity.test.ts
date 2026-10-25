import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import manifest from '../../openspec/changes/archive/2026-10-25-build-teamgym-team-manager/reference/source-manifest.json';

const root = new URL('../../openspec/changes/archive/2026-10-25-build-teamgym-team-manager/reference/', import.meta.url);

describe('kildegrundlag uden parent-filer eller netværk', () => {
  it('bevarer alle otte forskellige kildeidentiteter', () => {
    expect(new Set(manifest.sources.map((source) => source.id)).size).toBe(8);
  });

  it.each(manifest.sources)('$id: fastlåste bytes og SHA-256', (source) => {
    const bytes = readFileSync(new URL(source.file, root));
    expect(bytes.length).toBe(source.bytes);
    expect(createHash('sha256').update(bytes).digest('hex').toUpperCase()).toBe(source.sha256);
  });
});
