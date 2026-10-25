# TeamGym Team Manager

Dansk er arbejds- og produktsprog. Målrepo: `miklen/teamgym-team-manager`.

## Struktur og kontrol

- `apps/web`: statisk React-app. Produktionsbase er `/teamgym-team-manager/`, navigation bruger hash.
- `packages/domain` og `packages/rules`: fælles browserkompatibel TypeScript uden Google, UI eller Node-afhængigheder.
- `packages/drive`: direkte browseradapter med injicerbart netværk. Ingen runtime-backend.
- `tools/t01`: særskilt teknisk Drive-test; ingen rigtige gymnastdata.
- `openspec/changes/build-teamgym-team-manager`: krav, design, opgaver og fastlåst kildegrundlag.

Brug `npm ci`, `npm run check`, `npm run test:domain`, `npm run test:drive`, `npm run build` og `npm run test:e2e`. Installér testbrowseren med `npx playwright install chromium`.

## Data og regler

Brug kun syntetiske persondata i kode, tests og billeder. Eksisterende fælles trænerdokumenter er skrivebeskyttede. Tokens må ikke optræde i Git, URL, logs, build eller arbejdsrumsfil. Kun den specificerede forbindelseslagring må senere huske adgang.

Kildernes bytes og uafklarede regler skal bevares. Numeriske forventninger må ikke genereres fra produktionsreglerne. Efter [brugerens testbeslutning](docs/testbeslutning-2026-10-25.md) fortsætter implementering og første publicering med én konto; brugeren udfører live test med trænerteamet efter publicering. T01 og to-konto-test må ikke kaldes bestået uden faktisk evidens. Ingen ubetinget upload eller serverfallback.

Læs projektets [frontend-skill](.agents/skills/frontend-skill/SKILL.md) ved UI-arbejde. Hold opgavestatus sandfærdig; markér kun fuldt implementerede og verificerede opgaver færdige.
