import AxeBuilder from '@axe-core/playwright';
import { overviewWorkspace } from '../fixtures/overview-workspace';
import { openWorkspace } from './drive-fixture';
import { expect, test } from './test';

for (const width of [1440, 390]) {
  test(`én samlet springvælger uden gentaget fundament ved ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const source = await openWorkspace(page, overviewWorkspace(0));
    await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
    await page.getByRole('button', { name: /Alma Eksempel/ }).click();
    await page.getByRole('button', { name: 'Tilføj færdighed' }).click();
    const picker = page.getByRole('region', { name: 'Springvælger', exact: true });
    const search = page.getByLabel('Søg sammensat spring eller alias');
    await search.fill('rondat flik');
    await picker.getByRole('checkbox', { name: /^Rondat – flik Baglæns/ }).check();
    await page.getByLabel('Sikkerhed for Rondat – flik', { exact: true }).selectOption('2');
    await search.fill('rondat-flik-1/1');
    await picker.getByRole('checkbox', { name: /^Rondat – flik – strakt 1\/1/ }).check();
    await page
      .getByLabel('Sikkerhed for Rondat – flik – strakt 1/1 (360°)', { exact: true })
      .selectOption('5');
    await expect(
      picker
        .locator('[data-spring-identity]')
        .filter({ has: page.getByRole('checkbox', { name: /^Rondat – flik Valgt direkte/ }) }),
    ).toHaveCount(1);
    const identities = await picker
      .locator('[data-spring-identity]')
      .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-spring-identity')));
    expect(new Set(identities).size).toBe(identities.length);
    await expect(page.locator('.foundation-review')).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Valgte spring', exact: true })).toHaveCount(0);
    await picker.getByRole('checkbox', { name: 'Kun valgte', exact: true }).check();
    await expect(picker.locator('[data-spring-identity]')).toHaveCount(6);
    await search.fill('ingen katalogresultater');
    await page.getByLabel('Minimum-D', { exact: true }).fill('2,00');
    await expect(picker.locator('[data-spring-identity]')).toHaveCount(6);
    const prefix = picker.getByRole('checkbox', { name: /^Rondat – flik Valgt direkte/ });
    await prefix.focus();
    await page.keyboard.press('Space');
    const excluded = picker.getByRole('checkbox', { name: /^Rondat – flik Fravalgt/ });
    await expect(excluded).toBeFocused();
    await expect(excluded).not.toBeChecked();
    await expect(picker.locator('[data-spring-identity]')).toHaveCount(6);
    await excluded.check();
    await picker.getByLabel('Vurdering for Rondat – flik', { exact: true }).selectOption('2');
    await expect(
      picker.getByRole('checkbox', { name: /^Rondat – flik Fundament · Egen vurdering/ }),
    ).toBeChecked();
    await picker.getByRole('checkbox', { name: 'Kun valgte', exact: true }).uncheck();
    await search.fill('rondat flik');
    await page.getByLabel('Minimum-D', { exact: true }).fill('');
    const after = await picker
      .locator('[data-spring-identity]')
      .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-spring-identity')));
    expect(new Set(after).size).toBe(after.length);
    await picker.getByRole('checkbox', { name: 'Kun valgte', exact: true }).check();
    await picker.locator('.unified-spring-list').scrollIntoViewIfNeeded();
    const accessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(accessibility.violations).toEqual([]);
    expect(
      await page.getByRole('dialog').evaluate((element) => element.scrollWidth <= element.clientWidth),
    ).toBe(true);
    await page.screenshot({ path: `tmp/ui-qa/unified-spring-picker-${width}.png`, animations: 'disabled' });
    await page.getByRole('button', { name: 'Registrér 1 spring' }).click();
    await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
    await page.getByRole('button', { name: /Lokale ændringer/ }).click();
    await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
    expect(source.workspace.athleteSkills).toHaveLength(6);
    expect(source.failures).toEqual([]);
  });
}
