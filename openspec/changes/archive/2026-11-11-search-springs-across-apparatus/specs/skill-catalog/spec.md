## ADDED Requirements

### Requirement: Springvalg på tværs af bane og trampet
Tilføj færdighed på en gymnast SHALL øverst kun skelne mellem Spring og Rytme. Springvælgeren SHALL have et altid synligt redskabsfilter med Alle, Bane og Trampet under søgefeltet i Find springet, og Alle SHALL være standard. Med Alle SHALL søgning, D-filter, holdkendskab og listen omfatte både bane- og trampetspring, og hver række SHALL vise sit redskab som tekst. Med Bane eller Trampet SHALL listen kun vise det redskab, og rækkerne behøver ikke redskabsmærket. Står filteret på Alle, SHALL kædens første trin være "Bane eller trampet" med antallet af passende spring pr. redskab. Et valg i trinnet SHALL sætte filteret, hvorefter kæden fortsætter med redskabets nuværende pladser. Skift af redskab SHALL nulstille kæden, men MUST NOT fjerne søgetekst, D-filter, valgte spring, vurderinger eller fundament. Byg selv SHALL bruge filterets redskab. Står filteret på Alle, SHALL byggeren starte med et valg mellem Bane og Trampet, før elementer kan vælges. Ambitionens springvalg og pladsvalg i Springplan SHALL fortsat følge omgangens disciplin. Filteret er ren visning og MUST NOT gemmes.

#### Scenario: Søgning rammer begge redskaber
- **WHEN** træneren åbner Tilføj færdighed og søger strakt 1/1 uden at ændre filteret
- **THEN** viser listen både baneserier og trampetspring med strakt 1/1 (360°), og hver række viser Bane eller Trampet.

#### Scenario: Kædens første trin vælger redskab
- **WHEN** filteret står på Alle, og træneren vælger Trampet i kædens første trin
- **THEN** står filteret på Trampet, listen viser kun trampetspring, og kæden fortsætter med redskab og springtype.

#### Scenario: Valg bevares ved redskabsskift
- **WHEN** træneren har valgt en baneserie med sikkerhed 4 og skifter filteret til Trampet og vælger et trampetspring med sikkerhed 3
- **THEN** står begge i Valgte og registreres i én handling med hver sin vurdering.

#### Scenario: Byg selv fra Alle
- **WHEN** filteret står på Alle, og træneren åbner Byg selv
- **THEN** starter byggeren med valget Bane eller Trampet, og elementkataloget vises først efter valget.

## MODIFIED Requirements

### Requirement: Flere spring med sikkerhed i samme registrering
Træneren SHALL kunne markere flere spring i listen og angive sikkerhed 1–5 eller ikke vurderet ud for hvert valgt spring. Valg og vurderinger SHALL bevares mellem søgninger, grupper og skift af redskabsfilter mellem Alle, Bane og Trampet. Én samlet handling SHALL oprette eller opdatere valgene med den angivne vurderingsdato uden dubletter eller ændringer på andre gymnaster, også når valgene omfatter både bane og trampet. En markering SHALL tydeligt betyde, at gymnasten kan udføre hele serien uden mellemtrin; listen MUST NOT kræve den tekniske ekstraerklæring om at have verificeret en præcis forbindelse.

#### Scenario: Flere spring registreres samlet
- **WHEN** træneren markerer en helskrueserie med sikkerhed 5 og en halvskrueserie med sikkerhed 2
- **THEN** kan begge registreres i én handling med hver sin vurdering og fælles vurderingsdato, og valgene forsvinder ikke ved søgning eller skift af redskabsfilter.

### Requirement: Sammenhængende forløb fra søgning til valg og vurdering
Springvælgeren SHALL vise forløbet som to nummererede trin: "Find springet" med søgning, redskabsfilter, kædebygger og et sammenfoldet D-filter, og "Vælg og vurdér sikkerhed" med den afgrænsede liste. På brede skærme SHALL trinene stå side om side, så listen ændrer sig synligt ved siden af afgrænsningen. På smalle skærme SHALL en knap med antallet af passende spring føre direkte ned til listen. Hver række SHALL have sikkerhedsknapper 1–5, hvor ét tryk vælger springet med den vurdering, og en knap til at vælge uden vurdering. Vælgeren MUST NOT bruge afkrydsningsfelter til at vælge spring. Fundament SHALL stå indrykket under det valgte spring med Arvet, 1–5 og fravalg på samme række. Valgte spring SHALL kunne vises for sig i en visning ved siden af resultaterne. Automatisk medtagelse af fundament SHALL være en forklaret kontakt, som kun vises, når der er valgt spring. Under listen SHALL vælgeren føre til Byg selv, og kædens sammenhængende, entydige valg fra første plads SHALL lægges ind som start i Byg selv på kædens redskab. Forløbet ændrer ikke gemte felter.

#### Scenario: Vælg og vurdér i ét tryk
- **WHEN** træneren har afgrænset listen med kæden og trykker 4 på rækken Rondat – flik – strakt 1/1 (360°)
- **THEN** er springet valgt med sikkerhed 4, og dets fundament vises indrykket under det med Arvet 4/5.

#### Scenario: Springet findes ikke
- **WHEN** træneren har valgt Bane og Rondat i kæden og trykker Byg det selv
- **THEN** åbner Byg selv på bane med rondat som første element.

#### Scenario: Smal skærm
- **WHEN** træneren afgrænser med kæden på en 390 px bred skærm
- **THEN** viser knappen "Vis N spring" antallet og fører ned til listen uden vandret siderulning, og redskabsfilteret ruller ikke vandret.
