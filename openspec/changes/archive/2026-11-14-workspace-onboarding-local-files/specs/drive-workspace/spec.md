# Spec Delta

## MODIFIED Requirements

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

### Requirement: Adskillelse af data og hemmeligheder
Den af brugeren valgte lokale fil eller Google Drive-fil SHALL være det autoritative lager for hold, gymnaster, færdigheder, vurderinger og planer. Vedvarende browserlager SHALL kun rumme de nødvendige forbindelses- og seneste-referencer, ikke gymnastdata eller automatisk gendannelseskladde. Access tokens MUST NOT ligge i datafilen, repoet, URL, buildartefakt eller almindelige logs; kun den beskrevne afgrænsede IndexedDB-lagring af aktuelt access token er tilladt for husket forbindelse. Refresh tokens og OAuth client secrets MUST NOT indgå i appen. Offentligt client-id, projektnummer og begrænset browser-API-nøgle SHALL skelnes fra brugercredentials. Kontoskift SHALL rydde tidligere kontos aktive Drive-data og kladder efter håndtering af ugemt arbejde, uden at slette en særskilt lokal fil.

#### Scenario: Kontoskift på delt computer
- **WHEN** træner A logger ud og B logger ind
- **THEN** vises A's Drive-arbejdsrum ikke automatisk for B uden B's egen filadgang, og B kan ikke gemme med A's session.

#### Scenario: Lokal fil uden Google
- **WHEN** træneren arbejder med en lokal fil uden at forbinde en Google-konto
- **THEN** opbevares arbejdsrumsdata i den valgte fil og den aktive sides hukommelse, mens ingen Google-token kræves eller gemmes.

## ADDED Requirements

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
