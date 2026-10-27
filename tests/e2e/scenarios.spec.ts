import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { setRoundEntries, setArchived } from '@teamgym/domain';
import { openWorkspace } from './drive-fixture';
import { scenarioWorkspace } from '../fixtures/scenario-workspace';
import { expect, test } from './test';

async function spring(page: Page) {
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Plan A', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
}
async function menu(page: Page, name: string) {
  await page.getByRole('button', { name: /^Menu for / }).click();
  await page.getByRole('menuitem', { name, exact: true }).click();
}

test('scenarier er lokal navigation pr. hold og disciplin og huskes mellem sider', async ({ page }) => {
  const source = await openWorkspace(page, scenarioWorkspace());
  await spring(page);
  const original = JSON.stringify(source.workspace);
  await page.getByRole('tab', { name: 'Plan B', exact: true }).click();
  await page.getByRole('button', { name: 'Trampet', exact: true }).click();
  await page.getByRole('tab', { name: 'Sikker', exact: true }).click();
  await page.getByRole('button', { name: 'Bane', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Plan B', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Plan B', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.getByLabel('Aktuelt hold').selectOption({ label: 'Syntetisk hold B' });
  await expect(page.getByText(/Holdets præcise regelpakke er ikke installeret/)).toBeVisible();
  await page.getByLabel('Aktuelt hold').selectOption({ label: 'Syntetisk hold A' });
  await expect(page.getByRole('tab', { name: 'Plan B', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  expect(source.puts).toBe(0);
  expect(JSON.stringify(source.workspace)).toBe(original);
  await expect(page.getByRole('button', { name: /Lokale ændringer/ })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('tab', { name: 'Plan A', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  expect(source.failures).toEqual([]);
});

test('opret, kopi, navnefejl, omdøbning, sletning og sidste scenarie har fokus og bevidst gemning', async ({
  page,
}) => {
  const source = await openWorkspace(page, scenarioWorkspace());
  await spring(page);
  await page.getByRole('button', { name: '+ Nyt', exact: true }).click();
  await expect(page.getByLabel('Nyt scenarie', { exact: true })).toBeFocused();
  await page.getByLabel('Nyt scenarie', { exact: true }).fill(' plan a ');
  await page.getByRole('button', { name: 'Opret scenarie', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('allerede');
  await page.getByLabel('Nyt scenarie', { exact: true }).fill('Tom');
  await page.getByLabel('Nyt scenarie', { exact: true }).press('Enter');
  await expect(page.getByRole('tab', { name: 'Tom', exact: true })).toBeFocused();
  await expect(page.locator('.round-entries > li')).toHaveCount(0);
  await page.getByRole('tab', { name: 'Plan A', exact: true }).click();
  await menu(page, 'Duplikér');
  await expect(page.getByLabel('Navn på kopi')).toHaveValue('Plan A - kopi');
  await page.getByLabel('Navn på kopi').fill('Plan C');
  await page.getByLabel('Navn på kopi').press('Enter');
  await expect(page.locator('.round-entries > li')).toHaveCount(18);
  await expect(page.locator('.reserve-list > li')).toHaveCount(2);
  await menu(page, 'Omdøb');
  await page.getByLabel('Scenarienavn', { exact: true }).fill('Kasseres');
  await page.getByLabel('Scenarienavn', { exact: true }).press('Escape');
  await expect(page.getByRole('tab', { name: 'Plan C', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await menu(page, 'Omdøb');
  await page.getByLabel('Scenarienavn', { exact: true }).fill('Plan D');
  await page.getByLabel('Scenarienavn', { exact: true }).press('Enter');
  await menu(page, 'Slet');
  await page.getByRole('button', { name: 'Annuller', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Plan D', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await menu(page, 'Slet');
  await page.getByRole('button', { name: 'Slet scenarie', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Tom', exact: true })).toBeFocused();
  expect(source.puts).toBe(0);
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  expect(source.workspace.plans[0]!.tumbling.map((item) => item.name)).toEqual(['Plan A', 'Tom', 'Plan B']);
  await page.reload();
  await page.getByRole('tab', { name: 'Tom', exact: true }).click();
  await expect(page.locator('.round-entries > li')).toHaveCount(0);
  await page.getByLabel('Aktuelt hold').selectOption({ label: 'Syntetisk hold B' });
  await page.getByRole('button', { name: /^Menu for / }).click();
  await expect(page.getByRole('menuitem', { name: 'Slet', exact: true })).toBeDisabled();
  await expect(page.getByText('Bevar mindst ét scenarie i hver disciplin.')).toBeVisible();
  expect(source.failures).toEqual([]);
});

for (const choice of ['Bliv', 'Kassér', 'Opdater']) {
  test(`ændret pladsformular: ${choice} beskytter scenariet og uploader ikke`, async ({ page }) => {
    const source = await openWorkspace(page, scenarioWorkspace());
    await spring(page);
    await page.locator('.round-entries .entry-name').first().click();
    const editor = page.getByRole('dialog', { name: 'Redigér omgangsplads', exact: true });
    await editor.getByRole('combobox', { name: 'Rolle', exact: true }).selectOption('extra');
    await editor.getByLabel('Vis scenarie').selectOption({ label: 'Plan B' });
    const guard = page.getByRole('dialog', { name: 'Gem formularændringer?', exact: true });
    await guard.getByRole('button', { name: choice, exact: true }).click();
    if (choice === 'Bliv') {
      await expect(editor).toBeVisible();
      await expect(editor.getByRole('combobox', { name: 'Rolle', exact: true })).toHaveValue('extra');
      await editor.getByLabel('Vis scenarie').selectOption({ label: 'Plan B' });
      await guard.getByRole('button', { name: 'Kassér', exact: true }).click();
    }
    await expect(page.getByRole('tab', { name: 'Plan B', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    await page.getByRole('tab', { name: 'Plan A', exact: true }).click();
    await expect(page.locator('.round-entries > li').first()).toHaveClass(
      choice === 'Opdater' ? 'extra-entry' : '',
    );
    expect(source.puts).toBe(0);
    expect(source.workspace.plans[0]!.tumbling[0]!.rounds[0].entries[0]!.role).toBe('counting');
    expect(source.failures).toEqual([]);
  });
}

test('ugyldig navneformular bliver ved Opdater, mens Kassér og Bliv bevarer korrekt plan', async ({
  page,
}) => {
  const source = await openWorkspace(page, scenarioWorkspace());
  await spring(page);
  await menu(page, 'Omdøb');
  await page.getByLabel('Scenarienavn', { exact: true }).fill('Plan B');
  await page.getByRole('tab', { name: 'Plan B', exact: true }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Opdater', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('allerede');
  await expect(page.getByRole('tab', { name: 'Plan A', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await page.getByLabel('Scenarienavn', { exact: true }).fill('Omdøbt');
  await page.getByLabel('Scenarienavn', { exact: true }).press('Enter');
  await expect(page.getByRole('tab', { name: 'Plan B', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.getByRole('tab', { name: 'Omdøbt', exact: true })).toBeVisible();
  expect(source.puts).toBe(0);
});

test('reserver prioriteres med knapper, redigeres og indsættes samlet med synlige konsekvenser', async ({
  page,
}) => {
  const source = await openWorkspace(page, scenarioWorkspace());
  await spring(page);
  const reserves = page.locator('.reserve-section').first();
  const beforeD = await page.locator('.round-totals').first().textContent();
  await reserves.getByRole('button', { name: /Flyt Syntetisk gymnast 8.* op som reserve/ }).focus();
  await page.keyboard.press('Enter');
  await expect(reserves.locator('.reserve-list > li').first()).toContainText('Syntetisk gymnast 8');
  await expect(reserves.locator('.reserve-edit').first()).toBeFocused();
  await expect(page.locator('.round-totals').first()).toHaveText(beforeD!);
  await reserves.locator('.reserve-edit').first().click();
  const editor = page.getByRole('dialog', { name: 'Redigér reserve', exact: true });
  await editor.getByRole('button', { name: 'Spring', exact: true }).click();
  await editor.getByRole('combobox', { name: 'Søg registrerede spring' }).fill('syntetisk');
  await editor.getByRole('listbox').getByRole('option').first().click();
  await editor.getByRole('button', { name: 'Opdater', exact: true }).click();
  await reserves.getByRole('button', { name: 'Sæt ind', exact: true }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Sæt reserve ind', exact: true });
  await dialog.getByLabel('Gymnast der udgår').selectOption({ index: 1 });
  await expect(dialog).toContainText('Plan A');
  await expect(dialog.getByRole('heading', { name: 'Efter', exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: 'Annuller', exact: true }).click();
  await expect(reserves.locator('.reserve-list > li')).toHaveCount(2);
  await reserves.getByRole('button', { name: 'Sæt ind', exact: true }).first().click();
  await dialog.getByLabel('Gymnast der udgår').selectOption({ index: 1 });
  await dialog.getByRole('button', { name: 'Bekræft indsættelse', exact: true }).click();
  await expect(reserves.locator('.reserve-list > li')).toHaveCount(1);
  await expect(page.locator('.round-entries > li').first()).toContainText('Syntetisk gymnast 8');
  await page.getByRole('tab', { name: 'Plan B', exact: true }).click();
  await expect(reserves.locator('.reserve-list > li')).toHaveCount(2);
  expect(source.puts).toBe(0);
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  expect(source.workspace.plans[0]!.tumbling[0]!.rounds[0].reserves).toHaveLength(1);
  expect(source.workspace.plans[0]!.tumbling[1]!.rounds[0].reserves).toHaveLength(2);
  await page.reload();
  await expect(page.locator('.round-entries > li').first()).toContainText('Syntetisk gymnast 8');
  expect(source.failures).toEqual([]);
});

test('reserve uden spring kan indsættes på ekstra plads, mens utilgængelige reserver og tom omgang forklares', async ({
  page,
}) => {
  let workspace = scenarioWorkspace();
  const plan = workspace.plans[0]!;
  const scenario = plan.tumbling[0]!;
  const round = scenario.rounds[0];
  workspace = setRoundEntries(
    workspace,
    plan.id,
    'tumbling',
    scenario.id,
    round.id,
    round.entries.map((entry, index) => (index === 0 ? { ...entry, role: 'extra' } : entry)),
    { counting: 6, extra: 2 },
  );
  workspace = setArchived(workspace, 'athletes', workspace.athletes[6]!.id, true);
  workspace.plans[0]!.tumbling[0]!.rounds[1].reserves = [
    { id: 'empty-round-reserve', athleteId: workspace.athletes[8]!.id, athleteSkillId: null },
  ];
  workspace.plans[0]!.tumbling[0]!.rounds[1].entries = [];
  const source = await openWorkspace(page, workspace);
  await spring(page);
  await expect(page.locator('.reserve-list > li').first()).toContainText('Utilgængelig reserve');
  await expect(
    page.locator('.reserve-list > li').first().getByRole('button', { name: 'Sæt ind', exact: true }),
  ).toBeDisabled();
  await expect(page.getByText('Tilføj først en udførende plads for at sætte en reserve ind.')).toBeVisible();
  await page
    .locator('.reserve-section')
    .first()
    .getByRole('button', { name: 'Sæt ind', exact: true })
    .nth(1)
    .click();
  const dialog = page.getByRole('dialog', { name: 'Sæt reserve ind', exact: true });
  await dialog.getByLabel('Gymnast der udgår').selectOption({ index: 1 });
  await dialog.getByRole('button', { name: 'Bekræft indsættelse', exact: true }).click();
  await expect(page.locator('.round-entries > li').first()).toHaveClass('extra-entry');
  await expect(page.locator('.round-entries > li').first()).toContainText('Vælg registreret færdighed');
  expect(source.puts).toBe(0);
  expect(source.failures).toEqual([]);
});

for (const width of [390, 768, 1440]) {
  test(`12 scenarier, 200 tegn, fulde navne, tastatur og axe ved ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const source = await openWorkspace(page, scenarioWorkspace(12));
    await spring(page);
    const tabs = page.getByRole('tab');
    await tabs.first().focus();
    await page.keyboard.press('End');
    await expect(tabs.last()).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(tabs.last()).toHaveAttribute('aria-selected', 'true');
    await expect(tabs.last()).toBeInViewport();
    await page.screenshot({ path: `tmp/ui-qa/scenarios-long-name-${width}.png`, animations: 'disabled' });
    await expect(page.getByRole('button', { name: '+ Nyt', exact: true })).toBeInViewport();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: /^Alle scenarier/ }).click();
    await page.screenshot({ path: `tmp/ui-qa/scenarios-all-${width}.png`, animations: 'disabled' });
    await page.getByLabel('Søg scenarier').fill('ingen match');
    await expect(page.getByText('Ingen scenarier matcher søgningen.')).toBeVisible();
    await page.getByLabel('Søg scenarier').fill('Plan B');
    await page.getByRole('dialog').getByRole('button', { name: 'Plan B', exact: true }).click();
    await expect(page.getByRole('tab', { name: 'Plan B', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    const axe = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(axe.violations).toEqual([]);
    expect(
      await page.locator('.scenario-fixed button, .reserve-section button').evaluateAll((nodes) =>
        nodes
          .filter((node) => (node as HTMLElement).offsetParent)
          .every((node) => {
            const rect = node.getBoundingClientRect();
            return rect.width >= 44 && rect.height >= 44;
          }),
      ),
    ).toBe(true);
    await page.screenshot({ path: `tmp/ui-qa/scenarios-navigation-${width}.png`, animations: 'disabled' });
    await page.locator('.reserve-section').first().scrollIntoViewIfNeeded();
    await page.screenshot({ path: `tmp/ui-qa/scenarios-reserves-${width}.png`, animations: 'disabled' });
    await page.getByRole('button', { name: '+ Nyt', exact: true }).click();
    await page.getByLabel('Nyt scenarie', { exact: true }).fill('Plan A');
    await page.getByRole('button', { name: 'Opret scenarie', exact: true }).click();
    await expect(page.locator('.scenario-name-form > label')).toBeInViewport();
    await page.screenshot({ path: `tmp/ui-qa/scenarios-error-${width}.png`, animations: 'disabled' });
    await page.getByLabel('Nyt scenarie', { exact: true }).press('Escape');
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.evaluate(() => {
      document.documentElement.style.fontSize = '200%';
    });
    await page.getByRole('button', { name: /^Alle scenarier/ }).click();
    await page.getByLabel('Søg scenarier').fill('Plan A');
    await page.getByRole('dialog').getByRole('button', { name: 'Plan A', exact: true }).click();
    await page.screenshot({ path: `tmp/ui-qa/scenarios-large-text-${width}.png`, animations: 'disabled' });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(source.puts).toBe(0);
    expect(source.failures).toEqual([]);
  });
}

for (const width of [390, 768, 1440]) {
  test(`læseadgang med låste handlinger ved ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const source = await openWorkspace(page, scenarioWorkspace(), false);
    await spring(page);
    await page.getByRole('tab', { name: 'Plan B', exact: true }).click();
    await expect(page.getByRole('button', { name: '+ Nyt', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: /^Menu for / }).click();
    await expect(page.getByRole('menuitem', { name: 'Duplikér', exact: true })).toBeDisabled();
    await page.keyboard.press('Escape');
    await expect(
      page.locator('.reserve-section').first().getByRole('button', { name: 'Sæt ind', exact: true }).first(),
    ).toBeDisabled();
    await page.locator('.reserve-edit').first().click();
    await expect(
      page
        .getByRole('dialog', { name: 'Redigér reserve', exact: true })
        .getByRole('button', { name: 'Opdater', exact: true }),
    ).toBeDisabled();
    await page.screenshot({ path: `tmp/ui-qa/scenarios-readonly-${width}.png`, animations: 'disabled' });
    expect(source.puts).toBe(0);
    expect(source.failures).toEqual([]);
  });
}

test.describe('200 % visning med 720 CSS-pixels på 1440 fysiske pixels', () => {
  test.use({ viewport: { width: 720, height: 450 }, deviceScaleFactor: 2 });
  test('kopi, reserveprioritet og indsættelse kan gennemføres med tastatur på kort skærm', async ({
    page,
  }) => {
    const source = await openWorkspace(page, scenarioWorkspace());
    await spring(page);
    await page.getByRole('button', { name: /^Menu for / }).focus();
    await page.keyboard.press('Enter');
    await page.keyboard.press('Enter');
    await expect(page.getByLabel('Navn på kopi')).toBeFocused();
    await page.keyboard.press('Control+A');
    await page.keyboard.type('Tastaturplan');
    await page.keyboard.press('Enter');
    await expect(page.getByRole('tab', { name: 'Tastaturplan', exact: true })).toBeFocused();
    const reserves = page.locator('.reserve-section').first();
    await reserves.getByRole('button', { name: '+ Tilføj reserve', exact: true }).focus();
    await page.keyboard.press('Enter');
    const editor = page.getByRole('dialog', { name: 'Tilføj reserve', exact: true });
    await editor.getByRole('button', { name: 'Opdater', exact: true }).focus();
    await page.keyboard.press('Enter');
    await reserves.getByRole('button', { name: /^Flyt Syntetisk reserve.* op som reserve$/ }).focus();
    await page.keyboard.press('Enter');
    await reserves.getByRole('button', { name: 'Sæt ind', exact: true }).nth(1).focus();
    await page.keyboard.press('Enter');
    const insert = page.getByRole('dialog', { name: 'Sæt reserve ind', exact: true });
    await insert.getByRole('combobox', { name: 'Gymnast der udgår', exact: true }).focus();
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    await insert.getByRole('button', { name: 'Bekræft indsættelse', exact: true }).focus();
    await page.screenshot({ path: 'tmp/ui-qa/scenarios-zoom-200.png', animations: 'disabled' });
    await page.keyboard.press('Enter');
    await expect(page.locator('.round-entries > li').first()).toContainText('Syntetisk reserve');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze())
        .violations,
    ).toEqual([]);
    expect(source.puts).toBe(0);
    expect(source.failures).toEqual([]);
  });
});
