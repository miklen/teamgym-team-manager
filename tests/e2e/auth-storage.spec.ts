import { expect, test } from '@playwright/test';
import { openWorkspace } from './drive-fixture';

test('GIS-adapteren skriver og rydder browserlager uden token i URL eller gymnastfil', async ({ page }) => {
  const source = await openWorkspace(page);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.route('https://accounts.google.com/gsi/client', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `window.google = { accounts: { oauth2: { initTokenClient: (configuration) => ({ requestAccessToken: (options) => { window.syntheticTokenOptions = options; configuration.callback({ access_token: 'synthetic-renewed-access', expires_in: '3600', scope: 'https://www.googleapis.com/auth/drive.file' }); } }), hasGrantedAllScopes: () => true, revoke: (_, done) => done() } } };`,
    }),
  );
  await page.route('https://apis.google.com/js/api.js', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: 'window.gapi = { load: (_, options) => options.callback() };',
    }),
  );
  await page.getByRole('button', { name: 'Arbejdsrum', exact: true }).click();
  await page.getByRole('button', { name: 'Afbryd forbindelse / skift konto' }).click();
  await page.getByRole('button', { name: 'Klargør Google-forbindelse' }).click();
  await page.getByRole('button', { name: 'Fortsæt med Google' }).click();
  await expect(page.getByText('Syntetisk træner', { exact: true })).toBeVisible();
  const stored = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve) => {
      const request = indexedDB.open('teamgym-team-manager.connection.v1', 1);
      request.onsuccess = () => resolve(request.result);
    });
    return new Promise<{ token: string | null; keys: string[] }>((resolve) => {
      const request = db.transaction('connection').objectStore('connection').get('active');
      request.onsuccess = () => {
        const connection = request.result.connection;
        resolve({ token: connection?.token ?? null, keys: Object.keys(connection ?? {}) });
        db.close();
      };
    });
  });
  expect(stored.token).toBe('synthetic-renewed-access');
  expect(stored.keys).not.toContain('athletes');
  expect(page.url()).not.toContain('access');
  await page.reload();
  await expect(page.getByText('Syntetisk træner', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Åbn holdets arbejdsrum' })).toBeVisible();
  await page.getByRole('button', { name: 'Arbejdsrum', exact: true }).click();
  await page.getByRole('button', { name: 'Afbryd forbindelse / skift konto' }).click();
  await expect(page.getByRole('heading', { name: 'Forbind din Google-konto' })).toBeVisible();
  expect(source.workspace.athletes).toHaveLength(8);
  expect(source.puts).toBe(0);
  expect(source.failures).toEqual([]);
});

test('afbrydelse i anden fane lukker arbejdsrummet og isolerer ugemt kladde til eksport', async ({
  page,
  context,
}) => {
  await openWorkspace(page);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  const second = await context.newPage();
  await openWorkspace(second);
  await expect(second.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await second.getByRole('button', { name: 'Redigér hold Syntetisk hold A' }).click();
  await second.getByLabel('Holdnavn').fill('Kun lokal i fane B');
  await second.getByRole('button', { name: 'Anvend i kladde' }).click();
  await page.getByRole('button', { name: 'Arbejdsrum', exact: true }).click();
  await page.getByRole('button', { name: 'Afbryd forbindelse / skift konto' }).click();
  await expect(second.getByRole('heading', { name: 'Kladde fra afbrudt forbindelse' })).toBeVisible();
  const download = second.waitForEvent('download');
  await second.getByRole('button', { name: 'Eksportér og luk kladden' }).click();
  expect((await download).suggestedFilename()).toBe('teamgym-kladde.json');
  await expect(second.getByRole('heading', { name: 'Forbind din Google-konto' })).toBeVisible();
  await expect(second.getByRole('button', { name: /Kun lokal i fane B/ })).toHaveCount(0);
});

test('afbrudt Google-genforbindelse kan prøves igen uden at miste kladden', async ({ page }) => {
  const source = await openWorkspace(page);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Redigér hold Syntetisk hold A' }).click();
  await page.getByLabel('Holdnavn').fill('Kladde gennem Google-afbrydelse');
  await page.getByRole('button', { name: 'Anvend i kladde' }).click();
  source.deny(401);
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByText('Google-adgang udløbet', { exact: true })).toBeVisible();
  source.deny(0);
  await page.route('https://accounts.google.com/gsi/client', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: `let attempts = 0; window.google = { accounts: { oauth2: { initTokenClient: (configuration) => ({ requestAccessToken: () => { attempts++; if (attempts === 1) configuration.error_callback({ type: 'popup_closed' }); else configuration.callback({ access_token: 'synthetic-reconnected-access', expires_in: '3600', scope: 'https://www.googleapis.com/auth/drive.file' }); } }), hasGrantedAllScopes: () => true, revoke: (_, done) => done() } } };`,
    }),
  );
  await page.route('https://apis.google.com/js/api.js', (route) =>
    route.fulfill({
      contentType: 'application/javascript',
      body: 'window.gapi = { load: (_, options) => options.callback() };',
    }),
  );
  await page.getByRole('button', { name: 'Klargør Google', exact: true }).click();
  await page.getByRole('button', { name: 'Fortsæt med Google', exact: true }).click();
  await expect(page.getByText(/Google-vinduet blev lukket eller blokeret/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Fortsæt med Google', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Fortsæt med Google', exact: true }).click();
  await expect(page.getByText('Syntetisk træner', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Kladde gennem Google-afbrydelse/ })).toBeVisible();
  await page.getByRole('button', { name: 'Fejl · kladde bevaret' }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  expect(source.puts).toBe(1);
  expect(source.workspace.teams[0]!.name).toBe('Kladde gennem Google-afbrydelse');
  expect(source.failures).toEqual([]);
});
