import { describe, expect, it } from 'vitest';
import { Fraction, setPlannedSpot, setRoundEntries } from '@teamgym/domain';
import type { NumericDecision } from '../../packages/rules/src/dk-numeric';
import type { PlannedSpotInput, RulesetBinding, SkillDefinition, SpringDiscipline } from '@teamgym/domain';
import type { RulePackage } from '../../packages/rules/src/registry';
import { DK_SPRING_CATALOG } from '../../packages/rules/src/catalog';
import { DK_V2 } from '../../packages/rules/src/dk-v1';
import { REG_V1 } from '../../packages/rules/src/reg-v1';
import { fromRows, workspaceBuilder } from '../fixtures/rule-workspace';

/*
 * Håndregnede REG-facitcases (kontrolposter i packages/rules/data/reg/control-posts.json).
 * Alle forventede tal er skrevet direkte fra H v1.4 (9.1–9.3, 10.1–10.3), A3, A4, A6 1.7 og TR 1.3/1.3.1.
 * Ingen forventning må genereres af produktionskoden; kun inputopstillingen bruger testbyggeren.
 */

type Spring = Exclude<SkillDefinition, { discipline: 'rhythm' }>;
const f = (value: string) => Fraction.from(value).toString();
const value = (decision: NumericDecision | { value: Fraction | null }) => decision.value?.toString() ?? null;
const reg = (ageGroup = 'junior', teamType = 'girls'): RulesetBinding => ({ rulesetId: 'reg', packageVersion: '1.0.0', ageGroup, teamType });
const dk = (ageGroup = 'junior', teamType = 'girls'): RulesetBinding => ({ rulesetId: 'dk', packageVersion: '1.1.0', ageGroup, teamType });
const series = (...rows: string[]): Spring => fromRows(rows, `reg-serie-${rows.join('-')}`);
const times = <T>(count: number, item: T): T[] => Array.from({ length: count }, () => item);

function jump(sourceId: string): Spring {
  const source = DK_SPRING_CATALOG.find((item) => item.referenceId === sourceId);
  if (!source) throw new Error(`Ukendt syntetisk spring: ${sourceId}`);
  return { id: `reg-spring-${sourceId}`, name: `Syntetisk ${sourceId}`, archived: false, discipline: 'trampet', jump: structuredClone(source.execution) };
}

/** Syntetisk REG-hold. Ekstra gymnaster placeres først, tællende sidst (H 9.1f/10.1e). */
function team(binding: RulesetBinding, rulePackage: RulePackage, athleteCount = 13) {
  const builder = workspaceBuilder();
  const created = builder.team('Syntetisk REG', binding, athleteCount);
  const athletes = builder.workspace.athletes.filter((athlete) => athlete.teamId === created.id);
  const profile = rulePackage.profiles.find((item) => item.ageGroup === binding.ageGroup && item.teamType === binding.teamType);
  if (!profile) throw new Error('Profilen findes ikke i pakken.');
  const limits = { counting: profile.counting, extra: profile.extra };
  const plan = () => builder.workspace.plans.find((item) => item.teamId === created.id)!;
  function place(discipline: SpringDiscipline, roundIndex: number, counting: readonly Spring[], extras: readonly Spring[] = [], roles?: readonly ('extra' | 'counting')[]) {
    const definitions = [...extras, ...counting];
    const entries = definitions.map((definition, index) => ({ id: builder.environment.id(), athleteId: athletes[index]!.id,
      athleteSkillId: builder.register(athletes[index]!.id, definition), role: roles?.[index] ?? (index < extras.length ? 'extra' as const : 'counting' as const) }));
    const scenario = plan()[discipline][0]!;
    builder.workspace = setRoundEntries(builder.workspace, plan().id, discipline, scenario.id, scenario.rounds[roundIndex]!.id, entries, limits, builder.environment);
  }
  function rounds(discipline: SpringDiscipline, ...all: readonly (readonly Spring[])[]) { all.forEach((counting, index) => place(discipline, index, counting)); }
  function spot(discipline: SpringDiscipline, roundIndex: number, entryIndex: number, input: PlannedSpotInput) {
    const scenario = plan()[discipline][0]!;
    const round = scenario.rounds[roundIndex]!;
    builder.workspace = setPlannedSpot(builder.workspace, plan().id, discipline, scenario.id, round.id, round.entries[entryIndex]!.id, input, builder.environment);
  }
  const analyze = (discipline: SpringDiscipline) => rulePackage.analyze(builder.workspace, created.id, discipline, plan()[discipline][0]!.id);
  return { place, rounds, spot, analyze, profile };
}

type Analysis = ReturnType<RulePackage['analyze']>;
const contribution = (analysis: Analysis, id: string) => {
  const found = analysis.contributions.find((item) => item.id === id);
  if (!found) throw new Error(`Bidraget ${id} mangler.`);
  return found.decision;
};
const ids = (analysis: Analysis) => analysis.contributions.map((item) => item.id);

// Bane (A3): rondat a3-b-01, flik a3-b-02, whipback a3-b-03, lukket baglæns a3-b-04, strakt baglæns a3-b-06,
// strakt baglæns 180 a3-b-10, strakt baglæns 360 a3-b-11, dobbelt lukket baglæns a3-b-15; vejrmølle a3-f-01, kraftspring a3-f-02, forlæns lukket a3-f-04.
const RF_LUKKET = series('a3-b-01', 'a3-b-02', 'a3-b-04');
const KRAFT_LUKKET = series('a3-f-02', 'a3-f-04');
const RF_STRAKT_360 = series('a3-b-01', 'a3-b-02', 'a3-b-11');
const RF_STRAKT = series('a3-b-01', 'a3-b-02', 'a3-b-06');
const RF_STRAKT_180 = series('a3-b-01', 'a3-b-02', 'a3-b-10');
// Trampet (A4): fri lukket a4-f-01, hoftebøjet a4-f-02, strakt a4-f-03, lukket 180 a4-f-04, strakt 360 a4-f-07;
// mølleoverslag a4-v-01, overslag a4-v-02.
const FRI_LUKKET = jump('a4-f-01');
const FRI_HOFTE = jump('a4-f-02');
const FRI_STRAKT = jump('a4-f-03');
const FRI_LUKKET_180 = jump('a4-f-04');
const FRI_STRAKT_360 = jump('a4-f-07');
const OVERSLAG = jump('a4-v-02');

describe('REG-facit: sværhed (H 9.3, 10.3, A3, A4)', () => {
  it('REG-F02: rondat 0,10 + flik 0,20 + strakt baglæns 360° (0,30 + 2 × 0,10) giver D 0,80', () => {
    expect(value(REG_V1.evaluateSkill(RF_STRAKT_360).difficulty)).toBe(f('0.80'));
  });

  it('REG-F03: fri forlæns lukket salto med 180° giver D 0,10 + 0,10 = 0,20', () => {
    expect(value(REG_V1.evaluateSkill(FRI_LUKKET_180).difficulty)).toBe(f('0.20'));
  });

  it('REG-F22: seriens D er de tre forskellige højeste: rondat–flik–whipback–strakt → 0,30 + 0,30 + 0,20 = 0,80', () => {
    expect(value(REG_V1.evaluateSkill(series('a3-b-01', 'a3-b-02', 'a3-b-03', 'a3-b-06')).difficulty)).toBe(f('0.80'));
  });

  it('REG-F19: mølleoverslag 0,30 og overslag 0,40 er gyldige på Pegasus', () => {
    const cartwheel = REG_V1.evaluateSkill(jump('a4-v-01'));
    expect([cartwheel.validity, value(cartwheel.difficulty)]).toEqual(['known', f('0.30')]);
    const handspring = REG_V1.evaluateSkill(OVERSLAG);
    expect([handspring.validity, value(handspring.difficulty)]).toEqual(['known', f('0.40')]);
  });

  it('REG-F11: overslag-salto og Tsukahara på Pegasus giver D 0 og er ikke tilladt (H 10.3.2)', () => {
    for (const sourceId of ['a4-v-08', 'a4-v-03']) {
      const result = REG_V1.evaluateSkill(jump(sourceId));
      expect(result.difficulty.status).toBe('invalid');
      expect(result.difficulty.issues).toContain('REG-MULTI-ROTATION-FORBIDDEN');
      expect(result.difficulty.knownSubtotal.toString()).toBe('0');
      expect(result.validity).not.toBe('known');
    }
    // Samme spring er gyldigt i DK 1.1.0 (A4: overslag salto lukket 0,90).
    expect(value(DK_V2.evaluateSkill(jump('a4-v-08')).difficulty)).toBe(f('0.90'));
    // Kun mølleoverslag og overslag er tilladt på Pegasus; en enkelt salto fra Pegasus afvises også.
    const freeSalto = FRI_LUKKET as Extract<Spring, { discipline: 'trampet' }>;
    const saltoFromPegasus: Spring = { ...freeSalto, id: 'reg-spring-pegasus-salto', jump: { ...freeSalto.jump, apparatus: 'pegasus' } };
    const pegasusSalto = REG_V1.evaluateSkill(saltoFromPegasus);
    expect([pegasusSalto.difficulty.status, pegasusSalto.difficulty.issues]).toEqual(['invalid', ['REG-MULTI-ROTATION-FORBIDDEN']]);
  });

  it('REG-F25: fri dobbelt lukket salto er ikke tilladt på trampet i REG (H 10.3.2)', () => {
    const result = REG_V1.evaluateSkill(jump('a4-f-11'));
    expect(result.difficulty.status).toBe('invalid');
    expect(result.difficulty.issues).toContain('REG-MULTI-ROTATION-FORBIDDEN');
  });

  it('REG-F12: rondat–flik–dobbelt baglæns lukket er ikke tilladt og ikke fuldt gyldig (H 9.3.2/9.3.4)', () => {
    const result = REG_V1.evaluateSkill(series('a3-b-01', 'a3-b-02', 'a3-b-15'));
    expect(result.validity).not.toBe('known');
    expect(result.difficulty.issues).toContain('REG-MULTI-ROTATION-FORBIDDEN');
    // DK: 0,10 + 0,20 + 0,80 = 1,10.
    expect(value(DK_V2.evaluateSkill(series('a3-b-01', 'a3-b-02', 'a3-b-15')).difficulty)).toBe(f('1.10'));
  });

  it('REG-SPRING-VALUES: REG-kolonnen i H 9.3.5 (s. 34) og 10.3.5 (s. 43)', () => {
    const tumbling: [string, string][] = [['a3-f-01', '0.10'], ['a3-f-02', '0.20'], ['a3-f-03', '0.20'], ['a3-f-04', '0.20'], ['a3-f-06', '0.20'], ['a3-f-08', '0.30'],
      ['a3-b-01', '0.10'], ['a3-b-02', '0.20'], ['a3-b-03', '0.30'], ['a3-b-04', '0.20'], ['a3-b-05', '0.20'], ['a3-b-06', '0.30']];
    for (const [sourceId, expected] of tumbling) expect([sourceId, value(REG_V1.evaluateSkill(series(sourceId)).difficulty)]).toEqual([sourceId, f(expected)]);
    const trampet: [string, string][] = [['a4-v-01', '0.30'], ['a4-v-02', '0.40'], ['a4-f-01', '0.10'], ['a4-f-02', '0.20'], ['a4-f-03', '0.30']];
    for (const [sourceId, expected] of trampet) expect([sourceId, value(REG_V1.evaluateSkill(jump(sourceId)).difficulty)]).toEqual([sourceId, f(expected)]);
  });
});

describe('REG-facit: bane-C (H 9.2)', () => {
  const fullPlan = (binding: RulesetBinding, rulePackage: RulePackage) => {
    const setup = team(binding, rulePackage);
    setup.rounds('tumbling', times(6, RF_LUKKET), times(6, KRAFT_LUKKET), times(6, RF_STRAKT_360));
    return setup.analyze('tumbling');
  };

  it('REG-F01: fuld bane giver C 2,20 i REG og 1,60 i DK 1.1.0', () => {
    const analysis = fullPlan(reg(), REG_V1);
    // Elementtillæg: (6 × 0,2 + 6 × 0,1 + 6 × 0,2) / 3 = 1,00. Skruetillæg: 6 × 0,2 = 1,20. Ingen fradrag.
    expect(value(contribution(analysis, 'B-ELEMENT'))).toBe(f('1.00'));
    expect(value(contribution(analysis, 'B-SKRUE'))).toBe(f('1.20'));
    expect(value(analysis.composition)).toBe(f('2.20'));
    // DK: skruetillæg 6 × 0,1 = 0,60 → 1,00 + 0,60 = 1,60.
    expect(value(fullPlan(dk(), DK_V2).composition)).toBe(f('1.60'));
  });

  it('REG-F09: én afvigende gymnast i holdomgangen giver D 0 for serien og fradrag 0,10', () => {
    const setup = team(reg(), REG_V1);
    setup.rounds('tumbling', [...times(5, RF_LUKKET), RF_STRAKT], times(6, KRAFT_LUKKET), times(6, RF_STRAKT_360));
    const analysis = setup.analyze('tumbling');
    expect(value(contribution(analysis, 'C-HOLD'))).toBe(f('0.10'));
    expect(analysis.rounds[0]!.counting.filter((item) => item.adjustedD.value?.toString() === '0')).toHaveLength(1);
    // Omgangens D: 5 × (0,10 + 0,20 + 0,20) = 2,50.
    expect(value(analysis.rounds[0]!.difficulty)).toBe(f('2.50'));
  });

  it('REG-F14: holdomgang fordelt 3+3 forbliver uafklaret med Q05', () => {
    const setup = team(reg(), REG_V1);
    setup.rounds('tumbling', [...times(3, RF_LUKKET), ...times(3, RF_STRAKT)], times(6, KRAFT_LUKKET), times(6, RF_STRAKT_360));
    const hold = contribution(setup.analyze('tumbling'), 'C-HOLD');
    expect(hold.status).toBe('unresolved');
    expect(hold.issues).toContain('Q05');
  });

  it('REG-F08: Q03 – samme serie 2 gange i omgang 2 og 3 gange i omgang 3 giver 2 × 0,1 = 0,20', () => {
    const setup = team(reg(), REG_V1);
    setup.rounds('tumbling', times(6, series('a3-b-01', 'a3-b-02')), [...times(2, RF_LUKKET), ...times(4, KRAFT_LUKKET)], [...times(3, RF_LUKKET), ...times(3, RF_STRAKT)]);
    expect(value(contribution(setup.analyze('tumbling'), 'C-GENTAG'))).toBe(f('0.20'));
  });

  it('REG-F07: Q01 – rondat–flik–flik giver 0,1; med enkeltelementer i omgang 2 og 3 er tillægget (0,6 + 0 + 0) / 3 = 0,20', () => {
    const setup = team(reg(), REG_V1);
    setup.rounds('tumbling', times(6, series('a3-b-01', 'a3-b-02', 'a3-b-02')), times(6, series('a3-f-02')), times(6, series('a3-f-01')));
    expect(value(contribution(setup.analyze('tumbling'), 'B-ELEMENT'))).toBe(f('0.20'));
  });

  it('REG-F16: ingen ren forlæns omgang giver 6 × 0,1 = 0,60', () => {
    const setup = team(reg(), REG_V1);
    setup.rounds('tumbling', times(6, series('a3-b-01', 'a3-b-02')), times(6, RF_LUKKET), times(6, RF_STRAKT));
    expect(value(contribution(setup.analyze('tumbling'), 'C-RETNING'))).toBe(f('0.60'));
  });

  it('REG-F17: C bliver aldrig under 0,0 (0,0 − 0,60 → 0,0)', () => {
    const setup = team(reg(), REG_V1);
    setup.rounds('tumbling', times(6, series('a3-b-01')), times(6, series('a3-b-02')), times(6, series('a3-b-03')));
    const analysis = setup.analyze('tumbling');
    expect(value(contribution(analysis, 'C-RETNING'))).toBe(f('0.60'));
    expect(analysis.composition.raw?.toString()).toBe(Fraction.from('-0.60').toString());
    expect(value(analysis.composition)).toBe('0');
  });

  it('REG-F13: faldende D 0,80 → 0,60 → 0,70 giver intet rækkefølgefradrag og intet rækkefølgekrav', () => {
    const plan = [times(6, RF_LUKKET), [RF_STRAKT_360, RF_STRAKT, ...times(4, RF_STRAKT_180)], times(6, KRAFT_LUKKET)] as const;
    const regSetup = team(reg(), REG_V1);
    regSetup.rounds('tumbling', ...plan);
    const analysis = regSetup.analyze('tumbling');
    expect(ids(analysis).filter((id) => id.startsWith('C-ORDEN'))).toEqual([]);
    expect(REG_V1.guide(analysis, regSetup.profile).map((row) => row.id).filter((id) => id.startsWith('C-ORDEN'))).toEqual([]);
    // Kontrol: samme plan giver rækkefølgefradrag i DK 1.1.0.
    const dkSetup = team(dk(), DK_V2);
    dkSetup.rounds('tumbling', ...plan);
    expect(contribution(dkSetup.analyze('tumbling'), 'C-ORDEN-2').value?.compare(0)).toBe(1);
  });

  it('REG-F26: bane har hverken flow, rækkefølge eller dobbelttillæg', () => {
    const setup = team(reg(), REG_V1);
    setup.rounds('tumbling', times(6, RF_LUKKET), times(6, KRAFT_LUKKET), times(6, RF_STRAKT_360));
    const analysis = setup.analyze('tumbling');
    const absent = (id: string) => id === 'C-FLOW' || id === 'B-DOBBELT' || id.startsWith('C-ORDEN');
    expect(ids(analysis).filter(absent)).toEqual([]);
    expect(REG_V1.guide(analysis, setup.profile).map((row) => row.id).filter(absent)).toEqual([]);
  });
});

describe('REG-facit: trampet-C (H 10.2)', () => {
  it('REG-F04: U14 med fri lukket, overslag på Pegasus og fri strakt 360° giver C 1,0 + 6 × 0,2 = 2,20', () => {
    const setup = team(reg('U14'), REG_V1);
    setup.rounds('trampet', times(6, FRI_LUKKET), times(6, OVERSLAG), times(6, FRI_STRAKT_360));
    const analysis = setup.analyze('trampet');
    expect(value(contribution(analysis, 'T-SKRUE'))).toBe(f('1.20'));
    expect(value(analysis.composition)).toBe(f('2.20'));
  });

  it('REG-F06: fire tællende med fri salto 180° giver U11 4 × 0,2 = 0,80 og U14 intet tillæg', () => {
    const plan = [times(6, FRI_LUKKET), [...times(4, FRI_LUKKET_180), ...times(2, FRI_HOFTE)], times(6, OVERSLAG)] as const;
    const u11 = team(reg('U11'), REG_V1);
    u11.rounds('trampet', ...plan);
    expect(value(contribution(u11.analyze('trampet'), 'T-SKRUE'))).toBe(f('0.80'));
    const u14 = team(reg('U14'), REG_V1);
    u14.rounds('trampet', ...plan);
    expect(value(contribution(u14.analyze('trampet'), 'T-SKRUE'))).toBe('0');
  });

  it('REG-F05: tre fulde omgange uden Pegasus giver redskabsfradrag 6 × 0,1 = 0,60', () => {
    const setup = team(reg(), REG_V1);
    setup.rounds('trampet', times(6, FRI_LUKKET), times(6, FRI_HOFTE), times(6, FRI_STRAKT));
    const analysis = setup.analyze('trampet');
    expect(value(contribution(analysis, 'C-REDSKAB'))).toBe(f('0.60'));
    expect(value(analysis.composition)).toBe(f('0.40'));
  });

  it('REG-F18: én afvigende gymnast i trampettens holdomgang giver 0,10', () => {
    const setup = team(reg(), REG_V1);
    setup.rounds('trampet', [...times(5, FRI_LUKKET), FRI_HOFTE], times(6, FRI_STRAKT), times(6, OVERSLAG));
    expect(value(contribution(setup.analyze('trampet'), 'C-HOLD'))).toBe(f('0.10'));
  });

  it('REG-F23: Q03 på trampet – 2 + 3 forekomster giver 2 × 0,1 = 0,20', () => {
    const setup = team(reg(), REG_V1);
    setup.rounds('trampet', times(6, FRI_LUKKET), [...times(2, FRI_HOFTE), ...times(4, FRI_STRAKT)], [...times(3, FRI_HOFTE), ...times(3, FRI_STRAKT_360)]);
    expect(value(contribution(setup.analyze('trampet'), 'C-GENTAG'))).toBe(f('0.20'));
  });

  it('REG-F24: Q04 – en blandet Pegasus-omgang er ugyldig planlægning', () => {
    const setup = team(reg(), REG_V1);
    setup.rounds('trampet', times(6, OVERSLAG), [...times(3, OVERSLAG), ...times(3, FRI_STRAKT)], times(6, FRI_LUKKET));
    const analysis = setup.analyze('trampet');
    expect(analysis.rounds[1]!.status).toBe('invalid');
    expect(contribution(analysis, 'C-REDSKAB').status).toBe('invalid');
    expect(contribution(analysis, 'C-REDSKAB').issues).not.toContain('Q04');
  });

  it('REG-F26: trampet har hverken flow, rækkefølge eller dobbelttillæg', () => {
    const setup = team(reg('U14'), REG_V1);
    setup.rounds('trampet', times(6, FRI_LUKKET), times(6, OVERSLAG), times(6, FRI_STRAKT_360));
    const analysis = setup.analyze('trampet');
    const absent = (id: string) => ['C-FLOW', 'T-DOBBELT-FRI', 'T-DOBBELT-REDSKAB'].includes(id) || id.startsWith('C-ORDEN');
    expect(ids(analysis).filter(absent)).toEqual([]);
    expect(REG_V1.guide(analysis, setup.profile).map((row) => row.id).filter(absent)).toEqual([]);
  });
});

describe('REG-facit: deltagere og profiler (H 9.1f, 10.1e, TR 1.3, 1.3.1)', () => {
  it('REG-F15: seks ekstra + seks tællende er gyldigt, kun de sidste seks tæller; en 13. og ekstra efter tællende afvises', () => {
    const setup = team(reg(), REG_V1);
    setup.place('tumbling', 0, times(6, RF_LUKKET), times(6, RF_STRAKT_360));
    const round = setup.analyze('tumbling').rounds[0]!;
    expect(round.entries).toHaveLength(12);
    expect(round.counting).toHaveLength(6);
    // Kun de tællende: 6 × 0,50 = 3,00 (de ekstra har 0,80 hver).
    expect(value(round.difficulty)).toBe(f('3.00'));
    expect(() => setup.place('tumbling', 1, times(6, RF_LUKKET), times(7, RF_STRAKT_360))).toThrow(/højst 6 ekstra/);
    expect(() => setup.place('tumbling', 1, times(6, RF_LUKKET), [RF_STRAKT_360],
      ['counting', 'extra', 'counting', 'counting', 'counting', 'counting', 'counting'])).toThrow(/Ekstra gymnaster skal stå først/);
  });

  it('REG-F15: guidens ramme markerer seks ekstra som afledt grænse; DK er uændret', () => {
    const regSetup = team(reg(), REG_V1);
    const regFrame = REG_V1.guide(regSetup.analyze('tumbling'), regSetup.profile).find((row) => row.id === 'G-RAMME')!;
    expect(regFrame.requirement).toBe('6 tællende og højst 6 ekstra pr. omgang (afledt planlægningsgrænse); første omgang er holdomgang.');
    expect(regFrame.issues).toEqual(['REG-EXTRA-LIMIT-DERIVED']);
    const dkSetup = team(dk(), DK_V2);
    const dkFrame = DK_V2.guide(dkSetup.analyze('tumbling'), dkSetup.profile).find((row) => row.id === 'G-RAMME')!;
    expect(dkFrame.requirement).toBe('6 tællende og højst 2 ekstra pr. omgang; første omgang er holdomgang.');
    expect(dkFrame.issues).toEqual([]);
  });

  it('REG-F27: mixprofiler kræver 3 tællende piger og 3 tællende drenge', () => {
    const mix = REG_V1.profiles.filter((profile) => profile.teamType === 'mix');
    expect(mix.map((profile) => profile.ageGroup)).toEqual(['U11', 'U14', 'junior']);
    expect(mix.every((profile) => profile.mixQuota?.girl === 3 && profile.mixQuota.boy === 3)).toBe(true);
  });

  it('REG-F28: U11, U14 og junior × piger/drenge/mix uden senior; TR 1.3-alder og dispensationsnote', () => {
    expect(REG_V1.manifest).toMatchObject({ rulesetId: 'reg', packageVersion: '1.0.0', name: 'Regionsrækken' });
    expect(REG_V1.profiles.map((profile) => `${profile.ageGroup}/${profile.teamType}`)).toEqual(
      ['U11/girls', 'U11/boys', 'U11/mix', 'U14/girls', 'U14/boys', 'U14/mix', 'junior/girls', 'junior/boys', 'junior/mix']);
    const age = (group: string) => REG_V1.profiles.find((profile) => profile.ageGroup === group)!.nominalAge;
    expect([age('U11'), age('U14'), age('junior')]).toEqual([{ min: null, max: 11 }, { min: null, max: 14 }, { min: 14, max: 17 }]);
    expect(REG_V1.profiles.every((profile) => profile.counting === 6 && profile.extra === 6)).toBe(true);
    expect(REG_V1.profiles.every((profile) => profile.ageNote?.includes('2 gymnaster må være op til 2 år yngre eller ældre'))).toBe(true);
  });
});

describe('REG-facit: modtagning (A6 1.7, H 9.3.3/10.3.3)', () => {
  const plan = (setup: ReturnType<typeof team>) => setup.rounds('trampet', times(6, FRI_LUKKET), times(6, FRI_STRAKT_360), times(6, OVERSLAG));

  it('REG-F10: hjælp til udførelse giver planlagt E-fradrag 1,0 med kilde A6 1.7', () => {
    const setup = team(reg(), REG_V1);
    plan(setup);
    setup.spot('trampet', 1, 0, { grade: 'assist' });
    expect(value(setup.analyze('trampet').rounds[1]!.plannedExecution.deduction)).toBe(f('1.0'));
    const assist = REG_V1.spotRates?.find((rate) => rate.grade === 'assist');
    expect(assist?.executionDeduction).toBe('1.0');
    expect(assist?.sources.some((source) => source.sourceId === 'A6' && source.section.startsWith('1.7'))).toBe(true);
  });

  it('REG-F21: let støtte giver planlagt E-fradrag 0,5 og uændret D', () => {
    const setup = team(reg(), REG_V1);
    plan(setup);
    setup.spot('trampet', 1, 0, { grade: 'support' });
    const round = setup.analyze('trampet').rounds[1]!;
    expect(value(round.plannedExecution.deduction)).toBe(f('0.5'));
    expect(round.counting[0]!.spotD).toEqual(round.counting[0]!.originalD);
  });

  it('REG-F20: kraftig hjælp halverer D: strakt 360° (0,30 + 0,20) → 0,25; omgang 5 × 0,50 + 0,25 = 2,75', () => {
    const setup = team(reg(), REG_V1);
    plan(setup);
    setup.spot('trampet', 1, 5, { grade: 'heavy' });
    const round = setup.analyze('trampet').rounds[1]!;
    expect(value(round.counting[5]!.spotD)).toBe(f('0.25'));
    expect(value(round.difficulty)).toBe(f('2.75'));
  });
});
