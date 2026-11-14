import { expect, test } from './test';
import { createWorkspace, renameTeam, serializeWorkspace } from '@teamgym/domain';
import { readFile } from 'node:fs/promises';
import { openWorkspace } from './drive-fixture';

test('første kladde kan redigeres, annulleres og hentes som lokal fil uden Google', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'showSaveFilePicker', { value: undefined });
    Object.defineProperty(window, 'showOpenFilePicker', { value: undefined });
  });
  const googleRequests: string[] = [];
  page.on('request', (request) => { if (/googleapis|accounts\.google/.test(request.url())) googleRequests.push(request.url()); });
  await page.goto('./');
  await expect(page.getByRole('heading', { name: 'Planlæg dit hold.' })).toBeVisible();
  await page.getByRole('button', { name: 'Start fra bunden' }).click();
  await page.getByRole('button', { name: 'Opret hold', exact: true }).click();
  await page.getByLabel('Holdnavn').fill('Syntetisk lokalhold');
  await page.getByRole('button', { name: 'Opdater' }).click();
  await page.getByRole('button', { name: /Lokale ændringer.*Vælg placering/ }).click();
  await expect(page.getByRole('dialog', { name: 'Gem arbejdsrummet' })).toBeVisible();
  await page.getByRole('button', { name: 'Annuller' }).click();
  await expect(page.getByRole('button', { name: /Syntetisk lokalhold Junior/ })).toBeVisible();
  await page.getByRole('button', { name: /Lokale ændringer.*Vælg placering/ }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Gem som lokal fil' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('teamgym-arbejdsrum.json');
  await expect(page.getByText(/En kopi er hentet/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Lokale ændringer/ })).toBeVisible();
  expect(googleRequests).toEqual([]);
});

test('ugyldig lokal fil erstatter ikke en åben kladde', async ({ page }) => {
  await page.addInitScript(() => { Object.defineProperty(window, 'showOpenFilePicker', { value: undefined }); });
  await page.goto('./');
  await page.getByRole('button', { name: 'Start fra bunden' }).click();
  await page.getByRole('button', { name: 'Opret hold', exact: true }).click();
  await page.getByLabel('Holdnavn').fill('Syntetisk beholdt');
  await page.getByRole('button', { name: 'Opdater' }).click();
  await page.getByRole('button', { name: 'Arbejdsrum', exact: true }).click();
  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByRole('button', { name: 'Åbn lokal fil' }).click();
  await page.locator('input[type="file"]').setInputFiles({ name: 'forkert.json', mimeType: 'application/json', buffer: Buffer.from('{') });
  await expect(page.getByText(/ugyldig JSON/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Syntetisk beholdt Junior/ })).toBeVisible();
});

test('filhåndtag gemmer i samme lokale fil og genåbnes fra Seneste', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => {
    Object.defineProperty(window, 'showSaveFilePicker', {
      value: async () => (await navigator.storage.getDirectory()).getFileHandle('syntetisk-opfs.json', { create: true }),
    });
  });
  await page.getByRole('button', { name: 'Start fra bunden' }).click();
  await page.getByRole('button', { name: 'Opret hold', exact: true }).click();
  await page.getByLabel('Holdnavn').fill('Syntetisk OPFS');
  await page.getByRole('button', { name: 'Opdater' }).click();
  await page.getByRole('button', { name: /Lokale ændringer.*Vælg placering/ }).click();
  await page.getByRole('button', { name: 'Gem som lokal fil' }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  const stored = await page.evaluate(async () => JSON.parse(await (await (await navigator.storage.getDirectory()).getFileHandle('syntetisk-opfs.json')).getFile().then((file) => file.text())));
  expect(stored.teams[0].name).toBe('Syntetisk OPFS');
  await page.getByRole('button', { name: 'Arbejdsrum', exact: true }).click();
  await page.getByRole('button', { name: 'Til startoverblik' }).click();
  await expect(page.getByRole('heading', { name: 'Seneste' })).toBeVisible();
  await page.getByRole('button', { name: /syntetisk-opfs.json.*Lokal fil/ }).click();
  await expect(page.getByRole('button', { name: /Syntetisk OPFS Junior/ })).toBeVisible();
});

test('Vælg fil igen afviser forkert arbejdsrum og bevarer en åben kladde', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(window, 'showSaveFilePicker', { value: undefined });
    Object.defineProperty(window, 'showOpenFilePicker', { value: undefined });
  });
  await page.goto('./');
  await page.getByRole('button', { name: 'Start fra bunden' }).click();
  await page.getByRole('button', { name: 'Opret hold', exact: true }).click();
  await page.getByLabel('Holdnavn').fill('Syntetisk bevaret kladde');
  await page.getByRole('button', { name: 'Opdater' }).click();
  await page.getByRole('button', { name: /Lokale ændringer.*Vælg placering/ }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Gem som lokal fil' }).click();
  const download = await downloadPromise;
  const bytes = await readFile(await download.path());
  await page.getByRole('button', { name: 'Arbejdsrum', exact: true }).click();
  await page.getByText('Seneste filer', { exact: false }).click();
  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByRole('button', { name: /teamgym-arbejdsrum.json.*Vælg fil igen/ }).click();
  await page.locator('input[type="file"]').setInputFiles({ name: 'forkert.json', mimeType: 'application/json', buffer: Buffer.from(serializeWorkspace(createWorkspace())) });
  await expect(page.getByText(/andet arbejdsrum/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Syntetisk bevaret kladde Junior/ })).toBeVisible();
  await page.getByRole('button', { name: 'Arbejdsrum', exact: true }).click();
  await page.getByText('Seneste filer', { exact: false }).click();
  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByRole('button', { name: /teamgym-arbejdsrum.json.*Vælg fil igen/ }).click();
  await page.locator('input[type="file"]').setInputFiles({ name: 'teamgym-arbejdsrum.json', mimeType: 'application/json', buffer: bytes });
  await expect(page.getByRole('button', { name: /Syntetisk bevaret kladde Junior/ })).toBeVisible();
});

test('manglende Drive-adgang fra Seneste bevarer den åbne kladde', async ({ page }) => {
  const source = await openWorkspace(page);
  await page.getByRole('button', { name: /Redigér hold/ }).first().click();
  await page.getByLabel('Holdnavn').fill('Syntetisk ændret hold');
  await page.getByRole('button', { name: 'Opdater' }).click();
  await page.route('https://www.googleapis.com/drive/v2/files/synthetic-file?*', (route) => route.fulfill({ status: 403 }));
  await page.getByRole('button', { name: 'Arbejdsrum', exact: true }).click();
  await page.getByText('Seneste filer', { exact: false }).click();
  page.once('dialog', (dialog) => void dialog.accept());
  await page.getByRole('button', { name: /Syntetisk arbejdsrum.json.*Google Drive/ }).click();
  await expect(page.getByRole('alert')).toContainText(/adgang|tilladelse/i);
  await page.getByRole('button', { name: 'Luk dialog' }).click();
  await expect(page.getByRole('button', { name: /Syntetisk ændret hold Junior/ })).toBeVisible();
  expect(source.puts).toBe(0);
});

test('ekstern ændring og slettet lokal fil standser Gem uden at miste kladden', async ({ page }) => {
  const original = serializeWorkspace(createWorkspace());
  await page.goto('./');
  await page.evaluate(async (bytes) => {
    const root = await navigator.storage.getDirectory();
    const handle = await root.getFileHandle('syntetisk-ekstern.json', { create: true });
    const writer = await handle.createWritable();
    await writer.write(bytes);
    await writer.close();
    Object.defineProperty(window, 'showOpenFilePicker', { value: async () => [handle] });
  }, original);
  await page.getByRole('button', { name: 'Åbn en gemt fil' }).click();
  await page.getByRole('button', { name: 'Lokal fil' }).click();
  await page.getByRole('button', { name: 'Opret hold', exact: true }).click();
  await page.getByLabel('Holdnavn').fill('Syntetisk uskrevet');
  await page.getByRole('button', { name: 'Opdater' }).click();
  const external = serializeWorkspace(createWorkspace());
  await page.evaluate(async (bytes) => {
    const handle = await (await navigator.storage.getDirectory()).getFileHandle('syntetisk-ekstern.json');
    const writer = await handle.createWritable();
    await writer.write(bytes);
    await writer.close();
  }, external);
  await page.getByRole('button', { name: /Lokale ændringer.*Gem lokal fil/ }).click();
  await expect(page.getByText(/ændret uden for appen/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Syntetisk uskrevet Junior/ })).toBeVisible();
  expect(await page.evaluate(async () => (await (await (await navigator.storage.getDirectory()).getFileHandle('syntetisk-ekstern.json')).getFile()).text())).toBe(external);
  await page.evaluate(async () => { await (await navigator.storage.getDirectory()).removeEntry('syntetisk-ekstern.json'); });
  await page.getByRole('button', { name: /Nyere fil.*kladde bevaret/ }).click();
  await expect(page.getByText(/lokale fil blev ikke fundet/)).toBeVisible();
  await expect(page.getByRole('button', { name: /Syntetisk uskrevet Junior/ })).toBeVisible();
});

test('annulleret lokal filvælger bevarer første kladde', async ({ page }) => {
  await page.goto('./');
  await page.evaluate(() => { Object.defineProperty(window, 'showSaveFilePicker', { value: async () => { throw new DOMException('cancelled', 'AbortError'); } }); });
  await page.getByRole('button', { name: 'Start fra bunden' }).click();
  await page.getByRole('button', { name: /Lokale ændringer.*Vælg placering/ }).click();
  await page.getByRole('button', { name: 'Gem som lokal fil' }).click();
  await expect(page.getByRole('dialog', { name: 'Gem arbejdsrummet' })).toBeVisible();
  await page.getByRole('button', { name: 'Annuller' }).click();
  await expect(page.getByRole('button', { name: /Lokale ændringer.*Vælg placering/ })).toBeVisible();
});

test('flyttet lokal fil fra Seneste kan fjernes uden at oprette en erstatning', async ({ page }) => {
  const original = serializeWorkspace(createWorkspace());
  await page.goto('./');
  await page.evaluate(async (bytes) => {
    const root = await navigator.storage.getDirectory();
    const handle = await root.getFileHandle('syntetisk-flyttet.json', { create: true });
    const writer = await handle.createWritable();
    await writer.write(bytes);
    await writer.close();
    Object.defineProperty(window, 'showOpenFilePicker', { value: async () => [handle] });
  }, original);
  await page.getByRole('button', { name: 'Åbn en gemt fil' }).click();
  await page.getByRole('button', { name: 'Lokal fil' }).click();
  await page.getByRole('button', { name: 'Arbejdsrum', exact: true }).click();
  await page.getByRole('button', { name: 'Til startoverblik' }).click();
  await page.evaluate(async () => { await (await navigator.storage.getDirectory()).removeEntry('syntetisk-flyttet.json'); });
  await page.getByRole('button', { name: /syntetisk-flyttet.json.*Lokal fil/ }).click();
  await expect(page.getByRole('alert')).toContainText(/ikke fundet/);
  await page.getByRole('button', { name: 'Fjern syntetisk-flyttet.json fra Seneste' }).click();
  await expect(page.getByRole('heading', { name: 'Seneste' })).toHaveCount(0);
  expect(await page.evaluate(async () => { try { await (await navigator.storage.getDirectory()).getFileHandle('syntetisk-flyttet.json'); return true; } catch { return false; } })).toBe(false);
});

test('Gem som kopierer Drive til lokal fil og tilbage til en ny Drive-fil uden at ændre kilden', async ({ page }) => {
  const source = await openWorkspace(page);
  const driveBefore = JSON.stringify(source.workspace);
  await page.evaluate(() => {
    Object.defineProperty(window, 'showSaveFilePicker', {
      value: async () => (await navigator.storage.getDirectory()).getFileHandle('syntetisk-drive-kopi.json', { create: true }),
    });
  });
  await page.getByRole('button', { name: 'Arbejdsrum', exact: true }).click();
  await page.getByRole('button', { name: 'Gem som…' }).click();
  await page.getByRole('button', { name: 'Gem som lokal fil' }).click();
  await expect(page.getByRole('contentinfo').getByText('syntetisk-drive-kopi.json')).toBeVisible();
  expect(JSON.stringify(source.workspace)).toBe(driveBefore);
  const localBefore = await page.evaluate(async () => (await (await (await navigator.storage.getDirectory()).getFileHandle('syntetisk-drive-kopi.json')).getFile()).text());
  expect(JSON.parse(localBefore).format).toBe('teamgym-local-copy');
  await page.getByRole('button', { name: 'Arbejdsrum', exact: true }).click();
  await page.getByRole('button', { name: 'Gem som…' }).click();
  await page.getByRole('button', { name: 'Gem i Google Drive' }).click();
  await page.getByLabel('Arbejdsrummets navn').fill('Syntetisk ny Drive-fil');
  await page.getByRole('button', { name: 'Vælg mappe og opret JSON-fil' }).click();
  const picker = page.frameLocator('iframe[title="Google Drive"]');
  await picker.getByRole('button', { name: 'Accepter kun nødvendige' }).click();
  await picker.getByRole('button', { name: 'Vælg', exact: true }).click();
  await expect(page.getByRole('contentinfo').getByText('Syntetisk ny Drive-fil.json')).toBeVisible();
  expect(source.created?.workspace.workspaceId).toBe(source.workspace.workspaceId);
  expect(JSON.stringify(source.workspace)).toBe(driveBefore);
  expect(await page.evaluate(async () => (await (await (await navigator.storage.getDirectory()).getFileHandle('syntetisk-drive-kopi.json')).getFile()).text())).toBe(localBefore);
  expect(source.failures).toEqual([]);
});

test('annulleret og uklart Gem som bevarer den aktive Drive-fil og kladden', async ({ page }) => {
  const source = await openWorkspace(page);
  const before = JSON.stringify(source.workspace);
  await page.evaluate(() => { Object.defineProperty(window, 'showSaveFilePicker', { value: async () => { throw new DOMException('cancelled', 'AbortError'); } }); });
  await page.getByRole('button', { name: 'Arbejdsrum', exact: true }).click();
  await page.getByRole('button', { name: 'Gem som…' }).click();
  await page.getByRole('button', { name: 'Gem som lokal fil' }).click();
  await expect(page.getByRole('dialog', { name: 'Gem arbejdsrummet' })).toBeVisible();
  await page.route('https://www.googleapis.com/upload/drive/v2/files?*', (route) => route.fulfill({ json: {} }));
  await page.getByRole('button', { name: 'Gem i Google Drive' }).click();
  await page.getByLabel('Arbejdsrummets navn').fill('Syntetisk uklart');
  await page.getByLabel('Link til mappe (valgfrit)').fill('https://drive.google.com/drive/folders/synthetic-folder');
  await page.getByRole('button', { name: 'Opret arbejdsrum i mappen' }).click();
  await expect(page.getByRole('alert')).toContainText(/intet fil-id/);
  expect(JSON.stringify(source.workspace)).toBe(before);
  expect(source.creates).toBe(0);
  await page.getByRole('button', { name: 'Luk dialog' }).click();
  await expect(page.getByRole('contentinfo').getByText('Syntetisk arbejdsrum.json')).toBeVisible();
});

test('Overskriv advarer om anden arbejdsrumsidentitet og skriver kun til valgt Drive-fil', async ({ page }) => {
  const source = await openWorkspace(page);
  const previousId = source.workspace.workspaceId;
  await page.getByRole('button', { name: 'Arbejdsrum', exact: true }).click();
  await page.getByRole('button', { name: 'Til startoverblik' }).click();
  await page.getByRole('button', { name: 'Start nyt arbejdsrum' }).click();
  await page.getByRole('button', { name: /Lokale ændringer.*Vælg placering/ }).click();
  await page.getByRole('button', { name: 'Vælg eksisterende Drive-fil…' }).click();
  const picker = page.frameLocator('iframe[title="Google Drive"]');
  await picker.getByRole('button', { name: 'Accepter kun nødvendige' }).click();
  await picker.getByRole('button', { name: 'Vælg', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Erstat Drive-fil?' })).toBeVisible();
  await expect(page.getByText(/Målfilen er et andet arbejdsrum/)).toBeVisible();
  await expect(page.getByText(/synthetic-file/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Gennemgå og flet' })).toHaveCount(0);
  expect(source.puts).toBe(0);
  await page.getByRole('button', { name: 'Overskriv valgt fil' }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  expect(source.puts).toBe(1);
  expect(source.workspace.workspaceId).not.toBe(previousId);
  expect(source.failures).toEqual([]);
});

test('en nyere målversion under Overskriv bevarer både Drive-ændringen og lokal kopi', async ({ page }) => {
  const source = await openWorkspace(page);
  await page.evaluate(() => {
    Object.defineProperty(window, 'showSaveFilePicker', {
      value: async () => (await navigator.storage.getDirectory()).getFileHandle('syntetisk-kaplob.json', { create: true }),
    });
  });
  await page.getByRole('button', { name: 'Arbejdsrum', exact: true }).click();
  await page.getByRole('button', { name: 'Gem som…' }).click();
  await page.getByRole('button', { name: 'Gem som lokal fil' }).click();
  await expect(page.getByRole('contentinfo').getByText('syntetisk-kaplob.json')).toBeVisible();
  const localBefore = await page.evaluate(async () => (await (await (await navigator.storage.getDirectory()).getFileHandle('syntetisk-kaplob.json')).getFile()).text());
  await page.getByRole('button', { name: 'Arbejdsrum', exact: true }).click();
  await page.getByRole('button', { name: 'Gem som…' }).click();
  await page.getByRole('button', { name: 'Vælg eksisterende Drive-fil…' }).click();
  const picker = page.frameLocator('iframe[title="Google Drive"]');
  await picker.getByRole('button', { name: 'Accepter kun nødvendige' }).click();
  await picker.getByRole('button', { name: 'Vælg', exact: true }).click();
  await expect(page.getByRole('dialog', { name: 'Erstat Drive-fil?' })).toBeVisible();
  let raced = false;
  await page.route('https://www.googleapis.com/upload/drive/v2/files/synthetic-file?*', async (route) => {
    if (!raced) { source.external(createWorkspace()); raced = true; }
    await route.fallback();
  });
  await page.getByRole('button', { name: 'Overskriv valgt fil' }).click();
  await expect(page.getByRole('status')).toContainText('En nyere fil findes på Drive. Din kladde er bevaret.');
  expect(source.puts).toBe(1);
  expect(source.workspace.workspaceId).not.toBe(JSON.parse(localBefore).workspace.workspaceId);
  expect(await page.evaluate(async () => (await (await (await navigator.storage.getDirectory()).getFileHandle('syntetisk-kaplob.json')).getFile()).text())).toBe(localBefore);
  await expect(page.getByRole('contentinfo').getByText('syntetisk-kaplob.json')).toBeVisible();
});

test('lokal Drive-kopi fletter uafhængige ændringer før særskilt Drive-gemning', async ({ page }) => {
  const source = await openWorkspace(page);
  await page.evaluate(() => {
    Object.defineProperty(window, 'showSaveFilePicker', {
      value: async () => (await navigator.storage.getDirectory()).getFileHandle('syntetisk-flettekopi.json', { create: true }),
    });
  });
  await page.getByRole('button', { name: 'Arbejdsrum', exact: true }).click();
  await page.getByRole('button', { name: 'Gem som…' }).click();
  await page.getByRole('button', { name: 'Gem som lokal fil' }).click();
  await expect(page.getByRole('contentinfo')).toContainText('syntetisk-flettekopi.json');
  const localBefore = await page.evaluate(async () => (await (await (await navigator.storage.getDirectory()).getFileHandle('syntetisk-flettekopi.json')).getFile()).text());
  await page.getByRole('button', { name: 'Redigér hold Syntetisk hold A' }).click();
  await page.getByLabel('Holdnavn').fill('Lokalt navn');
  await page.getByRole('button', { name: 'Opdater', exact: true }).click();
  source.external(renameTeam(source.workspace, source.workspace.teams[1]!.id, 'Navn på Drive'));
  await page.getByRole('button', { name: 'Arbejdsrum', exact: true }).click();
  await page.getByRole('button', { name: 'Gem som…' }).click();
  await page.getByRole('button', { name: 'Vælg eksisterende Drive-fil…' }).click();
  const picker = page.frameLocator('iframe[title="Google Drive"]');
  await picker.getByRole('button', { name: 'Accepter kun nødvendige' }).click();
  await picker.getByRole('button', { name: 'Vælg', exact: true }).click();
  await page.getByRole('button', { name: 'Gennemgå og flet' }).click();
  await expect(page.getByText('Disse ændringer passer sammen.')).toBeVisible();
  expect(source.puts).toBe(0);
  await page.getByRole('button', { name: 'Brug disse ændringer' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect(page.getByRole('button', { name: /^Lokalt navn/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Navn på Drive/ })).toBeVisible();
  expect(source.puts).toBe(0);
  expect(await page.evaluate(async () => (await (await (await navigator.storage.getDirectory()).getFileHandle('syntetisk-flettekopi.json')).getFile()).text())).toBe(localBefore);
  await page.getByRole('button', { name: /Lokale ændringer.*Gem på Drive/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  expect(source.puts).toBe(1);
  expect(source.workspace.teams.map((team) => team.name)).toContain('Lokalt navn');
  expect(source.workspace.teams.map((team) => team.name)).toContain('Navn på Drive');
  expect(source.failures).toEqual([]);
});
