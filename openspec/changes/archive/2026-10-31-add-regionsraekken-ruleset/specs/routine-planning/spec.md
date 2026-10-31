## MODIFIED Requirements

### Requirement: Tællende og ekstra gymnaster
En fuld udførende omgang SHALL have seks tællende gymnaster og det antal ekstra gymnaster først, som holdets regelpakke tillader. For DK er det op til to ekstra. For REG er det op til seks ekstra, en afledt grænse fra TR 1.3.1.

Ekstra gymnaster SHALL være synligt markeret og SHALL indgå i de krav, som holdets pakke lader gælde for dem, herunder DK's rækkefølgekrav. De MUST NOT øge tællende D, tillæg eller stabilitetsdækning. Brugerfladens tekster om grænsen og om rækkefølge SHALL komme fra pakken og MUST NOT nævne et fast antal eller et rækkefølgekrav, som pakken ikke har.

Mixholdets relevante fordelingskrav SHALL valideres fra holdprofilen. Reserver SHALL være adskilt fra udførende pladser og MUST NOT optage tællende eller ekstra pladser eller ændre disse grænser.

#### Scenario: Otte gymnaster i korrekt rækkefølge
- **WHEN** to ekstra gymnaster efterfølges af seks tællende på et DK-hold
- **THEN** er kun de sidste seks grundlag for point og tællende stabilitet, og de første to er stadig omfattet af relevant rækkefølgekontrol.

#### Scenario: Niende gymnast
- **WHEN** træneren forsøger at tilføje en niende udførende gymnast i en DK-omgang
- **THEN** afvises handlingen med forklaring af grænsen, og der skabes ikke en syvende tællende plads.

#### Scenario: Tolv gymnaster i REG
- **WHEN** seks ekstra gymnaster efterfølges af seks tællende på et REG-hold
- **THEN** er omgangen gyldig uden rækkefølgekontrol, og guiden angiver »højst 6 ekstra først« som afledt grænse.

#### Scenario: Reserve til en fyldt omgang
- **WHEN** omgangen har det maksimale antal ekstra og seks tællende, og træneren tilføjer en anden aktiv gymnast som reserve
- **THEN** tillades reserven uden at ændre de udførende pladser eller deres beregningsgrundlag.
