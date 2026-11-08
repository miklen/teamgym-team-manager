# Design

## Context

Se [proposal.md](proposal.md). Grundlaget er `main` på `afb7e54` med den arkiverede ændring `2026-11-01-improve-spring-naming-and-search`. Gymnastens `SpringPicker` har allerede søgning via `spring-search.ts`, et visuelt kædefilter (`SpringChain`), D-filter, resultatrækker med vurdering og én `Byg det selv`-handling under listen. `chainPrefill` kan føre en sammenhængende, entydig kædebegyndelse over i Byg selv. De nye navne kommer fra `spring-names.ts`, og holdets kendte spring prioriteres allerede. Disse funktioner skal bevares. Ambitionens `PlanSkillSelect` har derimod kun en tekstfiltreret katalogliste uden kædefilter eller D-filter. `SkillEditor` viser fortsat Byg selv som en særskilt, nummereret elementliste. `addAmbition` genbruger eller opretter en definition atomisk, men opretter én plads. Forbindelsesvurderingen accepterer personlige bekræftelser; en ambition har ingen gymnastregistrering. Arbejdsrummet er format 5, og omgangens deltagerliste flettes atomisk.

## Goals / Non-Goals

**Goals:** Bevare gymnastens nuværende filtre og resultatliste; give ambitioner samme præcise katalog, søgerangering og kæde-/D-filtrering med en kontekst uden gymnast; lade en resultatløs, samlet filtrering føre videre til Byg selv med kun præcist valgte kædeelementer; forbedre den eksisterende bygger og forbindelsesstatus; indføre fælles godkendelse af præcise kæder og samlet oprettelse af et valgt antal ambitionspladser.

**Non-Goals:** Ingen automatisk gymnastkunnen eller sikkerhedsvurdering, ingen udledning af en kæde fra løs søgetekst, ingen ændring af de officielle kildefilers bytes eller reglementets elementværdier, ingen automatisk overskrivning af eksisterende pladser.

## Decisions

### Bevar den nuværende vælger og del dens valggrundlag

Genbrug den eksisterende `spring-search.ts`, `spring-chain-model.ts`, `SpringChain`, `springPickerRowRank` og evaluering med regelpakken i begge kontekster. Gymnastens vælger og dens to trin, sikkerhedsknapper, fundament, Valgte-visning, søgning, kædefilter og D-filter forbliver udgangspunktet. Ambitionens valg får den samme findeflade og resultatorden, men viser Ingen gymnast og forbindelsesstatus i stedet for personlig sikkerhed og fundament. Det valgte spring bevares synligt, når filtrene ændres. De to kontekster deler rene filter-/sorteringsregler og præcise definitioner, men har forskellige valg- og gemmehandlinger. `PlanSkillSelect` til gymnastens allerede registrerede spring og andre eksisterende planforløb ændres ikke uden grund.

Ingen resultatrække får en Byg videre-knap. `SpringChain` tilbyder i dag kun kædevalg, der stadig matcher et katalogspring. Derfor udløses tomtilstanden af de samlede filtre, for eksempel et kædevalg kombineret med søgetekst eller minimum-D. Når resultatet er tomt og kæden har en præcis, entydig begyndelse, erstattes det nuværende `Byg det selv`-link under listen af én Byg videre-handling. Den åbner Byg selv med `chainPrefill` fra kædens sammenhængende begyndelse. Søgetekst og D-filter bliver aldrig selv til elementer. Hvis kædevalget endnu ikke bestemmer et præcist første element, forklarer tomtilstanden, at træneren skal præcisere en variant eller starte fra bunden; appen gætter ikke. Den nuværende enkeltstående vej til Byg selv bevares ved almindelige resultater og starter tomt, når ingen kædebegyndelse er valgt. Annullering forkaster byggekladden. Ved gemning genbruges en aktiv definition med samme præcise identitet; kun en ny identitet får en ny definition.

### Den visuelle springkæde

Videreudvikl `SkillEditor` i stedet for at lægge en ekstra bygger oven på vælgeren. Byggerens primære flade viser elementer i udførelsesrækkefølge, tydelig forbindelse og én tilføj-handling. Valgt element åbner variantkontroller og det søgbare basiskatalog i samme arbejdsflade. D og forbindelsesstatus er synlige ved kæden; kilde- og mellemregningsdetaljer kan udfoldes. På mobil stables elementerne lodret med samme rækkefølge og handlinger. Brug appens Manrope, rolige flader og blå accent; få målrettede overgange viser indsættelse, variantændring og statusændring, mens reduceret bevægelse fjerner animationerne. Kædefilteret i springvælgeren forbliver et filter; den redigerbare kæde i Byg selv er et andet trin med et andet formål.

### Praktisk forbindelsesviden og godkendelse

Et versionsmærket praktisk forbindelseskatalog klassificerer overgange som kendt, kendt problematisk eller ikke verificeret og giver konkret forklaring. Forlæns salto i de tre positioner → vejrmølle er kendt; baglæns salto → vejrmølle er kendt problematisk. Andre ikke dækkede kæder forbliver ikke verificerede. Kataloget ændrer ikke officielle elementværdier. En advarsel er ikke en stopregel; træneren kan bekræfte den præcise komplette kæde.

Gem en nullable, fælles forbindelsesgodkendelse på banedefinitionen med godkendt udførelsesidentitet, tidspunkt og kort begrundelse. Godkendelsen er en selvstændig, atomisk beslutning i den fælles flettepolitik og valideres mod definitionens aktuelle præcise identitet. `skillIdentity` skal fortsat beregnes af elementer og overgange uden godkendelsesfeltet, så godkendelsen hverken ændrer springidentiteten eller refererer til sig selv. Den knyttes til den definition, som identitetsgenbrug returnerer; ingen gymnastregistrering kopieres. En ændret udførelse kræver ny godkendelse. Den nuværende personlige `connectionConfirmation` bevares på gamle og nye gymnastregistreringer som historisk/personlig evidens, men er ikke længere nødvendig for at genbruge en fælles godkendt kæde. Vurderingen af en gymnast kræver stadig en aktiv registrering af netop springet.

Regelpakkerne beregner fortsat elementernes værdi og forbud. Den fælles godkendelse anvendes kun på forbindelseslaget i evaluering af ambition og gymnast, så en kendt D fra tilladte elementer kan tælle fuldt. En ikke tilladt eller ukendt elementværdi kan ikke ophæves af godkendelsen. Hvis en frigiven regelpakkes interface ikke kan modtage den fælles godkendelse uden at ændre dens fingeraftryk, laves en tydelig adapter i evalueringen, som kun leverer forbindelsesbekræftelsen som input; de frigivne tal og algoritmer ændres ikke.

### Samlet antalvalg er én domæneændring

En domænekommando tager scenarie, omgang, rolle, præcis definition og antal. Den validerer hele resultatet mod holdprofilens grænser og ekstra-først, genbruger/opretter definitionen én gang og tilføjer hvert nyt plads-id fortløbende i valgt blokrækkefølge. Enten returneres et fuldt valideret nyt arbejdsrum, eller også forbliver kladden uændret. En enkelt plads kan fortsat oprettes som før. Ved redigering af en eksisterende ambition ændres kun den konkrete plads; antalhandlingen overskriver aldrig eksisterende pladser.

### Fælles data, identiteter og fletning

Springets strukturerede identitet, elementrækkefølge og overgangstekst bevares som nu. Den nye godkendelse er fælles data på banedefinitionen, ikke på omgangspladsen; ændret navn alene ændrer ikke godkendt udførelse. Format 6 migrerer format 5 deterministisk med `null` godkendelse uden nye id'er eller tidsstempler. Den eksisterende eksplicitte migrationsdialog udvides til format 6: originalen kan eksporteres, opgradering sker først efter trænerens valg i en lokal kladde, og Drive-originalen ændres først ved særskilt gemning. En ældre fil kan ikke blot åbnes videre som før, fordi et nyt gemt felt kræver et nyt format; dialogen skal forklare dette konkret frem for en løs fejlbesked. Nye pladser får egne id'er, men peger på samme definition; antal og valgtilstand gemmes ikke særskilt. D, visningsnavn, forbindelsesstatus og Kan nu afledes ved læsning og efter fletning.

Flettepolitikken klassificerer godkendelsen eksplicit som atomisk under den enkelte banedefinition. Uafhængig note/navneændring kan flettes med godkendelse; ændret udførelse mod godkendelse kræver valideret konfliktvalg og må ikke føre godkendelsen over på en anden identitet. Identiske samtidige godkendelser kræver idempotent afstemning, så tidsstempel eller begrundelse ikke giver falsk dublet. Antaloprettelse ændrer den eksisterende atomiske, ordnede deltagerliste: forskellige samtidige ændringer i samme omgang kræver ét valg; ændringer i forskellige omgange kan flettes. Samme nye definition fra to sider håndteres af den eksisterende identitetsafstemning, udvidet til den fælles godkendelse.

## Risks / Trade-offs

- **Trænergodkendelse forveksles med regelgodkendelse** → Vis forbindelsens ophav og elementernes særskilte reglementsmæssige status; tillad ikke at en godkendelse ændrer forbudte/ukendte elementværdier.
- **En redigeret kæde arver gammel godkendelse** → Bind godkendelsen til præcis udførelsesidentitet og valider referencen ved kommando, migration og fletning.
- **Flere samtidige pladser eller samme nye definition giver tab** → Brug én atomisk domænekommando, eksplicit flettepolitik og tests i begge fletteretninger.
- **Et filtervalg er ikke præcist nok til at bygge** → Overfør kun entydige, sammenhængende elementer; bed om variantvalg eller tilbyd tom start i stedet for at gætte.
- **To kæder forveksles** → Kæden i vælgeren filtrerer eksisterende spring; kæden i Byg selv redigerer en ny definition. Vis én fortsæt-handling i tomtilstanden og ingen pr. række.
- **En stor kæde fylder på mobil** → Lodret rækkefølge, fokuseret variantpanel, faste trykflader og kontrol af overflow og tastaturbetjening.

## Migration Plan

Tilføj format 6-migration og læsning af format 1–5 gennem den eksisterende migrationskæde. Ældre godkendelser på gymnastregistreringer bevares uændret og opgraderes ikke stiltiende til fælles godkendelser. Test eksport af uændrede originalbytes, annullering med en åben kladde, lokal opgradering uden upload, genåbning, gemning og trevejsfletning før lokal preview. Følg `verify` under udvikling og `verify:full` én gang før lokal brugertest som beskrevet i `AGENTS.md`. Implementering og automatiske kontroller efterfølges af brugerens lokale test på `http://127.0.0.1:5173/teamgym-team-manager/`; commit, push og publicering afventer udtrykkeligt klarsignal.
