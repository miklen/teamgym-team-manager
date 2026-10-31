import { registerAthleteSkill } from '@teamgym/domain';
import { syntheticWorkspace, tumblingSkill } from '../fixtures/synthetic-workspace';
import { openWorkspace } from './drive-fixture';
import { expect, test } from './test';

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 390, height: 844 },
]) {
  test(`åben regelusikkerhed kan læses ved ${viewport.width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize(viewport);
    let workspace = syntheticWorkspace().workspace;
    const alternate = { ...structuredClone(tumblingSkill), id: 'syntetisk-anden-holdserie',
      elements: tumblingSkill.discipline === 'tumbling' ? tumblingSkill.elements.map((element) => ({ ...element, twistsHalfTurns: 0, twistDistribution: [] })) : [] };
    for (const athlete of workspace.athletes.slice(0, 3)) {
      const added = registerAthleteSkill(workspace, athlete.id, alternate);
      workspace = added.workspace;
      workspace.plans[0]!.tumbling[0]!.rounds[0]!.entries.find((entry) => entry.athleteId === athlete.id)!.athleteSkillId = added.athleteSkillId;
    }
    await openWorkspace(page, workspace);
    await page.getByRole('link', { name: 'Springplan', exact: true }).click();
    const note = page.locator('.analysis-strip .rule-uncertainty').last();
    await expect(note.locator('.rule-uncertainty-mark')).toBeVisible();
    expect((await page.locator('.analysis-strip').boundingBox())?.height ?? 0).toBeLessThan(200);
    expect((await note.boundingBox())?.width ?? 0).toBeLessThan(28);
    await note.locator('summary').click();
    await expect(note.locator('.rule-uncertainty-popover')).toContainText('Ingen serie har flertal');
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

test('kun DK 1.1.0 kan vælges i appen', async ({ page }) => {
  await openWorkspace(page);
  await page.getByRole('link', { name: 'Reglement', exact: true }).click();
  const packages = page.getByRole('combobox', { name: 'Installeret regelpakke' });
  await expect(packages.locator('option')).toHaveCount(1);
  await expect(packages).toContainText('Danmarksserien · 1.1.0');
});

test('gentagelser vises som holdfradrag med berørte omgange', async ({ page }) => {
  await openWorkspace(page);
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  const repetition = page.locator('.contribution-list details').filter({ hasText: 'Gentagne serier eller spring mellem omgange' });
  await repetition.locator('summary').click();
  await expect(repetition).toContainText('2,400');
  await expect(repetition).toContainText('Berørte omgange: Omgang 1, Omgang 2, Omgang 3');
  await expect(repetition.locator('.rule-uncertainty')).toHaveCount(0);
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
