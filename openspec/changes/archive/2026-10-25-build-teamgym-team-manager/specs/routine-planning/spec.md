# Spec Delta

## Purpose

Lader trænerne sammensætte hele holdets konkurrenceopstilling med tre baneomgange og tre trampetomgange og se konsekvenserne, mens de arbejder.

## ADDED Requirements

### Requirement: Seks vedvarende omgange pr. hold
Systemet SHALL oprette en aktiv opstilling pr. hold med præcis tre baneomgange og tre trampetomgange. Alle seks SHALL kunne redigeres, gemmes og genåbnes. Ufuldstændige opstillinger SHALL kunne gemmes som kladder med tydelig angivelse af mangler.

#### Scenario: Gem og genåbn hele opstillingen
- **WHEN** træneren udfylder begge discipliner, gemmer og senere genåbner datafilen
- **THEN** bevares alle seks omganges deltagere, spring, rækkefølge og holdets regelbinding.

### Requirement: Gymnaster og kendte færdigheder vælges sammen
En omgangsplads SHALL vælge et aktivt holdmedlem og en af gymnastens registrerede anvendelige færdigheder i den pågældende disciplin. Systemet MUST forhindre samme gymnast på flere pladser i samme omgang, men SHALL tillade deltagelse i flere forskellige omgange og forskellig gymnastbesætning mellem omgange.

#### Scenario: Samme gymnast i flere omgange
- **WHEN** en gymnast vælges i baneomgang 1 og 3
- **THEN** er det tilladt, mens et andet valg af samme gymnast i omgang 1 afvises.

#### Scenario: Ingen registrerede spring
- **WHEN** et holdmedlem uden registrerede baneserier vælges til en baneplads
- **THEN** vises en uafklaret plads og en direkte vej til færdighedsregistrering; appen opfinder eller tildeler ikke et spring.

### Requirement: Holdomgang er første omgang
Der SHALL være præcis én holdomgang pr. disciplin, placeret først. Valg af en anden omgang som holdomgang SHALL tilbyde flytning til førstepladsen med bevarelse af hele omgangens data og genberegning af alle konsekvenser. Systemet MUST NOT godkende en holdomgang på anden eller tredje konkurrenceplads.

#### Scenario: Gør tredje omgang til holdomgang
- **WHEN** træneren vælger den tredje omgang som holdomgang
- **THEN** flyttes denne omgang til førstepladsen efter en synlig handling, de andre omgange følger deres nye rækkefølge, og alle deltagere og valgte spring bevares.

### Requirement: Tællende og ekstra gymnaster
For den aktuelle DK-pakke SHALL en fuld omgang have seks tællende gymnaster og op til to ekstra først. Ekstra gymnaster SHALL være synligt markeret og SHALL indgå i de krav, der gælder dem, herunder rækkefølge, men MUST NOT øge tællende D, tillæg eller stabilitetsdækning. Mixholdets relevante fordelingskrav SHALL valideres fra holdprofilen.

#### Scenario: Otte gymnaster i korrekt rækkefølge
- **WHEN** to ekstra gymnaster efterfølges af seks tællende
- **THEN** er kun de sidste seks grundlag for point og tællende stabilitet, og de første to er stadig omfattet af relevant rækkefølgekontrol.

#### Scenario: Niende gymnast
- **WHEN** træneren forsøger at tilføje en niende gymnast i en DK-omgang
- **THEN** afvises handlingen med forklaring af grænsen, og der skabes ikke en syvende tællende plads.

### Requirement: Rækkefølge kan redigeres tilgængeligt
Gymnaster SHALL kunne flyttes i en omgang med mus, berøring og tastatur-/knapbaserede handlinger. En foreslået sortering SHALL tage rotationskategori før D og SHALL anvendes ved et bevidst valg; systemet MUST NOT stiltiende omarrangere trænerens valg.

#### Scenario: Sorteringsforslag
- **WHEN** træneren anmoder om korrekt springrækkefølge i omgang 2
- **THEN** foreslås enkelt før dobbelt og fastholdt/stigende D inden for kategorierne, med synlige ændringer før anvendelse.

### Requirement: Sammenhængende analyse under redigering
Ændring af gymnast, spring, rækkefølge eller holdomgang SHALL straks opdatere D, C-forhold, stabilitet og mangler lokalt. Krav, der gælder alle tre omgange, SHALL ikke vurderes isoleret på den redigerede omgang alene.

#### Scenario: Fjern eneste Pegasus-omgang
- **WHEN** træneren erstatter alle Pegasus-spring i den eneste omgang med redskab
- **THEN** opdateres disciplinens med/uden-redskabskontrol, relevante fradrag og tillæg, og berørte forhold fremhæves.

### Requirement: Ufuldstændighed er forskellig fra fradrag
En tom plads eller et manglende valg SHALL vises som en planlægningsmangel og MUST NOT automatisk fortolkes som et faktisk gennemløb, et bestemt udførelsesfradrag eller en fuld godkendt opstilling. Kendte delresultater SHALL kunne vises med tydeligt beregningsgrundlag.

#### Scenario: Fem udfyldte pladser
- **WHEN** kun fem tællende gymnaster er valgt
- **THEN** viser appen de kendte værdier og den manglende plads og bruger ikke en skjult antagelse om den sjette gymnasts udførelse.
