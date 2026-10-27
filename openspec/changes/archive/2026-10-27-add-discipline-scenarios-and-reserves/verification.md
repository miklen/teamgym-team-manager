# Verifikation · 27. oktober 2026

Ændring: `add-discipline-scenarios-and-reserves` · schema: `spec-driven` · status: 29/29 opgaver færdige.

Implementeringen omfatter format 3, bevarende migration fra format 1/2, uafhængige scenarier pr. disciplin, reserver og samlet indsættelse, scenariespecifik analyse/potentialer/workers, fælles referencegennemgang og versionssammenligning samt dokumentation og syntetiske eksempler. Den eksisterende brugerbeslutning om lokal afprøvning før commit/push/publicering følges.

## Faktiske kontroller

| Kontrol | Resultat |
| --- | --- |
| `npm.cmd ci` | Bestået; 150 pakker installeret fra låsefilen |
| `npm.cmd run check` | TypeScript og ESLint bestået |
| `npm.cmd run test:domain` | 249 tests bestået i 20 filer |
| `npm.cmd run test:drive` | 69 tests bestået i 4 filer |
| `npm.cmd run build` | Bestået; statisk app, worker, T01 og PDF-assets |
| Kildekontrol | Alle otte fastlåste PDF-filers SHA-256 og størrelse matcher |
| `npm.cmd run test:e2e -- --reporter=line` | 123 Chromium-prøver bestået; afsluttet med exitkode 0 |
| `npm.cmd run test:mutations` | 4/4 bevidste regelfejl fanget af de tilsigtede assertions i en isoleret kopi |
| OpenSpec | `openspec.cmd validate add-discipline-scenarios-and-reserves --strict` bestået |
| UI | Faktiske PNG’er gennemgået ved 390/768/1440; tastatur, 200 % tekst, skaleret kort viewport, reduceret bevægelse, touchmål og axe |

De sidste ændringer af navnelistens visuelle valgt-status og navneformularens fokus er efterprøvet med 15/15 scenarieprøver og ny typekontrol/lint/build. En eksplicit kontrol af synlig navnelabel ved alle tre bredder bestod efterfølgende 3/3 målrettede browserprøver. Chromium var allerede installeret; ingen ny browserinstallation var nødvendig. Build har fortsat Vites vejledende advarsel om appens chunk over 500 kB; bygningen består.

Windows-kørslen genbrugte en særskilt preview-proces på port 4173 via `$env:PLAYWRIGHT_REUSE_SERVER='1'`. Playwrights automatiske nedlukning af den npm-startede preview hang på denne maskine. Den valgfrie variabel ændrer kun testserverens ejerskab; standarden er fortsat en separat automatisk server. Den afsluttede kørsel anvender samme `dist/`, syntetiske netværk og øvrige testkonfiguration. Brugertestens `dist-local/` og port 5173 berøres ikke af browserprøverne.

## Dækning og bevarelse

- `tests/domain/scenarios.test.ts` dækker strikte versioner, fejl i lukkede planer, navne/id’er, migration uden mutation, kopi med nye identiteter, historiske reserver, separate beregninger, bevidst indsættelse og forældet basis, fælles vurdering samt potentialers isolation og fjernelse af nyudførende reserver.
- Faste format 1-/2-eksempler bevares. `tests/fixtures/legacy-v2-inheritance.json` indeholder arv, egen null-vurdering, fravalg og historik. De eksisterende felter sammenlignes direkte efter migration. Begge dokumenterede format 3-eksempler valideres, inklusive testfilen med 12 scenarier.
- Drive-/sessionprøver dækker begge gamle versioner, originalbytes, annullering med eksisterende kladde, læseadgang, faktisk revisionsbasis, konflikt, redigering under upload og genkendelse af mistet svar uden ny upload. Der er ingen automatisk upload ved migration og ingen ændring af forbindelseslageret.
- `scenario-integrity.spec.ts` og `scenarios.spec.ts` dækker lokale visningsvalg, opret/kopi/omdøb/slet, alle tre formularvalg og fejl, fyldt omgang med reserve, prioritering, navnesammenfald, tællende/ekstra indsættelse, springløs/utilgængelig reserve, Annuller og forældet preview. En syntetisk samtidig lokal ændring fremkalder bevidst gammel reservebasis.
- Et forsinket workersvar leveres efter skift fra Plan A til Plan B og kan hverken vises eller anvendes som Plan B’s forslag. En upload fra Plan B bevarer alle planer, og en nyere lokal Plan B-redigering under upload forbliver ugemt.
- Fjernelse af gymnast, fjernelse af færdighed og flytning gennemgår lukkede scenarier og reserver med hold, disciplin, scenarie og omgang. Referencerne bevares gennem gemning. Versionspreview navngiver alle scenarier og reservevalg; uændret andet hold, annullering og afvisning af gammel versionsbasis er dækket af domæne-/registryprøver og relevante browserforløb.
- Eksisterende uafhængige facitcases er bevaret. Ingen nye numeriske forventninger er genereret fra produktionsreglerne. Den strukturelle format-/referencevalidering er ikke en ny faglig regelgodkendelse.

Se [billedkontrol](../../../../docs/ui-kontrol.md), [filformat](../../../../docs/filformat.md), [brugervejledning](../../../../docs/brugsvejledning.md) og [lokal test](../../../../docs/lokal-test.md).

## Lokal afprøvning og udestående

Den separate lokale testudgave er bygget med `npm.cmd run preview:local` i `dist-local/` og kører på `http://127.0.0.1:5173/teamgym-team-manager/`. En frisk Chromium-session åbnede appen med HTTP 200, titlen TeamGym Team Manager, synlig startoverskrift og nul JavaScript-sidefejl. Den indlæste det aktuelle script `app-UUCWPSdG.js`. Browserprøvernes separate 4173-proces blev derefter stoppet; 5173 blev verificeret uafhængigt og efterlades kørende. Gem eller eksportér en eventuel kladde før genindlæsning. Brug kun en særskilt syntetisk testfil; eksisterende fælles trænerfiler må ikke bruges til skriveprøver.

Brugeren godkendte den lokale testudgave 27. oktober 2026 med: »Det ser godt ud. Arkivér, sync og commit.« Opgave 8.3 er dermed afsluttet. Godkendelsen omfatter synkronisering, arkivering og lokalt commit. Push og publicering er ikke bestilt. Appens kode og testudgave er uændrede efter brugerens godkendelse; kun specifikationer og afslutningsdokumentation er opdateret.

Ingen rigtig Google-/Drive-skriveprøve, T01-accept eller to-konto-test er gennemført i denne ændring. Browser-/netværkssimulatorer og axe er ikke bevis for faktisk CORS, atomisk media-upload eller fuld tilgængelighedscertificering. De eksisterende udestående liveprøver bevares.
