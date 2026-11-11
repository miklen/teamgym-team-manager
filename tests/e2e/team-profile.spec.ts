import AxeBuilder from '@axe-core/playwright';
import type { Locator, Page } from '@playwright/test';
import { registerAthleteSkill } from '@teamgym/domain';
import type { SkillDefinition } from '@teamgym/domain';
import { profileSprings, profileWorkspace } from '../fixtures/profile-workspace';
import { salto, trampetSkill } from '../fixtures/synthetic-workspace';
import { openWorkspace } from './drive-fixture';
import { expect, test } from './test';

const { flik, layout, full, double, whipFull } = profileSprings;
const escape = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const row = (page: Page, name: string) =>
  page.getByRole('button', { name: new RegExp(`^${escape(name)}, D `) });
const status = (button: Locator) => button.locator('.row-status');

async function openProfile(page: Page) {
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Holdprofil', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Holdprofil', level: 1 })).toBeVisible();
}

test('holdprofil viser trapper, status, detaljer og fokus uden at ændre data', async ({ page }) => {
  const source = await openWorkspace(page, profileWorkspace());
  await openProfile(page);
  expect(new URL(page.url()).hash).toMatch(/\/hold\/[^/]+\/profil$/);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Holdprofil', level: 1 })).toBeVisible();

  await expect(status(row(page, full.name))).toHaveText('Klar');
  await expect(status(row(page, layout.name))).toHaveText('Klar');
  await expect(status(row(page, double.name))).toHaveText(/Tæt på · mangler 1/);
  await expect(status(row(page, whipFull.name))).toHaveText(/Ustabil · 2 lave/);
  await expect(row(page, double.name)).toHaveAccessibleName(/5 kan, 5 sikre, 0 lave, 0 ikke vurderet/);
  await expect(page.getByRole('region', { name: 'Vandstand' })).toContainText('3 af 4 spring rager over vandlinjen');
  await row(page, double.name).hover();
  await expect(row(page, double.name)).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');

  await page.locator('.wl-bar.status-close').click();
  await expect(page.getByRole('dialog', { name: double.name })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);

  await expect(row(page, flik.name)).toHaveCount(0);
  await page.getByRole('button', { name: '+1 lettere', exact: true }).click();
  await expect(row(page, flik.name)).toBeVisible();
  await page.getByRole('button', { name: 'Skjul 1 lettere', exact: true }).click();
  await expect(row(page, flik.name)).toHaveCount(0);

  await row(page, double.name).click();
  const detail = page.getByRole('dialog', { name: double.name });
  await expect(detail).toBeVisible();
  await expect(detail.getByText('Syntetisk profil 8', { exact: true })).toBeVisible();
  await detail.getByRole('button', { name: /^Syntetisk profil 1/ }).click();
  await expect(detail.getByRole('button', { name: /^Syntetisk profil 1/ })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('.profile-highlight')).toContainText('Syntetisk profil 1');
  await expect(page.locator('.dot.is-highlight').first()).toBeVisible();
  await page.evaluate(() =>
    Promise.all(
      document
        .getAnimations()
        .filter(
          (animation) =>
            (animation as CSSAnimation).animationName !== 'profile-halo' &&
            animation.effect?.getTiming().iterations !== Infinity,
        )
        .map((animation) => animation.finished),
    ),
  );
  const axe = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(axe.violations.map((item) => ({ id: item.id, nodes: item.nodes.map((node) => node.target) }))).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(page.locator('.profile-highlight')).toHaveCount(0);
  await expect(detail).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(detail).toHaveCount(0);
  await expect(row(page, double.name)).toBeFocused();

  await page.getByRole('button', { name: `${double.name} · mangler 1` }).click();
  await expect(page.getByRole('dialog', { name: double.name })).toBeVisible();
  await page.getByRole('dialog').getByRole('button', { name: 'Luk', exact: true }).click();

  await page.getByRole('button', { name: 'Trampet', exact: true }).click();
  await expect(page.getByText(/Ingen registrerede trampetspring endnu/)).toBeVisible();
  await page.getByRole('button', { name: 'Bane', exact: true }).click();
  await expect(row(page, full.name)).toBeVisible();

  await page.getByLabel('Aktuelt hold').selectOption({ label: 'Syntetisk profilhold B' });
  await expect(page.getByRole('heading', { name: 'Holdprofil', level: 1 })).toBeVisible();
  await expect(status(row(page, flik.name))).toHaveText(/Skrøbelig · ingen margin/);
  await expect(page.getByText('Ingen spring er Klar endnu. Klar kræver mindst 7 sikre.')).toBeVisible();

  await expect(page.locator('.save-state')).toHaveText(/Uændret/);
  expect(source.puts).toBe(0);
  expect(source.failures).toEqual([]);
});

test('holdprofil på mobil: linjefaner, bundpanel og ingen vandret overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  const source = await openWorkspace(page, profileWorkspace());
  await openProfile(page);
  const tabs = page.getByRole('group', { name: 'Springlinjer' });
  await expect(tabs).toBeVisible();
  await tabs.getByRole('button', { name: /whipback/i }).click();
  await expect(tabs.getByRole('button', { name: /whipback/i })).toHaveAttribute('aria-pressed', 'true');
  await expect(row(page, whipFull.name)).toBeInViewport();
  await row(page, whipFull.name).click();
  const detail = page.getByRole('dialog', { name: whipFull.name });
  await expect(detail).toBeInViewport();
  await detail.evaluate((element) => Promise.all(element.getAnimations().map((animation) => animation.finished)));
  const nav = await page.getByRole('navigation').last().boundingBox();
  const sheet = await detail.boundingBox();
  expect(sheet!.y + sheet!.height).toBeLessThanOrEqual(nav!.y + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(source.failures).toEqual([]);
});

test('holdprofil udskifter vandstand og linjer ved skift mellem Bane og Trampet', async ({ page }) => {
  let workspace = profileWorkspace();
  const jump: SkillDefinition = {
    id: trampetSkill.id,
    name: trampetSkill.name,
    archived: false,
    discipline: 'trampet',
    jump: { ...salto, direction: 'forward', bodyPositions: ['tuck'], twistsHalfTurns: 0, twistDistribution: [], apparatus: 'trampet' },
  };
  const athlete = workspace.athletes.find((item) => item.teamId === workspace.teams[0]!.id)!;
  workspace = registerAthleteSkill(workspace, athlete.id, jump).workspace;
  await openWorkspace(page, workspace);
  await openProfile(page);
  for (const discipline of ['Trampet', 'Bane', 'Trampet', 'Bane']) {
    await page.getByRole('button', { name: discipline, exact: true }).click();
    await expect(page.locator('.waterline')).toHaveCount(1);
    await expect(page.locator('.profile-lines')).toHaveCount(1);
  }
  await expect(row(page, full.name)).toBeVisible();
});
