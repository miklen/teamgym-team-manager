import AxeBuilder from '@axe-core/playwright';
import {
  registerAthleteSkill,
  setOwnAssessment,
  setRoundEntries,
  skillIdentity,
  validateWorkspace,
} from '@teamgym/domain';
import { syntheticWorkspace } from '../fixtures/synthetic-workspace';
import {
  overviewWorkspace as repertoire,
  overviewFull as full,
  overviewHard as hard,
} from '../fixtures/overview-workspace';
import { openWorkspace } from './drive-fixture';
import { expect, test } from './test';

async function inspect(page: import('@playwright/test').Page) {
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
  await page.getByRole('button', { name: /Alma Eksempel/ }).click();
}
for (const width of [1440, 390])
  for (const count of [1, 22, 120]) {
    test(`familier ${count} registreringer ved ${width}: søgning, tastatur og vurdering`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 1000 });
      const workspace = repertoire(count);
      expect(workspace.athleteSkills).toHaveLength(count);
      const source = await openWorkspace(page, workspace);
      await inspect(page);
      await page.screenshot({ path: `tmp/ui-qa/repertoire-${count}-${width}.png`, animations: 'disabled' });
      await page.getByLabel('Find færdighed', { exact: true }).fill('Syntetisk søgevariant');
      const row = page.getByRole('button', { name: /^Syntetisk søgevariant D:/ });
      await expect(row).toBeVisible();
      await row.focus();
      await page.keyboard.press('Enter');
      await page.getByRole('radio', { name: '4', exact: true }).check();
      await page.getByLabel('Vurderingsdato', { exact: true }).fill('2026-10-26');
      await page.getByRole('button', { name: 'Opdatér vurdering', exact: true }).click();
      await expect(row).toContainText('4/5');
      const accessibility = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
        .analyze();
      expect(accessibility.violations).toEqual([]);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      const dialog = page.getByRole('dialog');
      expect(await dialog.evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true);
      expect(source.failures).toEqual([]);
    });
  }

test('minimum-D, direkte fravalg, egen sikkerhed og valg på tværs af discipliner', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  const source = await openWorkspace(page, repertoire(0));
  await inspect(page);
  await page.getByRole('button', { name: 'Tilføj færdighed' }).click();
  await page.getByLabel('Minimum-D', { exact: true }).fill('0,80');
  await page.getByLabel('Søg sammensat spring eller alias').fill('rondat-flik-1/1');
  await page.getByRole('checkbox', { name: /^Rondat – flik – strakt 1\/1/ }).check();
  await page.getByLabel('Sikkerhed for Rondat – flik – strakt 1/1 (360°)', { exact: true }).selectOption('3');
  const review = page.getByRole('region', { name: 'Springvælger', exact: true });
  await expect(review.getByRole('checkbox', { name: /^Rondat Arvet/ })).toBeChecked();
  await review.getByRole('checkbox', { name: /^Rondat Arvet/ }).uncheck();
  await expect(review.getByRole('checkbox', { name: /^Rondat Fravalgt/ })).toBeFocused();
  await review.getByLabel('Vurdering for Rondat – flik', { exact: true }).selectOption('2');
  await page.getByRole('combobox', { name: 'Disciplin', exact: true }).selectOption('trampet');
  await page.getByLabel('Søg sammensat spring eller alias').fill('rudi');
  await page.getByRole('checkbox', { name: /^Rudy · strakt 540°/ }).check();
  await expect(review).toContainText('Rondat – flik – strakt 1/1');
  await expect(review).toContainText('Fravalgt');
  await page.getByRole('checkbox', { name: 'Kun valgte', exact: true }).check();
  await expect(review.locator('[data-spring-identity]')).toHaveCount(13);
  expect(
    await review
      .locator('[data-spring-identity]')
      .evaluateAll((rows) => new Set(rows.map((row) => row.getAttribute('data-spring-identity'))).size),
  ).toBe(13);
  await page.screenshot({ path: 'tmp/ui-qa/fundament-1440.png', animations: 'disabled' });
  await page.getByRole('button', { name: 'Registrér 2 spring' }).click();
  await expect(page.getByLabel('Find færdighed')).toBeVisible();
  await page.getByRole('button', { name: /^Rondat – flik – strakt 1\/1/ }).click();
  await page.getByRole('radio', { name: '5', exact: true }).check();
  await page.getByRole('button', { name: 'Opdatér vurdering' }).click();
  await page.getByLabel('Find færdighed').fill('Rondat');
  await expect(page.getByRole('button', { name: /^Rondat – flik D:.*2\/5/ })).toBeVisible();
  await page.getByRole('button', { name: /^Rondat – flik D:/ }).click();
  await page.getByRole('button', { name: 'Følg igen' }).click();
  await expect(page.getByRole('button', { name: /^Rondat – flik D:.*5\/5/ })).toBeVisible();
  await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  expect(source.workspace.inheritanceExclusions).toHaveLength(1);
  await page.reload();
  await page.getByRole('button', { name: /Alma Eksempel/ }).click();
  await expect(page.getByRole('button', { name: /^Rondat D:/ })).toHaveCount(0);
  expect(source.failures).toEqual([]);
});

test('dobbelt 540° viser uafklaret 180° og kræver afklaring eller direkte fravalg', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 1000 });
  const source = await openWorkspace(page, repertoire(0));
  await inspect(page);
  await page.getByRole('button', { name: 'Tilføj færdighed' }).click();
  await page.getByRole('combobox', { name: 'Disciplin', exact: true }).selectOption('trampet');
  await page.getByLabel('Søg sammensat spring eller alias').fill('dobbelt lukket 540');
  await page.getByRole('checkbox', { name: /^Dobbelt lukket → lukket salto 540°/ }).check();
  const review = page.getByRole('region', { name: 'Springvælger', exact: true });
  await expect(review).toContainText('Afklar skruefordeling');
  await expect(page.getByRole('button', { name: 'Registrér 1 spring' })).toBeDisabled();
  await review.getByRole('checkbox', { name: /Afklar skruefordeling/ }).uncheck();
  await expect(page.getByRole('button', { name: 'Registrér 1 spring' })).toBeEnabled();
  await review.getByRole('checkbox', { name: /Afklar skruefordeling/ }).check();
  await page.getByRole('combobox', { name: /^Skruefordeling for/ }).selectOption('2,1');
  await expect(page.getByRole('button', { name: 'Registrér 1 spring' })).toBeEnabled();
  await expect(review).toContainText('0° + 180°');
  const accessibility = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .analyze();
  expect(accessibility.violations).toEqual([]);
  await page.screenshot({ path: 'tmp/ui-qa/fundament-dobbelt-390.png', animations: 'disabled' });
  await page.getByRole('button', { name: 'Registrér 1 spring' }).click();
  await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  expect(
    source.workspace.skills.some(
      (skill) =>
        skill.discipline === 'trampet' &&
        skill.jump.twistsHalfTurns === 1 &&
        skill.jump.twistDistribution.join(',') === '0,1',
    ),
  ).toBe(true);
  expect(source.failures).toEqual([]);
});

test('ukendt D har egen adgang og et annulleret valg ændrer ikke arbejdsrummet', async ({ page }) => {
  let workspace = repertoire(0);
  if (full.discipline !== 'tumbling') throw Error('fixture');
  workspace = registerAthleteSkill(workspace, workspace.athletes[0]!.id, {
    ...full,
    id: 'synthetic-unknown-filter',
    name: 'Syntetisk ukendt variant',
    elements: [...full.elements.slice(0, 2), { ...full.elements[2]!, family: 'synthetic-unknown' }],
  }).workspace;
  const source = await openWorkspace(page, workspace);
  await inspect(page);
  await page.getByRole('button', { name: 'Tilføj færdighed' }).click();
  await page.getByLabel('Søg sammensat spring eller alias').fill('Syntetisk ukendt variant');
  await page.getByLabel('Minimum-D', { exact: true }).fill('0,80');
  await expect(page.getByRole('checkbox', { name: /^Syntetisk ukendt variant/ })).toHaveCount(0);
  await page.getByRole('checkbox', { name: 'Vis kun ukendt D' }).check();
  await expect(page.getByRole('checkbox', { name: /^Syntetisk ukendt variant/ })).toBeVisible();
  await page.getByRole('checkbox', { name: /^Syntetisk ukendt variant/ }).check();
  await page.getByRole('button', { name: '← Tilbage til færdigheder' }).click();
  await expect(page.getByRole('button', { name: 'Uændret', exact: true })).toBeDisabled();
  expect(source.puts).toBe(0);
  expect(source.workspace).toEqual(workspace);
  expect(source.failures).toEqual([]);
});

test('migration er et bevidst valg med eksport af original, annullering og separat gemning', async ({
  page,
}) => {
  const workspace = repertoire(1);
  const legacy = JSON.parse(JSON.stringify(workspace)) as Record<string, unknown>;
  legacy.schemaVersion = 1;
  delete legacy.inheritanceRelations;
  delete legacy.inheritanceExclusions;
  for (const registration of legacy.athleteSkills as Record<string, unknown>[])
    delete registration.assessmentOrigin;
  const original = JSON.stringify(legacy);
  const source = await openWorkspace(page, original);
  const migration = page.getByRole('dialog', { name: 'Opgradér arbejdsrummet', exact: true });
  await expect(migration).toBeVisible();
  const download = page.waitForEvent('download');
  await migration.getByRole('button', { name: 'Eksportér original' }).click();
  await download;
  await migration.getByRole('button', { name: 'Annuller' }).click();
  expect(source.puts).toBe(0);
  await page.reload();
  await migration.getByRole('button', { name: 'Opgradér lokal kladde' }).click();
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  expect(source.workspace.schemaVersion).toBe(1);
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  expect(source.workspace.schemaVersion).toBe(2);
  expect(source.workspace.athleteSkills[0]!.assessmentOrigin.kind).toBe('own');
  expect(source.failures).toEqual([]);
});

test('en af seks: egen D og sikkerhed er synlig, mens omgangsbidraget er ufuldstændigt', async ({ page }) => {
  let workspace = repertoire(0);
  const athleteId = workspace.athletes[0]!.id;
  const added = registerAthleteSkill(workspace, athleteId, full);
  workspace = setOwnAssessment(added.workspace, added.athleteSkillId, {
    stability: 5,
    assessedAt: '2026-10-26',
    note: '',
  });
  const harder = registerAthleteSkill(workspace, athleteId, hard);
  workspace = setOwnAssessment(harder.workspace, harder.athleteSkillId, {
    stability: 2,
    assessedAt: '2026-10-26',
    note: '',
  });
  const registration = workspace.athleteSkills.find((item) => item.id === added.athleteSkillId)!;
  const plan = workspace.plans[0]!;
  workspace = setRoundEntries(
    workspace,
    plan.id,
    'tumbling',
    plan.tumbling[0].id,
    [
      {
        id: 'synthetic-entry',
        athleteId: workspace.athletes[0]!.id,
        athleteSkillId: registration.id,
        role: 'counting',
      },
    ],
    { counting: 6, extra: 2 },
  );
  const source = await openWorkspace(page, workspace);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  const row = page.locator('.round-entries > li').first();
  await expect(row.locator('.entry-value')).toContainText('0,800');
  await expect(row.locator('.entry-value')).toContainText('5/5');
  await expect(row).toContainText('Bidrag til omgang: Ufuldstændig');
  await page
    .getByRole('button', { name: /Alma Eksempel/ })
    .first()
    .click();
  await page.getByRole('button', { name: 'Spring', exact: true }).click();
  await expect(page.getByRole('option', { name: /1\/1.*D 0,800.*5\/5/ })).toHaveCount(1);
  await expect(page.getByRole('option', { name: /2\/1.*D 1,000.*2\/5/ })).toHaveCount(1);
  expect(source.failures).toEqual([]);
});

test('rytme: sikkerhed ved oprettelse, påkrævet dato, Ikke vurderet og dubletgenbrug', async ({ page }) => {
  const source = await openWorkspace(page, repertoire(0));
  await inspect(page);
  await page.getByRole('button', { name: 'Tilføj færdighed' }).click();
  await page.getByRole('combobox', { name: 'Disciplin', exact: true }).selectOption('rhythm');
  await page.getByRole('combobox', { name: 'Moment', exact: true }).selectOption('rh-hb-handstand');
  await expect(page.getByLabel('Navn på færdighed')).toHaveCount(0);
  await page.getByRole('combobox', { name: 'Sikkerhed', exact: true }).selectOption('3');
  await page.getByLabel('Vurderingsdato', { exact: true }).fill('');
  await page.getByRole('button', { name: 'Registrér færdighed' }).click();
  await expect(page.getByLabel('Vurderingsdato', { exact: true })).toBeVisible();
  await page.getByLabel('Vurderingsdato', { exact: true }).fill('2026-10-26');
  await page.getByRole('button', { name: 'Registrér færdighed' }).click();
  await expect(page.getByRole('button', { name: /^Håndstand D:.*3\/5/ })).toBeVisible();
  await page.getByRole('button', { name: 'Tilføj færdighed' }).click();
  await page.getByRole('combobox', { name: 'Disciplin', exact: true }).selectOption('rhythm');
  await page.getByRole('combobox', { name: 'Moment', exact: true }).selectOption('rh-hb-headstand');
  await page.getByRole('button', { name: 'Registrér færdighed' }).click();
  await expect(page.getByRole('button', { name: /^Hovedstand D:.*Ikke vurderet/ })).toBeVisible();
  await page.getByRole('button', { name: 'Tilføj færdighed' }).click();
  await page.getByRole('combobox', { name: 'Disciplin', exact: true }).selectOption('rhythm');
  await page.getByRole('combobox', { name: 'Moment', exact: true }).selectOption('rh-hb-handstand');
  await page.getByRole('button', { name: 'Registrér færdighed' }).click();
  await expect(page.getByRole('button', { name: 'Opdatér vurdering' })).toBeVisible();
  await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  expect(source.workspace.athleteSkills).toHaveLength(2);
  expect(source.workspace.athleteSkills.find((item) => item.stability === null)?.assessedAt).toBeNull();
  expect(source.failures).toEqual([]);
});

test('arvet planplads følger parentens sikkerhed og dato, men beholder D; fjernelse forklarer børn', async ({
  page,
}) => {
  let workspace = repertoire(0);
  if (full.discipline !== 'tumbling') throw Error('fixture');
  const parent = registerAthleteSkill(workspace, workspace.athletes[0]!.id, full);
  workspace = setOwnAssessment(parent.workspace, parent.athleteSkillId, {
    stability: 3,
    assessedAt: '2026-10-25',
    note: '',
  });
  const prefix = {
    ...full,
    id: 'synthetic-prefix',
    name: 'Rondat – flik',
    elements: full.elements.slice(0, 2),
    connection: { kind: 'standard' as const, transitions: ['direct'] },
  };
  const child = registerAthleteSkill(workspace, workspace.athletes[0]!.id, prefix);
  workspace = child.workspace;
  Object.assign(
    workspace.athleteSkills.find((item) => item.id === child.athleteSkillId)!,
    {
      stability: 3,
      assessedAt: '2026-10-25',
      assessmentOrigin: { kind: 'inherited', sourceId: parent.athleteSkillId, sourceChoice: null },
    },
  );
  workspace.inheritanceRelations.push({
    sourceId: parent.athleteSkillId,
    targetId: child.athleteSkillId,
    sourceIdentity: skillIdentity(full),
    targetIdentity: skillIdentity(prefix),
    catalogId: 'spring-foundation',
    catalogVersion: '1',
    relationId: 'exact-prefix',
  });
  const plan = workspace.plans[0]!;
  workspace = setRoundEntries(
    validateWorkspace(workspace),
    plan.id,
    'tumbling',
    plan.tumbling[0].id,
    [
      {
        id: 'synthetic-child-slot',
        athleteId: workspace.athletes[0]!.id,
        athleteSkillId: child.athleteSkillId,
        role: 'counting',
      },
    ],
    { counting: 6, extra: 2 },
  );
  const source = await openWorkspace(page, workspace);
  await inspect(page);
  const toggle = page.getByRole('button', { name: /^(Skjul|Vis) fundament/ });
  await toggle.focus();
  await page.keyboard.press('Enter');
  await expect(toggle).toBeFocused();
  await page.keyboard.press('Enter');
  await page.getByRole('button', { name: /^Rondat – flik – strakt 1\/1/ }).click();
  await page.getByRole('radio', { name: '5', exact: true }).check();
  await page.getByLabel('Vurderingsdato', { exact: true }).fill('2026-10-26');
  await page.getByRole('button', { name: 'Opdatér vurdering' }).click();
  await page.getByRole('button', { name: 'Fjern færdighed', exact: true }).click();
  const removal = page.getByRole('dialog', { name: 'Fjern færdighed', exact: true });
  await expect(removal).toContainText('Rondat – flik');
  await expect(removal).toContainText('følger kilden');
  await removal.getByRole('button', { name: 'Annuller' }).click();
  await expect(page.getByRole('button', { name: 'Fjern færdighed', exact: true })).toBeFocused();
  await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  await expect(page.locator('.round-entries > li').first().locator('.entry-value')).toContainText('0,300');
  await expect(page.getByText('5,0/5', { exact: true })).toHaveCount(1);
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  expect(source.workspace.athleteSkills.find((item) => item.id === child.athleteSkillId)).toMatchObject({
    stability: 5,
    assessedAt: '2026-10-26',
  });
  expect(source.failures).toEqual([]);
});

test('kendt egen D 0,80 med bidrag 0,00 samt ekstra og ukendt egen D', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 1000 });
  let workspace = syntheticWorkspace().workspace;
  const athlete = workspace.athletes[0]!;
  const extra = workspace.athletes[6]!;
  const first = registerAthleteSkill(workspace, athlete.id, full);
  workspace = setOwnAssessment(first.workspace, first.athleteSkillId, {
    stability: 5,
    assessedAt: '2026-10-26',
    note: '',
  });
  const extraSkill = registerAthleteSkill(workspace, extra.id, full);
  workspace = setOwnAssessment(extraSkill.workspace, extraSkill.athleteSkillId, {
    stability: 4,
    assessedAt: '2026-10-26',
    note: '',
  });
  const plan = workspace.plans[0]!;
  plan.tumbling[0].entries[0]!.athleteSkillId = first.athleteSkillId;
  plan.tumbling[0].entries.unshift({
    id: 'synthetic-extra-slot',
    athleteId: extra.id,
    athleteSkillId: extraSkill.athleteSkillId,
    role: 'extra',
  });
  if (full.discipline !== 'tumbling') throw Error('fixture');
  const unknown = {
    ...full,
    id: 'synthetic-unknown',
    name: 'Syntetisk uafklaret dobbelt',
    elements: [
      ...full.elements.slice(0, 2),
      {
        ...full.elements[2]!,
        family: 'synthetic-unknown',
        rotationQuarterTurns: 8,
        bodyPositions: ['tuck', 'tuck'] as 'tuck'[],
        twistsHalfTurns: 3,
        twistDistribution: [],
      },
    ],
  };
  const added = registerAthleteSkill(workspace, athlete.id, unknown);
  workspace = added.workspace;
  workspace.plans[0]!.tumbling[1].entries[0]!.athleteSkillId = added.athleteSkillId;
  const source = await openWorkspace(page, validateWorkspace(workspace));
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  const firstRound = page.getByRole('region', { name: '1. omgang', exact: true });
  const counting = firstRound.locator('.round-entries > li').nth(1);
  await expect(counting.locator('.entry-value')).toContainText('0,800');
  await expect(counting).toContainText('Bidrag til omgang: 0,000');
  await expect(firstRound.locator('.round-entries > li').first()).toContainText('EKSTRA');
  await expect(firstRound.locator('.round-entries > li').first().locator('.entry-value')).toContainText(
    '0,800',
  );
  await expect(
    page
      .getByRole('region', { name: '2. omgang', exact: true })
      .locator('.round-entries > li')
      .first()
      .locator('.entry-value'),
  ).toContainText('Uafklaret');
  expect(source.failures).toEqual([]);
});
