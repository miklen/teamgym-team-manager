import { expect, test } from './test';
import { openWorkspace } from './drive-fixture';

test('sletning af hold flytter gymnaster til Uden hold før gemning', async ({ page }) => {
  const source = await openWorkspace(page);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Redigér hold Syntetisk hold A' }).click();
  await page.getByRole('button', { name: 'Slet hold', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Slet hold', exact: true });
  await expect(dialog).toContainText('8 gymnaster flyttes til Uden hold');
  await dialog.getByRole('button', { name: 'Annuller', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Redigér hold Syntetisk hold A' })).toBeVisible();
  await page.getByRole('button', { name: 'Redigér hold Syntetisk hold A' }).click();
  await page.getByRole('button', { name: 'Slet hold', exact: true }).click();
  await dialog.getByRole('button', { name: 'Slet hold', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Redigér hold Syntetisk hold A' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Redigér hold Syntetisk hold B' })).toBeVisible();
  await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
  await page.getByRole('combobox', { name: 'Holdfilter', exact: true }).selectOption('none');
  await expect(page.getByRole('button', { name: /^Maja Test/ })).toHaveCount(2);
  expect(source.puts).toBe(0);
  expect(source.failures).toEqual([]);
});
