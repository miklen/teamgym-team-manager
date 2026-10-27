# team-roster Specification

## Purpose

Understøtter flere uafhængige hold i ét fælles arbejdsrum og et samlet gymnastkartotek, så holdsammensætning og kompetencer kan vedligeholdes uden dublering.

## Requirements

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
En ældre inaktiv registrering, flytning eller fjernelse af en anvendt færdighed SHALL gøre berørte pladser i opstillinger tydeligt ugyldige eller uafklarede. Gennemgangen SHALL omfatte alle holdets scenarier i begge discipliner og både udførende pladser og reserver, også når scenariet ikke er åbent. Systemet MUST NOT erstatte en gymnast, ændre et valgt spring eller slette andre registreringer stiltiende. Træneren SHALL kunne identificere hold, disciplin, scenarie, omgang og pladstype for de berørte referencer og rette dem. En utilgængelig reserve SHALL markeres særskilt og MUST NOT alene gøre den udførende opstilling ufuldstændig eller ændre dens point og tællende sikkerhed. Bekræftelse ved fjernelse af en anvendt færdighed SHALL oplyse dens brug på tværs af scenarier og reserver og bevare den eksisterende information om eventuelle afhængige arvede vurderinger.

#### Scenario: Flyttet gymnast i en omgang
- **WHEN** en gymnast, der er valgt i hold A's baneomgang, flyttes til B
- **THEN** markeres den gamle udførende plads med »ikke længere på holdet«, og scenariets analyse kan ikke præsenteres som en komplet gyldig opstilling, før pladsen er rettet.

#### Scenario: Flyttet reserve i et lukket scenarie
- **WHEN** en gymnast er reserve i Plan B, mens træneren ser Plan A, og gymnasten flyttes til et andet hold
- **THEN** bevares reserven i Plan B som utilgængelig med præcis scenarie- og omgangskontekst, og den udførende Plan B ændres ikke alene af reservens utilgængelighed.

#### Scenario: Fjern færdighed med flere anvendelser
- **WHEN** en personlig færdighed bruges på én udførende plads i Plan A og som reserve i Plan B og fjernes fra gymnasten
- **THEN** omtaler bekræftelsen begge anvendelser, begge referencer bevares som utilgængelige, og andre gymnasters registreringer samt øvrige scenarievalg bevares.

### Requirement: Holdoversigt støtter sammensætning
Ved ændring af et holds medlemsliste SHALL træneren kunne se opdaterede fælles rytmemomenter, færdighedsdækning og manglende vurderinger. Beregning af en endnu ikke gemt holdsammensætning SHALL være mulig uden at gemme ændringer på Drive.

#### Scenario: Prøv at tilføje en gymnast
- **WHEN** en træner tilføjer en gymnast til holdet i den lokale kladde
- **THEN** opdateres rytmematricen straks, mens Drive-status fortsat viser ugemte ændringer.

### Requirement: Fjern en gymnast fra det aktive kartotek
Træneren SHALL kunne vælge Fjern gymnast fra gymnastens profil. Bekræftelsen SHALL vise navn og eventuelt kendetegn, kunne annulleres og oplyse samlet antal berørte springplanpladser på tværs af alle scenarier og reserver med skelnen mellem udførende pladser og reservepladser. Gymnasten SHALL derefter være udeladt fra aktive lister, holdtal, rytmeoverblik og nye planvalg. Øvrige gymnaster, færdighedsdefinitioner, personlige vurderinger og eksisterende planreferencer MUST NOT ændres eller slettes af fjernelsen. De berørte pladser i alle scenarier SHALL vises som utilgængelige med en forståelig besked om at vælge en anden gymnast. Gamle referencer SHALL kunne gennemgås uden at redigere den fjernede gymnast. Læseadgang MUST NOT tillade fjernelse.

#### Scenario: Fjern den rigtige gymnast ved navnesammenfald
- **WHEN** træneren bekræfter fjernelse af Maja Test med kendetegn Test 1, som har seks valgte udførende planpladser
- **THEN** forsvinder kun denne gymnast fra kartoteket, den anden Maja Test bevares, rytmen opdateres straks, og de seks pladser markeres til rettelse også efter gem/genåbn.

#### Scenario: Annullér fjernelse
- **WHEN** træneren annullerer bekræftelsen
- **THEN** forbliver gymnasten og alle data uændrede, og fokus vender tilbage til handlingen.

#### Scenario: Tæl alle anvendelser
- **WHEN** en gymnast har to udførende pladser i Plan A, én i Plan B og to reservepladser fordelt på bane og trampet
- **THEN** oplyser bekræftelsen fem anvendelser fordelt på tre udførende og to reservepladser, og alle fem referencer bevares som utilgængelige efter bekræftelse og filrundtur.

### Requirement: Enkel vedligeholdelse uden arkivfunktion
Efter brugerens præcisering SHALL holdoversigt, gymnastkartotek og færdighedsoversigt ikke vise arkivfiltre, arkivhandlinger eller genaktiveringshandlinger. Eksisterende filer med inaktive historiske poster SHALL fortsat kunne læses, gemmes og genåbnes uden sletning eller automatisk genaktivering. Disse poster SHALL være udeladt fra de almindelige aktive lister; præcise historiske planreferencer og deres diagnostik SHALL bevares.

#### Scenario: Redigér uden arkivvalg
- **WHEN** træneren åbner holdlisten, gymnastkartoteket eller en gymnasts færdigheder
- **THEN** kan de almindelige oplysninger vedligeholdes uden arkivfiltre eller arkiv-/genaktiveringsknapper.

#### Scenario: Gem en ældre fil
- **WHEN** træneren åbner en ældre fil med inaktive hold, gymnaster eller færdigheder, retter et holdnavn og gemmer
- **THEN** bevares de historiske poster, deres status og referencer uændret, uden at filen bliver ulæselig.
