import { describe, expect, it } from 'vitest';
import { DK_V1, DK_V2 } from '../../packages/rules/src/dk-v1';
import { REG_V1 } from '../../packages/rules/src/reg-v1';
import { fromRows, workspaceBuilder } from '../fixtures/rule-workspace';

const repeated = fromRows(['a3-f-05', 'a3-f-02', 'a3-f-04'], 'start-og-samme-salto');

describe('A3-startposter som selvstændige elementer', () => {
  it('tæller den første startsalto og den senere almindelige salto hver for sig i D og C', () => {
    expect(DK_V1.evaluateSkill(repeated).difficulty.value?.toString()).toBe('2/5');
    for (const rulePackage of [DK_V2, REG_V1]) {
      const evaluation = rulePackage.evaluateSkill(repeated);
      expect(evaluation.difficulty.value?.toString()).toBe('3/5');
      expect(evaluation.distinctElementCount).toBe(3);
      expect(evaluation.elementValues[0]?.identity).not.toBe(evaluation.elementValues[2]?.identity);
      expect(evaluation.validity).toBe('known');
      expect(rulePackage.knownIssues.some((issue) => issue.id === 'A3-U01')).toBe(false);
    }
  });

  it('giver kun startidentitet til de fire varianter med trykt startpost', () => {
    for (const [start, ordinary] of [['a3-f-05', 'a3-f-04'], ['a3-f-07', 'a3-f-06'], ['a3-f-09', 'a3-f-08'], ['a3-f-15', 'a3-f-14']] as const) {
      const evaluation = DK_V2.evaluateSkill(fromRows([start, 'a3-f-02', ordinary], `start-${start}`));
      expect(evaluation.elementValues[0]?.identity).not.toBe(evaluation.elementValues[2]?.identity);
      expect(evaluation.distinctElementCount).toBe(3);
    }
    const noStartPost = fromRows(['a3-f-10', 'a3-f-02', 'a3-f-10'], 'halv-skrue-uden-startpost');
    const back = fromRows(['a3-b-04', 'a3-b-02', 'a3-b-04'], 'baglaens-uden-startpost');
    for (const skill of [noStartPost, back]) {
      const evaluation = DK_V2.evaluateSkill(skill);
      expect(evaluation.elementValues[0]?.identity).toBe(evaluation.elementValues[2]?.identity);
      expect(evaluation.distinctElementCount).toBe(2);
    }
  });

  it('opdaterer holdets beregnede D og elementtillæg uden at ændre den gemte serie', () => {
    for (const rulePackage of [DK_V2, REG_V1]) {
      const builder = workspaceBuilder();
      const team = builder.team('Syntetisk startsaltohold', { rulesetId: rulePackage.manifest.rulesetId, packageVersion: rulePackage.manifest.packageVersion, ageGroup: 'junior', teamType: 'girls' });
      for (const round of [0, 1, 2]) builder.fill(team.id, 'tumbling', round, Array.from({ length: 6 }, () => repeated));
      const scenarioId = builder.workspace.plans[0]!.tumbling[0]!.id;
      const analysis = rulePackage.analyze(builder.workspace, team.id, 'tumbling', scenarioId);
      expect(analysis.difficulty.value?.toString()).toBe('18/5');
      expect(analysis.contributions.find((item) => item.id === 'B-ELEMENT')?.decision.value?.toString()).toBe('6/5');
    }
  });
});
