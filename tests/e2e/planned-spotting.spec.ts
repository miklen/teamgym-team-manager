import AxeBuilder from '@axe-core/playwright';
import {
  createScenario,
  duplicateScenario,
  registerAthleteSkill,
  setPlannedSpot,
  setRoundEntries,
  updateAssessment,
  validateWorkspace,
} from '@teamgym/domain';
import type { ElementExecution, SkillDefinition } from '@teamgym/domain';
import type { Page } from '@playwright/test';
import { limits, syntheticWorkspace } from '../fixtures/synthetic-workspace';
import { overviewFull } from '../fixtures/overview-workspace';
import { scenarioWorkspace } from '../fixtures/scenario-workspace';
import { fourOfSix, openWorkspace } from './drive-fixture';
import { expect, test } from './test';

/** Syntetiske trampetspring med faste facit fra A4-tabellen: fri række 8 = 0,60, fri række 10 = 0,80. */
const straight = (twists: number): ElementExecution => ({
  family: 'salto', direction: 'forward', rotationQuarterTurns: 4, bodyPositions: ['straight'], twistsHalfTurns: twists,
  twistDistribution: [twists], apparatus: 'trampet', takeoff: 'two-feet', landing: 'feet', variant: {},
});
const jump060: SkillDefinition = { id: 'synthetic-jump-060', name: 'Syntetisk strakt 540', archived: false, discipline: 'trampet', jump: straight(3) };
const jump080: SkillDefinition = { id: 'synthetic-jump-080', name: 'Syntetisk strakt 900', archived: false, discipline: 'trampet', jump: straight(5) };
const pegasus: SkillDefinition = {
  id: 'synthetic-pegasus', name: 'Syntetisk mølleoverslag', archived: false, discipline: 'trampet',
  jump: { family: 'cartwheel-vault', direction: 'forward', rotationQuarterTurns: 4, bodyPositions: ['straight'], twistsHalfTurns: 0,
    twistDistribution: [], apparatus: 'pegasus', takeoff: 'two-feet', landing: 'feet', variant: {} },
};

/** Trampet: omgang 1 og 2 med seks × 0,60, omgang 3 med seks × 0,80. Tællende er Syntetisk gymnast 3–8. */
function spottingWorkspace(options: { pegasusRound?: boolean; extra?: boolean; tumblingSeries?: boolean } = {}) {
  const fixture = syntheticWorkspace();
  let workspace = fixture.workspace;
  const environment = fixture.environment;
  const register = (athleteId: string, definition: SkillDefinition) => {
    const added = registerAthleteSkill(workspace, athleteId, definition, environment);
    workspace = updateAssessment(added.workspace, added.athleteSkillId, { stability: 5, assessedAt: '2026-10-25', note: 'Syntetisk' }, environment);
    return added.athleteSkillId;
  };
  const planId = workspace.plans[0]!.id;
  const scenarioId = workspace.plans[0]!.trampet[0]!.id;
  const roundIds = workspace.plans[0]!.trampet[0]!.rounds.map((round) => round.id);
  const counting = workspace.athletes.slice(2, 8);
  roundIds.forEach((roundId, roundIndex) => {
    const entries = counting.map((athlete, index) => ({
      id: environment.id(), athleteId: athlete.id, role: 'counting' as const,
      athleteSkillId: register(athlete.id, roundIndex === 1 && index === 5 && options.pegasusRound ? pegasus : roundIndex === 2 ? jump080 : jump060),
    }));
    if (options.extra && roundIndex === 2)
      entries.unshift({ id: 'synthetic-extra-spot', athleteId: workspace.athletes[1]!.id, role: 'extra' as never, athleteSkillId: register(workspace.athletes[1]!.id, jump080) });
    workspace = setRoundEntries(workspace, planId, 'trampet', scenarioId, roundId, entries, limits, environment);
  });
  if (options.tumblingSeries) {
    const athlete = workspace.athletes[2]!;
    const registration = register(athlete.id, overviewFull);
    const round = workspace.plans[0]!.tumbling[0]!.rounds[1];
    const entries = round.entries.map((entry) => (entry.athleteId === athlete.id ? { ...entry, athleteSkillId: registration } : entry));
    workspace = setRoundEntries(workspace, planId, 'tumbling', workspace.plans[0]!.tumbling[0]!.id, round.id, entries, limits, environment);
  }
  return { workspace, planId, scenarioId, roundIds, environment };
}

async function trampet(page: Page) {
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  await page.getByRole('button', { name: 'Trampet', exact: true }).click();
}
const round = (page: Page, number: number) => page.getByRole('region', { name: `${number}. omgang`, exact: true });
const row = (page: Page, number: number, name: string) => round(page, number).locator('.round-entries > li').filter({ hasText: name });
const decimal = (text: string | null) => Number(text!.replace(',', '.'));

test('mus: kraftig hjælp og let støtte på trampet giver D-andel, E-linje, loft og pris', async ({ page }) => {
  const source = await openWorkspace(page, spottingWorkspace().workspace);
  await trampet(page);
  const maximum = page.locator('.maximum-metric');
  await expect(maximum).toContainText('Maks. mulig karakter · loft');
  await expect(maximum).toContainText('Beregnet · C + D + E-loft');
  await expect(page.locator('.analysis-strip')).toContainText('4,000');
  const before = decimal(await maximum.locator('strong').textContent());
  const third = round(page, 3);
  await expect(third.locator('.round-totals')).toContainText('4,800');
  await expect(third.locator('.round-execution')).toHaveCount(0);

  await third.getByRole('button', { name: 'Planlæg modtagning for Syntetisk gymnast 3', exact: true }).click();
  const editor = third.getByRole('group', { name: 'Planlagt modtagning · Syntetisk gymnast 3' });
  await expect(editor.getByRole('radio', { name: 'Ingen' })).toBeChecked();
  await editor.getByRole('radio', { name: /^Kraftig hjælp i svæv\/landing/ }).click();
  // Ét tryk vælger og lukker valget.
  await expect(editor).toHaveCount(0);
  const gymnast3 = row(page, 3, 'Syntetisk gymnast 3');
  const tag3 = gymnast3.getByRole('button', { name: 'Planlagt modtagning Kraftig hjælp i svæv/landing for Syntetisk gymnast 3. Ret', exact: true });
  await expect(tag3).toBeFocused();
  await expect(tag3).toHaveText('Kraftig');
  await expect(gymnast3.getByRole('img', { name: 'Sværhed: Egen D 0,800, bidrag med planlagt kraftig hjælp 0,400' })).toBeVisible();
  await expect(gymnast3.locator('.round-contribution')).toHaveCount(0);
  await expect(gymnast3.getByRole('img', { name: 'Sikkerhed: 5 af 5' })).toBeVisible();
  await expect(third.locator('.round-totals')).toContainText('4,400(heraf modtagning −0,400)');
  await expect(third.locator('.round-execution')).toHaveText(/Planlagt E-loft\s*9,000\s*E-fradrag −1,000 · 1 tællende modtagning/);
  await tag3.click();
  await expect(editor).toContainText('fødderne først');
  await expect(editor.getByRole('link', { name: /^A6 1\.7/ }).first()).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(editor).toHaveCount(0);
  await expect(tag3).toBeFocused();

  await third.getByRole('button', { name: 'Planlæg modtagning for Syntetisk gymnast 4', exact: true }).click();
  const editor4 = third.getByRole('group', { name: 'Planlagt modtagning · Syntetisk gymnast 4' });
  await expect(editor4).toContainText('E −0,5');
  await editor4.getByRole('radio', { name: /^Let støtte/ }).click();
  await expect(row(page, 3, 'Syntetisk gymnast 4').locator('.spot-trigger')).toHaveText('Let');
  await expect(row(page, 3, 'Syntetisk gymnast 4').locator('.round-contribution')).toHaveCount(0);
  await expect(row(page, 3, 'Syntetisk gymnast 4').locator('.plan-difficulty')).toHaveText('0,800');
  await third.getByRole('button', { name: /^Planlagt modtagning Let støtte for Syntetisk gymnast 4/ }).click();
  await expect(editor4).toContainText('Planlagt E-fradrag 0,5 pr. gymnast. D er uændret.');
  await page.mouse.click(5, 5);
  await expect(editor4).toHaveCount(0);
  await expect(third.locator('.round-execution')).toHaveText(/Planlagt E-loft\s*8,500\s*E-fradrag −1,500 · 2 tællende modtagninger/);
  // D: (3,60 + 3,60 + 4,40) / 3 = 3,8666… → 3,865. Pris: 0,40/3 + 1,50/3 = 0,6333…
  await expect(page.locator('.analysis-strip > div').first()).toContainText('3,865');
  await expect(maximum).toContainText('modtagning koster 0,633');
  const after = decimal(await maximum.locator('strong').textContent());
  expect(before - after).toBeGreaterThan(0.628);
  expect(before - after).toBeLessThan(0.639);
  await expect(maximum).not.toContainText(/forventet karakter[^:]/);
  await maximum.getByText('Om loftet').click();
  await expect(maximum).toContainText('overdommerfradrag og øvrige E-fradrag kan sænke resultatet yderligere');
  await expect(maximum.getByRole('link', { name: /H 10\.4/ })).toBeVisible();
  const guide = page.getByRole('region', { name: 'Guide til springplanens komposition' });
  await expect(guide.locator('.composition-guide-overview')).toContainText('Maks. mulig karakter');
  await expect(guide.locator('.composition-guide-overview')).toContainText('Maks. mulig karakter · loft13,365 · modtagning 0,633');

  expect(source.puts).toBe(0);
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  const saved = source.workspace.plans[0]!.trampet[0]!.rounds[2].entries;
  expect(saved[0]!.plannedSpot).toEqual({ grade: 'heavy', skillId: jump080.id, elementIndex: null });
  expect(saved[1]!.plannedSpot).toEqual({ grade: 'support', skillId: jump080.id, elementIndex: null });
  expect(source.workspace.athleteSkills.find((item) => item.id === saved[0]!.athleteSkillId)!.stability).toBe(5);
  expect(source.failures).toEqual([]);
});

test('tastatur og skærmlæser: kraftig hjælp på baneserie vælger sidste element og kan flyttes', async ({ page }) => {
  const source = await openWorkspace(page, spottingWorkspace({ tumblingSeries: true }).workspace);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  const second = round(page, 2);
  const open = second.getByRole('button', { name: 'Planlæg modtagning for Syntetisk gymnast 3', exact: true });
  await open.focus();
  await page.keyboard.press('Enter');
  await expect(open).toHaveAttribute('aria-expanded', 'true');
  const editor = second.getByRole('group', { name: 'Planlagt modtagning · Syntetisk gymnast 3' });
  // Fokus lander på det aktuelle valg; piletaster flytter valget uden at lukke.
  await expect(editor.getByRole('radio', { name: 'Ingen' })).toBeFocused();
  for (let step = 0; step < 3; step++) await page.keyboard.press('ArrowDown');
  await expect(editor.getByRole('radio', { name: /Kraftig hjælp/ })).toBeChecked();
  await editor.scrollIntoViewIfNeeded();
  await page.screenshot({ path: 'tmp/ui-qa/modtagning-valg.png', animations: 'disabled' });
  await expect(page.locator('p.sr-only[role="status"]').filter({ hasText: 'Planlagt modtagning for' })).toHaveText(
    'Planlagt modtagning for Syntetisk gymnast 3: Kraftig hjælp i svæv/landing.',
  );
  const elements = editor.getByRole('group', { name: 'Modtaget element' });
  await expect(elements.getByRole('radio').nth(2)).toBeChecked();
  await expect(elements.getByRole('radio', { name: /^3\. / })).toBeChecked();
  const gymnast = row(page, 2, 'Syntetisk gymnast 3');
  const tag = gymnast.getByRole('button', { name: /^Planlagt modtagning Kraftig hjælp i svæv\/landing · 3\. .* for Syntetisk gymnast 3\. Luk valg$/ });
  await expect(tag).toBeVisible();
  await expect(gymnast.getByRole('img', { name: /^Sværhed: Egen D .*, bidrag med planlagt kraftig hjælp / })).toBeVisible();
  await expect(round(page, 2).locator('.round-totals')).toContainText('heraf modtagning −');
  await page.keyboard.press('Tab');
  await expect(elements.getByRole('radio', { name: /^3\. / })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(elements.getByRole('radio', { name: /^1\. / })).toBeChecked();
  await page.keyboard.press('Enter');
  await expect(editor).toHaveCount(0);
  const closed = gymnast.getByRole('button', { name: /^Planlagt modtagning Kraftig hjælp i svæv\/landing · 1\. .* for Syntetisk gymnast 3\. Ret$/ });
  await expect(closed).toBeFocused();
  await expect(closed).toHaveText('Kraftig1');
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  const entry = source.workspace.plans[0]!.tumbling[0]!.rounds[1].entries.find((item) => item.athleteId === source.workspace.athletes[2]!.id)!;
  expect(entry.plannedSpot).toEqual({ grade: 'heavy', skillId: overviewFull.id, elementIndex: 0 });
  expect(source.failures).toEqual([]);
});

test('mobil: modtagning kan planlægges uden vandret rulning og uden axe-fejl', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await openWorkspace(page, spottingWorkspace().workspace);
  await trampet(page);
  await page.getByRole('button', { name: '3. Omgang', exact: true }).click();
  const third = round(page, 3);
  await third.getByRole('button', { name: 'Planlæg modtagning for Syntetisk gymnast 5', exact: true }).click();
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  await page.screenshot({ path: 'tmp/ui-qa/modtagning-valg-mobil.png', animations: 'disabled' });
  await third.getByRole('radio', { name: /^Hjælp til udførelse/ }).click();
  await expect(third.getByRole('button', { name: /^Planlagt modtagning Hjælp til udførelse for Syntetisk gymnast 5/ })).toHaveText('Hjælp');
  await expect(third.locator('.round-execution')).toContainText('E-loft 9,000');
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const result = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'])
    .include('.active-round')
    .include('.analysis-strip')
    .analyze();
  expect(result.violations.map((item) => ({ id: item.id, nodes: item.nodes.map((node) => node.target) }))).toEqual([]);
  await third.screenshot({ path: 'tmp/ui-qa/modtagning-mobil.png', animations: 'disabled' });
});

test('nulstillet modtagning vises med tekst og kan fjernes eller planlægges igen', async ({ page }) => {
  const setup = spottingWorkspace();
  const entries = setup.workspace.plans[0]!.trampet[0]!.rounds[2].entries;
  entries[0]!.plannedSpot = { grade: 'assist', skillId: 'skill-trampet', elementIndex: null };
  entries[1]!.plannedSpot = { grade: 'heavy', skillId: 'skill-trampet', elementIndex: null };
  const source = await openWorkspace(page, validateWorkspace(setup.workspace));
  await trampet(page);
  const third = round(page, 3);
  await expect(row(page, 3, 'Syntetisk gymnast 3')).toContainText('Modtagning nulstillet: springet er ændret.');
  await expect(third.locator('.round-execution')).toHaveCount(0);
  await expect(third.locator('.round-totals')).not.toContainText('heraf modtagning');
  await third.getByRole('button', { name: 'Fjern nulstillet modtagning for Syntetisk gymnast 4', exact: true }).click();
  await expect(row(page, 3, 'Syntetisk gymnast 4')).not.toContainText('nulstillet');
  await third.getByRole('button', { name: 'Planlæg modtagning igen for Syntetisk gymnast 3', exact: true }).click();
  await third.getByRole('radio', { name: /Let støtte/ }).click();
  await expect(row(page, 3, 'Syntetisk gymnast 3')).not.toContainText('nulstillet');
  await expect(third.getByRole('button', { name: /^Planlagt modtagning Let støtte for Syntetisk gymnast 3/ })).toBeVisible();
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  const saved = source.workspace.plans[0]!.trampet[0]!.rounds[2].entries;
  expect(saved[0]!.plannedSpot).toEqual({ grade: 'support', skillId: jump080.id, elementIndex: null });
  expect(saved[1]!.plannedSpot).toBeNull();
});

test('ekstra gymnast viser modtagning med teksten tæller ikke uden fradrag', async ({ page }) => {
  const setup = spottingWorkspace({ extra: true });
  const { planId, scenarioId, roundIds, environment } = setup;
  let workspace = setup.workspace;
  const entries = workspace.plans[0]!.trampet[0]!.rounds[2].entries;
  for (const entryId of [entries[0]!.id, entries[1]!.id])
    workspace = setPlannedSpot(workspace, planId, 'trampet', scenarioId, roundIds[2]!, entryId, { grade: 'assist' }, environment);
  await openWorkspace(page, workspace);
  await trampet(page);
  const third = round(page, 3);
  await expect(third.locator('.extra-entry .spot-trigger')).toContainText('tæller ikke');
  await expect(third.locator('.round-execution')).toHaveText(/Planlagt E-loft\s*9,000\s*E-fradrag −1,000 · 1 tællende modtagning · 1 ekstra tæller ikke/);
});

test('Maks. mulig karakter: tom, delvis, fuld og blandet Pegasus-omgang', async ({ page }) => {
  const setup = spottingWorkspace({ pegasusRound: true });
  const { planId, scenarioId, environment } = setup;
  let workspace = setup.workspace;
  workspace = createScenario(workspace, planId, 'trampet', scenarioId, 'Tom plan', environment);
  workspace = duplicateScenario(workspace, planId, 'trampet', scenarioId, 'Fuld plan', environment);
  const full = workspace.plans[0]!.trampet.find((item) => item.name === 'Fuld plan')!;
  const last = full.rounds[1].entries[5]!;
  last.athleteSkillId = workspace.athleteSkills.find((item) => item.athleteId === last.athleteId && item.skillId === jump060.id)!.id;
  await openWorkspace(page, validateWorkspace(workspace));
  await trampet(page);
  const maximum = page.locator('.maximum-metric');
  const guide = page.locator('.composition-guide-overview');
  await expect(maximum.locator('strong')).toHaveText('Ugyldig');
  await expect(guide).toContainText('Ugyldig');
  await expect(maximum).toContainText('Ugyldig omgang i planen');
  await maximum.getByRole('button', { name: '2. omgang er ugyldig', exact: true }).click();
  await expect(round(page, 2)).toBeFocused();
  await expect(round(page, 2)).toContainText('blander spring med og uden Pegasus');

  await page.getByRole('tab', { name: 'Tom plan', exact: true }).click();
  await expect(maximum.locator('strong')).toHaveText('Ufuldstændig');
  await expect(maximum.locator('strong')).not.toHaveText(/\d/);

  await page.getByRole('tab', { name: 'Fuld plan', exact: true }).click();
  await expect(maximum.locator('strong')).toHaveText(/^\d+,\d{3}$/);
  await expect(maximum).toContainText('Beregnet · C + D + E-loft');
  await round(page, 1).getByRole('button', { name: 'Handlinger for Syntetisk gymnast 3 i 1. omgang', exact: true }).click();
  await round(page, 1).getByRole('menuitem', { name: 'Fjern Syntetisk gymnast 3 fra 1. omgang', exact: true }).click();
  await expect(maximum.locator('strong')).toHaveText('Ufuldstændig');
  await expect(guide).toContainText('Ufuldstændig');
});

test('reserveindsættelse oplyser og fjerner pladsens modtagning', async ({ page }) => {
  let workspace = scenarioWorkspace();
  const plan = workspace.plans[0]!;
  const target = plan.tumbling[0]!.rounds[0];
  workspace = setPlannedSpot(workspace, plan.id, 'tumbling', plan.tumbling[0]!.id, target.id, target.entries[0]!.id, { grade: 'assist' });
  const source = await openWorkspace(page, workspace);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  const first = round(page, 1);
  await expect(first.locator('.round-entries > li').first().locator('.spot-trigger.active')).toHaveAttribute('aria-label', /^Planlagt modtagning Hjælp til udførelse for /);
  await first.locator('.reserve-section').getByRole('button', { name: 'Sæt ind', exact: true }).first().click();
  const dialog = page.getByRole('dialog', { name: 'Sæt reserve ind', exact: true });
  await dialog.getByLabel('Gymnast der udgår').selectOption({ index: 1 });
  await expect(dialog).toContainText('Pladsens planlagte modtagning (Hjælp til udførelse) bortfalder.');
  await dialog.getByLabel('Gymnast der udgår').selectOption({ index: 2 });
  await expect(dialog).not.toContainText('bortfalder');
  await dialog.getByLabel('Gymnast der udgår').selectOption({ index: 1 });
  await dialog.getByRole('button', { name: 'Bekræft indsættelse', exact: true }).click();
  await expect(first.locator('.round-entries > li').first()).toContainText('Syntetisk gymnast 7');
  await expect(first.locator('.round-entries > li').first().locator('.spot-trigger.active')).toHaveCount(0);
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  expect(source.workspace.plans[0]!.tumbling[0]!.rounds[0].entries[0]!.plannedSpot).toBeNull();
});

test('potentialeforslag viser bortfald af modtagning og fjerner den ved anvendelse', async ({ page }) => {
  let workspace = fourOfSix();
  const plan = workspace.plans[0]!;
  const scenario = plan.tumbling[0]!;
  const athleteId = workspace.athletes[4]!.id;
  for (const item of scenario.rounds) {
    const entry = item.entries.find((candidate) => candidate.athleteId === athleteId)!;
    workspace = setPlannedSpot(workspace, plan.id, 'tumbling', scenario.id, item.id, entry.id, { grade: 'assist' });
  }
  const source = await openWorkspace(page, workspace);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Springplan' }).click();
  const guide = page.getByRole('region', { name: 'Guide til springplanens komposition' });
  await guide.locator('.composition-guide-overview').click();
  const screw = guide.locator('.composition-guide-row').filter({ has: page.getByText('Skrue', { exact: true }) });
  await screw.locator('summary').click();
  await screw.getByRole('button', { name: 'Se konkrete ændringer' }).click();
  const preview = page.getByRole('dialog');
  await expect(preview).toContainText('Planlagt modtagning bortfalder (Hjælp til udførelse).');
  const removed = await preview.getByText('Planlagt modtagning bortfalder (Hjælp til udførelse).').count();
  expect(removed).toBeGreaterThan(0);
  const tags = page.locator('.spot-trigger.active[aria-label^="Planlagt modtagning Hjælp til udførelse"]');
  await expect(tags).toHaveCount(3);
  await preview.getByRole('button', { name: 'Opdater' }).click();
  await expect(tags).toHaveCount(3 - removed);
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  const remaining = source.workspace.plans[0]!.tumbling[0]!.rounds.flatMap((item) => item.entries).filter((entry) => entry.plannedSpot);
  expect(remaining).toHaveLength(3 - removed);
});
