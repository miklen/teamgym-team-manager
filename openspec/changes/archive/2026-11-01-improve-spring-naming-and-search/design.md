# Design

## Context

`apps/web/src/spring-library.ts` har to navnesystemer. `springLibrary` bygger håndskrevne navne, fx "barani (strakt 180°)" og "Rondat – flik – strakt 1/1 (360°)". `springSeriesName` og `springElementName` genererer andre navne, fx "Rondat – flik – helskrue" og "Lukket salto 0° (baglæns)", og de bruges til kortere serier, fundament og Byg selv. Definitionerne gemmes med `name`. Når en definition findes i arbejdsrummet, erstatter dens gemte navn bibliotekets navn. `springDisplayName` retter kun tidligere automatiske trampetnavne, mens banenavne vises, som de er gemt. Omkring ti steder i UI'et viser `definition.name` direkte.

Vælgeren (`spring-picker.tsx`, `spring-picker-model.ts`, `spring-choice-rows.tsx`) viser 297 rækker under DK: 263 på bane, heraf 131 i "Blandede", og 35 på trampet. Søgningen (`springSearchRank`) matcher ordvis i navn, gruppe og aliaser. Fundamentkataloget (`springFoundation`, version 3) består af koderegler med relations-id'er og bruges af registrering og arveafstemning, men kan ikke ses af trænerne.

## Goals / Non-Goals

**Goals:**
- Én navnefunktion for alle spring, som alle visninger og nye definitioner bruger.
- Tidligere automatiske navne vises med det nye navn uden at omskrive filen. Selvvalgte navne bevares.
- Synonym- og strukturbaseret søgning, visuel kædebygger med skjulte sjældne kombinationer og holdets kendte spring først.
- Skrivebeskyttet gennemgang af fundamentkataloget på Reglement-siden.

**Non-Goals:**
- Ændringer af fundamentrelationer, katalogversion, arveregler, identiteter, D eller regelpakker. Fejl fundet ved gennemgangen af kæderne bliver en senere ændring.
- Omskrivning af gemte navne i trænerfiler, nyt filformat eller ny flettepolitik.
- Rytmekatalogets navne og søgning.
- Udvidelse af bibliotekets sæt af serier.

## Decisions

### 1. Ét navnemodul afledt af udførelsen

Et nyt `apps/web/src/spring-names.ts` eksporterer `springName(definition, rulePackage)` og `springElementLabel(element, context)`, som implementerer grammatikken i specifikationen. `springLibrary`, `shorterSeries`, `foundationSteps`, `forwardFoundationSteps`, Byg selv og `registerSpring` bruger det. Bibliotekets håndskrevne navnelister (`backEnds`, `frontEnds` og navnene i `series(...)`) reduceres til referencer og aliaser. `springSeriesName`, `springElementName` og `springElementTechnicalName` fjernes eller bliver tynde omslag om det nye modul.

Den forventede retning beregnes fra det foregående element: Seriestart, kraftspring, flyvespring og forlæns salto giver forlæns. Rondat, flik, whipback og baglæns salto giver baglæns. Trampet forventer forlæns, og Tsukahara forventer baglæns. Kun afvigelser skrives i navnet. `springDirectionText` forbliver den særskilte, fulde retningsangivelse.

*Alternativ:* Tilpasse `springSeriesName` til bibliotekets håndskrevne navne. Det fravælges, fordi to kilder igen vil glide fra hinanden.

### 2. Visning af gemte navne uden filændring

`springDisplayName(definition, rulePackage)` udvides til bane og trampet. Gemt `name` sammenlignes med mængden af kendte automatiske navne for samme udførelse. Sammenligningen er normaliseret som i søgningen: små bogstaver, ens bindestreger/tankestreger, mellemrum og valgfrit gradtegn. Ved match vises `springName`, ellers vises det gemte navn. Mængden består af:
- de nuværende generatorers output, bevaret som en frossen `legacySpringNames(definition)` med den nuværende `springSeriesName`, `springElementName`, de nuværende biblioteksnavne og kaldenavnsvarianterne fra `springDisplayName`
- navneformater fra tidligere versioner af `spring-library.ts` i git-historikken (8 commits), som implementeringen gennemgår og medtager

Alle visninger, herunder `workspace-review.tsx`, `athletes.tsx`, `skill-repertoire.tsx`, `spring.tsx`, `reserves.tsx`, `ambition.tsx` og vælgerens rækker, bruger `springDisplayName`. Når en definition gemmes på ny ved redigering, skrives det fælles navn, medmindre træneren har angivet et eget navn.

*Alternativ:* Migrere filens navne. Det fravælges, fordi det ændrer fælles data, kræver flettehåndtering og strider mod kravet om at bevare filindhold.

### 3. Søgeindeks fra udførelsen og en fast synonymtabel

Hvert valg får et søgeindeks med kanoniske symboler pr. element, fx `rondat`, `flik`, `salto`, `baglæns`, `strakt`, `skrue:2` og `kaldenavn:barani`, samt navn og aliaser. Forespørgslen normaliseres og oversættes gennem en fast synonymtabel til de samme symboler. `1/1`, `hel`, `helskrue` og `360` bliver `skrue:2`. Flerordssynonymer (`rondat flik`, `dobbelt baglæns`) og forkortelser (`rf`, `db`) udvides før matching. Kaldenavne oversættes til både kaldenavn og forlæns og skrue. Rangeringen bevarer de nuværende niveauer: præcist navn, navnets begyndelse, alias, delmatch og løse ord. Et nyt niveau for strukturmatch i elementrækkefølge placeres før løse ord. Et ukendt ord matches fortsat som tekst.

*Alternativ:* Fuzzy-søgning. Det fravælges, fordi den kan matche forkert skrueantal, og kravet forbyder synonymer, der skifter betydning.

### 4. Kædebygger og typiske kombinationer

Brugertesten 1. november viste, at familierækker og en flad række "Begynder med"-chips (24 på bane, heraf 14 med ét spring) gjorde vælgeren mere uoverskuelig. Begge erstattes af en visuel kædebygger i `spring-chain.ts` (model) og `spring-chain.tsx` (visning).

Kæden består af pladser for seriens elementer i rækkefølge og en særskilt plads "Slutter med". Hver plads kan være tom (alle) eller låst til en elementtype, evt. præciseret til en variant. Elementtypen samler varianter: faste elementer (Rondat, Flik, Whipback, Kraftspring, Flyvespring, Vejrmølle) og saltoer efter rotation og kropsposition (fx "Strakt salto" rummer strakt salto, 1/2, 1/1, 1½, 2/1, rudy og randy). Varianten er det præcise element med kontekstnavn, fx "Barani (lukket 180°)" eller "Strakt 1/1 (360°)". En plads kan vælges uden at udfylde de foregående, så "Rondat – flik – … strakt salto" nås med tre klik. Mulige valg på en plads beregnes fra biblioteket under alle øvrige pladsers valg, med antal. Pladserne vises som forbundne noder; den aktive plads åbner en bakke med elementtyper og eventuelle varianter.

Serier uden for listen er en fast, trænergodkendt tabel over det næsten umulige (brugertest 1. november): serier, der starter med en dobbeltsalto, og en baglæns salto direkte efter en forlæns salto. Alt andet er åbent, også rudy-start, barani-start til whipback og skruer direkte efter rondat, kraftspring eller flyvespring. Tabellen gælder kun indbyggede opskrifter; egne serier i arbejdsrummet vises altid. Sådanne serier vises hverken i kæden eller ved søgning og bygges i stedet med Byg selv. Valgte spring og deres fundament vises altid. Tabellen ændrer hverken bibliotek, D, gyldighed eller fundament.

Biblioteket følger de typiske kæder: efter en forlæns startsalto, herunder strakt 1/1 (360°), følger rondat, kraftspring eller flyvespring. Kraftspring og flyvespring har samme afslutninger. Efter rondat følger både flik og whipback. Dobbeltsaltoer findes med de skruer, regelpakken tillader, så de kan præciseres som enkeltsaltoer. Nye opskrifter er skabeloner og gemmes først ved et valg.

På trampet har kæden to pladser: redskab og springtype (enkelt salto, dobbelt salto, overslag, Tsukahara), hvor springtypen kan præciseres til det enkelte spring. Gymnastoverblikkets `skillFamily`-grupper bevares.

### 5. Holdets kendte spring

`springPickerRows` får en afledt `teamCounts: Map<identity, number>`. Den beregnes fra aktive, ikke-arkiverede registreringer hos andre ikke-arkiverede gymnaster med samme `teamId` som målgymnasten eller ambitionens plan. Uden søgetekst sorteres rækkerne således: planlagte, holdkendte og øvrige. Med søgetekst sorteres der efter rang, holdkendskab og den stabile biblioteksrækkefølge. Rækken viser "Kendt af n på holdet". Der vises ingen navne.

### 6. Fundamentkatalog som lokal gennemgangsrapport

Brugertesten viste, at kataloget er et gennemgangsværktøj for den ansvarlige træner og ikke skal vises i appen. Den rene model `foundation-catalog-model.ts` bruger `springLibrary` og `springFoundation(source, rulePackage)` uden arbejdsrum. `npm run report:fundament` skriver `tmp/fundamentkatalog.md` (ikke i Git) med "Hvad giver hvert spring?" som træ med D, relationsnavn og kæde, og "Relationstyper" med forklaring og alle konkrete par. Rapporten skriver aldrig til arbejdsrum eller Drive. Relations-id'er splittes på `:` for at vise kæden. Danske navne og forklaringer ligger i en fast tabel ved komponenten:

| relationId | Dansk navn |
| --- | --- |
| exact-prefix | Kortere begyndelse |
| without-entry-salto | Uden indgangssalto |
| full-twist-positions | Helskrue giver saltoer uden skrue |
| forward-salto-foundation | Forlæns salto i lettere position eller med 180° |
| forward-twist-chain | Forlæns udviklingskæde (randy → rudy) |
| rudy-foundation | Trampet: rudy giver saltoer og barani'er |
| double-540-180 | Dobbelt 540° giver dobbelt 180° |
| double-without-twist | Dobbelt uden skrue |
| double-pike-tuck | Dobbelt hoftebøjet giver dobbelt lukket |
| double-pike-tuck-without-twist | Dobbelt hoftebøjet giver dobbelt lukket uden skrue |

Et ukendt relations-id vises med sit id, så nye relationer ikke forsvinder. 

### 6a. Forløb fra søgning til valg og vurdering

Brugertesten 1. november (sen aften) viste, at filtrene stod langt fra listen, at afkrydsningsfelterne var uklare, og at kæden lignede Byg selv uden at føre videre. Vælgeren er derfor delt i to nummererede trin. "1 Find springet" rummer søgning, kæde og et sammenfoldet "Filtrér på D". "2 Vælg og vurdér sikkerhed" rummer resultatlisten. Over 760 px containerbredde står trinene side om side; smallere vises "Vis N spring ↓", der fører ned til listen.

Hver række har knapperne 1–5. Ét tryk vælger springet med den vurdering, og "Vælg" vælger uden vurdering. Den samme knap bliver til fjern (×), fravælg (×) eller medtag igen (↺), så fokus bevares. Fundament står indrykket under det valgte spring med Arvet n/5, 1–5 og fravælg. "Kun valgte" er erstattet af visningen Valgte ved siden af Resultater. Afkrydsningsfeltet til automatisk fundament er nu en kontakt med forklaring og vises først, når noget er valgt. "Byg det selv" under listen åbner Byg selv. `chainPrefill` lægger kædens sammenhængende, entydige pladser fra første plads ind som start: en eksplicit variant, eller den eneste variant blandt de passende serier.

### 7. Fælles data og fletning

Ændringen er ren visning. `name` bevarer sin nuværende politik som selvstændigt felt. Nye definitioner skriver stadig ét navn, nu fra den fælles grammatik, og ændrer ikke feltets betydning. Kædevalg, tabellen over serier uden for listen, holdtal, synonymindeks og forudfyldningen af Byg selv er afledte og gemmes aldrig. Sikkerhedsknapperne, visningen Valgte og kontakten skriver de samme felter som før. Identitet, rækkefølge, arverelationer, fravalg og D er uændrede. `docs/vedligeholdelse-fletning.md` får et kort afsnit med denne begrundelse. Der kræves ingen ny flettepolitik eller samtidighedstest.

## Risks / Trade-offs

- [Et gammelt automatisk navn genkendes ikke og vises fortsat uensartet] → Den frosne mængde dækker de nuværende generatorer og gennemgås mod git-historikken. En domænetest kører alle nuværende biblioteks- og fundamentnavne gennem `springDisplayName`.
- [Et selvvalgt navn ligner tilfældigt et automatisk navn og bliver "rettet"] → Matchet kræver samme udførelse. Konsekvensen er kun visning, og filen er uændret.
- [Nye navne bryder eksisterende tests og trænernes vaner] → Testforventningerne opdateres. Gamle navne indgår som aliaser i søgningen, så "lukket barani" og "rondat flik helskrue" stadig finder springet.
- [Et atypisk spring findes ikke i listen] → Det bygges én gang med Byg selv og står derefter som egen serie i listen for alle gymnaster.
- [Tabellen er et trænerskøn] → Den er fast, godkendt af brugeren, står i den lokale rapport og påvirker kun visningen.
- [Ydelse ved kædeoversigten] → Den beregnes dovent og memoiseres. Vælgerens indeks bygges én gang pr. bibliotek.

## Migration Plan

Der er ingen datamigrering. Gemte navne vises med det nye navn ved visning, og filerne forbliver uændrede. Ændringen kan rulles tilbage ved at genudrulle den tidligere app.

## Open Questions

- Navnet "barani (lukket 180°)" frem for "lukket barani" er valgt for konsekvensens skyld. "lukket barani" fungerer som alias i søgningen. Formuleringen vurderes ved brugerens lokale test.
- Ved et forlæns startspring uden skrue bliver navnet "Strakt salto – rondat" i stedet for "Strakt – rondat". Dette vurderes også ved den lokale test.

## Verifikation

Følg kontrolniveauerne i AGENTS.md. Domænetests dækker navnegrammatik, genkendelse af gemte navne, synonymer, kædevalg, serier uden for listen, bibliotekets nye kæder, holdtal og fundamentrapportens data. Browserprøver dækker vælgerens kerneforløb, kædebyggeren og overgangen til Byg selv. Visuel kontrol ved 390 og 1440 px, fordi vælgeren ændres væsentligt.
