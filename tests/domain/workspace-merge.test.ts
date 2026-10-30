import { describe, expect, it } from 'vitest';
import {
  checkMergePolicy,
  workspaceMergePolicy,
  mergeWorkspace,
  reconcileInheritance,
  validateWorkspace,
  updateAssessment,
  renameTeam,
  renameScenario,
  duplicateScenario,
  deleteScenario,
  createTeam,
  createWorkspace,
  registerAthleteSkill,
  replaceAthleteSkill,
  setOwnAssessment,
  setArchived,
  moveAthlete,
  skillIdentity,
  confirmConnection,
  bindingFingerprint,
} from '@teamgym/domain';
import type { MergeContext, MergeResult, Workspace } from '@teamgym/domain';
import { syntheticWorkspace, binding } from '../fixtures/synthetic-workspace';

const context: MergeContext = {
  fingerprint: 'synthetic-rules-v1',
  reconcile: (workspace) => {
    reconcileInheritance(workspace, undefined, '2026-10-27T12:00:00Z');
    return validateWorkspace(workspace);
  },
};
function valid(result: MergeResult): Workspace {
  expect(result.diagnostics).toEqual([]);
  if (result.status !== 'valid') throw Error('blocked');
  return result.candidate;
}
function choose(result: MergeResult, side: 'local' | 'remote') {
  return Object.fromEntries(result.conflicts.map((item) => [item.id, side]));
}
function fixture() {
  const f = syntheticWorkspace();
  return { ...f, b: f.workspace, l: structuredClone(f.workspace), r: structuredClone(f.workspace) };
}

describe('eksplicit schema- og politikdækning', () => {
  it('dækker alle format 3-felter og indlejrede unioner', () => {
    expect(checkMergePolicy()).toEqual([]);
  });
  it.each(['top', 'nested', 'atomic', 'atomic-nested', 'union'])(
    'afviser manglende %s uden schemaændring',
    (kind) => {
      const p = structuredClone(workspaceMergePolicy);
      if (kind === 'top') delete p.fields!.athletes;
      if (kind === 'nested')
        delete p.fields!.plans!.element!.fields!.tumbling!.element!.fields!.rounds!.items![0]!.fields!
          .reserves;
      if (kind === 'atomic') delete p.fields!.athleteSkills!.element!.fields!.assessedAt!.group;
      if (kind === 'atomic-nested')
        delete p.fields!.skills!.element!.variants![1]!.fields!.jump!.fields!.landing;
      if (kind === 'union') p.fields!.athleteSkills!.element!.fields!.assessmentOrigin!.variants!.pop();
      expect(checkMergePolicy(p).length).toBeGreaterThan(0);
      expect(checkMergePolicy()).toEqual([]);
    },
  );
});

describe('trevejsmotor', () => {
  it('bevarer ensidig/ens ændring og forskellige felter, er deterministisk og muterer intet', () => {
    const { b, l, r } = fixture();
    l.teams[0]!.name = 'Lokalt navn';
    r.teams[0]!.archived = true;
    l.athletes[0]!.name = r.athletes[0]!.name = 'Fælles navn';
    const inputs = JSON.stringify([b, l, r]);
    const result = mergeWorkspace(b, l, r, context);
    const w = valid(result);
    expect(w.teams[0]).toMatchObject({ name: 'Lokalt navn', archived: true });
    expect(result.conflicts).toEqual([]);
    expect(mergeWorkspace(b, l, r, context)).toEqual(result);
    expect(JSON.stringify([b, l, r])).toBe(inputs);
    expect(valid(mergeWorkspace(b, b, r, context))).toEqual(r);
  });
  it('tilføjer uafhængige identiteter og ignorerer gemmemetadata', () => {
    const b = createWorkspace({ id: () => 'workspace-test', now: () => '2026-10-25T12:00:00Z' });
    const l = createTeam(b, 'Lokalt hold', binding),
      r = createTeam(b, 'Eksternt hold', binding);
    r.revision = 9;
    const result = mergeWorkspace(b, l, r, context);
    const w = valid(result);
    expect(w.teams.map((t) => t.name).sort()).toEqual(['Eksternt hold', 'Lokalt hold']);
    expect(w.plans).toHaveLength(2);
    expect(w.revision).toBe(9);
    expect(result.changes.some((c) => c.path.includes('revision'))).toBe(false);
  });
  it('kræver blandede valg pr. atomisk vurdering og bevarer uafhængige noter', () => {
    const { b, l, r } = fixture();
    for (const i of [0, 3]) {
      l.athleteSkills[i]!.stability = 2;
      r.athleteSkills[i]!.stability = 4;
    }
    l.athleteSkills[0]!.note = 'Lokal note';
    r.athleteSkills[0]!.updatedAt = '2026-10-27T12:00:00Z';
    const review = mergeWorkspace(b, l, r, context);
    expect(review.status).toBe('blocked');
    expect('candidate' in review).toBe(false);
    expect(review.conflicts).toHaveLength(2);
    const choices = {
      [review.conflicts[0]!.id]: 'local' as const,
      [review.conflicts[1]!.id]: 'remote' as const,
    };
    const w = valid(mergeWorkspace(b, l, r, context, choices));
    expect(w.athleteSkills[0]!.stability).toBe(2);
    expect(w.athleteSkills[3]!.stability).toBe(4);
    expect(w.athleteSkills[0]!.note).toBe('Lokal note');
    expect(mergeWorkspace(b, l, r, context, { foreign: 'local' }).status).toBe('blocked');
    l.athleteSkills[0]!.note = 'Ny note';
    expect(mergeWorkspace(b, l, r, context, choices).status).toBe('blocked');
  });
  it('samme vurdering med forskellige opdateringstider kræver intet valg', () => {
    const { b, l, r } = fixture();
    for (const side of [l, r]) side.athleteSkills[0]!.stability = 3;
    l.athleteSkills[0]!.updatedAt = '2026-10-26T12:00:00Z';
    r.athleteSkills[0]!.updatedAt = '2026-10-27T12:00:00Z';
    expect(mergeWorkspace(b, l, r, context).conflicts).toEqual([]);
    expect(valid(mergeWorkspace(b, l, r, context)).athleteSkills[0]!.stability).toBe(3);
  });
  it('uafhængige omgange flettes, flytning mellem lister kræver samlet valg', () => {
    const { b, l, r } = fixture();
    l.plans[0]!.tumbling[0]!.rounds[0].entries.reverse();
    r.plans[0]!.tumbling[0]!.rounds[1].entries.reverse();
    expect(valid(mergeWorkspace(b, l, r, context)).plans[0]!.tumbling[0]!.rounds[1].entries).toEqual(
      r.plans[0]!.tumbling[0]!.rounds[1].entries,
    );
    const round = l.plans[0]!.tumbling[0]!.rounds[0];
    const removed = round.entries.shift()!;
    round.reserves.push({
      id: 'synthetic-reserve',
      athleteId: removed.athleteId,
      athleteSkillId: removed.athleteSkillId,
    });
    r.plans[0]!.tumbling[0]!.rounds[0].entries.reverse();
    const review = mergeWorkspace(b, l, r, context);
    expect(review.conflicts).toHaveLength(1);
    expect(review.conflicts[0]!.changeIds).toHaveLength(2);
    const w = valid(mergeWorkspace(b, l, r, context, choose(review, 'local')));
    expect(w.plans[0]!.tumbling[0]!.rounds[0].reserves).toHaveLength(1);
  });
  it('sletning mod redigering og ens scenarienavne med forskellige id’er forklares', () => {
    const { b: initial } = fixture();
    const plan = initial.plans[0]!;
    const b = duplicateScenario(initial, plan.id, 'tumbling', plan.tumbling[0]!.id, 'Plan B');
    const l = deleteScenario(b, plan.id, 'tumbling', plan.tumbling[0]!.id);
    const r = renameScenario(b, plan.id, 'tumbling', plan.tumbling[0]!.id, 'Ændret A');
    const review = mergeWorkspace(b, l, r, context);
    expect(review.conflicts).toHaveLength(1);
    expect(
      valid(mergeWorkspace(b, l, r, context, choose(review, 'remote'))).plans[0]!.tumbling[0]!.name,
    ).toBe('Ændret A');
    const left = duplicateScenario(b, plan.id, 'tumbling', plan.tumbling[0]!.id, 'Samme navn');
    const right = duplicateScenario(b, plan.id, 'tumbling', plan.tumbling[0]!.id, 'Samme navn');
    const collision = mergeWorkspace(b, left, right, context);
    expect(collision.conflicts).toHaveLength(1);
    expect(
      valid(mergeWorkspace(b, left, right, context, choose(collision, 'local'))).plans[0]!.tumbling,
    ).toHaveLength(3);
  });
  it('afviser ukendt format, felter, identitet og ugyldigt afstemt resultat uden kandidat', () => {
    const { b } = fixture();
    for (const r of [
      { ...b, schemaVersion: 99 },
      { ...b, workspaceId: 'other' },
      { ...b, extra: 1 },
    ])
      expect(mergeWorkspace(b, b, r, context).status).toBe('blocked');
    const result = mergeWorkspace(b, b, b, { ...context, reconcile: (w) => ({ ...w, teams: [] }) });
    expect(result.status).toBe('blocked');
    expect('candidate' in result).toBe(false);
    const overridden = mergeWorkspace(b, b, b, {
      ...context,
      reconcile: (w) => {
        w.athleteSkills[0]!.note = 'Skjult ændring';
        return w;
      },
    });
    expect(overridden.status).toBe('blocked');
    if (result.status === 'blocked') {
      // @ts-expect-error En blokeret gennemgang må ikke kunne anvendes som kandidat.
      expect(result.candidate).toBeUndefined();
    }
  });
  it('ændret udførelse mod vurdering vælges samlet og valg kan ændres', () => {
    const { b, environment } = fixture();
    const old = b.skills[0]!;
    if (old.discipline !== 'tumbling') throw Error('fixture');
    const replacement = {
      ...old,
      id: 'replacement',
      elements: old.elements.map((e) => ({ ...e, twistsHalfTurns: 0, twistDistribution: [] })),
    };
    const id = b.athleteSkills[0]!.id;
    const l = replaceAthleteSkill(b, id, replacement, environment);
    const r = updateAssessment(
      b,
      id,
      { stability: 4, assessedAt: '2026-10-27', note: 'Ekstern note' },
      environment,
    );
    const review = mergeWorkspace(b, l, r, context);
    expect(review.conflicts).toHaveLength(1);
    const own = valid(mergeWorkspace(b, l, r, context, choose(review, 'local')));
    expect(own.athleteSkills[0]!.skillId).toBe('replacement');
    expect(own.athleteSkills[0]!.stability).toBeNull();
    expect(own.athleteSkills[0]!.note).toBe('Ekstern note');
    const other = valid(mergeWorkspace(b, l, r, context, choose(review, 'remote')));
    expect(other.athleteSkills[0]!.skillId).toBe(old.id);
    expect(other.athleteSkills[0]!.stability).toBe(4);
  });
  it('ens præcise spring og registreringer med forskellige id’er samles med referencer', () => {
    const { b, athleteA } = fixture();
    const old = b.skills[0]!;
    if (old.discipline !== 'tumbling') throw Error('fixture');
    const definition = {
      ...old,
      id: 'new-left',
      elements: old.elements.map((e) => ({ ...e, twistsHalfTurns: 0, twistDistribution: [] })),
    };
    const l = registerAthleteSkill(b, athleteA.id, definition).workspace;
    const r = registerAthleteSkill(b, athleteA.id, { ...definition, id: 'new-right' }).workspace;
    r.teams[1]!.name = 'Uafhængigt eksternt navn';
    const review = mergeWorkspace(b, l, r, context);
    expect(review.conflicts).toHaveLength(1);
    for (const side of ['local', 'remote'] as const) {
      const w = valid(mergeWorkspace(b, l, r, context, choose(review, side)));
      expect(w.skills).toHaveLength(b.skills.length + 1);
      expect(w.athleteSkills).toHaveLength(b.athleteSkills.length + 1);
      expect(w.teams[1]!.name).toBe('Uafhængigt eksternt navn');
    }
  });
  it('forbindelsesbekræftelse mod udskiftet udførelse bliver ét forklarligt valg', () => {
    const { b, environment } = fixture();
    const old = b.skills[0]!;
    if (old.discipline !== 'tumbling') throw Error('fixture');
    const l = confirmConnection(b, b.athleteSkills[0]!.id, 'Syntetisk bekræftelse', environment);
    const r = replaceAthleteSkill(
      b,
      b.athleteSkills[0]!.id,
      {
        ...old,
        id: 'synthetic-replacement',
        elements: old.elements.map((e) => ({ ...e, twistsHalfTurns: 0, twistDistribution: [] })),
      },
      environment,
    );
    const review = mergeWorkspace(b, l, r, context);
    expect(review.conflicts).toHaveLength(1);
    const own = valid(mergeWorkspace(b, l, r, context, choose(review, 'local')));
    expect(own.athleteSkills[0]!.connectionConfirmation?.executionIdentity).toBe(skillIdentity(old));
    expect(own.athleteSkills[0]!.skillId).toBe(old.id);
    const other = valid(mergeWorkspace(b, l, r, context, choose(review, 'remote')));
    expect(other.athleteSkills[0]!.connectionConfirmation).toBeNull();
    expect(other.athleteSkills[0]!.skillId).toBe('synthetic-replacement');
  });
  it.each(['archive', 'move'])('%s mod planændring samles uden at afgøre en anden vurdering', (kind) => {
    const { b, environment, athleteA, teamB } = fixture();
    const l =
      kind === 'archive'
        ? setArchived(b, 'athletes', athleteA.id, true, environment)
        : moveAthlete(b, athleteA.id, teamB.id, environment);
    const r = structuredClone(b);
    r.plans[0]!.tumbling[0]!.rounds[0].entries.reverse();
    r.athleteSkills[3]!.stability = 2;
    const review = mergeWorkspace(b, l, r, context);
    expect(review.conflicts).toHaveLength(1);
    const w = valid(mergeWorkspace(b, l, r, context, choose(review, 'local')));
    expect(w.athleteSkills[3]!.stability).toBe(2);
    expect(w.plans[0]!.tumbling[0]!.rounds[0].entries).toEqual(b.plans[0]!.tumbling[0]!.rounds[0].entries);
  });
  it('arvekilde mod note afstemmes som følgevirkning, mod eget valg kræver konflikt', () => {
    const { b, environment } = fixture();
    const source = b.athleteSkills[0]!,
      target = b.athleteSkills[1]!;
    // Samme gymnast, begge spring i samme disciplin, præcise relationer uden regelregister.
    target.skillId = b.skills[0]!.id + '-short';
    const skill = structuredClone(b.skills[0]!);
    skill.id = target.skillId;
    if (skill.discipline !== 'tumbling') throw Error('fixture');
    skill.elements[0]!.twistsHalfTurns = 0;
    skill.elements[0]!.twistDistribution = [];
    b.skills.push(skill);
    // Oprindelig trampetregistrering skal ikke ligge på trampetpladser efter skiftet.
    for (const round of b.plans[0]!.trampet[0]!.rounds)
      for (const entry of round.entries) if (entry.athleteSkillId === target.id) entry.athleteSkillId = null;
    b.inheritanceRelations.push({
      sourceId: source.id,
      targetId: target.id,
      sourceIdentity: skillIdentity(b.skills[0]!),
      targetIdentity: skillIdentity(skill),
      catalogId: 'synthetic',
      catalogVersion: '1',
      relationId: 'shorter',
    });
    target.assessmentOrigin = { kind: 'inherited', sourceId: source.id, sourceChoice: null };
    target.stability = source.stability;
    target.assessedAt = source.assessedAt;
    validateWorkspace(b);
    const l = updateAssessment(
      b,
      source.id,
      { stability: 3, assessedAt: '2026-10-27', note: source.note },
      environment,
    );
    const r = structuredClone(b);
    r.athleteSkills[1]!.note = 'Uafhængig note';
    const result = mergeWorkspace(b, l, r, context);
    const w = valid(result);
    expect(w.athleteSkills[1]!.stability).toBe(3);
    expect(w.athleteSkills[1]!.note).toBe('Uafhængig note');
    expect(result.consequences).toHaveLength(1);
    const own = setOwnAssessment(
      b,
      target.id,
      { stability: 4, assessedAt: '2026-10-27', note: target.note },
      environment,
    );
    const review = mergeWorkspace(b, l, own, context);
    expect(review.conflicts).toHaveLength(1);
    expect(
      valid(mergeWorkspace(b, l, own, context, choose(review, 'remote'))).athleteSkills[1]!.stability,
    ).toBe(4);
    const excluded = setArchived(b, 'athleteSkills', target.id, true, environment);
    const excludedReview = mergeWorkspace(b, l, excluded, context);
    expect(excludedReview.conflicts).toHaveLength(1);
    const kept = valid(mergeWorkspace(b, l, excluded, context, choose(excludedReview, 'remote')));
    expect(kept.athleteSkills[1]!.archived).toBe(true);
    expect(kept.inheritanceExclusions).toHaveLength(1);
  });
  it('sletning mod ny reference kan vælges uden at fjerne andre ændringer', () => {
    const { b, l, r, athleteA } = fixture();
    for (const round of l.plans[0]!.tumbling[0]!.rounds)
      round.entries = round.entries.filter((e) => e.athleteId !== athleteA.id);
    for (const round of l.plans[0]!.trampet[0]!.rounds)
      round.entries = round.entries.filter((e) => e.athleteId !== athleteA.id);
    l.athleteSkills = l.athleteSkills.filter((item) => item.athleteId !== athleteA.id);
    l.athletes = l.athletes.filter((item) => item.id !== athleteA.id);
    r.plans[0]!.tumbling[0]!.rounds[0].entries.reverse();
    r.teams[1]!.name = 'Bevares';
    const review = mergeWorkspace(b, l, r, context);
    expect(review.conflicts).toHaveLength(1);
    for (const side of ['local', 'remote'] as const)
      expect(valid(mergeWorkspace(b, l, r, context, choose(review, side))).teams[1]!.name).toBe('Bevares');
  });
  it('modstridende scenarierækkefølger kræver valg, ensidige tilføjelser bevares', () => {
    const { b: initial, environment } = fixture();
    const plan = initial.plans[0]!;
    let b = duplicateScenario(initial, plan.id, 'tumbling', plan.tumbling[0]!.id, 'Plan B', environment);
    b = duplicateScenario(b, plan.id, 'tumbling', plan.tumbling[0]!.id, 'Plan C', environment);
    const l = structuredClone(b),
      r = structuredClone(b);
    l.plans[0]!.tumbling.reverse();
    const first = r.plans[0]!.tumbling.shift()!;
    r.plans[0]!.tumbling.push(first);
    const review = mergeWorkspace(b, l, r, context);
    expect(review.conflicts).toHaveLength(1);
    expect(
      valid(mergeWorkspace(b, l, r, context, choose(review, 'local'))).plans[0]!.tumbling.map((s) => s.id),
    ).toEqual(l.plans[0]!.tumbling.map((s) => s.id));
    const added = duplicateScenario(b, plan.id, 'tumbling', plan.tumbling[0]!.id, 'Kun lokalt', environment);
    expect(valid(mergeWorkspace(b, added, b, context)).plans[0]!.tumbling).toEqual(added.plans[0]!.tumbling);
  });
  it('regelbinding/planfingerprint/revurdering mod ny vurdering vælges samlet', () => {
    const { b, l, r } = fixture();
    l.teams[0]!.rulesetBinding.teamType = 'mix';
    l.plans[0]!.bindingFingerprint = JSON.stringify(l.teams[0]!.rulesetBinding);
    l.athleteSkills[0]!.reviewRequiredFor = ['synthetic-new-binding'];
    r.athleteSkills[0]!.stability = 4;
    const review = mergeWorkspace(b, l, r, context);
    expect(review.conflicts).toHaveLength(1);
    const w = valid(mergeWorkspace(b, l, r, context, choose(review, 'remote')));
    expect(w.teams[0]!.rulesetBinding.teamType).toBe('girls');
    expect(w.athleteSkills[0]!.reviewRequiredFor).toEqual([]);
    expect(w.athleteSkills[0]!.stability).toBe(4);
  });
  it('DK-pakkeversionsskift og samtidig vurdering kræver ét eksplicit valg i begge fletteretninger', () => {
    const { b, l, r } = fixture();
    l.teams[0]!.rulesetBinding.packageVersion = '1.1.0';
    l.plans[0]!.bindingFingerprint = bindingFingerprint(l.teams[0]!.rulesetBinding);
    l.athleteSkills[0]!.reviewRequiredFor = [bindingFingerprint(l.teams[0]!.rulesetBinding)];
    r.athleteSkills[0]!.stability = 4;
    for (const [left, right] of [[l, r], [r, l]] as const) {
      const review = mergeWorkspace(b, left, right, context);
      expect(review.status).toBe('blocked');
      expect(review.conflicts).toHaveLength(1);
      const selected = valid(mergeWorkspace(b, left, right, context, choose(review, left === l ? 'remote' : 'local')));
      expect(selected.teams[0]!.rulesetBinding.packageVersion).toBe(b.teams[0]!.rulesetBinding.packageVersion);
      expect(selected.athleteSkills[0]!.stability).toBe(4);
    }
  });
  it('to samtidige domænekommandoer bevarer begge ændringer', () => {
    const { b, environment } = fixture();
    const l = renameTeam(b, b.teams[0]!.id, 'Lokalt hold', environment);
    const r = updateAssessment(
      b,
      b.athleteSkills[0]!.id,
      { stability: 3, assessedAt: '2026-10-27', note: 'Filens note' },
      environment,
    );
    const w = valid(mergeWorkspace(b, l, r, context));
    expect(w.teams[0]!.name).toBe('Lokalt hold');
    expect(w.athleteSkills[0]!.stability).toBe(3);
  });
});
