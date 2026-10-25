import { describe, expect, it } from 'vitest';
import { bindingFingerprint, confirmRuleReview, parseWorkspace, serializeWorkspace, updateAssessment } from '@teamgym/domain';
import type { SkillDefinition } from '@teamgym/domain';
import { DK_RHYTHM_CATALOG } from '../../packages/rules/src/catalog';
import { DK_DEFAULT_BINDING, DK_PROFILES } from '../../packages/rules/src/dk-data';
import { createDKFamilyPackage, DK_V1 } from '../../packages/rules/src/dk-v1';
import { RuleRegistry } from '../../packages/rules/src/registry';
import { applyVersionChange, packageChangeReport, previewVersionChange } from '../../packages/rules/src/version-change';
import { fromRows, workspaceBuilder } from '../fixtures/rule-workspace';

function testOnlyPackage() {
  const settings = { difficultyMultiplier: '2', bonusRate: '0.20', baseTrampet: '2' };
  const profiles = DK_PROFILES.filter((profile) => profile.ageGroup === 'junior' && profile.teamType === 'girls').map((profile) => ({ ...structuredClone(profile), counting: 4, extra: 1, label: 'Kun syntetisk testprofil' }));
  const rhythmCatalog = DK_RHYTHM_CATALOG.map((entry) => ({ ...structuredClone(entry), mirrorAllowed: false,
    options: [...structuredClone(entry.options), { key: 'side', label: 'Testside', values: ['left', 'right'], defaultValue: 'left' }] }));
  return { settings, rulePackage: createDKFamilyPackage({ manifest: { ...structuredClone(DK_V1.manifest), rulesetId: 'synthetic-only', packageVersion: '2.0.0', name: 'Kun kontrakttest — ikke REG eller Liga', production: false,
    algorithms: { ...DK_V1.manifest.algorithms, difficulty: 'synthetic-d-2', rhythm: 'synthetic-rhythm-2' }, changeDescription: 'Kun test: andre point, fire deltagere og ingen spejlingsækvivalens.' }, profiles, rhythmCatalog, settings }) };
}
const headstand = (side: string): SkillDefinition => ({ id: `headstand-${side}`, name: 'Syntetisk hovedstand', archived: false, discipline: 'rhythm', momentId: 'rh-hb-headstand', variant: { legs: 'together', side } });

describe('uforanderlige pakker og forskellige reglementer i samme arbejdsrum', () => {
  it('afviser ændret indhold eller algoritme under samme id/version', () => {
    const registry = new RuleRegistry();
    registry.register(DK_V1);
    expect(registry.register(DK_V1)).toBe(DK_V1);
    expect(() => registry.register({ ...DK_V1, manifest: { ...DK_V1.manifest, name: 'Ændret under samme version' } })).toThrow('ny version');
    expect(() => registry.register({ ...DK_V1, evaluateSkill: (...args) => DK_V1.evaluateSkill(...args) })).toThrow('ny version');
    expect(Object.isFrozen(DK_V1.manifest)).toBe(true);
  });

  it('to hold følger hver sin pakke gennem katalog, deltagerkrav, analyse og rytme', async () => {
    const builder = workspaceBuilder();
    const registry = new RuleRegistry(); registry.register(DK_V1);
    const { rulePackage, settings } = testOnlyPackage(); registry.register(rulePackage);
    const teamA = builder.team('Syntetisk DK');
    const teamB = builder.team('Syntetisk anden pakke', { rulesetId: 'synthetic-only', packageVersion: '2.0.0', ageGroup: 'junior', teamType: 'girls' }, 4);
    const base = fromRows(['a3-b-01', 'a3-b-02', 'a3-b-06'], 'shared-series');
    for (let index = 0; index < 3; index++) { builder.fill(teamA.id, 'tumbling', index, Array.from({ length: 6 }, () => base)); builder.fill(teamB.id, 'tumbling', index, Array.from({ length: 4 }, () => base), 4); }
    for (const team of [teamA, teamB]) builder.workspace.athletes.filter((athlete) => athlete.teamId === team.id).forEach((athlete, index) => builder.register(athlete.id, headstand(index % 2 ? 'left' : 'right')));
    const dk = registry.resolve(teamA.rulesetBinding); const other = registry.resolve(teamB.rulesetBinding);
    expect(dk.status).toBe('known'); expect(other.status).toBe('known');
    if (dk.status !== 'known' || other.status !== 'known') throw new Error('Pakkerne skal findes');
    expect(dk.profile.counting).toBe(6); expect(other.profile.counting).toBe(4);
    expect(dk.rulePackage.analyze(builder.workspace, teamA.id, 'tumbling').difficulty.value?.toString()).toBe('18/5');
    expect(other.rulePackage.analyze(builder.workspace, teamB.id, 'tumbling').difficulty.value?.toString()).toBe('24/5');
    expect(dk.rulePackage.rhythm(builder.workspace, teamA.id).filter((row) => row.moment.id === 'rh-hb-headstand').some((row) => row.summary.common)).toBe(true);
    expect(other.rulePackage.rhythm(builder.workspace, teamB.id).filter((row) => row.moment.id === 'rh-hb-headstand').some((row) => row.summary.common)).toBe(false);
    const dkPotential = await dk.rulePackage.potentials(builder.workspace, teamA.id, 'tumbling');
    const otherPotential = await other.rulePackage.potentials(builder.workspace, teamB.id, 'tumbling');
    expect(dkPotential.find((item) => item.id === 'B-SKRUE')?.ruleMaximum?.toString()).toBe('3/5');
    expect(otherPotential.find((item) => item.id === 'B-SKRUE')?.ruleMaximum?.toString()).toBe('4/5');
    expect(otherPotential.find((item) => item.id === 'B-SKRUE')?.preview?.after.rounds.every((round) => round.counting.length === 4)).toBe(true);
    expect(registry.list().map((item) => item.manifest.rulesetId)).toEqual(['dk']);
    settings.difficultyMultiplier = '10';
    expect(other.rulePackage.evaluateSkill(base).difficulty.value?.toString()).toBe('6/5');
    expect(parseWorkspace(serializeWorkspace(builder.workspace))).toEqual(builder.workspace);
  });

  it('ukendt pakke vælger ikke nyeste og forhindrer ikke gemning af kendte andre hold', () => {
    const builder = workspaceBuilder(); const knownTeam = builder.team('Kendt');
    const unknownTeam = builder.team('Ukendt', { ...DK_DEFAULT_BINDING, packageVersion: '999.0.0' });
    const registry = new RuleRegistry(); registry.register(DK_V1);
    expect(registry.resolve(unknownTeam.rulesetBinding).status).toBe('unresolved');
    expect(registry.get('dk', '999.0.0')).toBeNull();
    const reopened = parseWorkspace(serializeWorkspace(builder.workspace));
    expect(reopened.teams.find((team) => team.id === unknownTeam.id)?.rulesetBinding).toEqual(unknownTeam.rulesetBinding);
    expect(registry.resolve(reopened.teams.find((team) => team.id === knownTeam.id)!.rulesetBinding).status).toBe('known');
  });
});

describe('versionsskift med bevaret kunnen, eksplicit revurdering og uændret andet hold', () => {
  it('kode-/værdiændring ændrer ikke færdigheds-id eller stabilitet; annullering ændrer intet', () => {
    const builder = workspaceBuilder(); const teamA = builder.team('A'); const teamB = builder.team('B');
    for (const athlete of builder.workspace.athletes) builder.register(athlete.id, headstand('left'));
    const base = fromRows(['a3-b-01', 'a3-b-02', 'a3-b-06'], 'version-series');
    for (let index = 0; index < 3; index++) { builder.fill(teamA.id, 'tumbling', index, Array.from({ length: 6 }, () => base)); builder.fill(teamB.id, 'tumbling', index, Array.from({ length: 6 }, () => base)); }
    const registry = new RuleRegistry(); registry.register(DK_V1);
    const next = createDKFamilyPackage({ manifest: { ...structuredClone(DK_V1.manifest), packageVersion: '1.1.0-test', production: false, algorithms: { ...DK_V1.manifest.algorithms, difficulty: 'test-d-value-2' }, changeDescription: 'Kun regressionstest af ændret værdi og kode.' },
      rhythmCatalog: DK_RHYTHM_CATALOG.map((entry) => entry.id === 'rh-hb-headstand' ? { ...structuredClone(entry), officialCode: 'TEST201', value: '0.40' } : structuredClone(entry)), settings: { difficultyMultiplier: '2' } });
    registry.register(next);
    const original = serializeWorkspace(builder.workspace);
    const preview = previewVersionChange(builder.workspace, teamA.id, { ...teamA.rulesetBinding, packageVersion: next.manifest.packageVersion }, registry);
    expect(serializeWorkspace(builder.workspace)).toBe(original);
    expect(preview.reviews).toEqual([]);
    expect(preview.before.tumbling.difficulty.value?.toString()).toBe('18/5');
    expect(preview.after.tumbling.difficulty.value?.toString()).toBe('36/5');
    const applied = applyVersionChange(builder.workspace, preview);
    expect(applied.athleteSkills).toEqual(builder.workspace.athleteSkills);
    expect(applied.teams.find((team) => team.id === teamB.id)).toEqual(teamB);
    expect(applied.plans.find((plan) => plan.teamId === teamB.id)).toEqual(builder.workspace.plans.find((plan) => plan.teamId === teamB.id));
    expect(DK_V1.analyze(applied, teamB.id, 'tumbling').difficulty.value?.toString()).toBe('18/5');
    expect(packageChangeReport(DK_V1, next)).toMatchObject({ changedAlgorithms: ['difficulty'], changedRhythm: ['rh-hb-headstand'] });
  });

  it('ændret udførelseskrav kræver eksplicit revurdering uden at slette vurderingen', () => {
    const builder = workspaceBuilder(); const teamA = builder.team('A'); const teamB = builder.team('B');
    for (const athlete of builder.workspace.athletes) builder.register(athlete.id, headstand('left'));
    const registry = new RuleRegistry(); registry.register(DK_V1);
    const next = createDKFamilyPackage({ manifest: { ...structuredClone(DK_V1.manifest), packageVersion: '2.0.0-test', production: false, changeDescription: 'Kun test af nyt udførelseskrav.' }, rhythmCatalog: DK_RHYTHM_CATALOG.map((entry) => entry.id === 'rh-hb-headstand' ? {
      ...structuredClone(entry), rowRequirements: [...entry.rowRequirements, 'Syntetisk nyt krav, som kræver trænerens revurdering.'],
    } : structuredClone(entry)) }); registry.register(next);
    const newBinding = { ...teamA.rulesetBinding, packageVersion: next.manifest.packageVersion };
    const preview = previewVersionChange(builder.workspace, teamA.id, newBinding, registry);
    expect(preview.reviews).toHaveLength(8);
    const applied = applyVersionChange(builder.workspace, preview);
    expect(applied.athleteSkills.every((item) => item.stability === 5)).toBe(true);
    expect(next.rhythm(applied, teamA.id).filter((row) => row.moment.id === 'rh-hb-headstand')[0]?.summary.passesThreshold).toBe(false);
    expect(DK_V1.rhythm(applied, teamB.id).filter((row) => row.moment.id === 'rh-hb-headstand')[0]?.summary.common).toBe(true);
    const reviewed = confirmRuleReview(applied, preview.reviews[0]!, newBinding, { stability: 4, assessedAt: '2026-10-25', note: 'Nyt konkret krav kontrolleret i syntetisk test.' }, builder.environment);
    expect(reviewed.athleteSkills.find((item) => item.id === preview.reviews[0])?.reviewRequiredFor).not.toContain(bindingFingerprint(newBinding));
    expect(next.rhythm(reviewed, teamA.id).filter((row) => row.moment.id === 'rh-hb-headstand')[0]?.summary.assessedCount).toBe(1);
    const changed = updateAssessment(builder.workspace, builder.workspace.athleteSkills[0]!.id, { stability: 1, assessedAt: '2026-10-25', note: 'Ændring efter preview' }, builder.environment);
    expect(() => applyVersionChange(changed, preview)).toThrow('Beregn igen');
  });
});
