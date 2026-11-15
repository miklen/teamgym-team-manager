# Design

## Context

Se [proposal.md](proposal.md) for formålet og [specifikationen](specs/scenario-pdf-export/spec.md) for den synlige adfærd. Springplanen i `apps/web/src/spring.tsx` vælger allerede hold, disciplin og scenarie. Et scenarie har tre ordnede omgange med ordnede udførende pladser og separate, prioriterede reserver. `ScenarioBar` samler handlinger for det valgte scenarie. Appen er statisk, og den aktive kladde kan være nyere end den sidst bekræftede lokale fil eller Drive-fil.

## Goals / Non-Goals

**Goals:**

- Et reproducerbart øjebliksbillede af præcis det scenarie, brugeren ser ved klik, med en ærlig kladdemarkering.
- Et selvstændigt dokument med tekst og sideopdeling, der virker både på skærm og i sort-hvidt print.
- Én delt version, hvor reserver og modtagning kan ses af gymnasterne.

**Non-Goals:**

- PDF'en er ikke en ny redigerbar arbejdsrumsfil eller en automatisk synkroniseret konkurrenceplan.
- Eksporten indfører ikke nye sportslige beregninger, delingsadgang, nye felter eller en officiel godkendelsesstatus.

## Decisions

### 1. Eksportér en frosset lokal snapshot fra scenariehandlingen

Tilføj en altid synlig Download som PDF-knap under scenarierne for det valgte scenarie. Handlingen skal være tilgængelig ved læseadgang. Ved klik færdiggøres eller forkastes en eventuel redigeringsformular gennem den eksisterende forladelsesbeskyttelse. Derefter fastholdes arbejdsrum, hold-id, disciplin, scenarie-id, kladdestatus og eksporttidspunkt samlet, før asynkront font- eller PDF-arbejde begynder. Manglende scenarie må give fejl, ikke et andet scenarie som fallback.

Alternativet at eksportere sidst gemte fil ville skjule lokale ændringer; at læse appens DOM ville afhænge af mobilfaner og åbnede detaljer. PDF'en bygger derfor på domænedata og samme navne-/statusfortolkning som den synlige plan.

### 2. Byg et særskilt dokumentgrundlag før sideopdeling

En ren projektion i `apps/web` omsætter den frosne snapshot til dokumentrækker. Den bruger stabile id'er til opslag, bevarer scenariets omgangsorden, pladsorden og reserveprioritet og viser gymnastens kendetegn, når navnet alene ikke er entydigt. Springnavn og retning følger appens eksisterende formattering. Aktiv modtagning afgøres ud fra den aktuelle gymnast og springidentitet; en nulstillet modtagning får status i stedet for en aktiv instruks. Regelpakkens analyse leverer disciplinens planlagte C og D og D pr. omgang med samme panelafrunding og status som appen. Uafklarede tal vises uden opdigtet beløb. E- og sikkerhedstal overføres ikke.

Projektionen håndterer manglende gymnast, spring eller referencer som eksplicitte teksttilstande. Uden installeret regelpakke bruges kun gemte valg, og dokumentet mærkes som ikke regelkontrolleret. Dette holder PDF'ens indhold uafhængigt af, hvilke editorpaneler der er åbne.

### 3. Generér en rigtig PDF lokalt med målt tekst og sideopdeling

En browserkompatibel PDF-generator tegner tekst, linjer og få diskrete flader på A4 liggende sider. En licenseret skrifttype med danske tegn indlejres, så teksten kan søges og markeres, og filen ikke kræver netadgang efter download. Første side opstiller de tre omgange i tydelige kolonner; hver kolonne har nummereret startliste og adskilt reserveliste. Kompakte rækker samler spring og retning, så en almindelig fuld plan med seks tællende, to ekstra og to reserver pr. omgang er på én side ved læsbar skriftstørrelse. Første side tager højst to reserver fra hver omgang. En sideopdeler måler ombrudte linjer og flytter øvrige reserver, ekstra lange rækker eller overskydende indhold til fortsættelsessider med gentaget dokument- og omgangsnavn. Den reducerer ikke skriften under en fast læsbar minimumsstørrelse for at få alt på én side. Udtrykket bruger typografi og afstand til hierarki og er forståeligt uden farve.

At bruge browserens Print/Gem som PDF ville gøre download afhængig af en systemdialog og browserens printmotor. Et billede af appen ville give dårlig tekstlæsbarhed, kopiere redigeringsfladens layout og risikere afklipning.

### 4. Bevar provenance og fejl som lokale forhold

Dokumentets header viser hold, disciplin, scenarie og eksporttidspunkt uden ordet Øjebliksbillede. Ugemt kladde vises, hvis arbejdsrummet er nyt eller den aktive kladde afviger fra sidst bekræftede fil. Et filnavn med disse menneskelige navne renses for filsystemtegn uden at bruge interne id'er. PDF-bytes hentes kun fra den lokale snapshot og downloades som en fil; ingen Drive-kald, upload eller gemmestatusændring finder sted. Genereringsfejl vises ved handlingen, og kladden bliver stående.

### 5. Fælles konflikthåndtering

Eksporten er en ren visningsfunktion. Den tilføjer ingen gemte felter og ændrer ikke betydningen af eksisterende felter, identiteter eller fletteoperationer. Den læser de eksisterende id-relationer; rækkefølgen er den aktuelle orden i scenarie, omgange, pladser og reserver. Springnavne, modtagningsstatus, planstatus og C/D udledes fra den samme frosne snapshot og gemmes ikke. C og D er afhængige af den valgte regelpakke og dens eksisterende analyse, ikke en ny beregning i formularen eller PDF-koden. Den nye præsentation kan derfor ikke skabe en konflikt eller ændre trevejssammenligningen. Relevante adfærdsprøver skal sikre korrekt scenarievalg, orden og ærlig status, herunder når kladden er nyere end filen.

## Risks / Trade-offs

- **Meget lange lister eller springnavne** → Mål tekst før tegning, behold hele rækker og brug fortsættelsessider med gentaget kontekst.
- **Planen ændres under generering** → Fastfrys input og kladdestatus ved klik; den færdige PDF er et dateret øjebliksbillede.
- **Manglende regelpakke eller ugyldige referencer** → Vis de kendte valg og en konkret advarsel; opfind ingen validering eller spring.
- **Forskellig font- og downloadadfærd på enheder** → Indlejr font, undgå browserens printdialog som eksportvej og verificér både filindhold og udvalgte printlayouts.

## Migration Plan

Ingen datamigration er nødvendig. Funktionens afhængighed og UI indgår i den statiske build. Hvis eksporten må trækkes tilbage, kan UI-handlingen og den lokale PDF-kode fjernes uden ændring af arbejdsrumsfiler.

## Verification

Følg kontrolniveauerne i `AGENTS.md`: relevante adfærds- og browserprøver under udvikling, `verify:full` før lokal brugertest og derefter brugerens afprøvning af den lokale preview. Kontroller én side med to ekstra, seks tællende og to reserver pr. omgang, fortsættelse med flere reserver, PDF'ens tekst, sideopdeling og gråtoneprint med syntetiske data.
