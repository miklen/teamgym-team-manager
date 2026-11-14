import { expect, test } from './test';
import { openWorkspace } from './drive-fixture';

test('udtrykkeligt husket Drive-forbindelse fra start gemmes til genbesøg', async ({ page }) => {
  const source = await openWorkspace(page);
  await page.getByRole('button', { name: 'Arbejdsrum', exact: true }).click();
  await page.getByRole('button', { name: 'Afbryd forbindelse / skift konto' }).click();
  await expect.poll(() => page.evaluate(async () => {
    const request = indexedDB.open('teamgym-team-manager.connection.v1', 1);
    const db = await new Promise<IDBDatabase>((resolve) => { request.onsuccess = () => resolve(request.result); });
    const item = db.transaction('connection').objectStore('connection').get('active');
    const value = await new Promise<boolean>((resolve) => { item.onsuccess = () => resolve(Boolean(item.result.connection)); });
    db.close();
    return value;
  })).toBe(false);
  await page.goto('./');
  await page.getByRole('button', { name: 'Åbn en gemt fil' }).click();
  await page.getByLabel('Husk Google-forbindelsen på denne enhed').check();
  await page.getByRole('button', { name: 'Google Drive', exact: true }).click();
  const picker = page.frameLocator('iframe[title="Google Drive"]');
  await picker.getByRole('button', { name: 'Accepter kun nødvendige' }).click();
  await picker.getByRole('button', { name: 'Vælg', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  const token = await page.evaluate(async () => {
    const request = indexedDB.open('teamgym-team-manager.connection.v1', 1);
    const db = await new Promise<IDBDatabase>((resolve) => { request.onsuccess = () => resolve(request.result); });
    const item = db.transaction('connection').objectStore('connection').get('active');
    const value = await new Promise<string | null>((resolve) => { item.onsuccess = () => resolve(item.result.connection?.token ?? null); });
    db.close();
    return value;
  });
  expect(token).toBe('synthetic-renewed-access');
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Fortsæt, hvor du slap.' })).toBeVisible();
  await page.getByRole('button', { name: /Syntetisk arbejdsrum.json.*Google Drive/ }).click();
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  expect(source.failures).toEqual([]);
});

test('GIS-adapteren skriver og rydder browserlager uden token i URL eller gymnastfil', async ({ page }) => {
  const source = await openWorkspace(page);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Arbejdsrum', exact: true }).click();
  await page.getByRole('button', { name: 'Afbryd forbindelse / skift konto' }).click();
  await page.getByRole('button', { name: 'Forbind til Google Drive' }).click();
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
  expect(stored.token).toBeNull();
  expect(stored.keys).not.toContain('athletes');
  expect(page.url()).not.toContain('access');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Forbind til Google Drive' })).toBeVisible();
  await page.getByRole('button', { name: 'Forbind til Google Drive' }).click();
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Arbejdsrum', exact: true }).click();
  await page.getByRole('button', { name: 'Afbryd forbindelse / skift konto' }).click();
  await expect(page.getByRole('heading', { name: 'Åbn arbejdsrum på Drive' })).toBeVisible();
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
  await second.getByRole('button', { name: 'Opdater' }).click();
  await page.getByRole('button', { name: 'Arbejdsrum', exact: true }).click();
  await page.getByRole('button', { name: 'Afbryd forbindelse / skift konto' }).click();
  await expect(second.getByRole('heading', { name: 'Kladde fra afbrudt forbindelse' })).toBeVisible();
  const download = second.waitForEvent('download');
  await second.getByRole('button', { name: 'Eksportér og luk kladden' }).click();
  expect((await download).suggestedFilename()).toBe('teamgym-kladde.json');
  await expect(second.getByRole('heading', { name: 'Åbn arbejdsrum på Drive' })).toBeVisible();
  await expect(second.getByRole('button', { name: /Kun lokal i fane B/ })).toHaveCount(0);
});

test('afbrudt Google-genforbindelse kan prøves igen uden at miste kladden', async ({ page, googleMock }) => {
  googleMock.failFirstAuthorization = true;
  const source = await openWorkspace(page);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Redigér hold Syntetisk hold A' }).click();
  await page.getByLabel('Holdnavn').fill('Kladde gennem Google-afbrydelse');
  await page.getByRole('button', { name: 'Opdater' }).click();
  source.deny(401);
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByText('Google-adgang udløbet', { exact: true })).toBeVisible();
  source.deny(0);
  await page.getByRole('button', { name: 'Forbind til Google Drive', exact: true }).click();
  await expect(page.getByText(/Google-vinduet blev lukket eller blokeret/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Forbind til Google Drive', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Forbind til Google Drive', exact: true }).click();
  await expect(page.getByText('Syntetisk træner', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Kladde gennem Google-afbrydelse/ })).toBeVisible();
  await page.getByRole('button', { name: 'Fejl · kladde bevaret' }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  expect(source.puts).toBe(1);
  expect(source.workspace.teams[0]!.name).toBe('Kladde gennem Google-afbrydelse');
  expect(source.failures).toEqual([]);
});
