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

## Automatiske kontroller og publicering

De automatiske Playwright-prøver bruger fortsat `dist/` og port 4173 med syntetisk Google/Drive. Det separate lokale build undgår, at disse prøver erstatter brugerens manuelle testudgave.

Efter godkendt lokal test og et udtrykkeligt klarsignal kan agenten committe og pushe. GitHub Actions kontrollerer og publicerer derefter som hidtil. Hvis brugeren finder en fejl, rettes den lokalt og afprøves igen inden push. Kravet gælder hver gang og er skrevet i projektets `AGENTS.md`, så det også følges i senere sessioner.
