## 1. Kildelåsning og facitliste først

- [x] 1.1 Beregn og registrér SHA-256 for:
  - H v1.4
  - A3, A4, A5 og A6
  - TR 2026/27
  - A1.2

  Gem dem i `packages/rules/data/reg/sources.json` med udgave og sti, og tilføj en kildekontrol, der fejler ved ændret fil.
- [x] 1.2 Opret kontrolposter for hver numerisk REG-springregel (H 9.1f, 9.2.1–9.2.4, 9.3.1–9.3.5, 10.1e, 10.2.1–10.2.4, 10.3.1–10.3.5; A6 1.7). Hver post skal have:
  - kildeplacering
  - profil
  - formel
  - tælleenhed
  - undtagelser
- [x] 1.3 Skriv de håndregnede REG-facitcases fra spec'en direkte fra kilden i testfiler, før motoren ændres. De forventes at fejle indtil videre (bane C 2,20 / DK 1,60, D 0,80, D 0,20, trampet C 2,20, 0,60, U11 0,80 / U14 0, Q01, Q03 0,20, holdomgang 0,10, A6 1,0).

## 2. Parametrisering uden DK-ændring

- [x] 2.1 Gem DK-resultater for alle eksisterende DK 1.0.0/1.1.0-fixtures som før-billede til sammenligning.
- [x] 2.2 Indfør `SpringRuleSet` og `participants` (design beslutning 1) i pakketyperne. Udfyld DK-pakkerne med deres nuværende værdier.
- [x] 2.3 Omlæg `dk-engine.ts` (base C, fradrag, rækkefølge, flow, skrue- og elementtillæg, dobbelttillæg, `participantStructure`) og `dk-numeric.ts` (`trampetTwistQualifies` pr. aldersgruppe) til at læse parametrene.
- [x] 2.4 Generalisér trippelforbuddet til `maxRotations` og indfør hvidlisten for Pegasus, hvor DK ikke ændres.
- [x] 2.5 Kør `npm run check`, `npm run test:domain` og `npm run test:mutations`. Bekræft, at DK-før/efter-sammenligningen er identisk.

## 3. REG-springdata og pakke

- [x] 3.1 Opret `packages/rules/data/reg/spring-values.csv` fra REG-kolonnerne i H 9.3.5/10.3.5 og A3/A4, med kildeside pr. række. Dobbeltrotationer markeres som ikke tilladt.
- [x] 3.2 Kontrollér hver værdi i 3.1 mod renderet PDF-side, og før en tjekliste med side og række.
- [x] 3.3 Implementér REG-pakkefabrik `reg@1.0.0`:
  - manifest
  - U11, U14 og junior × piger/drenge/mix
  - `springRules` med REG-satser
  - `maxExtra 6` uden rækkefølgekrav
  - `maxRotations 1`
  - Pegasus-hvidliste
  - skruegrænser U11 180°, U14/junior 360°
- [x] 3.4 Registrér arv af Q01, Q03 og Q04 samt N/A for Q02 og Q06, med begrundelse i kontrolposterne. Q05 forbliver åben.
- [x] 3.5 Registrér REG's kendte tvivl:
  - H-U08, H-U11, A6-U02 og `REG-EXTRA-LIMIT-DERIVED`
  - A1REG-U01–U05
  - de relevante arvede DK-punkter

  Hvert punkt skal have kildelink.
- [x] 3.6 Få facitcaserne fra 1.3 grønne uden at ændre forventede tal. Ved afvigelse genlæses kilden; facit ændres kun med kildebegrundelse i commit og kontrolpost.

## 4. REG-rytmekatalog og kortlægning

- [x] 4.1 Opret `tools/verify-a12/`, et udviklerscript, der udtrækker kode, side, x-position og kolonneoverskrift fra A1.2 og skriver en celleliste. Kør det også mod A1.1 og DK's `rhythm-catalog.csv` som regressionskontrol (planlægningskontrollen 2026-10-31 fandt 94/94 korrekte DK-værdier).
- [x] 4.2 Opret `packages/rules/data/reg/rhythm-catalog.csv` med 75 momenter uden G, med værdi fra cellens kolonne og krav fra A1.2.
- [x] 4.3 Lav en automatisk sammenligning mellem cellelisten og CSV'en, og en visuel tjekliste for side for side gennemgang af renderede sider. Alle 79 celler skal kontrolleres, og de 10 kendte transskriptionsfejl skal være rettet.
- [x] 4.4 Opret `rhythm-mapping.csv`. Genbrug et DK-id kun med `equivalence_evidence`; ellers tildeles et nyt `rh-reg-…`-id. Tilføj en test for evidens og gyldige DK-id'er.
- [x] 4.5 Bind kataloget til REG-pakken. Test:
  - 75 momenter for REG
  - 94 for DK
  - samme registrering vises med REG-værdi på REG-hold og DK-værdi på DK-hold
  - ukendt id vises som ukendt
- [x] 4.6 Dokumentér REG-rytmens D/C-rammer som kildegrundlag i pakkens kendte tvivl og docs, uden beregning.

## 5. Mutationer og dækning

- [x] 5.1 Udvid `scripts/check-rule-mutations.mjs` med REG-mutationerne fra design beslutning 5. Hver mutation skal fanges af den tilsigtede evidens-id.
- [x] 5.2 Udvid dækningsrapporten, så hver REG-kildepost peger på en kontrolpost og en test. Dækningskontrollen skal indgå i `npm run check`.

## 6. Brugerflade (frontend-skill)

- [x] 6.1 Læs `.agents/skills/frontend-skill/SKILL.md`, og generalisér deltager- og rækkefølgetekster i:
  - `composition-guide.tsx`
  - `scenario-bar.tsx`
  - `spring.tsx`
  - `dk-guide.ts`
- [x] 6.2 Lad holdoprettelse og profilskift kun vise pakkens aldersgrupper. Regionsrækken skal kunne vælges.
- [x] 6.3 Skjul fradrag og tillæg, som pakken ikke har. Vis ikke-tilladte REG-spring forklaret og bevaret, og vis den afledte ekstragrænse med TR-henvisning.
- [x] 6.4 Tilføj e2e-forløb med syntetiske data:
  - opret et REG-U11-hold
  - planlæg bane og trampet, og se C/D svare til facit
  - skift et DK-hold til REG via forhåndsvisning
  - vis REG-rytmekatalog

## 7. Fletning og dokumentation

- [x] 7.1 Bekræft, at der ikke er nye gemte felter. Tilføj en REG-note i `docs/vedligeholdelse-fletning.md`, og tilføj en samtidighedstest med et REG-holdskift.
- [x] 7.2 Ret `docs/reglement/05-rytme-reg.md` (10 celleværdier), NYT-U02 i `18-aendringsorientering.md` og V17 i `valideringsgrundlag.md`. Udført 2026-10-31 under planlægningen. Ved implementering skal afskriften desuden henvise til den kontrollerede CSV.
- [x] 7.3 Tilføj et REG-afsnit i `docs/reglement/afklaringer.md` om arv og N/A.
- [x] 7.4 Opdatér relevante brugervendte docs om tilgængelige reglementer.

## 8. Samlet kontrol og lokal brugertest

- [ ] 8.1 Kør `npm run check`, `npm run test:domain`, `npm run test:drive`, `npm run test:mutations`, `npm run build` og `npm run test:e2e`. Alt skal være grønt.
  - Status 2026-10-31: check, 523 domæne-, 95 Drive-tests, build og 10/10 mutationer grønne; 166 e2e grønne inkl. fire REG-forløb. 6 e2e i `drive-links` og `scenarios` fejler også på HEAD uden denne ændring (allerede eksisterende) og er derfor ikke markeret løst.
- [x] 8.2 Start `npm.cmd run preview:local` på `http://127.0.0.1:5173/teamgym-team-manager/`, og giv brugeren testinstruktion plus facitlisten til faglig gennemgang.
- [x] 8.3 Afvent brugerens lokale test og udtrykkelige klarsignal før commit, push og publicering.
