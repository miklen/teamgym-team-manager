import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './test';
import { openWorkspace } from './drive-fixture';

test('WCAG 2.2 AA på centrale arbejdsflader og vurderingsdialog', async ({ page }) => {
  const source = await openWorkspace(page);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  for (const name of ['Hold', 'Gymnaster', 'Springplan', 'Rytme', 'Reglement']) {
    await page.getByRole('link', { name, exact: true }).click();
    await expect(
      page.getByRole('heading', { name: name === 'Rytme' ? 'Rytmefællesnævnere' : name, exact: true }),
    ).toBeVisible();
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(
      result.violations.map((item) => ({ id: item.id, nodes: item.nodes.map((node) => node.target) })),
      name,
    ).toEqual([]);
  }
  await page.getByRole('link', { name: 'Springplan' }).click();
  await page.getByRole('button', { name: 'Vurdering', exact: true }).first().click();
  await expect(page.getByRole('dialog')).toBeVisible();
  const dialogResult = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(dialogResult.violations).toEqual([]);
  await page.screenshot({ path: 'tmp/ui-qa/vurdering.png' });
  expect(source.failures).toEqual([]);
});
