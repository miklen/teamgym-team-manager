# Tasks

Gruppe 1–8 forbereder en lokal testudgave; gruppe 9 kræver brugerens efterfølgende test og klarsignal. Afkrydsningerne angiver faktisk implementering og kontrol. Ingen reel fælles trænerfil må bruges til skriveprøver.

## 1. Format 2 og bagudrettet indlæsning

- [x] 1.1 Udvid `packages/domain/src/schema.ts` og valideringen med egen/arvet oprindelse, accepterede kilde-/målrelationer med identiteter/version og personlige fravalg; verificér rene domænetests for gyldige relationer, dubletter, cykler, fremmede gymnaster og forfalskede udførelsesidentiteter.
- [x] 1.2 Bevar en strikt format 1-læser, implementér en ren eksplicit migration til format 2, og opret nye arbejdsrum i format 2; verificér syntetisk migration og filrundtur med uændrede id'er, navne, værdier, datoer, noter, arkivering, bekræftelser, regelbindinger, planer og revisionshistorik samt egne oprindelser for alle gamle registreringer.
- [x] 1.3 Beskriv format 2, arvefelternes invariants og afvisning i ældre apps i `docs/filformat.md`; verificér eksempler mod skemaet og kontroller, at ingen virkelige persondata eller credentials indgår.

## 2. Præcist fundament og kildevalg

- [x] 2.1 Opret det afgrænsede versionsmærkede relationskatalog ved webappens springbibliotek med præcise begyndelser, helskrueseriens tre saltofundamenter, rudyens seks 0°/180°-fundamenter og dobbelt 540° til 180°; verificér faste relationseksempler, alle fire fordelingspar, en blandet kropspositionscase og ingen krydsning af redskab/retning eller dannelse af nye forbindelser fra enkeltregistreringer. Efter brugerens opfølgning omfatter version 2 også samme serie uden kendt indgangssalto og dens fundament; verificér ni børn til strakt-rondat-flik-hel, bevarede overgange samt fortsat version 1-understøttelse.
- [x] 2.2 Implementér den rene, injicerbare arveplan i `packages/domain`, og lad `springRegistrationPlan` bruge samme resultat til preview og registrering; verificér laveste kendte D, laveste sikkerhed ved samme D, null uden opdigtet tal, stabilt identitetsvalg og uafhængighed af klikrækkefølge.
- [x] 2.3 Afgræns kandidatparents til direkte valgte aktive registreringer med accepterede relationer, og udvid batchregistrering med id-genbrug, fravalg og bevaret egen vurdering; verificér at automatisk rondat-flik ikke overtager rondat fra den valgte halv-/helskrueserie, og at ændring af katalogversion ikke tilføjer børn ved genåbning.
- [x] 2.4 Implementér præcisering af manglende skruefordeling i nye dobbeltvalg før afledte børn registreres; verificér, at det automatiske 180°-barn vises med Afklar skruefordeling, færdiggøres ved afklaring på parenten og kan fravælges uden at gætte fordeling eller gøre et uafklaret spring gyldigt.
- [x] 2.5 Opdatér `docs/springbibliotek.md` med den leverede relationsmatrix, kildevalg og grænsen mellem praktisk fundament og officielle regler; verificér hvert dokumenteret eksempel mod katalogets faste testcases og uafhængigt fastlagte D-facit.

## 3. Løbende vedligehold af sikkerhed

- [x] 3.1 Udvid vurderingskommandoerne med Egen vurdering og Følg igen samt en atomisk arveafstemning; verificér ændring 3 til 5 med ny dato, egen 2 som bevares, egen null som bevares, genoptaget arv, propagation af null og noter uden tab af ophav.
- [x] 3.2 Integrér afstemningen ved ændret udførelse, fjernelse/gentilføjelse og ændret hold-/regelbinding med injiceret aktuel D-kontekst; verificér alternativ kilde, manglende kilde, ugyldiggjort gammel udførelsesidentitet, ukendt D uden skjult fallback og ingen ændringer på andre gymnaster.
- [x] 3.3 Implementér vedvarende fravalg pr. gymnast og målidentitet samt blokering af automatisk genoprettelse af fjernede børn; verificér ny parent efter fravalg, katalogopdatering, annulleret formular, bevidst genvalg med samme id/note og bevarede utilgængelige planreferencer ved fjernelse.
- [x] 3.4 Lad alle vurderingsflader og planaggregater bruge samme effektive sikkerhed og dato, og vis afhængige børn i fjernelsesbekræftelsen; verificér med domæne- og browserprøver, at ændring af parent opdaterer en omgangs gennemsnit/minimum uden at ændre D.
- [x] 3.5 Dokumentér Egen vurdering, Arvet fra, Følg igen, fravalg og manglende kilde i `docs/brugsvejledning.md`; verificér den beskrevne arbejdsgang mod en syntetisk filrundtur og tests fra 3.1–3.4.

## 4. Eksplicit migration gennem Drive-sessionen

- [x] 4.1 Udvid Drive-læsning/session med et migrationstilbud og lokal format 2-kladde med bevaret hash, ETag, filversion og revisionsbasis fra de læste format 1-bytes; verificér `tests/drive/workspace-session.test.ts` for accept, annullering, eksisterende ugemt arbejde, læseadgang og fravær af upload ved åbning/migration.
- [x] 4.2 Integrér migrationsbesked og mulighed for at eksportere originalen i åbningsforløbet uden at ændre Google-adgangslagerets format; verificér browserprøver med syntetisk format 1 og test, at afvisning af nyere/ødelagt fil bevarer den aktuelle session.
- [x] 4.3 Bevar betinget gemning og afstemning af uklare uploadsvar for migrerede og arveopdaterede snapshots; verificér syntetiske Drive-tests for konkurrerende gemning, afbrudt uploadsvar, ændringer under upload og genåbning med intakte arvekilder/fravalg.
- [x] 4.4 Dokumentér originalbevarelse, bevidst gemning og begrænsningen for ældre apps i `docs/filformat.md` og `docs/brugsvejledning.md`; verificér teksten mod migrationsdialogen og de gennemførte syntetiske scenarier, uden at kalde T01 eller reel to-konto-test bestået.

## 5. Navne og rytmeregistrering

- [x] 5.1 Saml præcise visningsnavne og aliaser for bane/trampet og anvend dem i bibliotek, gymnastprofil og Springplan; verificér rudy/rudi-søgning, konsekvente gradtegn, synlig retning, bevarede egne navne og identiske færdighedsidentiteter før/efter navneændringen.
- [x] 5.2 Tilføj sikkerhed og vurderingsdato til rytmeoprettelse i `skill-editor.tsx`, brug katalogets navn/variant og fjern standardforløbets navnefelt; verificér browserprøver for vurdering 3, Ikke vurderet, påkrævet dato, dubletgenbrug og uændret Byg selv-navnefelt.
- [x] 5.3 Opdatér rytme- og navneforklaringen i `docs/brugsvejledning.md`; verificér eksempler mod UI og kør `npm.cmd run verify:sources`, så de fastlåste kildebytes er dokumenteret uændrede.

## 6. Grupperet valg og gymnastoverblik

- [x] 6.1 Byg den fælles familie-/træmodel for direkte valg, børn, ophav, egne vurderinger, D og fravalg; verificér rene tests for én række pr. identitet, korrekte unikke gruppetal, laveste-D-placering, egne spring og børns egen vurdering under en parent.
- [x] 6.2 Opdatér `spring-picker.tsx` og byggerens forhåndsvisning med live fundament, direkte fravalg og egen sikkerhed samt minimum-D, søgning og gruppefilter; verificér browserprøver for valg på tværs af bane/trampet, filtergrænse inklusive lighed, ukendt D og stadig tilgængelige valg/børn under filtergrænsen.
- [x] 6.3 Opdatér `athletes.tsx` og CSS til kompakte familiegrupper med faste desktopkolonner og mobilrækker; verificér søgning i lukkede grupper og vurderingsredigering i selvstændigt opbyggede syntetiske repertoirer med 1, 22 og 120 registreringer ved 1440 og 390 px.
- [x] 6.4 Verificér tastatur, fokus efter udfoldning/fravalg og fjernelse, tilgængelige navne og fravær af vandret siderulning med Playwright/axe; lever syntetiske screenshots ved 1440 og 390 px til visuel gennemgang og registrér kun faktisk kontrollerede resultater.
- [x] 6.5 Opdatér `docs/springbibliotek.md` og `docs/brugsvejledning.md` med grupper, minimum-D, den samlede vælger og søgning efter seriens begyndelse; verificér alle beskrevne handlinger i browserprøverne fra 6.2–6.4.

## 7. D og sikkerhed i Springplan

- [x] 7.1 Vis springets D-tal uden teksten Egen D og med tilgængelig betegnelse samt visuel sikkerhed på hver omgangsplads efter brugerens lokale tilbagemelding; vis et afvigende/uafklaret bidrag særskilt med årsag, og verificér browsercase med 1/6 pladser, helskrueseriens håndfastlagte D 0,80 og sikkerhed 5/5, samtidig med ufuldstændigt bidrag og omgangssum.
- [x] 7.2 Vis hver anvendelig registrering i et søgbart visuelt springvalg med særskilt navn/retning, D og farvede sikkerhedstrin; verificér D 0,80/sikkerhed 5 over for D 1,00/sikkerhed 2 før valg, null, pile/Home/End/Enter/Escape, fokus, klik udenfor, gymnastskift og annullering ved 1440/390 px samt søgning i 120 registreringer.
- [x] 7.3 Verificér nulstillet bidrag 0,00 over for kendt egen D 0,80, ekstra gymnaster, ukendt egen D og uændrede numeriske regressionsfacit i `tests/domain/spring-engine.test.ts`; opdatér `docs/brugsvejledning.md` med forskellen mellem egen D og omgangsbidrag uden ændring af den udgivne regelpakke.

## 8. Samlet kontrol og lokal testudgave

- [x] 8.1 Kør `npm.cmd run check`, `npm.cmd run test:domain`, `npm.cmd run test:drive`, `npm.cmd run build` og `npm.cmd run test:e2e`; verificér alle exitkoder og registrér præcise resultater, herunder syntetisk migration, genåbning, arv og D-visning, uden at ændre en igangværende lokal brugertestudgave.
- [x] 8.2 Opdatér `docs/lokal-test.md` med en kort afprøvning af rytmeoprettelse, rudy/fravalg, løbende arv/egen vurdering, stort overblik, migration og D ved 1/6 pladser; verificér at testen bruger syntetisk arbejdsrum og ikke foreslår skrivning til fælles trænerfiler.
- [x] 8.3 Bed brugeren gemme eller eksportere en eventuel kladde før genindlæsning, start `npm.cmd run preview:local` i separat `dist-local/`, og kontrollér at `http://127.0.0.1:5173/teamgym-team-manager/` åbner; aflever link og korte testpunkter, lad serveren køre, og stop ændringer/genbygning mens brugeren tester.

## 9. Brugerens test og efterfølgende frigivelse

- [x] 9.1 Afvent og registrér brugerens faktiske lokale testresultat; verificér accept ved en udtrykkelig tilbagemelding og forbered en ny lokal testudgave ved eventuelle rettelser frem for at markere testen bestået på forhånd. Brugeren godkendte den seneste udgave 26. oktober 2026: »Meget bedre! Lad os publicere det.«
- [ ] 9.2 Commit, push og publicér kun efter brugerens udtrykkelige klarsignal efter den lokale test; verificér det konkrete klarsignal og de faktisk gennemførte Git-/publiceringsresultater, ellers behold opgaven åben.
