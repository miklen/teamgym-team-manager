# Spec Delta

## MODIFIED Requirements

### Requirement: Validering og kompatibilitet af datafil
Systemet MUST validere format, formatversion, identiteter og referencer før indlæsning/gemning. En ukendt nyere formatversion eller beskadiget fil MUST NOT omfortolkes som tom eller overskrives. Arbejdsrumsformat 2 SHALL bevare arveophav, egne vurderinger, accepterede relationer og individuelle fravalg gennem gem/genåbn. Cyklisk arv, ukendte registreringsreferencer og kilder fra andre gymnaster SHALL afvises uden ændring af det åbne arbejdsrum. Format 1 SHALL tilbydes eksplicit migration til en lokal format 2-kladde; annullering SHALL bevare den eksisterende session. Migration SHALL bevare alle eksisterende identiteter, vurderinger, datoer, noter, navne, arkiveringer, forbindelsesbekræftelser, regelbindinger og planreferencer og markere eksisterende vurderinger som egne. Originalens bytes på Drive SHALL bevares indtil en bevidst, rettighedskontrolleret og konfliktbeskyttet gemning på den faktisk indlæste revisionsbasis. Migration MUST NOT ændre Google-forbindelsens særskilte lagerformat eller udløse automatisk upload.

#### Scenario: Forkert eller nyere fil
- **WHEN** brugeren vælger almindelig JSON, ugyldig JSON eller et nyere ikke-understøttet arbejdsrumsformat
- **THEN** vises en præcis fejl, og filens indhold ændres ikke.

#### Scenario: Migration uden skrivning
- **WHEN** en format 1-fil åbnes, og træneren accepterer migration
- **THEN** oprettes en lokal format 2-kladde med egne vurderinger og uændrede id'er; Drive-filen er stadig format 1, indtil træneren vælger Gem på Drive.

#### Scenario: Migration annulleres
- **WHEN** træneren annullerer den tilbudte migration
- **THEN** bevares det hidtil åbne arbejdsrum og en eventuel ugemt kladde uden erstatningsfil eller upload.

#### Scenario: Konflikt efter migration
- **WHEN** en anden træner gemmer en nyere fil efter indlæsning og før gemning af den migrerede kladde
- **THEN** afvises den forældede gemning, og begge den nyere Drive-fil og den lokale migrerede kladde bevares.

#### Scenario: Arv overlever filrundtur
- **WHEN** format 2 med arvede børn, egne vurderinger og et fravalgt fundament gemmes og genåbnes
- **THEN** bevares disse valg, og ændring af en parent opdaterer fortsat kun aktive børn uden egen vurdering.

#### Scenario: Ugyldig arvekilde
- **WHEN** en importeret fil indeholder en kilde fra en anden gymnast eller en cyklus
- **THEN** afvises filen med en forståelig fejl uden delvis indlæsning eller tab af en eksisterende kladde.
