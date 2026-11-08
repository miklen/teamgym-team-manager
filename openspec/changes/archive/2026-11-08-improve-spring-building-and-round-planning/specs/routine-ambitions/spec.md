# Spec Delta

## MODIFIED Requirements

### Requirement: Ambitionens spring vælges fra kataloget
Når Ingen gymnast endnu er valgt, SHALL springvalget vise disciplinens springbibliotek med gængse opskrifter og arbejdsrummets definitioner uden gentagelser. Søgning, kædefilter, D-filter, rangering og præcise udførelsesnavne SHALL følge samme grundlag som gymnastens nuværende springvælger, mens sikkerhedskolonnen viser Ingen gymnast. Et allerede valgt spring SHALL forblive synligt og uændret under filtrering. Når de samlede filtre giver nul resultater, og kæden har en præcis, entydig begyndelse, SHALL én Byg videre-handling i tomtilstanden åbne Byg selv med denne begyndelse; der MUST NOT stå en sådan handling på hver springrække. Byg fra bunden SHALL også være mulig direkte på ambitionen. Valg eller bygning af en definition, som ikke findes i arbejdsrummet, SHALL genbruge en eksisterende aktiv definition med samme præcise springidentitet eller oprette en ny i samme ændring som ambitionen. Træneren SHALL kunne skifte springet på en ubesat ambition. Formularen MUST NOT oprette en gymnastregistrering eller personlig sikkerhedsvurdering.

#### Scenario: Søg i kataloget uden gymnast
- **WHEN** træneren har valgt Ingen gymnast endnu og søger kraft-barani
- **THEN** vises springet med navn, saltoretning og D under holdets regelpakke og Ingen gymnast i sikkerhedskolonnen.

#### Scenario: Eksisterende definition genbruges
- **WHEN** arbejdsrummet allerede har en definition af rondat-flik-1/1, og træneren vælger den gængse opskrift med samme identitet til en ambition
- **THEN** refererer ambitionen til den eksisterende definition, og der oprettes ingen dublet.

#### Scenario: Byg direkte på omgangen
- **WHEN** træneren bygger en ny komplet serie på en ambition og gemmer pladsen
- **THEN** findes én fælles definition i arbejdsrummet, som kan vælges på næste ambitionsplads uden genopbygning, mens ingen gymnast har fået springet registreret.

#### Scenario: Samlede filtre uden match på en ambition
- **WHEN** træneren har valgt en præcis begyndelse i kædefilteret og afgrænser yderligere med søgning eller D, så ingen serier passer
- **THEN** tilbyder tomtilstanden én Byg videre-handling med netop begyndelsen som kladde, mens den almindelige katalogliste ikke får handlingsknapper på hver række.

#### Scenario: Annullér bygning
- **WHEN** træneren bygger videre fra et spring, ændrer elementer og annullerer omgangsdialogen
- **THEN** ændres hverken ambition, fælles definition eller gymnastregistrering.

## ADDED Requirements

### Requirement: Ambition viser fælles forbindelsesgodkendelse
En ambition med en trænergodkendt kæde SHALL vise den præcise springdefinition og en synlig betegnelse for forbindelsens godkendelse. En kendt problematisk eller ikke-verificeret kæde SHALL kunne gemmes og senere godkendes uden at skifte til en anden springidentitet. Uden godkendelse SHALL forbindelsen forklares som uafklaret; en godkendt kæde SHALL anvendes i omgangens beregning med fuld D, når elementerne har en kendt, tilladt værdi. Kandidater til besættelse SHALL stadig kræve, at den konkrete gymnast har en aktiv registrering af samme spring.

#### Scenario: Samme godkendte kæde på flere pladser
- **WHEN** træneren godkender en præcis bygget kæde og bruger den på tre ambitioner
- **THEN** viser alle tre pladser trænergodkendelsen og den samme regelpakke-D uden tre særskilte forbindelsesbekræftelser.

#### Scenario: Godkendelse er ikke gymnastkunnen
- **WHEN** en godkendt kæde står på en ubesat ambition, og ingen gymnast har registreret springet
- **THEN** tæller springets kendte D som planlagt, mens pladsen viser Mangler gymnast og Ingen kan endnu.
