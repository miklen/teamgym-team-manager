import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('..', import.meta.url));
mkdirSync(join(root, 'tmp'), { recursive: true });
const target = mkdtempSync(join(root, 'tmp', 'rule-mutations-'));
if (relative(root, target).startsWith('..')) throw new Error('Testkopien ligger uden for projektet.');
for (const path of ['packages/rules', 'tests', 'openspec/changes/build-teamgym-team-manager/reference', 'vitest.config.ts', 'tsconfig.json']) {
  cpSync(join(root, path), join(target, path), { recursive: true });
}
const mutations = [
  { id: 'junior-360-instead-of-540', file: 'packages/rules/src/dk-numeric.ts', before: "ageGroup === 'U14' ? 2 : 3", after: "ageGroup === 'U14' ? 2 : 2", evidence: 'C03' },
  { id: 'wrong-flic-rate', file: 'packages/rules/src/dk-spring.ts', before: "flic: '0.20'", after: "flic: '0.30'", evidence: 'D01' },
  { id: 'count-repeated-flic-twice', file: 'packages/rules/src/dk-numeric.ts', before: 'unique.set(element.identity, element);', after: 'unique.set(`${element.identity}:${unique.size}`, element);', evidence: 'D03' },
  { id: 'filter-c-by-adjusted-d', file: 'packages/rules/src/dk-engine.ts', before: 'else item.adjustedD = item.originalD;', after: 'else item.adjustedD = item.originalD; item.eligibleForC = item.eligibleForC && Boolean(item.adjustedD.value?.compare(0));', evidence: '5/1' },
];
const results = [];
for (const mutation of mutations) {
  const file = resolve(target, mutation.file);
  const original = readFileSync(file, 'utf8');
  if (original.split(mutation.before).length !== 2) throw new Error(`Mutationspunktet er ændret: ${mutation.id}`);
  try {
    writeFileSync(file, original.replace(mutation.before, mutation.after));
    const test = spawnSync(process.execPath, [join(root, 'node_modules/vitest/vitest.mjs'), 'run', 'tests/domain/rule-fixtures.test.ts', 'tests/domain/spring-engine.test.ts', '--reporter=dot'], { cwd: target, encoding: 'utf8', timeout: 60000 });
    const log = `${test.stdout ?? ''}\n${test.stderr ?? ''}`;
    const detected = test.status !== 0 && /AssertionError/.test(log) && log.includes(mutation.evidence);
    results.push({ id: mutation.id, detected, assertionEvidence: mutation.evidence, exitCode: test.status });
    if (!detected) { writeFileSync(join(target, `${mutation.id}.log`), log); throw new Error(`Mutationen blev ikke fanget af den tilsigtede facitkontrol: ${mutation.id}`); }
    console.info(`${mutation.id}: fanget af assertions (${mutation.evidence})`);
  } finally { writeFileSync(file, original); }
}
writeFileSync(join(target, 'report.json'), JSON.stringify({ method: 'Isoleret kodekopi, fire bevidste fejl, samme implementeringsagent; ingen ekstern dommergodkendelse.', results }, null, 2));
console.info('4/4 bevidste regelmutationer fanget. Produktionskoden er ikke ændret af kontrollen.');
