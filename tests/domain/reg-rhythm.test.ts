import { describe, expect, it } from 'vitest';
import type { SkillDefinition } from '@teamgym/domain';
import dkRhythmCsv from '../../openspec/changes/archive/2026-10-25-build-teamgym-team-manager/reference/rhythm-catalog.csv?raw';
import regRhythmCsv from '../../packages/rules/data/reg/rhythm-catalog.csv?raw';
import regMappingCsv from '../../packages/rules/data/reg/rhythm-mapping.csv?raw';
import a11Cells from '../../tools/verify-a12/a11-cells.csv?raw';
import a12Cells from '../../tools/verify-a12/a12-cells.csv?raw';
import { DK_RHYTHM_CATALOG, readRows } from '../../packages/rules/src/catalog';
import { DK_V1, DK_V2 } from '../../packages/rules/src/dk-v1';
import { REG_V1 } from '../../packages/rules/src/reg-v1';

/* Cellelisterne er udtrukket af tools/verify-a12/extract_cells.py fra de låste PDF'er; værdien kommer fra cellens kolonne. */
type Rhythm = Extract<SkillDefinition, { discipline: 'rhythm' }>;
const key = (page: string, code: string, value: string) => `${page}|${code}|${value}`;
const cellKeys = (text: string) => readRows(text).filter((cell) => !cell.code!.startsWith('G')).map((cell) => key(cell.page!, cell.code!, cell.value!)).sort();
const catalogKeys = (text: string) => readRows(text).map((row) => key(row.page!, row.official_code!, row.value!)).sort();
const regRows = readRows(regRhythmCsv);
const mapping = readRows(regMappingCsv);
const skill = (momentId: string, variant: Rhythm['variant'] = {}): Rhythm => ({ id: `syntetisk-${momentId}`, name: 'Syntetisk moment', archived: false, discipline: 'rhythm', momentId, variant });

describe('A1.1/A1.2-cellekontrol', () => {
  it('A1.1-cellerne svarer til DK-kataloget (94 momenter og 4 G-celler)', () => {
    expect(readRows(a11Cells)).toHaveLength(98);
    expect(readRows(a11Cells).filter((cell) => cell.code!.startsWith('G'))).toHaveLength(4);
    expect(catalogKeys(dkRhythmCsv)).toEqual(cellKeys(a11Cells));
  });

  it('REG-RHYTHM-CELLS: A1.2-cellerne svarer til REG-kataloget (75 momenter og 4 G-celler) inkl. kolonneoverskrift', () => {
    const cells = readRows(a12Cells);
    expect(cells).toHaveLength(79);
    expect(cells.filter((cell) => cell.code!.startsWith('G')).map((cell) => cell.code)).toEqual(['G601', 'G801', 'G802', 'G802']);
    expect(catalogKeys(regRhythmCsv)).toEqual(cellKeys(a12Cells));
    for (const row of regRows) {
      const cell = cells.find((item) => item.code === row.official_code)!;
      expect(row.column_header, row.official_code).toBe(cell.column_header);
      expect(row.source_page, row.official_code).toBe(row.page);
    }
  });

  it('de 10 kendte transskriptionsfejl og specens eksempler har tabellens værdi', () => {
    // Skrevet direkte fra A1.2 (rettelsestabellen i docs/reglement/05-rytme-reg.md), ikke fra kataloget.
    const expected: Record<string, string> = {
      SB601: '0.40', SB604: '0.40', SB804: '0.60', SB605: '0.40', SB805: '0.60',
      A404: '0.30', A406: '0.40', F402: '0.30', F602: '0.40', F405: '0.30', HB1001: '0.60',
    };
    for (const [code, value] of Object.entries(expected)) {
      expect(REG_V1.rhythmCatalog.find((item) => item.officialCode === code)?.value, code).toBe(value);
    }
  });
});

describe('REG-rytmekortlægning', () => {
  const dkById = new Map(DK_RHYTHM_CATALOG.map((entry) => [entry.id, entry]));

  it('har én post pr. REG-moment', () => {
    expect(mapping.map((row) => row.reg_id).sort()).toEqual(REG_V1.rhythmCatalog.map((entry) => entry.id).sort());
  });

  it('genbruger kun DK-id med evidens fra begge kilder og samme kode', () => {
    for (const row of mapping.filter((item) => item.dk_id)) {
      const reg = REG_V1.rhythmCatalog.find((entry) => entry.id === row.reg_id)!;
      const dk = dkById.get(row.dk_id!);
      expect(dk, row.reg_id).toBeDefined();
      expect(row.dk_id).toBe(row.reg_id);
      expect(dk!.officialCode).toBe(reg.officialCode);
      expect(row.equivalence_evidence).toMatch(new RegExp(`^A1\\.1 s\\. ${dk!.page} og A1\\.2 s\\. ${reg.page} ${reg.officialCode}: .{20,}`));
      expect(reg.options).toEqual(DK_V2.rhythmCatalog.find((entry) => entry.id === row.dk_id)!.options);
    }
  });

  it('giver nye rh-reg-id\'er med begrundelse, når identitet ikke er dokumenteret', () => {
    const fresh = mapping.filter((item) => !item.dk_id);
    expect(fresh).toHaveLength(13);
    for (const row of fresh) {
      expect(row.reg_id).toMatch(/^rh-reg-/);
      expect(row.equivalence_evidence).toBe('');
      expect(row.differences!.length).toBeGreaterThan(10);
    }
    const code = (officialCode: string) => REG_V1.rhythmCatalog.find((entry) => entry.officialCode === officialCode)!.id;
    expect(code('J405')).toBe('rh-reg-j-cat-180');
    expect(code('SB601')).toBe('rh-reg-sb-side-135');
    expect(code('SB201')).toBe('rh-reg-sb-side-under-90');
  });
});

describe('REG-rytmekatalog i pakken', () => {
  it('har 75 REG-momenter uden G og 94 DK-momenter', () => {
    expect(REG_V1.rhythmCatalog).toHaveLength(75);
    expect(DK_V1.rhythmCatalog).toHaveLength(94);
    expect(DK_V2.rhythmCatalog).toHaveLength(94);
    expect(REG_V1.rhythmCatalog.some((entry) => entry.officialCode.startsWith('G') || entry.category === 'G')).toBe(false);
    expect(REG_V1.rhythmCatalog.every((entry) => entry.source.sourceId === 'A1.2')).toBe(true);
  });

  it('REG-RHYTHM-VALUES: bruger tabelværdien frem for kodecifferet: HB1001, F402, SB804 og A404', () => {
    const value = (code: string) => REG_V1.rhythmCatalog.find((entry) => entry.officialCode === code)!.value;
    expect([value('HB1001'), value('F402'), value('SB804'), value('A404')]).toEqual(['0.60', '0.30', '0.60', '0.30']);
  });

  it('viser samme registrering med REG-værdi på REG-hold og DK-værdi på DK-hold', () => {
    const handstand = skill('rh-hb-handstand');
    const reg = REG_V1.bindRhythm(handstand);
    const dk = DK_V2.bindRhythm(handstand);
    expect([reg.status, reg.moment?.value]).toEqual(['known', '0.60']);
    expect([dk.status, dk.moment?.value]).toEqual(['known', '1.00']);
    expect(reg.key).toBe(dk.key);
  });

  it('viser DK-momenter uden REG-kobling som ukendte', () => {
    for (const momentId of ['rh-j-cat-straight-legs', 'rh-a-gumbi', 'ukendt-moment']) {
      const binding = REG_V1.bindRhythm(skill(momentId));
      expect([binding.status, binding.moment]).toEqual(['unresolved', null]);
    }
    expect(DK_V2.bindRhythm(skill('rh-reg-j-cat-180')).status).toBe('unresolved');
  });

  it('bærer A1.2-krav og kendt tvivl for REG-specifikke momenter', () => {
    const find = (id: string) => REG_V1.rhythmCatalog.find((entry) => entry.id === id)!;
    expect(find('rh-reg-sb-side-90').issueId).toBe('A1REG-U03');
    expect(find('rh-reg-j-x-jump').issueId).toBe('A1REG-U05');
    expect(find('rh-reg-sb-side-90').options.find((option) => option.key === 'handSupport')?.values).toContain('none');
    expect(find('rh-j-cat').rowRequirements.join(' ')).not.toContain('J405');
    expect(find('rh-db-turn-forward-360').categoryRequirements.join(' ')).not.toContain('hælen definerer hoftevinklen');
    expect(find('rh-hb-handstand').generalRequirements.join(' ')).toContain('højst tre gå- eller løbeskridt');
    const issueIds = new Set(REG_V1.knownIssues.map((issue) => issue.id));
    for (const id of ['REG-RYTME-RAMMER', 'H-U08', 'A1REG-U01', 'A1REG-U02', 'A1REG-U03', 'A1REG-U04', 'A1REG-U05']) expect(issueIds.has(id), id).toBe(true);
    for (const entry of REG_V1.rhythmCatalog) if (entry.issueId) expect(issueIds.has(entry.issueId), entry.id).toBe(true);
  });
});
