# TeamGym Team Manager

Dansk trænerarbejdsplads til hold, færdigheder og springplanlægning. Målrepo: [miklen/teamgym-team-manager](https://github.com/miklen/teamgym-team-manager).

**Status:** Appen er [publiceret på GitHub Pages](https://miklen.github.io/teamgym-team-manager/). Domæne, regler, browserbaseret Drive-adapter, UI-overhaling og brugerrettelser er implementeret. Den samlede [OpenSpec-change er arkiveret](openspec/changes/archive/2026-10-25-build-teamgym-team-manager/proposal.md) efter brugerens godkendelse; alle ti [hovedspecs](openspec/specs/) er synkroniseret. De 13 udestående opgaver om reel Google-/Drive-verifikation er bevaret i [arkivets opgaveliste](openspec/changes/archive/2026-10-25-build-teamgym-team-manager/tasks.md). Flerbrugerverifikation er efter [brugerbeslutningen](docs/testbeslutning-2026-10-25.md) udskudt til live test i produktion. Se [kontrolrapporten](docs/implementeringsstatus.md) og [brugsvejledningen](docs/brugsvejledning.md).

## Start fra et rent checkout

Brug Node-versionen i `.nvmrc` og npm. På Windows kan kommandoerne køres som `npm.cmd` og `npx.cmd`, hvis PowerShell blokerer npm's `.ps1`-wrapper.

```sh
npm ci
npm run preview:local
```

Åbn `http://127.0.0.1:5173/teamgym-team-manager/`. På Windows kan du også dobbeltklikke på `Start-lokal-test.cmd`. Lokaltesten bygger en fast testudgave i `dist-local/`, som holdes adskilt fra de automatiske browserprøvers `dist/` på port 4173. Der kræves ingen runtime-backend.

**Fast arbejdsgang:** Hver ændring afprøves lokalt af brugeren før commit, push og publicering. Agenten starter lokaltesten, afleverer linket og afventer brugerens klarsignal. Se [vejledning til lokal test](docs/lokal-test.md). Under udvikling findes også `npm run dev`; den faste brugerafprøvning bruger `preview:local`.

## Kontrol

```sh
npm run check
npm run test:domain
npm run test:drive
npm run test:mutations
npm run build
npx playwright install chromium
npm run test:e2e
```

CI kører de samme separate kontroller uden Google-credentials og uden filer fra parent-mappen. Domænekontrollen omfatter filmodel, katalogintegritet, alle 77 faste facitcases, D/C, muligheder, rytme og versionsregression. Mutationskontrollen afprøver fire bevidste regelfejl i en isoleret kopi. Dette er ikke ekstern dommergodkendelse. Drive-tests bruger injiceret netværk og er ikke bevis for faktisk CORS eller atomisk Drive-upload.

## Struktur

| Mappe | Ansvar |
| --- | --- |
| `apps/web` | Statisk React-app og brugerflade |
| `packages/domain` | Strengt filformat, identiteter, medlems-/færdighedskommandoer og stabilitet |
| `packages/rules` | Uforanderlige pakker, katalog, eksakt D/C, muligheder, rytme og regelskift |
| `packages/drive` | GIS/Picker, afgrænset IndexedDB-forbindelse og betinget gemning; rigtig Google-verifikation udestår |
| `tools/t01` | Isoleret afprøvning af den betingede Drive-uploadkandidat |
| `sources` | Henvisning til de otte medfølgende, hashregistrerede PDF-kilder |
| `tests` | Domæne, Drive og browserkontrol |

## Google og Pages

Kopiér `.env.example` til `.env.local` og angiv kun de tre offentlige Google-værdier. [Google-opsætning](docs/google-opsaetning.md), [gemmeprotokol](docs/drive-gemning.md) og [T01](docs/google-t01.md) beskriver opsætning og udestående test. Ingen OAuth client secret er nødvendig eller tilladt i browseren.

Pages baseres på `/teamgym-team-manager/` med hash-links. `.github/workflows/pages.yml` bygger, kontrollerer og uploader `dist`; kun deployment-jobbet får Pages-/OIDC-skriverettighed. Vælg **GitHub Actions** under repository Settings → Pages. Repository Variables med navnene fra `.env.example` leverer offentlig buildkonfiguration. En PR publicerer ikke.

Den lokale previewtest bruger rigtige statiske produktionsfiler og genindlæser dybe hash-links. Faktisk Actions-/Pages-publicering og T01 må først markeres bestået efter en reel kørsel.

Teknisk grundlag: [Vites Pages-vejledning](https://vite.dev/guide/static-deploy.html#github-pages), [Vitests opsætning](https://vitest.dev/guide/) og [Playwrights webserverkonfiguration](https://playwright.dev/docs/test-webserver).

## Offentlige kilder og private arbejdsdata

Repoet indeholder kode, OpenSpec, officielle kildefiler og syntetiske testdata. Gymnastnavne, holdplaner, vurderinger, faktiske arbejdsrumsfiler og brugertokens hører ikke hjemme i repo, CI, billeder eller offentlige artifacts. `.env.local`, logs, browserrapporter, genererede builds og lokale arbejdsfiler ignoreres af Git.

Google Drive er det autoritative datalager. Appen husker kun forbindelsesoplysninger efter den specificerede kontrakt; ingen gymnastdata caches vedvarende som en bivirkning. Ingen eksisterende fælles trænerdokumenter ændres. Test bruger særskilte syntetiske filer. Browserchecks opfanger Google-kald; de er ikke bevis for rigtig Google/CORS. CI's kontrolbyg bruger udtrykkeligt syntetisk offentlig konfiguration og publiceres ikke; Pages-bygget bruger repository Variables.
