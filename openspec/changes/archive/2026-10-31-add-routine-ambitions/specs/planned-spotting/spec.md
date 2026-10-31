## MODIFIED Requirements

### Requirement: Én planlagt modtagning pr. omgangsplads
Træneren SHALL kunne registrere højst én planlagt modtagning på en deltagerplads i en bane- eller trampetomgang, når pladsen har en gymnast og et valgt spring. Registreringen SHALL være en bevidst konkurrencebeslutning for netop den gymnast og netop det spring på pladsen. Den MUST NOT udledes af, foreslås af eller ændre gymnastens sikkerhed, og den MUST NOT gemmes på færdighedsregistreringen. Reservepladser, ambitioner uden gymnast og rytme SHALL ikke have planlagt modtagning. Træneren SHALL kunne fjerne en modtagning igen.

#### Scenario: Modtagning trods høj sikkerhed
- **WHEN** træneren planlægger modtagning for en gymnast med sikkerhed 5 på det valgte spring
- **THEN** gemmes modtagningen på pladsen, og sikkerheden 5 vises uændret.

#### Scenario: Plads uden spring
- **WHEN** en plads ikke har et valgt spring
- **THEN** kan der ikke registreres en modtagning, og en fil med en modtagning på en sådan plads afvises som ugyldig.

#### Scenario: Ambition uden gymnast
- **WHEN** en plads er en ambition uden gymnast
- **THEN** tilbydes ingen modtagning, og en fil med en modtagning på en ambition afvises som ugyldig.
