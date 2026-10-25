# Regelmatrix: Danmarksserien

Kilde-id'er og hashes findes i [manifestet](source-manifest.json). H = hovedreglement v1.4, A3/A4 = basisværdier, A5 = genkendelse. Sidetal er PDF-sider, ikke browserlinjer. Gælder DK U14/junior/senior og piger/drenge/mix, med aldersundtagelser nedenfor. Ingen REG-/Liga-satser må genbruges automatisk.

Status: **K** = kildebegrundet planregel, **U** = berørt numerik uafklaret, **O** = kræver observeret udførelse, **X** = uden for produktets analyse. Fixtures er navngivet i [fixtures.json](fixtures.json); spørgsmål Q01–Q06 i [spørgsmålslisten](questions-for-judges.md). Hver afledt værdi skal bevare sin kilde og status. Uafklaret subtotal gør en afhængig samlet karakter uafklaret, men fjerner ikke uafhængige kendte delresultater.

## Fælles input og tælleunivers

En disciplin har præcis tre ordnede omgange. En omgang har seks tællende pladser og højst to ekstra gymnaster, som står først. Dermed er de sidste seks de tællende. En tom plads er ukendt planinput, aldrig et observeret gennemløb. Gyldighed, ujusteret D, justeret D og C-berettigelse er separate felter. `n[r,x]` er antallet af tællende, kendte, gyldige udførelser af præcis normaliseret identitet x i omgang r. Ekstra gymnaster giver ingen D/C-bidrag. Manglende eller ugyldigt input giver diagnostik; det må ikke umærket tælles som en sikker nulværdi.

| Id / kilde | Input og præcis beslutning | Status / facit |
| --- | --- | --- |
| P01; H 9.1, 10.1, PDF29/39 | Tre omgange, seks tællende, højst to ekstra først. Forskellig besætning mellem omgange er tilladt. UI afviser niende plads. Mix kræver 3+3 blandt de tællende; kategori skal være angivet, ikke udledt af navn. | K; P01–P03 |
| P02; H 9.2.2.1, 10.2.2.1 | Holdomgang er første omgang. Brugeren kan flytte den valgte omgang til første position; ingen løs boolean, der modsiger rækkefølgen. | K |
| P03; H 9.2.1.d, 10.2.1.c | Der gives ikke C-fradrag blot for færre end seks gymnaster. En fempersoners kladde skal vise manglende input, ikke opdigtet faktisk hændelse. | K; P04 |
| ID01; A5.7, PDF4 | Normaliser hele ordnede serien til C-identitet. Gentaget flik ændrer serieidentitet; samme D er ikke samme element. Bevar kropsposition pr. salto og relevant skruefordeling. Ved færre end tre hele skruer kan forskellig fordeling give forskellige elementer; ved mindst tre afgør samlet skruetal frem for den præcise placering. Tsukahara/Kasamatsu-normalisering må kun bruge de faktisk beskrevne ækvivalenser, ikke alle varianter med samme D. | K; I01–I04 |
| ID02; A3/A5 | Startmarkering i A3 er en udførelsesrolle; samme element bliver ikke et nyt D-element, fordi det også bruges som start. Alle katalogrækker er ikke unikke færdigheder. Forbindelser er ikke et frit krydsprodukt: kræv gyldige elementer, kendt landing/orientering og registreret komplet færdighed. Specialforbindelser kræver konkret trænerbekræftelse, som ikke kan ophæve forbud eller regeltvivl. | K; D03 |

## D

| Id / kilde | Input og præcis beslutning | Status / facit |
| --- | --- | --- |
| D-BASIS; H 9.3.5/10.3.5, PDF33/43; A3/A4 | Brug kildepostens værdi og rotations-/redskabsfamilie. A4 indeholder ét komplet redskabsspring; overslag-salto er ikke summen af et selvstændigt overslag og en fri salto. Trippelsalto er forbudt i DK. Et redskabsspring tælles fra trampetafsæt til landing, så overslag-salto/Tsukahara er dobbeltkategori, og overslag-dobbelt er trippelkategori og forbudt. En forbudt udførelse og en ukendt værdi er forskellige tilstande. | K bortset fra Q02; D06–D09, P05, U01 |
| D-SKRUE; H 9.3.6/10.3.6, PDF34/44 | For enkelt/dobbelt, k hele antal halve skruer: tillæg = k/10 + max(0,1+floor((k−6)/2))/10. Dvs .10 pr. 180°, ekstra .10 ved 1080° og hver yderligere 360°. Anvend kun i den relevante gyldige familie. Trippelrækkerne i bilaget gør ikke trippel lovlig. Laveste kropsposition afgør dobbeltbasis; identiteten bevarer begge positioner. | K; T00–T08, I01 |
| D-BANE; H 9.3.1, PDF32 | Find forskellige elementidentiteter i den komplette gyldige serie, sortér efter D, summér højst tre højeste. Færre end tre er tilladt. Gentagen identisk flik giver ikke mere D. | K; D01–D05, D13 |
| D-HOLD; H 9.3.4/10.3.4, PDF33/43 | Ved klar majoritet på mere end halvdelen er denne identitet reference. Hele D for en afvigende tællende gymnast sættes til 0, også ved samme oprindelige D. Ingen nulstilling af de øvrige. Der vælges ikke vilkårlig reference ved 3/3, 2/2/2 eller 3/2/1; Q05. | K ved klar majoritet, ellers U; C09, U05–U07 |
| D-MIDDEL; H 9.3.1/10.3.1 | Omgangssum = sum af de seks justerede D. Disciplinens rå D = (sum omgang1+sum omgang2+sum omgang3)/3. Ingen division med seks. Ufuldstændige input giver ufuldstændig samlet D med kendte bidrag synlige. | K; D10–D12 |
| TAL; H 4.6 | Bevar eksakte rationelle mellemresultater. Panelværdier C/D/E nedrundes til nærmeste .005: floor(200*x)/200. Skeln mellem rå beregningsværdi, panelværdi og UI-format. Foretag ikke tidlig nedrunding pr. gymnast/omgang. E beregnes ikke i dette produkt. | K; N01–N03 |

## C: fradrag

| Id / kilde | Input og præcis beslutning | Status / facit |
| --- | --- | --- |
| C-GRUND; H 9.2.1/10.2.1, PDF30/40 | Banegrundværdi 0; trampetgrundværdi 1. Rå C = grundværdi + tillæg − fradrag. Planlagt C = max(0,rå C), derefter panelnedrunding. Alle rå bidrag bevares. Intet gammelt generelt loft på 2.0 i fradrag. Afhængig samlet C forbliver uafklaret ved uafklaret bidrag. | K; C11, N01 |
| C-HOLD; H 9.2.2.1/10.2.2.1 | .20 pr. tællende afvigende gymnast fra klar majoritet i første omgang. Identitet, ikke D-lighed. D-nulstilling ophæver ikke C-berettigelse til gyldige udførte elementer, jf. 9.2.1.b/10.2.1.b. Flertalsgrænsetilfælde Q05. | K/U; C09, U05–U07 |
| C-GENTAG; H 9.2.2.3/10.2.2.3, PDF30/40 | Identisk komplet serie/spring på tværs af omgange; omgangen med flest ens er fri; .20 pr. gentagelse. Seks identiske i én omgang alene udløser ikke fradrag. En mulig samleformel er .20*sum_x(sum_r n[r,x]−max_r n[r,x]); den må ikke frigives som universelt facit, før Q03 om skiftende besætning og delvis gentagelse er afklaret. | K for ingen gentagelse og klar fuld gentagelse med samme besætning; øvrige berørte optællinger U; R01–R03, U03–U04 |
| C-RETNING; H 9.2.2.4, PDF30 | I fuldt kendte seksmandsomgange: f[r] antal rent forlæns serier, b[r] rent baglæns. Fradrag=.20*(6−max_r f[r])+.20*(6−max_r b[r]). Rondat er baglæns; blandet serie tæller hverken rent f eller rent b. Nærmeste omgang bruges separat for de to krav. Ukendt plads er ikke automatisk 0. | K; F01–F03 |
| C-REDSKAB; H 10.2.2.5, PDF40 | Mindst én omgang med Pegasus og én uden. Alle tre omgange med seks uden redskab mangler seks i kravet med redskab:1.20; omvendt tilsvarende. En fuld med- og en fuld uden-omgang opfylder kravet. Delvist blandede redskabsomgange: Q04; importer ikke automatisk banens nærmeste-omgangsformel. Legitimt observeret forsøgs undtagelse kan ikke udledes af en kladde. | K for komplette homogene tilfælde, ellers U/O; V01–V03, U08 |
| C-ORDEN; H 9.2.2.2/10.2.2.2 | Omgang 2/3: enkelt før dobbelt, inden for kategorien stigende D. Der kan foreslås en sådan sortering. Sats .10 pr. gang; kilden fastlægger ikke tilstrækkeligt optælling ved flere samtidige fejl. Blandede baneserier og hvilke ekstra gymnaster indgår skal være kildeafklaret. Q06 blokerer berørt præcis fradragsnumerik, ikke en forklaring af en klar forkert rækkefølge. | K for klar opfyldelse, U ved berørte fejl; O01–O02, U09 |
| C-FLOW; H 9.2.2.5/10.2.2.4 og generelle udførelseskrav | Flow, faktisk gennemløb, modtagning, fald og forsøg kræver observation. Der gives hverken automatisk godkendelse eller opdigtet fradrag ud fra planen. | O; C10 |

## C: tillæg

Nedenfor er max altid pr. selvstændig tillægstype over de tre omgange. Alle antal vedrører højst seks tællende gyldige udførelser. D-holdafvigelse alene gør dem ikke ugyldige. Stabilitet ændrer aldrig kvalifikation eller point.

| Id / kilde | Input og præcis beslutning | Status / facit |
| --- | --- | --- |
| B-SKRUE; H 9.2.3.1, PDF31 | .10*max_r antal gymnaster med mindst 360° i ét element. To elementer med 180° hver opfylder ikke kravet. Maks .60. | K; C01, B01 |
| B-DOBBELT; H 9.2.3.2 | .10*max_r antal gymnaster med mindst én dobbelt i serien. Uafhængig bedste omgang fra skruekravet. Maks .60. | K; C02, B02 |
| B-ELEMENT; H 9.2.3.3 | Optæl forskellige gyldige elementer, som landes med fødder først, i hver tællende serie, uden at arve D's top-tre-begrænsning. Ved antal e er ordlydssporet .10*e, eksempelsporet .10*max(0,e−1). Sum over alle tællende serier i alle tre omgange, divider med3. Q01; alternativer må navngives men ingen enkelt autoritativ værdi. | U; U02, U10 |
| T-SKRUE; H 10.2.3.1/10.2.4, PDF40–41 | Junior/senior: mindst540° i enkelt eller180° i dobbelt. U14: mindst360° i enkelt eller180° i dobbelt. .10*max_r kvalificerende antal, maks .60. Tsukahara kræver mindst360° efter håndafsæt eller den beskrevne Kasamatsu-ækvivalens; Tsukahara uden skrue kvalificerer ikke blot pga. indgangens rotation. | K; C03–C07, B03–B05 |
| T-DOBBELT-FRI; H 10.2.3.2 | .10*max_r antal gyldige dobbeltspring uden redskab. Maks .60. | K; C06, C08 |
| T-DOBBELT-REDSKAB; H 10.2.3.3 | .10*max_r antal gyldige dobbeltspring med redskab. Maks .60, uafhængigt af bedste fri-omgang. | K; C07–C08 |

## Potentiale og forhold uden for numerisk bedømmelse

**POT (produktkrav, K):** Beregn hvert muligt tillæg fra holdets faktisk registrerede komplette færdigheder. Et opnåeligt tal kræver en konkret vidneopstilling med seks forskellige tællende gymnaster og gyldig profil/holdomgang. Teoretisk maksimum, dokumenteret mulighed og valgt bidrag er forskellige felter. To hver for sig mulige maksimummer må ikke påstås samtidigt mulige uden et fælles vidne. Afbrudt søgning giver dokumenteret undergrænse, ikke bevist maksimum. Uafklarede spring må ikke bruges som sikre vidner.

**X:** E-bedømmelse, videogenkendelse, fuld rytme-C/D/E, gruppeelementer, licenser og fuld konkurrenceberettigelse er ikke produktberegninger. A6 beskriver faktisk udførelse og er baggrund for observationsgrænsen, ikke en kilde til at simulere fald. Teknisk Regulativs konkurrenceliste på6–12 gymnaster og mixfordeling er forskellig fra kartotekets planlægningshold; større kartotekshold må ikke markeres som en godkendt konkurrenceudtagelse. Rytmeregler behandles særskilt i [rhythm-requirements.md](rhythm-requirements.md).
