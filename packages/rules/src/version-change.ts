import { bindingFingerprint, canonicalJson, validateWorkspace, workspacePayload } from '@teamgym/domain';
import type { RulesetBinding, Workspace } from '@teamgym/domain';
import type { RuleRegistry, RulePackage } from './registry';
import type { RhythmBinding } from './rhythm';

function requirementFingerprint(binding: RhythmBinding): string | null {
  if (!binding.moment) return null;
  const moment = binding.moment;
  return canonicalJson({ general: moment.generalRequirements, category: moment.categoryRequirements, row: moment.rowRequirements,
    specific: moment.specificRequirement, options: moment.options, mirror: moment.mirrorAllowed, commonFacing: moment.commonFacingRequired });
}

export interface VersionChangePreview {
  teamId: string; basisPayload: string; oldBinding: RulesetBinding; newBinding: RulesetBinding;
  workspace: Workspace; reviews: readonly string[];
  before: { tumbling: ScenarioEvaluation[]; trampet: ScenarioEvaluation[]; rhythm: ReturnType<RulePackage['rhythm']> };
  after: VersionChangePreview['before'];
  applicability: readonly { registrationId: string; before: string; after: string }[];
}

export interface ScenarioEvaluation { scenarioId: string; name: string; evaluation: ReturnType<RulePackage['analyze']> }
export function analyzeVersionScenarios(workspace: Workspace, teamId: string, rulePackage: RulePackage): VersionChangePreview['before'] {
  const plan = workspace.plans.find((item) => item.teamId === teamId);
  if (!plan) throw new Error('Holdets plan findes ikke.');
  return { tumbling: plan.tumbling.map((scenario) => ({ scenarioId: scenario.id, name: scenario.name, evaluation: rulePackage.analyze(workspace, teamId, 'tumbling', scenario.id) })),
    trampet: plan.trampet.map((scenario) => ({ scenarioId: scenario.id, name: scenario.name, evaluation: rulePackage.analyze(workspace, teamId, 'trampet', scenario.id) })), rhythm: rulePackage.rhythm(workspace, teamId) };
}

export function previewVersionChange(workspace: Workspace, teamId: string, newBinding: RulesetBinding, registry: RuleRegistry): VersionChangePreview {
  const team = workspace.teams.find((item) => item.id === teamId);
  if (!team) throw new Error('Holdet findes ikke.');
  const previous = registry.resolve(team.rulesetBinding);
  const next = registry.resolve(newBinding);
  if (previous.status !== 'known' || next.status !== 'known') throw new Error('Begge præcise regelpakker/profiler skal være installeret for at sammenligne.');
  const copy = structuredClone(workspace);
  copy.teams.find((item) => item.id === teamId)!.rulesetBinding = structuredClone(newBinding);
  copy.plans.find((item) => item.teamId === teamId)!.bindingFingerprint = bindingFingerprint(newBinding);
  const athletes = new Set(workspace.athletes.filter((item) => item.teamId === teamId).map((item) => item.id));
  const definitions = new Map(workspace.skills.map((item) => [item.id, item]));
  const reviews: string[] = [];
  const applicability = workspace.athleteSkills.filter((registration) => athletes.has(registration.athleteId)).map((registration) => {
    const definition = definitions.get(registration.skillId)!;
    if (definition.discipline === 'rhythm') {
      const before = previous.rulePackage.bindRhythm(definition);
      const after = next.rulePackage.bindRhythm(definition);
      if (before.status === 'known' && (after.status !== 'known' || before.key !== after.key || requirementFingerprint(before) !== requirementFingerprint(after))) {
        reviews.push(registration.id);
        const target = copy.athleteSkills.find((item) => item.id === registration.id)!;
        const fingerprint = bindingFingerprint(newBinding);
        if (!target.reviewRequiredFor.includes(fingerprint)) target.reviewRequiredFor.push(fingerprint);
      }
      return { registrationId: registration.id, before: before.status, after: after.status };
    }
    return { registrationId: registration.id, before: previous.rulePackage.evaluateSkill(definition, registration).status, after: next.rulePackage.evaluateSkill(definition, registration).status };
  });
  validateWorkspace(copy);
  return { teamId, basisPayload: workspacePayload(workspace), oldBinding: structuredClone(team.rulesetBinding), newBinding: structuredClone(newBinding), workspace: copy, reviews, applicability,
    before: analyzeVersionScenarios(workspace, teamId, previous.rulePackage),
    after: analyzeVersionScenarios(copy, teamId, next.rulePackage) };
}

export function applyVersionChange(workspace: Workspace, preview: VersionChangePreview): Workspace {
  if (workspacePayload(workspace) !== preview.basisPayload) throw new Error('Data er ændret siden versionssammenligningen. Beregn igen.');
  const copy = structuredClone(preview.workspace);
  copy.updatedAt = new Date().toISOString();
  return validateWorkspace(copy);
}

export function packageChangeReport(previous: RulePackage, next: RulePackage) {
  const oldRhythm = new Map(previous.rhythmCatalog.map((entry) => [entry.id, entry]));
  return {
    from: { rulesetId: previous.manifest.rulesetId, version: previous.manifest.packageVersion }, to: { rulesetId: next.manifest.rulesetId, version: next.manifest.packageVersion },
    changedAlgorithms: [...new Set([...Object.keys(previous.manifest.algorithms), ...Object.keys(next.manifest.algorithms)])].filter((id) => previous.manifest.algorithms[id] !== next.manifest.algorithms[id]),
    changedProfiles: canonicalJson(previous.profiles) !== canonicalJson(next.profiles),
    changedRhythm: next.rhythmCatalog.filter((entry) => canonicalJson(oldRhythm.get(entry.id) ?? null) !== canonicalJson(entry)).map((entry) => entry.id),
    description: next.manifest.changeDescription,
  };
}
