# regionsraekken-ruleset Specification

## Purpose

Regionsrækkens regelpakke (`reg@1.0.0`): låste kilder, profiler, deltagere, sværhed, komposition, rytmekatalog og uafhængig verifikation på den fælles DK-motor uden stiltiende DK-arv.

## Requirements

### Requirement: Selvstændig REG-pakke med låste kilder
Systemet SHALL installere en produktionspakke med reglementsidentitet `reg`, pakkeversion `1.0.0` og navnet »Regionsrækken«. Den SHALL have egen manifest, egne profiler, eget springkatalog med REG-anvendelighed, eget rytmekatalog, egen kendt tvivl og egne algoritmeidentiteter.

Kildeoversigten SHALL omfatte H v1.4, A3, A4, A5, A6, TR 2026/27 og Appendix A1.2, hver med SHA-256 og udgave. Pakken MUST NOT arve DK-værdier ved runtime-fallback. Alt REG-indhold SHALL være eksplicit valgt og sporbart til en REG-kildeplacering eller til en dokumenteret afklaringsarv.

#### Scenario: Låst A1.2-kilde
- **WHEN** pakkens kildeoversigt indlæses
- **THEN** indeholder den A1.2 med SHA-256 `90893b0be3c8f0c08f636970dd8068e249e4158db34a82ffdc9d02821657be4a`, og en ændret fil giver en fejlende kildekontrol.

#### Scenario: Ingen stiltiende DK-arv
- **WHEN** en værdi eller regel i REG-pakken ikke har en REG-kildepost eller dokumenteret afklaringsarv
- **THEN** fejler pakkens dækningskontrol, og pakken registreres ikke som produktion.

### Requirement: REG-profiler
Pakken SHALL tilbyde profilerne U11, U14 og junior, hver som piger, drenge og mix. Den nominelle alder SHALL følge TR 1.3 (U11 under 11, U14 under 14, junior 14–17), og TR's dispensationsnote SHALL vises som tekst. Senior MUST NOT tilbydes i REG.

Mixprofiler SHALL kræve tre tællende piger og tre tællende drenge i hver springomgang.

#### Scenario: Opret U11-mixhold
- **WHEN** træneren opretter et hold og vælger Regionsrækken, U11 og mix
- **THEN** bindes holdet til `reg@1.0.0` med U11-mixprofilen, og seniorprofil tilbydes ikke.

### Requirement: Deltagere i REG-springomgange
En fuld REG-springomgang SHALL have seks tællende gymnaster som de sidste udførende (H 9.1f/10.1e). Ekstra gymnaster SHALL stå først og MUST NOT indgå i tællende D, tillæg eller fradrag.

Pakken SHALL tillade op til seks ekstra gymnaster pr. omgang. Grænsen er afledt af TR 1.3.1 (højst 12 deltagende gymnaster). Den SHALL vises og dokumenteres som en afledt planlægningsgrænse, ikke som en trykt REG-regel.

#### Scenario: Tolv udførende
- **WHEN** seks ekstra gymnaster efterfølges af seks tællende i en REG-omgang
- **THEN** er omgangen gyldig, og kun de sidste seks er grundlag for point.

#### Scenario: Trettende udførende
- **WHEN** træneren forsøger at tilføje en trettende udførende gymnast i en REG-omgang
- **THEN** afvises handlingen med forklaring af grænsen og dens TR-grundlag.

#### Scenario: Ekstra efter tællende
- **WHEN** en ekstra gymnast placeres efter en tællende gymnast
- **THEN** er strukturen ugyldig på samme måde som i DK, fordi de første gymnaster er de ikke-tællende.

### Requirement: REG-sværhed på bane og trampet
Elementværdier SHALL følge REG-kolonnerne i H 9.3.5/10.3.5 med A3/A4 og samme skruetillæg pr. 180°, som reglementet angiver for enkeltrotationer. En seriens D SHALL være summen af de op til tre forskellige elementer med højest værdi (H 9.3.1).

Dobbelt- og trippelroterende elementer MUST give D 0 og markeres som ikke tilladt i REG (H 9.3.2/10.3.2). Det gælder også overslag-salto og Tsukahara på Pegasus, fordi overslaget tæller som rotation. På Pegasus SHALL kun mølleoverslag (0,30) og overslag (0,40) være gyldige.

Ikke-tilladte spring SHALL behandles, som DK-pakken behandler trippelrotationer: forklaret, udelukket fra gyldige valg og bevaret til rettelse.

#### Scenario: Overslag-salto på Pegasus
- **WHEN** et REG-hold planlægger overslag-salto lukket på Pegasus
- **THEN** er D 0, springet markeres som ikke tilladt i REG med henvisning til H 10.3.2, og det tilbydes ikke som gyldig kandidat.

#### Scenario: Dobbeltsalto på bane
- **WHEN** en REG-baneserie er rondat–flik–dobbelt baglæns lukket salto
- **THEN** markeres serien som ikke tilladt i REG, og den vises ikke som fuldt gyldig.

#### Scenario: Enkeltsalto med helskrue på bane
- **WHEN** en REG-baneserie er rondat (0,10) – flik (0,20) – strakt baglæns salto med 360° (0,30 + 2 × 0,10)
- **THEN** er seriens D 0,80, håndregnet fra H 9.3.5 og A3.

#### Scenario: Fri trampet med halvskrue
- **WHEN** et REG-hold planlægger forlæns lukket salto med 180° skrue uden redskab
- **THEN** er D 0,20 (0,10 + 0,10), håndregnet fra H 10.3.5 og A4.

### Requirement: REG-banens komposition
Banens C SHALL starte i 0,0 og aldrig blive under 0,0 (H 9.2.1). Satser og regler:

| Forhold | REG-regel | Kilde |
|---|---|---|
| Manglende holdomgang | 0,1 pr. gymnast | H 9.2.2.1 |
| Gentagelse | 0,1 pr. gang | H 9.2.2.3 |
| Manglende forlæns eller baglæns omgang | 0,1 pr. gymnast | H 9.2.2.4 |
| Skruetillæg | 0,2 pr. gymnast med mindst 360° i ét element, i den bedste omgang | H 9.2.3.1 |
| Elementtillæg | 0,1 pr. forskelligt element | H 9.2.3.3 |

Rækkefølgefradrag, flowfradrag og dobbelttillæg MUST NOT beregnes eller vises som manglende for REG (H 9.2.2.2, 9.2.2.5, 9.2.3.2 og opsummeringen i 9.2.4).

#### Scenario: Fuld bane med skruetillæg
- **WHEN** et REG-hold har seks tællende i alle tre omgange:
  - omgang 1: rondat–flik–lukket baglæns salto
  - omgang 2: kraftspring–forlæns lukket salto
  - omgang 3: rondat–flik–strakt baglæns salto med 360°
- **THEN** er C 2,20, håndregnet:
  - elementtillæg (6 × 0,2 + 6 × 0,1 + 6 × 0,2) / 3 = 1,00
  - skruetillæg 6 × 0,2 = 1,20
  - ingen fradrag
- **AND** giver den samme plan under DK 1.1.0 C 1,60, fordi DK-skruetillægget er 6 × 0,1.

#### Scenario: Faldende sværhed i REG
- **WHEN** omgang 2 har tællende enkeltsaltoer i rækkefølgen D 0,80 → 0,60 → 0,70
- **THEN** gives intet rækkefølgefradrag, og der vises ikke et rækkefølgeforhold som manglende.

#### Scenario: Afvigende gymnast i holdomgangen
- **WHEN** fem tællende har identisk serie i omgang 1, og den sjette har en anden serie
- **THEN** får den sjette D 0 for serien, og holdomgangsfradraget er 0,10.

### Requirement: REG-trampettens komposition
Trampettens C SHALL starte i 1,0 og aldrig blive under 0,0 (H 10.2.1). Satser og regler:

| Forhold | REG-regel | Kilde |
|---|---|---|
| Manglende holdomgang | 0,1 pr. gymnast | H 10.2.2.1 |
| Gentagelse | 0,1 pr. gang | H 10.2.2.3 |
| Manglende omgang med eller uden redskab | 0,1 pr. gymnast | H 10.2.2.5 |
| Skruetillæg | 0,2 pr. gymnast i den bedste omgang | H 10.2.3.1 |

Skruekravet til tillægget SHALL være mindst 360° for junior og U14 og mindst 180° for U11. På redskab SHALL skruen ligge efter håndisætningen.

Rækkefølgefradrag, flowfradrag og begge dobbelttillæg MUST NOT beregnes for REG (H 10.2.2.2, 10.2.2.4, 10.2.3.2–3 og opsummeringen i 10.2.4).

#### Scenario: U11 med halvskrue
- **WHEN** fire tællende i et U11-holds bedste skrueomgang udfører fri enkeltsalto med 180° skrue
- **THEN** er skruetillægget 4 × 0,2 = 0,80.

#### Scenario: U14 med halvskrue
- **WHEN** den samme omgang planlægges for et U14-hold
- **THEN** giver springet intet skruetillæg, fordi U14 kræver mindst 360°.

#### Scenario: Fuld trampet
- **WHEN** et REG-U14-hold har seks tællende i alle tre omgange:
  - omgang 1: fri forlæns lukket salto
  - omgang 2: overslag på Pegasus
  - omgang 3: fri forlæns strakt salto med 360°
- **THEN** er C 1,0 + 6 × 0,2 = 2,20 uden fradrag.

#### Scenario: Ingen Pegasus-omgang
- **WHEN** et REG-hold har tre fulde omgange uden redskab
- **THEN** er redskabsfradraget 6 × 0,1 = 0,60.

### Requirement: DK-afklaringer gælder for REG med REG's satser
DK 1.1.0's trænerafklaringer SHALL gælde for REG, medmindre REG-reglementet fastsætter andre rammer. Hver arv SHALL være registreret med begrundelse i pakkens kontrolposter.

- **Q01:** Elementtillæg tæller hvert forskelligt gyldigt element ud over seriens første.
- **Q03:** Gentagelse tælles pr. præcis identitet for holdet; den omgang med flest forekomster friholdes. Satsen er REG's 0,1.
- **Q04:** En blandet Pegasus-omgang er ugyldig planlægning.
- **Q02 og Q06** SHALL registreres som ikke relevante for REG, fordi dobbeltrotationer er forbudt og rækkefølgefradrag ikke findes.
- **Q05** og de øvrige punkter, som er åbne i DK 1.1.0, SHALL forblive uafklarede i REG.

#### Scenario: Q01 i REG
- **WHEN** en REG-baneserie er rondat–flik–flik
- **THEN** giver serien 0,1 i elementtillæg før gennemsnit over tre omgange.

#### Scenario: Q03 i REG
- **WHEN** samme præcise serie forekommer to gange i omgang 2 og tre gange i omgang 3
- **THEN** friholdes omgang 3, og gentagelsesfradraget er 2 × 0,1 = 0,20.

#### Scenario: Q05 forbliver åben
- **WHEN** et REG-holds holdomgang er fordelt 3+3 mellem to serier
- **THEN** vises uafklaret resultat med Q05, og der vælges ingen vilkårlig reference.

### Requirement: Modtagning i REG
Planlagt modtagning SHALL i REG bruge A6 1.7's satser: let støtte giver 0,5, og hjælp til udførelse giver 1,0. Kraftig hjælp i svæv/landing SHALL halvere D som i DK (H 9.3.3/10.3.3). Q-SPOT-DUP SHALL forblive uafklaret.

#### Scenario: Hjælp til udførelse
- **WHEN** et REG-element planlægges med hjælp til udførelse
- **THEN** vises et planlagt E-fradrag på 1,0 med kilde A6 1.7.

### Requirement: REG-rytmekatalog fra A1.2
Pakken SHALL tilbyde alle 75 individuelle momentfelter fra A1.2; G er udeladt som i DK. Hvert moment SHALL have:
- side
- trykt kode
- kategori
- REG-værdi fra den kolonne i tabellen, hvor cellen står
- generelle krav, kategorikrav, rækkekrav og specifikke krav

Værdien MUST NOT udledes af kodens første ciffer (A1REG-U01). Elementer med samme kode i DK og REG SHALL kunne have forskellig værdi og forskellige krav.

#### Scenario: Tabelværdi frem for kodeciffer
- **WHEN** kataloget indlæser HB1001, F402, SB804 og A404
- **THEN** er værdierne 0,6, 0,3, 0,6 og 0,3 efter A1.2-cellerne.

#### Scenario: Gruppeelementer udeladt
- **WHEN** et REG-hold åbner rytmekataloget
- **THEN** tilbydes ingen G-momenter, og A1REG-U02 (dobbelt G802) påvirker ikke katalogets identiteter.

### Requirement: Eksplicit kortlægning af rytmemomenter
Hvert REG-moment SHALL enten genbruge et eksisterende DK-moment-id eller få et nyt stabilt REG-id. Genbrug kræver en kortlægningspost, der dokumenterer, at udførelseskrav og varianter er identiske under begge kilder. Uden dokumenteret identitet SHALL momentet få et nyt id.

Registreringer, der peger på et moment-id uden kobling i holdets pakke, SHALL bevares og vises som ukendte under den pakke. De MUST NOT tælle som fælles momenter.

#### Scenario: Samme udførelse med anden værdi
- **WHEN** et moment har dokumenteret identiske udførelseskrav og varianter i A1.1 og A1.2, men forskellig trykt værdi
- **THEN** genbruger REG DK-momentets id, og en gymnasts registrering vises med REG-værdien på et REG-hold og DK-værdien på et DK-hold uden ny vurdering.

#### Scenario: Forskellig udførelse med samme kode
- **WHEN** en kode har forskellig variantbeskrivelse i A1.1 og A1.2
- **THEN** får REG-momentet et eget id, og DK-registreringen vises ikke som kendt på et REG-hold.

### Requirement: REG-rytmens rammer som kildegrundlag
Pakken SHALL dokumentere REG-rytmens D- og C-rammer (H 8.2/8.3) som kildegrundlag og kendt tvivl uden at beregne en rytmekarakter. Det omfatter:
- RS 0,3, som ikke gælder U11
- retninger 0,2 hver
- tre formationer à 0,2
- ingen LF, SF eller CF og ingen tillæg for bevægelser ind og ud
- 7 elementer for U14/junior og 6 uden G for U11
- H-U08 (C-maksimum 1,2 mod komponentsummen 1,3) og A1REG-U01–U05

#### Scenario: Kendt tvivl om REG-rytme
- **WHEN** træneren åbner Kendt tvivl for et REG-hold
- **THEN** vises H-U08 og A1REG-U01–U05 med kildelinks, og rytmeoverblikket hævder ingen samlet rytmekarakter.

### Requirement: Uafhængig verifikation før produktion
Hver numerisk REG-regel SHALL have en kontrolpost med:
- kildeplacering i den låste udgave
- profil
- formel
- tælleenhed
- undtagelser
- mindst én håndregnet facitcase, hvis forventede tal er skrevet direkte fra kilden og ikke genereret af produktionskoden

A1.2-kataloget SHALL kontrolleres celle for celle mod originalens kolonneplacering og en visuel gengivelse af siderne.

Pakkens test SHALL omfatte:
- REG-facitcases
- DK 1.0.0/1.1.0-regression uden ændrede resultater
- REG-specifikke regelmutationer, der fanges af den tilsigtede facitcase
- en dækningsrapport fra kildepunkt til kontrolpost og test

#### Scenario: Forkert transskriberet A1.2-værdi
- **WHEN** en katalogværdi afviger fra cellens kolonne i A1.2-PDF'en, f.eks. F402 0,1 i stedet for 0,3
- **THEN** fejler cellekontrollen, og pakken frigives ikke.

#### Scenario: Mutation af REG-sats
- **WHEN** REG-skruetillægget i en isoleret testkopi ændres fra 0,2 til 0,1
- **THEN** fanges ændringen af den håndregnede banefacitcase.

#### Scenario: DK uændret
- **WHEN** motoren parametriseres til REG
- **THEN** giver alle eksisterende DK 1.0.0- og 1.1.0-facitcases og regressionstest samme resultater som før.
