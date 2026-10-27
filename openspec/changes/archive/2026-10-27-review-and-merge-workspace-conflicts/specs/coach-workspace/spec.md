# Spec Delta

## ADDED Requirements

### Requirement: Nyere fil og faktiske konflikter kan skelnes
Arbejdsfladen SHALL skelne mellem konstateret nyere fil, gennemgang der afventer beregning, forenelige ændringer og faktiske konflikter, som kræver valg. En versionsforskel alene MUST NOT beskrives som bevis for modstridende redigeringer. Gennemgå ændringer SHALL være tilgængelig ved konstateret nyere fil, inklusive efter en afvist gemning, med bevaret adgang til eksport og bevidst genindlæsning. Indlæsning og fejl SHALL have konkret status uden at blokere muligheden for at bevare arbejdet.

#### Scenario: Forenelige ændringer efter afvist gemning
- **WHEN** gemning afvises på en gammel basis, men sammenligningen viser ændringer i uafhængige data
- **THEN** forklarer arbejdsfladen, at der findes en nyere fil, og at ændringerne kan kombineres; den kræver ingen kunstige konfliktvalg.

### Requirement: Ændringsgennemgang i trænerens kontekst
Gennemgangen SHALL vise nettoændringer siden basis med danske betegnelser for hold, gymnast, disciplin, spring, scenarie og omgang, hvor de er relevante. Tilføjet, ændret og fjernet SHALL kunne skelnes uden farve alene. Ved konflikt SHALL udgangspunkt, Min udgave, Filens udgave, begrundelse for eventuel gruppering og aktuelt valg være tilgængelige. Tekniske identiteter MUST NOT være den eneste forklaring, og tekniske revisionsfelter MUST NOT optræde som redigeringskonflikter. En oversigt SHALL angive omfanget af eksterne ændringer og uafgjorte konflikter, så både ændringer og beslutninger kan findes i store arbejdsrum.

#### Scenario: Samme gymnastnavn flere steder
- **WHEN** konflikter berører gymnaster med samme navn eller scenarier med samme navn på forskellige hold
- **THEN** viser hver konflikt tilstrækkelig hold-, disciplin- og registreringskontekst til, at træneren kan skelne dem.

#### Scenario: Fjernet scenarie
- **WHEN** den nyeste fil har fjernet et scenarie, der fandtes i basis
- **THEN** viser gennemgangen det fjernede scenaries navn og kontekst fra basis frem for en tom eller ukendt betegnelse.

### Requirement: Tilgængeligt forløb fra valg til lokal kladde
Gennemgangen SHALL fungere med tastatur, hjælpemidler, mobil, tablet og computer. Valg og uafgjorte konflikter SHALL have tydelige betegnelser, og fokus SHALL håndteres ved åbning, fejl og lukning. Bekræftelsen SHALL hedde Brug disse ændringer og forklare, at visningen opdateres, og at brugeren gemmer på Drive bagefter. Annuller SHALL bevare arbejdet. En åben ændret formular SHALL håndteres med Behold mine ændringer, Kassér formularændringer eller Bliv, før gennemgangen tager sit kladdesnapshot eller anvender et resultat; formularændringer MUST NOT forsvinde eller blive skrevet ind over et nyere resultat fra en gammel formular.

#### Scenario: Konfliktvalg med tastatur på mobilbredde
- **WHEN** træneren gennemgår flere konflikter ved 390 pixels bredde med tastatur
- **THEN** kan udgangspunkt og begge alternativer læses, valg foretages og ændres, uafgjorte konflikter findes, og gennemgangen anvendes eller annulleres uden afklippede handlinger.

#### Scenario: Ændret formular før gennemgang
- **WHEN** træneren åbner gennemgangen med en ændret vurderingsformular
- **THEN** kan formularen opdateres til lokal kladde, kasseres eller beholdes åben; ingen af valgene starter upload, og gennemgangen beregnes kun på den valgte aktuelle kladde.

#### Scenario: Anvendelse efterfulgt af gemning
- **WHEN** træneren anvender et gyldigt resultat med lokale ændringer
- **THEN** lukkes gennemgangen med forståelig status og fokus, kladden vises som ugemt, og Gem på Drive er en særskilt handling.
