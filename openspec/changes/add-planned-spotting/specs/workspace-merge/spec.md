# Spec Delta

## ADDED Requirements

### Requirement: Planlagt modtagning følger den atomiske deltagerliste
Planlagt modtagning SHALL være en eksplicit klassificeret del af pladsen i den atomiske deltagerliste. Den har betegnelsen Planlagt modtagning, og grad, element og springreference udgør én samlet værdi. Forskellige samtidige ændringer i samme omgangs deltagerliste, herunder modtagning, SHALL kræve et valg for hele listen. Ændringer i forskellige omgange eller scenarier SHALL fortsat kunne flettes. Konfliktvisningen SHALL vise modtagningens grad og element på dansk for begge sider.

#### Scenario: Samme omgang i begge retninger
- **WHEN** én side planlægger modtagning på en plads, mens den anden side bytter to pladser i samme omgang
- **THEN** tilbydes ét valg for omgangens deltagerliste i begge fletteretninger, og den valgte sides modtagning og rækkefølge anvendes samlet.

#### Scenario: Forskellige omgange
- **WHEN** én side planlægger modtagning i omgang 1, mens den anden ændrer omgang 2
- **THEN** bevares begge ændringer uden konfliktvalg.

### Requirement: Samtidigt ændret spring gør modtagning afledt ugyldig
Når én side planlægger modtagning, og den anden samtidig redigerer den valgte færdighedsregistrering til en anden præcis udførelse, SHALL ændringerne kunne flettes uden konflikt. Resultatet SHALL vise modtagningen som afledt nulstillet i forhåndsvisningen og i alle beregninger. Den afledte nulstilling MUST NOT præsenteres som en uafhængig trænerbeslutning og MUST NOT stiltiende slette andre data. Det samme SHALL gælde, når en nyere fil indlæses til gennemgang med en lokal kladde.

#### Scenario: Begge fletteretninger
- **WHEN** basis B har en baneserie på en plads, lokal L planlægger Kraftig hjælp på seriens sidste element, og fil R redigerer serien til en anden elementliste
- **THEN** giver både fletning af L mod R og R mod L en gyldig kandidat, hvor serien er ændret, og modtagningen er markeret nulstillet uden halveret D eller planlagt E-fradrag.
