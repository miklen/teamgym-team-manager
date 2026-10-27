# Design

## Context

Motivationen og omfanget fremgår af [proposal.md](proposal.md). Design er nødvendigt, fordi ændringen går gennem filformat, domænekommandoer, Drive-session, registrering og planlægning.

Observeret i den nuværende løsning:

- `apps/web/src/spring-library.ts`: `shorterSeries` laver kun præcise begyndelser. `springRegistrationPlan` vælger laveste D og materialiserer sikkerhed ved registrering, men `sourceName` gemmes ikke i arbejdsrummet. `registerSpringBatch` kan derfor ikke vedligeholde arven bagefter.
- `packages/domain/src/commands.ts`: `updateAssessment` kender ikke egne kontra arvede vurderinger. `replaceAthleteSkill` bevarer registrerings-id, men nulstiller vurdering og bekræftelse ved ændret udførelse. Disse indgange samt arkivering og holdflytning skal omfattes af samme arveopdatering.
- `packages/domain/src/schema.ts` bruger strikte objekter og formatversion 1; ekstra metadata kan ikke blot tilføjes uden kompatibilitetshåndtering. `workspace.ts` afviser nyere versioner og kræver eksplicit migration af ældre.
- `packages/drive/src/client.ts` beregner revisionsbasis og indholdshash fra de læste bytes; sessionens uændrede basis må ikke erstattes med en migreret fil, som om den allerede var gemt.
- `apps/web/src/skill-editor.tsx` tilbyder rytmenavn som valgfri visningstekst og opretter rytme uden sikkerhed. Springoprettelsen har allerede sikkerhed og vurderingsdato.
- `apps/web/src/athletes.tsx` viser færdigheder i tre flade discipliner med én boks pr. registrering. `spring-picker.tsx` har brede grupper og separate sammenfoldede oversigter for egne valg og kortere serier.
- `apps/web/src/spring.tsx` viser `adjustedD.value` på omgangspladsen; den bliver null ved manglende holdreference i en ufuldstændig første omgang. `originalD` og selve springets beregnede værdi findes allerede. Springvælgerens optioner viser ikke D.
- Visningsnavne for færdige baneserier kommer fra opskrifter, mens trampet typisk bruger kildekatalogets navn. Det forklarer manglende rudy-navn og gradtegn uden at kræve ændrede kildebytes.

Et skrivebeskyttet produktionsudsnit blev brugt til at forstå størrelsesordenen: én gymnast med 22 registreringer, fordelt på 13 bane, 8 trampet og 1 rytme. Ingen navne, id'er eller filbytes herfra må indgå i kode, fixtures eller billeder. Syntetiske repertoirer skal konstrueres selvstændigt.

## Goals / Non-Goals

**Goals:**

- Samme præcise identitet og samme arveresultat i forhåndsvisning, registrering, redigering, filrundtur og plananalyse.
- Gøre egne vurderinger, løbende arv, fravalg og manglende arvekilde forståelige uden tekniske felter i produktforløbet.
- Lade tættere desktopvisning og mobilvisning bruge samme data og handlinger.
- Bevare ældre data og den eksisterende betingede Drive-gemning, mens format 2 indføres.

**Non-Goals:**

- Ingen ny officiel regelpakke, ændret D/C-formel, ændrede kildedata, statistisk risikomodel eller automatisk sammensætning af nye serier fra enkeltfærdigheder.
- Ingen generel redigerbar regelmotor for trænere, ny backend, nye OAuth-scopes eller vedvarende browserlager for gymnastdata.
- Ingen automatisk tilbageskrivning til den læste fælles fil og ingen implementering som led i denne proposal.

## Decisions

### 1. Adskil relationer, arveberegning og visning

Brug et særskilt, versionsmærket katalog over trænerfaglige relationer i web-appens springområde sammen med det eksisterende praktiske forbindelseskatalog. Hver relation har stabilt id, præcis kilde-/målidentitet, relationstype og forklaring. Rene funktioner i `packages/domain` håndterer validering, fravalg, kildevalg og propagation med injicerede relations- og rangordningsdata; domænet må ikke importere webappen eller en konkret regelpakke. Weblaget beregner D-rangering via holdets eksisterende regelpakke og dennes eksakte talrepræsentation.

Kildevalg sker i den aktuelle holdbinding. Ved et bevidst hold-/regelbindingsskift genberegnes rangeringen af allerede accepterede relationer sammen med den øvrige konsekvensvisning. For en gymnast uden hold bruges den eksplicit valgte registreringskontekst; ingen ny skjult regelpakke vælges. Når en nødvendig pakke mangler, bevares en stadig gyldig eksisterende kilde, og manglende D/kildevalg forklares.

Alternativer: Direkte ændring af `packages/rules` ville blande officiel pointviden og praktisk kunnen. En generel regel »lavere D følger med« ville tildele færdigheder på tværs af teknik og redskab og kan ikke bruges.

### 2. Start med en lille, præcis relationsmatrix

Første katalogversion dækker disse aftaler:

| Kilde | Automatisk medtaget fundament | Afgrænsning |
| --- | --- | --- |
| Komplet baneserie | Alle præcise kortere begyndelser med indgang | Ingen fjernelse af elementer midt i serien eller ny forbindelse |
| Rondat-flik-strakt baglæns helskrue | Rondat-flik med lukket, hoftebøjet og strakt baglæns salto uden skrue | Indgang, baglæns retning og én salto bevares |
| Rudy uden redskab på trampet | Lukket, hoftebøjet og strakt enkeltsalto med 0° og 180° | Forlæns retning, samme afsæt/landing og intet redskab |
| Forlæns dobbelt med 540° uden redskab | Dobbelt med 180° | Samme kropspositionsforløb; [3,0]/[1,2] giver [1,0], og [2,1]/[0,3] giver [0,1], i halve skruer |

Matricen genbruger præcise katalogudførelser og strukturerede formelvarianter; den ændrer ikke deres gyldighed. Dobbeltrelationen fjerner hele skruer i den salto, hvor de ligger, og bevarer pariteten pr. salto. Den dækker alle kombinationer af lukket/hoftebøjet/strakt pr. salto med præcist bevaret positionsforløb. Denne konkrete fordelingsregel er et foreslået designvalg for at gøre brugerens 540°-til-180°-aftale implementerbar, ikke en ny officiel ækvivalensregel. De fire fordelingspar og mindst én blandet positionscase skal være faste, gennemgåelige facitcases i relationskataloget.

Hvis et valgt dobbelt 540°-spring mangler fordeling, vises 180°-barnet straks som et medtaget fundament med Afklar skruefordeling. Afklaring på parenten færdiggør barnet automatisk; træneren kan også fravælge det. Et uafklaret barn kan ikke oprettes som en ny præcis registrering. Før samlet registrering skal træneren enten afklare eller fravælge det uafklarede barn; parenten kan ved fravalg bevares som uafklaret efter de eksisterende regler. Der opfindes ingen fordeling, og behovet må ikke skjules ved blot at undlade dobbeltrelationen.

De fælles begyndelser og de nye positions-/skruerelationer beregnes som et endeligt, acyklisk fundament. Ved nye registreringer eller bevidst tilføjelse af fundament vises hele resultatet før accept. Appopdatering og genåbning må ikke anvende nye katalogrelationer på gamle gymnaster uden en sådan handling.

Brugerens opfølgning udvider trænerkataloget til version `2`: En kendt, tilladt forlæns indgangssalto kan fjernes, når resten af den præcise serie har en selvstændig indgang fra tilløb. Restens elementer, skruer og overgange bevares. Fundamentet lukkes endeligt under denne relation og de eksisterende relationer; fx giver Strakt–rondat–flik–helskrue også Rondat–flik–helskrue og dens fem fundamenter, i alt ni børn. Alle accepterede relationer peger fra den direkte valgte serie til barnet, så automatisk oprettede mellemserier ikke bliver nye kilder. En barani–flik-serie giver ikke løs flik uden indgang. Katalogversion `1` bevarer præcist sin gamle matrix og validering. Ved et bevidst genvalg tilføjes kun manglende version `2`-relationer; accepterede ækvivalente version `1`-relationer genbruges. Genåbning udvider aldrig et repertoire.

Alternativer: Automatisk generalisering til alle kropspositioner, rotationsantal og serier er større fagligt scope end de konkrete aftaler. Yderligere relationer kan føjes til en senere katalogversion med egne eksempler.

### 3. Format 2 gemmer både hensigt og effektiv vurdering

Bevar de eksisterende `stability` og `assessedAt` som effektive værdier, så de nuværende analyser og den uændrede regelpakke fortsat modtager samme vurderingsform. Udvid den personlige registrering med en diskrimineret vurderingsoprindelse: egen eller arvet, hvor arvet kan have en aktiv kildereference eller tilstanden manglende kilde. Gem accepterede kandidatforbindelser med kilde-/målregistrering, deres præcise udførelsesidentiteter, katalogversion og relations-id. Gem individuel udelukkelse pr. gymnast og præcis målidentitet, også når barnet endnu ikke er oprettet.

Gemte relationer er data, ikke kode. De skal matche de registrerede udførelser og et kendt katalog-id/version. Ukendt relationsversion bevares til gennemgang uden automatisk anvendelse. Kilde- og målregistrering skal tilhøre samme gymnast og disciplin; selvreferencer, cykler, dubletter, fremmede registreringer og falske identiteter afvises før adoption.

Egen vurdering kan være null med tom dato og bevares på samme måde som en numerisk egen vurdering. Note tilhører barnet; noter arves aldrig. For arvede værdier kommer datoen fra den effektive kilde. `updatedAt` beskriver ændringen af registreringen, ikke en ny observeret vurdering. Gemte effektive værdier valideres mod den aktive kilde, så et importeret højere sikkerhedstal ikke kan skjule en lavere kildeværdi.

Alternativer: Kun at gemme et kildenavn giver ustabile referencer og mangler beskyttelse ved omdøbning. At beregne al arv kun i UI ville give forskellige værdier i planer, eksport og genåbning. At putte nye felter i format 1 bryder de strikte eksisterende læsere uden et tydeligt versionssignal.

### 4. Én deterministisk afstemning efter berørte handlinger

Registrering accepterer konkrete relationer mellem de direkte valgte kilder og hele deres medtagne fundament. Afledte børn bliver ikke automatisk nye selvstændige kilder i samme registrering. Derved svarer »laveste D« fortsat til de relevante direkte valgte kilder. En senere direkte registrering af et barn kan gøre det til kilde med dets eget gennemgåede fundament.

Ved afstemning:

1. Bevar alle egne vurderinger og alle fravalg. Arkiverede/fjernede kilder kan ikke levere sikkerhed, og fjernede børn genoprettes ikke af afstemning.
2. Find accepterede, stadig præcise kilder til hvert barn. Nye katalogrelationer oprettes ikke under denne operation.
3. Vælg laveste kendte D; ved samme D vælges laveste sikkerhed med null før 1–5 og derefter stabil udførelsesidentitet/registrerings-id. Klikrækkefølge og afrundet tekst har ingen indflydelse.
4. Findes ingen kendt D, fasthold en eksisterende gyldig kilde. En ny binding kræver et synligt kildevalg frem for en vilkårlig rangering. Et bevidst kildevalg i denne situation registreres med kontekst og bruges, indtil kendt D igen kan rangere kilderne.
5. Kopiér kun kildeværdi og -dato til børn, der følger arv. Følg kæder topologisk, hvis en direkte valgt kilde selv følger en tidligere accepteret relation. Opdag og afvis cykler atomisk.
6. Hvis ingen gyldig kilde er tilbage, behold barnet, id og note, men sæt effektiv sikkerhed og dato til null med Mangler arvekilde. Det er ikke en egen vurdering. En ny gyldig accepteret kilde kan genoptage arven; et eksplicit fravalg blokerer dette.

Handlingerne omfatter oprettelse/batch, ændring af sikkerhed/dato, valg af Egen vurdering/Følg igen, ændret præcis udførelse, fjernelse/gentilføjelse og hold-/regelbindingsskift. De skal producere ét samlet valideret kladderesultat før `change` og genberegning. En noteændring alene skal bevare vurderingsoprindelsen. De nuværende `updateAssessment`-kald skal klassificeres som egen vurdering eller intern propagation, så systemet ikke utilsigtet løsriver arv ved automatisk opdatering eller regelgennemgang.

Ved ændret kildeudførelse ugyldiggøres de relationer, der var accepteret til den gamle identitet, selv om registrerings-id bevares. Afhængige børn falder tilbage til anden gyldig kilde eller manglende kilde; de følger ikke et andet spring, blot fordi id'et er det samme.

Alternativet, kun at reagere i vurderingsformularen, ville overse andre indgange og efterlade forældet sikkerhed i planer.

### 5. Fravalg er en personlig beslutning, ikke et filter

En udelukkelse gælder målidentiteten for én gymnast på tværs af mulige kilder. Den ændres kun ved et bevidst tilvalg/gentilvalg. Fravalg under en åben formular er lokalt indtil registrering; annullering ændrer intet. Udelukkelser må ikke bruges til at skjule et eksisterende direkte valg, som brugeren fortsat har markeret.

En eksisterende registrering fjernes gennem den normale bekræftelse med visning af planbrug og afhængige arvede børn. En allerede arkiveret registrering fungerer også som blokering for automatisk genoprettelse. Genvalg genbruger id og note og tilbyder enten en ny egen vurdering eller eksplicit Følg igen med den aktuelle kilde. Den gamle vurdering genbruges ikke stiltiende.

Visning af et barn under en parent og vurderingsoprindelsen holdes adskilt: Et barn kan være grupperet under sin enkleste relevante kilde og samtidig vise Egen vurdering. Barnet vises kun én gang. Hvis barnet er direkte valgt og ikke har accepterede relationer til andre valgte kilder, står det som egen hovedrække i sin familie.

### 6. Fælles oversigtsmodel i vælger og gymnastprofil

**Præcisering efter lokal brugertest:** Brugeren har bedt om én samlet vælger uden gentagelser mellem katalog og fundamentblok. Vælgeren samler derfor direkte valg og fundament øverst i den samme liste og fjerner hver tilsvarende almindelig katalogrække. Sikkerhed, ophav, fravalg og præcisering ligger på denne ene række. Kun valgte afgrænser samme liste; der findes ingen separat Valgte spring-blok. Det gælder også byggerens forhåndsvisning. En upræciseret katalogskabelon erstattes af det præciserede valg, mens to forskellige præcise fordelinger bevarer hver sin identitet. Denne præcisering erstatter nedenstående omtale af en særskilt Valgte spring-gennemgang.

**Søgepræcisering efter næste lokale tilbagemelding:** Med søgetekst rangeres præcise navne og sammenhængende begyndelser før aliaser og løse ord på tværs af serien. Bindestreger/tankestreger og mellemrum normaliseres ens; egne navne suppleres med den strukturerede udførelses navn som alias. `strakt rondat` finder derfor Strakt–rondat–flik højt i listen. Allerede valgte rækker bevares, men må ikke skubbe bedre søgematch ned. Uden søgetekst står valg/fundament stadig først. Ny søgning eller filterændring ruller selve listen til toppen. Et synligt matchantal og Søg i alle spring gør aktive gruppe-/D-/valgfiltre forståelige uden at rydde søgeteksten.

Udled en fælles præsentationsmodel fra præcise identiteter: familier, egne/direkte valg, accepterede eller foreslåede børn, valgt kilde, fravalg, effektiv sikkerhed og egen D. Brug samme relations- og kildeberegning i forhåndsvisning og commit af formularen.

Visuel retning følger projektets frontend-skill: rolige flader, tætte læsbare rækker og få farver. Desktop bruger sammenlignelige kolonner frem for separate bokse for hver færdighed. Der tilføjes ingen dekorativ hero eller nye informationskort.

```text
Familie: Rondat-flik (antal)
Spring                         D         Sikkerhed
Rondat-flik-helskrue            0,80      4/5
  +-- Rondat                   0,10      4/5 arvet
  +-- Rondat-flik               0,30      3/5 egen
  +-- ...
```

Skitsen er en strukturillustration; de endelige tal skal komme fra holdets regelpakke og verificeres uafhængigt. Hvis flere direkte kilder deler barnet, ligger det kun under den lavest rangerede relevante kilde. Rækkehandlinger er Fravælg/Tilvælg i registreringen og Egen vurdering/Følg igen ved vurdering. Tekst og form angiver status, så farve aldrig er eneste signal.

Bane grupperes først efter indgang (rondat-flik, rondat direkte, whipback, kraft, flyvespring og startsaltofamilier) med afslutningsvarianter samlet. Trampet grupperes efter med/uden redskab, springfamilie og rotation. Egne spring placeres efter deres strukturerede udførelse med synlig egen betegnelse; uklassificerbare egne spring får en navngiven restgruppe. Rytme følger sine eksisterende katalogkategorier.

Søgeresultater viser matches med kontekst, selv om familien ellers er lukket. Minimum-D bruger eksakt egen D inklusive grænsen. Resultater med ukendt D får en særskilt tydelig adgang. En vedvarende Valgte spring-gennemgang er uafhængig af søge-/D-filter og viser børn under grænsen samt fravalg. Gruppetal tæller unikke aktive færdigheder; markering af afledte kontra direkte valg forklarer antallet.

På 390 px samles D og sikkerhed på en kort metarække. På 1440 px udnyttes dialogens/arbejdsfladens bredde til kolonner. Start med semantiske lister, tabeller hvor egnet, og knapper med `aria-expanded`; ingen egen ARIA-treegrid eller virtualisering uden dokumenteret behov. Beregn og cache bibliotekets D én gang pr. regelbinding/biblioteksændring og relationer med identitetsindeks. Syntetiske tests med 1, 22 og 120 registreringer skal kunne betjenes uden mærkbart blokerende søgning og uden vandret siderulning.

### 7. Ét visningslag for navne, identitet bevares

Saml katalogbaserede visningsnavne og aliaser uden for de låste regeldata. Vis rudy/rudi som Rudy · strakt salto 540° og brug gradtegn ved alle grader på bane og trampet. Kropposition, retning og relevante rotations-/skruefordelinger må ikke forsvinde ved forkortelse. Gemte egne navne kan vises med en præcis katalogbeskrivelse som supplement; de omskrives ikke i fælles definitioner.

Rytmens standardforløb bruger det valgte moment og variant til navn/visning og viser sikkerhed samt dato i samme formular. Fjern kun det redundante navnefelt i rytmeforløbet; Byg selv beholder sit navnefelt. Eksisterende rytmenavne bevares som data. Der ændres ikke på momentidentitet, spejling eller krav til fælles udførelse.

### 8. Egen D og omgangsbidrag er to forskellige oplysninger

Omgangspladsens primære metrik er `participant.originalD` sammen med effektiv sikkerhed. Efter brugerens lokale tilbagemelding vises D som et tal i et diskret blåt felt uden teksten Egen D. En tilgængelig betegnelse og hoverforklaring angiver Sværhed (D). Den præcise beregningsforklaring er fortsat tilgængelig. Hvis det justerede bidrag er uafklaret eller forskelligt, vises Bidrag til omgang særskilt med årsag. Ekstra viser springets D, men indgår ikke i tællende sum. Der ændres ikke på `holdRound`, flertalskravet, `adjustedD`, sum eller panelberegning for at få et tal til at stå i UI.

I springvalget beregnes D for hver anvendelig registrering med gymnastens konkrete bekræftelse og holdets pakke. Brugerens næste tilbagemelding erstatter den lange native optiontekst med en lokal, søgbar springvælger: navn og retning i én kolonne, D i en anden og sikkerhed i en tredje. På mobil fordeles navn og målinger på to linjer. Sikkerhed bruger fem streger plus den numeriske vurdering, ravfarve 1–2, blå 3 og grøn 4–5; null har tomme streger og tilgængelig forklaring. Den åbne liste har et combobox-søgefelt med aktiv option, pile/Home/End/Enter, Escape og bevaret triggerfokus. Klik udenfor og tabulator lukker listen uden at ændre valget. Vælg senere giver null, og skift af gymnast nulstiller valget. Listen er en specialiseret webkomponent uden nye afhængigheder, datalagre eller ændringer af registreringernes anvendelighed.

Den konkrete acceptcase er én gymnast i første omgang med rondat-flik-strakt helskrue: egen D 0,80 og sikkerhed 5/5 skal stå på rækken, mens holdomgang og bidrag stadig er ufuldstændige. En anden case er egen D 0,80 og justeret bidrag 0,00 ved afvigelse fra en fastlagt reference.

## Risks / Trade-offs

- [En trænerfaglig sammenhæng gælder ikke alle gymnaster] → Automatisk medtagning vises før registrering, individuelt fravalg er umiddelbart og vedvarende, og egen vurdering kan overskrive arv.
- [Nye metadata kan mistes i en ældre app] → Format 2 med afvisning i ældre klienter og tydelig migrationsbesked; ingen nedgradering, der fjerner metadata.
- [Gamle kopierede vurderinger ligner arv] → Migration markerer alle eksisterende vurderinger som egne, uden heuristik; Følg igen er bevidst tilvalg.
- [En parent fjernes eller skifter udførelse] → Accepterede relationsidentiteter kontrolleres, andre kilder rangeres, ellers vises manglende kilde med Ikke vurderet.
- [For mange gentagelser i et stort repertoire] → Én række pr. præcis færdighed, familiegrupper og fælles kildevalg; ingen ny kartoteksmodel pr. niveau eller alder.
- [Kataloget kan ikke entydigt beskrive en skruet dobbelt] → Relationer kræver præcis distribution og gyldig målvariant. Mangler vises som afklaring frem for opfundet kunnen.
- [Ændringer under gemning giver forældede værdier] → Hele afstemte snapshot gemmes gennem eksisterende sessionsmekanik, og senere lokale ændringer forbliver ugemte.

## Migration Plan

1. Tilføj en eksplicit format 1-læser og ren lokal migrator til format 2. Nye arbejdsrum oprettes i format 2. Valider format 1 før migration; der tilføjes tomt relations-/fravalgsgrundlag og egen oprindelse til alle eksisterende registreringer uden ændrede værdier.
2. Drive-læsning skal kunne returnere et tilbud om understøttet migration med den oprindelige filmetadata, revisionsbasis og hash af de faktisk læste bytes. Brugeren ser, at opgradering er nødvendig for redigering, kan annullere og kan eksportere originalen før bevidst gemning. Eksisterende ugemt arbejde erstattes først efter den normale kassationsbekræftelse.
3. Efter accept adopteres format 2 som ændret kladde; revisionsbasis fastholdes fra format 1-filen. Den oprindelige fil på Drive er uændret. En fil med læseadgang kan gennemgås og migreres lokalt, men kan ikke gemmes over originalen.
4. Først en særskilt Gem på Drive sender format 2 via den normale rettighedskontrol, operationshistorik og `If-Match` på originalens basis. Fejl eller konflikt bevarer kladden. Google-forbindelsens egen `schemaVersion` i adgangslageret ændres ikke.
5. Test med syntetisk format 1 og 2, herunder manglende kilde, egne null-vurderinger, fjernede færdigheder, ukendt relationsversion, afbrudt upload og konflikt. Alle fastlåste numeriske regressioner skal fortsat bestå.
6. Start efter implementering en ny lokal testudgave i `dist-local/` på port 5173 og kontrollér åbning. Bed brugeren gemme/eksportere en eksisterende kladde før genindlæsning. Lad udgaven køre uden genbygning under testen. Commit, push og publicering kræver brugerens efterfølgende udtrykkelige klarsignal.
7. Tilbagerulning af appkode nedgraderer ikke data. En ældre app skal afvise format 2. Gendannelse af en tidligere format 1-kopi er en særskilt brugerhandling efter sikring af nyere data; ingen automatisk overskrivning eller fjernelse af arvefelter.
