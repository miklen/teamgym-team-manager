## 1. Model

- [x] 1.1 Udvid `filterSpringChoices` i `apps/web/src/spring-picker-model.ts` til `SpringDiscipline | 'all'`. Ambitionsvælgerens kald er uændret.
- [x] 1.2 Tilføj enhedstest i `tests/domain/spring-picker-model.test.ts`: Alle giver både bane og trampet for en fælles søgning, og et enkelt redskab udelukker det andet.

## 2. Formular og vælger

- [x] 2.1 `skill-editor.tsx`: Feltet Disciplin viser Spring/Rytme for nye registreringer, mens eksisterende registreringer viser den låste disciplin. Tilføj tilstanden `apparatus` med standard Alle og send den til `SpringPicker` uden `key={discipline}`.
- [x] 2.2 `spring-picker.tsx`: Tilføj segmentknappen Alle · Bane · Trampet under søgefeltet. Filtrering, kædens bibliotek og prefill følger filteret. Skift nulstiller kun kæden og aktiv plads.
- [x] 2.3 `spring-chain.tsx`: Ved Alle vises trinnet "Bane eller trampet" med antal pr. redskab. Valget sætter filteret og åbner redskabets første plads.
- [x] 2.4 `spring-choice-rows.tsx`: Redskabsmærket Bane/Trampet vises i metalinjen og det tilgængelige navn, når listen er blandet, og altid i Valgte.
- [x] 2.5 Byg selv: Ved Alle starter byggeren med segmentvalget Bane | Trampet, og elementkataloget vises først efter valget. Fra et valgt redskab eller en kædeprefill er redskabet sat.
- [x] 2.6 Styling med eksisterende tokens: Segmentfilteret og kædens redskabstrin følger kædens visuelle sprog. 390 px uden vandret rulning, og touchmål på mindst 44 px.

## 3. Prøver og dokumentation

- [x] 3.1 Tilpas browserprøver, der vælger `Disciplin` = trampet/tumbling, så de bruger redskabsfilteret.
- [x] 3.2 Browserprøve i `tests/e2e/spring-library.spec.ts`:
  - søgning på tværs med redskabsmærker
  - kædens redskabstrin sætter filteret
  - blandet valg registreres samlet
  - Byg selv fra Alle kræver redskabsvalg
- [x] 3.3 Opdatér `docs/brugsvejledning.md` (Tilføj færdighed og kædebyggeren) og afsnittet om springvælgerens rene visning i `docs/vedligeholdelse-fletning.md` med begrundelsen for, at fælles data og fletning er upåvirket.
- [x] 3.4 Visuel kontrol af vælgeren ved 390 og 1440 px.
- [x] 3.5 Kør `npm run verify:full` før lokal brugertest.
