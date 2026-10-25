# Implementeringskontrol · 25. oktober 2026

Change: `build-teamgym-team-manager`, schema `spec-driven`. **16/122 opgaver fuldført:** 1.1–1.4, 2.1–2.4, 3.1–3.7 og 6.1. Det samlede produkt er ikke implementeret eller frigivet.

## Seneste implementering

Arbejdsrumsformat 1, strenge skemaer, serialisering, medlems-/arkiveringskommandoer, seks omgange, vurderinger og stabilitetsaggregater er implementeret. Se [filformatet](filformat.md) og det validerede [syntetiske eksempel](../examples/arbejdsrum-v1.json). Eksakte rationelle point og panelnedrunding er tilføjet; de sportslige beregningsmoduler er endnu ikke færdige.

Alle 103 springkildeposter og 94 individuelle rytmeposter er indlæst med status, værdier, identiteter og krav. A3/A4 og A1.1 side 1–13 er genlæst visuelt under implementeringen; Gumbi-start og fælles håndhjælp er suppleret med den fastlåste Q&A side 3. Denne kontrol er udført af implementeringsagenten og er ikke ekstern dommergodkendelse. Teknisk Regulativs DK-profiler henviser korrekt til 1.3 på PDF-side 4.

`npm run check` og `npm run test:domain` består nu med 59 tests. De dækker domæneinvarianter, de to stabilitetseksempler, alle kildeposter, nominelle profiler og eksakt panelnedrunding. De 77 sportslige facitcases er endnu ikke omsat til en bestået samlet suite. Den oprindelige CI-kørsel nedenfor gælder projektgrundlaget før disse seneste tilføjelser.

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

## Opdateret Google-/testbeslutning

Brugeren har efter denne grundkontrol leveret offentlig Google-konfiguration og bekræftet fungerende login med én konto. Konfigurationen ligger i Git-ignoreret `.env.local`; client secret er ikke kopieret til app eller build. Efter [brugerbeslutningen](testbeslutning-2026-10-25.md) fortsætter implementering og første publicering nu, og brugeren udfører live test med trænerteamet i produktion. Det er ikke et bestået T01-/to-konto-testresultat.

## Åbent i det videre arbejde

1. Færdiggør og verificér faktisk Pages-publicering (resten af 1.5).
2. Kontrollér Google API-adgang, nøglebegrænsninger og offentlig konfiguration ved Pages-publicering. Lokal login er bekræftet; øvrige Google-forløb skal stadig afprøves.
3. Kør de tilgængelige T01/DRIVE01–DRIVE05-tests fra rigtig Pages-origin efter [Google-/T01-vejledningen](google-t01.md). Brugeren udfører den udskudte test med trænerteamets separate konti efter første publicering.
4. Fortsæt de øvrige domæne-, regel- og UI-opgaver efter brugerens udtrykkelige beslutning. Bevar den udskudte eksterne verifikation som udestående.

Ingen filer i brugerens Google-mappe er ændret. Ingen private gymnastdata, Google-tokens eller lokale credentials er medtaget.
