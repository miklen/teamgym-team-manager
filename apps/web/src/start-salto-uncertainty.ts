import type { SkillDefinition } from '@teamgym/domain';
import type { SpringSkillEvaluation } from '@teamgym/rules';

/** Startstjernens identitet er kun relevant, når samme salto også står senere i serien. */
export function repeatedStartSaltoIssue(
  skill: SkillDefinition | null | undefined,
  evaluation: SpringSkillEvaluation | null | undefined,
): boolean {
  if (skill?.discipline !== 'tumbling' || !evaluation) return false;
  const start = skill.elements[0];
  if (start?.family !== 'salto' || start.direction !== 'forward') return false;
  const identity = evaluation.elementValues[0]?.identity;
  return !!identity && evaluation.elementValues.slice(1).some((element) => element.identity === identity);
}
