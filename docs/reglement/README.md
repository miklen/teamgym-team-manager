# Struktureret kildeoverblik over TeamGym-reglementerne

Gennemgang af de **18 lokale PDF-filer, 139 sider**, i `reglement/`, udført 2026-10-30. Formålet er et selvstændigt grundlag for senere kontrol af applikationen og for andre regelpakker. Der er **ikke** foretaget en implementeringsaudit eller ændret appregler i dette trin.

Læs først hovedreglementet og det tekniske regulativ, derefter de relevante tabeller og genkendelsesregler. Hvert opslag indeholder kildeidentitet, afgrænsning, regler, afhængigheder, præcise åbne spørgsmål og forslag til senere validering. De åbne spørgsmål er en del af resultatet, ikke løst ved at vælge en sandsynlig fortolkning.

## Opslag for hver kilde

| ID   | Opslag                                                       | Primær rolle                                           |
| ---- | ------------------------------------------------------------ | ------------------------------------------------------ |
| H    | [Hovedreglement DK/REG](01-hovedreglement.md)                | C/D/E, deltagelse, rytme og spring                     |
| TR   | [Teknisk Regulativ](02-teknisk-regulativ.md)                 | Alder, hold, reserver, konkurrenceform og anmeldelse   |
| ASP  | [Aspirantrækken](03-aspirant.md)                             | Selvstændig bedømmelsesmodel og begrænset springudvalg |
| A1.1 | [Rytmesværheder DK](04-rytme-dk.md)                          | Celleværdier, udførelseskrav og identiteter            |
| A1.2 | [Rytmesværheder REG](05-rytme-reg.md)                        | Egne værdier og eget udvalg; ikke DK-værdier           |
| A2   | [Rytmeudførelse](06-rytme-udfoerelse.md)                     | Individuelle fejl og samlede E-fradrag                 |
| A3   | [Baneværdier](07-bane-vaerdier.md)                           | Basis, skruetillæg og retninger                        |
| A4   | [Trampetværdier](08-trampet-vaerdier.md)                     | Redskabsfamilier, basis og værdikonflikter             |
| A5   | [Genkendelse](09-genkendelse.md)                             | Position, rotation, skruefordeling og identitet        |
| A6   | [Springudførelse](10-spring-udfoerelse.md)                   | E-fradrag, figurer og observationskrav                 |
| RED  | [Redskaber](11-redskaber.md)                                 | Fysisk opstilling, mål og rækkeafhængige valg          |
| QA   | [Spørgsmål og svar](12-spoergsmaal-svar.md)                  | Afklaringer fra december 2025                          |
| A7   | [Trippelgodkendelser](13-trippelgodkendelser.md)             | Individuelle godkendelser og database                  |
| A7.1 | [Trænerlicens](14-traenerlicens.md)                          | Risikofyldte spring, også visse dobbelter              |
| A8   | [Nationale CoP-undtagelser](15-liga-cop.md)                  | Liga-erstatninger; CoP selv mangler i mappen           |
| FOR  | [Forældretilladelse](16-foraeldretilladelse.md)              | Under 18 på springdagen                                |
| FK   | [Fælles konkurrencebestemmelser](17-faelles-bestemmelser.md) | Medlemskab, licens, medaljer og administration         |
| NYT  | [Ændringsorientering 2025](18-aendringsorientering.md)       | Historisk, udtrykkeligt foreløbig information          |

Supplerende arbejdsredskaber: [prioriteret afklaringsindeks](afklaringer.md), [valideringsgrundlag og håndregnede eksempler](valideringsgrundlag.md), [genbrugelig reglementsskabelon](skabelon.md) og [kildemanifest med SHA-256](kildemanifest.json).

## Kildehierarki og versionsvalg

H 1.4 giver udtrykkeligt TR forrang over H ved tvetydighed. Det er **ikke** en generel regel om, at TR overtrumfer alle andre dokumenter. Forholdet mellem fælles bestemmelser og TeamGym-undtagelser, mellem A7 og A7.1 og mellem tabeller og modstridende prosa skal dokumenteres særskilt.

- DK: H's DK-punkter + TR + RED + A1.1/A2 + A3/A4/A5/A6. Sikkerheds-/godkendelseslag vurderes særskilt; A7.1 omfatter også spring, der ikke er tripler.
- REG: H's REG-punkter + TR + RED + A1.2/A2 + relevante A3/A4/A5/A6; ingen automatisk arv af DK-satser, elementudvalg eller ind/ud-tillæg.
- ASP: ASP + TR + RED og relevante fælles bestemmelser. Spring bedømmes ikke med DK's C/D-model.
- ESM A/B: TR 6.1 henviser til henholdsvis DK junior/REG junior med særundtagelser i H, bl.a. rotationsgrænser. Det er egne profiler, ikke blot frie klubhold.
- Liga: kræver en fastlåst CoP-udgave og ændringsblade plus A8 og nationale afhængigheder. De 18 filer er ikke et komplet Liga-grundlag.
- QA og NYT er fra 2025; hvert udsagn skal kobles til den valgte nyere udgave. NYT siger selv, at det er foreløbigt og ikke fyldestgørende.

[GymDanmarks kildeindeks](https://gymdanmark.dk/konkurrence-teamgym/) er kontrolleret som ekstern versionskontrol. Det linker fortsat til dokumentfamilierne, men online-PDF'ernes bytes er ikke hentet og sammenlignet i denne gennemgang. Indeksets tilmeldingstekst afviger fra TR; se TR-U07. Lokale kilder er ikke udskiftet.

## Hvad status betyder

**Kildekrav** er en parafrase med kildepunkt. **Håndberegning** er en selvstændig anvendelse af en udtrykkelig formel, ikke output fra appen. **Kildekonflikt** har to angivelser, der ikke umiddelbart kan gælde samtidigt. **Manglende præcisering** betyder, at en deterministisk algoritme kræver en beslutning, som teksten ikke fuldt fastlægger. **Observation** betyder, at korrekt regeltekst stadig ikke afgør en faktisk udførelse uden bedømmelse.

Ingen af disse opslag udgør DoRS/KTG-godkendelse. Ingen automatisk test kan afgøre, hvilken side af en kildekonflikt der er sportsligt autoritativ. En åben værdi må ikke omdannes til nul eller til den værdi, appen allerede bruger.

## Gennemgangens dækning og grænser

Alle 18 PDF'ers tekst er gennemgået sidevis. Tabellerne i A1.1/A1.2, A3/A4, A5/A6, A2, ASP s. 5-8, H s. 29-32/37-40/45-48, TR s. 4, A7.1 og A8 samt udvalgte redskabs-/orienteringstabeller er desuden kontrolleret visuelt. Sidebilleder er arbejdsfiler under `tmp/`, ikke nødvendige for at bruge opslagene.

Opslagene er strukturerede resuméer, ikke en fuld erstatning for hver celle, figur, fodnote og dommervejledning i originalerne. A1-opslagene giver et katalogkort over celler; en senere maskinlæsbar import skal også bevare alle cellekrav og figurrelationer. Der er ikke gennemført en ny uafhængig dobbeltindtastning af alle kildeceller, indhentet dommersvar eller kontrolleret CoP's fulde indhold.

De otte PDF'er, der også findes i projektets tidligere fastlåste kildemanifest, er byteidentiske med de lokale kopier i denne gennemgang. De tidligere implementeringsdokumenter er ikke brugt som sportsligt facit. De har et andet formål: de beskriver den nuværende apps afgrænsning og tidligere valg, som skal vurderes i næste trin.

## Fælles data og fletning

Dette trin tilføjer kun dokumentation. Det ændrer ingen gemte felter, sammenligningsregler, identiteter, rækkefølger, afhængigheder, afledte værdier eller brugergrænseflade. Den fælles flettekontrakt påvirkes derfor ikke, og samtidighedstests er ikke relevante for denne dokumentændring.

Ved senere regelimplementering skal alle disse forhold vurderes eksplicit. Især regelversion, gymnastidentitet, serieorden, elementidentitet, optællingsgrundlag og godkendelser kan ikke håndteres med selvstændige formularregler. Se [vedligeholdelse af fletning](../vedligeholdelse-fletning.md).

Næste trin er at gennemgå afklaringerne og derefter koble klare kildekrav til kode og uafhængige tests. Implementeringen er ikke erklæret korrekt af dette overblik. Ingen commit eller push er udført.

## Udførte dokumentkontroller

- 18 originalfiler kontrolleret mod gennemgangens SHA-256-manifest; 139 PDF-sider i alt.
- Alle otte fælles filer sammenlignet med det tidligere fastlåste manifest; alle hashes stemmer.
- Alle lokale Markdown-links og tabelkolonners struktur kontrolleret.
- Katalogkortene indeholder alle 96 forskellige trykte DK-rytmekoder og alle 78 forskellige trykte REG-rytmekoder fra tekstudtrækkene. Antallet af koder er ikke antallet af celler, fordi koder genbruges. Denne strukturelle kontrol beviser ikke i sig selv korrekt værdi eller fortolkning.
- Markdown og manifest formateret og kontrolleret med projektets Prettier.
- Ingen app-, bygge- eller browserprøver kørt: ændringen består alene af dokumentation. Ingen lokal appudgave er genbygget, og ingen eksisterende trænerfil er ændret.
