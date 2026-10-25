import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const referenceRoot = new URL('../openspec/changes/archive/2026-10-25-build-teamgym-team-manager/reference/', import.meta.url);

export function verifySources(root = referenceRoot) {
  const manifest = JSON.parse(readFileSync(new URL('source-manifest.json', root), 'utf8'));
  if (manifest.sources.length !== 8) throw new Error('Kildegrundlaget skal indeholde otte PDF-filer.');
  for (const source of manifest.sources) {
    const bytes = readFileSync(new URL(source.file, root));
    const hash = createHash('sha256').update(bytes).digest('hex').toUpperCase();
    if (hash !== source.sha256 || bytes.length !== source.bytes) {
      throw new Error(`Kilde ${source.id} afviger fra fastlåste bytes. Stop; ingen automatisk hentning.`);
    }
  }
  return manifest.sources.length;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.info(`${verifySources()} fastlåste PDF-kilder: SHA-256 og størrelse stemmer.`);
}
