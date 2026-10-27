import { validateWorkspace } from '@teamgym/domain';
import type { Workspace } from '@teamgym/domain';
import { syntheticWorkspace } from './synthetic-workspace';

/** 100 hold, 400 gymnaster, 1.200 registreringer og 200 scenarier. Kun syntetiske data. */
export function largeMergeWorkspace(copies = 50): Workspace {
  const template = syntheticWorkspace().workspace;
  const result = structuredClone(template);
  result.teams = [];
  result.athletes = [];
  result.athleteSkills = [];
  result.plans = [];
  for (let i = 0; i < copies; i++) {
    const ids = new Map<string, string>();
    function identify(value: unknown) {
      if (!value || typeof value !== 'object') return;
      if ('id' in value && typeof value.id === 'string' && !template.skills.some((s) => s.id === value.id))
        ids.set(value.id, `large-${i}-${value.id}`);
      for (const child of Object.values(value)) identify(child);
    }
    identify(template);
    function remap(value: unknown): unknown {
      if (typeof value === 'string') return ids.get(value) ?? value;
      if (Array.isArray(value)) return value.map(remap);
      if (value && typeof value === 'object')
        return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, remap(child)]));
      return value;
    }
    const copy = remap(template) as Workspace;
    for (const team of copy.teams) team.name = `${team.name} · gruppe ${i + 1}`;
    result.teams.push(...copy.teams);
    result.athletes.push(...copy.athletes);
    result.athleteSkills.push(...copy.athleteSkills);
    result.plans.push(...copy.plans);
  }
  return validateWorkspace(result);
}
