import { describe, expect, it } from 'vitest';
import type { SourceReference } from '@teamgym/domain';
import controlPosts from '../../packages/rules/data/reg/control-posts.json';
import regSources from '../../packages/rules/data/reg/sources.json';
import fixtureTests from './reg-fixtures.test.ts?raw';
import rhythmTests from './reg-rhythm.test.ts?raw';
import { REG_SPRING_RULES } from '../../packages/rules/src/spring-rules';

/*
 * Dækningsrapport for REG: kildepunkt (parameter eller kildehenvisning i REG_SPRING_RULES/REG_V1)
 * → kontrolpost i control-posts.json → navngiven håndregnet facitcase. Kører i `npm run check`.
 */

interface ControlPost {
  id: string;
  source: SourceReference;
  supplementarySources?: SourceReference[];
  profile: string;
  formula: string;
  unit: string;
  exceptions: string[];
  tests: string[];
  covers: string[];
}

const posts = controlPosts.posts as ControlPost[];
const sourceIds = new Set(regSources.sources.map((source) => source.id));
const testIds = new Set([...`${fixtureTests}\n${rhythmTests}`.matchAll(/\bit\('([A-Z0-9.-]+):/g)].map((match) => match[1]!));

function parameterPaths(value: unknown, prefix: string): string[] {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return [prefix];
  return Object.entries(value).flatMap(([key, child]) => parameterPaths(child, `${prefix}.${key}`));
}

const disciplines = ['tumbling', 'trampet'] as const;
const parameterPoints = [
  ...disciplines.flatMap((discipline) => Object.entries(REG_SPRING_RULES[discipline])
    .filter(([key]) => key !== 'sources')
    .flatMap(([key, value]) => key === 'valueSource' ? [`${discipline}.valueSource`] : parameterPaths(value, `${discipline}.${key}`))),
  ...parameterPaths(REG_SPRING_RULES.participants, 'participants'),
  'forbiddenRotationIssue',
  'profiles',
  'rhythmCatalog',
];
const sourcePoints = disciplines.flatMap((discipline) => [
  ...Object.entries(REG_SPRING_RULES[discipline].sources).map(([key, source]) => ({ id: `${discipline}.sources.${key}`, source })),
  { id: `${discipline}.valueSource`, source: REG_SPRING_RULES[discipline].valueSource },
]);

const coveringPosts = (point: string) => posts.filter((post) => post.covers.some((cover) => point === cover || point.startsWith(`${cover}.`)));
const sectionKey = (section: string) => section.match(/^[\d.]+[a-z]?/)?.[0] ?? section;
const sameSource = (a: SourceReference, b: SourceReference) => a.sourceId === b.sourceId && a.page === b.page && sectionKey(a.section) === sectionKey(b.section);

describe('REG-dækning: kildepunkt → kontrolpost → test', () => {
  it('hver kontrolpost har kilde, profil, formel, tælleenhed, undtagelser og eksisterende facitcases', () => {
    for (const post of posts) {
      expect(sourceIds.has(post.source.sourceId), post.id).toBe(true);
      for (const source of post.supplementarySources ?? []) expect(sourceIds.has(source.sourceId), post.id).toBe(true);
      expect([post.profile, post.formula, post.unit].every((text) => text.trim().length > 0), post.id).toBe(true);
      expect(Array.isArray(post.exceptions), post.id).toBe(true);
      expect(post.tests.length, post.id).toBeGreaterThan(0);
      for (const test of post.tests) expect(testIds.has(test), `${post.id} → ${test}`).toBe(true);
    }
    expect(new Set(posts.map((post) => post.id)).size).toBe(posts.length);
  });

  it('hver navngiven REG-facitcase hører til mindst én kontrolpost', () => {
    const referenced = new Set(posts.flatMap((post) => post.tests));
    expect([...testIds].filter((id) => !referenced.has(id))).toEqual([]);
  });

  it.each(parameterPoints)('parameteren %s er dækket af en kontrolpost', (point) => {
    expect(coveringPosts(point).map((post) => post.id)).not.toEqual([]);
  });

  it.each(sourcePoints)('kildehenvisningen $id findes som kontrolpost med samme kilde, afsnit og side', ({ source }) => {
    expect(posts.filter((post) => sameSource(post.source, source)).map((post) => post.id)).not.toEqual([]);
  });

  it('kontrolposterne dækker kun parametre, der findes', () => {
    const known = (cover: string) => parameterPoints.some((point) => point === cover || point.startsWith(`${cover}.`));
    expect(posts.flatMap((post) => post.covers).filter((cover) => !known(cover))).toEqual([]);
  });
});
