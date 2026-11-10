## 1. Afledning af holdets spring og gentagelse

- [x] 1.1 Tilføj `teamSkillRows` i `apps/web/src/spring-picker-model.ts`. Den grupperer anvendelige registreringer efter regelidentitet med samme filter som gymnastens liste, giver ledige gymnaster med deres bedste registrering (højest effektiv sikkerhed), antal placerede og springets D, og sorterer efter ledige, D og navn.
- [x] 1.2 Tilføj `roundIdentityUsage` i samme fil. Den tæller tællende pladser pr. identitet og omgang i scenariet, inklusive ambitioner via `plannedSkillId`, og udelader den redigerede plads, ekstra pladser og reserver.
- [x] 1.3 Udvid `tests/domain/spring-picker-model.test.ts` med:
  - én række pr. identitet på tværs af gymnaster og afledte registreringer
  - udeladelse af spring uden ledige gymnaster
  - optælling af placerede
  - brug pr. omgang med og uden ambitioner
  - udeladelse af ekstra, reserver og den redigerede plads

## 2. Gymnastvalg med Hele holdet

- [x] 2.1 Lav `PlanAthleteSelect` i `plan-skill-select.tsx` i samme listbox- og tastaturmønster som `PlanSkillSelect`. Første række er Hele holdet med antal ledige gymnaster. Når der er valgt en identitet, vises kun gymnaster, der kan springet, med sikkerhedstrin.
- [x] 2.2 Omlæg den lokale tilstand i `AthleteEntryForm`:
  - Hele holdet er standard ved nye pladser, og en eksisterende plads beholder sin gymnast.
  - Ved valg af gymnast overføres den valgte identitet til gymnastens registrering. Ellers nulstilles springvalget.
  - Formularen er låst med »Vælg en gymnast for at gemme pladsen«, mens Hele holdet står valgt.
- [x] 2.3 Send scenariets omgange og det redigerede entry-id til `EntryForm` fra `spring.tsx` og `reserves.tsx`.

## 3. Springlisten

- [x] 3.1 Udvid `PlanSkillSelect` med holdtilstand:
  - kolonnen Holdet med en stak initialer for ledige og placerede gymnaster og teksten »N ledige af M«
  - søgning på alle navne i identitetsgruppen
  - tomtilstand med vej til færdighedsregistrering
  - tilgængeligt rækkenavn
- [x] 3.2 Tilføj gentagelsesmarkering i holdtilstand, gymnasttilstand og triggerfelt:
  - ravfarvet advarsel »Omg. N xK« for tællende pladser
  - neutral »Brugt K× i omgangen« og »· tæller ikke« ved rollen ekstra eller ved reserve
  - kun når regelpakken har `C-GENTAG` for disciplinen
  - opdateres, når rollen skiftes
- [x] 3.3 Style i `spring-plan.css` efter designets rækkeanatomi:
  - tabulære cifre, accentpille og ravmærke med form og tekst
  - layout ved 390 px uden vandret overflow
  - krydsfade, accentskær på gymnastfeltet og respekt for `prefers-reduced-motion`

## 4. Browserprøver og kontrol

- [x] 4.1 Udvid `tests/e2e/plan-skill-select.spec.ts`:
  - Ny plads åbner på Hele holdet med antal.
  - Valg af spring indsnævrer gymnaster.
  - Valg af gymnast beholder springet og gemmer gymnastens registrering.
  - Hele holdet kan ikke gemmes.
  - Advarsel om gentagelse vises og skifter til neutral ved rollen ekstra.
- [x] 4.2 Opdatér eksisterende browserprøver, der forudsætter, at første gymnast er forudvalgt, så de vælger gymnast eksplicit.
- [x] 4.3 Lav visuel kontrol af springvalget i holdtilstand og med gentagelsesmarkering ved 390 og 1440 px.
- [x] 4.4 Kør `npm run verify:full` før lokal brugertest. Alt skal være grønt.
