import { readFileSync } from 'node:fs';
import { expect, it } from 'vitest';
import { CURRENT_SCHEMA_VERSION, validateWorkspace } from '@teamgym/domain';
import { DK_V1, DK_V2, REG_V1 } from '@teamgym/rules';
import { aiReferenceData } from '../../scripts/ai-reference-data';
import { syntheticWorkspace } from '../fixtures/synthetic-workspace';

it('udgiver format 7 og de installerede pakkers faktiske opslag uden arbejdsrumsdata', () => {
  const { structure, catalog } = aiReferenceData();
  const base = new URL('../../apps/web/public/teamgym-data-entry/references/', import.meta.url);
  expect(JSON.parse(readFileSync(new URL(`structure-v${CURRENT_SCHEMA_VERSION}.json`, base), 'utf8'))).toEqual(structure);
  expect(JSON.parse(readFileSync(new URL(`catalog-v${CURRENT_SCHEMA_VERSION}.json`, base), 'utf8'))).toEqual(catalog);
  expect(structure.schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  expect(structure.jsonSchema).toMatchObject({ properties: {
    schemaVersion: { const: CURRENT_SCHEMA_VERSION },
    skills: { type: 'array' },
  } });
  expect(validateWorkspace(syntheticWorkspace().workspace).schemaVersion).toBe(CURRENT_SCHEMA_VERSION);
  for (const [index, rulePackage] of [DK_V1, DK_V2, REG_V1].entries()) {
    const listed = catalog.packages[index]!;
    expect(listed.manifest).toEqual({
      rulesetId: rulePackage.manifest.rulesetId,
      packageVersion: rulePackage.manifest.packageVersion,
      name: rulePackage.manifest.name,
    });
    expect(listed.springCatalog.length).toBe(rulePackage.springCatalog.length);
    expect(listed.rhythmCatalog.length).toBe(rulePackage.rhythmCatalog.length);
    expect(listed.participants).toEqual(rulePackage.springRules.participants);
    expect(new Set(listed.practicalSprings.map((item) => item.executionIdentity)).size).toBe(listed.practicalSprings.length);
  }
  expect(JSON.stringify(catalog)).not.toContain('Syntetisk gymnast');
});
