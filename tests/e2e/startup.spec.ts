import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './test';
import { openWorkspace } from './drive-fixture';

function gate() {
  let release!: () => void;
  const pending = new Promise<void>((resolve) => {
    release = resolve;
  });
  return { pending, release };
}

for (const width of [1440, 390]) {
  test(`husket forbindelse viser kun indlæsning gennem langsomme Drive-svar ved ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const source = await openWorkspace(page);
    await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
    const account = gate();
    const accountRequested = gate();
    const file = gate();
    const fileRequested = gate();
    let reads = 0;
    await page.route('https://www.googleapis.com/drive/v2/about?*', async (route) => {
      accountRequested.release();
      await account.pending;
      await route.fallback();
    });
    await page.route('https://www.googleapis.com/drive/v2/files/synthetic-file?*', async (route) => {
      if (new URL(route.request().url()).searchParams.get('alt') === 'media') {
        reads++;
        fileRequested.release();
        await file.pending;
      }
      await route.fallback();
    });
    await page.addInitScript(() => {
      const state = window as typeof window & { syntheticConnectFlash?: boolean };
      state.syntheticConnectFlash = false;
      new MutationObserver(() => {
        if (
          [...document.querySelectorAll('button')].some(
            (button) => button.textContent?.trim() === 'Forbind til Google Drive',
          )
        )
          state.syntheticConnectFlash = true;
      }).observe(document, { childList: true, subtree: true, characterData: true });
    });
    try {
      if (width === 1440) await page.goto('./');
      else await page.reload();
      await accountRequested.pending;
      await expect(
        page.getByRole('heading', { name: 'Forbinder til Google Drive', exact: true }),
      ).toBeVisible();
      await expect(page.getByRole('button', { name: 'Forbind til Google Drive', exact: true })).toHaveCount(
        0,
      );
      await expect(page.getByRole('heading', { name: 'Holdets fælles planlægning' })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Arbejdsrum', exact: true })).toBeDisabled();
      account.release();
      await fileRequested.pending;
      await expect(page.getByRole('heading', { name: 'Åbner dit arbejdsrum' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Forbind til Google Drive', exact: true })).toHaveCount(
        0,
      );
      await expect(page.getByRole('button', { name: 'Vælg eksisterende arbejdsrum' })).toHaveCount(0);
      const accessibility = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(accessibility.violations).toEqual([]);
      await page.emulateMedia({ reducedMotion: 'reduce' });
      expect(
        await page
          .locator('.startup-emblem')
          .evaluate((node) => getComputedStyle(node, '::after').animationName),
      ).toBe('none');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await page.screenshot({ path: `tmp/ui-qa/drive-opstart-${width}.png`, animations: 'disabled' });
      file.release();
      await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
      expect(reads).toBe(1);
      expect(
        await page.evaluate(
          () => (window as typeof window & { syntheticConnectFlash: boolean }).syntheticConnectFlash,
        ),
      ).toBe(false);
      expect(await page.evaluate(() => 'syntheticTokenOptions' in window)).toBe(false);
      expect(source.failures).toEqual([]);
      expect(source.puts).toBe(0);
    } finally {
      account.release();
      file.release();
    }
  });
}

test('udløbet husket adgang afslutter indlæsning og tilbyder bevidst genforbindelse', async ({ page }) => {
  const source = await openWorkspace(page);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  source.deny(401);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Forbind til Google Drive', exact: true })).toBeEnabled();
  await expect(page.getByRole('region', { name: 'Indlæser arbejdsrum' })).toHaveCount(0);
  expect(await page.evaluate(() => 'syntheticTokenOptions' in window)).toBe(false);
  source.deny(0);
  await page.getByRole('button', { name: 'Forbind til Google Drive', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  expect(source.failures).toEqual([]);
});

test('afvist fil stopper indlæsningen og lader den forbundne konto vælge en anden fil', async ({ page }) => {
  await openWorkspace(page);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.route('https://www.googleapis.com/drive/v2/files/synthetic-file?*', (route) =>
    route.fulfill({ status: 403 }),
  );
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Åbn holdets arbejdsrum' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Vælg eksisterende arbejdsrum' })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Forbind til Google Drive', exact: true })).toHaveCount(0);
  await expect(page.getByRole('region', { name: 'Indlæser arbejdsrum' })).toHaveCount(0);
});
