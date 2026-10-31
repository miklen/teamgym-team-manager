# workspace-merge Specification

## Purpose

Gør samtidige ændringer i det fælles arbejdsrum forståelige og mulige at kombinere uden tab af lokale eller fælles data. Fastlægger en fælles og verificerbar kontrakt for konflikthåndtering, som også gælder fremtidige funktioner.
## Requirements
### Requirement: Trevejssammenligning med en kendt fælles basis
Systemet SHALL sammenligne den indlæste eller senest bekræftet gemte basis, den aktuelle lokale kladde og et konsistent snapshot af den nyeste fil. Sammenligning SHALL omfatte hele arbejdsrummet, inklusive lukkede scenarier, reserver og øvrige hold. Sammenligning MUST NOT ændre input, erstatte kladden eller uploade data. Manglende fælles basis, anden arbejdsrumsidentitet, ukendt format eller ugyldige data SHALL blokere fletning med en forståelig forklaring og bevaret kladde. Visningen SHALL beskrive nettoændringer siden basis og MUST NOT påstå at vise en komplet historik eller kende forfatteren til hver ændring.

#### Scenario: Ændring uden for den åbne plan
- **WHEN** en anden session ændrer et lukket scenarie eller et andet hold siden den fælles basis
- **THEN** indgår ændringen i gennemgangen med sin kontekst, selv om træneren ikke har åbnet den del af arbejdsrummet.

#### Scenario: Sammenligning afvises uden datatab
- **WHEN** den nyeste fil har en ukendt formatversion eller en anden arbejdsrumsidentitet
- **THEN** kan den ikke flettes, årsagen vises, og den eksisterende kladde og basis bevares til gennemsyn og eksport.

### Requirement: Uafhængige og ens ændringer kan kombineres
Systemet SHALL klassificere ændringer i forhold til den fælles basis. Uændrede data SHALL bevares; ændringer på kun én side SHALL medtages; samme ændring på begge sider SHALL medtages én gang uden konflikt. Forskellige ændringer af samme sammenhængende data eller indbyrdes uforenelige ændringer SHALL kræve et valg. Tilføjelser, fjernelser, arkivering, flytning og rækkefølge SHALL omfattes. En fletning MUST NOT vælge en vinder alene ud fra tidsstempel, samlingsposition eller hvilken side der blev læst sidst.

#### Scenario: Hver sin gymnast
- **WHEN** træneren ændrer en vurdering for syntetisk gymnast A, og filen ændrer en uafhængig vurdering for syntetisk gymnast B
- **THEN** foreslås begge ændringer i den samlede kladde uden konflikt.

#### Scenario: Samme ændring på begge sider
- **WHEN** begge sider ændrer samme holdnavn til samme værdi uden andre forskelle i navneændringen
- **THEN** medtages navnet én gang uden et påkrævet konfliktvalg.

#### Scenario: Fjernelse mod redigering
- **WHEN** en side fjerner et scenarie, og den anden ændrer dets opstilling
- **THEN** vises en konflikt, der forklarer fjernelsen og redigeringen; opstillingen må ikke forsvinde stiltiende.

### Requirement: Valg pr. faktisk konflikt
Træneren SHALL kunne vælge Min udgave eller Filens udgave pr. konflikt med synligt udgangspunkt, begge siders ændringer og resultatet af valget. Ingen faktisk konflikt SHALL være forhåndsafgjort. Valg for én uafhængig konflikt MUST NOT afgøre andre konflikter. Afhængige ændringer SHALL samles i et forklaret konfliktvalg, når separate valg ellers kunne bryde deres sammenhæng. Alle krævede valg og en gyldig samlet kladde SHALL foreligge før anvendelse. Træneren SHALL kunne ændre valg og annullere uden at ændre sin eksisterende kladde.

#### Scenario: Forskellig sikkerhed
- **WHEN** begge sider har ændret samme vurdering fra sikkerhed 3 til henholdsvis 4 og 2
- **THEN** vises 3 som udgangspunkt og 4 og 2 som alternativer med tilhørende vurderingsdato og ophav; træneren skal vælge vurderingen som en sammenhængende helhed.

#### Scenario: Flere uafhængige konflikter
- **WHEN** der er to uafhængige vurderingskonflikter
- **THEN** kan træneren beholde sin udgave af den første og filens udgave af den anden; anvendelse er blokeret, indtil begge er afgjort.

#### Scenario: Annullering efter valg
- **WHEN** træneren foretager valg og derefter annullerer gennemgangen
- **THEN** er den lokale kladde og dens basis uændrede, og der er ikke uploadet data.

### Requirement: Domænesammenhænge bevares i hele resultatet
Systemet SHALL respektere stabile identiteter, vurderingsophav, arverelationer, afhængige referencer, præcise springdefinitioner, regelbindinger og ordnede lister. Afledte ændringer SHALL afstemmes efter de gældende domæneregler og indgå i forhåndsvisningen; de MUST NOT præsenteres som uafhængige trænerbeslutninger. To ellers gyldige sider, der kombineret bryder en domæneregel, SHALL give en forklaret konflikt eller blokering. Ugyldige kombinationer MUST NOT anvendes, og valideringsfejl MUST NOT løses ved stiltiende at fjerne data eller tilsidesætte et valg.

#### Scenario: Navnesammenstød ved samtidige tilføjelser
- **WHEN** begge sider uafhængigt opretter et scenarie med samme navn i samme holds disciplin
- **THEN** håndteres navnesammenstødet som et valg mellem de berørte ændringer, selv om scenarierne har forskellige identiteter.

#### Scenario: Arv efter ændret kilde
- **WHEN** en side ændrer en arvekildes vurdering, mens den anden ændrer en uafhængig note
- **THEN** afstemmes aktive arvede vurderinger i resultatet, noten bevares, og følgevirkningerne kan ses før anvendelse.

#### Scenario: Rækkefølge på begge sider
- **WHEN** begge sider ændrer samme deltager- eller reserverækkefølge forskelligt
- **THEN** tilbydes et forståeligt valg for den berørte liste med dens tilknyttede ændringer frem for at kombinere positioner vilkårligt.

### Requirement: Vedligeholdelig konflikthåndtering er et permanent acceptkrav
Enhver fremtidig funktion SHALL afklare og dokumentere sin betydning for fælles data, sammenligning, afhængigheder, præsentation og fletning. Nye eller ændrede gemte data SHALL have eksplicit dækning i den fælles konflikthåndtering og relevante tests før funktionen betegnes færdig. En funktion uden betydning for fælles data SHALL begrunde dette i ændringens planlægning eller verificering. Sammenligning, konfliktvalg og fletning SHALL bruge en fælles kontrakt; nye funktioner MUST NOT indføre selvstændige konkurrerende fletteforløb.

Automatiske kontroller SHALL opdage udækkede samlinger, felter, indlejrede strukturer og varianter i datamodellen. En bevidst atomisk gruppe SHALL have eksplicit afgrænsning og betydning; den MUST NOT skjule senere nye felter for dækningskontrollen. Ukendt eller udækket data SHALL blokere fletning uden tab. Dækningskontrol SHALL suppleres af tests af betydning, afhængigheder og samtidige handlinger; strukturel dækning alene MUST NOT tælle som fuld verifikation.

#### Scenario: Nyt felt uden beslutning om fletning
- **WHEN** en funktion tilføjer et gemt felt, også inde i en eksisterende atomisk gruppe, uden eksplicit dækning
- **THEN** fejler den automatiske kontrol; feltet kan ikke stiltiende ignoreres eller få en tilfældig standardpolitik.

#### Scenario: Ændret betydning uden nyt felt
- **WHEN** en funktion ændrer relationen mellem eksisterende data, eksempelvis hvordan en vurdering arves
- **THEN** kræves en vurdering af konfliktreglerne og tests af de berørte samtidige ændringer, selv om modeldækningen fortsat er komplet.

#### Scenario: Ren visningsfunktion
- **WHEN** en funktion kun ændrer lokal navigation eller præsentation og ikke påvirker fælles data eller fletning
- **THEN** dokumenteres denne afgrænsning, og funktionen behøver ikke nye fletteregler, der ikke har nogen adfærd at dække.

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

