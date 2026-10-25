# Google og GitHub Pages

Offentlig lokal konfiguration er læst fra brugerens OAuth-webklient. Projekt: `claude-gmail-492415`, projektnummer `582559479551`. OAuth-client-id, Picker-projektnummer og browser-API-nøgle bruges ved bygning som `VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_PROJECT_NUMBER` og `VITE_GOOGLE_API_KEY`. De lokale værdier ligger i ignoreret `.env.local`; OAuth-downloadens client secret kopieres ikke. Tokens udstedes først i browseren og ligger aldrig i bygget.

## Cloud-konfiguration

- Aktivér Google Drive API og Google Picker API i samme projekt som webklienten og nøglen.
- OAuth-klienttypen er Web application. JavaScript-origins: `https://miklen.github.io`, `http://127.0.0.1:5173` og `http://127.0.0.1:4173`. Repo-stien hører ikke til i en origin. Disse origins var til stede i den downloadede offentlige klientkonfiguration.
- Appen bruger GIS-tokenmodellen med `drive.file`. Ingen redirect-handler, backend, refresh token eller client secret er nødvendig i appen.
- Begræns browsernøglen til relevante websteder og Picker API. Googles aktuelle Picker-vejledning kræver også `https://docs.google.com/*` som tilladt referrer, fordi vælgeren kører i en iframe. Medtag egne Pages-/localhost-origins med `/*`.
- Consent/Audience skal tillade de ønskede trænere. I Testing tilføjes testbrugere; konti udenfor listen skal først kunne autoriseres, før de kan bruges. Den aktuelle Cloud-publiceringsstatus, API-aktivering og nøglens restriktioner er **ikke verificeret** af agenten.

Brugeren har bekræftet fungerende login med én konto. Det er ikke et bevis for Picker, betinget upload eller adgang fra en anden konto. Den særskilte [testbeslutning](testbeslutning-2026-10-25.md) tillader første publicering med én konto og efterfølgende live test med trænerteamet.

## GitHub

De tre offentlige konfigurationsværdier er nu gemt som repository **Variables** med navnene ovenfor, og GitHub Actions er valgt som Pages-kilde. Workflowet bygger fra `main` efter typekontrol, tests, mutationer og Chromium-kontrol. Kun deployment-jobbet har Pages-/OIDC-skriverettigheder. Der bruges ingen runtime-server.

Produktionsadresse: `https://miklen.github.io/teamgym-team-manager/`. Navigation er hash-baseret. Den aktuelle lokale udgave kan køres på `http://127.0.0.1:4173/teamgym-team-manager/` efter `npm run build` og `npm run preview`.

## Browserlager og CSP

Versionsmærket IndexedDB gemmer kun den ønskede forbindelse: aktuelt token, Googles udløbstid, scopes, verificeret kontoreference og seneste filreference. En 30-sekunders sikkerhedsmargin forkorter adgang; appen forlænger den aldrig. Lagerfejl giver forbindelse i hukommelsen med tydelig besked. Afbrydelse invaliderer en fælles lager-epoch, så gamle svar ikke kan genoprette gemt adgang. BroadcastChannel sender kun afbrydelsessignal, aldrig tokens.

HTML indeholder en CSP med afgrænsede GIS-, Picker- og Drive-hosts, ingen inline scripts/eval, objektblokering og worker fra egen origin. Inline styles tillades til Google-komponenterne. GIS og Picker-scripts kunne indlæses under den lokale CSP; den fulde Picker-iframe og login/genbrug på **den rigtige Pages-origin** er stadig udestående. React håndterer navne/noter som tekst. Appen bruger ikke `dangerouslySetInnerHTML`.

Alle repo-stier på `miklen.github.io` deler origin. Databasenavnet eller repo-stien isolerer ikke tokenet fra anden JavaScript på denne origin. Et senere eget domæne kræver ny origin-konfiguration og genforbindelse.

Primære vejledninger: [GIS tokenmodel](https://developers.google.com/identity/oauth2/web/guides/use-token-model), [GIS CSP](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid), [Picker og nøglens referrers](https://developers.google.com/workspace/drive/picker/guides/web-picker).
