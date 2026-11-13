import AxeBuilder from '@axe-core/playwright';
import { createAthlete, registerAthleteSkill, setOwnAssessment } from '@teamgym/domain';
import { overviewWorkspace, overviewFull, overviewHard } from '../fixtures/overview-workspace';
import { openWorkspace } from './drive-fixture';
import { chooseAthlete, expect, test } from './test';

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
    await chooseAthlete(page, 'Alma Eksempel');
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
    expect(source.workspace.plans[0]!.tumbling[0]!.rounds[0].entries[0]!.athleteSkillId).toBeNull();
    expect(source.failures).toEqual([]);
  });
}

test('springvalget nulstilles ved skift af gymnast og bevarer kladden ved lukning', async ({ page }) => {
  const source = await openWorkspace(page, optionsWorkspace());
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  await page.getByRole('button', { name: '+ Tilføj plads', exact: true }).first().click();
  await chooseAthlete(page, 'Alma Eksempel');
  const trigger = page.getByRole('button', { name: 'Spring', exact: true });
  await trigger.click();
  await page.getByRole('option', { name: /1\/1.*D 0,800/ }).click();
  await chooseAthlete(page, 'Bea Eksempel');
  await expect(trigger).toContainText('Vælg spring');
  await trigger.click();
  await expect(page.getByRole('listbox').getByRole('option')).toHaveCount(2);
  await expect(page.getByRole('option', { name: /1\/1/ })).toHaveCount(0);
  await page.getByRole('option', { name: /2\/1.*Ikke vurderet/ }).click();
  await trigger.click();
  await page.getByRole('dialog').getByRole('heading').first().click();
  await expect(trigger).toHaveAttribute('aria-expanded', 'false');
  await expect(trigger).toContainText('2/1');
  await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
  expect(source.workspace.plans[0]!.tumbling[0]!.rounds[0].entries).toHaveLength(0);
  expect(source.failures).toEqual([]);
});

test('et stort repertoire kan søges uden at forveksle flere ens afslutninger', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const source = await openWorkspace(page, overviewWorkspace(120));
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  await page.getByRole('button', { name: '+ Tilføj plads', exact: true }).first().click();
  await chooseAthlete(page, 'Alma Eksempel');
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

test('Hele holdet viser holdets spring, indsnævrer gymnaster og markerer gentagelse', async ({ page }) => {
  const source = await openWorkspace(page, optionsWorkspace());
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  const roundOne = page.getByRole('region', { name: '1. omgang', exact: true });
  await roundOne.getByRole('button', { name: '+ Tilføj plads', exact: true }).click();
  const athlete = page.getByRole('button', { name: 'Gymnast', exact: true });
  const trigger = page.getByRole('button', { name: 'Spring', exact: true });
  const update = page.getByRole('button', { name: 'Opdater', exact: true });
  await expect(athlete).toContainText('Hele holdet');
  await expect(athlete).toContainText('2 ledige gymnaster');
  await expect(update).toBeDisabled();
  await expect(page.getByText('Vælg en gymnast for at gemme pladsen.')).toBeVisible();

  await trigger.click();
  await expect(page.getByRole('combobox', { name: 'Søg i holdets spring' })).toBeFocused();
  const hard = page.getByRole('option', { name: /2\/1.*D 1,000.*2 gymnaster kan/ });
  await expect(hard).toBeVisible();
  await expect(page.getByRole('option', { name: /1\/1.*D 0,800.*1 gymnast kan/ })).toBeVisible();
  await hard.click();
  await expect(update).toBeDisabled();

  await athlete.click();
  const listbox = page.getByRole('listbox', { name: 'Gymnast' });
  await expect(listbox.getByRole('option')).toHaveCount(3);
  await expect(page.getByRole('option', { name: /^Hele holdet, 2 gymnaster kan$/ })).toBeVisible();
  await expect(page.getByRole('option', { name: /^Alma Eksempel,.*sikkerhed 2\/5/ })).toBeVisible();
  await page.getByRole('option', { name: /^Alma Eksempel(,|$)/ }).click();
  await expect(trigger).toContainText('2/1');
  await expect(trigger).toContainText('2/5');
  await chooseAthlete(page, 'Hele holdet');
  await expect(trigger).toContainText('2/1');
  await chooseAthlete(page, 'Alma Eksempel');
  await expect(update).toBeEnabled();
  await update.click();

  await roundOne.getByRole('button', { name: '+ Tilføj plads', exact: true }).click();
  await trigger.click();
  await page
    .getByRole('option', { name: /2\/1.*2 gymnaster kan, 1 ledig, 1 står allerede i omgangen/ })
    .click();
  await athlete.click();
  await expect(page.getByText('kan også springet, men står allerede i omgangen.')).toContainText(
    'Alma Eksempel',
  );
  await expect(listbox.getByRole('option')).toHaveCount(2);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
  await page.getByRole('button', { name: 'Kassér', exact: true }).click();

  const roundTwo = page.getByRole('region', { name: '2. omgang', exact: true });
  await roundTwo.getByRole('button', { name: '+ Tilføj plads', exact: true }).click();
  await trigger.click();
  const repeated = page.getByRole('option', { name: /2\/1.*brugt i omgang 1 1 gang/ });
  await expect(repeated).toBeVisible();
  await expect(repeated.locator('.plan-usage.is-warning')).toContainText('Omg. 1 ×1');
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  const [entry] = source.workspace.plans[0]!.tumbling[0]!.rounds[0].entries;
  const alma = source.workspace.athletes[0]!.id;
  expect(entry!.athleteId).toBe(alma);
  const registration = source.workspace.athleteSkills.find((item) => item.id === entry!.athleteSkillId);
  expect(registration?.athleteId).toBe(alma);
  expect(source.workspace.plans[0]!.tumbling[0]!.rounds[1].entries).toHaveLength(0);
  expect(source.failures).toEqual([]);
});

test('banespring kan filtreres på ren forlæns og baglæns med og uden gymnast; trampet har intet retningsfilter', async ({ page }) => {
  let workspace = optionsWorkspace();
  if (overviewFull.discipline !== 'tumbling') throw Error('fixture');
  const salto = overviewFull.elements[2]!;
  const forward = {
    ...overviewFull,
    name: 'Kraftspring – forlæns lukket',
    elements: [
      { ...salto, family: 'handspring' as const, direction: 'forward' as const, takeoff: 'one-foot' as const, twistsHalfTurns: 0, twistDistribution: [] },
      { ...salto, direction: 'forward' as const, bodyPositions: ['tuck' as const], twistsHalfTurns: 0, twistDistribution: [] },
    ],
    connection: { kind: 'standard' as const, transitions: ['direct' as const] },
  };
  workspace = registerAthleteSkill(workspace, workspace.athletes[0]!.id, { ...forward, id: 'synthetic-forward' }).workspace;
  const source = await openWorkspace(page, workspace);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  await page.getByRole('button', { name: '+ Tilføj plads', exact: true }).first().click();
  const dialog = page.getByRole('dialog');
  const trigger = dialog.getByRole('button', { name: 'Spring', exact: true });
  await trigger.click();
  const teamSearch = dialog.getByRole('combobox', { name: 'Søg i holdets spring' });
  await expect(teamSearch).toBeFocused();
  const directions = dialog.getByRole('group', { name: 'Retning' });
  const options = dialog.getByRole('listbox').getByRole('option');
  await expect(directions.getByRole('button', { name: 'Alle, 4 spring' })).toHaveAttribute('aria-pressed', 'true');
  await directions.getByRole('button', { name: 'Forlæns, 1 spring' }).click();
  await expect(teamSearch).toBeFocused();
  await expect(options).toHaveCount(1);
  await directions.getByRole('button', { name: 'Baglæns, 3 spring' }).click();
  await expect(options).toHaveCount(3);
  await teamSearch.fill('720');
  await expect(directions.getByRole('button', { name: 'Forlæns, 0 spring' })).toBeVisible();
  await teamSearch.press('Escape');
  // Filteret følger med til gymnastens liste.
  await chooseAthlete(dialog, 'Alma Eksempel');
  await trigger.click();
  await expect(directions.getByRole('button', { name: 'Baglæns, 3 spring' })).toHaveAttribute('aria-pressed', 'true');
  await expect(options).toHaveCount(4);
  await directions.getByRole('button', { name: 'Forlæns, 1 spring' }).click();
  await expect(options.filter({ hasNotText: 'Vælg senere' })).toHaveCount(1);
  await dialog.getByRole('combobox', { name: 'Søg registrerede spring' }).fill('720');
  await expect(dialog.getByRole('status').filter({ hasText: 'Ingen rene forlæns spring registreret matcher søgningen.' })).toBeVisible();
  await dialog.getByRole('combobox', { name: 'Søg registrerede spring' }).press('Escape');
  await dialog.getByRole('radio', { name: 'Ingen gymnast endnu' }).check();
  const picker = dialog.getByRole('region', { name: 'Find spring til ambition' });
  const ambitionDirections = picker.getByRole('group', { name: 'Retning' });
  await ambitionDirections.getByRole('button', { name: /^Baglæns, / }).click();
  const rows = picker.locator('.ambition-picker-row');
  await expect(rows.first()).toBeVisible();
  const backwardCount = await rows.count();
  await ambitionDirections.getByRole('button', { name: /^Forlæns, / }).click();
  await expect(rows.filter({ hasText: /Salto: .*baglæns/ })).toHaveCount(0);
  await expect(rows.filter({ hasText: 'Salto: forlæns' }).first()).toBeVisible();
  await picker.getByRole('button', { name: 'Nulstil filtre' }).click();
  await expect(ambitionDirections.getByRole('button', { name: /^Alle, / })).toHaveAttribute('aria-pressed', 'true');
  expect(await rows.count()).toBeGreaterThan(backwardCount);
  await dialog.getByRole('button', { name: 'Luk dialog', exact: true }).click();
  await page.getByRole('button', { name: 'Kassér', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('button', { name: 'Trampet', exact: true }).click();
  await page.getByRole('button', { name: '+ Tilføj plads', exact: true }).first().click();
  await dialog.getByRole('button', { name: 'Spring', exact: true }).click();
  await expect(dialog.getByRole('combobox', { name: 'Søg i holdets spring' })).toBeFocused();
  await expect(dialog.getByRole('group', { name: 'Retning' })).toHaveCount(0);
  await dialog.getByRole('radio', { name: 'Ingen gymnast endnu' }).check();
  await expect(dialog.getByRole('group', { name: 'Retning' })).toHaveCount(0);
  expect(source.failures).toEqual([]);
});
