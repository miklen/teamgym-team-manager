# Proposal

## Why

Registrering og vedligehold af en gymnasts færdigheder kræver i dag for mange efterfølgende handlinger, mens flade springlister skjuler sammenhængene mellem valgte spring og deres fundament. Træneren mangler samtidig springets egen D i Springplan, når et uafklaret bidrag til holdomgangen vises som en streg, og kan derfor ikke sammenligne sværhed og sikkerhed under arbejdet.

## What Changes

- Giv mulighed for sikkerhed 1–5 eller Ikke vurderet og vurderingsdato ved oprettelse af rytmefærdigheder. Brug katalogets navn og konkret variant frem for et navnefelt i standardforløbet.
- Gruppér spring efter indgang, springfamilie, rotation og redskab. Vis valgte spring og deres automatisk medtagne fundament live i en udfoldelig struktur med D og sikkerhed.
- Udvid den eksisterende arv af præcise begyndelser med et afgrænset, versionsmærket katalog over trænerfaglige sammenhænge mellem positioner og skruer. Medtag fundament automatisk, også de aftalte baranivarianter under rudy, med let individuelt fravalg og uden at danne nye serier af løse registreringer.
- Vis hvert fælles fundament én gang under den relevante parent med lavest kendt D. Bevar direkte vurderingers forrang og deterministisk valg ved samme D.
- Gem løbende arv: Ændring af parentens sikkerhed og dato opdaterer børn uden egen vurdering. Et barn kan få egen vurdering eller bevidst genoptage arv. Fravalg og fjernelse skal overleve senere ændringer og genåbning.
- Tilføj minimum-D sammen med søgning og gruppefilter. Valgte spring og deres konsekvenser skal kunne gennemgås uanset filter.
- Gør gymnastens færdighedsoverblik tættere og grupperet, med faste kolonner til spring, D og sikkerhed på desktop samt et læsbart mobilforløb.
- Ensret visningsnavne, aliaser og gradtegn på bane og trampet, herunder Rudy · strakt salto 540°, uden at ændre låste kilder eller færdighedsidentiteter.
- Vis springets egen D ved både omgangspladsen og hver valgmulighed i Springplan. Forklar justeret omgangsbidrag særskilt, også ved ufuldstændig holdomgang eller nulstillet bidrag.
- **BREAKING:** Indfør arbejdsrumsformat 2 til arvekilder og fravalg med eksplicit lokal migration fra format 1. Eksisterende vurderinger bevares som egne; ældre appudgaver må afvise format 2 frem for at miste metadata.

## Capabilities

### New Capabilities

Ingen nye selvstændige capabilities; eksisterende områder udvides.

### Modified Capabilities

- `skill-catalog`: rytmeregistrering, trænerfagligt fundament, grupperet valg og overblik, minimum-D, individuel fravælgelse og konsistente navne.
- `stability-assessment`: vedvarende arv med synligt ophav, egne vurderinger, genoptagelse af arv og øjeblikkelig opdatering af afhængige vurderinger.
- `routine-planning`: sammenlignelige springvalg med egen D og sikkerhed før valg.
- `difficulty-scoring`: egen D synlig uafhængigt af holdomgangens justerede bidrag og fuldstændighed.
- `drive-workspace`: eksplicit migration og valideret lagring af arvekilder og fravalg i format 2 med eksisterende konfliktbeskyttelse.

## Impact

- `packages/domain`: registreringsskema, relationer, arveberegning, kommandoer og migration; fortsat browserkompatibelt uden UI, Google eller Node.
- `apps/web/src`: `spring-library.ts`, `spring-picker.tsx`, `skill-editor.tsx`, `athletes.tsx`, `spring.tsx`, gendannelse og CSS; fælles navngivning og gruppe-/relationskatalog.
- `packages/drive`: læsning, session og gemmegrundlag skal håndtere en migreret kladde uden automatisk upload og uden tab af den indlæste revisionsbasis.
- Domæne-, Drive- og browserprøver udvides med syntetiske små og store repertoirer, uafhængige D-facitcases og rundtur gennem filformatet. Ingen nye runtime-afhængigheder er planlagt.
- Den udgivne DK-regelpakkes algoritmer, værdier, binding og kildebytes ændres ikke. Faglige arverelationer er trænerhjælp, ikke officielle regler eller sandsynligheder.
- Kun planlægningsartefakter oprettes nu. Implementering skal efterfølges af automatiske kontroller og brugerens lokale test før særskilt klarsignal til commit/push/publicering. Eksisterende fælles trænerfiler bruges kun til læsning.
