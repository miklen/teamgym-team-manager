import AxeBuilder from '@axe-core/playwright';
import { createAthlete, registerAthleteSkill } from '@teamgym/domain';
import { overviewHard, overviewWorkspace } from '../fixtures/overview-workspace';
import { openWorkspace } from './drive-fixture';
import {
  chooseSpring,
  expectIncluded,
  expectRating,
  openDFilter,
  rate,
  ratingGroup,
  springRow,
  toggleSpring,
} from './picker';
import { expect, test } from './test';

for (const width of [1440, 390]) {
  test(`én samlet springvælger uden gentaget fundament ved ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 1000 });
    const source = await openWorkspace(page, overviewWorkspace(0));
    await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
    await page.getByRole('button', { name: /Alma Eksempel/ }).click();
    await page.getByRole('button', { name: 'Tilføj færdighed' }).click();
    const picker = page.getByRole('region', { name: 'Springvælger', exact: true });
    const search = page.getByLabel('Søg sammensat spring eller alias');
    await search.fill('rondat flik');
    // Ét tryk på sikkerheden vælger og vurderer springet.
    await chooseSpring(picker, /^Rondat – flik Baglæns/, 2);
    await expectRating(picker, 'Sikkerhed for Rondat – flik', 2);
    await search.fill('rondat-flik-1/1');
    await chooseSpring(picker, /^Rondat – flik – strakt 1\/1/);
    await rate(picker, 'Sikkerhed for Rondat – flik – strakt 1/1 (360°)', 5);
    await expect(springRow(picker, /^Rondat – flik Valgt direkte/)).toHaveCount(1);
    const identities = await picker
      .locator('[data-spring-identity]')
      .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-spring-identity')));
    expect(new Set(identities).size).toBe(identities.length);
    await expect(page.locator('.foundation-review')).toHaveCount(0);
    await expect(page.getByRole('region', { name: 'Valgte spring', exact: true })).toHaveCount(0);
    const selected = picker.getByRole('button', { name: /^Valgte/ });
    await selected.click();
    await expect(selected).toHaveAccessibleName('Valgte 2');
    await expect(picker.locator('[data-spring-identity]')).toHaveCount(6);
    await openDFilter(picker);
    await page.getByLabel('Minimum-D', { exact: true }).fill('2,00');
    await expect(picker.locator('[data-spring-identity]')).toHaveCount(6);
    // Det direkte valgte prefix bliver fundament under den længere serie, når det fjernes.
    const remove = ratingGroup(picker, 'Sikkerhed for Rondat – flik').getByRole('button', { name: 'Fjern' });
    await remove.focus();
    await page.keyboard.press('Enter');
    const excluded = springRow(picker, /^Rondat – flik Fravalgt/);
    await expect(
      ratingGroup(picker, 'Vurdering for Rondat – flik').getByRole('button', { name: 'Medtag igen' }),
    ).toBeFocused();
    await expectIncluded(excluded, false);
    await expect(picker.locator('[data-spring-identity]')).toHaveCount(6);
    await toggleSpring(picker, 'Vurdering for Rondat – flik');
    await rate(picker, 'Vurdering for Rondat – flik', 2);
    await expectIncluded(springRow(picker, /^Rondat – flik Fundament · Egen vurdering/));
    await search.fill('rondat flik');
    await expect(picker.getByRole('button', { name: /^Resultater/ })).toHaveAttribute('aria-pressed', 'true');
    await page.getByLabel('Minimum-D', { exact: true }).fill('');
    const after = await picker
      .locator('[data-spring-identity]')
      .evaluateAll((rows) => rows.map((row) => row.getAttribute('data-spring-identity')));
    expect(new Set(after).size).toBe(after.length);
    await picker.getByRole('button', { name: /^Valgte/ }).click();
    await picker.locator('.unified-spring-list').scrollIntoViewIfNeeded();
    const accessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(accessibility.violations).toEqual([]);
    expect(
      await page.getByRole('dialog').evaluate((element) => element.scrollWidth <= element.clientWidth),
    ).toBe(true);
    await page.screenshot({ path: `tmp/ui-qa/unified-spring-picker-${width}.png`, animations: 'disabled' });
    await page.getByRole('button', { name: 'Registrér 1 spring' }).click();
    await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
    await page.getByRole('button', { name: /Lokale ændringer/ }).click();
    await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
    expect(source.workspace.athleteSkills).toHaveLength(6);
    expect(source.failures).toEqual([]);
  });
}

/** Alma plus to syntetiske holdkammerater, der begge kan Rondat – flik – strakt 2/1. */
function teamWorkspace() {
  let workspace = overviewWorkspace(0);
  for (const name of ['Bo Eksempel', 'Cleo Eksempel']) {
    workspace = createAthlete(workspace, { name, teamId: workspace.teams[0]!.id });
    workspace = registerAthleteSkill(workspace, workspace.athletes.at(-1)!.id, {
      ...overviewHard,
      id: `synthetic-hard-${workspace.athletes.length}`,
    }).workspace;
  }
  return workspace;
}

for (const width of [1440, 390]) {
  test(`kædebygger, serier uden for listen og holdkendte spring i vælgeren ved ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const source = await openWorkspace(page, teamWorkspace());
    await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
    await page.getByRole('button', { name: /Alma Eksempel/ }).click();
    await page.getByRole('button', { name: 'Tilføj færdighed' }).click();
    const picker = page.getByRole('region', { name: 'Springvælger', exact: true });
    const rows = picker.locator('li[data-spring-identity]');
    const names = () => picker.locator('.spring-batch-choice strong').allTextContents();
    const known = springRow(picker, /^Rondat – flik – strakt 2\/1 \(720°\).*Kendt af 2 på holdet/);
    // Holdkendte spring står øverst uden søgning.
    await expect(rows.first()).toContainText('Kendt af 2 på holdet');
    await expect(rows.first()).toHaveAccessibleName(/^Rondat – flik – strakt 2\/1/);

    const chain = picker.getByRole('list', { name: 'Kæde', exact: true });
    const tray = (slot: string) => picker.getByRole('group', { name: `Valg til ${slot}`, exact: true });
    // Første plads er åben; Rondat har én variant, så kæden går videre af sig selv.
    await tray('Første spring')
      .getByRole('button', { name: /^Rondat, \d+ spring$/ })
      .click();
    const second = tray('2. spring');
    await expect(second.getByRole('button', { name: /^Flik, / })).toBeFocused();
    // Efter rondat tilbydes både flik og whipback.
    await expect(second.getByRole('button', { name: /^Whipback, \d+ spring$/ })).toBeVisible();
    await page.keyboard.press('Enter');
    await expect(chain.getByRole('button', { name: /^2\. spring: Flik$/ })).toBeVisible();
    for (const name of await names()) expect(name).toMatch(/^Rondat – flik/);
    await expect(known).toBeVisible();
    // Spring frem: alle strakte saltoer på tredje plads, præciseret med ét klik.
    const third = tray('3. spring');
    await expect(third.getByRole('button', { name: /^Lukket salto, / })).toBeVisible();
    await expect(third.getByRole('button', { name: /^Dobbelt lukket, / })).toBeVisible();
    // Dobbeltsaltoer præciseres med skruer som enkeltsaltoer.
    await third.getByRole('button', { name: /^Dobbelt strakt, \d+ spring$/ }).click();
    await expect(
      picker
        .getByRole('group', { name: 'Varianter af Dobbelt strakt', exact: true })
        .getByRole('button', { name: /^Dobbelt strakt 1\/1 \(360°\), \d+ spring$/ }),
    ).toBeVisible();
    await third.getByRole('button', { name: /^Strakt salto, \d+ spring$/ }).click();
    for (const name of await names()) expect(name).toMatch(/^Rondat – flik – strakt/);
    await picker
      .getByRole('group', { name: 'Varianter af Strakt salto', exact: true })
      .getByRole('button', { name: /^Strakt 1\/1 \(360°\), \d+ spring$/ })
      .click();
    await expect(
      chain.getByRole('button', { name: '3. spring: Strakt 1/1 (360°)', exact: true }),
    ).toBeVisible();
    const direct = springRow(picker, /^Rondat – flik – strakt 1\/1 \(360°\) (Valgt direkte )?Salto/);
    await chooseSpring(picker, /^Rondat – flik – strakt 1\/1 \(360°\) Salto/, 4);
    await expect(direct).toHaveAccessibleName(/Valgt direkte/);
    await expect(rows.first()).toHaveAttribute('data-selection', 'direct');
    await expect(picker.getByRole('status').filter({ hasText: 'spring valgt' })).toHaveText(
      /^1 spring valgt/,
    );
    // Kædens præcise valg kan tages med over i Byg selv.
    await expect(picker.getByText('Kæden, du har valgt, er lagt ind som start.')).toBeVisible();

    await picker.locator('.unified-spring-list').scrollIntoViewIfNeeded();
    const accessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(accessibility.violations).toEqual([]);
    expect(
      await page.getByRole('dialog').evaluate((element) => element.scrollWidth <= element.clientWidth),
    ).toBe(true);

    await page.screenshot({ path: `tmp/ui-qa/spring-chain-${width}.png`, animations: 'disabled' });

    // Ryd Flik: Rondat og tredje plads bevares, listen udvides, og valget består.
    await chain.getByRole('button', { name: 'Ryd 2. spring: Flik', exact: true }).click();
    await expect(chain.getByRole('button', { name: /^Første spring: Rondat$/ })).toBeVisible();
    await expect(chain.getByRole('button', { name: /^2\. spring: alle$/ })).toBeFocused();
    await expectIncluded(direct);

    // Næsten umulige serier, fx en dobbeltsalto som start, står uden for listen, også ved søgning.
    const search = page.getByLabel('Søg sammensat spring eller alias');
    await picker.getByRole('button', { name: /^Ryd / }).first().click();
    await picker.getByRole('button', { name: /^Ryd / }).first().click();
    await search.fill('dobbelt lukket');
    await expect(springRow(picker, /^Rondat – flik – dobbelt lukket salto/)).toBeVisible();
    await expect(springRow(picker, /^Dobbelt lukket/)).toHaveCount(0);
    await search.fill('rondat whipback');
    await expect(springRow(picker, /^Rondat – whipback/).first()).toBeVisible();
    const first = chain.getByRole('button', { name: /^Første spring/ });
    await first.click();
    if ((await first.getAttribute('aria-expanded')) !== 'true') await first.click();
    await tray('Første spring')
      .getByRole('button', { name: /^Rondat, / })
      .click();
    await picker.getByRole('button', { name: 'Nulstil søgning', exact: true }).click();
    await expect(picker.getByRole('button', { name: /^Ryd / })).toHaveCount(0);
    await expect(search).toHaveValue('');
    await expect(picker.getByRole('button', { name: 'Nulstil søgning', exact: true })).toHaveCount(0);
    await expectIncluded(direct);

    // Finder man ikke springet, fører Byg selv videre med kædens valg som start.
    if ((await first.getAttribute('aria-expanded')) !== 'true') await first.click();
    await tray('Første spring')
      .getByRole('button', { name: /^Rondat, / })
      .click();
    await picker.getByRole('button', { name: 'Byg det selv', exact: true }).click();
    await expect(page.getByRole('button', { name: 'Fjern element 1', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fjern element 2', exact: true })).toHaveCount(0);
    await expect(page.getByLabel('Navn på færdighed')).toBeVisible();
    expect(source.failures).toEqual([]);
  });
}
