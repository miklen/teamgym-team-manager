# Verifikation 27. oktober 2026

Implementeringen og UI-revisionen er lokalt afprøvet og godkendt af brugeren 27. oktober 2026. Brugeren gav udtrykkeligt klarsignal til arkivering, synkronisering, commit og push. Alle 26 opgaver er afsluttet. Tidligere afventende acceptbeskrivelser nedenfor er historiske; den endelige accept fremgår af sidste afsnit.

## Automatiske kontroller

| Kontrol | Faktisk resultat |
| --- | --- |
| `npm.cmd run check` | Bestået: TypeScript, ESLint og de seks positive/negative politikdækningsprøver. |
| `npm.cmd run test:domain` | 273 tests bestået i 22 filer. |
| `npm.cmd run test:drive` | 82 tests bestået i fem filer. |
| `npm.cmd run build` | Bestået. Alle otte fastlåste PDF-kilders størrelse og SHA-256 stemmer. Vite giver fortsat en ikke-blokerende advarsel om appens chunk over 500 kB (cirka 625,5 kB / 185,2 kB gzip). |
| `npm.cmd run test:e2e -- --workers=4` | 135 Chromium-prøver bestået, inklusive 12 nye gennemgangsprøver. |
| `openspec.cmd validate review-and-merge-workspace-conflicts --strict` | Bestået. |
| `git diff --check` | Ingen whitespace-fejl. |

På Windows blev den af denne prøvekørsel startede Vite-proces på port 4173 stoppet efter sidste afsluttede prøve, så Playwright kunne afslutte serveroprydningen og returnere exitkode 0. Det berører ikke lokalvisningen på port 5173.

## Kontrakt, betydning og session

`workspace-merge.test.ts` verificerer typeadskillelsen mellem blokeret resultat og gyldig kandidat, schema-/politikdækning og negative ændringer i politikken uden ændring af produktionsschemaet. Det omfatter topniveau, nested felt, manglende atomisk gruppemedlemskab, felt inde i atomisk udførelse og udeladt uniongren. Politikken kræver også typet dækning af disciplin- og ophavsvarianter.

Adfærdsprøverne dækker determinisme, uændrede input, ens/ensidige ændringer, blandede og ændrede valg, ukendte felter/formater/identiteter, uafhængige felter og omgange, atomiske vurderinger/lister, scenarierækkefølge, sletning mod redigering/reference, navnesammenstød, identiske præcise spring/registreringer med forskellige id'er og bevarelse af uafhængige ændringer. Samtidige domænekommandoer omfatter også udskiftet udførelse mod vurdering/bekræftelse, arkivering/flytning mod plan, kildeændring mod note/eget valg/fravalg samt regelbinding/revurdering. Afstemning må ikke stiltiende ændre egne data eller fjerne accepterede relationer/valg.

`workspace-review-session.test.ts` supplerer de eksisterende produktionsadapterprøver med sessionsprøver for separate snapshots, annullering, læsefejl, ukendt uploadsvar med/uden senere ekstern gemning, fortsat lokal redigering, forsinkede svar, filskift/clear, konto/adgang/regelkontekst, genkontrol, uændret kandidat, frisk gemmeoperation og kapløb efter anvendelse. Annullering og anvendelse frigiver sessionens sammenligningssnapshot. En baggrundskontrol af samme gennemgåede R gør ikke gennemgangen forældet; en tredje version gør. De eksisterende adapterprøver verificerer fortsat den reelle `If-Match`-betingelse, eksport, migration og afbrydelse.

## Browser og visuel gennemgang

Alle browserdata og Google-/Drive-svar er syntetiske. Ingen eksisterende trænerfil er brugt til skriveprøver. Browserforløbene verificerer forenelige ændringer efter afvist gemning og baggrundskontrol, valg/ændrede valg/filtre, annullering, tredje gemning, formularernes Opdater/Kassér/Bliv og separat gemning/genåbning. Der er nul uploads under gennemgang og anvendelse.

Visningen er gennemgået på screenshots ved 390, 768 og 1440 pixels med langt holdnavn, vurdering/dato/ophav og noter. Før/Min/Filens står i tre kolonner på bred skærm og stables med gentagne betegnelser på smal skærm. Lange navne brydes inden for dialogen. Blandede konfliktvalg kan foretages og anvendes med tastatur ved 390 pixels. Valg forsvinder ikke under brugeren i filteret Uafgjorte konflikter. Fjernede lukkede scenarier bevarer navn fra basis; ændringer på andre hold indgår.

Axe finder ingen overtrædelser i gennemgangen med og uden konfliktvalg. Fokus ved åbning, uafgjorte konflikter, fejl, forældelse og lukning er kontrolleret. Stor tekst på 200 %, reduceret bevægelse og 200 % visning med 720 CSS-pixels / 1440 fysiske pixels er verificeret, inklusive tastaturadgang til anvendelse. Indlæsning, læsefejl, forældelse og læseadgang har særskilt status og bevaret eksport; anvendelse er blokeret, hvor nødvendigt.

Lokale QA-billeder findes under `tmp/ui-qa/merge-*.png`, herunder bredderne, konflikter på mobil, lukket scenarie, mange ændringer, indlæsning, fejl, forældelse, læseadgang og zoom. Screenshots er lokale QA-artefakter og indgår ikke i arbejdsrumsfilen.

## Stort syntetisk arbejdsrum

Datasættet har 100 hold, 400 gymnaster, 1.200 registreringer, 200 scenarier og 695.489 bytes JSON. Domæneprøven sammenligner 1.200 uafhængige ændringer: seneste målte beregning 535 ms. I den afsluttende browserkørsel tog hentning/beregning/rendering af 1.200 ændringer cirka 704 ms og filtrering til ét hold 102 ms. Målingerne er lokale på denne maskine og varierer med belastningen; de er ikke garantier for andre enheder.

Gennemgangen kunne filtreres, annulleres, åbnes igen og annulleres med nul uploads og uændret ekstern fil. Sessionsprøver kontrollerer desuden, at sammenligningssnapshot frigives. Responsen er tilstrækkelig på dette datasæt; der er ikke indført worker eller runtime-backend. Måleresultater findes lokalt i `tmp/merge-qa/`.

## Lokal test og resterende accept

`npm.cmd run preview:local` er startet med `dist-local/` på `http://127.0.0.1:5173/teamgym-team-manager/`. En frisk Chromium-kontekst har åbnet adressen med HTTP 200, korrekt sidetitel og synlig Forbind til Google Drive-knap uden JavaScript-runtimefejl. Serveren kører videre. Lokalvisningen har ikke åbnet eller skrevet i nogen Drive-fil under denne kontrol.

Brugeren afprøver to faner med samme separate syntetiske Drive-fil efter trinene i `docs/lokal-test.md` og `docs/gennemgaa-aendringer.md`: uafhængige ændringer, blandede konfliktvalg og en tredje gemning under gennemgang. Gem/eksportér en eksisterende kladde før genindlæsning. Den lokale testudgave bruger `dist-local/` på port 5173 og holdes uændret, mens brugeren tester.

Live T01 og en faktisk test med to konti er ikke udført som del af denne ændring og betegnes ikke bestået. Den automatiske simulator og to faner på samme konto erstatter ikke disse prøver. Commit/push/publicering afventer brugerens faktiske lokale test og udtrykkelige klarsignal.

## UI-revision efter brugerens funktionstest

Brugeren har bekræftet, at funktionaliteten fungerer, og ønsket en elegant, mere overskuelig app-visning og almindeligt dansk. Projektets frontend-skill er fulgt med rolig komposition, én blå accent, typografisk hierarki og bevægelse ved navigation og valg.

Gennemgangen har nu en kompakt ændringsliste og ét detaljepanel. Uafhængige ændringer kan læses enkeltvis; konfliktvalg vises som to tydelige, valgbare udgaver med blå markering og et samlet udgangspunkt. Vurderinger viser sikkerhed, dato og egen/arvet vurdering samlet. Filtervalg og konfliktvalg bevares under navigation, og Næste valg fører videre. Piletaster, Home og End skifter mellem ændringer, mens kun den aktuelle række ligger i Tab-rækkefølgen; store arbejdsrum kræver dermed ikke Tab gennem alle rækker.

Handlingslinjen er altid synlig. Den primære knap hedder **Brug disse ændringer**, ledsaget af **Du gemmer på Drive bagefter**. Formularbeskyttelsen bruger **Behold mine ændringer**, og eksporten i gennemgangen hedder **Download en kopi**. Vejledningen og den efterfølgende status bruger samme sprog.

Dette er en ren visnings- og sprogrevision. Arbejdsrummets schema, fletteregler, afhængigheder, snapshots, gemmeoperationer og betingede upload er ikke ændret. Den nye navigations- og filtertilstand findes kun i komponenten og gemmes ikke i fælles data. Der er derfor ikke behov for nye datapolitikker. Drive-pakken har kun fået ændret statusbeskedens ordlyd.

Verifikation efter revisionen:

- npm.cmd run check: bestået, inklusive typekontrol, lint og de seks politikdækningsprøver.
- npm.cmd run test:drive: 82 tests bestået.
- npm.cmd run build: bestået, med otte uændrede PDF-kilder. Seneste app-chunk er cirka 631,9 kB / 187,0 kB gzip og giver den samme ikke-blokerende størrelsesadvarsel.
- Samlet browserkontrol: 135 prøver bestået. Efter den sidste tilføjelse af piletastnavigation er alle 12 målrettede gennemgangsprøver kørt igen og bestået.
- Screenshots er kontrolleret ved 390, 768 og 1440 pixels, med konfliktvalg, stor tekst, zoom, indlæsning, fejl og læseadgang. Axe-prøverne er grønne. Tekstkontrast, synlig handlingslinje og reduceret bevægelse er verificeret.
- Det store syntetiske arbejdsrum med 1.200 ændringer blev vist på 516 ms og filtreret på 77 ms i den seneste målrettede kørsel. Der renderes kun én detaljeret sammenligning ad gangen. Ingen uploads under gennemgang eller bekræftelse.
- Den nye lokale udgave skal afprøves igen før commit/push/publicering. Brugerens tidligere funktionstest er ikke et klarsignal til at publicere UI-revisionen.

## Endelig lokal accept og klarsignal

Brugeren bekræftede først, at funktionaliteten fungerede, og godkendte derefter UI-revisionen med: "perfekt. arkivér, sync, commit og push." Den 27. oktober 2026 er dette registreret som faktisk lokal accept og udtrykkelig tilladelse til de bestilte handlinger. Opgave 5.4 er derfor afsluttet. Den afprøvede lokale server og dist-local-udgave bevares.

De tre deltas synkroniseres til hovedspecifikationerne før arkivering. Knapnavne i kravene ajourføres til den godkendte brugerflade. Allerede godkendte, eksisterende arkiv-/specifikationsændringer for improve-skill-overview-and-inheritance indgår også i commit og push. Live T01 og faktisk to-konto-test er fortsat ikke udført og betegnes ikke bestået.

## Verificeret sync før arkivering

Alle 11 deltakrav er kontrolleret mod hovedspecifikationerne efter synkroniseringen: 10 nye krav og ét ændret krav. Øvrige eksisterende krav, scenarier og Purpose-afsnit er bevaret. Den nye workspace-merge-specifikation har et konkret Purpose-afsnit. Alle 11 hovedspecifikationer og den afsluttede change består strikt OpenSpec-validering. CLI-status viser 26/26 afsluttede opgaver før arkivering. Arkivmål: openspec/changes/archive/2026-10-27-review-and-merge-workspace-conflicts/.
