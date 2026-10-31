## MODIFIED Requirements

### Requirement: Udvidelse uden ændret kartotek
Tilføjelse af Regionsrækken eller Liga SHALL kunne ske ved at tilføje regeldata, katalogkoblinger og afgrænsede beregningsmoduler gennem det eksisterende regelsnit. Fælles kartotek, stabilitetsmodel og generelle arbejdsgange MUST NOT kræve omlægning eller en global rækkevariabel.

Produktet SHALL indeholde Danmarksserien og Regionsrækken (`reg@1.0.0`) som installerede produktionspakker. REG SHALL vises med samme tvivlsmarkering som DK, hvor kendt tvivl påvirker resultatet. En separat testpakke SHALL fortsat bevise kontrakten uden at foregive produktionsgodkendt Liga-understøttelse.

Parametrisering af den fælles motor til REG MUST NOT ændre resultater for eksisterende DK-versioner.

#### Scenario: Andet reglement i kontrakttest
- **WHEN** en syntetisk anden regelpakke med andre værdier og deltagerkrav indlæses i en integrationstest
- **THEN** følger hvert hold sin pakke gennem katalog, planlægning og resultater uden hardkodede DK-grene i brugerfladen.

#### Scenario: DK- og REG-hold side om side
- **WHEN** et hold bruger `dk@1.1.0`, og et andet bruger `reg@1.0.0`, med samme gymnaster og samme serie
- **THEN** beregnes hvert hold med sin pakkes satser, katalog og deltagergrænser, og DK-holdets resultat er identisk med resultatet før REG blev installeret.

#### Scenario: Skift fra DK til REG
- **WHEN** træneren forhåndsviser skift af et DK-hold til REG
- **THEN** viser versionsskiftet ændrede værdier, nye ugyldigheder (f.eks. dobbeltrotationer) og registreringer uden kobling, før skiftet gemmes.
