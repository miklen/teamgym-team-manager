import { expect, test } from './test';
import { openWorkspace } from './drive-fixture';

for (const width of [1440, 390]) {
  test(`strakt-rondat-flik-hel: tydelig retning, kendt serie og særskilte begyndelser ved ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const source = await openWorkspace(page);
    await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
    await page.getByRole('button', { name: /Maja Test Test 1/ }).click();
    await page.getByRole('button', { name: 'Tilføj færdighed' }).click();
    await page.getByRole('button', { name: 'Byg selv', exact: true }).click();
    for (const [query, name] of [
      ['strakt forlæns', /^Strakt salto \(forlæns\)/],
      ['Rondat', /^Rondat R/],
      ['flic', /^Flik-flak F/],
      ['forlæns 360', /^Strakt salto 360 \(forlæns\)/],
    ] as const) {
      await page.getByLabel('Søg spring, kode eller alias').fill(query);
      await page.getByRole('button', { name }).click();
    }
    // Genskaber skærmbilledets forlæns afslutning og forklarer retningen uden at omskrive brugerens valg.
    await expect(page.getByText(/Element 4 er valgt som forlæns salto efter flik/)).toBeVisible();
    await page.getByRole('button', { name: 'Fjern element 4', exact: true }).click();
    await page.getByLabel('Søg spring, kode eller alias').fill('baglæns 360');
    await page.getByRole('button', { name: /^Strakt salto 360 \(baglæns\)/ }).click();
    await expect(page.getByText('Strakt – rondat – flik – helskrue', { exact: true })).toBeVisible();
    await expect(page.getByText('Gyldighed: Beregnet · forbindelse: Kendt', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('checkbox', { name: 'Gymnasten kan udføre hele serien uden mellemtrin' }),
    ).toHaveCount(0);
    await expect(
      page.getByText('Specialforbindelse uden kendt standardkobling', { exact: true }),
    ).toHaveCount(0);
    await expect(
      page.getByText('Element 4 er valgt som forlæns salto efter flik.', { exact: false }),
    ).toHaveCount(0);
    await page.getByRole('combobox', { name: 'Sikkerhed', exact: true }).selectOption('3');
    await expect(page.getByText('Strakt – rondat', { exact: true })).not.toBeVisible();
    await page.getByText('Medtagne kortere serier (3)', { exact: true }).click();
    await expect(page.getByText('Strakt · 3/5', { exact: true })).toBeVisible();
    await expect(page.getByText('Strakt – rondat · 3/5', { exact: true })).toBeVisible();
    await expect(page.getByText('Strakt – rondat – flik · 3/5', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: `tmp/ui-qa/standardserie-${width}.png` });
    await page.getByRole('button', { name: 'Registrér færdighed', exact: true }).click();
    await expect(
      page.getByRole('button', { name: /^Strakt – rondat – flik – helskrue.*3\/5/ }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
    await page.getByRole('button', { name: /Lokale ændringer/ }).click();
    await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
    expect(source.workspace.athleteSkills).toHaveLength(28);
    expect(source.workspace.athleteSkills.slice(24).every((item) => item.stability === 3)).toBe(true);
    const complete = source.workspace.skills.find(
      (item) => item.name === 'Strakt – rondat – flik – helskrue',
    );
    expect(complete?.discipline).toBe('tumbling');
    if (complete?.discipline !== 'tumbling') throw Error('disciplin');
    expect(complete.elements.at(-1)?.direction).toBe('backward');
    await page.reload();
    expect(source.failures).toEqual([]);
  });
}
