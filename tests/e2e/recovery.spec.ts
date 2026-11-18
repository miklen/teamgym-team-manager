import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './test';
import { createTeam } from '@teamgym/domain';
import { binding } from '../fixtures/synthetic-workspace';
import { fourOfSix, openWorkspace } from './drive-fixture';

async function rename(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Redigér hold Syntetisk hold A' }).click();
  await page.getByLabel('Holdnavn').fill('Lokal kladde A');
  await page.getByRole('button', { name: 'Opdater' }).click();
}
test('konflikt bevarer eksportérbar kladde og kræver bevidst genindlæsning', async ({ page }) => {
  const source = await openWorkspace(page);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await rename(page);
  source.external(createTeam(source.workspace, 'Ekstern ændring', binding));
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: /Nyere fil · kladde bevaret/ })).toBeVisible();
  expect(source.workspace.teams[0]!.name).toBe('Syntetisk hold A');
  expect(source.puts).toBe(0);
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Eksportér lokal kladde' }).click();
  expect((await download).suggestedFilename()).toBe('teamgym-kladde.json');
  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByRole('button', { name: 'Indlæs nyeste fil' }).click();
  await expect(page.getByRole('button', { name: /^Ekstern ændring/ })).toBeVisible();
  expect(source.failures).toEqual([]);
});

test('mistet uploadsvar genkendes i browseren med én upload', async ({ page }) => {
  const source = await openWorkspace(page);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await rename(page);
  source.dropResponse();
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Fejl · kladde bevaret' })).toBeVisible();
  await page.getByRole('button', { name: 'Fejl · kladde bevaret' }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  expect(source.puts).toBe(1);
  expect(source.workspace.teams[0]!.name).toBe('Lokal kladde A');
  expect(source.failures).toEqual([]);
});

test('regelskift kan annulleres og anvendes for kun ét hold', async ({ page }) => {
  const source = await openWorkspace(page);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Reglement', exact: true }).click();
  await page.getByRole('combobox', { name: 'Holdprofil', exact: true }).selectOption('junior:mix');
  await page.getByRole('button', { name: 'Vis før og efter' }).click();
  await expect(page.getByRole('heading', { name: 'Før og efter regelskift' })).toBeVisible();
  await page.screenshot({ path: 'tmp/ui-qa/regelskift.png' });
  await page.getByRole('button', { name: 'Annuller', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Uændret', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Vis før og efter' }).click();
  await page.getByRole('button', { name: 'Opdater' }).click();
  await expect(page.locator('.rail-context')).toContainText('Junior mix');
  await expect(page.locator('.rail-context')).toContainText('dk 1.1.0');
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  expect(source.workspace.teams[0]!.rulesetBinding.teamType).toBe('mix');
  expect(source.workspace.teams[1]!.rulesetBinding.rulesetId).toBe('test-only');
  expect(source.failures).toEqual([]);
});

for (const width of [1440, 390]) test(`konkret potentiale skelner springbytter og flytninger ved ${width}px`, async ({ page }, testInfo) => {
  await page.setViewportSize({ width, height: 900 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const workspace = fourOfSix();
  const reserve = workspace.athletes[6]!;
  const registration = workspace.athleteSkills.find((item) => item.athleteId === reserve.id && item.skillId === 'skill-tumbling')!;
  workspace.plans[0]!.tumbling[0]!.rounds[0].reserves = [{ id: 'proposal-reserve', athleteId: reserve.id, athleteSkillId: registration.id }];
  const source = await openWorkspace(page, workspace);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Springplan' }).click();
  const guide = page.getByRole('region', { name: 'Guide til springplanens komposition' });
  await expect(guide.locator('.composition-guide-overview')).toContainText('Tillæg');
  await guide.locator('.composition-guide-overview').click();
  const screw = guide.locator('.composition-guide-row').filter({ has: page.getByText('Skrue', { exact: true }) });
  await expect(screw.locator(':scope > summary')).toContainText('+0,200 med ændringer');
  const opportunity = page.getByRole('button', { name: 'Skrue +0,200 mere' }).first();
  await opportunity.click();
  const detail = page.getByRole('region', { name: 'Skrue +0,200 mere' });
  await expect(detail).toContainText('Ekstra tillæg');
  await detail.getByRole('button', { name: 'Se konkrete ændringer' }).click();
  const dialog = page.getByRole('dialog', { name: 'Skruetillæg' });
  await expect(dialog).toBeVisible();
  await expect(dialog.locator('.proposal-outcome')).toContainText('+0,465');
  await expect(dialog.locator('.proposal-outcome')).toContainText('Højere karakterloft');
  const score = dialog.getByRole('table', { name: 'Point før og med forslaget' });
  await expect(score.getByRole('row').filter({ hasText: 'Tillæg' }).getByRole('cell')).toHaveText(['+0,400', '+0,600']);
  await expect(score.getByRole('row').filter({ hasText: 'C + D' }).getByRole('cell')).toHaveText(['2,400', '2,865']);
  await expect(score.getByRole('row').filter({ hasText: 'Karakterloft' }).getByRole('cell')).toHaveText(['12,400', '12,865']);
  const change = dialog.locator('.proposal-spring-comparison').first();
  await expect(change.getByText('Før', { exact: true })).toBeVisible();
  await expect(change.getByText('Forslag', { exact: true })).toBeVisible();
  const springNames = await change.locator('.proposal-spring-name strong').allTextContents();
  expect(new Set(springNames).size).toBe(2);
  await expect(dialog.locator('.proposal-change').filter({ hasText: reserve.name })).toContainText('Fra reserve');
  const moves = dialog.locator('.proposal-moves').first();
  await expect(moves).not.toHaveAttribute('open', '');
  await moves.locator('summary').press('Enter');
  await expect(moves.locator('.proposal-place-shift').first()).toBeVisible();
  await expect(moves.locator('.proposal-spring')).toHaveCount(0);
  expect(await dialog.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  expect(await dialog.locator('.proposal-view').evaluate((node) => getComputedStyle(node).animationDuration)).toBe('0s');
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
  await moves.locator('summary').press('Enter');
  await dialog.evaluate((node) => { node.scrollTop = 0; });
  await dialog.screenshot({ path: testInfo.outputPath(`forslag-aendringer-${width}.png`), animations: 'disabled' });
  await dialog.getByRole('button', { name: 'Hele opstillingen' }).press('Enter');
  await expect(dialog.getByRole('button', { name: 'Hele opstillingen' })).toHaveAttribute('aria-pressed', 'true');
  const lineup = dialog.getByRole('list', { name: /omgang med forslaget/i });
  await expect(lineup.getByRole('listitem')).toHaveCount(6);
  await expect(lineup.locator('.proposal-spring-comparison')).toHaveCount(0);
  await dialog.getByRole('button', { name: /^Holdomgang/ }).click();
  await expect(dialog.getByRole('list', { name: '1. Holdomgang med forslaget' }).getByRole('listitem')).toHaveCount(6);
  await dialog.screenshot({ path: testInfo.outputPath(`forslag-opstilling-${width}.png`), animations: 'disabled' });
  await dialog.getByRole('button', { name: 'Annuller', exact: true }).click();
  await expect(detail.getByRole('button', { name: 'Se konkrete ændringer' })).toBeFocused();
  await expect(page.getByRole('heading', { name: 'Holdets dokumenterede muligheder' })).toHaveCount(0);
  await screw.locator(':scope > summary').click();
  await expect(screw.locator('.guide-potential dl')).toContainText('I planen+0,400Med forslaget+0,600');
  await screw.getByRole('button', { name: 'Se konkrete ændringer' }).click();
  await expect(page.getByRole('heading', { name: 'Skruetillæg', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Annuller', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Uændret', exact: true })).toBeVisible();
  await screw.getByRole('button', { name: 'Se konkrete ændringer' }).click();
  await dialog.getByRole('button', { name: 'Anvend hele forslaget' }).click();
  await expect(page.getByRole('button', { name: /Lokale ændringer/ })).toBeVisible();
  await expect(screw.locator(':scope > summary')).toContainText('+0,600 i planen');
  await expect(screw).toContainText('Planen får det fulde tillæg.');
  await expect(screw.getByRole('button', { name: 'Se konkrete ændringer' })).toHaveCount(0);
  expect(source.puts).toBe(0);
  expect(source.failures).toEqual([]);
});

test('alle seks omgange kan betjenes med tastatur på tablet', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  const source = await openWorkspace(page);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Springplan' }).press('Enter');
  for (const discipline of ['Bane', 'Trampet']) {
    await page.getByRole('button', { name: discipline, exact: true }).press('Enter');
    for (let round = 1; round <= 3; round++) {
      await page
        .getByRole('button', { name: `${round}. ${round === 1 ? 'Holdomgang' : 'Omgang'}`, exact: true })
        .press('Enter');
      const menu = page.getByRole('button', { name: `Handlinger for Syntetisk gymnast 3 i ${round}. omgang`, exact: true });
      await menu.press('Enter');
      const move = page.getByRole('menuitem', {
        name: `Flyt Syntetisk gymnast 3 op i ${round}. omgang`,
        exact: true,
      });
      await expect(page.getByRole('menuitem').first()).toBeFocused();
      await move.press('Enter');
      await expect(menu).toBeFocused();
    }
  }
  expect(source.failures).toEqual([]);
});

test('reduceret bevægelse, stor tekst og fokusretur', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.setViewportSize({ width: 768, height: 1024 });
  const source = await openWorkspace(page);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  const edit = page.getByRole('button', { name: 'Redigér hold Syntetisk hold A' });
  await edit.click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(edit).toBeFocused();
  await page.evaluate(() => {
    document.documentElement.style.fontSize = '200%';
  });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: 'tmp/ui-qa/stor-tekst.png', fullPage: true });
  expect(source.failures).toEqual([]);
});
