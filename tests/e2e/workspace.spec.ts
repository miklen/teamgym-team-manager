import { expect, test } from '@playwright/test';
import { createWorkspace } from '@teamgym/domain';
import { openWorkspace, twentyAthletes } from './drive-fixture';

test('tomt arbejdsrum til hold, gymnast, komplet færdighed og vurdering', async ({ page }) => {
  const source = await openWorkspace(page, createWorkspace());
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Opret hold', exact: true }).click();
  await page.getByLabel('Holdnavn').fill('Syntetisk junior');
  await page.getByRole('button', { name: 'Anvend i kladde' }).click();
  await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
  await page.getByRole('button', { name: 'Tilføj gymnast', exact: true }).click();
  await page.getByLabel('Navn', { exact: true }).fill('Syntetisk Maja');
  await page.getByRole('button', { name: 'Anvend i kladde' }).click();
  await page.getByRole('button', { name: /Syntetisk Maja/ }).click();
  await page.getByRole('button', { name: 'Tilføj færdighed' }).click();
  await page.getByRole('combobox', { name: 'Disciplin', exact: true }).selectOption('rhythm');
  await page.getByLabel('Navn på færdighed').fill('Hovedstand test');
  await page.getByRole('button', { name: 'Registrér færdighed' }).click();
  await page.getByRole('button', { name: /Hovedstand test/ }).click();
  await page.getByRole('radio', { name: '4', exact: true }).check();
  await page.getByRole('button', { name: 'Opdatér vurdering' }).click();
  await page.getByRole('button', { name: 'Luk dialog' }).click();
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  expect(source.workspace.teams).toHaveLength(1);
  expect(source.workspace.athleteSkills[0]!.stability).toBe(4);
  expect(source.workspace.plans[0]!.trampet).toHaveLength(3);
  await page.reload();
  await expect(page.getByRole('button', { name: /Syntetisk Maja/ })).toBeVisible();
  expect(source.failures).toEqual([]);
});

test('seks omgange, hurtig vurdering, bevidst sortering og gem/genåbn', async ({ page }) => {
  const source = await openWorkspace(page);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Springplan' }).click();
  await expect(page.getByRole('heading', { name: 'Springplan', exact: true })).toBeVisible();
  await expect(page.getByText('4,3/5', { exact: true })).toHaveCount(3);
  await page.getByRole('button', { name: 'Vurdering', exact: true }).first().click();
  await page.getByRole('radio', { name: '5', exact: true }).check();
  await page.getByRole('button', { name: 'Opdatér vurdering' }).click();
  await page.getByRole('button', { name: 'Luk dialog' }).click();
  await expect(page.getByText('5,0/5', { exact: true })).toHaveCount(3);
  await page.getByRole('button', { name: 'Gør til holdomgang' }).last().click();
  await page.getByRole('button', { name: 'Trampet', exact: true }).click();
  await expect(page.getByText('4,3/5', { exact: true })).toHaveCount(3);
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Springplan', exact: true })).toBeVisible();
  expect(source.workspace.plans[0]!.tumbling.every((round) => round.entries.length === 6)).toBe(true);
  expect(source.workspace.plans[0]!.trampet.every((round) => round.entries.length === 6)).toBe(true);
  expect(source.failures).toEqual([]);
});

test('læseadgang tillader analyse men ingen skrivning', async ({ page }) => {
  const source = await openWorkspace(page, undefined, false);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Opret hold', exact: true })).toBeDisabled();
  await expect(page.getByText(/Læsetilstand ·/)).toBeVisible();
  await page.getByRole('link', { name: 'Springplan' }).click();
  await expect(page.getByRole('button', { name: '+ Tilføj plads' }).first()).toBeDisabled();
  expect(source.puts).toBe(0);
  expect(source.failures).toEqual([]);
});

test('ukendt pakke bevares uden at ødelægge et kendt hold', async ({ page }) => {
  const source = await openWorkspace(page);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByLabel('Aktuelt hold').selectOption({ label: 'Syntetisk hold B' });
  await expect(page.getByText(/Holdets præcise regelpakke er ikke installeret/)).toBeVisible();
  await page.getByLabel('Aktuelt hold').selectOption({ label: 'Syntetisk hold A' });
  await expect(page.getByRole('heading', { name: 'C · bidrag og fradrag' })).toBeVisible();
  expect(source.workspace.teams[1]!.rulesetBinding.rulesetId).toBe('test-only');
  expect(source.failures).toEqual([]);
});

test('bane bygger komplet kæde, viser element-D og åbner eksisterende registrering ved dublet', async ({
  page,
}) => {
  const source = await openWorkspace(page);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
  await page.getByRole('button', { name: /Maja Test Test 1/ }).click();
  await page.getByRole('button', { name: 'Tilføj færdighed' }).click();
  for (const [query, name] of [
    ['Rondat', /^Rondat R/],
    ['flic', /^Flik-flak F/],
    ['Strakt salto 360', /^Strakt salto 360 \/2/],
  ] as const) {
    await page.getByLabel('Søg spring, kode eller alias').fill(query);
    await page.getByRole('button', { name }).click();
  }
  await expect(page.getByText('0,800', { exact: true })).toBeVisible();
  await page.getByLabel('Navn på færdighed').fill('Syntetisk R-F-hel');
  await page.getByRole('button', { name: 'Registrér færdighed' }).click();
  await expect(page.getByRole('button', { name: /Syntetisk R-F-hel/ })).toBeVisible();
  await page.getByRole('button', { name: 'Tilføj færdighed' }).click();
  await page.getByRole('combobox', { name: 'Disciplin', exact: true }).selectOption('rhythm');
  await page.getByRole('button', { name: 'Registrér færdighed' }).click();
  await expect(page.getByRole('button', { name: 'Opdatér vurdering' })).toBeVisible();
  await page.getByRole('button', { name: 'Luk dialog' }).click();
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  expect(source.workspace.athleteSkills).toHaveLength(25);
  expect(source.failures).toEqual([]);
});

test('to ekstra først bevarer tællende stabilitet, og niende plads er utilgængelig', async ({ page }) => {
  const source = await openWorkspace(page);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Springplan' }).click();
  for (let index = 0; index < 2; index++) {
    await page.getByRole('button', { name: '+ Tilføj plads' }).first().click();
    await page.getByRole('combobox', { name: 'Rolle', exact: true }).selectOption('extra');
    const choices = page.getByRole('combobox', { name: 'Registreret komplet færdighed', exact: true });
    await choices.selectOption({ label: 'Syntetisk baneserie · 5/5' });
    await page.getByRole('button', { name: 'Anvend i kladde' }).click();
  }
  await expect(page.getByRole('button', { name: '+ Tilføj plads' }).first()).toBeDisabled();
  await expect(page.getByText('4,3/5', { exact: true })).toHaveCount(3);
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  expect(source.workspace.plans[0]!.tumbling[0].entries.map((entry) => entry.role)).toEqual([
    'extra',
    'extra',
    'counting',
    'counting',
    'counting',
    'counting',
    'counting',
    'counting',
  ]);
  expect(source.failures).toEqual([]);
});

for (const viewport of [
  { width: 1440, height: 900 },
  { width: 1024, height: 768 },
  { width: 768, height: 1024 },
  { width: 390, height: 844 },
]) {
  test(`20 gymnaster med lange navne, rytme og spring ved ${viewport.width}×${viewport.height}`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const source = await openWorkspace(page, twentyAthletes());
    await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Rytme', exact: true }).click();
    await page.getByLabel('Søg moment').fill('HB201');
    await expect(page.getByRole('heading', { name: 'Rytmefællesnævnere' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `tmp/ui-qa/rytme-${viewport.width}.png`, fullPage: true });
    await page.getByLabel('Alle med mindst stabilitet').selectOption('4');
    await expect(page.getByText('Ingen momenter opfylder filtrene.', { exact: false })).toBeVisible();
    await page.getByRole('link', { name: 'Springplan' }).click();
    await expect(page.getByRole('heading', { name: 'Springplan', exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: `tmp/ui-qa/spring-${viewport.width}.png`, fullPage: true });
    expect(source.failures).toEqual([]);
  });
}
