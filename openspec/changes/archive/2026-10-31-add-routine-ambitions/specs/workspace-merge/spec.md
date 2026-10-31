## ADDED Requirements

### Requirement: Ambitionspladser følger den atomiske deltagerliste
Ambitionens planlagte spring SHALL være en eksplicit klassificeret del af pladsen i den atomiske deltagerliste med betegnelsen Planlagt spring. Oprettelse, ændring, besættelse og fjernelse af en ambition SHALL være ændringer af omgangens deltagerliste. Forskellige samtidige ændringer i samme omgangs deltagerliste SHALL kræve ét valg for hele listen, mens identiske ændringer og ændringer i forskellige omgange eller scenarier SHALL flettes uden konfliktvalg. Konfliktvisningen SHALL vise en ambition på dansk med springnavn og Mangler gymnast. Kan nu-antal og match er afledte værdier og MUST NOT gemmes eller flettes.

#### Scenario: To trænere besætter samme ambition
- **WHEN** basis B har en ambition, lokal L besætter den med Oskar, og fil R besætter den med Mia
- **THEN** tilbydes ét valg for omgangens deltagerliste i begge fletteretninger, og resultatet indeholder kun den valgte sides besættelse.

#### Scenario: Spring ændres mens pladsen besættes
- **WHEN** én side skifter ambitionens spring, og den anden side besætter ambitionen med en gymnast, der kan det oprindelige spring
- **THEN** kræves ét valg for deltagerlisten i begge retninger, og intet resultat kombinerer det nye spring med den anden sides gymnast.

#### Scenario: Samme gymnast som besættelse og reserve
- **WHEN** én side besætter en ambition med Oskar, og den anden side gør Oskar til reserve i samme omgang
- **THEN** giver kombinationen en forklaret konflikt eller blokering i begge fletteretninger, og der anvendes ikke en ugyldig kombineret fil.

#### Scenario: Samme spring defineret på to sider
- **WHEN** én side opretter en ambition med en ny definition, og den anden side samtidig registrerer samme spring på Mia som en anden definition med samme identitet
- **THEN** flettes begge uden konflikt, og Mia tæller i ambitionens Kan nu.
