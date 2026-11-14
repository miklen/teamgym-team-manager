# Design

## Context

Se `proposal.md` for formålet og delta-specifikationerne for den ønskede adfærd. I dag er `WorkspaceSession` knyttet til en indlæst Drive-fil, `main.tsx` indlæser Google ved opstart, og forbindelseslageret husker én fil. Arbejdsrumsformat 7 er et strengt valideret fælles JSON-format; trevejssammenligningen kræver samme arbejdsrumsidentitet og en faktisk fælles basis. Appen hostes statisk uden backend, og brugerens arbejdsrumsdata må ikke lagres vedvarende i browseren som automatisk kladde.

## Goals / Non-Goals

**Goals:** Ét sandfærdigt kladde- og gemmeforløb på tværs af ikke-placeret, lokal og Drive-placeret arbejdsrum; sikker identifikation af målfil; en første skærm med tydelig retning og høj visuel kvalitet; genbrug af den fælles flettekontrakt.

**Non-Goals:** Automatisk synkronisering mellem kopier, skjult kladdegendannelse, flerbrugerredigering af en lokal fil, kontrol over Googles egen filvælger eller en ny server. En browser uden skrivehåndtag får ikke lovet gentagen skrivning til samme lokale fil.

## Decisions

### 1. Én aktiv kladde med eksplicit placering

Sessionsvisningen får en diskrimineret placering: `unplaced`, `local-handle`, `local-download` eller `drive`. Redigering og domænevalidering anvender samme `Workspace` uanset placering; adapteren afgør åbning, gemning og gemmestatus. Drive-forløbets betingede upload og operationafstemning bevares som særskilt adapteradfærd. En ny kladde skabes med eksisterende `createWorkspace()` og er redigerbar fra første handling. `Gem` på `unplaced` åbner placering; `Gem som` opretter eller vælger et andet mål og skifter først aktiv placering efter verificeret succes. Annullering efterlader både aktiv kladde og kildefil intakte. Dette undgår formularspecifikke gemme- eller fletteregler.

Alternativet at oprette en midlertidig Drive-fil eller gemme hele kladden i IndexedDB ville fastholde Google-kravet eller bryde beslutningen om ingen automatisk browserkladde.

### 2. Lokal fil med portabel, afgrænset oprindelse

Almindelige lokale arbejdsrum kan være det samme validerede arbejdsrums-JSON som på Drive. En lokal kopi taget fra Drive bruger en versionsmærket lokal JSON-indpakning med `workspace` og en `origin` med præcis Drive-filreference og et uændret snapshot af den indlæste fælles basis. Indpakningen indeholder ingen Google-token eller hemmelighed og kopieres ikke ind i Drive-filens arbejdsrums-JSON. Læseren genkender både rå arbejdsrumsfiler og lokal indpakning, validerer begge snapshots og kræver samme arbejdsrumsidentitet før oprindelsen kan bruges til fletning. En ufuldstændig eller ukendt indpakning afvises uden erstatning af den åbne kladde. Kildebasis bliver i selve den lokale fil, så fletning stadig er mulig efter browsergenstart eller overførsel til en anden enhed uden skjult browserlagring af gymnastdata.

Alternativet at gemme basis i IndexedDB ville gøre den lokale fil afhængig af én browser og lagre gymnastdata vedvarende dér. Kun at huske Drive-revisionen er ikke tilstrækkeligt til en pålidelig trevejssammenligning, hvis det gamle indhold senere ikke kan hentes. Indpakningen gør kopifilen større; råt arbejdsrums-JSON skal fortsat kunne eksporteres særskilt.

### 3. Browserens filadgang afgør den lokale handling

Når filvælger og skrivehåndtag findes, læses og valideres en valgt fil, håndtaget kan gemmes i Seneste, og Gem skriver til det samme håndtag. Tilladelse kontrolleres igen fra brugerens klik ved senere besøg. Før skrivning sammenlignes den aktuelle fils indhold med basis; en konstateret ændring stopper normal gemning. Eksklusiv skrivestrøm bruges, når den understøttes, og resultatet genlæses efter lukning. Dette er en rimelig beskyttelse for én lokal redaktør, ikke en atomisk konfliktgaranti mod eksterne programmer.

Uden relevant API bruges almindeligt filinput til åbning og download til gemning. Efter download beskriver status, at en kopi er hentet, ikke at den oprindelige fil er opdateret; Seneste tilbyder Vælg fil igen. Et nyt eller andet eksisterende filindhold, som vælges ved første Gem/Gem som, må aldrig erstattes uden et forståeligt, eksplicit valg. Ved alle fejl bevares kladden.

### 4. Seneste er en referenceliste, ikke et datalager

Et særskilt versionsmærket browserlager rummer et lille antal lokale filhåndtag eller fallbacknavne, Drive-fil-id, navn, placeringstype, seneste åbningstid og nødvendig kontoreference. Det rummer ikke arbejdsrumsindhold. Poster identificeres ved lager og præcis filreference, ikke navn eller arbejdsrums-id alene. En lokal fallbackfil skal genvælges og matche forventet arbejdsrumsidentitet; Drive-poster åbnes kun efter verificeret konto og aktuel filadgang. Fjern fra Seneste sletter kun posten. Google-afbrydelse rydder Google-token og tilhørende Drive-poster, men ikke lokale filposter eller en aktiv lokal kladde. Det nuværende huskede Drive-filvalg kan migreres til én Seneste-post uden at læse gymnastdata; eksisterende Drive-filer ændres ikke.

Den almindelige start restaurerer kun referencer og viser overblikket. Den indlæser ikke Google eller åbner en fil automatisk. Et direkte Drive-link er en særskilt indgang, som bevarer eksisterende dyblinkadfærd, kontoverifikation og indlæsningsstatus. Google-scripts indlæses først efter Drive-valg; forbindelse eller fornyelse kræver fortsat brugerens klik, når Google kræver det.

### 5. Overskriv og flet er to bevidste Drive-veje

Gem som til en eksisterende Drive-fil kræver valg af den præcise fil via Google-filvælger eller valideret link. Appen læser aktuel metadata og indhold, viser mål, mappe, navn, identitet og konsekvens, og tilbyder Overskriv. Ved kendt `origin` for netop målfilen og matchende arbejdsrumsidentitet tilbydes også Gennemgå og flet. Fletningen bruger `mergeWorkspace(base, local, remote)` og samme valg pr. faktisk konflikt som i den nuværende Drive-gennemgang; den producerer først en lokal kladde baseret på målfilens aktuelle revision. Brugeren gemmer den særskilt. En lokal fil uden den præcise fælles basis får ikke en fletteknap.

Overskriv er en eksplicit erstatning af hele målfilens domæneindhold, også når den er ændret siden kopieringen. Den aktuelle målversion læses før advarslen, og uploaden bruger betinget versionsskrivning mod denne version med ny operation-id og revisionsmetadata. En ny ændring efter advarslen afvises; et uklart svar afstemmes, før nogen ny upload kan forsøges. Ved forskellig arbejdsrumsidentitet advares særskilt om, at et andet arbejdsrum erstattes. Filnavnet udgør aldrig identitet. Dette opfylder brugerens valg om at kunne overskrive uden at genindføre ubetinget skrivning.

### 6. Første skærm er en arbejdsflade med et stærkt første indtryk

**Visuel tese:** Et roligt, præcist arbejdsbord med varm lys flade, dyb marinefarve, én klar blå accent og generøs typografisk rytme. Det føles som resten af appen, men mere åbent og indbydende. Eksisterende Manrope, brandmærke og farvesystem videreføres; ingen mosaik af ens kort eller markedsføringshero sættes foran handlingen.

**Indholdsplan:** Første besøg viser brand, overskriften **Planlæg dit hold** og en kort forklaring om at samle gymnaster, spring og træningsplaner. **Start fra bunden** er den dominerende handling, mens **Åbn en gemt fil** giver en tydelig vej til tidligere arbejde. Brugeren skal ikke forstå begrebet arbejdsrum for at komme i gang. Ved genbesøg viser **Fortsæt, hvor du slap** den senest åbnede fil som den primære handling; **Åbn en anden fil** og **Start nyt arbejdsrum** er sekundære valg. Øvrige filer står under **Andre filer**. Til sidst vises en kort tillidslinje og et **Sådan opbevares dine data**-link. På mobil skal den seneste fil kunne vælges i første skærm. Lange navne har en læsbar fuldform, og fejl eller manglende adgang vises ved den berørte fil.

**Komposition:** Startfladen er centreret med synlig afstand til vinduets kanter, varme lyse flader og rolig typografi. Ved første besøg får overskrift og de to handlinger en afgrænset venstre rytme; den eksisterende TeamGym-linjegrafik ligger i et beskåret visuelt felt på højre side. Ved genbesøg bliver den seneste fil det visuelle anker i et stort, tydeligt handlingsfelt. Øvrige filer vises roligt i et sidefelt med typografiske filnavne og diskrete skillelinjer; illustrationen træder tilbage. På mobil står den seneste fil før andre valg og øvrige filer nedenunder. Ingen vigtig handling gemmes i illustrationen, og tillidslinjen er synlig uden at stjæle plads fra valget.

**Tekstretning:** “Du arbejder i din browser. Vælg selv, om arbejdsrummet gemmes som en fil på din enhed eller i din Google Drive. TeamGym Team Manager har ingen server, der opbevarer dine arbejdsrumsfiler.” Uddybningen fortæller, at browseren kan huske filreferencer og en tidsbegrænset Google-forbindelse efter brugerens valg, samt at deling styres i Google Drive. Ingen formulering lover, at der slet ikke lagres data, eller at andre med adgang til enheden eller Drive-kontoen er udelukket.

**Interaktionstese:** Start fra bunden åbner arbejdsfladen i én kort, retningsgivende overgang. Åbn en gemt fil folder placeringstyperne ud i samme kontekst uden en ekstra fuldskærm. En Seneste-række giver diskret fokus-/hoverfeedback og viser status uden at flytte layoutet. Alle overgange er korte, kan afbrydes og forsvinder ved reduceret bevægelse. Tastatur, 200 % zoom, skærmlæser og berøringsmål følger appens øvrige regler. Visuel gennemgang begrænses til 390 og 1440 px efter `AGENTS.md`.

**Arbejdsrum-dialog:** Den aktive fil og dens placering er dialogens visuelle anker. **Gem som…** og **Afbryd forbindelse / skift konto** ligger øverst, når de er relevante. Åbning, eksport og startoverblik står samlet under en tydelig filoverskrift. Tekniske Drive-oplysninger og Seneste kan foldes ud. **Inddata med din egen AI-agent** er lukket som udgangspunkt og ligger sidst, så den ikke skubber daglige filhandlinger ned. På mobil kan de vigtigste handlinger nås uden først at rulle gennem AI-vejledning eller metadata.

### 7. Samtykke bestemmes af faktisk lagring, ikke af et bannerønske

Før implementering af samtykke kortlægges egen IndexedDB-lagring, eventuelle cookies og netværks-/lagringsadfærd fra Google-scripts og Picker ved første besøg og ved Drive-valg. Automatisk Google-indlæsning fjernes fra den lokale startvej. Formål, aktør, lagringstid og nødvendighed dokumenteres. Hvis kun teknisk nødvendig lagring bruges, vises ingen cookiebarriere; den almindelige dataforklaring forbliver synlig. Hvis en ikke-nødvendig teknologi kræver samtykke, aktiveres den først efter et kort, indlejret valg i Drive-forløbet med lige tydelige Accepter og Afvis, enkel uddybning og senere ændring/tilbagetrækning. En forudafkrydset “Husk Google”-mulighed må ikke bruges som skjult samtykke til et andet formål. Googles egen iframe-dialog forbliver Googles og må ikke blokeres af en app-modal.

Denne betingede løsning følger Digitaliseringsstyrelsens vejledning om teknisk nødvendige teknologier og lige let accept/afvisning: https://digst.dk/sikkerhed/digitale-tilsyn/tilsyn-med-sporingsteknologiomraadet/cookievejledningen/ . Den endelige afgørelse kræver gennemgang af den faktiske publicerede browseradfærd; et kodesøg alene kan ikke bevise fravær af tredjepartslagring.

### 8. Fælles data og fletning

Startoverblik, Seneste, valgt placering, filhåndtag og samtykkestatus er lokale præsentations-/forbindelsesdata og indgår ikke i fælles arbejdsrumsfletning. Den lokale indpaknings `origin` er kun transport- og sammenligningsmetadata, ikke en trænerbeslutning; den valideres særskilt og skrives aldrig ind i Drive-arbejdsrummets format 7. Eksisterende hold-, gymnast-, spring- og plandata bevarer identiteter og rækkefølge ved kopiering. Revision, `updatedAt` og `recentOperations` får målfilens korrekte gemmekontekst, mens afledte sportslige værdier genberegnes efter gældende domæneregler. Enhver faktisk ændring af arbejdsrummets gemte felter under implementering kræver eksplicit opdatering af den fælles flettepolitik og samtidighedsprøver før færdigmelding.

## Risks / Trade-offs

- [Lokal indpakning fylder mere og kan ikke læses af ældre appudgaver] → versionsmærkning, klar fejl og mulighed for rå arbejdsrums-JSON som eksport.
- [Browser tillader ikke vedvarende filadgang eller tilbage-skrivning] → kapabilitetsstyring, Vælg fil igen og download med ærlig status.
- [En lokal fil ændres af et andet program mellem kontrol og skrivning] → indholdskontrol og eksklusiv strøm hvor muligt; dokumentér én-redaktør-forudsætningen og lov ingen atomisk garanti.
- [Overskriv kan erstatte en anden træners arbejde] → præcis målfil, synlig sammenfatning, eksplicit advarsel, betinget upload og bevaret kildekopi.
- [Google- eller browserlager er utilgængeligt] → tydelig fejl, fortsat lokal kladde og fallback uden automatisk genåbning.
- [Tredjepartslagring overses] → test faktisk første besøg og Drive-forløb, og hold valgfri teknologi tilbage, indtil nødvendighed eller samtykke er afklaret.

## Migration Plan

Eksisterende Drive-JSON og dybe links forbliver læsbare. Ved første start kan den hidtil huskede filreference lægges i Seneste, men der sker ingen automatisk filåbning eller datakopi. Det lokale indpakningsformat indføres additivt; ældre rå arbejdsrumsfiler kan stadig åbnes med den eksisterende eksplicitte migration. Ved tilbageførsel kan den nye app eksportere råt arbejdsrums-JSON. Før lokal brugertest følges projektets kontrolniveauer i `AGENTS.md`; derefter afventer commit, push og publicering brugerens klarsignal.
