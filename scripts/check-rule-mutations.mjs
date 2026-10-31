import { cpSync, mkdtempSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = fileURLToPath(new URL('..', import.meta.url));
mkdirSync(join(root, 'tmp'), { recursive: true });
const target = mkdtempSync(join(root, 'tmp', 'rule-mutations-'));
if (relative(root, target).startsWith('..')) throw new Error('Testkopien ligger uden for projektet.');
for (const path of ['packages/rules', 'tests', 'openspec/changes/archive/2026-10-25-build-teamgym-team-manager/reference', 'tools/verify-a12', 'vitest.config.ts', 'tsconfig.json']) {
  cpSync(join(root, path), join(target, path), { recursive: true });
}
const DK_TESTS = ['tests/domain/rule-fixtures.test.ts', 'tests/domain/spring-engine.test.ts'];
const REG_TESTS = ['tests/domain/reg-fixtures.test.ts', 'tests/domain/reg-rhythm.test.ts'];
const mutations = [
  { id: 'junior-360-instead-of-540', file: 'packages/rules/src/spring-rules.ts', before: 'minHalfTurnsByAgeGroup: { U14: 2, junior: 3, senior: 3 }', after: 'minHalfTurnsByAgeGroup: { U14: 2, junior: 2, senior: 3 }', evidence: 'C03' },
  { id: 'wrong-flic-rate', file: 'packages/rules/src/dk-spring.ts', before: "flic: '0.20'", after: "flic: '0.30'", evidence: 'D01' },
  { id: 'count-repeated-flic-twice', file: 'packages/rules/src/dk-numeric.ts', before: 'unique.set(element.identity, element);', after: 'unique.set(`${element.identity}:${unique.size}`, element);', evidence: 'D03' },
  { id: 'filter-c-by-adjusted-d', file: 'packages/rules/src/dk-engine.ts', before: 'else item.adjustedD = item.originalD;', after: 'else item.adjustedD = item.originalD; item.eligibleForC = item.eligibleForC && Boolean(item.adjustedD.value?.compare(0));', evidence: '5/1' },
  // REG (design beslutning 5.4): hver mutation skal fanges af den navngivne REG-facitcase.
  { id: 'reg-twist-rate-0.1', file: 'packages/rules/src/spring-rules.ts', before: "rate: '0.2', minHalfTurnsByAgeGroup: { U11: 1, U14: 2, junior: 2 }", after: "rate: '0.1', minHalfTurnsByAgeGroup: { U11: 1, U14: 2, junior: 2 }", evidence: 'REG-F04', tests: REG_TESTS },
  { id: 'reg-order-deduction-on', file: 'packages/rules/src/spring-rules.ts', edits: [
    { before: "order: null }, orderDeduction: false, flowDeduction: false,\n    twistBonus: { rate: '0.2', minHalfTurnsByAgeGroup: { U11: 2", after: "order: '0.1' }, orderDeduction: true, flowDeduction: false,\n    twistBonus: { rate: '0.2', minHalfTurnsByAgeGroup: { U11: 2" },
    { before: "'C-GENTAG': h('9.2.2.3', 30), 'C-RETNING'", after: "'C-GENTAG': h('9.2.2.3', 30), 'C-ORDEN': h('9.2.2.2', 30), 'C-RETNING'" },
  ], evidence: 'REG-F13', tests: REG_TESTS },
  { id: 'reg-u11-twist-360', file: 'packages/rules/src/spring-rules.ts', before: 'minHalfTurnsByAgeGroup: { U11: 1, U14: 2, junior: 2 }', after: 'minHalfTurnsByAgeGroup: { U11: 2, U14: 2, junior: 2 }', evidence: 'REG-F06', tests: REG_TESTS },
  { id: 'reg-pegasus-whitelist-widened', file: 'packages/rules/src/spring-rules.ts', before: "apparatusWhitelist: ['cartwheel-vault', 'handspring-vault']", after: "apparatusWhitelist: ['cartwheel-vault', 'handspring-vault', 'salto']", evidence: 'REG-F11', tests: REG_TESTS },
  { id: 'reg-f402-0.1', file: 'packages/rules/data/reg/rhythm-catalog.csv', before: 'rh-f-pike-fold-45;F402;F;11;0.30;', after: 'rh-f-pike-fold-45;F402;F;11;0.10;', evidence: 'F402', tests: REG_TESTS },
  { id: 'reg-max-extra-2', file: 'packages/rules/src/spring-rules.ts', before: 'participants: { counting: 6, maxExtra: 6,', after: 'participants: { counting: 6, maxExtra: 2,', evidence: 'REG-F15', tests: REG_TESTS },
];
const results = [];
for (const mutation of mutations) {
  const file = resolve(target, mutation.file);
  const original = readFileSync(file, 'utf8');
  const edits = mutation.edits ?? [{ before: mutation.before, after: mutation.after }];
  let mutated = original;
  for (const edit of edits) {
    if (mutated.split(edit.before).length !== 2) throw new Error(`Mutationspunktet er ændret: ${mutation.id}`);
    mutated = mutated.replace(edit.before, edit.after);
  }
  try {
    writeFileSync(file, mutated);
    const test = spawnSync(process.execPath, [join(root, 'node_modules/vitest/vitest.mjs'), 'run', ...(mutation.tests ?? DK_TESTS), '--reporter=dot'], { cwd: target, encoding: 'utf8', timeout: 60000 });
    const log = `${test.stdout ?? ''}\n${test.stderr ?? ''}`;
    const detected = test.status !== 0 && /AssertionError/.test(log) && log.includes(mutation.evidence);
    results.push({ id: mutation.id, detected, assertionEvidence: mutation.evidence, exitCode: test.status });
    if (!detected) { writeFileSync(join(target, `${mutation.id}.log`), log); throw new Error(`Mutationen blev ikke fanget af den tilsigtede facitkontrol: ${mutation.id}`); }
    console.info(`${mutation.id}: fanget af assertions (${mutation.evidence})`);
  } finally { writeFileSync(file, original); }
}
writeFileSync(join(target, 'report.json'), JSON.stringify({ method: `Isoleret kodekopi, ${mutations.length} bevidste fejl, samme implementeringsagent; ingen ekstern dommergodkendelse.`, results }, null, 2));
console.info(`${results.length}/${mutations.length} bevidste regelmutationer fanget. Produktionskoden er ikke ændret af kontrollen.`);
