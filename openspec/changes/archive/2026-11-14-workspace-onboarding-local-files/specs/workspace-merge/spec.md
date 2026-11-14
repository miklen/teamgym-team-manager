# Spec Delta

## MODIFIED Requirements

### Requirement: Trevejssammenligning med en kendt fælles basis
Systemet SHALL sammenligne den indlæste eller senest bekræftet gemte basis, den aktuelle lokale kladde og et konsistent snapshot af den nyeste fil. En lokal kopi af en Drive-fil SHALL kunne bruge den verificerbart bevarede kildebasis fra kopien, men kun ved sammenligning mod præcis den kildefil, den stammer fra. Sammenligning SHALL omfatte hele arbejdsrummet, inklusive lukkede scenarier, reserver og øvrige hold. Sammenligning MUST NOT ændre input, erstatte kladden eller uploade data. Manglende fælles basis, anden arbejdsrumsidentitet, forkert kildefil, ukendt format eller ugyldige data SHALL blokere fletning med en forståelig forklaring og bevaret kladde. Visningen SHALL beskrive nettoændringer siden basis og MUST NOT påstå at vise en komplet historik eller kende forfatteren til hver ændring.

#### Scenario: Ændring uden for den åbne plan
- **WHEN** en anden session ændrer et lukket scenarie eller et andet hold siden den fælles basis
- **THEN** indgår ændringen i gennemgangen med sin kontekst, selv om træneren ikke har åbnet den del af arbejdsrummet.

#### Scenario: Sammenligning afvises uden datatab
- **WHEN** den nyeste fil har en ukendt formatversion eller en anden arbejdsrumsidentitet
- **THEN** kan den ikke flettes, årsagen vises, og den eksisterende kladde og basis bevares til gennemsyn og eksport.

#### Scenario: Lokal kopi mod forkert Drive-fil
- **WHEN** en lokal kopi med bevaret basis fra Drive-fil A vælges til Gennemgå og flet mod Drive-fil B med samme navn
- **THEN** blokeres fletning, begge filer forbliver uændrede, og appen forklarer, at kopien ikke har en kendt fælles basis med B.

## ADDED Requirements

### Requirement: Fletning fra lokal kopi bevarer Drive-beskyttelsen
Når en lokal kopis kendte basis og den præcise Drive-målfil er gyldige, SHALL Gennemgå og flet bruge den fælles flettekontrakt med basis, hele den lokale kladde og målfilens aktuelle snapshot. Alle faktiske konflikter SHALL kræve bevidste valg efter de eksisterende regler. Anvendelse af resultatet SHALL skabe en lokal kladde bundet til målfilens læste version; upload SHALL være en særskilt handling med normal Drive-rettighed, betinget version og kontrol af forældet gennemgang. En afbrudt eller forældet gennemgang MUST NOT overskrive målfilen eller kassere den lokale kildekopi.

#### Scenario: Uafhængige eksperimenter og fælles ændringer
- **WHEN** lokal kopi ændrer et syntetisk holds Plan A, mens Drive-filen ændrer et andet holds gymnastvurdering siden den bevarede basis
- **THEN** kan begge ændringer indgå i en gyldig kladde uden kunstigt konfliktvalg, og ingen upload sker ved selve gennemgangen.

#### Scenario: Samme opstilling ændres forskelligt
- **WHEN** lokal kopi og Drive-fil ændrer den samme omgangs ordnede deltagerliste forskelligt siden fælles basis
- **THEN** kræver gennemgangen ét forklaret valg for den sammenhængende liste, og ingen side vælges automatisk.

#### Scenario: Drive-filen ændres under gennemgangen
- **WHEN** en anden træner gemmer efter at den lokale træner har valgt konflikter, men før resultatet anvendes eller gemmes
- **THEN** bliver gennemgangen forældet eller den betingede upload afvises; den nyere Drive-fil og den lokale kladde bevares.

### Requirement: Kopiens oprindelse er metadata, ikke en fælles trænerbeslutning
Kildehenvisning og bevaret flettebasis for en lokal kopi SHALL holdes adskilt fra arbejdsrummets fælles domænedata. De MUST NOT optræde som gymnast-, hold- eller planændringer, kopieres ind i en ny Drive-fils fælles arbejdsrumsformat eller afgøres af nye formularspecifikke fletteregler. En Gem som-handling, der skifter aktiv fil, SHALL opdatere den aktive filkontekst uden at ændre identiteter, rækkefølge eller afledte sportslige værdier i den gemte kladde.

#### Scenario: Ren kopiering uden sportslig ændring
- **WHEN** en uændret Drive-fil gemmes som lokal kopi og åbnes igen
- **THEN** er hold, gymnaster, scenarier, identiteter og afledte beregninger uændrede, og oprindelsesoplysninger vises ikke som flettekonflikter.
