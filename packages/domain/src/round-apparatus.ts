import type { RoundEntryInput, SkillDefinition, Workspace } from './schema';

export type TrampetApparatus = 'trampet' | 'pegasus';
type Entry = Pick<RoundEntryInput, 'id' | 'athleteSkillId' | 'plannedSkillId'>;

export function trampetApparatus(skill: SkillDefinition | undefined): TrampetApparatus | null {
  const apparatus = skill?.discipline === 'trampet' ? skill.jump.apparatus : null;
  return apparatus === 'trampet' || apparatus === 'pegasus' ? apparatus : null;
}

export function roundApparatusLookup(workspace: Workspace) {
  const skills = new Map(workspace.skills.map((skill) => [skill.id, trampetApparatus(skill)]));
  const registrations = new Map(workspace.athleteSkills.map((item) => [item.id, skills.get(item.skillId)]));
  return (entries: readonly Entry[]) => {
    const placements = new Map<string, TrampetApparatus>();
    for (const entry of entries) {
      const apparatus = entry.athleteSkillId === null ? skills.get(entry.plannedSkillId ?? '') : registrations.get(entry.athleteSkillId);
      if (apparatus) placements.set(entry.id, apparatus);
    }
    const kinds = new Set(placements.values());
    return { type: kinds.size > 1 ? 'mixed' as const : kinds.values().next().value ?? null, placements };
  };
}

export type RoundApparatus = ReturnType<ReturnType<typeof roundApparatusLookup>>;

export function roundApparatus(workspace: Workspace, entries: readonly Entry[]): RoundApparatus {
  return roundApparatusLookup(workspace)(entries);
}

export function workspaceRoundApparatus(workspace: Workspace) {
  const classify = roundApparatusLookup(workspace);
  return new Map(workspace.plans.flatMap((plan) => plan.trampet.flatMap((scenario) => scenario.rounds.map((round, index) => [round.id, {
    apparatus: classify(round.entries), scenario: scenario.name, number: index + 1,
  }] as const))));
}

export function retainedApparatusMix(before: RoundApparatus | undefined, after: RoundApparatus): boolean {
  return before?.type === 'mixed' && [...after.placements].every(([id, type]) => before.placements.get(id) === type);
}

export function assertRoundApparatusEdit(before: RoundApparatus, after: RoundApparatus): void {
  if (after.type === 'mixed' && !retainedApparatusMix(before, after)) {
    throw new Error('Omgangen kan kun have spring med Pegasus eller spring uden Pegasus. Brug Skift redskab til at ændre typen.');
  }
  if (before.type && before.type !== 'mixed' && after.type && after.type !== before.type) {
    throw new Error('Springet passer ikke til omgangens redskab. Brug Skift redskab til at ændre typen.');
  }
}
