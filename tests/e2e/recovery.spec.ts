import { expect, test } from '@playwright/test';
import { createTeam } from '@teamgym/domain';
import { binding } from '../fixtures/synthetic-workspace';
import { fourOfSix, openWorkspace } from './drive-fixture';

async function rename(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Redigér hold Syntetisk hold A' }).click();
  await page.getByLabel('Holdnavn').fill('Lokal kladde A');
  await page.getByRole('button', { name: 'Anvend i kladde' }).click();
}
test('konflikt bevarer eksportérbar kladde og kræver bevidst genindlæsning', async ({ page }) => {
  const source = await openWorkspace(page);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await rename(page);
  source.external(createTeam(source.workspace, 'Ekstern ændring', binding));
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: /Konflikt · kladde bevaret/ })).toBeVisible();
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
  await page.getByRole('button', { name: 'Anvend samlet i kladde' }).click();
  await expect(page.getByText('Junior mix · dk 1.0.0', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  expect(source.workspace.teams[0]!.rulesetBinding.teamType).toBe('mix');
  expect(source.workspace.teams[1]!.rulesetBinding.rulesetId).toBe('test-only');
  expect(source.failures).toEqual([]);
});

test('konkret potentiale 4/6 til 6/6 forhåndsvises uden automatisk anvendelse', async ({ page }) => {
  const source = await openWorkspace(page, fourOfSix());
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Springplan' }).click();
  await expect(page.getByText('Valgt 0,400 · dokumenteret 0,600 · regelmaksimum 0,600')).toBeVisible();
  await page.getByRole('button', { name: 'Se konkrete ændringer' }).first().click();
  await expect(page.getByRole('heading', { name: 'Skruetillæg', exact: true })).toBeVisible();
  await page.screenshot({ path: 'tmp/ui-qa/potentiale.png' });
  await page.getByRole('button', { name: 'Annuller', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Uændret', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Se konkrete ændringer' }).first().click();
  await page.getByRole('button', { name: 'Anvend opstillingen i kladde' }).click();
  await expect(page.getByRole('button', { name: /Lokale ændringer/ })).toBeVisible();
  await expect(page.getByText('Valgt 0,600 · dokumenteret 0,600 · regelmaksimum 0,600')).toBeVisible();
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
      const move = page.getByRole('button', {
        name: `Flyt Syntetisk gymnast 3 op i ${round}. omgang`,
        exact: true,
      });
      await move.press('Enter');
      await expect(move).toBeFocused();
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
