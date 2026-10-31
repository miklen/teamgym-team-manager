## MODIFIED Requirements

### Requirement: Flere hold med egen profil
Systemet SHALL lade træneren oprette, navngive og redigere flere hold. Hvert hold MUST have sit eget reglement, præcise regelversion, aldersgruppe og holdtype; et globalt reglementvalg MUST NOT styre alle hold.

Systemet SHALL tilbyde kildeverificerede profiler for Danmarksserien, med juniorpiger som relevant standard, og for Regionsrækken (U11, U14 og junior som piger, drenge og mix). Systemet MUST NOT hardkode hele systemet til én profil. Profilvalget SHALL kun tilbyde de aldersgrupper, som holdets valgte pakke indeholder.

#### Scenario: Uafhængige hold
- **WHEN** træneren ændrer navnet eller regelprofilen på hold A
- **THEN** beholder hold B sit navn, regelvalg og beregningsresultat uændret.

#### Scenario: Senere tilføjet regelpakke
- **WHEN** en godkendt Regionsrække-pakke installeres, og et hold bruger den, mens et andet bruger Danmarksserien
- **THEN** kan begge hold fungere i samme datafil og samme appsession uden at gymnaster eller færdigheder kopieres.

#### Scenario: Pakkestyrede aldersgrupper
- **WHEN** træneren vælger Regionsrækken for et hold
- **THEN** tilbydes U11, U14 og junior, og senior tilbydes ikke.
