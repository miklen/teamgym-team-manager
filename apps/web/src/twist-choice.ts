import { hasTwistDistributionChoice } from '@teamgym/domain';
import type { ElementExecution, SkillDefinition } from '@teamgym/domain';

/** Elementer i et spring, hvor træneren vælger hvor skruen sker. Elementnavn vises kun i serier med flere valg. */
export function twistElements(
  definition: SkillDefinition,
): { element: ElementExecution; index: number; label: string | undefined }[] {
  if (definition.discipline === 'rhythm') return [];
  const elements = definition.discipline === 'trampet' ? [definition.jump] : definition.elements;
  const choices = elements
    .map((element, index) => ({ element, index }))
    .filter(({ element }) => hasTwistDistributionChoice(element));
  return choices.map((choice) => ({
    ...choice,
    label: choices.length > 1 ? `Element ${choice.index + 1}` : undefined,
  }));
}

export function withTwistDistribution<T extends SkillDefinition>(
  definition: T,
  index: number,
  twistDistribution: number[],
): T {
  if (definition.discipline === 'trampet')
    return { ...definition, jump: { ...definition.jump, twistDistribution } };
  if (definition.discipline === 'tumbling')
    return {
      ...definition,
      elements: definition.elements.map((element, position) =>
        position === index ? { ...element, twistDistribution } : element,
      ),
    };
  return definition;
}
