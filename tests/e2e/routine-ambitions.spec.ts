import AxeBuilder from '@axe-core/playwright';
import { addAmbition, registerAthleteSkill, setRoundEntries, updateAssessment } from '@teamgym/domain';
import type { ElementExecution, SkillDefinition } from '@teamgym/domain';
import type { Page } from '@playwright/test';
import { limits, syntheticWorkspace, tumblingSkill } from '../fixtures/synthetic-workspace';
import { openWorkspace } from './drive-fixture';
import { chooseSpring } from './picker';
import { expect, test } from './test';

/** Syntetiske trampetspring med faste facit fra A4-tabellen: fri række 8 = 0,60, fri række 10 = 0,80. */
const straight = (twists: number): ElementExecution => ({
  family: 'salto',
  direction: 'forward',
  rotationQuarterTurns: 4,
  bodyPositions: ['straight'],
  twistsHalfTurns: twists,
  twistDistribution: [twists],
  apparatus: 'trampet',
  takeoff: 'two-feet',
  landing: 'feet',
  variant: {},
});
const jump060: SkillDefinition = {
  id: 'synthetic-jump-060',
  name: 'Syntetisk strakt 540',
  archived: false,
  discipline: 'trampet',
  jump: straight(3),
};
const jump080: SkillDefinition = {
  id: 'synthetic-jump-080',
  name: 'Syntetisk strakt 900',
  archived: false,
  discipline: 'trampet',
  jump: straight(5),
};

/** Trampet 2. omgang: fem × 0,60 (ufuldstændig uden sjette plads) (Syntetisk gymnast 3–7). Strakt 900 findes i kartoteket, men ingen kan det. */
function ambitionWorkspace() {
  const fixture = syntheticWorkspace();
  let workspace = fixture.workspace;
  const environment = fixture.environment;
  const plan = workspace.plans[0]!,
    scenario = plan.trampet[0]!;
  const entries = workspace.athletes.slice(2, 7).map((athlete) => {
    const added = registerAthleteSkill(workspace, athlete.id, jump060, environment);
    workspace = updateAssessment(
      added.workspace,
      added.athleteSkillId,
      { stability: 5, assessedAt: '2026-10-25', note: 'Syntetisk' },
      environment,
    );
    return {
      id: environment.id(),
      athleteId: athlete.id,
      athleteSkillId: added.athleteSkillId,
      role: 'counting' as const,
    };
  });
  workspace = setRoundEntries(
    workspace,
    plan.id,
    'trampet',
    scenario.id,
    scenario.rounds[1]!.id,
    entries,
    limits,
    environment,
  );
  workspace = { ...workspace, skills: [...workspace.skills, jump080] };
  return workspace;
}

async function trampet(page: Page) {
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  await page.getByRole('button', { name: 'Trampet', exact: true }).click();
}
const round = (page: Page, number: number) =>
  page.getByRole('region', { name: `${number}. omgang`, exact: true });
const shot = (page: Page, name: string) =>
  page.screenshot({ path: `tmp/ui-qa/ambition-${name}.png`, animations: 'disabled' });
const noOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

async function createAmbition(page: Page) {
  const second = round(page, 2);
  await second.getByRole('button', { name: '+ Tilføj plads', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('radio', { name: 'Ingen gymnast endnu' }).check();
  await expect(dialog.getByRole('radio', { name: 'Ingen gymnast endnu' })).toBeFocused();
  await dialog.getByRole('searchbox', { name: 'Søg sammensat spring eller alias' }).fill('strakt salto 900');
  await expect(dialog.getByRole('button', { name: /^Vælg Syntetisk strakt 900/ }).first()).toBeVisible();
  return dialog;
}

for (const width of [1440, 390]) {
  test(`ambition: opret, se D, registrér, se kan nu stige og besæt ved ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const source = await openWorkspace(page, ambitionWorkspace());
    await trampet(page);
    if (width < 800) await page.getByRole('button', { name: '2. Omgang', exact: true }).click();
    const second = round(page, 2);
    await expect(second.locator('.round-totals')).toContainText('Ufuldstændig');

    const dialog = await createAmbition(page);
    const result = dialog.locator('.ambition-picker-row').first();
    await expect(result.locator('.ambition-picker-count')).toHaveText('0 kan springet');
    await expect(result).not.toContainText('Ingen gymnast');
    await dialog.getByRole('searchbox', { name: 'Søg sammensat spring eller alias' }).fill('strakt salto 540');
    await expect(dialog.locator('.ambition-picker-row').first().locator('.ambition-picker-count')).toHaveText('5 kan springet');
    await dialog.getByRole('searchbox', { name: 'Søg sammensat spring eller alias' }).fill('strakt salto 900');
    await expect(result).toHaveCSS('color', 'rgb(24, 36, 61)');
    expect((await result.boundingBox())!.height).toBeLessThan(72);
    await result.hover();
    await expect(result).toHaveCSS('background-color', 'rgb(240, 244, 252)');
    await shot(page, `katalog-${width}`);
    expect(await noOverflow(page)).toBe(true);
    await dialog.getByRole('button', { name: /^Vælg Syntetisk strakt 900/ }).first().click();
    await expect(dialog.locator('.ambition-picker-selected .ambition-picker-count')).toHaveText('0 kan springet');
    await expect(dialog.locator('.ambition-picker-selected')).not.toContainText('Ingen gymnast');
    await dialog.getByRole('button', { name: 'Opdater', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);

    const slot = second.getByRole('button', {
      name: /^Ambition: .*, mangler gymnast, ingen gymnaster kan endnu$/,
    });
    await expect(slot).toBeVisible();
    const row = second.locator('li.ambition-entry');
    await expect(row).toContainText('Mangler gymnast');
    await expect(row).toContainText('Ingen kan endnu');
    await expect(row.getByRole('button', { name: /Modtagning/ })).toHaveCount(0);
    await expect(second.locator('.round-totals')).toContainText('3,800');
    await expect(second.locator('.round-totals')).toContainText('1 mangler gymnast');
    await shot(page, `plads-${width}`);
    expect(await noOverflow(page)).toBe(true);
    const accessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(accessibility.violations).toEqual([]);

    // Registrér springet på Syntetisk gymnast 8 via færdighedsgenvejen i besættelsesvisningen.
    await row.getByRole('button', { name: /^Besæt ambitionen/ }).click();
    const fill = page.getByRole('dialog', { name: 'Besæt ambition' });
    await expect(fill.getByRole('radio', { name: /Behold som ambition/ })).toBeChecked();
    await expect(fill).toContainText('Ingen på holdet kan springet endnu.');
    await expect(
      fill.getByRole('button', { name: 'Åbn gymnastens færdigheder: Syntetisk gymnast 3 · Test 3' }),
    ).toHaveCount(0);
    await shot(page, `besaet-tom-${width}`);
    expect(await fill.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
    await fill
      .getByRole('button', { name: 'Åbn gymnastens færdigheder: Syntetisk gymnast 8 · Test 8' })
      .click();
    await page.getByRole('button', { name: 'Tilføj færdighed', exact: true }).click();
    await page.getByRole('group', { name: 'Redskab', exact: true }).getByRole('button', { name: 'Trampet', exact: true }).click();
    await page.getByLabel('Søg sammensat spring eller alias').fill('strakt salto 900');
    await chooseSpring(page, /^Syntetisk strakt 900/, 4);
    await page.getByRole('switch', { name: 'Medtag fundament automatisk' }).uncheck();
    await page.getByRole('button', { name: 'Registrér 1 spring', exact: true }).click();
    await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(
      second.getByRole('button', { name: /^Ambition: .*, mangler gymnast, 1 gymnast kan nu$/ }),
    ).toBeVisible();
    await expect(row).toContainText('1 kan nu');

    await row.getByRole('button', { name: /^Besæt ambitionen/ }).click();
    const candidate = fill.getByRole('radio', { name: /Syntetisk gymnast 8/ });
    await expect(candidate).toBeEnabled();
    await expect(fill.getByRole('radio', { name: /Syntetisk gymnast 3/ })).toBeDisabled();
    await shot(page, `besaet-${width}`);
    await fill.locator('label.candidate-row', { hasText: 'Syntetisk gymnast 8' }).click();
    await expect(candidate).toBeChecked();
    await fill.getByRole('button', { name: 'Opdater', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(second.locator('li.ambition-entry')).toHaveCount(0);
    await expect(second.getByRole('button', { name: /Syntetisk gymnast 8/ }).first()).toBeFocused();
    await expect(second.locator('.round-totals')).toContainText('3,800');
    await expect(second.locator('.round-totals')).not.toContainText('mangler gymnast');

    await page.getByRole('button', { name: /Lokale ændringer/ }).click();
    await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
    const saved = source.workspace.plans[0]!.trampet[0]!.rounds[1]!.entries;
    expect(saved).toHaveLength(6);
    expect(saved.every((entry) => entry.athleteId !== null && entry.plannedSkillId === null)).toBe(true);
  });
}

test('ambition overlever duplikering og kan fjernes', async ({ page }) => {
  await openWorkspace(page, ambitionWorkspace());
  await trampet(page);
  const dialog = await createAmbition(page);
  await dialog.getByRole('button', { name: /^Vælg Syntetisk strakt 900/ }).first().click();
  await dialog.getByRole('button', { name: 'Opdater', exact: true }).click();
  const second = round(page, 2);
  await expect(second.locator('li.ambition-entry')).toHaveCount(1);

  await page.getByRole('button', { name: /^Menu for / }).click();
  await page.getByRole('menuitem', { name: 'Duplikér' }).click();
  await page.getByLabel('Navn på kopi').fill('Plan B');
  await page.getByLabel('Navn på kopi').press('Enter');
  await expect(page.getByRole('tab', { name: 'Plan B' })).toHaveAttribute('aria-selected', 'true');
  await expect(round(page, 2).locator('li.ambition-entry')).toHaveCount(1);

  await round(page, 2)
    .getByRole('button', { name: /^Handlinger for ambitionen/ })
    .click();
  const remove = round(page, 2).getByRole('menuitem', { name: /^Fjern ambitionen/ });
  await expect(remove).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(remove).toHaveCSS('color', 'rgb(161, 52, 70)');
  await remove.hover();
  await expect(remove).toHaveCSS('background-color', 'rgb(255, 240, 242)');
  await round(page, 2)
    .getByRole('menuitem', { name: /^Fjern ambitionen/ })
    .click();
  await expect(round(page, 2).locator('li.ambition-entry')).toHaveCount(0);
  await expect(round(page, 2).locator('.round-totals')).toContainText('Ufuldstændig');
});

test('hel ambitionsomgang viser foreløbigt karakterpotentiale', async ({ page }) => {
  const fixture = syntheticWorkspace();
  const plan = fixture.workspace.plans[0]!;
  const scenario = plan.trampet[0]!;
  const definition = jump060;
  let workspace = fixture.workspace;
  const registrations: string[] = [];
  for (const athlete of workspace.athletes.slice(0, limits.counting)) {
    const registered = registerAthleteSkill(workspace, athlete.id, definition, fixture.environment);
    workspace = registered.workspace;
    registrations.push(registered.athleteSkillId);
  }
  for (const index of [0, 2]) {
    workspace = setRoundEntries(workspace, plan.id, 'trampet', scenario.id, scenario.rounds[index]!.id,
      workspace.athletes.slice(0, limits.counting).map((athlete, position) => ({
        id: fixture.environment.id(), athleteId: athlete.id, athleteSkillId: registrations[position]!, role: 'counting',
      })), limits, fixture.environment);
  }
  workspace = setRoundEntries(workspace, plan.id, 'trampet', scenario.id, scenario.rounds[1]!.id, [], limits, fixture.environment);
  for (let index = 0; index < limits.counting; index++) {
    workspace = addAmbition(workspace, plan.id, 'trampet', scenario.id, scenario.rounds[1]!.id,
      definition, 'counting', index, limits, fixture.environment).workspace;
  }
  await openWorkspace(page, workspace);
  await trampet(page);
  await expect(round(page, 2).locator('li.ambition-entry')).toHaveCount(limits.counting);
  const maximum = page.locator('.maximum-metric');
  await expect(maximum.locator('strong')).toHaveText(/^\d+,\d{3}$/);
  await expect(maximum).toContainText('Foreløbigt potentiale');
  await expect(page.locator('.composition-guide-overview')).toContainText(/Foreløbigt \d+,\d{3}/);

  const athleteRemove = round(page, 1).getByRole('button', { name: /^Handlinger for Syntetisk gymnast/ }).first();
  await athleteRemove.click();
  const remove = round(page, 1).getByRole('menuitem', { name: /^Fjern Syntetisk gymnast/ }).first();
  await expect(remove).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  await expect(remove).toHaveCSS('color', 'rgb(161, 52, 70)');
  await remove.hover();
  await expect(remove).toHaveCSS('background-color', 'rgb(255, 240, 242)');
});

test('kendt salto–rondat–flik beder ikke om godkendelse på omgang uden gymnast', async ({ page }) => {
  const fixture = syntheticWorkspace();
  const plan = fixture.workspace.plans[0]!;
  const scenario = plan.tumbling[0]!;
  const turn = scenario.rounds[1]!;
  const empty = setRoundEntries(fixture.workspace, plan.id, 'tumbling', scenario.id, turn.id, [], limits, fixture.environment);
  const start = { ...tumblingSkill.elements[0]!, direction: 'forward' as const, twistsHalfTurns: 0, twistDistribution: [] };
  const rondat = { ...start, family: 'roundoff', direction: 'backward' as const };
  const flik = { ...rondat, family: 'flic' };
  const definition: SkillDefinition = {
    id: 'syntetisk-kendt-salto-rondat-flik', name: 'Strakt salto – rondat – flik', archived: false,
    discipline: 'tumbling', elements: [start, rondat, flik],
    connection: { kind: 'standard', transitions: ['direct', 'direct'] }, sharedConnectionApproval: null,
  };
  const prepared = addAmbition(empty, plan.id, 'tumbling', scenario.id, turn.id, definition, 'counting', 0, limits, fixture.environment).workspace;
  await openWorkspace(page, prepared);
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  const second = round(page, 2);
  const entry = second.locator('li.ambition-entry');
  await expect(entry).toContainText('Strakt salto – rondat – flik');
  await expect(entry).toContainText('0,600');
  await expect(entry).not.toContainText('Træneren kan godkende den præcise kæde');
  await entry.getByRole('button', { name: /^Ambition:/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('checkbox', { name: 'Godkend den præcise forbindelse for hele arbejdsrummet' })).toHaveCount(0);
  await expect(dialog).not.toContainText('Forbindelsen er uafklaret');
});

test('kendt salto–flyvespring beder ikke om godkendelse på omgang uden gymnast', async ({ page }) => {
  const fixture = syntheticWorkspace();
  const plan = fixture.workspace.plans[0]!;
  const scenario = plan.tumbling[0]!;
  const turn = scenario.rounds[1]!;
  const empty = setRoundEntries(fixture.workspace, plan.id, 'tumbling', scenario.id, turn.id, [], limits, fixture.environment);
  const start = { ...tumblingSkill.elements[0]!, direction: 'forward' as const, twistsHalfTurns: 0, twistDistribution: [] };
  const flyvespring = { ...start, family: 'flyspring' };
  const definition: SkillDefinition = {
    id: 'syntetisk-kendt-salto-flyvespring', name: 'Strakt salto – flyvespring', archived: false,
    discipline: 'tumbling', elements: [start, flyvespring],
    connection: { kind: 'standard', transitions: ['direct'] }, sharedConnectionApproval: null,
  };
  const prepared = addAmbition(empty, plan.id, 'tumbling', scenario.id, turn.id, definition, 'counting', 0, limits, fixture.environment).workspace;
  await openWorkspace(page, prepared);
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  const second = round(page, 2);
  const entry = second.locator('li.ambition-entry');
  await expect(entry).toContainText('Strakt salto – flyvespring');
  await expect(entry).toContainText('0,500');
  await expect(entry).not.toContainText('Træneren kan godkende den præcise kæde');
  await entry.getByRole('button', { name: /^Ambition:/ }).click();
  await expect(page.getByRole('checkbox', { name: 'Godkend den præcise forbindelse for hele arbejdsrummet' })).toHaveCount(0);
});

for (const width of [390, 1440]) {
  test(`tre plus tre ambitioner med preview og uden gymnast ved ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const fixture = syntheticWorkspace();
    const plan = fixture.workspace.plans[0]!;
    const scenario = plan.trampet[0]!;
    const workspace = setRoundEntries(fixture.workspace, plan.id, 'trampet', scenario.id, scenario.rounds[1]!.id, [], limits, fixture.environment);
    await openWorkspace(page, { ...workspace, skills: [...workspace.skills, jump080] });
    await trampet(page);
    if (width === 390) await page.getByRole('button', { name: '2. Omgang', exact: true }).click();
    const second = round(page, 2);
    for (const name of ['Syntetisk trampetspring', 'Syntetisk strakt 900']) {
      await second.getByRole('button', { name: '+ Tilføj plads', exact: true }).click();
      const dialog = page.getByRole('dialog');
      await dialog.getByRole('radio', { name: 'Ingen gymnast endnu' }).check();
      await dialog.getByRole('searchbox', { name: 'Søg sammensat spring eller alias' }).fill(name);
      await dialog.getByRole('button', { name: new RegExp(`^Vælg ${name}, \\d+ gymnaster? kan springet$`) }).click();
      await dialog.getByRole('combobox', { name: 'Antal nye pladser' }).selectOption('3');
      await expect(dialog.locator('.ambition-count-preview')).toContainText('3 tællende pladser');
      expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
      await dialog.getByRole('button', { name: 'Opdater', exact: true }).click();
    }
    const rows = second.locator('li.ambition-entry');
    await expect(rows).toHaveCount(6);
    expect(await rows.allTextContents()).toEqual([
      ...Array(3).fill(expect.stringContaining('Syntetisk trampetspring')),
      ...Array(3).fill(expect.stringContaining('Syntetisk strakt 900')),
    ]);
    await expect(rows.locator('img[aria-label^="Sikkerhed:"]')).toHaveCount(0);
    expect(await noOverflow(page)).toBe(true);
  });
}

test('bygget ambition godkendes fælles og genbruges uden gymnast', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  const fixture = syntheticWorkspace();
  const plan = fixture.workspace.plans[0]!;
  const scenario = plan.tumbling[0]!;
  const workspace = setRoundEntries(fixture.workspace, plan.id, 'tumbling', scenario.id, scenario.rounds[1]!.id, [], limits, fixture.environment);
  const source = await openWorkspace(page, workspace);
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  await page.getByRole('button', { name: '2. Omgang', exact: true }).click();
  const second = round(page, 2);
  await second.getByRole('button', { name: '+ Tilføj plads', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('radio', { name: 'Ingen gymnast endnu' }).check();
  await dialog.getByRole('button', { name: 'Byg det selv →' }).click();
  const catalog = dialog.locator('.catalog-results');
  await dialog.getByRole('searchbox', { name: 'Søg spring, kode eller alias' }).fill('rondat');
  await catalog.getByRole('button', { name: /^Rondat / }).first().click();
  await dialog.getByRole('searchbox', { name: 'Søg spring, kode eller alias' }).fill('strakt salto 360');
  await catalog.getByRole('button', { name: /^Strakt 1\/1 \(360°\) baglæns/ }).first().click();
  await dialog.getByRole('searchbox', { name: 'Søg spring, kode eller alias' }).fill('vejrmølle');
  await catalog.getByRole('button', { name: /^Vejrmølle / }).first().click();
  await expect(dialog.getByRole('status').filter({ hasText: 'Kendt problematisk forbindelse' }).first()).toBeVisible();
  await dialog.getByRole('button', { name: 'Fjern element 2' }).click();
  await expect(dialog.getByRole('status').filter({ hasText: 'Ikke verificeret forbindelse' }).first()).toBeVisible();
  await dialog.getByRole('checkbox', { name: 'Godkend den præcise forbindelse for hele arbejdsrummet' }).check();
  await dialog.getByRole('textbox', { name: 'Fælles begrundelse for forbindelsen' }).fill('Syntetisk trænerkontrol af den præcise kæde.');
  expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
  const accessibility = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(accessibility.violations).toEqual([]);
  await dialog.getByRole('button', { name: 'Brug springet' }).click();
  await expect(dialog.getByText('Valgt spring · bevares ved filtrering')).toBeVisible();
  await dialog.getByRole('button', { name: 'Opdater', exact: true }).click();
  await expect(second.locator('li.ambition-entry')).toHaveCount(1);
  await expect(second.locator('li.ambition-entry')).toContainText('Trænerbekræftet forbindelse');
  await second.getByRole('button', { name: '+ Tilføj plads', exact: true }).click();
  const repeat = page.getByRole('dialog');
  await repeat.getByRole('radio', { name: 'Ingen gymnast endnu' }).check();
  await repeat.getByRole('searchbox', { name: 'Søg sammensat spring eller alias' }).fill('rondat vejrmølle');
  await expect(repeat.getByRole('button', { name: /^Vælg .*rondat.*vejrmølle/i }).first()).toBeVisible();
  await repeat.getByRole('button', { name: /^Vælg .*rondat.*vejrmølle/i }).first().click();
  await repeat.getByRole('button', { name: 'Opdater', exact: true }).click();
  await expect(second.locator('li.ambition-entry')).toHaveCount(2);
  await expect(second.locator('li.ambition-entry .connection-approved')).toHaveCount(2);
  expect(source.workspace.athleteSkills).toHaveLength(workspace.athleteSkills.length);
  expect(source.failures).toEqual([]);
});

test('ambition bevarer valgt spring ved filter og annullerer Byg videre', async ({ page }) => {
  const fixture = syntheticWorkspace();
  const plan = fixture.workspace.plans[0]!;
  const scenario = plan.tumbling[0]!;
  const workspace = setRoundEntries(fixture.workspace, plan.id, 'tumbling', scenario.id, scenario.rounds[1]!.id, [], limits, fixture.environment);
  const source = await openWorkspace(page, workspace);
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  const second = round(page, 2);
  await second.getByRole('button', { name: '+ Tilføj plads', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('radio', { name: 'Ingen gymnast endnu' }).check();
  const picker = dialog.getByRole('region', { name: 'Find spring til ambition' });
  await picker.getByRole('searchbox', { name: 'Søg sammensat spring eller alias' }).fill('strakt rondat');
  await expect(picker.locator('.ambition-picker-row').first()).toContainText('Strakt salto – rondat');
  await picker.getByRole('button', { name: /^Vælg Strakt salto – rondat, \d+ gymnaster? kan springet$/ }).click();
  await picker.getByRole('searchbox', { name: 'Søg sammensat spring eller alias' }).fill('syntetisk intet match');
  await expect(picker.locator('.ambition-picker-selected')).toContainText('Strakt salto – rondat');
  await picker.getByRole('button', { name: 'Nulstil filtre' }).click();
  await picker.getByText('Kædefilter', { exact: true }).click();
  await picker.getByRole('group', { name: 'Valg til Første spring' }).getByRole('button', { name: /^Rondat, / }).click();
  await picker.getByRole('searchbox', { name: 'Søg sammensat spring eller alias' }).fill('syntetisk intet match');
  await expect(picker.getByRole('button', { name: 'Byg videre fra den valgte kæde' })).toHaveCount(1);
  await picker.getByRole('button', { name: 'Byg videre fra den valgte kæde' }).click();
  await expect(dialog.getByRole('button', { name: 'Fjern element 1' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Luk dialog', exact: true }).click();
  await expect(second.locator('li.ambition-entry')).toHaveCount(0);
  expect(source.workspace.skills).toHaveLength(workspace.skills.length);
  expect(source.workspace.athleteSkills).toHaveLength(workspace.athleteSkills.length);
  expect(source.failures).toEqual([]);
});

test('en eksisterende uafklaret ambition kan godkendes uden nyt spring', async ({ page }) => {
  const fixture = syntheticWorkspace();
  const plan = fixture.workspace.plans[0]!, scenario = plan.tumbling[0]!, round = scenario.rounds[0]!;
  const definition: SkillDefinition = { ...tumblingSkill, id: 'syntetisk-uafklaret', name: 'Syntetisk uafklaret kæde', elements: [tumblingSkill.elements[0]!, tumblingSkill.elements[0]!], connection: { kind: 'custom', transitions: ['direct'] }, sharedConnectionApproval: null };
  const prepared = addAmbition(fixture.workspace, plan.id, 'tumbling', scenario.id, round.id, definition, 'extra', 0, limits, fixture.environment).workspace;
  const source = await openWorkspace(page, prepared);
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  const first = (roundNumber: number) => page.getByRole('region', { name: `${roundNumber}. omgang`, exact: true });
  await first(1).getByRole('button', { name: /^Ambition: Syntetisk uafklaret kæde/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toContainText('Forbindelsen er uafklaret');
  await dialog.getByRole('checkbox', { name: 'Godkend den præcise forbindelse for hele arbejdsrummet' }).check();
  await dialog.getByRole('textbox', { name: 'Fælles begrundelse for forbindelsen' }).fill('Syntetisk kontrol');
  await dialog.getByRole('button', { name: 'Opdater', exact: true }).click();
  await expect(first(1).locator('li.ambition-entry')).toContainText('Trænerbekræftet forbindelse');
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  expect(source.workspace.skills.filter((skill) => skill.id === definition.id)).toHaveLength(1);
  const approved = source.workspace.skills.find((skill) => skill.id === definition.id)!;
  expect(approved.discipline === 'tumbling' && approved.sharedConnectionApproval).toBeTruthy();
  expect(source.failures).toEqual([]);
});
