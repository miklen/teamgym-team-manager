## Context

DK-pakken (`packages/rules/src/dk-*.ts`) består af data og en beregningsmotor. Motoren har DK-satser og DK-regler indbygget:
- én fælles `bonusRate` på 0,1
- altid rækkefølge- og flowfradrag samt dobbelttillæg
- trippelrotation som eneste forbudte rotation
- `trampetTwistQualifies` kender kun junior og senior
- `profile.extra = 2` med rækkefølgekrav

UI-tekster nævner »højst N ekstra først« og rækkefølge. Rytme er i DK kun katalog og fællesmomenter (`rhythm.ts`), uden D/C-beregning.

REG-reglerne står i samme H v1.4 som DK, i egne REG-kolonner og REG-afsnit, samt i A1.2. Under planlægningen blev hver REG-sats verificeret direkte i PDF'en, og A1.2 blev kontrolleret celle for celle via ordkoordinater og renderede sider. Kontrollen fandt 10 forkerte værdier i den eksisterende transskription `docs/reglement/05-rytme-reg.md`. Tekstudtræk og transskriptioner kan altså ikke bruges som kilde uden cellekontrol.

Brugerens krav er høj tillid. Derfor er verifikationsstrategien en førsteklasses del af designet.

Fletning er ikke berørt strukturelt: `rulesetId`, `packageVersion`, `ageGroup` og `momentId` er eksisterende felter med eksisterende politik. REG tilføjer kun nye værdier.

## Goals / Non-Goals

**Goals:**
- Produktionspakke `reg@1.0.0` til spring (bane og trampet) og rytmekatalog med fællesmomenter.
- Motoren parametriseres via pakkens serieregler, så DK og REG deler kode uden REG-grene i UI.
- Verifikation i flere uafhængige lag: håndregnede facitcases, cellekontrol, mutationer og DK-regression.
- Afklaringsarv og kendt tvivl er eksplicit sporbar.

**Non-Goals:**
- Beregning af REG-rytmens D/C (paritet med DK, efter brugerens valg). Rammerne dokumenteres som kildegrundlag.
- Liga eller seniorprofil i REG.
- Nye gemte felter eller ændret flettepolitik.
- Afklaring af Q05 eller andre åbne punkter.

## Decisions

### 1. Parametrisér motoren gennem `springRules` i pakken
Pakken får en typed regelprofil pr. redskab (`SpringRuleSet`):

| Parameter | Bane | Trampet |
|---|---|---|
| `baseC` | ✓ | ✓ |
| `deductionRates` (holdomgang, gentagelse, retning/redskab, rækkefølge?, flow?) | ✓ | ✓ |
| `orderDeduction: boolean` | ✓ | ✓ |
| `flowDeduction: boolean` | ✓ | ✓ |
| `twistBonus: { rate, minDegreesByAgeGroup }` | ✓ | ✓ |
| `elementBonusRate` | ✓ | – |
| `doubleBonuses` (null for REG) | ✓ | ✓ |
| `maxRotations` (DK 2, REG 1) | ✓ | ✓ |
| `apparatusWhitelist` | – | ✓ |

Deltagerreglerne beskrives med `participants: { counting: 6, maxExtra, extraOrderApplies }`.

DK-pakkerne udfylder parametrene med nuværende værdier, så resultaterne er bit-identiske. Det låses af den eksisterende test-suite, som skal være grøn efter parametrisering og *før* REG-data tilføjes.

*Alternativ:* en separat `reg-engine.ts` som kopi. Det er fravalgt, fordi to kopier divergerer og fejlrettelser skal dobbeltføres. Fælles motor plus parametre gør forskellene til data, der kan kontrolleres mod kilden.

### 2. Forbudte rotationer følger DK's trippelbehandling
`maxRotations` generaliserer `DK-TRIPLE-FORBIDDEN`. Elementer over grænsen får D 0, et forklarende fund (`REG-MULTI-ROTATION-FORBIDDEN`) og bevares til rettelse. For Pegasus bruges en hvidliste (mølleoverslag, overslag), som giver samme fund for andre redskabsspring.

### 3. Data på en stabil sti
REG-data ligger i `packages/rules/data/reg/`:
- `spring-values.csv` med REG-kolonnen fra H 9.3.5/10.3.5 og A3/A4-anvendelighed
- `rhythm-catalog.csv` med samme kolonner som DK's plus `source_page`, `column_header` og `dk_moment_id`
- `rhythm-mapping.csv` med `reg_id`, `dk_id`, `equivalence_evidence` og `differences`
- `sources.json` med SHA-256

Den ligger ikke under en arkiveret change, så stien er stabil, og mutationsscriptet kopierer den automatisk med `packages/rules`.

### 4. Rytmekortlægning med bevisførelse
Genbrug af DK-id kræver en udfyldt `equivalence_evidence` (A1.1-side + A1.2-side + sammenlignede krav). Ellers tildeles et nyt id `rh-reg-…`. En test kræver, at hver række med `dk_id` har evidens, og at koblingen findes i DK-kataloget. `bindRhythmSkill` er uændret: ukendte id'er under holdets pakke vises som ukendte.

### 5. Verifikationslag
1. **Kildekontrolposter**: én post pr. numerisk regel med kildeplacering, formel, tælleenhed og facitcase. Dækningskontrollen i `npm run check` udvides til REG-pakken.
2. **Håndregnede facitcases**: tallene skrives direkte fra kilden i testfiler. Det omfatter scenarierne i spec'en (C 2,20 bane, C 2,20 trampet, 0,60 redskabsfradrag, U11/U14-skrue, Q03 0,20, D 0,80) og mindst én case pr. kontrolpost.
3. **A1.2-cellekontrol**: et udviklerscript (`tools/verify-a12/`, Python + PyMuPDF, ikke en del af appen) udtrækker kode, x-position og kolonneoverskrift pr. side og sammenligner med `rhythm-catalog.csv`. Output gemmes som evidens. Desuden gennemgås renderede PNG-sider visuelt, og der føres en signeret tjekliste. Ved uenighed mellem script og billede vinder billedet, og afvigelsen registreres.
4. **Mutationer**: `scripts/check-rule-mutations.mjs` udvides med REG-mutationer, der hver skal fanges af en bestemt evidens-id:
   - skruesats 0,2 → 0,1
   - rækkefølgefradrag slået til
   - U11-skruegrænse 180 → 360
   - Pegasus-hvidliste udvidet
   - F402 0,3 → 0,1
   - ekstragrænse 6 → 2
5. **DK-regression**: den eksisterende DK-suite plus en ny sammenligning af DK-resultater før og efter parametrisering på alle DK-fixtures.

### 6. UI-generalisering
Følgende steder læser deltagertekster og rækkefølgevisning fra pakken:
- `composition-guide.tsx`
- `scenario-bar.tsx`
- `spring.tsx`
- `dk-guide.ts`, som omdøbes eller generaliseres til en pakkeguide

Manglende bonusser (dobbelttillæg) skjules, når pakken ikke har dem. Ingen REG-specifikke grene; alt styres af pakkeparametre. Der laves ingen ny skærm; arbejdet følger frontend-skill for de berørte komponenter.

### 7. Tvivlsmarkering og kendt tvivl
REG-pakken har egen kendt tvivl:
- H-U08 (rytme-C max 1,2 mod 1,3)
- A1REG-U01–U05
- H-U11
- A6-U02
- `REG-EXTRA-LIMIT-DERIVED`
- arvede DK-punkter (H-U06, A3-U01, Q-SPOT-DUP, C-RETNING-VALG, Q05), hvor de er relevante

Pakken markeres som produktion med tvivlsmarkering, som DK.

### 8. Fletning
Ingen nye gemte felter. `docs/vedligeholdelse-fletning.md` får en note om, at nye værdier af `rulesetId`, `ageGroup` og `momentId` fra REG er dækket af eksisterende identitets- og værdipolitik. Den eksisterende samtidighedstest udvides med ét REG-holdskift, så strukturel dækning følges af adfærdstest.

## Risks / Trade-offs

- [Parametrisering ændrer DK utilsigtet] → Parametrisering laves i et separat trin med fuld DK-suite og før/efter-sammenligning, før REG-data tilføjes.
- [Transskriptionsfejl i A1.2 eller H-kolonner] → Celle- og koordinatkontrol plus visuel kontrol; transskriptionen i docs rettes og markeres som afledt af kontrolleret data.
- [Afledt ekstragrænse (6) er ikke den rigtige fortolkning] → Den registreres som kendt tvivl, vises som afledt og ligger i én parameter.
- [Rytmekortlægning genbruger id for et moment med subtilt forskellige krav] → Kræver evidens pr. række. Ved tvivl tildeles et nyt id, fordi en falsk fællesmarkering er værre end en manglende.
- [Facitcases skrevet af samme person som koden] → Forventede tal skrives fra kilden før implementering. Brugeren og trænerteamet bør gennemgå facitlisten ved lokal test.
- [Brugere skifter DK-hold til REG og mister gyldighed] → Versionsskiftets eksisterende forhåndsvisning viser ugyldigheder før gem.

## Migration Plan

Der er ingen datamigrering. REG er en ny pakke, som hold vælger aktivt. Rollback: pakken afregistreres i `apps/web/src/rules.ts`; hold bundet til `reg` vises da som ukendt pakke efter eksisterende adfærd. Før push testes ændringen lokalt af brugeren med `preview:local`.

## Open Questions

- Q05 og de øvrige åbne DK-punkter forbliver åbne. Hvis trænerteamet afklarer dem senere, kræver det en ny pakkeversion.
- Skal REG-rytmens D/C beregnes senere? Det er uden for denne change.
