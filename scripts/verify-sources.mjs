import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const referenceRoot = new URL('../openspec/changes/archive/2026-10-25-build-teamgym-team-manager/reference/', import.meta.url);
const repositoryRoot = new URL('../', import.meta.url);
const regManifest = new URL('../packages/rules/data/reg/sources.json', import.meta.url);

function check(source, bytes, label) {
  const hash = createHash('sha256').update(bytes).digest('hex').toUpperCase();
  if (hash !== source.sha256 || bytes.length !== source.bytes) {
    throw new Error(`${label} ${source.id} afviger fra fastlåste bytes. Stop; ingen automatisk hentning.`);
  }
}

export function verifySources(root = referenceRoot) {
  const manifest = JSON.parse(readFileSync(new URL('source-manifest.json', root), 'utf8'));
  if (manifest.sources.length !== 8) throw new Error('Kildegrundlaget skal indeholde otte PDF-filer.');
  for (const source of manifest.sources) check(source, readFileSync(new URL(source.file, root)), 'Kilde');
  return manifest.sources.length;
}

/** REG-pakkens kilder: H, A3, A4, A5, A6, TR og A1.2. Stier er relative til repoets rod. */
export function verifyRegSources(readFile = (file) => readFileSync(new URL(file, repositoryRoot))) {
  const manifest = JSON.parse(readFileSync(regManifest, 'utf8'));
  const ids = manifest.sources.map((source) => source.id).sort().join(',');
  if (ids !== 'A1.2,A3,A4,A5,A6,H,TR') throw new Error('REG-kildegrundlaget skal være H, A3, A4, A5, A6, TR og A1.2.');
  for (const source of manifest.sources) check(source, readFile(source.file), 'REG-kilde');
  return manifest.sources.length;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  console.info(`${verifySources()} fastlåste PDF-kilder: SHA-256 og størrelse stemmer.`);
  console.info(`${verifyRegSources()} fastlåste REG-kilder: SHA-256 og størrelse stemmer.`);
}
