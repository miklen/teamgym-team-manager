# Implementeringskontrol · 26. oktober 2026

Ændringen er implementeret, lokalt afprøvet af brugeren og publiceret. Den seneste udgave er godkendt 26. oktober 2026 med det udtrykkelige klarsignal: »Meget bedre! Lad os publicere det.« Commit `3332a17` er pushet til main, og GitHub Pages har grøn build og deploy. Ingen fælles trænerfil er brugt til skriveprøver.

Første lokale tilbagemelding: Brugeren fandt det rodet, at fundament stod i en separat blok og samtidig kunne vælges fra kataloget. Den nye udgave samler bibliotek, direkte valg og fundament i én liste. En præcis udførelse har én række, også ved delt fundament og ved et tidligere direkte valgt barn. Præciserede dobbeltvarianter erstatter katalogskabelonen. Sikkerhed, fravalg, kilde og skrueafklaring ligger på rækken; Kun valgte afgrænser samme liste. Byggerens ekstra gentagelse af den valgte serie er fjernet. Denne tilbagemelding er ikke et klarsignal til frigivelse; den rettede udgave skal afprøves igen.

Fire nye modeltests og to browserprøver ved 1440/390 px kontrollerer identitetsunikhed, direkte/afledte overlap, fravalg, egen vurdering, filterbevarelse, præciserede katalogskabeloner, tastaturfokus, axe og manglende vandret overflow. De øvrige browserforløb bruger den samme samlede vælger. De opdaterede samlede resultater fremgår nedenfor.

Næste lokale tilbagemelding om Strakt–rondat–flik–helskrue er rettet med trænerkatalog version 2. Det giver ni unikke børn: de tre præcise begyndelser, samme helskrueserie uden indgangssalto og dens fem fundamenter. Fem nye domænecases kontrollerer kendte indgangsvarianter, rondat/kraft, bevarede overgange, ingen løs flik, direkte kilde, løbende arv, fravalg og version 1/genvalg. Syv søgecases kontrollerer sammenhængende begyndelser, tegnnormalisering, egne navne og bevarede valg. To nye browserprøver ved 1440/390 px kontrollerer den faktiske søgning, scroll-reset, filterrydning, 3→5, fravalg/genvalg, ti unikke registreringer, axe og gem/genåbn. Tidligere filer udvides først ved bevidst genvalg.

Tredje lokale tilbagemelding om Springplanens formulering og lange dropdowntekster er implementeret: kendt D vises som tal i en diskret markering uden Egen D. Sikkerhed har fem farvede streger plus talværdi og tilgængelig forklaring. Springvalget har søgning, særskilte navne/retninger, D og sikkerhed, to linjer på mobil samt tastaturbetjening og fokusbevarelse. Fire nye browserprøver dækker 1440/390 px, pile/Home/End/Enter/Escape, ingen resultater, Ikke vurderet, Vælg senere, klik udenfor, gymnastskift, annullering og et stort syntetisk repertoire. De eksisterende numeriske og planmæssige forventninger er bevaret. Axe fandt under arbejdet en manglende grafisk rolle samt lav midlertidig tekstkontrast under gemmeknappens farveovergang; begge er rettet, og hele suiten er derefter gennemført uden fejl.

## Automatiske resultater

| Kontrol | Resultat |
| --- | --- |
| `npm.cmd run check` | Exit 0; TypeScript og ESLint uden fejl |
| `npm.cmd run test:domain` | Exit 0; 233 tests i 19 filer |
| `npm.cmd run test:drive` | Exit 0; 61 tests i 4 filer |
| `npm.cmd run test:mutations` | Exit 0; 4/4 bevidste regelmutationer fanget i isoleret kodekopi før publicering |
| `npm.cmd run build` | Exit 0; de 8 fastlåste PDF-kilders SHA-256 og størrelser stemmer |
| `npm.cmd run test:e2e -- --workers=4 --reporter=list --output C:/Users/mikke/AppData/Local/Temp/teamgym-skill-overview-e2e` | Exit 0; 94 Chromium-prøver, 42,1 sekunder |
| `openspec.cmd validate improve-skill-overview-and-inheritance --strict` | Exit 0 |
| `git diff --check` | Exit 0 |

Browserprøvernes midlertidige spor ligger uden for OneDrive, fordi en tidligere kørsel blev ramt af en faktisk EBUSY-fillås under oprydning af spor. De endelige resultater ovenfor er fra en afsluttet kørsel med verificeret exitkode. Buildet har fortsat en Vite-advarsel om en JavaScript-chunk over 500 kB; ingen nye runtime-afhængigheder er indført.

## Gennemførte scenarier

- Strikt format 1-læsning og eksplicit format 2-migration med bevarede data, egne null-vurderinger, historik, bekræftelser og planreferencer. Format 2-eksemplet valideres mod migreringen af format 1-eksemplet.
- Accepterede relationer afviser cykler, dubletter, fremmede gymnaster, falske udførelsesidentiteter og effektive værdier, der afviger fra kilden.
- Fem helskruebørn, seks rudyfundamenter, alle fire 540°→180°-fordelinger og alle ni positionspar. Ukendte udførelsesvarianter gøres ikke til kendte katalogudførelser.
- Laveste kendte D, laveste sikkerhed ved samme D, stabil kildeidentitet, direkte parents, eksisterende accepterede kilder i preview, ukendt D og eksplicit kildevalg.
- Sikkerhed 3→5 med ny dato, egne 2/null, Følg igen, null-propagation, noter, bortfald/ændret udførelse, holdskift til manglende pakke, genvalg og id-/notebevaring.
- Fravalg og arveophav gennem Drive-rundtur, betinget gemning, konkurrerende ændring, mistet uploadsvar og nyere lokale ændringer under afstemning. Migration med læseadgang og annullering udfører ingen upload.
- Browserforløb for migration og originaleksport, rytmeoprettelse med sikkerhed/dato, påkrævet dato, Ikke vurderet og dubletgenbrug.
- Minimum-D inklusive lighed, fravalg og egen vurdering under filtergrænsen, rudy/rudi, valg mellem discipliner, ukendt D samt annullering uden ændret arbejdsrum.
- Dobbelt 540° viser uafklaret fundament; fravalg og afklaring på parenten er afprøvet. Den præcise afledning [2,1]→[0,1] er kontrolleret i den gemte syntetiske fil.
- Selvstændigt konstruerede repertoirer med 1, 22 og 120 registreringer ved 1440 og 390 px: søgning i lukkede familier, vurderingsredigering, tastatur, axe og kontrol af både dokumentets og dialogens vandrette overflow.
- Fokus ved udfoldning/fravalg og efter annullering/fjernelse. Axe/WCAG-prøver på centrale arbejdsflader, vurdering og registrering.
- Arvet barn på en planplads opdaterer sikkerhedsoversigten og datoen, mens egen D forbliver 0,30. Parentens fjernelsesbekræftelse viser barnet.
- Springplan med 1/6: egen D 0,80 og 5/5 samtidig med ufuldstændigt bidrag. Valgmuligheder viser D 0,80/5 og D 1,00/2 før valg. Egen D 0,80/bidrag 0,00, Ekstra og ukendt egen D er afprøvet. De numeriske regelregressioner er uændrede.

## Visuel gennemgang

Disse lokale, syntetiske screenshots er genereret og visuelt gennemgået:

- `tmp/ui-qa/repertoire-22-1440.png` og `tmp/ui-qa/repertoire-22-390.png`.
- `tmp/ui-qa/repertoire-1-1440.png`, `repertoire-1-390.png`, `repertoire-120-1440.png` og `repertoire-120-390.png`.
- `tmp/ui-qa/unified-spring-picker-1440.png` og `tmp/ui-qa/unified-spring-picker-390.png`, som viser den rettede fælles vælger.
- `tmp/ui-qa/fundament-dobbelt-390.png` med skrueafklaring i samme liste.
- `tmp/ui-qa/entry-salto-1440.png` og `tmp/ui-qa/entry-salto-390.png` med arv til samme serie uden indgangssalto i den fælles liste.
- `tmp/ui-qa/plan-skill-options-1440.png` og `tmp/ui-qa/plan-skill-options-390.png` med visuelt springvalg, D og sikkerhed på særskilte pladser.
- `tmp/ui-qa/plan-difficulty-1440.png` og `tmp/ui-qa/plan-difficulty-390.png` med D-tal uden Egen D, fem sikkerhedstrin og bevaret forklaring af omgangsbidraget.

Rækkeafstande er reduceret efter visuel gennemgang. En indtoning er ændret til en kort bevægelse, så tekstkontrasten er fuld gennem hele animationen. Reduceret bevægelse understøttes. Overblikket bruger rolige flader, én accent og faste D-/sikkerhedskolonner; mobilversionen samler metadata under navnet.

## Afgrænsning

Den separate lokale udgave er startet med `npm.cmd run preview:local` i `dist-local/` på `http://127.0.0.1:5173/teamgym-team-manager/`. En ny Chromium-kontekst har verificeret HTTP 200, sidetitlen TeamGym Team Manager og appens startoverskrift. Ingen Google-konto blev forbundet i denne kontrol. Serveren bliver stående. Brugeren er bedt om at gemme/eksportere en kladde før genindlæsning; efter aflevering ændres eller genbygges testudgaven ikke under brugerens test.

Der er ikke udført en ny live Google/T01- eller reel to-konto-test, og disse kaldes ikke bestået. Brugerens lokale accept er registreret efter den faktiske tilbagemelding.

## Publicering efter brugerens godkendelse

- Implementeringscommit: [`3332a17`](https://github.com/miklen/teamgym-team-manager/commit/3332a17c7e6fb93bbcded7ddf50df9e910834254), pushet som fast forward til main fra `460d707`.
- [GitHub Pages-kørsel 40401117894](https://github.com/miklen/teamgym-team-manager/actions/runs/40401117894): build og deploy er afsluttet med success. Loggen dokumenterer 19 grønne domænetestfiler, fire grønne Drive-testfiler, 4/4 fangede regelmutationer og 94 beståede Chromium-prøver på CI, 2,2 minutter til browserprøverne.
- Offentlig adresse: [TeamGym Team Manager](https://miklen.github.io/teamgym-team-manager/). En isoleret Chromium-kontekst uden Google-login har verificeret HTTP 200, titel/startoverskrift samt de nye arve- og springvalgsfunktioner i den publicerede asset `app-B8NSQXAx.js`.
- Den separate [Kontrol-kørsel 40401117817](https://github.com/miklen/teamgym-team-manager/actions/runs/40401117817) er efterfølgende afsluttet med success. Alle trin er grønne, herunder installation af testbrowseren og browserprøverne; resultatet er kontrolleret før arkivering.

## Synkronisering og arkivering

Brugeren bad efter publiceringen om arkivering og valgte derefter udtrykkeligt synkronisering. De fem hovedspecifikationer difficulty-scoring, drive-workspace, routine-planning, skill-catalog og stability-assessment er opdateret med 10 ændrede og 13 nye krav. Sammenligning efter sammenfletningen bekræfter alle 23 krav, bevarede eksisterende scenarier, uændrede øvrige krav og bevarede Purpose-afsnit. `openspec validate --specs --strict` består for alle 10 hovedspecifikationer, og den aktive change består også strikt validering. Alle 33 opgaver og alle artefakter er afsluttet før arkivering.
