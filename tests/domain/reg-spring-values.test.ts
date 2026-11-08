import { existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Fraction } from '@teamgym/domain';
import type { SkillDefinition } from '@teamgym/domain';
import springValuesCsv from '../../packages/rules/data/reg/spring-values.csv?raw';
import { DK_SPRING_CATALOG, readRows } from '../../packages/rules/src/catalog';
import { REG_V1 } from '../../packages/rules/src/reg-v1';
import { fromRows } from '../fixtures/rule-workspace';

/* REG-værdierne i spring-values.csv er udledt af H 9.3.5/10.3.5 og kontrolleret mod renderede sider (spring-values-checklist.md). */
type Spring = Exclude<SkillDefinition, { discipline: 'rhythm' }>;
const rows = readRows(springValuesCsv);

function skillFor(referenceId: string): Spring {
  if (referenceId.startsWith('a3-')) return fromRows([referenceId], `reg-value-${referenceId}`);
  const source = DK_SPRING_CATALOG.find((item) => item.referenceId === referenceId)!;
  return { id: `reg-value-${referenceId}`, name: `Syntetisk ${referenceId}`, archived: false, discipline: 'trampet', jump: structuredClone(source.execution) };
}

describe('REG-springværdier (H 9.3.5 s. 34 og 10.3.5 s. 43)', () => {
  it('dækker alle 103 A3/A4-rækker: 44 tilladte og 59 ikke tilladte', () => {
    expect(rows).toHaveLength(103);
    expect(rows.filter((row) => row.reg_status === 'allowed')).toHaveLength(44);
    expect(rows.filter((row) => row.reg_status === 'forbidden')).toHaveLength(59);
  });

  it('pakkens katalog og beregning følger hver række', () => {
    for (const row of rows) {
      const entry = REG_V1.springCatalog.find((item) => item.referenceId === row.reference_id)!;
      const result = REG_V1.evaluateSkill(skillFor(row.reference_id!));
      if (row.reg_status === 'allowed') {
        expect([row.reference_id, entry.status, result.difficulty.value?.toString()]).toEqual([row.reference_id, 'allowed', Fraction.from(row.reg_value!).toString()]);
      } else {
        expect([row.reference_id, entry.status, entry.issueId]).toEqual([row.reference_id, 'forbidden', 'REG-MULTI-ROTATION-FORBIDDEN']);
        expect([row.reference_id, result.difficulty.status, result.difficulty.issues.includes('REG-MULTI-ROTATION-FORBIDDEN')]).toEqual([row.reference_id, 'invalid', true]);
      }
    }
  });
});

describe('REG kendt tvivl', () => {
  it('rummer REG-punkterne og de arvede DK-punkter, men ikke afklarede eller irrelevante DK-punkter', () => {
    const ids = REG_V1.knownIssues.map((issue) => issue.id);
    expect(ids).toEqual(expect.arrayContaining(['H-U08', 'H-U11', 'A6-U02', 'REG-EXTRA-LIMIT-DERIVED', 'A1REG-U01', 'A1REG-U02', 'A1REG-U03', 'A1REG-U04', 'A1REG-U05',
      'Q05', 'H-U06', 'Q-SPOT-DUP', 'C-RETNING-VALG']));
    expect(ids).not.toContain('A3-U01');
    for (const absent of ['Q01', 'Q02', 'Q03', 'Q04', 'Q06', 'A71-U01']) expect(ids).not.toContain(absent);
  });

  it('linker hvert punkt til en side i en fastlåst REG-kilde', () => {
    for (const issue of REG_V1.knownIssues) {
      expect(issue.sources.length, issue.id).toBeGreaterThan(0);
      for (const source of issue.sources) {
        const file = REG_V1.manifest.sources.find((item) => item.id === source.sourceId);
        expect(file, `${issue.id}: ${source.sourceId}`).toBeDefined();
        expect(existsSync(new URL(`../../${file!.file}`, import.meta.url)), `${issue.id}: ${file!.file}`).toBe(true);
        expect(Number.isInteger(source.page) && source.page! > 0, `${issue.id}: ${source.section}`).toBe(true);
      }
    }
  });
});
