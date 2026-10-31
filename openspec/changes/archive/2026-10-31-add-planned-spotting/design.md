# Design

## Context

Se `proposal.md` og delta-specifikationerne. En plads i en springomgang (`RoundEntry`) er i dag `{ id, athleteId, athleteSkillId, role }` i et `strictObject`, og den indgår i en atomisk deltagerliste i `merge-policy.ts`. `dk-engine.ts` beregner `originalD` pr. plads. `adjustedD` er holdomgangens afvigelse (0 for afvigere), og `panelD`/`difficulty` summerer de tællendes `adjustedD`. Disciplinens D er gennemsnittet af tre omgange. Rækkefølgekontrollen (trænerens Q06-afklaring) bruger allerede `originalD`. C-HOLD finder afvigere med `adjustedD == 0`. Banens D er de tre højeste unikke elementidentiteter (`topThreeDifficulty`), og trampet er ét element. `replaceAthleteSkill` peger en registrering om til en anden `skillId`, når udførelsen ændres, men pladser beholder registreringens id. Filen er format 3. `validateWorkspace` afviser nyere formater (`newer-schema`) og kræver eksplicit migration af ældre. Drive-sessionen fletter ikke en fil, der kræver migration. Appen har ingen E-model.

Kilder: H 9.3.3/10.3.3 (kraftig trænerhjælp i svæv/landing halverer element-D), A6-07 (trænerstøtte 0,5, hjælp til udførelse 1,0, vurderes separat fra D), A6-08 (ekstra gymnaster får ingen øvrige udførelsesfradrag) og H 9.4/10.4 (omgangens E = 10,0 − fradrag, disciplinens E er gennemsnittet af tre omgange). A6-U05 (tælleenhed ved flere indgreb) undgås ved højst én modtagning pr. plads.

## Goals / Non-Goals

**Goals:**
- Gem en bevidst planlagt modtagning pr. plads med grad og eventuelt element.
- Vis D-konsekvensen i pladsen og omgangen, planlagte E-fradrag pr. omgang og Maks. mulig karakter med modtagningens pris.
- Hold modtagningen ude af C, rækkefølge, identitet og sikkerhed.
- Bevar sikker fletning, migration og ældre apps' afvisning.

**Non-Goals:**
- Ingen model af øvrige E-fradrag, observationer, fald eller overdommerfradrag.
- Ingen modtagning på reserver eller i rytme, og højst én modtagning pr. plads.
- Ingen automatisk anbefaling af modtagning ud fra sikkerhed.

## Decisions

### 1. Datamodel på pladsen

`RoundEntry` får `plannedSpot: null | { grade: 'support' | 'assist' | 'heavy'; skillId: Id; elementIndex: number | null }`. Feltet er påkrævet i format 4, og `null` betyder ingen modtagning. `elementIndex` er kun tilladt og påkrævet ved `heavy` på bane, og det skal ligge inden for den refererede `skillId`'s elementliste. På trampet og ved de øvrige grader er det `null`. `skillId` er det spring, modtagningen blev planlagt for. Modtagningen gælder kun, når registreringens aktuelle `skillId` er lig den gemte.

Validering: `athleteSkillId` skal være ikke-null. `skillId` skal findes og være i pladsens disciplin. Reserver har ikke feltet.

Alternativer: Et felt på `AthleteSkill` blev forkastet, da beslutningen gælder konkurrencepladsen og ikke kunnen. Skillidentitetens kanoniske streng blev forkastet til fordel for `skillId`, fordi `replaceAthleteSkill` allerede skifter `skillId` ved ændret udførelse, og referencen kan valideres.

### 2. Nulstilling som domæneinvariant

`setRoundEntries` er den fælles indgang for pladsændringer. For en indkommende plads med samme id som en eksisterende sætter den `plannedSpot = null`, når `athleteId` eller `athleteSkillId` er ændret. Det dækker manuelle skift, `insertReserve` (som spreder pladsen) og potentialeforslag. `replaceAthleteSkill` fjerner modtagninger på alle pladser i alle planer, som peger på registreringen, når identiteten ændres. Nye kommandoer `setPlannedSpot` og `clearPlannedSpot` validerer grad, element og reference og sætter `skillId` fra registreringen. `duplicateScenario` kopierer feltet via `structuredClone`. `moveRoundFirst` og rækkefølge- og rolleændringer bevarer det.

Afledt gyldighed (gemt `skillId` ≠ registreringens `skillId`) dækker tilfælde, hvor nulstillingen ikke kunne ske i én kommando, typisk ved samtidige ændringer, der flettes. Gyldighedsfunktionen ligger i `packages/domain` og bruges af både regler og UI. Formularer sætter aldrig `null` selv.

### 3. Regellag i `packages/rules`

Satserne bindes til regelpakken via en lille tabel pr. pakke: `{ support: E 0,5, assist: E 1,0, heavy: E 1,0 + elementD/2 }` med kilder. DK 1.0.0 og 1.1.0 deler tabellen. Tilføjelsen ændrer ikke betydningen af eksisterende planer, fordi alle eksisterende pladser migreres til `null`.

I `dk-engine` får pladsevalueringen et nyt felt `spotD`. Det beregnes efter `adjustedD`:
- Hvis `adjustedD` er 0 af afvigelse, eller modtagningen er ugyldig eller ikke `heavy`, er `spotD = adjustedD`.
- På trampet er `spotD = adjustedD / 2`.
- På bane genberegnes `topThreeDifficulty` med det valgte elements værdi halveret, og `difficultyMultiplier` anvendes som for `originalD`. Har det valgte elements identitet en anden, uhalveret forekomst i serien, bliver resultatet `uncertain('unresolved', ['Q-SPOT-DUP'])` med intervallet [halveret, uhalveret] som alternativer. Q-SPOT-DUP registreres som kendt tvivl.

Omgangens `difficulty` summerer `spotD`. `adjustedD` og `originalD` forbliver uændrede, så C-HOLD (`adjustedD == 0`) og rækkefølgen ikke påvirkes. Alternativet, at overskrive `adjustedD`, blev forkastet, fordi det ville blande afvigelse og modtagning sammen.

Pr. omgang tilføjes `plannedExecution: { deduction: NumericDecision; count; ceiling }` med sum over tællende pladser med gyldig modtagning, ekstra = 0, og `ceiling = max(0, 10 − sum)`. På disciplinniveau tilføjes `maximumScore` = C (`composition`, nedre grænse 0) + D + gennemsnit af omgangslofter, og `spotCost` = forskellen til samme beregning med `spotD := adjustedD` og loft 10. Status kombineres fra C, D, omgangsstatus og modtagningsbeslutninger. Ugyldig omgang giver ugyldig værdi. Visning nedrundes med `panelFloor`, mens forskellen beregnes eksakt.

### 4. Flettepolitik

I `merge-policy.ts` får `entry` feltet `plannedSpot: value('Planlagt modtagning')` som én atomisk værdi. Grad, element og `skillId` behandles samlet, og deltagerlisten forbliver atomisk. Konfliktvisningen formaterer værdien som "Kraftig hjælp · <element>" eller "Ingen". `verify:merge-policy` dækker det nye felt strukturelt. Samtidigt ændret spring og modtagning flettes uden konflikt, fordi skill og registrering ligger på andre objekter. Den afledte gyldighed fra beslutning 2 viser modtagningen som nulstillet i forhåndsvisningen. Det dokumenteres i `docs/vedligeholdelse-fletning.md` sammen med fælles data, identiteter, rækkefølge, afhængigheder, afledte værdier og præsentation.

### 5. Format 4 og migration

`CURRENT_SCHEMA_VERSION = 4`. `workspaceV3Schema` bevares til læsning. `migrateWorkspaceV3` tilføjer `plannedSpot: null` til alle pladser uden nye id'er, ur eller tilfældighed, så den er deterministisk. V1 og V2 migreres via V3. `DriveClient` og `WorkspaceSession` behandler version 3 som migration, og dialogteksten bliver formatneutral ("format N → 4"). I gennemgang og fletning migreres en format 3-basis deterministisk, før den sammenlignes med L og R i format 4. En R, der stadig er format 3, migreres ligeledes deterministisk i stedet for at blokere, fordi migrationen er tabsfri. Ældre apps afviser format 4 via den eksisterende `newer-schema`.

### 6. Præsentation

UI'et følger projektets frontend-skill.
- **Pladsen:** En kompakt modtagningskontrol med tekst og grad samt elementvalg ved kraftig hjælp på bane. Egen D og justeret D vises særskilt.
- **Omgangshovedet:** D (heraf modtagning) og en linje med planlagte E-fradrag.
- **Guidens lukkede status og disciplinoverblikket:** Maks. mulig karakter og modtagningens pris.
- Forklaringen nævner forudsætningen om landing med fødderne først og kilderne.
- Reserveindsættelse og potentialeforhåndsvisning viser, hvis en modtagning bortfalder.

## Risks / Trade-offs

- [Atomisk liste giver flere konfliktvalg i samme omgang] → Samme adfærd som i dag for pladsændringer. Modtagningen vises tydeligt i valget.
- [Format 4 kræver, at alle trænere opdaterer appen] → Ældre apps afviser filen uden at overskrive den. Migrationsdialogen informerer.
- [Pointloft kan læses som forventet karakter] → Fast betegnelse "Maks. mulig karakter", forklaring om øvrige fradrag og ingen sandsynlighed.
- [Dublet-element i serie med halvering] → Uafklaret med interval og kendt tvivl i stedet for et gæt.
- [Afledt nulstillet modtagning bliver liggende i data] → Synlig markering med handling til at fjerne eller planlægge igen. Den indgår ikke i beregninger.

## Migration Plan

1. Indfør format 4-schema, migration og validering med tests for format 1–3.
2. Udrul regel- og visningslaget.
3. Lokal brugertest på `preview:local` før push efter projektets arbejdsgang.
4. Rollback: format 4-filer kan ikke åbnes af ældre apps. Originaler bevares, indtil træneren bevidst gemmer, og eksport af original er mulig fra migrationsdialogen.

## Open Questions

- Ingen åbne beslutninger. Q-SPOT-DUP registreres som kendt tvivl og afventer eventuel afklaring.
