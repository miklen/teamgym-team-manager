# Proposal

## Why

Trænere kan allerede give en agent adgang til arbejdsrummets JSON-fil via deres egen Google MCP, men en agent uden kodebasen mangler en pålidelig beskrivelse af filformat, identiteter og afhængige ændringer. Appens format og regelkataloger udvikler sig, så vejledningen skal følge de aktuelle kilder frem for at blive endnu en forældet beskrivelse.

## What Changes

- Udgiv én dansk, agentuafhængig `SKILL.md` til direkte inddata i et valgt TeamGym-arbejdsrum via brugerens eksisterende Google MCP. Skillen kan læses som et almindeligt Markdown-link eller installeres i en kompatibel agent.
- Beskriv opslag og præcis registrering af hold, gymnaster, spring og rytmemomenter, vurderinger, noter, arv samt færdige scenarier med tre bane- eller trampetomgange, ordnede pladser og reserver. Agenten skal kunne omsætte trænerens noter og besluttede opstillinger til filændringer uden repo-adgang.
- Tilbyd skillen og en kort kopierbar starttekst fra det åbne arbejdsrum, med link til den valgte Drive-fil uden token eller private data i den publicerede vejledning.
- Publicér versionsbundne referenceopslag og en vedligeholdelseskontrol, som opdager ændringer i filformat og de kataloger og regler, der påvirker inddata. Opdatér den eksisterende filformatbeskrivelse til det aktuelle format.
- Beskriv en tydelig arbejdsgang for læsning, ændringsgennemgang, sen genlæsning, skrivning og efterkontrol. Google MCP's direkte skrivning har ikke appens atomiske `If-Match`-beskyttelse; brugeren har accepteret den resterende risiko for samtidige skrivninger. Skillen må ikke love konfliktfri gemning.
- Sportslig sammensætning eller optimering af omgange ud fra D, C og reglementet er en særskilt fremtidig evne. Denne ændring registrerer en opstilling, træneren allerede har valgt.

## Capabilities

### New Capabilities

- `ai-workspace-entry`: Offentlig, ajourført agentvejledning og appindgang til direkte registrering i den valgte Drive-fil, inklusive færdige scenarier og omgangsopstillinger samt ærlig beskrivelse af skrivebegrænsningen.

### Modified Capabilities

Ingen eksisterende krav ændres. Appens egen Drive-gemning, datavalidering, regelberegning og fælles flettekontrakt fortsætter efter de eksisterende specifikationer.

## Impact

Berører statiske appaktiver, arbejdsrummets indstillingsflade, dokumentation og `npm run check`. Referenceindholdet hentes fra `packages/domain`, `packages/rules` og det praktiske spring- og arvekatalog i `apps/web`; ingen nye gemte arbejdsrumsfelter, Google-scopes, backend eller appstyret uploadvej indføres. Eksterne agentændringer rammer de eksisterende fælles felter, identiteter, listeordener og afhængigheder; appens flettepolitik ændres ikke, men skillens skrivevej har ikke samme atomiske konfliktgaranti.
