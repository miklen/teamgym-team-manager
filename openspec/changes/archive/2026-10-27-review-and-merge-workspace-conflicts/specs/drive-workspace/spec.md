# Spec Delta

## MODIFIED Requirements

### Requirement: Bevidst håndtering af konflikt
Ved en nyere fil SHALL brugeren kunne gennemgå ændringer siden sin fælles basis uden at kassere kladden. Systemet SHALL tilbyde trevejssammenligning efter workspace-merge, bevidst kombination af forenelige ændringer og valg pr. faktisk konflikt. Brugeren SHALL fortsat kunne bevare en lokal kopi, indlæse den nyeste fil efter bekræftelse af kassation eller fortsætte med at gennemse kladden. Automatisk erstatning af kladden, automatisk baggrundsfletning og ubetinget overskrivning MUST NOT forekomme. Anvendelse af en gennemgået fletning SHALL kun skabe en lokal kladde; gemning på Drive kræver en særskilt handling med normal rettigheds- og konfliktkontrol.

#### Scenario: Genindlæsning efter konflikt
- **WHEN** en bruger vælger at genindlæse, mens der findes lokale ændringer
- **THEN** beskrives tabet af kladden, og først efter brugerens valg erstattes den af den nyeste fil.

#### Scenario: Nyeste fil hentes til gennemsyn
- **WHEN** brugeren vælger Gennemgå ændringer
- **THEN** hentes den nyeste fil til sammenligning, mens basis og lokal kladde bevares, og der sendes ingen upload.

#### Scenario: Fletning anvendes
- **WHEN** brugeren har afgjort eventuelle konflikter og bekræfter den gyldige samlede kladde
- **THEN** bliver den gennemgåede nyeste fil kladdens revisionsbasis; resultatet vises som ugemt, hvis det afviger fra denne fil, ellers som uændret, uden Drive-upload.

## ADDED Requirements

### Requirement: Gennemgang er bundet til præcise versioner
En gennemgang SHALL bindes til fil- og arbejdsrumsidentitet, forbindelses-/sessionskontekst, fælles basis, lokal kladde og den nyeste fils faktisk læste revisionsbasis. Ændret lokal kladde, nyere ekstern fil eller ændret kontekst SHALL gøre en berørt gennemgang forældet. Før anvendelse SHALL den aktuelle eksterne basis kontrolleres igen; en forældet gennemgang MUST NOT anvendes. En ændring mellem denne kontrol og senere gemning SHALL fortsat afvises af den betingede upload. Fletning MUST NOT fjerne skrivebeskyttelsen ved at gemme uden revisionsbetingelse.

#### Scenario: Lokal redigering efter forhåndsvisning
- **WHEN** kladden ændres, efter sammenligningen er beregnet
- **THEN** kan de gamle valg ikke anvendes på den nye kladde; ny gennemgang kræves, og de nye lokale ændringer bevares.

#### Scenario: En tredje gemning
- **WHEN** en anden træner gemmer igen efter gennemgangen og før kontrollen ved anvendelse
- **THEN** afvises anvendelsen som forældet med bevaret kladde og besked om at gennemgå den nyeste fil igen.

#### Scenario: Kapløb efter anvendelse
- **WHEN** en ny ekstern gemning sker efter kontrol/anvendelse og før brugerens gemning
- **THEN** afviser den betingede upload den forældede basis uden at ændre den eksterne fil eller miste den flettede kladde.

#### Scenario: Adgang bortfalder under gennemgang
- **WHEN** konto, filkontekst eller skriveadgang ændres, mens et svar afventes
- **THEN** kan svaret ikke anvende en gammel gennemgang eller genoprette gammel adgang; lokal kladde bevares efter de gældende regler for afbrydelse og eksport.

### Requirement: Ukendt uploadresultat afstemmes før fletning
Systemet SHALL afstemme en uafklaret tidligere gemmeoperation, før en gennemgang kan anvendes. En genkendt egen gemning MUST NOT fremstilles som en anden træners ændring. Hvis egen gemning er bekræftet og en anden session derefter har gemt, SHALL den faktisk bekræftede egen snapshot bruges som sammenligningsbasis for fortsatte lokale ændringer. Hvis udfaldet ikke kan afklares, SHALL anvendelse blokeres med bevaret kladde frem for at opfinde en fælles basis. Afsluttede og forældede operationer MUST NOT genbruges til upload af en ny flettet kladde.

#### Scenario: Mistet svar uden efterfølgende ekstern ændring
- **WHEN** en upload er gennemført, svaret mistes, og samme operation genkendes ved hentning til gennemgang
- **THEN** afstemmes den som egen gemning, og eventuelle lokale ændringer efter det afsendte snapshot bevares uden en falsk konflikt eller dobbeltupload.

#### Scenario: Egen gemning efterfulgt af ekstern gemning
- **WHEN** egen gennemførte operation genkendes i en nyere fil, og kladden er redigeret videre efter det afsendte snapshot
- **THEN** sammenlignes de fortsatte lokale ændringer og de efterfølgende eksterne ændringer med det bekræftede eget snapshot som fælles basis; allerede gemt arbejde fremstilles ikke som nye lokale ændringer.

#### Scenario: Netværksfejl under afstemning
- **WHEN** den nyeste fil ikke kan læses tilstrækkeligt til at afklare en uafsluttet operation
- **THEN** forbliver anvendelse blokeret, arbejdet kan eksporteres, og der startes ingen ny upload som del af gennemgangen.
