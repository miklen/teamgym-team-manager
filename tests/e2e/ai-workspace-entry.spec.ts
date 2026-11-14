import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './test';
import { openWorkspace } from './drive-fixture';

test('den publicerede skill har læsevenlig formatering og korrekt tegnsæt', async ({ page, request }) => {
  const path = 'teamgym-data-entry/SKILL.md';
  const response = await request.get(path);
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toMatch(/text\/markdown;\s*charset=utf-8/i);
  await page.goto('teamgym-data-entry/index.html');
  await expect(page.getByRole('heading', { name: 'Inddata i TeamGym-arbejdsrum' })).toBeVisible();
  await expect(page.locator('article ol > li')).toHaveCount(4);
  await expect(page.locator('body')).toContainText('Registrér en opstilling');
  await expect(page.locator('body')).not.toContainText('RegistrÃ©r');
  await page.getByRole('link', { name: 'registrering og arv' }).click();
  await expect(page).toHaveURL(/\/teamgym-data-entry\/references\/registration\.html$/);
  await expect(page.getByRole('heading', { name: 'Opslag, registrering og arv · format 7' })).toBeVisible();
  await expect(page.locator('pre code')).toContainText('registration-test-a-bane');
});

test('AI-indgangen bruger kun valgt fil, kopierer starttekst og advarer om ugemt kladde', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: {
      writeText: async (value: string) => { (window as typeof window & { copiedAiText?: string }).copiedAiText = value; },
    } });
  });
  const source = await openWorkspace(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole('button', { name: 'Arbejdsrum', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Arbejdsrum og forbindelse' });
  const ai = dialog.getByText('Inddata med din egen AI-agent');
  await expect(ai).toBeVisible();
  await expect(dialog.getByRole('link', { name: 'Læs inddata-skill' })).toBeHidden();
  await expect(dialog.getByRole('button', { name: 'Gem som…' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'Afbryd forbindelse / skift konto' })).toBeVisible();
  expect(await dialog.evaluate((element) => {
    const saveAs = element.querySelector('.workspace-dialog-primary-actions button')!.getBoundingClientRect();
    const disconnect = element.querySelector('.workspace-dialog-primary-actions button:nth-child(2)')!.getBoundingClientRect();
    const aiSummary = element.querySelector('.ai-workspace-entry summary')!.getBoundingClientRect();
    return saveAs.top < aiSummary.top && disconnect.top < aiSummary.top && disconnect.bottom <= innerHeight &&
      element.querySelector('.dialog-body')!.lastElementChild?.classList.contains('ai-workspace-entry');
  })).toBe(true);
  await page.screenshot({ path: 'tmp/ui-qa/workspace-dialog-1440.png', animations: 'disabled' });
  await ai.focus();
  await ai.press('Enter');
  await expect(dialog.locator('.ai-workspace-entry')).toHaveJSProperty('open', true);
  await expect(dialog.getByText(/Direkte Google-skrivning kan overskrive en samtidig ændring/)).toBeVisible();
  const skill = dialog.getByRole('link', { name: 'Læs inddata-skill' });
  const expectedGuide = new URL('teamgym-data-entry/index.html', page.url()).href;
  await expect(skill).toHaveAttribute('href', expectedGuide);
  await expect(dialog.getByRole('link', { name: 'Åbn den valgte Drive-fil' })).toHaveAttribute('href', 'https://drive.google.com/file/d/synthetic-file/view');
  const start = dialog.getByLabel('Starttekst til din agent');
  const text = await start.inputValue();
  expect(text).toContain((await skill.getAttribute('href'))!.replace('index.html', 'SKILL.md'));
  expect(text).toContain('https://drive.google.com/file/d/synthetic-file/view');
  expect(text).not.toMatch(/synthetic-renewed-access|access_token|other-file|synthetic-folder/);
  await expect(dialog.getByText(/ugemt kladde/)).toHaveCount(0);
  await dialog.getByRole('button', { name: 'Kopiér starttekst' }).click();
  expect(await page.evaluate(() => (window as typeof window & { copiedAiText?: string }).copiedAiText)).toBe(text);
  await dialog.getByRole('button', { name: 'Luk dialog' }).click();
  await page.getByRole('button', { name: 'Opret hold', exact: true }).click();
  await page.getByLabel('Holdnavn').fill('Syntetisk nyt hold');
  await page.getByRole('button', { name: 'Opdater' }).click();
  await page.getByRole('button', { name: 'Arbejdsrum', exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  const mobileDialog = page.getByRole('dialog', { name: 'Arbejdsrum og forbindelse' });
  await expect(mobileDialog.getByRole('button', { name: 'Gem som…' })).toBeVisible();
  expect(await mobileDialog.evaluate((element) => element.scrollWidth <= element.clientWidth && element.querySelector('.workspace-dialog-primary-actions')!.getBoundingClientRect().bottom < innerHeight)).toBe(true);
  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(accessibility.violations).toEqual([]);
  await page.screenshot({ path: 'tmp/ui-qa/workspace-dialog-390.png', animations: 'disabled' });
  await mobileDialog.getByText('Inddata med din egen AI-agent').click();
  await expect(mobileDialog.getByText(/ugemt kladde her/)).toBeVisible();
  await page.screenshot({ path: 'tmp/ui-qa/workspace-dialog-ai-390.png', animations: 'disabled' });
  expect(source.puts).toBe(0);
  expect(source.failures).toEqual([]);
});
