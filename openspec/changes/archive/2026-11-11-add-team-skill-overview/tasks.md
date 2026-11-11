## 1. Afledningsmodel

- [x] 1.1 Opret `apps/web/src/team-profile-model.ts` med den rene funktion `teamProfile(workspace, teamId, discipline, rulePackage)`. Den bygger på `teamSkillRows` med alle aktive gymnaster som ledige og beregner pr. identitet D, kan, sikre (3–5), lave (1–2) og Ikke vurderet. N læses fra `springRules[discipline].participants.counting`, og loftet er N + 2.
- [x] 1.2 Beregn status pr. række i specens rækkefølge: Klar, Skrøbelig, Mangler vurdering, Ustabil, Tæt på og ellers nedtonet.
- [x] 1.3 Inddel rækkerne i linjer med `skillFamily` på den repræsentative definition. Linjerne står i fast rækkefølge og rækkerne efter D faldende og derefter navn. Hver linje får sin fordeling af sikre, lave og Ikke vurderet.
- [x] 1.4 Implementér relevansreglen inden for linjen med beskårne tal: synlige rækker, overgåede rækker med antal og rækker samlet under Uden kendt D.
- [x] 1.5 Beregn holdets niveau pr. disciplin og op til fem fokuspunkter i specens prioritet og D-orden.
- [x] 1.6 Opret `tests/domain/team-profile-model.test.ts` med syntetiske data:
  - bedste registrering pr. gymnast og identitet
  - arvet fundament tæller, fravalgt fundament tæller ikke
  - alle fem statusser og nedtonet, inkl. Mangler vurdering vs. Ustabil
  - N fra regelpakken (DK og Regionsrækken) uden fast 6
  - relevansregel: stærkt hold skjuler lette spring, blandet hold bevarer trappen, ens D skjuler ikke, ukendt D, ingen påvirkning på tværs af linjer
  - niveau, ingen Klar og fokusprioritet

## 2. Holdprofil-siden

- [x] 2.1 Tilføj fanen Holdprofil (rute `profil`) i holdets navigation i `apps/web/src/main.tsx` med ikon. Dybt hash-link og holdskift skal virke.
- [x] 2.2 Opret `apps/web/src/team-profile.tsx` med disciplinvalg (Bane/Trampet), niveaulinje, Fokus og linjekolonner med rækker. Resultatet memoiseres pr. arbejdsrum og disciplin.
- [x] 2.3 Byg prikbåndet:
  - N pladser, N-linje og op til to marginpladser med `+k`
  - sikre, lave, Ikke vurderet og tomme pladser adskilt af form
  - status som tekst
  - tilgængelig tekst pr. række
- [x] 2.4 Lav udfoldningen "+k lettere" og gruppen Uden kendt D pr. linje.
- [x] 2.5 Lav detaljepanelet: inspektør på brede skærme og bundark på smalle. Det viser navn, retning, D, statussætning og gymnaster grupperet som Sikre, Lave, Ikke vurderet og Kan ikke endnu. Escape og Luk lukker panelet med fokus tilbage til rækken.
- [x] 2.6 Lav fremhævning af en gymnast på tværs af synlige rækker med synlig betegnelse og ophævelse via Escape, nyt valg eller Luk.
- [x] 2.7 Fokuspunkter ruller til rækken eller linjen, åbner detaljerne og giver en kort accentpuls.
- [x] 2.8 Lav tomme tilstande for ingen aktive gymnaster, ingen registrerede spring i disciplinen og ingen Klar, med en vej til Gymnaster. Siden skal fungere i læsetilstand.

## 3. Visuelt udtryk og bevægelse

- [x] 3.1 Style i `apps/web/src/team-profile.css` efter designet:
  - ingen kort, hårfine skillelinjer, tabulære cifre
  - én accent for N-linjen og sikre prikker, rav for lave og advarende status
  - fordelingsstreg i linjeoverskriften
- [x] 3.2 Brede skærme: kolonner side om side, der ombrydes ved overskud. 390 px: linjer under hinanden med klæbende linjefaner, der hopper til linjen. Intet ruller vandret, og touchmål er mindst 44 × 44.
- [x] 3.3 Tilføj bevægelse:
  - N-linjen tegnes og prikkerne fyldes ind ved åbning og disciplinskift
  - udfoldning på stedet
  - inspektør og bundark glider ind
  - accentpuls ved fokus

  Alt slås fra ved `prefers-reduced-motion`.
- [x] 3.4 Vandstand øverst: søjler pr. synlig række grupperet pr. linje, vandlag til N, Tæt på-felt, Niveau-mærke, tekstopsummering, dæmpning under fremhævning og animation, der slås fra ved reduceret bevægelse.

## 4. Browserprøver og kontrol

- [x] 4.1 Opret `tests/e2e/team-profile.spec.ts` med syntetiske data:
  - navigation og dybt link
  - statustekster
  - udfoldning af "+k lettere"
  - detaljer med navne og Escape med fokus tilbage
  - fremhævning
  - fokuspunkt, der åbner rækken
  - tom trampettilstand
  - 390 px uden vandret overflow
  - uændret gemmetilstand efter interaktion
- [x] 4.2 Udvid `tests/e2e/accessibility.spec.ts` med Holdprofil.
- [x] 4.3 Bekræft, at schema, `merge-policy.ts` og domænekommandoer er uændrede, og at `npm run verify:merge-policy` er grøn. Begrundelsen for ren visning står i design.md.
- [x] 4.4 Lav visuel kontrol af Holdprofil ved 390 og 1440 px med et blandet og et stærkt syntetisk hold.
- [x] 4.5 Kør `npm run verify:full` før lokal brugertest. Alt skal være grønt.
