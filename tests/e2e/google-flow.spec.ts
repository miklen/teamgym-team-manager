import { expect, test } from './test';
import { openWorkspace } from './drive-fixture';

test('Google indlæses automatisk, men login starter først ved brugerens klik', async ({ page }) => {
  await page.goto('./');
  await expect(page.getByRole('button', { name: 'Forbind til Google Drive', exact: true })).toBeEnabled();
  await expect(page.getByRole('button', { name: /Klargør/ })).toHaveCount(0);
  expect(await page.evaluate(() => 'syntheticTokenOptions' in window)).toBe(false);
});

test('en indlæsningsfejl kan prøves igen uden ekstra normaltrin eller automatisk login', async ({
  page,
  googleMock,
}) => {
  googleMock.failLoads = 1;
  await page.goto('./');
  await expect(page.getByRole('button', { name: 'Prøv Google igen' })).toBeVisible();
  await page.getByRole('button', { name: 'Prøv Google igen' }).click();
  await expect(page.getByRole('button', { name: 'Forbind til Google Drive', exact: true })).toBeEnabled();
  expect(await page.evaluate(() => 'syntheticTokenOptions' in window)).toBe(false);
});

for (const width of [1440, 390]) {
  test(`cookievalg og mappevalg virker uden modal blokering ved ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const source = await openWorkspace(page);
    await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Arbejdsrum', exact: true }).click();
    await page.getByRole('button', { name: 'Opret arbejdsrum', exact: true }).click();
    await page.getByLabel('Arbejdsrummets navn').fill('Syntetisk sæson');
    await page.getByRole('button', { name: 'Vælg mappe og opret JSON-fil' }).click();
    expect(await page.evaluate(() => document.querySelectorAll('dialog:modal').length)).toBe(0);
    const picker = page.frameLocator('iframe[title="Google Drive"]');
    await picker.getByRole('button', { name: 'Accepter kun nødvendige' }).click();
    await picker.getByRole('button', { name: 'Annuller', exact: true }).click();
    await expect(page.locator('iframe[title="Google Drive"]')).toHaveCount(0);
    await expect(page.getByRole('dialog', { name: 'Opret arbejdsrum på Drive' })).toBeVisible();
    await expect(page.getByLabel('Arbejdsrummets navn')).toHaveValue('Syntetisk sæson');
    expect(source.creates).toBe(0);
    await page.getByRole('button', { name: 'Vælg mappe og opret JSON-fil' }).click();
    await picker.getByRole('button', { name: 'Accepter kun nødvendige' }).click();
    await page.screenshot({ path: `tmp/ui-qa/google-picker-${width}.png` });
    await picker.getByRole('button', { name: 'Vælg', exact: true }).click();
    await expect(
      page.getByRole('contentinfo').getByText('Syntetisk sæson.json', { exact: true }),
    ).toBeVisible();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.locator('iframe[title="Google Drive"]')).toHaveCount(0);
    expect(source.creates).toBe(1);
    expect(source.created?.workspace.teams).toHaveLength(0);
    expect(source.workspace.athletes).toHaveLength(8);
    expect(source.failures).toEqual([]);
  });
}

test('filvalg fra indstillinger har heller ingen appmodal hen over Google', async ({ page }) => {
  const source = await openWorkspace(page);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Arbejdsrum', exact: true }).click();
  await page.getByRole('button', { name: 'Vælg anden fil' }).click();
  expect(await page.evaluate(() => document.querySelectorAll('dialog:modal').length)).toBe(0);
  const picker = page.frameLocator('iframe[title="Google Drive"]');
  await picker.getByRole('button', { name: 'Accepter kun nødvendige' }).click();
  await picker.getByRole('button', { name: 'Annuller', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Arbejdsrum og forbindelse' })).toBeVisible();
  expect(source.puts).toBe(0);
  expect(source.failures).toEqual([]);
});
