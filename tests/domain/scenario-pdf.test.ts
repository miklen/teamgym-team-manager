import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { describe, expect, it } from 'vitest';
import { getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs';
import { DK_V2 } from '@teamgym/rules';
import { projectScenarioPdf } from '../../apps/web/src/scenario-pdf-model';
import type { ScenarioPdfModel } from '../../apps/web/src/scenario-pdf-model';
import { createScenarioPdf, scenarioPdfFilename } from '../../apps/web/src/scenario-pdf';
import { scenarioWorkspace } from '../fixtures/scenario-workspace';

const exportedAt = new Date('2026-11-15T09:30:00.000Z');
const font = readFileSync(new URL('../../apps/web/public/fonts/manrope-variable.ttf', import.meta.url));

async function extract(bytes: Uint8Array) {
  const document = await getDocument({ data: new Uint8Array(bytes), useSystemFonts: false }).promise;
  const pages: string[] = [];
  for (let number = 1; number <= document.numPages; number++) {
    const page = await document.getPage(number);
    const content = await page.getTextContent();
    pages.push(content.items.map((item) => 'str' in item ? item.str : '').join(' '));
  }
  await document.destroy();
  return pages;
}

describe('scenarie-PDF', () => {
  function fullRoundModel(reserveCount: number): ScenarioPdfModel {
    const row = (number: number, role: 'Ekstra' | 'Tællende' | 'Reserve') => ({
      number, role, athlete: `Syntetisk gymnast ${number} · Test ${number}`,
      spring: 'Rondat – flik – strakt 1/1 (360°)', direction: 'Salto: baglæns',
      reception: role === 'Reserve' ? '' : 'Let støtte', warning: '',
    });
    return {
      team: 'Syntetisk hold', discipline: 'Bane', scenario: 'Plan med fulde omgange',
      exportedAt, unsaved: false, ruleWarning: '',
      difficulty: { value: '3,000', status: 'Beregnet' },
      composition: { value: '0,500', status: 'Beregnet' },
      rounds: [0, 1, 2].map((index) => ({
        title: `${index + 1}. ${index ? 'omgang' : 'Holdomgang'}`,
        status: 'Planlagt',
        difficulty: { value: '3,000', status: 'Beregnet' },
        starters: [row(1, 'Ekstra'), row(2, 'Ekstra'), ...Array.from({ length: 6 }, (_, i) => row(i + 3, 'Tællende'))],
        reserves: Array.from({ length: reserveCount }, (_, i) => row(i + 1, 'Reserve')),
      })),
    };
  }

  it('vælger præcis scenariet, bevarer konkurrenceordenen og markerer nulstillet modtagning', () => {
    const workspace = scenarioWorkspace();
    const plan = workspace.plans[0]!;
    const first = plan.tumbling[0]!;
    const second = plan.tumbling[1]!;
    second.rounds[0].entries.reverse();
    second.rounds.reverse();
    const entry = second.rounds[0].entries[0]!;
    entry.plannedSpot = { grade: 'heavy', skillId: 'skill-trampet', elementIndex: null };
    const model = projectScenarioPdf({ workspace, teamId: plan.teamId, discipline: 'tumbling', scenarioId: second.id, rulePackage: DK_V2, exportedAt, unsaved: true });
    expect(model.scenario).toBe('Plan B');
    expect(model.rounds[0]!.starters.map((row) => row.athlete)).not.toEqual(first.rounds[0].entries.map((row) => workspace.athletes.find((athlete) => athlete.id === row.athleteId)!.name));
    expect(model.rounds[0]!.starters[0]!.reception).toContain('nulstillet');
    expect(model.rounds[0]!.starters[0]!.reception).not.toContain('Kraftig hjælp');
    expect(model.rounds[2]!.reserves.map((row) => row.number)).toEqual([1, 2]);
    expect(() => projectScenarioPdf({ workspace, teamId: plan.teamId, discipline: 'tumbling', scenarioId: 'ukendt', rulePackage: DK_V2, exportedAt, unsaved: false })).toThrow('findes ikke');
  });

  it('eksporterer gemte valg uden regelpakke og viser mangler', () => {
    const workspace = scenarioWorkspace();
    const plan = workspace.plans[0]!;
    const scenario = plan.tumbling[0]!;
    scenario.rounds[1].entries[0]!.athleteId = null;
    scenario.rounds[1].entries[0]!.athleteSkillId = null;
    scenario.rounds[1].entries[0]!.plannedSkillId = 'skill-tumbling';
    const model = projectScenarioPdf({ workspace, teamId: plan.teamId, discipline: 'tumbling', scenarioId: scenario.id, rulePackage: null, exportedAt, unsaved: false });
    expect(model.ruleWarning).toContain('ikke kontrolleret');
    expect(model.difficulty).toEqual({ value: null, status: 'Regelpakke mangler' });
    expect(model.composition).toEqual({ value: null, status: 'Regelpakke mangler' });
    expect(model.rounds[0]!.difficulty).toEqual({ value: null, status: 'Regelpakke mangler' });
    expect(model.rounds[1]!.starters[0]!.athlete).toBe('Mangler gymnast');
    expect(model.rounds[0]!.reserves[1]!.spring).toBe('Spring mangler');
    expect(model.rounds[1]!.status).toBe('Planen er ikke klar · Regelgyldighed ikke kontrolleret');
  });

  it('skelner ekstra, tællende og reserver samt viser aktiv modtagning ved springet', () => {
    const workspace = scenarioWorkspace();
    const plan = workspace.plans[0]!;
    const scenario = plan.tumbling[0]!;
    scenario.rounds[0].entries[0]!.role = 'extra';
    scenario.rounds[0].entries[0]!.plannedSpot = { grade: 'heavy', skillId: 'skill-tumbling', elementIndex: 0 };
    const model = projectScenarioPdf({ workspace, teamId: plan.teamId, discipline: 'tumbling', scenarioId: scenario.id, rulePackage: DK_V2, exportedAt, unsaved: false });
    expect(model.rounds[0]!.starters[0]!.role).toBe('Ekstra');
    expect(model.rounds[0]!.starters[1]!.role).toBe('Tællende');
    expect(model.rounds[0]!.starters[0]!.reception).toContain('Kraftig hjælp');
    expect(model.rounds[0]!.starters[0]!.reception).toContain('1.');
    expect(model.rounds[0]!.reserves.map((row) => row.number)).toEqual([1, 2]);
  });

  it('giver søgbar tekst, dansk font, kladdestatus og planlagte C- og D-tal', async () => {
    const workspace = scenarioWorkspace();
    const plan = workspace.plans[0]!;
    const model = projectScenarioPdf({ workspace, teamId: plan.teamId, discipline: 'tumbling', scenarioId: plan.tumbling[0]!.id, rulePackage: DK_V2, exportedAt, unsaved: true });
    expect(model.difficulty).toEqual({ value: '3,000', status: 'Beregnet' });
    expect(model.composition).toEqual({ value: '0,000', status: 'Beregnet' });
    expect(model.rounds.map((round) => round.difficulty)).toEqual(Array(3).fill({ value: '3,000', status: 'Beregnet' }));
    const bytes = await createScenarioPdf(model, font);
    const pages = await extract(bytes);
    if (process.env.SCENARIO_PDF_SAMPLE) {
      mkdirSync(dirname(process.env.SCENARIO_PDF_SAMPLE), { recursive: true });
      writeFileSync(process.env.SCENARIO_PDF_SAMPLE, bytes);
    }
    expect(pages[0]).toContain('Holdomgang');
    expect(pages[0]).toContain('Ugemt kladde');
    expect(pages[0]).toContain('Syntetisk hold A');
    expect(pages[0]).toContain('RESERVER');
    expect(pages[0]).toContain('Planlagt D');
    expect(pages[0]).toContain('Planlagt C');
    expect(pages[0]).toContain('Planlagt · D');
    expect(pages[0]).toContain('Planlagt D 3,000');
    expect(pages[0]).toContain('Planlagt C 0,000');
    expect(pages.join(' ')).not.toMatch(/Sikkerhed|E-fradrag|Maks. mulig karakter|Kun syntetiske testdata/);
    expect(scenarioPdfFilename(model)).toBe('Syntetisk hold A - Bane - Plan A.pdf');
  });

  it('viser manglende regelpakke uden at opfinde C- eller D-værdier', async () => {
    const workspace = scenarioWorkspace();
    const plan = workspace.plans[0]!;
    const model = projectScenarioPdf({ workspace, teamId: plan.teamId, discipline: 'tumbling', scenarioId: plan.tumbling[0]!.id, rulePackage: null, exportedAt, unsaved: false });
    const pages = await extract(await createScenarioPdf(model, font));
    expect(pages[0]).toContain('Planlagt D — (Regelpakke mangler)');
    expect(pages[0]).toContain('Planlagt C — (Regelpakke mangler)');
    expect(pages[0]).toContain('D — (Regelpakke mangler)');
  });

  it('har to ekstra, seks tællende og to reserver i alle tre omgange på én side', async () => {
    const bytes = await createScenarioPdf(fullRoundModel(2), font);
    const pages = await extract(bytes);
    if (process.env.SCENARIO_PDF_FULL_SAMPLE) {
      mkdirSync(dirname(process.env.SCENARIO_PDF_FULL_SAMPLE), { recursive: true });
      writeFileSync(process.env.SCENARIO_PDF_FULL_SAMPLE, bytes);
    }
    expect(pages).toHaveLength(1);
    expect(pages[0]!.match(/8\. Tællende/g)).toHaveLength(3);
    expect(pages[0]!.match(/2\. prioritet/g)).toHaveLength(3);
    expect(pages[0]!.match(/Ekstra/g)).toHaveLength(6);
    expect(pages[0]).toContain('Planlagt D 3,000');
    expect(pages[0]).toContain('Planlagt C 0,500');
    expect(pages[0]).not.toContain('Øjebliksbillede');
  });

  it('viser yderligere reserver på en fortsættelsesside', async () => {
    const pages = await extract(await createScenarioPdf(fullRoundModel(3), font));
    expect(pages).toHaveLength(2);
    expect(pages[0]).not.toContain('3. prioritet');
    expect(pages[1]!.match(/3\. prioritet/g)).toHaveLength(3);
  });

  it('fortsætter lange starter- og reservelister uden at miste rækker', async () => {
    const row = (number: number, role: 'Tællende' | 'Reserve') => ({ number, role, athlete: `Syntetisk gymnast ${number} med et usædvanligt langt kendetegn og flere ord`, spring: 'Rondat – flik – strakt salto med en meget lang beskrivelse af hele serien og en ekstra præcis variant', direction: 'Saltoer: forlæns → baglæns', reception: '', warning: '' });
    const model: ScenarioPdfModel = {
      team: 'Syntetisk hold', discipline: 'Bane', scenario: 'Plan med lange navne', exportedAt, unsaved: false, ruleWarning: '',
      difficulty: { value: null, status: 'Uafklaret' }, composition: { value: null, status: 'Uafklaret' },
      rounds: [0, 1, 2].map((index) => ({ title: `${index + 1}. ${index ? 'omgang' : 'Holdomgang'}`, status: 'Planlagt', difficulty: { value: null, status: 'Uafklaret' }, starters: Array.from({ length: 12 }, (_, i) => row(i + 1, 'Tællende')), reserves: Array.from({ length: 12 }, (_, i) => row(i + 1, 'Reserve')) })),
    };
    const bytes = await createScenarioPdf(model, font);
    const pages = await extract(bytes);
    if (process.env.SCENARIO_PDF_LONG_SAMPLE) {
      mkdirSync(dirname(process.env.SCENARIO_PDF_LONG_SAMPLE), { recursive: true });
      writeFileSync(process.env.SCENARIO_PDF_LONG_SAMPLE, bytes);
    }
    expect(pages.length).toBeGreaterThan(1);
    for (const page of pages) expect(page).toContain('Syntetisk hold');
    expect(pages.join(' ').match(/12\. prioritet/g)).toHaveLength(3);
    expect(pages.join(' ').match(/12\. Tællende/g)).toHaveLength(3);
  });
});
