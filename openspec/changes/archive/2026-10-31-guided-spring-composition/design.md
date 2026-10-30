# Design

## Context

Se `proposal.md` og de to delta-specifikationer. `SpringDisciplineView` viste oprindeligt D/C og profil i en stor `analysis-strip`, derefter de tre omgange og til sidst en detaljeret C-liste og særskilte potentialer. `packages/rules` ejer regelbinding, analyse og søgning efter konkrete opstillinger; DK-tillæggene har ikke én fælles tællemetode. Banens elementtillæg var uafklaret i både 1.0.0 og den endnu ikke push'ede 1.1.0. Træneren har nu afklaret, at reglementets eksempel er gældende for 1.1.0. En ukendt regelpakke vises uden fallback.

## Goals / Non-Goals

**Goals:**
- Gør planens rammer, opfyldelse og relevante tillæg læsbare før den første omgang uden at skubbe byggeområdet langt ned.
- Gør tælleenhed, reglementets træningsmål, planens bidrag og dokumenteret mulighed semantisk forskellige.
- Genbrug regelpakkens beslutninger og kildehenvisninger, så den korte guide og den fulde analyse ikke kan give modstridende point.

**Non-Goals:**
- Ingen yderligere regelafgørelser ud over den eksplicitte afklaring af banens elementtillæg, ingen Liga-pakke, automatisk konkurrenceoptimering eller trænerfaglig forudsigelse af, hvad en bestemt gymnast kan lære.
- Ingen gemte personlige træningsmål, ændringer i planens springvalg eller ændring af D-formlen.

## Decisions

### 1. Regelbunden, afledt guidemodel

Udvid den browserkompatible regelpakke med en afledt guidemodel pr. disciplin. Hver række har stabilt regel-id, kort dansk navn, kategori (ramme/krav/tillæg), tælleform (pr. gymnast i bedste omgang, hel omgang, over tre omgange eller anden eksplicit form), kvalifikationskrav, kilde og aktuel vurdering. DK-rækker defineres ved den installerede pakkeversion og holdprofil, ikke i React. Point og status kommer fra de eksisterende `contributions` og `rounds`; hvor guiden behøver dækningstal eller den valgte bedste omgang, eksponerer regelberegningen disse som afledt evidens ved den samme beregning. UI'et må ikke genberegne satser eller kvalifikation med egne regler.

Alternativet var en statisk tjekliste i `spring.tsx`. Den ville hurtigt afvige ved profilskift, uafklarede regler og en senere Liga-pakke.

### 2. Tre betydninger af „muligt“

Regelmål vises, så snart regelpakken er kendt, uanset holdets registreringer. Et præcist katalogeksempel kan understøtte træningssigtet, men skal være verificeret mod den samme regelpakke og tydeligt mærket „Eksempel at træne frem mod“. Mangler et sikkert eksempel, vises kun kriteriet. Planens bidrag vises kun som endeligt, når den relevante beslutning er kendt; ved ufuldstændige omgange kan dækning vises som „foreløbig“. Dokumenteret mulighed for det nuværende hold forbliver den eksisterende potentialesøgnings særskilte vidneopstilling og undergrænse, aldrig en synonym for regelmaksimum. Sikkerhed 1–5 vises som vurdering, ikke som point eller prognose.

Alternativet var at vise kun søgningens opnåelige maksimum. Det skjuler netop de tillæg, holdet endnu ikke har trænet frem til.

### 3. Kompakt struktur med detaljer ved behov

Vis guiden lige efter scenarievalget. Layoutet har én rolig flade med to enkle grupper, „Krav“ og „Tillæg“, adskilt af luft og tynde skillelinjer frem for et kort pr. regel. Hver linje har navn, kort tælleform og tekstlig status/værdi; ingen lange forklaringer i standardtilstanden. Den nuværende D/C/profil-stribe komprimeres eller indarbejdes som en kort toplinje, så omgangene forbliver synlige tidligt. På mobil stables grupperne, og omfangsrige tekster brydes uden vandret rulning. En udvidet linje viser krav, kilde, eksempler, berørte omgange og relevant vej til byggeområdet eller den fulde analyse. Tastatur, fokus og skærmlæser får samme oplysninger; farve er kun støtte. Bevægelse begrænses til en kort statusændring og respekterer reduceret bevægelse.

Alternativet var at flytte hele den nuværende C-analyse over omgangene. Det ville fastholde tekstmængden og gøre den ellers gode opbygning mindre synlig.

### 4. Fælles data og konflikthåndtering

Guiden er ren visning. Den læser den valgte regelbinding, profil, scenarie, omgangsrækkefølge, deltager- og springreferencer samt fælles færdighedsvurderinger. Den opretter ingen id'er eller lagrede felter, ændrer ingen rækkefølge, og dens afledte tællinger og status gemmes ikke. Et scenarieskift eller åbning af en guidelinje er derfor ikke en fælles ændring; eksisterende trevejssammenligning og flettekontrakt fortsætter uændret. Ændres plan eller vurdering gennem eksisterende kommandoer, genberegnes guiden efter den gældende regelbinding, også efter en fletning. Dette begrundes i ændringens verifikation; ingen separat formularfletning indføres.

### 5. Afklaret elementtillæg i den lokale DK 1.1.0

Brugerens faglige afklaring vælger det allerede bevarede eksempelspor som gældende i den endnu ikke push'ede DK 1.1.0. For hver tællende gymnasts gyldige baneserie er tillægget `0,10 × max(antal forskellige C-elementidentiteter − 1, 0)`. Gentagne forekomster tælles én gang; seriens første element giver ingen tillæg. De tre omgangssummer divideres med tre. En ufuldstændig opstilling viser kun foreløbigt beløb, og en ugyldig/uafklaret færdighed giver ikke sikre point. DK 1.0.0 bevarer begge oprindelige spor og sit åbne Q01. De fastlåste kildebytes og den historiske kildematrix omskrives ikke.

I 1.1.0 forsvinder Q01 fra pakkens aktive usikkerheder. C-analyse, guide, potentialesøgning og versionssammenligning bruger den samme beregning. Et sikkert serieeksempel bygges kun af gyldige katalogelementer med en verificeret forbindelse. Der opfindes intet samlet regelmaksimum ud fra filformatets tekniske grænse på 30 elementer.

Den lagrede struktur og mergepolitikken for felter ændres ikke, men `team.rulesetBinding.packageVersion = 1.1.0` får en justeret lokal betydning før publicering. Regelfingeraftrykket ændres ikke for allerede bundne 1.1.0-filer, så sådanne lokale testfiler genberegnes ved genindlæsning. Flettekontrakten skal beskrive denne semantik eksplicit, og samtidighedstests skal vise, at forskellige regelbindinger stadig kræver valg, mens uafhængige ændringer bevares og afledt C genberegnes efter valgt binding. Ingen C-tal eller guidefelter gemmes.

### 6. Samling af dokumenterede muligheder i guiden

Den nederste potentialeliste gentog guidens tillæg og dokumenterede beløb. Potentialesøgningens valgte beløb, dokumenterede beløb, bevisstatus og eksisterende handling til fuld vidneopstilling vises nu i den tilsvarende guidelinje. Guiden ejer også søgestatus, afbrydelse og fejlvisning. Den separate liste fjernes, mens forhåndsvisning, bevidst anvendelse og annullering fortsat bruger samme eksisterende kode. Dette er en ren visningsændring: ingen gemte data, identiteter, rækkefølger, afhængigheder eller fletteregler ændres. Sene workersvar er stadig bundet til scenariet af `usePotentials`.

### 7. Kompakt status med detaljer efter behov

De to dynamiske disciplinkort for D og C placeres før guiden. Den faste holdprofil fjernes fra kortstriben og vises som en diskret, altid synlig ramme ved scenariets navn; de uddybede rammer står fortsat i den åbne guide. Guiden starter lukket og viser i sin overskrift status for færdige omgange samt samlede tillæg og rå fradrag. Aggregaterne dannes i regelpakken af alle C-bidrag, også gentagelse og rækkefølge, som ikke har egne korte guiderækker. Et beløb vises kun som endeligt, når den pågældende sum er kendt og alle tre omgange er vurderbare. Ellers mærkes kendte delbeløb »Foreløbigt«, eller status vises som »Afventer«; uafklarede regler angives særskilt. Åbning viser de eksisterende krav, katalogeksempler, dokumenterede muligheder og veje til omgang og fuld analyse.

Visningstilstanden er lokal DOM-tilstand og gemmes ikke. Beregningen bruger kun afledte C-beslutninger; ingen regel satser genberegnes i UI. Ingen fælles felter, identiteter, rækkefølger, afhængigheder eller flettepolitikker ændres.

## Risks / Trade-offs

- [Guiden kan give et sikkert tal ved en ufuldstændig plan] → skeln mellem kendt beslutning, kendt deldækning og uafklaret/ikke vurderbar tilstand; test tomme og delvise omgange.
- [Et katalogeksempel kan opfattes som en gymnasts færdighed] → brug neutral markering og ingen personkobling eller indsætningshandling på eksemplet.
- [Særskilte tillægsrækker kan antyde en samlet optimal C] → vis dem individuelt og behold vidneopstillingens forbehold om uforenelige muligheder.
- [Guiden øger den øverste sides højde] → begræns standardrækker til kort tekst, integrér den eksisterende pointstribe og kontrollér desktop/mobil visuelt.
- [Regelversion eller profil kan give en forkert tælleform] → afled metadata fra den præcise installerede pakke og test begge DK-versioner samt U14/junior/senior og mix.
- [En eksisterende lokal 1.1.0-testfil får ny C uden versionsskift] → dokumentér den direkte rettelse før push, kontrollér versionsbundne før/efter-visninger og bed om ny lokal brugertest. Publicerede 1.0.0-filer bevarer det åbne spor.

## Migration Plan

Ingen filmigration eller nye fælles felter. Den eksisterende C-analyse forbliver tilgængelig. Efter implementering køres relevante automatiske kontroller og den lokale preview åbnes på den aftalte adresse til brugerens afprøvning før commit, push eller publicering.
