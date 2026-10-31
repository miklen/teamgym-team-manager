## MODIFIED Requirements

### Requirement: Rytmekatalog med udførelsesvarianter
Systemet SHALL tilbyde rytmekataloget fra holdets regelpakke:
- DK: alle 94 individuelle momentfelter fra det fastlåste A1.1-DK-bilag efter reference/rhythm-catalog.csv og reference/rhythm-requirements.md.
- REG: alle 75 individuelle momentfelter fra det fastlåste A1.2-REG-bilag.

Momenterne SHALL grupperes efter bilagets kategorier og vise navn, trykt kode, værdi, generelle krav, kategorikrav og specifik variantbeskrivelse. Gruppeelementer (G) SHALL være udeladt fra katalog, registrering og analyse.

Sammenligning SHALL tage hensyn til udførelseskrav, herunder relevante afsæts-/landingsvarianter. Spejling SHALL behandles efter regelpakkens ækvivalensregler og MUST NOT tilsidesætte et specifikt krav om fælles startretning for ansigtet. En registrering SHALL kun gælde i en anden pakke gennem en eksplicit kortlægning af moment-id.

#### Scenario: To registreringer er ikke nødvendigvis fælles
- **WHEN** to gymnaster er registreret på samme momentfamilie, men udfører forskellige varianter, som ikke kan opfylde samme holdkrav
- **THEN** vises de ikke som et fælles identisk moment alene på grund af familienavnet.

#### Scenario: Gruppeelementer er udeladt
- **WHEN** træneren søger eller filtrerer rytmekataloget og tilføjer færdigheder til en gymnast
- **THEN** tilbydes ingen G-momenter, løft, kast eller registrering af deltagergrupper, mens alle individuelle momentfelter fortsat er dækket.

#### Scenario: Officiel kode forekommer to gange
- **WHEN** kataloget indlæser DB804 for pirouetten på A1.1 side 3 og stem til håndstand på side 4
- **THEN** bevares de trykte koder og begge værdier 0,80, men momenterne får forskellige stabile interne id'er og krav, så registreringer ikke sammenlægges.

#### Scenario: Katalog følger holdets pakke
- **WHEN** træneren åbner rytmekataloget fra et REG-hold og derefter fra et DK-hold
- **THEN** viser REG-holdet 75 momenter med A1.2-værdier, og DK-holdet viser 94 momenter med A1.1-værdier.
