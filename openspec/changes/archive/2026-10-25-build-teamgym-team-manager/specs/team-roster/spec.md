# Spec Delta

## Purpose

Understøtter flere uafhængige hold i ét fælles arbejdsrum og et samlet gymnastkartotek, så holdsammensætning og kompetencer kan vedligeholdes uden dublering.

## ADDED Requirements

### Requirement: Flere hold med egen profil
Systemet SHALL lade træneren oprette, navngive og redigere flere hold. Hvert hold MUST have sit eget reglement, præcise regelversion, aldersgruppe og holdtype; et globalt reglementvalg MUST NOT styre alle hold. Første leverance SHALL tilbyde kildeverificerede profiler for Danmarksserien med juniorpiger som relevant standard, uden at hardkode hele systemet til denne profil.

#### Scenario: Uafhængige hold
- **WHEN** træneren ændrer navnet eller regelprofilen på hold A
- **THEN** beholder hold B sit navn, regelvalg og beregningsresultat uændret.

#### Scenario: Senere tilføjet regelpakke
- **WHEN** en godkendt Regionsrække-pakke senere installeres, og et hold bruger den, mens et andet bruger Danmarksserien
- **THEN** kan begge hold fungere i samme datafil og samme appsession uden at gymnaster eller færdigheder kopieres.

### Requirement: Fælles gymnastkartotek
Systemet SHALL understøtte oprettelse, redigering og søgning af gymnaster samt filtrering efter hold og uden hold. Gymnaster SHALL have stabile identiteter uafhængigt af navn. Ens navne MUST NOT sammenlægge to gymnasters data. Kun oplysninger nødvendige for planlægningen SHALL være obligatoriske.

Standardfilteret SHALL være Alle hold og SHALL medtage aktive gymnaster uden hold. Det aktuelle hold i navigationen MUST NOT begrænse denne standardvisning. Træneren SHALL fortsat kunne vælge ét hold, Uden hold eller søge på navn/kendetegn.

#### Scenario: Åbn det samlede kartotek
- **WHEN** træneren åbner Gymnaster med hold A valgt i navigationen
- **THEN** er Alle hold valgt, og både A's gymnaster, andre holds gymnaster og gymnaster uden hold vises.

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
En ældre inaktiv registrering, flytning eller fjernelse af en anvendt færdighed SHALL gøre berørte pladser i opstillinger tydeligt ugyldige eller uafklarede. Systemet MUST NOT erstatte en gymnast, ændre et valgt spring eller slette andre registreringer stiltiende. Træneren SHALL kunne se og rette de berørte pladser.

#### Scenario: Flyttet gymnast i en omgang
- **WHEN** en gymnast, der er valgt i hold A's baneomgang, flyttes til B
- **THEN** markeres den gamle plads med »ikke længere på holdet«, og analysen kan ikke præsenteres som en komplet gyldig opstilling, før pladsen er rettet.

### Requirement: Holdoversigt støtter sammensætning
Ved ændring af et holds medlemsliste SHALL træneren kunne se opdaterede fælles rytmemomenter, færdighedsdækning og manglende vurderinger. Beregning af en endnu ikke gemt holdsammensætning SHALL være mulig uden at gemme ændringer på Drive.

#### Scenario: Prøv at tilføje en gymnast
- **WHEN** en træner tilføjer en gymnast til holdet i den lokale kladde
- **THEN** opdateres rytmematricen straks, mens Drive-status fortsat viser ugemte ændringer.

### Requirement: Fjern en gymnast fra det aktive kartotek
Træneren SHALL kunne vælge Fjern gymnast fra gymnastens profil. Bekræftelsen SHALL vise navn og eventuelt kendetegn, kunne annulleres og oplyse antal berørte springplanpladser. Gymnasten SHALL derefter være udeladt fra aktive lister, holdtal, rytmeoverblik og nye planvalg. Øvrige gymnaster, færdighedsdefinitioner, personlige vurderinger og eksisterende planreferencer MUST NOT ændres eller slettes af fjernelsen. De berørte pladser SHALL vises som utilgængelige med en forståelig besked om at vælge en anden gymnast. Gamle referencer SHALL kunne gennemgås uden at redigere den fjernede gymnast. Læseadgang MUST NOT tillade fjernelse.

#### Scenario: Fjern den rigtige gymnast ved navnesammenfald
- **WHEN** træneren bekræfter fjernelse af Maja Test med kendetegn Test 1, som har seks valgte planpladser
- **THEN** forsvinder kun denne gymnast fra kartoteket, den anden Maja Test bevares, rytmen opdateres straks, og de seks pladser markeres til rettelse også efter gem/genåbn.

#### Scenario: Annullér fjernelse
- **WHEN** træneren annullerer bekræftelsen
- **THEN** forbliver gymnasten og alle data uændrede, og fokus vender tilbage til handlingen.

### Requirement: Enkel vedligeholdelse uden arkivfunktion
Efter brugerens præcisering SHALL holdoversigt, gymnastkartotek og færdighedsoversigt ikke vise arkivfiltre, arkivhandlinger eller genaktiveringshandlinger. Eksisterende filer med inaktive historiske poster SHALL fortsat kunne læses, gemmes og genåbnes uden sletning eller automatisk genaktivering. Disse poster SHALL være udeladt fra de almindelige aktive lister; præcise historiske planreferencer og deres diagnostik SHALL bevares.

#### Scenario: Redigér uden arkivvalg
- **WHEN** træneren åbner holdlisten, gymnastkartoteket eller en gymnasts færdigheder
- **THEN** kan de almindelige oplysninger vedligeholdes uden arkivfiltre eller arkiv-/genaktiveringsknapper.

#### Scenario: Gem en ældre fil
- **WHEN** træneren åbner en ældre fil med inaktive hold, gymnaster eller færdigheder, retter et holdnavn og gemmer
- **THEN** bevares de historiske poster, deres status og referencer uændret, uden at filen bliver ulæselig.
