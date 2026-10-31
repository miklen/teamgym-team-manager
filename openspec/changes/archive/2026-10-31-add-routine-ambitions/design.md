# Design

## Context

Se `proposal.md` og delta-specifikationerne. En plads i en springomgang (`RoundEntry`) er i format 4 `{ id, athleteId, athleteSkillId | null, role, plannedSpot | null }`. Springet nås kun gennem gymnastens registrering (`athleteSkillId → AthleteSkill.skillId → SkillDefinition`). `setRoundEntries` er den fælles indgang for pladsændringer, og `insertReserve` og potentialeforslag går også gennem den.

I `dk-engine.ts` evaluerer `evaluateEntry` en plads ud fra registreringen. Lokale diagnoser af typen `incomplete` gør bidraget utilgængeligt (`available`). `compositionReady` kræver blandt andet, at mixfordelingen er kendt. Den uafklarede variant af gentagelsesreglen sammenligner gymnast-id'er (`sameAthletes`). `roundStability` tæller kun pladser med gyldig gymnast og registrering som udfyldte.

Potentialesøgningen (`potential.ts`) udskifter hele omgange med `witnessEntries` og beskriver ændringer pr. `athleteId`. Tilføj plads-dialogen (`spring.tsx`) vælger først gymnast og derefter en af gymnastens registreringer. `springLibrary()` samler gængse opskrifter og arbejdsrummets definitioner, deduplikeret på regelpakkens identitet. `registerSpring()` genbruger en eksisterende `SkillDefinition` med samme identitet.

I `merge-policy.ts` er deltagerlisten en ordnet, atomisk liste (`list('Deltagere', entry)`), hvor `athleteId` er identitet. Den ændres allerede på samme plads-id ved reserveindsættelse.

## Goals / Non-Goals

**Goals:**
- En plads kan være en ambition: et spring uden gymnast, som oprettes i den eksisterende Tilføj plads-dialog.
- Ambitioner indgår fuldt i D, C, tillæg, fradrag og guide uden opdeling i besat og ambition.
- Besættelse kræver et faktisk match og gør pladsen til en almindelig plads.
- *Kan nu*-tallet er afledt og altid aktuelt.
- Sikker fletning, deterministisk migration og afvisning i ældre apps.
- En moderne, elegant og tilgængelig præsentation efter projektets frontend-skill.

**Non-Goals:**
- Ingen automatisk besættelse og ingen notifikationer ved nye registreringer.
- Ingen ambitioner som reserver og ingen modtagning på ambitioner.
- Ingen hukommelse om en tidligere ambition på en besat plads, og ingen omdannelse af en besat plads til ambition.
- Ingen udvidelse af potentialesøgningen til at besætte ambitioner eller søge omkring faste pladser.
- Rytme er ikke omfattet, da springplaner kun findes for bane og trampet.

## Decisions

### 1. Datamodel: valgfri gymnast og planlagt spring på pladsen

`RoundEntry` får i format 5 det påkrævede felt `plannedSkillId: Id | null`, og `athleteId` bliver `Id | null`. Invarianter, som valideres i schemaets `superRefine` og i `validateWorkspace`:
- `athleteId === null` ⇔ `plannedSkillId !== null`.
- En ambition har `athleteSkillId === null` og `plannedSpot === null`.
- `plannedSkillId` refererer til en eksisterende `SkillDefinition` i pladsens disciplin.

`ReserveEntry` er uændret, og `athleteId` er fortsat påkrævet.

`plannedSkillId` peger på `workspace.skills`. Når træneren vælger en katalogopskrift, der ikke findes i arbejdsrummet endnu, genbruges en eksisterende definition med samme regelpakkeidentitet. Ellers oprettes en ny definition, efter samme mønster som `registerSpring`. Oprettelse af definitionen og ambitionen sker i én kommando, altså én ændring.

Alternativer:
- *Definitionen indlejret på pladsen* blev forkastet. Den ville duplikere springdata uden for kartoteket, gå uden om regelgennemgang og arkivering af spring og give to kilder til springidentitet.
- *Kun identitetsstrengen* blev forkastet. Den kan ikke valideres som reference, kan ikke vises uden regelpakken og bryder med det eksisterende mønster, hvor pladser refererer til objekter.

`planReferences()` medtager `plannedSkillId`, så definitioner, der kun bruges af ambitioner, regnes som brugte.

### 2. Kommandoer

Al ændring sker gennem domænekommandoer. Formularer sætter aldrig felter direkte.

- **`setRoundEntries`** accepterer ambitionspladser i `RoundEntryInput` (`athleteId: null`, `plannedSkillId`). For en ny eller ændret ambition gælder, at definitionen skal findes, være aktiv og høre til pladsens disciplin. En uændret ambition bevares (`retained`) som i dag. Unikhed af gymnaster pr. omgang gælder kun pladser med gymnast. En ambition får altid `plannedSpot = null`.
- **`addAmbition(…, definition, role, afterIndex)`** genbruger eller opretter definitionen ud fra en injiceret identitetsfunktion og indsætter pladsen gennem `setRoundEntries`. Identitetsfunktionen injiceres i kommandomiljøet ligesom arvekonteksten (`environment.inheritance`), fordi `packages/domain` ikke må afhænge af `packages/rules`.
- **`changeAmbitionSkill`** skifter springet på en ambition på samme måde.
- **`fillAmbition(…, entryId, athleteSkillId)`** kontrollerer følgende:
  - pladsen er en ambition
  - registreringen er aktiv og tilhører en aktiv gymnast på holdet
  - gymnasten er ikke allerede deltager eller reserve i omgangen
  - registreringens definition har samme identitet som ambitionens, vurderet med den injicerede identitetsfunktion

  Kommandoen skriver derefter `{ athleteId, athleteSkillId, plannedSkillId: null, plannedSpot: null }` på samme plads-id med uændret rolle og position. Det er samme mønster som `insertReserve`.
- **Fjern plads** er uændret og fjerner hele pladsen, også en besat ambition.
- **Rediger en besat plads** tilbyder ikke "Ingen gymnast endnu", så en besat plads kan ikke omdannes til en ambition.
- **`duplicateScenario`** kopierer `plannedSkillId` via `structuredClone`, og `moveRoundFirst`, rækkefølge og rolle bevarer det.
- **`insertReserve`** afviser en ambitionsplads som mål.

Alternativ: at lade dialogen kalde `setRoundEntries` med en udfyldt plads ved besættelse. Det blev forkastet, fordi matchkontrollen så kun lå i UI'et.

### 3. Match og *kan nu* i `packages/rules`

En ny funktion, `ambitionCandidates(workspace, rulePackage, teamId, round, entryId)`, returnerer kandidater for en ambition. For hver gymnast angives `{ athlete, registration | null, status: 'match' | 'not-yet' }`, sorteret med matches først efter sikkerhed og derefter navn.

En gymnast er et match, når alle disse betingelser er opfyldt:
- gymnasten er aktiv og på holdet
- gymnasten er ikke allerede deltager eller reserve i samme omgang
- gymnasten har en ikke-arkiveret registrering af en ikke-arkiveret definition med `rulePackage.evaluateSkill(definition).identity` lig ambitionens identitet
- `evaluateSkill(definition, registration).validity === 'known'`

Det er samme filter, som dialogen bruger i dag. Afledte (arvede) registreringer er almindelige registreringer og tæller med. *Kan nu* er antallet af matches. Tallet beregnes ved visning og memoiseres pr. arbejdsrumsrevision og hold. Det gemmes aldrig.

### 4. Evaluering af ambitioner i `dk-engine`

`evaluateEntry` får en gren for ambitioner:
- `skill = definitions.get(plannedSkillId)`, og `evaluation = evaluateSpringSkill(skill, null, …)`.
- Der er ingen `athlete-unavailable`-diagnose. I stedet tilføjes diagnosen `athlete-missing` med status `incomplete` og teksten "Mangler gymnast". Den regnes som en planlægningsmangel og ikke som et utilgængeligt bidrag: `available` ignorerer `athlete-missing`, så `originalD`, `identity` og `eligibleForC` beregnes som for en besat plads med samme spring.
- Et spring, hvis gyldighed kræver gymnastens personlige forbindelsesbekræftelse (`connection === 'unverified'`), får uafklaret D med forklaringen "Forbindelsen bekræftes, når en gymnast tager pladsen". Det gives ikke en opdigtet værdi.

Omgangsniveau:
- **Status** bliver mindst `incomplete`, når der er ambitioner blandt de tællende. D-summen er stadig kendt (`roundSum` markerer kun ufuldstændighed ved manglende antal), så omgangen viser den samlede sværhed, som ønsket.
- **`compositionReady`** kræver ikke længere en kendt mixfordeling for ambitionspladser. Kravet er, at fordelingen er *opnåelig*: de besatte tællende piger og drenge overstiger ikke holdprofilens kvote. Mixkravet vises som ufuldstændigt med "afhænger af, hvem der tager N ambitionspladser". En allerede brudt kvote giver fortsat `invalid`.
- **Gentagelse (uafklaret variant med `sameAthletes`)**: Hvis en matchgruppe indeholder ambitioner, beregnes begge udfald. Er de ens, bruges værdien. Ellers bliver resultatet `uncertain('incomplete')` med begge som alternativer. Den afklarede variant bruger kun antal og er uændret.
- **Holdomgang, rækkefølge (Q06), C-krav og tillæg** bruger identitet og D og virker uændret.
- **`roundStability`** tæller ambitioner som ikke udfyldte pladser, så sikkerhedsaggregatet viser for eksempel 5/6 vurderet og ufuldstændig. Der er ingen ny regel.

Alternativ: at behandle ambitionen som `skill-missing`. Det blev forkastet, fordi D og C så ikke ville tælle med, hvilket strider mod brugerens beslutning.

### 5. Potentialeforslag

Ambitionspladser er faste. `potential.ts` genererer ikke et konkret forslag, der ville udskifte en omgang med ambitioner (`witnessEntries` på en sådan omgang springes over). Hvis det fjerner alle forslag til et tillæg, vises tillægget med status *ufuldstændig* og forklaringen "Forslag udskifter ikke omgange med ambitioner. Besæt eller fjern dem for at se forslag". Ændringslisten pr. `athleteId` påvirkes ikke, da ambitioner aldrig ændres.

Alternativ: at bevare ambitionspladser og kun søge på de øvrige. Det blev udskudt, fordi det kræver en ny søgning med faste pladser og ikke er nødvendigt for arbejdsgangen.

### 6. Flettepolitik

I `merge-policy.ts` får `entry` feltet `plannedSkillId: value('Planlagt spring')`. Deltagerlisten forbliver atomisk, og dækningskontrollen fanger feltet. Betydning:
- **Samtidig besættelse af samme ambition** med forskellige gymnaster, eller ændring af ambitionens spring mens den anden side besætter, er forskellige ændringer af samme omgangs deltagerliste. Det giver ét valg for hele listen. Identiske besættelser flettes uden konflikt.
- **Ændringer i forskellige omgange eller scenarier** flettes uafhængigt som i dag.
- **Ny definition fra en ambition og en samtidig registrering af samme spring** som en ny definition på en anden side giver to definitioner med samme identitet. Begge bevares, og matchet sker på identitet, så gymnasten tæller som *kan nu*. Der kræves ingen automatisk sammenlægning.
- **Gymnast som deltager og reserve samtidig**: Hvis én side besætter en ambition med en gymnast, og den anden side gør samme gymnast til reserve i omgangen, skal kandidatvalideringen ("Domænesammenhænge bevares i hele resultatet") fange dubletten og kræve et valg. Der skal være tests i begge retninger.
- **Arkivering af ambitionens definition** på den ene side og besættelse på den anden flettes. Den besatte plads får de eksisterende diagnoser for arkiverede spring.

Konfliktvisningen formaterer en ambition som "Ambition · <springnavn> · mangler gymnast". `docs/vedligeholdelse-fletning.md` udvides med fælles data, sammenligning, identiteter, rækkefølge, afhængigheder, afledte værdier (*kan nu* og match) og præsentation.

### 7. Format 5 og migration

`CURRENT_SCHEMA_VERSION = 5`. `workspaceV4Schema` bevares til læsning. `migrateWorkspaceV4` tilføjer `plannedSkillId: null` på alle pladser uden nye id'er, ur eller tilfældighed, så migrationen er deterministisk. Format 1–3 migreres via kæden. `DriveClient` medtager version 4 i migrationsgrenen, og dialogteksten bruger det aktuelle målformat. Gennemgang og fletning migrerer en basis eller R i format 4 deterministisk før sammenligning. Ældre apps afviser format 5 via `newer-schema`.

### 8. Præsentation (frontend-skill)

Al UI implementeres efter `.agents/skills/frontend-skill/SKILL.md` og skal fremstå moderne, elegant og intuitiv:
- **Tilføj plads-dialogen**: Gymnastfeltet får "Ingen gymnast endnu" som et tydeligt, men sekundært valg, gerne som en segmenteret kontrol eller et visuelt adskilt kort øverst i listen og ikke kun som en option gemt i en select. Ved valget skifter springvælgeren til disciplinens katalog (`springLibrary`) med samme søgning, tastaturbetjening og kolonner som i dag. Sikkerhedskolonnen viser "Ingen gymnast" i stedet for trin.
- **Ambitionspladsen i omgangen**: Pladsen har samme geometri som en besat plads, så rækkefølgen ikke hopper. Den fremstår lettere ("ghost"-udtryk med en stiplet eller transparent kant og nedtonet avatarplads med et diskret plus) og viser springnavn, retning og D som en almindelig plads. En tekstchip viser "Mangler gymnast" og en anden "2 kan nu" eller "Ingen kan endnu". Teksten bærer betydningen, så den ikke formidles alene med farve eller ikon. Tilgængeligt navn: "Ambition: <spring>, mangler gymnast, 2 gymnaster kan nu".
- **Besættelse**: Ambitionen åbnes i den samme dialog med springet fastlåst øverst. Gymnastlisten er grupperet i *Kan springet* (sikkerhed vist) og *Kan ikke endnu* (deaktiveret med genvejen "Åbn gymnastens færdigheder"). Valg og Opdater besætter pladsen med en kort, rolig overgang fra ambition til besat. Overgangen respekterer `prefers-reduced-motion`.
- **Mobil og desktop**: Ingen vandret overflow. Chips brydes pænt. Fuld tastatur- og skærmlæserstøtte, og fokus bevares efter Opdater.
- **Guide og analyse**: Ambitioner indgår uden særskilt opdeling. Mangler vises som "mangler gymnast" i omgangens status.

## Risks / Trade-offs

- [En omgang med ambitioner kan ligne en færdig omgang, fordi D og C er kendte] → Altid synlig status "mangler gymnast" på pladsen og i omgangens status. Ingen markering som gennemført.
- [*Kan nu* tæller samme gymnast på flere ambitioner med samme spring i samme omgang] → Tallet betyder "kan tage netop denne plads". Den første besættelse fjerner gymnasten fra de andre pladsers tal. Det dokumenteres i hjælpeteksten.
- [Definitioner oprettet til ambitioner fylder i det fælles kartotek] → De genbruges ved senere registrering af samme spring og er netop de spring, holdet arbejder hen imod.
- [Atomisk deltagerliste giver flere konfliktvalg] → Samme adfærd som i dag for pladsændringer. Ambitionen vises tydeligt i valget.
- [Format 5 kræver, at alle trænere opdaterer appen] → Ældre apps afviser filen uden at overskrive den. Migrationsdialogen informerer.
- [Brugerdefinerede forbindelser kræver personlig bekræftelse] → D vises som uafklaret med forklaring, indtil en gymnast tager pladsen.

## Migration Plan

1. Indfør format 5-schema, migration fra format 4 og kæden fra 1–3 med tests.
2. Kommandoer, regler og flettepolitik med tests, herunder samtidighed i begge retninger.
3. UI efter frontend-skill og e2e.
4. Lokal brugertest på `preview:local` før push efter projektets arbejdsgang.
5. Rollback: format 5-filer kan ikke åbnes af ældre apps. Originalen bevares, indtil træneren bevidst gemmer, og den kan eksporteres fra migrationsdialogen.

## Open Questions

- Ingen åbne produktbeslutninger. Eventuelle notifikationer ved nye match og potentialesøgning med faste ambitionspladser kan tages op senere.
