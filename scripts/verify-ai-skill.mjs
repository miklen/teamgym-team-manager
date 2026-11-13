import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = new URL('../', import.meta.url);
const reviewFile = new URL('../apps/web/public/teamgym-data-entry/references/source-review-v7.json', import.meta.url);

/** Every source here affects an input identity, field, inheritance rule, catalogue lookup or round constraint. */
export const sources = [
  'packages/domain/src/schema.ts',
  'packages/domain/src/workspace.ts',
  'packages/domain/src/identity.ts',
  'packages/domain/src/commands.ts',
  'packages/domain/src/inheritance.ts',
  'packages/domain/src/stability.ts',
  'packages/domain/src/spotting.ts',
  'packages/domain/src/twist.ts',
  'packages/rules/src/catalog.ts',
  'packages/rules/src/dk-data.ts',
  'packages/rules/src/dk-v1.ts',
  'packages/rules/src/reg-v1.ts',
  'packages/rules/src/spring-rules.ts',
  'packages/rules/src/rhythm.ts',
  'packages/rules/src/practical-connections.ts',
  'apps/web/src/spring-library.ts',
  'apps/web/src/spring-connections.ts',
  'apps/web/src/foundation-catalog-model.ts',
  'apps/web/src/spring-picker-model.ts',
  'apps/web/src/spring-names.ts',
  'apps/web/src/twist-choice.ts',
  'apps/web/src/twist-split.tsx',
  'apps/web/src/rhythm.tsx',
];

export function sourceFingerprint(read = (path) => readFileSync(new URL(path, root))) {
  const hash = createHash('sha256');
  for (const path of sources) {
    hash.update(path);
    hash.update('\0');
    hash.update(read(path));
    hash.update('\0');
  }
  return hash.digest('hex');
}

export function verifyAiSkill(read = (path) => readFileSync(new URL(path, root))) {
  const review = JSON.parse(readFileSync(reviewFile, 'utf8'));
  if (review.schemaVersion !== 7 || JSON.stringify(review.sources) !== JSON.stringify(sources) || review.fingerprint !== sourceFingerprint(read)) {
    throw new Error('AI-inddatastrukturen eller en semantisk kilde er ændret. Gennemgå skill, referencer og syntetiske adfærdsprøver før review-fingerprint opdateres.');
  }
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  if (process.argv.includes('--write-review')) {
    writeFileSync(reviewFile, `${JSON.stringify({ schemaVersion: 7, sources, fingerprint: sourceFingerprint() }, null, 2)}\n`);
  } else {
    verifyAiSkill();
  }
}
