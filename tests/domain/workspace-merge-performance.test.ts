import { expect, it } from 'vitest';
import { mergeWorkspace } from '@teamgym/domain';
import { largeMergeWorkspace } from '../fixtures/large-merge-workspace';
import { mkdirSync, writeFileSync } from 'node:fs';

it('måler stort syntetisk arbejdsrum uden mutation og med gyldig kandidat', () => {
  const base = largeMergeWorkspace();
  const local = structuredClone(base),
    remote = structuredClone(base);
  for (let i = 0; i < local.athleteSkills.length; i++) {
    if (i % 2 === 0) local.athleteSkills[i]!.stability = 3;
    else remote.athleteSkills[i]!.note = 'Syntetisk ekstern ændring';
  }
  const before = JSON.stringify(base);
  const start = performance.now();
  const result = mergeWorkspace(base, local, remote, {
    fingerprint: 'synthetic-performance',
    reconcile: (w) => w,
  });
  const ms = performance.now() - start;
  expect(result.status).toBe('valid');
  expect(result.conflicts).toHaveLength(0);
  expect(result.changes).toHaveLength(1200);
  expect(JSON.stringify(base)).toBe(before);
  mkdirSync('tmp/merge-qa', { recursive: true });
  writeFileSync(
    'tmp/merge-qa/domain-performance.json',
    JSON.stringify(
      {
        teams: base.teams.length,
        athletes: base.athletes.length,
        registrations: base.athleteSkills.length,
        scenarios: base.plans.reduce((n, p) => n + p.tumbling.length + p.trampet.length, 0),
        bytes: new TextEncoder().encode(before).length,
        changes: result.changes.length,
        milliseconds: Math.round(ms),
      },
      null,
      2,
    ),
  );
}, 30000);
