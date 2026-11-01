# Tasks

## 1. Fælles navnegrammatik

- [x] 1.1 Opret `apps/web/src/spring-names.ts` med `springName`/`springElementLabel` efter grammatikken i specifikationen, herunder faste elementer, saltoer uden skrue, kaldenavne med grader, skruebrøk med grader, dobbelt med fordeling, overslag/Tsukahara og retning kun ved afvigelse fra den forventede. Verificér i `tests/domain/spring-library.test.ts` med faste forventede navne for kraft-barani med og uden indgang, rondat-flik-1/1, salto-salto i begge retninger, rudy på bane/trampet, dobbelt lukket 180° med fordeling og en Tsukahara.
- [x] 1.2 Lad `springLibrary`, `shorterSeries`, `foundationSteps`, `forwardFoundationSteps`, Byg selv og `registerSpring` bruge det fælles navn. Reducér de håndskrevne navnelister til referencer og aliaser, og bevar de gamle navne som søgealiaser. Verificér med en domænetest, at alle bibliotekets valg og alle deres fundamentbørn får præcis det navn, `springName` giver for udførelsen.
- [x] 1.3 Udvid `springDisplayName` til bane og trampet med en frossen mængde af tidligere automatiske navne: nuværende generatorer og biblioteksnavne samt navneformater fra git-historikken for `spring-library.ts`. Sammenlign normaliseret og kun for samme udførelse. Verificér, at "Strakt – kraftspring – barani" vises som det fælles navn, at et selvvalgt navn bevares, og at det gemte `name` i arbejdsrummet er uændret.
- [x] 1.4 Send alle visninger af springnavne gennem `springDisplayName`, herunder `workspace-review.tsx`, vælgerrækker, arvekildevalg og øvrige direkte `definition.name`-visninger. Opdatér eksisterende test- og fixtureforventninger til de nye navne, og verificér med de berørte browserprøver.

## 2. Søgning med synonymer og struktur

- [x] 2.1 Byg et søgeindeks pr. valg ud fra udførelsens elementsymboler samt navn og aliaser, og en fast synonymtabel efter specifikationen, inklusive flerordsudtryk og forkortelserne RF og DB. Indfør et niveau for strukturmatch i elementrækkefølge før løse ord. Verificér i `tests/domain/spring-search.test.ts`, at "rf 1/1", "rondat flik hel" og "rondat flik 360" giver samme første match, at "1/1" ikke matcher 1/2 eller 1½, og at "kraft barani", "lukket barani" og "strakt rondat" rangeres som specificeret.

## 3. Vælgerens familier, trin og holdkendskab

- [x] 3.1 Tilføj familiegruppering i vælgermodellen (`spring-picker-model.ts`): Ikke-valgte biblioteksvarianter med fælles begyndelse og afsluttende salto samles ved mindst tre varianter, og én tilbageværende variant vises som almindelig række. Verificér i `tests/domain/spring-picker-model.test.ts` gruppering, filtrering med søgning og minimum-D, udfoldning ved ét match og at valgte rækker aldrig samles.
- [x] 3.2 Tilføj trinvis afgrænsning i modellen: elementnøgler for bane og redskab → springtype for trampet, kun trin med match og antal, samt fortrydelse af enkelte trin. Verificér i samme testfil kombinationen med søgning, minimum-D og bevarede valg.
- [x] 3.3 Tilføj afledte holdtal (andre aktive gymnaster på samme hold, aktive registreringer) og sorteringen planlagte → holdkendte → øvrige uden søgning, samt holdkendskab som tie-breaker med søgning. Brug gymnastens hold ved registrering og planens hold ved ambitioner. Verificér, at andre hold og arkiverede gymnaster ikke tæller.
- [x] 3.4 Opdatér `spring-picker.tsx` og `spring-choice-rows.tsx` efter projektets frontend-skill: trinchips i stedet for springgruppe-dropdown, familierækker med tastaturbetjente afslutningschips med D og fuldt navn i tilgængelighedsteksten, "Kendt af n på holdet" og Søg i alle spring, der også rydder trin. Verificér med browserprøver i `tests/e2e/unified-picker.spec.ts` for valg via familiechip, trin frem og tilbage, holdmarkering og bevarede valg samt visuel kontrol ved 390 og 1440 px.

## 4. Gennemgang af fundamentkataloget

- [x] 4.1 Opret `apps/web/src/foundation-catalog.tsx` som skrivebeskyttet sektion på Reglement-siden med fanerne "Hvad giver et spring?" (søgning, træ med navn, D, relationsnavn, kæde og afklaringsbehov) og "Relationstyper" (dansk navn, forklaring og alle konkrete par, beregnet dovent). Brug `springFoundation` direkte og den danske relationstabel fra designet med id-fallback. Verificér med en domænetest af den afledte trædata for rondat-flik-1/1 og strakt salto–rondat–flik–1/1. Verificér med en browserprøve, at visningen virker i læsetilstand og ikke ændrer kladden.

## 5. Dokumentation, verifikation og lokal brugertest

- [x] 5.1 Tilføj et kort afsnit i `docs/vedligeholdelse-fletning.md`, der begrunder ændringen som ren visning: `name` beholder sin politik, og familier, trin, holdtal, søgeindeks og kædevisning er afledte og gemmes ikke. Opdatér `docs/brugsvejledning.md` med navne, søgning, trin og kædevisningen.
- [x] 5.2 Kør `npm run verify:full`, og ret alle fejl.
- [x] 5.3 Start `npm run preview:local`, kontrollér at `http://127.0.0.1:5173/teamgym-team-manager/` åbner, og giv brugeren konkrete punkter til afprøvning, herunder vurdering af formuleringerne "barani (lukket 180°)" og "Strakt salto – rondat". Lad serveren køre, og afvent udtrykkeligt klarsignal før commit, push eller publicering.

## 6. Revision efter lokal brugertest 1. november

- [x] 6.1 Opret `apps/web/src/spring-chain-model.ts` med elementtype og variant pr. plads, pladsen "Slutter med", valg med antal under de øvrige pladsers valg og den trænergodkendte tabel over sjældne overgange. Fjern familiegruppering og de gamle trinfunktioner fra `spring-picker-model.ts`. Verificér i `tests/domain/spring-chain.test.ts` rondat → flik → strakt salto med varianter, spring frem uden mellemliggende plads, slutter med, alle sjældne regler, skjulte sjældne antal og trampetpladserne.
- [x] 6.2 Erstat trinchips og familierækker i `spring-picker.tsx` og `spring-choice-rows.tsx` med en visuel kædebygger (`spring-chain.tsx`) efter projektets frontend-skill: forbundne noder, aktiv plads med bakke af elementtyper og varianter, "Vis sjældne (n)", rydning pr. plads og fuld tastaturbetjening. Søgning finder også sjældne serier, og valgte spring vises altid. Verificér med browserprøver i `tests/e2e/unified-picker.spec.ts` og visuel kontrol ved 390 og 1440 px.
- [x] 6.3 Fjern fundamentkataloget fra Reglement (`foundation-catalog.tsx`, CSS og browserprøve). Tilføj `npm run report:fundament`, der skriver `tmp/fundamentkatalog.md` ud fra `foundation-catalog-model.ts`. Bevar domænetesten af trædata og relationspar.
- [x] 6.4 Opdatér `docs/brugsvejledning.md`, `docs/vedligeholdelse-fletning.md` og `docs/lokal-test.md` efter behov med kædebyggeren, sjældne kombinationer og rapporten.
- [x] 6.5 Kør `npm run verify:full`, og ret alle fejl.
- [x] 6.6 Opdatér den lokale testudgave på `http://127.0.0.1:5173/teamgym-team-manager/`, og giv brugeren konkrete afprøvningspunkter. Afvent udtrykkeligt klarsignal før commit, push eller publicering.

## 7. Revision efter lokal brugertest 1. november (aften)

- [x] 7.1 Udvid biblioteket: strakt 1/1 (360°) som startsalto med samme efterfølgere som de øvrige startsaltoer, forlæns startsalto → flyvespring med samme afslutninger som kraftspring, startsalto → rondat → whipback, baglæns dobbeltsaltoer med skrue efter flik/whipback og forlæns dobbeltsaltoer med og uden skrue efter kraftspring/flyvespring. Verificér med domænetests af kæderne og deres fundament.
- [x] 7.2 Erstat sjældenhed med en tabel over næsten umulige serier uden for listen (start med dobbeltsalto og baglæns salto direkte efter forlæns salto; alt andet åbent), og anvend kun på indbyggede opskrifter. Fjern sjældne antal fra kædemodellen. Opdatér `tests/domain/spring-chain.test.ts`.
- [x] 7.3 Fjern "Vis sjældne" fra kædebyggeren; serier uden for listen vises hverken i kæden eller ved søgning. Opdatér browserprøven i `tests/e2e/unified-picker.spec.ts`.
- [x] 7.4 Opdatér rapporten og `docs/brugsvejledning.md`, `docs/springbibliotek.md` og `docs/vedligeholdelse-fletning.md`.
- [x] 7.5 Kør `npm run verify:full`, og ret alle fejl.
- [x] 7.6 Opdatér den lokale testudgave, og afvent udtrykkeligt klarsignal før commit, push eller publicering.

## 8. Sammenhængende forløb fra søgning til valg og vurdering

- [x] 8.1 Del `spring-picker.tsx` i trinene "1 Find springet" (søgning, kæde, sammenfoldet D-filter) og "2 Vælg og vurdér sikkerhed" side om side over 760 px containerbredde, med "Vis N spring ↓" på smalle skærme.
- [x] 8.2 Erstat afkrydsningsfelter og sikkerhedsvalg i `spring-choice-rows.tsx` med knapperne 1–5, der vælger og vurderer i ét tryk, samt Vælg/fjern/fravælg/medtag igen. Vis fundament indrykket under det valgte spring med Arvet, 1–5 og fravælg.
- [x] 8.3 Erstat "Kun valgte" med visningen Valgte og afkrydsningsfeltet for automatisk fundament med en forklaret kontakt, der vises, når noget er valgt, også i Byg selv.
- [x] 8.4 Tilføj "Byg det selv" under listen og `chainPrefill` i `spring-chain-model.ts`, der lægger kædens sammenhængende, entydige valg ind som start. Verificér med en domænetest i `tests/domain/spring-chain.test.ts` og en browserprøve i `tests/e2e/unified-picker.spec.ts`.
- [x] 8.5 Opdatér browserprøverne til det nye forløb med fælles hjælpere i `tests/e2e/picker.ts`, og kontrollér visuelt ved 390 og 1440 px.
- [x] 8.6 Opdatér `docs/brugsvejledning.md` og `docs/vedligeholdelse-fletning.md`.
- [x] 8.7 Kør `npm run verify:full`, og ret alle fejl.
- [x] 8.8 Opdatér den lokale testudgave, og afvent udtrykkeligt klarsignal før commit, push eller publicering.
