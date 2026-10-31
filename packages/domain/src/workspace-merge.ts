import { canonicalJson, skillIdentity } from './identity';
import { validateWorkspace } from './workspace';
import type { Workspace } from './schema';
import { checkMergePolicy, workspaceMergePolicy } from './merge-policy';
import type { MergePolicy } from './merge-policy';

export type MergeSide = 'local' | 'remote';
export interface MergeContext {
  /** Identificerer det aktuelle regelregister/forbindelsesgrundlag. Ingen globale opslag i motoren. */
  fingerprint: string;
  reconcile(workspace: Workspace): Workspace;
}
export interface MergeLocation {
  label: string;
  teamId: string | null;
  team: string | null;
  athlete: string | null;
  skill: string | null;
  discipline: string | null;
  scenario: string | null;
  round: number | null;
}
export interface WorkspaceChange {
  id: string;
  path: readonly string[];
  location: MergeLocation;
  kind: 'added' | 'changed' | 'removed';
  source: 'local' | 'remote' | 'both';
  before: unknown;
  local: unknown;
  remote: unknown;
}
export interface MergeConflict {
  id: string;
  reason: string;
  changeIds: readonly string[];
}
export interface MergeReview {
  changes: readonly WorkspaceChange[];
  conflicts: readonly MergeConflict[];
  consequences: readonly WorkspaceChange[];
  contextFingerprint: string;
}
export type MergeChoices = Readonly<Record<string, MergeSide>>;
export type MergeResult = MergeReview &
  (
    | { status: 'blocked'; diagnostics: readonly string[] }
    | { status: 'valid'; candidate: Workspace; diagnostics: readonly [] }
  );
interface Unit extends WorkspaceChange {
  localChanged: boolean;
  remoteChanged: boolean;
  entities: string[];
  refs: Set<string>;
  different: boolean;
}
const equal = (a: unknown, b: unknown) => canonicalJson(a ?? null) === canonicalJson(b ?? null);
const clone = <T>(value: T): T => (value === undefined ? value : structuredClone(value));
const record = (value: unknown): Record<string, unknown> => value as Record<string, unknown>;
const array = (value: unknown): unknown[] => value as unknown[];
const keyOf = (value: unknown, keys: string[]) => canonicalJson(keys.map((key) => record(value)[key]));
const at = (value: unknown, field: string) => (value == null ? undefined : record(value)[field]);
const emptyLocation = (label: string): MergeLocation => ({
  label,
  teamId: null,
  team: null,
  athlete: null,
  skill: null,
  discipline: null,
  scenario: null,
  round: null,
});

/** Kun bevidste valg sammenlignes for arv; de aktive kildeværdier genberegnes på kandidaten. */
function assessment(value: unknown): unknown {
  if (!value || typeof value !== 'object' || !('assessmentOrigin' in value)) return value;
  const { updatedAt: _time, ...semantic } = record(value);
  void _time;
  const origin = record(value).assessmentOrigin;
  return origin && at(origin, 'kind') === 'inherited'
    ? {
        ...semantic,
        stability: null,
        assessedAt: null,
        assessmentOrigin: { ...record(origin), sourceId: null },
      }
    : semantic;
}
function references(value: unknown, result = new Set<string>()): Set<string> {
  if (Array.isArray(value)) for (const item of value) references(item, result);
  else if (value && typeof value === 'object')
    for (const [key, item] of Object.entries(value)) {
      if ((key.endsWith('Id') || key === 'id') && typeof item === 'string') result.add(item);
      else references(item, result);
    }
  return result;
}

/** Ren trevejssammenligning. Blokerede resultater har med vilje ingen kandidat. */
export function mergeWorkspace(
  baseInput: unknown,
  localInput: unknown,
  remoteInput: unknown,
  context: MergeContext,
  choices: MergeChoices = {},
): MergeResult {
  const review: MergeReview = {
    changes: [],
    conflicts: [],
    consequences: [],
    contextFingerprint: context.fingerprint,
  };
  try {
    const coverage = checkMergePolicy();
    if (coverage.length) throw new Error(`Flettepolitikken dækker ikke data: ${coverage.join(', ')}`);
    const base = validateWorkspace(baseInput),
      local = validateWorkspace(localInput),
      remote = validateWorkspace(remoteInput);
    if (base.workspaceId !== local.workspaceId || base.workspaceId !== remote.workspaceId)
      throw new Error('Udgaverne tilhører forskellige arbejdsrum.');
    const units: Unit[] = [];
    const all = [base, local, remote];
    const byId = new Map<string, Record<string, unknown>>();
    function index(value: unknown) {
      if (!value || typeof value !== 'object') return;
      if ('id' in value && typeof value.id === 'string') byId.set(value.id, record(value));
      for (const item of Object.values(value)) index(item);
    }
    for (const workspace of all) index(workspace);
    // Transitive referencer slås op i basis først, så fletteretningen ikke afgør, hvilken sides udgave der bruges.
    const stableById = new Map<string, Record<string, unknown>>();
    function indexStable(value: unknown) {
      if (!value || typeof value !== 'object') return;
      if ('id' in value && typeof value.id === 'string') stableById.set(value.id, record(value));
      for (const item of Object.values(value)) indexStable(item);
    }
    for (const workspace of [remote, local, base]) indexStable(workspace);
    const inputKey = canonicalJson([base, local, remote, context.fingerprint]);
    let hash = 14695981039346656037n;
    for (let i = 0; i < inputKey.length; i++)
      hash = BigInt.asUintN(64, (hash ^ BigInt(inputKey.charCodeAt(i))) * 1099511628211n);
    const reviewId = hash.toString(16);
    function locate(path: string[], label: string): MergeLocation {
      const result = emptyLocation(label);
      for (const id of path) {
        const entity = byId.get(id);
        if (!entity) continue;
        if ('rulesetBinding' in entity) {
          result.teamId = id;
          result.team = String(entity.name);
        }
        if ('discriminator' in entity) {
          result.athlete = `${entity.name}${entity.discriminator ? ` · ${entity.discriminator}` : ''}`;
          result.teamId = entity.teamId as string | null;
        }
        if ('athleteId' in entity) {
          const athlete = byId.get(String(entity.athleteId));
          if (athlete) {
            result.athlete = `${athlete.name}${athlete.discriminator ? ` · ${athlete.discriminator}` : ''}`;
            result.teamId = athlete.teamId as string | null;
          }
          const skill = byId.get(String(entity.skillId));
          if (skill) {
            result.skill = String(skill.name);
            result.discipline = String(skill.discipline);
          }
        }
        if ('discipline' in entity) {
          result.skill = String(entity.name);
          result.discipline = String(entity.discipline);
        }
        if ('bindingFingerprint' in entity) result.teamId = String(entity.teamId);
      }
      if (result.teamId) result.team = String(byId.get(result.teamId)?.name ?? 'Fjernet hold');
      for (const workspace of [remote, local, base])
        for (const plan of workspace.plans)
          for (const discipline of ['tumbling', 'trampet'] as const)
            for (const scenario of plan[discipline]) {
              if (!path.includes(scenario.id)) continue;
              result.scenario ??= scenario.name;
              result.discipline = discipline;
              const round = scenario.rounds.findIndex((item) => path.includes(item.id));
              if (round >= 0) result.round = round + 1;
            }
      return result;
    }
    type Build = (selected: Map<string, MergeSide>) => unknown;
    function unit(
      b: unknown,
      l: unknown,
      r: unknown,
      path: string[],
      policy: MergePolicy,
      semantic = (v: unknown) => v,
    ): Build {
      if (path[0] === 'athleteSkills' && path.length === 2) semantic = assessment;
      const lb = !equal(semantic(b), semantic(l)),
        rb = !equal(semantic(b), semantic(r));
      if (!lb && !rb) return () => clone(r);
      const id = canonicalJson(path);
      const u: Unit = {
        id,
        path,
        location: locate(path, policy.label),
        kind: b === undefined ? 'added' : l === undefined || r === undefined ? 'removed' : 'changed',
        source: lb && rb ? 'both' : lb ? 'local' : 'remote',
        before: clone(b),
        local: clone(l),
        remote: clone(r),
        localChanged: lb,
        remoteChanged: rb,
        entities: path.filter((part) => byId.has(part)),
        refs: references([b, l, r]),
        different: !equal(semantic(l), semantic(r)),
      };
      if (path.at(-1)?.endsWith('Id'))
        for (const value of [b, l, r]) if (typeof value === 'string') u.refs.add(value);
      for (const id of [...u.refs]) {
        const entity = stableById.get(id);
        if (entity) for (const ref of references(entity)) u.refs.add(ref);
      }
      units.push(u);
      return (selected) => clone(selected.has(id) ? (selected.get(id) === 'local' ? l : r) : lb ? l : r);
    }
    function walk(b: unknown, l: unknown, r: unknown, node: MergePolicy, path: string[]): Build {
      if (node.role === 'metadata') return () => clone(r);
      if (b === undefined || l === undefined || r === undefined || b === null || l === null || r === null)
        return unit(b, l, r, path, node);
      if (node.role === 'atomic' || node.role === 'ordered') return unit(b, l, r, path, node);
      if (node.variants) {
        const discriminator = node.discriminator!;
        if (
          !equal(at(b, discriminator), at(l, discriminator)) ||
          !equal(at(b, discriminator), at(r, discriminator))
        )
          return unit(b, l, r, path, node);
        const i = node.variantTags!.indexOf(String(at(b, discriminator)));
        if (i < 0) throw new Error('Unionvarianten har ingen flettepolitik.');
        return walk(b, l, r, node.variants[i]!, path);
      }
      if (node.role === 'collection') {
        const keys = node.key!;
        const maps = [b, l, r].map((v) => new Map(array(v).map((item) => [keyOf(item, keys), item])));
        const ids = [...new Set(maps.flatMap((map) => [...map.keys()]))].sort();
        const builds = ids.map((id) => {
          const item = maps[2]!.get(id) ?? maps[1]!.get(id) ?? maps[0]!.get(id);
          const name = keys.length === 1 ? String(at(item, keys[0]!)) : id;
          return [
            id,
            walk(maps[0]!.get(id), maps[1]!.get(id), maps[2]!.get(id), node.element ?? node.items![0]!, [
              ...path,
              name,
            ]),
          ] as const;
        });
        // Kun eksisterende medlemmers relative rækkefølge er et rækkefølgevalg. Tilføjelser
        // fra hver side indsættes ved deres nærmeste bevarede forgænger.
        const original = array(b).map((item) => keyOf(item, keys));
        const common = original.filter((id) => maps[1]!.has(id) && maps[2]!.has(id));
        const order = (v: unknown) =>
          array(v)
            .map((item) => keyOf(item, keys))
            .filter((id) => common.includes(id));
        const orderBuild = node.ordered
          ? unit(order(b), order(l), order(r), [...path, '$order'], {
              role: 'ordered',
              label: `${node.label} · rækkefølge`,
            })
          : () => original;
        return (selected) => {
          const values = new Map(
            builds.map(([id, build]) => [id, build(selected)]).filter(([, item]) => item !== undefined) as [
              string,
              unknown,
            ][],
          );
          const sequence = (orderBuild(selected) as string[]).filter((id) => values.has(id));
          for (const source of [array(r), array(l), array(b)]) {
            let previous: string | undefined;
            for (const item of source) {
              const id = keyOf(item, keys);
              if (values.has(id) && !sequence.includes(id))
                sequence.splice(previous ? sequence.indexOf(previous) + 1 : 0, 0, id);
              if (values.has(id)) previous = id;
            }
          }
          return sequence.map((id) => values.get(id));
        };
      }
      if (node.fields) {
        const groups = new Map<string, string[]>();
        for (const [key, p] of Object.entries(node.fields))
          if (p.group) groups.set(p.group, [...(groups.get(p.group) ?? []), key]);
        const builds: [string[], Build, boolean][] = [];
        for (const [group, members] of groups) {
          const pick = (v: unknown) => Object.fromEntries(members.map((key) => [key, at(v, key)]));
          builds.push([
            members,
            unit(
              pick(b),
              pick(l),
              pick(r),
              [...path, `$${group}`],
              {
                role: 'atomic',
                label: group === 'assessment' ? 'Vurdering, dato og ophav' : 'Udførelse og forbindelse',
              },
              group === 'assessment' ? assessment : (v) => v,
            ),
            true,
          ]);
        }
        for (const [key, p] of Object.entries(node.fields))
          if (!p.group)
            builds.push([[key], walk(at(b, key), at(l, key), at(r, key), p, [...path, key]), false]);
        return (selected) =>
          Object.assign(
            {},
            ...builds.map(([members, build, flatten]) =>
              flatten ? build(selected) : { [members[0]!]: build(selected) },
            ),
          );
      }
      return unit(b, l, r, path, node);
    }
    const build = walk(base, local, remote, workspaceMergePolicy, []);
    review.changes = units.map(({ id, path, location, kind, source, before, local, remote }) => ({
      id,
      path,
      location,
      kind,
      source,
      before,
      local,
      remote,
    }));
    const parent = units.map((_, i) => i);
    const reasons = new Map<number, Set<string>>();
    const root = (i: number): number => (parent[i] === i ? i : (parent[i] = root(parent[i]!)));
    function connect(i: number, j: number, reason: string) {
      parent[root(j)] = root(i);
      const set = reasons.get(i) ?? new Set();
      set.add(reason);
      reasons.set(i, set);
    }
    const sidesDiffer = (u: Unit) => u.different;
    const crosses = (a: Unit, b: Unit) =>
      ((a.localChanged && b.remoteChanged) || (a.remoteChanged && b.localChanged)) &&
      sidesDiffer(a) &&
      sidesDiffer(b);
    const hasField = (u: Unit, fields: string[]) => u.path.some((part) => fields.includes(part));
    const subject = (u: Unit) => u.entities.at(-1);
    const related = (a: Unit, b: Unit) =>
      a.entities.some((id) => b.refs.has(id) || b.entities.includes(id)) ||
      b.entities.some((id) => a.refs.has(id));
    const linked = (a: Unit, b: Unit) => {
      const id = subject(a);
      return id !== undefined && (b.entities.includes(id) || b.refs.has(id));
    };
    const structural = (u: Unit) => u.local === undefined || u.remote === undefined || u.before === undefined;
    const inheritanceEdges = new Set<string>();
    const inheritanceTargets = new Map<string, Set<string>>();
    for (const w of all)
      for (const relation of w.inheritanceRelations)
        inheritanceTargets.set(
          relation.sourceId,
          new Set([...(inheritanceTargets.get(relation.sourceId) ?? []), relation.targetId]),
        );
    for (const source of inheritanceTargets.keys()) {
      const visited = new Set<string>();
      const visit = (id: string) => {
        if (visited.has(id)) return;
        visited.add(id);
        for (const target of inheritanceTargets.get(id) ?? []) {
          inheritanceEdges.add(canonicalJson([source, target]));
          visit(target);
        }
      };
      visit(source);
    }
    for (let i = 0; i < units.length; i++)
      for (let j = i + 1; j < units.length; j++) {
        const a = units[i]!,
          b = units[j]!;
        let reason = '';
        // Sletning/tilføjelse og alle referencer til den samme identitet er ét valg.
        if ((structural(a) && linked(a, b)) || (structural(b) && linked(b, a)))
          reason = 'Identitet og dens referencer skal bevares samlet.';
        if (
          a.path[0] === 'athleteSkills' &&
          b.path[0] === 'athleteSkills' &&
          subject(a) === subject(b) &&
          ((hasField(a, ['skillId']) &&
            hasField(b, ['$assessment', 'connectionConfirmation', 'reviewRequiredFor'])) ||
            (hasField(b, ['skillId']) &&
              hasField(a, ['$assessment', 'connectionConfirmation', 'reviewRequiredFor'])))
        )
          reason = 'Udskiftning af spring nulstiller vurdering og bekræftelse som en helhed.';
        if (
          hasField(a, ['rulesetBinding', 'bindingFingerprint', 'reviewRequiredFor']) &&
          hasField(b, ['rulesetBinding', 'bindingFingerprint', 'reviewRequiredFor']) &&
          a.location.teamId &&
          a.location.teamId === b.location.teamId
        )
          reason = 'Regelbinding og revurderingsmarkeringer hører sammen.';
        if (crosses(a, b)) {
          if (
            ((hasField(a, ['archived', 'teamId']) && b.path[0] === 'plans') ||
              (hasField(b, ['archived', 'teamId']) && a.path[0] === 'plans')) &&
            related(a, b)
          )
            reason = 'Arkivering eller holdskift påvirker den ændrede opstilling.';
          if (
            a.path.slice(0, -1).join('/') === b.path.slice(0, -1).join('/') &&
            hasField(a, ['entries', 'reserves']) &&
            hasField(b, ['entries', 'reserves'])
          ) {
            const aa = references([a.local, a.remote]),
              bb = references([b.local, b.remote]);
            if ([...aa].some((id) => bb.has(id)))
              reason = 'Flytning mellem deltagere og reserver skal vælges samlet.';
          }
          // Udførelsesændring mod vurdering/bekræftelse på den samme registrering.
          for (const [execution, registration] of [
            [a, b],
            [b, a],
          ])
            if (
              execution!.path[0] === 'skills' &&
              hasField(execution!, ['$execution', 'jump', 'discipline']) &&
              registration!.path[0] === 'athleteSkills'
            ) {
              const item = byId.get(String(subject(registration!)));
              if (item && execution!.entities.includes(String(item.skillId)))
                reason = 'Udførelse, vurdering og forbindelsesbekræftelse hænger sammen.';
            }
          for (const [binding, other] of [
            [a, b],
            [b, a],
          ])
            if (
              hasField(binding!, ['rulesetBinding', 'bindingFingerprint']) &&
              binding!.location.teamId &&
              binding!.location.teamId === other!.location.teamId &&
              hasField(other!, [
                'reviewRequiredFor',
                '$assessment',
                'entries',
                'reserves',
                'bindingFingerprint',
                'rulesetBinding',
              ])
            )
              reason = 'Regelgrundlag, revurdering og planens følgevirkninger skal vælges samlet.';
          if (
            a.path[0] === 'athleteSkills' &&
            b.path[0] === 'athleteSkills' &&
            hasField(a, ['$assessment', 'archived', 'skillId']) &&
            hasField(b, ['$assessment', 'archived', 'skillId']) &&
            (inheritanceEdges.has(canonicalJson([subject(a), subject(b)])) ||
              inheritanceEdges.has(canonicalJson([subject(b), subject(a)])))
          )
            reason = 'Arvekilde og eget vurderingsvalg påvirker samme vurdering.';
          if (
            (a.path[0] === 'inheritanceExclusions' && b.path[0] === 'athleteSkills') ||
            (b.path[0] === 'inheritanceExclusions' && a.path[0] === 'athleteSkills')
          ) {
            const exclusion = a.path[0] === 'inheritanceExclusions' ? a : b,
              registration = exclusion === a ? b : a;
            const item = byId.get(String(subject(registration)));
            if (
              item &&
              exclusion.refs.has(String(item.athleteId)) &&
              hasField(registration, ['$assessment', 'skillId'])
            )
              reason = 'Fravalg af arv og vurderingsvalg skal vælges samlet.';
          }
        }
        if (reason) connect(i, j, reason);
      }
    // Semantisk unikhed, også når to sessioner bruger forskellige id'er.
    const uniqueBuckets = new Map<string, number[]>();
    units.forEach((u, i) => {
      // Unikhed gælder også redigering af eksisterende definitioner/registreringer.
      if (u.path[0] === 'skills' && (structural(u) || hasField(u, ['$execution', 'jump', 'discipline'])))
        for (const w of [local, remote]) {
          const item = w.skills.find((skill) => skill.id === u.path[1]);
          if (item) {
            const key = `skill:${skillIdentity(item)}`;
            uniqueBuckets.set(key, [...new Set([...(uniqueBuckets.get(key) ?? []), i])]);
          }
        }
      if (u.path[0] === 'athleteSkills' && (structural(u) || hasField(u, ['skillId', 'athleteId'])))
        for (const w of [local, remote]) {
          const item = w.athleteSkills.find((registration) => registration.id === u.path[1]);
          if (item) {
            const key = `registration:${item.athleteId}:${item.skillId}`;
            uniqueBuckets.set(key, [...new Set([...(uniqueBuckets.get(key) ?? []), i])]);
          }
        }
      for (const value of [u.local, u.remote]) {
        if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
        const item = record(value);
        let key: string | undefined;
        if (u.path[0] === 'skills' && 'discipline' in item)
          key = `skill:${skillIdentity(item as unknown as Workspace['skills'][number])}`;
        if (u.path[0] === 'athleteSkills' && 'athleteId' in item)
          key = `registration:${item.athleteId}:${item.skillId}`;
        if ('rounds' in item && 'name' in item)
          key = `scenario:${u.path.slice(0, -1).join('/')}:${String(item.name).toLocaleLowerCase('da')}`;
        if (key) uniqueBuckets.set(key, [...new Set([...(uniqueBuckets.get(key) ?? []), i])]);
      }
      // Ren navneændring kan også kollidere med en samtidig scenarietilføjelse.
      if (u.path.at(-1) === 'name' && u.location.scenario)
        for (const value of [u.local, u.remote]) {
          const key = `scenario:${u.path.slice(0, -2).join('/')}:${String(value).toLocaleLowerCase('da')}`;
          uniqueBuckets.set(key, [...new Set([...(uniqueBuckets.get(key) ?? []), i])]);
        }
    });
    for (const bucket of uniqueBuckets.values())
      for (const i of bucket)
        for (const j of bucket)
          if (i < j && crosses(units[i]!, units[j]!))
            connect(
              i,
              j,
              'Samme navn eller præcise registrering er oprettet/ændret med forskellige identiteter.',
            );
    const groups = new Map<number, number[]>();
    units.forEach((_, i) => groups.set(root(i), [...(groups.get(root(i)) ?? []), i]));
    const conflicts: MergeConflict[] = [];
    const selected = new Map<string, MergeSide>();
    for (const members of groups.values()) {
      const direct = members.some(
        (i) => units[i]!.localChanged && units[i]!.remoteChanged && sidesDiffer(units[i]!),
      );
      const dependent = members.some((i) => members.some((j) => i !== j && crosses(units[i]!, units[j]!)));
      if (!direct && !dependent) continue;
      const ids = members.map((i) => units[i]!.id).sort();
      const id = `${reviewId}:${canonicalJson(ids)}`;
      const reason =
        [...new Set(members.flatMap((i) => [...(reasons.get(i) ?? [])]))].join(' ') ||
        'Begge udgaver ændrer de samme data forskelligt.';
      conflicts.push({ id, reason, changeIds: ids });
      if (choices[id] === 'local' || choices[id] === 'remote')
        for (const changeId of ids) selected.set(changeId, choices[id]);
    }
    review.conflicts = conflicts;
    if (
      Object.keys(choices).some((key) => !conflicts.some((item) => item.id === key)) ||
      Object.values(choices).some((side) => side !== 'local' && side !== 'remote')
    )
      throw new Error('Valgene tilhører ikke denne gennemgang.');
    if (conflicts.some((item) => !choices[item.id]))
      return {
        ...review,
        status: 'blocked',
        diagnostics: ['Vælg Min udgave eller Filens udgave for alle uafgjorte konflikter.'],
      };
    const raw = build(selected) as Workspace;
    // Afstemningen må kun ændre afledte vurderinger/tid. Et bevidst kildevalg eller relation
    // må aldrig forsvinde som en skjult generel reparation.
    const candidate = validateWorkspace(context.reconcile(clone(raw)));
    const explicit = (w: Workspace) =>
      canonicalJson({ ...w, athleteSkills: w.athleteSkills.map(assessment) });
    if (explicit(raw) !== explicit(candidate))
      throw new Error(
        'Afstemningen ville tilsidesætte egne data, et kildevalg eller en accepteret relation. Gennemgå de afhængige ændringer.',
      );
    review.consequences = candidate.athleteSkills.flatMap((item) => {
      const before = raw.athleteSkills.find((other) => other.id === item.id);
      if (equal(assessment(before), assessment(item)) && !equal(before, item))
        return [
          {
            id: `derived:${item.id}`,
            path: ['athleteSkills', item.id],
            location: locate(['athleteSkills', item.id], 'Afstemt arvet vurdering'),
            kind: 'changed' as const,
            source: 'both' as const,
            before,
            local: item,
            remote: item,
          },
        ];
      return [];
    });
    return { ...review, status: 'valid', candidate, diagnostics: [] };
  } catch (error) {
    return {
      ...review,
      status: 'blocked',
      diagnostics: [
        error instanceof Error ? error.message : 'Arbejdsrummet kan ikke flettes. Kladden er bevaret.',
      ],
    };
  }
}
