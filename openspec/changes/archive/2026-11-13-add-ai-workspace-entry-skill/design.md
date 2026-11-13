# Design

## Context

Se `proposal.md` for formålet og `specs/ai-workspace-entry/spec.md` for adfærden. Appen er statisk på GitHub Pages; `vite.config.ts` kopierer `apps/web/public` til udgivelsen. Arbejdsrumsfilens aktuelle version er 7 i `packages/domain/src/schema.ts`; den oprindelige inddata-skill blev skrevet til format 6, før format 7 blev hentet fra origin/main. `WorkspaceSession` validerer og gemmer appens egne ændringer med en Drive-basis og `If-Match`. Den tilgængelige generelle Google MCP-skrivefunktion kan erstatte rå filbytes, men kan ikke angive denne betingelse. Brugerens accepterede risikogrænse gælder alene den frivillige eksterne AI-arbejdsgang.

## Goals / Non-Goals

**Goals:**

- Ét offentligt skill-kildesæt, som både kan læses via URL og installeres som agent-skill, uden adgang til repoets øvrige kode.
- Et præcist inddataforløb, der også omfatter færdige scenarier, og som bliver revideret, når relevante datakontrakter ændres.
- En enkel indgang i det åbne arbejdsrum, der udpeger den faktiske Drive-fil og gør begrænsningen ved direkte MCP-skrivning synlig.

**Non-Goals:**

- En ny MCP-server, Google-integration, backend, tokenoverførsel eller app-API til agenten.
- Sportslig optimering, selvstændig D/C-beregning eller fuld gengivelse af reglementet i inddata-skillen.
- At gøre generisk Google MCP-skrivning atomisk eller give den appens trevejsfletning.

## Decisions

### Én publiceret skill med referencer

Placér den kanoniske `teamgym-data-entry/SKILL.md` med tilhørende `references/` under appens statiske aktiver, så Vite publicerer de samme filer, som ligger i repoet. `SKILL.md` har standardfrontmatter og en kort, agentneutral arbejdsgang; detaljer om schema, katalogopslag, vurdering/arv, scenarier og gemning ligger i fokuserede referencefiler. Relative links skal fungere både fra GitHub Pages og efter installation af hele skill-mappen. Ingen privat filreference skrives i de offentlige filer. En almindelig Markdown-guide uden skill-frontmatter ville være lettere at åbne, men ville miste den direkte installation og aktivering i kompatible agenter; to kopier af vejledningen ville give vedligeholdelsesdrift.

Generér en læsevenlig statisk HTML-visning fra de samme Markdown-kilder. Appens menneskelige link åbner HTML med typografi, navigation og referenceafsnit; den kopierbare agenttekst bruger fortsat den rå `SKILL.md`. Genereringen kontrolleres i `npm run check`, så visningen ikke kan drive fra den installerbare kilde. HTML-visningen ændrer kun præsentation og ingen fælles data, identiteter, rækkefølger eller fletteregler.

### Inddatareferencer fra aktuelle kilder

Format 7 gør skruefordelingen til en obligatorisk del af identiteten for flersaltoer med 1–5 halve skruer. Skillen kræver en præcis fordeling eller afklaring frem for at gætte. Ældre filer migreres af appen til `out`, ikke af agenten.

Udled maskinlæsbare struktur- og katalogopslag fra det faktiske format-7-schema, de installerede regelpakker og deres relevante profiler/kataloger samt springbibliotekets og fundamentets identiteter. Et genereret strukturschema er et supplement: krydsreferencer, unikhed, arveafstemning, omgangsorden og andre domæneregler beskrives eksplicit i referencefiler og prøves mod den rigtige domænevalidering. Hold arbejdsrums-id'er adskilt fra versionsbundne katalog-id'er; agenten finder de første i brugerens aktuelle fil. Officielle koder og visningsnavne bruges til søgning, aldrig som eneste identitet.

En kildeoversigt kobler de relevante domæne-, katalog- og appmoduler til skillens afsnit. `npm run check` skal kontrollere genererede referencefiler, aktuel skemaversion og et review-fingerprint for de semantiske kilder. En ændring af disse kilder kræver dermed bevidst gennemgang af prose og eksempler, selv når versionsnummeret er uændret. Adfærdsprøver bruger syntetiske format-7-filer med registrering, aktiv/egen arv og tre omgange. Mekanisk fingerprint-kvittering alene er ikke dokumentation for korrekt semantik; projektets `AGENTS.md` og reviewopgaven skal gøre den menneskelige gennemgang eksplicit.

### Appindgang uden at dele browserens forbindelse

Brug det eksisterende arbejdsrums-/forbindelsesområde i `apps/web/src/main.tsx`. Når en fil er valgt, vises link til skillen, et direkte Drive-fillink for det aktuelle fil-id og en kopierbar starttekst. Appen må ikke sende sit OAuth-token til agenten. Hvis appen har en ugemt lokal kladde, vises en tydelig besked om at gemme eller eksportere den før agentens eksterne ændring; en lokal kladde findes ikke i Drive-filen. UI-detaljerne udformes efter projektets frontend-skill og uden nye gemte felter.

### Direkte agentredigering følger en afgrænset filprotokol

Skillen beskriver hele arbejdsgangen: vælg én fil ved stabilt fil-id, læs dens indhold og aktuelle metadata, kontrollér version og relevante referencer, byg ændringen på en kopi, vis en kort ændringsoversigt, kontrollér hele filen, genlæs lige før skrivning og stop ved enhver opdaget afvigelse fra basis. Opdatér kun rodens `revision` (+1) og `updatedAt` som gemmemetadata for den eksterne ændring; bevar eksisterende `recentOperations` uden at opfinde en app-operation eller en payloadhash. Skriv hele JSON-filen til samme fil-id og genlæs den for at bekræfte resultatet. Et uklart uploadsvar afstemmes ved genlæsning før et eventuelt nyt forsøg. Den præcise metadatafremgangsmåde skal prøves mod appens indlæsning og konfliktvisning med syntetiske data under implementering.

Vejledningen må ikke foreslå at løse en opdaget konkurrerende ændring med sidste-skriver-vinder. Agenten skal standse og få ændringerne afstemt. Det lukker ikke kapløbet mellem genlæsning og upload; begrænsningen vises både i skillen og appens AI-indgang. En særskilt MCP eller låseprotokol ville kunne ændre denne risiko, men er uden for denne ændring.

### Fælles data og fletning

Skillen indfører ingen felter eller ændret betydning i appens format. Den instruerer eksterne skrivere i at ændre eksisterende definitioner, registreringer og planer, bevare stabile ID'er og ordnede arrays, afstemme arvede effektive værdier og undlade at gemme afledt D, C eller søgestatus. Appens eksisterende flettepolitik for disse data ændres ikke. Appen opdager en ekstern filændring via sin Drive-basis, men selve den eksterne upload går uden om appens atomiske betingelse; dette er en dokumenteret begrænsning, ikke en ny fletteregel. Brugerfladen præsenterer kun henvisning og advarsel; den omskriver ingen fælles data.

## Risks / Trade-offs

- **Samtidig ekstern skrivning** → Sen genlæsning og stop ved kendt ændring mindsker risikoen, men giver ingen atomisk garanti. Skillen og appen forklarer dette uden at love appens beskyttelse.
- **Ufuldstændig agentforståelse** → Små referencefiler, konkrete syntetiske eksempler, tvetydighedsstop og efterkontrol. En skill er stadig instruktion, ikke en håndhævet validator i en fremmed agent.
- **Dokumentationsdrift** → Genererede opslag, versions-/source-check og adfærdsprøver i `npm run check`; semantisk review kræves ved relevante kodeændringer.
- **Kladde i appen** → AI-indgangen gør det synligt, at agenten kun ser Drive-filen, og opfordrer til gemning eller eksport før ekstern redigering.

## Migration Plan

Rettelse af `docs/filformat.md` beskriver version 7 og migration fra 1–6 uden at ændre nogen brugerfil. Udgiv skill og appindgang sammen, så linket aldrig peger på manglende filer. Rollback fjerner appindgang og statiske skillfiler; eksisterende JSON-filer påvirkes ikke. Implementeringen følger kontrolniveauerne i `AGENTS.md` og afsluttes med lokal brugertest før et eventuelt push.
