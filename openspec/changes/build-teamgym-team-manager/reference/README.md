# Regelgrundlag til implementering

Kontrolleret 25. oktober 2026. Læs denne mappe før opgavegruppe 2 og før implementering af regelpakken. Materialet er et konkret fagligt arbejdsgrundlag; der er endnu ingen applikation eller beståede implementeringstests.

| Fil | Anvendelse |
| --- | --- |
| [github-pages-drive.md](github-pages-drive.md) | Statisk hosting, husket Google-forbindelse, tokenudløb og teknisk testbetingelse T01 |
| [source-manifest.json](source-manifest.json) og [sources](sources/) | Otte fastlåste PDF'er med SHA-256; et checkout behøver ikke parent-mappen |
| [rule-matrix.md](rule-matrix.md) | Input, tælleunivers, formler, undtagelser og status for springregler |
| [spring-source-catalog.csv](spring-source-catalog.csv) | Alle 103 trykte poster i A3/A4; 83 tilladte, 19 DK-forbudte, én værdikonflikt |
| [rhythm-catalog.csv](rhythm-catalog.csv) | Alle 94 individuelle momentfelter i A1.1; gruppeelementer udeladt |
| [rhythm-requirements.md](rhythm-requirements.md) | Generelle krav, variantidentitet og præcis afgrænsning |
| [fixtures.json](fixtures.json) | Faste håndberegnede testinput og facit uden produktionskode |
| [questions-for-judges.md](questions-for-judges.md) | Seks konkrete regelspørgsmål og to katalogbemærkninger |

CSV-filer er UTF-8 med semikolon. `reference_id` identificerer en kildepost, ikke nødvendigvis en særskilt sportslig færdighed: fx A3's startvarianter og officielle alias skal normaliseres. De korte danske beskrivelser erstatter ikke kildens tegning og samlede udførelseskrav. Formelbaserede varianter kan eksistere ud over de trykte eksempler, men skal opfylde matrixens gyldighed og forbindelseskrav.

## Udført kontrol og begrænsninger

- De seks oprindelige PDF'er er kopieret uændret fra parent. A1.1 er hentet gennem det officielle link på GymDanmarks konkurrenceside. Alle otte, inklusive Teknisk Regulativ 26/27, er hashregistreret. Kopierne af de seks lokale filer er ikke påstået byteidentiske med senere onlineudgaver.
- A3 og A4 er gennemgået visuelt i deres helhed. Alle 13 sider i A1.1 er gennemgået visuelt; 98 trykte momentfelter er gjort rede for: 94 inkluderet og fire G-felter på side 12 udeladt efter brugerens beslutning. A5's fire sider og hovedreglementets centrale bane-/trampetafsnit er kontrolleret visuelt.
- Katalogerne er manuelt transskriberet og derefter kontrolleret for antal, identitet, værdiformat og kildekonflikter. `DB804` forekommer på to forskellige momenter i selve A1.1; det er bevaret med forskellige interne id'er.
- Facit er udregnet separat fra en fremtidig produktionspakke. Det er samme planagents kontrol, ikke en uafhængig dommers godkendelse. Maskinel kontrol af brøker, antal og checksums er heller ikke sportslig godkendelse.
- Seks spørgsmål påvirker autoritative tal i bestemte situationer. Implementeringen skal levere den specificerede uafklarede adfærd og øvrige funktioner; den må ikke gætte svar. Hele regelpakken må ikke kaldes entydigt fagligt godkendt, før svarene foreligger. Det er ikke en tilladelse til at skære produktfunktioner væk.
- Teknisk Regulativ 26/27 er læst for DK-profiler, holdtyper og deltagergrænser og hentet fra det officielle link til kildebundtet. Fuld licens-/aldersberettigelse er fortsat uden for produktet.

## Afsluttende dokumentkontrol

Kontrollen 25. oktober 2026 bestod for alle otte PDF-signaturer, filstørrelser og hashes; de seks parent-kopier er byteidentiske med originalerne. CSV-kontrol bestod for 103/94 poster, unikke reference-id'er, gyldige positive værdier, 83/19/1 springstatusser, to separate DB804-poster og ingen G-momenter i rytmekataloget. Alle 77 facit-id'er er unikke. En separat regnekontrol af de relevante numeriske cases bestod for D-serier, skruetillæg, disciplinmiddel, C-grænse, retning, elementtillæggets to spor og panelnedrunding. Relative dokumentlinks og `openspec validate build-teamgym-team-manager --strict` bestod. Dette er dokument-/datakontrol, ikke en kørt applikationstest.

## Arbejdsregel for kodeagenten

Brug hovedreglement v1.4 og netop de registrerede bilag. Ældre v1.2/v1.3 og tilfældige søgeresultater er ikke supplerende facit; især må et gammelt maksimum for C-fradrag ikke genindføres. Omsæt faste fixtures til eksekverbare tests uden at hente forventningsværdier fra produktionskataloget. Udvid med integrations- og grænsetests. En kildekonflikt løses kun i en ny, dokumenteret pakkeversion med bevaret gammel adfærd og regressionskontrol.

Hostingmodellen er efterfølgende fastlagt som kun GitHub Pages. T01 i hosting-/Drive-kontrakten er en endnu ikke kørt teknisk integrationstest, adskilt fra Q01–Q06 og sportslig katalogkontrol.
