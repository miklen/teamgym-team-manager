# Spec Delta

## Purpose

Giver gymnaster og trænere en selvstændig, delbar og printvenlig PDF af ét valgt springscenarie, så den planlagte rækkefølge og de valgte spring kan bruges uden adgang til appen.

## ADDED Requirements

### Requirement: Det valgte scenarie downloades som et øjebliksbillede

Springplanen SHALL tilbyde en synlig knap med teksten Download som PDF for det aktuelt valgte hold, den aktuelt valgte disciplin og det aktuelt valgte scenarie. PDF'en SHALL indeholde netop dette scenaries tre omgange i deres aktuelle konkurrenceorden, med første omgang betegnet Holdomgang. Download SHALL virke i både læse- og skrivetilstand, tage udgangspunkt i den aktuelt viste arbejdsrumskladde og give filen et forståeligt navn med hold, disciplin og scenarie. Den MUST NOT ændre arbejdsrummet, gemme kladden, sende data til Drive eller medtage andre scenarier.

#### Scenario: Vælg mellem alternative planer

- **WHEN** træneren vælger banescenariet Plan B og downloader PDF, mens Plan A også findes
- **THEN** indeholder filen Plan B's tre omgange i deres aktuelle rækkefølge og ingen opstilling fra Plan A eller trampet.

#### Scenario: Læseadgang og ugemt ændring

- **WHEN** en bruger med læseadgang downloader et scenarie eller en træner downloader efter en lokal ændring uden at gemme
- **THEN** oprettes en PDF af den synlige tilstand uden krav om skriveadgang eller automatisk gemning.

#### Scenario: Åben formular med ikke anvendte valg

- **WHEN** træneren forsøger at downloade, mens en omgangsformular indeholder ændringer, der endnu ikke er anvendt på kladden
- **THEN** skal træneren først anvende eller forkaste formularens valg; PDF'en fremstiller ikke de ikke anvendte valg som del af planen.

### Requirement: Dokumentet viser konkurrenceplanen og planlagte C- og D-tal

Hver omgang SHALL vise udførende pladser i præcis startrækkefølge med entydigt genkendeligt gymnastnavn, valgt spring og relevant springretning. Ekstra og tællende gymnaster SHALL skelnes med tekst og en synlig grænse. Prioriterede reserver SHALL stå separat under den omgang, de gælder for, med prioritet, gymnast og valgt spring. Aktiv planlagt modtagning SHALL vises ved den berørte gymnast med grad og, ved kraftig hjælp på bane, det modtagne element. PDF'en SHALL vise samme planlagte C og D for disciplinen og samme planlagte D for hver omgang som appens analyse af den eksporterede tilstand. Ufuldstændige, ugyldige eller uafklarede beregninger SHALL markeres med status uden at fremstå som sikre tal. Uden regelpakke SHALL PDF'en markere, at C og D ikke kan beregnes. PDF'en MUST NOT vise sikkerhedsvurderinger, interne noter, E-fradrag eller en beregnet karakter.

#### Scenario: Fuld omgang med ekstra og reserver

- **WHEN** en omgang har to ekstra før seks tællende og to prioriterede reserver
- **THEN** kan læseren se alle otte udførende i startrækkefølge, hvilke der er ekstra, og hvilken reserve der har første prioritet uden at forveksle reserver med startere.

#### Scenario: Planlagt modtagning

- **WHEN** en banegymnast har planlagt kraftig hjælp ved et bestemt element i serien
- **THEN** viser gymnastens linje modtagningsgraden og elementet uden E-fradrag; omgangens D afspejler den planlagte modtagning.

#### Scenario: C og D i planen

- **WHEN** en regelpakke beregner den valgte plans C og D
- **THEN** viser PDF'en disciplinens planlagte C og D samt D ved hver omgang med samme afrunding og status som appen.

#### Scenario: Uafklarede tal

- **WHEN** en beregning er uafklaret, ufuldstændig eller utilgængelig på grund af manglende regelpakke
- **THEN** viser PDF'en ingen opdigtet værdi og forklarer status ved C eller D.

### Requirement: Uafklarede valg fremstår ikke som en færdig plan

PDF'en SHALL markere ambitioner uden gymnast, pladser og reserver uden valgt spring, utilgængelige referencer og planlagte modtagninger, der er nulstillet af et ændret spring, med forståelig tekst på det berørte sted. Ufuldstændige eller ugyldige omgange SHALL have en synlig status uden at opfinde en gymnast, et spring eller en gyldig konkurrenceplan. Hvis holdets præcise regelpakke mangler, SHALL gemte navne og valg stadig kunne eksporteres, men dokumentet SHALL tydeligt sige, at regelmæssig gyldighed ikke er kontrolleret.

#### Scenario: Ambition og manglende spring

- **WHEN** anden omgang indeholder en ambition uden gymnast og en reserve uden valgt spring
- **THEN** viser PDF'en henholdsvis Mangler gymnast og Spring mangler på de relevante linjer samt en synlig markering af, at planen ikke er klar.

#### Scenario: Forældet modtagning

- **WHEN** et ændret spring har nulstillet en tidligere planlagt modtagning
- **THEN** fremstiller PDF'en ikke modtagningen som aktiv, men markerer, at modtagningen skal planlægges igen.

### Requirement: PDF'en er læsbar som skærmdokument og på papir

PDF'en SHALL have et dokumentlayout i A4 liggende format med hold, disciplin, scenarie, eksporttidspunkt og tydeligt adskilte omgange. Den SHALL ikke vise ordet Øjebliksbillede. Den SHALL kunne læses og udskrives uden adgang til appen eller nettet. Tekst SHALL være søgbar og kunne markeres, og oplysninger SHALL forblive forståelige i gråtoner. En almindelig fuld plan med seks tællende, to ekstra og højst to reserver i hver af tre omgange SHALL være på én side. Første side SHALL vise højst to reserver pr. omgang; øvrige reserver SHALL fortsætte på ekstra sider i prioriteret rækkefølge uden at udelade nogen. Meget lange navne og spring SHALL ombrydes eller fortsætte på ekstra sider uden afklipning, overlappende tekst eller ulæseligt lille skrift. Sider efter den første SHALL bevare tydelig angivelse af hold, disciplin, scenarie og omgang.

#### Scenario: Mange startere og reserver

- **WHEN** et scenarie har lange springnavne, det maksimale antal udførende og flere reserver i en omgang
- **THEN** er alle linjer læsbare på hver side, og ingen gymnast eller reserve bortfalder, selv om dokumentet fylder flere sider.

#### Scenario: Fuld plan på én side

- **WHEN** alle tre omgange har to ekstra, seks tællende og to reserver med almindeligt lange navne og spring
- **THEN** viser én A4-side alle tre omgange, og ingen tekst eller række klippes af.

#### Scenario: Flere end to reserver

- **WHEN** en omgang har tre eller flere reserver
- **THEN** viser første side højst de to første, og de følgende sider viser resten i prioriteret rækkefølge.

### Requirement: Kopiens status og downloadfejl er tydelige

PDF'en SHALL vise tidspunktet for eksport og markere Ugemt kladde, når den aktuelle tilstand afviger fra den sidst bekræftede fil eller endnu ikke er gemt. En PDF uden denne markering MUST NOT antyde, at senere ændringer automatisk opdaterer kopien. Hvis PDF'en ikke kan oprettes eller downloades, SHALL brugeren få en forståelig fejl, mens arbejdsrummet bevares uændret.

#### Scenario: PDF fra ugemt kladde

- **WHEN** træneren ændrer rækkefølgen lokalt og downloader før Gem
- **THEN** viser PDF'en den nye rækkefølge, eksporttidspunktet og Ugemt kladde uden at ændringen bliver gemt på Drive.

#### Scenario: PDF-generering fejler

- **WHEN** browseren ikke kan færdiggøre PDF-genereringen
- **THEN** forklares fejlen i appen, og den åbne kladde og gemmestatus er uændrede.
