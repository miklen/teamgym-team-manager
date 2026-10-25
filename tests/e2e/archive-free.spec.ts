import { setArchived } from '@teamgym/domain';
import { syntheticWorkspace } from '../fixtures/synthetic-workspace';
import { openWorkspace } from './drive-fixture';
import { expect, test } from './test';

for (const width of [1440, 390]) {
  test(`enkel arbejdsflade uden arkivvalg bevarer ældre filindhold ved ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const fixture = syntheticWorkspace();
    let legacy = setArchived(fixture.workspace, 'teams', fixture.teamB.id, true);
    legacy = setArchived(legacy, 'athletes', legacy.athletes.at(-1)!.id, true);
    legacy = setArchived(legacy, 'athleteSkills', legacy.athleteSkills[0]!.id, true);
    const source = await openWorkspace(page, legacy);
    await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: /arkiver/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Syntetisk hold B/ })).toHaveCount(0);
    await page.getByRole('button', { name: 'Redigér hold Syntetisk hold A', exact: true }).click();
    await expect(page.getByRole('button', { name: /arkivér|genaktivér/i })).toHaveCount(0);
    await page.getByLabel('Holdnavn').fill('Syntetisk hold A opdateret');
    await page.getByRole('button', { name: 'Opdater' }).click();
    await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
    await expect(page.getByRole('checkbox', { name: /arkiver/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /Syntetisk gymnast 8/ })).toHaveCount(0);
    await page.getByRole('button', { name: /Maja Test Test 1/ }).click();
    await expect(page.getByRole('checkbox', { name: /arkiver/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /arkivér|genaktivér/i })).toHaveCount(0);
    await expect(page.getByRole('button', { name: /^Syntetisk baneserie/ })).toHaveCount(0);
    await page.getByRole('button', { name: /^Syntetisk hovedstand/ }).click();
    await expect(page.getByRole('button', { name: /arkivér|genaktivér/i })).toHaveCount(0);
    await page.screenshot({ path: `tmp/ui-qa/uden-arkiv-${width}.png`, animations: 'disabled' });
    await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
    await page.getByRole('button', { name: /Lokale ændringer/ }).click();
    await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
    expect(source.puts).toBe(1);
    expect(source.workspace.athletes).toEqual(legacy.athletes);
    expect(source.workspace.athleteSkills).toEqual(legacy.athleteSkills);
    expect(source.workspace.skills).toEqual(legacy.skills);
    expect(source.workspace.plans).toEqual(legacy.plans);
    expect(source.workspace.teams[1]).toEqual(legacy.teams[1]);
    await page.reload();
    await expect(page.getByRole('heading', { name: 'Gymnaster', exact: true })).toBeVisible();
    await expect(page.getByRole('checkbox', { name: /arkiver/i })).toHaveCount(0);
    expect(source.failures).toEqual([]);
  });
}
