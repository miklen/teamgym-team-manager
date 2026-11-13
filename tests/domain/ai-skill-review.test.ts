import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { sourceFingerprint, verifyAiSkill } from '../../scripts/verify-ai-skill.mjs';

it('kræver semantisk review ved ny skemaversion eller ændret inddatarelevant kilde', () => {
  expect(() => verifyAiSkill()).not.toThrow();
  const original = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url));
  const schemaChange = (path: string) => path.endsWith('/schema.ts')
    ? Buffer.from(original(path).toString().replace('CURRENT_SCHEMA_VERSION = 7', 'CURRENT_SCHEMA_VERSION = 8'))
    : original(path);
  const catalogChange = (path: string) => path.endsWith('/spring-rules.ts')
    ? Buffer.concat([original(path), Buffer.from('\n// syntetisk regelændring\n')])
    : original(path);
  expect(sourceFingerprint(schemaChange)).not.toBe(sourceFingerprint());
  expect(sourceFingerprint(catalogChange)).not.toBe(sourceFingerprint());
  expect(() => verifyAiSkill(schemaChange)).toThrow(/semantisk kilde/);
  expect(() => verifyAiSkill(catalogChange)).toThrow(/semantisk kilde/);
});
