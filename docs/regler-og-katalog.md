# Regelpakker, katalog og beregningskontrol

Første pakke er `dk@1.0.0`, baseret på de otte fastlåste [kilder](../openspec/changes/archive/2026-10-25-build-teamgym-team-manager/reference/source-manifest.json). Hovedreglementet er v1.4, og de nominelle DK-profiler kommer fra Teknisk Regulativ 26/27, afsnit 1.3 på PDF-side 4. U14, junior og senior med piger/drenge/mix udbydes; U11 udbydes ikke som DK. Aldersprofilerne er ikke fuld licens-/konkurrenceberettigelse.

## Identitet og katalog

Alle 103 springkildeposter bevares med trykt kode/værdi, kildeposition og status: 83 tilladte, 19 forbudte og én uafklaret. En kildepost er ikke nødvendigvis en ny færdighed. Startmarkeringerne deler udførelsesidentitet med de tilsvarende normale elementer. Alias som flik/flic er søgeord. De dokumenterede Kasamatsu-varianter normaliseres til tilsvarende Tsukahara; andre ligheder opfindes ikke.

Rotation, retning, redskab, kropsposition pr. relevant rotation og skruefordeling bevares. Forskellige kropspositioner med samme laveste D-basis er ikke samme C-identitet. Under tre hele skruer kan fordelingen give forskellige elementer; fra tre hele skruer bruges det samlede skruetal efter A5. En gentagen flik ændrer seriens identitet, men giver ikke mere D.

Byggerens standardforbindelser er afgrænsede kæder som rondat–flik–baglæns salto og kraftspring–forlæns salto. Reglementspoint godkender ikke alle permutationer. Redskab/landing skal passe til forbindelsen; ikke-verificerede kæder kræver en konkret trænerbekræftelse på gymnastens komplette serie. Bekræftelsen kan ikke ophæve trippelforbud, ukendt variant eller Q02.

De 94 individuelle rytmefelter har generelle krav, kategori-, række- og cellekrav samt kildehenvisning. Alle 13 A1.1-sider er kontrolleret visuelt under importen; de fire G-felter er bevidst udeladt. DB804-pirouetten og DB804-stemmet bevarer hver sin identitet. Kattespring 540° opfindes ikke. Valgfri landing, afsæt, håndhjælp og startvariant registreres konkret; spejling tilsidesætter ikke et krav om fælles startretning.

## Planlagt D og præcision

Point er eksakte rationelle værdier med BigInt. Fil- og visningsgrænsen serialiserer dem som brøkstrenge; der gemmes ingen binære afrundingsfejl som numerisk facit. Banens op til tre forskellige højeste elementer summeres. Trampet bruger værdien af det komplette spring. Omgangssummerne divideres med tre til disciplin-D, aldrig med seks igen. Ekstra gymnaster giver ingen tællende D, C-tillæg eller stabilitetsdækning.

Rondat–flik–strakt baglæns helskrue giver 0,80; en ekstra flik giver fortsat 0,80. Kraftspring–strakt forlæns halvskrue giver 0,60. Omgangssummer 3,60/4,20/4,80 giver disciplin-D 4,20. En enkelt forbedring på 0,10 giver præcis 1/30 i disciplin-D.

Panelværdien nedrundes efter den eksakte disciplinberegning: `floor(200*x)/200` efter H 4.6. Rå `127/30` giver panelværdi 4,230; almindelig afrunding til 4,235 er forkert. Negativ rå C bevares i forklaringen, mens den beregnelige C begrænses til nul før panelnedrunding. Stabilitet ændrer ingen officielle point. C+D er ikke en fuld karakter uden E.

## Planlagt modtagning og Maks. mulig karakter

Regelpakken fastlægger modtagningens satser og kilder (`DK_SPOT_RATES` i `packages/rules/src/dk-data.ts`). DK 1.0.0 og 1.1.0 deler tabellen. Let støtte giver et planlagt E-fradrag på 0,5 og Hjælp til udførelse 1,0 (A6 1.7, A6-07, s. 5). Kraftig hjælp i svæv/landing giver 1,0 og halverer D for det modtagne element (H 9.3.3/10.3.3, s. 33/42). E-fradrag og halvering vurderes hver for sig. En pakke uden satser giver `SPOT-RATES` og Uafklaret i stedet for lånte tal.

Halveringen gælder kun pladsens bidrag til omgangssummen og dermed disciplinens D (`spotD`). Holdomgangens afvigelse vurderes først; et bidrag på 0 forbliver 0. Trampet har ét element. På bane halveres det valgte element, og de tre højeste unikke identiteter beregnes igen. Står samme identitet uhalveret andetsteds i serien, er valget mellem halveret og uhalveret værdi åbent (`Q-SPOT-DUP`), og begge alternativer vises. Rækkefølge (Q06), Pegasus (Q04), gentagelser (Q03), identiteter og tillæg bruger den uhalverede `originalD`.

Omgangens planlagte E-loft er 10,0 minus summen af de tællende pladsers fradrag, dog mindst 0,0. Ekstra gymnaster vises med modtagning, men giver 0 i fradrag (A6-08). **Maks. mulig karakter** er C + D + gennemsnittet af tre omganges E-loft, nedrundet efter H 4.6. Den vises som et loft og aldrig som forventet eller faktisk karakter. Overdommerfradrag og observerede E-fradrag indgår ikke. Modtagningens pris er forskellen mellem loftet uden og med modtagninger. Tom, ufuldstændig og uafklaret plan giver status; en omgang, der blander spring med og uden Pegasus, gør loftet ugyldigt. En modtagning, hvis springreference ikke længere svarer til pladsens udførelse, er nulstillet og indgår hverken i D eller E-loft.

## Regelspor og faste eksempler

Den fulde [regelmatrix](../openspec/changes/archive/2026-10-25-build-teamgym-team-manager/reference/rule-matrix.md) fastlægger inputunivers, profilgrænser, formler, kildepunkter, tælleenheder og K/U/O/X-status. `packages/rules/src/traceability.ts` bevarer matrixens tekst og knytter hver regel til konkrete kode- og testfiler. Testen kontrollerer også, at alle 77 facitcases har et regelspor.

| Regel | Kilde og enhed | Formel/eksempel og kontrol |
| --- | --- | --- |
| P01–P03 | H 9.1/10.1 og holdomgangskrav | Tre omgange, seks tællende, højst to ekstra først; mix 3+3 blandt tællende. P01–P04. Tom plads er manglende input. |
| ID01–ID02 | A3/A5 identitet | Samme D er ikke samme identitet; startrolle er ikke nyt element. D03, I01–I04. |
| D-BASIS | H 9.3.5/10.3.5 og A3/A4 | Basisværdier for familie, retning, position og redskab. D06–D09; P05 afviser trippel; Q02/U01 bevarer to værdier. |
| D-SKRUE | H 9.3.6/10.3.6 | 0,10 pr. 180° på enkelt/dobbelt; ekstra 0,10 ved 1080° og hver yderligere 360°. T00–T08. |
| D-BANE | H 9.3.1 | Op til tre forskellige højeste værdier: D01–D05/D13; gentagen flik tæller ikke igen. |
| D-HOLD | H 9.3.4/10.3.4 | Klar majoritet over halvdelen. 5/1 nulstiller hele den afvigendes D; C09. 3/3, 2/2/2 og 3/2/1 er Q05, U05–U07. |
| D-MIDDEL | H 9.3.1/10.3.1 | Sum af tre omgangssummer /3. D10–D12; ingen ekstra /6. |
| TAL | H 4.6 | Nedrunding til 0,005 efter eksakt beregning. N01–N03. |
| C-GRUND | H 9.2.1/10.2.1 | Bane 0, trampet 1; tillæg minus fradrag; ingen gammel fradragsgrænse. C11: rå −0,30, C=0. |
| C-HOLD | H 9.2.2.1/10.2.2.1 | 0,20 pr. tællende afvigende gymnast fra klar majoritet; gyldigt element beholder C-berettigelse trods D-nulstilling. C09. |
| C-GENTAG | H 9.2.2.3/10.2.2.3 | DK 1.1.0: Tæl hver præcis serie-/springidentitet på holdet pr. omgang, uanset gymnast. Frihold én omgang med flest forekomster; giv 0,20 for hver forekomst i de øvrige omgange. 2 mod 3 giver 0,40; fulde gentagelser i to/tre omgange giver 1,20/2,40. Ved lige antal er beløbet kendt uden udpegning af friholdt omgang. |
| C-RETNING | H 9.2.2.4 | 0,20 gange manglende rene forlæns plus manglende rene baglæns i hver sin nærmeste omgang. 0/4/2 og 6/0/3 giver 0,40; F01–F03. |
| C-REDSKAB | H 10.2.2.5 | En fuld med- og en fuld uden-omgang giver 0. Alle tre uden eller med giver 1,20; V01–V03. DK 1.1.0: en omgang er hel med eller hel uden Pegasus, også for ekstra; en blandet omgang er ugyldig planlægning. DK 1.0.0 bevarer Q04/U08. |
| C-ORDEN | H 9.2.2.2/10.2.2.2 | Omgang 2/3: rotationskategori (uden salto, enkelt, dobbelt, trippel; blandet serie i højeste) før stigende D. DK 1.1.0: 0,10 pr. tællende gymnast, der står efter et tidligere højere spring; 0,8;0,6;0,7 giver 0,20. Ekstra indgår ikke. DK 1.0.0 bevarer Q06. O01–O02 og U09. |
| C-FLOW | H 9.2.2.5/10.2.2.4 | Kræver observation; intet automatisk fradrag eller godkendelse. C10. |
| B-SKRUE | H 9.2.3.1 | 0,10 gange bedste antal med mindst 360° i ét element. 2/6/4 giver 0,60; C01/B01. |
| B-DOBBELT | H 9.2.3.2 | 0,10 gange bedste antal med dobbelt, uafhængig bedste omgang fra skrue. C02/B02. |
| B-ELEMENT | H 9.2.3.3 | DK 1.1.0: +0,10 pr. forskelligt gyldigt element efter seriens første, summeret over tællende og divideret med tre omgange. Rondat–flik–flik giver 0,10, rondat–flik–lukket 0,20 pr. gymnast; et fjerde forskelligt element tæller også. DK 1.0.0 bevarer Q01's to spor. |
| T-SKRUE | H 10.2.3.1/10.2.4 | Junior/senior mindst 540° på enkelt eller 180° på dobbelt; U14 mindst 360° på enkelt. Tsukahara kræver mindst 360° efter håndafsæt eller dokumenteret Kasamatsu-ækvivalens. C03–C07/B03–B05. |
| T-DOBBELT-FRI/-REDSKAB | H 10.2.3.2–3 | Hver 0,10 gange bedste antal dobbeltspring, separat med/uden redskab. C06–C08. |
| POT | Produktkrav | Forskellige gymnaster, registreret komplet kunnen og fuld vidneopstilling. 4/6 kan blive 6/6 ved to konkrete registreringsændringer; integrationstest. |
| Rytme/stabilitet | A1.1 og produktkrav | H01–H06: 8/10 er ikke alle; 5,5,5,5,5,1 er ikke alle mindst 4; null er ikke 1. |
| X | Eksplicit produktgrænse | Ingen observeret E, fuld rytmekarakter, G, licensafgørelse eller automatisk bedømmelse af observeret udførelse. Kun trænerens planlagte modtagninger giver planlagte E-fradrag og et loft. |

## Uafklaret er et resultat

Q01 er fortsat åbent i DK 1.0.0, men trænerens afklaring har gjort eksempelsporet gældende i DK 1.1.0. Q02–Q06 og K01/K02 bevares som versionsdata med kilder. En uafklaret subtotal gør en afhængig total uafklaret, mens andre kendte bidrag vises. Eksempelvis gør A4-konflikten på hoftebøjet overslag-salto 180° D uafklaret, men fjerner ikke sikre C-forhold, som er uafhængige af den konkrete værdi. Ukendt er ikke nul. En tom omgang er ikke et observeret gennemløb.

Forbudte eller uafklarede spring skaber ingen sikker potentialekandidat. Der er ingen fritekstindstilling, der ændrer officielle satser eller løser et dommerspørgsmål. Ændringer efter publicering kræver en ny pakkeversion; 1.1.0 blev rettet direkte før push efter trænerens afklaring. Fastlåste kildebytes og historiske facit bevares.

## Verifikationens grænser

De 77 forventninger ligger i referencefilen og oversættes af en semantisk testadapter. Produktionsmoduler må ikke importere facit. Der er også fulde integrationstests gennem registrering, medlemskab, opstilling, D/C, mulighedsvidner og rytmematrix.

`npm run test:mutations` bruger en isoleret kodekopi og ændrer bevidst juniorgrænsen til 360°, fliks sats, gentagelsesoptællingen i D og C-filtrering på justeret D. Alle fire skal give assertion-fejl i facit-/integrationstestene. Produktionsfilerne ændres ikke af kontrollen.

Visuel kildekontrol, samme agents håndregning, automatiske tests og mutationskontrol er forskellige kontrolformer. Træneren har afklaret Q01 for den lokale 1.1.0-pakke; der er ikke indhentet ekstern dommergodkendelse eller svar på Q02–Q06. En bestået suite beviser ikke, at øvrige uafklarede regler er afklaret.
