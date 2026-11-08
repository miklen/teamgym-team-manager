# Spec Delta

## MODIFIED Requirements

### Requirement: D for en ambition beregnes fra springet
For en ambition SHALL springets egen D og pladsens bidrag beregnes fra springdefinitionen under holdets regelpakke uden en gymnastregistrering. Bidraget SHALL indgå i omgangens tællende sum og disciplinens gennemsnit på samme måde som en besat plads med samme spring, herunder holdomgangens afvigelser. En kendt problematisk eller ikke-verificeret forbindelse, som træneren udtrykkeligt har godkendt for den præcise kæde i arbejdsrummet, SHALL tælle med fuld kendt D fra de tilladte elementer. Godkendelsen SHALL vises som trænerens vurdering af forbindelsen og MUST NOT skjule en reglementsmæssigt forbudt eller uafklaret elementværdi. Uden relevant godkendelse SHALL forbindelsens betydning for planlagt D vises som uafklaret med forklaring; systemet MUST NOT opdigte en værdi.

#### Scenario: Omgang med en ambition
- **WHEN** en omgang har fem besatte tællende spring med D 0,60 hver og én tællende ambition med D 0,80
- **THEN** er omgangens D 3,80, og ambitionen vises med D 0,80 og Mangler gymnast.

#### Scenario: Ambition afviger i holdomgangen
- **WHEN** en tællende ambition i holdomgangen har et andet spring end holdomgangens entydige reference
- **THEN** får ambitionen bidrag 0,00 med samme forklaring som en besat plads, mens dens egne D vises.

#### Scenario: Brugerdefineret forbindelse
- **WHEN** en ambition har en brugerdefineret forbindelse uden fælles godkendelse
- **THEN** vises D som uafklaret med forklaringen, at træneren kan godkende den præcise kæde for arbejdsrummet.

#### Scenario: Kendt standardserie med startsalto
- **WHEN** en ambition bruger Strakt salto – rondat – flik fra det indbyggede springkatalog med direkte overgange
- **THEN** er forbindelsen kendt i den korrigerede regelpakke, D beregnes uden gymnast, og der vises ingen opfordring til fælles godkendelse.

#### Scenario: Indbyggede serier med startsalto og flyvespring
- **WHEN** en ambition bruger en indbygget serie med en startsalto efterfulgt af flyvespring og direkte overgange
- **THEN** er forbindelsen kendt i både springvælger og korrigeret regelpakke og kræver ingen godkendelse.

#### Scenario: Godkendt forbindelse tæller fuldt
- **WHEN** en ambition bruger en præcis kæde med kendte tilladte elementværdier og fælles trænergodkendelse af forbindelsen
- **THEN** indgår kædens fulde regelpakke-D i omgangens planlagte tællende sum, selv om ingen gymnast er valgt.

#### Scenario: Forbudt element bevarer sin status
- **WHEN** en godkendt kæde indeholder et element, som holdets regelpakke forbyder
- **THEN** gør kædegodkendelsen ikke elementet gyldigt og giver ikke en opdigtet fuld D.
