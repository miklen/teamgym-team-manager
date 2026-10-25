import { describe, expect, it } from 'vitest';
import { canonicalJson } from '@teamgym/domain';
import { DK_RHYTHM_CATALOG, DK_SPRING_CATALOG, rawElementIdentity } from '../../packages/rules/src/catalog';
import { DK_KNOWN_ISSUES, DK_PROFILES, DK_SOURCE_MANIFEST } from '../../packages/rules/src/dk-data';
import springCsv from '../../openspec/changes/build-teamgym-team-manager/reference/spring-source-catalog.csv?raw';
import rhythmCsv from '../../openspec/changes/build-teamgym-team-manager/reference/rhythm-catalog.csv?raw';

describe('versionsbundet katalog og diagnoser', () => {
  it('bevarer alle 103 kildeposter med 83 tilladte, 19 forbudte og én uafklaret', () => {
    expect(DK_SPRING_CATALOG).toHaveLength(103);
    expect(DK_SPRING_CATALOG.filter((item) => item.status === 'allowed')).toHaveLength(83);
    expect(DK_SPRING_CATALOG.filter((item) => item.status === 'forbidden')).toHaveLength(19);
    expect(DK_SPRING_CATALOG.filter((item) => item.status === 'unresolved').map((item) => item.referenceId)).toEqual(['a4-v-12']);
    for (const line of springCsv.trim().split(/\r?\n/).slice(1)) {
      const [id, source, column, row, name, code, value, status, issue] = line.split(';');
      const imported = DK_SPRING_CATALOG.find((item) => item.referenceId === id)!;
      expect(imported, id).toMatchObject({ name, officialCode: code, printedValue: value, status, issueId: issue || null,
        source: { sourceId: source, section: `${column}, række ${row}`, page: 1 } });
    }
  });

  it('startroller bliver ikke falske elementidentiteter, men retning og redskab bevares', () => {
    const find = (id: string) => DK_SPRING_CATALOG.find((item) => item.referenceId === id)!;
    expect(rawElementIdentity(find('a3-f-04').execution)).toBe(rawElementIdentity(find('a3-f-05').execution));
    expect(find('a3-f-05').startRole).toBe(true);
    expect(rawElementIdentity(find('a3-b-06').execution)).not.toBe(rawElementIdentity(find('a3-f-08').execution));
    expect(find('a4-v-03').execution).toMatchObject({ family: 'tsukahara', apparatus: 'pegasus', rotationQuarterTurns: 8 });
    expect(find('a4-v-16').execution.rotationQuarterTurns).toBe(12);
  });

  it('bevarer hvert af de 94 individuelle rytmefelter med krav og kildeside', () => {
    expect(DK_RHYTHM_CATALOG).toHaveLength(94);
    expect(new Set(DK_RHYTHM_CATALOG.map((item) => item.id)).size).toBe(94);
    for (const line of rhythmCsv.trim().split(/\r?\n/).slice(1)) {
      const [id, code, category, page, value, name, requirement, issue] = line.split(';');
      const imported = DK_RHYTHM_CATALOG.find((item) => item.id === id)!;
      expect(imported, id).toMatchObject({ officialCode: code, category, page: Number(page), value, name, specificRequirement: requirement, issueId: issue || null });
      expect(imported.generalRequirements.length).toBeGreaterThan(0);
      expect(imported.categoryRequirements.length).toBeGreaterThan(0);
      expect(imported.source).toMatchObject({ sourceId: 'A1.1', page: Number(page) });
    }
    expect(DK_RHYTHM_CATALOG.some((item) => item.category === 'G' || item.page === 12)).toBe(false);
  });

  it('samme trykte DB804 matcher ikke to forskellige individuelle momenter', () => {
    const entries = DK_RHYTHM_CATALOG.filter((item) => item.officialCode === 'DB804');
    expect(entries.map((item) => item.id)).toEqual(['rh-db-turn-leg90-540', 'rh-db-press-together']);
    expect(entries.map((item) => item.value)).toEqual(['0.80', '0.80']);
    expect(entries[0]?.categoryRequirements).not.toEqual(entries[1]?.categoryRequirements);
    expect(entries[0]?.commonFacingRequired).toBe(true);
  });

  it('bevarer visuelt kontrollerede særkrav og de fælles valgakser', () => {
    const find = (id: string) => DK_RHYTHM_CATALOG.find((item) => item.id === id)!;
    expect(find('rh-hb-handstand').rowRequirements.join(' ')).toContain('45°');
    expect(find('rh-j-split-leap-180').officialCode).toBe('J822');
    expect(find('rh-j-sissone-135').options.find((option) => option.key === 'landing')?.values).toEqual(['one-foot']);
    expect(find('rh-a-side-salto').options.find((option) => option.key === 'bodyPosition')?.values).toEqual(['tuck', 'pike', 'straight']);
    expect(find('rh-a-gumbi').options.find((option) => option.key === 'start')?.values).toEqual(['sideways', 'backward']);
    expect(find('rh-a-gumbi').options.find((option) => option.key === 'startLevel')?.values).toEqual(['standing', 'kneeling']);
    expect(find('rh-sb-side-supported-90').options.find((option) => option.key === 'handSupport')?.values).toEqual(['one-hand', 'two-hands']);
    expect(find('rh-f-straddle-fold-floor').rowRequirements.join(' ')).toContain('skuldre i gulvet');
  });

  it('udbyder kun de ni DK-profiler og binder dem til de fastlåste officielle kilder', () => {
    expect(DK_PROFILES).toHaveLength(9);
    expect(new Set(DK_PROFILES.map((profile) => profile.ageGroup))).toEqual(new Set(['U14', 'junior', 'senior']));
    expect(DK_PROFILES.find((profile) => profile.teamType === 'mix')?.mixQuota).toEqual({ girl: 3, boy: 3 });
    expect(DK_SOURCE_MANIFEST.sources).toHaveLength(8);
    expect(DK_SOURCE_MANIFEST.sources.find((source) => source.id === 'H')?.edition).toContain('v1.4');
    expect(DK_SOURCE_MANIFEST.sources.find((source) => source.id === 'TR')?.edition).toContain('26/27');
    expect(Object.isFrozen(DK_PROFILES)).toBe(true);
    expect(Object.isFrozen(DK_SPRING_CATALOG[0]?.execution)).toBe(true);
  });

  it('bevarer seks uafklarede regelspørgsmål og to katalogbemærkninger uden opdigtet moment', () => {
    expect(DK_KNOWN_ISSUES.map((issue) => issue.id)).toEqual(['Q01', 'Q02', 'Q03', 'Q04', 'Q05', 'Q06', 'K01', 'K02']);
    expect(DK_KNOWN_ISSUES.find((issue) => issue.id === 'Q02')?.alternatives).toEqual({ table: '6/5', formula: '11/10' });
    expect(canonicalJson(DK_RHYTHM_CATALOG).includes('Kattespring 540')).toBe(false);
  });
});
