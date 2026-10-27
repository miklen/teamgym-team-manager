# Spec Delta

## MODIFIED Requirements

### Requirement: Validering og kompatibilitet af datafil
Systemet MUST validere format, formatversion, identiteter og referencer før indlæsning/gemning. En ukendt nyere formatversion eller beskadiget fil MUST NOT omfortolkes som tom eller overskrives. Arbejdsrumsformat 3 SHALL bevare alle scenarier, deres navne og rækkefølge, tre omgange pr. scenarie, deltagerroller, springvalg og prioriterede reserver samt arveophav, egne vurderinger, accepterede relationer og individuelle fravalg gennem gemning, genåbning og eksport. Valideringen SHALL omfatte også scenarier, som ikke er åbne. Cyklisk arv, ukendte registreringsreferencer og kilder fra andre gymnaster SHALL afvises uden ændring af det åbne arbejdsrum.

Format 1 og 2 SHALL tilbydes eksplicit migration til en lokal format 3-kladde; annullering SHALL bevare den eksisterende session. Migration SHALL bevare alle eksisterende identiteter, vurderinger, datoer, noter, navne, arkiveringer, forbindelsesbekræftelser, regelbindinger og planreferencer. Format 1-vurderinger SHALL fortsat markeres som egne, og format 2's arveophav, relationer og fravalg SHALL bevares. Hver eksisterende disciplins tre omgange SHALL placeres i ét nyt scenarie med navnet Plan A og tomme reservelister. Eksisterende plan-, omgangs- og pladsidentiteter SHALL bevares; alene nye scenarier og nye data SHALL få nye identiteter. Originalens bytes på Drive SHALL bevares indtil en bevidst, rettighedskontrolleret og konfliktbeskyttet gemning på den faktisk indlæste revisionsbasis. Migration MUST NOT ændre Google-forbindelsens særskilte lagerformat eller udløse automatisk upload. Træneren SHALL kunne eksportere originalens uændrede bytes og SHALL før opgradering informeres om, at ældre apps ikke kan åbne format 3. Format 3 MUST NOT automatisk nedkonverteres med tab af scenarier eller reserver.

#### Scenario: Forkert eller nyere fil
- **WHEN** brugeren vælger almindelig JSON, ugyldig JSON eller et nyere ikke-understøttet arbejdsrumsformat
- **THEN** vises en præcis fejl, og filens indhold ændres ikke.

#### Scenario: Migration uden skrivning
- **WHEN** en format 1-fil åbnes, og træneren accepterer migration
- **THEN** oprettes en lokal format 3-kladde med egne vurderinger, uændrede eksisterende id'er og Plan A i hver disciplin; Drive-filen er stadig format 1, indtil træneren vælger Gem på Drive.

#### Scenario: Migration af format 2
- **WHEN** en format 2-fil med arvede vurderinger, egne vurderinger og fravalg opgraderes lokalt
- **THEN** bevares disse data og alle seks eksisterende omgange i de to Plan A-scenarier, hvis reservelister er tomme, uden upload.

#### Scenario: Migration annulleres
- **WHEN** træneren annullerer den tilbudte migration fra format 1 eller 2
- **THEN** bevares det hidtil åbne arbejdsrum og en eventuel ugemt kladde uden erstatningsfil eller upload.

#### Scenario: Konflikt efter migration
- **WHEN** en anden træner gemmer en nyere fil efter indlæsning og før gemning af den migrerede kladde
- **THEN** afvises den forældede gemning, og både den nyere Drive-fil og den lokale migrerede kladde bevares.

#### Scenario: Arv overlever filrundtur
- **WHEN** format 3 med arvede børn, egne vurderinger og et fravalgt fundament gemmes og genåbnes
- **THEN** bevares disse valg, og ændring af en parent opdaterer fortsat kun aktive børn uden egen vurdering i alle relevante scenarier og reserver.

#### Scenario: Ugyldig arvekilde
- **WHEN** en importeret fil indeholder en kilde fra en anden gymnast eller en cyklus
- **THEN** afvises filen med en forståelig fejl uden delvis indlæsning eller tab af en eksisterende kladde.

#### Scenario: Eksport af original
- **WHEN** træneren eksporterer originalen fra migrationsdialogen for en format 1- eller 2-fil
- **THEN** svarer eksportens bytes til den faktisk indlæste original, og hverken Drive-filen eller den eksisterende kladde ændres.

## ADDED Requirements

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
