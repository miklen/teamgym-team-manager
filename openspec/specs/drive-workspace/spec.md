# drive-workspace Specification

## Purpose

Gør et fælles trænerarbejdsrum tilgængeligt gennem Google-login og én datafil i en delt Drive-mappe, med synlige rettigheder og beskyttelse mod forældede gemninger.
## Requirements
### Requirement: Personlig Google-adgang
Systemet SHALL lade hver træner forbinde sin egen Google-konto gennem Google Identity Services' browser-tokenmodel og give adgang til de konkret valgte Drive-ressourcer. Alle Google-kald SHALL ske direkte fra browseren uden backend eller tokenproxy. Login alene MUST NOT give adgang til andre træneres data, og en Google-kontos mappeadgang MUST NOT forveksles med appens filautorisation.

#### Scenario: Anden træner åbner fælles fil
- **WHEN** træner B har redigeringsadgang til mappen og vælger den datafil, som træner A oprettede, gennem appens Google-filvælger
- **THEN** B kan læse og redigere samme arbejdsrum med sin egen konto uden at oprette et nyt kartotek.

#### Scenario: Manglende appadgang
- **WHEN** en træner følger et arbejdsrumslink uden at have autoriseret datafilen til appen
- **THEN** appen tilbyder valg/autorisation af filen og viser ikke fejlagtigt, at arbejdsrummet er tomt.

### Requirement: Google-forbindelsen huskes mellem besøg
Systemet SHALL bevare det aktuelle access token med udløbstid, scopes, kontoreference og seneste filreference i versionsmærket IndexedDB, når træneren har valgt at huske forbindelsen, og genbruge gyldig adgang efter genindlæsning eller browsergenstart. Udløb SHALL følge Googles `expires_in` med en kort sikkerhedsmargin og MUST NOT forlænges lokalt. Den faktiske konto og aktuelle filrettigheder SHALL kontrolleres, før en Drive-fil åbnes. Et almindeligt besøg SHALL vise startoverblikket med Seneste uden automatisk at hente den sidst brugte Drive-fil eller kræve Google-forbindelse for lokal brug; et direkte arbejdsrumslink SHALL fortsat kunne åbne den angivne fil efter verificeret adgang. Ved manglende browserlager SHALL en hukommelsesbaseret forbindelse stadig fungere med tydelig besked om, at den ikke kan huskes. Systemet MUST NOT gemme refresh tokens eller client secrets. Husket login SHALL ikke medføre vedvarende lagring af gymnastdata i browseren.

#### Scenario: Genåbn med gyldig adgang
- **WHEN** træneren genåbner appen med et endnu gyldigt gemt token og tidligere Drive-filer
- **THEN** vises Seneste uden automatisk filåbning; et klik på en Drive-fil kontrollerer konto og rettigheder og åbner dens aktuelle version uden unødigt login, samtykke eller Picker-valg.

#### Scenario: Direkte link med gyldig adgang
- **WHEN** træneren åbner et dybt link til en tidligere autoriseret Drive-fil med gyldigt gemt token
- **THEN** åbnes netop den fil med verificeret konto og aktuel filversion uden en mellemliggende startside.

#### Scenario: Browserlager er utilgængeligt
- **WHEN** IndexedDB ikke kan bruges
- **THEN** kan træneren stadig forbinde og arbejde i den aktuelle side, men appen oplyser, at forbindelsen ikke huskes efter lukning.

### Requirement: Udløbet adgang genoptages med genbrugt samtykke
Ved udløb eller 401 SHALL tokenet slettes og kontohint/filreference bevares. Systemet SHALL tilbyde én Forbind til Google Drive-handling, der fra brugerens klik anvender `requestAccessToken`, kendt `login_hint`, `include_granted_scopes:true` og `prompt:''`. Systemet MUST NOT tvinge consent eller select_account ved hvert besøg, love ubegrænset tavs tokenfornyelse eller åbne gentagne baggrundspopups. Google-krævet login/samtykke SHALL håndteres som en mulig tilstand. En genforbindelse SHALL bevare kladden og kontrollere filversion/rettighed igen før gemning.

#### Scenario: Tilbage efter tokenudløb
- **WHEN** træneren vender tilbage med udløbet token, tidligere samtykke og et aktivt Google-login
- **THEN** tilbydes Fortsæt med Google med husket konto/fil, og tidligere tilladelser genbruges, når Google tillader det, uden at appen selv kræver nyt samtykke.

#### Scenario: Popup afbrydes
- **WHEN** Google-popup blokeres eller lukkes uden et token
- **THEN** bevares kladden, problemet forklares, og træneren kan prøve igen uden en automatisk popup-løkke.

#### Scenario: Fornyelse ved klik tæt på udløb
- **WHEN** en forbundet træner klikker i appen, mens tokenet stadig er gyldigt men udløber inden for 10 minutter
- **THEN** anmoder appen fra netop dette klik om et nyt token med samme `requestAccessToken`-indstillinger. Klikket afventer ikke fornyelsen. Et nyt token for samme konto erstatter det gamle uden genindlæsning af arbejdsrummet. Afvisning, lukket popup eller anden konto bevarer det gyldige token og pauser nye forsøg i 2 minutter. Der åbnes aldrig popup uden klik.

### Requirement: Lokal afbrydelse og kontoskift rydder adgang
Afbryd forbindelse SHALL rydde lokalt gemt Google-token, konto og Drive-filreferencer samt aktive Drive-arbejdsdata efter håndtering af ugemt arbejde. Et åbent lokalt arbejdsrum SHALL ikke ryddes alene på grund af Google-afbrydelse. Andre appfaner SHALL underrettes og stoppe nye kald med den gamle adgang. En allerede afsendt upload SHALL håndteres som et særskilt muligt udfald. Tilbagekaldelse af Googles samtykke SHALL være en særskilt handling, så almindelig afbrydelse ikke fremtvinger nyt samtykke ved næste forbindelse.

#### Scenario: Afbryd i en anden fane
- **WHEN** træneren afbryder forbindelsen i fane A, mens fane B har en Drive-fil åben
- **THEN** ryddes den huskede forbindelse, og B kan ikke starte nye kald med det gamle token; et allerede afsendt uploadsvar kan ikke automatisk genoprette forbindelsen.

#### Scenario: Forsinket Google-svar efter afbrydelse
- **WHEN** et Google-tokenkald er startet, og træneren afbryder eller skifter konto, før svaret kommer
- **THEN** kasseres svaret fra den gamle forbindelsesgeneration og må hverken genoprette adgang i hukommelsen eller gemme det gamle token i IndexedDB.

#### Scenario: Lokal fil er aktiv ved afbrydelse
- **WHEN** en træner arbejder i en lokal fil og vælger Afbryd Google-forbindelse
- **THEN** bevares den lokale kladde og filadgang, mens den huskede Google-konto og dens Drive-referencer fjernes.

### Requirement: Opret og vælg arbejdsrum
Systemet SHALL kunne oprette en identificerbar, versionsmærket JSON-datafil i en mappe valgt af brugeren fra en allerede redigerbar kladde og SHALL kunne genåbne en eksisterende kompatibel datafil efter navn eller filreference. Et nyt arbejdsrum MUST NOT kræve oprettelse af en Drive-fil, før træneren kan redigere. En Drive-fils stabile identitet SHALL være afgørende; filnavne er ikke unikke. Mappen og filen SHALL være synlige i arbejdsrummets indstillinger, når arbejdsrummet er gemt på Drive.

#### Scenario: Nyt arbejdsrum
- **WHEN** træneren redigerer en ny kladde, vælger Gem, forbinder Google og vælger en skrivbar delt mappe og et navn
- **THEN** oprettes én datafil med hele kladden, formatversion og arbejdsrumsidentitet, og filen kan vælges fra en anden autoriseret konto.

#### Scenario: To filer med samme navn
- **WHEN** to datafiler har samme navn
- **THEN** kan brugeren skelne dem med mappe og filreference, og appen gemmer i præcis den valgte fil.

### Requirement: Åbn og opret med Google Drive-link
Systemet SHALL tilbyde Åbn fra link ved den forbundne startside og under arbejdsrummets indstillinger. Et gyldigt Google Drive-fillink SHALL åbne en kompatibel arbejdsrumsfil med stabil filidentitet; et mappelink SHALL åbne filvalget inde i den angivne mappe. Oprettelsesdialogen SHALL tilbyde et valgfrit mappelink som alternativ til manuel mappenavigation. Links SHALL kun bruges som validerede referencer til den faste Drive API-origin, inklusive en eventuel resource key. Den mindst mulige eksisterende OAuth-adgang SHALL bevares; et link MUST NOT behandles som tilladelse til filen.

#### Scenario: Direkte link til eksisterende arbejdsrum
- **WHEN** træneren indsætter et fillink, som kontoen og appen allerede har adgang til
- **THEN** åbnes den validerede arbejdsrumsfil uden manuel filnavigation, og filreferencen kan huskes ved genåbning.

#### Scenario: Google kræver bekræftelse af linkets fil
- **WHEN** filens metadata afvises med manglende adgang eller ikke fundet
- **THEN** kan Google-filvælgeren vise netop linkets fil til bekræftelse uden bredere OAuth-adgang; en anden fil accepteres ikke som bekræftelse af linket.

#### Scenario: Mappelink ved oprettelse
- **WHEN** træneren angiver navn og et gyldigt mappelink og eventuelt bekræfter mappen hos Google
- **THEN** kontrolleres oprettelsesadgang, og én ny arbejdsrumsfil oprettes i den angivne mappe uden ændring af eksisterende filer; annullering bevarer formularens navn og link.

#### Scenario: Ugyldigt link eller mislykket åbning
- **WHEN** træneren annullerer kassation af en ugemt kladde, annullerer Google-valget eller forsøger at åbne et ugyldigt link eller en inkompatibel fil
- **THEN** bevares det åbne arbejdsrum og den ugemte kladde; fejl forklares, og der oprettes ingen erstatningsfil.

### Requirement: Drive-rettigheder er autoritative
Systemet SHALL kontrollere den aktuelle kontos læse-/skriveadgang ved åbning og gemning. Læseadgang SHALL give en tydelig læsetilstand. Ophævet adgang, slettet fil og afbrudt login SHALL vises uden at overskrive data eller skabe en erstatningsfil.

#### Scenario: Læser uden skriverettighed
- **WHEN** en træner åbner en fil med læseadgang alene
- **THEN** kan træneren se kartotek og analyser, men redigering/gemning er utilgængelig med en forståelig forklaring.

#### Scenario: Rettigheder fjernes under arbejdet
- **WHEN** en skrivende træner mister adgang før gemning
- **THEN** afvises gemningen, og det lokale arbejde bevares uden beskeden »gemt«.

### Requirement: Konfliktbeskyttet gemning
Systemet MUST knytte en gemning til den indlæste filversion og MUST afvise forældede gemninger. To appsessioner, der gemmer samme basisversion, MUST NOT begge kunne overskrive filen. Konfliktkontrollen MUST omfatte kapløbet mellem kontrol og skrivning ved en atomisk betinget Drive-indholdsopdatering direkte fra browseren. Den konkrete API-/uploadtype SHALL afprøves efter T01 i reference/github-pages-drive.md. Efter brugerens udtrykkelige beslutning 25. oktober 2026 MAY implementering og første publicering fortsætte med én konto, mens brugeren udfører live test med trænerteamets separate konti i produktion. Den udskudte test MUST registreres som udestående og MUST NOT betegnes bestået. En ekstra versionslæsning, browserlås, låsefelt i JSON eller ubetinget upload MUST NOT erstatte betinget skrivning. Backend MUST NOT indføres som fallback.

#### Scenario: En anden træner har gemt
- **WHEN** A og B har indlæst version 7, A gemmer version 8, og B forsøger at gemme sit arbejde baseret på version 7
- **THEN** bevares A's data på Drive, B får en konfliktbesked og B's lokale arbejde bevares.

#### Scenario: Samme tidspunkt for to gemninger
- **WHEN** to sessioner sender forskellige ændringer med samme basisversion samtidig
- **THEN** accepteres højst én ændring, og den anden session får konflikt uden tab af dens lokale kladde.

#### Scenario: Ændring efter forkontrol
- **WHEN** A har kontrolleret sin basis, B gemmer en nyere version, og A derefter uploader på den gamle basis
- **THEN** afviser Drive A's betingede upload uden at ændre B's data, og A får konflikt med bevaret kladde.

#### Scenario: Betinget upload er ikke bevist
- **WHEN** den konkrete media-upload/CORS-test ikke kan dokumentere atomisk afvisning af en gammel filrevision
- **THEN** beskrives verifikationen som udestående, og den aftalte live test med trænerteamet udføres efter første publicering; en faktisk påvist accept af gammel betingelse blokerer den defekte skrivevej, og appen må ikke bruge ubetinget upload eller en skjult backend.

### Requirement: Bevidst håndtering af konflikt
Ved en nyere fil SHALL brugeren kunne gennemgå ændringer siden sin fælles basis uden at kassere kladden. Systemet SHALL tilbyde trevejssammenligning efter workspace-merge, bevidst kombination af forenelige ændringer og valg pr. faktisk konflikt. Brugeren SHALL fortsat kunne bevare en lokal kopi, indlæse den nyeste fil efter bekræftelse af kassation eller fortsætte med at gennemse kladden. Automatisk erstatning af kladden, automatisk baggrundsfletning og ubetinget overskrivning MUST NOT forekomme. Anvendelse af en gennemgået fletning SHALL kun skabe en lokal kladde; gemning på Drive kræver en særskilt handling med normal rettigheds- og konfliktkontrol.

#### Scenario: Genindlæsning efter konflikt
- **WHEN** en bruger vælger at genindlæse, mens der findes lokale ændringer
- **THEN** beskrives tabet af kladden, og først efter brugerens valg erstattes den af den nyeste fil.

#### Scenario: Nyeste fil hentes til gennemsyn
- **WHEN** brugeren vælger Gennemgå ændringer
- **THEN** hentes den nyeste fil til sammenligning, mens basis og lokal kladde bevares, og der sendes ingen upload.

#### Scenario: Fletning anvendes
- **WHEN** brugeren har afgjort eventuelle konflikter og bekræfter den gyldige samlede kladde
- **THEN** bliver den gennemgåede nyeste fil kladdens revisionsbasis; resultatet vises som ugemt, hvis det afviger fra denne fil, ellers som uændret, uden Drive-upload.

### Requirement: Sandfærdig gemmetilstand og fejlgenopretning
Systemet SHALL vise mindst indlæser, uændrede data, lokale ændringer, gemmer, gemt, konflikt og fejl. Afbrudt netværk, udløbet session og ukendt resultat af en upload SHALL bevare arbejdet. Gentaget forespørgsel efter et uklart uploadsvar MUST NOT skabe ekstra data eller fejlagtigt hævde en konflikt mod brugerens egen allerede gennemførte gemning.

#### Scenario: Upload lykkes men svaret mistes
- **WHEN** en gemning er gennemført på Drive, men forbindelsen afbrydes før svaret når browseren
- **THEN** kan appen genkende den samme gemmeoperation efter genforbindelse og vise det korrekte resultat uden dobbeltgemning.

#### Scenario: Filen ændres mens siden er åben
- **WHEN** appen konstaterer en nyere filversion ved genaktivering eller versionskontrol
- **THEN** varsles brugeren; lokale ændringer erstattes ikke stiltiende.

#### Scenario: Redigering fortsætter under upload
- **WHEN** en snapshot af kladden sendes til gemning, og træneren foretager nye ændringer før svaret kommer
- **THEN** markeres kun den afsendte snapshot som gemt; nye ændringer bevares og vises fortsat som ugemte.

#### Scenario: Genforsøg efter endnu en træners gemning
- **WHEN** appen genkender en gennemført operation ved genforsøg, men filen siden er ændret af en anden træner
- **THEN** vises den første gemning som gennemført og den efterfølgende ændring som en nyere fil; den gamle kladde får ikke stiltiende tilladelse til at overskrive den nye filversion.

### Requirement: Validering og kompatibilitet af datafil
Systemet MUST validere format, formatversion, identiteter og referencer før indlæsning og gemning. En ukendt nyere formatversion eller en beskadiget fil MUST NOT omfortolkes som tom eller overskrives. Arbejdsrumsformat 5 SHALL bevare følgende gennem gemning, genåbning og eksport: alle scenarier med navne og rækkefølge, tre omgange pr. scenarie, deltagerroller, springvalg, ambitioner med planlagt spring, planlagte modtagninger med grad, element og springreference, prioriterede reserver, arveophav, egne vurderinger, accepterede relationer og individuelle fravalg. Valideringen SHALL også omfatte scenarier, som ikke er åbne. Følgende SHALL afvises uden ændring af det åbne arbejdsrum: cyklisk arv, ukendte registreringsreferencer, kilder fra andre gymnaster, en modtagning på en plads uden spring, en modtagning på en ambition, en modtagning i rytme, et elementvalg uden for seriens elementer, en plads uden både gymnast og planlagt spring, en plads med både gymnast og planlagt spring, et planlagt spring med ukendt reference eller fra en anden disciplin og en reserve uden gymnast.

Format 1, 2, 3 og 4 SHALL tilbydes eksplicit migration til en lokal format 5-kladde. Annullering SHALL bevare den eksisterende session. Migration SHALL bevare alle eksisterende identiteter, vurderinger, datoer, noter, navne, arkiveringer, forbindelsesbekræftelser, regelbindinger og planreferencer. Format 1-vurderinger SHALL fortsat markeres som egne, og format 2's arveophav, relationer og fravalg SHALL bevares. Ved migration fra format 1 og 2 SHALL hver eksisterende disciplins tre omgange placeres i ét nyt scenarie med navnet Plan A og tomme reservelister. Eksisterende plan-, omgangs- og pladsidentiteter SHALL bevares. Kun nye scenarier og nye data SHALL få nye identiteter. Migration fra format 3 SHALL bevare alle scenarier og reserver og give alle pladser ingen modtagning uden nye identiteter. Migration fra format 4 SHALL bevare alle scenarier, reserver og modtagninger og give alle pladser intet planlagt spring uden nye identiteter. Migrationerne SHALL være deterministiske, så en migreret format 3- eller 4-basis kan bruges i fletning. Originalens bytes på Drive SHALL bevares indtil en bevidst, rettighedskontrolleret og konfliktbeskyttet gemning på den faktisk indlæste revisionsbasis. Migration MUST NOT ændre Google-forbindelsens særskilte lagerformat eller udløse automatisk upload. Træneren SHALL kunne eksportere originalens uændrede bytes og SHALL før opgradering informeres om, at ældre apps ikke kan åbne format 5. Format 5 MUST NOT automatisk nedkonverteres med tab af scenarier, reserver, modtagninger eller ambitioner.

#### Scenario: Forkert eller nyere fil
- **WHEN** brugeren vælger almindelig JSON, ugyldig JSON eller et nyere ikke-understøttet arbejdsrumsformat
- **THEN** vises en præcis fejl, og filens indhold ændres ikke.

#### Scenario: Ældre app møder format 5
- **WHEN** en app, der kun understøtter format 4, åbner en format 5-fil
- **THEN** afvises filen som et nyere format uden overskrivning.

#### Scenario: Migration uden skrivning
- **WHEN** en format 1-fil åbnes, og træneren accepterer migration
- **THEN** oprettes en lokal format 5-kladde med egne vurderinger, uændrede eksisterende id'er og Plan A i hver disciplin. Drive-filen er stadig format 1, indtil træneren vælger Gem på Drive.

#### Scenario: Migration af format 3
- **WHEN** en format 3-fil med flere scenarier og reserver opgraderes lokalt
- **THEN** bevares alle scenarier, omgange, pladser, reserver og id'er, og ingen plads har en modtagning eller et planlagt spring. Der sker ingen upload.

#### Scenario: Migration af format 4
- **WHEN** en format 4-fil med scenarier, reserver og planlagte modtagninger opgraderes lokalt
- **THEN** bevares alle scenarier, omgange, pladser, reserver, modtagninger og id'er, og ingen plads er en ambition. Der sker ingen upload.

#### Scenario: Migration annulleres
- **WHEN** træneren annullerer den tilbudte migration fra format 1, 2, 3 eller 4
- **THEN** bevares det hidtil åbne arbejdsrum og en eventuel ugemt kladde uden erstatningsfil eller upload.

#### Scenario: Konflikt efter migration
- **WHEN** en anden træner gemmer en nyere fil efter indlæsning og før gemning af den migrerede kladde
- **THEN** afvises den forældede gemning, og både den nyere Drive-fil og den lokale migrerede kladde bevares.

#### Scenario: Gennemgang med migreret basis
- **WHEN** træneren har en lokal kladde migreret fra format 4, og en anden træner har gemt filen som format 5 med ændringer
- **THEN** sammenlignes den deterministisk migrerede basis med den lokale kladde og den nyere format 5-fil efter de almindelige fletteregler.

#### Scenario: Arv overlever filrundtur
- **WHEN** en format 5-fil med arvede børn, egne vurderinger og et fravalgt fundament gemmes og genåbnes
- **THEN** bevares disse valg. Ændring af en parent opdaterer fortsat kun aktive børn uden egen vurdering i alle relevante scenarier og reserver.

#### Scenario: Modtagning overlever filrundtur
- **WHEN** en format 5-fil med planlagte modtagninger i flere scenarier gemmes og genåbnes
- **THEN** bevares grad, element og springreference på de samme pladser.

#### Scenario: Ambition overlever filrundtur
- **WHEN** en format 5-fil med ambitioner i flere scenarier gemmes og genåbnes
- **THEN** bevares ambitionernes planlagte spring, rolle og position på de samme pladser.

#### Scenario: Ugyldig ambition
- **WHEN** en importeret fil har en plads uden både gymnast og planlagt spring eller en ambition med modtagning
- **THEN** afvises filen med en forståelig fejl uden delvis indlæsning eller tab af en eksisterende kladde.

#### Scenario: Ugyldig arvekilde
- **WHEN** en importeret fil indeholder en kilde fra en anden gymnast eller en cyklus
- **THEN** afvises filen med en forståelig fejl uden delvis indlæsning eller tab af en eksisterende kladde.

#### Scenario: Migration af format 2
- **WHEN** en format 2-fil med arvede vurderinger, egne vurderinger og fravalg opgraderes lokalt
- **THEN** bevares disse data og alle seks eksisterende omgange i de to Plan A-scenarier med tomme reservelister, uden modtagninger og uden ambitioner. Der sker ingen upload.

#### Scenario: Eksport af original
- **WHEN** træneren eksporterer originalen fra migrationsdialogen for en format 1-, 2-, 3- eller 4-fil
- **THEN** svarer eksportens bytes til den faktisk indlæste original, og hverken Drive-filen eller den eksisterende kladde ændres.

### Requirement: Adskillelse af data og hemmeligheder
Den af brugeren valgte lokale fil eller Google Drive-fil SHALL være det autoritative lager for hold, gymnaster, færdigheder, vurderinger og planer. Vedvarende browserlager SHALL kun rumme de nødvendige forbindelses- og seneste-referencer, ikke gymnastdata eller automatisk gendannelseskladde. Access tokens MUST NOT ligge i datafilen, repoet, URL, buildartefakt eller almindelige logs; kun den beskrevne afgrænsede IndexedDB-lagring af aktuelt access token er tilladt for husket forbindelse. Refresh tokens og OAuth client secrets MUST NOT indgå i appen. Offentligt client-id, projektnummer og begrænset browser-API-nøgle SHALL skelnes fra brugercredentials. Kontoskift SHALL rydde tidligere kontos aktive Drive-data og kladder efter håndtering af ugemt arbejde, uden at slette en særskilt lokal fil.

#### Scenario: Kontoskift på delt computer
- **WHEN** træner A logger ud og B logger ind
- **THEN** vises A's Drive-arbejdsrum ikke automatisk for B uden B's egen filadgang, og B kan ikke gemme med A's session.

#### Scenario: Lokal fil uden Google
- **WHEN** træneren arbejder med en lokal fil uden at forbinde en Google-konto
- **THEN** opbevares arbejdsrumsdata i den valgte fil og den aktive sides hukommelse, mens ingen Google-token kræves eller gemmes.

### Requirement: Hele scenariesamlingen gemmes samlet
Gem på Drive og eksport af kladde SHALL omfatte alle holdets scenarier i begge discipliner, inklusive deres reserver, uanset hvilken plan træneren ser. Et scenarieskift SHALL ikke i sig selv starte en gemning. Normal rettighedskontrol, revisionsbasis, håndtering af konflikt og ukendt uploadresultat SHALL gælde den samlede fil. Fortsat redigering under upload SHALL kun markere den afsendte samling som gemt; nyere lokale ændringer SHALL bevares som ugemte.

#### Scenario: Gem fra Plan B
- **WHEN** træneren redigerer Plan A og Plan B samt et trampetscenarie, står på Plan B og gemmer
- **THEN** kan alle tre redigerede scenarier genåbnes med deres indhold og reserveprioriteter uden tab af de øvrige scenarier.

#### Scenario: Ny ændring under upload
- **WHEN** Plan A indgår i en afsendt gemning, og træneren redigerer Plan B før svaret kommer
- **THEN** bevares Plan B's nye ændringer som ugemte efter det bekræftede uploadsvar.

### Requirement: Ugyldige scenariestrukturer afvises samlet
Filen SHALL have mindst ét scenarie pr. hold og springdisciplin, præcis tre omgange pr. scenarie, gyldige navne og entydige identiteter. Dublerede scenarienavne uden forskel på store/små bogstaver inden for samme holds disciplin SHALL afvises. Deltager- og reservepladser SHALL referere til eksisterende gymnaster og, ved valgt spring, gymnastens egen registrering i korrekt disciplin. Samme gymnast på flere pladser samlet blandt deltagere og reserver i samme omgang SHALL afvises. Eksisterende referencer til fjernede eller flyttede gymnaster og fjernede færdigheder SHALL kunne bevares som utilgængelige med diagnoser. Ukendte felter eller data, der er mærket som en gammel formatversion men indeholder den nye scenariestruktur, MUST NOT stiltiende accepteres eller bortfiltreres.

#### Scenario: Fejl i en lukket plan
- **WHEN** en format 3-fil har en gyldig Plan A, men Plan B har kun to omgange eller en reserve med en ukendt registrering
- **THEN** afvises hele filen med forståelig fejl uden delvis indlæsning eller tab af den eksisterende kladde.

#### Scenario: Blandet format
- **WHEN** en fil er mærket format 2, men indeholder scenarier og reserver i den nye struktur
- **THEN** afvises filen frem for at strippe data og tilbyde en tilsyneladende gyldig migration.

#### Scenario: Historisk reserve bevares
- **WHEN** en gyldig fil refererer til en kendt gymnast, som siden er flyttet fra holdet eller fjernet, i et lukket scenaries reserveliste
- **THEN** kan filen genåbnes uden sletning af referencen, og reserven vises som utilgængelig frem for som en gyldig mulighed.

### Requirement: Gennemgang er bundet til præcise versioner
En gennemgang SHALL bindes til fil- og arbejdsrumsidentitet, forbindelses-/sessionskontekst, fælles basis, lokal kladde og den nyeste fils faktisk læste revisionsbasis. Ændret lokal kladde, nyere ekstern fil eller ændret kontekst SHALL gøre en berørt gennemgang forældet. Før anvendelse SHALL den aktuelle eksterne basis kontrolleres igen; en forældet gennemgang MUST NOT anvendes. En ændring mellem denne kontrol og senere gemning SHALL fortsat afvises af den betingede upload. Fletning MUST NOT fjerne skrivebeskyttelsen ved at gemme uden revisionsbetingelse.

#### Scenario: Lokal redigering efter forhåndsvisning
- **WHEN** kladden ændres, efter sammenligningen er beregnet
- **THEN** kan de gamle valg ikke anvendes på den nye kladde; ny gennemgang kræves, og de nye lokale ændringer bevares.

#### Scenario: En tredje gemning
- **WHEN** en anden træner gemmer igen efter gennemgangen og før kontrollen ved anvendelse
- **THEN** afvises anvendelsen som forældet med bevaret kladde og besked om at gennemgå den nyeste fil igen.

#### Scenario: Kapløb efter anvendelse
- **WHEN** en ny ekstern gemning sker efter kontrol/anvendelse og før brugerens gemning
- **THEN** afviser den betingede upload den forældede basis uden at ændre den eksterne fil eller miste den flettede kladde.

#### Scenario: Adgang bortfalder under gennemgang
- **WHEN** konto, filkontekst eller skriveadgang ændres, mens et svar afventes
- **THEN** kan svaret ikke anvende en gammel gennemgang eller genoprette gammel adgang; lokal kladde bevares efter de gældende regler for afbrydelse og eksport.

### Requirement: Ukendt uploadresultat afstemmes før fletning
Systemet SHALL afstemme en uafklaret tidligere gemmeoperation, før en gennemgang kan anvendes. En genkendt egen gemning MUST NOT fremstilles som en anden træners ændring. Hvis egen gemning er bekræftet og en anden session derefter har gemt, SHALL den faktisk bekræftede egen snapshot bruges som sammenligningsbasis for fortsatte lokale ændringer. Hvis udfaldet ikke kan afklares, SHALL anvendelse blokeres med bevaret kladde frem for at opfinde en fælles basis. Afsluttede og forældede operationer MUST NOT genbruges til upload af en ny flettet kladde.

#### Scenario: Mistet svar uden efterfølgende ekstern ændring
- **WHEN** en upload er gennemført, svaret mistes, og samme operation genkendes ved hentning til gennemgang
- **THEN** afstemmes den som egen gemning, og eventuelle lokale ændringer efter det afsendte snapshot bevares uden en falsk konflikt eller dobbeltupload.

#### Scenario: Egen gemning efterfulgt af ekstern gemning
- **WHEN** egen gennemførte operation genkendes i en nyere fil, og kladden er redigeret videre efter det afsendte snapshot
- **THEN** sammenlignes de fortsatte lokale ændringer og de efterfølgende eksterne ændringer med det bekræftede eget snapshot som fælles basis; allerede gemt arbejde fremstilles ikke som nye lokale ændringer.

#### Scenario: Netværksfejl under afstemning
- **WHEN** den nyeste fil ikke kan læses tilstrækkeligt til at afklare en uafsluttet operation
- **THEN** forbliver anvendelse blokeret, arbejdet kan eksporteres, og der startes ingen ny upload som del af gennemgangen.

### Requirement: Gem som skifter til en ny Drive-fil
Gem som SHALL kunne oprette en ny Drive-fil med hele den aktuelle, validerede kladde og derefter gøre den nye fil til aktivt arbejdsrum uden at ændre kildefilen. Oprettelsen SHALL kræve valgt mappe, gyldig konto og skriverettighed. Annullering eller et uklart oprettelsesresultat MUST NOT slette kladden eller stiltiende oprette flere filer ved genforsøg.

#### Scenario: Lokal kladde deles via Drive
- **WHEN** træneren vælger Gem som til en ny Drive-fil fra et lokalt arbejdsrum
- **THEN** er den nye Drive-fil aktiv efter bekræftet oprettelse, mens den lokale kildefil forbliver uændret.

### Requirement: Gem som kan erstatte en præcist valgt Drive-fil
Gem som SHALL kunne lade træneren vælge en eksisterende Drive-fil ved dens stabile filidentitet og efter en tydelig advarsel vælge Overskriv eller, når en gyldig fælles basis findes for netop denne kildefil, Gennemgå og flet. Samme filnavn alene MUST NOT vælge målfil. Før Overskriv SHALL appen vise den valgte fil og konsekvensen af at erstatte dens indhold, kontrollere aktuel læse- og skriveadgang og læse dens aktuelle version. Selve skrivningen MUST være betinget af denne version; en nyere version mellem gennemgang og upload SHALL afvises uden tab af lokal kladde eller den nyere Drive-fil. Uklart uploadsvar SHALL afstemmes før genforsøg. Hvis målfilens arbejdsrumsidentitet er forskellig, SHALL advarslen forklare, at dens eksisterende arbejdsrum erstattes, og Gennemgå og flet MUST NOT tilbydes.

#### Scenario: Samme navn på to Drive-filer
- **WHEN** træneren vælger Gem som og to Drive-filer hedder det samme
- **THEN** skal træneren vælge den tilsigtede fil, og kun denne fil kan blive erstattet.

#### Scenario: Bevidst overskrivning
- **WHEN** træneren vælger en eksisterende Drive-fil og bekræfter Overskriv efter at have set dens aktuelle identitet og advarsel
- **THEN** kan den lokale kladde erstatte filens indhold med normal rettigheds- og versionskontrol, mens den lokale kildefil bevares.

#### Scenario: Anden træner gemmer efter advarslen
- **WHEN** en anden træner gemmer en nyere version af målfilen efter den lokale træners gennemgang men før upload
- **THEN** afvises overskrivningen, den nyere Drive-fil bevares, og den lokale kladde kan stadig eksporteres eller gennemgås.

#### Scenario: Ingen kendt fælles basis
- **WHEN** en lokal fil uden verificeret basis fra den præcise målfil vælges til Gem som
- **THEN** kan træneren oprette en ny Drive-fil eller bevidst overskrive en valgt eksisterende fil, men appen tilbyder ikke en påstået trevejsfletning.

### Requirement: Seneste Drive-filer følger konto og adgang
Seneste SHALL kunne vise tidligere åbne Drive-filer med forståeligt navn og placering uden at lagre arbejdsrumsindhold i browseren. En post SHALL være knyttet til den verificerede Google-konto og præcis filreference; åbning SHALL kontrollere aktuel kontoadgang, filrettighed og version. Afbrydelse SHALL rydde den kontos lokalt huskede Drive-poster efter håndtering af ugemt arbejde. En udløbet, slettet eller utilgængelig fil MUST NOT vises som tom eller erstattes automatisk; posten SHALL kunne fjernes uden at slette Drive-filen.

#### Scenario: Udløbet forbindelse fra Seneste
- **WHEN** træneren vælger en husket Drive-fil efter tokenudløb
- **THEN** tilbydes et brugerstartet Google-forløb, og filen åbnes først efter verificeret konto og adgang.

#### Scenario: Filadgang er fjernet
- **WHEN** en Drive-post vælges, men kontoen ikke længere har adgang
- **THEN** forklares den manglende adgang, ingen anden fil åbnes, og brugeren kan fjerne posten fra Seneste.
