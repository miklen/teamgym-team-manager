# Implementeringsverifikation

## Fælles data og fletning

Guiden læser den valgte regelpakke, profil, disciplin, scenarie, omgangenes eksisterende rækkefølge og analyse samt de eksisterende potentialeresultater. `guideCounts` og guidens rækker beregnes i hukommelsen. Åbning og navigation kalder ingen skrivekommando. Der tilføjes ingen gemte felter, id'er eller rækkefølger, og ingen formular får egen fletteregel. En ændret plan eller vurdering genberegner analyse og guide gennem den eksisterende regelbinding.

Trænerens afklaring ændrer betydningen af den **endnu ikke push'ede** DK 1.1.0: B-ELEMENT er et positivt tillæg på 0,10 pr. forskellig gyldig C-elementidentitet ud over den første i hver serie, summeret for tællende gymnaster og gennemsnittet over tre omgange. Gentagelser tæller én gang. DK 1.0.0 bevarer Q01 og begge historiske fortolkningsspor. Kildebytes og den historiske facitmatrix er ikke ændret. Ingen C-tal eller potentialer gemmes, men en eksisterende lokal 1.1.0-testfil får genberegnet C ved indlæsning. Den tidligere lokale preview må derfor ikke bruges til ny gemning efter rettelsen. Dette og valget mellem samtidigt ændret regelbinding og omgang er skrevet ind i [flettekontrakten](../../../docs/vedligeholdelse-fletning.md).

Diffen er gennemgået for ændringer i `Workspace`, skema, kommandoer, flettepolitik og Drive-adapter. Ingen af disse ændres. Regelpakken, C-beregningen, guiden og potentialevægten ændres kun i DK 1.1.0. Domænetests dækker faste facit for ét element, rondat–flik–flik, rondat–flik–lukket salto, fire forskellige elementer, delvis plan, samlet C, begge pakker, potentialer, før/efter-visning og konfliktvalg ved samtidig regel- og omgangsændring i begge fletteretninger. Browserprøver dækker den afklarede 1.1.0-række, den åbne 1.0.0-række, tomt scenarie, desktop/mobil, tastatur, tilgængelig tekst, reduceret bevægelse, scenarie- og disciplinskift, ufuldstændige pladser, manglende regelpakke og sene potentialeresultater.

Efter brugerens feedback er den gentagne nederste potentialeliste fjernet. Guidens tillægsrækker viser nu valgt og dokumenteret beløb, søgestatus og handlingen til den eksisterende konkrete vidneopstilling. Det dokumenterede beløb er også synligt i den lukkede rækkes korte status. Dette ændrer kun præsentationen af de samme afledte resultater. Potentialeworkerens scenariebinding, preview, annullering og anvendelseskommando er uændrede. Alle 153 browserprøver bestod efter flytningen; efter den sidste kompakte statusændring bestod 13 målrettede prøver, herunder forhåndsvisning, scenarieskift, tastatur og mobil. Guiden med dokumenteret mulighed er desuden gennemgået visuelt i et browserbillede.

Den seneste tilpasning lader guiden starte lukket med et overblik over færdige omgange, alle C-tillæg og alle rå C-fradrag. D og C står før guiden. Efter brugerens visuelle feedback står den faste holdprofil igen synligt under scenariefanerne, også mens guiden er lukket; scenariets navn vises kun på fanen. Dens uddybede rammer står i guiden. Overblikket summerer kun regelpakkens allerede afledte beslutninger; det gemmes ikke og ændrer ingen fælles data, identiteter, planorden, afhængigheder eller flettevalg. En domæneprøve dækker tom, delvis og fuld plan med fast facit for tillæg og fradrag, herunder fradrag uden egen kort guiderække. Browserprøver dækker lukket standardtilstand, synlig profil, tastatur, mobil, scenarieskift, tilgængelighed, sene potentialesvar og usikkerhedspopoverens placering efter flytningen. Tom og udfyldt status er gennemgået visuelt i browserbilleder.

Efter fjernelsen af den dobbelte scenarieoverskrift bestod 7 målrettede guideprøver og 15 scenarieprøver. Computer- og mobilbilleder viser ét scenarienavn på fanen og en synlig holdprofil under fanerne. Den fulde browsersuite på 153 prøver blev kørt før denne rene præsentationsrettelse.

## Automatiske kontroller

- `openspec.cmd validate guided-spring-composition --type change --strict --json`: bestået.
- `npm.cmd run check`: bestået, inklusive flettepolitikkens dækningskontrol.
- `npm.cmd run test:domain`: 313 bestået.
- `npm.cmd run test:drive`: 82 bestået.
- `npm.cmd run build`: bestået; fastlåste kilder verificeret.
- `npm.cmd run test:e2e`: 153 bestået.
- `git diff --check`: ingen whitespacefejl.

Kontrollerne ovenfor blev kørt igen efter den sammenklappelige statusvisning. Brugervejledningens relative link til springbiblioteket er kontrolleret. Den nye lokale `preview:local` blev bygget særskilt i `dist-local/`, og appens startskærm blev kontrolleret i Chromium på port 5173. Brugeren afprøvede udgaven lokalt, gav feedback på placeringen af holdprofil og det dobbelte scenarienavn og gav derefter 31. oktober 2026 udtrykkeligt klarsignal til sync, arkivering, commit og push. Push til `main` starter automatisk GitHub Pages-arbejdsgangen.
