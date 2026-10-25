# TeamGym Team Manager

Dansk trænerarbejdsplads til hold, færdigheder og springplanlægning. Målrepo: [miklen/teamgym-team-manager](https://github.com/miklen/teamgym-team-manager).

**Status:** Under implementering. Filmodel, domænekommandoer, stabilitet og kildekatalog er tilføjet; appskallen er endnu ikke et brugbart trænerprodukt. Den samlede [OpenSpec-change](openspec/changes/build-teamgym-team-manager/proposal.md) omfatter alle ti capabilities; [opgavelisten](openspec/changes/build-teamgym-team-manager/tasks.md) og [kontrolrapporten](docs/implementeringsstatus.md) viser fremdriften. Brugeren har bekræftet Google-login med én konto; flerbrugerverifikation er efter [brugerbeslutningen](docs/testbeslutning-2026-10-25.md) udskudt til live test i produktion.

## Start fra et rent checkout

Brug Node-versionen i `.nvmrc` og npm. På Windows kan kommandoerne køres som `npm.cmd` og `npx.cmd`, hvis PowerShell blokerer npm's `.ps1`-wrapper.

```sh
npm ci
npm run dev
```

Åbn `http://127.0.0.1:5173/teamgym-team-manager/`. `npm run build` laver kun statiske filer i `dist/`. `npm run preview` viser produktionsbygningen på port 4173. Der kræves ingen runtime-backend.

## Kontrol

```sh
npm run check
npm run test:domain
npm run test:drive
npm run build
npx playwright install chromium
npm run test:e2e
```

CI kører de samme separate kontroller uden Google-credentials og uden filer fra parent-mappen. Domænekontrollen omfatter foreløbig kildeintegritet og modulgrænser; den er ikke testbevis for sportslige beregninger. Drive-tests bruger injiceret netværk og er ikke bevis for faktisk CORS eller atomisk Drive-upload.

## Struktur

| Mappe | Ansvar |
| --- | --- |
| `apps/web` | Statisk React-app og brugerflade |
| `packages/domain` | Fælles identiteter, diagnostikkontrakt og senere filmodel |
| `packages/rules` | Versionsbinding og senere katalog-/beregningspakker |
| `packages/drive` | Browseradapterens grænse; sikker gemning endnu ikke implementeret |
| `tools/t01` | Isoleret afprøvning af den betingede Drive-uploadkandidat |
| `sources` | Henvisning til de otte medfølgende, hashregistrerede PDF-kilder |
| `tests` | Domæne, Drive og browserkontrol |

## Google og Pages

Kopiér `.env.example` til `.env.local` og angiv kun de tre offentlige Google-værdier. [Google-/T01-vejledningen](docs/google-t01.md) beskriver opsætning og den udestående test. Ingen OAuth client secret er nødvendig eller tilladt i browseren.

Pages baseres på `/teamgym-team-manager/` med hash-links. `.github/workflows/pages.yml` bygger, kontrollerer og uploader `dist`; kun deployment-jobbet får Pages-/OIDC-skriverettighed. Vælg **GitHub Actions** under repository Settings → Pages. Repository Variables med navnene fra `.env.example` leverer offentlig buildkonfiguration. En PR publicerer ikke.

Den lokale previewtest bruger rigtige statiske produktionsfiler og genindlæser dybe hash-links. Faktisk Actions-/Pages-publicering og T01 må først markeres bestået efter en reel kørsel.

Teknisk grundlag: [Vites Pages-vejledning](https://vite.dev/guide/static-deploy.html#github-pages), [Vitests opsætning](https://vitest.dev/guide/) og [Playwrights webserverkonfiguration](https://playwright.dev/docs/test-webserver).

## Offentlige kilder og private arbejdsdata

Repoet indeholder kode, OpenSpec, officielle kildefiler og syntetiske testdata. Gymnastnavne, holdplaner, vurderinger, faktiske arbejdsrumsfiler og brugertokens hører ikke hjemme i repo, CI, billeder eller offentlige artifacts. `.env.local`, logs, browserrapporter, genererede builds og lokale arbejdsfiler ignoreres af Git.

Google Drive er det planlagte autoritative datalager. Appen må senere kun huske forbindelsesoplysninger efter den specificerede kontrakt; ingen gymnastdata må caches vedvarende som en bivirkning. Ingen eksisterende fælles trænerdokumenter ændres. En test bruger en særskilt syntetisk fil.
