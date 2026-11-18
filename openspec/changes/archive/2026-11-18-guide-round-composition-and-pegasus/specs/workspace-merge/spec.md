# Spec Delta

## ADDED Requirements

### Requirement: Fletning respekterer omgangens redskabstype

Redskabstypen SHALL afledes af de eksisterende udførende springreferencer og definitioner; den MUST NOT gemmes som et særskilt felt. Den ordnede deltagerliste SHALL fortsat være atomisk ved samtidige ændringer i samme omgang. Efter kombination af uafhængige ændringer SHALL en ny blandet Pegasus-/trampetomgang give en forklaret konflikt eller blokering, før resultatet kan anvendes, også hvis blandingen skyldes ændret springdefinition. Fletning MUST NOT rydde spring, ambitioner, pladser eller modtagninger for at få resultatet gyldigt. En allerede blandet, ældre kladde SHALL kunne gennemgås og repareres uden at indlæsning eller sammenligning skriver til Drive.

#### Scenario: To sider ændrer samme omgang
- **WHEN** to trænere fra fælles basis vælger henholdsvis Pegasus og trampet i samme omgangs deltagerliste
- **THEN** kræver begge fletteretninger et valg for den samlede liste, og ingen kombination blander springene.

#### Scenario: Ændret definition mod deltagerliste
- **WHEN** én side ændrer en refereret springdefinition til modsat redskabstype, mens den anden ændrer en uafhængig plads i samme omgang
- **THEN** kan et resulterende blandet redskab ikke anvendes; konflikten forklares med de berørte pladser uden automatisk tab.

#### Scenario: Uafhængige omgange
- **WHEN** hver side ændrer forskellige trampetomgange, og hver omgang fortsat har én redskabstype
- **THEN** kan ændringerne kombineres uden et kunstigt konfliktvalg, og C-analysen genberegnes fra resultatet.
