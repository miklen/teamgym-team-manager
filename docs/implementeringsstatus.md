# Implementeringskontrol · 25. oktober 2026

Change: `build-teamgym-team-manager`, schema `spec-driven`. **5/122 opgaver fuldført:** 1.1–1.4 og 2.1. Dette er projektgrundlag; det samlede produkt er ikke implementeret eller frigivet.

## Leveret

- Målrepo kontrolleret som tomt med både GitHub-forbindelsen og `git ls-remote`. Grundcommit bevarer OpenSpec, frontend-skill og otte PDF-kilder. Implementering ligger på `feat/build-teamgym-team-manager` med `main` som planlægningsgrundlag.
- Låst npm-workspace med React/TypeScript/Vite, browseradapterens modulgrænse og fælles domæne-/regelkontrakter. Modulerne er grundlag, ikke en færdig filmodel eller regelmotor.
- Separate domæne-, Drive- og browserkommandoer samt typekontrol/lint i CI. Offentlig miljøskabelon uden credentials og dansk startvejledning.
- Build kontrollerer de otte kildefilers størrelse og SHA-256. Ingen hentning eller parent-afhængighed. En bevidst byteændring i en kopi af A3 blev afvist som forventet, og kopien blev gendannet.
- Pages-workflow og lokal kontrol af repo-base, assets, hash-link og genindlæsning. Faktisk Pages-konfiguration/deployment er udestående, så 1.5 er ikke markeret færdig.
- Særskilt T01-værktøj med GIS/Picker-kandidat, syntetisk filoprettelse, konsistent læsning, fastholdt etag-basis, betinget media-upload, samtidighedstidspunkt, eksport og redigeret log. **Ingen reel Google-test er kørt**, og værktøjet er ikke produktionsadapteren.

## Faktisk lokal kontrol

Alle nedenstående kommandoer er kørt i et nyt Git-checkout under `tmp/clean-checkout`, uden `.env`, installerede pakker eller referencer til parent-mappens reglementer. Testbrowseren er installeret separat som udviklingsværktøj.

| Kommando | Resultat |
| --- | --- |
| `npm ci` | Bestået, låst installation |
| `npm run check` | Typekontrol og lint bestået |
| `npm run test:domain` | 10 tests bestået: kildeintegritet og modulgrænser |
| `npm run test:drive` | 12 tests bestået: injiceret netværk, ingen reel Google |
| `npm run build` | Bestået; otte PDF-hashes matcher; kun statiske filer |
| `npm run test:e2e` | 6 Chromium-tests bestået mod produktionsbyg |
| Muteret kilde i testkopi | Afvist som forventet uden automatisk hentning |

Browserchecks dækker den indledende appskal ved 1440×900, 1024×768, 768×1024 og 390×844, ingen side-overflow, et fokuserbart navigationslink, bevaret hash ved genindlæsning og ingen utilsigtede Google-kald. Det er ikke samlet visuel/tilgængelighedsgodkendelse af det kommende produkt. Der er endnu ingen implementerede sportslige beregninger eller beståede facitcases for dem.

På Windows krævede Playwright kørsel uden værktøjssandbox for korrekt afslutning af previewserveren. Den fulde kørsel afsluttede derefter med exitkode 0. CI bruger Linux.

[GitHub Actions-kørsel 40193242920](https://github.com/miklen/teamgym-team-manager/actions/runs/40193242920) bestod alle trin for commit `53e12a4`: låst installation, typekontrol/lint, begge Vitest-suiter, produktionsbyg og Chromium-browserchecks. Pages-workflowet er ikke kørt.

Planlægningsgrundlaget og implementeringsbranchen er publiceret til målrepoet uden force-push. [Sammenlign ændringen](https://github.com/miklen/teamgym-team-manager/compare/main...feat/build-teamgym-team-manager). Forsøg på draft-PR blev afvist med `403 Resource not accessible by integration`; browseren havde ingen aktiv GitHub-login. Der er derfor ikke oprettet en PR eller foretaget merge.

## Åbent før næste trin

1. Færdiggør og verificér faktisk Pages-publicering (resten af 1.5).
2. Konfigurér Google Cloud-projektet med de offentlige værdier i `.env.example` og fremskaf en anden autoriseret testkonto. Brugeren har oplyst at have én konto. Mappen alene erstatter ikke OAuth/Picker-konfiguration eller anden konto.
3. Kør T01/DRIVE01–DRIVE05 fra rigtig Pages-origin efter [Google-/T01-vejledningen](google-t01.md). To sessioner på samme konto opfylder ikke det nuværende krav om to konti.
4. Fortsæt de øvrige domæne-, regel- og UI-opgaver. En særskilt brugerbeslutning kan lade dette arbejde fortsætte, mens den eksterne T01-verifikation står åben; det ændrer ikke frigivelseskravet.

Ingen filer i brugerens Google-mappe er ændret. Ingen private gymnastdata, Google-tokens eller lokale credentials er medtaget.
