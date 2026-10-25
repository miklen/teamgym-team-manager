# Spec Delta

## Purpose

Understøtter flere uafhængige hold i ét fælles arbejdsrum og et samlet gymnastkartotek, så holdsammensætning og kompetencer kan vedligeholdes uden dublering.

## ADDED Requirements

### Requirement: Flere hold med egen profil
Systemet SHALL lade træneren oprette, navngive, redigere og arkivere flere hold. Hvert hold MUST have sit eget reglement, præcise regelversion, aldersgruppe og holdtype; et globalt reglementvalg MUST NOT styre alle hold. Første leverance SHALL tilbyde kildeverificerede profiler for Danmarksserien med juniorpiger som relevant standard, uden at hardkode hele systemet til denne profil.

#### Scenario: Uafhængige hold
- **WHEN** træneren ændrer navnet eller regelprofilen på hold A
- **THEN** beholder hold B sit navn, regelvalg og beregningsresultat uændret.

#### Scenario: Senere tilføjet regelpakke
- **WHEN** en godkendt Regionsrække-pakke senere installeres, og et hold bruger den, mens et andet bruger Danmarksserien
- **THEN** kan begge hold fungere i samme datafil og samme appsession uden at gymnaster eller færdigheder kopieres.

### Requirement: Fælles gymnastkartotek
Systemet SHALL understøtte oprettelse, redigering, søgning og arkivering af gymnaster samt filtrering efter hold og uden hold. Gymnaster SHALL have stabile identiteter uafhængigt af navn. Ens navne MUST NOT sammenlægge to gymnasters data. Kun oplysninger nødvendige for planlægningen SHALL være obligatoriske.

#### Scenario: To gymnaster med samme navn
- **WHEN** træneren opretter to gymnaster med identisk navn
- **THEN** har de særskilte færdigheder, stabilitetsvurderinger og holdtilknytninger.

#### Scenario: Gymnast uden hold
- **WHEN** en gymnast oprettes uden hold
- **THEN** kan træneren registrere færdigheder og senere tildele gymnasten et hold uden genindtastning.

### Requirement: Ét holdmedlemskab ad gangen
En aktiv gymnast SHALL kunne være uden hold eller tilknyttet ét af arbejdsrummets aktive hold. Flytning SHALL bevare gymnastens færdigheder og vurderinger og SHALL genberegne de berørte holds overblik.

#### Scenario: Flytning mellem hold
- **WHEN** en gymnast flyttes fra hold A til hold B
- **THEN** forsvinder gymnasten fra A's aktuelle medlemsliste, optræder hos B og beholder sine registrerede spring og rytmemomenter.

### Requirement: Referencer overlever medlemsændringer
Arkivering, flytning eller fjernelse af en anvendt færdighed SHALL gøre berørte pladser i opstillinger tydeligt ugyldige eller uafklarede. Systemet MUST NOT erstatte en gymnast, ændre et valgt spring eller slette andre registreringer stiltiende. Træneren SHALL kunne se og rette de berørte pladser.

#### Scenario: Flyttet gymnast i en omgang
- **WHEN** en gymnast, der er valgt i hold A's baneomgang, flyttes til B
- **THEN** markeres den gamle plads med »ikke længere på holdet«, og analysen kan ikke præsenteres som en komplet gyldig opstilling, før pladsen er rettet.

### Requirement: Holdoversigt støtter sammensætning
Ved ændring af et holds medlemsliste SHALL træneren kunne se opdaterede fælles rytmemomenter, færdighedsdækning og manglende vurderinger. Beregning af en endnu ikke gemt holdsammensætning SHALL være mulig uden at gemme ændringer på Drive.

#### Scenario: Prøv at tilføje en gymnast
- **WHEN** en træner tilføjer en gymnast til holdet i den lokale kladde
- **THEN** opdateres rytmematricen straks, mens Drive-status fortsat viser ugemte ændringer.

### Requirement: Kontrolleret arkivering
Arkivering af et hold eller en gymnast SHALL beskrive konsekvensen og bevare tilknyttede færdigheder og referencer til gennemgang. Historiske referencer MUST NOT gøre datafilen ulæselig.

#### Scenario: Arkiver et hold med planer
- **WHEN** træneren arkiverer et hold med udfyldte omgange
- **THEN** fjernes det fra standardlisten over aktive hold, men dets data kan stadig gennemgås og genaktiveres uden rekonstruktion.
