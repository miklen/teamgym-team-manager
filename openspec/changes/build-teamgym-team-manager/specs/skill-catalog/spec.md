# Spec Delta

## Purpose

Giver trænerne præcise, genbrugelige færdigheder for bane, trampet og rytme, som kan vurderes efter forskellige reglementer uden beregning ud fra fritekst.

## ADDED Requirements

### Requirement: Præcise elementidentiteter
Systemet SHALL beskrive spring med disciplin, elementfamilie, rotationsretning, rotationer, kropsposition, skrueantal, relevant skruefordeling og redskab. Alias og daglige navne SHALL pege på samme præcise identitet, når reglementet anser springene for ens. Forskellig værdi og forskellig identitet MUST NOT sammenblandes.

#### Scenario: Samme værdi er ikke samme serie
- **WHEN** to baneserier har samme D, men forskellige elementer eller elementrækkefølge
- **THEN** behandles de som forskellige serier ved holdomgang og gentagelseskontrol.

#### Scenario: Alias skaber ikke ny variation
- **WHEN** to trampetspring har navne, som reglementet definerer som ækvivalente, eksempelvis den relevante Tsukahara-/Kasamatsu-variant
- **THEN** får de samme normaliserede identitet ved holdomgang og gentagelser.

### Requirement: Struktureret springbygger
Træneren SHALL kunne søge standardfærdigheder og opbygge en komplet baneserie af strukturerede elementer i rækkefølge samt vælge et struktureret trampetspring. Byggeren SHALL løbende vise præcist navn, D og det valgte holds reglementsmæssige begrænsninger. Noter MUST NOT ændre den beregnede identitet.

#### Scenario: Byg en hel baneserie
- **WHEN** træneren vælger rondat, flik og strakt baglæns salto med helskrue
- **THEN** vises hele kæden, elementernes værdier og samlet D under den valgte regelprofil før registrering på gymnasten.

### Requirement: Færdige spring og fælles springbibliotek
Registrering af spring SHALL som udgangspunkt tilbyde en søgbar liste af gængse komplette sammensætninger med præcise positioner, skruer og D under holdets regelpakke. Listen SHALL omfatte rondat-/flik-/whipbackfamilier og kraftspring-/forlæns startsaltofamilier, herunder rondat-flik-1/1, kraft-barani og strakt-kraft-rudy. En særskilt Byg selv-mulighed SHALL bevare den strukturerede bygger til sjældne varianter. Springdefinitioner registreret i arbejdsrummet SHALL kunne genbruges på andre gymnaster efter gemning og genåbning uden at skulle bygges igen. Vurdering og personlig forbindelsesbekræftelse MUST NOT kopieres til den næste gymnast.

#### Scenario: Vælg en gængs hel serie
- **WHEN** træneren søger rondat-flik-1/1
- **THEN** kan rondat-flik-strakt baglæns salto med 360° vælges samlet med D og præcis udførelse uden valg af hvert element.

#### Scenario: Egne spring genbruges
- **WHEN** træneren bygger og registrerer en egen serie og senere åbner en anden gymnast i samme arbejdsrum
- **THEN** kan serien vælges fra listen med samme definition og en selvstændig uvurderet registrering; en eventuel personlig forbindelsesbekræftelse skal gives på ny.

### Requirement: Kortere begyndelser af en registreret serie
Ved registrering af en komplet baneserie SHALL de præcise kortere serier fra samme begyndelse være medtaget som standard og vises før registrering. Træneren SHALL kunne fravælge dem. Rondat-flik-1/1 SHALL således medtage rondat og rondat-flik. Dette MUST NOT udlede færre skruer, andre kropspositioner, nye efterfølgende forbindelser eller færdigheder ved at kombinere enkeltregistreringer. Nye kortere registreringer SHALL være uden stabilitetsvurdering. Eksisterende id'er, vurderinger, noter og arkiveringsvalg SHALL bevares.

#### Scenario: Helskrueserie giver kortere begyndelser
- **WHEN** rondat-flik-1/1 registreres med kortere serier medtaget
- **THEN** oprettes manglende rondat og rondat-flik som særskilte uvurderede registreringer uden dubletter eller antaget stabilitet; rondat-flik-halvskrue udledes ikke.

### Requirement: Kontrol af forbindelser
Springbyggeren MUST kontrollere kendte orienterings- og forbindelsesbegrænsninger og MUST skelne mellem dokumenteret forbindelse, ugyldig forbindelse og ikke-verificeret forbindelse. Reglementsmæssige elementværdier MUST NOT alene godkende enhver elementpermutation som anvendelig serie. En hel serie SHALL registreres særskilt som gymnastens færdighed.

#### Scenario: Enkeltelementer danner ikke automatisk en færdighed
- **WHEN** en gymnast har kraftspring og salto registreret hver for sig
- **THEN** kan kraftspring-salto ikke vælges som hendes beherskede serie, før den komplette forbindelse er registreret.

#### Scenario: Ikke-verificeret specialforbindelse
- **WHEN** træneren bygger en kombination, som ikke er dækket af de kontrollerede forbindelsesregler
- **THEN** vises den som ikke verificeret, og den tæller ikke som en sikker gyldig planlægningskandidat; en eksplicit trænerbekræftelse af den konkrete forbindelse og gyldige elementer er nødvendig.

### Requirement: Rytmekatalog med udførelsesvarianter
Systemet SHALL tilbyde alle 94 individuelle momentfelter fra det fastlåste A1.1-DK-bilag, grupperet efter bilagets kategorier, med navn, trykt kode, værdi, generelle krav, kategorikrav og specifik variantbeskrivelse efter reference/rhythm-catalog.csv og reference/rhythm-requirements.md. Gruppeelementer (G) SHALL være udeladt fra katalog, registrering og analyse. Sammenligning SHALL tage hensyn til udførelseskrav, herunder relevante afsæts-/landingsvarianter. Spejling SHALL behandles efter regelpakkens ækvivalensregler og MUST NOT tilsidesætte et specifikt krav om fælles startretning for ansigtet.

#### Scenario: To registreringer er ikke nødvendigvis fælles
- **WHEN** to gymnaster er registreret på samme momentfamilie, men udfører forskellige varianter, som ikke kan opfylde samme holdkrav
- **THEN** vises de ikke som et fælles identisk moment alene på grund af familienavnet.

#### Scenario: Gruppeelementer er udeladt
- **WHEN** træneren søger eller filtrerer rytmekataloget og tilføjer færdigheder til en gymnast
- **THEN** tilbydes ingen G-momenter, løft, kast eller registrering af deltagergrupper, mens alle individuelle momentfelter fortsat er dækket.

#### Scenario: Officiel kode forekommer to gange
- **WHEN** kataloget indlæser DB804 for pirouetten på A1.1 side 3 og stem til håndstand på side 4
- **THEN** bevares de trykte koder og begge værdier 0,80, men momenterne får forskellige stabile interne id'er og krav, så registreringer ikke sammenlægges.

### Requirement: Gymnastens færdighedsregistrering
En gymnast SHALL kunne få tilføjet, redigeret og arkiveret hele baneserier, trampetspring og rytmemomenter med stabilitet eller ikke vurderet, vurderingsdato og eventuel kort note. Registrering af samme præcise færdighed igen SHALL føre til redigering af den eksisterende registrering frem for utilsigtede dubletter. Overgangen fra manglende registrering til registreret uden vurdering SHALL være eksplicit.

#### Scenario: Færdigheden findes allerede
- **WHEN** træneren forsøger at tilføje samme normaliserede færdighed til samme gymnast igen
- **THEN** åbnes den eksisterende registrering, så stabilitet og note kan opdateres.

### Requirement: Regelværdi er adskilt fra færdighed
En færdighed SHALL kunne være registreret, selv om den ikke er tilladt eller kendt i det aktuelle holds reglement. Systemet SHALL bevare registreringen og forklare anvendeligheden pr. hold; en ikke-tilladt eller ikke-verificeret færdighed MUST NOT tilbydes som gyldig kandidat i en omgang.

#### Scenario: Flytning ændrer anvendelighed
- **WHEN** en gymnast med et dobbeltroterende spring senere flyttes fra DK til et hold med et reglement, der ikke tillader springet
- **THEN** bevares færdigheden og stabiliteten, mens planlægningen viser den som ikke tilladt for det nye hold.

### Requirement: Kildedækning og manglende katalogposter
Kataloget SHALL indeholde verificerbare henvisninger til officielle kilder og SHALL dække de gyldige kombinationer af basisværdier og tillæg, som den understøttede regelpakke beskriver, også hvor et spring ikke har en trykt kode. Uafklarede poster SHALL fremgå som sådanne. Leverancen MUST NOT nøjes med et lille demonstrationsudvalg af spring eller rytmemomenter.

#### Scenario: Gyldigt spring uden særskilt tabelkode
- **WHEN** en springvariant kan udledes entydigt af kildeverificerede basisværdier og skruetillæg
- **THEN** kan den oprettes struktureret med beregningsforklaring uden at kræve en opdigtet officiel kode.
