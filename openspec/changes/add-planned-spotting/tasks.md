# Tasks

## 1. Datamodel, format 4 og migration

- [x] 1.1 Tilføj `plannedSpot` (`null | { grade, skillId, elementIndex }`) på `RoundEntry` i format 4, behold `workspaceV3Schema` til læsning, og sæt `CURRENT_SCHEMA_VERSION = 4`. Verificér med domænetests, at `validateWorkspace` afviser: modtagning uden spring, ukendt eller anden disciplins `skillId`, `elementIndex` uden for serien, `elementIndex` ved andre grader eller på trampet, modtagning i rytme og felt på reserver.
- [x] 1.2 Implementér deterministisk `migrateWorkspaceV3`, og kæd V1/V2 via V3. Verificér, at id'er, scenarier, reserver og vurderinger bevares, at alle pladser får `null`, og at to migreringer af samme bytes giver identisk resultat.
- [x] 1.3 Opdatér `DriveClient`/`WorkspaceSession`, så format 3 tilbydes eksplicit migration med eksport af original og formatneutral dialogtekst. En format 3-basis eller -fil migreres deterministisk før gennemgang og fletning. Verificér i `tests/drive` migration uden upload, annullering, konflikt efter migration, gennemgang med migreret basis og afvisning af format 5 som nyere.

## 2. Domænekommandoer og nulstilling

- [x] 2.1 Tilføj `setPlannedSpot`/`clearPlannedSpot` med validering, `skillId` fra registreringen og standardelementet sidste element ved kraftig hjælp på bane. Verificér med domænetests.
- [x] 2.2 Håndhæv i `setRoundEntries`, at ændret `athleteId` eller `athleteSkillId` på en eksisterende plads giver `plannedSpot = null`. Verificér for manuelt skift, `insertReserve` og anvendt potentialeforslag, og at rækkefølge, rolle og `moveRoundFirst` bevarer modtagningen.
- [x] 2.3 Lad `replaceAthleteSkill` fjerne modtagninger, der peger på registreringen, i alle planer og scenarier ved ændret identitet. Tilføj den fælles afledte gyldighedsfunktion i `packages/domain`. Verificér begge med tests, også at sikkerhed og note ikke påvirker modtagningen.
- [x] 2.4 Verificér, at `duplicateScenario` kopierer modtagninger, og at ændringer i kopien ikke ændrer originalen.

## 3. Regelberegning

- [x] 3.1 Tilføj regelpakkebundne satser og kilder (A6-07, H 9.3.3/10.3.3) for DK 1.0.0 og 1.1.0 samt kendt tvivl Q-SPOT-DUP i `dk-data.ts` og `docs/reglement/afklaringer.md`. En pakke uden satser giver uafklaret.
- [x] 3.2 Beregn `spotD` efter `adjustedD` i `dk-engine.ts`: trampet D/2, bane genberegnet top tre med halveret element, multiplikator, afvigelse forbliver 0 og dublet-identitet giver uafklaret interval. Summér omgangens D fra `spotD`. Verificér med faste facit, der ikke er hentet fra produktionsreglerne, bl.a. 0,10/0,20/1,40 → 1,00 og 0,20/0,30/0,40/0,50 → 0,95.
- [x] 3.3 Verificér, at rækkefølge (Q06), sorteringsforslag, C-HOLD, Pegasus (Q04), gentagelser (Q03), tillæg og potentialesøgning er uændrede med modtagninger. Det skal blandt andet gælde scenariet 0,60 → 0,80 med halveret sidste, som ikke giver rækkefølgefejl.
- [x] 3.4 Beregn planlagte E-fradrag og loft pr. omgang, hvor ekstra gymnaster giver 0, samt `maximumScore` og `spotCost` pr. disciplin med statuskombination og ugyldig ved ugyldig omgang. Verificér scenariet C 1,20, D 3,60/4,20/4,80 og omgang 3 med kraftig hjælp −0,60 plus let støtte → D 4,00, E-loft 9,50, maks. 14,70 og pris 0,70, samt nedrunding med `panelFloor`.

## 4. Fletning

- [x] 4.1 Klassificér `plannedSpot` som atomisk værdi "Planlagt modtagning" i `merge-policy.ts`, og formatér den på dansk i konfliktvisningen. Verificér med `npm.cmd run verify:merge-policy`.
- [x] 4.2 Test i `tests/domain/workspace-merge.test.ts` i begge fletteretninger: modtagning mod rækkefølgeskift i samme omgang (ét valg), ændringer i forskellige omgange (flettes), to forskellige modtagninger på samme plads (valg), ens ændringer (ingen konflikt) samt modtagning mod `replaceAthleteSkill` på samme registrering. Den sidste skal give en gyldig kandidat med afledt nulstillet modtagning uden D/2 eller E-fradrag.
- [x] 4.3 Opdatér `docs/vedligeholdelse-fletning.md` med fælles data, identiteter, rækkefølge, afhængigheder, afledte værdier, præsentation og testhenvisninger for planlagt modtagning og format 4.

## 5. Brugerflade

- [x] 5.1 Læs `.agents/skills/frontend-skill/SKILL.md`. Implementér pladsens modtagningskontrol med grader, elementvalg ved kraftig hjælp på bane, tekstmarkering og særskilt egen/justeret D. Visningen af nulstillet modtagning skal have en handling til at fjerne den eller planlægge igen. Verificér med e2e-prøver for mus, tastatur, skærmlæsertekst og mobil.
- [x] 5.2 Vis i omgangshovedet D med modtagningens andel og en særskilt linje for planlagte E-fradrag. Ekstra gymnaster vises med "tæller ikke". Verificér med e2e-prøver.
- [x] 5.3 Vis Maks. mulig karakter og modtagningens pris i guidens lukkede status og disciplinoverblikket som et loft med forklaring og kilder samt status for uafklaret og ugyldig. Verificér med e2e-prøver for tom, delvis og fuld plan samt blandet Pegasus-omgang.
- [x] 5.4 Vis bortfald af modtagning i reserveindsættelse og potentialeforhåndsvisning, og verificér med e2e-prøver.
- [x] 5.5 Opdatér `docs/brugsvejledning.md` og `docs/regler-og-katalog.md` med modtagning, grader, Maks. mulig karakter og format 4.

## 6. Samlet verifikation og lokal brugertest

- [x] 6.1 Kør `npm.cmd run check`, `npm.cmd run test:domain`, `npm.cmd run test:drive`, `npm.cmd run build` og `npm.cmd run test:e2e`, og gennemgå diffen for syntetiske data og fravær af tokens.
- [x] 6.2 Start `npm.cmd run preview:local`, og kontrollér, at `http://127.0.0.1:5173/teamgym-team-manager/` åbner. Giv brugeren konkrete testpunkter, herunder migration af en kopi af en format 3-fil, og bed om eksport af kladde før genindlæsning. Lad serveren køre, og afvent udtrykkeligt klarsignal før commit, push eller publicering.
