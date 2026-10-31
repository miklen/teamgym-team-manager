import { describe, expect, it } from 'vitest';
import { createAthlete, diagnoseWorkspace, moveAthlete, moveRoundFirst, parseWorkspace, registerAthleteSkill, roundStability,
  serializeWorkspace, setArchived, setRoundEntries, updateAssessment, validateWorkspace, workspacePayload, WorkspaceFormatError } from '@teamgym/domain';
import { binding, limits, rhythmSkill, syntheticWorkspace, tumblingSkill } from '../fixtures/synthetic-workspace';

describe('fælles fil og seks vedvarende omgange', () => {
  it('bevarer to hold med forskellige bindinger og alle tre discipliners data gennem round-trip', () => {
    const { workspace } = syntheticWorkspace();
    const reopened = parseWorkspace(serializeWorkspace(workspace));
    expect(reopened).toEqual(workspace);
    expect(reopened.teams[0]?.rulesetBinding).toEqual(binding);
    expect(reopened.teams[1]?.rulesetBinding.rulesetId).toBe('test-only');
    expect(reopened.plans[0]?.tumbling[0]!.rounds.map((round) => round.entries.length)).toEqual([6, 6, 6]);
    expect(reopened.plans[0]?.trampet[0]!.rounds.map((round) => round.entries.length)).toEqual([6, 6, 6]);
    expect(reopened.athleteSkills).toHaveLength(24);
    expect(reopened.athleteSkills[0]?.note).toBe('Kun syntetiske testdata.');
  });

  it('tillader tomme holdplaner og en gymnast med manglende springvalg som kladde', () => {
    const { workspace } = syntheticWorkspace();
    workspace.plans[0]!.tumbling[0]!.rounds[0].entries = [{ ...workspace.plans[0]!.tumbling[0]!.rounds[0].entries[0]!, athleteSkillId: null }];
    expect(parseWorkspace(serializeWorkspace(workspace))).toEqual(workspace);
    expect(diagnoseWorkspace(workspace)).toContainEqual(expect.objectContaining({ code: 'skill-missing', status: 'incomplete' }));
  });

  it.each(['{}', '{', '[]', 'null', '{"schemaVersion":1}'])('afviser uvedkommende/beskadiget JSON uden tom fallback: %s', (bytes) => {
    expect(() => parseWorkspace(bytes)).toThrow(WorkspaceFormatError);
  });

  it('afviser nyere og ældre ukendte skemaer og ændrer aldrig originalen', () => {
    const { workspace } = syntheticWorkspace();
    for (const [version, code] of [[5, 'newer-schema'], [0, 'migration-required']] as const) {
      const original = JSON.stringify({ ...workspace, schemaVersion: version });
      try { parseWorkspace(original); throw new Error('Skulle afvises'); }
      catch (error) { expect(error).toBeInstanceOf(WorkspaceFormatError); expect((error as WorkspaceFormatError).code).toBe(code); }
      expect(JSON.parse(original).schemaVersion).toBe(version);
    }
  });

  it('afviser ukendte felter i stedet for at strippe dem og gemme over filen', () => {
    const { workspace } = syntheticWorkspace();
    expect(() => validateWorkspace({ ...workspace, arbitraryPayload: 'unrelated-data' })).toThrow('Ugyldige arbejdsrumsdata');
    expect(() => validateWorkspace({ ...workspace, athleteSkills: [{ ...workspace.athleteSkills[0], learningStatus: 'ready' }] })).toThrow();
  });

  it('afviser duplikerede id-er, ødelagte referencer og ufuldstændig seksomgangsstruktur', () => {
    const { workspace } = syntheticWorkspace();
    const brokenReference = structuredClone(workspace);
    brokenReference.athletes[0]!.teamId = 'unknown-team';
    expect(() => validateWorkspace(brokenReference)).toThrow('holdreference');
    expect(() => validateWorkspace({ ...workspace, athletes: [...workspace.athletes, workspace.athletes[0]] })).toThrow('Identiteter');
    expect(() => validateWorkspace({ ...workspace, plans: [] })).toThrow('seks omgange');
    expect(() => validateWorkspace({ ...workspace, plans: [{ ...workspace.plans[0], tumbling: [] }] })).toThrow();
  });

  it('afviser færdighed fra en anden gymnast eller forkert disciplin i en omgang', () => {
    const { workspace, athleteB } = syntheticWorkspace();
    const wrongOwner = structuredClone(workspace);
    wrongOwner.plans[0]!.tumbling[0]!.rounds[0].entries[0]!.athleteSkillId = workspace.athleteSkills.find((item) => item.athleteId === athleteB.id)!.id;
    expect(() => validateWorkspace(wrongOwner)).toThrow('tilhører ikke');
    const wrongDiscipline = structuredClone(workspace);
    wrongDiscipline.plans[0]!.tumbling[0]!.rounds[0].entries[0]!.athleteSkillId = workspace.athleteSkills.find((item) => item.athleteId === workspace.athletes[0]!.id && item.skillId === rhythmSkill.id)!.id;
    expect(() => validateWorkspace(wrongDiscipline)).toThrow('forkert disciplin');
  });

  it('payload indgår ikke i sin egen operationshistorik eller revision', () => {
    const { workspace } = syntheticWorkspace();
    const after = { ...workspace, revision: 1, updatedAt: '2026-10-26T12:00:00Z', recentOperations: [{ id: 'operation-1', payloadHash: 'a'.repeat(64), revision: 1, savedAt: '2026-10-26T12:00:00Z' }] };
    expect(workspacePayload(after)).toBe(workspacePayload(workspace));
    after.athletes = after.athletes.map((athlete, index) => index === 0 ? { ...athlete, name: 'Ændret syntetisk navn' } : athlete);
    expect(workspacePayload(after)).not.toBe(workspacePayload(workspace));
  });
});

describe('identiteter, medlemskab og arkivering', () => {
  it('holder navnesammenfald adskilt og bevarer alle vurderinger ved flytning', () => {
    const { workspace, athleteA, athleteB, teamA, teamB, environment } = syntheticWorkspace();
    expect(athleteA.name).toBe(athleteB.name);
    expect(athleteA.id).not.toBe(athleteB.id);
    const moved = moveAthlete(workspace, athleteA.id, teamB.id, environment);
    expect(moved.athleteSkills).toEqual(workspace.athleteSkills);
    expect(moved.plans).toEqual(workspace.plans);
    expect(moved.athletes.find((item) => item.id === athleteA.id)?.teamId).toBe(teamB.id);
    expect(workspace.athletes.find((item) => item.id === athleteA.id)?.teamId).toBe(teamA.id);
    expect(diagnoseWorkspace(moved).filter((item) => item.code === 'athlete-moved')).toHaveLength(6);
    expect(parseWorkspace(serializeWorkspace(moved))).toEqual(moved);
  });

  it('åbner eksisterende præcis registrering uden dublet eller nulstillet vurdering', () => {
    const { workspace, athleteA, environment } = syntheticWorkspace();
    const registration = registerAthleteSkill(workspace, athleteA.id, { ...tumblingSkill, id: 'other-id', name: 'Et aliasnavn' }, environment);
    expect(registration.existed).toBe(true);
    expect(registration.workspace).toBe(workspace);
    expect(registration.workspace.athleteSkills).toHaveLength(24);
    expect(registration.workspace.athleteSkills.find((item) => item.id === registration.athleteSkillId)?.stability).toBe(1);
  });

  it('kan oprette uden hold og tilknytte senere uden at kopiere gymnasten', () => {
    const { workspace, environment, teamB } = syntheticWorkspace();
    const created = createAthlete(workspace, { name: 'Uden hold Test' }, environment);
    const athlete = created.athletes.at(-1)!;
    expect(athlete.teamId).toBeNull();
    expect(moveAthlete(created, athlete.id, teamB.id, environment).athletes.at(-1)?.id).toBe(athlete.id);
  });

  it('arkivering og genaktivering bevarer data og giver konkrete diagnoser', () => {
    const { workspace, environment, teamA, athleteA } = syntheticWorkspace();
    const archivedTeam = setArchived(workspace, 'teams', teamA.id, true, environment);
    expect(archivedTeam.plans).toEqual(workspace.plans);
    expect(diagnoseWorkspace(archivedTeam).some((item) => item.code === 'team-archived')).toBe(true);
    expect(setArchived(archivedTeam, 'teams', teamA.id, false, environment)).toEqual(workspace);
    const archivedAthlete = setArchived(workspace, 'athletes', athleteA.id, true, environment);
    expect(diagnoseWorkspace(archivedAthlete).filter((item) => item.code === 'athlete-archived')).toHaveLength(6);
    const archivedSkill = setArchived(workspace, 'skills', tumblingSkill.id, true, environment);
    expect(diagnoseWorkspace(archivedSkill).filter((item) => item.code === 'skill-archived')).toHaveLength(18);
    expect(archivedSkill.athleteSkills).toEqual(workspace.athleteSkills);
  });

  it('samme gymnast kan deltage på tværs af omgange, men ikke to gange i én', () => {
    const { workspace, environment } = syntheticWorkspace();
    const plan = workspace.plans[0]!;
    const entries = plan.tumbling[0]!.rounds[0].entries;
    expect(entries[0]?.athleteId).toBe(plan.tumbling[0]!.rounds[2].entries[0]?.athleteId);
    expect(() => setRoundEntries(workspace, plan.id, 'tumbling', plan.tumbling[0]!.id, plan.tumbling[0]!.rounds[0].id, [entries[0]!, { ...entries[0]!, id: 'duplicate-entry' }], limits, environment)).toThrow('to gange');
  });

  it('flytter holdomgangen med hele dens indhold', () => {
    const { workspace, environment } = syntheticWorkspace();
    const plan = workspace.plans[0]!;
    const moved = moveRoundFirst(workspace, plan.id, 'tumbling', plan.tumbling[0]!.id, plan.tumbling[0]!.rounds[2].id, environment);
    expect(moved.plans[0]?.tumbling[0]!.rounds).toEqual([plan.tumbling[0]!.rounds[2], plan.tumbling[0]!.rounds[0], plan.tumbling[0]!.rounds[1]]);
    expect(moved.plans[0]?.trampet).toEqual(plan.trampet);
  });

  it('ekstra ændrer ikke tællende stabilitet, og flyttede gymnaster giver ufuldstændighed', () => {
    const { workspace, teamA, teamB, athleteA, environment } = syntheticWorkspace();
    const entries = workspace.plans[0]!.tumbling[0]!.rounds[0].entries;
    const extraAthlete = workspace.athletes[7]!;
    const extra: typeof entries[number] = { id: 'extra-entry', athleteId: extraAthlete.id, role: 'extra', plannedSpot: null, athleteSkillId: workspace.athleteSkills.find((item) => item.athleteId === extraAthlete.id && item.skillId === tumblingSkill.id)!.id };
    expect(roundStability(workspace, [extra, ...entries], limits, teamA.id).counting).toEqual(roundStability(workspace, entries, limits, teamA.id).counting);
    const moved = moveAthlete(workspace, athleteA.id, teamB.id, environment);
    expect(roundStability(moved, entries, limits, teamA.id).counting).toMatchObject({ complete: false, assessedCount: 5, filledCount: 5 });
  });

  it('ændret vurdering slår igennem på en allerede valgt omgang', () => {
    const { workspace, teamA, environment } = syntheticWorkspace();
    const entries = workspace.plans[0]!.tumbling[0]!.rounds[0].entries;
    const changed = updateAssessment(workspace, entries[0]!.athleteSkillId!, { stability: 4, assessedAt: '2026-10-25', note: 'Opdateret test' }, environment);
    expect(roundStability(workspace, entries, limits, teamA.id).counting.minimum).toBe(1);
    expect(roundStability(changed, entries, limits, teamA.id).counting.minimum).toBe(4);
    expect(changed.plans).toEqual(workspace.plans);
  });
});
