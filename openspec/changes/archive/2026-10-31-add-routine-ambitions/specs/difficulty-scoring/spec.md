## ADDED Requirements

### Requirement: D for en ambition beregnes fra springet
For en ambition SHALL springets egen D og pladsens bidrag beregnes fra springdefinitionen under holdets regelpakke uden en gymnastregistrering. Bidraget SHALL indgå i omgangens tællende sum og disciplinens gennemsnit på samme måde som en besat plads med samme spring, herunder holdomgangens afvigelser. Når springets gyldighed kræver gymnastens personlige forbindelsesbekræftelse, SHALL D vises som uafklaret med forklaring, indtil en gymnast tager pladsen. Systemet MUST NOT opdigte en værdi.

#### Scenario: Omgang med en ambition
- **WHEN** en omgang har fem besatte tællende spring med D 0,60 hver og én tællende ambition med D 0,80
- **THEN** er omgangens D 3,80, og ambitionen vises med D 0,80 og Mangler gymnast.

#### Scenario: Ambition afviger i holdomgangen
- **WHEN** en tællende ambition i holdomgangen har et andet spring end holdomgangens entydige reference
- **THEN** får ambitionen bidrag 0,00 med samme forklaring som en besat plads, mens dens egne D vises.

#### Scenario: Brugerdefineret forbindelse
- **WHEN** en ambition har en brugerdefineret forbindelse, som kræver personlig bekræftelse
- **THEN** vises D som uafklaret med forklaringen, at forbindelsen bekræftes, når en gymnast tager pladsen.
