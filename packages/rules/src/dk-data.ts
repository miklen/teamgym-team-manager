import type { SourceReference, RulesetBinding } from '@teamgym/domain';
import sourceManifest from '../../../openspec/changes/archive/2026-10-25-build-teamgym-team-manager/reference/source-manifest.json';
import { freezeData } from './catalog';

export interface TeamProfile {
  ageGroup: string; teamType: string; label: string; counting: number; extra: number;
  nominalAge: { min: number; max: number | null };
  mixQuota: { girl: number; boy: number } | null;
  sources: readonly SourceReference[];
}

/** Regelpakkens konsekvens af en planlagt modtagning. Beløb er planlagte, ikke observerede, E-fradrag. */
export interface SpotRate {
  grade: 'support' | 'assist' | 'heavy'; label: string; executionDeduction: string; halvesDifficulty: boolean;
  explanation: string; sources: readonly SourceReference[];
}
export type SpotRates = readonly SpotRate[];

const FEET_FIRST = 'Planen forudsætter, at gymnasten lander med fødderne først. En mislykket landing er en observation uden for planen.';
export const DK_SPOT_RATES: SpotRates = freezeData([
  { grade: 'support', label: 'Let støtte', executionDeduction: '0.5', halvesDifficulty: false,
    explanation: `Planlagt E-fradrag 0,5 pr. gymnast. D er uændret. ${FEET_FIRST}`, sources: [{ sourceId: 'A6', section: '1.7 Støtte (A6-07)', page: 5 }] },
  { grade: 'assist', label: 'Hjælp til udførelse', executionDeduction: '1.0', halvesDifficulty: false,
    explanation: `Planlagt E-fradrag 1,0 pr. gymnast. D er uændret. ${FEET_FIRST}`, sources: [{ sourceId: 'A6', section: '1.7 Hjælp til udførelse (A6-07)', page: 5 }] },
  { grade: 'heavy', label: 'Kraftig hjælp i svæv/landing', executionDeduction: '1.0', halvesDifficulty: true,
    explanation: `Planlagt E-fradrag 1,0, og det modtagne elements D halveres. E-fradraget og halveringen vurderes hver for sig. ${FEET_FIRST}`,
    sources: [{ sourceId: 'A6', section: '1.7 Hjælp til udførelse (A6-07)', page: 5 }, { sourceId: 'H', section: '9.3.3', page: 33 }, { sourceId: 'H', section: '10.3.3', page: 42 }] },
]);

export const DK_DEFAULT_BINDING: RulesetBinding = freezeData({ rulesetId: 'dk', packageVersion: '1.1.0', ageGroup: 'junior', teamType: 'girls' });

export const DK_PROFILES: readonly TeamProfile[] = freezeData(['U14', 'junior', 'senior'].flatMap((ageGroup) => ['girls', 'boys', 'mix'].map((teamType) => ({
  ageGroup, teamType, label: `${ageGroup === 'junior' ? 'Junior' : ageGroup === 'senior' ? 'Senior' : ageGroup} ${teamType === 'girls' ? 'piger' : teamType === 'boys' ? 'drenge' : 'mix'}`,
  counting: 6, extra: 2,
  nominalAge: { min: ageGroup === 'U14' ? 12 : ageGroup === 'junior' ? 14 : 17, max: ageGroup === 'U14' ? 14 : ageGroup === 'junior' ? 17 : null },
  mixQuota: teamType === 'mix' ? { girl: 3, boy: 3 } : null,
  sources: [{ sourceId: 'TR', section: '1.3 Aldersbestemmelser; nominelle profiler, ikke fuld berettigelse', page: 4 },
    { sourceId: 'H', section: '9.1 og 10.1; deltagere', page: 29 }],
}))));

export interface KnownIssue {
  id: string; title: string; detail: string; scope: 'rule' | 'catalog'; sources: readonly SourceReference[];
  alternatives?: Readonly<Record<string, string>>;
}

export const DK_KNOWN_ISSUES: readonly KnownIssue[] = freezeData([
  { id: 'Q01', title: 'Banens elementtillæg', detail: 'Ordlyd: 0,10 pr. forskelligt gyldigt element. Eksempel: 0,10 mindre pr. serie. Vis begge spor; ingen autoritativ C-total.', scope: 'rule', sources: [{ sourceId: 'H', section: '9.2.3.3', page: 31 }] },
  { id: 'Q02', title: 'Overslag-salto hoftebøjet med halvskrue', detail: 'A4-tabellen angiver 1,20; hovedreglementets basis/formel giver 1,10. Kun denne variant og afhængige summer er uafklarede.', scope: 'rule', sources: [{ sourceId: 'A4', section: 'H>1', page: 1 }, { sourceId: 'H', section: '10.3.5', page: 43 }, { sourceId: 'H', section: '10.3.6', page: 44 }], alternatives: { table: '6/5', formula: '11/10' } },
  { id: 'Q03', title: 'Delvise gentagelser og skiftende besætning', detail: 'Hold- kontra gymnastoptælling er uafklaret. Ingen gentagelse og klar fuld gentagelse af samme besætning kan beregnes; øvrige berørte optællinger forbliver uafklarede.', scope: 'rule', sources: [{ sourceId: 'H', section: '9.2.2.3', page: 30 }, { sourceId: 'H', section: '10.2.2.3', page: 40 }] },
  { id: 'Q04', title: 'Blandede trampetredskabsomgange', detail: 'Nærmeste-omgangsformlen fra bane må ikke genbruges uden kildeafklaring. Rene fulde med-/uden-redskabstilfælde kan beregnes.', scope: 'rule', sources: [{ sourceId: 'H', section: '10.2.2.5', page: 40 }] },
  { id: 'Q05', title: 'Holdomgang uden klar majoritet', detail: '3/3, 2/2/2 og 3/2/1 giver ingen vilkårlig reference. Mere end halvdelen giver en klar reference; 5/1 nulstiller den afvigendes D og vurderer C særskilt.', scope: 'rule', sources: [{ sourceId: 'H', section: '9.3.4', page: 34 }, { sourceId: 'H', section: '10.3.4', page: 43 }] },
  { id: 'Q06', title: 'Optælling af rækkefølgefejl', detail: 'Sats 0,10 er kendt; præcis tælleenhed ved flere fejl, blandede baneserier og ekstra gymnaster er uafklaret. Forklar rækkefølgen og foreslå sortering uden at opfinde præcist fradrag.', scope: 'rule', sources: [{ sourceId: 'H', section: '9.2.2.2', page: 30 }, { sourceId: 'H', section: '10.2.2.2', page: 40 }] },
  { id: 'K01', title: 'To trykte DB804', detail: 'Pirouette og stem til håndstand har begge trykt kode DB804 og værdi 0,80; de bevarer forskellige interne identiteter og krav.', scope: 'catalog', sources: [{ sourceId: 'A1.1', section: 'DB804', page: 3 }, { sourceId: 'A1.1', section: 'DB804', page: 4 }] },
  { id: 'K02', title: 'Kattespring 540° mangler som trykt felt', detail: 'Ingen officiel kode, værdi eller registrerbar variant opfindes. De 94 faktisk trykte individuelle felter er katalogets grundlag.', scope: 'catalog', sources: [{ sourceId: 'H', section: 'Revisionshistorik', page: 5 }, { sourceId: 'A1.1', section: 'Kattespring', page: 7 }] },
  { id: 'Q-SPOT-DUP', title: 'Kraftig hjælp på et gentaget element', detail: 'Kraftig hjælp halverer det modtagne elements D. Når samme element også står uhalveret andetsteds i serien, er det uafklaret, hvilken værdi der tæller. Appen viser intervallet mellem halveret og uhalveret D.', scope: 'rule', sources: [{ sourceId: 'H', section: '9.3.3', page: 33 }, { sourceId: 'H', section: '9.3.5', page: 33 }] },
]);

export const DK_SOURCE_MANIFEST = freezeData(sourceManifest);
