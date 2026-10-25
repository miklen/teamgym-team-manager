# coach-workspace Specification

## Purpose

Samler hele trænerens arbejdsgang i en gennemarbejdet dansk webapp, hvor informationstæthed, læsbarhed, betjening og visuel kvalitet understøtter planlægningen.

## Requirements

### Requirement: Hele produktet hostes statisk på GitHub Pages
Appen SHALL leveres som statiske filer på GitHub Pages under `/teamgym-team-manager/`, bygget og publiceret med GitHub Actions efter relevante checks. Driften MUST NOT afhænge af backend, Functions, Workers, Apps Script, tokenproxy eller separat database. Node må kun være udviklings-/byggeværktøj. Assets og hash-ruter SHALL fungere på repo-stien, også ved direkte åbning og genindlæsning. Google-brugertokens og client secrets MUST NOT indgå i det publicerede build.

#### Scenario: Åbn et delt holdlink
- **WHEN** træneren åbner eller genindlæser et dybt hash-link under produktets GitHub Pages-reposti
- **THEN** indlæses app, assets og den relevante arbejdsflade uden server-rewrites eller 404, og data kræver fortsat personlig Google-adgang.

#### Scenario: Udgivelse fra et rent checkout
- **WHEN** den godkendte Actions-pipeline bygger og deployer produktet til Pages
- **THEN** er det statiske output tilstrækkeligt til drift, og ingen API-server eller serverhemmelighed skal konfigureres.

### Requirement: Sammenhængende dansk arbejdsflade
Appen SHALL have tydelig navigation mellem arbejdsrum, gymnastkartotek, hold, springopstilling og rytmeoverblik. Aktuelt hold, reglement/version og gemmetilstand SHALL være synlige i relevant kontekst. Produktnavnet SHALL være TeamGym Team Manager, og brugerrettet tekst SHALL være dansk med danske talvisninger.

#### Scenario: Skift mellem hold
- **WHEN** træneren skifter fra hold A's springopstilling til hold B's rytmeoverblik
- **THEN** viser konteksten det nye hold og dets egen regelprofil uden at genbruge det gamle holds resultater.

### Requirement: Visuelt design efter projektets frontend-skill
Brugerfladen SHALL have rolige flader, tydelig typografi, konsekvent afstandssystem, højst to skrifttyper og én primær accentfarve. Lister, tabeller, matricer og opdelt arbejdsflade SHALL være den primære informationsstruktur. Appen MUST NOT leveres som en generisk mosaik af dashboardkort eller med en markedsføringshero foran arbejdsfladen.

#### Scenario: Planlæggerens første skærm
- **WHEN** træneren åbner et hold med data på computer
- **THEN** er holdkontekst, disciplin/omgange, redigeringshandlinger og vigtigste analyser umiddelbart tilgængelige med et tydeligt visuelt hierarki.

### Requirement: Arbejdet kan udføres på computer, tablet og mobil
Alle centrale arbejdsgange SHALL fungere ved relevante computer-, tablet- og mobilbredder uden skjulte handlinger eller ulæselige kontrolfelter. Brede matricer SHALL have en bevidst mindre-skærmsvisning med bevaret gymnast-/momentkontekst. Berøringshandlinger MUST NOT afhænge af hover.

#### Scenario: Rytmematrix på tablet
- **WHEN** en træner bruger rytmematricen på en tablet i portrætformat
- **THEN** kan vedkommende se hvilken gymnast og hvilket moment en celle tilhører, filtrere og redigere uden at miste konteksten.

### Requirement: Tilgængelig betjening
Navigation, formularer, vurderingsskala, valg af spring, dialoger og omarrangering SHALL kunne bruges med tastatur. Fokus, feltnavne, fejl og statusbeskeder SHALL være tilgængelige for hjælpemidler. Betydning MUST NOT kommunikeres med farve alene. Tekstkontrast, zoom og reduceret bevægelse SHALL respekteres.

#### Scenario: Flyt gymnast uden træk
- **WHEN** træneren bruger tastatur til at ændre rækkefølge
- **THEN** kan alle flytninger udføres med navngivne handlinger og tydeligt fokus, og den nye rækkefølge meddeles.

#### Scenario: Lav stabilitet uden farvesyn
- **WHEN** en vurdering er 1 eller 2
- **THEN** vises både tal og forståelig tekst/status, så farve ikke er nødvendig for at se risikoen.

### Requirement: Tilstande er en del af designet
Appen SHALL have gennemarbejdede tom-, indlæsnings-, fejl-, læse-, konflikt- og ufuldstændige tilstande med konkrete næste handlinger. Ugemt arbejde SHALL beskyttes ved navigation, fil-/kontoskift og lukning, hvor browseren tillader det. Systemet MUST NOT vise »gemt«, før gemningen er bekræftet eller genkendt som gennemført.

Ved opstart SHALL en særskilt indlæsningsvisning dække læsning af husket forbindelse, kontokontrol og automatisk hentning af arbejdsrummet. Startside og forbind-/filvalgsknapper MUST NOT vises kortvarigt eller kunne aktiveres, mens disse trin afventer svar. Den brugerstartede forbindelseshandling SHALL hedde »Forbind til Google Drive«. Udløbet adgang eller en fejlet filåbning SHALL afslutte indlæsningen og vise relevante næste handlinger.

#### Scenario: Langsom genåbning med gyldig forbindelse
- **WHEN** Google-kontokontrollen og filhentningen svarer langsomt ved genåbning af et husket arbejdsrum eller et dybt link
- **THEN** vises kun indlæsningsstatus frem til arbejdsfladen er klar; der kommer intet glimt af startside/forbind-knap, og ingen ny OAuth-anmodning startes automatisk.

#### Scenario: Tomt gymnastkartotek
- **WHEN** et nyt arbejdsrum åbnes
- **THEN** forklares kort, hvordan en gymnast og et hold oprettes, og der vises ingen falske persondata eller færdige analyser.

### Requirement: Forklaringer kan åbnes uden at overbelaste oversigten
Træneren SHALL kunne åbne detaljer for sværhed, komposition og stabilitet tæt på de relevante valg og komme tilbage med bevaret redigeringskontekst. Den primære oversigt SHALL vise de vigtigste tal og mangler uden gentagne lange reglementstekster.

#### Scenario: Undersøg et fradrag
- **WHEN** træneren vælger et kompositionsfradrag
- **THEN** vises beløb, regelhenvisning og berørte gymnaster/omgange, og ved lukning bevares det aktuelle arbejde og fokus.

### Requirement: Bevægelse understøtter handlinger
Overgange mellem arbejdsflader, inspektøråbning og omarrangering SHALL være korte og sammenhængende og SHALL hjælpe med at følge ændringer. Ved reduceret bevægelse SHALL unødvendig animation fjernes uden tab af funktion.

#### Scenario: Reduceret bevægelse
- **WHEN** en bruger har aktiveret reduceret bevægelse
- **THEN** kan vedkommende fortsat se resultatet af flytninger og åbne detaljer, mens flytte-/indgangsanimationer er reduceret eller fjernet.

### Requirement: Komplet første leverance
Før leverancen kan betegnes som færdig SHALL én sammenhængende arbejdsgang dække Google-adgang, fælles fil, flere hold, kartotek, strukturerede færdigheder, stabilitet, seks omgange, D, C, potentiale og rytmefællesnævnere. Funktioner MUST NOT være erstattet af døde knapper, demonstrationsdata eller en »kommer senere«-markering. REG/Liga-pakkernes senere tilføjelse er den udtrykkeligt aftalte udvidelse, ikke en grund til at udskyde de øvrige funktioner.

#### Scenario: Trænerens fulde arbejdsgang
- **WHEN** træneren opretter et arbejdsrum og flere hold, registrerer gymnaster og færdigheder, sammensætter alle seks omgange, undersøger C/D/stabilitet og rytmefællesnævnere og gemmer
- **THEN** kan en anden autoriseret træner genåbne de samme data og fortsætte arbejdet med alle funktioner tilgængelige.
