# Proposal

## Why

Appen behandler i dag enhver nyere Drive-version som en konflikt uden at vise, hvad der er ændret. Træneren skal kunne sammenligne ændringer siden sin indlæste/gemte basis, bevare uafhængige ændringer fra begge sider og træffe forståelige valg ved faktiske konflikter.

## What Changes

- Tilføj Gennemgå ændringer med udgangspunkt, lokal kladde og nyeste Drive-fil samt danske beskrivelser af tilføjelser, ændringer og fjernelser.
- Skeln mellem nyere fil, uafhængige ændringer, ens ændringer og faktiske konflikter. Tilbyd bevidst indlæsning af en samlet lokal kladde uden automatisk upload.
- Lad træneren vælge sin eller filens udgave pr. konflikt. Afhængige ændringer behandles som ét forklaret valg, når særskilte valg ville skabe inkonsistente data.
- Bevar kladden under gennemsyn, annullering og fejl. Bevar eksport og bevidst kassation/indlæsning af nyeste fil.
- Saml sammenligning og fletning i en fælles domænemotor med eksplicitte regler for alle gemte data og fælles præsentation af konflikter.
- Gør vedligeholdelig konflikthåndtering til et permanent acceptkrav for alle fremtidige funktioner: nye data og ændret betydning skal dækkes af regler og relevante tests; funktioner uden betydning for fælles data skal begrunde dette.
- Lad automatiske kontroller afvise manglende dækning af datamodellen. Afhængigheder, afledte værdier, rækkefølger og samtidige handlinger skal også verificeres med adfærdstests.

## Capabilities

### New Capabilities

- `workspace-merge`: Fælles trevejssammenligning, domænebevidst fletning, valg pr. konflikt og en verificerbar udvidelseskontrakt for fremtidige funktioner.

### Modified Capabilities

- `drive-workspace`: Bevidst konflikthåndtering udvides med ikke-destruktiv hentning til sammenligning, anvendelse af fletning på en præcis revisionsbasis og beskyttelse af kladde og gemmeoperationer gennem forløbet.
- `coach-workspace`: Nyere fil og faktiske konflikter vises særskilt, og et tilgængeligt, responsivt forløb viser ændringer og valg i trænerens faglige kontekst.

## Impact

- `packages/domain`: Fælles motor, typedækkende politik for arbejdsrummets datamodel, konfliktbeskrivelser, afhængigheder og validering. Domænelaget forbliver browserkompatibelt og uden Google/UI-afhængigheder.
- `packages/drive/src/workspace-session.ts`: Separat sammenligningssnapshot, afstemning af ukendte uploadresultater, kontrol af forældede gennemgange og overtagelse af ny basis med bevaret lokal kladde.
- `apps/web/src`: Fælles dansk ændrings- og konfliktvisning samt integration med status, åbne formularer, eksport og genindlæsning.
- Tests: Domæneregler, modeldækning, sessionskapløb, fejlhåndtering og centrale brugerforløb med syntetiske data.
- Fremtidig implementering opdaterer `AGENTS.md` og vedligeholdelsesvejledning med det permanente acceptkrav. Denne planlægning ændrer kun ændringens egne artefakter.
- Eksisterende betingede Drive-upload, tokenlagring og statisk drift bevares. Der planlægges ingen backend, vedvarende lagring af gymnastdata, fuld versionshistorik eller automatisk baggrundsfletning. Filformatet ændres kun, hvis implementeringen påviser et konkret behov; sessionsdata om fletning skal ikke gemmes i arbejdsrumsfilen.
