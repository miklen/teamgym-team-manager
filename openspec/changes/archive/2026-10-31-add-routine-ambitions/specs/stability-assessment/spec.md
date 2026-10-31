## ADDED Requirements

### Requirement: Ambitioner er ubesatte pladser i sikkerhedsaggregatet
En ambition SHALL i omgangens sikkerhedsaggregat tælle som en krævet, men ikke udfyldt plads. Den MUST NOT bidrage med en vurdering, og den MUST NOT få en antaget sikkerhed. Aggregatet SHALL markeres som ufuldstændigt, så længe en tællende ambition er ubesat.

#### Scenario: Fem besatte og én ambition
- **WHEN** en omgang har fem tællende besatte pladser vurderet 5 og én tællende ambition
- **THEN** vises 5,0/5 blandt de fem vurderede, minimum 5, 5/6 vurderet og en ufuldstændig tilstand.
