/// <reference lib="webworker" />
import { PotentialCache } from '@teamgym/rules';
import type { Workspace, SpringDiscipline } from '@teamgym/domain';
import { registry } from './rules';
const cache = new PotentialCache();
let controller: AbortController | undefined;
self.onmessage = (
  event: MessageEvent<{
    id: string;
    workspace: Workspace;
    teamId: string;
    discipline: SpringDiscipline;
    cancel?: boolean;
  }>,
) => {
  if (event.data.cancel) {
    controller?.abort();
    return;
  }
  controller?.abort();
  const search = new AbortController();
  controller = search;
  const { id, workspace, teamId, discipline } = event.data;
  const team = workspace.teams.find((item) => item.id === teamId);
  const resolved = team && registry.resolve(team.rulesetBinding);
  if (!resolved || resolved.status !== 'known') {
    self.postMessage({ id, error: 'Holdets regelpakke er ikke installeret.' });
    return;
  }
  const key = cache.key(workspace, teamId, discipline);
  const hit = cache.get(key);
  if (hit) {
    self.postMessage({ id, result: hit });
    return;
  }
  void resolved.rulePackage
    .potentials(workspace, teamId, discipline, { signal: search.signal, candidateBudget: 20000 })
    .then((result) => {
      if (!search.signal.aborted) cache.set(key, result);
      self.postMessage({ id, result });
    })
    .catch(() => self.postMessage({ id, error: 'Mulighederne kunne ikke beregnes. Planen er bevaret.' }));
};
