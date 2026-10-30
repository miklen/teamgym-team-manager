import AxeBuilder from '@axe-core/playwright';
import { bindingFingerprint, createScenario, registerAthleteSkill } from '@teamgym/domain';
import { syntheticWorkspace, tumblingSkill } from '../fixtures/synthetic-workspace';
import { openWorkspace } from './drive-fixture';
import { expect, test } from './test';

for (const width of [1440, 390]) {
  test(`guiden viser tom plan kort og tilgængeligt ved ${width}px`, async ({ page }, testInfo) => {
    await page.setViewportSize({ width, height: 900 });
    const workspace = syntheticWorkspace().workspace;
    for (const round of workspace.plans[0]!.tumbling[0]!.rounds) round.entries = [];
    const source = await openWorkspace(page, workspace);
    await page.getByRole('link', { name: 'Springplan', exact: true }).click();
    const guide = page.getByRole('region', { name: 'Guide til springplanens komposition' });
    await expect(guide).toBeVisible();
    const disclosure = guide.locator('.composition-guide-disclosure');
    await expect(disclosure).not.toHaveAttribute('open', '');
    const scenarioBar = page.getByRole('region', { name: 'Scenarier' });
    await expect(scenarioBar.getByText('Plan A', { exact: true })).toHaveCount(1);
    await expect(scenarioBar.locator('.scenario-context')).not.toContainText('Plan A');
    const profile = scenarioBar.locator('.scenario-profile');
    await expect(profile).toBeVisible();
    await expect(profile).toContainText('Holdprofil');
    await expect(profile).toContainText('Junior piger');
    await expect(profile).toContainText('6 tællende + højst 2 ekstra først');
    await expect(guide.locator('.composition-guide-overview')).toContainText('Ingen omgange klar');
    await expect(guide.locator('.composition-guide-overview')).toContainText('Tillæg');
    await expect(guide.locator('.composition-guide-overview')).toContainText('Fradrag');
    expect((await guide.boundingBox())!.height).toBeLessThan(width === 390 ? 175 : 105);
    await page.screenshot({ path: testInfo.outputPath(`springguide-${width}.png`), animations: 'disabled', fullPage: true });
    await guide.screenshot({ path: testInfo.outputPath(`springguide-panel-${width}.png`), animations: 'disabled' });
    expect((await guide.boundingBox())!.y).toBeLessThan((await page.getByRole('region', { name: '1. omgang', exact: true }).boundingBox())!.y);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await guide.locator('.composition-guide-overview').focus();
    await page.keyboard.press('Enter');
    await expect(disclosure).toHaveAttribute('open', '');
    await expect(guide.getByText('Pr. gymnast · bedste omgang').first()).toBeVisible();
    await expect(guide.getByText('Holdprofil: 6 tællende')).toBeVisible();
    expect(await guide.locator('summary').count()).toBeLessThan(12);
    const twist = guide.locator('.composition-guide-row').filter({ has: page.getByText('Skrue', { exact: true }) }).first();
    await twist.locator('summary').focus();
    await page.keyboard.press('Enter');
    await expect(twist).toHaveAttribute('open', '');
    await expect(twist).toContainText('Eksempel at træne frem mod');
    await expect(twist).toContainText('Regelbaseret træningsmål');
    await twist.getByRole('button', { name: 'Se 1. omgang' }).click();
    await expect(page.getByRole('region', { name: '1. omgang', exact: true })).toBeVisible();
    await expect(page.getByRole('region', { name: '1. omgang', exact: true })).toBeFocused();
    await expect(page.getByRole('button', { name: 'Uændret' })).toBeVisible();
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze()).violations).toEqual([]);
    expect(source.puts).toBe(0);
    expect(source.failures).toEqual([]);
  });
}

test('disciplin og scenarie skifter guide uden at genbruge gamle søgeresultater', async ({ page }) => {
  let workspace = syntheticWorkspace().workspace;
  const plan = workspace.plans[0]!;
  workspace = createScenario(workspace, plan.id, 'tumbling', plan.tumbling[0]!.id, 'Plan B');
  await openWorkspace(page, workspace);
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  const guide = page.getByRole('region', { name: 'Guide til springplanens komposition' });
  await expect(guide.locator('.composition-guide-overview')).toContainText('3/3 omgange klar');
  await page.getByRole('tab', { name: 'Plan B' }).click();
  await expect(guide.locator('.composition-guide-overview')).toContainText('Ingen omgange klar');
  await page.waitForTimeout(400);
  await guide.locator('.composition-guide-overview').click();
  await expect(guide.locator('.guide-status-line').first()).toContainText('Ikke påbegyndt');
  await page.getByRole('button', { name: 'Trampet', exact: true }).click();
  await expect(guide).toContainText('Med og uden Pegasus');
  await expect(guide).not.toContainText('Retninger');
});

test('ændret holdomgang opdaterer kravet uden egne guidefelter', async ({ page }) => {
  let workspace = syntheticWorkspace().workspace;
  if (tumblingSkill.discipline !== 'tumbling') throw Error('fixture');
  const athlete = workspace.athletes[5]!;
  const different = registerAthleteSkill(workspace, athlete.id, { ...tumblingSkill, id: 'guide-different', name: 'Syntetisk uden skrue', elements: tumblingSkill.elements.map((element) => ({ ...element, twistsHalfTurns: 0, twistDistribution: [] })) });
  workspace = different.workspace;
  workspace.plans[0]!.tumbling[0]!.rounds[0]!.entries[5]!.athleteSkillId = different.athleteSkillId;
  await openWorkspace(page, workspace);
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  await page.locator('.composition-guide-overview').click();
  const hold = page.locator('.composition-guide-row').filter({ has: page.getByText('Holdomgang', { exact: true }) });
  await expect(hold).toContainText('Planlagt fradrag');
  await page.getByRole('region', { name: '2. omgang', exact: true }).getByRole('button', { name: 'Gør til holdomgang' }).click();
  await expect(hold).toContainText('Krav opfyldt i plan');
});

test('ufuldstændige pladser viser foreløbig dækning uden endelige tillæg', async ({ page }) => {
  const workspace = syntheticWorkspace().workspace;
  workspace.plans[0]!.tumbling[0]!.rounds[2]!.entries.splice(3);
  await openWorkspace(page, workspace);
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  const guide = page.getByRole('region', { name: 'Guide til springplanens komposition' });
  await expect(guide.locator('.composition-guide-overview')).toContainText('2/3 omgange klar');
  await guide.locator('.composition-guide-overview').click();
  await expect(guide).toContainText('Foreløbig plan');
  const twist = guide.locator('.composition-guide-row').filter({ has: page.getByText('Skrue', { exact: true }) }).first();
  await expect(twist).toContainText('Foreløbig 6/6');
  await twist.locator('summary').click();
  await expect(twist).toContainText('Beløbet er ikke et endeligt C-tillæg');
});

test('manglende præcis regelpakke giver ingen guide med lånte tal', async ({ page }) => {
  const workspace = syntheticWorkspace().workspace;
  workspace.teams[0]!.rulesetBinding.packageVersion = '9.9.9';
  workspace.plans[0]!.bindingFingerprint = bindingFingerprint(workspace.teams[0]!.rulesetBinding);
  await openWorkspace(page, workspace);
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  await expect(page.getByText('Holdets præcise regelpakke er ikke installeret.')).toBeVisible();
  await expect(page.getByRole('region', { name: 'Guide til springplanens komposition' })).toHaveCount(0);
});

test('guide viser ingen bevægelse ved reduceret bevægelse', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openWorkspace(page);
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  await page.locator('.composition-guide-overview').click();
  const animation = await page.locator('.composition-guide').evaluate((node) => getComputedStyle(node.querySelector('.guide-row-status')!).animationDuration);
  expect(animation).toBe('0s');
});
