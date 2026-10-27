# Spec Delta

## RENAMED Requirements

- FROM: `### Requirement: Seks vedvarende omgange pr. hold`
- TO: `### Requirement: Vedvarende scenarier pr. hold og disciplin`

## MODIFIED Requirements

### Requirement: Vedvarende scenarier pr. hold og disciplin
Systemet SHALL oprette mindst ét navngivet scenarie for bane og mindst ét for trampet på hvert hold. Hvert scenarie SHALL indeholde præcis tre omgange, som kan redigeres, gemmes og genåbnes. Scenariernes antal SHALL kunne udvides efter trænerens behov uden en produktgrænse på eksempelvis A, B og C. Scenarier for de to discipliner SHALL være uafhængige. Alle scenarier SHALL være ligeværdige; systemet MUST NOT kræve udpegning eller aktivering af en officiel konkurrenceplan. Ufuldstændige opstillinger SHALL kunne gemmes som kladder med tydelig angivelse af mangler.

#### Scenario: Gem og genåbn hele opstillingen
- **WHEN** træneren udfylder begge discipliner, gemmer og senere genåbner datafilen
- **THEN** bevares alle scenariers navne, omganges deltagere, spring, rækkefølge, reserver og holdets regelbinding.

#### Scenario: Forskelligt antal scenarier i hver disciplin
- **WHEN** træneren har fire banescenarier og to trampetscenarier og opretter et femte banescenarie
- **THEN** har det nye banescenarie tre omgange, og trampettens to scenarier er uændrede.

### Requirement: Gymnaster og kendte færdigheder vælges sammen
En omgangsplads SHALL vælge et aktivt holdmedlem og en af gymnastens registrerede anvendelige færdigheder i den pågældende disciplin. Hver valgmulighed SHALL før valg vise præcist springnavn, relevant saltoretning, springets egen D under holdets regelpakke og gymnastens effektive sikkerhed eller Ikke vurderet. Afledte registreringer SHALL kunne vælges på samme grundlag som egne, når de er aktive og anvendelige. Systemet MUST forhindre samme gymnast på flere pladser samlet blandt deltagere og reserver i samme omgang i samme scenarie, men SHALL tillade deltagelse og reservestatus i flere forskellige omgange og scenarier og forskellig gymnastbesætning mellem omgange.

#### Scenario: Samme gymnast i flere omgange
- **WHEN** en gymnast vælges i baneomgang 1 og 3
- **THEN** er det tilladt, mens et andet valg af samme gymnast som deltager eller reserve i omgang 1 i samme scenarie afvises.

#### Scenario: Ingen registrerede spring
- **WHEN** et holdmedlem uden registrerede baneserier vælges til en baneplads
- **THEN** vises en uafklaret plads og en direkte vej til færdighedsregistrering; appen opfinder eller tildeler ikke et spring.

#### Scenario: Sammenlign sikkerhed og D før valg
- **WHEN** træneren åbner gymnastens springvalg på en omgangsplads
- **THEN** kan spring med D 0,80 og sikkerhed 5 sammenlignes med spring med D 1,00 og sikkerhed 2 direkte blandt mulighederne uden at gemme et midlertidigt valg først.

#### Scenario: Samme gymnast i alternative planer
- **WHEN** en gymnast deltager i Plan A og er reserve i samme omgangsnummer i Plan B
- **THEN** er begge valg tilladt og uafhængige.

### Requirement: Holdomgang er første omgang
Der SHALL være præcis én holdomgang i hvert scenarie, placeret først. Valg af en anden omgang som holdomgang SHALL tilbyde flytning til førstepladsen med bevarelse af hele omgangens data, inklusive reservelisten, og genberegning af alle konsekvenser i det pågældende scenarie. Andre scenarier MUST NOT ændres. Systemet MUST NOT godkende en holdomgang på anden eller tredje konkurrenceplads.

#### Scenario: Gør tredje omgang til holdomgang
- **WHEN** træneren vælger den tredje omgang som holdomgang
- **THEN** flyttes denne omgang til førstepladsen efter en synlig handling, de andre omgange følger deres nye rækkefølge, og alle deltagere, valgte spring og reserveprioriteter bevares i dette scenarie.

### Requirement: Tællende og ekstra gymnaster
For den aktuelle DK-pakke SHALL en fuld udførende omgang have seks tællende gymnaster og op til to ekstra først. Ekstra gymnaster SHALL være synligt markeret og SHALL indgå i de krav, der gælder dem, herunder rækkefølge, men MUST NOT øge tællende D, tillæg eller stabilitetsdækning. Mixholdets relevante fordelingskrav SHALL valideres fra holdprofilen. Reserver SHALL være adskilt fra udførende pladser og MUST NOT optage tællende eller ekstra pladser eller ændre disse grænser.

#### Scenario: Otte gymnaster i korrekt rækkefølge
- **WHEN** to ekstra gymnaster efterfølges af seks tællende
- **THEN** er kun de sidste seks grundlag for point og tællende stabilitet, og de første to er stadig omfattet af relevant rækkefølgekontrol.

#### Scenario: Niende gymnast
- **WHEN** træneren forsøger at tilføje en niende udførende gymnast i en DK-omgang
- **THEN** afvises handlingen med forklaring af grænsen, og der skabes ikke en syvende tællende plads.

#### Scenario: Reserve til en fyldt omgang
- **WHEN** omgangen har to ekstra og seks tællende, og træneren tilføjer en anden aktiv gymnast som reserve
- **THEN** tillades reserven uden at ændre de otte udførende pladser eller deres beregningsgrundlag.

### Requirement: Sammenhængende analyse under redigering
Ændring af gymnast, spring, rækkefølge eller holdomgang SHALL straks opdatere D, C-forhold, stabilitet og mangler lokalt for det valgte scenarie. Krav, der gælder alle tre omgange, SHALL ikke vurderes isoleret på den redigerede omgang alene. Scenariets analyser og konkrete forslag SHALL være entydigt knyttet til hold, disciplin og scenarie. Andre scenariers opstillinger MUST NOT ændres, og et ukendt scenarie MUST NOT erstattes med et andet som skjult fallback.

#### Scenario: Fjern eneste Pegasus-omgang
- **WHEN** træneren erstatter alle Pegasus-spring i den eneste omgang med redskab
- **THEN** opdateres scenariets med/uden-redskabskontrol, relevante fradrag og tillæg, og berørte forhold fremhæves uden ændring af andre scenariers opstillinger.

#### Scenario: Skift plan under beregning
- **WHEN** Plan A's potentialesøgning afsluttes efter at træneren har åbnet Plan B
- **THEN** vises resultatet ikke som Plan B's mulighed, og det kan ikke anvendes på Plan B.

## ADDED Requirements

### Requirement: Opret, navngiv og omdøb scenarier
Træneren SHALL kunne oprette et tomt scenarie og omdøbe et eksisterende. Et nyt scenarie SHALL have tre tomme omgange og tomme reservelister og åbnes efter oprettelse. Navne SHALL trimmes, indeholde 1–200 tegn efter trimning og være entydige uden forskel på store og små bogstaver inden for samme holds disciplin. Samme navn SHALL være tilladt i andre discipliner og på andre hold. Ugyldige navne SHALL give fejl ved feltet uden delvis oprettelse eller tab af indtastning. Nye scenarier SHALL placeres efter det scenarie, handlingen startede fra. Annullering MUST NOT ændre data.

#### Scenario: Opret tom variation
- **WHEN** træneren opretter banescenariet Uden Pegasus fra Plan A
- **THEN** åbnes Uden Pegasus med tre tomme omgange efter Plan A, og eksisterende scenarier bevarer deres indhold.

#### Scenario: Navnekonflikt
- **WHEN** træneren forsøger at navngive et andet banescenarie som ` plan a `, mens Plan A allerede findes på samme hold
- **THEN** afvises navnet ved feltet, formularen bevares, og eksisterende planer ændres ikke.

#### Scenario: Navn på tværs af discipliner
- **WHEN** både bane og trampet har et scenarie med navnet Plan A
- **THEN** er navnene tilladt, og omdøbning på bane ændrer ikke trampetscenariet.

### Requirement: Duplikering skaber en selvstændig variation
Træneren SHALL kunne duplikere et scenarie med alle tre omgange, deltagere, roller, springvalg, rækkefølger og prioriterede reserver. Kopien SHALL få selvstændige identiteter for scenarie, omgange og pladser, men bevare referencerne til det fælles kartotek og registrerede færdigheder. Kopien SHALL åbnes efter oprettelse og placeres efter originalen. Træneren SHALL kunne redigere et foreslået, ledigt kopinavn før bekræftelse; forslaget SHALL kunne rummes inden for navnegrænsen også for et originalnavn på 200 tegn. Redigering af kopiens opstilling MUST NOT ændre originalens. Fælles vurderingsændringer SHALL fortsat slå igennem alle relevante scenarier.

#### Scenario: Små variationer med reserver
- **WHEN** træneren duplikerer Plan A til Plan B og bytter to deltagere samt ændrer reserveprioriteten i Plan B
- **THEN** bevarer Plan A sin opstilling og prioritet, og begge scenarier refererer fortsat til de samme personlige færdighedsregistreringer.

#### Scenario: Fælles sikkerhed ændres
- **WHEN** sikkerheden på en registrering, som bruges i både Plan A og Plan B, ændres
- **THEN** viser begge scenarier den nye effektive sikkerhed uden kopiering af registreringen.

### Requirement: Bevidst sletning af scenarier
Træneren SHALL kunne slette et scenarie efter en bekræftelse med navn, disciplin og at alle tre omgange med reserver fjernes. Annullering SHALL bevare data. Sletning MUST NOT ændre andre scenarier, fælles gymnaster eller færdigheder. Der SHALL altid være mindst ét scenarie tilbage pr. disciplin; sletning af det sidste SHALL være utilgængelig med en forståelig forklaring. Efter sletning af det viste scenarie SHALL næste scenarie i rækken vises, eller det foregående, hvis der ikke er et næste.

#### Scenario: Slet alternativ
- **WHEN** træneren bekræfter sletning af Plan B mellem Plan A og Plan C
- **THEN** fjernes kun Plan B med dets tre omgange og reserver, og Plan C vises.

#### Scenario: Sidste scenarie
- **WHEN** Plan A er disciplinens eneste scenarie
- **THEN** er sletning utilgængelig med forklaring, og Plan A kan fortsat omdøbes og redigeres.

### Requirement: Prioriterede reserver til hele omgangen
Træneren SHALL kunne tilføje, redigere, fjerne og prioritere reserver i hver omgang i hvert scenarie. En reserve SHALL gælde hele omgangen uden binding til en bestemt gymnast. Listen SHALL vise prioritet, gymnast, valgt spring, egen D og sikkerhed eller deres tydelige manglende/ukendte tilstande. Manglende spring SHALL kunne gemmes som kladde. Reserver MUST NOT indgå i omgangens D, C, springrækkefølge, fordelingskrav eller tællende sikkerhed før indsættelse. Mangler på en reserve SHALL vises særskilt og MUST NOT gøre en ellers komplet udførende opstilling ufuldstændig.

#### Scenario: Prioritér beredskab
- **WHEN** træneren flytter omgangens anden reserve op som første reserve
- **THEN** ændres alene den pågældende reservelistes prioritet, mens udførende pladser og omgangens beregninger bevares.

#### Scenario: Reserve uden spring
- **WHEN** en komplet udførende omgang får en reserve uden springvalg
- **THEN** kan kladden gemmes med tydelig mangel på reserven, mens omgangens udførende fuldstændighed, point og tællende sikkerhed er uændrede.

### Requirement: Indsættelse af en reserve er en bevidst samlet ændring
Med Sæt ind SHALL træneren vælge, hvilken af omgangens udførende gymnaster reserven erstatter. En forhåndsvisning SHALL navngive scenarie, omgang, reserve og udgående gymnast og vise konsekvenser for scenariets D, C, sikkerhed og mangler før bekræftelse. Bekræftelse SHALL bevare den erstattede plads' rolle og position, indsætte reservens gymnast og valgte spring og fjerne denne reserve fra listen i én ændring. Den udgående gymnast MUST NOT automatisk gøres til reserve, og øvrige pladser MUST NOT sorteres stiltiende. Annullering SHALL bevare begge lister. En aktiv reserve uden valgt spring SHALL kunne sættes ind som ufuldstændig plads. En utilgængelig gymnast eller valgt færdighed MUST NOT nyindsættes som gyldig; træneren SHALL kunne rette reserven eller bevidst vælge spring senere. En omgang uden udførende pladser SHALL forklare, at en plads først skal tilføjes.

#### Scenario: Skade på en tællende gymnast
- **WHEN** træneren vælger omgangens første reserve, udpeger en tællende gymnast og bekræfter forhåndsvisningen
- **THEN** overtager reserven den tællende plads og position, forlader reservelisten, og scenariet genberegnes uden ændring af andre scenarier.

#### Scenario: Erstat en ekstra gymnast
- **WHEN** træneren sætter en reserve ind på en ekstra plads
- **THEN** forbliver pladsen ekstra i samme position, og reserven bliver ikke en syvende tællende gymnast.

#### Scenario: Annullér eller forældet grundlag
- **WHEN** træneren annullerer, eller data ændres efter forhåndsvisningen og før bekræftelse
- **THEN** anvendes forhåndsvisningen ikke, begge aktuelle lister bevares, og ved forældet grundlag tilbydes en ny beregning.

### Requirement: Konkrete forslag ændrer kun deres eget scenarie
Et potentialeforslag SHALL vise målscenariet og være bundet til den opstilling og det arbejdsrumsgrundlag, det blev beregnet for. Et forældet forslag eller et forslag til et andet scenarie MUST NOT kunne anvendes som ændring af den viste plan. Anvendelse SHALL kun ændre målscenariets udførende opstillinger og bevare andre scenarier og fælles registreringer. Reserver SHALL bevares, bortset fra at en reserve, som forslaget gør udførende i samme omgang, SHALL fjernes fra netop den reserveliste med synlig angivelse i forhåndsvisningen. Udgående deltagere MUST NOT automatisk blive reserver.

#### Scenario: Forslag bruger en reserve som udførende
- **WHEN** et konkret forslag til Plan B gør en af anden omgangs reserver til tællende deltager
- **THEN** vises ændringen af både deltagere og reserveliste før anvendelse, og øvrige omganges reserver samt Plan A bevares.

#### Scenario: Planen ændres efter forslag
- **WHEN** træneren redigerer arbejdsrummet efter at have åbnet et forslag
- **THEN** afvises anvendelsen med besked om at beregne igen, uden at overskrive de nyere ændringer.
