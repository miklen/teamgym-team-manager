# Spec Delta

## ADDED Requirements

### Requirement: Sammensætningsfeedback følger redigeringen

Springplanen SHALL vise relevante planbaserede forhold ved de berørte pladser eller omgange straks efter ændringer i spring, roller, rækkefølge og scenarie. Hver markering SHALL med tekst angive, om forholdet er et sikkert fradrag, en foreløbig risiko, en uafklaret regel eller en planlægningsmangel, og SHALL give en kort forklaring og en brugbar vej til rettelse eller den dybere C-guide. Flere forhold på samme plads SHALL kunne ses hver for sig. Farve alene MUST NOT bære betydningen; feedback SHALL være tilgængelig med tastatur og skærmlæser og kunne bruges uden vandret rulning på mobil. Feedback SHALL være afledt og MUST NOT gemmes.

#### Scenario: Redigér spring undervejs
- **WHEN** et valgt spring skaber en gentagelse på tværs af omgange
- **THEN** ser træneren straks markeringer ved de berørte forekomster og kan åbne årsag og mulig rettelse uden at åbne C-guiden først.

#### Scenario: Flere forhold samme sted
- **WHEN** et spring både indgår i en gentagelse og en rækkefølgefejl
- **THEN** viser pladsen begge forhold med hver sin status og forklaring.

### Requirement: En trampetomgang har kun én redskabstype

Alle valgte spring på udførende pladser i samme trampetomgang, herunder ekstra pladser og ambitioner, SHALL være enten med Pegasus eller uden redskab. Første kendte spring fastlægger omgangens aktuelle type; en omgang uden valgte spring er endnu ikke låst. Alle handlinger, der opretter eller ændrer udførende spring, SHALL afvise et valg af modsat type uden delvis ændring og forklare hvorfor. Det gælder også reserveindsættelse og anvendelse af et konkret forslag. Reserver SHALL fortsat stå uden for den udførende sammensætning, men en reserve med modsat spring MUST NOT indsættes med dette spring. Eksisterende blandede filer SHALL kunne åbnes og vises til rettelse og MUST NOT omskrives eller få spring fjernet automatisk.

#### Scenario: Første spring fastlægger typen
- **WHEN** træneren vælger et Pegasus-spring i en tom trampetomgang og derefter forsøger et trampetspring på en anden udførende plads
- **THEN** afvises det andet valg med forklaring, og omgangen er uændret.

#### Scenario: Ekstra plads og reserve
- **WHEN** en Pegasus-omgang har ekstra pladser, og en reserve med trampetspring forsøges indsat
- **THEN** er den modsatte type fortsat utilgængelig for alle udførende pladser, og reserveindsættelsen kan kun fortsætte med et foreneligt eller tomt springvalg.

#### Scenario: Gammel blandet kladde
- **WHEN** et eksisterende arbejdsrum allerede har en omgang med både Pegasus- og trampetspring
- **THEN** kan træneren åbne, se forklaringen og rette omgangen uden at appen stiltiende ændrer den ved indlæsning.

### Requirement: Skift redskab er en samlet, bevidst handling

En trampetomgang SHALL tilbyde »Skift redskab«. Før bekræftelse SHALL en forhåndsvisning vise, hvilke udførende springvalg der ikke passer til den nye type, samt følgerne for kendt D, C, mangler og planlagte modtagninger. Træneren SHALL vælge foreneligt erstatningsspring, vælge spring senere på besatte pladser eller fjerne en berørt ambitionsplads; en ambition MUST NOT efterlades uden sit obligatoriske spring. Annullering SHALL bevare alt. Bekræftelse SHALL udføres atomisk, bevare alle resterende pladsidentiteter, gymnaster, roller og rækkefølge og MUST NOT ændre andre omgange eller scenarier.

#### Scenario: Pegasus erstatter trampet
- **WHEN** træneren skifter en trampetomgang med besatte pladser og en ambition til Pegasus
- **THEN** vises samtlige uforenelige valg før bekræftelse, og handlingen kan først gennemføres, når hver berørt ambition har et valgt Pegasus-spring eller er valgt fjernet.

#### Scenario: Annullér redskabsskift
- **WHEN** træneren annullerer forhåndsvisningen
- **THEN** er spring, modtagninger, identiteter, reserver og alle scenarier uændrede.

### Requirement: Forslag viser pointvirkning og ændringer før anvendelse

Forhåndsvisningen SHALL sammenligne planens og forslagets tillæg, C, D, C+D og karakterloft med planlagt E-loft. C+D SHALL beregnes ud fra de underliggende værdier før panelafrunding. Når begge karakterlofter kan beregnes, SHALL sammenligningen vise, om forslaget giver et højere, lavere eller uændret karakterloft. Ellers SHALL den vise den tilgængelige sammenligning og angive, at karakterloftet afventer. Ændringer SHALL kunne læses omgang for omgang med før og efter for ændrede spring og pladsnumre for rene flytninger. Den fulde foreslåede opstilling SHALL fortsat være tilgængelig.

#### Scenario: Mere i tillæg og lavere karakterloft
- **WHEN** et konkret forslag øger det enkelte tillæg, men giver et lavere samlet karakterloft
- **THEN** fremgår faldet i karakterloft af sammenligningen, og træneren kan se C+D og karakterloftet på begge opstillinger før anvendelse.

#### Scenario: Forslag flytter en gymnast med samme spring
- **WHEN** forslaget ændrer en gymnasts plads uden at ændre gymnastens spring
- **THEN** viser ændringsvisningen de to pladsnumre uden et tilsyneladende springbytte, og træneren kan se hele rækkefølgen i den fulde opstilling.
