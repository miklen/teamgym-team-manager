import { describe, expect, it } from 'vitest';
import { Fraction, confirmConnection } from '@teamgym/domain';
import type { ElementExecution, SkillDefinition } from '@teamgym/domain';
import { DK_V1 } from '../../packages/rules/src/dk-v1';
import {
  DK_RHYTHM_CATALOG,
  DK_SPRING_CATALOG,
  RHYTHM_GENERAL_REQUIREMENTS,
} from '../../packages/rules/src/catalog';
import { elementDifficulty, elementIdentity, evaluateSpringSkill } from '../../packages/rules/src/dk-spring';
import {
  apparatusDeduction,
  elementBonus,
  holdRound,
  orderCheck,
  pureDirectionDeduction,
  repetitionDeduction,
  trampetTwistQualifies,
  twistIncrement,
} from '../../packages/rules/src/dk-numeric';
import { fromRows, workspaceBuilder } from '../fixtures/rule-workspace';

// Numerical expectations are hand calculations from H/A3/A4, not DK_V1 output.
const row = (id: string): ElementExecution =>
  structuredClone(DK_SPRING_CATALOG.find((item) => item.referenceId === id)!.execution);
const jump = (id: string): Extract<SkillDefinition, { discipline: 'trampet' }> => ({
  id,
  name: `Syntetisk auditspring ${id}`,
  archived: false,
  discipline: 'trampet',
  jump: row(id),
});
const six = <T>(value: T): T[] => Array.from({ length: 6 }, () => structuredClone(value));

describe('uafhængige kildeeksempler og bevarede afklaringer', () => {
  // Transcribed in tenths from the rendered A3/A4 tables, including forbidden
  // rows and printed source conflicts. This does not approve those conflicts.
  it.each([
    ['a3-f-', [1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 4, 3, 4, 5, 5, 6, 7, 8, 12, 14, 16, 13, 15, 15, 17, 19, 21]],
    ['a3-b-', [1, 2, 3, 2, 2, 3, 3, 3, 4, 4, 5, 6, 7, 8, 8, 9, 11, 10, 12, 13, 15, 18, 16, 19, 20]],
    ['a4-v-', [3, 4, 8, 9, 11, 13, 15, 9, 10, 12, 10, 12, 13, 15, 17, 17, 19, 21, 25, 18, 20, 24, 22, 26]],
    ['a4-f-', [1, 2, 3, 2, 3, 4, 5, 6, 7, 8, 7, 8, 9, 8, 9, 10, 10, 12, 14, 17, 16, 18, 21, 20, 24, 25, 29]],
  ] as const)('visuelt genaflæste trykte springværdier: %s', (prefix, values) => {
    const records = DK_SPRING_CATALOG.filter((item) => item.referenceId.startsWith(prefix));
    expect(records).toHaveLength(values.length);
    values.forEach((tenths, index) => {
      const id = `${prefix}${String(index + 1).padStart(2, '0')}`;
      const record = records.find((item) => item.referenceId === id)!;
      expect(Fraction.from(record.printedValue).toString(), id).toBe(new Fraction(tenths, 10).toString());
    });
  });
  // A1.1 column values read from the rendered pages; no values inferred from codes.
  it.each([
    [2, 'HB201:2 HB401:4 HB1001:10 HB203:2 HB403:4 HB603:6 HB803:8 HB204:2 HB404:4 HB604:6 HB804:8'],
    [3, 'DB201:2 DB601:6 DB801:8 DB202:2 DB602:6 DB802:8 DB603:6 DB804:8'],
    [4, 'DB604:6 DB804:8 DB405:4 DB805:8 DB806:8'],
    [5, 'SB201:2 SB601:6 SB801:8 SB202:2 SB602:6 SB802:8 SB203:2 SB603:6 SB604:6 SB804:8 SB605:6 SB805:8'],
    [6, 'J401:4 J601:6 J602:6 J802:8 J403:4 J803:8 J604:6 J804:8'],
    [7, 'J205:2 J405:4 J605:6 J206:2 J606:6 J607:6 J807:8 J808:8'],
    [8, 'J609:6 J809:8 J410:4 J610:6 J810:8 J211:2 J611:6 J822:8 J623:6 J823:8'],
    [9, 'J413:4 J813:8 J614:6 J814:8 J415:4 J816:8'],
    [10, 'A401:4 A601:6 A801:8 A402:4 A802:8 A603:6 A803:8 A404:4 A604:6 A804:8'],
    [11, 'A805:8 A206:2 A406:4 A806:8 A807:8'],
    [13, 'F401:4 F801:8 F402:4 F602:6 F802:8 F1003:10 F804:8 F1004:10 F405:4 F805:8 F1005:10'],
  ] as const)('visuelt genaflæste individuelle rytmeværdier: A1.1 side %s', (page, cells) => {
    const expected = cells.split(' ');
    const actual = DK_RHYTHM_CATALOG.filter((item) => item.page === page);
    expect(actual).toHaveLength(expected.length);
    for (const cell of expected) {
      const [code, tenths] = cell.split(':');
      const record = actual.find((item) => item.officialCode === code)!;
      expect(record, cell).toBeDefined();
      expect(Fraction.from(record.value).toString(), cell).toBe(new Fraction(Number(tenths), 10).toString());
    }
  });
  it('implementeret nærmeste-omgangsfortolkning kan bruge samme omgang for begge retninger', () => {
    expect(pureDirectionDeduction([0, 3, 0], [0, 3, 0]).value?.toString()).toBe('6/5');
  });
  it.each([
    [['a3-b-01', 'a3-b-02', 'a3-b-11'], '4/5'],
    [['a3-b-01', 'a3-b-02', 'a3-b-02', 'a3-b-11'], '4/5'],
    [['a3-f-02', 'a3-f-13'], '3/5'],
  ] as const)('H 9.3.1/A3: %j giver %s', (ids, expected) => {
    expect(evaluateSpringSkill(fromRows([...ids], 'audit')).difficulty.value?.toString()).toBe(expected);
  });
  it.each([
    [0, '0'],
    [1, '1/10'],
    [5, '1/2'],
    [6, '7/10'],
    [7, '4/5'],
    [8, '1'],
  ] as const)('H 9.3.6/10.3.6: %s halve skruer giver %s', (turns, expected) => {
    expect(twistIncrement(turns).toString()).toBe(expected);
  });
  it('H-U01: seks rondat-flik i hver omgang bevarer 1,20 og 0,60', () => {
    const result = elementBonus([six(2), six(2), six(2)]);
    expect(result.status).toBe('unresolved');
    expect(result.value).toBeNull();
    expect(result.alternatives.literal?.toString()).toBe('6/5');
    expect(result.alternatives.example?.toString()).toBe('3/5');
  });
  it('A4-U01: H>1 bevarer 1,20 og 1,10 uden valgt D', () => {
    const result = elementDifficulty(row('a4-v-12'));
    expect(result.status).toBe('unresolved');
    expect(result.value).toBeNull();
    expect(result.alternatives.table?.toString()).toBe('6/5');
    expect(result.alternatives.formula?.toString()).toBe('11/10');
  });
  it('H-U02: fuld gentagelse 1,20/2,40; skiftende besætning åben', () => {
    expect(repetitionDeduction([6, 6, 0], true).value?.toString()).toBe('6/5');
    expect(repetitionDeduction([6, 6, 6], true).value?.toString()).toBe('12/5');
    expect(repetitionDeduction([1, 2, 0], false).issues).toContain('Q03');
  });
  it.each([
    ['a', 'a', 'a', 'b', 'b', 'b'],
    ['a', 'a', 'b', 'b', 'c', 'c'],
    ['a', 'a', 'a', 'b', 'b', 'c'],
  ])('H-U03: ingen sikker reference for %j', (...identities) => {
    const result = holdRound(identities, six(Fraction.from('0.6')));
    expect(result.status).toBe('unresolved');
    expect(result.referenceIdentity).toBeNull();
  });
  it('H-U04: 0,8 → 0,6 → 0,7 får intet opfundet præcist fradrag', () => {
    const result = orderCheck([1, 1, 1], ['0.8', '0.6', '0.7'].map(Fraction.from), 2);
    expect(result.compliant).toBe(false);
    expect(result.deduction.value).toBeNull();
    expect(result.deduction.issues).toContain('Q06');
  });
  it('H-U05: tre blandede 3+3-redskabsomgange forbliver åbne', () => {
    expect(apparatusDeduction([3, 3, 3], [3, 3, 3]).issues).toContain('Q04');
  });
  it('H 10.2.3: aldersgrænser og Tsukahara', () => {
    expect(trampetTwistQualifies('U14', 1, 2)).toBe(true);
    expect(trampetTwistQualifies('junior', 1, 2)).toBe(false);
    expect(trampetTwistQualifies('junior', 1, 3)).toBe(true);
    expect(trampetTwistQualifies('junior', 2, 1)).toBe(true);
    expect(trampetTwistQualifies('junior', 2, 1, 'tsukahara')).toBe(false);
    expect(trampetTwistQualifies('junior', 2, 2, 'tsukahara')).toBe(true);
  });
  it('implementeret H-U06-fortolkning: eksakt rå D direkte til 0,005', () => {
    const builder = workspaceBuilder();
    const team = builder.team('Syntetisk afrunding');
    builder.fill(team.id, 'tumbling', 0, six(fromRows(['a3-b-01', 'a3-b-02', 'a3-b-06'], 'r1')));
    builder.fill(team.id, 'tumbling', 1, six(fromRows(['a3-f-02', 'a3-f-14'], 'r2')));
    builder.fill(team.id, 'tumbling', 2, [
      ...Array.from({ length: 5 }, () => fromRows(['a3-b-01', 'a3-b-02', 'a3-b-11'], 'r3')),
      fromRows(['a3-b-01', 'a3-b-02', 'a3-b-12'], 'r3-plus'),
    ]);
    const result = DK_V1.analyze(
      builder.workspace,
      team.id,
      'tumbling',
      builder.workspace.plans[0]!.tumbling[0]!.id,
    );
    expect(result.difficulty.value?.toString()).toBe('127/30');
    expect(result.panelD?.toString()).toBe('423/100');
    expect(result.difficulty.status).toBe('known'); // Observation, not approval of H-U06.
  });
  it('implementeret A1DK-U06: knælende Gumbi accepteres som kendt', () => {
    expect(
      DK_V1.bindRhythm({
        id: 'gumbi',
        name: 'Syntetisk Gumbi',
        archived: false,
        discipline: 'rhythm',
        momentId: 'rh-a-gumbi',
        variant: { start: 'sideways', startLevel: 'kneeling' },
      }).status,
    ).toBe('known');
  });
});

describe('afvigelser: kilde-/gyldighedskrav som fejler i den gennemgåede kode', () => {
  it('R01: ubekræftet forbindelse må ikke gøre disciplin-D kendt', () => {
    const builder = workspaceBuilder();
    const team = builder.team('Syntetisk ubekræftet forbindelse');
    const basic = fromRows(['a3-b-01', 'a3-b-02', 'a3-b-06'], 'basic');
    builder.fill(team.id, 'tumbling', 0, six(basic));
    builder.fill(team.id, 'tumbling', 1, six(fromRows(['a3-f-02', 'a3-b-11'], 'special')));
    builder.fill(team.id, 'tumbling', 2, six(basic));
    const result = DK_V1.analyze(
      builder.workspace,
      team.id,
      'tumbling',
      builder.workspace.plans[0]!.tumbling[0]!.id,
    );
    expect(result.rounds[1]!.counting[0]!.evaluation?.connection).toBe('unverified');
    expect(result.difficulty.value?.toString()).toBe('19/5'); // Observed 3.80 despite missing confirmation.
    expect(result.difficulty.status).not.toBe('known');
  });
  it('R02: H 9.1.e — bekræftelse må ikke give fuld D efter mellemtrin', () => {
    const builder = workspaceBuilder();
    builder.team('Syntetisk mellemtrin');
    const skill = fromRows(['a3-b-01', 'a3-b-02', 'a3-b-11'], 'with-step');
    if (skill.discipline !== 'tumbling') throw new Error('Testdefinition');
    skill.connection = { kind: 'custom', transitions: ['direct', 'mellemtrin'] };
    const id = builder.register(builder.workspace.athletes[0]!.id, skill);
    builder.workspace = confirmConnection(
      builder.workspace,
      id,
      'Syntetisk test: mellemtrin før saltoen.',
      builder.environment,
    );
    const registration = builder.workspace.athleteSkills.find((item) => item.id === id)!;
    const definition = builder.workspace.skills.find((item) => item.id === registration.skillId)!;
    if (definition.discipline === 'rhythm') throw new Error('Testdefinition');
    const result = DK_V1.evaluateSkill(definition, registration);
    expect(result.difficulty.value?.toString()).toBe('4/5'); // Observed full 0.80.
    // Exclude the suffix (0.10+0.20=0.30), or refuse a known score until interpreted.
    expect(result.difficulty.status !== 'known' || result.difficulty.value?.compare('0.30') === 0).toBe(true);
  });
  it('R03: redundant skrueplacering må ikke ændre Tsukahara-identitet', () => {
    const ordinary = row('a4-v-06');
    const explicit = { ...ordinary, variant: { twistAfterHandsHalfTurns: 2 } };
    expect(elementDifficulty(explicit).value?.toString()).toBe('13/10');
    expect(elementIdentity(explicit)).toBe(elementIdentity(ordinary));
  });
  it('R03: redundant skrueoplysning må ikke nulstille holdomgangens D', () => {
    const builder = workspaceBuilder();
    const team = builder.team('Syntetisk samme Tsukahara');
    const ordinary = jump('a4-v-06');
    const explicit = structuredClone(ordinary);
    explicit.id = 'explicit';
    explicit.jump.variant = { twistAfterHandsHalfTurns: 2 };
    builder.fill(team.id, 'trampet', 0, [...six(ordinary).slice(0, 5), explicit]);
    const result = DK_V1.analyze(
      builder.workspace,
      team.id,
      'trampet',
      builder.workspace.plans[0]!.trampet[0]!.id,
    );
    expect(result.rounds[0]!.holdDeduction.value?.toString()).toBe('1/5'); // Observed false C deduction.
    expect(result.rounds[0]!.difficulty.value?.toString()).toBe('39/5'); // 6 × 1.30 = 7.80
    expect(result.rounds[0]!.holdDeduction.value?.toString()).toBe('0');
  });
  it('R04: A1.1 side 1 tillader tre skridt før et rytmemoment', () => {
    const text = RHYTHM_GENERAL_REQUIREMENTS.join(' ');
    expect(text).not.toContain('højst ét skridt før momentet');
    expect(text).toMatch(/(?:højst|mere end) tre skridt/);
  });
  it('R05: sissone med 180° bendeling har ikke krav om fælles startfront', () => {
    const moment = DK_RHYTHM_CATALOG.find((item) => item.id === 'rh-j-sissone-180')!;
    expect(moment.officialCode).toBe('J804');
    expect(moment.commonFacingRequired).toBe(false);
  });
});
