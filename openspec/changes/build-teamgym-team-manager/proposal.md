# Proposal

## Why

Trænerteamet skal kunne sammensætte hold og seks springomgange ud fra gymnasternes konkrete færdigheder og samtidig se sværhed, komposition, stabilitet og fælles rytmemomenter. En fælles datafil på Google Drive skal gøre arbejdet tilgængeligt for hele trænerteamet uden et særskilt medlems- eller datalager.

## What Changes

- Byg en komplet dansk webapp, TeamGym Team Manager, i `https://github.com/miklen/teamgym-team-manager`. Dette forslag omfatter hele det aftalte produkt; delopgaver er implementeringsrækkefølge, ikke selvstændige MVP-leverancer.
- Publicér hele appen som en statisk SPA på GitHub Pages under `/teamgym-team-manager/`, uden backend, Functions, tokenproxy eller separat database. Google-adgang og Drive-kald foregår i browseren.
- Husk Google-forbindelsen og seneste arbejdsrum mellem besøg, genbrug gyldigt access token og tidligere samtykke, og brug et enkelt Fortsæt med Google ved udløb. Permanent tavs fornyelse kan ikke loves med Googles browsermodel; den konkrete udløbs-/genforbindelsesadfærd er specificeret.
- Google-login, valg/oprettelse af en datafil i en valgt delt Drive-mappe, læsning og gemning med den enkelte træners rettigheder samt tydelig konfliktbesked ved forældede data. Lokale ændringer bevares, indtil brugeren vælger, hvordan arbejdet fortsættes. Samtidig live-redigering er ikke nødvendig.
- Et fælles gymnastkartotek med søgning, oprettelse og redigering, tildeling til ét hold ad gangen samt registrering af komplette baneserier, trampetspring og præcise rytmemomenter.
- Et struktureret katalog og en springbygger med elementidentitet, forbindelser, reglementstilknytning, sværhedsberegning og kildehenvisninger. Fritekst må supplere en færdighed, men må ikke være grundlag for beregninger.
- Stabilitet 1–5 pr. gymnast og konkret færdighed i både spring og rytme; ikke vurderet er særskilt. Overblik viser gennemsnit, minimum, antal lave vurderinger og dækningsgrad uden at påstå statistisk sandsynlighed.
- Oprettelse af flere hold, hvert med eget reglement, fastlåst regelversion, aldersgruppe og holdtype. Første produktleverance har Danmarksserien; arkitekturen og kontrakttest skal allerede understøtte uafhængige hold med forskellige reglementer, så Regionsrækken og Liga senere kan tilføjes uden omlægning af kartotek og brugerflade.
- Pr. hold en redigerbar opstilling med tre baneomgange og tre trampetomgange, valg af gymnaster og deres registrerede færdigheder, udførelsesrækkefølge, tællende/ekstra gymnaster og holdomgang på førstepladsen.
- Løbende forklaring af D, opnåelige og valgte C-tillæg, kendte kompositionsfradrag og manglende oplysninger. Muligheder beregnes ud fra holdets faktisk registrerede færdigheder. Regeltvivl og forhold, der kræver observation af udførelsen, vises eksplicit.
- Rytmematrix under holdsammensætning med fælles individuelle momenter, præcise varianter, hvem der mangler dem, stabilitet og filter som »alle kan med mindst stabilitet 4«. Gruppeelementer indgår ikke i katalog, registrering eller analyse efter brugerens udtrykkelige afgrænsning.
- Uafhængige, uforanderlige regelpakker med data og afgrænsede beregningsmoduler, stabile færdighedsidentiteter, opdateringskontrol, sammenligning før versionsskift og regressionstest af gamle versioner.
- Gennemarbejdet visuelt design efter projektets frontend-skill: rolige arbejdsflader, læsbare lister og matricer, tydeligt hierarki, brug på computer/tablet/mobil og tilgængelige arbejdsgange med tastatur og berøring.

## Capabilities

### New Capabilities

- `drive-workspace`: Google-adgang, fælles fil, rettigheder, gemmetilstand, konflikter og filformat.
- `team-roster`: Hold, gymnastkartotek, medlemskab og holdets regelprofil.
- `skill-catalog`: Strukturerede spring, komplette forbindelser, rytmemomenter og færdighedsregistrering.
- `stability-assessment`: Skala, vurderingsdata og gennemskuelige aggregater for spring og rytme.
- `routine-planning`: Seks omgange, deltagere, rækkefølge og holdomgang.
- `difficulty-scoring`: Kildebaseret og forklarlig beregning af planlagt sværhed.
- `composition-analysis`: Tillæg, muligheder, fradrag, datamangler og regeluklarheder.
- `rhythm-commonality`: Fælles rytmemomenter og stabilitet under holdsammensætning.
- `ruleset-versioning`: Regelpakker pr. hold, sikre opdateringer og kompatibilitet.
- `coach-workspace`: Sammenhængende dansk brugerflade, visuelt design og tilgængelighed.

### Modified Capabilities

Ingen; projektet har endnu ingen eksisterende specifikationer eller applikation.

## Impact

Statisk frontend med direkte Google-adapter, lokal hukommelse for forbindelsen, fælles domæne- og beregningsmoduler, regeldata, test og GitHub Actions-publicering til Pages. Konfliktbeskyttelse kræver en verificeret atomisk betinget Drive-opdatering fra browseren; en tidlig rigtig integrationstest skal bevise den konkrete uploadmetode. Der indføres ingen appserver som fallback. Google Drive er det autoritative lager for trænerteamets data; GitHub indeholder kode, regeldata, syntetiske testdata og OpenSpec-artefakter, aldrig faktiske gymnastoplysninger eller OAuth-hemmeligheder.

Lokale reglementer og trænernotater i parent-mappen er eksisterende læsekilder. [Regelgrundlaget](reference/README.md) indeholder nu otte hashregistrerede PDF'er, komplette dækningslister for A3/A4 og individuelle A1.1-momenter, regelmatrix, 77 faste facitcases og seks konkrete spørgsmål til faglig afklaring. Ingen fælles trænerdokumenter ændres som led i denne change. Design og krav fastlægger beregninger, uafklaret adfærd og sporbarhed til opgaver, så en ny agent kan udføre ændringen uden samtalehistorikken. Katalogkontrol og OpenSpec-validering er ikke en garanti for fremtidig kode eller en ekstern dommergodkendelse.

Hosting-/Google-kontrakten og dens tekniske frigivelsesbetingelse er beskrevet i [GitHub Pages og Drive](reference/github-pages-drive.md). Dette hostingvalg ændrer ikke sportsligt omfang eller udeladelsen af gruppeelementer.
