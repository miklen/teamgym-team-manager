## ADDED Requirements

### Requirement: Ambition oprettes i Tilføj plads-dialogen
Træneren SHALL kunne oprette en omgangsplads uden gymnast, en ambition, i en bane- eller trampetomgang gennem den eksisterende Tilføj plads-dialog. Valget skal hedde Ingen gymnast endnu. Valget SHALL være tydeligt i dialogen uden at erstatte det almindelige gymnastvalg. En ambition SHALL have præcis ét valgt spring, før den kan gemmes. Ambitionen SHALL have rolle (tællende eller ekstra) og position som en almindelig plads og følge holdprofilens grænser og regler for rækkefølge. Ændringen SHALL ske gennem en domænekommando og MUST NOT ændres før Opdater.

#### Scenario: Opret en ambition
- **WHEN** træneren åbner Tilføj plads i baneomgang 2, vælger Ingen gymnast endnu, vælger rondat-flik-strakt baglæns salto med 360° og trykker Opdater
- **THEN** står der en tællende plads med springet og uden gymnast i omgang 2, og andre omgange og scenarier er uændrede.

#### Scenario: Ambition uden spring
- **WHEN** træneren vælger Ingen gymnast endnu uden at vælge et spring
- **THEN** kan pladsen ikke gemmes, og dialogen forklarer, at en ambition kræver et spring.

#### Scenario: Grænser gælder også ambitioner
- **WHEN** omgangen har seks tællende pladser, hvoraf to er ambitioner, og træneren forsøger at tilføje en syvende tællende ambition
- **THEN** afvises tilføjelsen med samme besked som for en almindelig plads.

### Requirement: Ambitionens spring vælges fra kataloget
Når Ingen gymnast endnu er valgt, SHALL springvalget vise disciplinens springkatalog, det vil sige gængse opskrifter og arbejdsrummets definitioner uden gentagelser, med samme søgning, tastaturbetjening og kolonner som ved valg af gymnastens registreringer. Sikkerhedskolonnen SHALL vise Ingen gymnast i stedet for et sikkerhedstrin. Valg af en opskrift, der ikke findes i arbejdsrummet, SHALL genbruge en eksisterende definition med samme springidentitet eller oprette en ny i samme ændring som ambitionen. Træneren SHALL kunne skifte springet på en ubesat ambition.

#### Scenario: Søg i kataloget uden gymnast
- **WHEN** træneren har valgt Ingen gymnast endnu og søger kraft-barani
- **THEN** vises springet med navn, saltoretning og D under holdets regelpakke og Ingen gymnast i sikkerhedskolonnen.

#### Scenario: Eksisterende definition genbruges
- **WHEN** arbejdsrummet allerede har en definition af rondat-flik-1/1, og træneren vælger den gængse opskrift med samme identitet til en ambition
- **THEN** refererer ambitionen til den eksisterende definition, og der oprettes ingen dublet.

### Requirement: Besættelse kræver et faktisk match
Når en ambition åbnes, SHALL springet vises fastlåst. Gymnastvalget SHALL gruppere holdets aktive gymnaster i Kan springet og Kan ikke endnu. Kan springet SHALL omfatte gymnaster, som ikke allerede er deltager eller reserve i samme omgang, og som har en aktiv, anvendelig registrering af et aktivt spring med samme springidentitet under holdets regelpakke. Afledte registreringer tæller med. Gruppen SHALL vises med sikkerhed eller Ikke vurderet. Gymnaster i Kan ikke endnu MUST NOT kunne vælges og SHALL have en direkte vej til deres færdigheder. Kontrollen SHALL også ske i domænekommandoen, ikke kun i brugerfladen.

#### Scenario: Gymnast med springet
- **WHEN** Oskar har en aktiv registrering af ambitionens spring med sikkerhed 4, og Ida ikke har springet
- **THEN** vises Oskar under Kan springet med 4/5, og Ida vises under Kan ikke endnu uden mulighed for valg.

#### Scenario: Samme spring med anden definition
- **WHEN** Mia har registreret ambitionens spring gennem en anden definition med samme springidentitet
- **THEN** vises Mia under Kan springet.

#### Scenario: Gymnast allerede i omgangen
- **WHEN** en gymnast med springet allerede er deltager eller reserve i samme omgang
- **THEN** kan gymnasten ikke vælges til ambitionen i denne omgang.

#### Scenario: Ugyldigt match afvises i domænet
- **WHEN** en kommando forsøger at besætte en ambition med en registrering af et andet spring
- **THEN** afvises ændringen uden delvis opdatering.

### Requirement: En besat ambition er en almindelig plads
Besættelse SHALL bevare pladsens identitet, rolle og position og gøre den til en almindelig plads med gymnast og registreret spring. Pladsen SHALL derefter opføre sig præcis som en plads, der blev oprettet med gymnast og spring. Den MUST NOT huske ambitionen. Fjernes pladsen, SHALL den forsvinde som i dag, og ambitionen MUST NOT genoprettes. En besat plads MUST NOT kunne omdannes til en ambition ved redigering. Træneren SHALL i stedet fjerne pladsen og oprette en ny ambition.

#### Scenario: Besæt og fjern igen
- **WHEN** træneren besætter en ambition med Oskar og senere fjerner pladsen
- **THEN** var pladsen en almindelig plads med Oskar i samme position og rolle, og efter fjernelsen findes hverken plads eller ambition.

#### Scenario: Redigering af en besat plads
- **WHEN** træneren åbner en besat plads
- **THEN** tilbyder dialogen ikke Ingen gymnast endnu.

### Requirement: Kan nu-overblik på ambitionen
Hver ambition SHALL vise Mangler gymnast og antallet af gymnaster, der kan tage netop den plads nu, efter reglerne for Kan springet. Antallet SHALL være afledt af de aktuelle registreringer og omgangens besætning. Det SHALL opdateres straks ved ændrede registreringer, vurderinger, arkiveringer eller pladser og MUST NOT gemmes. Ved nul SHALL pladsen vise Ingen kan endnu. Tilstanden MUST NOT formidles alene med farve eller ikon.

#### Scenario: Ny registrering øger tallet
- **WHEN** en ambition viser 1 kan nu, og træneren registrerer ambitionens spring på Ida
- **THEN** viser ambitionen 2 kan nu uden yderligere handling.

#### Scenario: Besættelse påvirker andre ambitioner
- **WHEN** to ambitioner i samme omgang har samme spring, og Oskar er den eneste, der kan det
- **THEN** viser begge 1 kan nu, og efter besættelse af den ene viser den anden Ingen kan endnu.

### Requirement: Ambitionen er tydelig, elegant og tilgængelig
En ambition SHALL være let at skelne fra en besat plads uden at fremstå som en fejl. Den SHALL have samme placering og størrelse i omgangen som en besat plads og vise springnavn, saltoretning og D. Visningen SHALL fungere uden vandret overflow på mobil og desktop, kunne betjenes fuldt med tastatur og have et tilgængeligt navn, der nævner ambition, spring, manglende gymnast og antal, der kan nu. Animerede overgange SHALL respektere reduceret bevægelse.

#### Scenario: Skærmlæser
- **WHEN** fokus står på en ambition med to mulige gymnaster
- **THEN** oplæses ambitionen med springnavn, Mangler gymnast og 2 gymnaster kan nu.

#### Scenario: Smal skærm
- **WHEN** en omgang med ambitioner vises på en mobilskærm
- **THEN** er spring, D, Mangler gymnast og kan nu-antal synlige uden vandret rulning.

### Requirement: Ambitioner er udførende pladser, ikke reserver
Reserver SHALL altid være gymnaster og MUST NOT være ambitioner. Sæt ind for en reserve MUST NOT tilbyde en ambition som plads, der erstattes. Ambitioner SHALL kopieres ved duplikering af et scenarie med nye pladsidentiteter og samme springreference, og senere ændringer i kopien MUST NOT ændre originalen. Flytning til holdomgang, rækkefølge og rolle SHALL bevare ambitionen.

#### Scenario: Reserve og ambition
- **WHEN** en omgang har to besatte pladser og en ambition, og træneren vælger Sæt ind for en reserve
- **THEN** kan kun de to besatte pladser vælges som erstatning.

#### Scenario: Duplikering
- **WHEN** et scenarie med tre ambitioner duplikeres, og en ambition besættes i kopien
- **THEN** er originalens tre ambitioner uændrede.

### Requirement: Appen besætter ikke ambitioner automatisk
Systemet MUST NOT besætte, ændre eller fjerne en ambition uden en bevidst handling fra træneren. Det gælder også ved nye registreringer, arv og potentialeforslag.

#### Scenario: Ny registrering
- **WHEN** en gymnast får registreret ambitionens spring
- **THEN** ændres kun kan nu-antallet, og ambitionen forbliver ubesat.
