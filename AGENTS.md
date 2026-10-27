# TeamGym Team Manager

Dansk er arbejds- og produktsprog. Målrepo: `miklen/teamgym-team-manager`.

## Permanent acceptkrav: fælles konflikthåndtering

Alle fremtidige funktioner skal dokumentere deres betydning for fælles data, sammenligning, identiteter, rækkefølge, afhængigheder, afledte værdier og præsentation. Nye gemte felter og ændret betydning kræver eksplicit politik i den fælles flettekontrakt og relevante samtidighedstests, før funktionen markeres færdig. En ren visningsfunktion begrunder i planlægning/verificering, hvorfor fælles data og fletning ikke påvirkes. Formularer må ikke indføre egne fletteregler. Dækningskontrollen er en del af `npm.cmd run check`; strukturel dækning erstatter ikke adfærdstests. Se [vedligeholdelse af fletning](docs/vedligeholdelse-fletning.md).

## Fast arbejdsgang: lokal brugertest før push

Brugerbeslutning 25. oktober 2026: Ændringer skal fremover afprøves lokalt af brugeren før push til GitHub. Dette erstatter tidligere generel tilladelse til at pushe og publicere automatisk.

1. Implementér ændringen, og kør relevante automatiske kontroller.
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

Brug `npm ci`, `npm run check`, `npm run test:domain`, `npm run test:drive`, `npm run build` og `npm run test:e2e`. Installér testbrowseren med `npx playwright install chromium`.

## Data og regler

Brug kun syntetiske persondata i kode, tests og billeder. Eksisterende fælles trænerdokumenter er skrivebeskyttede. Tokens må ikke optræde i Git, URL, logs, build eller arbejdsrumsfil. Kun den specificerede forbindelseslagring må senere huske adgang.

Kildernes bytes og uafklarede regler skal bevares. Numeriske forventninger må ikke genereres fra produktionsreglerne. Efter [brugerens testbeslutning](docs/testbeslutning-2026-10-25.md) fortsætter implementering og første publicering med én konto; brugeren udfører live test med trænerteamet efter publicering. T01 og to-konto-test må ikke kaldes bestået uden faktisk evidens. Ingen ubetinget upload eller serverfallback.

Læs projektets [frontend-skill](.agents/skills/frontend-skill/SKILL.md) ved UI-arbejde. Hold opgavestatus sandfærdig; markér kun fuldt implementerede og verificerede opgaver færdige.
