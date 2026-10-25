# Google-opsætning og T01

## Status

**Delvist afprøvet.** Offentlig Google-konfiguration er indlæst i Git-ignoreret `.env.local`; de tre JavaScript-origins er kontrolleret i den downloadede OAuth-fil. Brugeren har bekræftet, at login virker med én konto. Ingen fil i den oplyste Drive-mappe er ændret af agenten. CORS, betinget medieupload og samtidig gemning er endnu ikke verificeret mod Google.

Efter [brugerens beslutning 25. oktober 2026](testbeslutning-2026-10-25.md) er den ene konto tilstrækkelig nu. Implementering og første publicering fortsætter; brugeren udfører live test med trænerteamets separate konti i produktion. T01's to-konto-del er udskudt, ikke bestået.

`tools/t01` er en særskilt afprøvningsside, ikke appens produktionsadapter. CI bruger injiceret netværk; beståede CI-tests er ikke Drive-bevis. Den samlede app er ikke frigivet.

## Offentlig konfiguration

1. Opret eller vælg ét Google Cloud-projekt. Aktivér Google Drive API og Google Picker API.
2. Opsæt OAuth consent screen. Ved teststatus skal begge testkonti tilføjes som testbrugere. Brug kun `https://www.googleapis.com/auth/drive.file` i den første afprøvning.
3. Opret et OAuth-klient-id af typen webapp. Registrér JavaScript-origin `https://miklen.github.io` uden repo-sti og separat `http://127.0.0.1:5173` til udvikling. T01 lokalt via preview kræver også `http://127.0.0.1:4173`. Der bruges ingen client secret.
4. Opret en browser-API-nøgle i samme projekt. Begræns Websites til `https://miklen.github.io/*`, `https://docs.google.com/*` og de valgte lokale testadresser med `/*`. Picker bruger en iframe på `docs.google.com`; origin-baserede referrers må ikke fejlagtigt kræve repo-stien. Begræns API-adgang til Google Picker API og Google Drive API. Brug projektnummeret, ikke projektnavnet, til Picker.
5. Udfyld `VITE_GOOGLE_CLIENT_ID`, `VITE_GOOGLE_PROJECT_NUMBER` og `VITE_GOOGLE_API_KEY` i `.env.local`. Ved Pages placeres de samme offentlige værdier som repository Variables. Genbyg derefter; variablerne læses ved build.
6. Angiv projekt-id, consent-status, registrerede origins og restriktioner i en lokal opsætningsnote. Ingen brugertokens, client secrets eller persondata i noten eller repoet.

Google-konfigurationen er endnu ikke verificeret. Følg også de aktuelle [GIS-anvisninger](https://developers.google.com/identity/oauth2/web/guides/use-token-model) og [Picker-anvisninger](https://developers.google.com/workspace/drive/picker/guides/overview).

## Testsiden

Efter bygning: `/teamgym-team-manager/tools/t01/`. En lokal kørsel kan afprøve værktøjet, men erstatter ikke Pages-origin.

1. Brug to uafhængige browserprofiler med konto A og B. Kontrollér selv, at de er forskellige konti. Forbind hver konto gennem Google-knappen.
2. Konto A vælger en særskilt testmappe gennem Picker og klikker **Vælg testmappe og opret syntetisk testfil**. Værktøjet opretter kun en ny `teamgym-t01-….json` med `kind=teamgym-t01`, formatversion, syntetisk operation og A/B-mærke. Del filen med konto B via Drive.
3. B vælger den samme JSON-fil gennem Picker for at autorisere filen til appen. Mappeadgang eller et fil-id alene er ikke appautorisation.
4. A og B klikker **Indlæs og fasthold basis** før nogen upload. Sammenlign fil-id, version og indholdshash. Ingen knap ændrer basis efter en upload; kun eksplicit genindlæsning gør det.
5. A uploader. B uploader bagefter fra den gamle basis. Forvent 2xx for A, 412 for B og uændrede A-bytes. B kan eksportere sin syntetiske kladde.
6. Indlæs fælles ny basis. Indtast samme fremtidige UTC-tid i begge sessioner og klargør begge uploads. Kontrollér faktisk overlap i browserens netværksværktøj; en planlagt tid alene beviser ikke samtidighed. Gentag flere gange og med en ændring mellem forkontrol og upload.
7. Test gammel og bevidst forkert etag. Læs seneste fil uden at opdatere basis. Ingen gammel/forkert betingelse må ændre bytes. Hvis Google accepterer den, stop og registrér blokeringen; ingen ubetinget fallback.
8. Afprøv mistet uploadsvar, endnu en træners efterfølgende skrivning, udløbet token, rettighedstab og ændring under metadata/indhold/metadata-læsning efter [DRIVE04–DRIVE05](../openspec/changes/archive/2026-10-25-build-teamgym-team-manager/reference/github-pages-drive.md). Værktøjet gen-uploader aldrig automatisk. Operations-id og hash i seneste indhold kan bruges til manuel afstemning. Automatiseret produktionsgenopretning er endnu ikke implementeret.

Loginoplysninger holdes kun i testsidens hukommelse og ryddes ved afbrydelse/udløb/genindlæsning. Dette er ikke implementeringen af produktets senere huskede forbindelse.

## Krævet evidens

| Kontrol | Resultat |
| --- | --- |
| Pages-origin og faktisk preflight med `If-Match` | Ikke kørt |
| DRIVE01: A gemmer, B's gamle basis afvises, A-bytes bevares | Ikke kørt |
| DRIVE02: to konti, overlappende upload og kapløb efter forkontrol | Ikke kørt |
| DRIVE03: forkert/gammel etag afviser uden ændrede bytes | Ikke kørt |
| DRIVE04: mistet svar, senere skrivning og tokenudløb | Ikke kørt |
| DRIVE05: inkonsistent læsning/rettighed/filfejl | Ikke kørt |

Registrér dato, commit, origin, to særskilte anonymiserede kontobetegnelser, antal gentagelser, HTTP-status, CORS-resultat, versioner og før/efter-hash. Gem kun redigerede testlogs uden Authorization, tokens, kontonavne eller rå HAR-filer. Testsidens eksport mærkes altid `unverified`; en eksport er ikke automatisk godkendelse.

Kandidaten følger [Drive v2 files.update](https://developers.google.com/workspace/drive/api/reference/rest/v2/files/update) og sender `PUT /upload/drive/v2/files/{fileId}?uploadType=media` med præcis indlæst `If-Match`. At v2 dokumenterer etag er ikke i sig selv bevis for uploadens atomiske effekt. Én konto i to faner kan afprøve skrivekapløb, men beviser ikke rettigheder mellem forskellige brugere. Den sidste del udfører brugeren med trænerteamet efter første publicering; der må indtil da ikke påstås bestået to-konto-verifikation.
