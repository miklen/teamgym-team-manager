import AxeBuilder from '@axe-core/playwright';
import { addAmbition, registerAthleteSkill, setPlannedSpot, setRoundReserves } from '@teamgym/domain';
import { limits, syntheticWorkspace, trampetSkill } from '../fixtures/synthetic-workspace';
import { openWorkspace } from './drive-fixture';
import { chooseAthlete, expect, test } from './test';
import type { Page } from '@playwright/test';

const vault = { ...trampetSkill, id: 'test-vault', name: 'Syntetisk mølleoverslag', jump: { ...trampetSkill.jump, apparatus: 'pegasus' as const,
  family: 'cartwheel-vault', direction: 'forward' as const, twistsHalfTurns: 0, twistDistribution: [] } };
const harder = { ...trampetSkill, id: 'test-harder', name: 'Syntetisk strakt 900', jump: { ...trampetSkill.jump, direction: 'forward' as const, twistsHalfTurns: 5, twistDistribution: [5] } };
const double = { ...trampetSkill, id: 'test-double', name: 'Syntetisk dobbelt lukket',
  jump: { ...trampetSkill.jump, direction: 'forward' as const, rotationQuarterTurns: 8,
    bodyPositions: ['tuck', 'tuck'] as ('tuck')[], twistsHalfTurns: 0, twistDistribution: [] } };
const region = (page: Page, number: number) => page.getByRole('region', { name: `${number}. omgang`, exact: true });
const newSlot = (page: Page) => page.getByRole('dialog', { name: 'Tilføj omgangsplads' });

function roundFixture() {
  const fixture = syntheticWorkspace();
  const definition = fixture.workspace.skills.find((item) => item.id === trampetSkill.id);
  if (definition?.discipline !== 'trampet') throw new Error('Mangler syntetisk trampetspring');
  definition.jump.direction = 'forward';
  return { ...fixture, definition };
}

async function openTrampet(page: Page) {
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  await page.getByRole('button', { name: 'Trampet', exact: true }).click();
}

for (const width of [1440, 390]) {
  test(`stedfæster flere fund og opdaterer rækkefølge straks ved ${width}px`, async ({ page }, testInfo) => {
    const fixture = roundFixture();
    const known = registerAthleteSkill(fixture.workspace, fixture.athleteA.id, harder, fixture.environment);
    known.workspace.plans[0]!.trampet[0]!.rounds[1].entries[0]!.athleteSkillId = known.athleteSkillId;
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const source = await openWorkspace(page, known.workspace);
    await openTrampet(page);
    if (width === 390) await page.getByRole('button', { name: '2. Omgang', exact: true }).click();
    const round = region(page, 2);
    const row = round.locator('.round-entries > li').nth(1);
    const repeat = row.locator('[data-finding="C-GENTAG"]');
    const order = row.locator('[data-finding="C-ORDEN-2"]');
    await expect(repeat).toHaveAccessibleName('Gentagelse Fradrag');
    await expect(order).toHaveAccessibleName('Rækkefølge Fradrag');
    await repeat.focus();
    await page.keyboard.press('Enter');
    await expect(repeat).toHaveAttribute('aria-expanded', 'true');
    await page.keyboard.press('Tab');
    await expect(order).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(order).toHaveAttribute('aria-expanded', 'true');
    await expect(repeat).toHaveAttribute('aria-expanded', 'false');
    const detail = row.getByRole('region', { name: 'Rækkefølge Fradrag' });
    await expect(detail).toContainText('Samlet C-fradrag');
    await page.keyboard.press('Tab');
    await expect(detail.getByRole('link', { name: /10\.2\.2\.2/ })).toBeFocused();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(await round.locator('.round-entries > li').first().evaluate((node) => getComputedStyle(node).animationDuration)).toBe('0s');
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
    await row.screenshot({ path: testInfo.outputPath(`stedfaestede-fund-${width}.png`), animations: 'disabled' });
    await detail.getByRole('button', { name: 'Se foreslået rækkefølge' }).click();
    await page.getByRole('button', { name: 'Anvend rækkefølgen' }).click();
    await expect(round.locator('[data-finding="C-ORDEN-2"]')).toHaveCount(0);
    await expect(round.locator('[data-finding="C-GENTAG"]').first()).toBeVisible();
    const last = round.locator('.round-entries > li').last();
    await expect(last.locator('[data-finding="C-GENTAG"]')).toHaveCount(0);
    await last.locator('.entry-name').click();
    const edit = page.getByRole('dialog', { name: 'Redigér omgangsplads' });
    await edit.getByRole('button', { name: 'Spring', exact: true }).click();
    await edit.getByRole('listbox').getByRole('option', { name: /^Syntetisk trampetspring/ }).click();
    await edit.getByRole('button', { name: 'Opdater', exact: true }).click();
    await expect(last.locator('[data-finding="C-GENTAG"]')).toBeVisible();
    expect(source.puts).toBe(0);
    expect(source.failures).toEqual([]);
  });
}

for (const width of [1440, 390]) {
  test(`én dobbeltsalto vises som tillæg i planen uden et urealistisk forslag ved ${width}px`, async ({ page }, testInfo) => {
    const fixture = roundFixture();
    const known = registerAthleteSkill(fixture.workspace, fixture.workspace.athletes[5]!.id, double, fixture.environment);
    known.workspace.plans[0]!.trampet[0]!.rounds[1].entries[5]!.athleteSkillId = known.athleteSkillId;
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const source = await openWorkspace(page, known.workspace);
    await openTrampet(page);
    const guide = page.getByRole('region', { name: 'Guide til springplanens komposition' });
    await guide.locator('.composition-guide-overview').click();
    const bonus = guide.locator('[data-guide-rule="T-DOBBELT-FRI"]');
    const summary = bonus.locator(':scope > summary');
    await expect(summary).toContainText('Dobbeltsalto uden Pegasus');
    await expect(summary).toContainText('1 tællende gymnast · 2. omgang');
    await expect(summary).toContainText('+0,100 i planen');
    await summary.focus();
    await page.keyboard.press('Enter');
    await expect(bonus).toContainText('Hver tællende gymnast med dobbeltsalto uden Pegasus giver 0,10 point.');
    await expect(bonus).toContainText('Søgningen fandt ingen opstilling med et højere tillæg');
    await expect(bonus.getByRole('button', { name: 'Se konkrete ændringer' })).toHaveCount(0);
    await expect(page.locator('[data-finding="T-DOBBELT-FRI"]')).toHaveCount(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
    await bonus.screenshot({ path: testInfo.outputPath(`dobbeltsalto-i-planen-${width}.png`), animations: 'disabled' });
    expect(source.puts).toBe(0);
    expect(source.failures).toEqual([]);
  });
}

test('springvælger, ambition og reserve bruger den aktuelle redskabstype', async ({ page }) => {
  const fixture = roundFixture();
  const athlete = fixture.workspace.athletes[6]!;
  const vaultRegistration = registerAthleteSkill(fixture.workspace, athlete.id, vault, fixture.environment);
  const freeAthlete = fixture.workspace.athletes[7]!;
  const otherVault = registerAthleteSkill(vaultRegistration.workspace, freeAthlete.id, vault, fixture.environment);
  const plan = otherVault.workspace.plans[0]!;
  const scenario = plan.trampet[0]!;
  const round = scenario.rounds[0];
  const source = await openWorkspace(page, setRoundReserves(otherVault.workspace, plan.id, 'trampet', scenario.id, round.id,
    [{ id: 'test-reserve', athleteId: athlete.id, athleteSkillId: vaultRegistration.athleteSkillId }], fixture.environment));
  await openTrampet(page);
  const first = region(page, 1);
  await first.getByRole('button', { name: '+ Tilføj plads', exact: true }).click();
  const dialog = newSlot(page);
  await expect(dialog.getByText(/Omgangen er uden Pegasus/)).toBeVisible();
  await dialog.getByRole('button', { name: 'Spring', exact: true }).click();
  const search = dialog.getByRole('combobox', { name: 'Søg i holdets spring' });
  await search.fill('mølleoverslag');
  await expect(dialog.getByRole('listbox').getByRole('option')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await chooseAthlete(dialog, freeAthlete.name);
  await dialog.getByRole('button', { name: 'Spring', exact: true }).click();
  const options = dialog.getByRole('listbox').getByRole('option');
  await expect(options.filter({ hasText: /Mølleoverslag/ })).toHaveCount(0);
  await expect(options).toHaveCount(2);
  await options.nth(1).click();
  await dialog.getByRole('button', { name: 'Opdater', exact: true }).click();
  await expect(first.locator('.round-entries > li').last()).toContainText(freeAthlete.name);
  await first.getByRole('button', { name: '+ Tilføj plads', exact: true }).click();
  await dialog.getByRole('radio', { name: 'Ingen gymnast endnu' }).check();
  await expect(dialog.getByText(/Omgangen er uden Pegasus/)).toBeVisible();
  await dialog.getByRole('searchbox').fill('mølleoverslag');
  await expect(dialog.locator('.ambition-picker-row')).toHaveCount(0);
  await dialog.getByRole('searchbox').fill('strakt salto');
  await dialog.locator('.ambition-picker-row').first().click();
  await dialog.getByRole('button', { name: 'Opdater', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await expect(first.locator('.round-entries > li.ambition-entry')).toHaveCount(1);

  await first.getByRole('button', { name: 'Sæt ind', exact: true }).click();
  const insert = page.getByRole('dialog', { name: 'Sæt reserve ind' });
  await insert.getByLabel('Gymnast der udgår').selectOption({ index: 1 });
  await expect(insert.getByRole('alert')).toContainText('Skift redskab');
  await expect(insert.getByRole('option', { name: 'Reservens spring er utilgængeligt' })).toHaveAttribute('disabled', '');
  await expect(insert.getByLabel('Spring ved indsættelse').locator('option')).toHaveCount(3);
  await insert.getByLabel('Spring ved indsættelse').selectOption('');
  await insert.getByRole('button', { name: 'Bekræft indsættelse' }).click();
  await expect(first.locator('.round-entries > li').first()).toContainText(athlete.name);
  await expect(first.locator('.round-entries > li').first()).toContainText('Vælg registreret færdighed');
  expect(source.puts).toBe(0);
  expect(source.failures).toEqual([]);
});

for (const width of [1440, 390]) {
  test(`redskabsskift kan annulleres, afviser forældet basis og viser konsekvenser ved ${width}px`, async ({ page }, testInfo) => {
    const fixture = roundFixture();
    const known = registerAthleteSkill(fixture.workspace, fixture.athleteA.id, vault, fixture.environment);
    const plan = known.workspace.plans[0]!;
    const scenario = plan.trampet[0]!;
    const round = scenario.rounds[0];
    round.entries.splice(1);
    const withSpot = setPlannedSpot(known.workspace, plan.id, 'trampet', scenario.id, round.id, round.entries[0]!.id, { grade: 'support' }, fixture.environment);
    const setup = addAmbition(withSpot, plan.id, 'trampet', scenario.id, round.id, fixture.definition, 1, limits, fixture.environment);
    await page.setViewportSize({ width, height: 900 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const source = await openWorkspace(page, setup.workspace);
    await openTrampet(page);
    const first = region(page, 1);
    const trigger = first.getByRole('button', { name: 'Skift redskab', exact: true });
    const dialog = page.getByRole('dialog', { name: 'Skift redskab' });
    const confirm = dialog.getByRole('button', { name: 'Bekræft redskabsskift' });
    const select = async () => {
      await dialog.getByLabel('Nyt spring på plads 1', { exact: true }).selectOption(known.athleteSkillId);
      await expect(confirm).toBeDisabled();
      await dialog.getByLabel('Nyt spring på plads 2', { exact: true }).selectOption('remove');
      await expect(confirm).toBeEnabled();
    };
    await trigger.click();
    await select();
    await expect(dialog.getByText(/Modtagning bortfalder/)).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Før', exact: true })).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Efter', exact: true })).toBeVisible();
    await expect(dialog.locator('.apparatus-comparison')).toContainText('manglende eller uafklarede pladser');
    expect(await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
    await dialog.screenshot({ path: testInfo.outputPath(`redskabsskift-${width}.png`), animations: 'disabled' });
    await dialog.getByRole('button', { name: 'Annuller' }).click();
    await expect(trigger).toBeFocused();
    await expect(first.locator('.round-entries > li')).toHaveCount(2);
    await expect(first.locator('.spot-trigger').first()).toContainText('Let');

    await trigger.click();
    await select();
    // Modellerer en lokal opdatering, mens dialogen beholder sit oprindelige grundlag.
    await page.locator('.round-entries .entry-menu-trigger').last().evaluate((node) => (node as HTMLButtonElement).click());
    await page.locator('.round-entries [role="menuitem"][aria-label^="Fjern"]').last().evaluate((node) => (node as HTMLButtonElement).click());
    await expect(dialog.getByRole('alert')).toContainText('Data er ændret');
    await expect(confirm).toBeDisabled();
    await page.keyboard.press('Escape');
    await trigger.click();
    await select();
    await confirm.click();
    await expect(dialog).toHaveCount(0);
    await expect(first.locator('.round-apparatus')).toContainText('Med Pegasus');
    await expect(first.locator('.round-entries > li')).toHaveCount(1);
    await expect(first.getByRole('button', { name: /Planlæg modtagning/ })).toBeVisible();
    expect(source.puts).toBe(0);
    expect(source.failures).toEqual([]);
  });
}
