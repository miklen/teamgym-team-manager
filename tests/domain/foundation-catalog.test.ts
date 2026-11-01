import { expect, it } from 'vitest';
import { createWorkspace } from '@teamgym/domain';
import { DK_V1 } from '@teamgym/rules';
import { springLibrary } from '../../apps/web/src/spring-library';
import type { FoundationNode } from '../../apps/web/src/foundation-catalog-model';
import { foundationTree, relationGroups, relationText } from '../../apps/web/src/foundation-catalog-model';

const library = springLibrary(DK_V1, createWorkspace());
const byName = (name: string) => library.find((choice) => choice.definition.name === name)!.definition;
const flat = (nodes: FoundationNode[], depth = 0): string[] =>
  nodes.flatMap((node) => [
    `${'  '.repeat(depth)}${node.definition.name} · ${node.chain.join(':')}`,
    ...flat(node.children, depth + 1),
  ]);

it('rondat-flik-1/1 giver begyndelser og samme indgang med saltoer uden skrue, hver én gang', () => {
  expect(flat(foundationTree(byName('Rondat – flik – strakt 1/1 (360°)'), DK_V1))).toEqual([
    'Rondat · exact-prefix',
    'Rondat – flik · exact-prefix',
    'Rondat – flik – lukket salto · full-twist-positions',
    'Rondat – flik – hoftebøjet salto · full-twist-positions',
    'Rondat – flik – strakt salto · full-twist-positions',
  ]);
});

it('strakt salto–rondat–flik–1/1 viser serien uden indgang med dens fundament under sig', () => {
  const tree = foundationTree(byName('Strakt salto – rondat – flik – strakt 1/1 (360°)'), DK_V1);
  const withoutEntry = tree.find((node) => node.definition.name === 'Rondat – flik – strakt 1/1 (360°)')!;
  expect(withoutEntry.chain).toEqual(['without-entry-salto']);
  expect(relationText(withoutEntry.relationId).name).toBe('Uden indgangssalto');
  expect(flat(withoutEntry.children)).toEqual([
    'Rondat – flik – lukket salto · without-entry-salto:full-twist-positions',
    'Rondat – flik – hoftebøjet salto · without-entry-salto:full-twist-positions',
    'Rondat – flik – strakt salto · without-entry-salto:full-twist-positions',
  ]);
  const names = flat(tree).map((line) => line.trim().split(' · ')[0]);
  expect(new Set(names).size).toBe(names.length);
});

it('relationstyper har konkrete par sorteret efter kilde og ukendte id’er vises med id', () => {
  const chain = relationGroups(DK_V1).find((group) => group.relationId === 'forward-twist-chain')!;
  expect(chain.pairs.map((pair) => `${pair.source.name} → ${pair.target.name}`)).toContain(
    'Kraftspring – randy (strakt 900°) → Kraftspring – rudy (strakt 540°)',
  );
  const sources = chain.pairs.map((pair) => pair.source.name);
  expect(sources).toEqual([...sources].sort((a, b) => a.localeCompare(b, 'da')));
  expect(relationGroups(DK_V1).every((group) => group.pairs.length > 0)).toBe(true);
  expect(relationText('ny-relation')).toEqual({ name: 'ny-relation', explanation: '' });
});

it('den lokale rapport viser relationspar, fundamenttræ og serier uden for listen', async () => {
  const { foundationReport } = await import('../../apps/web/src/foundation-report');
  const report = foundationReport(DK_V1);
  expect(report).toContain('- Rondat – flik – strakt 1/1 (360°) → Rondat – flik');
  expect(report).toMatch(/^#### Rondat – flik – strakt 1\/1 \(360°\)\n\n- Rondat · Kortere begyndelse\n- Rondat – flik · Kortere begyndelse$/m);
  expect(report).toMatch(/^### Start med dobbeltsalto \(\d+\)$/m);
});
