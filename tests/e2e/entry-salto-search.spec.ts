import AxeBuilder from '@axe-core/playwright';
import { overviewWorkspace } from '../fixtures/overview-workspace';
import { openWorkspace } from './drive-fixture';
import { chooseSpring, expectIncluded, rate, ratingGroup, springRow, toggleSpring } from './picker';
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
    await expect(list.locator('.spring-batch-choice strong').nth(0)).toHaveText('Strakt salto – rondat');
    await expect(list.locator('.spring-batch-choice strong').nth(1)).toHaveText('Strakt salto – rondat – flik');
    expect(await list.evaluate((element) => element.scrollTop)).toBe(0);
    await picker.getByRole('button', { name: /^Valgte/ }).click();
    await expect(picker.getByText('Du har ikke valgt nogen spring endnu.', { exact: true })).toBeVisible();
    await picker.getByRole('button', { name: 'Resultater', exact: true }).click();
    await expect(search).toHaveValue('strakt rondat');
    const parentName = 'Strakt salto – rondat – flik – strakt 1/1 (360°)';
    await chooseSpring(picker, /^Strakt salto – rondat – flik – strakt 1\/1/, 3);
    const suffix = springRow(picker, /^Rondat – flik – strakt 1\/1 \(360°\) Arvet fra/);
    await expectIncluded(suffix);
    const suffixRating = ratingGroup(picker, 'Vurdering for Rondat – flik – strakt 1/1 (360°)');
    await expect(suffixRating.getByRole('button', { name: /^Arvet/ })).toHaveText('Arvet 3/5');
    await rate(picker, `Sikkerhed for ${parentName}`, 5);
    await expect(suffixRating.getByRole('button', { name: /^Arvet/ })).toHaveText('Arvet 5/5');
    await toggleSpring(picker, 'Vurdering for Rondat – flik – strakt 1/1 (360°)');
    await expectIncluded(springRow(picker, /^Rondat – flik – strakt 1\/1 \(360°\) Fravalgt/), false);
    await toggleSpring(picker, 'Vurdering for Rondat – flik – strakt 1/1 (360°)');
    await search.fill('');
    await picker.getByRole('button', { name: /^Valgte/ }).click();
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
    await page.getByLabel('Find færdighed', { exact: true }).fill('Rondat – flik – strakt 1/1');
    await expect(page.getByRole('button', { name: /^Rondat – flik – strakt 1\/1 \(360°\) D:.*5\/5/ })).toBeVisible();
    expect(source.failures).toEqual([]);
  });
}
