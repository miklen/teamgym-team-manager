import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './test';
import { openWorkspace } from './drive-fixture';

for (const viewport of [
  { width: 1440, height: 1000 },
  { width: 1024, height: 768 },
  { width: 390, height: 844 },
]) {
  test(`redesign: navigation, holdkontekst og tilgængelige arbejdsflader ved ${viewport.width}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const source = await openWorkspace(page);
    await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.fonts.check('650 16px Manrope'))).toBe(true);
    for (const name of ['Hold', 'Gymnaster', 'Springplan', 'Rytme', 'Reglement']) {
      const link = page
        .getByRole('navigation', { name: 'Hovednavigation' })
        .getByRole('link', { name, exact: true });
      await link.click();
      await expect(link).toHaveAttribute('aria-current', 'page');
      await expect(
        page.getByRole('heading', { name: name === 'Rytme' ? 'Rytmefællesnævnere' : name, exact: true }),
      ).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect(page.locator('.rail-context')).toBeVisible();
      if (viewport.width === 390) {
        const result = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
          .analyze();
        expect(
          result.violations.map((item) => ({ id: item.id, nodes: item.nodes.map((node) => node.target) })),
          name,
        ).toEqual([]);
      }
      await link.blur();
      await page.screenshot({
        path: `tmp/ui-qa/redesign-${name.toLowerCase()}-${viewport.width}.png`,
        animations: 'disabled',
      });
    }
    await page.getByRole('link', { name: 'Springplan', exact: true }).click();
    await page.getByLabel('Aktuelt hold').selectOption({ label: 'Syntetisk hold B' });
    await expect(page.getByRole('link', { name: 'Springplan', exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
    await expect(page.locator('.rail-context')).toContainText('Ukendt regelpakke');
    await page.getByLabel('Aktuelt hold').selectOption({ label: 'Syntetisk hold A' });
    await expect(page.locator('.rail-context')).toContainText('Junior piger');
    await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
    const athlete = page.getByRole('button', { name: /Maja Test Test 1/ });
    await athlete.click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.screenshot({ path: `tmp/ui-qa/redesign-inspektør-${viewport.width}.png` });
    await page.getByRole('button', { name: 'Tilføj færdighed' }).click();
    await page.getByLabel('Søg sammensat spring eller alias').fill('rondat flik');
    await page.screenshot({ path: `tmp/ui-qa/redesign-springvalg-${viewport.width}.png` });
    await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
    await expect(athlete).toBeFocused();
    expect(source.failures).toEqual([]);
  });
}

test('redesign: selvhostede assets på startskærmen', async ({ page }) => {
  const failures: string[] = [];
  page.on('response', (response) => {
    if (response.status() >= 400) failures.push(new URL(response.url()).pathname);
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Holdets fælles planlægning' })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: 'tmp/ui-qa/redesign-start.png', animations: 'disabled' });
  expect(failures).toEqual([]);
});
