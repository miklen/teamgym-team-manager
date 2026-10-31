import AxeBuilder from '@axe-core/playwright';
import { registerAthleteSkill, setRoundEntries, updateAssessment } from '@teamgym/domain';
import type { ElementExecution, SkillDefinition } from '@teamgym/domain';
import type { Page } from '@playwright/test';
import { limits, syntheticWorkspace } from '../fixtures/synthetic-workspace';
import { openWorkspace } from './drive-fixture';
import { expect, test } from './test';

/** Syntetiske trampetspring med faste facit fra A4-tabellen: fri række 8 = 0,60, fri række 10 = 0,80. */
const straight = (twists: number): ElementExecution => ({
  family: 'salto', direction: 'forward', rotationQuarterTurns: 4, bodyPositions: ['straight'], twistsHalfTurns: twists,
  twistDistribution: [twists], apparatus: 'trampet', takeoff: 'two-feet', landing: 'feet', variant: {},
});
const jump060: SkillDefinition = { id: 'synthetic-jump-060', name: 'Syntetisk strakt 540', archived: false, discipline: 'trampet', jump: straight(3) };
const jump080: SkillDefinition = { id: 'synthetic-jump-080', name: 'Syntetisk strakt 900', archived: false, discipline: 'trampet', jump: straight(5) };

/** Trampet 2. omgang: fem × 0,60 (ufuldstændig uden sjette plads) (Syntetisk gymnast 3–7). Strakt 900 findes i kartoteket, men ingen kan det. */
function ambitionWorkspace() {
  const fixture = syntheticWorkspace();
  let workspace = fixture.workspace;
  const environment = fixture.environment;
  const plan = workspace.plans[0]!, scenario = plan.trampet[0]!;
  const entries = workspace.athletes.slice(2, 7).map((athlete) => {
    const added = registerAthleteSkill(workspace, athlete.id, jump060, environment);
    workspace = updateAssessment(added.workspace, added.athleteSkillId, { stability: 5, assessedAt: '2026-10-25', note: 'Syntetisk' }, environment);
    return { id: environment.id(), athleteId: athlete.id, athleteSkillId: added.athleteSkillId, role: 'counting' as const };
  });
  workspace = setRoundEntries(workspace, plan.id, 'trampet', scenario.id, scenario.rounds[1]!.id, entries, limits, environment);
  workspace = { ...workspace, skills: [...workspace.skills, jump080] };
  return workspace;
}

async function trampet(page: Page) {
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  await page.getByRole('button', { name: 'Trampet', exact: true }).click();
}
const round = (page: Page, number: number) => page.getByRole('region', { name: `${number}. omgang`, exact: true });
const shot = (page: Page, name: string) => page.screenshot({ path: `tmp/ui-qa/ambition-${name}.png`, animations: 'disabled' });
const noOverflow = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

async function createAmbition(page: Page) {
  const second = round(page, 2);
  await second.getByRole('button', { name: '+ Tilføj plads', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('radio', { name: 'Ingen gymnast endnu' }).check();
  await expect(dialog.getByRole('radio', { name: 'Ingen gymnast endnu' })).toBeFocused();
  await dialog.getByRole('button', { name: 'Spring', exact: true }).click();
  await dialog.getByRole('combobox', { name: 'Søg i springkataloget' }).fill('strakt salto 900');
  await expect(dialog.getByRole('option', { name: /D 0,800, ingen gymnast/ }).first()).toBeVisible();
  return dialog;
}

for (const width of [1440, 390]) {
  test(`ambition: opret, se D, registrér, se kan nu stige og besæt ved ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const source = await openWorkspace(page, ambitionWorkspace());
    await trampet(page);
    if (width < 800) await page.getByRole('button', { name: '2. Omgang', exact: true }).click();
    const second = round(page, 2);
    await expect(second.locator('.round-totals')).toContainText('Ufuldstændig');

    const dialog = await createAmbition(page);
    await shot(page, `katalog-${width}`);
    expect(await noOverflow(page)).toBe(true);
    await dialog.getByRole('option', { name: /D 0,800, ingen gymnast/ }).first().click();
    await dialog.getByRole('button', { name: 'Opdater', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    const slot = second.getByRole('button', { name: /^Ambition: .*, mangler gymnast, ingen gymnaster kan endnu$/ });
    await expect(slot).toBeVisible();
    const row = second.locator('li.ambition-entry');
    await expect(row).toContainText('Mangler gymnast');
    await expect(row).toContainText('Ingen kan endnu');
    await expect(row.getByRole('button', { name: /Modtagning/ })).toHaveCount(0);
    await expect(second.locator('.round-totals')).toContainText('3,800');
    await expect(second.locator('.round-totals')).toContainText('1 mangler gymnast');
    await shot(page, `plads-${width}`);
    expect(await noOverflow(page)).toBe(true);
    const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(accessibility.violations).toEqual([]);

    // Registrér springet på Syntetisk gymnast 8 via færdighedsgenvejen i besættelsesvisningen.
    await row.getByRole('button', { name: /^Besæt ambitionen/ }).click();
    const fill = page.getByRole('dialog', { name: 'Besæt ambition' });
    await expect(fill.getByRole('radio', { name: /Behold som ambition/ })).toBeChecked();
    await expect(fill).toContainText('Ingen på holdet kan springet endnu.');
    await expect(fill.getByRole('button', { name: 'Åbn gymnastens færdigheder: Syntetisk gymnast 3 · Test 3' })).toHaveCount(0);
    await shot(page, `besaet-tom-${width}`);
    expect(await fill.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await fill.getByRole('button', { name: 'Åbn gymnastens færdigheder: Syntetisk gymnast 8 · Test 8' }).click();
    await page.getByRole('button', { name: 'Tilføj færdighed', exact: true }).click();
    await page.getByRole('combobox', { name: 'Disciplin', exact: true }).selectOption('trampet');
    await page.getByLabel('Søg sammensat spring eller alias').fill('strakt salto 900');
    await page.getByRole('checkbox', { name: /^Syntetisk strakt 900/ }).check();
    await page.getByLabel('Sikkerhed for Syntetisk strakt 900', { exact: true }).selectOption('4');
    await page.getByLabel('Medtag fundament automatisk').uncheck();
    await page.getByRole('button', { name: 'Registrér 1 spring', exact: true }).click();
    await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(second.getByRole('button', { name: /^Ambition: .*, mangler gymnast, 1 gymnast kan nu$/ })).toBeVisible();
    await expect(row).toContainText('1 kan nu');

    await row.getByRole('button', { name: /^Besæt ambitionen/ }).click();
    const candidate = fill.getByRole('radio', { name: /Syntetisk gymnast 8/ });
    await expect(candidate).toBeEnabled();
    await expect(fill.getByRole('radio', { name: /Syntetisk gymnast 3/ })).toBeDisabled();
    await shot(page, `besaet-${width}`);
    await fill.locator('label.candidate-row', { hasText: 'Syntetisk gymnast 8' }).click();
    await expect(candidate).toBeChecked();
    await fill.getByRole('button', { name: 'Opdater', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(second.locator('li.ambition-entry')).toHaveCount(0);
    await expect(second.getByRole('button', { name: /Syntetisk gymnast 8/ }).first()).toBeFocused();
    await expect(second.locator('.round-totals')).toContainText('3,800');
    await expect(second.locator('.round-totals')).not.toContainText('mangler gymnast');

    await page.getByRole('button', { name: /Lokale ændringer/ }).click();
    await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
    const saved = source.workspace.plans[0]!.trampet[0]!.rounds[1]!.entries;
    expect(saved).toHaveLength(6);
    expect(saved.every((entry) => entry.athleteId !== null && entry.plannedSkillId === null)).toBe(true);
  });
}

test('ambition overlever duplikering og kan fjernes', async ({ page }) => {
  await openWorkspace(page, ambitionWorkspace());
  await trampet(page);
  const dialog = await createAmbition(page);
  await dialog.getByRole('option', { name: /D 0,800, ingen gymnast/ }).first().click();
  await dialog.getByRole('button', { name: 'Opdater', exact: true }).click();
  const second = round(page, 2);
  await expect(second.locator('li.ambition-entry')).toHaveCount(1);

  await page.getByRole('button', { name: /^Menu for / }).click();
  await page.getByRole('menuitem', { name: 'Duplikér' }).click();
  await page.getByLabel('Navn på kopi').fill('Plan B');
  await page.getByLabel('Navn på kopi').press('Enter');
  await expect(page.getByRole('tab', { name: 'Plan B' })).toHaveAttribute('aria-selected', 'true');
  await expect(round(page, 2).locator('li.ambition-entry')).toHaveCount(1);

  await round(page, 2).getByRole('button', { name: /^Handlinger for ambitionen/ }).click();
  await round(page, 2).getByRole('menuitem', { name: /^Fjern ambitionen/ }).click();
  await expect(round(page, 2).locator('li.ambition-entry')).toHaveCount(0);
  await expect(round(page, 2).locator('.round-totals')).toContainText('Ufuldstændig');
});
