import { expect, test } from './test';
import AxeBuilder from '@axe-core/playwright';
import { deleteScenario, renameTeam, updateAssessment } from '@teamgym/domain';
import { openWorkspace } from './drive-fixture';
import { syntheticWorkspace } from '../fixtures/synthetic-workspace';
import { largeMergeWorkspace } from '../fixtures/large-merge-workspace';
import { scenarioWorkspace } from '../fixtures/scenario-workspace';
import { mkdirSync, writeFileSync } from 'node:fs';

async function localRename(page: import('@playwright/test').Page, name = 'Lokalt navn') {
  await page.getByRole('button', { name: 'Redigér hold Syntetisk hold A' }).click();
  await page.getByLabel('Holdnavn').fill(name);
  await page.getByRole('button', { name: 'Opdater', exact: true }).click();
}

test('forenelig nyere fil gennemgås og anvendes uden upload, derefter separat gemning', async ({ page }) => {
  const source = await openWorkspace(page);
  await localRename(page);
  source.external(renameTeam(source.workspace, source.workspace.teams[1]!.id, 'Andet hold i filen'));
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: /Nyere fil · kladde bevaret/ })).toBeVisible();
  await page.getByRole('button', { name: 'Gennemgå ændringer', exact: true }).click();
  await expect(page.getByText('Disse ændringer passer sammen.')).toBeVisible();
  await expect(page.getByRole('dialog')).toContainText('Andet hold i filen');
  expect(source.puts).toBe(0);
  await page.getByRole('button', { name: 'Brug disse ændringer' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(source.puts).toBe(0);
  await expect(page.getByRole('button', { name: /^Lokalt navn/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Andet hold i filen/ })).toBeVisible();
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  expect(source.puts).toBe(1);
  await page.reload();
  await expect(page.getByRole('button', { name: /^Lokalt navn/ })).toBeVisible();
  expect(source.failures).toEqual([]);
});

test('uafgjorte konflikter, ændrede valg og filtre bevarer valg; annullering bevarer kladden', async ({
  page,
}) => {
  const source = await openWorkspace(page);
  await localRename(page);
  source.external(renameTeam(source.workspace, source.workspace.teams[0]!.id, 'Filens navn'));
  await page.getByRole('button', { name: 'Gennemgå ændringer', exact: true }).click();
  const apply = page.getByRole('button', { name: 'Brug disse ændringer' });
  await expect(apply).toBeDisabled();
  await page.getByRole('button', { name: 'Find uafgjorte konflikter' }).click();
  const local = page.getByRole('radio', { name: 'Min udgave', exact: true });
  await expect(local).toBeFocused();
  await local.check();
  await page.getByRole('combobox', { name: 'Vis', exact: true }).selectOption('all');
  await expect(local).toBeChecked();
  await page.getByRole('radio', { name: 'Filens udgave', exact: true }).check();
  await expect(apply).toBeEnabled();
  await local.check();
  await page.getByRole('button', { name: 'Annuller', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Lokalt navn/ })).toBeVisible();
  expect(source.puts).toBe(0);
  await page.getByRole('button', { name: 'Gennemgå ændringer', exact: true }).click();
  await expect(apply).toBeDisabled();
  await page.getByRole('radio', { name: 'Filens udgave', exact: true }).check();
  await apply.click();
  await expect(page.getByRole('button', { name: /^Filens navn/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Uændret', exact: true })).toBeVisible();
  expect(source.puts).toBe(0);
});

test('en tredje gemning gør gennemgangen forældet med bevaret kladde', async ({ page }) => {
  const source = await openWorkspace(page);
  await localRename(page);
  await page.getByRole('button', { name: 'Gennemgå ændringer', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Brug disse ændringer' })).toBeEnabled();
  source.external(renameTeam(source.workspace, source.workspace.teams[1]!.id, 'Tredje gemning'));
  await page.getByRole('button', { name: 'Brug disse ændringer' }).click();
  await expect(page.getByRole('alert')).toContainText('Filen er ændret');
  await expect(page.getByRole('alert')).toBeFocused();
  await expect(page.getByRole('button', { name: 'Gennemgå igen' })).toBeVisible();
  await page.screenshot({ path: 'tmp/ui-qa/merge-stale.png', fullPage: true });
  await page.getByRole('button', { name: 'Gennemgå igen' }).click();
  await expect(page.getByRole('dialog')).toContainText('Tredje gemning');
  await page.getByRole('button', { name: 'Annuller', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Lokalt navn/ })).toBeVisible();
  expect(source.puts).toBe(0);
});

test('åben ændret formular tilbyder Opdater, Kassér og Bliv før snapshot', async ({ page }) => {
  const source = await openWorkspace(page);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  source.external(renameTeam(source.workspace, source.workspace.teams[1]!.id, 'Eksternt hold'));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect(page.getByRole('button', { name: /Nyere fil/ })).toBeVisible();
  await page.getByRole('button', { name: 'Redigér hold Syntetisk hold A' }).click();
  await page.getByLabel('Holdnavn').fill('Uafsluttet formular');
  await page.getByRole('button', { name: 'Gennemgå ændringer', exact: true }).last().click();
  await page.getByRole('button', { name: 'Bliv', exact: true }).click();
  await expect(page.getByLabel('Holdnavn')).toHaveValue('Uafsluttet formular');
  await page.getByRole('button', { name: 'Gennemgå ændringer', exact: true }).last().click();
  await page.getByRole('button', { name: 'Behold mine ændringer', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Uafsluttet formular');
  await page.getByRole('button', { name: 'Annuller', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Uafsluttet formular/ })).toBeVisible();
  expect(source.puts).toBe(0);
  await page.getByRole('button', { name: 'Redigér hold Uafsluttet formular' }).click();
  await page.getByLabel('Holdnavn').fill('Kasseres');
  await page.getByRole('button', { name: 'Gennemgå ændringer', exact: true }).last().click();
  await page.getByRole('button', { name: 'Kassér formularændringer' }).click();
  await expect(page.getByRole('dialog')).not.toContainText('Kasseres');
  await page.getByRole('button', { name: 'Brug disse ændringer' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Uafsluttet formular/ })).toBeVisible();
  await expect(page.getByLabel('Holdnavn')).toHaveCount(0);
  expect(source.puts).toBe(0);
});

for (const width of [390, 768, 1440])
  test(`gennemgang ved ${width}px med tastatur, lange navne og tilgængelighed`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    await page.emulateMedia({ reducedMotion: 'reduce' });
    const fixture = syntheticWorkspace();
    fixture.workspace.teams[0]!.name =
      'Syntetisk langt holdnavn til gennemgang af ændringer på små og store skærme';
    const source = await openWorkspace(page, fixture.workspace);
    await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
    const external = updateAssessment(source.workspace, source.workspace.athleteSkills[0]!.id, {
      stability: 4,
      assessedAt: '2026-10-27',
      note: 'En længere syntetisk note om ændringen.',
    });
    source.external(external);
    const trigger = page.getByRole('button', { name: 'Gennemgå ændringer', exact: true });
    await trigger.press('Enter');
    await expect(page.getByRole('button', { name: 'Brug disse ændringer' })).toBeEnabled();
    await expect(page.getByRole('dialog')).toContainText('2 ændringer i filen');
    const selectedChange = page.locator('.review-item[aria-current="true"]');
    await selectedChange.focus();
    await selectedChange.press('ArrowDown');
    await expect(selectedChange).toContainText('Note');
    await expect(selectedChange).toBeFocused();
    await selectedChange.press('ArrowUp');
    await expect(selectedChange).toContainText('Vurdering');
    expect((await new AxeBuilder({ page }).include('dialog').analyze()).violations).toEqual([]);
    expect(
      await page.getByRole('dialog').evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth + 1),
    ).toBe(true);
    await page.screenshot({ path: `tmp/ui-qa/merge-${width}.png`, fullPage: true });
    if (width === 768) {
      await page.evaluate(() => {
        document.documentElement.style.fontSize = '200%';
      });
      expect(
        await page.getByRole('dialog').evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth + 1),
      ).toBe(true);
      await page.screenshot({ path: 'tmp/ui-qa/merge-200pct.png', fullPage: true });
    }
    await page.keyboard.press('Escape');
    await expect(trigger).toBeFocused();
    expect(source.puts).toBe(0);
    expect(source.failures).toEqual([]);
  });

test('stort arbejdsrum kan gennemgås, filtreres og annulleres uden upload', async ({ page }) => {
  test.setTimeout(60000);
  const base = largeMergeWorkspace();
  const source = await openWorkspace(page, base);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  const remote = structuredClone(base);
  for (const registration of remote.athleteSkills) registration.note = 'Ekstern syntetisk note';
  source.external(remote);
  const start = performance.now();
  await page.getByRole('button', { name: 'Gennemgå ændringer', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('1200 ændringer i filen');
  const rendered = performance.now() - start;
  await page.screenshot({ path: 'tmp/ui-qa/merge-many.png', fullPage: true });
  const filtering = performance.now();
  await page.getByRole('combobox', { name: 'Hold', exact: true }).selectOption(base.teams[0]!.id);
  await expect(page.locator('.review-item')).toHaveCount(24);
  await expect(page.locator('.review-change')).toHaveCount(1);
  const filterMs = performance.now() - filtering;
  await page.getByRole('button', { name: 'Annuller', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.getByRole('button', { name: 'Gennemgå ændringer', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('1200 ændringer i filen');
  await page.getByRole('button', { name: 'Annuller', exact: true }).click();
  expect(source.puts).toBe(0);
  expect(source.workspace).toEqual(remote);
  expect(source.failures).toEqual([]);
  mkdirSync('tmp/merge-qa', { recursive: true });
  writeFileSync(
    'tmp/merge-qa/browser-performance.json',
    JSON.stringify(
      {
        renderedMs: Math.round(rendered),
        filterMs: Math.round(filterMs),
        changes: 1200,
        teams: 100,
        uploads: source.puts,
      },
      null,
      2,
    ),
  );
});

test('indlæsning, læsefejl og læsetilstand har status og bevarer eksport', async ({ page }) => {
  const source = await openWorkspace(page, syntheticWorkspace().workspace, false);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  source.beforeRead(() => held);
  await page.getByRole('button', { name: 'Gennemgå ændringer', exact: true }).click();
  await expect(page.getByRole('status')).toContainText('Henter den nyeste fil');
  await page.screenshot({ path: 'tmp/ui-qa/merge-loading.png' });
  release();
  await expect(page.getByRole('heading', { name: 'Alt er ajour' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Brug disse ændringer' })).toBeDisabled();
  await page.screenshot({ path: 'tmp/ui-qa/merge-readonly.png' });
  await page.getByRole('button', { name: 'Annuller', exact: true }).click();
  source.deny(500);
  await page.getByRole('button', { name: 'Gennemgå ændringer', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('Google-kaldet mislykkedes');
  await expect(page.getByRole('alert')).toBeFocused();
  await page.screenshot({ path: 'tmp/ui-qa/merge-error.png' });
  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download en kopi', exact: true }).click();
  expect((await download).suggestedFilename()).toBe('teamgym-kladde.json');
  expect(source.puts).toBe(0);
  expect(source.failures).toEqual([]);
});

test('blandede konfliktvalg kan anvendes med tastatur ved 390px', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const source = await openWorkspace(page);
  await localRename(page, 'Lokal A');
  await page.getByRole('button', { name: 'Redigér hold Syntetisk hold B' }).click();
  await page.getByLabel('Holdnavn').fill('Lokal B');
  await page.getByRole('button', { name: 'Opdater', exact: true }).click();
  source.external(
    renameTeam(
      renameTeam(source.workspace, source.workspace.teams[0]!.id, 'Ekstern A'),
      source.workspace.teams[1]!.id,
      'Ekstern B',
    ),
  );
  await page.getByRole('button', { name: 'Gennemgå ændringer', exact: true }).press('Enter');
  await expect(page.locator('.review-item-pending')).toHaveCount(2);
  await page.locator('.review-item').filter({ hasText: 'Ekstern A' }).click();
  await page.getByRole('radio', { name: 'Min udgave', exact: true }).press('Space');
  await expect(page.getByRole('button', { name: 'Brug disse ændringer' })).toBeDisabled();
  await page.getByRole('button', { name: 'Næste valg' }).click();
  await expect(page.getByRole('heading', { name: 'Ekstern B', exact: true })).toBeVisible();
  await page.getByRole('radio', { name: 'Filens udgave', exact: true }).press('Space');
  expect((await new AxeBuilder({ page }).include('dialog').analyze()).violations).toEqual([]);
  await page.screenshot({ path: 'tmp/ui-qa/merge-conflicts-390.png', fullPage: true });
  await page.getByRole('button', { name: 'Brug disse ændringer' }).press('Enter');
  await expect(page.getByRole('button', { name: /^Lokal A/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Ekstern B/ })).toBeVisible();
  expect(source.puts).toBe(0);
  expect(source.failures).toEqual([]);
});

test('fjernet lukket scenarie og ændring på andet hold har læsbar kontekst', async ({ page }) => {
  const source = await openWorkspace(page, scenarioWorkspace());
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  const base = source.workspace,
    plan = base.plans[0]!,
    removed = plan.tumbling.at(-1)!;
  source.external(
    renameTeam(deleteScenario(base, plan.id, 'tumbling', removed.id), base.teams[1]!.id, 'Andet hold ændret'),
  );
  await page.getByRole('button', { name: 'Gennemgå ændringer', exact: true }).click();
  await page.locator('.review-item').filter({ hasText: removed.name }).click();
  await expect(page.getByRole('dialog')).toContainText('Fjernet · Scenarie');
  await expect(page.getByRole('dialog')).toContainText(removed.name);
  await expect(page.getByRole('dialog')).toContainText('Andet hold ændret');
  await page.screenshot({ path: 'tmp/ui-qa/merge-closed-scenario.png', fullPage: true });
  await page.getByRole('button', { name: 'Annuller', exact: true }).click();
  expect(source.puts).toBe(0);
  expect(source.failures).toEqual([]);
});

test.describe('200 % zoom på 1440 fysiske pixels', () => {
  test.use({ viewport: { width: 720, height: 450 }, deviceScaleFactor: 2 });
  test('gennemgangens handlinger kan nås og anvendes med tastatur', async ({ page }) => {
    const source = await openWorkspace(page);
    await localRename(page);
    source.external(renameTeam(source.workspace, source.workspace.teams[1]!.id, 'Eksternt hold'));
    await page.getByRole('button', { name: 'Gennemgå ændringer', exact: true }).press('Enter');
    await expect(page.getByRole('button', { name: 'Brug disse ændringer' })).toBeEnabled();
    expect(
      await page.getByRole('dialog').evaluate((dialog) => dialog.scrollWidth <= dialog.clientWidth + 1),
    ).toBe(true);
    await page.getByRole('button', { name: 'Brug disse ændringer' }).focus();
    await page.screenshot({ path: 'tmp/ui-qa/merge-zoom-200.png' });
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    expect(source.puts).toBe(0);
    expect(source.failures).toEqual([]);
  });
});
