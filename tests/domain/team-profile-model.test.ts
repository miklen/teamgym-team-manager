import { describe, expect, it } from 'vitest';
import {
  createAthlete,
  createTeam,
  createWorkspace,
  registerAthleteSkill,
  setArchived,
  setOwnAssessment,
  skillIdentity,
} from '@teamgym/domain';
import type { SkillDefinition, Stability, Workspace } from '@teamgym/domain';
import { DK_V2, REG_V1 } from '@teamgym/rules';
import type { RulePackage } from '@teamgym/rules';
import { registerSpringBatch, springLibrary } from '../../apps/web/src/spring-library';
import { profileStatus, teamProfile } from '../../apps/web/src/team-profile-model';
import { binding } from '../fixtures/synthetic-workspace';

const library = springLibrary(DK_V2, createWorkspace());
const spring = (id: string) => library.find((choice) => choice.id === id)!.definition;
const flik = spring('common-rf');
const tuck = spring('common-rf-a3-b-04');
const pike = spring('common-rf-a3-b-05');
const layout = spring('common-rf-a3-b-06');
const full = spring('common-rf-full');
const double = spring('common-rf-a3-b-13');
const whipFull = spring('common-rw-a3-b-11');

function team(count: number) {
  let workspace = createTeam(createWorkspace(), 'Syntetisk profilhold', binding);
  const teamId = workspace.teams[0]!.id;
  for (let index = 0; index < count; index++)
    workspace = createAthlete(workspace, { name: `Syntetisk gymnast ${String(index + 1).padStart(2, '0')}`, teamId });
  return { workspace, teamId };
}

/** Én registrering pr. sikkerhed; `null` er Ikke vurderet. Gymnasterne tages i rækkefølge. */
function give(workspace: Workspace, definition: SkillDefinition, stabilities: readonly (Stability | null)[], offset = 0) {
  let next = workspace;
  stabilities.forEach((stability, index) => {
    const added = registerAthleteSkill(next, next.athletes[offset + index]!.id, definition);
    next =
      stability === null
        ? added.workspace
        : setOwnAssessment(added.workspace, added.athleteSkillId, { stability, assessedAt: '2026-11-11', note: '' });
  });
  return next;
}
const repeat = <T,>(value: T, count: number) => Array.from({ length: count }, () => value);
const row = (profile: ReturnType<typeof teamProfile>, name: string) =>
  profile.lines.flatMap((line) => [...line.rows, ...line.unknown]).find((item) => item.name === name)!;

describe('holdprofil', () => {
  it('tæller hver gymnast én gang pr. identitet med bedste registrering', () => {
    const created = team(2);
    const { teamId } = created;
    let { workspace } = created;
    workspace = give(workspace, full, [2]);
    workspace = registerAthleteSkill(workspace, workspace.athletes[0]!.id, { ...full, id: 'synthetic-copy', name: 'Syntetisk kopi' }).workspace;
    const copy = workspace.athleteSkills.at(-1)!;
    workspace = setOwnAssessment(workspace, copy.id, { stability: 4, assessedAt: '2026-11-11', note: '' });
    const result = row(teamProfile(workspace, teamId, 'tumbling', DK_V2), full.name);
    expect(result).toMatchObject({ can: 1, safe: 1, low: 0 });
    expect(result.athletes[0]!.stability).toBe(4);
  });

  it('tæller arvet fundament og ikke fravalgt fundament', () => {
    const created = team(2);
    const { teamId } = created;
    let { workspace } = created;
    const [first, second] = workspace.athletes;
    workspace = registerSpringBatch(workspace, first!.id, [{ definition: full, stability: 3, confirmed: true }], DK_V2, {
      includeShorter: true,
      assessedAt: '2026-11-11',
    });
    workspace = registerSpringBatch(workspace, second!.id, [{ definition: full, stability: 3, confirmed: true }], DK_V2, {
      includeShorter: true,
      assessedAt: '2026-11-11',
      excluded: [skillIdentity(flik)],
    });
    expect(workspace.athleteSkills.some((item) => item.athleteId === first!.id && item.assessmentOrigin.kind === 'inherited')).toBe(true);
    const identity = DK_V2.evaluateSkill(flik).identity;
    const foundation = teamProfile(workspace, teamId, 'tumbling', DK_V2)
      .lines.flatMap((line) => [...line.rows, ...line.unknown])
      .find((item) => item.identity === identity)!;
    expect(foundation.athletes.map((item) => item.athleteId)).toEqual([first!.id]);
    expect(foundation.safe).toBe(1);
  });

  it('udelader arkiverede gymnaster, rytme og andre discipliner', () => {
    const created = team(3);
    const { teamId } = created;
    let { workspace } = created;
    workspace = give(workspace, full, [5, 5, 5]);
    workspace = setArchived(workspace, 'athletes', workspace.athletes[2]!.id, true);
    const profile = teamProfile(workspace, teamId, 'tumbling', DK_V2);
    expect(row(profile, full.name).can).toBe(2);
    expect(profile.athletes).toHaveLength(2);
    expect(teamProfile(workspace, teamId, 'trampet', DK_V2).lines).toEqual([]);
  });

  it('fordeler sikkerhed uden at gætte for Ikke vurderet', () => {
    const created = team(8);
    const { teamId } = created;
    let { workspace } = created;
    workspace = give(workspace, full, [5, 4, 4, 3, 2, 1, 1, null]);
    expect(row(teamProfile(workspace, teamId, 'tumbling', DK_V2), full.name)).toMatchObject({
      can: 8,
      safe: 4,
      low: 3,
      unassessed: 1,
    });
  });

  it('beregner status i specens rækkefølge', () => {
    const status = (can: number, safe: number, unassessed: number) => profileStatus({ can, safe, unassessed }, 6);
    expect(status(7, 7, 0)).toBe('ready');
    expect(status(6, 6, 0)).toBe('fragile');
    expect(status(8, 6, 0)).toBe('fragile');
    expect(status(6, 4, 2)).toBe('unassessed');
    expect(status(6, 4, 0)).toBe('unstable');
    expect(status(6, 3, 2)).toBe('unstable');
    expect(status(5, 5, 0)).toBe('close');
    expect(status(4, 4, 0)).toBeNull();
    expect(profileStatus({ can: 3, safe: 3, unassessed: 0 }, 4)).toBe('close');
  });

  it('læser N fra regelpakken uden fast tal', () => {
    const created = team(5);
    const { teamId } = created;
    let { workspace } = created;
    workspace = give(workspace, full, [5, 5, 5, 5, 5]);
    const four = Object.assign(Object.create(DK_V2) as RulePackage, {
      springRules: { ...DK_V2.springRules, participants: { ...DK_V2.springRules.participants, counting: 4 } },
    });
    const small = teamProfile(workspace, teamId, 'tumbling', four);
    expect([small.n, small.cap]).toEqual([4, 6]);
    expect(row(small, full.name).status).toBe('ready');
    expect(row(teamProfile(workspace, teamId, 'tumbling', DK_V2), full.name).status).toBe('close');
    expect(teamProfile(workspace, teamId, 'tumbling', REG_V1).n).toBe(REG_V1.springRules.participants.counting);
  });

  it('stærkt hold skjuler lettere spring, der kendes af mindst lige så mange (beskåret ved N + 2)', () => {
    const created = team(10);
    const { teamId } = created;
    let { workspace } = created;
    workspace = give(workspace, double, repeat(5, 8));
    workspace = give(workspace, layout, repeat(5, 10));
    workspace = give(workspace, tuck, repeat(4, 10));
    const line = teamProfile(workspace, teamId, 'tumbling', DK_V2).lines[0]!;
    expect(line.visible.map((item) => item.name)).toEqual([double.name]);
    expect(line.hidden.map((item) => item.name)).toEqual([layout.name, tuck.name]);
    expect(line.level?.name).toBe(double.name);
  });

  it('blandet hold bevarer trappen; ens D skjuler ikke hinanden', () => {
    const created = team(9);
    const { teamId } = created;
    let { workspace } = created;
    workspace = give(workspace, double, [5, 4]);
    workspace = give(workspace, full, [5, 5, 4, 3]);
    workspace = give(workspace, flik, repeat(5, 9));
    workspace = give(workspace, tuck, repeat(3, 5));
    workspace = give(workspace, pike, repeat(3, 5));
    const line = teamProfile(workspace, teamId, 'tumbling', DK_V2).lines[0]!;
    // Hoftebøjet og lukket salto har samme D og ordnes efter navn.
    expect(line.visible.map((item) => item.name)).toEqual([double.name, full.name, pike.name, tuck.name, flik.name]);
    expect(line.hidden).toEqual([]);
  });

  it('spring i andre linjer skjuler ikke hinanden', () => {
    const created = team(8);
    const { teamId } = created;
    let { workspace } = created;
    workspace = give(workspace, whipFull, repeat(5, 8));
    workspace = give(workspace, layout, repeat(5, 8));
    const profile = teamProfile(workspace, teamId, 'tumbling', DK_V2);
    expect(profile.lines.map((line) => [line.family, line.visible.length, line.hidden.length])).toEqual([
      ['Rondat-flik', 1, 0],
      ['Rondat-whipback', 1, 0],
    ]);
  });

  it('ukendt D står under Uden kendt D og påvirker ikke relevans', () => {
    const created = team(8);
    const { teamId } = created;
    let { workspace } = created;
    workspace = give(workspace, full, repeat(5, 8));
    workspace = give(workspace, layout, repeat(5, 8));
    workspace = give(workspace, tuck, repeat(5, 3));
    const tuckIdentity = DK_V2.evaluateSkill(tuck).identity;
    const unknownD = Object.assign(Object.create(DK_V2) as RulePackage, {
      evaluateSkill: ((skill, registration) => {
        const evaluated = DK_V2.evaluateSkill(skill, registration);
        return evaluated.identity === DK_V2.evaluateSkill(full).identity || evaluated.identity === tuckIdentity
          ? { ...evaluated, difficulty: { ...evaluated.difficulty, value: null } }
          : evaluated;
      }) as RulePackage['evaluateSkill'],
    });
    const line = teamProfile(workspace, teamId, 'tumbling', unknownD).lines[0]!;
    expect(line.unknown.map((item) => item.name)).toEqual([full.name, tuck.name].sort((a, b) => a.localeCompare(b, 'da')));
    expect(line.visible.map((item) => item.name)).toEqual([layout.name]);
    expect(line.hidden).toEqual([]);
    expect(line.distribution).toEqual({ safe: 19, low: 0, unassessed: 0 });
  });

  it('niveau, åbne linjer og fokus i fast prioritet og D-orden', () => {
    const created = team(8);
    const { teamId } = created;
    let { workspace } = created;
    workspace = give(workspace, double, repeat(5, 5));
    workspace = give(workspace, full, repeat(4, 7));
    workspace = give(workspace, whipFull, [5, 5, 5, 5, 2, 1]);
    workspace = give(workspace, spring('common-rw-a3-b-06'), repeat(5, 6));
    workspace = give(workspace, spring('common-sh-barani'), [5, 1, 2, 1]);
    const profile = teamProfile(workspace, teamId, 'tumbling', DK_V2);
    expect(profile.level.tops.map((item) => item.name)).toEqual([full.name]);
    expect(profile.level.openLines).toBe(2);
    expect(profile.focus.map((item) => item.text)).toEqual([
      `${double.name} · mangler 1`,
      `${whipFull.name} · 2 lave`,
      `${spring('common-rw-a3-b-06').name} · ingen margin`,
      'Startsalto · forlæns · lav sikkerhed i linjen',
    ]);
    expect(profile.focus[0]).toMatchObject({ kind: 'close', family: 'Rondat-flik', identity: DK_V2.evaluateSkill(double).identity });
  });

  it('siger tydeligt, når intet er Klar, og ændrer ikke arbejdsrummet', () => {
    const created = team(6);
    const { teamId } = created;
    let { workspace } = created;
    workspace = give(workspace, full, [5, 4, 3, 3, null, null]);
    const before = structuredClone(workspace);
    const profile = teamProfile(workspace, teamId, 'tumbling', DK_V2);
    expect(profile.level.tops).toEqual([]);
    expect(profile.focus.map((item) => item.kind)).toEqual(['unassessed']);
    expect(workspace).toEqual(before);
  });
});
