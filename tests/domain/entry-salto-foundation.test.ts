import { expect, it } from 'vitest';
import {
  createWorkspace,
  parseWorkspace,
  reconcileInheritance,
  registerAthleteSkill,
  serializeWorkspace,
  setOwnAssessment,
  skillIdentity,
  updateAssessment,
  validateWorkspace,
} from '@teamgym/domain';
import { DK_V1 } from '@teamgym/rules';
import {
  registerSpringBatch,
  springFoundation,
  springInheritanceContext,
  springLibrary,
} from '../../apps/web/src/spring-library';
import { syntheticWorkspace } from '../fixtures/synthetic-workspace';

const library = springLibrary(DK_V1, createWorkspace());
const start = library.find((item) => item.id === 'common-a3-f-08-rf-a3-b-11')!.definition;
const full = library.find((item) => item.id === 'common-rf-full')!.definition;
const context = springInheritanceContext(DK_V1);

it('strakt-rondat-flik-hel medtager hele serien uden indgangssalto og dens fundament én gang', () => {
  const foundation = springFoundation(start, DK_V1);
  expect(foundation).toHaveLength(9);
  expect(
    foundation.find((entry) => skillIdentity(entry.definition) === skillIdentity(full))?.relationId,
  ).toBe('without-entry-salto');
  expect(new Set(foundation.map((entry) => skillIdentity(entry.definition))).size).toBe(9);
  for (const entry of springFoundation(full, DK_V1))
    expect(
      foundation.some((child) => skillIdentity(child.definition) === skillIdentity(entry.definition)),
    ).toBe(true);
  expect(
    foundation.every(
      (entry) =>
        entry.definition.discipline === 'tumbling' &&
        entry.definition.elements.every((element) => element.apparatus === 'floor'),
    ),
  ).toBe(true);
});

it('dækker lukket/hoftebøjet/strakt indgang og både rondat- og kraftserier med bevarede overgange', () => {
  const sources = library.filter(
    (choice) =>
      choice.definition.discipline === 'tumbling' &&
      choice.definition.elements[0]!.family === 'salto' &&
      ['roundoff', 'handspring'].includes(choice.definition.elements[1]?.family ?? ''),
  );
  expect(sources.length).toBeGreaterThan(20);
  for (const source of sources) {
    if (source.definition.discipline !== 'tumbling') throw Error('fixture');
    const expected = {
      ...source.definition,
      elements: source.definition.elements.slice(1),
      connection: {
        ...source.definition.connection,
        transitions: source.definition.connection.transitions.slice(1),
      },
    };
    expect(
      springFoundation(source.definition, DK_V1).some(
        (entry) => skillIdentity(entry.definition) === skillIdentity(expected),
      ),
    ).toBe(true);
  }
});

it('danner ikke en løs flik eller et opdigtet tilløb ved at fjerne en barani/rudy', () => {
  const source = library.find((choice) => choice.id === 'common-a3-f-16-a3-b-02-a3-b-11')!.definition;
  expect(
    springFoundation(source, DK_V1).some((entry) => entry.relationId.includes('without-entry-salto')),
  ).toBe(false);
  if (start.discipline !== 'tumbling') throw Error('fixture');
  const unknown = {
    ...start,
    elements: start.elements.map((element, index) =>
      index === 0 ? { ...element, variant: { syntheticUnknown: true } } : element,
    ),
  };
  expect(
    springFoundation(unknown, DK_V1).some((entry) => entry.relationId.includes('without-entry-salto')),
  ).toBe(false);
});

it('alle nye børn følger den direkte valgte serie, også efter genåbning; fravalg bevares', () => {
  const fixture = syntheticWorkspace();
  let workspace = registerSpringBatch(
    fixture.workspace,
    fixture.athleteA.id,
    [{ definition: start, stability: 3, confirmed: true }],
    DK_V1,
    { includeShorter: true, assessedAt: '2026-10-25' },
  );
  const parent = workspace.athleteSkills.find(
    (item) =>
      item.athleteId === fixture.athleteA.id &&
      workspace.skills.some(
        (skill) => skill.id === item.skillId && skillIdentity(skill) === skillIdentity(start),
      ),
  )!;
  const child = workspace.athleteSkills.find(
    (item) =>
      item.athleteId === fixture.athleteA.id &&
      workspace.skills.some(
        (skill) => skill.id === item.skillId && skillIdentity(skill) === skillIdentity(full),
      ),
  )!;
  expect(
    workspace.inheritanceRelations.every(
      (relation) => relation.sourceId === parent.id && relation.catalogVersion === '3',
    ),
  ).toBe(true);
  expect(child).toMatchObject({ stability: 3, assessmentOrigin: { kind: 'inherited', sourceId: parent.id } });
  workspace = updateAssessment(
    parseWorkspace(serializeWorkspace(workspace)),
    parent.id,
    { stability: 5, assessedAt: '2026-10-26', note: '' },
    { ...fixture.environment, inheritance: context },
  );
  expect(workspace.athleteSkills.find((item) => item.id === child.id)).toMatchObject({
    stability: 5,
    assessedAt: '2026-10-26',
  });
  const excluded = registerSpringBatch(
    fixture.workspace,
    fixture.athleteA.id,
    [{ definition: start, stability: 4, confirmed: true }],
    DK_V1,
    { includeShorter: true, assessedAt: '2026-10-26', excluded: [skillIdentity(full)] },
  );
  expect(
    excluded.athleteSkills.some((item) =>
      excluded.skills.some(
        (skill) => skill.id === item.skillId && skillIdentity(skill) === skillIdentity(full),
      ),
    ),
  ).toBe(false);
  expect(parseWorkspace(serializeWorkspace(excluded)).inheritanceExclusions).toEqual([
    { athleteId: fixture.athleteA.id, targetIdentity: skillIdentity(full) },
  ]);
});

it('bevarer katalog 1 ved genåbning og tilføjer først nye børn ved bevidst registrering', () => {
  const fixture = syntheticWorkspace();
  const added = registerAthleteSkill(fixture.workspace, fixture.athleteA.id, start, fixture.environment);
  let workspace = setOwnAssessment(
    added.workspace,
    added.athleteSkillId,
    { stability: 3, assessedAt: '2026-10-25', note: '' },
    fixture.environment,
  );
  for (const entry of springFoundation(start, DK_V1, '1')) {
    const child = registerAthleteSkill(workspace, fixture.athleteA.id, entry.definition, fixture.environment);
    workspace = setOwnAssessment(
      child.workspace,
      child.athleteSkillId,
      { stability: 3, assessedAt: '2026-10-25', note: '' },
      fixture.environment,
    );
    workspace.inheritanceRelations.push({
      sourceId: added.athleteSkillId,
      targetId: child.athleteSkillId,
      sourceIdentity: skillIdentity(start),
      targetIdentity: skillIdentity(entry.definition),
      catalogId: 'spring-foundation',
      catalogVersion: '1',
      relationId: entry.relationId,
    });
    workspace.athleteSkills.find((item) => item.id === child.athleteSkillId)!.assessmentOrigin = {
      kind: 'inherited',
      sourceId: added.athleteSkillId,
      sourceChoice: null,
    };
  }
  workspace = parseWorkspace(serializeWorkspace(validateWorkspace(workspace)));
  reconcileInheritance(workspace, context);
  expect(workspace.athleteSkills).toHaveLength(28);
  expect(workspace.inheritanceRelations).toHaveLength(3);
  const next = registerSpringBatch(
    workspace,
    fixture.athleteA.id,
    [{ definition: start, stability: 5, confirmed: true }],
    DK_V1,
    { includeShorter: true, assessedAt: '2026-10-26' },
  );
  expect(next.athleteSkills).toHaveLength(34);
  expect(next.inheritanceRelations.filter((relation) => relation.catalogVersion === '1')).toHaveLength(3);
  expect(next.inheritanceRelations.filter((relation) => relation.catalogVersion === '3')).toHaveLength(6);
});
