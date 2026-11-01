import type { RulePackage } from '@teamgym/rules';
import type { FoundationNode } from './foundation-catalog-model';
import { foundationLibrary, foundationTree, relationGroups, relationText } from './foundation-catalog-model';
import { springListExclusion } from './spring-chain-model';
import { FOUNDATION_CATALOG } from './spring-library';

const DISCIPLINE = { tumbling: 'Bane', trampet: 'Trampet' } as const;

function tree(nodes: readonly FoundationNode[], depth = 0): string[] {
  return nodes.flatMap((node) => [
    `${'  '.repeat(depth)}- ${node.definition.name} · ${relationText(node.relationId).name}${node.unresolved ? ' · kræver afklaring' : ''}`,
    ...tree(node.children, depth + 1),
  ]);
}

/**
 * Lokal gennemgangsrapport over fundamentkataloget og indbyggede serier uden for vælgerens liste.
 * Kun til trænerens egen gennemgang; vises ikke i appen og ændrer ingen data.
 */
export function foundationReport(rulePackage: RulePackage): string {
  const library = foundationLibrary(rulePackage);
  const lines = [
    '# Fundamentkatalog',
    '',
    `Regelpakke: ${rulePackage.manifest.name} ${rulePackage.manifest.packageVersion} · Katalogversion ${FOUNDATION_CATALOG.version}`,
    '',
    'Genereret lokalt med `npm run report:fundament`. Rapporten er afledt af koden og må ikke redigeres.',
    '',
    '## Relationstyper',
    '',
  ];
  for (const group of relationGroups(rulePackage)) {
    const text = relationText(group.relationId);
    lines.push(`### ${text.name} (${group.pairs.length})`, '');
    if (text.explanation) lines.push(text.explanation, '');
    for (const pair of group.pairs)
      lines.push(
        `- ${pair.source.name} → ${pair.target.name}${pair.unresolved ? ' · kræver afklaring' : ''}`,
      );
    lines.push('');
  }
  lines.push('## Fundament pr. spring', '');
  for (const discipline of ['tumbling', 'trampet'] as const) {
    lines.push(`### ${DISCIPLINE[discipline]}`, '');
    for (const choice of library) {
      if (choice.definition.discipline !== discipline) continue;
      const nodes = foundationTree(choice.definition, rulePackage);
      if (!nodes.length) continue;
      lines.push(`#### ${choice.definition.name}`, '', ...tree(nodes), '');
    }
  }
  const excluded = new Map<string, string[]>();
  for (const choice of library) {
    if (choice.fromWorkspace) continue;
    const reason = springListExclusion(choice.definition);
    if (reason) excluded.set(reason, [...(excluded.get(reason) ?? []), choice.definition.name]);
  }
  lines.push(
    '## Serier uden for listen',
    '',
    'Vises hverken i kædebyggeren eller ved søgning; bygges med Byg selv.',
    '',
  );
  for (const [reason, names] of excluded)
    lines.push(`### ${reason} (${names.length})`, '', ...names.map((name) => `- ${name}`), '');
  return `${lines.join('\n').trimEnd()}\n`;
}
