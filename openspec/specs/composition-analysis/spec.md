# composition-analysis Specification

## Purpose

Forklarer holdets planlagte komposition, allerede opnåede og mulige tillæg samt fradrag på tværs af de tre omgange i hver springdisciplin.

## Requirements

### Requirement: Forklarlig C-oversigt pr. disciplin
Systemet SHALL vise grundværdi, hvert tillæg, hvert fradrag, rå sum og C efter regelpakkens nedre grænse. Hvert forhold SHALL vise beløb, regelhenvisning, berørte omgange/gymnaster og status som opfyldt, delvist opfyldt, ikke opfyldt, ikke vurderbart eller uafklaret. DK-bane SHALL starte fra 0,00 og DK-trampet fra 1,00; C SHALL ikke være negativ. Panelværdien SHALL nedrundes til nærmeste 0,005 efter pkt. 4.6 efter rå beregning og nedre grænse. Et ældre generelt loft på kompositionsfradrag MUST NOT genindføres i den fastlåste v1.4-pakke.

#### Scenario: Fradrag overstiger tillæg
- **WHEN** kendte fradrag overstiger grundværdi og tillæg
- **THEN** vises alle fradrag og den rå sum fortsat, mens den beregnelige C begrænses til 0,00.

### Requirement: Banens kompositionskrav
DK-analysen SHALL kontrollere identisk holdomgang først, gentagne identiske serier på tværs af omgange, ren forlæns og ren baglæns omgang samt rækkefølge i omgang 2 og 3. Rondat SHALL klassificeres baglæns. Blandet serie SHALL ikke opfylde et krav om udelukkende forlæns eller baglæns elementer. DK-satser SHALL være 0,20 pr. relevant gymnast/gentagelse for holdomgang, retning og gentagelse og 0,10 pr. forkert rækkefølge.

#### Scenario: Blandet serie tæller ikke som ren retning
- **WHEN** en valgt serie indeholder både forlæns og baglæns elementer
- **THEN** opfylder den ikke nogen af de to rene retningskrav, selv om sidste landing vender i den ønskede retning.

#### Scenario: Gentagelse mellem omgange
- **WHEN** samme normaliserede serie forekommer i flere omgange
- **THEN** anvendes pakkens gentagelsesregel med omgangen med flest forekomster fri, og de fradragsudløsende forekomster forklares uden at forveksle dem med en gentagen flik inde i serien; berøres den uafklarede optælling i Q03, vises uafklaret beløb frem for en selvvalgt formel.

### Requirement: Trampettens kompositionskrav
DK-analysen SHALL kontrollere identisk holdomgang først, gentagelser, rækkefølge og mindst én omgang med og én uden Pegasus. Holdomgang, gentagelse og manglende redskabsvariation SHALL bruge 0,20 pr. relevant gymnast/gang, og rækkefølge SHALL bruge 0,10 pr. gang. Reglerne SHALL anvende præcis elementidentitet og den korrekte rotationskategori.

#### Scenario: Redskabsomgang mangler
- **WHEN** alle tre fuldt udfyldte trampetomgange er uden redskab
- **THEN** vises det manglende Pegasus-krav og det kildebaserede C-fradrag samt de berørte pladser.

### Requirement: Banens tillæg beregnes særskilt
DK-analysen SHALL beregne skruetillæg på 0,10 pr. tællende gymnast med mindst 360° i ét element i den bedste omgang for dette tillæg og dobbelttillæg på 0,10 pr. tællende gymnast i den bedste omgang for dette tillæg. Elementtillæg SHALL behandles særskilt, og den kendte konflikt mellem ordlyd og eksempel SHALL håndteres som uafklaret, indtil en dokumenteret afklaring er udgivet.

#### Scenario: Forskellige bedste omgange
- **WHEN** omgang 2 har flest gymnaster med skrue og omgang 3 har flest med dobbeltrotation
- **THEN** bruges hver sin bedste omgang, og appen kræver ikke at begge tillæg optjenes i samme omgang.

#### Scenario: Uafklaret elementtillæg
- **WHEN** ordlyd og eksempel giver forskellige elementtillæg for opstillingen
- **THEN** vises de to beregningsspor og deres virkning på C, og den samlede C betegnes som uafklaret frem for at vælge den laveste eller højeste stiltiende.

### Requirement: Trampettens tillæg følger aldersprofilen
DK-analysen SHALL beregne skruetillæg efter aldersprofilen og to selvstændige dobbelttillæg, med og uden redskab. For junior/senior SHALL skruekravet være mindst 540° på enkeltsalto eller 180° på dobbeltsalto med de angivne særregler for Tsukahara/Kasamatsu. Hvert tillæg SHALL baseres på den relevante bedste omgang, og skruer på redskab SHALL genkendes efter kildens krav til placeringen af skruen.

#### Scenario: Junior med helskrue på enkeltsalto
- **WHEN** en juniorgymnast udfører enkeltsalto med 360° i trampet
- **THEN** udløses ikke junior-DK-skruetillæg alene af dette spring, selv om 360° kan opfylde banens skruekrav.

#### Scenario: Dobbelttillæg med og uden redskab
- **WHEN** holdet har kvalificerende dobbeltrotationer i både en Pegasus-omgang og en omgang uden redskab
- **THEN** beregnes de to tillæg uafhængigt med hver sin dækning og bedste omgang.

### Requirement: Muligheder er konkrete og holdbaserede
For hvert tillæg SHALL systemet vise valgt værdi, reglementets maksimum, en dokumenteret opnåelig værdi med holdets aktive registrerede færdigheder og konkrete ændringer, der demonstrerer muligheden. Samme gymnast MUST NOT tælle to gange i én omgang. Uregistrerede forbindelser, forbudte spring og ukendte værdier MUST NOT skabe sikre muligheder. Individuelle tillægsmaksima MUST NOT summeres som en samlet opnåelig C uden en fælles gennemførlig opstilling.

#### Scenario: Muligt skruetillæg
- **WHEN** fire valgte spring opfylder skruekravet, og yderligere to holdmedlemmer har gyldige registrerede alternativer, der kan indgå i en fuld omgang
- **THEN** vises valgt 4/6 og dokumenteret mulighed 6/6 samt de nødvendige gymnast-/springændringer og deres D-/stabilitetskonsekvenser.

#### Scenario: Muligheder konkurrerer
- **WHEN** to tillæg hver kan maksimeres, men kræver uforenelige ændringer i samme omgang
- **THEN** beskrives de som særskilte muligheder og ikke som en sikker samlet forbedring.

### Requirement: Planen giver ikke observation af flow
Systemet SHALL vise flow og øvrige udførelsesafhængige C-forhold som kræver observation. De MUST NOT antages opfyldt, fradrages automatisk eller udledes af springrækkefølge eller stabilitet alene. Oversigten SHALL skelne mellem kendte planbaserede fradrag og ikke-vurderbare forhold.

#### Scenario: Korrekt rækkefølge uden observeret udførelse
- **WHEN** alle valgte spring står i korrekt rækkefølge
- **THEN** kan rækkefølgekontrollen være opfyldt, mens flow stadig vises som ikke vurderet.

### Requirement: Tomme pladser og kildetvivl håndteres ærligt
Systemet SHALL vise kendte delresultater ved ufuldstændige omgange og markere usikre konsekvenser. En manglende planlagt gymnast MUST NOT automatisk give både alle relevante C-fradrag og et opdigtet E-fradrag. En kildetvist SHALL afgrænses til de berørte regler og resultater, mens andre sikre resultater stadig vises.

#### Scenario: Usikker regel påvirker kun bane
- **WHEN** banens elementtillæg er uafklaret, men trampettens data er komplette og entydige
- **THEN** markeres bane-C som uafklaret, mens trampettens sikre planbaserede resultater vises normalt.

### Requirement: D-nulstilling er ikke automatisk bortfald fra C
Systemet SHALL skelne mellem et udført elements gyldige basisværdi og en D-nulstilling på grund af en afvigelse i holdomgangen. Gyldige planlagte elementer i en afvigende holdomgangsserie SHALL stadig vurderes i C efter pkt. 9.2.1.b og 10.2.1.b. C-kandidater MUST NOT generelt filtreres med betingelsen, at gymnastens justerede D skal være større end nul.

#### Scenario: Afvigende serie med skrue
- **WHEN** fem tællende gymnaster planlægger rondat-flik-strakt baglæns salto uden skrue, og den sjette planlægger rondat-flik-strakt baglæns salto med helskrue i holdomgangen
- **THEN** nulstilles den sjette series D på grund af afvigelsen, mens dens gyldige skruende element stadig indgår i kontrollen af C-skruetillæg; C-afvigelsesfradraget vurderes separat.

### Requirement: Kildematricens optælling og uafklarede grænser følges
DK-analysen SHALL implementere de præcise inputuniverser, formler og undtagelser i reference/rule-matrix.md og bevare de seks afgrænsede spørgsmål i reference/questions-for-judges.md. Manglende afklaring af Q01–Q06 MUST NOT løses ved skjult standardværdi. Uafklaret subtotal SHALL gøre den afhængige total uafklaret, mens uafhængige sikre delbidrag fortsat vises. Den udførende agent SHALL omsætte reference/fixtures.json til tests med faste forventninger uden import af forventningsværdier fra produktionsreglerne.

#### Scenario: Nærmeste rene baneomgang
- **WHEN** tre fuldt kendte omgange har antal rent forlæns 0/4/2 og rent baglæns 6/0/3
- **THEN** er retningsfradraget 0,20*(6−4)+0,20*(6−6)=0,40 med de manglende forlæns udførelser forklaret.

#### Scenario: Flere rækkefølgefejl kræver afklaret optælling
- **WHEN** en omgang 2 har enkeltrotationer med D 0,80/0,50/0,60 og Q06 endnu ikke er afklaret
- **THEN** vises forkert rækkefølge og forslag om stigende D, mens præcist fradrag og afhængig C-total forbliver uafklaret.
