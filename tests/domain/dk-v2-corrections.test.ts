import { expect, it } from 'vitest';
import { confirmConnection } from '@teamgym/domain';
import { DK_V1, DK_V2 } from '../../packages/rules/src/dk-v1';
import { DK_SPRING_CATALOG } from '../../packages/rules/src/catalog';
import { workspaceBuilder, fromRows } from '../fixtures/rule-workspace';

const six = <T>(value: T): T[] => Array.from({ length: 6 }, () => structuredClone(value));
const binding = { rulesetId: 'dk', packageVersion: '1.1.0', ageGroup: 'junior', teamType: 'girls' };

it('ny pakke bevarer ubekræftet forbindelses teoretiske D, men giver ingen sikker disciplin-D', () => {
  const builder = workspaceBuilder();
  const team = builder.team('Syntetisk forbindelse', binding);
  const basic = fromRows(['a3-b-01', 'a3-b-02', 'a3-b-06'], 'basic-v2');
  const special = fromRows(['a3-f-02', 'a3-b-11'], 'special-v2');
  builder.fill(team.id, 'tumbling', 0, six(basic));
  builder.fill(team.id, 'tumbling', 1, six(special));
  builder.fill(team.id, 'tumbling', 2, six(basic));
  const result = DK_V2.analyze(
    builder.workspace,
    team.id,
    'tumbling',
    builder.workspace.plans[0]!.tumbling[0]!.id,
  );
  expect(result.rounds[1]!.counting[0]!.evaluation?.difficulty.value?.toString()).toBe('7/10');
  expect(result.rounds[1]!.difficulty.status).toBe('incomplete');
  expect(result.difficulty.status).toBe('incomplete');
  expect(result.panelD).toBeNull();
});

it('eksplicit mellemtrin kan ikke godkendes med en fri trænernote', () => {
  const builder = workspaceBuilder();
  builder.team('Syntetisk mellemtrin', binding);
  const skill = fromRows(['a3-b-01', 'a3-b-02', 'a3-b-11'], 'step-v2');
  if (skill.discipline !== 'tumbling') throw new Error('Testdefinition');
  skill.connection = { kind: 'custom', transitions: ['direct', 'mellemtrin'] };
  const registrationId = builder.register(builder.workspace.athletes[0]!.id, skill);
  builder.workspace = confirmConnection(
    builder.workspace,
    registrationId,
    'Syntetisk bekræftelse.',
    builder.environment,
  );
  const registration = builder.workspace.athleteSkills.find((item) => item.id === registrationId)!;
  const definition = builder.workspace.skills.find((item) => item.id === registration.skillId)!;
  if (definition.discipline === 'rhythm') throw new Error('Testdefinition');
  const result = DK_V2.evaluateSkill(definition, registration);
  expect(result.validity).toBe('invalid');
  expect(result.difficulty.value).toBeNull();
  expect(result.difficulty.issues).toContain('INTERRUPTED-CONNECTION');
});

it('en beskrivelse af direkte forbindelse uden mellemtrin er ikke en afbrydelse', () => {
  const skill = fromRows(['a3-b-01', 'a3-b-02', 'a3-b-06'], 'uden-mellemtrin-v2');
  if (skill.discipline !== 'tumbling') throw new Error('Testdefinition');
  skill.connection = { kind: 'custom', transitions: ['direct', 'Trænerbeskrevet direkte forbindelse uden mellemtrin'] };
  expect(DK_V2.evaluateSkill(skill).connection).toBe('unverified');
  expect(DK_V2.evaluateSkill(skill).validity).toBe('incomplete');
});

it('samme Tsukahara giver samme identitet og fuld holdomgangs-D', () => {
  const builder = workspaceBuilder();
  const team = builder.team('Syntetisk Tsukahara', binding);
  const ordinary = {
    id: 'normal-v2',
    name: 'Syntetisk',
    archived: false,
    discipline: 'trampet' as const,
    jump: structuredClone(DK_SPRING_CATALOG.find((item) => item.referenceId === 'a4-v-06')!.execution),
  };
  const explicit = structuredClone(ordinary);
  explicit.id = 'explicit-v2';
  explicit.jump.variant = { twistAfterHandsHalfTurns: 2 };
  expect(DK_V2.evaluateSkill(ordinary).identity).toBe(DK_V2.evaluateSkill(explicit).identity);
  builder.fill(team.id, 'trampet', 0, [...six(ordinary).slice(0, 5), explicit]);
  const result = DK_V2.analyze(
    builder.workspace,
    team.id,
    'trampet',
    builder.workspace.plans[0]!.trampet[0]!.id,
  );
  expect(result.rounds[0]!.difficulty.value?.toString()).toBe('39/5');
  expect(result.rounds[0]!.holdDeduction.value?.toString()).toBe('0');
});

it('ny rytmetekst og sissonevalg ændrer ikke gammel pakke', () => {
  const oldSissone = DK_V1.rhythmCatalog.find((entry) => entry.id === 'rh-j-sissone-180')!;
  const newSissone = DK_V2.rhythmCatalog.find((entry) => entry.id === 'rh-j-sissone-180')!;
  expect(oldSissone.commonFacingRequired).toBe(true);
  expect(newSissone.commonFacingRequired).toBe(false);
  expect(newSissone.options.some((option) => option.key === 'facing')).toBe(false);
  expect(DK_V1.rhythmCatalog[0]!.generalRequirements.join(' ')).toContain('højst ét skridt');
  expect(DK_V2.rhythmCatalog[0]!.generalRequirements.join(' ')).toContain('højst tre gå- eller løbeskridt');
});

it('blandet omgang med to mulige retningskrav giver ikke et sikkert C-fradrag', () => {
  const builder = workspaceBuilder();
  const team = builder.team('Syntetisk retning', binding);
  const forward = fromRows(['a3-f-02', 'a3-f-13'], 'forward-v2');
  const backward = fromRows(['a3-b-01', 'a3-b-02', 'a3-b-06'], 'backward-v2');
  const mixed = fromRows(['a3-f-02', 'a3-b-06'], 'mixed-v2');
  builder.fill(team.id, 'tumbling', 0, [...six(forward).slice(0, 3), ...six(backward).slice(0, 3)]);
  builder.fill(team.id, 'tumbling', 1, [
    ...six(forward).slice(0, 2),
    ...six(backward).slice(0, 2),
    ...six(mixed).slice(0, 2),
  ]);
  builder.fill(team.id, 'tumbling', 2, [
    ...six(forward).slice(0, 2),
    ...six(backward).slice(0, 2),
    ...six(mixed).slice(0, 2),
  ]);
  for (const registration of builder.workspace.athleteSkills) {
    if (builder.workspace.skills.find((skill) => skill.id === registration.skillId)?.name === mixed.name)
      builder.workspace = confirmConnection(
        builder.workspace,
        registration.id,
        'Syntetisk direkte forbindelse.',
        builder.environment,
      );
  }
  const result = DK_V2.analyze(
    builder.workspace,
    team.id,
    'tumbling',
    builder.workspace.plans[0]!.tumbling[0]!.id,
  );
  const direction = result.contributions.find((item) => item.id === 'C-RETNING')!.decision;
  expect(direction.status).toBe('unresolved');
  expect(direction.issues).toContain('C-RETNING-VALG');
  expect(direction.alternatives.independentMaxima?.toString()).toBe('6/5');
});
