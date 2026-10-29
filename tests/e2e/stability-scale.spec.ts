import { registerAthleteSkill, setOwnAssessment } from '@teamgym/domain';
import { overviewWorkspace } from '../fixtures/overview-workspace';
import { rhythmSkill } from '../fixtures/synthetic-workspace';
import { openWorkspace } from './drive-fixture';
import { expect, test } from './test';

const descriptions = [
  'Enkelte vellykkede forsøg – lykkes endnu kun sporadisk.',
  'Lykkes jævnligt – men med tydelige udsving mellem forsøgene.',
  'Lykkes oftest – men enkelte forsøg mislykkes stadig.',
  'Stabile udførelser – lykkes gentagne gange til træning.',
  'Gennemprøvet under konkurrencepres – udføres stabilt, også når det gælder.',
];

for (const width of [1440, 390]) {
  test(`sikkerhedsskala har fulde beskrivelser og bevarer tidligere vurderinger ved ${width}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 1000 });
    const base = overviewWorkspace(1);
    const added = registerAthleteSkill(base, base.athletes[0]!.id, rhythmSkill);
    const workspace = setOwnAssessment(added.workspace, added.athleteSkillId, {
      stability: 5,
      assessedAt: '2026-10-26',
      note: 'Syntetisk eksisterende note',
    });
    const source = await openWorkspace(page, workspace);
    await page.getByRole('link', { name: 'Gymnaster', exact: true }).click();
    for (const [name, value] of [
      ['Syntetisk søgevariant', 1],
      [rhythmSkill.name, 5],
    ] as const) {
      await page.getByRole('button', { name: /Alma Eksempel/ }).click();
      await page.getByLabel('Find færdighed', { exact: true }).fill(name);
      await page.getByRole('button', { name: new RegExp(`^${name} D:`) }).click();
      await expect(page.getByRole('radio', { name: String(value), exact: true })).toBeChecked();
      await expect(page.getByText(`${value}: ${descriptions[value - 1]}`, { exact: true })).toBeVisible();
      await expect(page.getByLabel('Vurderingsdato', { exact: true })).toHaveValue('2026-10-26');
      if (value === 5) await expect(page.getByLabel('Trænernote')).toHaveValue('Syntetisk eksisterende note');
      await page.getByText('Se skalaens fem ankre', { exact: true }).click();
      const scale = page.getByText('Se skalaens fem ankre', { exact: true }).locator('..');
      await expect(scale.locator('li')).toHaveText(descriptions);
      await page.getByRole('button', { name: 'Luk dialog', exact: true }).click();
    }
    await page.getByRole('button', { name: /Alma Eksempel/ }).click();
    await page.getByRole('button', { name: 'Tilføj færdighed' }).click();
    await page.getByText('Hvad betyder sikkerhed 1–5?', { exact: true }).click();
    const scale = page.getByText('Hvad betyder sikkerhed 1–5?', { exact: true }).locator('..');
    await expect(scale.locator('li')).toHaveText(descriptions);
    await page.getByRole('combobox', { name: 'Disciplin', exact: true }).selectOption('trampet');
    if (!(await scale.locator('ol').isVisible()))
      await page.getByText('Hvad betyder sikkerhed 1–5?', { exact: true }).click();
    await expect(scale.locator('ol')).toBeVisible();
    await expect(scale.locator('li')).toHaveText(descriptions);
    await scale.locator('ol').scrollIntoViewIfNeeded();
    await expect(scale).toBeVisible();
    expect(
      await page.getByRole('dialog').evaluate((element) => element.scrollWidth <= element.clientWidth),
    ).toBe(true);
    await page.screenshot({ path: `tmp/ui-qa/sikkerhedsskala-${width}.png`, fullPage: true });
    await page.getByRole('button', { name: '← Tilbage til færdigheder' }).click();
    await expect(page.getByRole('button', { name: 'Uændret', exact: true })).toBeDisabled();
    expect(source.puts).toBe(0);
    expect(source.workspace).toEqual(workspace);
    expect(source.failures).toEqual([]);
  });
}
