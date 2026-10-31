## Why

Springplanen forudsætter i dag, at gymnasternes færdigheder er registreret, før omgangene kan sammensættes. Mange trænere arbejder den anden vej: de skitserer først de omgange, holdet skal arbejde hen imod, og besætter pladserne, efterhånden som gymnasterne lærer springene, eller kataloget bliver udfyldt. Den arbejdsgang understøttes ikke i dag, og en tænkt målomgang kan ikke vurderes for sværhed og tillæg, før den er fuldt besat.

## What Changes

- En omgangsplads kan oprettes som en **ambition**, det vil sige et valgt spring uden gymnast. Ambitionen er en del af det nuværende scenarielag og oprettes i den eksisterende Tilføj plads-dialog med et nyt valg, **Ingen gymnast endnu**. Springet vælges derefter fra disciplinens springkatalog i stedet for en gymnasts registreringer.
- En ambition har rolle (tællende/ekstra) og position som en almindelig plads og kan flyttes med de eksisterende rækkefølgehandlinger.
- **Besættelse:** Når en ambition åbnes, er springet fastlåst. Gymnastlisten viser først de ledige, aktive holdmedlemmer med en aktiv anvendelig registrering af samme spring (samme springidentitet, afledte registreringer medregnet) med sikkerhed. Andre gymnaster vises som *kan ikke endnu*, kan ikke vælges og har en genvej til deres færdigheder. Besættelse gør pladsen til en helt almindelig plads med gymnast og registreret spring. Ambitionen efterlader intet spor.
- Når gymnasten fjernes fra en besat plads, forsvinder pladsen som i dag. Ambitionen genoprettes ikke automatisk.
- **Overblik:** Hver ambition viser tydeligt *mangler gymnast* og antallet af gymnaster, der kan tage pladsen nu, beregnet løbende ud fra de aktuelle registreringer. Gymnaster, der allerede er deltager eller reserve i samme omgang, tæller ikke med. Tallet er afledt og gemmes ikke.
- **Analyse:** Ambitioner tæller fuldt med i omgangens og scenariets D, C, tillæg, fradrag og omgangsguide, beregnet fra springdefinitionen under holdets regelpakke. Der vises ingen opdeling mellem besat og ambition. En omgang med ambitioner vises som ufuldstændig planlægning og aldrig som et gennemført forsøg eller et fradrag. Sikkerhed og mixfordeling vurderes kun på besatte pladser, og ambitionerne vises som manglende grundlag.
- **Afgrænsninger:** Reserver er altid gymnaster og kan ikke være ambitioner. En ambition kan ikke bære planlagt modtagning. Duplikering af et scenarie kopierer ambitionerne. Potentialeforslag behandler ambitionspladser som faste og ændrer eller fjerner dem ikke. Appen besætter aldrig en ambition automatisk.
- **UI:** Ambitionen skal have et moderne, elegant og intuitivt udtryk i appens visuelle sprog. Den skal være let at skelne fra en besat plads uden at fremstå som en fejl, og *kan nu*-tallet skal kunne aflæses med et blik. Det gælder både desktop og mobil, uden vandret overflow og med fuld tastatur- og skærmlæserstøtte. Status må ikke formidles alene med farve eller ikon. Implementering af al UI SHALL følge projektets frontend-skill (`.agents/skills/frontend-skill/SKILL.md`).
- **BREAKING (filformat):** Et nyt arbejdsrumsformat lader en plads mangle gymnast og bære et planlagt spring. Ældre filer migreres eksplicit og uden tab. Ældre apps afviser det nye format som et nyere format i stedet for at overskrive det.
- Flettepolitikken udvides eksplicit for ambitioner, blandt andet når to trænere samtidigt besætter samme ambition eller den ene ændrer ambitionens spring, mens den anden besætter pladsen.

## Capabilities

### New Capabilities

- `routine-ambitions`: Ambitionspladser i springomgange. Dækker oprettelse uden gymnast, valg af spring fra kataloget, matchregler, besættelse, *kan nu*-overblikket, visning af manglende gymnast og afgrænsning over for reserver, modtagning og forslag.

### Modified Capabilities

- `routine-planning`: En omgangsplads kan mangle gymnast, når den har et planlagt spring. Tilføj plads-dialogen får valget Ingen gymnast endnu. Ufuldstændighed omfatter *mangler gymnast*. Duplikering, rækkefølge, holdomgang og potentialeforslag har eksplicit betydning for ambitioner. Reserver forbliver gymnaster.
- `difficulty-scoring`: D beregnes for en ambition ud fra springdefinitionen uden gymnastregistrering og tæller med i omgangens D.
- `composition-analysis`: C, tillæg, fradrag og omgangsguiden medtager ambitionspladser som planlagte spring uden at markere planen som gennemført.
- `stability-assessment`: Sikkerhedsdækning vurderes kun på besatte pladser, og ambitioner vises som manglende grundlag.
- `planned-spotting`: Modtagning kan ikke planlægges på en ambition.
- `drive-workspace`: Nyt arbejdsrumsformat, eksplicit migration fra tidligere formater og afvisning i ældre apps.
- `workspace-merge`: Flettepolitik for ambitionspladser og samtidig besættelse eller ændring af ambitionens spring.

## Impact

- `packages/domain`: schema (nyt format, plads med valgfri gymnast og planlagt spring), migration, kommandoer (opret ambition, besæt ambition og validering i eksisterende pladskommandoer), `merge-policy.ts`, dækningskontrol og samtidighedstests.
- `packages/rules`: D/C-beregning og omgangsguide skal kunne evaluere en plads ud fra springdefinitionen uden registrering. Sikkerheds- og mixvurdering skal håndtere ubesatte pladser. Potentialesøgningen (`potential.ts`, `potential.worker.ts`) skal respektere faste ambitionspladser.
- `packages/drive`: migrationsflow og fletning med en migreret basisfil.
- `apps/web`: Tilføj plads-dialogen (`spring.tsx`), springvalg fra kataloget (`spring-library.ts`, `spring-picker*`), visning af ambitionsplads, *kan nu*-markering, matchsorteret gymnastvalg, konfliktvisning og migrationsdialog. Al UI implementeres efter projektets frontend-skill.
- Dokumentation: `docs/vedligeholdelse-fletning.md`.
- Tests: domæne, regler (faste facit, ikke genereret fra produktionsreglerne), fletning i begge retninger, Drive-migration og e2e for ambitionens livsforløb. Kun syntetiske persondata.
