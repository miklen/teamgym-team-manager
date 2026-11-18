# Spec Delta

## ADDED Requirements

### Requirement: Planbaserede sammensætningsfund kan stedfæstes

Analysen SHALL for hvert planbaseret C-forhold, som den valgte regelpakke vurderer, levere regelhenvisning, status, kendt beløb eller uafklaret beløb, berørte omgangs- og pladsidentiteter samt en konkret forklaring på mulig rettelse. Stedfæstelsen SHALL bygge på samme regelresultat som C-oversigten. Den MUST NOT udpege én skyldig plads, når regelgrundlaget ikke afgør det. Mangler, invalide valg og mistede muligheder SHALL kunne skelnes fra sikre fradrag.

#### Scenario: Gentaget spring med lige antal
- **WHEN** samme springidentitet optræder lige mange gange i to tællende omgange
- **THEN** markeres de berørte forekomster i begge omgange, mens det kendte fradrag vises samlet, og ingen af de to omgange udpeges som sikkert friholdt.

#### Scenario: Rækkefølgefejl
- **WHEN** en DK-omgang 2 eller 3 har spring i forkert rækkefølge
- **THEN** stedfæstes de berørte pladser, og analysen foreslår den relevante rækkefølge uden at ændre den; DK 1.0.0 med uafklaret Q06 får ikke et opfundet præcist beløb.

#### Scenario: Pakke uden rækkefølgefradrag
- **WHEN** holdet anvender REG, som ikke har DK's rækkefølgefradrag
- **THEN** vises ingen advarsel om dette DK-fradrag på pladserne.

### Requirement: Omgangskrav vurderes uden opdigtet retningstæller

Analysen SHALL vurdere banens rene forlæns- og baglænsomgange samt trampettens omgange med og uden Pegasus på tværs af alle tre omgange efter den valgte pakke. Antal skift mellem forlæns og baglæns spring i en omgang MUST NOT i sig selv tælles som fradrag. En ufuldstændig plan SHALL vise mulige udfald som foreløbige, når tomme pladser eller omgange stadig kan ændre resultatet.

#### Scenario: Blandet retning
- **WHEN** en baneomgang indeholder både rene forlæns- og baglænsserier
- **THEN** forklarer guiden, hvilke rene omgangskrav planen endnu mangler, og peger på relevante omgange uden at påstå et fradrag pr. retningsskift.

#### Scenario: Observeret udførelse mangler
- **WHEN** planen har korrekt springrækkefølge, men intet observeret gennemløb
- **THEN** bliver flow og fald fortsat ikke vurderet som automatisk planfradrag eller markeret som sikker fejl på en plads.

### Requirement: Omgangens tillægsmuligheder bygger på en konkret opstilling

Springplanen SHALL kun fremhæve muligheden for mere tillæg ved en omgang, hvis et konkret forslag med holdets registrerede spring øger bidraget og peger på den omgang. Markeringen SHALL vise den ekstra gevinst i forhold til planen. Regelforklaringen og planens aktuelle bidrag SHALL fortsat kunne ses i kompositionsguiden.

#### Scenario: Dobbeltrotation uden en opnåelig forbedring
- **WHEN** planen allerede får tillæg for en dobbeltrotation, og søgningen ikke finder en opstilling med holdets registrerede spring, som øger tillægget
- **THEN** viser guiden planens bidrag og reglen, mens omgangen ikke markeres med en mulighed for mere tillæg.

## MODIFIED Requirements

### Requirement: Regelmål og aktuel kunnen holdes adskilt
Guiden SHALL vise reglementets kvalifikationskrav og teoretiske mål for hvert relevant tillæg, også uden registrerede spring på holdet. Uddybningen SHALL vise mindst ét præcist kvalificerende springeksempel fra den valgte regelpakke, når et entydigt gyldigt eksempel findes; ellers SHALL den vise det præcise krav uden at opfinde et spring. Guiden SHALL særskilt vise planens aktuelle bidrag og, når eksisterende potentialesøgning dokumenterer det, en mulighed med holdets registrerede anvendelige færdigheder. Et springeksempel fra regelkataloget SHALL mærkes som et træningsmål eller et regelforklarende eksempel; det MUST NOT udlægges som en bestemt gymnasts kunnen, konkurrenceklarhed eller dokumenteret opnåeligt tillæg. Individuelle tillægsmaksima MUST NOT lægges sammen til en samlet opnåelig C uden en fælles gennemførlig opstilling.

#### Scenario: Ingen har registreret en kvalificerende skrue
- **WHEN** et hold ikke har registreret spring, der kvalificerer til DK's skruetillæg
- **THEN** viser guiden stadig skruekravet og det regelbaserede mål, mens planens bidrag og dokumenteret mulighed er adskilt fra det fremtidige træningsmål.

#### Scenario: Lav sikkerhed på registreret spring
- **WHEN** et relevant spring er registreret med sikkerhed 1 eller 2
- **THEN** kan guiden vise det som registreret og som noget, der arbejdes med, men MUST NOT kalde gymnastens udførelse konkurrencestabil eller gøre sikkerhed til en uofficiel C-pointfaktor.

#### Scenario: Delvis opstilling
- **WHEN** kun nogle tællende pladser er udfyldt
- **THEN** kan guiden vise kendt foreløbig dækning, men MUST NOT fremstille et usikkert subtotal som et endeligt opnået C-tillæg.

#### Scenario: Ikke installeret eller uafklaret regelgrundlag
- **WHEN** holdets præcise regelpakke mangler, eller en regelkonsekvens er uafklaret
- **THEN** opfinder guiden ingen mål, tælleenhed eller sikre point fra en anden pakke og bevarer synlig adgang til den kendte usikkerhed.

#### Scenario: Én samlet indgang til dokumenterede muligheder
- **WHEN** potentialesøgningen har fundet en konkret opstilling, der øger et tillæg i den valgte springplan
- **THEN** vises planens bidrag, bidraget med forslaget, den ekstra gevinst og handlingen »Se konkrete ændringer« i den relevante tillægsrække i guiden. Handlingen åbner fortsat den fulde vidneopstilling uden automatisk at ændre planen. Under søgning vises status og mulighed for at afbryde; ved fejl vises fejlen i guiden. Et forsinket resultat fra et andet scenarie må ikke vises.
