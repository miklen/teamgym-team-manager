## Why

Trænere med hold i Regionsrækken (REG) kan i dag kun binde holdet til Danmarksseriens pakker. Det giver forkerte satser, tillader dobbeltrotationer, mangler U11 og viser DK's rytmekatalog. Hovedreglementet v1.4 dækker både DK og REG, men REG afviger på mange konkrete punkter. Derfor skal REG være en selvstændig, kildekontrolleret regelpakke, ikke en DK-variant med enkelte justeringer.

Kildegennemgangen til denne plan fandt allerede ti forkerte værdier i projektets egen REG-rytmetranskription (`docs/reglement/05-rytme-reg.md`). Fundene blev bekræftet ved celleplacering og visuel gengivelse af A1.2-PDF'en, blandt andet F402 0,3 (ikke 0,1) og SB804 0,6 (ikke 0,4). Pakken skal derfor bygges og verificeres direkte mod de låste originaler med uafhængige facitcases. Den må ikke bygges ud fra eksisterende transskriptioner eller produktionskode.

## What Changes

- Ny produktionspakke `reg@1.0.0` (»Regionsrækken«), som er synlig for trænere på samme måde som DK 1.1.0. Uafklarede punkter vises som kendt tvivl i pakken og giver ikke skjulte entydige resultater.
- Profiler for U11, U14 og junior, hver som piger, drenge og mix. Senior findes ikke i REG.
- Springsværhed efter H 9.3/10.3 og A3/A4 med REG-kolonnen:
  - Dobbelt- og trippelroterende elementer er ikke tilladt og giver D 0.
  - Overslag-salto og Tsukahara er udelukket på Pegasus.
  - Enkeltrotationer har samme værdier som DK.
- Komposition efter H 9.2/10.2 med REG's satser og regler:
  - 0,1 pr. gymnast for manglende holdomgang.
  - 0,1 pr. gang for gentagelse.
  - 0,1 pr. gymnast for manglende forlæns/baglæns omgang og for manglende omgang med/uden redskab.
  - Intet rækkefølgefradrag, ingen dobbelttillæg og intet flowfradrag.
  - Skruetillæg 0,2 pr. gymnast. På trampet kræver junior og U14 mindst 360°, mens U11 kræver mindst 180°.
  - Elementtillæg 0,1.
- Deltagere: seks tællende pr. omgang og op til seks ekstra gymnaster først. Grænsen på seks er afledt af TR's holdstørrelse og registreres som en afledt antagelse, ikke som en trykt regel.
- DK 1.1.0's trænerafklaringer gælder også for REG, medmindre REG-reglementet fastsætter noget andet:
  - Q01, Q03 og Q04 anvendes med REG's satser.
  - Q02 og Q06 er uden betydning, fordi REG forbyder dobbeltrotationer og ikke har rækkefølgefradrag.
  - Q05 og de øvrige åbne DK-punkter forbliver åbne.
- Eget REG-rytmekatalog fra Appendix A1.2 med 75 individuelle momenter; G er udeladt som i DK. Værdierne følger tabelcellerne, ikke kodecifrene. Kataloget har samme funktion som DK: katalog, registrering og fællesnævnere, men ingen ny rytmekarakter.
- Eksplicit kortlægning af rytmemomenter:
  - Et REG-moment bruger samme stabile moment-id som et DK-moment kun, når udførelseskravene er dokumenteret identiske.
  - Ellers får momentet et nyt REG-id.
  - Et DK-moment uden REG-kobling vises som ukendt under REG.
- REG-rytmens D/C-rammer (H 8.2/8.3) dokumenteres som kildegrundlag og kendt tvivl (H-U08 og A1REG-U01–U05) uden ny beregning.
- Fælles motorlogik, som i dag har DK-konstanter, parametriseres pr. pakke: satser, rotationsgrænse, tillægssæt, skruetærskler, rækkefølgeregel og antal ekstra. DK 1.0.0 og 1.1.0 SHALL give uændrede resultater, sikret med regression.
- Uafhængig faglig kontrol før pakken registreres som produktion:
  - kontrolpost og håndregnet facit pr. numerisk regel
  - celle-for-celle-kontrol af A1.2
  - dækningsrapport
  - REG-specifikke regelmutationer
- Projektets REG-dokumentation rettes: den fejlagtige A1.2-transskription og afklaringslisten.

## Capabilities

### New Capabilities
- `regionsraekken-ruleset`: REG-pakkens profiler, sværhed, komposition, deltagerregler, afklaringsarv, rytmekatalog og kortlægning, kendt tvivl og krav til kilde- og facitverifikation.

### Modified Capabilities
- `ruleset-versioning`: Krav om udvidelse, så REG er en installeret produktionspakke og ikke kun en fremtidig kontrakttest.
- `team-roster`: Profilvalg omfatter REG U11/U14/junior, og et REG-hold og et DK-hold kan sameksistere.
- `routine-planning`: Grænser for tællende og ekstra gymnaster og rækkefølgekrav for ekstra kommer fra holdets pakke (DK: 2 ekstra med rækkefølge; REG: 6 ekstra uden rækkefølgefradrag).
- `skill-catalog`: Rytmekataloget kommer fra holdets pakke (DK A1.1 med 94 momenter, REG A1.2 med 75 momenter), med eksplicit identitetskortlægning på tværs af pakker.

## Impact

- **Kode:**
  - `packages/rules/src`: ny REG-pakkefabrik og -data samt parametrisering af `dk-numeric.ts`, `dk-engine.ts`, `dk-spring.ts`, `dk-v1.ts` (tillæg), `dk-guide.ts` og `catalog.ts`.
  - `apps/web/src/rules.ts`: registrering af pakken.
  - `apps/web/src`: tekster, der i dag skriver »højst N ekstra først« generisk, og visning af REG's manglende rækkefølgeregel.
  - Ingen ændring i `packages/domain`-skemaer.
- **Data:** Ny kildeopsætning og nye REG-referencedata (A1.2-katalog og kortlægning, sporingsmatrix) på en stabil placering, som ikke flyttes ved arkivering. A1.2 tilføjes til den låste kildeoversigt med SHA-256.
- **Fælles data og fletning:**
  - Ingen nye gemte felter.
  - Eksisterende felter får nye værdier: `rulesetBinding.rulesetId = 'reg'`, `ageGroup = 'U11'` og nye REG-moment-id'er i `skill.momentId`.
  - Planlægningen skal bekræfte flettekontraktens eksisterende politik for felterne, have samtidighedstests og dokumentere udfaldet i `docs/vedligeholdelse-fletning.md`.
  - Versionsskift DK↔REG bruger den eksisterende konsekvensvisning.
- **Tests:**
  - nye håndregnede REG-facitcases og A1.2-cellefacit
  - DK-regression
  - udvidet `scripts/check-rule-mutations.mjs`
  - registry- og kontrakttests
  - e2e for at oprette et REG-hold
- **Arbejdsgang:** Brugeren tester lokalt før push. Der bruges kun syntetiske persondata.
