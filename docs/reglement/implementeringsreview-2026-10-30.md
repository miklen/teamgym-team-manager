# Review af reglementsimplementeringen — 30. oktober 2026

**Konklusion: Implementeringen kan ikke godkendes som fuldt verificeret konkurrencegrundlag endnu.** De almindelige D-værdier og centrale summeringer stemmer med de kontrollerede kilder. Appen håndterer også de seks oprindelige dommerspørgsmål forsigtigt. Men reviewet finder fem reproducerbare implementeringsafvigelser og to væsentlige steder, hvor en nyere registreret tvetydighed behandles som afklaret.

De fem afvigelser er dokumenteret med seks røde assertions i en separat audit. Det er ikke seks forskellige fejl. Den almindelige domænesuite er fortsat grøn; den dækkede ikke disse tilfælde.

## Grundlag og afgrænsning

- Gennemgået produktionskode: commit `07dbb3562726821e2469ace013215c72519a9344`, med de eksisterende lokale dokumentændringer og den nye strukturerede kildegennemgang. Ingen produktionskode er rettet under reviewet.
- Regelpakke: **`dk@1.0.0`**, H v1.4, sæson 2026/27. Ni profiler: U14, junior og senior, hver med piger, drenge og mix. REG, ASP, ESM og Liga er ikke implementerede produktionspakker.
- Kilder: de [18 dokumentopslag](README.md), [afklaringerne](afklaringer.md), [valideringsgrundlaget](valideringsgrundlag.md) og originalerne i `reglement/`. Alle 18 SHA-256-værdier stemmer med det nye manifest. Den eksisterende kildekontrol bekræfter også alle otte fastlåste appkilder.
- A3 og A4 er genlæst visuelt. De 103 trykte springværdier er indtastet særskilt som forventninger. A1.1 er genlæst visuelt, og alle 94 importerede individuelle rytmefelters kode/side/værdi er kontrolleret mod særskilt indtastede forventninger. Dette er ikke en ny uafhængig dommergodkendelse af alle udførelsesbeskrivelser og figurer.
- [GymDanmarks aktuelle kildeindeks](https://gymdanmark.dk/konkurrence-teamgym/) er kontrolleret. Indekset linker fortsat til DK/REG- og appendixfamilierne. Online-PDF'ernes bytes er ikke sammenlignet med de lokale filer i dette review, og ingen ny officiel afklaring er indhentet.
- Gennemgået kode: `dk-spring`, `dk-numeric`, `dk-engine`, `catalog`, `rhythm`, `potential`, `dk-v1`, `dk-data`, `registry`, den relevante domænevalidering og visningen af resultatstatus i appen. Testenes forventninger er vurderet mod kilderne, ikke blot mod eksisterende testresultater.

Appen er en planlægningsapp. Den beregner planlagt spring-D og dele af spring-C, samt registreret fælles kunnen i rytme. Den beregner ikke faktisk E, overdommerfradrag eller fuld rytmekarakter. At en regel er uden for dette produktomfang er ikke i sig selv en kodefejl, men betyder, at appen ikke kan bevise et holds samlede konkurrencelovlighed eller slutkarakter.

## Fund, prioriteret efter konsekvens

P1 betyder, at usikkerhed eller forkerte point kan påvirke en konkret planbeslutning og bør håndteres før resultatet bruges som sikkert facit. P2 betyder en afgrænset fejl eller mangel, der også skal rettes, men hvor udløseren eller virkningen er mere begrænset.

### R01 — P1: Ubekræftet springforbindelse kan give kendt disciplin-D

**Udløser:** En ikke-standardiseret serie er registreret, men dens komplette forbindelse er endnu ikke bekræftet. Serien bruges i anden eller tredje omgang.

**Reproduceret:** Seks normale rondat-flik-strakt i omgang 1 og 3 og seks ubekræftede kraftspring-baglæns helskrue i omgang 2 giver disciplin-D **3,800, status `known`**. Samtidig har de seks specialserier `connection: unverified`, og deres gyldighed er ufuldstændig. Det er ikke dokumenteret, at disse hele forbindelser kan udføres uden mellemtrin.

**Årsag:** [dk-engine.ts](../../packages/rules/src/dk-engine.ts), `evaluateEntry` omkring linje 87–95, gør kun D ukendt ved manglende registrering eller `validity === invalid`. `incomplete` og `unresolved` gyldighed får lov at beholde det beregnede D. Omgangsberegningen omkring linje 121–123 viderefører kun `invalid` til D-status. [spring.tsx](../../apps/web/src/spring.tsx), omkring linje 233–237, viser netop D-status som »Beregnet«.

**Vurdering:** Det er rimeligt at kunne vise elementernes teoretiske delsum. Den må ikke uden tydelig betingelse blive til et sikkert bidrag fra en ubekræftet hel serie. H 9.1.e/9.3.1/9.3.4 forudsætter en gyldig, sammenhængende udførelse. Appens egen model kræver netop denne bekræftelse. En generel advarsel et andet sted ophæver ikke den modstridende D-status.

**Rettelsesretning:** Bevar delsum og forklaring, men lad manglende forbindelsesgyldighed følge de afhængige omgangs- og disciplinresultater. Gør det særskilt fra A4-konflikten, hvor gyldigheden kan være kendt, selv om værdien ikke er det.

### R02 — P2: En trænerbekræftelse kan godkende point efter et eksplicit mellemtrin

**Reproduceret via gyldig filmodel og domænekommandoer:** Rondat-flik-helskrue med overgangene `direct`, `mellemtrin` og en konkret trænerbekræftelse giver **0,80** og kendt gyldighed. H 9.1.e, 9.2.1.c og 9.3.4 kræver, at elementer efter mellemtrinnet ikke tæller. D før afbrydelsen er **0,10 + 0,20 = 0,30**.

**Årsag:** [dk-spring.ts](../../packages/rules/src/dk-spring.ts), `connectionStatus` omkring linje 81–96, accepterer enhver ikke-tom, identitetsbundet bekræftelse, når forbindelsen ikke er standard. Overgangsteksten fortolkes ikke. Hele elementlisten summeres bagefter.

**Eksponering:** Den normale formular beder træneren bekræfte, at serien udføres _uden mellemtrin_, og tilbyder ikke en særskilt mellemtrinsknap. Fundet vedrører derfor indlæste/ældre data eller en selvmodsigende bekræftelse; det dokumenterer ikke, at almindelige standardvalg fejler. Filformatet tillader dog sådanne overgange, og de accepteres af produktionsmotoren.

**Rettelsesretning:** En fri note må ikke kunne ophæve en regel. Ukendte overgangstyper må afvises som sikkert pointgrundlag, eller pauser/mellemtrin må modelleres struktureret med korrekt afkortning. Det kræver ikke automatisk, at appen udvides til fuld udførelsesbedømmelse.

### R03 — P2: Samme Tsukahara kan blive to forskellige regelidentiteter

**Reproduceret:** Tsukahara strakt med hel skrue findes både med tom `variant` og med `variant.twistAfterHandsHalfTurns: 2`. Begge værdisættes til **1,30** og accepteres som gyldige. Fem af første repræsentation og én af den anden giver imidlertid **6,50** i holdomgangens D i stedet for **7,80**, samt et fejlagtigt C-fradrag på **0,20**. Den sjette gymnast behandles som afvigende og får nul i D.

**Årsag:** [dk-spring.ts](../../packages/rules/src/dk-spring.ts), `normalizeElement`/`elementIdentity` omkring linje 12–28, beholder den redundante variantoplysning i identiteten. Linje 37–40 anerkender samtidig præcis denne værdi som gyldig. Alle senere identitetsbaserede regler arver forskellen.

**Eksponering:** Den nuværende formular ser ikke ud til at skrive feltet. Reproduktionen bruger indlæselige data gennem de almindelige domænekommandoer. Fejlen er derfor især relevant for importer, gamle registreringer og fremtidige redaktører. Den kan også påvirke gentagelser og søgning efter ens holdomgange.

**Rettelsesretning:** Normalisér samme kendte udførelse til samme regelidentitet. Skeln fortsat mellem rå gemt identitet og versionsbundet regelidentitet; undgå en ukontrolleret omskrivning af registreringer, bekræftelser og arverelationer.

### R04 — P2: Rytmekravet siger ét skridt, hvor kilden siger tre

[catalog.ts](../../packages/rules/src/catalog.ts), linje 87, angiver højst ét skridt før et rytmemoment. A1.1 side 1 og H 8.3.5 tillader **højst tre gå-/løbeskridt**. Formuleringen vises i rytmens kravdetaljer og momentredigeringen.

Det er en sikker tekstfejl, ikke en kildeuklarhed. Den kan få træneren til at ændre eller fravælge lovlig koreografi. Appen tæller ikke selv koreografiske skridt, så fejlen ændrer ikke automatisk et beregnet rytmeresultat. DB-power-elementers særregel om højst ét skridt _under selve bevægelsen_ skal fortsat holdes adskilt fra det generelle tilløbskrav.

### R05 — P2: Sissones bendeling forveksles med skrue

**Reproduceret:** `rh-j-sissone-180`, kode **J804**, får `commonFacingRequired: true` og valgmuligheden `facing`. Dets 180° er **bendeling**, ikke skrue. A1.1 side 6 knytter kravet om fælles startfront til hop **med skrue**.

**Årsag:** [catalog.ts](../../packages/rules/src/catalog.ts), `rhythmOptions` omkring linje 174, udleder skrue fra `180|360|540` i beskrivelsesteksten. Det rammer også »Sissone 180«. [rhythm.ts](../../packages/rules/src/rhythm.ts) bruger derefter valget i den fælles identitet. Modsat rettede/spejlede udførelser kan dermed blive adskilt unødigt, og en ellers mulig fællesnævner kan forsvinde.

**Rettelsesretning:** Registrér skrue som konkret katalogegenskab frem for at aflæse et vilkårligt tal i navnet. Kontrollér, hvilke eksisterende registreringer der skal revurderes ved ændret variantmodel.

### R06 — P1: Afrundingens rækkefølge er valgt uden at vise H-U06 som åben

Dette er **en udokumenteret sikkerhed i resultatet, ikke et bevist forkert matematisk facit**. `Fraction.panelFloor()` beregner korrekt `floor(200*x)/200`. Motoren bruger den eksakte disciplinværdi direkte og springer et eventuelt mellemliggende todecimalstrin for den enkelte dommer over.

Den nye integrationsprøve giver præcis **127/30 → 4,230**, markeret som beregnet. H 4.4.a og 4.6 er netop den åbne sammenhæng i [H-U06](01-hovedreglement.md). `DK_KNOWN_ISSUES` omfatter ikke dette spørgsmål. Den eksisterende [beregningsdokumentation](../regler-og-katalog.md) beskriver metoden kategorisk og bør kvalificeres.

**Rettelsesretning:** Bevar den eksakte rå værdi. Dokumentér og synliggør den anvendte panelantagelse, indtil der foreligger et autoritativt gennemregnet eksempel. En endelig ændring af afrundingspolitik skal versionsbindes.

### R07 — P2: Knælende Gumbi godkendes uden den nyere kildeusikkerhed

Appen tilbyder både stående og knælende start, kombineret med sidelæns/baglæns retning. Den nye audit bekræfter, at knælende Gumbi får `bindRhythm(...).status === known`. Implementeringen kombinerer A1.1's retningskrav med Q&A's friere startbeskrivelse.

Det er den konkrete implementerede fortolkning af **A1DK-U06/QA-U02**. Der er ikke her påvist, at knælende start sportsligt er forbudt. Manglen er, at denne åbne kilderelation ikke står som afklaring i pakken. Se [catalog.ts](../../packages/rules/src/catalog.ts), `rhythmRowRequirements` og `rhythmOptions`.

## Hvad de ni prioriterede springafklaringer betyder i appen

| Spørgsmål i afklaringslisten | Faktisk implementering                                                                                                                                                                                                                               | Vurdering                                                                                                                                                                                |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. H-U01, elementtillæg      | Q01. Begge spor beregnes: `0,1 × forskellige elementer` og `0,1 × max(antal−1,0)`, samlet over de tællende og divideret med tre. Der vælges ingen sikker bane-C.                                                                                     | Usikkerheden bevares korrekt. Det fjerde forskellige element tæller med i begge C-spor, selv om højst tre tæller i D.                                                                    |
| 2. A4-U01, H>1               | Q02. D er uafklaret med alternativer **1,20/1,10**. Afhængige D-summer forbliver åbne. Kendte uafhængige C-egenskaber kan stadig tælle.                                                                                                              | Korrekt bevaret konflikt.                                                                                                                                                                |
| 3. H-U02, gentagelser        | Q03. En identitet i kun én omgang giver 0. Samme seks gymnaster med identisk spring i to/tre omgange giver **1,20/2,40**. Andre delvise eller skiftende besætninger er uafklarede.                                                                   | Ingen skjult valg af friholdt gymnast. Konservativt: også visse tilfælde uden gentagelse hos samme gymnast kan ende uafklaret, hvis holdet gentager identiteten.                         |
| 4. H-U03, holdomgang         | Q05. Kræver **mere end halvdelen** blandt de seks tællende. 4/2 og 5/1 får reference; 3/3, 2/2/2 og 3/2/1 forbliver åbne. Afvigende hel serie får D=0 og C-fradrag 0,20, men gyldige C-egenskaber bevares.                                           | En eksplicit fortolkning af »størstedelen«. Ekstra gymnaster indgår **ikke** i reference, D eller C-tillæg. Den sidste del af H-U03 er dermed valgt i koden og bør indgå i dommersvaret. |
| 5. H-U04, rækkefølge         | Q06. Ikke-faldende kendte rotationskategorier og D giver fradrag 0. Ellers intet præcist fradrag. `0,8 → 0,6 → 0,7` er uafklaret. Bane med både enkelt/dobbelt eller uden salto har ukendt rotationskategori. Ekstra gymnaster indgår i rækkefølgen. | Ingen af de to foreslåede fejloptællinger vælges. Sorteringsforslaget placerer ukendte kategorier sidst; det er en praktisk sortering, ikke en dokumenteret løsning af Q06.              |
| 6. H-U05, redskaber          | Q04. En fuld med- og en fuld uden-omgang giver 0. Tre fulde omgange alle med eller alle uden giver 1,20. Øvrige blandede mønstre, herunder tre gange 3+3, er uafklarede.                                                                             | Korrekt afgrænset. Legitimt mislykkede forsøg er ikke modelleret som observationer.                                                                                                      |
| 7. H-U06, afrunding          | Eksakt rationel rå beregning, derefter direkte nedrunding til 0,005. Intet todecimalstrin og ingen åben H-U06-status.                                                                                                                                | Valgt fortolkning; se R06.                                                                                                                                                               |
| 8. A71-U01–U05, trænerlicens | Ingen model eller kontrol for licensgyldighed, godkendelsesproces eller træners tilstedeværelse. A7.1 er ikke blandt pakkens otte kilder.                                                                                                            | **Ikke implementeret.** Et kendt D-tal eller »Beregnet« gyldighed er ikke bevis for konkurrencetilladelse.                                                                               |
| 9. A3-U01, startsalto        | Startpost og almindelig post normaliseres til samme element. Startstjernen bevares i kildekataloget, men giver ikke ekstra identitet, ekstra D eller ekstra forskelligt C-element. Rækkefølgen af elementer i hele serien bevares.                   | Valgt, forsigtig fortolkning. Ikke registreret som åben A3-U01 i pakken.                                                                                                                 |

**Et yderligere konkret valg:** Banens retningsfradrag beregnes med to uafhængige maksimummer, `0,2 × (6−max(forlæns)+6−max(baglæns))`. Koden kræver ikke forskellige nærmeste omgange. Ved forlænsantal `0/3/0` og baglænsantal `0/3/0` returnerer den **1,20** og genbruger omgang 2. Det er dokumenteret med en observationsprøve. Hvis »en omgang … og en omgang« skal betyde to forskellige omgange også ved delvis opfyldelse, bliver dette tilfælde anderledes. Det er et supplerende spørgsmål til DoRS, ikke et fastslået alternativt facit.

## Rytmens afklaringer og implementerede fortolkninger

| Kilde-ID                            | Implementeret adfærd                                                                                     | Grænse                                                                                                                                                  |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A1DK-U01 / H-U11, DB804             | Begge felter bevares, hver med værdi 0,80 og forskellig intern identitet. K01 forklarer kodekollisionen. | Appen afgør ikke, om begge må anmeldes i samme program; den har ingen fuld programvalidering.                                                           |
| A1DK-U02, G802                      | Gruppeelementer er helt udeladt af rytmekataloget.                                                       | Ingen værdi eller kode vælges. Uden for produktomfang.                                                                                                  |
| A1DK-U03, J822                      | Trykt kode J822 og værdi 0,80 bevares. Navnet er spagatspring 180°.                                      | Der findes ingen struktureret tabelrækkeidentitet eller kontrol af lovlige kombinationer i et helt rytmeprogram. Spørgsmålet om rækkekrav er ikke løst. |
| A1DK-U04, 15°/30°                   | Generel tekst skelner torso 15° og krop 30°, med specifikke krav som forrang.                            | Ingen måling af faktisk vinkel eller per-celle afgørelse af den åbne sprogkonflikt. Et registreret moment er ikke en genkendelsesdom.                   |
| A1DK-U05, forskellige balancerækker | Kataloget har kategorier, men ingen motor, der vælger/kontrollerer hele programmets rækker.              | HB201 sammen med SB201 godkendes eller afvises ikke sportsligt.                                                                                         |
| A1DK-U06 / QA-U02, Gumbi            | Sidelæns/baglæns start × stående/knælende accepteres.                                                    | En konkret valgt fortolkning; R07.                                                                                                                      |
| A1DK-U07, kattespring 540°          | K02 bevarer bemærkningen; ingen ny kode, værdi eller variant opfindes.                                   | Korrekt forsigtighed.                                                                                                                                   |

Fælles rytmekunnen kræver alle aktive gymnaster. 8/10 bliver ikke til en fællesnævner. `null` stabilitet bliver ikke til 1. Forskellige landinger og krævet startfront adskilles, mens kendt spejling tillades. Disse egenskaber er dækket af den beståede suite. R05 viser, hvorfor selve katalogbetingelsen stadig skal kontrolleres uafhængigt af den generiske matchmotor.

## Resten af afklaringslisten: hvad der ikke er implementeret

Ingen skjult sportslig fortolkning blev fundet for de følgende grupper; der mangler de pågældende beregnings-/observationsfunktioner:

| Afklaringer                                                   | Aktuel afgrænsning                                                                                                                                                                            |
| ------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H-U07, H-U09, H-U10, H-U12; A2-U01–U02; A6-U01–U05            | Ingen E-/overdommer-/dommerpanelmotor, tidsfradrag eller automatisk optælling af faktiske fejl. Ingen sats vælges mellem kildernes modstridende satser.                                       |
| A5-U01–U03                                                    | Ingen genkendelse fra video/vinkler/højde/kontakt. Træneren vælger en beskrevet udførelse. Positioner pr. rotation og skruefordeling er gemt, men tolerancernes grænsetilfælde bedømmes ikke. |
| TR-U01–U03, TR-U06–U08; FK-U01–U03; RED-U03                   | Ingen fuld alders-/dispensations-/klub-/licens-/frist-/placerings-/redskabskontrol. De nominelle DK-alderstal er rigtige, men ingen fuld deltagelsesgodkendelse følger af dem.                |
| H-U08, A1REG-U01–U05, REG-del af H-U11/H-U10, RED-U01/U02/U04 | Ingen REG-pakke. DK-værdier bruges ikke som automatisk REG-fallback.                                                                                                                          |
| ASP-U01–U07, TR-U04                                           | Ingen ASP-pakke eller ASP-karakterberegning.                                                                                                                                                  |
| A4-U02                                                        | Trykt TOO2=2,50 bevares i kildekataloget, men springet afvises som trippel i DK. Den nye konflikt 2,50/2,10 er ikke oprettet i `knownIssues`; relevant før genbrug til en anden række.        |
| A4-U03                                                        | Hoftebøjet Kasamatsu normaliseres ikke automatisk. Den forbliver ukendt. Kun de konkret dokumenterede lukket/strakt-varianter normaliseres.                                                   |
| TR-U05; A7-U01–U04; FOR-U01–U02; A8-U01–U03                   | Ingen Liga-pointvidereførsel, central trippelgodkendelse, forældretilladelse eller CoP-motor. ESM's undtagelser er heller ikke en DK-profil.                                                  |
| QA-U01–U03; NYT-U01–U03                                       | Ingen generel historisk versions-/fortolkningsmotor. QA bruges konkret ved Gumbi; ind/ud-bevægelser og historiske 25/26-karakterer beregnes ikke.                                             |

**Praktisk betydning:** Trænerteamet må særskilt kontrollere licens, aldersundtagelser, rytmedeltagelse, anmeldelse, redskaber og godkendelser. Især er trippelforbuddet i DK ikke en erstatning for A7.1: bilaget omfatter også visse dobbeltspring. Reviewet fastslår ikke, hvilken licensordning der gælder efter 2025/26.

## Det verificerede beregningsgrundlag

| Område          | Evidens og resultat                                                                                                                                                                                                                                                               |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Springkatalog   | Alle 103 trykte værdier stemmer med de genaflæste A3/A4-tabeller. 83 tilladte poster stemmer med D-formlerne i eksisterende tests; 19 forbudte afvises; H>1 forbliver uafklaret. En korrekt bevaret trykt konflikt er ikke et godkendt pointtal.                                  |
| Rytmekatalog    | Alle 94 individuelle kode/side/værdi-kombinationer stemmer med den nye tabelkontrol. G-felterne er tilsigtet udeladt. Kravteksterne er ikke fejlfri, jf. R04/R05.                                                                                                                 |
| Grund-D         | Rondat-flik-baglæns strakt 360° = 0,80; ekstra flik ændrer ikke værdien. Kraftspring-forlæns strakt 180° = 0,60.                                                                                                                                                                  |
| D-aggregation   | Højst tre forskellige højeste baneelementer. Tre omgangssummer /3; ingen ekstra division med seks. 3,60/4,20/4,80 giver 4,20. En forbedring på 0,10 giver rå stigning 1/30.                                                                                                       |
| Skruetillæg     | 0,10 pr. halv skrue samt ekstra 0,10 ved 1080° og hver yderligere hele skrue. Grænserne 900/1080/1260/1440° er kontrolleret særskilt.                                                                                                                                             |
| Identitet       | Kropspositionsforløb bevares trods fælles laveste D-basis. Skruefordeling adskilles under tre hele skruer og normaliseres fra tre. Startposter og dokumenterede Kasamatsu-ækvivalenser håndteres eksplicit. R03 er en undtagelse, der skal rettes.                                |
| Hold/mix/ekstra | Seks tællende, højst to ekstra først; mix 3+3. Samme gymnast kan ikke udfylde flere pladser i samme omgang via gyldig filmodel. Reserver tæller ikke. Ni udførende afvises i planmodellen; kildens efterfølgende bedømmelse af en faktisk niende udførelse er ikke implementeret. |
| C               | Banegrundværdi 0 og trampetgrundværdi 1; C mindst 0. D-nul ved holdafvigelse fjerner ikke i sig selv gyldige C-egenskaber. Uafklarede bidrag gør den afhængige C-total uafklaret.                                                                                                 |
| Bonusser        | Bane 360° og dobbelt tælles særskilt på hver sin bedste omgang. Trampet U14 har 360° på enkelt, junior/senior 540°; dobbelt normalt 180°, men Tsukahara kræver 360° efter håndkontakt. Dobbelte med/uden redskab har særskilte bedste omgange.                                    |
| Flow            | Markeres som observationskrævende. Det indgår ikke som beregnet fradrag i planlagt C. UI siger udtrykkeligt »Flow kræver observation«. Planlagt C er derfor ikke faktisk konkurrencens C.                                                                                         |
| Potentialer     | Kræver forskellige gymnaster, registrerede komplette færdigheder, kendt gyldighed og en fuld eksempelopstilling. Q02/forbudte kandidater indgår ikke som sikre muligheder. Bonusvisninger er uafhængige; de påstås ikke at udgøre én samlet optimal konkurrenceplan.              |
| Regelversion    | Præcis binding, ingen fallback til en anden række eller nyeste version. Registry beskytter mod modstridende dobbeltregistrering i samme kørsel. Gamle algoritmers fortsatte korrekthed kræver stadig versionsdisciplin og regressionstests ved kommende rettelser.                |

## Tests, reproduktion og begrænsninger

Den separate [auditfil](../../tests/review/reglement-2026-10-30.test.ts) køres med:

```powershell
npx.cmd vitest run --config tests/review/vitest.config.ts
```

**Resultat: 42 tests, 36 bestået, 6 fejlet.** De seks fejl reproducerer R01, R02, R03 (to prøver), R04 og R05. Assertions er ikke markeret som forventede fejl og er ikke ændret til at acceptere den forkerte adfærd. Auditfilen ligger uden for den almindelige suites inkluderingsmønster, så den eksisterende suite fortsat kan måles separat. R06, R07 og retningsvalget har observationsprøver, som beskriver den aktuelle fortolkning; deres grønne resultat er ikke en officiel afklaring.

| Kontrol                           | Resultat                                                                                  |
| --------------------------------- | ----------------------------------------------------------------------------------------- |
| SHA-256 mod det nye kildemanifest | 18/18 stemmer                                                                             |
| `npm.cmd run verify:sources`      | 8/8 fastlåste appkilder stemmer                                                           |
| `npm.cmd run test:domain`         | 292/292 bestået                                                                           |
| `npm.cmd run test:drive`          | 82/82 bestået; syntetiske adapterprøver, ikke live kontotest                              |
| `npm.cmd run test:mutations`      | 4/4 tilsigtede regelmutationer fanget i isoleret kodekopi                                 |
| `npm.cmd run check`               | Typekontrol, lint og flettepolitik bestået, også efter tilføjelse af auditfilerne         |
| `npm.cmd run build`               | Bestået; almindelig advarsel om stor JS-bundle                                            |
| Browserprøver                     | 139 bestået, én timeout i samlet kørsel; den fejlende prøve bestod isoleret med én worker |

Browserafvigelsen er `tests/e2e/scenarios.spec.ts:339`, tastaturbetjening af reserveindsættelse ved 200 % visning. Den samlede kørsel brugte 16 workers og fik timeout ved søgning efter dialogens gymnastvalg. Isoleret genkørsel bestod på 1,2 sekunder. Den oprindelige proces blev afbrudt, da den efter alle 140 rapporterede testresultater blev hængende uden afsluttende opsummering. Det er ikke dokumenteret som en regelfejl, men hele browserkørslen må heller ikke kaldes fejlfri. Ingen produktionsrettelse blev foretaget som led i genkørslen.

Før de første tests pegede fire lokale `node_modules/@teamgym`-junctions på en gammel projektplacering. De er rettet til pakkerne i dette arbejdsrum. Ingen dependencyversion, lockfil eller appfil er ændret af dette. De første mislykkede kørsler var importfejl og er ikke regelfund.

Den nye numeriske referenceindtastning er lavet under samme review som kodegennemgangen. Den er uafhængig af produktionsformlerne, men ikke udført af en anden person. Der er ikke indhentet DoRS/KTG-svar, foretaget live dommerafprøvning, anvendt rigtige gymnastdata eller skrevet til en fælles trænerfil. En grøn automatisk suite kan ikke vælge mellem modstridende officielle angivelser.

## Anbefalet rækkefølge for næste arbejde

1. Ret de reproducerede afvigelser, med R01 først. Lad auditprøverne blive grønne ved korrekt kode, og flyt de relevante prøver ind i den normale suite.
2. Gør H-U06 og Gumbi-antagelsen eksplicitte. Fasthold rå værdier og de eksisterende Q01–Q06-spor; vælg ikke dommersvar ud fra, hvad der allerede står i koden.
3. Indhent afklaringer med de konkrete eksempler i [afklaringslisten](afklaringer.md), suppleret med de ekstra gymnasters betydning for holdreference og genbrug af nærmeste baneomgang til begge retninger. Dette review har ikke sendt spørgsmål.
4. Versionsbind ændret værdi, regelidentitet, afrunding og udførelseskrav. Den frigivne `dk@1.0.0` må ikke få en ny betydning under samme versionsnummer. Afklar bevidst skift og revurdering af gamle planer.
5. Kør de automatiske kontroller, forbered en lokal testudgave, og lad brugeren afprøve konkrete berørte planer før commit/push efter projektets arbejdsgang.

## Fælles data og fletning

Dette review tilføjer dokumentation og særskilte testfiler. Det ændrer ingen gemte felter, sammenligningsfunktioner, identiteter, rækkefølger, afhængigheder, afledte appværdier eller produktpræsentation. Der er derfor ingen ny flettepolitik at implementere i dette trin.

Kommende rettelser er anderledes: R01/R02 påvirker afledte point og afhængigheder; R03 påvirker regelidentitet, holdreference, gentagelser og søgning; R05 kan påvirke gemte varianter og fællesnævnere; R06 påvirker afledte og viste karakterer. De skal vurderes mod den fælles kontrakt og samtidighedsregressioner. R04 er en kravtekstrettelse, men skal holdes versionsmæssigt adskilt fra ændrede registreringskrav. Ingen formular må få sin egen flette- eller regelmotor.

Ingen commit eller push er foretaget. Der er ikke oprettet en ny brugertestudgave, fordi appens implementering ikke er ændret; automatiske browserprøver bruger `dist/` og port 4173. `dist-local/` og brugerens testudgave er ikke genbygget.
