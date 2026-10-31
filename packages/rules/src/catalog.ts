import { canonicalJson, elementExecutionSchema } from '@teamgym/domain';
import type { ElementExecution, SourceReference } from '@teamgym/domain';
import springCsv from '../../../openspec/changes/archive/2026-10-25-build-teamgym-team-manager/reference/spring-source-catalog.csv?raw';
import rhythmCsv from '../../../openspec/changes/archive/2026-10-25-build-teamgym-team-manager/reference/rhythm-catalog.csv?raw';

export function freezeData<T>(value: T): T {
  if (value && typeof value === 'object' && !Object.isFrozen(value)) {
    for (const item of Object.values(value)) freezeData(item);
    Object.freeze(value);
  }
  return value;
}

/** Afgrænset import af de fastlåste semikolonfiler; afvis ændret format. */
function readRows(text: string): Record<string, string>[] {
  const [header, ...lines] = text.replace(/^\uFEFF/, '').trim().split(/\r?\n/);
  const fields = header!.split(';');
  return lines.map((line) => {
    const values = line.split(';');
    if (values.length !== fields.length) throw new Error('Katalogets kildeformat er ændret.');
    return Object.fromEntries(fields.map((field, index) => [field, values[index]!]));
  });
}

export interface SpringCatalogEntry {
  referenceId: string;
  name: string;
  officialCode: string;
  printedValue: string;
  /** Pakkens gældende D, når en afklaring afviger fra den trykte kildeværdi. */
  appliedValue?: string;
  status: 'allowed' | 'forbidden' | 'unresolved';
  issueId: string | null;
  source: SourceReference;
  execution: ElementExecution;
  aliases: readonly string[];
  startRole: boolean;
}

function springExecution(row: Record<string, string>): ElementExecution {
  const code = row.printed_code!;
  const isFloor = row.source === 'A3';
  const vault = row.column === 'vault';
  const fixed = isFloor ? ({ X: 'cartwheel', H: 'handspring', FS: 'flyspring', R: 'roundoff', F: 'flic', W: 'whipback' } as Record<string, string>)[code] :
    vault ? ({ R: 'cartwheel-vault', H: 'handspring-vault' } as Record<string, string>)[code] : undefined;
  const bodyCode = code.replace(/^[HT]/, '').replace(/\d+$/, '');
  const bodyPositions = fixed ? ['straight' as const] : [...bodyCode].map((char) => char === 'O' ? 'tuck' as const : char === '>' || char === '<' ? 'pike' as const : 'straight' as const);
  const twistsHalfTurns = fixed ? 0 : Number(code.match(/\d+$/)?.[0] ?? 0);
  const family = fixed ?? (vault ? code.startsWith('T') ? 'tsukahara' : 'overslag-salto' : 'salto');
  const rotations = fixed ? 1 : bodyPositions.length + (vault ? 1 : 0);
  return elementExecutionSchema.parse({
    family, direction: row.column === 'backward' || family === 'tsukahara' ? 'backward' : 'forward',
    rotationQuarterTurns: rotations * 4, bodyPositions, twistsHalfTurns,
    twistDistribution: bodyPositions.length === 1 && twistsHalfTurns ? [twistsHalfTurns] : [],
    apparatus: isFloor ? 'floor' : vault ? 'pegasus' : 'trampet',
    takeoff: family === 'cartwheel' || family === 'handspring' || family === 'roundoff' ? 'one-foot' : 'two-feet',
    landing: 'feet', variant: {},
  });
}

const springRows = readRows(springCsv);
export const DK_SPRING_CATALOG: readonly SpringCatalogEntry[] = freezeData(springRows.map((row) => ({
  referenceId: row.reference_id!, name: row.name!, officialCode: row.printed_code!, printedValue: row.printed_value!,
  status: row.dk_status as SpringCatalogEntry['status'], issueId: row.issue_id || null,
  source: { sourceId: row.source!, section: `${row.column}, række ${row.row}`, page: 1 }, execution: springExecution(row),
  aliases: [...(row.name === 'Flik-flak' ? ['flik', 'flic'] : row.name === 'Kraftspring' ? ['kraft'] : row.name === 'Rondat' ? ['roundoff', 'ronde'] : []),
    ...(row.column === 'vault' ? ['Pegasus', 'springbord', 'redskab'] : []),
    ...(/^T[O/]2$/.test(row.printed_code!) ? ['Kasamatsu uden skrue'] : /^T[O/]4$/.test(row.printed_code!) ? ['Kasamatsu med helskrue'] : [])],
  startRole: row.name!.endsWith(' start'),
})));
if (DK_SPRING_CATALOG.length !== 103 || new Set(DK_SPRING_CATALOG.map((item) => item.referenceId)).size !== 103) throw new Error('Ufuldstændig springimport.');

/** DK 1.1.0: Q02 afklaret 31. oktober 2026 — ved uoverensstemmelse gælder reglementets formel frem for A4-tabellen (H>1 = 1,10). */
export const DK_SPRING_CATALOG_V2: readonly SpringCatalogEntry[] = freezeData(DK_SPRING_CATALOG.map((entry) =>
  entry.issueId === 'Q02' ? { ...structuredClone(entry), status: 'allowed' as const, issueId: null, appliedValue: '1.10' } : structuredClone(entry)));

export function rawElementIdentity(execution: ElementExecution): string { return canonicalJson(execution); }

export interface RhythmOption { key: string; label: string; values: readonly string[]; defaultValue: string }
export interface RhythmCatalogEntry {
  id: string; officialCode: string; category: string; page: number; value: string; name: string;
  specificRequirement: string; issueId: string | null; source: SourceReference;
  generalRequirements: readonly string[]; categoryRequirements: readonly string[]; rowRequirements: readonly string[];
  options: readonly RhythmOption[]; mirrorAllowed: boolean; commonFacingRequired: boolean;
}

export const RHYTHM_GENERAL_REQUIREMENTS = freezeData([
  'Samme element udføres på samme måde; spejling er tilladt. Valgfri udførelse skal være fælles for holdet.',
  'Strakt krop og lodret/vandret kropsposition har generelt 30° tolerance; vandret torso og torsodrejning 15°.',
  'Bendeling, hofte-/knævinkel, samlede ben/knæ, strakte ben/hofte og strakte arme har generelt 15° tolerance.',
  'Rotation måles fra hoften med højst 45° samlet under-/overrotation, ikke 45° ved hver ende.',
  'Specifikke kategori-, række- og cellekrav går forud. Større fleksibilitet giver ikke ekstra værdi.',
  'Samtidighed og højst ét skridt før momentet kræver observation af koreografi; kartoteket godkender ikke udførelsen.',
]);

const categoryRequirements: Record<string, string[]> = {
  HB: ['Genkendelig figur i statisk position i mindst 2 sekunder uden ekstra bevægelser.', 'Kun hænder i gulvet undtagen HB201, HB203, HB603 og HB803. Strakte ben undtagen HB1001. Små benbevægelser accepteres, når hænderne ikke flyttes.'],
  'DB-pirouette': ['På én fod på tå uden hop. Forlæns/baglæns er relativt til støttebenet.', 'Frit ben skal bevare krævet position mindst 3/4 af rotationen; ved bøjet frit ben definerer hælen hoftevinklen.', 'Rotation starter med løftet fri fod og støttehæl, og slutter ved færdig rotation, hælkontakt eller fri fod i gulvet.', 'Alle gymnaster starter med ansigtet samme vej.'],
  'DB-power': ['Kontrolleret kontinuerlig aktiv muskelstyrke, ikke tyngdekraft. Ingen pause ≥2 sekunder, fald, mere end ét skridt eller støtte på benene.', 'Start/slut er tydelige uden krav om 2 sekunders hold. Håndstand har strakte arme med 45° tolerance, strakte samlede ben og strakt hofte.'],
  SB: ['Genkendelig balance på ét ben holdes statisk mindst 2 sekunder uden ekstra koreografi.', 'Det stående ben skal være strakt; små bevægelser i resten af kroppen ændrer ikke værdien, når ståbenet ikke bevæges.', 'Det frie ben holdes i den krævede position. Ved bøjet frit ben definerer hælen vinklen på hoften.'],
  'J-hop': ['Genkendelig figur i luften med position, skrue og landing efter definitionen.', 'Afsæt på to fødder, landing på én eller to efter valgt fælles variant.', 'Ved hop med skrue starter alle med front i samme retning; dette krav gælder hop, ikke generelt spring og hink.'],
  'J-spring': ['Genkendelig figur i luften med position, skrue og landing efter definitionen.', 'Afsæt på én fod og landing på den anden undtagen vekselspring.', 'Ved spring med skrue vender hoften/navlen ved afsæt i bevægelsesretningen.'],
  'J-hink': ['Genkendelig figur i luften efter definitionen; afsæt og landing på samme fod.', 'Ved skruet hink vender hoften/navlen ved afsæt i bevægelsesretningen.'],
  'A-forlaens': ['Genkendelse følger A5; 30° tolerance for strakte ben i hoftebøjet position.'],
  'A-baglaens': ['Genkendelse følger A5; 30° tolerance for strakte ben i hoftebøjet position.'],
  'A-sidelaens': ['Genkendelse følger A5; håndkontakt, afsætsretning og landing skal passe til den præcise variant.'],
  F: ['Veldefineret form vises tydeligt uden krav om at holde positionen i ro. Bendeling definerer momentet; benene er strakte.', 'Krav til hoftevinkel skal være opfyldt. Overkroppens bøjning skal være helt opfyldt uden tolerance; større fleksibilitet giver ikke ekstra værdi.'],
};

function rhythmRowRequirements(id: string, category: string): string[] {
  const result: string[] = [];
  if (/rh-hb-(?:dynamic-handstand|handstand)$/.test(id)) result.push('Strakte arme med 45° tolerance; benene over hoftehøjde med 45° tolerance. HB401 tillader håndskridt og må også udføres stille.');
  if (id.includes('bridge')) result.push('Skuldre mindst over hænder, målt ved linjen gennem skuldercentret. Ingen tolerance for det frie bens højde.');
  if (id === 'rh-hb-elbow-planche') result.push('Vandret krop, støtte på begge hænder på albuer eller strakte arme; ben samlede eller spredte.');
  if (/rh-hb-v-/.test(id)) result.push('Begge hænder ved siden af kroppen tæt ved hoften. Støtte op ad armene er ikke tilladt.');
  if (id.includes('turn-leg90')) result.push('Frit ben 90° uden håndstøtte; hælen bestemmer hoftevinklen ved bøjet frit ben.');
  if (id.includes('press-')) result.push('Startposition valgfri; kontrolleret stem med strakte spredte henholdsvis samlede ben efter momentet.');
  if (id === 'rh-db-headstand-planche') result.push('Kontrolleret hovedstand med strakt krop sænkes til albueplanche med vandret kropslinje.');
  if (id === 'rh-db-handstand-planche') result.push('Kontrolleret håndstand sænkes til albueplanche med vandret kropslinje.');
  if (id === 'rh-db-handstand-straddle-l') result.push('Kontrolleret sænkning fra håndstand til katete med spredte ben; strakte ben gennem hele bevægelsen.');
  if (/rh-sb-(?:side|forward)-supported/.test(id)) result.push('Lodret overkrop; hånd/hænder hjælper det frie ben i den angivne retning.');
  if (/rh-sb-scale-/.test(id)) result.push('Overkrop vandret eller over.');
  if (/rh-sb-side-scale/.test(id)) result.push('Ingen håndhjælp. Vandret overkrop; overkrop og ben i frontalplanet, strakt hofte og ingen torsodrejning.');
  if (/rh-sb-side-balance/.test(id)) result.push('Vandret overkrop med frit ben til siden.');
  if (/rh-j-(?:jump-straight|straight-hop)/.test(id)) result.push('Strakt krop og strakte samlede ben; ingen spark.');
  if (/rh-j-(?:jump-tuck|tuck-hop)/.test(id)) result.push('Lukket position, hofte og knæ 90°.');
  if (id.includes('straddle')) result.push('Strakte ben uden spark, tydelig hoftebøjning 90°; bendeling efter momentfeltet.');
  if (id.includes('sissone')) result.push('Landing på én fod; strakte ben og forreste ben mindst 45° uden tolerance.');
  if (id.includes('cat')) result.push('Benskift i luften; begge lår når vandret uden tolerance. J405 har strakte ben efter skift og 135° bendeling; øvrige trykte kattespring har bøjede ben.');
  if (id.includes('scissor') || id.includes('entrelace')) result.push('Strakte ben og benskift i luften; første ben når vandret uden tolerance. Ved entrélacé defineres bendeling efter skruen.');
  if (id.includes('butterfly')) result.push('Vandret overkrop, mave nedad; ben vandret eller over uden tolerance.');
  if (id.includes('zigzag')) result.push('Ben bøjet 90°; bendeling måles lår til lår.');
  if (id.includes('split-leap') || id.includes('switch-split')) result.push('Strakte ben uden spark. Ved vekselspring svinges første ben frem mindst 45° uden tolerance før benskift; bendeling måles efter skiftet.');
  if (id.includes('cossack')) result.push('Ét ben strakt frem, ét bøjet, knæ samlede; hofte og bøjet knæ 90°.');
  if (id.includes('bent-leg-hop')) result.push('Strakt krop med ét strakt og ét bøjet ben; hofte og bøjet ben 90°.');
  if (category === 'A-forlaens' && id.includes('forward-')) result.push('Afsæt/landing på én eller to fødder er valgfrit, men udføres fælles. A401 lander siddende med hænder og fod før anden kropskontakt.');
  if (id === 'rh-a-handspring' || id === 'rh-a-free-handspring') result.push('Afsæt på ét ben; landing på ét eller to ben.');
  if (id === 'rh-a-gainer-tuck' || id === 'rh-a-gainer-flic') result.push('Afsæt på ét ben; landing på ét eller to ben. Gainer er ikke alias for almindelig baglæns udførelse.');
  if (id === 'rh-a-flic') result.push('Afsæt på to ben; landing på ét eller to ben.');
  if (id === 'rh-a-side-salto') result.push('Afsætsretning mellem forlæns og sidelæns med 45° tolerance. Afsæt/landing på én eller to fødder, valgfri kropsposition; landingen er sidelæns.');
  if (id === 'rh-a-gumbi') result.push('Bro-cirkel: vejrmølle i buet position. Startposition vælges fælles, fx stående eller knælende og sidelæns eller baglæns, jf. Q&A side 3.');
  if (id.startsWith('rh-f-straddle-fold')) result.push('Bredsiddende med 90° bendeling. F801 kræver bryst og/eller skuldre i gulvet; F401 kræver 45° hoftevinkel.');
  if (['rh-f-standing-fold', 'rh-f-sitting-fold'].includes(id)) result.push('Bryst og/eller skuldre rører de strakte samlede ben. Stående og siddende udførelse er forskellige momenter.');
  if (id === 'rh-f-front-split') result.push('Lårene rører gulvet; overkroppens og armenes position er valgfri, men fælles udførelse aftales.');
  if (id.startsWith('rh-f-side-split')) result.push('Ben og hofte i lige linje; overkrop og arme valgfri. F1004 kræver lår mod gulv.');
  if (id.startsWith('rh-f-kneeling-side')) result.push('Det frie ben føres ud til siden med håndhjælp, hoften strakt. Man må læne til siden og lade hånden røre gulvet.');
  return result;
}

function rhythmOptions(row: Record<string, string>): RhythmOption[] {
  const id = row.reference_id!;
  const category = row.category!;
  const options: RhythmOption[] = [];
  const add = (key: string, label: string, values: string[]) => options.push({ key, label, values, defaultValue: values[0]! });
  if (['rh-hb-headstand', 'rh-hb-l', 'rh-db-press-together'].includes(id)) add('legs', 'Benstilling', ['together']);
  if (['rh-hb-straddle-l', 'rh-db-press-straddle', 'rh-db-handstand-straddle-l'].includes(id)) add('legs', 'Benstilling', ['straddle']);
  if (category === 'J-hop') add('landing', 'Landing', id.includes('sissone') ? ['one-foot'] : ['two-feet', 'one-foot']);
  if (category === 'J-spring') add('landing', 'Landing', id.includes('switch-split') ? ['opposite-foot', 'same-foot'] : ['opposite-foot']);
  if (category === 'J-hink') add('landing', 'Landing', ['same-foot']);
  if (/^rh-a-forward-/.test(id)) {
    add('takeoff', 'Afsæt', ['two-feet', 'one-foot']);
    add('landing', 'Landing', id === 'rh-a-forward-sit' ? ['seated'] : ['two-feet', 'one-foot']);
  }
  if (['rh-a-handspring', 'rh-a-free-handspring', 'rh-a-flic', 'rh-a-gainer-flic', 'rh-a-gainer-tuck'].includes(id)) {
    add('takeoff', 'Afsæt', id === 'rh-a-flic' ? ['two-feet'] : ['one-foot']);
    add('landing', 'Landing', ['two-feet', 'one-foot']);
  }
  if (['rh-hb-v-45', 'rh-hb-v-90', 'rh-hb-elbow-planche', 'rh-db-headstand-planche', 'rh-db-handstand-planche'].includes(id)) add('legs', 'Benstilling', ['together', 'straddle']);
  if (id === 'rh-hb-elbow-planche') add('support', 'Støtte', ['elbows', 'straight-arms']);
  if (id === 'rh-a-onehand-cartwheel') add('hand', 'Håndstøtte', ['first-hand', 'second-hand']);
  if (id === 'rh-a-gumbi') add('start', 'Fælles startvariant', ['sideways', 'backward']);
  if (id === 'rh-a-gumbi') add('startLevel', 'Startniveau', ['standing', 'kneeling']);
  if (/rh-sb-(?:side|forward)-supported/.test(id)) add('handSupport', 'Håndhjælp', ['one-hand', 'two-hands']);
  if (id === 'rh-a-side-salto') {
    add('takeoff', 'Afsæt', ['two-feet', 'one-foot']);
    add('landing', 'Landing', ['two-feet', 'one-foot']);
    add('bodyPosition', 'Kropsposition', ['tuck', 'pike', 'straight']);
    add('takeoffDirection', 'Afsætsretning', ['sideways', 'forward']);
  }
  if (id.startsWith('rh-f-kneeling-side')) add('floorSupport', 'Hånd i gulvet', ['no', 'yes']);
  if (category === 'DB-pirouette' || (category === 'J-hop' && /(?:360|540|180)/.test(row.description!))) add('facing', 'Fælles startretning for ansigt', ['front', 'back', 'left', 'right']);
  return options;
}

export const DK_RHYTHM_CATALOG: readonly RhythmCatalogEntry[] = freezeData(readRows(rhythmCsv).map((row) => {
  const options = rhythmOptions(row);
  return {
    id: row.reference_id!, officialCode: row.official_code!, category: row.category!, page: Number(row.page), value: row.value!, name: row.description!,
    specificRequirement: row.variant_requirements!, issueId: row.issue_id || null,
    source: { sourceId: 'A1.1', section: row.official_code!, page: Number(row.page) }, generalRequirements: RHYTHM_GENERAL_REQUIREMENTS,
    categoryRequirements: categoryRequirements[row.category!] ?? [], rowRequirements: rhythmRowRequirements(row.reference_id!, row.category!),
    options, mirrorAllowed: true, commonFacingRequired: options.some((option) => option.key === 'facing'),
  };
}));
if (DK_RHYTHM_CATALOG.length !== 94 || DK_RHYTHM_CATALOG.some((item) => item.category === 'G')) throw new Error('Ufuldstændig individuel rytmeimport.');

/** DK 1.1: tre tilladte tilløbsskridt og kun rotationshop med krav om fælles startfront. */
export const DK_RHYTHM_CATALOG_V2: readonly RhythmCatalogEntry[] = freezeData(DK_RHYTHM_CATALOG.map((entry) => {
  const copy = structuredClone(entry);
  copy.generalRequirements = copy.generalRequirements.map((text) => text.replace('højst ét skridt før momentet', 'højst tre gå- eller løbeskridt før momentet'));
  if (entry.id === 'rh-j-sissone-180') {
    copy.options = copy.options.filter((option) => option.key !== 'facing');
    copy.commonFacingRequired = false;
  }
  return copy;
}));
