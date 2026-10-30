import { bindingFingerprint } from '@teamgym/domain';
import { syntheticWorkspace } from '../fixtures/synthetic-workspace';
import { openWorkspace } from './drive-fixture';
import { expect, test } from './test';

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`åben regelusikkerhed kan læses ved ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    const workspace = syntheticWorkspace().workspace;
    workspace.teams[0]!.rulesetBinding.packageVersion = '1.0.0';
    workspace.plans[0]!.bindingFingerprint = bindingFingerprint(workspace.teams[0]!.rulesetBinding);
    await openWorkspace(page, workspace);
    await page.getByRole('link', { name: 'Springplan', exact: true }).click();
    const note = page.locator('.analysis-strip .rule-uncertainty').last();
    await expect(note.locator('.rule-uncertainty-mark')).toBeVisible();
    expect((await page.locator('.analysis-strip').boundingBox())?.height ?? 0).toBeLessThan(200);
    expect((await note.boundingBox())?.width ?? 0).toBeLessThan(28);
    await note.locator('summary').click();
    await expect(note.locator('.rule-uncertainty-popover')).toContainText('Regelteksten giver 0,10');
    const popover = await note.locator('.rule-uncertainty-popover').boundingBox();
    expect(popover!.x).toBeGreaterThanOrEqual(8);
    expect(popover!.x + popover!.width).toBeLessThanOrEqual(viewport.width - 8);
    expect((await page.locator('.analysis-strip').boundingBox())?.height ?? 0).toBeLessThan(200);
    await page.screenshot({
      path: testInfo.outputPath(`regelusikkerhed-${viewport.width}.png`),
      fullPage: true,
    });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  });
}

test('ældre hold får et tydeligt spor til regelpakkens rettelser', async ({ page }) => {
  await openWorkspace(page);
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  await expect(
    page.getByText('Regelpakke 1.0.0 · en opdatering med rettelser findes under Reglement.'),
  ).toBeVisible();
});

test('tom springplan har hverken stort advarselsfelt eller for tidlig regeltrekant', async ({ page }) => {
  const workspace = syntheticWorkspace().workspace;
  for (const round of workspace.plans[0]!.tumbling[0]!.rounds) round.entries = [];
  await openWorkspace(page, workspace);
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  await expect(page.locator('.analysis-strip .rule-uncertainty')).toHaveCount(0);
  expect((await page.locator('.analysis-strip').boundingBox())?.height ?? 0).toBeLessThan(200);
});

test('DK 1.1 viser det afklarede elementtillæg uden Q01-trekant', async ({ page }) => {
  const workspace = syntheticWorkspace().workspace;
  workspace.teams[0]!.rulesetBinding.packageVersion = '1.1.0';
  workspace.plans[0]!.bindingFingerprint = bindingFingerprint(workspace.teams[0]!.rulesetBinding);
  await openWorkspace(page, workspace);
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  const contribution = page.locator('.contribution-list details').filter({ hasText: 'Forskellige elementer efter seriens første' });
  await expect(contribution).toContainText('0,000');
  await expect(contribution).not.toContainText('Q01');
  const guide = page.getByRole('region', { name: 'Guide til springplanens komposition' });
  await guide.locator('.composition-guide-overview').click();
  const row = guide.locator('.composition-guide-row').filter({ has: page.getByText('Elementer', { exact: true }) });
  await expect(row).toContainText('Pr. serie · over tre omgange');
  await expect(row).not.toContainText('Uafklaret');
  await row.locator('summary').click();
  await expect(row).toContainText('Rondat – flik-flak – lukket salto');
});

test('J822 forklarer den åbne række ved momentet på mobil', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const workspace = syntheticWorkspace().workspace;
  workspace.teams[0]!.rulesetBinding.packageVersion = '1.1.0';
  workspace.plans[0]!.bindingFingerprint = bindingFingerprint(workspace.teams[0]!.rulesetBinding);
  await openWorkspace(page, workspace);
  await page.getByRole('link', { name: 'Rytme', exact: true }).click();
  await page.getByLabel('Søg moment').fill('J822');
  const moment = page.locator('.rhythm-compact .moment-name').first();
  await expect(moment.locator('.rule-uncertainty-mark')).toBeVisible();
  await moment.click();
  const dialog = page.getByRole('dialog');
  await dialog.locator('.rule-uncertainty summary').click();
  await expect(dialog).toContainText('J822 står trykt i spagatrækken');
});
