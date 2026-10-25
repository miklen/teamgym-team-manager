# Design

## UI-overhaling bestilt 25. oktober 2026

Den visuelle konkretisering og kontrol af den nye UI-kandidat findes i [UI-redesign](../../../../docs/ui-redesign.md). Den anvender selvhostet Manrope, en dyb blå navigationsrail på desktop, kølige lyse arbejdsflader og én koboltaccent. Mobil har en fast bundnavigation uden overlap med det rullende arbejdsområde. Lister, tre springomgange og rytmematrix er fortsat de centrale arbejdsstrukturer. Reglementets versionsdetaljer åbnes efter behov.

Dette er brugerens bestilte overhaling før afslutning af changen. Kandidaten afprøves lokalt før commit/push/publicering efter den nye faste arbejdsgang i `AGENTS.md`; brugerens visuelle accept er endnu ikke givet. Beregningspakker og Drive-kontrakt ændres ikke af redesignrunden.

## Context

Se [proposal.md](proposal.md) for formålet. Arbejdsmappen har OpenSpec og lokale skills, men ingen app, tests, pakkefiler eller commits. Det aftalte målrepo er [miklen/teamgym-team-manager](https://github.com/miklen/teamgym-team-manager), som ved gennemgangen var tomt. Lokal Git-tilknytning er oprettet; publicering er endnu ikke bekræftet. Produktet skal hedde TeamGym Team Manager. Dansk er arbejdssprog og produktsprog.

De seks PDF-kilder ligger i `../reglement/`. `../Springgrundlag-Juniorpiger.md`, `../Banespring-Traeneroversigt-Junior-DK.md` og `../Banespring-Udviklingsspor-Juniorpiger.md` er supplerende trænernotater. De er baggrund, ikke en erstatning for de officielle kilder. Parent-filer følger ikke automatisk med et GitHub-checkout; de otte fastlåste PDF’er og manifestet i [reference](reference/README.md) er derfor en del af denne change. Ingen faktisk gymnastliste er forudsat eller skal udledes af notaterne.

Den lokale [frontend-skill](../../../../.agents/skills/frontend-skill/SKILL.md) er læst og skal bruges ved UI-arbejdet. Dens appvejledning er relevant: informationsrig arbejdsflade, tydeligt hierarki, få farver og minimal indramning. Dens marketing-landingssidevejledning er ikke den centrale produktstruktur.

## Goals / Non-Goals

**Goals:**

- Alle ti capabilities leveres sammen. Trin i tasks er teknisk afhængighed og kan ikke bruges som argument for at aflevere en mindre MVP.
- Datamodellen beskriver gymnastens konkrete kunnen, mens regelpakker afgør betydning, værdi og anvendelighed. Regelopdateringer og ændringer i filformat er to forskellige mekanismer.
- Google Drive er autoritativt trænerdatalager. Appen hostes alene på GitHub Pages; browseren bruger Googles API direkte uden nogen backend.
- Google-forbindelsen og arbejdsrumsreference huskes mellem besøg inden for Googles tokengyldighed. Tidligere samtykke genbruges, og nødvendig genforbindelse sker med mindst mulig brugerinteraktion.
- Beregninger er deterministiske, forklarlige og genbruges mellem UI, filvalidering, regelopdateringsvisning og tests.
- Udtrykkelig brugerbeslutning: reglement og version hører til et hold; færdigheder får stabilitet 1–5 i både spring og rytme; manglende vurdering er særskilt.

**Non-Goals:**

- Appserver, Functions, Workers, Apps Script som backend, tokenproxy og separat database.
- Live-samtidsredigering, tilstedeværelsesmarkører, automatisk sammenfletning og offline-synkronisering.
- Produktionspakker for REG og Liga i denne change. Deres senere tilføjelse er aftalt; kontrakten og blandede reglementer testes nu.
- Automatisk vurdering af faktisk udførelse, procentchance udledt af stabilitet, videobedømmelse, fuld E-karakter eller fuld rytmekoreografi/rytmekarakter. Rytmekartotek og fællesnævnere leveres fuldt ud.
- Gruppeelementer (G) i rytme er udtrykkeligt udeladt af brugeren: ingen registrering, stabilitet, deltagergrupper, løft/kast eller analyse. Alle 94 individuelle felter i A1.1 er fortsat med.
- Automatisk optimal holdudtagelse eller en global optimering af C+D+E. Konkrete muligheder for tillæg er en del af leverancen.
- Et system til officiel tilmelding, licenskontrol, fuld aldersberettigelse, træneradministration eller redigering af eksisterende fælles trænerdokumenter.

Disse grænser fjerner ingen aftalte funktioner. Stabilitet erstatter tidligere foreslåede statusfelter; der skal ikke bygges en skjult under-indlæring/stabil/konkurrenceklar-model ved siden af.

## Decisions

### 1. Statisk app på GitHub Pages

Foreslået teknik er React + TypeScript + Vite, fælles TypeScript-domænemoduler, skemavalidering, Vitest og Playwright. Node.js bruges kun ved lokal udvikling, test og bygning; det er ingen driftsafhængighed. Det tidligere forslag om Fastify/serversessioner er erstattet af brugerens beslutning: kun GitHub Pages og ingen backend.

```text
apps/web          Navigation, formularer, matrix, planlaegger, kladde
packages/domain   Identiteter, filskema, medlemskab, stabilitet
packages/rules    Regelregistry, pakker, evalueringskontrakt, fixtures
packages/drive    Browseradapter, GIS/Picker, lokal forbindelse, betinget upload
sources/          Kildemanifest, reproducerbare kildefiler, kontrolnoter
tests/e2e         Syntetiske fulde brugerforloeb og visuel kontrol
.github/workflows Checks, statisk byg og Pages-publicering
```

`domain` og `rules` må ikke importere Google eller UI. Drive-adapteren adskiller Google-API, browserlager, klokke og netværk, så fejlforløb kan afprøves uden credentials. React er et implementeringsvalg, ikke en regelafhængighed. CSS-variabler og almindelig layout-CSS giver et samlet designsystem.

Produktionsbase er `/teamgym-team-manager/` og startadressen `https://miklen.github.io/teamgym-team-manager/`. Hash-routing gør delte arbejdsrums-/holdlinks og genindlæsning mulige uden Pages-rewrites. GitHub Actions bygger og deployer det statiske output til Pages efter checks. Workflowet skal have præcise Pages-/OIDC-rettigheder og deployment-concurrency. Ingen brugercredentials eller private gymnastdata må indgå i artifacts. Klient-id, projektnummer og referrer-/API-begrænset browsernøgle er offentlig buildkonfiguration; der findes ingen client secret i appen.

En backend eller ekstra database er ikke en implementeringsmulighed i denne change. Den tekniske kontrakt, primære kilder og konkrete acceptforløb er samlet i [reference/github-pages-drive.md](reference/github-pages-drive.md).

### 2. Filformat og identiteter

Arbejdsrummet serialiseres som en JSON-fil, fx `teamgym-team-manager.json`. Filnavnet er til genkendelse; Google-fil-id og `workspaceId` afgør identiteten. Filens `schemaVersion` er uafhængig af regelpakkernes versioner. Gyldige ufuldstændige kladder er tilladt; strukturelt ugyldig JSON er ikke.

| Data | Centrale felter og invariants |
| --- | --- |
| Workspace | `schemaVersion`, `workspaceId`, `revision`, `updatedAt`, `recentOperations`, hold, gymnaster, færdigheder, vurderinger og planer |
| Team | stabilt id, navn, aktiv/arkiveret, `rulesetBinding` med reglements-id, pakkeversion, aldersgruppe, holdtype |
| Athlete | stabilt id, navn, valgfrit felt til at skelne navnesammenfald, team-id eller null, aktiv/arkiveret; eventuel relevant mixkategori er eksplicit, aldrig udledt af navn |
| SkillDefinition | stabilt internt id, disciplin og præcis struktureret udførelse; officiel kode/værdi kommer fra regelkoblingen |
| AthleteSkill | gymnast-id, skill-id, `stability` som heltal 1–5 eller null, vurderingsdato, opdateringsdato, valgfri note og evt. konkret forbindelsesbekræftelse |
| RoutinePlan | id, team-id, regelbindingens fingerprint og tre omgange for hver af de to discipliner; én aktiv plan pr. hold er tilstrækkelig |
| Round | stabilt id, disciplin, plads i rækkefølgen, liste af pladser; holdomgang udledes af førstepladsen, ikke en uafhængig modstridende boolean |
| RoundEntry | stabilt id, gymnast-id, athlete-skill-id, tællende/ekstra, udførelsesrækkefølge; midlertidigt tomt springvalg tillades som kladde |

Et holdmedlemskab ligger ét sted på gymnasten; særskilte medlemslister må ikke kunne komme ud af sync. Én gymnast kan være på ét aktivt hold ad gangen eller uden hold. Hvert hold kan have flere gymnaster end de seks tællende i en omgang. Gymnaster kan deltage i flere forskellige omgange.

Katalogets identitet indeholder rotation, kropsposition pr. relevant rotation, skruer og skruefordeling, redskabsfamilie og udførelsesvarianter. At en dobbeltserie får D fra laveste kropsposition betyder ikke, at de øvrige kropspositioner kan kasseres ved identitetssammenligning. En baneserie indeholder ordnet elementliste og forbindelsesbeskrivelse. Identiteten af en serie med gentaget flik er forskellig fra serien uden den ekstra flik, selv om D kan være ens.

Alias er søgeord, ikke nye identiteter. Regelspecifik ækvivalens normaliserer relevante Tsukahara/Kasamatsu-varianter. Spejling i rytme behandles efter pakkens krav og må ikke automatisk gøre alle afsæts-/landingsvarianter ækvivalente.

Arkivering bevarer referencer. Flyttes en anvendt gymnast til et andet hold, vises den gamle omgangsplads som ugyldig, indtil træneren retter den. Ingen automatisk udskiftning eller sletning af andre registreringer. Datafilens strukturelle validering accepterer sådanne kendte planlægningsmangler med diagnostik; den accepterer ikke ødelagte identiteter eller ufortolkbare felter.

### 3. Google-adgang som huskes mellem besøg

Brug Google Identity Services' dokumenterede browser-tokenmodel og personlig adgang, først med `drive.file`. Google Picker giver konkret filautorisation; mappevalg alene giver ikke adgang til alle eksisterende børn. Nye arbejdsrum oprettes i den valgte skrivbare mappe. Andre trænere vælger samme fil med egen konto; et internt link er ikke en adgangstilladelse. En almindelig delt mappe er den primære arbejdsgang, ikke et krav om Workspace Shared Drive. Deling administreres i Drive.

Husk forbindelse i en versionsmærket IndexedDB-post med access token, konto, scopes, `expiresAt` fra Googles `expires_in` og seneste filreference pr. konto. Brugeren har udtrykkeligt ønsket bevaret adgang mellem sessions. Denne afgrænsede lokale tokenlagring erstatter det tidligere forbud mod enhver vedvarende browsertoken. Ingen refresh token eller client secret må gemmes. Kode på samme origin kan læse browserlager; tokenet skal derfor holdes uden for URL/logs/Drive/repo, og UI-input og tredjepartsscripts skal håndteres derefter. Repo-stier er ikke en sikkerhedsgrænse mellem Pages-sites på samme origin.

Ved genåbning genbruges et stadig gyldigt token med kort udløbsmargin efter kontokontrol, og den huskede fil genåbnes med aktuelle rettigheder/version uden nyt Picker-valg. Ved udløb/401 slettes tokenet, men kontohint og filreference bevares. Træneren fortsætter med én handling: »Fortsæt med Google«, GIS `requestAccessToken` fra brugerens klik med kendt `login_hint`, `include_granted_scopes:true` og `prompt:''`. Appen må ikke tvinge `consent` eller `select_account` ved hvert besøg. Google kan stadig kræve login eller nyt samtykke ved logout, tilbagekaldelse eller sikkerhedskontrol. Tydelig besked ved blokeret/lukket popup, ingen gentaget automatisk popup.

Tidligere samtykke og en Google-loginsession er ikke et permanent Drive-access token. GIS-browsermodellen udsteder ikke et refresh token til automatisk fornyelse. **Ubegrænset tavs adgang mellem vilkårligt lange sessions er derfor ikke garanteret.** Hverken skjulte iframes, en client secret i browseren eller en skjult proxy må bruges til at foregive den egenskab. IndexedDB utilgængelig giver en synlig hukommelsesbaseret forbindelse, ikke falsk vedvarende login.

»Afbryd forbindelse« rydder lokalt gemt adgang og aktive arbejdsdata efter håndtering af ugemt arbejde og meddeles andre appfaner. Tilbagekald Google-adgang er en separat handling. Kontoskift kræver egen autorisation og må ikke genbruge tidligere kontos token eller arbejdsdata. Læseadgang giver læsetilstand; tokenudløb og tabt adgang bevarer den aktuelle kladde. Ingen vedvarende cache af gymnastdata følger med husket login.

Google OAuth JavaScript-origin registreres som `https://miklen.github.io`, separat fra repo-basen. Lokal origin, Picker-projektnummer, browsernøglens restriktioner og consent-/publiceringsstatus dokumenteres. Browseren bruger samme Google-projekt/konto til Picker og Drive. En GIS-identitetsmarkør eller login-hint er aldrig bevis for filrettighed.

### 4. Betinget Drive-gemning fra browseren

Den eksisterende konfliktkontrakt bevares: højst én af to konkurrerende gemninger fra samme basis må lykkes. En lokal browserkø forebygger dobbeltklik, men koordinerer ikke to computere. En dobbeltlæsning eller `files.version`-kontrol før ubetinget upload opfylder ikke kravet. Drive skal selv kontrollere en revisionsbetingelse atomisk med indholdsopdateringen.

**T01 afprøves med den tilgængelige konto; to-konto-delen er udskudt af brugeren:** afprøv direkte browserbaseret Drive v2 `files.get`/`etag` og media-`files.update` med `If-Match` fra den rigtige Pages-origin. De konkrete endpoints, input og tests DRIVE01–DRIVE05 står i [reference/github-pages-drive.md](reference/github-pages-drive.md). V2-filressourcen dokumenterer etag; det er ikke bevis for, at den valgte uploadtype/CORS faktisk håndhæver betingelsen. Forventet gammel-basis-afvisning er412. Der er ikke kørt rigtig Drive-skrivetest i planfasen. Efter [brugerbeslutningen 25. oktober 2026](../../../../docs/testbeslutning-2026-10-25.md) fortsætter implementering og første publicering med én konto, og brugeren udfører live test med trænerteamets konti i produktion. Verifikation beskrives efter faktisk evidens; udskudte tests er ikke beståede. Ingen serverfallback.

Konsistent indlæsning: metadata før, JSON-indhold, metadata efter; gentag ved ændret etag/version. Basis indeholder opaque etag, versionsstreng, workspace-revision og hash. Før gemning kontrolleres aktuelle rettigheder og basis igen, hvorefter browseren validerer/serialiserer snapshot og udfører den atomisk betingede upload på den indlæste basis-etag. Versionsstrenge må ikke konverteres til JavaScript-tal eller bruges som opdigtet ETag. Bevar fil-id, mappe og deling.

Et operations-id, deterministisk hash af brugerindhold og afgrænset historik gør udfaldet genkendeligt. Afledte revisions-/operationsfelter indgår ikke i deres egen payloadHash. Ved ukendt uploadsvar genlæses konsistent: er operationen gennemført, vises det; er en senere revision gemt af en anden, får den gamle kladde ikke dens basis. Ingen blind gen-upload.412 giver konflikt med bevaret kladde/eksport;401 giver genforbindelse og ny versionskontrol; rettighedstab/netværksfejl bevarer arbejdet. Basis, afsendt snapshot og fortsat kladde er separate; sent svar må aldrig kassere nye lokale ændringer.

Manglende to-konto-evidens håndteres efter brugerens testbeslutning og blokerer ikke videre implementering eller første publicering. Hvis en faktisk T01-test påviser, at en gammel betingelse accepteres og overskriver nyere data, er den defekte skrivevej blokeret. Rapportér den konkrete begrænsning; indfør ikke backend, ubetinget upload eller låsefiler. Mock-test alene er ikke bevis for Drive/CORS. Appen leverer fortsat ingen live-redigering eller automatisk merge.

Konfliktdialogen tilbyder lokal JSON-kopi, gennemgang af kladden eller bevidst indlæsning af nyeste fil. Ingen »overskriv alligevel«. Ugemt arbejde advares ved navigation/lukning, hvor browseren understøtter det. Eksterne filændringer kontrolleres ved åbning, genaktivering og gemning og må ikke skabe en tom erstatningsfil. Vedvarende login er ikke offline-synkronisering.

### 5. Regelpakker og versionssikker beregning

Registry-nøglen er `(rulesetId, packageVersion)`. Holdets binding indeholder derudover profil for alder og holdtype. Første produktpakke bygger på det lokale DK/REG-reglement version 1.4 og relevante DK-bilag; kun DK-profiler udbydes. U14, junior og senior understøttes efter de officielle DK-profiler; juniorpiger er standard i første opsætning. U11 må ikke vises som gyldig DK-profil på baggrund af REG-tabeller.

En pakke indeholder manifest, versionsbundne kildehenvisninger/checksummer, profilkrav, katalogkoblinger, basisværdier, skruetillæg, ækvivalensregler, satsdata, tvivlspunkter og deterministiske beregningsfunktioner. Rene tabeller ændres som data. Ændret algoritme får en ny modulversion; et nyt tal må ikke kræve spredte `if DK`-grene i komponenter. Drive-filen indeholder referencer, ikke eksekverbar regelkode.

Den fælles evalueringskontrakt leverer:

- katalog og anvendelighed for en holdprofil;
- element-/serieidentitet, forbindelse og gyldighed;
- D-beregning med bidrag;
- C-forhold med beløb, dækning og berørte valg;
- dokumenterede muligheder for hvert tillæg;
- rytmeækvivalens, momentkrav og værdi;
- begrænsninger, uafklarede regler og ændringsbeskrivelse.

Et resultat har `status` (kendt, ufuldstændigt, ugyldigt, uafklaret), eksakte bidrag, referencer til kilde og berørte identiteter. Ukendt værdi er ikke nul. UI kan vise kendte delresultater og samtidig uafklaret samlet C. Cache-nøgler indeholder regelpakke, holdprofil og relevante datarevisioner; skift af hold må ikke vise en anden pakkes cache.

Datavalideringen skal bevare en allerede indlæst ukendt regelbinding, så kendte andre hold fortsat kan gemmes uden at slette eller omskrive det ukendte holds data. Manglende pakke giver manglende regelberegning, ikke tilladelse til at vælge en anden version automatisk eller til at kassere fremmede data.

Tidligere pakkeindhold og algoritmeversioner bevares og testes. Ukendt version i en indlæst fil giver visning uden autoritativ beregning for det berørte hold, ikke fallback. En testspecifik pakke med andre værdier, deltagerkrav og rytmeækvivalenser beviser, at forskelligt reglement pr. hold virker hele vejen. Den må ikke optræde som en godkendt REG-/Liga-pakke i produktet.

Ved eksplicit versionsskift beregnes før/efter på samme data. Vis forskelle i D/C, gyldige færdigheder, rytmefællesnævnere og nødvendige revurderinger. Annullering ændrer intet. Accept ændrer holdbinding og planens fingerprint samlet i kladden. Andre hold er uændrede. Kode-/navne-/værdiændringer bevarer færdigheds-id og stabilitet; ændret udførelseskrav giver en konkret revurderingsmarkering.

### 6. Springbygger og kildebaseret beregning

Færdighedsvælgeren kombinerer søgning i verificerede standardserier med en struktureret bygger. Vis retning, position, rotation og skrue tydeligt; daglige navne er supplerende søgeord. Der må ikke kun leveres et demonstrationsudvalg. Alle kildens basiselementer, relevante varianter og formelbaserede tillæg skal kunne repræsenteres. Ukendte eller forbudte varianter vises som sådanne.

Forbindelsesvalidering er et særskilt lag. Kataloget kan beskrive sikre forbindelsestyper og geometriske begrænsninger, men må ikke automatisk krydsprodukt-generere »beherskede« serier. Træneren registrerer hele forbindelsen på gymnasten. En dokumenteret trænerbekræftelse kan godkende en praktisk specialforbindelse med gyldige elementer, men kan ikke gøre et forbudt element lovligt eller løse en uafklaret regelværdi.

D beregnes med eksakt decimal-/rationel repræsentation. Elementpoint kan lagres som heltals-tusindedele, og gennemsnit bibeholder tæller/nævner; JSON skal ikke serialisere binære afrundingsfejl som sandhed. Stabilitetsgennemsnit formateres til én decimal, mens sværhed og C vises med relevant præcision og udfoldelig mellemregning. Efter pkt. 4.6 er DK-panelværdien floor(200*x)/200, dvs. nedrunding til nærmeste 0,005 efter den eksakte disciplinberegning. Rå værdi og panelværdi skal skelnes; C+D må ikke fejlagtigt mærkes som fuld disciplinkarakter.

Banens værdigrundlag: op til tre forskellige elementer med højest D i hele serien, ikke alle forekomster. Gentagen flik giver ikke ekstra D. Enkelt- og dobbelttillæg for skruer følger kildeformlen; eksempelvis rondat-flik-strakt helskrue giver 0,80 og kraft-strakt halvskrue 0,60 under det undersøgte grundlag. Trampets redskabsspring behandles som komplette spring.

Holdomgang afviger ved præcis identitet, ikke blot D. Ved fem ens og én anden nulstilles den afvigende baneseries D; C analyseres separat. Uafklaret flertal/stemmelighed giver diagnostik frem for et vilkårligt flertal. Understøttelse af fuld faktisk bedømmelse ved fald, støtte og underrotation er ikke aftalt; planens forudsætning om den registrerede udførelse skal være tydelig.

### 7. Komposition og konkrete muligheder

Vurder først den faktiske plan pr. disciplin over alle tre omgange. Separér regler om holdomgang, gentagelse, retning/redskab, rækkefølge, tillæg og observation. Regler om enkeltelement, fuld serie, omgang og disciplin må ikke blandes i samme tællefunktion.

Gentagelseskontrol arbejder med pakkens normaliserede serier/elementer og forekomster mellem omgange. Den omgang med flest forekomster er fri efter kildens regel; dokumentér tælleeksempler og enhed i fixtures. Gentagelse inde i en baneserie er en anden regel. Rækkefølge sammenligner rotationskategori før D og skal også medtage ekstra gymnaster i det omfang kilden kræver. Retningskrav vurderer den nærmeste omgang efter kilden, ikke kun en boolean for, at et forlæns element findes et sted.

Tillæg vises individuelt som »valgt«, »kan opnås med holdet« og »reglementets maksimum«. Et mulighedsresultat skal have en konkret vidneopstilling: gyldige, registrerede færdigheder, forskellige gymnaster inden for en omgang, korrekt antal/holdprofil og gyldig første holdomgang. Andre C-konsekvenser må være synlige trade-offs; et tillæg må ikke loves netto, hvis det skaber et nyt fradrag. Stabilitet 1 er stadig en registreret mulighed, men skal fremhæves, ikke filtreres væk som en skjult standard.

Søg deterministisk i holdets kandidater pr. tillæg: gruppér ens holdomgangsserier, vælg lovlige tællende gymnaster med nødvendige profilkvoter, udfyld øvrige pladser fra registrerede færdigheder og evaluér hele vidneopstillingen med samme regelpakke. Tællende maksimum er lille, og kriterier kan grupperes efter signatur/egenskaber. Identiske kandidater kan reduceres, men ikke ved at kassere variant-, gentagelses- eller stabilitetsinformation. Vis mindst én opstilling, der beviser den angivne opnåelige værdi. Hvis søgningen begrænses af beregningsbudget, skal resultatet betegnes som en dokumenteret mulighed/undergrænse, ikke som et bevist maksimum. Det teoretiske regelmaksimum er altid særskilt.

To individuelle tillægsmuligheder må ikke summeres som samlet opnåelig C uden et fælles vidne. Ingen uregistreret forbindelse, ikke-tilladt variant eller uafklaret D må skabe en »sikker« mulighed. Vis foreslåede ændringer med D, stabilitet og nye/frigjorte C-forhold; anvend kun efter trænerens valg.

Flow vises som kræver observation. Tomme pladser giver manglende planinformation; de er ikke automatisk gennemløb eller observerede E-fradrag. Analyseoversigten skal tydeligt sige, hvilke planbaserede fradrag der er kendte, og hvilke forhold den ikke kan afgøre.

### 8. Stabilitet og rytmefællesnævnere

Skalaen er den aftalte 1–5 med ankre fra specifikationen. Et `AthleteSkill` kan eksistere med `stability=null`; ingen registrering er en anden tilstand. Vurderingen vedrører forventet udførelse i den konkrete færdighed og de angivne konkurrenceforhold, ikke en statistisk estimator. Dato og valgfri note giver kontekst uden obligatorisk forsøgslog eller videoregistrering.

For en springomgang beregnes gennemsnit/minimum/antal 1–2 på de tællende valgte færdigheder. Vis også vurderet antal, udfyldte pladser og krævede pladser. Ekstra gymnaster har egen synlig liste. Fem femmere og én ener giver 4,3, minimum 1 og én lav vurdering. Fem femmere og én null giver 5,0 blandt fem vurderede og ufuldstændig 5/6; det må ikke få samme samlede positive præsentation som seks vurderede femmere. Ingen procentchance og ingen D-multiplikator.

Rytmematricen omfatter kun individuelle momenter; G indgår hverken i katalog, filter, dækning eller stabilitet. De to forskellige DB804-momenter i A1.1 bevarer deres trykte kode, men har forskellige interne id’er. Kategori-/række-/cellekrav og undtagelser følger [rytmekravene](reference/rhythm-requirements.md). Rytmematricens rækker er præcise momentvarianter, kolonner er holdets aktuelle aktive gymnaster. Celler viser registreret vurdering, registreret/ikke vurderet eller manglende registrering. Vis kategori, kode, regelværdi og krav i række/inspektør. Fælles betyder, at alle har en udførelsesvariant, der kan opfylde det samme krav. Filter »alle mindst 4« vurderer hver celle, ikke gennemsnittet. Et tomt hold har ingen fællesnævner.

Tilføjelse/fjernelse af et holdmedlem genberegner straks matricen i kladden, så holdsammensætning kan undersøges før gemning. Sammenligning viser også delvist fælles momenter med navnene på manglende gymnaster. Individuelle registreringer dokumenterer ikke synkron udførelse eller fuld rytmekarakter. Senere regelpakker kan genbruge færdighedsidentitet, men skal levere deres egne momentkrav og kodekoblinger.

### 9. Visuel retning og arbejdsgange

**Visuel tese:** En rolig, præcis trænerarbejdsplads med varme lyse flader, mørk læsbar typografi og en dyb blågrøn accent, hvor gymnasternes navne og konkrete valg er omdrejningspunktet.

**Indholdsplan:** Appskal med produktnavn, arbejdsrum/gemning og kompakt navigation; primær arbejdsflade med kartotek eller hold; sekundær inspektør til færdighedsvalg og regelforklaring. Ingen hero foran værktøjet. Hver side har én hovedopgave og korte handlingsrettede tekster.

**Interaktionstese:** Kort glidende åbning af inspektør, sammenhængende flytning af en gymnast/omgang og diskret fremhævelse af ændrede analyseværdier. Respektér reduceret bevægelse, bevaret fokus og skærmlæsermeddelelser. Animation er feedback på handlinger, ikke dekoration eller ventetid.

| Arbejdsflade | Primært indhold | Sekundær handling |
| --- | --- | --- |
| Forbind arbejdsrum | Google-login, opret/vælg fil og tydelig adgang | Forbind igen og hjælp til mappe-/filvalg |
| Gymnaster | Søgbar liste, holdfilter, uden hold og færdighedsdækning | Gymnastinspektør med bane, trampet, rytme og stabilitet |
| Hold | Holdliste, profil, medlemmer og anvendte regler | Redigér medlemskab med levende rytmeoverblik |
| Springopstilling | Bane/trampet, tre tydelige omgangskolonner, navne, færdigheder og rækkefølge | Samlet D/C/stabilitet og udfoldelige forklaringer |
| Rytme | Filtrerbar matrix, fælles/alle, stabilitetsgrænse og dækning | Vis mangler og ret individuel registrering |
| Reglement | Valgt pakke/version/profil, kilder og tilgængelige opdateringer | Konsekvensvisning og eksplicit skift |

Desktop kan vise tre omgange ved siden af hinanden og en analyseinspektør. Tablet har disciplin-/omgangsvælger og plads til de aktive navne og analyser. Mobil viser én omgang eller momentvisning ad gangen; matrix kan scrolle med fastholdt gymnast-/momentkontekst og tilbyde en læsbar listevisning. Alle handlinger skal findes uden hover. Flyt op/ned og omgangsflytning skal kunne bruges uden drag-and-drop.

Brug én typografifamilie som udgangspunkt, tabellariske tal, konsekvente kolonnebredder og linjer/afstand frem for bokse om alle områder. Status bruger tal, ord og eventuelt symboler; fejl-/advarselsfarver er semantiske, ikke konkurrerende brandaccenter. Tjek kontrast, fokusrækkefølge, zoom, 44 px berøringsmål hvor relevant og reduceret bevægelse. UI skal kontrolleres ved mindst 1440×900, 1024×768, 768×1024 og 390×844, med syntetiske realistiske navnelængder og mindst 20 gymnaster i overbliksdata.

### 10. Kildegrundlag og eksplicitte regeluklarheder

Følgende lokale bytes er identificeret. Hovedreglementet har version 1.4, vedtaget august 2026; en hjemmesides upload-/opdateringsdato er ikke nødvendigvis dokumentets egen regeludgave.

| Lokal fil i `../reglement/` | SHA-256 |
| --- | --- |
| `Bedoemmelsesreglement-DK-REG-1.pdf` | `102DB1E201E44056E61212DEB2F246EF230A5667257241065183FCD853264E16` |
| `A3-Appendix-A3.1-Bane-Basisvaerdier.pdf` | `0F211F746BB146D33334A1B8412ACE9EC9B537BDCAD8ACF42D9BFE5225C3CA36` |
| `A4-Appendix-A4-Trampet-Basisvaerdier.pdf` | `EE5E95E0C626372ED70628383116D99F82DF296B48B5B0F90C64264778CC0733` |
| `Appendix-A5-Bane-Trampet-Genkendelse-af-elementer.pdf` | `4372F24BDD3DF2B86EFCE2CC6CC89E69E6260898F90217E093C090E277C3934B` |
| `Appendix-A6-Bane-Trampet-Generelle-fejl-og-fradrag.pdf` | `E7B0727CD693FCDE11911965701AB5CC9957FBB2A9C0658249CA5908138E0570` |
| `251204-Spoergsmaal-og-svar-til-Teamgym-reglementer.pdf` | `6BC1AF9B8E7A1B7135D41B646653252A2222EEC1B55A71B0D192BA18F4DE833E` |

Officielle indgange, gennemgået 25. oktober 2026:

- [Samlet reglementoversigt](https://gymdanmark.dk/konkurrence-teamgym/).
- [Hovedreglement DK/REG](https://gymdanmark.dk/wp-content/uploads/2026/10/Bedoemmelsesreglement-DK-REG-1.pdf), især 9.1–9.3 og 10.1–10.3. Lokale PDF og notater er grundlaget for den planlagte DK-pakke.
- [A3 baneværdier](https://gymdanmark.dk/wp-content/uploads/2025/07/A3-Appendix-A3.1-Bane-Basisvaerdier.pdf), [A4 trampetværdier](https://gymdanmark.dk/wp-content/uploads/2025/07/A4-Appendix-A4-Trampet-Basisvaerdier.pdf), [A5 genkendelse](https://gymdanmark.dk/wp-content/uploads/2026/09/Appendix-A5-Bane-Trampet-Genkendelse-af-elementer.pdf), [A6 fejl/fradrag](https://gymdanmark.dk/wp-content/uploads/2026/09/Appendix-A6-Bane-Trampet-Generelle-fejl-og-fradrag.pdf) og [spørgsmål/svar](https://gymdanmark.dk/wp-content/uploads/2025/12/251204-Spoergsmaal-og-svar-til-Teamgym-reglementer.pdf).
- [A1.1 rytme DK](https://gymdanmark.dk/wp-content/uploads/2026/09/Appendix-A1.1-Rytme-Oversigt-over-svaerheder-DK.pdf), 13 sider, er hentet, hashregistreret og visuelt gennemgået i sin helhed. [Dækningslisten](reference/rhythm-catalog.csv) har 94 individuelle felter; fire G-felter er bevidst udeladt. Implementeringen skal bevare koblingen mellem kode, figur, variant, værdi og de samlede udførelseskrav.
- [Teknisk Regulativ sæson 26/27](https://gymdanmark.dk/wp-content/uploads/2026/08/Teknisk-Regulativ-saeson-26-27.pdf), afsnit 1.3 på PDF-side 4 om DK-aldersgrupper. Det er hentet fra det officielle link og registreret med hash i [manifestet](reference/source-manifest.json).
- [Google-scopes](https://developers.google.com/workspace/drive/api/guides/api-specific-auth), [web-Picker](https://developers.google.com/workspace/drive/picker/guides/web-picker), [GIS browsermodel](https://developers.google.com/identity/oauth2/web/guides/use-token-model), [filmetadata/version](https://developers.google.com/workspace/drive/api/reference/rest/v3/files) og [filopdatering](https://developers.google.com/workspace/drive/api/reference/rest/v3/files/update) understøtter adgangs- og filmodellen. Den valgte statiske model kræver den direkte atomiske Drive-opdatering i T01; den er endnu ikke verificeret. Kilder og afprøvning er beskrevet i [hosting-/Drive-kontrakten](reference/github-pages-drive.md).

Det medfølgende kildemanifest fastlåser udgave, kontroldato, URL, hash og kontrolmetode; regelmatrixen angiver relevante punkter og status. Implementeringen skal bevare denne sporbarhed. Nyere filer må ikke stiltiende erstatte disse bytes. Ved forskel mellem lokal og hentet udgave dokumenteres forskellen som et muligt nyt kilde-/pakkegrundlag.

| Kendt uklarhed | Besluttet håndtering i første leverance |
| --- | --- |
| Bane 9.2.3.3: ordlyd giver 0,10 pr. forskelligt element, eksempel giver 0,10 mindre pr. serie | Beregn og vis begge spor på berørte opstillinger; C er uafklaret. Ingen skjult standardfortolkning. Ny dokumenteret afklaring kræver ny pakkeversion. |
| A4 overslag-salto hoftebøjet ½: tabel 1,20 mod generel formel 1,10 | Vis tvisten på præcis denne variant og påvirket D/total/potentiale; øvrige sikre værdier fungerer. |
| Hovedtekst mod opsummering om manglende reaktion i farlige situationer | Ingen automatisk E-/overdommerberegning; vis kilden som uafklaret hvis den omtales. |
| REG énhåndskontakt på springbord: forskellige angivelser | Registrér som kendt fremtidig kildekonflikt; opfind ikke en REG-pakke eller en værdi nu. |

Der sendes ikke spørgsmål til dommere eller andre på brugerens vegne. Regeltvivl er allerede givet en testbar produktadfærd og er ikke en blokering, som implementeringsagenten kan bruge til at undlade hele C-oversigten.

### 11. Test- og acceptstrategi

Hver capability har normative scenarier i [specs](specs/). Tests skal afprøve domænets konsekvenser, ikke kun spejle en beregningsfunktions egne tabeller.

#### Regelkontrol: status og obligatorisk facitgrundlag

Det konkrete forberedelsesarbejde er afleveret i [reference/README.md](reference/README.md), ikke udskudt til en generisk researchopgave:

- Otte PDF'er med fastlåste bytes, officielle links og SHA-256 i [manifestet](reference/source-manifest.json).
- Visuelt kontrollerede A3/A4-tabeller og alle A1.1-sider; [103 springkildeposter](reference/spring-source-catalog.csv) (83 tilladte, 19 forbudte,én uafklaret) og [94 individuelle rytmefelter](reference/rhythm-catalog.csv). Gruppeelementer er bevidst udeladt. CSV er en dækningsliste, ikke en erstatning for samlede udførelseskrav.
- [Regelmatrix](reference/rule-matrix.md) med inputunivers, formler, tælleenheder, undtagelser, status og kilder; [rytmekrav](reference/rhythm-requirements.md) med generelle tolerancer og særlige variantkrav.
- [77 faste facitcases](reference/fixtures.json), herunder D01–D13, C01–C11, grænser for skruetillæg, nedrunding, identitet, retning, rytme/stabilitet og uafklarede resultater. De er håndberegnede delresultater uden produktionsimport, ikke allerede beståede tests.
- [Seks konkrete spørgsmål Q01–Q06](reference/questions-for-judges.md): baneelementtillæg, A4-værdi, delvise gentagelser/skiftende besætning, blandede trampetredskabsomgange, flertalsgrænser og optælling af rækkefølgefejl. K01/K02 er særskilte katalogbemærkninger, som ikke blokerer kendte individuelle momentfelter.

Kodeagenten skal følge matrixens K/U/O/X-status og afgrænsninger. Kendte delresultater beregnes; en ukendt optælling må ikke erstattes af vilkårlige nabofejl/inversioner, og banens nærmeste-omgangsformel må ikke stiltiende overføres til trampet. C-berettigelse må ikke filtreres gennem justeret D>0, og C-elementgrundlag må ikke arve D's top-tre-begrænsning. De relevante krav er normative i specs.

Kildernes reelle uklarheder er fortsat ubesvarede. Ingen er kontaktet, og ingen ekstern dommergennemgang er udført. Samme agents genlæsning, visuel tabelkontrol og håndregning er ikke uafhængig faglig godkendelse. Hele pakken kan derfor ikke erklæres entydigt korrekt på alle områder. Implementeringen skal stadig levere hele det aftalte produkt med eksplicit uafklaret adfærd på de berørte punkter; en officiel afklaring indføres som en ny dokumenteret pakkeversion.

OpenSpec-status og `validate --strict` bekræfter planstruktur. De beviser ikke regler eller fremtidig kode. Ved implementering skal de faste facitdata omsættes til eksekverbare tests, hvert kildekrav kobles til implementering/test, alle katalogfelter kontrolleres efter import, og de uafklarede cases testes som uafklarede. Ingen forventningsværdi må genereres fra produktionspakken selv.

For den fremtidige Liga-pakke er [Appendix A8](https://gymdanmark.dk/wp-content/uploads/2026/10/Appendix-A8-Brug-af-CoP-i-nationale-konkurrencer-1.pdf) nu også inspiceret: Liga bruger CoP med nationale undtagelser. Det må derfor ikke senere modelleres som blot nye satser oven på DK-reglerne. A8's substitutionsliste og CoP-udgave skal versionsbindes separat; den aktuelle change leverer fortsat ikke produktions-Liga.

- Uafhængigt udregnede fixtures for bane/trampet, holdomgangsafvigelse, gentagelser, enkelt/dobbelt-rækkefølge, nærmeste retnings-/redskabsomgang og DK-aldersgrænser for skruetillæg.
- Egenskaber: ekstra identisk flik ændrer ikke D; samme D er ikke samme identitet; én ændring på 0,10 påvirker disciplin-D med 0,10/3; C er aldrig negativ; stabilitet ændrer aldrig officielle point.
- Versionskontrakt: gammel og ny pakke samtidig, uændrede gamle fixtures, ukendt pakke uden fallback, afbrudt/anvendt versionsskift og ændrede udførelseskrav.
- Filkontrakt og browser-/Drive-integration: ugyldig/nyere fil, læserettighed, tokenudløb, tabt adgang, to samtidige gemninger, netværksfejl før/efter upload, idempotent genforsøg og ugyldige referencer.
- Rytme/stabilitet: 8/10 er ikke alle; gennemsnit over 4 opfylder ikke »alle mindst 4«; null er ikke 1; tomt hold, manglende variant, tilladt spejling og en gymnast tilføjet i kladden.
- Fuldt browserforløb med mindst to hold og begge discipliner, inklusive manuel konflikt og læsetilstand, samt visuel kontrol/tastatur/berøring på de aftalte skærmstørrelser.
- Rigtig Google-integration afprøves nu med den tilgængelige konto og en særskilt testmappe. Efter brugerens beslutning udfører brugeren selv live test med trænerteamets konti i produktion. Testadaptere er egnede til CI, men en mock alene beviser ikke filautorisation og deling mellem brugere. Testen må ikke redigere trænerteamets eksisterende fælles dokumenter.

Leverancen er først færdig, når alle ti capabilities og det fulde brugerforløb er verificeret, katalogdækning og regeltvivl er dokumenteret, Google-konfiguration kan reproduceres og den visuelle kontrol er gennemført. Tilgængelige driftsmiljøer/Google-testkonti skal oplyses ærligt; manglende ekstern verifikation markeres som udestående, ikke som bestået.

Sporbarhed fra det aftalte omfang til udførelse:

| Capability | Opgavegrupper | Nøglebevis ved accept |
| --- | --- | --- |
| `drive-workspace` | 3, 10, 11, 13, 17 | To konti bruger samme fil, konflikt og genforsøg uden tab |
| `team-roster` | 3, 13 | Flere hold, én medlemsbinding, flytning uden tab af færdigheder |
| `skill-catalog` | 2, 4, 5, 13 | Fuld kildedækning, strukturerede varianter og komplette forbindelser |
| `stability-assessment` | 3, 13, 14, 15 | 1–5/null, 4,3/minimum 1 og ufuldstændig 5/6 |
| `routine-planning` | 3, 14 | Alle seks omgange, seks tællende, ekstra og første holdomgang |
| `difficulty-scoring` | 6, 14 | Uafhængige D-fixtures, identitet og korrekt disciplinmiddel |
| `composition-analysis` | 7, 8, 14 | C-regler, tvivl, konkrete potentialer og synlige trade-offs |
| `rhythm-commonality` | 5, 9, 15 | Fuld rytmematrix, 8/10, præcise varianter og alle mindst 4 |
| `ruleset-versioning` | 4, 16 | To pakker samtidig, bevarede gamle resultater og konsekvensvisning |
| `coach-workspace` | 12–17 | Sammenhængende dansk UI, alle skærmstørrelser og tilgængelighed |

## Risks / Trade-offs

- [En enkelt fælles fil gør konflikter bredere end den ændrede gymnast] -> Bevidst valgt enkel model; beskyt hele filrevisionen og bevar kladden, frem for at bygge uønsket live-merge.
- [Direkte fælles filskrivning kræver atomisk Drive-betingelse] -> T01 afprøves med rigtig media-upload/browser-CORS, og den udskudte to-konto-verifikation udføres af brugeren i produktion. Ingen ubetinget fallback eller skjult backend; en påvist defekt skrivevej stoppes.
- [Husket Google-adgang kan udløbe] -> Genbrug gyldig lokalt gemt adgang og tidligere samtykke; ved udløb én Fortsæt med Google uden tvungen ny consent. Ingen garanti om permanent tavs adgang.
- [Vedvarende browseradgang er tilgængelig på samme origin] -> Afgræns lagringen, ryd på afbryd/kontoskift, begræns scripts og test CSP; Pages-repostier er ikke isolerede sikkerhedsorigins.
- [Login og Drive-deling kan forveksles] -> Personlig filautorisation, egen token pr. bruger og test med to konti; ingen implicit filadgang gennem opretterens konto.
- [Reglementet indeholder modstridende angivelser] -> Afgrænset uafklaret status og alternative spor med kildehenvisning; ingen skjult rettelse eller falsk samlet sikkerhed.
- [Koder, varianter eller forklaringer kopieres forkert fra PDF] -> Kildehash, fuld katalogdækningskontrol, visuel tabelkontrol og uafhængige fixtures, især rytmebilagets figurer.
- [Nye beregningsmoduler påvirker tidligere pakker] -> Versionsbundne funktioner, gammel fixture-suite og ændringsrapport som krav før udgivelse.
- [Højt gennemsnit skjuler ét usikkert eller uvurderet spring] -> Minimum, antal lave vurderinger og fuld dækningsinformation er obligatoriske ved siden af gennemsnittet.
- [Mulighedssøgning bliver tung på store kartoteker] -> Gruppér kandidater, memoizér med korrekte versionsnøgler, kør tung søgning uden at blokere redigering og mærk dokumenteret mulighed frem for at påstå et ubevist maksimum.

## Migration Plan

1. Indfør den planlagte struktur i målrepoet uden at overskrive eventuelt nyt indhold. Medtag denne change og frontend-skillen; kun syntetiske gymnastdata må indgå i offentligt repo/CI/skærmbilleder.
2. Implementér dataformat og regelpakker med validering og fixtures før UI kobles til dem. Kildemanifest og hentning skal gøre et rent checkout uafhængigt af parent-mappen.
3. Opsæt GitHub Pages med Actions, repo-base og hash-routing samt Google Cloud-app med JavaScript-origins, consent, Drive/Picker og begrænset browsernøgle. Ingen serverhemmeligheder. Afprøv T01 fra Pages med den tilgængelige konto; den udskudte to-konto-live-test foretages af brugeren med trænerteamet i produktion. Verificér genåbning både før og efter tokenudløb.
4. Verificér alle capabilities, fuld visuel QA og rigtig Google-deling i en separat testmappe. Funktionsarbejde kan foregå i rækkefølge, men ingen samlet levering er færdig efter kun kartotek eller kun spring.
5. Ved første brug oprettes eller vælges filen af træneren. Ingen automatisk import eller ændring af eksisterende fælles dokumenter.
6. Ved senere filskemaopgradering indlæses den gamle fil uden tab, ændringen forhåndsvises og gemmes som normal konfliktbeskyttet operation. En nyere ukendt version afvises sikkert. Regelversionsskift bruger sin egen konsekvensvisning og ændrer ikke filskemaet.
7. Rollback af appen må ikke genberegne med andre regler eller nedskrive en nyere fil. Bevar gamle pakker; anvend en kompatibel appudgave eller åbn filen uden redigering. Eventuel gendannelse af Drive-version er en eksplicit brugerhandling med en særskilt kopi først.

## Open Questions

De seks faglige spørgsmål og den præcise påvirkning står i [reference/questions-for-judges.md](reference/questions-for-judges.md). De er ikke besvaret af denne plan.

Ingen udestående produktbeslutning bruges til at reducere det aftalte omfang. Følgende kan afgøres under implementeringen uden at ændre kontrakten:

- Google Cloud-projekt og autoriserede testkonti skal konfigureres for rigtig API-test. Hosting er besluttet som kun GitHub Pages; en backend er ikke et åbent valg. T01 er endnu ikke afprøvet og skal dokumenteres særskilt fra de seks faglige regelspørgsmål.
- Ønsket om vedvarende Google-forbindelse leveres inden for tokenets gyldighed og med genbrugt samtykke; permanent tavs fornyelse er ikke en egenskab, der kan loves med den valgte browsermodel.
- Endelig typografifamilie og finjustering af accent inden for den beskrevne visuelle retning.
- Om en dokumenteret officiel afklaring af de registrerede regeltvister er tilgængelig ved kildekontrollen. Uden afklaring gælder den allerede specificerede uafklarede produktadfærd; implementeringen skal stadig levere analyserne.
