## MODIFIED Requirements

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
