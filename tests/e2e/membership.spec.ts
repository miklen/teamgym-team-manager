import { expect, test } from '@playwright/test';
import { openWorkspace } from './drive-fixture';

for (const width of [1440, 1024]) {
  test(`søgning, uden hold, arkivering og levende rytme før gemning ved ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const source = await openWorkspace(page);
    await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
    await page.getByLabel('Søg gymnast').fill('Maja');
    await expect(page.getByRole('button', { name: /^Maja Test/ })).toHaveCount(2);
    await page.getByRole('button', { name: /Maja Test Test 1/ }).click();
    await page.getByRole('button', { name: 'Redigér gymnast', exact: true }).click();
    await page.getByRole('combobox', { name: 'Hold', exact: true }).selectOption('');
    await page.getByRole('button', { name: 'Anvend i kladde' }).click();
    await page.getByRole('button', { name: 'Luk dialog' }).click();
    await page.getByRole('combobox', { name: 'Holdfilter', exact: true }).selectOption('none');
    await expect(page.getByRole('button', { name: /Maja Test Test 1/ })).toBeVisible();
    expect(source.puts).toBe(0);
    await page.getByRole('link', { name: 'Rytme', exact: true }).click();
    await page.getByLabel('Søg moment').fill('HB201');
    await expect(page.getByText('7/7', { exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
    await page.getByRole('combobox', { name: 'Holdfilter', exact: true }).selectOption('none');
    await page.getByRole('button', { name: /Maja Test Test 1/ }).click();
    page.once('dialog', (dialog) => void dialog.accept());
    await page.getByRole('button', { name: 'Arkivér gymnast', exact: true }).click();
    await page.getByRole('button', { name: 'Luk dialog' }).click();
    await page.getByLabel('Vis arkiverede', { exact: true }).check();
    await page.getByRole('button', { name: /Maja Test Test 1/ }).click();
    await page.getByRole('button', { name: 'Genaktivér gymnast', exact: true }).click();
    await page.getByRole('button', { name: 'Luk dialog' }).click();
    await page.getByRole('link', { name: 'Springplan', exact: true }).click();
    await expect(
      page.getByText('Gymnasten er arkiveret eller ikke længere på holdet.', { exact: true }).first(),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Fjern Maja Test Test 1 fra 1. omgang', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Fjern Maja Test Test 1 fra 1. omgang', exact: true }),
    ).toHaveCount(0);
    expect(source.puts).toBe(0);
    expect(source.failures).toEqual([]);
  });
}
