# rhythm-commonality Specification

## Purpose

Viser hvilke præcise rytmemomenter holdets gymnaster har til fælles, og hvor stabilt hver gymnast behersker dem, så rytmen kan indgå i valg af hold.

## Requirements

### Requirement: Rytmematrix for holdets gymnaster
Systemet SHALL vise en matrix med holdets aktuelle gymnaster og strukturerede rytmemomenter, grupperet efter katalogets kategorier. Hver registrering SHALL vise variant og stabilitet eller ikke vurderet. En manglende registrering SHALL være synligt forskellig fra en registreret færdighed uden stabilitet.

#### Scenario: Gennemgå et holds rytme
- **WHEN** træneren åbner rytmeoverblikket for et hold
- **THEN** vises præcis dette holds aktive gymnaster, relevante momenter og de enkelte registreringer; andre holds gymnaster tæller ikke med.

### Requirement: Præcise fællesnævnere
Et moment SHALL kun betegnes som fælles for alle, når alle aktive holdmedlemmer har en registreret udførelse, der kan opfylde samme momentkrav under holdets reglement. Sammenligning SHALL bruge regelpakkens identitets- og ækvivalensregler frem for familienavn eller D alene.

#### Scenario: Samme kode med uforenelige varianter
- **WHEN** alle har en registrering i samme familie, men én gymnast kun har en variant, som ikke kan udføres på samme måde som de andres efter reglementet
- **THEN** er den konkrete fælles variant ikke opfyldt for alle, og forskellen forklares.

#### Scenario: Tomt hold
- **WHEN** et hold endnu ikke har gymnaster
- **THEN** vises en tomtilstand og ingen automatisk liste over momenter, som »alle« kan.

### Requirement: Dækning og mangler kan undersøges
For hvert moment SHALL systemet vise antal med færdigheden ud af hele holdet, gennemsnitlig og laveste stabilitet, vurderingsdækning samt navnene på gymnaster med manglende færdighed, manglende vurdering eller lav stabilitet. Træneren SHALL kunne skifte mellem fælles momenter og delvist dækkede momenter.

#### Scenario: Næsten fælles moment
- **WHEN** otte af ti gymnaster har et moment
- **THEN** vises 8/10 og de to manglende gymnaster, og de otte registreredes stabilitet skjuler ikke manglen.

### Requirement: Stabilitetsfilter er et krav til hver gymnast
Systemet SHALL kunne filtrere på fælles momenter med en valgt mindste stabilitet fra 1 til 5. Filteret »alle med mindst 4« SHALL kræve en vurdering på mindst 4 for hver gymnast, ikke blot et gennemsnit på 4. Træneren SHALL kunne kombinere det med momentkategori og søgning.

#### Scenario: Gennemsnit er utilstrækkeligt
- **WHEN** fem gymnaster har stabilitet 5 og én har 1
- **THEN** udelukkes momentet fra »alle mindst 4«, selv om gennemsnittet er over 4.

#### Scenario: Ikke vurderet opfylder ikke filter
- **WHEN** alle har færdigheden, men én ikke har en stabilitetsvurdering
- **THEN** er momentet fælles uden stabilitetskrav, men ikke fælles ved et filter med mindste stabilitet.

### Requirement: Holdsammensætning opdaterer fællesnævnerne
Tilføjelse, fjernelse eller flytning af en gymnast og ændring af en færdighed SHALL genberegne matrix, fællesnævnere og dækning i den lokale kladde. Filtre SHALL anvendes på den aktuelle holdsammensætning.

#### Scenario: Ny gymnast ændrer fælles moment
- **WHEN** en gymnast uden et tidligere fælles moment føjes til holdet
- **THEN** ændres momentet straks fra fælles til delvist dækket med den nye gymnast som mangel.

### Requirement: Reglementets anvendelighed er synlig
Rytmemomenter SHALL vise holdets regelbaserede værdi, kode og udførelseskrav, når de er kendte. Registrerede momenter uden gyldig kobling i det valgte reglement SHALL bevares, men MUST NOT fremstå som reglementsgodkendte fælles muligheder. Ændret udførelseskrav SHALL kunne kræve ny vurdering af den konkrete variant.

#### Scenario: Regelversion ændrer momentkrav
- **WHEN** et versionsskift ændrer det krævede afsæt eller landing for et moment
- **THEN** vises de berørte registreringer til revurdering, og de opfylder ikke automatisk det nye krav på grund af et genbrugt navn.

### Requirement: Individuelle fællesnævnere er ikke en færdig rytmekarakter
Overblikket SHALL angive, at det viser individuelle færdigheder og fælles muligheder. Gruppeelementer SHALL være udeladt fra matrix, filtre, stabilitetsaggregater og dækningsmål. Det MUST NOT hævde fuld dækning af alle officielle rytmekategorier, godkendt synkron udførelse, færdig koreografi eller en samlet rytme-C/D/E-karakter ud fra registreringerne alene.

#### Scenario: Alle kan et moment
- **WHEN** alle holdmedlemmer er registreret med stabilitet 5 på samme gyldige variant
- **THEN** vises et stærkt fælles moment uden en påstand om, at holdets samlede rytmeserie dermed er godkendt.

#### Scenario: To forskellige DB804 giver ingen fællesnævner
- **WHEN** nogle gymnaster kun har DB804-pirouetten og andre kun har DB804-stem til håndstand
- **THEN** vises to separate momenter med hver sin dækning, og den fælles officielle kode skaber ikke et fælles moment for hele holdet.
