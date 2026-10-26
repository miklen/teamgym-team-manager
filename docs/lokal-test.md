# Lokal test før GitHub

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
6. Åbn en separat syntetisk format 1-testfil, eksportér originalen, og prøv Annuller. Åbn igen, og opgradér lokalt. Drive-originalen må først skifte til format 2 ved Gem på Drive; ældre apps kan derefter ikke åbne filen.
7. Sæt én gymnast med rondat–flik–helskrue og sikkerhed 5 på første omgang. D-tallet 0,800 skal stå uden teksten Egen D, sammen med fem udfyldte sikkerhedsstreger og 5/5, mens bidrag og omgangssum fortsat er ufuldstændige. Åbn **Spring**, og sammenlign navn, D og sikkerhed på separate pladser i listen. Prøv søgning, piletaster/Enter, Escape, **Vælg senere** og skift af gymnast, på computer og mobil.
8. Gem testfilen og genåbn. Arv, egen vurdering og fravalg skal være bevaret.

## Automatiske kontroller og publicering

De automatiske Playwright-prøver bruger fortsat `dist/` og port 4173 med syntetisk Google/Drive. Det separate lokale build undgår, at disse prøver erstatter brugerens manuelle testudgave.

Efter godkendt lokal test og et udtrykkeligt klarsignal kan agenten committe og pushe. GitHub Actions kontrollerer og publicerer derefter som hidtil. Hvis brugeren finder en fejl, rettes den lokalt og afprøves igen inden push. Kravet gælder hver gang og er skrevet i projektets `AGENTS.md`, så det også følges i senere sessioner.
