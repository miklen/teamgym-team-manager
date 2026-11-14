import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './test';
import { openWorkspace } from './drive-fixture';

function gate() {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => { release = resolve; });
  return { pending, release };
}

test('første besøg giver tastaturadgang og kun nødvendige egne browserreferencer', async ({ page, context }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const googleRequests: string[] = [];
  page.on('request', (request) => { if (/googleapis|accounts\.google/.test(request.url())) googleRequests.push(request.url()); });
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Planlæg dit hold.' })).toBeVisible();
  await expect(page.getByText('Saml gymnaster, spring og træningsplaner ét sted. Begynd fra bunden, og gem arbejdet som en fil, når du er klar.')).toBeVisible();
  await page.screenshot({ path: 'tmp/ui-qa/start-empty-390.png', animations: 'disabled', fullPage: true });
  expect(await context.cookies()).toEqual([]);
  const storage = await page.evaluate(async () => ({
    local: localStorage.length,
    session: sessionStorage.length,
    databases: (await indexedDB.databases()).map((item) => item.name).sort(),
  }));
  expect(storage.local).toBe(0);
  expect(storage.session).toBe(0);
  expect(storage.databases).toEqual(['teamgym-team-manager.connection.v1', 'teamgym-team-manager.recent.v1']);
  expect(googleRequests).toEqual([]);
  const open = page.getByRole('button', { name: 'Åbn en gemt fil' });
  await open.focus();
  await open.press('Enter');
  await expect(open).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByRole('button', { name: 'Lokal fil' })).toBeVisible();
  const details = page.getByRole('button', { name: 'Sådan opbevares dine data' });
  await details.focus();
  await details.press('Space');
  await expect(details).toHaveAttribute('aria-expanded', 'true');
  await expect(page.getByText(/Browseren kan huske referencer/)).toBeVisible();
  expect(await page.evaluate(() => {
    const buttons = [...document.querySelectorAll('.start-layout button')] as HTMLButtonElement[];
    return buttons.every((button) => button.getBoundingClientRect().height >= 44) &&
      getComputedStyle(document.querySelector('.start-open-options')!).animationDuration === '0s';
  })).toBe(true);
  await page.evaluate(() => { document.documentElement.style.fontSize = '200%'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});

for (const width of [1440, 390]) {
  test(`Seneste-fejl vises i rækken uden at ødelægge startlayoutet ved ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const source = await openWorkspace(page);
    await page.getByRole('button', { name: 'Arbejdsrum', exact: true }).click();
    await page.getByRole('button', { name: 'Til startoverblik' }).click();
    source.deny(403);
    await page.getByRole('button', { name: /Syntetisk arbejdsrum.json.*Google Drive/ }).click();
    await expect(page.getByRole('alert')).toContainText(/adgang|åbnes/i);
    await expect(page.getByRole('heading', { name: 'Fortsæt, hvor du slap.' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `tmp/ui-qa/start-error-${width}.png`, animations: 'disabled', fullPage: true });
    expect(source.failures).toEqual([]);
  });

  test(`almindelig genåbning viser startoverblik uden Google-kald ved ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const source = await openWorkspace(page);
    await page.goto('./');
    await expect(page.getByRole('heading', { name: 'Fortsæt, hvor du slap.' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Start nyt arbejdsrum' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Seneste' })).toBeVisible();
    await expect(page.getByRole('button', { name: /Syntetisk arbejdsrum.json/ }).first()).toBeVisible();
    expect(await page.evaluate(() => {
      const resume = document.querySelector('.start-resume')!.getBoundingClientRect();
      const startNew = document.querySelector('.start-new-quiet')!.getBoundingClientRect();
      return resume.top < startNew.top && getComputedStyle(document.querySelector('.start-resume')!).backgroundColor !== 'rgba(0, 0, 0, 0)';
    })).toBe(true);
    expect(await page.evaluate(() => performance.getEntriesByType('resource').filter((entry) => entry.name.includes('googleapis.com/drive/v2')).length)).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(accessibility.violations).toEqual([]);
    await page.screenshot({ path: `tmp/ui-qa/start-filled-${width}.png`, animations: 'disabled', fullPage: true });
    await page.getByRole('button', { name: /Syntetisk arbejdsrum.json/ }).first().click();
    await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
    expect(source.failures).toEqual([]);
  });

  test(`lange filnavne bevarer fortsæt-handlingen og læsbar rækkefølge ved ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await openWorkspace(page);
    await page.goto('./');
    await expect(page.getByRole('heading', { name: 'Seneste' })).toBeVisible();
    await page.evaluate(async () => {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const request = indexedDB.open('teamgym-team-manager.recent.v1', 1);
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction('recent', 'readwrite');
        const store = tx.objectStore('recent');
        const request = store.getAll();
        request.onsuccess = () => {
          const entry = request.result[0];
          if (!entry) { reject(new Error('Seneste mangler testfilen')); return; }
          store.put({ schemaVersion: 1, id: 'syntetisk-seneste-fil', kind: 'local-fallback', workspaceId: 'synthetic-long-workspace', name: 'Syntetisk træningsplan for juniorholdet med et usædvanligt langt filnavn.json', openedAt: entry.openedAt + 1000 });
          store.put({ ...entry, id: 'syntetisk-anden-fil', fileId: 'synthetic-second', name: 'Syntetisk sæsonoversigt med ekstra langt filnavn og noter.json', openedAt: entry.openedAt - 1000 });
        };
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    });
    await page.goto('./');
    await expect(page.getByRole('heading', { name: 'Fortsæt, hvor du slap.' })).toBeVisible();
    await expect(page.locator('.start-resume')).toContainText('usædvanligt langt filnavn');
    await expect(page.getByRole('heading', { name: 'Andre filer' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `tmp/ui-qa/start-long-${width}.png`, animations: 'disabled', fullPage: true });
  });

  test(`direkte link viser indlæsning gennem langsomme Drive-svar ved ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const source = await openWorkspace(page);
    const account = gate();
    const accountRequested = gate();
    const file = gate();
    const fileRequested = gate();
    await page.route('https://www.googleapis.com/drive/v2/about?*', async (route) => {
      accountRequested.release();
      await account.pending;
      await route.fallback();
    });
    await page.route('https://www.googleapis.com/drive/v2/files/synthetic-file?*', async (route) => {
      if (new URL(route.request().url()).searchParams.get('alt') === 'media') {
        fileRequested.release();
        await file.pending;
      }
      await route.fallback();
    });
    try {
      await page.reload();
      await accountRequested.pending;
      await expect(page.getByRole('region', { name: 'Indlæser arbejdsrum' })).toBeVisible();
      await expect(page.getByRole('heading', { name: 'Planlæg dit hold.' })).toHaveCount(0);
      account.release();
      await fileRequested.pending;
      await expect(page.getByRole('heading', { name: 'Åbner dit arbejdsrum' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Forbind til Google Drive' })).toHaveCount(0);
      file.release();
      await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
      expect(source.failures).toEqual([]);
    } finally { account.release(); file.release(); }
  });
}

test('udløbet adgang i et direkte link viser bevidst genforbindelse', async ({ page }) => {
  const source = await openWorkspace(page);
  source.deny(401);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Forbind til Google Drive' })).toBeEnabled();
  await expect(page.getByRole('heading', { name: 'Planlæg dit hold.' })).toHaveCount(0);
  source.deny(0);
  await page.getByRole('button', { name: 'Forbind til Google Drive' }).click();
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  expect(source.failures).toEqual([]);
});

test('udløbet adgang i Seneste åbner kun den valgte Drive-fil efter nyt brugerklik', async ({ page }) => {
  const source = await openWorkspace(page);
  await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('teamgym-team-manager.connection.v1', 1);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve) => {
      const tx = db.transaction('connection', 'readwrite');
      const store = tx.objectStore('connection');
      const request = store.get('active');
      request.onsuccess = () => {
        const row = request.result;
        row.connection.expiresAt = Date.now() - 1000;
        store.put(row, 'active');
      };
      tx.oncomplete = () => resolve();
    });
    db.close();
  });
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Seneste' })).toBeVisible();
  await page.getByRole('button', { name: /Syntetisk arbejdsrum.json.*Google Drive/ }).click();
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  expect(await page.evaluate(() => 'syntheticTokenOptions' in window)).toBe(true);
  expect(source.failures).toEqual([]);
});
