import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './test';
import { openWorkspace } from './drive-fixture';

for (const width of [1440, 390]) {
  test(`vælg færdig helskrueserie med kortere begyndelser og gem/genåbn ved ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const source = await openWorkspace(page);
    await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
    await page.getByRole('button', { name: /Maja Test Test 1/ }).click();
    await page.getByRole('button', { name: 'Tilføj færdighed' }).click();
    await expect(page.getByRole('button', { name: 'Vælg fra listen', exact: true })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByLabel('Søg spring, kode eller alias')).toHaveCount(0);
    await page.getByLabel('Søg sammensat spring eller alias').fill('rondat-flik-1/1');
    await page.getByRole('button', { name: /^Rondat – flik – strakt 1\/1 \(360°\)/ }).click();
    await expect(page.getByText('Rondat · Rondat – Flik-flak', { exact: true })).toBeVisible();
    await expect(
      page.getByRole('checkbox', { name: 'Medtag kortere serier fra samme begyndelse' }),
    ).toBeChecked();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(result.violations).toEqual([]);
    await page.screenshot({ path: `tmp/ui-qa/springbibliotek-${width}.png` });
    await page.getByRole('button', { name: 'Registrér færdighed', exact: true }).click();
    await expect(page.getByRole('button', { name: /^Rondat – flik – strakt 1\/1/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Rondat D:/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Rondat – Flik-flak D:/ })).toBeVisible();
    await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
    await page.getByRole('button', { name: /Lokale ændringer/ }).click();
    await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
    expect(source.workspace.athleteSkills).toHaveLength(27);
    expect(
      source.workspace.athleteSkills
        .slice(24)
        .every((item) => item.stability === null && item.assessedAt === null),
    ).toBe(true);
    await page.reload();
    await page.getByRole('button', { name: /Maja Test Test 1/ }).click();
    await expect(page.getByRole('button', { name: /^Rondat – flik – strakt 1\/1/ })).toBeVisible();
    expect(source.failures).toEqual([]);
  });
}

test('byg én gang, genbrug på anden gymnast efter genåbning med selvstændig bekræftelse', async ({
  page,
}) => {
  const source = await openWorkspace(page);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
  await page.getByRole('button', { name: /Maja Test Test 1/ }).click();
  await page.getByRole('button', { name: 'Tilføj færdighed' }).click();
  await page.getByRole('button', { name: 'Byg selv', exact: true }).click();
  for (const [query, name] of [
    ['Rondat', /^Rondat R/],
    ['flic', /^Flik-flak F/],
    ['flic', /^Flik-flak F/],
    ['flic', /^Flik-flak F/],
    ['Strakt salto 360', /^Strakt salto 360 \/2/],
  ] as const) {
    await page.getByLabel('Søg spring, kode eller alias').fill(query);
    await page.getByRole('button', { name }).click();
  }
  await page.getByLabel('Navn på færdighed').fill('Syntetisk egen serie');
  await page.getByRole('checkbox', { name: 'Medtag kortere serier fra samme begyndelse' }).uncheck();
  await page.getByRole('checkbox', { name: 'Specialforbindelse uden kendt standardkobling' }).check();
  await page.getByRole('checkbox', { name: /Jeg har verificeret gymnastens præcise forbindelse/ }).check();
  await page.getByLabel('Beskrivelse af forbindelsen').fill('Observeret som direkte serie på gymnast A.');
  await page.getByRole('button', { name: 'Registrér færdighed', exact: true }).click();
  await page.getByRole('button', { name: /^Syntetisk egen serie/ }).click();
  await page.getByRole('radio', { name: '5', exact: true }).check();
  await page.getByRole('button', { name: 'Opdatér vurdering' }).click();
  await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: /Maja Test Test 2/ }).click();
  await page.getByRole('button', { name: 'Tilføj færdighed' }).click();
  await page.getByLabel('Springgruppe').selectOption('Egne spring');
  await page.getByLabel('Søg sammensat spring eller alias').fill('Syntetisk egen serie');
  await page.getByRole('button', { name: /^Syntetisk egen serie/ }).click();
  await expect(
    page.getByRole('checkbox', { name: /Jeg har verificeret gymnastens præcise forbindelse/ }),
  ).not.toBeChecked();
  await page.getByRole('checkbox', { name: 'Medtag kortere serier fra samme begyndelse' }).uncheck();
  await page.getByRole('button', { name: 'Registrér færdighed', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Syntetisk egen serie.*Ikke vurderet/ })).toBeVisible();
  await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  const registrations = source.workspace.athleteSkills.filter((item) =>
    source.workspace.skills.some(
      (skill) => skill.id === item.skillId && skill.name === 'Syntetisk egen serie',
    ),
  );
  expect(registrations).toHaveLength(2);
  expect(new Set(registrations.map((item) => item.skillId)).size).toBe(1);
  expect(registrations[0]!.stability).toBe(5);
  expect(registrations[0]!.connectionConfirmation).not.toBeNull();
  expect(registrations[1]!.stability).toBeNull();
  expect(registrations[1]!.connectionConfirmation).toBeNull();
  expect(source.failures).toEqual([]);
});
