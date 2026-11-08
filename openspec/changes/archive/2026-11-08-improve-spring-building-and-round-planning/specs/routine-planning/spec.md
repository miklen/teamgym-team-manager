# Spec Delta

## ADDED Requirements

### Requirement: Omgangens springvalg prioriterer seriens begyndelse
Ved valg af spring til en ambition SHALL søgning bruge samme normalisering, strukturelle aliaser og rangering som gymnastens nuværende springvælger. Præcise navne og sammenhængende begyndelser SHALL stå før løse ord på tværs af serien. Træneren SHALL kunne afgrænse resultater med det eksisterende kædefilter og minimum-D uden at miste et allerede valgt spring. Listen SHALL vise elementernes rækkefølge, saltoretning, D og forbindelsesstatus. Når de samlede filtre giver nul resultater og kæden har en præcis begyndelse, SHALL én handling i tomtilstanden kunne fortsætte kæden i Byg selv; der MUST NOT være en Byg videre-handling på hver resultatrække.

#### Scenario: Strakt rondat på omgangen
- **WHEN** træneren søger strakt rondat på en ambition
- **THEN** står Strakt salto – rondat og Strakt salto – rondat – flik før Rondat – flik med strakt afslutning.

#### Scenario: Valgt spring bevares under filtrering
- **WHEN** træneren vælger en serie og ændrer kædefilter eller minimum-D
- **THEN** forbliver valget synligt i en samlet gennemgang og ændres ikke uden trænerens handling.

### Requirement: Tilføj et valgt antal pladser med samme spring
På en bane- eller trampetomgang SHALL træneren kunne vælge et aktivt spring, en rolle og et antal nye pladser fra 1 til antallet af ledige pladser for rollen. Handlingen SHALL oprette det valgte antal selvstændige, fortløbende pladser med samme præcise spring i én samlet ændring. Den SHALL kunne gentages med et andet spring, så eksempelvis 2 + 2 + 2 og 3 + 3 kan planlægges uden at søge hvert spring flere gange. Eksisterende pladser MUST NOT overskrives, og antal eller rækkefølge MUST NOT ændres stiltiende. Holdprofilens grænser for tællende og ekstra pladser samt ekstra først SHALL håndhæves for hele handlingen. Oprettelsen SHALL være atomisk: ugyldigt antal eller pladsgrænse MUST NOT efterlade delvise pladser eller en løs ny definition.

#### Scenario: To plus to plus to
- **WHEN** træneren vælger et spring og tilføjer 2 tællende pladser, vælger et andet og tilføjer 2 og vælger et tredje og tilføjer 2
- **THEN** viser omgangen seks nye pladser i den valgte blokrækkefølge med tre præcise springidentiteter og uændrede øvrige omgange.

#### Scenario: Tre plus tre
- **WHEN** træneren vælger et spring til 3 pladser og derefter et andet spring til 3 pladser
- **THEN** oprettes seks selvstændige pladser i de to valgte blokke uden at kopiere gymnast eller sikkerhed.

#### Scenario: Kun ledige pladser ændres
- **WHEN** omgangen allerede har to tællende pladser, og træneren tilføjer 2 med samme spring
- **THEN** bevares de eksisterende pladser og deres rækkefølge, og kun to nye pladser føjes til.

#### Scenario: Grænsen afviser samlet
- **WHEN** der er én ledig tællende plads, og træneren forsøger at tilføje 2
- **THEN** afvises handlingen med grænsen forklaret, og ingen plads eller springdefinition oprettes.
