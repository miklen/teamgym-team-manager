# Kravdækning

Denne oversigt afstemmer de ti specs i `build-teamgym-team-manager` med kode, tests og manuel accept. Den erstatter ikke den detaljerede opgaveliste og markerer ikke udestående Google-/driftstest bestået.

| Capability og scenarier | Implementering | Bevis og restkontrol |
| --- | --- | --- |
| Arbejdsflade: dansk kontekst/navigation, fire skærmstørrelser, fokus, tilstande, forklaringer, bevægelse | `apps/web/src`, hash-ruter, native dialoger, status og kladde | `pages`, `workspace`, `recovery`, `accessibility` browserchecks; [visuel rapport](ui-kontrol.md). Reel Pages-drift udestår. |
| Hold/kartotek: flere profiler, navnesammenfald, uden hold, flytning, arkivering, bevarede pladser | Domænets skema/kommandoer/diagnostik, `teams.tsx`, `athletes.tsx` | `workspace`, `skill-editing`, `registry` domænetests; holdoprettelse og ukendt/andet hold i browser. Kladdens medlemsændringer genberegnes før Drive-gemning. |
| Færdigheder: præcis identitet, hele kæder, alias, forbindelser, alle 94 individuelle rytmefelter, forbudte/uafklarede varianter | `catalog`, `dk-spring`, `skill-editor`, registreringskommandoer | Katalogdækning, 83 tilladte/19 forbudte/1 uafklaret springpost, 77 facitcases; browser bygger R-F-hel og åbner eksisterende registrering ved dublet. G er udeladt. |
| Stabilitet: null/1–5/dato/note, fælles vurdering, gennemsnit/minimum/lave/dækning, ekstra særskilt | Domænets `stability`, `updateAssessment`, fælles vurderingskontrol | Afvisning af 0/6/brøk, 4,3/5 og 5/6 i domæne; browser ændrer fælles vurdering og kontrollerer ekstra uden effekt på tællende stabilitet. |
| Seks omgange: holdomgang først, aktive deltagere/registrerede færdigheder, ekstra først, mix, rækkefølge, lokale konsekvenser | `setRoundEntries`, `moveRoundFirst`, pakkens analyse, `spring.tsx` | Domæne-/facitcases; browser gemmer/genåbner seks omgange, omarrangerer alle med tastatur, flytter holdomgang og afviser niende plads. Sortering forhåndsvises før anvendelse. |
| D: basis/tillæg, normaliseret identitet, højeste tre forskellige, komplette trampetspring, sum/3, holdafvigelser, 0,005 | Eksakt `Fraction`, `dk-spring`, `dk-engine`, elementforklaring | Alle 77 facitcases samt fulde opstillinger, rå CSV-sammenligning, 5/1 og samme D/forskellig identitet; fire fejlmutationer. Ukendte bidrag bliver ikke nul. |
| C og potentiale: rå bidrag, separate universer, gentagelser, ren retning, redskab, kategorier, tillæg, observation, vidner | `dk-numeric`, `dk-engine`, `potential`, Web Worker | Matrix-/facittests, komplette opstillinger og uforenelige vidner; browser 4/6→6/6 med annullér/anvend. Budget/afbrydelse er undergrænse, og Q01–Q06 bevares. Ingen E/falsk samlet potentiale. |
| Rytme: præcise varianter/spejling/front, fælles/delvist, navnene bag mangler, hver-gymnast-tærskel, tomt/ændret hold | `rhythm`, pakkekobling, matrix og kompakt visning | Domæne: 8/10, 5,5,5,5,5,1/null, alle tærskler, DB804 og revurdering. Browser: 20 gymnaster/lange navne ved fire viewports og direkte vurderingsadgang. Ingen gruppe-/koreografi-/fuld karakter. |
| Regelversioner: præcis pakke pr. hold, uforanderlig registry, profiler/algoritmer, før/efter, revurdering, ukendt pakke, rollback | `registry`, `dk-v1`, `version-change`, reglementside og streng filparser | Syntetisk anden pakke/algoritme/værdi/krav i integration; browser annullerer/anvender profilskift uden at ændre andet hold. Format 1 er første understøttede format; ældre kræver eksplicit migration, nyere afvises uden omskrivning. Ingen historisk migration opfindes. |
| Google/fælles fil: personlig GIS, husket forbindelse, scopes/konto/udløb, Picker, rettighed, konsistent læsning, betinget upload, ukendt svar/konflikt | `packages/drive`, arbejdsrumsside og indstillinger | 34 Drive-tests og browserchecks med injiceret netværk, IndexedDB, genåbning og fanesignal. GIS-/Picker-scripts indlæst lokalt under CSP. **Reel Pages-/Google-verifikation og to-konto-accept udestår.** |

## Kendte afklaringer og udestående accept

Q01–Q06 og K01/K02 er produkttilstande med kildehenvisning, ikke manglende funktion erstattet af en demonstration. Faglig afklaring ændrer pakkeversion; implementeringsagenten godkender ikke selv en omstridt fortolkning. Se [regelrapporten](regler-og-katalog.md).

Faktisk Google-medieupload skal stadig bevise afvisning af gammel/forkert etag, samtidig upload og CORS. Der må ikke bruges ubetinget upload eller backend, hvis kandidaten fejler. Brugeren har udtrykkeligt valgt én konto nu og live test med trænerteamet i produktion; den undtagelse er dokumenteret, og testene forbliver åbne. Se [beslutningen](testbeslutning-2026-10-25.md).

Reglementet kan genåbnes uden netværk fra de medfølgende, hashkontrollerede PDF-assets. Google-adgang og arbejdsdata kræver netværk. Der er ingen offline-datasynkronisering eller vedvarende gymnastcache.

## Scenarier og reserver · lokal format 3-udgave

| Område | Implementering og bevis |
| --- | --- |
| Strikt format og migration | Selvstændige format 1-/2-skemaer, format 3-scenarier/reserver, validering af hele samlingen og bevarende migration. `scenarios.test.ts`, faste legacy-filer og validerede format 3-eksempler. |
| Plankommandoer og regler | Selvstændige id’er ved kopi, lokale navne, eksplicit målscenarie, separat reserveprioritet og bekræftet indsættelse med uændret basis. Eksisterende uafhængige facitcases og fire mutationer bevares. |
| Forslag og session | Scenarie i pakke-, cache- og workergrænser; sent Plan A-svar kan ikke blive Plan B’s forslag. Visningsvalg er sessionstilstand, og rent skift uploader ikke. `scenario-integrity` og `scenarios` browserprøver. |
| Referencer og regelskift | `planReferences` gennemgår udførende og reserver i alle scenarier. Fjernelse/flytning viser steder og bevarer referencer. Før/efter pr. scenarie og reservevalg samt kontrol af forældet versionsbasis i domænet. |
| Gemning og tilgængelighed | 69 Drive-tests, 123 samlede browserprøver, særskilt billedkontrol ved 390/768/1440, tastatur, stor tekst, skaleret kort viewport, reduceret bevægelse og axe. Simulatorerne beviser ikke faktisk Google/CORS. |
| Udestående | Lokal test er godkendt 27. oktober 2026 med klarsignal til sync, arkivering og lokalt commit. Push/publicering og den eksisterende live Google-/to-konto-accept er fortsat særskilte; liveprøverne er ikke markeret bestået. |

Se ændringens [verifikation](../openspec/changes/archive/2026-10-27-add-discipline-scenarios-and-reserves/verification.md) og [lokale prøvevejledning](lokal-test.md).
