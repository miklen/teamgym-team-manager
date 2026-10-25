import AxeBuilder from '@axe-core/playwright';
import { createAthlete, registerAthleteSkill, setArchived, updateAssessment } from '@teamgym/domain';
import type { ElementExecution } from '@teamgym/domain';
import { salto, syntheticWorkspace } from '../fixtures/synthetic-workspace';
import { expect, test } from './test';
import { openWorkspace } from './drive-fixture';

const fullName = 'Rondat – flik – strakt 1/1 (360°)';
const backBackName = 'Rondat – lukket salto baglæns – lukket salto baglæns';
const backFrontName = 'Rondat – lukket salto baglæns – lukket salto forlæns';

for (const width of [1440, 390]) {
  test(`Alle hold er standard og medtager gymnaster uden hold ved ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const fixture = syntheticWorkspace();
    let workspace = createAthlete(fixture.workspace, {
      name: 'Syntetisk fra andet hold',
      teamId: fixture.teamB.id,
    });
    workspace = createAthlete(workspace, { name: 'Syntetisk uden hold', teamId: null });
    workspace = createAthlete(workspace, { name: 'Syntetisk inaktiv', teamId: null });
    workspace = setArchived(workspace, 'athletes', workspace.athletes.at(-1)!.id, true);
    const source = await openWorkspace(page, workspace);
    await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
    const filter = page.getByRole('combobox', { name: 'Holdfilter', exact: true });
    await expect(filter).toHaveValue('all');
    await expect(page.getByRole('button', { name: /Syntetisk fra andet hold/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Syntetisk uden hold/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Syntetisk inaktiv/ })).toHaveCount(0);
    await filter.selectOption(fixture.teamA.id);
    await expect(page.getByRole('button', { name: /Maja Test Test 1/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Syntetisk uden hold/ })).toHaveCount(0);
    await filter.selectOption('none');
    await expect(page.getByRole('button', { name: /Syntetisk uden hold/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /Syntetisk fra andet hold/ })).toHaveCount(0);
    await filter.selectOption('all');
    await page.getByLabel('Søg gymnast').fill('uden hold');
    await expect(page.getByRole('button', { name: /Syntetisk uden hold/ })).toBeVisible();
    await page.reload();
    await expect(filter).toHaveValue('all');
    expect(source.puts).toBe(0);
    expect(source.failures).toEqual([]);
  });

  test(`fjern kun gymnastens færdighed og tilføj den igen uden dubletter ved ${width}`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const fixture = syntheticWorkspace();
    const roundoff: ElementExecution = {
      ...salto,
      family: 'roundoff',
      takeoff: 'one-foot',
      twistsHalfTurns: 0,
      twistDistribution: [],
    };
    const flic: ElementExecution = { ...roundoff, family: 'flic', takeoff: 'two-feet' };
    const elements = [roundoff, flic, salto];
    let workspace = fixture.workspace;
    for (const [length, name] of [
      [1, 'Rondat'],
      [2, 'Rondat – flik'],
      [3, fullName],
    ] as const) {
      const added = registerAthleteSkill(workspace, fixture.athleteA.id, {
        id: `synthetic-composed-${length}`,
        name,
        archived: false,
        discipline: 'tumbling',
        elements: elements.slice(0, length),
        connection: { kind: 'standard', transitions: elements.slice(1, length).map(() => 'direct') },
      });
      workspace = updateAssessment(added.workspace, added.athleteSkillId, {
        stability: 5,
        assessedAt: '2026-10-24',
        note: 'Syntetisk personlig note',
      });
    }
    const original = workspace.athleteSkills.find(
      (item) =>
        item.athleteId === fixture.athleteA.id &&
        workspace.skills.find((skill) => skill.id === item.skillId)?.name === fullName,
    )!;
    for (const round of workspace.plans[0]!.tumbling) round.entries[0]!.athleteSkillId = original.id;
    const source = await openWorkspace(page, workspace);
    await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
    await page.getByRole('button', { name: /Maja Test Test 1/ }).click();
    const fullRow = page.getByRole('button', { name: new RegExp(`^Rondat – flik – strakt 1/1`) });
    await fullRow.click();
    await page.getByRole('button', { name: 'Fjern færdighed', exact: true }).click();
    const confirmation = page.getByRole('dialog', { name: 'Fjern færdighed', exact: true });
    await expect(confirmation).toContainText('3 pladser');
    const confirmationAccessibility = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
      .analyze();
    expect(confirmationAccessibility.violations).toEqual([]);
    await page.screenshot({ path: `tmp/ui-qa/fjern-faerdighed-${width}.png`, animations: 'disabled' });
    await confirmation.getByRole('button', { name: 'Annuller', exact: true }).click();
    await expect(fullRow).toBeVisible();
    await page.getByRole('button', { name: 'Fjern færdighed', exact: true }).click();
    await confirmation.getByRole('button', { name: 'Fjern færdighed', exact: true }).click();
    await expect(fullRow).toHaveCount(0);
    await expect(page.getByRole('button', { name: 'Tilføj færdighed', exact: true })).toBeFocused();
    await expect(page.getByRole('button', { name: /^Rondat D:/ })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Rondat – flik D:/ })).toBeVisible();
    await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
    await page.getByRole('link', { name: 'Springplan', exact: true }).click();
    await expect(
      page
        .getByText('Færdigheden er fjernet fra gymnasten. Vælg en anden færdighed.', { exact: true })
        .first(),
    ).toBeVisible();
    await page.getByRole('button', { name: /Lokale ændringer/ }).click();
    await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
    expect(source.workspace.plans).toEqual(workspace.plans);
    expect(source.workspace.skills).toEqual(workspace.skills);
    expect(source.workspace.athleteSkills.filter((item) => item.id !== original.id)).toEqual(
      workspace.athleteSkills.filter((item) => item.id !== original.id),
    );
    await page.reload();
    await expect(
      page
        .getByText('Færdigheden er fjernet fra gymnasten. Vælg en anden færdighed.', { exact: true })
        .first(),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Vurdering', exact: true }).first().click();
    await expect(fullRow).toContainText('Fjernet');
    await expect(page.getByRole('button', { name: 'Fjern færdighed', exact: true })).toBeDisabled();
    await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
    await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
    await page.getByRole('button', { name: /Maja Test Test 1/ }).click();
    await page.getByRole('button', { name: 'Tilføj færdighed', exact: true }).click();
    await page.getByLabel('Søg sammensat spring eller alias').fill('rondat-flik-1/1');
    await page.getByRole('checkbox', { name: /^Rondat – flik – strakt 1\/1/ }).check();
    await page.getByLabel(`Sikkerhed for ${fullName}`, { exact: true }).selectOption('4');
    await page.getByLabel('Medtag kortere serier med samme sikkerhed').uncheck();
    await page.getByRole('button', { name: 'Registrér 1 spring', exact: true }).click();
    await expect(fullRow).toBeVisible();
    await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
    await page.getByRole('button', { name: /Lokale ændringer/ }).click();
    await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
    expect(source.workspace.athleteSkills).toHaveLength(workspace.athleteSkills.length);
    expect(source.workspace.athleteSkills.find((item) => item.id === original.id)).toMatchObject({
      archived: false,
      skillId: original.skillId,
      stability: 4,
    });
    expect(source.puts).toBe(2);
    expect(source.failures).toEqual([]);
  });

  test(`vælg begge retninger i rondat-salto-salto og bevar dem efter genåbning ved ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    const source = await openWorkspace(page);
    await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
    await page.getByRole('button', { name: /Maja Test Test 1/ }).click();
    await page.getByRole('button', { name: 'Tilføj færdighed', exact: true }).click();
    await page.getByLabel('Søg sammensat spring eller alias').fill('rondat salto salto');
    for (const [name, directions] of [
      [backBackName, 'baglæns → baglæns'],
      [backFrontName, 'baglæns → forlæns'],
    ] as const) {
      const choice = page.getByRole('checkbox', { name: new RegExp(`^${name} Saltoer:`) });
      await expect(choice).toHaveAccessibleName(new RegExp(directions));
      await choice.check();
      await page.getByLabel(`Sikkerhed for ${name}`, { exact: true }).selectOption('3');
    }
    await page.screenshot({ path: `tmp/ui-qa/saltoretninger-${width}.png`, animations: 'disabled' });
    await page.getByRole('button', { name: 'Registrér 2 spring', exact: true }).click();
    await expect(
      page.getByRole('button', { name: new RegExp(`^${backBackName} Saltoer: baglæns → baglæns`) }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: new RegExp(`^${backFrontName} Saltoer: baglæns → forlæns`) }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
    await page.getByRole('button', { name: /Lokale ændringer/ }).click();
    await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
    for (const [name, direction] of [
      [backBackName, 'backward'],
      [backFrontName, 'forward'],
    ] as const) {
      const saved = source.workspace.skills.find((item) => item.name === name)!;
      expect(saved.discipline).toBe('tumbling');
      if (saved.discipline === 'tumbling') expect(saved.elements[2]!.direction).toBe(direction);
    }
    await page.reload();
    await page.getByRole('button', { name: /Maja Test Test 1/ }).click();
    await expect(page.getByText('Saltoer: baglæns → forlæns', { exact: true })).toBeVisible();
    expect(source.failures).toEqual([]);
  });
}

test('fjern og tilføj samme rytmemoment igen uden gammel sikkerhed', async ({ page }) => {
  const fixture = syntheticWorkspace();
  const original = fixture.workspace.athleteSkills.find(
    (item) => item.athleteId === fixture.athleteA.id && item.skillId === 'skill-rhythm',
  )!;
  const source = await openWorkspace(page, fixture.workspace);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
  await page.getByRole('button', { name: /Maja Test Test 1/ }).click();
  await page.getByRole('button', { name: /^Syntetisk hovedstand/ }).click();
  await page.getByRole('button', { name: 'Fjern færdighed', exact: true }).click();
  await page
    .getByRole('dialog', { name: 'Fjern færdighed', exact: true })
    .getByRole('button', { name: 'Fjern færdighed', exact: true })
    .click();
  await expect(page.getByRole('button', { name: /^Syntetisk hovedstand/ })).toHaveCount(0);
  await page.getByRole('button', { name: 'Tilføj færdighed', exact: true }).click();
  await page.getByRole('combobox', { name: 'Disciplin', exact: true }).selectOption('rhythm');
  await page.getByRole('combobox', { name: 'Moment', exact: true }).selectOption('rh-hb-headstand');
  await page.getByRole('button', { name: 'Registrér færdighed', exact: true }).click();
  await expect(page.getByRole('button', { name: /^Syntetisk hovedstand.*Ikke vurderet/ })).toBeVisible();
  await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  expect(source.workspace.athleteSkills).toHaveLength(fixture.workspace.athleteSkills.length);
  expect(source.workspace.athleteSkills.find((item) => item.id === original.id)).toMatchObject({
    archived: false,
    stability: null,
    assessedAt: null,
    note: original.note,
  });
});

test('læseadgang kan ikke fjerne en færdighed', async ({ page }) => {
  const source = await openWorkspace(page, undefined, false);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
  await page.getByRole('button', { name: /Maja Test Test 1/ }).click();
  await page.getByRole('button', { name: /^Syntetisk hovedstand/ }).click();
  await expect(page.getByRole('button', { name: 'Fjern færdighed', exact: true })).toBeDisabled();
  expect(source.puts).toBe(0);
});
