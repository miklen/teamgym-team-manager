import { existsSync, readFileSync } from 'node:fs';
import { expect, it } from 'vitest';

it('publicerer én installerbar skill med lokale referencer', () => {
  const root = new URL('../../apps/web/public/teamgym-data-entry/', import.meta.url);
  const skill = readFileSync(new URL('SKILL.md', root), 'utf8');
  expect(skill).toMatch(/^---\r?\nname: teamgym-data-entry\r?\ndescription: [^\r\n]+\r?\n---\r?\n/);
  const links = [...skill.matchAll(/\]\((references\/[^)]+)\)/g)].map((match) => match[1]!);
  expect(links.length).toBeGreaterThanOrEqual(5);
  for (const link of links) expect(existsSync(new URL(link, root)), link).toBe(true);
  expect(skill).not.toMatch(/(?:ya29\.|Bearer |access_token|drive\/folders\/)/);
});
