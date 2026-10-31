## 1. Datamodel og format 5

- [x] 1.1 Tilføj `plannedSkillId: Id | null` og gør `athleteId` valgfri (`Id | null`) på `RoundEntry` i `packages/domain/src/schema.ts`; bevar `workspaceV4Schema` til læsning, og hæv `CURRENT_SCHEMA_VERSION` til 5
- [x] 1.2 Valider invarianterne: gymnast ⇔ intet planlagt spring, ambition uden registrering og modtagning, `plannedSkillId` med kendt reference i pladsens disciplin, og reserver altid med gymnast
- [x] 1.3 Implementér deterministisk `migrateWorkspaceV4` med `plannedSkillId: null`, og led format 1–3 gennem kæden i `migrateWorkspace`
- [x] 1.4 Medtag `plannedSkillId` i `planReferences()` og relevante diagnoser
- [x] 1.5 Domænetests: validering, afvisning af ugyldige ambitioner, migration fra format 1–4 med bevarede id'er og afvisning af format 6 som nyere

## 2. Domænekommandoer

- [x] 2.1 Udvid `RoundEntryInput` og `setRoundEntries` til ambitioner (validering, `retained`, unikhed kun for pladser med gymnast, `plannedSpot = null`)
- [x] 2.2 Tilføj en injicerbar identitetsfunktion i kommandomiljøet efter mønstret fra arvekonteksten
- [x] 2.3 Implementér `addAmbition` med genbrug eller oprettelse af definition ud fra identitet i én ændring
- [x] 2.4 Implementér `changeAmbitionSkill` for en ubesat ambition
- [x] 2.5 Implementér `fillAmbition` med matchkontrol (aktiv gymnast på holdet, ikke i omgangen, aktiv registrering med samme identitet), der bevarer plads-id, rolle og position
- [x] 2.6 Få `insertReserve` og `setPlannedSpot` til at afvise ambitioner, og bekræft at `duplicateScenario` og `moveRoundFirst` bevarer ambitioner
- [x] 2.7 Domænetests for alle kommandoer, herunder besæt og fjern, ugyldigt match, grænser, duplikering og ingen omdannelse af en besat plads

## 3. Regler og analyse

- [x] 3.1 Tilføj `ambitionCandidates` og afledt *kan nu* i `packages/rules` med samme anvendelighedsfilter som springdialogen
- [x] 3.2 Evaluér ambitioner i `dk-engine.evaluateEntry` med diagnosen `athlete-missing`, kendt D, identitet og C-berettigelse, samt uafklaret D ved personlig forbindelsesbekræftelse
- [x] 3.3 Gør `compositionReady` og mixkravet afhængige af en *opnåelig* fordeling på besatte pladser, og bevar en allerede brudt fordeling som ugyldig
- [x] 3.4 Håndtér `sameAthletes` i den uafklarede gentagelsesregel med begge udfald og et ufuldstændigt resultat med alternativer ved forskel
- [x] 3.5 Lad `roundStability` tælle ambitioner som ikke udfyldte pladser
- [x] 3.6 Få `potential.ts` til ikke at udskifte omgange med ambitioner, og vis forklaring, når forslag udelukkes
- [x] 3.7 Regeltests med faste, håndberegnede facit (ikke genereret fra produktionsreglerne): D med ambitioner, holdomgangsafvigelse, tillæg, mix, gentagelse, sikkerhed og forslag

## 4. Fletning og Drive

- [x] 4.1 Tilføj `plannedSkillId: value('Planlagt spring')` i `merge-policy.ts`, og bekræft at dækningskontrollen er grøn
- [x] 4.2 Formatér ambitioner i konfliktvisningen som "Ambition · <springnavn> · mangler gymnast"
- [x] 4.3 Samtidighedstests i begge fletteretninger: samme ambition besat forskelligt, spring ændret mens pladsen besættes, besættelse og reserve med samme gymnast, samme spring defineret på to sider og arkiveret definition
- [x] 4.4 Medtag version 4 i migrationsgrenen i `packages/drive` (`client.ts` og session), migrér en format 4-basis og R deterministisk før fletning, og ret dialogteksten til format 5
- [x] 4.5 Drive-tests for migration, annullering, eksport af original og gennemgang med migreret basis
- [x] 4.6 Opdatér `docs/vedligeholdelse-fletning.md` med ambitionernes fælles data, identiteter, rækkefølge, afhængigheder, afledte værdier og præsentation

## 5. Brugerflade (frontend-skill)

- [x] 5.1 Læs `.agents/skills/frontend-skill/SKILL.md`, og følg den for al UI i denne ændring
- [x] 5.2 Tilføj Ingen gymnast endnu i Tilføj plads-dialogen (`spring.tsx`) som et elegant, tydeligt valg, der skifter springvælgeren til disciplinens katalog med Ingen gymnast i stedet for sikkerhed
- [x] 5.3 Lav ambitionspladsen i omgangen med samme geometri som en besat plads, et let "ghost"-udtryk, tekstchips for Mangler gymnast og *N kan nu* eller Ingen kan endnu og et tilgængeligt navn
- [x] 5.4 Byg besættelsesvisningen med fastlåst spring og grupperne Kan springet (med sikkerhed) og Kan ikke endnu (deaktiveret med genvejen Åbn gymnastens færdigheder), og en rolig overgang, der respekterer `prefers-reduced-motion`
- [x] 5.5 Fjern Ingen gymnast endnu ved redigering af en besat plads, udelad ambitioner som mål for Sæt ind, og vis ingen modtagningskontrol på ambitioner
- [x] 5.6 Vis Mangler gymnast i omgangens status og guide, forklaringen på udelukkede potentialeforslag og mixstatus, der afhænger af ubesatte pladser
- [x] 5.7 Kontrollér mobil og desktop uden vandret overflow, fuld tastaturbetjening, fokus efter Opdater og at status ikke formidles alene med farve

## 6. Verifikation og lokal test

- [x] 6.1 E2e med syntetiske data: opret ambition, se D og C, registrér springet på en gymnast, se *kan nu* stige, besæt, fjern og duplikér
- [x] 6.2 Kør `npm run check`, `npm run test:domain`, `npm run test:drive`, `npm run build` og `npm run test:e2e` (e2e: 163 bestået; 4 prøver i `drive-links.spec.ts` og tastaturprøven i `scenarios.spec.ts` fejler identisk på uændret basis)
- [x] 6.3 Start `npm.cmd run preview:local` på `http://127.0.0.1:5173/teamgym-team-manager/`, og giv brugeren adresse og testvejledning. Vent på brugerens lokale test og udtrykkelige klarsignal før commit, push eller publicering.
