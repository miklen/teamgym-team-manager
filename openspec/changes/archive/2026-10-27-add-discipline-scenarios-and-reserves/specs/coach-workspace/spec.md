# Spec Delta

## MODIFIED Requirements

### Requirement: Visuelt design efter projektets frontend-skill
Brugerfladen SHALL have rolige flader, tydelig typografi, konsekvent afstandssystem, højst to skrifttyper og én primær accentfarve. Lister, tabeller, matricer og opdelt arbejdsflade SHALL være den primære informationsstruktur. Appen MUST NOT leveres som en generisk mosaik af dashboardkort eller med en markedsføringshero foran arbejdsfladen. Scenarier og reserver SHALL fremstå som en smuk, moderne, elegant og intuitiv del af appen gennem tydeligt hierarki, præcise afstande, læsbare data og sammenhængende betjening. Scenarielinjen SHALL ligge før disciplinens analyser og omgange. Disciplin, scenarie og omgang SHALL kunne skelnes visuelt uden tre konkurrerende, ens navigationsrækker. Reserver SHALL være en sekundær liste under den relevante omgang med tydelig forskel fra udførende og ekstra gymnaster.

#### Scenario: Planlæggerens første skærm
- **WHEN** træneren åbner et hold med data på computer
- **THEN** er holdkontekst, disciplin, navngivet scenarie, omgange, redigeringshandlinger og vigtigste analyser umiddelbart tilgængelige med et tydeligt visuelt hierarki.

#### Scenario: Visuel kvalitetsgennemgang
- **WHEN** den nye arbejdsflade vurderes før levering
- **THEN** er scenarieskift, navneformular, scenariemenu og reserveoversigt gennemgået visuelt ved 390, 768 og 1440 pixels bredde med lange navne, mindst 12 scenarier samt tomme, fyldte, læse- og fejltilstande; afklipning, konkurrerende hierarki eller utilgængelige handlinger skal rettes før godkendelse.

## ADDED Requirements

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
