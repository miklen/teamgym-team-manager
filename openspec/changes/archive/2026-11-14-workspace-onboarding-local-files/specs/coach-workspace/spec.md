# Spec Delta

## MODIFIED Requirements

### Requirement: Tilstande er en del af designet
Appen SHALL have gennemarbejdede tom-, indlæsnings-, fejl-, læse-, konflikt- og ufuldstændige tilstande med konkrete næste handlinger. Ugemt arbejde SHALL beskyttes ved navigation, fil-/kontoskift og lukning, hvor browseren tillader det. Systemet MUST NOT vise »gemt«, før gemningen er bekræftet eller genkendt som gennemført.

Ved almindelig opstart SHALL en særskilt indlæsningsvisning dække læsning af lokale referencer, indtil startoverblikket er klar; seneste Drive-fil MUST NOT åbnes automatisk. Et direkte Drive-link SHALL fortsat dække kontokontrol og filhentning med en særskilt indlæsningsvisning uden et kortvarigt glimt af startsiden eller en automatisk OAuth-popup. Forbindelse til Google SHALL begynde ved brugerens Drive-valg og hedde »Forbind til Google Drive«. Udløbet adgang eller en fejlet filåbning SHALL afslutte indlæsningen og vise relevante næste handlinger.

#### Scenario: Langsom genåbning med gyldig forbindelse
- **WHEN** træneren åbner et direkte link til et husket Drive-arbejdsrum, og Google-kontokontrol og filhentning svarer langsomt
- **THEN** vises indlæsningsstatus frem til arbejdsfladen er klar; der kommer intet glimt af startside eller forbind-knap, og ingen ny OAuth-anmodning startes automatisk.

#### Scenario: Tomt gymnastkartotek
- **WHEN** et nyt arbejdsrum åbnes
- **THEN** forklares kort, hvordan en gymnast og et hold oprettes, og der vises ingen falske persondata eller færdige analyser.

#### Scenario: Almindeligt genbesøg
- **WHEN** træneren besøger appen uden direkte arbejdsrumslink og har tidligere åbnet filer
- **THEN** vises den senest åbnede fil som første og tydeligste fortsæt-handling med placering og næste skridt; øvrige filer er tilgængelige uden automatisk åbning af én Drive-fil.

## ADDED Requirements

### Requirement: Første skærm giver ét forståeligt valg ad gangen
Ved første besøg SHALL startoverblikket introducere appens formål med konkrete ord om hold, gymnaster, spring og træningsplaner, før det kræver et valg. Det SHALL give Start fra bunden og Åbn en gemt fil som umiddelbart forståelige handlinger uden at forudsætte kendskab til begrebet arbejdsrum. Åbn en gemt fil SHALL derefter lade træneren vælge Lokal fil eller Google Drive, før den relevante filvælger eller forbindelse åbnes. Når Seneste findes, SHALL den senest åbnede fil være første og visuelt primære fortsæt-handling. Andre filer SHALL være tilgængelige, mens Åbn en anden fil og Start nyt arbejdsrum forbliver synlige som sekundære valg. Annullering SHALL vende tilbage med bevaret kontekst. Et klik på en Drive-post SHALL føre gennem eventuelt nødvendigt Google-login og derefter åbne præcis den valgte fil; appen MUST NOT love tavst login, når Google kræver brugerhandling.

#### Scenario: Første besøg
- **WHEN** browseren ikke har tidligere arbejdsrumsreferencer
- **THEN** kan træneren starte en kladde eller vælge lokal fil eller Drive uden først at logge ind på Google.

#### Scenario: Seneste Drive-fil med udløbet adgang
- **WHEN** træneren vælger en Drive-post i Seneste efter tokenudløb
- **THEN** tilbydes det nødvendige genforbindelsesforløb med kontohint, og kun den valgte fil åbnes efter verificeret konto og filadgang.

### Requirement: Første indtryk forklarer dataplacering sandfærdigt
Forsiden SHALL i almindeligt dansk forklare, at redigering sker i browseren, at arbejdsrumsfilen gemmes på brugerens valgte lokale enhed eller Google Drive, og at appen ikke har en server, der opbevarer arbejdsrumsfiler. Den SHALL vise, at deling af en Drive-fil styres i Google Drive, uden at love, at appen kan kontrollere alle andre adgange til en lokal enhed eller Google-konto. En let tilgængelig uddybning SHALL forklare, at browseren kan huske filreferencer og, efter brugerens valg, en tidsbegrænset Google-forbindelse. Teksten MUST NOT påstå, at der slet ikke lagres data på enheden.

#### Scenario: Ikke-teknisk førstegangsbruger
- **WHEN** en ny træner ser startsiden
- **THEN** kan træneren forstå, hvor arbejdsrummet kan gemmes, og at Google er valgfrit, uden at læse tekniske lagringsbegreber.

### Requirement: Startoverblikket er en elegant del af appen
Startoverblikket SHALL følge produktets eksisterende typografi, rolige farvesystem og tydelige fokusstile. Ved første besøg SHALL indholdet være indrammet af tydelig luft mod vinduets kanter, så overskrift, handlinger og illustration danner en rolig og indbydende komposition. Ved genbesøg SHALL den seneste fil være den klare visuelle hovedhandling, øvrige filer læsbare, og status for lokal fil, Drive, manglende adgang og ugemt kladde præcis. Placeringstyper MUST NOT alene skelnes ved farve. Store generiske kortmosaikker, konkurrerende handlingsknapper og markedsføringsindhold foran startvalget MUST NOT dominere første skærm. Forløbet SHALL kunne bruges med tastatur, berøring, hjælpemidler, ved 390 og 1440 pixels og med reduceret bevægelse.

#### Scenario: Start på mobil
- **WHEN** en tilbagevendende træner åbner startoverblikket ved 390 pixels bredde med flere lange filnavne
- **THEN** kan den seneste fil vælges i første skærm, og andre filer, Start nyt arbejdsrum og Åbn en anden fil bruges uden vandret afklipning; fulde filnavne og placering er tilgængelige.

### Requirement: Arbejdsrum-dialogen prioriterer daglige filhandlinger
Dialogen SHALL vise den aktive fil og placering tydeligt og placere Gem som samt, ved Google-forbindelse, Afbryd forbindelse / skift konto øverst. Filåbning og eksport SHALL være samlet og lette at finde. Tekniske Drive-oplysninger og Seneste SHALL kunne foldes ud. AI-inddata-skillen SHALL ligge nederst, være lukket som udgangspunkt og kunne foldes ud med tastatur og hjælpemidler. Ingen af disse præsentationsændringer SHALL ændre fælles arbejdsrumsdata eller flettepolitik.

#### Scenario: Arbejdsrum på mobil med Google-forbindelse
- **WHEN** en træner åbner Arbejdsrum-dialogen ved 390 pixels bredde
- **THEN** kan Gem som og Afbryd forbindelse findes før filoplysninger og AI-inddata, mens AI-afsnittet er lukket, indtil træneren vælger det.

### Requirement: Lagring og eventuelt samtykke kontrolleres før brug
Appen SHALL have en verificeret oversigt over egen og indlejret tredjeparts brug af cookies og lignende browserlagring ved første besøg og ved valg af Google Drive. Teknologier, som ikke er strengt nødvendige for en tjeneste brugeren udtrykkeligt har valgt, MUST NOT aktiveres før et eventuelt krævet, frivilligt og informeret samtykke. Hvis samtykke kræves, SHALL både accept og afvisning være lige lette, valget kunne ændres senere, og det SHALL indgå diskret i Drive-forløbet uden at blokere lokal brug. Hvis kun teknisk nødvendig lagring anvendes, SHALL appen undlade et unødigt samtykkebanner og give klar information om lagringen. Appens valg MUST NOT udgives som styring af Googles egen dialog i Google-filvælgeren.

#### Scenario: Kun nødvendig lagring
- **WHEN** den verificerede lagergennemgang ikke finder samtykkekrævende teknologier
- **THEN** vises intet cookie-banner på forsiden, mens brugeren stadig kan læse, hvad appen husker på enheden.

#### Scenario: Samtykkekrævende teknologi i Drive-forløbet
- **WHEN** en teknologi kræver samtykke, og træneren vælger Google Drive
- **THEN** kan træneren acceptere eller afvise med lige tydelige handlinger, før teknologien aktiveres; lokal filbrug forbliver tilgængelig.
