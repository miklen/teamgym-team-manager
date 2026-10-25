import type { RulesetBinding, SkillDefinition } from './schema';

/** Sorterer objektnøgler, men bevarer den sportsligt betydende arrayrækkefølge. */
export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== 'object') {
    const result = JSON.stringify(value);
    if (result === undefined) throw new Error('Værdien kan ikke serialiseres som JSON.');
    return result;
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  return `{${Object.entries(value).sort(([a], [b]) => a < b ? -1 : a > b ? 1 : 0).map(([key, entry]) => `${JSON.stringify(key)}:${canonicalJson(entry)}`).join(',')}}`;
}

export function skillIdentity(skill: SkillDefinition): string {
  if (skill.discipline === 'tumbling') return canonicalJson({ discipline: skill.discipline, elements: skill.elements, connection: skill.connection });
  if (skill.discipline === 'trampet') return canonicalJson({ discipline: skill.discipline, jump: skill.jump });
  return canonicalJson({ discipline: skill.discipline, momentId: skill.momentId, variant: skill.variant });
}

export function bindingFingerprint(binding: RulesetBinding): string { return canonicalJson(binding); }

export function newEntityId(): string { return crypto.randomUUID(); }
