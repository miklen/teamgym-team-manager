# ruleset-versioning Specification

## Purpose

Holder reglementer og deres udgaver uafhængige af appens arbejdsgange, så flere hold kan bruge forskellige regler og regelændringer kan indføres kontrolleret.

## Requirements

### Requirement: Regelpakker med eksplicit version og kilder
Hver regelpakke SHALL have stabil reglementsidentitet, uforanderlig pakkeversion, regeludgave/sæson, understøttede holdprofiler, kildeoversigt og versionsbestemte beregninger. Pakkeversionen SHALL kunne skelne rettelser til appens fortolkning fra en ny officiel regeludgave. Et allerede udgivet indhold MUST NOT ændres under samme pakkeversion.

#### Scenario: Rettelse uden ny officiel udgave
- **WHEN** en fejl i en elementværdi rettes, mens det officielle reglement stadig hedder version 1.4
- **THEN** udgives en ny pakkeversion, og den gamle findes fortsat med sit oprindelige resultat og kildegrundlag.

### Requirement: Bindingen tilhører holdet
Hvert hold SHALL referere til én præcis regelpakke og profil. Holdets opstilling SHALL anvende denne binding og fastholde det kendte beregningsgrundlag indtil et eksplicit skift. Et arbejdsrum SHALL kunne indeholde forskellige reglementer og versioner samtidig.

#### Scenario: To hold på forskellige versioner
- **WHEN** hold A opgraderer til ny DK-pakkeversion og hold B fortsat bruger den gamle
- **THEN** bruger A den nye og B den gamle, også efter genindlæsning af datafilen.

### Requirement: Udvidelse uden ændret kartotek
Tilføjelse af Regionsrækken eller Liga SHALL kunne ske ved at tilføje regeldata, katalogkoblinger og afgrænsede beregningsmoduler gennem det eksisterende regelsnit. Fælles kartotek, stabilitetsmodel og generelle arbejdsgange MUST NOT kræve omlægning eller en global rækkevariabel. Første produktleverance SHALL indeholde Danmarksserien, mens en separat testpakke SHALL bevise kontrakten uden at foregive produktionsgodkendt REG/Liga-understøttelse.

#### Scenario: Andet reglement i kontrakttest
- **WHEN** en syntetisk anden regelpakke med andre værdier og deltagerkrav indlæses i en integrationstest
- **THEN** følger hvert hold sin pakke gennem katalog, planlægning og resultater uden hardkodede DK-grene i brugerfladen.

### Requirement: Færdighedsidentitet og officielle koder er adskilt
Færdigheders interne identiteter SHALL overleve ændret navn, officiel kode og værdi. Hver regelversion SHALL have sin egen kobling til de præcise udførelseskrav. Ændrede udførelseskrav MUST NOT skjules som en ren kodeændring eller automatisk omskrive, hvad en gymnast kan.

#### Scenario: Kode ændres men udførelsen er identisk
- **WHEN** en ny pakkeversion bruger en ny officiel kode for samme udførelse
- **THEN** bevares færdighedsregistreringer og stabilitet, mens den viste kode følger holdets valgte version.

### Requirement: Versionsskift har konsekvensvisning
Før et skift SHALL træneren kunne se ændrede elementværdier, tillæg, fradrag, gyldighed, rytmefællesnævnere og registreringer, som kræver revurdering. Skiftet SHALL kunne annulleres uden ændring af data og SHALL anvendes samlet på det valgte hold efter bekræftelse. Andre hold MUST NOT påvirkes.

#### Scenario: Annuller opgradering
- **WHEN** træneren ser en konsekvensvisning og annullerer
- **THEN** forbliver holdets regelversion, opstilling og registreringer uændrede.

#### Scenario: Gennemfør opgradering
- **WHEN** træneren accepterer konsekvenserne af et versionsskift
- **THEN** ændres holdbindingen samlet, berørte valg markeres til rettelse, og ændringen følger normal konfliktbeskyttet gemning.

### Requirement: Ukendt regelpakke giver ingen skjult fallback
Ved åbning af data med en ikke-installeret pakkeversion SHALL systemet bevare binding og data og forklare manglen. Det MUST NOT beregne med den nyeste, nærmeste eller en anden rækkes regler. Hold med kendte pakker SHALL fortsat kunne bruges.

#### Scenario: Filen kræver en nyere pakke
- **WHEN** hold A refererer til en pakke, appen ikke har, mens hold B har en kendt pakke
- **THEN** vises A uden autoritativ beregning og med intakte data, mens B fungerer normalt.

### Requirement: Regelopdateringer er verificerbare
En regelpakke SHALL ledsages af validerede data, kildehenvisninger, ændringsbeskrivelse, beregningseksempler og regressionstest. En ny pakke MUST kunne testes mod tidligere versioner med dokumenterede forskelle. Regeldata MUST NOT kunne eksekvere vilkårlig kode fra Drive-filen.

#### Scenario: Uventet ændring i gammel version
- **WHEN** en fælles beregningsændring ændrer et fastlagt resultat i en tidligere pakkeversion
- **THEN** fejler regressionskontrollen, indtil adfærden bevares eller ændringen får sin egen eksplicitte version.

### Requirement: Regeltvivl er en del af versionsdata
En pakke SHALL kunne beskrive uafklarede regler og deres berørte resultater med kilder og alternative fortolkninger. En afklaring SHALL udgives i en ny version; trænerens fritekst MUST NOT ændre den officielle beregning globalt.

#### Scenario: Dommerafklaring tilføjes senere
- **WHEN** en dokumenteret afklaring af banens elementtillæg bliver tilgængelig
- **THEN** kan den nye pakke give et entydigt resultat, mens gamle hold fortsat beholder den tidligere uafklarede fortolkning indtil et bevidst skift.

### Requirement: Faglig regelkontrol før numerisk frigivelse
Hver frigivet numerisk regel SHALL have en sporbar kontrolpost med låst kildeudgave, side/punkt, holdprofil, formel eller beslutningstabel, tælleenhed, undtagelser og uafhængigt udregnede facitcases. Strukturel OpenSpec-validering og beståede tests baseret på samme produktionsdata MUST NOT alene betegnes som faglig regelverifikation. En manglende eller modstridende fortolkning MUST give uafklaret resultat i alle berørte beregninger og forslag, indtil dokumenteret afklaring foreligger.

#### Scenario: Fælles fejl i kode og test
- **WHEN** både produktionskoden og en genereret test bruger samme forkerte grænse eller værdi
- **THEN** er testen ikke tilstrækkeligt frigivelsesbevis; en separat kilde-/facitkontrol kræves, og regelstatus må ikke markeres verificeret alene på denne baggrund.

#### Scenario: Uafklaret optællingsmetode
- **WHEN** satsen er kendt, men det ikke er fastlagt og kildekontrolleret, hvilke forekomster eller rækkefølgefejl der skal tælles
- **THEN** må appen ikke vise et entydigt fradrag ved at vælge en vilkårlig algoritme, og den udførende agent skal registrere fortolkningshullet eksplicit.

#### Scenario: Ny regelversion frigives
- **WHEN** en pakke markeres klar til brug
- **THEN** findes en dækningsrapport fra hvert relevant kildepunkt til regel, facitcase og test samt særskilt dokumentation af stadig uafklarede punkter; fejl i grænser, tælleenheder og undtagelser skal kunne fanges uden at genbruge pakkens egne værdier som facit.
