# routine-planning Specification

## Purpose

Lader trænerne sammensætte hele holdets konkurrenceopstilling med tre baneomgange og tre trampetomgange og se konsekvenserne, mens de arbejder.
## Requirements
### Requirement: Vedvarende scenarier pr. hold og disciplin
Systemet SHALL oprette mindst ét navngivet scenarie for bane og mindst ét for trampet på hvert hold. Hvert scenarie SHALL indeholde præcis tre omgange, som kan redigeres, gemmes og genåbnes. Scenariernes antal SHALL kunne udvides efter trænerens behov uden en produktgrænse på eksempelvis A, B og C. Scenarier for de to discipliner SHALL være uafhængige. Alle scenarier SHALL være ligeværdige; systemet MUST NOT kræve udpegning eller aktivering af en officiel konkurrenceplan. Ufuldstændige opstillinger SHALL kunne gemmes som kladder med tydelig angivelse af mangler.

#### Scenario: Gem og genåbn hele opstillingen
- **WHEN** træneren udfylder begge discipliner, gemmer og senere genåbner datafilen
- **THEN** bevares alle scenariers navne, omganges deltagere, spring, rækkefølge, reserver og holdets regelbinding.

#### Scenario: Forskelligt antal scenarier i hver disciplin
- **WHEN** træneren har fire banescenarier og to trampetscenarier og opretter et femte banescenarie
- **THEN** har det nye banescenarie tre omgange, og trampettens to scenarier er uændrede.

### Requirement: Gymnaster og kendte færdigheder vælges sammen
En omgangsplads SHALL enten vælge et aktivt holdmedlem og en af gymnastens registrerede anvendelige færdigheder i den pågældende disciplin eller være en ambition med et valgt spring og uden gymnast efter kravene til ambitioner. Hver valgmulighed for en gymnast SHALL før valg vise præcist springnavn, relevant saltoretning, springets egen D under holdets regelpakke og gymnastens effektive sikkerhed eller Ikke vurderet. Afledte registreringer SHALL kunne vælges på samme grundlag som egne, når de er aktive og anvendelige. Systemet MUST forhindre samme gymnast på flere pladser samlet blandt deltagere og reserver i samme omgang i samme scenarie, men SHALL tillade deltagelse og reservestatus i flere forskellige omgange og scenarier og forskellig gymnastbesætning mellem omgange. Ambitioner uden gymnast SHALL ikke indgå i denne unikhedskontrol.

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

#### Scenario: Flere ambitioner med samme spring
- **WHEN** træneren opretter to ambitioner med samme spring i samme omgang
- **THEN** er det tilladt, fordi ingen gymnast endnu er valgt.

### Requirement: Holdomgang er første omgang
Der SHALL være præcis én holdomgang i hvert scenarie, placeret først. Valg af en anden omgang som holdomgang SHALL tilbyde flytning til førstepladsen med bevarelse af hele omgangens data, inklusive reservelisten, og genberegning af alle konsekvenser i det pågældende scenarie. Andre scenarier MUST NOT ændres. Systemet MUST NOT godkende en holdomgang på anden eller tredje konkurrenceplads.

#### Scenario: Gør tredje omgang til holdomgang
- **WHEN** træneren vælger den tredje omgang som holdomgang
- **THEN** flyttes denne omgang til førstepladsen efter en synlig handling, de andre omgange følger deres nye rækkefølge, og alle deltagere, valgte spring og reserveprioriteter bevares i dette scenarie.

### Requirement: Tællende og ekstra gymnaster
En fuld udførende omgang SHALL have seks tællende gymnaster og det antal ekstra gymnaster først, som holdets regelpakke tillader. For DK er det op til to ekstra. For REG er det op til seks ekstra, en afledt grænse fra TR 1.3.1.

Ekstra gymnaster SHALL være synligt markeret og SHALL indgå i de krav, som holdets pakke lader gælde for dem, herunder DK's rækkefølgekrav. De MUST NOT øge tællende D, tillæg eller stabilitetsdækning. Brugerfladens tekster om grænsen og om rækkefølge SHALL komme fra pakken og MUST NOT nævne et fast antal eller et rækkefølgekrav, som pakken ikke har.

Mixholdets relevante fordelingskrav SHALL valideres fra holdprofilen. Reserver SHALL være adskilt fra udførende pladser og MUST NOT optage tællende eller ekstra pladser eller ændre disse grænser.

#### Scenario: Otte gymnaster i korrekt rækkefølge
- **WHEN** to ekstra gymnaster efterfølges af seks tællende på et DK-hold
- **THEN** er kun de sidste seks grundlag for point og tællende stabilitet, og de første to er stadig omfattet af relevant rækkefølgekontrol.

#### Scenario: Niende gymnast
- **WHEN** træneren forsøger at tilføje en niende udførende gymnast i en DK-omgang
- **THEN** afvises handlingen med forklaring af grænsen, og der skabes ikke en syvende tællende plads.

#### Scenario: Tolv gymnaster i REG
- **WHEN** seks ekstra gymnaster efterfølges af seks tællende på et REG-hold
- **THEN** er omgangen gyldig uden rækkefølgekontrol, og guiden angiver »højst 6 ekstra først« som afledt grænse.

#### Scenario: Reserve til en fyldt omgang
- **WHEN** omgangen har det maksimale antal ekstra og seks tællende, og træneren tilføjer en anden aktiv gymnast som reserve
- **THEN** tillades reserven uden at ændre de udførende pladser eller deres beregningsgrundlag.

### Requirement: Rækkefølge kan redigeres tilgængeligt
Gymnaster SHALL kunne flyttes i en omgang med mus, berøring og tastatur-/knapbaserede handlinger. En foreslået sortering SHALL tage rotationskategori før D og SHALL anvendes ved et bevidst valg; systemet MUST NOT stiltiende omarrangere trænerens valg.

#### Scenario: Sorteringsforslag
- **WHEN** træneren anmoder om korrekt springrækkefølge i omgang 2
- **THEN** foreslås enkelt før dobbelt og fastholdt/stigende D inden for kategorierne, med synlige ændringer før anvendelse.

### Requirement: Sammenhængende analyse under redigering
Ændring af gymnast, spring, rækkefølge eller holdomgang SHALL straks opdatere D, C-forhold, stabilitet og mangler lokalt for det valgte scenarie. Krav, der gælder alle tre omgange, SHALL ikke vurderes isoleret på den redigerede omgang alene. Scenariets analyser og konkrete forslag SHALL være entydigt knyttet til hold, disciplin og scenarie. Andre scenariers opstillinger MUST NOT ændres, og et ukendt scenarie MUST NOT erstattes med et andet som skjult fallback.

#### Scenario: Fjern eneste Pegasus-omgang
- **WHEN** træneren erstatter alle Pegasus-spring i den eneste omgang med redskab
- **THEN** opdateres scenariets med/uden-redskabskontrol, relevante fradrag og tillæg, og berørte forhold fremhæves uden ændring af andre scenariers opstillinger.

#### Scenario: Skift plan under beregning
- **WHEN** Plan A's potentialesøgning afsluttes efter at træneren har åbnet Plan B
- **THEN** vises resultatet ikke som Plan B's mulighed, og det kan ikke anvendes på Plan B.

### Requirement: Ufuldstændighed er forskellig fra fradrag
En tom plads, et manglende valg eller en ambition uden gymnast SHALL vises som en planlægningsmangel og MUST NOT automatisk fortolkes som et faktisk gennemløb, et bestemt udførelsesfradrag eller en fuld godkendt opstilling. Kendte delresultater SHALL kunne vises med tydeligt beregningsgrundlag. En ambition SHALL vises som Mangler gymnast, mens dens spring indgår i D og C som planlagt spring.

#### Scenario: Fem udfyldte pladser
- **WHEN** kun fem tællende gymnaster er valgt
- **THEN** viser appen de kendte værdier og den manglende plads og bruger ikke en skjult antagelse om den sjette gymnasts udførelse.

#### Scenario: Fem besatte og én ambition
- **WHEN** en omgang har fem besatte tællende pladser og én tællende ambition med kendt D
- **THEN** viser omgangen den samlede D for alle seks spring og status Mangler gymnast for én plads, uden at omgangen fremstår som gennemført.

### Requirement: Søgbart visuelt springvalg
Springvalget på en omgangsplads SHALL vise mulighederne i adskilte rækker med navn, saltoretning, D og sikkerhed som særskilte visuelle oplysninger. For en gymnast er mulighederne de registrerede. For Hele holdet er de holdets anvendelige spring, og kolonnen viser antal gymnaster i stedet for sikkerhed. For en ambition er mulighederne disciplinens springkatalog med Ingen gymnast i stedet for sikkerhed. Desktop SHALL bruge faste sammenlignelige kolonner, og mobil SHALL bevare oplysningerne uden vandret overflow. Sikkerhed SHALL bruge fem trin og en talværdi med tilgængelig forklaring ved Ikke vurderet. Listen SHALL kunne søges, betjenes med pile/Home/End/Enter og lukkes med Escape uden at lukke omgangspladsens dialog. Valg SHALL bevares ved lukning af listen. Et skift af gymnast, herunder til eller fra Ingen gymnast endnu, SHALL nulstille springvalget, undtagen når et spring valgt under Hele holdet overføres til en gymnast, der kan springet. Vælg senere SHALL tillade en plads med gymnast uden spring. Planen MUST NOT ændres før Opdater.

#### Scenario: Søg og vælg med tastatur
- **WHEN** træneren søger en registreret variant, flytter det aktive valg og trykker Enter
- **THEN** lukkes listen med fokus på springfeltet, og feltet viser valgt navn, D og sikkerhed uden en lang sammenhængende optiontekst.

#### Scenario: Skift gymnast og annullér
- **WHEN** træneren vælger et spring, skifter til en anden gymnast og lukker dialogen
- **THEN** viser listen kun den nye gymnasts anvendelige spring, det tidligere valg er nulstillet, og den gemte plan er uændret.

#### Scenario: Skift til Ingen gymnast endnu
- **WHEN** træneren har valgt en gymnasts spring og skifter til Ingen gymnast endnu
- **THEN** nulstilles springvalget, og listen viser disciplinens katalog.

#### Scenario: Holdets spring overføres til gymnasten
- **WHEN** træneren under Hele holdet har valgt et spring og derefter vælger en af de tilbudte gymnaster
- **THEN** står springvalget fortsat på samme springidentitet, nu som gymnastens egen registrering med gymnastens D og sikkerhed.

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
Et potentialeforslag SHALL vise målscenariet og være bundet til den opstilling og det arbejdsrumsgrundlag, det blev beregnet for. Et forældet forslag eller et forslag til et andet scenarie MUST NOT kunne anvendes som ændring af den viste plan. Anvendelse SHALL kun ændre målscenariets udførende opstillinger og bevare andre scenarier og fælles registreringer. Reserver SHALL bevares, bortset fra at en reserve, som forslaget gør udførende i samme omgang, SHALL fjernes fra netop den reserveliste med synlig angivelse i forhåndsvisningen. Udgående deltagere MUST NOT automatisk blive reserver. Ambitionspladser SHALL behandles som faste; et forslag MUST NOT besætte, ændre eller fjerne dem, og et forslag, der ville udskifte en omgang med ambitioner, MUST NOT tilbydes. Når det udelukker forslag, SHALL årsagen vises.

#### Scenario: Forslag bruger en reserve som udførende
- **WHEN** et konkret forslag til Plan B gør en af anden omgangs reserver til tællende deltager
- **THEN** vises ændringen af både deltagere og reserveliste før anvendelse, og øvrige omganges reserver samt Plan A bevares.

#### Scenario: Planen ændres efter forslag
- **WHEN** træneren redigerer arbejdsrummet efter at have åbnet et forslag
- **THEN** afvises anvendelsen med besked om at beregne igen, uden at overskrive de nyere ændringer.

#### Scenario: Omgang med ambitioner
- **WHEN** et tillæg kun kan opnås ved at udskifte en omgang, der indeholder en ambition
- **THEN** tilbydes intet konkret forslag, og tillægget forklarer, at forslag ikke udskifter omgange med ambitioner.

### Requirement: Springplanen giver overblik før opstillingen
For et hold med installeret regelpakke SHALL springplanen vise en sammenklappelig, kompakt guide for den valgte disciplin og det valgte scenarie før de tre omgange, også når alle omgange er tomme. Den lukkede guide SHALL give et kort statusoverblik; når den åbnes, SHALL den adskille planens rammer og kompositionskrav fra tillæg og vise deres aktuelle tilstand uden at kræve gennemlæsning af den fulde C-analyse. En tom eller delvis plan MUST NOT markeres som et gennemført forsøg med faktisk fradrag. Guidens tilstande SHALL afledes af den aktuelle regelbinding og plan; træneren MUST NOT skulle gemme særskilte flueben.

#### Scenario: Tomt scenarie
- **WHEN** træneren åbner et nyt, tomt banescenarie
- **THEN** vises et kort statusoverblik før omgangene, og krav og tillæg kan åbnes med status som ikke påbegyndt eller afventer planvalg, uden at tomme pladser tælles som faktiske fradrag.

#### Scenario: Andet scenarie og disciplin
- **WHEN** træneren skifter fra Plan A på bane til Plan B på trampet
- **THEN** viser guiden kun Plan B's trampetkrav, tillæg og planstatus uden at ændre eller genbruge Plan A's visningsresultater.

#### Scenario: Planen ændres
- **WHEN** træneren ændrer et spring eller flytter en omgang til holdomgang
- **THEN** opdateres guidens relevante tilstande fra samme scenarie som D- og C-analysen, uden at andre scenariers data ændres.

### Requirement: Guiden er kort og fører til detaljer
Den lukkede standardvisning SHALL give kort tekstlig status for omgangene samt tillæg og fradrag. Når guiden åbnes, SHALL hver linje bruge kort betegnelse, synlig tællemetode og tekstlig status eller værdi. På både smalle og brede skærme SHALL krav og tillæg kunne aflæses uden vandret rulning eller lange regelafsnit. Træneren SHALL kunne åbne en linje for regelkrav, kilde, berørte omgange og relevante næste handlinger; handlinger, som kun navigerer eller åbner detaljer, MUST NOT ændre planen. Status og tællemetode MUST NOT formidles alene med farve eller ikon.

#### Scenario: Mobil og tastatur
- **WHEN** træneren åbner springplanen på en smal skærm eller bruger tastatur
- **THEN** kan guiden åbnes med tastatur, hvorefter alle linjer kan læses og åbnes i logisk rækkefølge med synlig tekst for status og tællemetode.

#### Scenario: Se grundlaget
- **WHEN** træneren åbner en uafklaret eller delvis linje
- **THEN** vises den korte årsag og vej til den relevante omgang eller den eksisterende dybere analyse uden at anvende et forslag eller ændre kladden.

### Requirement: Pladsen viser og redigerer planlagt modtagning
Hver udfyldt deltagerplads i en bane- eller trampetomgang SHALL give adgang til at planlægge, ændre og fjerne én modtagning uden at forlade springplanen. Pladsen SHALL vise en kompakt og tilgængelig markering af grad, for Kraftig hjælp på bane også det modtagne element, og pladsens justerede D. Markeringen MUST NOT formidles alene med farve eller ikon. Ændringen SHALL ske gennem en domænekommando. Formularer MUST NOT indføre egne regler for nulstilling eller fletning.

#### Scenario: Vælg grad med tastatur
- **WHEN** træneren åbner modtagningsvalget på en plads med tastatur og vælger Kraftig hjælp på en baneserie
- **THEN** vises elementvalget med seriens sidste element valgt, og pladsen viser grad, element og justeret D med tekst.

### Requirement: Planændringer har eksplicit betydning for modtagning
Indsættelse af en reserve på en plads SHALL fjerne pladsens modtagning, da reserver ikke bærer modtagning. Skift af gymnast eller spring på en plads SHALL fjerne modtagningen. Duplikering af et scenarie SHALL kopiere modtagningerne til kopiens pladser, og senere ændringer i kopien MUST NOT ændre originalen. Flytning af en omgang til holdomgang og ændring af rækkefølge eller rolle SHALL bevare modtagningen. Når en indsættelse eller ændring fjerner en modtagning, SHALL bekræftelsen eller ændringsvisningen oplyse det.

#### Scenario: Reserve indsættes
- **WHEN** træneren indsætter en reserve på en plads med planlagt Hjælp til udførelse
- **THEN** har pladsen bagefter ingen modtagning, og indsættelsesvisningen har oplyst, at modtagningen bortfalder.

#### Scenario: Duplikering
- **WHEN** Plan A har en planlagt modtagning, og træneren duplikerer Plan A til Plan B og fjerner modtagningen i Plan B
- **THEN** har Plan A stadig modtagningen.

### Requirement: Potentialeforslag viser bortfald af modtagning
Et konkret forslag, som ændrer springet eller gymnasten på en plads med planlagt modtagning, SHALL i forhåndsvisningen oplyse, at modtagningen bortfalder. Anvendelse SHALL følge de samme regler som en manuel ændring. Søgningen efter C-potentiale MUST NOT bruge modtagning som kriterium.

#### Scenario: Forslag ændrer modtaget spring
- **WHEN** et potentialeforslag udskifter springet på en plads med planlagt modtagning
- **THEN** viser forhåndsvisningen, at modtagningen fjernes, og efter anvendelse har pladsen ingen modtagning.

### Requirement: Omgangens springvalg prioriterer seriens begyndelse
Ved valg af spring til en ambition SHALL søgning bruge samme normalisering, strukturelle aliaser og rangering som gymnastens nuværende springvælger. Præcise navne og sammenhængende begyndelser SHALL stå før løse ord på tværs af serien. Træneren SHALL kunne afgrænse resultater med det eksisterende kædefilter og minimum-D uden at miste et allerede valgt spring. Listen SHALL vise elementernes rækkefølge, saltoretning, D og forbindelsesstatus. Når de samlede filtre giver nul resultater og kæden har en præcis begyndelse, SHALL én handling i tomtilstanden kunne fortsætte kæden i Byg selv; der MUST NOT være en Byg videre-handling på hver resultatrække.

#### Scenario: Strakt rondat på omgangen
- **WHEN** træneren søger strakt rondat på en ambition
- **THEN** står Strakt salto – rondat og Strakt salto – rondat – flik før Rondat – flik med strakt afslutning.

#### Scenario: Valgt spring bevares under filtrering
- **WHEN** træneren vælger en serie og ændrer kædefilter eller minimum-D
- **THEN** forbliver valget synligt i en samlet gennemgang og ændres ikke uden trænerens handling.

### Requirement: Tilføj et valgt antal pladser med samme spring
På en bane- eller trampetomgang SHALL træneren kunne vælge et aktivt spring, en rolle og et antal nye pladser fra 1 til antallet af ledige pladser for rollen. Handlingen SHALL oprette det valgte antal selvstændige, fortløbende pladser med samme præcise spring i én samlet ændring. Den SHALL kunne gentages med et andet spring, så eksempelvis 2 + 2 + 2 og 3 + 3 kan planlægges uden at søge hvert spring flere gange. Eksisterende pladser MUST NOT overskrives, og antal eller rækkefølge MUST NOT ændres stiltiende. Holdprofilens grænser for tællende og ekstra pladser samt ekstra først SHALL håndhæves for hele handlingen. Oprettelsen SHALL være atomisk: ugyldigt antal eller pladsgrænse MUST NOT efterlade delvise pladser eller en løs ny definition.

#### Scenario: To plus to plus to
- **WHEN** træneren vælger et spring og tilføjer 2 tællende pladser, vælger et andet og tilføjer 2 og vælger et tredje og tilføjer 2
- **THEN** viser omgangen seks nye pladser i den valgte blokrækkefølge med tre præcise springidentiteter og uændrede øvrige omgange.

#### Scenario: Tre plus tre
- **WHEN** træneren vælger et spring til 3 pladser og derefter et andet spring til 3 pladser
- **THEN** oprettes seks selvstændige pladser i de to valgte blokke uden at kopiere gymnast eller sikkerhed.

#### Scenario: Kun ledige pladser ændres
- **WHEN** omgangen allerede har to tællende pladser, og træneren tilføjer 2 med samme spring
- **THEN** bevares de eksisterende pladser og deres rækkefølge, og kun to nye pladser føjes til.

#### Scenario: Grænsen afviser samlet
- **WHEN** der er én ledig tællende plads, og træneren forsøger at tilføje 2
- **THEN** afvises handlingen med grænsen forklaret, og ingen plads eller springdefinition oprettes.

### Requirement: Hele holdet som udgangspunkt for en ny plads
Gymnastfeltet på en ny udførende plads eller reserveplads i gymnasttilstand i en bane- eller trampetomgang SHALL tilbyde valget Hele holdet før de enkelte gymnaster, og Hele holdet SHALL være forudvalgt. Ved redigering af en eksisterende plads SHALL pladsens gymnast være forudvalgt. Hele holdet er en midlertidig valgtilstand og MUST NOT kunne gemmes. Opdater SHALL være utilgængelig, og dialogen SHALL kort forklare, at der skal vælges en gymnast. Hele holdet SHALL være adskilt fra Ingen gymnast endnu, som fortsat opretter en ambition. Skift mellem Hele holdet og en gymnast MUST NOT ændre planen før Opdater.

#### Scenario: Ny plads åbner med holdets overblik
- **WHEN** træneren åbner Tilføj plads i baneomgang 2
- **THEN** står gymnastfeltet på Hele holdet, og springlisten viser holdets anvendelige spring i stedet for den første gymnasts spring.

#### Scenario: Redigering beholder gymnasten
- **WHEN** træneren redigerer en eksisterende plads med Anna Eksempel
- **THEN** står gymnastfeltet på Anna Eksempel, og listen viser Annas registrerede spring.

#### Scenario: Hele holdet kan ikke gemmes
- **WHEN** gymnastfeltet står på Hele holdet, uanset om der er valgt et spring
- **THEN** er Opdater utilgængelig, dialogen beder om en gymnast, og planen er uændret.

### Requirement: Holdets spring med antal gymnaster
Under Hele holdet SHALL springlisten vise hver anvendelig springidentitet i disciplinen én gang, også når flere gymnaster har den registreret. Identiteten SHALL følge regelpakkens springidentitet og samme anvendelighed som gymnastens liste: aktiv, ikke arkiveret og med kendt gyldighed. Kun spring, som mindst én ledig gymnast kan, SHALL vises. Ledige gymnaster er aktive holdmedlemmer, der ikke allerede står på en anden plads eller reserveplads i omgangen. Hver række SHALL vise navn, saltoretning, springets D under holdets regelpakke og antallet af ledige gymnaster, der kan springet, fx 4 ledige. Gymnaster, der kan springet, men allerede er placeret i omgangen, SHALL angives sekundært som totalen, fx 4 ledige af 6, og visuelt adskilt fra de ledige med gymnasternes initialer, så træneren kan se hvem. Når listen er indsnævret til et spring, SHALL gymnastlisten kort nævne de placerede gymnaster, der også kan springet. Personlig sikkerhed MUST NOT sammenfattes til et holdtal. Listen SHALL som standard være sorteret efter flest ledige gymnaster og derefter højeste D, og søgning SHALL bruge samme normalisering som gymnastens liste. Når holdet ikke har nogen anvendelige spring med en ledig gymnast, SHALL listen sige det kort og vise vejen til færdighedsregistrering. Antallene er afledte og MUST NOT gemmes.

#### Scenario: Samme spring hos flere gymnaster
- **WHEN** fire ledige gymnaster har rondat – flik – strakt salto registreret, heraf to via afledte registreringer
- **THEN** vises springet én gang med 4 ledige.

#### Scenario: Gymnast allerede i omgangen
- **WHEN** seks gymnaster kan et spring, og to af dem allerede står på omgangens pladser
- **THEN** viser rækken 4 ledige af 6, og de to placerede vises adskilt fra de ledige.

#### Scenario: Ingen ledige kan springet
- **WHEN** den eneste gymnast, der kan et spring, allerede står i omgangen
- **THEN** vises springet ikke under Hele holdet.

### Requirement: Valg af holdets spring indsnævrer gymnasterne
Når træneren vælger et spring under Hele holdet, SHALL gymnastfeltet kun tilbyde de ledige gymnaster, der har en anvendelig registrering med samme springidentitet. Hver gymnast SHALL vise sin effektive sikkerhed for springet, så træneren kan sammenligne før valget. Når træneren vælger en gymnast, SHALL pladsen bruge gymnastens egen registrering af identiteten. Har gymnasten flere anvendelige registreringer med samme identitet, SHALL den med højest effektiv sikkerhed vælges, og træneren SHALL kunne skifte til en anden i springlisten. Træneren SHALL kunne vende tilbage til Hele holdet uden at miste det valgte spring. Valg af et andet spring under Hele holdet SHALL igen indsnævre gymnastlisten. Formularen MUST NOT oprette registreringer eller vurderinger.

#### Scenario: Vælg spring først og gymnast bagefter
- **WHEN** træneren under Hele holdet vælger strakt salto, som Anna (sikkerhed 4) og Bea (sikkerhed 2) kan, og vælger Anna
- **THEN** tilbød gymnastfeltet kun Anna og Bea med deres sikkerhed, og efter Opdater står Annas registrering af strakt salto på pladsen.

#### Scenario: Tilbage til hele holdet
- **WHEN** træneren har valgt Bea og skifter tilbage til Hele holdet
- **THEN** er strakt salto stadig valgt, og gymnastfeltet tilbyder igen Anna og Bea.

### Requirement: Markering af gentagelse mellem omgange
Både gymnastens liste og listen under Hele holdet SHALL markere en springidentitet, som allerede bruges på en tællende plads i en anden omgang i samme scenarie. Ambitioner tæller med, når deres spring har en identitet. Markeringen SHALL nævne de berørte omgange og antal forekomster, fx Omg. 2 x3. Den SHALL fremstå som en advarsel om mulig gentagelse og MUST NOT blokere valget eller angive et fradragsbeløb. Fradraget afgøres fortsat af sammensætningsanalysen. Pladsen, der redigeres, MUST NOT tælle med. Ekstra pladser og reserver tæller ikke. Brug af samme identitet i den aktuelle omgang SHALL vises neutralt som antal i omgangen og ikke som advarsel. Når pladsen oprettes som ekstra eller som reserve, SHALL brug i andre omgange kun vises neutralt, fordi pladsen ikke indgår i gentagelsen. Markeringen SHALL kun vises for discipliner, hvor holdets regelpakke vurderer gentagelse mellem omgange. Den SHALL opdateres, når rollen ændres i dialogen. Markeringen er afledt og MUST NOT gemmes.

#### Scenario: Spring brugt i en anden omgang
- **WHEN** baneomgang 2 har tre tællende pladser med rondat – flik – strakt salto, og træneren tilføjer en tællende plads i omgang 3
- **THEN** viser rækken for springet en advarsel med Omg. 2 x3 i både gymnastens liste og under Hele holdet, og springet kan stadig vælges.

#### Scenario: Gentagelse inden for omgangen
- **WHEN** omgang 3 allerede har to tællende pladser med samme spring, og træneren tilføjer endnu en plads i omgang 3
- **THEN** viser rækken neutralt Brugt 2× i omgangen uden advarsel.

#### Scenario: Ekstra plads
- **WHEN** træneren skifter rollen til ekstra for et spring, der er brugt i omgang 2
- **THEN** ændres advarslen til en neutral oplysning om brugen i omgang 2.

#### Scenario: Redigering af den samme plads
- **WHEN** træneren redigerer den eneste plads med et spring i omgang 2
- **THEN** markeres springet ikke som brugt på grund af pladsen selv.

### Requirement: Holdoverblikket i springvalget er elegant og tilgængeligt
Hele holdet, holdantal og gentagelsesmarkering SHALL følge springvalgets rolige rækkeudtryk med faste kolonner på desktop og uden vandret overflow ved 390 px. Antal gymnaster SHALL være let at skimme. Gentagelse SHALL bruge appens eksisterende advarselssemantik og en form eller tekst, som ikke kun bæres af farve. Hver række SHALL have et tilgængeligt navn med spring, D, antal gymnaster eller sikkerhed og eventuel gentagelse. Overgangen fra holdets liste til den indsnævrede gymnastliste SHALL være rolig og respektere reduceret bevægelse.

#### Scenario: Skærmlæser læser rækken
- **WHEN** en skærmlæser fokuserer en række under Hele holdet med et spring brugt i omgang 2
- **THEN** oplæses fx »Strakt salto, D 0,80, 4 gymnaster kan, brugt i omgang 2 tre gange«.

#### Scenario: Mobil
- **WHEN** springvalget under Hele holdet åbnes ved 390 px
- **THEN** er navn, D, antal og markering synlige uden vandret rulning.
