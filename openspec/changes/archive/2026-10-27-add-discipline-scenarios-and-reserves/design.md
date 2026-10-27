# Design

## Context

Se [proposal.md](proposal.md) for motivation og funktionelt omfang.

Den nuværende model har én `RoutinePlan` pr. hold med en tuple på tre omgange i hver springdisciplin. `RoundEntry` har rollerne tællende og ekstra. Springvisningen, regelmotoren og potentialesøgningen finder holdets ene plan og læser disciplinens omgange direkte. Filformatet er aktuelt version 2 med eksplicit migration fra version 1.

Ændringen går på tværs af domæne, analyse, filformat og UI og kræver derfor et samlet design. Dette dokument fastlægger tilgangen. Adfærdskontrakterne ligger i deltaspecifikationerne for [planlægning](specs/routine-planning/spec.md), [arbejdsflade](specs/coach-workspace/spec.md), [filformat](specs/drive-workspace/spec.md), [kartotek](specs/team-roster/spec.md) og [regelversioner](specs/ruleset-versioning/spec.md). [tasks.md](tasks.md) beskriver implementeringsrækkefølgen.

## Goals / Non-Goals

**Goals:**

- Give scenarier en entydig identitet gennem redigering, beregning, duplikering, forslag og gemning.
- Gøre hyppige små variationer hurtige at arbejde med og lette at orientere sig i.
- Levere en smuk, moderne, elegant og intuitiv appoplevelse med den finish, brugeren har efterspurgt. Visuel kvalitet er et selvstændigt godkendelseskriterium.
- Integrere reserver i den eksisterende planlægning uden at ændre pointregler eller betydningen af ekstra gymnaster.
- Bevare eksisterende arbejde og understøtte ufuldstændige kladder.

**Non-Goals:**

- Udpegning af en officiel eller aktiv konkurrenceplan. Brugeren har udtrykkeligt valgt, at navnene er tilstrækkelige i første udgave.
- Sammenkobling af bane- og trampetscenarier til samlede konkurrencepakker.
- Automatisk valg af det bedste scenarie, samtidig sammenligningsvisning eller scenariespecifikke kopier af gymnastkartotek og vurderinger.
- Skadesjournal, automatisk reserveindsættelse eller binding mellem en reserve og en bestemt gymnast.

## Decisions

### 1. Bevar holdets plan som beholder, og læg scenarier under hver disciplin

Den overordnede plan beholder identitet, holdreference og regelbinding. Bane og trampet indeholder hver en ordnet samling af scenarier. Et scenarie har en stabil identitet, et navn og præcis tre omgange; den første er fortsat holdomgang. Hver disciplin har mindst ét scenarie, men ingen produktgrænse på eksempelvis tre eller fem.

```text
Hold
  Plan + regelbinding
    Bane
      Plan A --> 3 omgange --> deltagere + reserver
      Plan B --> 3 omgange --> deltagere + reserver
    Trampet
      Plan A --> 3 omgange --> deltagere + reserver
      Sikker --> 3 omgange --> deltagere + reserver
```

Oprettelse danner tre tomme omgange. Duplikering giver scenarie, omgange, deltagerpladser og reservepladser nye id'er; referencer til gymnaster og færdighedsregistreringer bevares. Kopiens opstillinger er uafhængige af originalens. Fælles ændringer i gymnastens registreringer og effektive sikkerhed slår fortsat igennem i alle scenarier.

Navne trimmes, må ikke være tomme og følger projektets navnegrænse på 200 tegn. Ens navne efter trimning og uden forskel på store/små bogstaver afvises inden for samme holds disciplin med en fejl ved navnefeltet. Samme navn er tilladt på tværs af hold og discipliner. Ved duplikering foreslås eksempelvis `Plan A - kopi`, med et ledigt nummer ved flere kopier; træneren kan rette navnet før oprettelse. Forslagsnavnet afkorter originalnavnet efter behov, så både kopisuffiks og nummer kan rummes. En ny eller duplikeret plan placeres efter det scenarie, man kom fra.

Ved sletning vises navn, disciplin og omfang før bekræftelse. Annullering ændrer intet. Efter sletning vises næste scenarie i rækken eller det foregående, hvis det slettede var det sidste i rækken. Det sidste tilbageværende scenarie kan ikke slettes; forklaringen er synlig ved handlingen. Der indføres ikke særskilt arkiv eller drag-sortering af scenarier i denne udgave.

Alternativer: En kopi af hele holdet ville duplikere fælles person- og færdighedsdata. Et scenarie med begge discipliner ville koble valg sammen, som brugeren ønsker at kunne variere uafhængigt. Begge fravælges.

### 2. Det viste scenarie er navigationstilstand

Det viste scenaries id holdes i appens sessionstilstand, indekseret efter arbejdsrumsidentitet, hold og disciplin. Det huskes ved navigation inden for den åbne app. Efter en ny indlæsning vælges det første scenarie, hvis intet gyldigt valg findes. Der indføres ikke vedvarende lokal lagring af gymnastdata.

Et rent scenarieskift gør ikke arbejdsrummet ugemt, skriver ikke til Drive og ændrer ikke en anden træners visning. Alle scenarier gemmes samlet med arbejdsrummet ved den eksisterende gemmehandling. Valgt fane må aldrig omtales som en fælles aktivering eller en konkurrencestatus.

Oprettelse og duplikering åbner det nye scenarie. Skift håndterer en åben, ændret formular med Opdater, Kassér eller Bliv, før visningen forlades. Opdater ændrer den lokale arbejdsrumskladde og starter ikke en Drive-gemning; en ugyldig formular bliver åben med sine fejl. Allerede anvendte ændringer i arbejdsrummets kladde bevares ved scenarieskift. Fokus og visningskontekst nulstilles kontrolleret, så en åben plads eller et forslag fra Plan A ikke hænger ved i Plan B.

Alternativet med et fælles `activeScenarioId` ville gøre almindelig gennemsyn til en dataændring og ligne den konkurrenceudpegning, brugeren har fravalgt.

### 3. Reserver er en separat prioriteret liste på omgangen

Hver omgang har `entries` til de udførende gymnaster og `reserves` til en ordnet liste af reservepladser. En reserveplads har id, gymnastreference og en valgfri reference til gymnastens registrerede spring. Prioriteten kommer fra listen og vises som 1. reserve, 2. reserve osv. Reserver følger omgangen, også når en anden omgang flyttes først og bliver holdomgang.

Reserver vælges blandt holdets aktive gymnaster med samme springvælger og oplysninger som de udførende. En gymnast må højst forekomme én gang samlet blandt deltagere og reserver i samme omgang. Deltagelse eller reservestatus i andre omgange og scenarier er tilladt. Manglende springvalg kan gemmes som en tydeligt ufuldstændig reserveplads.

En reserve optager ingen tællende eller ekstra plads og indgår ikke i omgangens D, C, rækkefølge, fordelingskrav eller tællende sikkerhed. Reservens egen D og sikkerhed kan vises som beslutningsstøtte. En ufuldstændig reserve gør ikke en ellers komplet udførende opstilling ufuldstændig. Utilgængelige reserver får deres egen forståelige markering.

Med `Sæt ind` vælger træneren en af omgangens udførende gymnaster. En lokal forhåndsvisning viser den valgte reserve, den gymnast der udgår, og konsekvenser for hele scenariets tre omgange. Handlingen bevarer den erstattede plads' rolle og position, indsætter reservens gymnast og valgte spring og fjerner vedkommende fra reservelisten. Træneren bekræfter én samlet ændring. Den udgående gymnast tilføjes ikke automatisk som reserve, da udskiftning kan skyldes skade. Intet skadesflag gemmes.

Placeringen kan kræve en ny springrækkefølge; advarsler og det eksisterende bevidste sorteringsforslag bruges. Ingen skjult sortering finder sted. En aktiv reserve uden valgt spring kan sættes ind som en tydeligt ufuldstændig plads, på samme måde som øvrige kladder. En fjernet eller flyttet gymnast kan ikke sættes ind; en fjernet eller ikke anvendelig færdighed skal først erstattes eller bevidst sættes til Vælg senere. Annullering bevarer både opstilling og reserver. I en tom omgang deaktiveres Sæt ind med besked om først at tilføje en udførende plads; der opfindes ikke et mål eller en rolle.

Alternativer: En tredje rolle i den udførende liste ville blande beredskab sammen med springrækkefølge og deltagergrænser. En reserve pr. gymnast strider mod det bekræftede behov for at kunne reagere på en ukendt skade.

### 4. Smukt og moderne UI gennem hierarki og præcision

Designgrundlag: [projektets frontend-skill](../../../../.agents/skills/frontend-skill/SKILL.md), særligt Apps, Utility Copy, Motion og Litmus Checks. Nedenstående er konkrete kvalitetskrav til denne arbejdsflade.

**Visuel tese:** En rolig og præcis planlægningsflade, hvor typografi, luft, diskrete skillelinjer og én gennemgående accent giver scenarieskift og reserver en elegant, moderne appkarakter.

**Indholdsplan:** Hold og disciplin orienterer øverst. Scenarielinjen ligger umiddelbart før analysen og omgange, så navnet forklarer de viste tal. De tre omgange er hovedarbejdsfladen. Reserver ligger i en sekundær, men umiddelbart aflæselig sektion under hver omgangs deltagere. Detaljer og sjældne handlinger åbnes tæt på konteksten.

**Interaktionstese:** En kort bevægelse i markeringen hjælper øjet ved scenarieskift; en diskret overgang forbinder menu og navnefelt; en sammenhængende flytteanimation viser ændret reserveprioritet eller indsættelse. Animationerne er typisk 120–180 ms, afbrydes ved ny handling og respekterer reduceret bevægelse.

#### Scenarielinjen

```text
Springplan                                Bane | Trampet

Scenarier
[ Plan A ]   Plan B   Uden Pegasus     + Nyt   ...

Planlagt D       Planlagt C       Holdprofil

1. Holdomgang       2. Omgang          3. Omgang
...
Reserver            Reserver           Reserver
1. Gymnast M        1. Gymnast N        + Tilfoej reserve
```

- Linjen føles som en integreret del af arbejdsfladen: afdæmpet baggrund, præcise tekstniveauer og én tydelig markering af det valgte scenarie. Ingen selvstændige dashboardkort pr. scenarie.
- Disciplinvalg, scenarievalg og omgangsvalg har forskellige visuelle niveauer. Tre identiske rækker af kraftige knapper er ikke acceptabelt.
- Direkte klik på et scenarienavn viser planen. `+ Nyt` er en navngivet handling; scenariemenuen tilbyder Duplikér, Omdøb og Slet for det viste scenarie. Menuens tilgængelige navn indeholder scenarienavnet.
- Opret og Duplikér bruger en kompakt formular tæt på scenarielinjen med ét navnefelt, tydelig hovedhandling og Annuller. Feltet får fokus; Enter bekræfter og Escape annullerer. Omdøb følger samme mønster.
- Valgt scenarie signaleres med form/markering og tilgængelig valgt-status, ikke farve alene. Tastatur kan bruge pile samt Home/End til at flytte fokus mellem faner og Enter/Space til at vælge. `tablist`, `tab` og `tabpanel` forbindes korrekt.
- Lange navne afkortes kun i navigationsrækken; det fulde valgte navn er tilgængeligt uden hover via scenariemenuen og for hjælpemidler. Knappen må ikke skubbe `+ Nyt` eller menuen ud af skærmen.
- Ved mange scenarier kan navnerækken rulle vandret i sit eget område med synlig antydning af mere indhold; det valgte element bringes i syne. `+ Nyt` og menuen forbliver tilgængelige uden for rulleområdet. En `Alle scenarier`-liste giver adgang til de fulde navne og søgning, når rækken ikke kan rumme dem. Hele siden må ikke få vandret overflow.

#### Reserveoversigten

- En let skillelinje og overskriften Reserver adskiller beredskabet fra springrækkefølgen. Prioritetsnummeret må ikke ligne en fortsættelse af deltagernes pladsnumre.
- Navn og spring står roligt til venstre, mens D og sikkerhed har konsistente, sammenlignelige placeringer. Brug eksisterende visning med fem sikkerhedstrin, tal og særskilt Ikke vurderet. Ingen gentagen reglementstekst på hver række.
- `Sæt ind` er reserveområdets klare hovedhandling. Redigering, fjernelse og flytning er sekundære. Flyt op/ned skal altid kunne bruges uden drag; en eventuel trækfunktion er et supplement.
- En tom liste har en kort hjælpetekst og `Tilføj reserve`, uden falske eksempler eller store tomme kort. En fyldt udførende omgang må stadig få reserver.
- Syntetiske navne og data bruges i visuelle prøver. Der tilføjes ikke fotografier, dekorative gradients eller illustrationer til denne operationelle arbejdsflade.

#### Mobil, tilstande og finish

- På mobil beholdes scenarielinjen og scenarienavnet før omgangsvalget. Reservefelter må stables, men gymnast, prioritet, spring, D, sikkerhed og Sæt ind bevarer deres sammenhæng.
- Centrale touchmål er mindst 44 × 44 CSS-pixel. Handlinger afhænger ikke af hover, og fokusmarkering er tydelig med tastatur. Dialoger kan rulles på korte skærme; primær handling og Annuller kan nås uden afklipning.
- Læsetilstand tillader scenarieskift og gennemsyn, mens dataændringer er deaktiverede med forståelig kontekst. Navnefejl, manglende referencer, slettet scenarie og afbrudte forslag har hver en konkret næste handling.
- Ved nyt eller tomt scenarie vises de tre tomme omgange og relevante næste handlinger. Analyse viser reelle mangler, ikke nulværdier som om planen var komplet.
- Navn, valgt tilstand, menuåbning, ventetilstand, sletning og reserveindsættelse får passende fokus og statusmeddelelser. Fokus returnerer til udløseren eller en logisk nabohandling.
- Afstande, radius, farver, tekststørrelser og bevægelser tager udgangspunkt i appens eksisterende designsystem. Der indføres ikke en parallel visuel stil eller en ny animationsafhængighed alene for denne funktion.

Alternativet med Excel-lignende faner med tæt kantstruktur og mange små ikoner ville give en genkendelig metafor, men svække mobilbetjening og det rolige hierarki. Metaforen bevares som hurtig navigation og duplikering; den visuelle udførelse følger appens design.

### 5. Beregninger og ændringsforslag får et eksplicit scenarie

Domænekommandoer, analyse og potentialesøgning modtager scenarie-id sammen med hold og disciplin. Den identificerede samling af tre omgange er hele beregningsgrundlaget. Et ukendt scenarie giver en forståelig fejl; der vælges ikke stiltiende det første. Funktioner som regelversionsgennemgang skal gennemgå alle berørte scenarier og navngive dem i resultatet frem for at antage én fælles aktiv plan.

UI og workerbeskeder knytter resultater til arbejdsrum, hold, disciplin, scenarie og beregningsbasis. Ved skift afvises sene resultater fra det foregående scenarie. Et vist potentialeforslag eller en reserveforhåndsvisning kan kun anvendes på det scenarie og den uændrede basis, det blev beregnet for. Scenarienavnet indgår i dialogens kontekst. Eksisterende kontrol mod en forældet arbejdsrumskladde bevares.

Potentialeforslag ændrer kun målscenariets udførende opstillinger. Andre scenarier og fælles registreringer bevares. Reserver bevares, bortset fra at en reserve, der indgår som udførende i den foreslåede omgang, fjernes fra netop den omgangs reserveliste i den synlige forhåndsvisning. Dermed skabes ingen dobbeltplacering. Den udgående gymnast bliver ikke automatisk reserve.

Analyse sker for den viste plan; alle alternativer behøver ikke beregnes ved hvert faneskift eller hvert tastetryk. Skift giver straks korrekt scenariekontekst, mens langsom potentialesøgning har sin egen ventetilstand.

Alternativet med at bytte et scenarie ind i en skjult global aktiv plan ville gøre referencer, workersvar og ændringsforslag vanskelige at holde entydige og risikere ændringer i den forkerte plan.

### 6. Validering og referencegennemgang omfatter alle scenarier

Formatets validering kontrollerer mindst ét scenarie pr. disciplin, tre omgange pr. scenarie, globale entydige id'er, lokale entydige scenarienavne, korrekte disciplin- og gymnastreferencer samt fravær af dobbeltplaceringer i en omgang. Deltagergrænser og ekstra-først gælder kun udførende pladser. Forældede referencer efter fjernelse bevares med diagnoser som i den nuværende model.

Gennemgang af gymnastflytning, fjernelse af gymnast, fjernelse af færdighed og ændring af reglement traverserer alle scenarier og reserver. Antal og berørte steder må ikke kun tælle den åbne fane. Træneren kan identificere disciplin, scenarienavn, omgang og om referencen er en reserve. Fælles ændringer må ikke rydde alternative opstillinger stiltiende.

Alternativet med kun at validere det viste scenarie ville tillade fejl at ligge skjult i en fil, som senere gemmes samlet.

### 7. Visuel og funktionel kvalitet skal kunne verificeres

En færdig implementering skal vurderes på både funktion og oplevelse. Følgende er designets godkendelsesgrundlag, ikke en påstand om allerede udførte prøver:

| Område | Det, der skal kunne demonstreres |
| --- | --- |
| Scenarier | Opret tomt, duplikér med reserver, omdøb, skift og slet uden at ændre andre scenarier eller den anden disciplin. |
| Fælles data | Opstillingsændringer er lokale for scenariet; en ændret fælles sikkerhedsvurdering ses alle relevante steder. |
| Reserver | Prioritet, tydelig rolleforskel, ufuldstændigt springvalg og indsættelse med synlige konsekvenser; Annuller ændrer intet. |
| Beregning | Reserver ændrer ingen omgangstal før indsættelse. Sene workersvar og gamle forslag kan ikke ramme en anden plan. Numeriske forventninger kommer fra uafhængige testgrundlag. |
| Referencer | Fjernelse/flytning og regelændring omfatter også lukkede scenarier og reserver. |
| Filrundtur | Alle scenarier, rækkefølger, navne og reserver bevares; migration kan annulleres uden skrivning. |
| Visuel finish | Manuelt gennemsete skærmbilleder ved 390 px mobil, 768 px tablet og 1440 px desktop, inklusive lange navne, mindst 12 scenarier, tomme og fyldte reserveområder samt læse- og fejltilstande. |
| Betjening | Hele hovedforløbet kan gennemføres med tastatur og touch, ved 200 % zoom og reduceret bevægelse. Ingen afklippede felter, utilgængelige handlinger eller vandret side-overflow. |

Den visuelle gennemgang skal vise, at scenarie, disciplin og omgang kan skelnes ved et hurtigt blik; at alle typiske handlinger kan findes uden forklaring; og at fladen stadig er sammenhængende uden dekorative skygger. En teknisk fungerende faneliste opfylder ikke alene kravet om en smuk, moderne og intuitiv app.

## Risks / Trade-offs

- [En formelt valgt fane forveksles med teamets konkurrencebeslutning] → Hold navigation lokal for sessionen, brug scenarienavne og undlad labels som aktiv konkurrenceplan.
- [Næsten ens planer ændrer hinanden] → Nye id'er ved duplikering, eksplicit scenarie på alle plankommandoer og prøver af isolation.
- [Reserver kommer med i reglernes deltagerantal eller tællende analyse] → Separat samling, eksplicit udførende beregningsgrundlag og prøver af uændrede tal før indsættelse.
- [Alternative scenarier indeholder gamle gymnast- eller færdighedsreferencer] → Fælles traversal, bevarede referencer og navngivne diagnoser i alle berørte scenarier.
- [Fælles vurdering ændrer flere scenariers tal] → Forklar fælles vurderingsgrundlag ved redigering; scenarier er variationer i opstilling, ikke historiske snapshots.
- [Mange eller lange navne gør navigationen uoverskuelig] → Lokal rulning, tilgængelige faste handlinger og fulde navne i Alle scenarier.
- [Større arbejdsrum øger beregningsarbejdet] → Beregn den viste plan og genbrug eksisterende afbrydelse og kontrollen af beregningsbasis; ingen baggrundsberegning af alle alternativer som standard.
- [Formatændring kan ikke læses af en gammel app] → Eksplicit lokal migration, eksportmulighed og tydelig kompatibilitetsbesked før bevidst gemning.

## Migration Plan

1. Introducér arbejdsrumsformat 3. De gamle version 1- og 2-skemaer bevares som selvstændige, strikte læsere; de må ikke ved et fælles genbrugt felt begynde at acceptere version 3-strukturen.
2. Tilbyd en eksplicit lokal migration. Version 1 går gennem den eksisterende bevarende vurderingsmigration; både version 1 og 2 får derefter ét scenarie med navnet Plan A i hver disciplin og tomme reservelister. Eksisterende plan-, omgangs- og plads-id'er samt alle øvrige eksisterende data bevares. Kun de nye scenarier og nye strukturer får nye identiteter.
3. Annullering bevarer den hidtidige session. Accept opretter en lokal kladde; originalen på Drive ændres først ved en bevidst gemning på den faktisk indlæste revisionsbasis. Google-forbindelsens lagerformat ændres ikke.
4. Kontrollér med syntetiske filer formatvalidering, migration, gem/genåbn, eksport, konflikt og afbrudt gemning. Ukendte nyere versioner afvises uden delvis indlæsning eller erstatningsfil.
5. Efter implementering køres relevante automatiske kontroller. Den lokale testudgave bygges separat med `npm.cmd run preview:local` og gennemgås af brugeren før commit, push eller publicering. En eksisterende kladde skal gemmes eller eksporteres før ny testudgave indlæses. Fælles trænerfiler bruges ikke til skriveprøver.
6. Rollback af kode er kun direkte kompatibel med filer, der fortsat har gammelt format. En gemt format 3-fil nedkonverteres ikke automatisk, da scenarier og reserver ellers ville gå tabt. En eventuel manuel tilbageførsel kræver en bevaret ældre eksport og særskilt vurdering af nyere arbejde; intet overskrives automatisk.
