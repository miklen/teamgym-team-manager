# Spec Delta

## Purpose

Gør et fælles trænerarbejdsrum tilgængeligt gennem Google-login og én datafil i en delt Drive-mappe, med synlige rettigheder og beskyttelse mod forældede gemninger.

## ADDED Requirements

### Requirement: Personlig Google-adgang
Systemet SHALL lade hver træner forbinde sin egen Google-konto gennem Google Identity Services' browser-tokenmodel og give adgang til de konkret valgte Drive-ressourcer. Alle Google-kald SHALL ske direkte fra browseren uden backend eller tokenproxy. Login alene MUST NOT give adgang til andre træneres data, og en Google-kontos mappeadgang MUST NOT forveksles med appens filautorisation.

#### Scenario: Anden træner åbner fælles fil
- **WHEN** træner B har redigeringsadgang til mappen og vælger den datafil, som træner A oprettede, gennem appens Google-filvælger
- **THEN** B kan læse og redigere samme arbejdsrum med sin egen konto uden at oprette et nyt kartotek.

#### Scenario: Manglende appadgang
- **WHEN** en træner følger et arbejdsrumslink uden at have autoriseret datafilen til appen
- **THEN** appen tilbyder valg/autorisation af filen og viser ikke fejlagtigt, at arbejdsrummet er tomt.

### Requirement: Google-forbindelsen huskes mellem besøg
Systemet SHALL bevare det aktuelle access token med udløbstid, scopes, kontoreference og seneste filreference i versionsmærket IndexedDB og genbruge gyldig adgang efter genindlæsning eller browsergenstart. Udløb SHALL følge Googles `expires_in` med en kort sikkerhedsmargin og MUST NOT forlænges lokalt. Den faktiske konto og aktuelle filrettigheder SHALL kontrolleres ved genåbning. Ved manglende browserlager SHALL en hukommelsesbaseret forbindelse stadig fungere med tydelig besked om, at den ikke kan huskes. Systemet MUST NOT gemme refresh tokens eller client secrets. Husket login SHALL ikke medføre vedvarende lagring af gymnastdata.

#### Scenario: Genåbn med gyldig adgang
- **WHEN** træneren lukker og genåbner browseren, mens det gemte token stadig er gyldigt
- **THEN** genåbnes det huskede arbejdsrum med samme verificerede konto og aktuelle filversion uden nyt login, samtykke eller Picker-valg.

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

### Requirement: Lokal afbrydelse og kontoskift rydder adgang
Afbryd forbindelse SHALL rydde lokalt gemt token, konto og filreferencer samt aktive arbejdsdata efter håndtering af ugemt arbejde. Andre appfaner SHALL underrettes og stoppe nye kald med den gamle adgang. En allerede afsendt upload SHALL håndteres som et særskilt muligt udfald. Tilbagekaldelse af Googles samtykke SHALL være en særskilt handling, så almindelig afbrydelse ikke fremtvinger nyt samtykke ved næste forbindelse.

#### Scenario: Afbryd i en anden fane
- **WHEN** træneren afbryder forbindelsen i fane A, mens fane B er åben
- **THEN** ryddes den huskede forbindelse, og B kan ikke starte nye kald med det gamle token; et allerede afsendt uploadsvar kan ikke automatisk genoprette forbindelsen.

#### Scenario: Forsinket Google-svar efter afbrydelse
- **WHEN** et Google-tokenkald er startet, og træneren afbryder eller skifter konto, før svaret kommer
- **THEN** kasseres svaret fra den gamle forbindelsesgeneration og må hverken genoprette adgang i hukommelsen eller gemme det gamle token i IndexedDB.

### Requirement: Opret og vælg arbejdsrum
Systemet SHALL oprette en identificerbar, versionsmærket JSON-datafil i en mappe valgt af brugeren og SHALL kunne genåbne en eksisterende kompatibel datafil efter navn eller filreference. En fils stabile identitet SHALL være afgørende; filnavne er ikke unikke. Mappen og filen SHALL være synlige i arbejdsrummets indstillinger.

#### Scenario: Nyt arbejdsrum
- **WHEN** brugeren vælger en skrivbar delt mappe og opretter et arbejdsrum
- **THEN** oprettes én datafil i den mappe med tomme samlinger, formatversion og arbejdsrumsidentitet, og filen kan vælges fra en anden autoriseret konto.

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
Ved konflikt SHALL brugeren kunne bevare en lokal kopi af sit arbejde, indlæse den nyeste fil efter bekræftelse af kassation eller fortsætte med at gennemse kladden. Automatisk sammenfletning og en automatisk »overskriv alligevel«-handling MUST NOT forekomme.

#### Scenario: Genindlæsning efter konflikt
- **WHEN** en bruger vælger at genindlæse, mens der findes lokale ændringer
- **THEN** beskrives tabet af kladden, og først efter brugerens valg erstattes den af den nyeste fil.

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
Systemet MUST validere format, formatversion, identiteter og referencer før indlæsning/gemning. En ukendt nyere formatversion eller beskadiget fil MUST NOT omfortolkes som tom eller overskrives. Understøttede datamigreringer SHALL være eksplicitte og bevare originalen indtil en bevidst gemning.

#### Scenario: Forkert eller nyere fil
- **WHEN** brugeren vælger almindelig JSON, ugyldig JSON eller et nyere ikke-understøttet arbejdsrumsformat
- **THEN** vises en præcis fejl, og filens indhold ændres ikke.

### Requirement: Adskillelse af data og hemmeligheder
Google Drive SHALL være det autoritative lager for hold, gymnaster, færdigheder, vurderinger og planer. Access tokens MUST NOT ligge i datafilen, repoet, URL, buildartefakt eller almindelige logs; kun den beskrevne afgrænsede IndexedDB-lagring af aktuelt access token er tilladt for husket forbindelse. Refresh tokens og OAuth client secrets MUST NOT indgå i appen. Offentligt client-id, projektnummer og begrænset browser-API-nøgle SHALL skelnes fra brugercredentials. Kontoskift SHALL rydde tidligere kontos aktive arbejdsdata og kladder efter håndtering af ugemt arbejde.

#### Scenario: Kontoskift på delt computer
- **WHEN** træner A logger ud og B logger ind
- **THEN** vises A's arbejdsrum ikke automatisk for B uden B's egen filadgang, og B kan ikke gemme med A's session.
