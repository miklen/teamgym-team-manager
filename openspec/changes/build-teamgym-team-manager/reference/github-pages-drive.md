# GitHub Pages, Google-adgang og fælles gemning

Arkitekturbeslutning opdateret 25. oktober 2026 efter brugerens valg: **kun GitHub Pages, ingen backend**. Denne beslutning erstatter det tidligere forslag om Fastify, serversessioner og en fælles serverkø. Node bruges kun til lokal udvikling, test og bygning. Appen taler fra browseren direkte med Google Identity Services, Google Picker og Drive.

## Hosting og navigation

Produktionsadressen er som udgangspunkt `https://miklen.github.io/teamgym-team-manager/`. Vite-base er `/teamgym-team-manager/`; navigation bruger hash-ruter, så en genindlæsning på et hold eller et arbejdsrumslink fungerer uden server-rewrites eller en 404-omvej. Google OAuth JavaScript-origin er `https://miklen.github.io`, uden repo-stien. Lokale udviklingsorigins registreres separat. OAuth Client ID, Google-projektnummer til Picker og en begrænset browser-API-nøgle er offentlig konfiguration, aldrig en client secret.

GitHub Actions skal køre låst installation, relevante checks og produktionsbyg og derefter publicere det statiske build gennem Pages. Kun deployment-jobbet har `pages:write` og `id-token:write`, med `github-pages`-miljø og en deployment-concurrency-gruppe. PR-checks publicerer ikke. Ingen API-server, Functions, Workers, Apps Script, tokenproxy eller separat database indføres som skjult erstatning. Der er intet servermiljø, som skal indeholde brugercredentials. Alle ti capabilities og regelgrundlaget er fortsat i første leverance.

## Hvad »husk Google-forbindelsen« betyder

Google skelner mellem tidligere samtykke, browserens Google-login og et aktuelt Drive-access token. Samtykket huskes hos Google pr. bruger og Client ID. GIS' browsermodel udsteder kortlivede access tokens, ikke et refresh token til automatisk fornyelse i appen. Derfor kan en ren Pages-app **ikke love permanent, tavs Drive-adgang på tværs af vilkårligt lange pauser**. Det er en teknisk begrænsning, ikke en ekstra brugerbeslutning eller et påskud for en backend.

Den konkrete kontrakt er:

1. Brug GIS `initTokenClient` og mindst nødvendige scopes, først `drive.file`. Første forbindelse bruger Googles kontovalg/samtykke. Vis den faktisk forbundne konto ud fra et autoriseret Drive-kald; et lokalt kontonavn er ikke bevis for adgang.
2. Efter brugerens udtrykkelige ønske om at bevare forbindelsen gemmes den aktuelle adgang lokalt i en versionsmærket IndexedDB-post: access token, modtagelsestid, `expiresAt` ud fra Googles `expires_in`, scopes, verificeret kontoreference og seneste filreference pr. konto. Filreference og login-hint er ikke autorisation. Gyldighed må ikke forlænges lokalt. Tokens gemmes aldrig i Drive-filen, Git, URL, almindelige logs eller buildartefaktet.
3. Ved nyt besøg eller browsergenstart: genbrug kun et ikke-udløbet token med en kort udløbsmargin, kontrollér kontoen og genåbn den huskede fil med dennes aktuelle rettigheder/version. Det normale forløb med gyldigt token kræver intet nyt login, samtykke eller Picker-valg. IndexedDB-fejl/privat tilstand må give hukommelsesbaseret forbindelse, aldrig en falsk påstand om at forbindelsen er husket.
4. Ved udløbet/afvist token: slet tokenet, bevar kontohint og filreference, og vis én handling **»Fortsæt med Google«**. Den bruger `requestAccessToken` fra brugerens klik med `login_hint`, `include_granted_scopes:true` og `prompt:''`, så kontovalg og samtykke ikke tvinges frem igen. Google kan stadig kræve interaktion ved logout, tilbagekaldt adgang eller kontosikkerhed. Intet loop, ingen skjulte iframes eller garanti om at `prompt:'none'` fornyer adgangen uden brugerhandling.
5. Popup lukket/blokeret eller tokenudløb under gemning bevarer kladden og tilbyder at fortsætte. Gemning efter genforbindelse skal kontrollere den aktuelle filversion igen; genforbindelse er ikke tilladelse til en ubetinget upload.
6. Almindelig **»Afbryd forbindelse«** rydder huskede tokens/konto/filreferencer og aktive arbejdsdata efter håndtering af ugemt arbejde, også i appens øvrige faner. Det tilbagekalder ikke automatisk Googles samtykke. En særskilt handling til at tilbagekalde appens Google-adgang kan bruge GIS revoke; efter den kan nyt samtykke være nødvendigt. Kontoskift må aldrig genbruge den tidligere kontos adgang.

Kontoskift/afbrydelse øger en lokal forbindelsesgeneration. Et forsinket GIS-svar eller en asynkron lagerskrivning fra en tidligere generation skal kasseres, så den ikke genopretter en afbrudt forbindelse. Meddelelser mellem faner indeholder kun ændringssignaler, ikke access tokens. Klokke-/lager-/kontooplysninger fra browseren kan ikke erstatte Googles faktiske token- og rettighedskontrol.

Vedvarende access tokens er læsbare for JavaScript på samme origin. IndexedDB-kryptering med en nøgle gemt samme sted ville ikke fjerne denne risiko. Implementeringen skal derfor begrænse tredjepartsscripts, håndtere tekst uden scriptinjektion og afprøve en Pages-kompatibel CSP med GIS/Picker. Repo-stier på `miklen.github.io` er ikke forskellige sikkerhedsorigins; navngivne databaser isolerer ikke mod anden kode på samme origin. Et eventuelt senere eget domæne ændrer origin og kræver ny OAuth-konfiguration og lokal genforbindelse. Dette ændrer ikke den valgte hostingmodel.

Ingen gymnastoplysninger gemmes vedvarende i browseren som følge af »husk forbindelse«; Drive er datalageret, og kladden ligger i hukommelsen. Lukkes browseren med ugemt arbejde, gælder den eksisterende advarsel/lokale eksport. Vedvarende autentifikation er ikke en bestilling på offline-datasynkronisering.

## Konfliktbeskyttelse uden appserver

En browserkontrol af `files.version`, efterfulgt af en almindelig upload, har et kapløb. En lokal mutex, Web Locks, BroadcastChannel eller en låseværdi i den samme JSON-fil koordinerer ikke to forskellige træneres computere. Disse mekanismer må ikke bruges som bevis for sikker fælles gemning.

Konfliktkontrakten kræver i stedet, at **Drive selv** afviser en betinget opdatering på en gammel filrevision. Det skal være en atomisk kontrol af de samme filbytes, som opdateres. Den konkrete kandidat, som skal verificeres først, er:

- Drive v2 `files.get` med fast feltmaske inklusive `id,etag,version` og relevante rettigheds-/ændringsfelter. V2 vælges her, fordi filressourcen eksplicit beskriver `etag`; v3's numeriske versionsstreng må ikke indsættes som ETag. Resten af adapteren kan bruge v3 til oprettelse og almindelige metadata efter en eksplicit mapping.
- Konsistent læsning af metadata, JSON via `files.get?alt=media`, og metadata igen. Gentag ved ændret etag/version. Gem både eksakt opaque etag, versionsstreng, workspace-revision og hash af indlæste bytes som basis.
- Betinget `PUT https://www.googleapis.com/upload/drive/v2/files/{fileId}?uploadType=media` med `Authorization: Bearer …`, `Content-Type: application/json` og `If-Match: <basis-etag>`. Bevar Google-værdiens nøjagtige syntaks. Det er et afprøvningsmål, **ikke en allerede verificeret egenskab ved denne uploadtype**.
- Gammel betingelse skal give afvisning (forventet 412) uden at ændre indhold. Den faktiske tilladelse til `If-Match` gennem browserens CORS-preflight og den atomiske effekt på medieindholdet skal begge bevises. Et dokumenteret ETag-felt eller succesfuld metadata-PATCH alene beviser ikke dette.

Der er ikke kørt en rigtig Drive-skrivetest i planfasen; Google-testcredentials er ikke konfigureret her. Dette er **T01, en tidlig teknisk frigivelsesbetingelse**, adskilt fra de seks sportslige regelspørgsmål. Implementeringsagenten skal først afprøve kandidaten direkte fra den faktiske Pages-origin mod en særskilt testfil og dokumentere præcis requesttype, CORS-resultat og nedenstående kapløbstest. En anden direkte Google-metode er kun acceptabel med tilsvarende dokumenteret atomisk egenskab og test; API-valg skal derefter fastlåses i adapteren.

Hvis kandidaten fejler, må agenten hverken indføre backend, ignorere en gammel version, kalde en almindelig dobbeltlæsning atomisk eller erklære produktet færdigt. Registrér den konkrete Google-begrænsning som en blokering af delt gemning, bevar kladder/eksport, og rapportér fundet. Den øvrige plan må ikke nedskaleres til en MVP. En brugerbesked efter en overskrivning opfylder ikke kravet om at bevare begge træneres arbejde.

## Gemning og ukendt uploadsvar

Browseren serialiserer egne gemninger og holder indlæst basis, afsendt snapshot og fortsat kladde adskilt. Før upload valideres skema/referencer; tildel nyt operations-id, revision og tid samt afgrænset historik. `payloadHash` beregnes deterministisk af brugerindholdet, uden de afledte revisions-/operationsfelter, så hashen ikke refererer til sig selv. Et nyt id kræves ved ændret snapshot. Fil-id, mappe og deling ændres ikke.

Læs den aktuelle konsistente fil før genforsøg. Hvis samme operation med samme hash allerede er registreret, er gemningen udført. Hvis en senere træner siden har gemt, vises både gennemført operation og nyere fil; den gamle kladde får ikke den nyere basis automatisk. Ukendt udfald må ikke medføre blind gen-upload. Et sent svar kan kun markere det afsendte snapshot som gemt og må ikke fjerne senere lokale ændringer.412 bliver konflikt med bevaret kladde;401 bliver genforbindelse;403/rettighedstab og netværksfejl bliver særskilt fejl. Token/op-id/kladdetilstande skal forhindre dobbeltklik og genforsøg i at omgå versionskontrollen.

## Konkrete acceptforløb

| Id | Test og krævet udfald |
| --- | --- |
| PAGES01 | Åbn produktionens repo-sti, dybt hash-link og genindlæs; scripts/assets og navigation virker uden backend eller404. |
| AUTH01 | Forbind én gang, luk/genåbn browseren inden tokenudløb; korrekt konto/fil åbnes uden nyt samtykke/Picker. Gentag efter redeployment på samme origin. |
| AUTH02 | Udløbet token slettes; ét klik på Fortsæt med Google genbruger konto/samtykke, når Google tillader det, og åbner den seneste fil. Ingen tvungen consent eller select_account ved hvert besøg. |
| AUTH03 | Afbrudt Google-login, blokeret popup, tilbagekaldt adgang, anden Google-konto og manglende IndexedDB giver sandfærdig tilstand uden tab af kladde eller kontoblanding. |
| AUTH04 | Afbryd forbindelse i én fane rydder husket adgang og forhindrer nye anmodninger med det gamle token i andre faner; en allerede afsendt upload afstemmes separat. |
| DRIVE01 | A/B læser samme basis; A gemmer; B afvises; A's bytes bevares, B's kladde kan eksporteres. |
| DRIVE02 | Fra to selvstændige browsersessioner med separate konti synkroniseres to uploadrequests på samme etag; præcis én kan lykkes, den anden afvises. Gentag med ændring efter forkontrol men før upload. |
| DRIVE03 | Gammel etag og bevidst forkert etag må ikke acceptere ændrede JSON-bytes; samme gamle etag kan ikke genbruges til endnu en skrivning. Test den faktiske media-upload, ikke kun metadata. |
| DRIVE04 | Afbryd svaret efter Drive har modtaget en upload; genkend operationen uden dobbeltupload. Gentag med endnu en træners gemning før genforsøg og med tokenudløb under forløbet. |
| DRIVE05 | Indhold ændres mellem de to metadata-læsninger; læsningen gentages. Ændrede rettigheder, ukendt filskema og filændring under genforbindelse må aldrig skabe en erstatningsfil eller ubetinget gemning. |

Mocket API-adfærd er nyttig i CI, men beviser ikke Drive/CORS/GIS. Reelle resultater skal dokumenteres med syntetiske data og redigerede logs uden credentials. Ingen af ovenstående tests er markeret bestået endnu.

## Primære tekniske kilder

- [GitHub Pages er statisk hosting](https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages).
- [GIS tokenmodel](https://developers.google.com/identity/oauth2/web/guides/use-token-model): samtykke mellem besøg, adgang fra browser og tokenudløb.
- [GIS JavaScript-reference](https://developers.google.com/identity/oauth2/web/reference/js-reference): `expires_in`, `login_hint`, `prompt` og afbrudt popup.
- [GIS codemodel](https://developers.google.com/identity/oauth2/web/guides/use-code-model): den dokumenterede refresh-token-udveksling foregår på en backend og er derfor ikke den valgte løsning.
- [Drive v2 filressource](https://developers.google.com/workspace/drive/api/reference/rest/v2/files), [læsning](https://developers.google.com/workspace/drive/api/reference/rest/v2/files/get) og [opdatering](https://developers.google.com/workspace/drive/api/reference/rest/v2/files/update): etag og konkrete medie-endpoints. Disse referencer alene er ikke bevis for T01.

Kilder undersøgt 25. oktober 2026. Ingen teknisk test eller sportslig afklaring må betegnes gennemført alene på grund af denne dokumentation.
