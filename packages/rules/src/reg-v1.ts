import rhythmCatalogCsv from '../data/reg/rhythm-catalog.csv?raw';
import springValuesCsv from '../data/reg/spring-values.csv?raw';
import regSources from '../data/reg/sources.json';
import { DK_RHYTHM_CATALOG_V2, DK_SPRING_CATALOG, RHYTHM_CATEGORY_REQUIREMENTS, freezeData, readRows, rhythmOptions, rhythmRowRequirements } from './catalog';
import type { RhythmCatalogEntry, SpringCatalogEntry } from './catalog';
import { DK_SPOT_RATES } from './dk-data';
import type { KnownIssue, TeamProfile } from './dk-data';
import { createDKFamilyPackage } from './dk-v1';
import type { PackageManifest } from './registry';
import { REG_SPRING_RULES } from './spring-rules';

const REG_MANIFEST: PackageManifest = {
  rulesetId: 'reg', packageVersion: '1.0.0', name: 'Regionsrækken', officialEdition: 'DK/REG v1.4; vedtaget august 2026', season: '2026/27', production: true,
  algorithms: { identity: 'dk-identity-3', difficulty: 'reg-d-2', composition: 'reg-c-2', rhythm: 'reg-rhythm-1', potential: 'witness-3' },
  sources: regSources.sources.map(({ id, sha256, edition, file, officialUrl }) => ({ id, sha256, edition, file, officialUrl: officialUrl ?? null })),
  changeDescription: 'Første REG-pakke. Deler DK-motoren med REG-satser: ingen rækkefølge-, flow- eller dobbeltregler, kun enkeltrotationer, Pegasus med mølleoverslag og overslag, og op til seks ekstra gymnaster. A3-startposter tæller som særskilte baneelementer efter trænerens foreløbige fortolkning.',
};

/** REG-status og -værdi pr. A3/A4-række fra H 9.3.5/10.3.5 (`data/reg/spring-values.csv`). */
function regSpringCatalog(): readonly SpringCatalogEntry[] {
  const rows = new Map(readRows(springValuesCsv).map((row) => [row.reference_id!, row]));
  if (rows.size !== DK_SPRING_CATALOG.length) throw new Error('REG-springværdierne dækker ikke hele kataloget.');
  return freezeData(DK_SPRING_CATALOG.map((entry) => {
    const row = rows.get(entry.referenceId);
    if (!row) throw new Error(`REG-springværdi mangler for ${entry.referenceId}.`);
    const base: SpringCatalogEntry = structuredClone(entry);
    delete base.appliedValue;
    if (row.reg_status === 'forbidden') return { ...base, status: 'forbidden' as const, issueId: row.issue_id! };
    if (row.reg_status !== 'allowed' || row.reg_value !== entry.printedValue) throw new Error(`REG-springværdi for ${entry.referenceId} afviger fra den trykte værdi.`);
    return { ...base, status: 'allowed' as const, issueId: null };
  }));
}
export const REG_SPRING_CATALOG = regSpringCatalog();

const REG_RHYTHM_CATEGORY_REQUIREMENTS: Readonly<Record<string, readonly string[]>> = {
  ...RHYTHM_CATEGORY_REQUIREMENTS,
  // A1.2 har ingen pirouetterække med frit ben 90°; A1.1's hælregel hører til den række.
  'DB-pirouette': ['På én fod på tå uden hop. Forlæns/baglæns er relativt til støttebenet.', 'Valgfri placering af frit ben og arme; frit ben skal bevare sin position mindst 3/4 af rotationen.', 'Rotation starter med løftet fri fod og støttehæl, og slutter ved færdig rotation, hælkontakt eller fri fod i gulvet.', 'Alle gymnaster starter med ansigtet samme vej.'],
};

const FROG = 'Frø: knæ eller lår støttes på albuer eller overarme (HB202).';
const SIDE_BALANCE = 'Lodret overkrop; det frie ben ud til siden med hjælp fra hånd. Rækkens overskrift siger »med eller uden håndstøtte« (A1REG-U03).';
/** Rækkekrav fra A1.2. Genbrugte DK-id'er arver A1.1-teksten, undtagen hvor den nævner forhold, der ikke findes i A1.2. */
const REG_ROW_REQUIREMENTS: Readonly<Record<string, readonly string[]>> = {
  'rh-hb-straddle-l': [],
  'rh-j-cat': ['Bøjede ben og benskift i luften; begge lår når vandret uden tolerance.'],
  'rh-j-cat-360': ['Bøjede ben og benskift i luften; begge lår når vandret uden tolerance.'],
  'rh-j-scissor-90': ['Strakte ben og benskift i luften; første ben når vandret uden tolerance.'],
  'rh-j-scissor-135': ['Strakte ben og benskift i luften; første ben når vandret uden tolerance.'],
  'rh-j-split-leap-90': ['Strakte ben uden spark; bendeling definerer momentet.'],
  'rh-j-split-leap-135': ['Strakte ben uden spark; bendeling definerer momentet.'],
  'rh-reg-hb-frog': ['Knæ eller lår støttes på albuer eller overarme.'],
  'rh-reg-db-headstand-frog': [`Fra kontrolleret hovedstand til frø. ${FROG}`],
  'rh-reg-db-handstand-frog': [`Fra kontrolleret håndstand til frø. ${FROG}`],
  'rh-reg-sb-side-under-90': [SIDE_BALANCE, 'Det frie ben er under 90°.'],
  'rh-reg-sb-side-90': [SIDE_BALANCE],
  'rh-reg-sb-side-135': [SIDE_BALANCE],
  'rh-reg-j-jump-straight-180': ['Strakt krop og strakte samlede ben.'],
  'rh-reg-j-jump-tuck': ['Lukket position, hofte og knæ 90°; uden skrue.'],
  'rh-reg-j-jump-tuck-180': ['Lukket position, hofte og knæ 90°.'],
  'rh-reg-j-x-jump': ['Står i splithoprækken (bendeling 90°, klar hoftebøjning 90°, strakte ben uden spark). Om hoftebøjningen også gælder X-hop, er uafklaret (A1REG-U05).'],
  'rh-reg-j-leap-straddle': ['Strakte ben uden spark og klar hoftebøjning 90°; bendeling 90° uden skrue.'],
  'rh-reg-j-cat-180': ['Bøjede ben og benskift i luften; begge lår når vandret uden tolerance. Skrue 180°.'],
  'rh-reg-a-roundoff': [],
};

/** A1.2-kataloget. Genbrugte DK-id'er beholder DK's varianter, så en registrering kan vises under begge pakker. */
function regRhythmCatalog(): readonly RhythmCatalogEntry[] {
  const dk = new Map(DK_RHYTHM_CATALOG_V2.map((entry) => [entry.id, entry]));
  const generalRequirements = DK_RHYTHM_CATALOG_V2[0]!.generalRequirements;
  const catalog = readRows(rhythmCatalogCsv).map((row): RhythmCatalogEntry => {
    const id = row.reference_id!;
    const reused = row.dk_moment_id ? dk.get(row.dk_moment_id) : undefined;
    if (row.dk_moment_id && (row.dk_moment_id !== id || !reused || reused.officialCode !== row.official_code)) throw new Error(`Ugyldig DK-kobling for ${id}.`);
    if (!reused && !id.startsWith('rh-reg-')) throw new Error(`Nyt REG-moment ${id} skal have et rh-reg-id.`);
    const options = reused ? structuredClone(reused.options) as RhythmCatalogEntry['options'] : [
      ...rhythmOptions(row),
      ...(id.startsWith('rh-reg-sb-side') ? [{ key: 'handSupport', label: 'Håndhjælp', values: ['one-hand', 'two-hands', 'none'], defaultValue: 'one-hand' }] : []),
    ];
    return {
      id, officialCode: row.official_code!, category: row.category!, page: Number(row.page), value: row.value!, name: row.description!,
      specificRequirement: row.variant_requirements!, issueId: row.issue_id || null,
      source: { sourceId: 'A1.2', section: row.official_code!, page: Number(row.source_page) }, generalRequirements,
      categoryRequirements: REG_RHYTHM_CATEGORY_REQUIREMENTS[row.category!] ?? [],
      rowRequirements: REG_ROW_REQUIREMENTS[id] ?? (reused ? rhythmRowRequirements(id, row.category!) : []),
      options, mirrorAllowed: true, commonFacingRequired: options.some((option) => option.key === 'facing'),
    };
  });
  if (catalog.length !== 75 || new Set(catalog.map((entry) => entry.id)).size !== 75 || catalog.some((entry) => entry.officialCode.startsWith('G'))) throw new Error('Ufuldstændig REG-rytmeimport.');
  return freezeData(catalog);
}
export const REG_RHYTHM_CATALOG = regRhythmCatalog();

const AGE_NOTE = '2 gymnaster må være op til 2 år yngre eller ældre, forudsat at aldersgennemsnittet på holdet ligger inden for aldersinddelingen (TR 1.3).';
const AGE: Readonly<Record<string, { min: number | null; max: number }>> = { U11: { min: null, max: 11 }, U14: { min: null, max: 14 }, junior: { min: 14, max: 17 } };
export const REG_PROFILES: readonly TeamProfile[] = freezeData(['U11', 'U14', 'junior'].flatMap((ageGroup) => ['girls', 'boys', 'mix'].map((teamType) => ({
  ageGroup, teamType, label: `${ageGroup === 'junior' ? 'Junior' : ageGroup} ${teamType === 'girls' ? 'piger' : teamType === 'boys' ? 'drenge' : 'mix'}`,
  counting: REG_SPRING_RULES.participants.counting, extra: REG_SPRING_RULES.participants.maxExtra,
  nominalAge: { ...AGE[ageGroup]! }, ageNote: AGE_NOTE,
  mixQuota: teamType === 'mix' ? { girl: 3, boy: 3 } : null,
  sources: [{ sourceId: 'TR', section: '1.3 Aldersbestemmelser; nominelle profiler, ikke fuld berettigelse', page: 4 },
    { sourceId: 'TR', section: '1.3.1 Antal gymnaster', page: 5 }, { sourceId: 'H', section: '9.1f og 10.1e; deltagere', page: 29 }],
}))));

export const REG_KNOWN_ISSUES: readonly KnownIssue[] = freezeData([
  { id: 'Q05', title: 'Holdomgang uden klar majoritet', detail: '3/3, 2/2/2 og 3/2/1 giver ingen vilkårlig reference. Mere end halvdelen giver en klar reference; 5/1 nulstiller den afvigendes D og vurderer C særskilt. Samme åbne spørgsmål som i Danmarksserien.', scope: 'rule', sources: [{ sourceId: 'H', section: '9.3.4', page: 34 }, { sourceId: 'H', section: '10.3.4', page: 43 }] },
  { id: 'REG-EXTRA-LIMIT-DERIVED', title: 'Højst seks ekstra gymnaster', detail: 'REG-afsnittene nævner ekstra gymnaster uden et antal. Grænsen på seks er afledt af, at højst 12 gymnaster må deltage. Den er en planlægningsgrænse, ikke en trykt REG-regel.', scope: 'rule', sources: [{ sourceId: 'TR', section: '1.3.1', page: 5 }, { sourceId: 'H', section: '9.1f', page: 29 }, { sourceId: 'H', section: '10.1e', page: 39 }] },
  { id: 'A6-U02', title: 'Én hånd på Pegasus', detail: 'Bilaget har en streg for REG, mens hovedreglementet angiver 0,6 også i REG. Appen planlægger ikke dette fradrag.', scope: 'rule', sources: [{ sourceId: 'A6', section: '3.1', page: 7 }, { sourceId: 'H', section: '10.4.2.1', page: 44 }, { sourceId: 'H', section: '10.4.4', page: 46 }] },
  { id: 'H-U08', title: 'Rytmens maksimale C i REG', detail: 'Maksimum står som 1,2, men komponenterne giver tilsammen 1,3. Det er uafklaret, om 1,2 er et loft, eller om en sats er fejltrykt. Appen beregner ingen samlet rytmekarakter.', scope: 'rule', sources: [{ sourceId: 'H', section: '8.2', page: 17 }] },
  { id: 'REG-RYTME-RAMMER', title: 'Rytmens rammer i REG (kun kildegrundlag)', detail: 'Komposition: rytmisk sekvens +0,3 (ikke U11), baglæns og sidelæns retning +0,2 hver og op til tre forskellige formationer à 0,2. Ingen stor, lille eller bevægende formation (LF, SF, CF) og intet tillæg for bevægelser ind og ud. Sværhed: højst syv forskellige elementer for U14 og junior, seks uden gruppeelement for U11. Appen beregner ingen samlet rytmekarakter; se H-U08 om maksimum.', scope: 'rule', sources: [{ sourceId: 'H', section: '8.2', page: 17 }, { sourceId: 'H', section: '8.2.2.1-8.2.2.2', page: 18 }, { sourceId: 'H', section: '8.2.2.3', page: 19 }, { sourceId: 'H', section: '8.3.2', page: 20 }, { sourceId: 'H', section: '8.3.6', page: 22 }] },
  { id: 'H-U11', title: 'Rytmeværdier og koder', detail: 'Hovedreglementet beskriver kodetallet som værdi og række, men tabellens celler har andre værdier. Appen bruger tabelcellens værdi og afleder intet af koden.', scope: 'catalog', sources: [{ sourceId: 'H', section: '8.3.3.f', page: 21 }, { sourceId: 'A1.2', section: 'HB1001', page: 2 }] },
  { id: 'A1REG-U01', title: 'Kolonneværdi frem for kodeciffer', detail: 'Eksempelvis HB1001 står med 0,6. Appen bruger kolonnens værdi; en evt. rettelse af hovedreglementet er ikke bekræftet.', scope: 'catalog', sources: [{ sourceId: 'H', section: '8.3.3.f', page: 21 }, { sourceId: 'A1.2', section: 'HB1001', page: 2 }] },
  { id: 'A1REG-U02', title: 'To trykte G802', detail: 'Kast uden og med rotation har begge koden G802. Appen tilbyder ikke gruppeelementer og giver ingen værdi ud fra koden.', scope: 'catalog', sources: [{ sourceId: 'A1.2', section: 'G802', page: 10 }] },
  { id: 'A1REG-U03', title: 'Håndstøtte i sidebalancer', detail: 'Rækkens overskrift siger med eller uden håndstøtte, mens teksten siger med hjælp fra hånd. Det er uafklaret, om fri benføring er tilladt i SB201, SB401 og SB601.', scope: 'catalog', sources: [{ sourceId: 'A1.2', section: 'SB201', page: 4 }] },
  { id: 'A1REG-U04', title: 'Vandret balance og forskellige rækker', detail: 'Tolerancen for vandret overkrop og krop og rækkeidentiteten på tværs af balancegrupper er uafklaret. Appen måler ikke vinkler og afgør ikke rækkeidentitet.', scope: 'catalog', sources: [{ sourceId: 'A1.2', section: 'Generelle krav', page: 1 }, { sourceId: 'H', section: '8.3.7.1', page: 23 }] },
  { id: 'A1REG-U05', title: 'X-hop i hoftebøjningsrækken', detail: 'X-hop J203 står i en række, hvis tekst kræver 90° hoftebøjning. Det er uafklaret, om kravet også gælder X-hop.', scope: 'catalog', sources: [{ sourceId: 'A1.2', section: 'J203', page: 5 }] },
  { id: 'H-U06', title: 'Afrunding af dommernes tal', detail: 'Planlagt D og C beregnes eksakt og rundes direkte ned til nærmeste 0,005. Det er uafklaret, om dommernes værdier først skal behandles til to decimaler.', scope: 'rule', sources: [{ sourceId: 'H', section: '4.4.a', page: 11 }, { sourceId: 'H', section: '4.6', page: 13 }] },
  { id: 'Q-SPOT-DUP', title: 'Kraftig hjælp på et gentaget element', detail: 'Kraftig hjælp halverer det modtagne elements D. Når samme element også står uhalveret andetsteds i serien, er det uafklaret, hvilken værdi der tæller. Appen viser intervallet mellem halveret og uhalveret D.', scope: 'rule', sources: [{ sourceId: 'H', section: '9.3.3', page: 33 }, { sourceId: 'H', section: '9.3.5', page: 34 }] },
  { id: 'C-RETNING-VALG', title: 'Blandet omgang i begge retningskrav', detail: 'Når samme blandede omgang er nærmest begge retningskrav, bruger appen den i begge optællinger. Det er uafklaret, om to forskellige omgange kræves.', scope: 'rule', sources: [{ sourceId: 'H', section: '9.2.2.4', page: 30 }] },
]);

export const REG_V1 = createDKFamilyPackage({
  manifest: REG_MANIFEST, profiles: REG_PROFILES, springCatalog: REG_SPRING_CATALOG,
  rhythmCatalog: REG_RHYTHM_CATALOG,
  knownIssues: REG_KNOWN_ISSUES, spotRates: DK_SPOT_RATES,
  settings: { ruleCorrections: true, elementBonusResolved: true, repetitionResolved: true, orderResolved: true, apparatusRoundsResolved: true, vaultPikeHalfTwistResolved: true, distinctStartSalto: true, springRules: REG_SPRING_RULES },
});
