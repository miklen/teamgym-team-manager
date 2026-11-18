# Design

## Context

Se `proposal.md` for behovet og delta-specifikationerne for adfærden. `packages/rules/src/dk-engine.ts` beregner allerede C-bidrag, men `C-GENTAG` peger primært på omgangs-ID'er, mens andre bidrag stedfæstes forskelligt. `apps/web/src/composition-guide.tsx` samler bidragene, og `spring.tsx` viser pladsrækken. Domænekommandoen `applyRoundEntries` samler flere ændringsveje, men `fillAmbition` og potentialeforslag har egne skriveveje. Flettekontrakten behandler omgangens ordnede deltagerliste atomisk og validerer den samlede kandidat efter afstemning.

## Goals / Non-Goals

**Goals:**

- Ét afledt grundlag for regelresultat, stedfæstelse og UI-tekststatus, så pladsmarkeringer og C-guide ikke kan modsige hinanden.
- Én håndhævet redskabsgrænse ved alle ændringer af udførende pladser, også ved sammensatte handlinger og fletning.
- En forhåndsvisning, hvor træneren kan gennemskue og vælge hver nødvendig ændring, før noget gemmes.

**Non-Goals:**

- Nye officielle satser eller afgørelse af Q03/Q04/Q06; DK 1.0.0 og REG beholder deres respektive kildestatus.
- Automatisk vurdering af fald, flow eller faktisk udførelse fra en plan.
- Et gemt `apparatus`-felt eller en ny formatversion.

## Decisions

### Stedfæstelse kommer fra regelanalysen

Udvid eller afled et typet fund pr. relevant C-bidrag i `packages/rules` med id, status, kilde, berørte omgangs-/plads-ID'er og foreslået handlingskategori. Brug de eksisterende beregninger og beløb. Gentagelser med lige antal skal knytte begge siders forekomster til fundet og beholde beløbet på bidragsniveau, ikke dele det vilkårligt ud på pladser. Rækkefølge kan bruge de eksisterende `orderFaultIds`. Retning og med/uden redskab kræver et scenariefund, fordi de afgøres over tre omgange. UI'et mapper fundet til kompakt plads- eller omgangsmarkering og åbner uddybning på samme kilde. Alternativet var separate UI-regler, men det ville kunne divergere fra C-analysen og kildepakkerne.

### Redskabstype er en afledt domæneregel

Lav en fælles klassifikation af en trampetplads' valgte springdefinition via dens registrering eller `plannedSkillId`. Gennemgå alle udførende pladser, også ekstra og ambitioner; springløse besatte pladser bidrager ikke til klassifikationen. Reserver fastlægger ikke omgangens type. Placér kontrollen i en genbrugt domænevalidering af den foreslåede omgang og lad alle skriveveje bruge den, herunder `setRoundEntries`, ambitioner, reserveindsættelse, besættelse og anvendelse af potentialeforslag. Valglisten kan filtrere/disable modsat type med forklaring, men den er ikke eneste værn. En ny fælles definition i en ambitionshandling må først blive del af den atomiske kopi, når hele handlingen er gyldig. Alternativet var kun UI-filtrering, som ikke dækker kommandoer og forslag.

### Bevidst redskabsskift har en samlet patch

Byg en forhåndsvisning fra det aktuelle scenarie og bind den til dets aktuelle grundlag, som eksisterende reserve- og forslagshandlinger. For hver berørt besat plads vælges foreneligt spring eller `vælg senere`; for hver ambition vælges foreneligt spring eller eksplicit fjernelse. Vis berørte modtagninger, som bortfalder ved springændring, og beregn D/C og mangler på det foreslåede resultat. Bekræftelsen anvender én domænekommando på én omgang og afviser forældet grundlag. Uændrede plads-ID'er, gymnaster og listeorden bevares; reserver ændres ikke. Alternativet var at slette alle uforenelige spring automatisk, hvilket kunne miste sportslige valg og gøre ambitioner ugyldige.

### Fletning validerer den afledte relation

Ingen ny feltpolitik er nødvendig, men betydningen af eksisterende springreferencer ændres. Behold den atomiske `entries`-liste og dens identiteter og orden. Vurdér kandidatomgangen efter den normale rekonsiliering, inklusive refererede definitioners aktuelle type. Uafhængige ændringer i forskellige omgange flettes fortsat; en kombination, som introducerer blanding, giver forklaret konflikt eller blokering og må ikke anvendes. En fil, der allerede er blandet, kan stadig læses og repareres; indlæsning må ikke være en implicit migration eller skrivehandling. Test begge fletteretninger og ændret definition mod uafhængig pladsændring. Alternativet var at lade efterfølgende C-diagnostik være eneste beskyttelse, men da ville fælles data kunne få en ny fysisk umulig omgang.

### Visuel rytme og tilgængelighed

Følg projektets frontend-skill: pladsrækken forbliver den primære arbejdsflade, med korte tekstmærker og et roligt accentniveau. Et fund åbner en kontekstnær forklaring med regelkilde og næste mulige handling; flere fund samles uden at skjule deres individuelle status. Brug ikoner/tekst og kontrast sammen med farve, synligt fokus, tastaturbetjening og reduceret bevægelse. Træneren skal kunne skelne planlægningsmangel, foreløbig risiko og sikkert fradrag ved første blik. Alternativet var en fuldt farvet baggrund på hver problemplads, men det ville dominere rækkefølgen og sløre de konkrete valg.

### Opfølgende designgennemgang

Den visuelle gennemgang samler pladsens markeringer omkring ét udfoldet detaljefelt. Kompositionsguiden viser planlagt bidrag og den ekstra gevinst ved et konkret forslag. En omgang fremhæver kun et tillæg, når den afledte søgning har en opstilling, der løfter bidraget. Det er visning af eksisterende analyse og forslag. Fælles felter, identiteter, rækkefølge, afhængigheder, pointberegning og flettepolitik påvirkes ikke.

Forslagsdialogen viser gevinsten og de reelle ændringer først. Den afleder springbytter, deltagerskift, roller og flytninger ved at sammenligne samme gymnast i forslagets før og efter. Rene flytninger vises som pladsnumre, og den fulde foreslåede rækkefølge læses i en særskilt visning. Modtagninger, reserver og sikkerhed vises fra samme forslag. Dialogen ændrer kun præsentation og bevarer eksisterende identiteter, fælles værdier, afhængigheder, pointberegning og den samlede anvendelse gennem domænet.

Øverst i forslaget prioriteres forskellen i karakterloftet. Tabellen viser det enkelte tillæg, D, C, summen af C og D og karakterloftet med planlagt E-loft. C+D summeres fra analysens værdier før panelafrunding. Karakterloftet genbruges fra den eksisterende analyse. Et ufuldstændigt eller uafklaret grundlag vises uden en sikker karakterforskel. Begge visninger afledes af samme før- og efterforslag og påvirker ingen gemte felter eller fletning.

## Risks / Trade-offs

- [Mange markeringer på en delvis plan] → Vis kun relevante fund tæt på stedet og læg detaljer bag én tilgængelig uddybning; bevar foreløbig status.
- [Kildeafhængige beløb forveksles med sikre beløb] → Genbrug pakkens beslutningstilstand og skriv faste forventninger i regelprøver, især DK 1.0.0 og REG.
- [Gamle blandede kladder låses] → Tillad indlæsning og rettende handlinger, men afvis ny eller forværret blanding; vis eksisterende diagnostik.
- [Redskabsskift mister modtagning eller ambition] → Forhåndsvis præcise konsekvenser og kræv eksplicit valg pr. berørt plads.

## Migration Plan

Ingen skema- eller dataomskrivning. Gennemgå `apps/web/public/teamgym-data-entry/SKILL.md` og `references/scenarios.md` semantisk for den nye omgangsgrænse, opdatér syntetiske eksempler efter behov, og regenerér struktur, katalog og HTML efter projektets instruktioner. Eksisterende blandede planer får rettelsesvej i UI. Ved tilbagerulning kan kodeændringen fjernes uden filkonvertering; ingen automatisk upload indgår.

Verifikation følger kontrolniveauerne i `AGENTS.md`: målrettede adfærdsprøver under udvikling, derefter én fuld kontrol og lokal brugerprøve før et senere, særskilt klarsignal til commit/push. Større UI-ændringer gennemgås ved højst 390 og 1440 px.
