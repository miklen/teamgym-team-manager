import { createAthlete, createTeam, createWorkspace, registerAthleteSkill, setRoundEntries, updateAssessment } from '@teamgym/domain';
import type { CommandEnvironment, ElementExecution, RulesetBinding, SkillDefinition } from '@teamgym/domain';
import { syntheticWorkspace } from '../fixtures/synthetic-workspace';
import { openWorkspace } from './drive-fixture';
import { expect, test } from './test';

/*
 * Syntetiske REG-forløb. Forventede tal er håndregnet fra kilderne (se tests/domain/reg-fixtures.test.ts):
 * Bane (REG-F01, junior): D = (6 × 0,5 + 6 × 0,4 + 6 × 0,8) / 3 = 3,40; C = 1,00 + 6 × 0,2 = 2,20.
 * Trampet (REG-F04, U14): D = (6 × 0,1 + 6 × 0,4 + 6 × 0,5) / 3 = 2,00; C = 1,00 + 6 × 0,2 = 2,20.
 */
const reg = (ageGroup: string): RulesetBinding => ({ rulesetId: 'reg', packageVersion: '1.0.0', ageGroup, teamType: 'girls' });
const element = (family: string, direction: 'forward' | 'backward', options: Partial<ElementExecution> = {}): ElementExecution => ({
  family, direction, rotationQuarterTurns: 4, bodyPositions: ['straight'], twistsHalfTurns: 0, twistDistribution: [],
  apparatus: 'floor', takeoff: 'two-feet', landing: 'feet', variant: {}, ...options,
});
const RONDAT = element('roundoff', 'backward', { takeoff: 'one-foot' });
const FLIK = element('flic', 'backward');
const series = (id: string, ...elements: ElementExecution[]): SkillDefinition => ({
  id, name: `Syntetisk ${id}`, archived: false, discipline: 'tumbling', elements,
  connection: { kind: 'standard', transitions: elements.slice(1).map(() => 'direct') },
});
const jump = (id: string, execution: ElementExecution): SkillDefinition => ({ id, name: `Syntetisk ${id}`, archived: false, discipline: 'trampet', jump: execution });

/** Ét REG-hold med seks gymnaster og samme færdighed for alle seks i hver omgang. */
function regWorkspace(binding: RulesetBinding, discipline: 'tumbling' | 'trampet', rounds: readonly SkillDefinition[]) {
  let counter = 0;
  const environment: CommandEnvironment = { id: () => `reg-e2e-${++counter}`, now: () => '2026-10-31T12:00:00.000Z' };
  let workspace = createTeam(createWorkspace(environment), 'Syntetisk REG', binding, environment);
  const team = workspace.teams[0]!;
  for (let index = 0; index < 6; index++) workspace = createAthlete(workspace, { name: `Syntetisk REG-gymnast ${index + 1}`, teamId: team.id }, environment);
  const plan = workspace.plans[0]!;
  rounds.forEach((definition, roundIndex) => {
    const entries = workspace.athletes.map((athlete) => {
      const result = registerAthleteSkill(workspace, athlete.id, definition, environment);
      workspace = updateAssessment(result.workspace, result.athleteSkillId, { stability: 5, assessedAt: '2026-10-31', note: 'Kun syntetiske testdata.' }, environment);
      return { id: environment.id(), athleteId: athlete.id, athleteSkillId: result.athleteSkillId, role: 'counting' as const };
    });
    const scenario = plan[discipline][0]!;
    workspace = setRoundEntries(workspace, plan.id, discipline, scenario.id, scenario.rounds[roundIndex]!.id, entries, { counting: 6, extra: 6 }, environment);
  });
  return workspace;
}

test('REG-U11-hold oprettes med pakkens profiler og afledt ekstragrænse, og rytmekataloget har 75 momenter', async ({ page }) => {
  const source = await openWorkspace(page, createWorkspace());
  await page.getByRole('button', { name: 'Opret hold', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Opret hold' });
  await dialog.getByLabel('Holdnavn').fill('Syntetisk REG U11');
  await dialog.getByLabel('Regelpakke').selectOption('reg@1.0.0');
  const profiles = dialog.getByLabel('Holdprofil');
  await expect(profiles.locator('option')).toHaveText([
    'U11 piger', 'U11 drenge', 'U11 mix', 'U14 piger', 'U14 drenge', 'U14 mix', 'Junior piger', 'Junior drenge', 'Junior mix',
  ]);
  await profiles.selectOption('U11:girls');
  await dialog.getByRole('button', { name: 'Opdater' }).click();
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  const profile = page.getByRole('region', { name: 'Scenarier' }).locator('.scenario-profile');
  await expect(profile).toContainText('U11 piger');
  await expect(profile).toContainText('6 tællende + højst 6 ekstra først · afledt grænse (TR 1.3.1)');
  await expect(page.getByText('D-grundlag og rækkefølge')).toHaveCount(0);
  await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
  await page.getByRole('button', { name: 'Tilføj gymnast', exact: true }).click();
  await page.getByLabel('Navn', { exact: true }).fill('Syntetisk Rytmegymnast');
  await page.getByRole('combobox', { name: 'Hold', exact: true }).selectOption({ label: 'Syntetisk REG U11' });
  await page.getByRole('button', { name: 'Opdater' }).click();
  await page.getByRole('button', { name: /Syntetisk Rytmegymnast/ }).click();
  await page.getByRole('button', { name: 'Tilføj færdighed' }).click();
  await page.getByRole('combobox', { name: 'Disciplin', exact: true }).selectOption('rhythm');
  const moments = page.getByRole('combobox', { name: 'Moment', exact: true });
  await expect(moments.locator('option')).toHaveCount(75);
  await expect(moments).toContainText('HB1001');
  await page.getByRole('button', { name: 'Luk dialog' }).click();
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  expect(source.workspace.teams[0]!.rulesetBinding).toEqual(reg('U11'));
  expect(source.failures).toEqual([]);
});

test('REG-bane viser facit for D og C og intet rækkefølgekrav', async ({ page }) => {
  const source = await openWorkspace(page, regWorkspace(reg('junior'), 'tumbling', [
    series('rf-lukket', RONDAT, FLIK, element('salto', 'backward', { bodyPositions: ['tuck'] })),
    series('kraft-lukket', element('handspring', 'forward', { takeoff: 'one-foot' }), element('salto', 'forward', { bodyPositions: ['tuck'] })),
    series('rf-strakt-360', RONDAT, FLIK, element('salto', 'backward', { twistsHalfTurns: 2, twistDistribution: [2] })),
  ]));
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  const strip = page.locator('.analysis-strip');
  await expect(strip).toContainText('Planlagt D · disciplin3,400');
  await expect(strip).toContainText('Planlagt C · disciplin2,200');
  await expect(page.getByText('D-grundlag og rækkefølge')).toHaveCount(0);
  await expect(page.getByText('Vis sorteringsforslag')).toHaveCount(0);
  expect(source.failures).toEqual([]);
});

test('REG-trampet viser facit for D og C for U14', async ({ page }) => {
  const source = await openWorkspace(page, regWorkspace(reg('U14'), 'trampet', [
    jump('fri-lukket', element('salto', 'forward', { bodyPositions: ['tuck'], apparatus: 'trampet' })),
    jump('overslag', element('handspring-vault', 'forward', { apparatus: 'pegasus' })),
    jump('fri-strakt-360', element('salto', 'forward', { apparatus: 'trampet', twistsHalfTurns: 2, twistDistribution: [2] })),
  ]));
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  await page.getByRole('button', { name: 'Trampet', exact: true }).click();
  const strip = page.locator('.analysis-strip');
  await expect(strip).toContainText('Planlagt D · disciplin2,000');
  await expect(strip).toContainText('Planlagt C · disciplin2,200');
  expect(source.failures).toEqual([]);
});

test('DK-hold skiftes til Regionsrækken via før og efter', async ({ page }) => {
  const source = await openWorkspace(page, syntheticWorkspace().workspace);
  await page.getByRole('link', { name: 'Reglement', exact: true }).click();
  await page.getByRole('combobox', { name: 'Installeret regelpakke' }).selectOption('reg@1.0.0');
  await page.getByRole('combobox', { name: 'Holdprofil' }).selectOption('junior:girls');
  await page.getByRole('button', { name: 'Vis før og efter', exact: true }).click();
  const preview = page.getByRole('dialog', { name: 'Før og efter regelskift' });
  await expect(preview).toBeVisible();
  await preview.getByRole('button', { name: 'Opdater', exact: true }).click();
  await expect(page.locator('.rail-context')).toContainText('reg 1.0.0');
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  expect(source.workspace.teams[0]!.rulesetBinding).toEqual(reg('junior'));
  expect(source.failures).toEqual([]);
});
