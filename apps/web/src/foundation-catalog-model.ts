import type { RulePackage } from '@teamgym/rules';
import { skillIdentity } from '@teamgym/domain';
import type { SpringChoice, SpringDefinition } from './spring-library';
import { springFoundation, springLibrary } from './spring-library';

export const RELATION_TEXT: Readonly<Record<string, { name: string; explanation: string }>> = {
  'exact-prefix': {
    name: 'Kortere begyndelse',
    explanation: 'En serie giver sine kortere begyndelser med de samme elementer i samme rækkefølge.',
  },
  'without-entry-salto': {
    name: 'Uden indgangssalto',
    explanation: 'En serie med forlæns indgangssalto giver samme serie uden indgangen.',
  },
  'full-twist-positions': {
    name: 'Helskrue giver saltoer uden skrue',
    explanation: 'En afsluttende helskrue giver samme indgang med lukket, hoftebøjet og strakt salto.',
  },
  'forward-salto-foundation': {
    name: 'Forlæns salto i lettere position eller med 180°',
    explanation:
      'En forlæns afslutning giver saltoer og barani’er i samme eller lettere position. En dobbelt giver alle tre.',
  },
  'forward-twist-chain': {
    name: 'Forlæns udviklingskæde (randy → rudy)',
    explanation: 'En strakt forlæns skruesalto giver de lavere trin i kæden: rudy (540°) og randy (900°).',
  },
  'rudy-foundation': {
    name: 'Trampet: rudy giver saltoer og barani’er',
    explanation: 'På trampet giver en rudy de forlæns saltoer og barani’er under den.',
  },
  'double-540-180': {
    name: 'Dobbelt 540° giver dobbelt 180°',
    explanation:
      'En dobbelt forlæns salto med 540° giver samme dobbelte salto med 180°. Uden kendt fordeling kræver den afklaring.',
  },
  'double-without-twist': {
    name: 'Dobbelt uden skrue',
    explanation: 'En dobbelt salto med 180° giver samme dobbelte salto uden skrue.',
  },
  'double-pike-tuck': {
    name: 'Dobbelt hoftebøjet giver dobbelt lukket',
    explanation: 'En dobbelt hoftebøjet salto giver den tilsvarende dobbelte lukkede salto.',
  },
  'double-pike-tuck-without-twist': {
    name: 'Dobbelt hoftebøjet giver dobbelt lukket uden skrue',
    explanation: 'En dobbelt hoftebøjet salto med skrue giver dobbelt lukket uden skrue.',
  },
};

/** Ukendte relationer vises med deres id, så nye katalogrelationer aldrig forsvinder. */
export function relationText(relationId: string) {
  return RELATION_TEXT[relationId] ?? { name: relationId, explanation: '' };
}

export interface FoundationNode {
  definition: SpringDefinition;
  relationId: string;
  chain: string[];
  unresolved: boolean;
  children: FoundationNode[];
}

/** Træet afledes af `springFoundation`; forælderen er den tidligere post, hvis direkte fundament giver posten. */
export function foundationTree(skill: SpringDefinition, rulePackage: RulePackage): FoundationNode[] {
  const roots: FoundationNode[] = [];
  const nodes: FoundationNode[] = [];
  const direct = new Map<FoundationNode, Set<string>>();
  const directOf = (node: FoundationNode) => {
    let result = direct.get(node);
    if (!result) {
      result = new Set(
        springFoundation(node.definition, rulePackage)
          .filter((entry) => !entry.relationId.includes(':'))
          .map((entry) => `${entry.relationId}|${skillIdentity(entry.definition)}`),
      );
      direct.set(node, result);
    }
    return result;
  };
  for (const entry of springFoundation(skill, rulePackage)) {
    const chain = entry.relationId.split(':');
    const node: FoundationNode = {
      definition: entry.definition,
      relationId: chain.at(-1)!,
      chain,
      unresolved: entry.unresolved,
      children: [],
    };
    const key = `${node.relationId}|${skillIdentity(entry.definition)}`;
    const parent =
      chain.length > 1
        ? nodes.find(
            (candidate) =>
              candidate.chain.join(':') === chain.slice(0, -1).join(':') &&
              !candidate.unresolved &&
              directOf(candidate).has(key),
          )
        : undefined;
    (parent ? parent.children : roots).push(node);
    nodes.push(node);
  }
  return roots;
}

export interface RelationGroup {
  relationId: string;
  pairs: { source: SpringDefinition; target: SpringDefinition; unresolved: boolean }[];
}

const groupCache = new WeakMap<RulePackage, RelationGroup[]>();

export function foundationLibrary(rulePackage: RulePackage): SpringChoice[] {
  return springLibrary(rulePackage, { skills: [] });
}

/** Direkte kilde → fundament-par for bibliotekets spring; kun relationer, der faktisk forekommer. */
export function relationGroups(rulePackage: RulePackage): RelationGroup[] {
  const cached = groupCache.get(rulePackage);
  if (cached) return cached;
  const groups = new Map<string, RelationGroup>();
  for (const choice of foundationLibrary(rulePackage))
    for (const entry of springFoundation(choice.definition, rulePackage)) {
      if (entry.relationId.includes(':')) continue;
      const group = groups.get(entry.relationId) ?? { relationId: entry.relationId, pairs: [] };
      group.pairs.push({ source: choice.definition, target: entry.definition, unresolved: entry.unresolved });
      groups.set(entry.relationId, group);
    }
  const order = Object.keys(RELATION_TEXT);
  const result = [...groups.values()]
    .map((group) => ({
      ...group,
      pairs: group.pairs.sort(
        (a, b) =>
          a.source.name.localeCompare(b.source.name, 'da') ||
          a.target.name.localeCompare(b.target.name, 'da'),
      ),
    }))
    .sort((a, b) => {
      const left = order.indexOf(a.relationId);
      const right = order.indexOf(b.relationId);
      return (left < 0 ? order.length : left) - (right < 0 ? order.length : right);
    });
  groupCache.set(rulePackage, result);
  return result;
}
