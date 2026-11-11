import AxeBuilder from '@axe-core/playwright';
import { chooseSpring, expectIncluded, expectRating, rate, ratingGroup, springRow } from './picker';
import { expect, test } from './test';
import { openWorkspace } from './drive-fixture';
import { registerAthleteSkill } from '@teamgym/domain';
import { salto, syntheticWorkspace } from '../fixtures/synthetic-workspace';

test('trampetnavne har grader i listen og efter registrering fra Byg selv, og Miller kan søges på bane', async ({
  page,
}) => {
  await page.setViewportSize({ width: 1280, height: 1150 });
  const fixture = syntheticWorkspace();
  const registered = registerAthleteSkill(fixture.workspace, fixture.athleteA.id, {
    id: 'synthetic-old-rudy',
    name: 'Strakt salto 540',
    archived: false,
    discipline: 'trampet',
    jump: {
      ...salto,
      direction: 'forward',
      apparatus: 'trampet',
      twistsHalfTurns: 3,
      twistDistribution: [3],
    },
  });
  const source = await openWorkspace(page, registered.workspace);
  await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
  await page.getByRole('button', { name: /Maja Test Test 1/ }).click();
  await expect(page.getByRole('button', { name: /^Rudy \(strakt 540°\)/ })).toBeVisible();
  await page.getByRole('button', { name: 'Tilføj færdighed' }).click();
  await page.getByRole('group', { name: 'Redskab', exact: true }).getByRole('button', { name: 'Trampet', exact: true }).click();
  for (const [query, name] of [
    ['rudy', /^Rudy \(strakt 540°\)/],
    ['overslag rudy', /^Overslag rudy \(strakt 540°\)/],
    ['randy', /^Randy \(strakt 900°\)/],
  ] as const) {
    await page.getByLabel('Søg sammensat spring eller alias').fill(query);
    await expect(springRow(page, name)).toBeVisible();
  }
  await page.getByLabel('Søg sammensat spring eller alias').fill('rudy');
  await expect(springRow(page, /dobbelt/i)).toHaveCount(0);
  await expect(springRow(page, /^Strakt salto 540(?:\s|$)/)).toHaveCount(0);
  await springRow(page, /^Rudy \(strakt 540°\)/).scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'tmp/ui-qa/springnavne-rettet.png', fullPage: true });
  await page.getByRole('button', { name: 'Byg selv', exact: true }).click();
  await page.getByLabel('Søg spring, kode eller alias').fill('randy');
  await page.getByRole('button', { name: /^Randy \(strakt 900°\)/ }).click();
  await page.getByRole('switch', { name: 'Medtag fundament automatisk' }).uncheck();
  await expectIncluded(springRow(page, /^Randy \(strakt 900°\)/));
  await page.getByRole('button', { name: 'Registrér færdighed', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Randy \(strakt 900°\)/ })).toBeVisible();
  await page.getByRole('button', { name: 'Tilføj færdighed' }).click();
  await page.getByRole('group', { name: 'Redskab', exact: true }).getByRole('button', { name: 'Bane', exact: true }).click();
  await page.getByRole('button', { name: 'Byg selv', exact: true }).click();
  await page.getByLabel('Søg spring, kode eller alias').fill('miller');
  await expect(page.getByRole('button', { name: /^Dobbelt strakt 3\/1 \(1080°\) baglæns/ })).toBeVisible();
  expect(source.failures).toEqual([]);
});

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
  await page.getByRole('button', { name: /^Bane, \d+ spring$/ }).click();
  await page.getByRole('button', { name: /^Rondat, \d+ spring$/ }).click();
  await expect(springRow(page, /^Rondat Baglæns/)).toBeVisible();
  await expect(springRow(page, /^Lukket salto baglæns/)).toHaveCount(0);
  await expect(springRow(page, /^Flik Baglæns/)).toHaveCount(0);
  await expect(springRow(page, /^Whipback Baglæns/)).toHaveCount(0);
  await page.getByRole('button', { name: 'Byg selv', exact: true }).click();
  await page.getByLabel('Søg spring, kode eller alias').fill('baglæns salto');
  await page.getByRole('button', { name: /^Lukket salto baglæns/ }).click();
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
    await chooseSpring(page, /^Rondat – flik – strakt 1\/1 \(360°\)/, 5);
    await page.getByLabel('Søg sammensat spring eller alias').fill('rondat-flik-1/2');
    await chooseSpring(page, /^Rondat – flik – strakt 1\/2 \(180°\)/, 2);
    await page.getByLabel('Vurderingsdato', { exact: true }).fill('2026-10-25');
    await expect(page.getByText('2 spring valgt · 5 fundament medtages', { exact: true })).toBeVisible();
    await expectRating(page, 'Vurdering for Rondat', 'Arvet');
    await expect(
      ratingGroup(page, 'Vurdering for Rondat – flik').getByRole('button', { name: /^Arvet/ }),
    ).toHaveText('Arvet 2/5');
    await expect(page.getByText(/Jeg har verificeret gymnastens præcise forbindelse/)).toHaveCount(0);
    await expect(page.getByRole('switch', { name: 'Medtag fundament automatisk' })).toBeChecked();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    const result = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(result.violations).toEqual([]);
    await page.getByLabel('Søg sammensat spring eller alias').fill('rondat flik strakt');
    await page.screenshot({ path: `tmp/ui-qa/springbibliotek-${width}.png` });
    await page.getByRole('button', { name: 'Registrér 2 spring', exact: true }).click();
    await expect(page.getByRole('button', { name: /^Rondat – flik – strakt 1\/1/ })).toBeVisible();
    await page.getByLabel('Find færdighed').fill('Rondat');
    await expect(page.getByRole('button', { name: /^Rondat D:/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Rondat – flik D:/ })).toBeVisible();
    await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
    await page.getByRole('button', { name: /Lokale ændringer/ }).click();
    await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
    expect(source.workspace.athleteSkills).toHaveLength(31);
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
  await page.getByRole('group', { name: 'Redskab i Byg selv', exact: true }).getByRole('button', { name: 'Bane', exact: true }).click();
  for (const [query, name] of [
    ['Rondat', /^Rondat R/],
    ['flic', /^Flik F/],
    ['flic', /^Flik F/],
    ['flic', /^Flik F/],
    ['Strakt salto 360', /^Strakt 1\/1 \(360°\) baglæns/],
  ] as const) {
    await page.getByLabel('Søg spring, kode eller alias').fill(query);
    await page.getByRole('button', { name }).click();
  }
  await page.getByLabel('Navn på færdighed').fill('Syntetisk egen serie');
  await page.getByRole('switch', { name: 'Medtag fundament automatisk' }).uncheck();
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
  await page.getByRole('button', { name: /^Bane, \d+ spring$/ }).click();
  await page.getByRole('button', { name: /^Rondat, / }).click();
  await page.getByRole('button', { name: /^Flik, / }).click();
  await page.getByLabel('Søg sammensat spring eller alias').fill('Syntetisk egen serie');
  await chooseSpring(page, /^Syntetisk egen serie/);
  await expect(
    page.getByRole('checkbox', { name: 'Gymnasten kan udføre hele serien uden mellemtrin' }),
  ).toHaveCount(0);
  await page.getByRole('switch', { name: 'Medtag fundament automatisk' }).uncheck();
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

test('redskabsfilteret Alle søger på tværs af bane og trampet, og kæden og Byg selv starter med redskab', async ({
  page,
}) => {
  const source = await openWorkspace(page);
  await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
  await page.getByRole('button', { name: /Maja Test Test 1/ }).click();
  await page.getByRole('button', { name: 'Tilføj færdighed' }).click();
  const apparatus = page.getByRole('group', { name: 'Redskab', exact: true });
  await expect(apparatus.getByRole('button', { name: 'Alle', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await page.getByLabel('Søg sammensat spring eller alias').fill('strakt 1/1');
  await expect(springRow(page, /· Bane$/).first()).toBeVisible();
  await expect(springRow(page, /· Trampet$/).first()).toBeVisible();
  await expect(page.locator('.spring-row-apparatus').first()).toBeVisible();
  await page.getByLabel('Søg sammensat spring eller alias').fill('');
  await page.getByRole('button', { name: /^Trampet, \d+ spring$/ }).click();
  await expect(apparatus.getByRole('button', { name: 'Trampet', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: /^Med redskab, / })).toBeVisible();
  await expect(springRow(page, /· Bane$/)).toHaveCount(0);
  await expect(page.locator('.spring-row-apparatus')).toHaveCount(0);
  await apparatus.getByRole('button', { name: 'Alle', exact: true }).click();
  await page.getByRole('button', { name: 'Byg selv', exact: true }).click();
  const builder = page.getByRole('group', { name: 'Redskab i Byg selv', exact: true });
  await expect(page.getByLabel('Søg spring, kode eller alias')).toHaveCount(0);
  await builder.getByRole('button', { name: 'Trampet', exact: true }).click();
  await page.getByLabel('Søg spring, kode eller alias').fill('randy');
  await expect(page.getByRole('button', { name: /^Randy \(strakt 900°\)/ })).toBeVisible();
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
  await page.getByLabel('Søg sammensat spring eller alias').fill('strakt kraft hel');
  await chooseSpring(page, /^Strakt salto – kraftspring – strakt 1\/1 \(360°\)/, 3);
  await page.getByLabel('Søg sammensat spring eller alias').fill('strakt kraft');
  await expectIncluded(springRow(page, /^Strakt salto – kraftspring Arvet fra/));
  await rate(page, 'Vurdering for Strakt salto – kraftspring', 4);
  await page.getByLabel('Søg sammensat spring eller alias').fill('');
  await page.getByRole('group', { name: 'Redskab', exact: true }).getByRole('button', { name: 'Trampet', exact: true }).click();
  await page.getByRole('button', { name: /^Med redskab, / }).click();
  await page.getByRole('button', { name: /^Overslag, / }).click();
  await chooseSpring(page, /^Overslag Med redskab/, 5);
  await page.getByRole('group', { name: 'Redskab', exact: true }).getByRole('button', { name: 'Bane', exact: true }).click();
  await expectIncluded(springRow(page, /^Strakt salto – kraftspring – strakt 1\/1 \(360°\)/));
  await expectIncluded(springRow(page, /^Strakt salto – kraftspring Fundament · Egen vurdering/));
  await page.getByRole('button', { name: 'Registrér 2 spring', exact: true }).click();
  await expect(
    page.getByRole('button', { name: /^Strakt salto – kraftspring – strakt 1\/1 \(360°\)/ }),
  ).not.toContainText('Forbindelse kræver bekræftelse');
  await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  const athleteId = source.workspace.athletes[0]!.id;
  const selected = source.workspace.athleteSkills.filter((item) => item.athleteId === athleteId);
  const long = selected.find((item) =>
    source.workspace.skills.some(
      (skill) => skill.id === item.skillId && skill.name === 'Strakt salto – kraftspring – strakt 1/1 (360°)',
    ),
  )!;
  const short = selected.find((item) =>
    source.workspace.skills.some(
      (skill) => skill.id === item.skillId && skill.name === 'Strakt salto – kraftspring',
    ),
  )!;
  expect(long.stability).toBe(3);
  expect(short.stability).toBe(4);
  expect(long.connectionConfirmation).toBeNull();
  expect(source.failures).toEqual([]);
});
