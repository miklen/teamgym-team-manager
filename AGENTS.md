# TeamGym Team Manager

Dansk er arbejds- og produktsprog. Målrepo: `miklen/teamgym-team-manager`.

## Permanent acceptkrav: fælles konflikthåndtering

Alle fremtidige funktioner skal dokumentere deres betydning for fælles data, sammenligning, identiteter, rækkefølge, afhængigheder, afledte værdier og præsentation. Nye gemte felter og ændret betydning kræver eksplicit politik i den fælles flettekontrakt og relevante samtidighedstests, før funktionen markeres færdig. En ren visningsfunktion begrunder i planlægning/verificering, hvorfor fælles data og fletning ikke påvirkes. Formularer må ikke indføre egne fletteregler. Dækningskontrollen er en del af `npm.cmd run check`; strukturel dækning erstatter ikke adfærdstests. Se [vedligeholdelse af fletning](docs/vedligeholdelse-fletning.md).

## Fast arbejdsgang: lokal brugertest før push

Brugerbeslutning 25. oktober 2026: Ændringer skal fremover afprøves lokalt af brugeren før push til GitHub. Dette erstatter tidligere generel tilladelse til at pushe og publicere automatisk.

1. Implementér ændringen, og kør kontrollerne efter [kontrolniveauerne](#kontrolniveauer) nedenfor.
2. Start `npm.cmd run preview:local` på `http://127.0.0.1:5173/teamgym-team-manager/`, og kontrollér at den lokale app åbner. Brug det separate `dist-local/`; port 4173 og `dist/` er til de automatiske browserprøver.
3. Giv brugeren adressen og en kort beskrivelse af, hvad der skal afprøves. Lad den lokale testserver køre. Vent med yderligere ændringer og genbygning, mens brugeren tester denne udgave.
4. Afvent brugerens lokale test og et udtrykkeligt klarsignal til commit/push/publicering. En afsluttet implementering eller grønne automatiske tests er ikke i sig selv tilladelse til at pushe. Også dokumentationsændringer venter på klarsignal.
5. Ved nye rettelser forberedes en ny lokal testudgave, som brugeren igen afprøver før push. Bed brugeren gemme eller eksportere en eventuel kladde før genindlæsning.

Se [lokal test](docs/lokal-test.md). Ingen eksisterende fælles trænerfiler må bruges til skriveprøver; lokalvisningen har stadig adgang til rigtig Google Drive.

## Struktur og kontrol

- `apps/web`: statisk React-app. Produktionsbase er `/teamgym-team-manager/`, navigation bruger hash.
- `packages/domain` og `packages/rules`: fælles browserkompatibel TypeScript uden Google, UI eller Node-afhængigheder.
- `packages/drive`: direkte browseradapter med injicerbart netværk. Ingen runtime-backend.
- `tools/t01`: særskilt teknisk Drive-test; ingen rigtige gymnastdata.
- `openspec/changes/archive/2026-10-25-build-teamgym-team-manager`: krav, design, opgaver og fastlåst kildegrundlag.

Kør kun `npm ci` ved ændrede afhængigheder eller manglende pakker. Installér testbrowseren med `npx playwright install chromium`.

### Kontrolniveauer

Brugerbeslutning 1. november 2026: Kontrollen skal sikre det essentielle og fange regression uden at gøre små ændringer langsomme.

- **Under udvikling:** `npm run verify` (~30 sek.: typer, lint, flettedækning, regeldækning, domæne- og Drive-tests) plus kun de berørte browserprøver, fx `npx playwright test tests/e2e/<fil>.spec.ts`. Byg først med `npm run build`, når appkoden er ændret.
- **Én gang før lokal brugertest:** `npm run verify:full` (~3 min: verify, regelmutationer, build og alle browserprøver). Alt skal være grønt.
- **Regelmutationer** (`npm run test:mutations`) køres kun lokalt ved ændringer i `packages/rules`; ellers er det nok, at de indgår i `verify:full`/CI.
- **Røde eller ustabile prøver** rettes straks eller rapporteres til brugeren. Brug ikke tid på at sammenligne med HEAD eller genkøre i håb om grønt. En ustabil prøve er en fejl, der skal rettes.
- **Visuel kontrol** (skærmbilleder, visuel gennemgang, axe-rapport) kun ved større UI-ændringer og højst ved 390 og 1440 px. Automatiske browserprøver dækker resten. Ingen PNG-logning i docs.
- **Ingen statuslogning:** Skriv ikke testantal, kørselsresultater eller kontroldatoer i docs, `tasks.md` eller `lokal-test.md`. Rapportér resultatet kort til brugeren i stedet.
- CI kører fortsat alle kontroller ved push.

## Data og regler

Brug kun syntetiske persondata i kode, tests og billeder. Eksisterende fælles trænerdokumenter er skrivebeskyttede. Tokens må ikke optræde i Git, URL, logs, build eller arbejdsrumsfil. Kun den specificerede forbindelseslagring må senere huske adgang.

Kildernes bytes og uafklarede regler skal bevares. Numeriske forventninger må ikke genereres fra produktionsreglerne. Efter [brugerens testbeslutning](docs/testbeslutning-2026-10-25.md) fortsætter implementering og første publicering med én konto; brugeren udfører live test med trænerteamet efter publicering. T01 og to-konto-test må ikke kaldes bestået uden faktisk evidens. Ingen ubetinget upload eller serverfallback.

Læs projektets [frontend-skill](.agents/skills/frontend-skill/SKILL.md) ved UI-arbejde. Hold opgavestatus sandfærdig; markér kun fuldt implementerede og verificerede opgaver færdige.

### Vedligeholdelse af AI-inddata-skill

Den offentlige `apps/web/public/teamgym-data-entry/SKILL.md` og dens `references/` beskriver den aktuelle format-7-kontrakt. Ved ændringer i skema, identitet, registrering, arv, katalogopslag eller omgangsgrænser skal du gennemgå prosa, syntetiske eksempler og relevante adfærdsprøver. Generér derefter struktur og katalog med `node scripts/generate-ai-references.mjs --write`; opdatér først `source-review-v7.json` med `node scripts/verify-ai-skill.mjs --write-review`, når den semantiske gennemgang er udført. Den læsevenlige HTML-visning genereres fra de samme Markdown-filer med `node scripts/generate-ai-skill-pages.mjs --write`. `npm run check` sammenligner genererede opslag, HTML-visningen og kildefingerprint. Et nyt hash alene beviser ikke, at vejledningen er korrekt.

## Scenarier og omgange i arbejdsrums-JSON

Ved direkte redigering af scenarier og omgange i en arbejdsrums-JSON er tommelfingerreglen at starte hver omgang med en stabil gymnast og slutte med de mest stabile og flottest udførende. Bevar så vidt muligt gymnasternes indbyrdes rækkefølge på tværs af omgangene, når stabilitet, valgte spring og reglementets rækkefølgekrav tillader det. Færre skift gør rækkefølgen lettere for gymnasterne at huske. Vurdering af, hvem der springer flottest, kræver trænerens observation og kan ikke udledes af stabilitetstallet alene.

# UI
Alt implementering af UI skal bruge frontend-skill'en her i projektet. Useende skal være elegant, smukt og intuitivt. Det skal være en moderne app med innoverende og moderne UI og UX løsninger. Brugerne skal blive chokeret over hvor flot og elegant det grafiske udtryk i app'en er.
