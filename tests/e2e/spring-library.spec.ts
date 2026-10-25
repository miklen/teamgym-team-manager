import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './test';
import { openWorkspace } from './drive-fixture';

test('ingen Grundspring eller løs baglæns salto i færdige valg, men alle elementer er tilgængelige i Byg selv', async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 900 });
  const source = await openWorkspace(page);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
  await page.getByRole('button', { name: /Maja Test Test 1/ }).click();
  await page.getByRole('button', { name: 'Tilføj færdighed' }).click();
  await expect(page.getByRole('option', { name: 'Grundspring', exact: true })).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Springgruppe', exact: true }).selectOption('Baglæns');
  await expect(page.getByRole('checkbox', { name: /^Rondat Baglæns/ })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: /^Lukket salto baglæns/ })).toHaveCount(0);
  await expect(page.getByRole('checkbox', { name: /^Flik-flak Baglæns/ })).toHaveCount(0);
  await expect(page.getByRole('checkbox', { name: /^Whipback Baglæns/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Byg selv', exact: true }).click();
  await page.getByLabel('Søg spring, kode eller alias').fill('baglæns salto');
  await page.getByRole('button', { name: /^Lukket salto \(baglæns\)/ }).click();
  await expect(page.getByText(/Serien mangler en indgang fra tilløb/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Registrér færdighed', exact: true })).toBeDisabled();
  await page.screenshot({ path: 'tmp/ui-qa/springindgang-390.png' });
  await page.getByLabel('Søg spring, kode eller alias').fill('rondat');
  await page.getByRole('button', { name: /^Rondat R/ }).click();
  await page.getByRole('button', { name: 'Flyt element 2 op', exact: true }).click();
  await expect(page.getByText(/Serien mangler en indgang fra tilløb/)).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Registrér færdighed', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Registrér færdighed', exact: true }).click();
  await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  const complete = source.workspace.skills.find(
    (item) =>
      item.discipline === 'tumbling' &&
      item.elements.length === 2 &&
      item.elements[0]!.family === 'roundoff' &&
      item.elements[1]!.family === 'salto' &&
      item.elements[1]!.bodyPositions[0] === 'tuck',
  );
  expect(complete).toBeDefined();
  expect(source.failures).toEqual([]);
});

for (const width of [1440, 390]) {
  test(`vælg flere spring med sikkerhed og arv fra laveste D ved ${width}`, async ({ page }) => {
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
    await page.getByRole('checkbox', { name: /^Rondat – flik – strakt 1\/1 \(360°\)/ }).check();
    await page
      .getByLabel('Sikkerhed for Rondat – flik – strakt 1/1 (360°)', { exact: true })
      .selectOption('5');
    await page.getByLabel('Søg sammensat spring eller alias').fill('rondat-flik-1/2');
    await page.getByRole('checkbox', { name: /^Rondat – flik – strakt 1\/2 \(180°\)/ }).check();
    await page
      .getByLabel('Sikkerhed for Rondat – flik – strakt 1/2 (180°)', { exact: true })
      .selectOption('2');
    await page.getByLabel('Vurderingsdato', { exact: true }).fill('2026-10-25');
    await expect(page.getByText('2 spring valgt · 2 kortere serier medtages', { exact: true })).toBeVisible();
    await page.getByText('Se sikkerhed på kortere serier', { exact: true }).click();
    await expect(page.getByText('Rondat · 2/5', { exact: true })).toBeVisible();
    await expect(page.getByText('Rondat – flik · 2/5', { exact: true })).toBeVisible();
    await expect(page.getByText(/Jeg har verificeret gymnastens præcise forbindelse/)).toHaveCount(0);
    await expect(
      page.getByRole('checkbox', { name: 'Medtag kortere serier med samme sikkerhed' }),
    ).toBeChecked();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(result.violations).toEqual([]);
    await page.getByLabel('Søg sammensat spring eller alias').fill('rondat flik strakt');
    await page.screenshot({ path: `tmp/ui-qa/springbibliotek-${width}.png` });
    await page.getByRole('button', { name: 'Registrér 2 spring', exact: true }).click();
    await expect(page.getByRole('button', { name: /^Rondat – flik – strakt 1\/1/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Rondat D:/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Rondat – flik D:/ })).toBeVisible();
    await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
    await page.getByRole('button', { name: /Lokale ændringer/ }).click();
    await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
    expect(source.workspace.athleteSkills).toHaveLength(28);
    expect(
      source.workspace.athleteSkills
        .slice(24)
        .every((item) => item.stability !== null && item.assessedAt === '2026-10-25'),
    ).toBe(true);
    await page.reload();
    await page.getByRole('button', { name: /Maja Test Test 1/ }).click();
    await expect(page.getByRole('button', { name: /^Rondat – flik – strakt 1\/1/ })).toBeVisible();
    expect(source.failures).toEqual([]);
  });
}

test('byg én gang, genbrug på anden gymnast med et selvstændigt valg af hele serien', async ({ page }) => {
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
    ['Strakt salto 360', /^Strakt salto 360 \(baglæns\)/],
  ] as const) {
    await page.getByLabel('Søg spring, kode eller alias').fill(query);
    await page.getByRole('button', { name }).click();
  }
  await page.getByLabel('Navn på færdighed').fill('Syntetisk egen serie');
  await page.getByRole('checkbox', { name: 'Medtag kortere serier med samme sikkerhed' }).uncheck();
  await expect(
    page.getByRole('checkbox', { name: 'Gymnasten kan udføre hele serien uden mellemtrin' }),
  ).toHaveCount(0);
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
  await page.getByRole('checkbox', { name: /^Syntetisk egen serie/ }).check();
  await expect(
    page.getByRole('checkbox', { name: 'Gymnasten kan udføre hele serien uden mellemtrin' }),
  ).toHaveCount(0);
  await page.getByRole('checkbox', { name: 'Medtag kortere serier med samme sikkerhed' }).uncheck();
  await page.getByRole('button', { name: 'Registrér 1 spring', exact: true }).click();
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
  expect(registrations[0]!.connectionConfirmation).toBeNull();
  expect(registrations[1]!.stability).toBeNull();
  expect(registrations[1]!.connectionConfirmation).toBeNull();
  expect(source.failures).toEqual([]);
});

test('valg bevares mellem grupper og discipliner, og en særskilt kortere vurdering har forrang', async ({
  page,
}) => {
  const source = await openWorkspace(page);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
  await page.getByRole('button', { name: /Maja Test Test 1/ }).click();
  await page.getByRole('button', { name: 'Tilføj færdighed' }).click();
  await page.getByLabel('Søg sammensat spring eller alias').fill('strakt kraft rudy');
  await page.getByRole('checkbox', { name: /^Strakt – kraftspring – rudy/ }).check();
  await page
    .getByLabel('Sikkerhed for Strakt – kraftspring – rudy (strakt 540°)', { exact: true })
    .selectOption('3');
  await page.getByLabel('Søg sammensat spring eller alias').fill('strakt kraft');
  await page.getByRole('checkbox', { name: /^Strakt – kraftspring Salto: forlæns Forlæns/ }).check();
  await page.getByLabel('Sikkerhed for Strakt – kraftspring', { exact: true }).selectOption('4');
  await page.getByRole('combobox', { name: 'Disciplin', exact: true }).selectOption('trampet');
  await page.getByRole('combobox', { name: 'Springgruppe', exact: true }).selectOption('Med redskab');
  await page.getByRole('checkbox', { name: /^Overslag Med redskab/ }).check();
  await page.getByLabel('Sikkerhed for Overslag', { exact: true }).selectOption('5');
  await page.getByRole('combobox', { name: 'Disciplin', exact: true }).selectOption('tumbling');
  await expect(page.getByRole('checkbox', { name: /^Strakt – kraftspring – rudy/ })).toBeChecked();
  await expect(
    page.getByRole('checkbox', { name: /^Strakt – kraftspring Salto: forlæns Forlæns/ }),
  ).toBeChecked();
  await page.getByRole('button', { name: 'Registrér 3 spring', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Strakt – kraftspring – rudy/ })).not.toContainText(
    'Forbindelse kræver bekræftelse',
  );
  await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  const athleteId = source.workspace.athletes[0]!.id;
  const selected = source.workspace.athleteSkills.filter((item) => item.athleteId === athleteId);
  const long = selected.find((item) =>
    source.workspace.skills.some(
      (skill) => skill.id === item.skillId && skill.name === 'Strakt – kraftspring – rudy (strakt 540°)',
    ),
  )!;
  const short = selected.find((item) =>
    source.workspace.skills.some(
      (skill) => skill.id === item.skillId && skill.name === 'Strakt – kraftspring',
    ),
  )!;
  expect(long.stability).toBe(3);
  expect(short.stability).toBe(4);
  expect(long.connectionConfirmation).not.toBeNull();
  expect(source.failures).toEqual([]);
});
