# Spec Delta

## MODIFIED Requirements

### Requirement: Validering og kompatibilitet af datafil
Systemet MUST validere format, formatversion, identiteter og referencer før indlæsning og gemning. En ukendt nyere formatversion eller en beskadiget fil MUST NOT omfortolkes som tom eller overskrives. Arbejdsrumsformat 4 SHALL bevare følgende gennem gemning, genåbning og eksport: alle scenarier med navne og rækkefølge, tre omgange pr. scenarie, deltagerroller, springvalg, planlagte modtagninger med grad, element og springreference, prioriterede reserver, arveophav, egne vurderinger, accepterede relationer og individuelle fravalg. Valideringen SHALL også omfatte scenarier, som ikke er åbne. Følgende SHALL afvises uden ændring af det åbne arbejdsrum: cyklisk arv, ukendte registreringsreferencer, kilder fra andre gymnaster, en modtagning på en plads uden spring, en modtagning i rytme og et elementvalg uden for seriens elementer.

Format 1, 2 og 3 SHALL tilbydes eksplicit migration til en lokal format 4-kladde. Annullering SHALL bevare den eksisterende session. Migration SHALL bevare alle eksisterende identiteter, vurderinger, datoer, noter, navne, arkiveringer, forbindelsesbekræftelser, regelbindinger og planreferencer. Format 1-vurderinger SHALL fortsat markeres som egne, og format 2's arveophav, relationer og fravalg SHALL bevares. Ved migration fra format 1 og 2 SHALL hver eksisterende disciplins tre omgange placeres i ét nyt scenarie med navnet Plan A og tomme reservelister. Eksisterende plan-, omgangs- og pladsidentiteter SHALL bevares. Kun nye scenarier og nye data SHALL få nye identiteter. Migration fra format 3 SHALL bevare alle scenarier og reserver og give alle pladser ingen modtagning uden nye identiteter. Den SHALL være deterministisk, så en migreret format 3-basis kan bruges i fletning. Originalens bytes på Drive SHALL bevares indtil en bevidst, rettighedskontrolleret og konfliktbeskyttet gemning på den faktisk indlæste revisionsbasis. Migration MUST NOT ændre Google-forbindelsens særskilte lagerformat eller udløse automatisk upload. Træneren SHALL kunne eksportere originalens uændrede bytes og SHALL før opgradering informeres om, at ældre apps ikke kan åbne format 4. Format 4 MUST NOT automatisk nedkonverteres med tab af scenarier, reserver eller modtagninger.

#### Scenario: Forkert eller nyere fil
- **WHEN** brugeren vælger almindelig JSON, ugyldig JSON eller et nyere ikke-understøttet arbejdsrumsformat
- **THEN** vises en præcis fejl, og filens indhold ændres ikke.

#### Scenario: Ældre app møder format 4
- **WHEN** en app, der kun understøtter format 3, åbner en format 4-fil
- **THEN** afvises filen som et nyere format uden overskrivning.

#### Scenario: Migration uden skrivning
- **WHEN** en format 1-fil åbnes, og træneren accepterer migration
- **THEN** oprettes en lokal format 4-kladde med egne vurderinger, uændrede eksisterende id'er og Plan A i hver disciplin. Drive-filen er stadig format 1, indtil træneren vælger Gem på Drive.

#### Scenario: Migration af format 3
- **WHEN** en format 3-fil med flere scenarier og reserver opgraderes lokalt
- **THEN** bevares alle scenarier, omgange, pladser, reserver og id'er, og ingen plads har en modtagning. Der sker ingen upload.

#### Scenario: Migration annulleres
- **WHEN** træneren annullerer den tilbudte migration fra format 1, 2 eller 3
- **THEN** bevares det hidtil åbne arbejdsrum og en eventuel ugemt kladde uden erstatningsfil eller upload.

#### Scenario: Konflikt efter migration
- **WHEN** en anden træner gemmer en nyere fil efter indlæsning og før gemning af den migrerede kladde
- **THEN** afvises den forældede gemning, og både den nyere Drive-fil og den lokale migrerede kladde bevares.

#### Scenario: Gennemgang med migreret basis
- **WHEN** træneren har en lokal kladde migreret fra format 3, og en anden træner har gemt filen som format 4 med ændringer
- **THEN** sammenlignes den deterministisk migrerede basis med den lokale kladde og den nyere format 4-fil efter de almindelige fletteregler.

#### Scenario: Arv overlever filrundtur
- **WHEN** en format 4-fil med arvede børn, egne vurderinger og et fravalgt fundament gemmes og genåbnes
- **THEN** bevares disse valg. Ændring af en parent opdaterer fortsat kun aktive børn uden egen vurdering i alle relevante scenarier og reserver.

#### Scenario: Modtagning overlever filrundtur
- **WHEN** en format 4-fil med planlagte modtagninger i flere scenarier gemmes og genåbnes
- **THEN** bevares grad, element og springreference på de samme pladser.

#### Scenario: Ugyldig arvekilde
- **WHEN** en importeret fil indeholder en kilde fra en anden gymnast eller en cyklus
- **THEN** afvises filen med en forståelig fejl uden delvis indlæsning eller tab af en eksisterende kladde.

#### Scenario: Migration af format 2
- **WHEN** en format 2-fil med arvede vurderinger, egne vurderinger og fravalg opgraderes lokalt
- **THEN** bevares disse data og alle seks eksisterende omgange i de to Plan A-scenarier med tomme reservelister og uden modtagninger. Der sker ingen upload.

#### Scenario: Eksport af original
- **WHEN** træneren eksporterer originalen fra migrationsdialogen for en format 1-, 2- eller 3-fil
- **THEN** svarer eksportens bytes til den faktisk indlæste original, og hverken Drive-filen eller den eksisterende kladde ændres.
