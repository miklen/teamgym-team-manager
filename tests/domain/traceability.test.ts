import { existsSync } from 'node:fs';
import { expect, it } from 'vitest';
import fixtures from '../../openspec/changes/archive/2026-10-25-build-teamgym-team-manager/reference/fixtures.json';
import { ADDITIONAL_TRACE, RULE_TRACE } from '../../packages/rules/src/traceability';
import { DK_V1, DK_V2 } from '../../packages/rules/src/dk-v1';

it('kendt tvivl linker til en konkret side i en fastlåst kilde', () => {
  const withoutLockedSource = new Set(['A71-U01']);
  for (const rulePackage of [DK_V1, DK_V2]) {
    for (const issue of rulePackage.knownIssues) {
      if (withoutLockedSource.has(issue.id)) continue;
      expect(issue.sources.length, issue.id).toBeGreaterThan(0);
      for (const source of issue.sources) {
        const file = rulePackage.manifest.sources.find((item) => item.id === source.sourceId);
        expect(file, `${issue.id}: ${source.sourceId}`).toBeDefined();
        expect(existsSync(new URL(`../../openspec/changes/archive/2026-10-25-build-teamgym-team-manager/reference/${file!.file}`, import.meta.url)), `${issue.id}: ${file!.file}`).toBe(true);
        expect(Number.isInteger(source.page) && source.page! > 0, `${issue.id}: ${source.section}`).toBe(true);
      }
    }
  }
});

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
