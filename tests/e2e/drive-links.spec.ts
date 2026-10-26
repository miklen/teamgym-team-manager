import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';
import { openWorkspace } from './drive-fixture';
import { expect, test } from './test';

async function connectedStart(page: Page) {
  const source = await openWorkspace(page);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Arbejdsrum', exact: true }).click();
  await page.getByRole('button', { name: 'Afbryd forbindelse / skift konto' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.goto('./');
  await page.getByRole('button', { name: 'Forbind til Google Drive', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Åbn holdets arbejdsrum' })).toBeVisible();
  return source;
}

async function pickerChoose(page: Page, action: 'Vælg' | 'Annuller' = 'Vælg') {
  expect(await page.evaluate(() => document.querySelectorAll('dialog:modal').length)).toBe(0);
  const picker = page.frameLocator('iframe[title="Google Drive"]');
  await picker.getByRole('button', { name: 'Accepter kun nødvendige' }).click();
  await picker.getByRole('button', { name: action, exact: true }).click();
}

for (const width of [1440, 390]) {
  test(`fillink åbner allerede tilgængeligt arbejdsrum direkte ved ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const source = await connectedStart(page);
    await page.getByRole('button', { name: 'Åbn fra link', exact: true }).click();
    await page
      .getByLabel('Link til fil eller mappe')
      .fill('https://drive.google.com/file/d/synthetic-file/view?usp=sharing&resourcekey=0-synthetic');
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(result.violations).toEqual([]);
    await page.screenshot({ path: `tmp/ui-qa/drive-fillink-${width}.png`, animations: 'disabled' });
    await page.getByRole('button', { name: 'Åbn link', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
    await expect(page.locator('iframe[title="Google Drive"]')).toHaveCount(0);
    expect(page.url()).not.toContain('resourcekey');
    expect(source.puts).toBe(0);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
    expect(source.failures).toEqual([]);
  });

  test(`mappelink starter filvalg inde i mappen ved ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const source = await connectedStart(page);
    await page.getByRole('button', { name: 'Åbn fra link', exact: true }).click();
    await page
      .getByLabel('Link til fil eller mappe')
      .fill(
        width === 1440
          ? 'https://drive.google.com/open?id=synthetic-folder'
          : 'https://drive.google.com/drive/u/0/folders/synthetic-folder',
      );
    await page.getByRole('button', { name: 'Åbn link', exact: true }).click();
    await expect(page.locator('iframe[title="Google Drive"]')).toBeVisible();
    expect(
      await page.evaluate(() =>
        (
          window as typeof window & { syntheticPickerViews: { parentId: string; fileId?: string }[] }
        ).syntheticPickerViews.at(-1),
      ),
    ).toMatchObject({ parentId: 'synthetic-folder' });
    await pickerChoose(page);
    await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
    expect(source.puts).toBe(0);
    expect(source.failures).toEqual([]);
  });

  test(`opret nyt arbejdsrum med mappelink og bevar eksisterende fil ved ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const source = await connectedStart(page);
    const original = source.workspace;
    await page.getByRole('button', { name: 'Opret arbejdsrum', exact: true }).click();
    await page.getByLabel('Arbejdsrummets navn').fill('Syntetisk linkmappe');
    await page
      .getByLabel('Link til mappe (valgfrit)')
      .fill('https://drive.google.com/drive/folders/synthetic-folder');
    await page.screenshot({ path: `tmp/ui-qa/drive-mappelink-${width}.png`, animations: 'disabled' });
    await page.getByRole('button', { name: 'Opret arbejdsrum i mappen', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
    await expect(page.getByRole('contentinfo')).toContainText('Syntetisk linkmappe.json');
    expect(source.creates).toBe(1);
    expect(source.created?.workspace.teams).toEqual([]);
    expect(source.workspace).toEqual(original);
    expect(source.puts).toBe(0);
    await expect(page.locator('iframe[title="Google Drive"]')).toHaveCount(0);
    expect(source.failures).toEqual([]);
  });
}

test('nyt fillink beder kun om Google-bekræftelse for den angivne fil', async ({ page }) => {
  const source = await connectedStart(page);
  let granted = false;
  await page.route('https://www.googleapis.com/drive/v2/files/synthetic-file?*', async (route) => {
    if (!granted) await route.fulfill({ status: 404 });
    else await route.fallback();
  });
  await page.getByRole('button', { name: 'Åbn fra link', exact: true }).click();
  await page
    .getByLabel('Link til fil eller mappe')
    .fill('https://drive.google.com/file/d/synthetic-file/view');
  const oauthBefore = await page.evaluate(
    () => (window as typeof window & { syntheticTokenRequests: number }).syntheticTokenRequests,
  );
  await page.getByRole('button', { name: 'Åbn link', exact: true }).click();
  await expect(page.locator('iframe[title="Google Drive"]')).toBeVisible();
  expect(
    await page.evaluate(() =>
      (window as typeof window & { syntheticPickerViews: { fileId: string }[] }).syntheticPickerViews.at(-1),
    ),
  ).toMatchObject({ fileId: 'synthetic-file' });
  granted = true;
  await pickerChoose(page);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => (window as typeof window & { syntheticTokenRequests: number }).syntheticTokenRequests,
    ),
  ).toBe(oauthBefore);
  expect(source.puts).toBe(0);
  expect(source.failures).toEqual([]);
});

test('nyt mappelink bevarer formularen ved annullering og opretter først efter bekræftelse', async ({
  page,
}) => {
  const source = await connectedStart(page);
  let granted = false;
  await page.route('https://www.googleapis.com/drive/v2/files/synthetic-folder?*', async (route) => {
    if (!granted) await route.fulfill({ status: 403 });
    else await route.fallback();
  });
  await page.getByRole('button', { name: 'Opret arbejdsrum', exact: true }).click();
  const link = 'https://drive.google.com/drive/folders/synthetic-folder';
  await page.getByLabel('Arbejdsrummets navn').fill('Syntetisk bekræftet');
  await page.getByLabel('Link til mappe (valgfrit)').fill(link);
  await page.getByRole('button', { name: 'Opret arbejdsrum i mappen', exact: true }).click();
  await expect(page.locator('iframe[title="Google Drive"]')).toBeVisible();
  expect(
    await page.evaluate(() =>
      (
        window as typeof window & { syntheticPickerViews: { fileId: string; folder: boolean }[] }
      ).syntheticPickerViews.at(-1),
    ),
  ).toMatchObject({ fileId: 'synthetic-folder', folder: true });
  await pickerChoose(page, 'Annuller');
  await expect(page.getByLabel('Arbejdsrummets navn')).toHaveValue('Syntetisk bekræftet');
  await expect(page.getByLabel('Link til mappe (valgfrit)')).toHaveValue(link);
  expect(source.creates).toBe(0);
  await page.getByRole('button', { name: 'Opret arbejdsrum i mappen', exact: true }).click();
  await expect(page.locator('iframe[title="Google Drive"]')).toBeVisible();
  granted = true;
  await pickerChoose(page);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  expect(source.creates).toBe(1);
  expect(source.failures).toEqual([]);
});

test('ugyldigt link, fillink som mappe og skrivebeskyttet mappe opretter ingen fil', async ({ page }) => {
  const source = await connectedStart(page);
  await page.getByRole('button', { name: 'Åbn fra link', exact: true }).click();
  await page
    .getByLabel('Link til fil eller mappe')
    .fill('https://drive.google.com.evil.invalid/file/d/synthetic-file/view');
  await page.getByRole('button', { name: 'Åbn link', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('gyldigt Google Drive-link');
  await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
  await page.getByRole('button', { name: 'Opret arbejdsrum', exact: true }).click();
  await page.getByLabel('Arbejdsrummets navn').fill('Syntetisk ugyldig');
  await page
    .getByLabel('Link til mappe (valgfrit)')
    .fill('https://drive.google.com/file/d/synthetic-file/view');
  await page.getByRole('button', { name: 'Opret arbejdsrum i mappen', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('link til mappen');
  await page.route('https://www.googleapis.com/drive/v2/files/synthetic-folder?*', (route) =>
    route.fulfill({
      json: {
        id: 'synthetic-folder',
        title: 'Syntetisk læsemappe',
        mimeType: 'application/vnd.google-apps.folder',
        etag: '"1"',
        version: '1',
        editable: false,
        labels: { trashed: false },
        capabilities: { canAddChildren: false },
      },
    }),
  );
  await page
    .getByLabel('Link til mappe (valgfrit)')
    .fill('https://drive.google.com/drive/folders/synthetic-folder');
  await page.getByRole('button', { name: 'Opret arbejdsrum i mappen', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('må oprette filer');
  expect(source.creates).toBe(0);
  expect(source.puts).toBe(0);
  expect(source.failures).toEqual([]);
});

test('åbning fra link bevarer en ugemt kladde ved annullering og forkert filtype', async ({ page }) => {
  const source = await openWorkspace(page);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Redigér hold Syntetisk hold A' }).click();
  await page.getByLabel('Holdnavn').fill('Syntetisk ugemt hold');
  await page.getByRole('button', { name: 'Opdater', exact: true }).click();
  await page.getByRole('button', { name: 'Arbejdsrum', exact: true }).click();
  await page.getByRole('button', { name: 'Åbn fra link', exact: true }).click();
  await page
    .getByLabel('Link til fil eller mappe')
    .fill('https://drive.google.com/file/d/synthetic-file/view');
  page.once('dialog', (dialog) => dialog.dismiss());
  await page.getByRole('button', { name: 'Åbn link', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Åbn link', exact: true })).toBeEnabled();
  await page.route('https://www.googleapis.com/drive/v2/files/synthetic-nonjson?*', (route) =>
    route.fulfill({
      json: {
        id: 'synthetic-nonjson',
        title: 'Syntetisk Google-dokument',
        mimeType: 'application/vnd.google-apps.document',
        etag: '"1"',
        version: '1',
        editable: true,
        labels: { trashed: false },
        parents: [],
      },
    }),
  );
  await page
    .getByLabel('Link til fil eller mappe')
    .fill('https://drive.google.com/file/d/synthetic-nonjson/view');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Åbn link', exact: true }).click();
  await expect(page.getByRole('alert')).toContainText('JSON-datafil');
  await page
    .getByRole('dialog', { name: 'Åbn fra Google Drive-link', exact: true })
    .getByRole('button', { name: 'Luk dialog', exact: true })
    .click();
  await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Syntetisk ugemt hold/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /Lokale ændringer/ })).toBeVisible();
  expect(source.puts).toBe(0);
  expect(source.failures).toEqual([]);
});
