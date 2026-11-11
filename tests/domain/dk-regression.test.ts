import { describe, expect, it } from 'vitest';
import { hasTwistDistributionChoice, needsTwistDistribution, outTwistDistribution, setPlannedSpot, setRoundEntries } from '@teamgym/domain';
import type { ElementExecution, RulesetBinding, SkillDefinition, SpringDiscipline } from '@teamgym/domain';
import { DK_SPRING_CATALOG } from '../../packages/rules/src/catalog';
import type { NumericDecision } from '../../packages/rules/src/dk-numeric';
import { DK_V1, DK_V2 } from '../../packages/rules/src/dk-v1';
import type { RulePackage } from '../../packages/rules/src/registry';
import { fromRows, workspaceBuilder } from '../fixtures/rule-workspace';

/*
 * Før/efter-billede for DK 1.0.0 og 1.1.0 (REG-change opgave 2.1/2.5).
 * Snapshotfilen blev skrevet, før motoren blev parametriseret, og må ikke opdateres for at få DK-ændringer igennem.
 */

type Spring = Exclude<SkillDefinition, { discipline: 'rhythm' }>;
const packages: [string, RulePackage][] = [['1.0.0', DK_V1], ['1.1.0', DK_V2]];
const decision = (item: NumericDecision) => [item.status, item.value?.toString() ?? '-', item.knownSubtotal.toString(), item.issues.join(','),
  Object.entries(item.alternatives).map(([key, value]) => `${key}=${value.toString()}`).join(',')].join('|');
/** Én linje pr. nøgle holder filen lille og diffen læsbar. */
const lines = (result: Record<string, unknown>) => `{\n${Object.entries(result).map(([key, value]) => `${JSON.stringify(key)}: ${JSON.stringify(value)}`).join(',\n')}\n}\n`;
function element(sourceId: string): Spring {
  const source = DK_SPRING_CATALOG.find((item) => item.referenceId === sourceId)!;
  return source.source.sourceId === 'A3' ? fromRows([sourceId], `dk-snap-${sourceId}`) :
    { id: `dk-snap-${sourceId}`, name: `Syntetisk ${sourceId}`, archived: false, discipline: 'trampet', jump: structuredClone(source.execution) };
}
/** Format 7 kræver en valgt skruefordeling; planerne bruger samme out-fordeling som migreringen. */
const out = (execution: ElementExecution): ElementExecution =>
  needsTwistDistribution(execution) ? { ...execution, twistDistribution: outTwistDistribution(execution) } : execution;
const series = (...rows: string[]) => fromRows(rows, `dk-snap-${rows.join('-')}`);
const catalogExecution = (execution: ElementExecution): ElementExecution =>
  hasTwistDistributionChoice(execution) ? { ...execution, twistDistribution: [] } : execution;
const catalogDistribution = (definition: SkillDefinition): SkillDefinition =>
  definition.discipline === 'tumbling' ? { ...definition, elements: definition.elements.map(catalogExecution) }
    : definition.discipline === 'trampet' ? { ...definition, jump: catalogExecution(definition.jump) } : definition;
const withOut = (definition: Spring): Spring =>
  definition.discipline === 'tumbling' ? { ...definition, elements: definition.elements.map(out) } : { ...definition, jump: out(definition.jump) };
const times = <T>(count: number, item: T): T[] => Array.from({ length: count }, () => item);

interface PlanSpec { name: string; discipline: SpringDiscipline; rounds: { counting: Spring[]; extras?: Spring[] }[]; spots?: { round: number; entry: number; grade: 'support' | 'assist' | 'heavy' }[] }
const T = (...rounds: Spring[][]) => rounds.map((counting) => ({ counting }));
const RF = series('a3-b-01', 'a3-b-02');
const RFL = series('a3-b-01', 'a3-b-02', 'a3-b-04');
const RFS = series('a3-b-01', 'a3-b-02', 'a3-b-06');
const RFS180 = series('a3-b-01', 'a3-b-02', 'a3-b-10');
const RFS360 = series('a3-b-01', 'a3-b-02', 'a3-b-11');
const RFDL = series('a3-b-01', 'a3-b-02', 'a3-b-15');
const RFDS720 = series('a3-b-01', 'a3-b-02', 'a3-b-21');
const RFTRIPLE = series('a3-b-01', 'a3-b-02', 'a3-b-23');
const KL = series('a3-f-02', 'a3-f-04');
const KS360 = series('a3-f-02', 'a3-f-11');
const KDL = series('a3-f-02', 'a3-f-19');
const RFF = series('a3-b-01', 'a3-b-02', 'a3-b-02');
const j = (id: string) => element(id);

const PLANS: PlanSpec[] = [
  { name: 'bane-fuld', discipline: 'tumbling', rounds: T(times(6, RFL), times(6, KL), times(6, RFS360)) },
  { name: 'bane-dobbelt', discipline: 'tumbling', rounds: T(times(6, RFDL), [...times(3, RFS360), ...times(3, RFDS720)], times(6, KDL)) },
  { name: 'bane-orden', discipline: 'tumbling', rounds: T(times(6, RFL), [RFS360, RFS, ...times(4, RFS180)], [RFDL, RFS, RFDS720, RFL, KS360, KL]) },
  { name: 'bane-hold-afvig', discipline: 'tumbling', rounds: T([...times(5, RFL), RFS], times(6, KL), times(6, RFS360)) },
  { name: 'bane-hold-3-3', discipline: 'tumbling', rounds: T([...times(3, RFL), ...times(3, RFS)], times(6, KL), times(6, RFS360)) },
  { name: 'bane-gentag', discipline: 'tumbling', rounds: T(times(6, RF), [...times(2, RFL), ...times(4, KL)], [...times(3, RFL), ...times(3, RFS)]) },
  { name: 'bane-element', discipline: 'tumbling', rounds: T(times(6, RFF), times(6, series('a3-f-02')), times(6, series('a3-f-01'))) },
  { name: 'bane-retning', discipline: 'tumbling', rounds: T(times(6, series('a3-b-01')), times(6, series('a3-b-02')), times(6, series('a3-b-03'))) },
  { name: 'bane-trippel', discipline: 'tumbling', rounds: T(times(6, RFL), [...times(5, RFS360), RFTRIPLE], times(6, KL)) },
  { name: 'bane-ufuld', discipline: 'tumbling', rounds: T(times(6, RFL), times(4, KL), []) },
  { name: 'bane-ekstra-modtag', discipline: 'tumbling', rounds: [{ counting: times(6, RFL), extras: times(2, RFS360) }, { counting: times(6, KL) }, { counting: times(6, RFS360) }],
    spots: [{ round: 2, entry: 5, grade: 'heavy' }, { round: 1, entry: 0, grade: 'support' }, { round: 0, entry: 0, grade: 'assist' }] },
  { name: 'trampet-fuld', discipline: 'trampet', rounds: T(times(6, j('a4-f-01')), times(6, j('a4-v-02')), times(6, j('a4-f-07'))) },
  { name: 'trampet-skrue-u14', discipline: 'trampet', rounds: T(times(6, j('a4-f-01')), [...times(4, j('a4-f-04')), ...times(2, j('a4-f-02'))], times(6, j('a4-v-02'))) },
  { name: 'trampet-skrue-540', discipline: 'trampet', rounds: T(times(6, j('a4-f-01')), times(6, j('a4-f-08')), times(6, j('a4-v-14'))) },
  { name: 'trampet-dobbelt', discipline: 'trampet', rounds: T(times(6, j('a4-f-11')), times(6, j('a4-v-08')), [...times(3, j('a4-f-14')), ...times(3, j('a4-f-17'))]) },
  { name: 'trampet-tsuk', discipline: 'trampet', rounds: T(times(6, j('a4-v-03')), times(6, j('a4-v-06')), times(6, j('a4-f-07'))) },
  { name: 'trampet-uden-pegasus', discipline: 'trampet', rounds: T(times(6, j('a4-f-01')), times(6, j('a4-f-02')), times(6, j('a4-f-03'))) },
  { name: 'trampet-blandet', discipline: 'trampet', rounds: T(times(6, j('a4-v-02')), [...times(3, j('a4-v-02')), ...times(3, j('a4-f-03'))], times(6, j('a4-f-01'))) },
  { name: 'trampet-orden', discipline: 'trampet', rounds: T(times(6, j('a4-f-01')), [j('a4-f-10'), j('a4-f-08'), ...times(4, j('a4-f-09'))], [j('a4-f-11'), ...times(5, j('a4-f-07'))]) },
  { name: 'trampet-gentag-hold', discipline: 'trampet', rounds: T([...times(5, j('a4-f-01')), j('a4-f-02')], [...times(2, j('a4-f-02')), ...times(4, j('a4-f-03'))], [...times(3, j('a4-f-02')), ...times(3, j('a4-v-12'))]) },
  { name: 'trampet-trippel', discipline: 'trampet', rounds: T(times(6, j('a4-f-21')), times(6, j('a4-v-16')), times(6, j('a4-f-01'))) },
  { name: 'trampet-ekstra-modtag', discipline: 'trampet', rounds: [{ counting: times(6, j('a4-f-08')), extras: [j('a4-f-10')] }, { counting: times(6, j('a4-v-02')) }, { counting: times(6, j('a4-f-07')) }],
    spots: [{ round: 0, entry: 6, grade: 'heavy' }, { round: 1, entry: 2, grade: 'assist' }, { round: 0, entry: 0, grade: 'support' }] },
];

function analyzePlan(spec: PlanSpec, binding: RulesetBinding, rulePackage: RulePackage) {
  const builder = workspaceBuilder();
  const team = builder.team('Syntetisk DK', binding, 9);
  const athletes = builder.workspace.athletes.filter((athlete) => athlete.teamId === team.id);
  const plan = () => builder.workspace.plans.find((item) => item.teamId === team.id)!;
  spec.rounds.forEach((round, roundIndex) => {
    const definitions = [...(round.extras ?? []), ...round.counting];
    const entries = definitions.map((definition, index) => ({ id: builder.environment.id(), athleteId: athletes[index]!.id,
      athleteSkillId: builder.register(athletes[index]!.id, withOut(definition)), role: index < (round.extras?.length ?? 0) ? 'extra' as const : 'counting' as const }));
    const scenario = plan()[spec.discipline][0]!;
    builder.workspace = setRoundEntries(builder.workspace, plan().id, spec.discipline, scenario.id, scenario.rounds[roundIndex]!.id, entries, { counting: 6, extra: 2 }, builder.environment);
  });
  for (const spot of spec.spots ?? []) {
    const scenario = plan()[spec.discipline][0]!;
    const round = scenario.rounds[spot.round]!;
    builder.workspace = setPlannedSpot(builder.workspace, plan().id, spec.discipline, scenario.id, round.id, round.entries[spot.entry]!.id, { grade: spot.grade }, builder.environment);
  }
  // Snapshotten er skrevet med katalogets uafklarede fordelinger. Planen bygges gyldigt i format 7, men regelmotoren får de
  // oprindelige definitioner, så billedet fortsat låser motorens adfærd og ikke dataformatet.
  builder.workspace = { ...builder.workspace, skills: builder.workspace.skills.map(catalogDistribution) };
  const analysis = rulePackage.analyze(builder.workspace, team.id, spec.discipline, plan()[spec.discipline][0]!.id);
  const profile = rulePackage.profiles.find((item) => item.ageGroup === binding.ageGroup && item.teamType === binding.teamType)!;
  return {
    status: analysis.status, difficulty: decision(analysis.difficulty),
    composition: { status: analysis.composition.status, raw: analysis.composition.raw?.toString() ?? null, value: analysis.composition.value?.toString() ?? null, subtotal: analysis.composition.knownSubtotal.toString() },
    maximum: decision(analysis.maximumScore),
    contributions: analysis.contributions.map((item) => ({ id: item.id, kind: item.kind, decision: decision(item.decision), sources: item.sources, counts: item.guideCounts ?? null })),
    diagnostics: analysis.diagnostics.map((item) => ({ code: item.code, status: item.status, message: item.message })),
    rounds: analysis.rounds.map((round) => ({ status: round.status, difficulty: decision(round.difficulty), hold: decision(round.holdDeduction), order: decision(round.order.deduction),
      orderFaults: round.orderFaultIds.length, execution: decision(round.plannedExecution.deduction), ready: round.compositionReady,
      entries: round.entries.map((item) => ({ role: item.entry.role, status: item.status, original: decision(item.originalD), adjusted: decision(item.adjustedD), spot: decision(item.spotD), eligibleForC: item.eligibleForC })) })),
    guide: rulePackage.guide(analysis, profile).map((row) => ({ id: row.id, label: row.label, counting: row.counting, requirement: row.requirement, status: row.status, detail: row.detail,
      current: row.current?.toString() ?? null, preliminary: row.preliminary?.toString() ?? null, maximum: row.ruleMaximum?.toString() ?? null, issues: [...row.issues], example: row.example })),
    overview: rulePackage.guideOverview(analysis),
  };
}

describe('DK-før/efter-billede', () => {
  it('evaluerer hvert katalogelement uændret i DK 1.0.0 og 1.1.0', async () => {
    const result = Object.fromEntries(packages.map(([version, rulePackage]) => [version, DK_SPRING_CATALOG.map((row) => {
      const evaluation = rulePackage.evaluateSkill(element(row.referenceId));
      return { id: row.referenceId, difficulty: decision(evaluation.difficulty), status: evaluation.status, validity: evaluation.validity, identity: evaluation.identity,
        rotation: evaluation.rotationCategory, order: evaluation.orderCategory, hasDouble: evaluation.hasDouble, twist: evaluation.hasBaneTwist, sources: evaluation.explanation.sources };
    })]));
    await expect(lines(Object.fromEntries(Object.entries(result).flatMap(([version, rows]) => rows.map((row) => [`${version}/${row.id}`, row]))))).toMatchFileSnapshot('__snapshots__/dk-regression-elements.json');
  });

  it('analyserer syntetiske planer uændret for alle DK-aldersgrupper', async () => {
    const result: Record<string, unknown> = {};
    for (const [version, rulePackage] of packages) for (const ageGroup of ['U14', 'junior', 'senior']) for (const spec of PLANS) {
      result[`${version}/${ageGroup}/${spec.name}`] = analyzePlan(spec, { rulesetId: 'dk', packageVersion: version, ageGroup, teamType: 'girls' }, rulePackage);
    }
    await expect(lines(result)).toMatchFileSnapshot('__snapshots__/dk-regression-plans.json');
  });
});
