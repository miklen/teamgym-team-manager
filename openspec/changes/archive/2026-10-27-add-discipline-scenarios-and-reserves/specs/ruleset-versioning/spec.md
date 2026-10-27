# Spec Delta

## MODIFIED Requirements

### Requirement: Bindingen tilhører holdet
Hvert hold SHALL referere til én præcis regelpakke og profil. Alle holdets scenarier i begge springdiscipliner SHALL anvende denne binding og fastholde det kendte beregningsgrundlag indtil et eksplicit skift. Et arbejdsrum SHALL kunne indeholde forskellige reglementer og versioner samtidig. Scenarier MUST NOT oprette egne skjulte regelbindinger eller ændre bindingen ved et almindeligt scenarieskift.

#### Scenario: To hold på forskellige versioner
- **WHEN** hold A opgraderer til ny DK-pakkeversion og hold B fortsat bruger den gamle
- **THEN** bruger alle A's scenarier den nye og alle B's scenarier den gamle, også efter genindlæsning af datafilen.

### Requirement: Versionsskift har konsekvensvisning
Før et skift SHALL træneren kunne se ændrede elementværdier, tillæg, fradrag, gyldighed, rytmefællesnævnere og registreringer, som kræver revurdering. Visningen SHALL omfatte alle holdets scenarier i begge springdiscipliner, identificeret ved disciplin og navn, og også vise berørte reservevalg; den MUST NOT begrænses til det aktuelt viste scenarie. Skiftet SHALL kunne annulleres uden ændring af data og SHALL anvendes samlet på det valgte hold efter bekræftelse. Alle scenariers og pladsers identiteter, navne, rækkefølger og valgte referencer SHALL bevares, mens berørte valg markeres til gennemgang under den nye binding. En forældet konsekvensvisning MUST NOT overskrive nyere lokale ændringer. Andre hold MUST NOT påvirkes.

#### Scenario: Annuller opgradering
- **WHEN** træneren ser en konsekvensvisning og annullerer
- **THEN** forbliver holdets regelversion, alle scenarier med reserver og registreringer uændrede.

#### Scenario: Gennemfør opgradering
- **WHEN** træneren accepterer konsekvenserne af et versionsskift
- **THEN** ændres holdbindingen samlet for alle holdets scenarier, berørte valg markeres til rettelse, og ændringen følger normal konfliktbeskyttet gemning.

#### Scenario: Alternativet er ikke åbent
- **WHEN** holdet har bane Plan A, bane Plan B og trampet Sikker, og træneren starter versionsskift fra Plan A
- **THEN** viser konsekvensvisningen særskilt før/efter for alle tre scenarier og relevante reservevalg uden at blande reserver ind i de udførendes pointgrundlag.

#### Scenario: Data ændres under gennemgang
- **WHEN** der er foretaget en lokal ændring efter beregning af konsekvenser og før bekræftelse
- **THEN** afvises den gamle konsekvensvisning med mulighed for at beregne igen, og den nyere lokale ændring bevares.
