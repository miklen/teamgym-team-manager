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
Brugerfladen SHALL have rolige flader, tydelig typografi, konsekvent afstandssystem, højst to skrifttyper og én primær accentfarve. Lister, tabeller, matricer og opdelt arbejdsflade SHALL være den primære informationsstruktur. Appen MUST NOT leveres som en generisk mosaik af dashboardkort eller med en markedsføringshero foran arbejdsfladen. Scenarier og reserver SHALL fremstå som en smuk, moderne, elegant og intuitiv del af appen gennem tydeligt hierarki, præcise afstande, læsbare data og sammenhængende betjening. Scenarielinjen SHALL ligge før disciplinens analyser og omgange. Disciplin, scenarie og omgang SHALL kunne skelnes visuelt uden tre konkurrerende, ens navigationsrækker. Reserver SHALL være en sekundær liste under den relevante omgang med tydelig forskel fra udførende og ekstra gymnaster.

#### Scenario: Planlæggerens første skærm
- **WHEN** træneren åbner et hold med data på computer
- **THEN** er holdkontekst, disciplin, navngivet scenarie, omgange, redigeringshandlinger og vigtigste analyser umiddelbart tilgængelige med et tydeligt visuelt hierarki.

#### Scenario: Visuel kvalitetsgennemgang
- **WHEN** den nye arbejdsflade vurderes før levering
- **THEN** er scenarieskift, navneformular, scenariemenu og reserveoversigt gennemgået visuelt ved 390, 768 og 1440 pixels bredde med lange navne, mindst 12 scenarier samt tomme, fyldte, læse- og fejltilstande; afklipning, konkurrerende hierarki eller utilgængelige handlinger skal rettes før godkendelse.

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

### Requirement: Scenarieskift er lokal navigation med bevaret kladde
Træneren SHALL kunne skifte mellem scenarier direkte fra deres navne. Appen SHALL huske senest viste scenarie separat for arbejdsrum, hold og disciplin, mens den åbne appsession fortsætter. Uden et gyldigt valg efter ny indlæsning SHALL første scenarie vises. Et rent skift MUST NOT ændre fælles data, markere arbejdsrummet som ændret, starte upload eller ændre andre sessioners visning. Allerede anvendte lokale ændringer SHALL bevares. Det viste scenarie MUST NOT betegnes som en officiel aktiveret konkurrenceplan.

#### Scenario: Frem og tilbage mellem discipliner
- **WHEN** træneren åbner bane Plan B, skifter til trampet Sikker og vender tilbage til bane
- **THEN** vises bane Plan B igen med dens lokale ændringer, og trampet Sikker bevares som trampettens visningsvalg i sessionen.

#### Scenario: Gennemsyn uden ændringer
- **WHEN** en træner gennemser tre scenarier i et ellers uændret arbejdsrum
- **THEN** forbliver gemmetilstanden uændret uden Drive-skrivning eller ændring af en anden træners viste scenarie.

### Requirement: Scenariehandlinger har ét tydeligt forløb
Scenarielinjen SHALL tilbyde en synlig Nyt-handling og en menu for det viste scenarie med Duplikér, Omdøb og Slet. Opret, Duplikér og Omdøb SHALL give fokus til navnefeltet og tilbyde tydelig bekræftelse og Annuller; Enter SHALL kunne bekræfte og Escape annullere. Fejl SHALL vises ved navnefeltet med bevaret indtastning. Bekræftede handlinger SHALL give forståelig status og logisk fokus. Sletning af sidste scenarie SHALL forklare begrænsningen. Navngivning MUST NOT kræve, at træneren først opretter en midlertidig plan eller forlader arbejdsfladen.

#### Scenario: Hurtig variation
- **WHEN** træneren vælger Duplikér på Plan A og skriver Plan B i navnefeltet
- **THEN** kan kopien oprettes i samme forløb og åbnes med tydelig valgt-status og en statusmeddelelse.

#### Scenario: Annulleret omdøbning
- **WHEN** træneren ændrer navnet i formularen og trykker Escape
- **THEN** bevares det oprindelige scenarie og navn, og fokus vender tilbage til den relevante udløser.

### Requirement: Mange og lange scenarienavne er tilgængelige
Scenarienavigationen SHALL kunne rumme flere scenarier end skærmens bredde uden vandret overflow af hele siden. Det valgte navn SHALL kunne bringes i syne. Nyt og scenariemenuen SHALL forblive tilgængelige ved lokal rulning af navnene. Afkortede navnes fulde tekst SHALL være tilgængelig uden hover og for hjælpemidler. Når navnene ikke kan rummes, SHALL Alle scenarier tilbyde fulde navne, navnesøgning og valg af et scenarie. Intet match SHALL have en forståelig tomtilstand uden at ændre planen.

#### Scenario: Find et langt navn på mobil
- **WHEN** et hold har 12 banescenarier, herunder navne på 200 tegn, og træneren bruger en 390 pixels bred skærm
- **THEN** kan alle scenarier findes og vælges med deres fulde navne via Alle scenarier, mens Nyt og menuen kan nås uden vandret rulning af hele siden.

### Requirement: Scenarier og reserver kan betjenes tilgængeligt
Scenarienavigation SHALL eksponere valgt-status og forbindelse til det viste indhold for hjælpemidler. Pile og Home/End SHALL flytte fokus mellem scenarier, og Enter/Space SHALL vælge. Reserveprioritet SHALL kunne ændres med navngivne knap- eller tastaturhandlinger uden krav om drag. Centrale touchmål SHALL være mindst 44 × 44 CSS-pixel, og handlinger MUST NOT afhænge af hover. Prioritet, valgt-status, D, sikkerhed og mangler SHALL have forståelig tekst eller tilgængelige betegnelser, ikke farve alene. Ved 200 % zoom SHALL hovedforløbene bevare læsbarhed og adgang til alle handlinger.

#### Scenario: Hele forløbet med tastatur
- **WHEN** træneren opretter en kopi, skifter scenarie, tilføjer en reserve, flytter den op og åbner Sæt ind med tastatur
- **THEN** kan alle handlinger gennemføres med synligt fokus, korrekt navngivne felter og statusmeddelelser og uden brug af mus eller drag.

#### Scenario: Reserve på en smal skærm
- **WHEN** reserveoversigten vises på mobil eller ved 200 % zoom
- **THEN** bevares sammenhængen mellem prioritet, gymnast, spring, D, sikkerhed og Sæt ind, og dialogers bekræftelse og Annuller kan nås uden afklipning.

### Requirement: Scenarieskift beskytter åben formular og beregningskontekst
Ved et forsøg på at forlade en ændret formular for et andet scenarie SHALL træneren kunne Opdatere den lokale kladde, Kassere formularændringer eller Blive. Opdater MUST NOT starte Drive-gemning; en ugyldig formular SHALL forblive åben med fejl. Et skift SHALL lukke eller nulstille gammel plads-, reserve- og forslagskontekst, så handlinger ikke kan ramme et forkert scenarie. Ventende potentialesøgning SHALL have status i den rette scenariekontekst uden at blokere almindelig navigation.

#### Scenario: Bevar en ændret formular
- **WHEN** træneren forsøger at gå fra en ændret formular i Plan A til Plan B og vælger Bliv
- **THEN** forbliver Plan A og formularens indhold synlige uden dataændring eller tab af indtastning.

#### Scenario: Opdater før skift
- **WHEN** træneren vælger Opdater for en gyldig ændret formular før skift til Plan B
- **THEN** opdateres Plan A i den lokale kladde, Plan B vises med egen kontekst, og der startes ingen Drive-upload.

### Requirement: Læsetilstand og manglende regelpakke bevarer overblikket
Læseadgang SHALL tillade gennemsyn og scenarieskift, mens oprettelse, duplikering, omdøbning, sletning, reserveændringer og anvendelse af forslag SHALL være utilgængelige med forståelig kontekst. En manglende regelpakke SHALL bevare scenariernes navne og gemte opstillinger til gennemsyn uden autoritativ beregning eller skjult regelmæssig fallback.

#### Scenario: Læser gennemser alternative planer
- **WHEN** en træner åbner et arbejdsrum med læseadgang
- **THEN** kan alle scenarier og reserver gennemgås, men ingen dataændrende handling kan anvendes.

#### Scenario: Ukendt regelpakke
- **WHEN** holdets præcise regelpakke ikke er installeret
- **THEN** kan scenariernes gemte opstillinger og reserver identificeres og gennemgås med forklaring af manglende beregning uden tab af data.

### Requirement: Bevægelse forbinder scenarie- og reservehandlinger
Scenariemarkering, åbning af navneformular eller menu og ændret reserveprioritet eller indsættelse SHALL have korte, sammenhængende overgange, der hjælper med at følge handlingen. Animationer SHALL kunne afbrydes af næste handling og MUST NOT forsinke betjening. Reduceret bevægelse SHALL fjerne unødvendig animation med bevaret fokus, valgt-status og forståelig ændringsmeddelelse.

#### Scenario: Hurtige skift med reduceret bevægelse
- **WHEN** træneren har aktiveret reduceret bevægelse og skifter hurtigt mellem scenarier og flytter en reserve
- **THEN** følger indhold og markering det seneste valg uden ventetid, gammel animation eller tab af fokus og status.

### Requirement: Nyere fil og faktiske konflikter kan skelnes
Arbejdsfladen SHALL skelne mellem konstateret nyere fil, gennemgang der afventer beregning, forenelige ændringer og faktiske konflikter, som kræver valg. En versionsforskel alene MUST NOT beskrives som bevis for modstridende redigeringer. Gennemgå ændringer SHALL være tilgængelig ved konstateret nyere fil, inklusive efter en afvist gemning, med bevaret adgang til eksport og bevidst genindlæsning. Indlæsning og fejl SHALL have konkret status uden at blokere muligheden for at bevare arbejdet.

#### Scenario: Forenelige ændringer efter afvist gemning
- **WHEN** gemning afvises på en gammel basis, men sammenligningen viser ændringer i uafhængige data
- **THEN** forklarer arbejdsfladen, at der findes en nyere fil, og at ændringerne kan kombineres; den kræver ingen kunstige konfliktvalg.

### Requirement: Ændringsgennemgang i trænerens kontekst
Gennemgangen SHALL vise nettoændringer siden basis med danske betegnelser for hold, gymnast, disciplin, spring, scenarie og omgang, hvor de er relevante. Tilføjet, ændret og fjernet SHALL kunne skelnes uden farve alene. Ved konflikt SHALL udgangspunkt, Min udgave, Filens udgave, begrundelse for eventuel gruppering og aktuelt valg være tilgængelige. Tekniske identiteter MUST NOT være den eneste forklaring, og tekniske revisionsfelter MUST NOT optræde som redigeringskonflikter. En oversigt SHALL angive omfanget af eksterne ændringer og uafgjorte konflikter, så både ændringer og beslutninger kan findes i store arbejdsrum.

#### Scenario: Samme gymnastnavn flere steder
- **WHEN** konflikter berører gymnaster med samme navn eller scenarier med samme navn på forskellige hold
- **THEN** viser hver konflikt tilstrækkelig hold-, disciplin- og registreringskontekst til, at træneren kan skelne dem.

#### Scenario: Fjernet scenarie
- **WHEN** den nyeste fil har fjernet et scenarie, der fandtes i basis
- **THEN** viser gennemgangen det fjernede scenaries navn og kontekst fra basis frem for en tom eller ukendt betegnelse.

### Requirement: Tilgængeligt forløb fra valg til lokal kladde
Gennemgangen SHALL fungere med tastatur, hjælpemidler, mobil, tablet og computer. Valg og uafgjorte konflikter SHALL have tydelige betegnelser, og fokus SHALL håndteres ved åbning, fejl og lukning. Bekræftelsen SHALL hedde Brug disse ændringer og forklare, at visningen opdateres, og at brugeren gemmer på Drive bagefter. Annuller SHALL bevare arbejdet. En åben ændret formular SHALL håndteres med Behold mine ændringer, Kassér formularændringer eller Bliv, før gennemgangen tager sit kladdesnapshot eller anvender et resultat; formularændringer MUST NOT forsvinde eller blive skrevet ind over et nyere resultat fra en gammel formular.

#### Scenario: Konfliktvalg med tastatur på mobilbredde
- **WHEN** træneren gennemgår flere konflikter ved 390 pixels bredde med tastatur
- **THEN** kan udgangspunkt og begge alternativer læses, valg foretages og ændres, uafgjorte konflikter findes, og gennemgangen anvendes eller annulleres uden afklippede handlinger.

#### Scenario: Ændret formular før gennemgang
- **WHEN** træneren åbner gennemgangen med en ændret vurderingsformular
- **THEN** kan formularen opdateres til lokal kladde, kasseres eller beholdes åben; ingen af valgene starter upload, og gennemgangen beregnes kun på den valgte aktuelle kladde.

#### Scenario: Anvendelse efterfulgt af gemning
- **WHEN** træneren anvender et gyldigt resultat med lokale ændringer
- **THEN** lukkes gennemgangen med forståelig status og fokus, kladden vises som ugemt, og Gem på Drive er en særskilt handling.
