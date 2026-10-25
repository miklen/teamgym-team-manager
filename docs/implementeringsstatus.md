# Implementeringskontrol · 25. oktober 2026

Change: `build-teamgym-team-manager`, schema `spec-driven`. **109/122 opgaver fuldført.** Domæne, regler, Drive-adapter og centrale arbejdsflader er implementeret. Første Pages-deployment er bestået; reel Google-/Drive-verifikation er fortsat udestående. Se [opgavelisten](../openspec/changes/build-teamgym-team-manager/tasks.md).

## Implementeret

- Strengt filformat 1, stabile identiteter, medlems-/arkiveringskommandoer, komplette færdigheder, stabilitet og seks omgange pr. hold.
- Alle 103 springkildeposter og 94 individuelle rytmeposter, eksakt D/C, Q01–Q06/K01/K02, konkrete tillægsvidner, rytmefællesnævnere, uforanderlige regelpakker og eksplicitte regelskift.
- Personlig GIS-forbindelse, Picker, verificeret kontoreference, afgrænset IndexedDB-lagring, udløbsmargin, generations-/fanebeskyttelse og hukommelsesfallback.
- Konsistent Drive-læsning, betinget media-upload, operationshistorik, serialiseret gemning, adskilt snapshot/kladde, konflikt/eksport og genkendelse af mistet svar.
- Dansk app med hold/kartotek, færdighedsbygger, vurderingsinspektør, springplan, C/D-forklaringer, potentiale i Web Worker, rytmematrix/kompakt visning og reglementside.

Der findes ingen frigivet ældre arbejdsrumsudgave; format 1 er første understøttede skema. Ældre/nyere ukendte formater afvises uden omskrivning. Regelversionsskift ændrer ikke filskemaet. Dette er særskilt fra en senere eksplicit migration, når en tidligere frigivet udgave faktisk findes.

## Faktisk lokal kontrol

| Kontrol | Seneste resultat |
| --- | --- |
| `npm run check` | Typekontrol og lint bestået |
| `npm run test:domain` | 176 tests bestået, inklusive 77 faste facitcases og fulde integrationer |
| `npm run test:drive` | 34 tests bestået med injiceret netværk/lager/klokke |
| `npm run test:mutations` | 4/4 bevidste regelfejl fanget i isoleret kopi |
| `npm run build` | Statisk app/worker/T01 og otte medfølgende PDF-assets; kilders SHA-256 og størrelse matcher |
| `npm run test:e2e` | 27 Chromium-checks bestået mod produktionsbyg med syntetisk Google/Drive |
| axe | Ingen fund i valgte WCAG 2.2 AA-regler på fem arbejdsflader og vurderingsdialog |
| Visuel kontrol | Fire viewports, 20 syntetiske gymnaster/lange navne, fokus, tastatur, reduceret bevægelse og 200 % tekst |

Se [UI-rapport og billeder](ui-kontrol.md), [kravdækning](kravdaekning.md), [regelkontrol](regler-og-katalog.md), [gemmeprotokol](drive-gemning.md) og [brugsvejledning](brugsvejledning.md). Automatiserede Google-svar er simulatorer, ikke bevis for faktisk Drive/CORS/GIS. Billeder og testdata indeholder kun syntetiske personer.

A3/A4 og alle A1.1-sider er visuelt genlæst mod de fastlåste kilder. Teknisk Regulativs profiler henviser til 1.3/PDF-side 4. Dette er implementeringsagentens kilde-/facitkontrol og ikke ekstern dommergodkendelse. Uafklarede fortolkninger forbliver uafklarede.

## GitHub og offentlig konfiguration

Implementeringen er merged gennem [PR #1](https://github.com/miklen/teamgym-team-manager/pull/1) og ligger på `main` i [målrepoet](https://github.com/miklen/teamgym-team-manager). Den oprindelige [CI-kørsel 40193242920](https://github.com/miklen/teamgym-team-manager/actions/runs/40193242920) er historisk og beviser kun grundlaget ved `53e12a4`; den nye [CI-kørsel 40202101904](https://github.com/miklen/teamgym-team-manager/actions/runs/40202101904) bestod alle trin for den samlede app ved `b4b4b82`, inklusive `npm ci` fra et rent Actions-checkout og samtlige 27 browserchecks.

GitHub-pluginets tidligere PR-forsøg blev afvist med `403 Resource not accessible by integration`. Repoets eksisterende Git-login er senere kontrolleret gennem den normale credential-manager uden at udskrive credentials og har adminadgang. De tre offentlige Google-buildværdier er gemt som repository Variables, og Pages er konfigureret med `build_type: workflow`. Koden er leveret som [PR #1](https://github.com/miklen/teamgym-team-manager/pull/1). Første [Pages-deployment 40202795321](https://github.com/miklen/teamgym-team-manager/actions/runs/40202795321) bestod bygning, samtlige checks, artifact og deployment ved `194cb43`. Den [offentlige app](https://miklen.github.io/teamgym-team-manager/) er åbnet over HTTPS; assets, dybt hash-link og genindlæsning virkede. Ingen client secret eller brugertoken er overført.

Den lokale OAuth-webklient angiver korrekt Pages-origin uden repostien og begge localhost-origins. GIS-/Picker-scripts kunne indlæses under CSP både lokalt og fra den faktiske Pages-origin; appen nåede Fortsæt med Google uden konfigurationsfejl. Et nyt Google-loginvindue står til brugerens login; agenten har ikke gennemført nyt login eller en rigtig skriveprøve i produktionsadapteren. En efterfølgende rettelse bevarer en direkte genforsøgsknap efter et afbrudt Google-popup med eksisterende kladde; alle tre målrettede auth-browserchecks bestod.

## Udskudt og udestående

Brugeren har bekræftet fungerende Google-login med én konto og udtrykkeligt valgt første publicering med én konto. Live test med trænerteamets separate konti udføres efter publicering. Denne [testbeslutning](testbeslutning-2026-10-25.md) ændrer testtidspunktet, ikke resultaterne.

T01, reel Picker-/filadgang, husket adgang før/efter udløb og redeploy, forkert/gammel etag, samtidig media-upload, CORS, mistet uploadsvar og rettighedstab på den faktiske Pages-origin er ikke markeret bestået. Den direkte skrivevej bruger altid If-Match; ingen ubetinget upload, backend eller automatisk erstatningsfil er indført.