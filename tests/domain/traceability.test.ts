import { existsSync } from 'node:fs';
import { expect, it } from 'vitest';
import fixtures from '../../openspec/changes/build-teamgym-team-manager/reference/fixtures.json';
import { ADDITIONAL_TRACE, RULE_TRACE } from '../../packages/rules/src/traceability';

it('hver matrixregel og alle facitregler har kode-/testspor med bevaret kilde, tælleunivers og status', () => {
  expect(RULE_TRACE).toHaveLength(24);
  const rules = new Set([...RULE_TRACE, ...ADDITIONAL_TRACE].map((rule) => rule.id));
  for (const fixture of fixtures.cases) expect(rules.has(fixture.rule), fixture.id).toBe(true);
  for (const rule of RULE_TRACE) {
    expect(rule.sources.length).toBeGreaterThan(0);
    expect(rule.inputUniverseAndFormula.length).toBeGreaterThan(20);
    expect(rule.statusAndFacit.length).toBeGreaterThan(0);
    for (const file of rule.code) {
      const path = file.startsWith('../domain/') ? file.replace('../domain/', '../../domain/') : file;
      expect(existsSync(new URL(`../../packages/rules/src/${path}`, import.meta.url)), `${rule.id}: ${file}`).toBe(true);
    }
    for (const file of rule.tests) expect(existsSync(new URL(file, import.meta.url)), `${rule.id}: ${file}`).toBe(true);
  }
});
