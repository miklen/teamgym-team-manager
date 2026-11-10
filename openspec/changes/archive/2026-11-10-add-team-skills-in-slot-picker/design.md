## Context

`AthleteEntryForm` i `apps/web/src/spring.tsx` bruges både til omgangspladser og, via `reserves.tsx`, til reservepladser. Formularen har i dag en indbygget `<select>` for gymnast, som forudvælger `athletes[0]`, og `PlanSkillSelect` (`plan-skill-select.tsx`) med gymnastens anvendelige registreringer, D og sikkerhed. Formularen kender kun den aktuelle `round` og ikke scenariets øvrige omgange.

Holdoptælling pr. regelidentitet findes allerede i `teamUsableSpringCounts` (`spring-picker-model.ts`). Den bruges i dag kun af ambitionsvælgeren. Gentagelse vurderes i `dk-engine.ts` (`C-GENTAG`) på regelidentitet for tællende pladser med `eligibleForC` på tværs af omgange. Gymnasten er uden betydning i DK 1.1.0, mens ældre logik tager hensyn til samme gymnaster. Regelpakken angiver gentagelse pr. disciplin i `springRules[discipline].sources['C-GENTAG']`.

Visuelt bruger springvalget rolige rækker med faste kolonner, én blå accent (`--accent`) og en varm ravfarve (`#a87428`) som eksisterende advarselssemantik i `.notice`.

## Goals / Non-Goals

**Goals:**
- Spring først: et overblik over, hvad holdet kan, direkte i Tilføj plads, uden tilfældig forudvalgt gymnast.
- En stille, men umiskendelig advarsel om gentagelse mellem omgange i begge lister.
- Et udtryk, der føles som en premium app: tæt, rolig og præcis med en lille mængde meningsfuld bevægelse.
- Ingen ændring af gemte data, domænekommandoer eller flettepolitik.

**Non-Goals:**
- Matrix over holdets spring som selvstændig visning (senere ændring).
- Beregning af fradragsbeløb i springvalget. Analysen forbliver eneste kilde.
- Rytme. `SpringDiscipline` omfatter kun bane og trampet.
- Ændringer i ambitionsvælgeren (Ingen gymnast endnu).

## Decisions

### Visuel retning
- **Visuel tese:** Et præcist træner-instrument i stil med Linear: hvidt papir, mørk blæk, tal i tabulære cifre og kun to signaler, blå for valg og rav for gentagelse.
- **Indhold:** Gymnastfelt (hvem), springfelt (hvad), rolle og handling. Ingen nye kort og ingen nye paneler. Holdets overblik lever i den eksisterende liste.
- **Interaktionstese:**
  1. Når et spring vælges under Hele holdet, glider gymnastfeltets undertekst fra »9 gymnaster« til »2 kan · vælg gymnast«, og feltet får et kort accentskær, så næste skridt er åbenlyst.
  2. Listen skifter fra holdets til gymnastens rækker med en kort krydsfade på ca. 150 ms. Rækkernes højde er stabil, så intet hopper.
  3. Gentagelsesmærket toner ind og ud, når rollen skiftes mellem tællende og ekstra.

  Alt slås fra ved `prefers-reduced-motion`.

### Én gymnastkontrol i samme sprog som springvalget
`<select>` erstattes af `PlanAthleteSelect`, en søgbar listbox i samme mønster og med samme tastaturadfærd som `PlanSkillSelect` (fælles styling og hjælpere udtrækkes, men der laves ingen ny generisk komponentfamilie). Første række er Hele holdet med antal ledige gymnaster. Når et holdspring er valgt, viser hver gymnastrække de samme fem sikkerhedstrin som springlisten, og gymnaster uden springet skjules.
*Alternativ:* Behold den indbyggede `<select>` med tekst som »Anna · 4/5«. Den kan ikke vise sikkerhedstrin konsekvent, og den bryder det visuelle sprog. *Alternativ:* En særskilt række gymnastchips under springet. Det giver to kontroller for samme valg og er forvirrende.

### Rækkeanatomi
```
 Spring                         D      Holdet
 Rondat - flik - strakt salto  1,40   (AE)(BE)(CE)(DE)(:FE:)(:GE:)
 baglæns                              4 ledige af 6
 ! Omg. 2 x3
```
- Under Hele holdet erstatter kolonnen »Holdet« sikkerhed: en stak initialer, hvor ledige gymnaster er fyldte i accentfarven, og gymnaster, der allerede står i omgangen, er stiplede spøgelser. Under stakken står »4 ledige af 6« (eller blot »4 ledige«) i tabulære cifre. Over fire ansigter samles resten i »+N«. 0 ledige forekommer ikke, fordi spring uden ledige gymnaster skjules. Gymnastlisten nævner de placerede gymnaster i en note under listen, når den er indsnævret.
- Brugervalg efter lokal test: Første udkast med »4 kan« og »+2 i omg.« var uklart; stakken viser både hvor mange og hvem.
- Gentagelse vises som en lille ravfarvet linje under navnet med et trekantet mærke og teksten »Omg. 2 x3«. Den står i både gymnast- og holdtilstand. Rækken bliver ikke rød, og D/sikkerhed forskydes ikke.
- Neutral brug (samme omgang, eller rolle ekstra/reserve) vises i `--muted` uden mærke: »Brugt 2× i omgangen« og »Omg. 2 x3 · tæller ikke«.
- Det valgte spring i triggerfeltet viser også mærket, så advarslen er synlig efter lukning.
- På mobil (390 px) ligger markeringerne under navnet, og D og holdtal står i en kompakt højrekolonne, som det eksisterende mobilgrid allerede gør.

### Ren afledning i `spring-picker-model.ts`
- `teamSkillRows(workspace, teamId, discipline, rulePackage, availableAthleteIds)` grupperer anvendelige registreringer efter `evaluateSkill(skill, registration).identity` med samme filter som den eksisterende liste (aktiv, ikke arkiveret, disciplin, `validity === 'known'`). Funktionen returnerer pr. identitet: repræsentativt navn, retning, D under pakken (springets egen D uden personlig justering), ledige gymnast-id'er med deres bedste registrering og antal placerede. Sortering sker efter ledige (faldende), derefter D (faldende) og derefter navn (`da`).
- `roundIdentityUsage(scenario, roundId, editingEntryId, workspace, rulePackage)` tæller pr. identitet tællende pladser pr. omgang. Ambitioner tælles via `plannedSkillId`. Den redigerede plads, ekstra pladser og reserver udelades. Tællegrundlaget følger `C-GENTAG` (tællende, kendt gyldighed). Det duplikerer ikke regelberegningen, fordi beløb ikke beregnes.
- Markeringen aktiveres kun, når `rulePackage.springRules[discipline].sources['C-GENTAG']` findes.
*Alternativ:* Kald `rulePackage.analyze` og læs `repeatRoundIds`. Det giver ikke forekomster pr. identitet før valg og er tungere ved hvert åbn.

### Overførsel fra holdspring til gymnast
Formularen holder lokalt `{ athleteId: string | 'team', identity: string | null, athleteSkillId: string | null }`. Ved valg af gymnast med valgt identitet vælges gymnastens registrering af identiteten med højest effektiv sikkerhed. Uvurderet tæller lavest, og ved lighed afgør registreringsrækkefølgen. Ellers nulstilles springet som i dag. `PlanSkillSelect` får `initialValue` fra den overførte registrering i stedet for altid at nulstille ved `key={athleteId}`. Det skjulte felt `skill` bærer fortsat kun `athleteSkillId`, så `submit` og domænekommandoen er uændrede. `ActionForm` er `disabled`, mens `athleteId === 'team'`, med teksten »Vælg en gymnast for at gemme pladsen«.

### Data til formularen
`EntryForm` får scenariets omgange (`rounds`) og det redigerede entry-id fra kaldestederne i `spring.tsx` og `reserves.tsx`. Rollen læses løbende fra formularen, så markeringen kan skifte mellem advarsel og neutral.

### Fælles data og fletning
Ændringen er ren visning. Der tilføjes ingen schemafelter, og ingen eksisterende felter får ny betydning. Identiteter, listeorden, afhængigheder og domænekommandoer er uændrede. Antal gymnaster og gentagelsesmarkeringer er afledte værdier, som beregnes ved hver visning og aldrig gemmes. Formularen indfører ingen egne fletteregler og gemmer præcis det samme `RoundEntryInput` som i dag. Derfor kræves ingen ændring af `merge-policy.ts` og ingen nye samtidighedstests. Den strukturelle flettekontrol i `npm run verify` bekræfter, at schemaet er uændret.

## Risks / Trade-offs

- [En identitet har forskellige visningsnavne på tværs af registreringer] → Brug `springDisplayName` for den første registrering i deterministisk rækkefølge. Søgning matcher alle navne i gruppen.
- [Ydelse ved store hold: evaluateSkill pr. registrering ved hvert åbn] → `useMemo` på workspace, hold, disciplin og omgang. Antallet er højst nogle hundrede registreringer.
- [Advarslen kan opfattes som et sikkert fradrag] → Teksten nævner kun brug og ikke beløb. Analysen forbliver kilden, og det tilgængelige navn siger »brugt i omgang 2«.
- [Ændret standard (Hele holdet) bryder eksisterende browserprøver, der forventer første gymnast] → Prøverne opdateres til eksplicit at vælge gymnast. Det er tilsigtet adfærd.
- [Reservedialogen deler formularen] → Hele holdet gælder også reserver, mens gentagelse kun vises neutralt for dem.

## Migration Plan

Ingen datamigration. Rollback sker ved at fjerne UI-ændringen, da gemte filer er uændrede.

## Verification

Følg kontrolniveauerne i AGENTS.md. Enhedstest af de to afledninger og browserprøve af spring-først-forløbet og gentagelsesmarkeringen i den eksisterende `plan-skill-select.spec.ts`. Ændringen er en mellemstor UI-ændring, så der laves visuel kontrol ved 390 og 1440 px.

## Open Questions

Ingen blokerende spørgsmål.
