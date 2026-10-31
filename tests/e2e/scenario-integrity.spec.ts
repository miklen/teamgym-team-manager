import { readFile } from 'node:fs/promises';
import { setRoundReserves } from '@teamgym/domain';
import type { Workspace } from '@teamgym/domain';
import { openWorkspace } from './drive-fixture';
import { scenarioWorkspace } from '../fixtures/scenario-workspace';
import { expect, test } from './test';

function legacy(workspace: Workspace, version: number) {
  const value = structuredClone(workspace);
  for (const plan of value.plans)
    for (const scenario of [...plan.tumbling, ...plan.trampet])
      for (const round of scenario.rounds)
        for (const entry of round.entries) {
          delete (entry as Partial<typeof entry>).plannedSkillId;
          if (version < 4) delete (entry as Partial<typeof entry>).plannedSpot;
        }
  if (version === 4) return JSON.stringify({ ...value, schemaVersion: 4 });
  if (version === 3) return JSON.stringify({ ...value, schemaVersion: 3 });
  const plans = value.plans.map((plan) => ({
    ...plan,
    ...Object.fromEntries(
      (['tumbling', 'trampet'] as const).map((discipline) => [
        discipline,
        plan[discipline][0]!.rounds.map(({ reserves: _reserves, ...round }) => {
          void _reserves;
          return round;
        }),
      ]),
    ),
  }));
  const { inheritanceRelations: _relations, inheritanceExclusions: _exclusions, ...rest } = value;
  void _relations;
  void _exclusions;
  return JSON.stringify(
    version === 2
      ? { ...value, schemaVersion: 2, plans }
      : {
          ...rest,
          schemaVersion: 1,
          plans,
          athleteSkills: value.athleteSkills.map(({ assessmentOrigin: _origin, ...registration }) => {
            void _origin;
            return registration;
          }),
        },
  );
}

for (const version of [1, 2, 3, 4]) {
  test(`format ${version}: originaleksport, annullering med åben kladde og lokal migration uden upload`, async ({
    page,
  }) => {
    const workspace = scenarioWorkspace();
    const source = await openWorkspace(page, workspace);
    await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
    await page.getByRole('button', { name: 'Redigér hold Syntetisk hold A' }).click();
    await page.getByLabel('Holdnavn').fill('Syntetisk ugemt hold');
    await page.getByRole('button', { name: 'Opdater', exact: true }).click();
    const original = legacy(workspace, version);
    source.replaceBytes(original);
    await page.getByRole('button', { name: 'Arbejdsrum', exact: true }).click();
    await page.getByRole('button', { name: 'Åbn fra link', exact: true }).click();
    await page
      .getByLabel('Link til fil eller mappe')
      .fill('https://drive.google.com/file/d/synthetic-file/view');
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Åbn link', exact: true }).click();
    const migration = page.getByRole('dialog', { name: 'Opgradér arbejdsrummet', exact: true });
    await expect(migration).toContainText(`Filen bruger format ${version}.`);
    await expect(migration).toContainText('Opgradér til format 5');
    await expect(migration).toContainText('Ældre appudgaver kan ikke åbne format 5.');
    const downloadEvent = page.waitForEvent('download');
    await migration.getByRole('button', { name: 'Eksportér original', exact: true }).click();
    const download = await downloadEvent;
    expect(await readFile((await download.path())!, 'utf8')).toBe(original);
    await migration.getByRole('button', { name: 'Annuller', exact: true }).click();
    await expect(page.getByRole('button', { name: /^Syntetisk ugemt hold/ })).toBeVisible();
    expect(source.puts).toBe(0);
    await page.reload();
    await migration.getByRole('button', { name: 'Opgradér lokal kladde', exact: true }).click();
    await page.getByRole('link', { name: 'Springplan', exact: true }).click();
    await expect(page.getByRole('tab', { name: 'Plan A', exact: true })).toHaveAttribute(
      'aria-selected',
      'true',
    );
    expect(source.puts).toBe(0);
    expect(source.workspace.schemaVersion).toBe(version);
    await page.getByRole('button', { name: /Lokale ændringer/ }).click();
    await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
    expect(source.workspace.schemaVersion).toBe(5);
    expect(source.failures).toEqual([]);
  });
}

test('reserve til fyldt omgang er adskilt fra deltagere og kan fjernes igen', async ({ page }) => {
  const workspace = scenarioWorkspace();
  const plan = workspace.plans[0]!;
  const scenario = plan.tumbling[0]!;
  const round = scenario.rounds[0];
  round.entries.unshift(...round.reserves.map((reserve) => ({ ...reserve, role: 'extra' as const, plannedSpot: null, plannedSkillId: null })));
  round.reserves = [];
  const source = await openWorkspace(page, workspace);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  const region = page.getByRole('region', { name: '1. omgang', exact: true });
  const before = await region.locator('.round-totals').textContent();
  await expect(region.getByRole('button', { name: '+ Tilføj plads', exact: true })).toBeDisabled();
  await region.getByRole('button', { name: '+ Tilføj reserve', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Tilføj reserve', exact: true });
  await expect(dialog.getByRole('combobox', { name: 'Gymnast', exact: true })).toContainText(
    'Syntetisk reserve',
  );
  await dialog.getByRole('button', { name: 'Opdater', exact: true }).click();
  await expect(region.locator('.reserve-list > li')).toHaveCount(1);
  await expect(region.locator('.round-entries > li')).toHaveCount(8);
  await expect(region.locator('.reserve-list > li')).toContainText('Spring mangler');
  await expect(region.locator('.round-totals')).toHaveText(before!);
  await region.getByRole('button', { name: /^Fjern Syntetisk reserve.* som reserve$/ }).click();
  await expect(region.locator('.reserve-list > li')).toHaveCount(0);
  await expect(region.getByRole('button', { name: '+ Tilføj reserve', exact: true })).toBeFocused();
  expect(source.puts).toBe(0);
  expect(source.failures).toEqual([]);
});

test('forældet reservevisning afviser en syntetisk samtidig lokal ændring og kan genberegnes', async ({
  page,
}) => {
  const source = await openWorkspace(page, scenarioWorkspace());
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  await page
    .locator('.reserve-section')
    .first()
    .getByRole('button', { name: 'Sæt ind', exact: true })
    .first()
    .click();
  const dialog = page.getByRole('dialog', { name: 'Sæt reserve ind', exact: true });
  await dialog.getByLabel('Gymnast der udgår').selectOption({ index: 1 });
  // Model a local update arriving while the modal keeps its original comparison.
  await page
    .locator('.round-entries .entry-menu-trigger')
    .last()
    .evaluate((button) => (button as HTMLButtonElement).click());
  await page
    .locator('.round-entries [role="menuitem"][aria-label^="Fjern"]')
    .last()
    .evaluate((button) => (button as HTMLButtonElement).click());
  await expect(dialog.getByRole('alert')).toContainText('Beregn igen');
  await dialog.getByRole('button', { name: 'Bekræft indsættelse', exact: true }).click();
  await expect(dialog.getByRole('alert').last()).toContainText('Beregn igen');
  await expect(page.locator('.reserve-list > li')).toHaveCount(2);
  await dialog.getByRole('button', { name: 'Beregn igen', exact: true }).click();
  await dialog.getByRole('button', { name: 'Bekræft indsættelse', exact: true }).click();
  await expect(page.locator('.reserve-list > li')).toHaveCount(1);
  expect(source.puts).toBe(0);
  expect(source.failures).toEqual([]);
});

test('hele samlingen gemmes fra en anden plan og nyere redigering under upload forbliver ugemt', async ({
  page,
}) => {
  const source = await openWorkspace(page, scenarioWorkspace());
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  await page
    .locator('.reserve-section')
    .first()
    .getByRole('button', { name: /Flyt.* ned som reserve/ })
    .first()
    .click();
  await page.getByRole('tab', { name: 'Plan B', exact: true }).click();
  let release!: () => void;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  source.afterPut(() => held);
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect.poll(() => source.puts).toBe(1);
  await page
    .locator('.reserve-section')
    .first()
    .getByRole('button', { name: /Flyt.* ned som reserve/ })
    .first()
    .click();
  release();
  await expect(page.getByRole('button', { name: /Lokale ændringer/ })).toBeVisible();
  expect(source.workspace.plans[0]!.tumbling[0]!.rounds[0].reserves[0]!.athleteId).toBe(
    source.workspace.athletes[7]!.id,
  );
  expect(source.workspace.plans[0]!.tumbling[1]!.rounds[0].reserves[0]!.athleteId).toBe(
    source.workspace.athletes[6]!.id,
  );
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  expect(source.workspace.plans[0]!.tumbling[1]!.rounds[0].reserves[0]!.athleteId).toBe(
    source.workspace.athletes[7]!.id,
  );
  await page.reload();
  await expect(page.locator('.reserve-edit').first()).toContainText('Syntetisk gymnast 8');
  expect(source.failures).toEqual([]);
});

test('fjernelse af gymnast tæller udførende og reserver i lukkede scenarier med navnesammenfald', async ({
  page,
}) => {
  let workspace = scenarioWorkspace();
  const plan = workspace.plans[0]!;
  const scenario = plan.tumbling[1]!;
  scenario.rounds[1].entries = scenario.rounds[1].entries.filter(
    (entry) => entry.athleteId !== workspace.athletes[0]!.id,
  );
  workspace = setRoundReserves(workspace, plan.id, 'tumbling', scenario.id, scenario.rounds[1].id, [
    { id: 'closed-reserve', athleteId: workspace.athletes[0]!.id, athleteSkillId: null },
  ]);
  // The gymnast can be a reserve in this alternative only after their executing slot is removed.
  const source = await openWorkspace(page, workspace);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
  await page
    .getByRole('button', { name: /Maja Test.*Test 1/ })
    .first()
    .click();
  await page.getByRole('button', { name: 'Fjern gymnast', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Fjern gymnast', exact: true });
  await expect(dialog).toContainText('Plan B');
  await expect(dialog).toContainText('Reserve');
  await expect(dialog).toContainText('Test 1');
  await dialog.getByRole('button', { name: 'Annuller', exact: true }).click();
  await page.getByRole('button', { name: 'Fjern gymnast', exact: true }).click();
  await dialog.getByRole('button', { name: 'Fjern gymnast', exact: true }).click();
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  await page.getByRole('tab', { name: 'Plan B', exact: true }).click();
  await expect(page.locator('.reserve-warning').last()).toContainText('Utilgængelig');
  expect(source.puts).toBe(0);
  expect(source.failures).toEqual([]);
});

test('regelversionsvisning navngiver alle scenarier og reservevalg uden at ændre andre hold', async ({
  page,
}) => {
  const workspace = scenarioWorkspace();
  const source = await openWorkspace(page, workspace);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Reglement', exact: true }).click();
  await page.getByRole('combobox', { name: 'Holdprofil', exact: true }).selectOption('junior:mix');
  await page.getByRole('button', { name: 'Vis før og efter', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Før og efter regelskift', exact: true });
  for (const name of ['Bane · Plan A', 'Bane · Plan B', 'Trampet · Plan A', 'Trampet · Sikker'])
    await expect(dialog.getByRole('heading', { name, exact: true })).toBeVisible();
  await expect(dialog).toContainText('1. reserve');
  await dialog.getByRole('button', { name: 'Annuller', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Uændret', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Vis før og efter', exact: true }).click();
  await dialog.getByRole('button', { name: 'Opdater', exact: true }).click();
  await page.getByRole('button', { name: /Lokale ændringer/ }).click();
  await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
  expect(source.workspace.plans[0]).toEqual({
    ...workspace.plans[0],
    bindingFingerprint: source.workspace.plans[0]!.bindingFingerprint,
  });
  expect(source.workspace.teams[1]).toEqual(workspace.teams[1]);
  expect(source.failures).toEqual([]);
});

test('sene workersvar er bundet til scenariet og kan aldrig vises som den nye plans forslag', async ({
  page,
}) => {
  await page.addInitScript(() => {
    const requests: { name: string; deliver: () => void }[] = [];
    Object.assign(window, { syntheticWorkers: requests });
    class WorkerMock {
      handlers = new Set<EventListenerOrEventListenerObject>();
      addEventListener(_type: string, handler: EventListenerOrEventListenerObject) {
        this.handlers.add(handler);
      }
      removeEventListener(_type: string, handler: EventListenerOrEventListenerObject) {
        this.handlers.delete(handler);
      }
      terminate() {
        /* Deliberately allow an old response to arrive after cancellation. */
      }
      postMessage(message: { cancel?: boolean; id: string; scenarioId: string; workspace: Workspace }) {
        if (message.cancel) return;
        const name = message.workspace.plans
          .flatMap((plan) => [...plan.tumbling, ...plan.trampet])
          .find((item) => item.id === message.scenarioId)!.name;
        requests.push({
          name,
          deliver: () => {
            const event = new MessageEvent('message', {
              data: {
                id: message.id,
                result: [
                  {
                    id: 'B-SKRUE',
                    label: `Svar for ${name}`,
                    selected: null,
                    selectedKnownSubtotal: { numerator: 0n, denominator: 1n },
                    ruleMaximum: null,
                    documentedValue: { numerator: name === 'Plan B' ? 2n : 1n, denominator: 5n },
                    status: 'proven',
                    issue: null,
                    preview: null,
                    independent: true,
                    searchedCandidates: 0,
                  },
                ],
              },
            });
            for (const handler of this.handlers)
              if (typeof handler === 'function') handler(event);
              else handler.handleEvent(event);
          },
        });
      }
    }
    Object.assign(window, { Worker: WorkerMock });
  });
  const source = await openWorkspace(page, scenarioWorkspace());
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  await page.locator('.composition-guide-overview').click();
  await expect(page.getByText('Beregner registrerede muligheder… Du kan redigere videre.')).toBeVisible();
  await page.getByRole('tab', { name: 'Plan B', exact: true }).click();
  await page.locator('.composition-guide-overview').click();
  await page.evaluate(() => {
    const requests = (window as unknown as { syntheticWorkers: { name: string; deliver: () => void }[] })
      .syntheticWorkers;
    requests.find((item) => item.name === 'Plan B')!.deliver();
    requests.find((item) => item.name === 'Plan A')!.deliver();
  });
  const screw = page.getByRole('region', { name: 'Guide til springplanens komposition' })
    .locator('.composition-guide-row').filter({ has: page.getByText('Skrue', { exact: true }) });
  await screw.locator('summary').click();
  await expect(screw).toContainText('Dokumenteret med registreret kunnen: 0,400');
  await expect(screw).not.toContainText('0,200');
  await expect(screw.getByRole('button', { name: 'Se konkrete ændringer' })).toBeDisabled();
  expect(source.puts).toBe(0);
  expect(source.failures).toEqual([]);
});

for (const action of ['færdighed', 'flytning']) {
  test(`${action} viser alle udførende og reservehenvisninger i alternative planer og bevarer dem`, async ({
    page,
  }) => {
    const workspace = scenarioWorkspace();
    const plan = workspace.plans[0]!;
    const closed = plan.tumbling[1]!;
    const registrationId = plan.tumbling[0]!.rounds[0].entries[0]!.athleteSkillId;
    closed.rounds[1].entries = closed.rounds[1].entries.filter(
      (entry) => entry.athleteId !== workspace.athletes[0]!.id,
    );
    closed.rounds[1].reserves.push({
      id: 'closed-reference',
      athleteId: workspace.athletes[0]!.id,
      athleteSkillId: registrationId,
    });
    const originalPlans = structuredClone(workspace.plans);
    const source = await openWorkspace(page, workspace);
    await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
    await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
    await page.getByRole('button', { name: /Maja Test Test 1/ }).click();
    if (action === 'færdighed') {
      await page.getByRole('button', { name: /^Syntetisk baneserie D:/ }).click();
      await page.getByRole('button', { name: 'Fjern færdighed', exact: true }).click();
      const confirmation = page.getByRole('dialog', { name: 'Fjern færdighed', exact: true });
      await expect(confirmation).toContainText('5 udførende pladser og 1 reserveplads');
      await expect(confirmation).toContainText('Plan B · 2. omgang · Reserve');
      await confirmation.getByRole('button', { name: 'Fjern færdighed', exact: true }).click();
    } else {
      await page.getByRole('button', { name: 'Redigér gymnast', exact: true }).click();
      await expect(page.getByRole('dialog')).toContainText('Plan B · 2. omgang · Reserve');
      await page.getByRole('combobox', { name: 'Hold', exact: true }).selectOption(workspace.teams[1]!.id);
      await page.getByRole('button', { name: 'Opdater', exact: true }).click();
    }
    await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
    await page.getByRole('link', { name: 'Springplan', exact: true }).click();
    await page.getByRole('tab', { name: 'Plan B', exact: true }).click();
    await expect(page.locator('.reserve-warning').last()).toContainText('Utilgængelig reserve');
    await page.getByRole('button', { name: /Lokale ændringer/ }).click();
    await expect(page.getByRole('button', { name: 'Gemt', exact: true })).toBeVisible();
    expect(source.workspace.plans).toEqual(originalPlans);
    expect(source.failures).toEqual([]);
  });
}

test('navnesammenfald i reservelisten skelnes med kendetegn og prioriteres med tastatur', async ({
  page,
}) => {
  const workspace = scenarioWorkspace();
  workspace.athletes[6]!.name = 'Maja Test';
  workspace.athletes[7]!.name = 'Maja Test';
  const source = await openWorkspace(page, workspace);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  const reserves = page.locator('.reserve-section').first();
  await reserves.getByRole('button', { name: 'Flyt Maja Test · Test 8 op som reserve', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(reserves.locator('.reserve-edit').first()).toContainText('Maja Test · Test 8');
  await expect(reserves.locator('.reserve-edit').first()).toBeFocused();
  expect(source.puts).toBe(0);
  expect(source.failures).toEqual([]);
});

test('ændret reserveformular opdaterer kun den gamle plan før scenarieskift', async ({ page }) => {
  const source = await openWorkspace(page, scenarioWorkspace());
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  await page.locator('.reserve-edit').first().click();
  const editor = page.getByRole('dialog', { name: 'Redigér reserve', exact: true });
  await editor
    .getByRole('combobox', { name: 'Gymnast', exact: true })
    .selectOption({ label: 'Syntetisk reserve · Test 9' });
  await editor.getByLabel('Vis scenarie').selectOption({ label: 'Plan B' });
  await page
    .getByRole('dialog', { name: 'Gem formularændringer?', exact: true })
    .getByRole('button', { name: 'Opdater', exact: true })
    .click();
  await expect(page.getByRole('tab', { name: 'Plan B', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(page.locator('.reserve-edit').first()).toContainText('Syntetisk gymnast 7');
  await page.getByRole('tab', { name: 'Plan A', exact: true }).click();
  await expect(page.locator('.reserve-edit').first()).toContainText('Syntetisk reserve');
  expect(source.puts).toBe(0);
  expect(source.failures).toEqual([]);
});

test('ugyldig pladsformular bliver åben ved Opdater før skift og kan rettes uden Drive-skrivning', async ({
  page,
}) => {
  const workspace = scenarioWorkspace();
  const round = workspace.plans[0]!.tumbling[0]!.rounds[0];
  round.entries.unshift(...round.reserves.map((entry) => ({ ...entry, role: 'extra' as const, plannedSpot: null, plannedSkillId: null })));
  round.reserves = [];
  const source = await openWorkspace(page, workspace);
  await expect(page.getByRole('heading', { name: 'Hold', exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Springplan', exact: true }).click();
  await page.locator('.round-entries .entry-name').nth(2).click();
  const editor = page.getByRole('dialog', { name: 'Redigér omgangsplads', exact: true });
  await editor.getByRole('combobox', { name: 'Rolle', exact: true }).selectOption('extra');
  await editor.getByLabel('Vis scenarie').selectOption({ label: 'Plan B' });
  await page
    .getByRole('dialog', { name: 'Gem formularændringer?', exact: true })
    .getByRole('button', { name: 'Opdater', exact: true })
    .click();
  await expect(editor.getByRole('alert')).toContainText('højst 2 ekstra');
  await expect(editor).toBeVisible();
  await expect(page.locator('[role="tab"][aria-selected="true"]')).toHaveText('Plan A');
  await editor.getByRole('combobox', { name: 'Rolle', exact: true }).selectOption('counting');
  await editor.getByRole('button', { name: 'Opdater', exact: true }).click();
  await expect(page.getByRole('tab', { name: 'Plan B', exact: true })).toHaveAttribute(
    'aria-selected',
    'true',
  );
  expect(source.puts).toBe(0);
  expect(source.failures).toEqual([]);
});
