import { expect, test } from '@playwright/test';

test('produktionsbase, assets, dybt hash-link og genindlæsning virker uden Google', async ({ page }) => {
  const failures: string[] = [];
  const errors: string[] = [];
  page.on('response', (response) => { if (response.status() >= 400) failures.push(String(response.status())); });
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('./#/arbejdsrum/syntetisk/hold/syntetisk/spring');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Holdets fælles planlægning');
  await expect(page.getByText('Intet arbejdsrum åbent')).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(new URL(page.url()).hash).toContain('/hold/syntetisk/spring');
  expect(failures).toEqual([]);
  expect(errors).toEqual([]);
});

for (const viewport of [{ width: 1440, height: 900 }, { width: 1024, height: 768 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
  test(`starttilstand ved ${viewport.width}×${viewport.height} uden side-overflow`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto('./');
    await expect(page.getByRole('heading', { name: 'Google-forbindelsen er under opsætning' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.getByRole('link', { name: 'TeamGym Team Manager' }).focus();
    await expect(page.getByRole('link', { name: 'TeamGym Team Manager' })).toBeFocused();
  });
}

test('T01 starter ingen Google-anmodninger uden eksplicit handling', async ({ page }) => {
  const googleRequests: string[] = [];
  page.on('request', (request) => {
    if (/google(?:apis)?\.com/.test(new URL(request.url()).hostname)) googleRequests.push('Google-request');
  });
  await page.goto('./tools/t01/');
  await expect(page.getByRole('heading', { name: 'T01 · Betinget Drive-upload' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Forbind Google-testkonto' })).toBeDisabled();
  await expect(page.getByRole('status')).toContainText(/Google-konfiguration/);
  expect(googleRequests).toEqual([]);
});
