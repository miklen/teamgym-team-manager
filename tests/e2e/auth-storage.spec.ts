import { expect, test } from './test';
import { openWorkspace } from './drive-fixture';

function tokenOptions() {
  return (window as Window & { syntheticTokenOptions?: { login_hint?: string; prompt?: string } }).syntheticTokenOptions;
}

test('Drive-forbindelse fra start huskes automatisk ved genindlæsning og genbesøg', async ({ page }) => {
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
  await page.getByRole('button', { name: 'Google Drive', exact: true }).click();
  const picker = page.frameLocator('iframe[title="Google Drive"]');
  await picker.getByRole('button', { name: 'Accepter kun nødvendige' }).click();
  expect(await page.evaluate(tokenOptions)).toEqual({ prompt: 'select_account' });
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
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Forbind til Google Drive' })).toHaveCount(0);
  expect(await page.evaluate(tokenOptions)).toBeUndefined();
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Fortsæt, hvor du slap.' })).toBeVisible();
  await page.getByRole('button', { name: /Syntetisk arbejdsrum.json.*Google Drive/ }).click();
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  expect(source.failures).toEqual([]);
});

test('husket konto og fil bevares ved genforbindelse efter udløb og genindlæsning', async ({ page }) => {
  const source = await openWorkspace(page);
  await page.evaluate(async () => {
    const request = indexedDB.open('teamgym-team-manager.connection.v1', 1);
    const db = await new Promise<IDBDatabase>((resolve) => { request.onsuccess = () => resolve(request.result); });
    await new Promise<void>((resolve) => {
      const transaction = db.transaction('connection', 'readwrite');
      const store = transaction.objectStore('connection');
      const item = store.get('active');
      item.onsuccess = () => {
        const row = item.result;
        row.connection.expiresAt = Date.now() - 1;
        store.put(row, 'active');
      };
      transaction.oncomplete = () => resolve();
    });
    db.close();
  });
  await page.reload();
  await expect(page.getByRole('button', { name: 'Forbind til Google Drive' })).toBeEnabled();
  await page.getByRole('button', { name: 'Forbind til Google Drive' }).click();
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  expect(await page.evaluate(tokenOptions)).toEqual({ login_hint: 'coach@example.invalid', prompt: '' });
  const connection = await page.evaluate(async () => {
    const request = indexedDB.open('teamgym-team-manager.connection.v1', 1);
    const db = await new Promise<IDBDatabase>((resolve) => { request.onsuccess = () => resolve(request.result); });
    const item = db.transaction('connection').objectStore('connection').get('active');
    const value = await new Promise<{ token: string | null; fileId: string | null }>((resolve) => {
      item.onsuccess = () => resolve({ token: item.result.connection?.token ?? null, fileId: item.result.connection?.file?.id ?? null });
    });
    db.close();
    return value;
  });
  expect(connection).toEqual({ token: 'synthetic-renewed-access', fileId: 'synthetic-file' });
  await page.reload();
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
  expect(stored.token).toBe('synthetic-renewed-access');
  expect(await page.evaluate(tokenOptions)).toEqual({ prompt: 'select_account' });
  expect(stored.keys).not.toContain('athletes');
  expect(page.url()).not.toContain('access');
  await page.reload();
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

for (const changed of [false, true]) {
  test(`udløb i åben fane og genforbindelse med ${changed ? 'ændret' : 'uændret'} fil`, async ({ page }) => {
    const source = await openWorkspace(page);
    await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
    await page.clock.setFixedTime(Date.now() + 65 * 60_000);
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await expect(page.getByText('Google-adgangen er udløbet. Arbejdsrummet er stadig åbent.')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Uændret', exact: true })).toBeVisible();
    const reload = page.getByRole('button', { name: 'Indlæs nyeste fil' });
    await expect(reload).toHaveCount(0);
    if (changed) {
      const remote = source.workspace;
      remote.teams[0]!.name = 'Ændret på Drive';
      source.external(remote);
    }
    await page.getByRole('button', { name: 'Forbind til Google Drive', exact: true }).click();
    await expect(page.getByText('Syntetisk træner', { exact: true })).toBeVisible();
    if (changed) {
      await expect(reload).toBeEnabled();
      await expect(page.getByRole('button', { name: 'Nyere fil · kladde bevaret' })).toBeVisible();
    } else {
      await expect(reload).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Uændret', exact: true })).toBeVisible();
    }
    await expect(page.getByRole('button', { name: /^Syntetisk hold A/ })).toBeVisible();
    expect(await page.evaluate(tokenOptions)).toEqual({ login_hint: 'coach@example.invalid', prompt: '' });
    expect(source.puts).toBe(0);
    expect(source.failures).toEqual([]);
  });
}

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
  await expect(page.getByRole('button', { name: 'Indlæs nyeste fil' })).toHaveCount(0);
  source.deny(0);
  await page.getByRole('button', { name: 'Forbind til Google Drive', exact: true }).click();
  await expect(page.getByText(/Google-vinduet blev lukket eller blokeret/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Forbind til Google Drive', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Forbind til Google Drive', exact: true }).click();
  await expect(page.getByText('Syntetisk træner', { exact: true })).toBeVisible();
  expect(await page.evaluate(tokenOptions)).toEqual({ login_hint: 'coach@example.invalid', prompt: '' });
  await expect(page.getByRole('button', { name: /^Kladde gennem Google-afbrydelse/ })).toBeVisible();
  await page.getByRole('button', { name: /Lokale ændringer · Gem på Drive/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  expect(source.puts).toBe(1);
  expect(source.workspace.teams[0]!.name).toBe('Kladde gennem Google-afbrydelse');
  expect(source.failures).toEqual([]);
});

test('genforbindelse afviser en anden Google-konto og bevarer det åbne arbejdsrum', async ({ page }) => {
  const source = await openWorkspace(page);
  await page.getByRole('button', { name: 'Redigér hold Syntetisk hold A' }).click();
  await page.getByLabel('Holdnavn').fill('Kladde ved kontovalg');
  await page.getByRole('button', { name: 'Opdater' }).click();
  source.deny(401);
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByText('Google-adgang udløbet', { exact: true })).toBeVisible();
  source.deny(0);
  const aboutUrl = 'https://www.googleapis.com/drive/v2/about?*';
  await page.route(aboutUrl, (route) => route.fulfill({
    json: { user: { permissionId: 'other-coach', emailAddress: 'other@example.invalid', displayName: 'Anden træner' } },
  }));
  const connect = page.getByRole('button', { name: 'Forbind til Google Drive', exact: true });
  await connect.click();
  await expect(page.getByText(/Forbind med coach@example.invalid/)).toBeVisible();
  expect(await page.evaluate(tokenOptions)).toEqual({ login_hint: 'coach@example.invalid', prompt: '' });
  await expect(page.getByRole('button', { name: /^Kladde ved kontovalg/ })).toBeVisible();

  await page.unroute(aboutUrl);
  await connect.click();
  await expect(page.getByText('Syntetisk træner', { exact: true })).toBeVisible();
  expect(await page.evaluate(tokenOptions)).toEqual({ login_hint: 'coach@example.invalid', prompt: '' });
  await expect(page.getByRole('button', { name: /^Kladde ved kontovalg/ })).toBeVisible();
  expect(source.puts).toBe(0);
  expect(source.failures).toEqual([]);
});
