# Proposal

## Why

Den nuværende start kræver Google-forbindelse og en oprettet Drive-fil, før træneren kan begynde. Første besøg skal i stedet give et trygt og smukt overblik, lade træneren arbejde med det samme og gøre valget af filplacering forståeligt ved første gemning.

## What Changes

- **BREAKING:** Almindelig genåbning viser et startoverblik med seneste arbejdsrum frem for automatisk at åbne den sidst brugte Drive-fil. Et direkte arbejdsrumslink åbner fortsat den angivne fil gennem det nødvendige Google-forløb.
- Første skærm forklarer kort, at appen samler gymnaster, spring og træningsplaner, og giver tydelige valg mellem **Start fra bunden** og **Åbn en gemt fil**. Et nyt arbejdsrum er en redigerbar kladde uden valgt placering; første **Gem** vælger lokal fil eller Google Drive.
- Lokale JSON-filer kan åbnes og gemmes efter browserens faktiske muligheder. Understøttede filhåndtag giver gemning i samme fil og genåbning fra Seneste; øvrige browsere bruger filvalg og download med ærlig status.
- **Gem som** opretter en ny lokal eller Drive-fil og skifter til den. Ved en udtrykkeligt valgt eksisterende Drive-fil kan brugeren efter advarsel overskrive eller, når kopien har en kendt fælles basis, gennemgå ændringer og flette. Nyere ændringer under selve gemningen må ikke overskrives.
- Seneste husker kun nødvendige referencer og visningsoplysninger på enheden. Ugemte kladder gendannes ikke efter lukning; advarsler beskytter dem, hvor browseren tillader det.
- Forsiden forklarer i almindeligt dansk, at redigering sker i browseren, og at brugeren vælger, om arbejdsrumsfilen ligger lokalt eller i egen Google Drive. En konkret gennemgang af browserlagring og Google-komponenter afgør, om særskilt samtykke kræves; et eventuelt valg indgår diskret og ligeværdigt i Drive-forløbet.

## Capabilities

### New Capabilities

- `local-workspace`: Lokal filåbning, gemning, filhåndtag, browserfallback, seneste lokale referencer og lokal kopis kendte Drive-basis.

### Modified Capabilities

- `coach-workspace`: Startoverblik, placering før/efter første gemning, seneste arbejdsrum, tryg og præcis datatekst samt visuelt og tilgængeligt Drive-valg.
- `drive-workspace`: Drive åbnes efter brugerens valg, seneste Drive-referencer, oprettelse fra en kladde og sikker **Gem som** til ny eller præcist valgt eksisterende Drive-fil.
- `workspace-merge`: Kendt fælles basis fra en lokal Drive-kopi kan bruges i den fælles trevejssammenligning; overskrivning og fletning må ikke omgå betinget Drive-gemning.

## Impact

Start- og arbejdsrumsfladen i `apps/web`, fil- og sessionsadaptere i `packages/drive`, arbejdsrumsvalidering i `packages/domain`, fælles flettekontrakt, syntetiske domæne-/adapter-/browserprøver og brugervejledning berøres. Den offentlige AI-inddata-skill gennemgås, hvis det lokale filformat eller dets forhold til Drive-formatet ændres. Appen forbliver statisk hostet uden backend; ingen nye afhængigheder er forudsat.
