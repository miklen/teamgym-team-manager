import AxeBuilder from '@axe-core/playwright';
import { overviewWorkspace } from '../fixtures/overview-workspace';
import { openWorkspace } from './drive-fixture';
import { expect, test } from './test';

for (const width of [1440, 390]) {
  test(`indgangssalto: søgning og arv til samme serie uden indgang ved ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const source = await openWorkspace(page, overviewWorkspace(0));
    await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
    await page.getByRole('button', { name: /Alma Eksempel/ }).click();
    await page.getByRole('button', { name: 'Tilføj færdighed' }).click();
    const picker = page.getByRole('region', { name: 'Springvælger', exact: true });
    const search = page.getByLabel('Søg sammensat spring eller alias');
    const list = picker.getByRole('list', { name: 'Færdige spring', exact: true });
    await list.evaluate((element) => {
      element.scrollTop = element.scrollHeight;
    });
    await search.fill('strakt rondat');
    await expect(list.locator('.spring-batch-choice strong').nth(0)).toHaveText('Strakt – rondat');
    await expect(list.locator('.spring-batch-choice strong').nth(1)).toHaveText('Strakt – rondat – flik');
    expect(await list.evaluate((element) => element.scrollTop)).toBe(0);
    await picker.getByRole('checkbox', { name: 'Kun valgte', exact: true }).check();
    await expect(picker.getByText('0 spring matcher', { exact: true })).toBeVisible();
    await picker.getByRole('button', { name: 'Søg i alle spring', exact: true }).click();
    await expect(search).toHaveValue('strakt rondat');
    const parentName = 'Strakt – rondat – flik – strakt 1/1 (360°)';
    await picker.getByRole('checkbox', { name: /^Strakt – rondat – flik – strakt 1\/1/ }).check();
    const parentRating = picker.getByLabel(`Sikkerhed for ${parentName}`, { exact: true });
    await parentRating.selectOption('3');
    const suffix = picker.getByRole('checkbox', { name: /^Rondat – flik – helskrue Arvet fra/ });
    await expect(suffix).toBeChecked();
    const suffixRating = picker.getByLabel('Vurdering for Rondat – flik – helskrue', { exact: true });
    await expect(suffixRating).toContainText('Arvet · 3/5');
    await parentRating.selectOption('5');
    await expect(suffixRating).toContainText('Arvet · 5/5');
    await suffix.uncheck();
    await expect(
      picker.getByRole('checkbox', { name: /^Rondat – flik – helskrue Fravalgt/ }),
    ).not.toBeChecked();
    await picker.getByRole('checkbox', { name: /^Rondat – flik – helskrue Fravalgt/ }).check();
    await picker.getByRole('checkbox', { name: 'Kun valgte', exact: true }).check();
    await search.fill('');
    await expect(list.locator('[data-spring-identity]')).toHaveCount(10);
    const identities = await list
      .locator('[data-spring-identity]')
      .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-spring-identity')));
    expect(new Set(identities).size).toBe(10);
    await suffix.scrollIntoViewIfNeeded();
    const accessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(accessibility.violations).toEqual([]);
    expect(
      await page.getByRole('dialog').evaluate((element) => element.scrollWidth <= element.clientWidth),
    ).toBe(true);
    await page.screenshot({ path: `tmp/ui-qa/entry-salto-${width}.png`, animations: 'disabled' });
    await page.getByRole('button', { name: 'Registrér 1 spring', exact: true }).click();
    await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
    await page.getByRole('button', { name: /Lokale ændringer/ }).click();
    await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
    expect(source.workspace.athleteSkills).toHaveLength(10);
    expect(source.workspace.athleteSkills.every((item) => item.stability === 5)).toBe(true);
    await page.reload();
    await page.getByRole('button', { name: /Alma Eksempel/ }).click();
    await page.getByLabel('Find færdighed', { exact: true }).fill('Rondat – flik – helskrue');
    await expect(page.getByRole('button', { name: /^Rondat – flik – helskrue D:.*5\/5/ })).toBeVisible();
    expect(source.failures).toEqual([]);
  });
}
