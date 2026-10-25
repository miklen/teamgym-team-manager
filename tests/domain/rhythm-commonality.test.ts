import { describe, expect, it } from 'vitest';
import { moveAthlete, updateAssessment } from '@teamgym/domain';
import type { SkillDefinition, Stability } from '@teamgym/domain';
import { DK_V1 } from '../../packages/rules/src/dk-v1';
import { filterRhythmRows } from '../../packages/rules/src/rhythm';
import { workspaceBuilder } from '../fixtures/rule-workspace';

const moment: SkillDefinition = { id: 'common-headstand', name: 'Syntetisk hovedstand', archived: false, discipline: 'rhythm', momentId: 'rh-hb-headstand', variant: { legs: 'together' } };

describe('rytmematrix fra aktuel lokal medlems- og færdighedskladde', () => {
  it('8 af 10 er ikke alle, og navne bag mangler bevares i nævneren', () => {
    const builder = workspaceBuilder(); const team = builder.team('Rytme', undefined, 10);
    for (const athlete of builder.workspace.athletes.slice(0, 8)) builder.register(athlete.id, moment);
    const row = DK_V1.rhythm(builder.workspace, team.id).find((entry) => entry.moment.id === moment.momentId)!;
    expect(row.summary).toMatchObject({ coverage: '8/10', ratingCoverage: '8/10', mean: 5, common: false, assessedCount: 8 });
    expect(row.summary.missingNames).toEqual(builder.workspace.athletes.slice(8).map((athlete) => athlete.name));
    expect(row.cells.filter((cell) => cell.state === 'missing')).toHaveLength(2);
  });

  it.each([1, 2, 3, 4, 5] as Stability[])('alle mindst %s kræver hver celle og tåler ikke null', (threshold) => {
    const builder = workspaceBuilder(); const team = builder.team('Tærskel', undefined, 6);
    for (const athlete of builder.workspace.athletes) builder.register(athlete.id, moment, threshold);
    expect(DK_V1.rhythm(builder.workspace, team.id, threshold).find((row) => row.moment.id === moment.momentId)?.summary.passesThreshold).toBe(true);
    const registration = builder.workspace.athleteSkills[0]!;
    builder.workspace = updateAssessment(builder.workspace, registration.id, { stability: null, assessedAt: null, note: '' }, builder.environment);
    const row = DK_V1.rhythm(builder.workspace, team.id, threshold).find((entry) => entry.moment.id === moment.momentId)!;
    expect(row.summary.common).toBe(true);
    expect(row.summary.passesThreshold).toBe(false);
    expect(row.cells[0]?.state).toBe('not-assessed');
  });

  it('nyt medlem bryder en fællesnævner før gemning, og tomt hold har ingen fælles momenter', () => {
    const builder = workspaceBuilder(); const teamA = builder.team('A', undefined, 6); const teamB = builder.team('B', undefined, 1);
    for (const athlete of builder.workspace.athletes.filter((athlete) => athlete.teamId === teamA.id)) builder.register(athlete.id, moment);
    expect(DK_V1.rhythm(builder.workspace, teamA.id).find((row) => row.moment.id === moment.momentId)?.summary.common).toBe(true);
    builder.workspace = moveAthlete(builder.workspace, builder.workspace.athletes.at(-1)!.id, teamA.id, builder.environment);
    expect(DK_V1.rhythm(builder.workspace, teamA.id).find((row) => row.moment.id === moment.momentId)?.summary.coverage).toBe('6/7');
    expect(DK_V1.rhythm(builder.workspace, teamB.id)).toEqual([]);
  });

  it('spejling matcher, men valgfrie landinger og fælles startretning gør ikke', () => {
    const builder = workspaceBuilder(); const team = builder.team('Varianter', undefined, 2);
    const athletes = builder.workspace.athletes;
    builder.register(athletes[0]!.id, { ...moment, id: 'mirror-left', variant: { legs: 'together', side: 'left' } });
    builder.register(athletes[1]!.id, { ...moment, id: 'mirror-right', variant: { legs: 'together', side: 'right' } });
    expect(DK_V1.rhythm(builder.workspace, team.id).find((row) => row.moment.id === moment.momentId)?.summary.common).toBe(true);
    const jump = { id: 'jump-one', name: 'Testhop', archived: false, discipline: 'rhythm' as const, momentId: 'rh-j-jump-straight-360', variant: { landing: 'one-foot', facing: 'front' } };
    builder.register(athletes[0]!.id, jump);
    builder.register(athletes[1]!.id, { ...jump, id: 'jump-two', variant: { landing: 'two-feet', facing: 'front' } });
    expect(DK_V1.rhythm(builder.workspace, team.id).filter((row) => row.moment.id === jump.momentId).every((row) => !row.summary.common)).toBe(true);
    const turn = { id: 'turn-front', name: 'Testpirouette', archived: false, discipline: 'rhythm' as const, momentId: 'rh-db-turn-forward-360', variant: { facing: 'front', side: 'left' } };
    builder.register(athletes[0]!.id, turn);
    builder.register(athletes[1]!.id, { ...turn, id: 'turn-back', variant: { facing: 'back', side: 'right' } });
    expect(DK_V1.rhythm(builder.workspace, team.id).filter((row) => row.moment.id === turn.momentId).every((row) => !row.summary.common)).toBe(true);
  });

  it('to DB804-koder skaber ingen falsk fællesnævner og gruppeelementer vises aldrig', () => {
    const builder = workspaceBuilder(); const team = builder.team('Koder', undefined, 2);
    builder.register(builder.workspace.athletes[0]!.id, { id: 'turn804', name: 'DB804 pirouette', archived: false, discipline: 'rhythm', momentId: 'rh-db-turn-leg90-540', variant: { facing: 'front' } });
    builder.register(builder.workspace.athletes[1]!.id, { id: 'press804', name: 'DB804 stem', archived: false, discipline: 'rhythm', momentId: 'rh-db-press-together', variant: { legs: 'together' } });
    const rows = DK_V1.rhythm(builder.workspace, team.id);
    expect(rows.filter((row) => row.moment.officialCode === 'DB804').every((row) => row.summary.registeredCount === 1 && !row.summary.common)).toBe(true);
    expect(rows.some((row) => row.moment.category === 'G')).toBe(false);
  });

  it('kombinerer kategori, søgning, fælles/partielt og krav til hver gymnast', () => {
    const builder = workspaceBuilder(); const team = builder.team('Filtre', undefined, 6);
    for (const [index, athlete] of builder.workspace.athletes.entries()) builder.register(athlete.id, moment, index === 5 ? 1 : 5);
    const rows = DK_V1.rhythm(builder.workspace, team.id);
    expect(filterRhythmRows(rows, { category: 'HB', search: 'HB201', mode: 'common' })).toHaveLength(1);
    expect(filterRhythmRows(rows, { category: 'HB', search: 'HB201', threshold: 4 })).toHaveLength(0);
    expect(filterRhythmRows(rows, { category: 'HB', search: 'HB201', threshold: 1 })).toHaveLength(1);
    expect(filterRhythmRows(rows, { category: 'F', search: 'HB201' })).toHaveLength(0);
    expect(filterRhythmRows(rows, { mode: 'partial' })).toHaveLength(0);
  });
});
