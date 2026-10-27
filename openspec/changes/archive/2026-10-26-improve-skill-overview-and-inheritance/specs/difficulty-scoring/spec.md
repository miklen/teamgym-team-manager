# Spec Delta

## MODIFIED Requirements

### Requirement: Tællende sum og disciplinens gennemsnit
Systemet SHALL vise springets egen D og gymnastens effektive sikkerhed på hver udfyldt omgangsplads, også før alle pladser er udfyldt. Springets egen D SHALL skelnes fra det justerede bidrag til omgangen. Et uafklaret eller nulstillet bidrag MUST NOT skjule en kendt egen D. Et afvigende eller uafklaret bidrag SHALL have en synlig betegnelse og forklaring. Omgangssummen SHALL fortsat følge de tællendes justerede bidrag og sin fuldstændighed. Disciplinens D SHALL være summen af de tre omgangssummer divideret med tre; der MUST NOT divideres med seks igen. Ekstra gymnasters egen D og sikkerhed SHALL vises uden at indgå i summen.

#### Scenario: Beregn fuld disciplin
- **WHEN** omgangssummerne er 3,60, 4,20 og 4,80
- **THEN** vises disciplinens D som 4,20 med den synlige beregning (3,60 + 4,20 + 4,80) / 3.

#### Scenario: En gymnast i holdomgangen
- **WHEN** holdomgangen har én af seks pladser udfyldt med rondat-flik-strakt helskrue, egen D 0,80 og sikkerhed 5
- **THEN** vises D 0,80 og sikkerhed 5/5 ved springet, mens bidrag og omgangssum fortsat markeres ufuldstændige uden et opdigtet referenceelement.

#### Scenario: Kendt springværdi men nulstillet bidrag
- **WHEN** en gyldig serie med egen D 0,80 afviger fra holdomgangens entydige reference og derfor får bidrag 0,00
- **THEN** vises egen D 0,80 og bidrag 0,00 særskilt med forklaring om afvigelsen.

#### Scenario: Ekstra har også egen D
- **WHEN** en gymnast er markeret Ekstra med et kendt registreret spring
- **THEN** vises springets egen D og sikkerhed sammen med Ekstra, uden at værdien lægges til omgangens tællende sum.

#### Scenario: Ukendt springværdi
- **WHEN** springets egen D er uafklaret under holdets regelpakke
- **THEN** vises Uafklaret med relevant begrundelse frem for en opdigtet numerisk D eller et tal hentet fra en anden regelpakke.

## ADDED Requirements

### Requirement: Kompakt visuel D og sikkerhed på omgangspladsen
En kendt D SHALL vises som et enkelt tal uden den synlige formulering Egen D på Springplanens pladser. D SHALL have en tilgængelig betegnelse og en diskret visuel markering. Sikkerhed SHALL vises som fem trin sammen med vurderingen 1–5; farve MUST NOT være eneste signal. Ikke vurderet SHALL bevare sin særskilte, tilgængelige betydning og MUST NOT vises som en faktisk nulvurdering. Den visuelle forenkling MUST NOT ændre springværdi, omgangsbidrag eller reglers fuldstændighed.

#### Scenario: Aflæs sværhed og sikkerhed
- **WHEN** en plads har en kendt D på 0,80 og sikkerhed 5
- **THEN** vises D-tallet uden Egen D og fem udfyldte sikkerhedstrin sammen med 5/5, og et afvigende eller uafklaret bidrag forklares fortsat særskilt.
