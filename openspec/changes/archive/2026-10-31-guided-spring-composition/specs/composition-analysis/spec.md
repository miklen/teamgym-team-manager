# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

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
