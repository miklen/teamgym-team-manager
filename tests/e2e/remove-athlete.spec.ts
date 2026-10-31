import AxeBuilder from '@axe-core/playwright';
import { createAthlete } from '@teamgym/domain';
import { syntheticWorkspace } from '../fixtures/synthetic-workspace';
import { openWorkspace } from './drive-fixture';
import { expect, test } from './test';

for (const width of [1440, 390]) {
  test(`fjern den rigtige gymnast med bevarede referencer og opdateret hold ved ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const fixture = syntheticWorkspace();
    const source = await openWorkspace(page, fixture.workspace);
    await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
    const athlete = page.getByRole('button', { name: /Maja Test Test 1/ });
    await athlete.click();
    await page.getByRole('button', { name: 'Fjern gymnast', exact: true }).click();
    const confirmation = page.getByRole('dialog', { name: 'Fjern gymnast', exact: true });
    await expect(confirmation).toContainText('Maja Test (Test 1)');
    await expect(confirmation).toContainText('6 pladser');
    const accessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(accessibility.violations).toEqual([]);
    await page.screenshot({ path: `tmp/ui-qa/fjern-gymnast-${width}.png`, animations: 'disabled' });
    await confirmation.getByRole('button', { name: 'Annuller', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Fjern gymnast', exact: true })).toBeFocused();
    await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
    await expect(athlete).toBeVisible();
    await athlete.click();
    await page.getByRole('button', { name: 'Fjern gymnast', exact: true }).click();
    await confirmation.getByRole('button', { name: 'Fjern gymnast', exact: true }).click();
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(athlete).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Maja Test Test 2/ })).toBeVisible();
    await expect(page.getByRole('searchbox', { name: 'Søg gymnast', exact: true })).toBeFocused();
    expect(source.puts).toBe(0);
    await page.getByRole('link', { name: 'Rytme', exact: true }).click();
    await page.getByLabel('Søg moment').fill('HB201');
    await expect(page.getByText(/7\/7/).filter({ visible: true }).first()).toBeVisible();
    await page.getByRole('link', { name: 'Springplan', exact: true }).click();
    await expect(
      page.getByText('Gymnasten er fjernet. Vælg en anden gymnast.', { exact: true }).first(),
    ).toBeVisible();
    await page.getByRole('button', { name: /^Handlinger for / }).first().click();
    await page.getByRole('menuitem', { name: 'Vurdering', exact: true }).click();
    await expect(
      page.getByText(
        'Gymnasten er fjernet fra gymnastlisten. Vælg en anden gymnast på de berørte pladser i springplanen.',
        { exact: true },
      ),
    ).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fjern gymnast', exact: true })).toBeDisabled();
    await expect(page.getByRole('button', { name: 'Opdatér vurdering', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
    await page.getByRole('button', { name: /Lokale ændringer/ }).click();
    await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
    expect(source.workspace.athletes.find((item) => item.id === fixture.athleteA.id)).toEqual({
      ...fixture.athleteA,
      archived: true,
    });
    expect(source.workspace.athletes.filter((item) => item.id !== fixture.athleteA.id)).toEqual(
      fixture.workspace.athletes.filter((item) => item.id !== fixture.athleteA.id),
    );
    expect(source.workspace.athleteSkills).toEqual(fixture.workspace.athleteSkills);
    expect(source.workspace.skills).toEqual(fixture.workspace.skills);
    expect(source.workspace.plans).toEqual(fixture.workspace.plans);
    await page.reload();
    await expect(
      page.getByText('Gymnasten er fjernet. Vælg en anden gymnast.', { exact: true }).first(),
    ).toBeVisible();
    await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
    await expect(athlete).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Maja Test Test 2/ })).toBeVisible();
    expect(source.puts).toBe(1);
    expect(source.failures).toEqual([]);
  });
}

test('gymnast uden hold kan fjernes uden advarsel om planpladser', async ({ page }) => {
  const fixture = syntheticWorkspace();
  const workspace = createAthlete(fixture.workspace, { name: 'Syntetisk uden hold', teamId: null });
  const source = await openWorkspace(page, workspace);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
  await page.getByRole('button', { name: /Syntetisk uden hold/ }).click();
  await page.getByRole('button', { name: 'Fjern gymnast', exact: true }).click();
  const confirmation = page.getByRole('dialog', { name: 'Fjern gymnast', exact: true });
  await expect(confirmation).not.toContainText('pladser');
  await confirmation.getByRole('button', { name: 'Fjern gymnast', exact: true }).click();
  await expect(page.getByRole('button', { name: /Syntetisk uden hold/ })).toHaveCount(0);
  expect(source.puts).toBe(0);
  expect(source.failures).toEqual([]);
});

test('læseadgang kan ikke fjerne en gymnast', async ({ page }) => {
  const source = await openWorkspace(page, undefined, false);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
  await page.getByRole('button', { name: /Maja Test Test 1/ }).click();
  await expect(page.getByRole('button', { name: 'Fjern gymnast', exact: true })).toBeDisabled();
  expect(source.puts).toBe(0);
});
