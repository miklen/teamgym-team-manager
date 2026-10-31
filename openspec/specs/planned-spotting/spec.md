# planned-spotting Specification

## Purpose

Lader trænerne planlægge modtagning på en omgangsplads med regelbundne konsekvenser for D og planlagte E-fradrag og vise Maks. mulig karakter.
## Requirements
### Requirement: Én planlagt modtagning pr. omgangsplads
Træneren SHALL kunne registrere højst én planlagt modtagning på en deltagerplads i en bane- eller trampetomgang, når pladsen har en gymnast og et valgt spring. Registreringen SHALL være en bevidst konkurrencebeslutning for netop den gymnast og netop det spring på pladsen. Den MUST NOT udledes af, foreslås af eller ændre gymnastens sikkerhed, og den MUST NOT gemmes på færdighedsregistreringen. Reservepladser, ambitioner uden gymnast og rytme SHALL ikke have planlagt modtagning. Træneren SHALL kunne fjerne en modtagning igen.

#### Scenario: Modtagning trods høj sikkerhed
- **WHEN** træneren planlægger modtagning for en gymnast med sikkerhed 5 på det valgte spring
- **THEN** gemmes modtagningen på pladsen, og sikkerheden 5 vises uændret.

#### Scenario: Plads uden spring
- **WHEN** en plads ikke har et valgt spring
- **THEN** kan der ikke registreres en modtagning, og en fil med en modtagning på en sådan plads afvises som ugyldig.

#### Scenario: Ambition uden gymnast
- **WHEN** en plads er en ambition uden gymnast
- **THEN** tilbydes ingen modtagning, og en fil med en modtagning på en ambition afvises som ugyldig.

### Requirement: Tre grader med regelbundne konsekvenser
Modtagningen SHALL have netop én af graderne Let støtte, Hjælp til udførelse og Kraftig hjælp i svæv/landing. Holdets regelpakke SHALL fastlægge beløb og kilder. For DK-pakkerne SHALL Let støtte give et planlagt E-fradrag på 0,5 og Hjælp til udførelse et planlagt E-fradrag på 1,0 (A6-07). Kraftig hjælp SHALL give et planlagt E-fradrag på 1,0 og halvere D for det modtagne element (H 9.3.3/10.3.3). E-fradraget og D-halveringen SHALL vurderes særskilt. Hver grad SHALL vise en kort forklaring med kilde. Forklaringen SHALL oplyse, at planen forudsætter landing med fødderne først, og at en mislykket landing er en observation uden for planen. En regelpakke uden kendte satser SHALL vise konsekvensen som uafklaret og MUST NOT opfinde et beløb.

#### Scenario: Let støtte på trampet
- **WHEN** en tællende gymnast har D 1,20 på trampet med planlagt Let støtte
- **THEN** er pladsens D fortsat 1,20, og omgangens planlagte E-fradrag stiger med 0,50.

#### Scenario: Kraftig hjælp på trampet
- **WHEN** en tællende gymnast har D 1,20 på trampet med planlagt Kraftig hjælp
- **THEN** er pladsens D 0,60, og omgangens planlagte E-fradrag stiger med 1,00.

### Requirement: Modtaget element på bane
Ved Kraftig hjælp på bane SHALL træneren vælge ét element i serien. Standard SHALL være seriens sidste element. Ved Let støtte og Hjælp til udførelse SHALL der ikke vælges et element, og baneserien SHALL behandles som én enhed. Seriens D SHALL genberegnes efter den gældende tællemetode med det valgte elements D halveret. Det halverede element kan derfor falde ud af de tællende elementer. Hvis det valgte elements identitet også forekommer uhalveret andetsteds i serien, SHALL D-konsekvensen vises som uafklaret med et kendt interval og en kendt tvivl i regelpakken.

#### Scenario: Afslutningen modtages
- **WHEN** en baneserie har elementerne 0,10, 0,20 og 1,40, og træneren vælger Kraftig hjælp uden at ændre elementvalget
- **THEN** halveres det sidste element til 0,70, og seriens D bliver 1,00.

#### Scenario: Halveret element falder ud
- **WHEN** en serie med fire forskellige elementer på 0,20, 0,30, 0,40 og 0,50 får Kraftig hjælp på elementet til 0,50
- **THEN** er de tællende elementer 0,40, 0,30 og 0,25, og D er 0,95.

### Requirement: Planlagte E-fradrag pr. omgang
For hver omgang SHALL systemet vise summen af de tællende pladsers planlagte E-fradrag som en særskilt linje mærket planlagt. Linjen SHALL ikke indgå i C og SHALL vise antallet af modtagninger. Ekstra, ikke-tællende gymnaster SHALL vises med deres planlagte modtagning, men deres fradrag SHALL være 0 og MUST NOT indgå i summen (A6-08). Omgangens planlagte E-loft SHALL være 10,0 minus summen og mindst 0,0.

#### Scenario: Ekstra gymnast modtages
- **WHEN** en ekstra gymnast og en tællende gymnast begge har planlagt Hjælp til udførelse
- **THEN** er omgangens planlagte E-fradrag 1,00, og den ekstra gymnasts modtagning er synlig med teksten tæller ikke.

### Requirement: Maks. mulig karakter
For hver springdisciplin og hvert scenarie SHALL systemet vise Maks. mulig karakter som C + D + E-loft. C og D er de gældende planværdier, og D medregner planlagt kraftig hjælp. E-loftet er gennemsnittet af de tre omgange, hvor hver omgang tæller 10,0 minus sine planlagte E-fradrag. Systemet SHALL også vise modtagningernes samlede pris som forskellen til samme beregning uden planlagte modtagninger. Værdien SHALL betegnes som et loft og MUST NOT præsenteres som forventet, sandsynlig eller faktisk karakter. Overdommerfradrag og øvrige E-fradrag SHALL kun nævnes som forhold, der kan sænke resultatet yderligere. Ufuldstændige, uafklarede eller ugyldige D-, C- eller omgangsstatusser SHALL give samme status for Maks. mulig karakter. En ugyldig omgang SHALL vise ugyldig i stedet for et tal, eksempelvis en trampetomgang, der blander spring med og uden Pegasus (Q04).

#### Scenario: Pris for modtagning
- **WHEN** C er 1,20 og omgangssummerne for D er 3,60, 4,20 og 4,80 uden modtagning. Omgang 3 har én tællende Kraftig hjælp, som sænker omgangssummen med 0,60, og én tællende Let støtte.
- **THEN** vises D 4,00, planlagte E-fradrag 1,50 i omgang 3, E-loft 9,50, Maks. mulig karakter 14,70 og en samlet pris for modtagning på 0,70 (15,40 uden modtagning).

#### Scenario: Præcision
- **WHEN** Maks. mulig karakter ikke går op i panelets visningspræcision
- **THEN** beregnes værdien eksakt og vises nedrundet med samme præcision som disciplinens D, og prisen beregnes som forskellen mellem de to eksakte værdier.

#### Scenario: Blandet Pegasus-omgang
- **WHEN** en trampetomgang i scenariet blander spring med og uden Pegasus
- **THEN** vises Maks. mulig karakter som ugyldig med henvisning til omgangen, og der vises intet tal.

### Requirement: Modtagningen gælder netop gymnast og spring
En planlagt modtagning SHALL nulstilles, når pladsens gymnast eller valgte spring ændres, også ved indsættelse af en reserve. Den SHALL også nulstilles, når den valgte færdighedsregistrering redigeres til en anden præcis udførelse. Modtagningen SHALL bevares ved ændret rækkefølge eller rolle i samme omgang, ved flytning af en omgang til holdomgang og ved ændring af sikkerhed eller note. En modtagning, der i en gyldig fil ikke længere svarer til registreringens aktuelle spring, SHALL behandles som nulstillet i alle beregninger. Den SHALL vises med teksten Modtagning nulstillet: springet er ændret, indtil træneren fjerner den eller planlægger igen.

#### Scenario: Springet redigeres
- **WHEN** træneren redigerer den registrerede baneserie på en plads med planlagt modtagning til en anden elementliste
- **THEN** fjernes modtagningen fra alle pladser, som bruger registreringen, og D, E-linje og Maks. mulig karakter genberegnes.

#### Scenario: Rækkefølge ændres
- **WHEN** træneren flytter en plads med planlagt modtagning til en anden position i omgangen
- **THEN** bevares modtagningen uændret.

