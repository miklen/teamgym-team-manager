# Spec Delta

## Purpose

Gør trænernes vurdering af den enkelte gymnasts konkrete færdighed sammenlignelig og synlig i springomgange og rytmefællesnævnere uden falsk statistisk præcision.

## ADDED Requirements

### Requirement: Fælles skala for spring og rytme
Systemet SHALL bruge betegnelsen stabilitet og heltal 1–5 på komplette baneserier, trampetspring og rytmemomenter. Skalaen SHALL forklares som 1: måske klar til konkurrencen; 2: usikkert, lykkes enkelte gange; 3: lykkes ofte, men svingende; 4: meget stabilt; 5: sikkert og gennemprøvet under konkurrencelignende forhold. Der MUST NOT indføres konkurrerende statusfelter som under indlæring/konkurrenceklar.

#### Scenario: Samme skala i begge kartoteker
- **WHEN** træneren vurderer et trampetspring og et rytmemoment
- **THEN** har begge de samme fem trin og forklaringer, og trin 1 kan gemmes som et reelt vurderet niveau.

### Requirement: Vurdering pr. gymnast og præcis færdighed
Vurderingen SHALL knyttes til en bestemt gymnasts præcise færdighed og SHALL kunne opdateres med dato og valgfri note. Vurdering af et element MUST NOT automatisk overføres til en komplet serie, en anden variant eller en anden gymnast.

#### Scenario: Samme salto i to serier
- **WHEN** en gymnast har stabilitet 5 på rondat-flik-strakt og 2 på rondat-flik-strakt med helskrue
- **THEN** beholder serierne hver sin vurdering, og den valgte series værdi bruges i opstillingen.

### Requirement: Ikke vurderet er forskelligt fra manglende færdighed
Systemet SHALL skelne mellem ingen færdighedsregistrering, en registreret færdighed uden vurdering og en registreret færdighed vurderet 1–5. Tom vurdering MUST NOT erstattes med 0, 1, 3 eller 5.

#### Scenario: Registreret uden vurdering
- **WHEN** træneren tilføjer et rytmemoment uden stabilitetsvurdering
- **THEN** tæller gymnasten som registreret på momentet, men opfylder ikke et filter, der kræver stabilitet mindst 4.

### Requirement: Omgangens aggregater er gennemskuelige
For de tællende pladser SHALL systemet vise aritmetisk gennemsnit af vurderede pladser, laveste vurdering, antal vurderinger på 1–2, antal vurderede og antal krævede/udfyldte pladser. Ved manglende vurderinger eller pladser SHALL aggregatet markeres som ufuldstændigt. Ekstra gymnaster SHALL vises særskilt og MUST NOT stiltiende ændre de tællendes aggregat.

#### Scenario: En usikker gymnast skjules ikke
- **WHEN** seks tællende spring har stabilitet 5, 5, 5, 5, 5 og 1
- **THEN** vises gennemsnit 4,3/5, minimum 1, én lav vurdering og 6/6 vurderet.

#### Scenario: Delvist vurderet omgang
- **WHEN** en omgang har seks valgte spring, hvor fem er vurderet 5 og det sidste ikke er vurderet
- **THEN** vises 5,0/5 blandt de fem vurderede sammen med minimum 5, 5/6 vurderet og en tydelig ufuldstændig tilstand; omgangen fremstår ikke fuldt sikker.

#### Scenario: Ingen vurderinger
- **WHEN** ingen tællende spring er vurderet
- **THEN** vises ikke vurderet og 0/6, ikke et numerisk gennemsnit eller minimum.

### Requirement: Rytmeaggregater bruger det valgte hold
Stabilitet for et rytmemoment SHALL beregnes blandt det aktuelle holds valgte gymnaster med samme gyldige momentvariant. Systemet SHALL vise både færdighedsdækning og vurderingsdækning samt navnene bag mangler/lave værdier. En gymnast uden moment MUST NOT forsvinde fra nævneren.

#### Scenario: To gymnaster mangler momentet
- **WHEN** otte af ti holdmedlemmer har momentet og alle otte er vurderet 5
- **THEN** vises 8/10 kan, 8/10 vurderet og 5,0 blandt de vurderede, og momentet betegnes ikke som fælles for alle.

### Requirement: Stabilitet er en vurdering uden procentløfte
Systemet MUST NOT omsætte skalaen til sandsynlighed, multiplicere værdier som uafhængige chancer eller kalde et gennemsnit sandsynligheden for en vellykket omgang. Stabilitet SHALL vises ved siden af D og C; den MUST NOT reducere eller øge de officielle point.

#### Scenario: Høj D med lav stabilitet
- **WHEN** træneren vælger et sværere spring med stabilitet 1 frem for et lettere med 5
- **THEN** ændres D og stabilitetsoversigten hver for sig, uden opdigtet forventet karakter eller procentchance.

### Requirement: Vurderingsændringer slår straks igennem
Ændring af en vurdering SHALL genberegne alle berørte lokale spring- og rytmeoverblik og SHALL gemmes i den fælles fil. Der SHALL vises vurderingsdato, så en gammel vurdering kan genkendes uden at appen automatisk ændrer den.

#### Scenario: Opdater en færdighed i brug
- **WHEN** et valgt springs stabilitet ændres fra 2 til 4
- **THEN** opdateres omgangens gennemsnit, minimum og antal lave vurderinger uden at springet skal vælges igen.
