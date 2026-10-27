# Spec Delta

## MODIFIED Requirements

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
