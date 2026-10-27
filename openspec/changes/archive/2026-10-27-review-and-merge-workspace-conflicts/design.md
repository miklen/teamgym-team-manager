# Design

## Context

Se `proposal.md` for motivation og de tre delta-specifikationer for adfærdskrav.

`WorkspaceSession` holder allerede `loaded.workspace` adskilt fra `draft`, et afsendt snapshot og en eventuel uafklaret gemmeoperation. `checkRemote()` læser hele filen, men beholder i dag kun oplysningen om en nyere version. Gemning knytter sig til filens ETag/version og bruger betinget upload. `workspacePayload()` udelader arbejdsrummets revisionsfelter ved sammenligning.

`packages/domain` har stabile id'er, en streng datamodel, fælles redigeringskommandoer og samlet validering. Ændringer kan udløse følgeændringer gennem vurderingsarv. `apps/web/src/inheritance-context.ts` injicerer aktuelt regelgrundlag ved afstemning; domænet må ikke importere appens regelregister eller Google-kode. Den nuværende UI tilbyder eksport eller bevidst genindlæsning, men ingen sammenligning.

Brugeren har besluttet valg pr. konflikt og gjort vedligeholdelig konflikthåndtering til et permanent acceptkrav. Denne ændring indfører kontrakten for hele den nuværende datamodel, ikke kun de først synlige formularer.

## Goals / Non-Goals

**Goals:**

- Én testbar motor til trevejssammenligning og fletning med eksplicitte domænepolitikker og en fælles præsentationskontrakt.
- Mekanisk kontrol af modeldækning samt adfærdstests af semantik og samtidighed.
- Gennemgang på uforanderlige snapshots, reproducerbare valg og bevidst anvendelse til lokal kladde.
- Bevare nuværende sikkerhed for revisionsbasis, rettigheder, afbrudte forbindelser og ukendte uploadresultater.

**Non-Goals:**

- Ingen CRDT, realtidssamarbejde, operationslog som ny datakilde eller komplet revisionshistorik.
- Ingen forfatterskab pr. felt udledt fra sidste gemning og ingen valg af vinder ud fra tidsstempel.
- Ingen automatisk baggrundsfletning, upload ved anvendelse eller ubetinget overskrivning af hele filen.
- Ingen ny backend, nye runtime-afhængigheder eller vedvarende lager for sammenligningssnapshots. Arbejdsrumsformat 3 kan rumme forløbet uden nye gemte felter.

## Decisions

### 1. Fælles domænemotor med en afgrænset politik pr. databetydning

Motoren placeres i et afgrænset modul i `packages/domain`. Input er basis B, lokal L, ekstern R og en eksplicit kontekst for afledte data. Output er ændringer, konfliktgrupper, mulige valg, diagnoser og kandidatresultat. Motoren bruger hverken netværk, UI, globalt ur eller tilfældige id'er; samme input/kontekst/valg giver samme resultat.

Faserne er fælles: kontrollér kompatibilitet, identificér ændringer, klassificér overlap, forbind afhængige ændringer, anvend valg på en kopi, afstem afledte værdier og validér hele kandidaten. Ingen fase ændrer input. Uafgjorte eller ugyldige resultater returneres som et blokeret resultat, som sessionen ikke kan anvende.

En ren rekursiv JSON-diff blev fravalgt som beslutningsgrundlag: den kender hverken ordnede lister, parrede vurderingsfelter eller relationer. Et særligt merge i hver formular blev fravalgt, fordi det giver modstridende regler og gør nye funktioner svære at kontrollere.

### 2. Udtømmende modeldækning, ikke et ekstra løst schema

En typet politik knyttes til de eksisterende modeller. Hvert gemt felt skal være klassificeret som identitet, selvstændig værdi, atomisk gruppe, samling med nøgle, ordnet liste, afledt værdi eller teknisk metadata. Politikken beskriver også afhængigheder og en semantisk betegnelse til UI. Samlingsnøgler uden selvstændigt id, eksempelvis arverelationer og fravalg, defineres eksplicit fra deres stabile referencefelter.

TypeScript skal kræve alle felter og unionvarianter. En separat strukturel kontrol sammenholder politikken med det faktiske schema, også indlejrede objekter, tuples, lister, uniongrene og atomiske gruppers eksplicitte feltmedlemskab. Kontrollen må ikke nøjes med arbejdsrummets topniveau eller automatisk acceptere nye medlemmer i en allerede kendt gruppe. Variantsamlinger med frie nøgler har en navngivet politik for hele værdien; nye faste schemafelter kræver stadig en beslutning.

Tests med bevidst manglende nested felt og variant skal demonstrere, at kontrollen faktisk fejler. Politikdækning beviser struktur, ikke korrekt betydning. Semantiske ændringer og nye kommandoer skal derfor også vurderes og testes som samtidige handlinger.

Der indføres ingen ekstra serialiseret version af datamodellen. Den eksisterende strenge indlæsning afviser ukendte formater/felter, og merge skal desuden afvise udækket data. Build-/testfejl er den tidlige kontrol; afvisning uden datatab er sidste kontrol ved runtime.

### 3. Regler for den eksisterende datamodel

Den konkrete politik implementeres som del af ændringen og skal dække alle schemafelter. Følgende afgrænsninger styrer den:

| Data | Politik og begrundelse |
| --- | --- |
| Filformat, workspaceId og schemaVersion | Kompatibilitetskrav; kan ikke vælges som almindelige brugerændringer. |
| Arbejdsrummets revision, updatedAt og recentOperations | Sessions-/gemmemetadata; indgår ikke som redigeringskonflikter. Ny gemning bygges på R og får ny operation. |
| Hold, gymnaster, spring, registreringer, planer og scenarier | Identificeres ved stabile id'er. Navne og arrayposition må ikke bruges som identitet. Selvstændige felter kan flettes separat, når afhængigheder tillader det. |
| Vurdering | Sikkerhed, vurderingsdato og vurderingsophav/kildevalg behandles som en sammenhængende gruppe. Note kan flettes selvstændigt, når den ikke indgår i en større afhængig konflikt. Registreringens updatedAt afgør ingen vinder. |
| Springudførelse og forbindelsesbekræftelse | Udførelsens sammenhæng og bekræftelsens konkrete executionIdentity bevares. Udskiftning, nulstilling af vurdering og berørte relationer kræver samlet behandling. |
| Regelbinding og planfingerprint | Behandles sammen med relevante revurderingsmarkeringer og afledte konsekvenser, så en markering ikke knyttes til en anden regelversion. |
| Deltagere og reserver | Hver omgangs deltagerliste og reserveliste er i første version hver en atomisk ordnet liste, inklusive medlemmernes valg. Forskellige ændringer på begge sider kræver valg af hele den berørte liste. Afhængigheder kan samle begge lister, eksempelvis ved flytning mellem deltager og reserve. |
| Scenarier | Navn og indhold kan behandles særskilt; scenariesamlingens rækkefølge er eksplicit. Ensidige tilføjelser/fjernelser bevares, når navn, antal og referencer tillader det. Samtidige uforenelige rækkefølger kræver valg. |
| Arverelationer, fravalg og afledte vurderinger | Trænerens egne valg flettes; afledte resultater afstemmes på kandidaten med den korrekte hold-/regelkontekst og vises som følgevirkninger. |

Atomiske ordnede lister giver enkelte ekstra konfliktvalg, men har en enkel, forudsigelig betydning. Fletning af forskellige positioner i samme liste udskydes; fletning af uafhængige omgange, scenarier og vurderinger er stadig mulig.

To sessioner kan oprette samme præcise spring eller registrering med forskellige id'er. Motoren skal opdage identitets-/unikhedssammenstød og gruppere tilføjelser med deres referencer, så valg af én sides ændring giver et gyldigt resultat. Den må ikke stiltiende udskifte id'er eller deduplikere med risiko for ændret betydning.

### 4. Afhængigheder og validering giver konkrete valg

Konfliktgrupper dannes af de ændringer, der ikke kan vælges uafhængigt. Regler skal eksempelvis forbinde sletning med redigering/referencer, ens scenarienavne, forskellige registreringer af samme præcise spring, flytning/arkivering med berørte opstillinger og ændret kilde med et eget vurderingsvalg.

Hver gruppe har en stabil nøgle, begrundelse, berørt kontekst og to alternativer: Min udgave og Filens udgave. Et alternativ vælger den pågældende sides ændringer for hele gruppen og bevarer uafhængige ændringer udenfor. Ingen konflikter forhåndsvælges. Valg på grupper fra en anden gennemgang accepteres ikke.

Efter valg afstemmes afledte data via en ren, injiceret domænekontekst og hele resultatet valideres. Afstemning må ikke ophæve eksplicitte valg stiltiende. Kandidatens følgevirkninger indgår i forhåndsvisningen; ændret kontekst kræver ny beregning. En valideringsfejl omsættes til en forklaret, udvidet gruppe, hvor en kendt politik findes. En uklassificeret fejl blokerer anvendelse med diagnose og bevaret kladde. Der opfindes ikke en generel 'fjern ugyldige data'-reparation.

Validering alene er ikke nok: eksempelvis kan en arvekilde og et eget vurderingsvalg være syntaktisk gyldige, men have uforenelig betydning. Disse forbindes af domænepolitikken og adfærdstests før den afsluttende validering.

### 5. Sessionen ejer netværk, levetid og revisionsbasis

En gennemgang har egne uforanderlige snapshots og en binding til fil, workspaceId, session-/forbindelsesgeneration, B/L-payload, R's ETag/version og afstemningskontekst. Den gemmes kun i hukommelsen og holdes adskilt fra sessionens levende kladde og gemmeoperation.

```text
Nyere fil konstateret
        |
        v
Afstem eventuel uafklaret egen gemning
        |
        v
Hent konsistent R --> beregn B / L / R --> vis og vaelg
                                                |
                                                v
                         Kontroller kladde, kontekst og nyeste R igen
                                                |
                                                v
                         Anvend til lokal kladde med R som basis
                                                |
                                                v
                         Saerskilt gemning med betinget upload
```

Ingen uafklaret upload må være i gang, når en gennemgang beregnes/anvendes. En tidligere operation afstemmes først med eksisterende operations-id og payloadhash. Hvis egen gemning genkendes i en senere ekstern version, er det afsendte eget snapshot den nye fælles basis; den levende kladde indeholder eventuelle fortsatte lokale ændringer. Kan udfaldet ikke afklares sikkert, må gennemgangen ikke anvendes. En genkendt operation må ikke blot efterlade en gammel basis, som fejlagtigt præsenterer eget gemt arbejde som eksternt.

Før anvendelse genlæses/kontrolleres den aktuelle filbasis og skriveadgang. Ved ændret lokal kladde, basis, regelkontekst, fil eller forbindelse afvises gamle resultater. Ved ny ekstern version kræves ny gennemgang; konfliktvalg overføres ikke automatisk. Afventende svar fra en gammel generation kasseres. Fejl og annullering beholder kladden.

Ved succes sættes `loaded` til det gennemgåede R og `draft` til den validerede kandidat med R's revisionsmetadata. Afsluttede/gamle pending-operationer ryddes; en senere gemning opretter en frisk operation. Kandidat lig R giver uændret tilstand, ellers lokale ændringer. En ekstern skrivning efter kontrollen fanges fortsat af `If-Match` ved den særskilte gemning.

Gennemgang erstatter ikke eksport, bevidst kassation eller almindelig afbrydelsesbeskyttelse. Der logges ingen payloads eller credentials.

### 6. Én dansk arbejdsflade for alle datatyper

En fælles dialog eller arbejdsflade viser ændringer med hierarki: status/omfang, konfliktvalg og øvrige ændringer. Motorens output bruger semantiske nøgler, kontekst og før/efter-værdier; appen oversætter og formaterer dem. Nye datatyper udvider denne kontrakt, ikke hele forløbet. UI-komponenter implementerer ingen fletteregler.

Visuel retning: rolige flader, tæt læsbar information, typografi og skillelinjer frem for kortmosaik. Primært indhold er gennemgangen; sekundært indhold er uafhængige ændringer og følgevirkninger. På smalle skærme stables Før, Min udgave og Filens udgave med gentaget kontekst. Fokus flyttes til gennemgangen ved åbning, til relevant fejl ved blokering og tilbage til udløser/relevant arbejdsflade ved lukning. Korte overgange understøtter åbning og statusændring og respekterer reduceret bevægelse.

Uafgjorte konflikter tælles og kan findes direkte; en sammenhængende gruppe forklarer, hvorfor valget omfatter flere ændringer. Lange lister kan filtreres efter hold/område og konfliktstatus uden at miste foretagne valg. Labelen før beregning er Nyere fil, ikke en påstand om faktiske overlap.

Åbne ændrede formularer afklares før snapshot og anvendelse. Opdater betyder lokal kladde, ikke upload. Gamle formularer må ikke genaflevere forældede data efter en fletning; relevante editorer nulstilles/lukkes med den fælles ændringsbeskyttelse.

### 7. Fremtidige funktioner skal opfylde en fast udvidelseskontrakt

Implementeringen tilføjer en regel i `AGENTS.md` og en konkret vedligeholdelsesvejledning: hver funktion vurderer fælles data, felt-/gruppepolitik, identiteter, rækkefølge, afhængigheder, afledte værdier, præsentation og tests. Rene visningsfunktioner kan begrunde ingen påvirkning. Nye persistente data eller ændret semantik kræver passende ændringer og verifikation, før opgaven markeres færdig.

Modeldækning køres i de normale kontroller, ikke i et valgfrit særskilt forløb. Adfærdstests dækker repræsentative par af domænehandlinger på fælles basis, herunder kombinationer på tværs af funktioner. Tests omfatter også invariants: ens sider giver ingen konflikt, uændret side bevarer den anden, input muteres ikke, gentagen beregning er deterministisk, og anvendte resultater er gyldige uden tab af uafhængige ændringer.

## Risks / Trade-offs

- Afhængighedsgrupper kan blive store. Modtræk: små eksplicitte politikker, forklaring af gruppens omfang og tests af at uafhængige data fortsat kan vælges separat.
- Modeldækning kan give falsk tryghed ved semantiske ændringer. Modtræk: permanent krav om vurdering af alle funktioner og adfærdstests, også uden nye felter.
- Tidsstempler og arv kan skabe støj. Modtræk: skeln brugerændringer, revisionsmetadata og afledte værdier; injicér stabil kontekst og vis følgevirkninger.
- Nye konflikter kan opstå under gennemgang. Modtræk: forklar forældelse, bevar kladden og kræv ny gennemgang; behold betinget upload.
- Hele filen og flere snapshots bruger hukommelse. Modtræk: beregn på id-indekser, undgå gentagen fuld serialisering pr. række og frigiv snapshots ved afslutning. Mål med et syntetisk stort arbejdsrum før levering; indfør kun worker, hvis målingen begrunder det.
- En ældre app kan stadig vise den gamle konfliktbesked. Modtræk: behold filformatet og uploadbeskyttelsen; UI-forbedringen må ikke kræve, at alle sessioner opgraderes samtidigt.

## Migration Plan

1. Implementér kontrakt og dækningskontrol for format 3 samt motor og domænetests før UI-integration.
2. Integrér session og fælles gennemgang med regressionsprøver af eksisterende eksport, migration, afbrudt adgang og gemning.
3. Opdatér vedligeholdelsesvejledning og `AGENTS.md` som del af implementeringen, og kør projektets relevante kontroller.
4. Byg `dist-local/`, start lokalvisningen på port 5173 og kontrollér, at appen åbner. Brugeren afprøver den færdige udgave, mens serveren kører og ingen genbygning foretages.
5. Commit/push/publicering afventer brugerens udtrykkelige klarsignal efter lokal test. Eksisterende fælles trænerfiler bruges aldrig til skriveprøver. Faktisk to-konto-test og T01 betegnes kun bestået med konkret evidens.

Tilbagerulning af appen kræver ingen datafilnedkonvertering, da der ikke tilføjes gemte flettefelter. En lokal, endnu ugemt samlet kladde skal eksporteres før genindlæsning ved tilbagerulning.
