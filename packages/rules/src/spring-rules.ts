import type { SourceReference } from '@teamgym/domain';

/** Skruetillæggets kvalifikation. Antal er halve omgange; `null` betyder, at vejen ikke giver tillæg. */
export interface TwistBonusRule {
  rate: string;
  /** Mindste skrue ved enkeltsalto (trampet) eller i ét element (bane) pr. aldersgruppe. */
  minHalfTurnsByAgeGroup: Readonly<Record<string, number>>;
  doubleMinHalfTurns: number | null;
  tsukaharaMinHalfTurns: number | null;
}

/** Regelprofil for ét redskab (design beslutning 1). Satser er decimaltekster for eksakt brøkregning. */
export interface SpringRuleSet {
  baseC: string;
  deductionRates: { hold: string; repetition: string; requirement: string; order: string | null };
  orderDeduction: boolean;
  /** Flow kræver observation; uden REG-sats beregnes og vises det ikke. */
  flowDeduction: boolean;
  twistBonus: TwistBonusRule;
  elementBonusRate: string | null;
  doubleBonuses: string | null;
  maxRotations: number;
  /** Kun trampet: tilladte Pegasus-familier; `null` betyder ingen hvidliste. */
  apparatusWhitelist: readonly string[] | null;
  /** Kilder pr. C-bidrag; nøglen er bidragets id (C-ORDEN dækker alle omgange). */
  sources: Readonly<Record<string, SourceReference>>;
  /** Kilde for elementværdier uden og med trykt kode. */
  valueSource: SourceReference;
}

/** `extraLimitIssue` peger på pakkens kendte tvivl, når ekstragrænsen er afledt og ikke trykt i reglementet. */
export interface ParticipantRules { counting: number; maxExtra: number; extraOrderApplies: boolean; extraLimitIssue: string | null }

export interface SpringRules {
  tumbling: SpringRuleSet;
  trampet: SpringRuleSet;
  participants: ParticipantRules;
  /** Fund for elementer over `maxRotations` eller uden for hvidlisten. */
  forbiddenRotationIssue: string;
}

const h = (section: string, page: number): SourceReference => ({ sourceId: 'H', section, page });

export const DK_SPRING_RULES: SpringRules = Object.freeze({
  tumbling: {
    baseC: '0', deductionRates: { hold: '0.2', repetition: '0.2', requirement: '0.2', order: '0.1' }, orderDeduction: true, flowDeduction: true,
    twistBonus: { rate: '0.10', minHalfTurnsByAgeGroup: { U14: 2, junior: 2, senior: 2 }, doubleMinHalfTurns: null, tsukaharaMinHalfTurns: null },
    elementBonusRate: '0.1', doubleBonuses: '0.10', maxRotations: 2, apparatusWhitelist: null,
    sources: { 'C-GRUND': h('9.2.1', 30), 'C-HOLD': h('9.2.2.1', 30), 'C-GENTAG': h('9.2.2.3', 30), 'C-ORDEN': h('9.2.2.2', 30), 'C-RETNING': h('9.2.2.4', 30),
      'B-SKRUE': h('9.2.3.1', 31), 'B-DOBBELT': h('9.2.3.2', 31), 'B-ELEMENT': h('9.2.3.3', 31), 'C-FLOW': h('9.2.2.5', 30) },
    valueSource: h('9.3.5–6', 33),
  },
  trampet: {
    baseC: '1', deductionRates: { hold: '0.2', repetition: '0.2', requirement: '0.2', order: '0.1' }, orderDeduction: true, flowDeduction: true,
    twistBonus: { rate: '0.10', minHalfTurnsByAgeGroup: { U14: 2, junior: 3, senior: 3 }, doubleMinHalfTurns: 1, tsukaharaMinHalfTurns: 2 },
    elementBonusRate: null, doubleBonuses: '0.10', maxRotations: 2, apparatusWhitelist: null,
    sources: { 'C-GRUND': h('10.2.1', 40), 'C-HOLD': h('10.2.2.1', 40), 'C-GENTAG': h('10.2.2.3', 40), 'C-ORDEN': h('10.2.2.2', 40), 'C-REDSKAB': h('10.2.2.5', 40),
      'T-SKRUE': h('10.2.3.1 og 10.2.4', 41), 'T-DOBBELT-FRI': h('10.2.3.2', 41), 'T-DOBBELT-REDSKAB': h('10.2.3.3', 41), 'C-FLOW': h('10.2.2.4', 40) },
    valueSource: h('10.3.5–6', 43),
  },
  participants: { counting: 6, maxExtra: 2, extraOrderApplies: true, extraLimitIssue: null },
  forbiddenRotationIssue: 'DK-TRIPLE-FORBIDDEN',
} satisfies SpringRules);

/** REG (H v1.4 9.1–9.3, 10.1–10.3). Kilder svarer til kontrolposterne i `data/reg/control-posts.json`. */
export const REG_SPRING_RULES: SpringRules = Object.freeze({
  tumbling: {
    baseC: '0', deductionRates: { hold: '0.1', repetition: '0.1', requirement: '0.1', order: null }, orderDeduction: false, flowDeduction: false,
    twistBonus: { rate: '0.2', minHalfTurnsByAgeGroup: { U11: 2, U14: 2, junior: 2 }, doubleMinHalfTurns: null, tsukaharaMinHalfTurns: null },
    elementBonusRate: '0.1', doubleBonuses: null, maxRotations: 1, apparatusWhitelist: null,
    sources: { 'C-GRUND': h('9.2.1a, d', 30), 'C-HOLD': h('9.2.2.1', 30), 'C-GENTAG': h('9.2.2.3', 30), 'C-RETNING': h('9.2.2.4', 30),
      'B-SKRUE': h('9.2.3.1', 31), 'B-ELEMENT': h('9.2.3.3', 31) },
    valueSource: h('9.3.5–6', 34),
  },
  trampet: {
    baseC: '1', deductionRates: { hold: '0.1', repetition: '0.1', requirement: '0.1', order: null }, orderDeduction: false, flowDeduction: false,
    twistBonus: { rate: '0.2', minHalfTurnsByAgeGroup: { U11: 1, U14: 2, junior: 2 }, doubleMinHalfTurns: null, tsukaharaMinHalfTurns: null },
    elementBonusRate: null, doubleBonuses: null, maxRotations: 1, apparatusWhitelist: ['cartwheel-vault', 'handspring-vault'],
    sources: { 'C-GRUND': h('10.2.1a, c', 39), 'C-HOLD': h('10.2.2.1', 40), 'C-GENTAG': h('10.2.2.3', 40), 'C-REDSKAB': h('10.2.2.5', 40),
      'T-SKRUE': h('10.2.3.1', 40) },
    valueSource: h('10.3.5–6', 43),
  },
  // Højst 6 ekstra er afledt af TR 1.3.1 (højst 12 deltagere); se REG-EXTRA-LIMIT-DERIVED.
  participants: { counting: 6, maxExtra: 6, extraOrderApplies: true, extraLimitIssue: 'REG-EXTRA-LIMIT-DERIVED' },
  forbiddenRotationIssue: 'REG-MULTI-ROTATION-FORBIDDEN',
} satisfies SpringRules);

/** Ældre testindstillinger (`bonusRate`, `baseTumbling`, `baseTrampet`) overstyrer DK-standarden som før. */
export function resolveSpringRules(settings: { springRules?: SpringRules; bonusRate?: string; baseTumbling?: string; baseTrampet?: string }): SpringRules {
  const rules = settings.springRules ?? DK_SPRING_RULES;
  if (settings.springRules || settings.bonusRate === undefined && settings.baseTumbling === undefined && settings.baseTrampet === undefined) return rules;
  const override = (set: SpringRuleSet, base: string | undefined): SpringRuleSet => ({ ...set, baseC: base ?? set.baseC,
    twistBonus: { ...set.twistBonus, rate: settings.bonusRate ?? set.twistBonus.rate }, doubleBonuses: set.doubleBonuses === null ? null : settings.bonusRate ?? set.doubleBonuses });
  return { ...rules, tumbling: override(rules.tumbling, settings.baseTumbling), trampet: override(rules.trampet, settings.baseTrampet) };
}

export function ruleSetForApparatus(rules: SpringRules, apparatus: string): SpringRuleSet {
  return apparatus === 'floor' ? rules.tumbling : rules.trampet;
}

export function minTwistHalfTurns(rule: TwistBonusRule, ageGroup: string): number {
  const value = rule.minHalfTurnsByAgeGroup[ageGroup];
  if (value === undefined) throw new Error(`Ukendt aldersprofil for skruetillæg: ${ageGroup}.`);
  return value;
}

/** Danske decimaler med to cifre til regeltekster. */
export function rateText(rate: string): string {
  const [whole, decimals = ''] = rate.split('.');
  return `${whole},${decimals.padEnd(2, '0')}`;
}
