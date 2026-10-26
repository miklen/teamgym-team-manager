import AxeBuilder from '@axe-core/playwright';
import { createAthlete, registerAthleteSkill, setOwnAssessment } from '@teamgym/domain';
import { overviewWorkspace, overviewFull, overviewHard } from '../fixtures/overview-workspace';
import { openWorkspace } from './drive-fixture';
import { expect, test } from './test';

function optionsWorkspace() {
  let workspace = overviewWorkspace(0);
  const athleteId = workspace.athletes[0]!.id;
  for (const [definition, stability] of [
    [overviewFull, 5],
    [overviewHard, 2],
  ] as const) {
    const added = registerAthleteSkill(workspace, athleteId, definition);
    workspace = setOwnAssessment(added.workspace, added.athleteSkillId, {
      stability,
      assessedAt: '2026-10-26',
      note: '',
    });
  }
  if (overviewFull.discipline !== 'tumbling') throw Error('fixture');
  workspace = registerAthleteSkill(workspace, athleteId, {
    ...overviewFull,
    id: 'synthetic-unrated',
    name: 'Rondat – flik – strakt',
    elements: overviewFull.elements.map((element, index) =>
      index === 2 ? { ...element, twistsHalfTurns: 0, twistDistribution: [] } : element,
    ),
  }).workspace;
  workspace = createAthlete(workspace, { name: 'Bea Eksempel', teamId: workspace.teams[0]!.id });
  workspace = registerAthleteSkill(workspace, workspace.athletes[1]!.id, overviewHard).workspace;
  return workspace;
}

for (const width of [1440, 390]) {
  test(`visuelt springvalg med søgning, tastatur og D uden ekstra tekst ved ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const source = await openWorkspace(page, optionsWorkspace());
    await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Springplan', exact: true }).click();
    await page.getByRole('button', { name: '+ Tilføj plads', exact: true }).first().click();
    const trigger = page.getByRole('button', { name: 'Spring', exact: true });
    await trigger.focus();
    await page.keyboard.press('ArrowDown');
    const search = page.getByRole('combobox', { name: 'Søg registrerede spring' });
    await expect(search).toBeFocused();
    const full = page.getByRole('option', { name: /1\/1.*D 0,800.*5\/5/ });
    const hard = page.getByRole('option', { name: /2\/1.*D 1,000.*2\/5/ });
    await expect(full).toBeVisible();
    await expect(hard).toBeVisible();
    await expect(page.getByRole('dialog')).not.toContainText('Egen D');
    await page.screenshot({ path: `tmp/ui-qa/plan-skill-options-${width}.png`, animations: 'disabled' });
    const accessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(accessibility.violations).toEqual([]);
    expect(
      await page.getByRole('dialog').evaluate((element) => element.scrollWidth <= element.clientWidth),
    ).toBe(true);
    await search.fill('ingen match');
    await expect(
      page.getByRole('status').filter({ hasText: 'Ingen registrerede spring matcher.' }),
    ).toBeVisible();
    await search.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await search.fill('720');
    await expect(page.getByRole('listbox').getByRole('option')).toHaveCount(1);
    await search.press('Escape');
    await expect(trigger).toBeFocused();
    await expect(page.getByRole('dialog')).toBeVisible();
    await trigger.click();
    await search.fill('360');
    await search.press('Enter');
    await expect(trigger).toContainText('0,800');
    await expect(trigger).toContainText('5/5');
    await page.getByRole('button', { name: 'Opdater', exact: true }).click();
    const row = page
      .getByRole('region', { name: '1. omgang', exact: true })
      .locator('.round-entries > li')
      .first();
    await expect(row.locator('.plan-difficulty')).toHaveText('0,800');
    await expect(row.locator('.safety-bars .filled')).toHaveCount(5);
    await expect(row).not.toContainText('Egen D');
    await expect(row).toContainText('Bidrag til omgang: Ufuldstændig');
    expect(
      (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze())
        .violations,
    ).toEqual([]);
    await page.screenshot({ path: `tmp/ui-qa/plan-difficulty-${width}.png`, animations: 'disabled' });
    await row.getByRole('button', { name: /^Alma Eksempel/ }).click();
    await trigger.click();
    await search.press('End');
    await search.press('ArrowUp');
    await search.press('ArrowDown');
    await search.press('Enter');
    await expect(trigger.getByLabel('Sikkerhed: Ikke vurderet', { exact: true })).toBeVisible();
    await trigger.click();
    await search.press('Home');
    await search.press('Enter');
    await page.getByRole('button', { name: 'Opdater', exact: true }).click();
    await expect(row).toContainText('Vælg registreret færdighed');
    await page.getByRole('button', { name: /Lokale ændringer/ }).click();
    await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
    expect(source.workspace.plans[0]!.tumbling[0].entries[0]!.athleteSkillId).toBeNull();
    expect(source.failures).toEqual([]);
  });
}

test('springvalget nulstilles ved skift af gymnast og bevarer kladden ved lukning', async ({ page }) => {
  const source = await openWorkspace(page, optionsWorkspace());
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  await page.getByRole('button', { name: '+ Tilføj plads', exact: true }).first().click();
  const trigger = page.getByRole('button', { name: 'Spring', exact: true });
  await trigger.click();
  await page.getByRole('option', { name: /1\/1.*D 0,800/ }).click();
  await page.getByRole('combobox', { name: 'Gymnast', exact: true }).selectOption({ label: 'Bea Eksempel' });
  await expect(trigger).toContainText('Vælg spring');
  await trigger.click();
  await expect(page.getByRole('listbox').getByRole('option')).toHaveCount(2);
  await expect(page.getByRole('option', { name: /1\/1/ })).toHaveCount(0);
  await page.getByRole('option', { name: /2\/1.*Ikke vurderet/ }).click();
  await trigger.click();
  await page.getByRole('combobox', { name: 'Rolle', exact: true }).click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toContainText('2/1');
  await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
  expect(source.workspace.plans[0]!.tumbling[0].entries).toHaveLength(0);
  expect(source.failures).toEqual([]);
});

test('et stort repertoire kan søges uden at forveksle flere ens afslutninger', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const source = await openWorkspace(page, overviewWorkspace(120));
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  await page.getByRole('button', { name: '+ Tilføj plads', exact: true }).first().click();
  const trigger = page.getByRole('button', { name: 'Spring', exact: true });
  await trigger.click();
  const search = page.getByRole('combobox', { name: 'Søg registrerede spring' });
  await search.fill('16 ×');
  await expect(page.getByRole('listbox').getByRole('option')).toHaveCount(4);
  await search.press('End');
  const activeId = await search.getAttribute('aria-activedescendant');
  await expect(page.locator(`[id="${activeId}"]`)).toBeInViewport();
  await search.press('Enter');
  await expect(trigger).toContainText('16 ×');
  await page.getByRole('button', { name: 'Opdater', exact: true }).click();
  await expect(page.locator('.round-entries > li').first()).toContainText('16 ×');
  expect(source.failures).toEqual([]);
});
