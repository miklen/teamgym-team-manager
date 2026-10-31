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
- **THEN** tæller DK 1.1.0 den præcise identitet samlet for holdet i hver omgang uden hensyn til gymnast, friholder én omgang med flest forekomster og fradrager 0,20 for hver forekomst i de øvrige omgange. En gentagen flik inde i en serie er ikke en gentaget hel serie. Ved lige antal er fradragsbeløbet kendt, mens den konkrete friholdte omgang ikke udpeges.

### Requirement: Trampettens kompositionskrav
DK-analysen SHALL kontrollere identisk holdomgang først, gentagelser, rækkefølge og mindst én omgang med og én uden Pegasus. Holdomgang, gentagelse og manglende redskabsvariation SHALL bruge 0,20 pr. relevant gymnast/gang, og rækkefølge SHALL bruge 0,10 pr. gang. Reglerne SHALL anvende præcis elementidentitet og den korrekte rotationskategori.

#### Scenario: Redskabsomgang mangler
- **WHEN** alle tre fuldt udfyldte trampetomgange er uden redskab
- **THEN** vises det manglende Pegasus-krav og det kildebaserede C-fradrag samt de berørte pladser.

#### Scenario: Blandet Pegasus-omgang i DK 1.1.0
- **WHEN** en DK 1.1.0-trampetomgang indeholder spring både med og uden Pegasus, også blandt ekstra gymnaster
- **THEN** markeres omgangen som ugyldig planlægning med forklaring om, at Pegasus står hele omgangen eller slet ikke, og redskabsfradraget beregnes ikke; DK 1.0.0 bevarer Q04.

### Requirement: Banens tillæg beregnes særskilt
DK-analysen SHALL beregne skruetillæg på 0,10 pr. tællende gymnast med mindst 360° i ét element i den bedste omgang for dette tillæg og dobbelttillæg på 0,10 pr. tællende gymnast i den bedste omgang for dette tillæg. Elementtillæg SHALL behandles særskilt: DK 1.0.0 SHALL bevare konflikten mellem ordlyd og eksempel som uafklaret med begge beregningsspor; DK 1.1.0 SHALL give et positivt tillæg på 0,10 for hver forskellig gyldig C-elementidentitet ud over seriens første, summeret for tællende gymnaster og divideret med tre omgange. Gentagne forekomster af samme element SHALL kun tælle én gang i serien.

#### Scenario: Forskellige bedste omgange
- **WHEN** omgang 2 har flest gymnaster med skrue og omgang 3 har flest med dobbeltrotation
- **THEN** bruges hver sin bedste omgang, og appen kræver ikke at begge tillæg optjenes i samme omgang.

#### Scenario: Uafklaret elementtillæg
- **WHEN** et DK 1.0.0-hold har en opstilling, hvor ordlyd og eksempel giver forskellige elementtillæg
- **THEN** vises de to beregningsspor og deres virkning på C, og den samlede C betegnes som uafklaret frem for at vælge den laveste eller højeste stiltiende.

#### Scenario: Afklaret elementtillæg
- **WHEN** et DK 1.1.0-hold har rondat–flik–flik eller rondat–flik–lukket salto som gyldig tællende serie
- **THEN** giver serien henholdsvis 0,10 eller 0,20 i positivt elementtillæg før gennemsnit over de tre omgange.

### Requirement: Trampettens tillæg følger aldersprofilen
DK-analysen SHALL beregne skruetillæg efter aldersprofilen og to selvstændige dobbelttillæg, med og uden redskab. For junior/senior SHALL skruekravet være mindst 540° på enkeltsalto eller 180° på dobbeltsalto med de angivne særregler for Tsukahara/Kasamatsu. Hvert tillæg SHALL baseres på den relevante bedste omgang, og skruer på redskab SHALL genkendes efter kildens krav til placeringen af skruen.

#### Scenario: Junior med helskrue på enkeltsalto
- **WHEN** en juniorgymnast udfører enkeltsalto med 360° i trampet
- **THEN** udløses ikke junior-DK-skruetillæg alene af dette spring, selv om 360° kan opfylde banens skruekrav.

#### Scenario: Dobbelttillæg med og uden redskab
- **WHEN** holdet har kvalificerende dobbeltrotationer i både en Pegasus-omgang og en omgang uden redskab
- **THEN** beregnes de to tillæg uafhængigt med hver sin dækning og bedste omgang.

### Requirement: Muligheder er konkrete og holdbaserede
For hvert tillæg SHALL systemet vise valgt værdi, reglementets maksimum når det kan fastslås uden en opdigtet grænse, en dokumenteret opnåelig værdi med holdets aktive registrerede færdigheder og konkrete ændringer, der demonstrerer muligheden. Samme gymnast MUST NOT tælle to gange i én omgang. Uregistrerede forbindelser, forbudte spring og ukendte værdier MUST NOT skabe sikre muligheder. Individuelle tillægsmaksima MUST NOT summeres som en samlet opnåelig C uden en fælles gennemførlig opstilling.

#### Scenario: Muligt skruetillæg
- **WHEN** fire valgte spring opfylder skruekravet, og yderligere to holdmedlemmer har gyldige registrerede alternativer, der kan indgå i en fuld omgang
- **THEN** vises valgt 4/6 og dokumenteret mulighed 6/6 samt de nødvendige gymnast-/springændringer og deres D-/stabilitetskonsekvenser.

#### Scenario: Muligheder konkurrerer
- **WHEN** to tillæg hver kan maksimeres, men kræver uforenelige ændringer i samme omgang
- **THEN** beskrives de som særskilte muligheder og ikke som en sikker samlet forbedring.

#### Scenario: Elementtillæg uden konstrueret maksimum
- **WHEN** DK 1.1.0 kan dokumentere en opnåelig elementtillægsmulighed fra holdets registrerede serier
- **THEN** vises den konkrete mulighed, mens et samlet regelmaksimum for dette tillæg ikke opfindes ud fra filformatets tekniske elementgrænse.

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
- **WHEN** en omgang 2 i DK 1.0.0 har enkeltrotationer med D 0,80/0,50/0,60 og Q06 endnu ikke er afklaret
- **THEN** vises forkert rækkefølge og forslag om stigende D, mens præcist fradrag og afhængig C-total forbliver uafklaret.

#### Scenario: Trænerafklaret rækkefølgeoptælling i DK 1.1.0
- **WHEN** en omgang 2 i DK 1.1.0 har tællende spring i samme kategori med D 0,80/0,60/0,70 efter en ekstra gymnast
- **THEN** gives 0,10 for hver tællende gymnast med et tidligere højere spring, i alt 0,20; den ekstra indgår ikke, blandet serie placeres i sin højeste kategori, og serie uden salto i laveste kategori.

### Requirement: Guiden viser hver regels tælleenhed
Hver vist kompositionsregel SHALL angive, om den tælles pr. kvalificerende gymnast i én bedste omgang, kræver én eller flere hele omgange eller opgøres på tværs af tre omgange. Viste tal og tilstande SHALL følge den valgte regelpakkes eksisterende analyse og profil. DK's skrue- og dobbelttillæg SHALL fremstå som gradvise tillæg pr. tællende gymnast i tillæggets egen bedste omgang, ikke som et tillæg der først opstår ved seks af seks. Banens elementtillæg SHALL adskilles som et gennemsnit over tre omgange; DK 1.0.0 bevarer uafklarede fortolkningsspor, mens DK 1.1.0 bruger den afklarede sats. Krav om rene retningsomgange og trampet med/uden Pegasus SHALL fremstå som omgangskrav og ikke som tillæg af samme type som skruer.

#### Scenario: To kvalificerende gymnaster
- **WHEN** en fuldt vurderbar DK-baneplan har to tællende gymnaster med mindst 360° i ét element i sin bedste skrueomgang
- **THEN** viser guiden »pr. gymnast · bedste omgang« og et skruetillæg på 0,20, mens seks af seks vises som fuld udnyttelse, ikke som en betingelse for de 0,20.

#### Scenario: Forskellige bedste omgange
- **WHEN** flest gymnaster kvalificerer til skrue i omgang 2 og flest til dobbelt i omgang 3
- **THEN** kan guiden vise hver omgang som grundlag for sit eget tillæg uden at kræve samme omgang for begge.

#### Scenario: Trampet med redskab
- **WHEN** en DK-trampetplan mangler en hel omgang med Pegasus
- **THEN** vises med/uden-Pegasus som et omgangskrav med den aktuelle usikre eller manglende tilstand, ikke som et skrue- eller dobbelttillæg pr. gymnast.

#### Scenario: Elementtillæg i ældre pakke
- **WHEN** et hold er bundet til DK 1.0.0, hvor konflikten mellem regeltekst og eksempel er bevaret
- **THEN** viser guiden »uafklaret · over tre omgange« frem for ét autoritativt beløb eller en 6/6-fremstilling.

#### Scenario: Afklaret elementtillæg i seneste pakke
- **WHEN** et hold er bundet til DK 1.1.0 og har tre fuldt vurderbare baneomgange
- **THEN** giver hvert forskelligt gyldigt element ud over seriens første 0,10 i positivt tillæg pr. tællende gymnast; gentagelser af samme element giver ikke flere point, og summen divideres med tre. Rondat–flik–flik giver 0,10 pr. gymnast, rondat–flik–lukket salto giver 0,20, og et enkelt element giver 0. Guiden viser tælleformen »pr. serie · over tre omgange« og samme sikre beløb som C-analysen.

### Requirement: Regelmål og aktuel kunnen holdes adskilt
Guiden SHALL vise reglementets kvalifikationskrav og teoretiske mål for hvert relevant tillæg, også uden registrerede spring på holdet. Uddybningen SHALL vise mindst ét præcist kvalificerende springeksempel fra den valgte regelpakke, når et entydigt gyldigt eksempel findes; ellers SHALL den vise det præcise krav uden at opfinde et spring. Guiden SHALL særskilt vise planens aktuelle bidrag og, når eksisterende potentialesøgning dokumenterer det, en mulighed med holdets registrerede anvendelige færdigheder. Et springeksempel fra regelkataloget SHALL mærkes som et træningsmål eller et regelforklarende eksempel; det MUST NOT udlægges som en bestemt gymnasts kunnen, konkurrenceklarhed eller dokumenteret opnåeligt tillæg. Individuelle tillægsmaksima MUST NOT lægges sammen til en samlet opnåelig C uden en fælles gennemførlig opstilling.

#### Scenario: Ingen har registreret en kvalificerende skrue
- **WHEN** et hold ikke har registreret spring, der kvalificerer til DK's skruetillæg
- **THEN** viser guiden stadig skruekravet og det regelbaserede mål, mens planens bidrag og dokumenteret mulighed er adskilt fra det fremtidige træningsmål.

#### Scenario: Lav sikkerhed på registreret spring
- **WHEN** et relevant spring er registreret med sikkerhed 1 eller 2
- **THEN** kan guiden vise det som registreret og som noget, der arbejdes med, men MUST NOT kalde gymnastens udførelse konkurrencestabil eller gøre sikkerhed til en uofficiel C-pointfaktor.

#### Scenario: Delvis opstilling
- **WHEN** kun nogle tællende pladser er udfyldt
- **THEN** kan guiden vise kendt foreløbig dækning, men MUST NOT fremstille et usikkert subtotal som et endeligt opnået C-tillæg.

#### Scenario: Ikke installeret eller uafklaret regelgrundlag
- **WHEN** holdets præcise regelpakke mangler, eller en regelkonsekvens er uafklaret
- **THEN** opfinder guiden ingen mål, tælleenhed eller sikre point fra en anden pakke og bevarer synlig adgang til den kendte usikkerhed.

#### Scenario: Én samlet indgang til dokumenterede muligheder
- **WHEN** potentialesøgningen har undersøgt holdets registrerede færdigheder for den valgte springplan
- **THEN** vises valgt beløb, dokumenteret beløb, søgningens status og handlingen »Se konkrete ændringer« i den relevante tillægsrække i guiden, uden en gentaget potentialeliste længere nede. Handlingen åbner fortsat den fulde vidneopstilling uden automatisk at ændre planen. Under søgning vises status og mulighed for at afbryde; ved fejl vises fejlen i guiden. Et forsinket resultat fra et andet scenarie må ikke vises.

### Requirement: Guiden giver kompakt dynamisk status
Guiden SHALL være sammenklappet ved åbning af springplanen. Den lukkede visning SHALL vise antal vurderbare omgange samt summer af planens tillæg og rå fradrag fra alle C-bidrag i den valgte regelpakke. D og C for disciplinen SHALL stå som de primære dynamiske tal før guiden; den faste holdprofil SHALL stå synligt ved scenariets navn og uddybes sammen med guidens regelrammer, frem for at være et tredje disciplinkort. Ufuldstændige eller uafklarede bidrag MUST NOT fremstilles som endelige beløb. Guiden SHALL kunne åbnes og lukkes med tastatur og uden at ændre arbejdsrummets data.

#### Scenario: Tom og delvis plan
- **WHEN** ingen omgang er klar, eller kun nogle omgange er vurderbare
- **THEN** viser den lukkede guide henholdsvis afventende tal eller tydeligt foreløbige delbeløb, og antallet af færdige omgange fremgår. Åbning viser de samme detaljer som før.

#### Scenario: Fuld plan med åbent regelspørgsmål
- **WHEN** alle tre omgange er vurderbare, men et C-bidrag fortsat er uafklaret
- **THEN** angiver den lukkede guide, at der er åbne regler, og viser kun de beregnede dele som foreløbige, mens en selvstændig fuldt kendt sum kan vises sikkert.

#### Scenario: Synlig holdprofil uden gentaget scenarienavn
- **WHEN** et kendt DK-hold åbner sin springplan på computer eller mobil
- **THEN** står scenariets navn én gang på den valgte fane, mens holdprofilens navn og deltagergrænser står på en kort linje under fanerne, også når kompositionsguiden er lukket.

### Requirement: Ambitioner indgår i C som planlagte spring
Ambitionspladser SHALL indgå i kompositionskrav, tillæg, fradrag og guiden som planlagte spring med deres springidentitet og D. Der vises ingen opdeling mellem besatte pladser og ambitioner. Mixfordelingen SHALL kun vurderes på besatte pladser. Når den stadig kan opfyldes af ambitionspladserne, SHALL kravet vises som ufuldstændigt med henvisning til de ubesatte pladser og MUST NOT forhindre beregning af C. En allerede brudt fordeling SHALL fortsat være ugyldig. Hvis et krav afhænger af, hvilke gymnaster der tager ambitionerne, og udfaldene er forskellige, SHALL resultatet vises som ufuldstændigt med de mulige værdier. En omgang med ambitioner MUST NOT markeres som gennemført.

#### Scenario: Tillæg med ambitioner
- **WHEN** alle tre baneomgange har seks tællende spring, hvoraf fire er ambitioner, og sprungene opfylder et elementtillæg
- **THEN** vises tillægget som opnået i planen, og omgangene viser Mangler gymnast for ambitionerne.

#### Scenario: Mix afhænger af ambitioner
- **WHEN** et mixhold kræver tre piger og tre drenge, og en omgang har to piger, to drenge og to ambitioner
- **THEN** beregnes C, og mixkravet vises som ufuldstændigt med henvisning til de to ubesatte pladser.

#### Scenario: Brudt mix
- **WHEN** de besatte tællende pladser allerede har fire piger på et hold, der kræver tre piger og tre drenge
- **THEN** er mixkravet ugyldigt, uanset ambitionerne.

#### Scenario: Gentagelse afhænger af gymnaster
- **WHEN** gentagelsesreglen afhænger af, om de samme gymnaster udfører et spring, og en af de berørte pladser er en ambition, som giver forskellige udfald
- **THEN** vises fradraget som ufuldstændigt med begge mulige værdier.

