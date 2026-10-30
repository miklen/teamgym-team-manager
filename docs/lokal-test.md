# Lokal test før GitHub

## Afprøvning: DK-regler og diskrete usikkerheder — 30. oktober 2026

Gem eller eksportér en eventuel kladde før genindlæsning. Brug en særskilt syntetisk testfil; lokalvisningen kan skrive til den valgte rigtige Drive-fil.

1. Åbn et eksisterende DK 1.0-hold. Springplanen viser en kort besked om den opdaterede pakke. Gå til **Reglement**, vælg **Danmarksserien 1.1.0**, og gennemgå **Vis før og efter**. Skift kun i testfilen. Kontroller, at gymnastdata bevares, og at berørte rytmevurderinger markeres til gennemgang.
2. Åbn en baneplan med gyldige serier. I DK 1.1.0 skal elementtillægget vise ét sikkert tillæg: rondat–flik–flik giver 0,10 og rondat–flik–lukket 0,20 pr. gymnast før gennemsnittet over tre omgange. I DK 1.0.0 skal trekanten fortsat forklare de to ældre C-spor. D og C med andet åbent grundlag må ikke ligne et sikkert facit. Prøv også et spring med H>1 eller en holdomgang uden klart flertal, hvis testfilen har det.
3. Vælg knælende Gumbi eller et DB804-moment i rytmen. Trekant og forklaring skal stå ved valget og i momentets detaljer. Kontroller læsbarheden på en smal skærm og med tastatur.
4. Åbn en tillægsrække i kompositionsguiden. Det dokumenterede beløb skal kunne ses på den lukkede række; »Se konkrete ændringer« skal åbne samme før/efter-visning som før. Der skal ikke ligge en gentaget liste med »Holdets dokumenterede muligheder« længere nede. Prøv Annuller, og kontroller at planen er uændret.
5. Guiden skal være lukket fra start. Se, at D og C står øverst, mens den lukkede guide viser klare omgange samt tillæg og fradrag. Scenariets navn skal kun stå på fanen; holdprofilen skal kunne ses lige under fanerne uden at åbne guiden, også på mobil. Åbn guiden med tastatur for de uddybede rammer og detaljer. En delvis plan skal vise foreløbige eller afventende beløb; DK 1.0.0 skal fortsat markere åbne regler. Prøv også mobilvisning uden vandret rulning.

Brugeren afprøvede denne udgave lokalt og gav 31. oktober 2026 udtrykkeligt klarsignal til sync, arkivering, commit og push. Push til `main` starter automatisk GitHub Pages-arbejdsgangen.

## Afprøvning: ny sikkerhedsskala

Gem eller eksportér kladden før genindlæsning af denne nye udgave. Brug en separat syntetisk testfil.

1. Åbn **Tilføj færdighed**, og fold **Hvad betyder sikkerhed 1–5?** ud. Kontrollér de fem fulde beskrivelser fra Enkelte vellykkede forsøg til Gennemprøvet under konkurrencepres på både bane og trampet.
2. Åbn en eksisterende vurdering af et spring og et rytmemoment. Fold **Se skalaens fem ankre** ud, og prøv 1–5 samt Ikke vurderet. Den valgte beskrivelse skal følge tallet. De nye tekster må ikke omnummerere tidligere vurderinger eller ændre deres dato, note eller ophav ved åbning eller annullering.
3. Afprøv mobilbredde, og kontrollér at hele beskrivelsen kan læses. Prøv at gemme og genåbne en ændret vurdering i testfilen.

Automatisk verificeret 29. oktober 2026: `check`, 292 domæneprøver, 82 Drive-prøver og build bestod. Den samlede browserkørsel havde 137/140 bestået; de to nye skalaprøver fik rettet en for bred testafgrænsning til den indre skalaforklaring og bestod derefter ved 1440/390 px, også med udfoldede beskrivelser. Den eksisterende 200 %-tastaturprøve fik timeout i fælleskørslen og bestod ved særskilt genkørsel. Ingen produktrettelse var nødvendig til disse testfejl. Lokaludgaven er genbygget i `dist-local/`, serveren kører på port 5173, og Chromium-kontrol gav HTTP 200 uden JavaScript-fejl. Brugeren gav 29. oktober 2026 udtrykkeligt klarsignal til commit og push af den samlede udgave med springkæder og den nye sikkerhedsskala.

## Afprøvning: rettede forlæns springkæder

Gem eller eksportér en eventuel kladde før genindlæsning. Brug et separat syntetisk testarbejdsrum.

1. Vælg strakt Barani på trampet med **Medtag fundament automatisk**: lukket/hofte/strakt salto uden skrue og lukket/hofte Barani skal medtages. Rudy skal have seks fundamenter. Randy skal også give Rudy; 3½ skrue (Addy i Byg selv) skal også give Randy og Rudy. Hvert fundament vises én gang.
2. Vælg dobbelt lukket 180° med kendt fordeling: den giver dobbelt lukket uden skrue, tre enkeltsaltoer og tre Barani-positioner. Dobbelt hofte 180° giver desuden dobbelt hofte uden skrue og dobbelt lukket 180° med samme fordeling. Dobbelt uden skrue giver de tre enkeltsaltoer. Prøv også en kraftspring–Barani på bane: indgangen skal bevares.
3. Ændr kildens sikkerhed og dato, prøv egen vurdering og fravalg, gem i testfilen og genåbn. Eksisterende repertoire udvides først ved genvalg med gennemgang af fundamentet. Prøv dobbelt hofte 180° uden fordeling: afklar fordelingen eller fravælg det uafklarede barn.

Automatisk verificeret 29. oktober 2026: `check`, 292 domæneprøver, 82 Drive-prøver, build og alle 138 browserprøver bestod. Browserprøverne krævede kørsel uden sandbox for at afslutte testserveren korrekt. Lokaludgaven i `dist-local/` er startet på port 5173 og kontrolleret i Chromium med HTTP 200 og uden JavaScript-fejl. Prøverne bruger syntetiske data; der er ikke udført live flerbrugertest på Drive. Brugeren gav 29. oktober 2026 udtrykkeligt klarsignal til commit og push sammen med den nye sikkerhedsskala.

## Afprøvning: gennemgang af samtidige ændringer

Gem eller eksportér en eksisterende kladde før genindlæsning. Brug to faner med samme separate syntetiske testfil; eksisterende fælles trænerfiler må ikke bruges til skriveprøver.

1. Åbn samme testfil i begge faner. Ændr et holdnavn i den første, og en anden gymnasts vurdering i den anden. Gem kun den anden fane. Vælg **Gennemgå ændringer** i den første: begge ændringer skal kunne kombineres uden konfliktvalg. **Annuller** skal bevare kladden; **Brug disse ændringer** skal stadig kræve særskilt **Gem på Drive**.
2. Genåbn fælles basis i begge faner. Ændr samme vurdering forskelligt, og gem den anden fane. Gennemgå i den første. Før, Min udgave og Filens udgave skal vise sikkerhed, dato og ophav samlet. Prøv begge valg, filtre og Find uafgjorte konflikter. Ved flere konflikter skal du kunne vælge forskellige sider.
3. Lad en gennemgang stå åben i første fane. Gem en yderligere ændring i anden fane. Anvendelse i første fane skal afvises som forældet med bevaret kladde; **Gennemgå igen** skal hente det nye grundlag.
4. Åbn en ændret formular før gennemgang. Afprøv **Bliv**, **Behold mine ændringer** og **Kassér formularændringer**. Efter anvendelse må den gamle formular ikke kunne aflevere data over resultatet. Prøv også mobilbredde, tastatur, 200 % zoom, eksport og gem/genåbn på den syntetiske testfil.

Se [brugervejledningen](gennemgaa-aendringer.md). Denne ændrings lokale test og klarsignal registreres først efter faktisk tilbagemelding.

Hver ændring afprøves lokalt af brugeren, før den committes, pushes eller publiceres. Agenten gør ændringen klar, kører relevante automatiske kontroller, starter den lokale visning og afleverer linket. Derefter afventes brugerens klarsignal. Denne arbejdsgang erstatter den tidligere automatiske publicering efter grønne tests.

## Start

Dobbeltklik på `Start-lokal-test.cmd` i projektmappen, eller kør fra projektmappen:

```powershell
npm.cmd run preview:local
```

Åbn [den lokale app](http://127.0.0.1:5173/teamgym-team-manager/). Lad terminalen være åben, mens du tester. Stop med Ctrl+C. Der bruges en fast port, så adressen og Google-origin ikke flytter sig; hvis porten er optaget, skal den tidligere testserver stoppes først.

Kommandoen bygger appen i `dist-local/` og viser præcis denne udgave uden løbende automatisk genindlæsning. Senere kodeændringer bliver først synlige efter en ny lokal bygning. Agenten ændrer eller genbygger ikke udgaven, mens brugeren er i gang med at teste den. Gem eller eksportér kladden før genstart/genindlæsning.

## Google og testdata

De tre offentlige Google-værdier læses fra den ignorerede `.env.local`, som allerede findes på denne computer. Den lokale origin `http://127.0.0.1:5173` står allerede i OAuth-klientens konfiguration. Der bruges ingen client secret.

Den lokale adresse har sin egen Google-forbindelse i browseren. Log ind første gang med **Forbind til Google Drive**, og vælg et separat testarbejdsrum. Lokal kode bruger stadig rigtig Google Drive: Gem på Drive skriver i den valgte fil. Brug syntetiske oplysninger og en særskilt testfil til skriveprøver; eksisterende fælles trænerfiler er skrivebeskyttede for afprøvning.

## Afprøvning: færdigheder, overblik og arv

Gem eller eksportér en eventuel kladde, før du genindlæser en ny testudgave. Brug kun et særskilt syntetisk arbejdsrum til punkterne nedenfor; eksisterende fælles trænerfiler må ikke bruges til skriveprøver.

1. Opret et rytmemoment med sikkerhed 3 og dato i samme handling. Prøv også Ikke vurderet. Katalogets navn og den valgte variant skal være tilstrækkelige uden navnefelt.
2. Søg `rudi` på trampet, vælg rudy, og gennemgå de seks fundamenter i den samme vælger. Hvert spring skal kun forekomme én gang. Prøv **Kun valgte**, fravælg ét fundament, og giv et andet egen vurdering på rækken. Prøv også en dobbelt 540° med manglende skruefordeling: afklar på parentens række eller fravælg 180°-barnet.
3. Vælg rondat–flik–helskrue med sikkerhed 3. Ændr parenten til 5 med en ny dato. Børn med arv skal følge med; et barn med egen 2 eller egen Ikke vurderet skal beholde valget. Følg igen skal genoptage arv. Fjern en kilde og kontrollér beskeden om afhængige børn.
4. Søg `strakt rondat`. Strakt–rondat og Strakt–rondat–flik skal ligge først. Vælg Strakt–rondat–flik–helskrue med sikkerhed 3: Rondat–flik–helskrue og dens fundament skal medtages én gang hver. Skift til 5, prøv fravalg og egen vurdering. Prøv **Søg i alle spring**, hvis andre filtre afgrænser resultatet.
5. Gennemgå gymnastens familier på computer og mobil. Søg efter en færdighed i en lukket familie, og redigér vurderingen. Prøv minimum-D 0,80 i vælgeren; valgte spring og fundamenter under grænsen skal fortsat stå i samme liste, uden en ekstra katalogrække. Uden søgetekst står valgene øverst; med søgetekst står de bedste match først.
6. Åbn en separat syntetisk format 1-testfil, eksportér originalen, og prøv Annuller. Åbn igen, og opgradér lokalt. Drive-originalen må først skifte til format 3 ved Gem på Drive; ældre apps kan derefter ikke åbne filen.
7. Sæt én gymnast med rondat–flik–helskrue og sikkerhed 5 på første omgang. D-tallet 0,800 skal stå uden teksten Egen D, sammen med fem udfyldte sikkerhedsstreger og 5/5, mens bidrag og omgangssum fortsat er ufuldstændige. Åbn **Spring**, og sammenlign navn, D og sikkerhed på separate pladser i listen. Prøv søgning, piletaster/Enter, Escape, **Vælg senere** og skift af gymnast, på computer og mobil.
8. Gem testfilen og genåbn. Arv, egen vurdering og fravalg skal være bevaret.

## Automatiske kontroller og publicering

De automatiske Playwright-prøver bruger fortsat `dist/` og port 4173 med syntetisk Google/Drive. Det separate lokale build undgår, at disse prøver erstatter brugerens manuelle testudgave.

Efter godkendt lokal test og et udtrykkeligt klarsignal kan agenten committe og pushe. GitHub Actions kontrollerer og publicerer derefter som hidtil. Hvis brugeren finder en fejl, rettes den lokalt og afprøves igen inden push. Kravet gælder hver gang og er skrevet i projektets `AGENTS.md`, så det også følges i senere sessioner.

## Afprøvning: scenarier og reserver

Gem eller eksportér en eksisterende kladde før genindlæsning af denne udgave. Brug et særskilt syntetisk arbejdsrum, eksempelvis [testfilen med 12 banescenarier og reserver](../examples/scenarier-og-reserver-v3.json), som kan uploades til en separat testmappe på Drive og åbnes fra appen. Eksisterende fælles trænerfiler må ikke bruges til skriveprøver.

1. Åbn Springplan. Skift mellem Plan A, Plan B, bane og trampet Sikker samt mellem sider og hold. Valgene huskes i den åbne app, uden at et rent planskift gør filen ugemt. Efter genindlæsning vises første scenarie.
2. Opret et tomt scenarie, duplikér Plan A, omdøb og slet kopien. Prøv et eksisterende navn, Escape/Annuller, et langt navn og Alle scenarier med søgning. Kontrollér, at de andre planer er uændrede.
3. Redigér en plads og vælg Vis scenarie. Afprøv Opdater, Kassér og Bliv. Opdater skal ændre den lokale kladde uden Drive-upload; fejl skal blive i formularen.
4. Tilføj en reserve med og uden spring. Flyt prioritet op/ned med knapper eller tastatur, og fjern en reserve igen. Reservelisten må ikke ændre de udførendes D, C eller sikkerhed. Kontrollér navn/kendetegn, D og fem sikkerhedstrin på mobil og computer.
5. Åbn Sæt ind. Vælg en tællende eller ekstra gymnast, læs før/efter, prøv Annuller og bekræft derefter. Rolle og position skal bevares. Kun den indsatte reserve fjernes fra listen; den udgående gymnast bliver ikke automatisk reserve.
6. Redigér to planer, stå på en anden plan og gem testfilen. Genåbn den, og kontrollér alle planer og reserveprioriteter. Prøv også en separat gammel format 1- eller 2-testfil: eksportér originalen, annullér, og opgradér derefter lokalt før en bevidst gemning.
7. Prøv tastatur, 200 % zoom og smal skærm. Nyt, menu, Alle scenarier og dialogernes primære handling/Annuller skal være tilgængelige uden afklipning.

Denne lokale udgave blev godkendt af brugeren 27. oktober 2026 med klarsignal til sync, arkivering og lokalt commit. Push og publicering er ikke bestilt. Testserveren bliver stående med den godkendte udgave.
