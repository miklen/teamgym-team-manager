import { describe, expect, it } from 'vitest';
import { setRoundEntries } from '@teamgym/domain';
import { DK_SPRING_CATALOG } from '../../packages/rules/src/catalog';
import { DK_V1, DK_V2 } from '../../packages/rules/src/dk-v1';
import { workspaceBuilder } from '../fixtures/rule-workspace';

function jump(sourceId: string) {
  const source = DK_SPRING_CATALOG.find((item) => item.referenceId === sourceId);
  if (!source) throw new Error(`Ukendt syntetisk spring: ${sourceId}`);
  return { id: `syntetisk-${sourceId}`, name: `Syntetisk ${sourceId}`, archived: false,
    discipline: 'trampet' as const, jump: structuredClone(source.execution) };
}

function plan(packageVersion: string, rounds: readonly (readonly string[])[], extra?: { round: number; sourceId: string }) {
  const builder = workspaceBuilder();
  const team = builder.team('Syntetisk Pegasus', { rulesetId: 'dk', packageVersion, ageGroup: 'junior', teamType: 'girls' });
  const athletes = builder.workspace.athletes.filter((athlete) => athlete.teamId === team.id);
  let workspace = builder.workspace;
  rounds.forEach((sourceIds, roundIndex) => {
    const ids = extra?.round === roundIndex ? [extra.sourceId, ...sourceIds] : [...sourceIds];
    const entries = ids.map((sourceId, index) => ({
      id: `plads-${roundIndex}-${index}`, athleteId: athletes[index]!.id, athleteSkillId: builder.register(athletes[index]!.id, jump(sourceId)),
      role: extra?.round === roundIndex && index === 0 ? 'extra' as const : 'counting' as const }));
    const current = workspace.plans[0]!;
    const scenario = current.trampet[0]!;
    workspace = setRoundEntries({ ...builder.workspace, plans: workspace.plans }, current.id, 'trampet', scenario.id, scenario.rounds[roundIndex]!.id, entries, { counting: 6, extra: 2 }, builder.environment);
  });
  const rulePackage = packageVersion === '1.1.0' ? DK_V2 : DK_V1;
  return { workspace, result: rulePackage.analyze(workspace, team.id, 'trampet', workspace.plans[0]!.trampet[0]!.id) };
}

const free = Array.from({ length: 6 }, () => 'a4-f-08');
const vault = Array.from({ length: 6 }, () => 'a4-v-12');
const mixed = [...vault.slice(0, 3), ...free.slice(0, 3)];
const redskab = (result: ReturnType<typeof plan>['result']) => result.contributions.find((item) => item.id === 'C-REDSKAB')!;

describe('afklaret Pegasus-omgang i DK 1.1.0', () => {
  it('en omgang med og en uden Pegasus giver intet fradrag', () => {
    expect(redskab(plan('1.1.0', [vault, free, free]).result).decision.value?.toString()).toBe('0');
  });

  it('mangler der en omgang uden Pegasus, gives 0,20 pr. tællende gymnast', () => {
    expect(redskab(plan('1.1.0', [vault, vault, vault]).result).decision.value?.toString()).toBe('6/5');
  });

  it('en blandet omgang er ikke mulig og giver ugyldig plan i stedet for Q04', () => {
    const { workspace, result } = plan('1.1.0', [vault, mixed, free]);
    const round = workspace.plans[0]!.trampet[0]!.rounds[1]!;
    expect(result.rounds[1]!.status).toBe('invalid');
    expect(result.rounds[1]!.compositionReady).toBe(false);
    expect(redskab(result).decision.status).toBe('invalid');
    expect(redskab(result).decision.issues).not.toContain('Q04');
    expect(redskab(result).affectedIds).toEqual([round.id]);
    expect(result.diagnostics.find((item) => item.code === 'mixed-apparatus')?.affectedIds).toEqual([round.id]);
    expect(DK_V2.knownIssues.some((issue) => issue.id === 'Q04')).toBe(false);
  });

  it('en ekstra gymnast uden Pegasus gør også omgangen blandet', () => {
    expect(plan('1.1.0', [vault, free, free], { round: 0, sourceId: 'a4-f-08' }).result.rounds[0]!.status).toBe('invalid');
  });

  it('DK 1.0.0 bevarer Q04 for blandede omgange', () => {
    expect(redskab(plan('1.0.0', [mixed, mixed, mixed]).result).decision.issues).toContain('Q04');
  });
});
