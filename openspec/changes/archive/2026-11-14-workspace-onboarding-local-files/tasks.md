# Tasks

## 1. Kladde og lokal fil

- [x] 1.1 Gør en ikke-placeret kladde redigerbar i den fælles arbejdsrumssession, og lad første Gem vælge placering uden at miste formularændringer; verificér med målrettede sessionstests af redigering, annullering og sandfærdig gemmetilstand.
- [x] 1.2 Indfør valideret læsning af rå lokale arbejdsrumsfiler og versionsmærkede lokale Drive-kopier med bevaret kildebasis; verificér med syntetiske tests af rundtur, ældre format, forkert identitet, beskadiget fil og bevaret original.
- [x] 1.3 Indfør lokal filåbning og gemning med filhåndtag, tilladelseskontrol, indholdskontrol før skrivning, efterlæsning og downloadfallback; verificér med målrettede adapter- og browserprøver af tilladt, nægtet, annulleret, ændret og manglende fil samt redigering under gemning.
- [x] 1.4 Beskriv lokal fil, kopiindpakning, browserfallback og begrænsningen ved én lokal redaktør i brugervejledningen; gennemgå samtidig den offentlige AI-inddata-skill for format- og kildekonsekvenser, opdatér relevante eksempler og genererede opslag efter `AGENTS.md` hvis nødvendigt, og verificér dokumenternes overensstemmelse med de målrettede filprøver.

## 2. Seneste og Google-adgang ved behov

- [x] 2.1 Indfør et afgrænset, versionsmærket lager for Seneste uden arbejdsrumsdata og migrér en husket Drive-filreference til listen; verificér med tests af dubletnavne, kontotilknytning, fjernelse, lagerfejl og at en post aldrig sletter selve filen.
- [x] 2.2 Flyt Google-indlæsning og kontokontrol til Drive-handling eller direkte link, og bevar kontohint, udløbshåndtering og fanebeskyttelse; verificér med auth-/browserprøver af lokal start uden Google-kald, nyligt valgt Drive-fil, udløbet adgang og dybt link uden kortvarig startside.
- [x] 2.3 Lad Seneste åbne præcis valgt lokal eller Drive-fil med ny tilladelses-/rettighedskontrol og forståelige fejl; verificér i eksisterende browserprøver, at flyttet lokal fil, manglende Drive-adgang og Vælg fil igen bevarer en åben kladde.
- [x] 2.4 Opdatér brugervejledningen om Seneste, afbrydelse og kontoskift, og verificér at teksten stemmer med de målrettede genåbningsprøver og `npm run verify`.

## 3. Gem som, overskrivning og fletning

- [x] 3.1 Gør Gem som til en kopi- og placeringshandling til ny lokal eller Drive-fil uden ændring af kilden; verificér med syntetiske tests af begge retninger, aktiv fil efter succes og bevaret kladde ved annullering eller uklart svar.
- [x] 3.2 Tilføj valg af præcis eksisterende Drive-fil, tydelig erstatningsadvarsel og betinget Overskriv med rettigheds-, versions- og operationafstemning; verificér med tests af ens filnavne, anden arbejdsrumsidentitet, ændring før upload, tabt svar og fortsat lokal kopi.
- [x] 3.3 Genbrug den fælles trevejssammenligning for lokal kopi med valideret kildebasis og særskilt efterfølgende Drive-gemning; verificér med samtidighedstests af uafhængige ændringer, samme ordnede omgang, forkert kildefil, manglende basis og forældet gennemgang i begge relevante fletteretninger.
- [x] 3.4 Gennemgå flettepolitikken for kopiering, revisionsmetadata, identiteter, rækkefølge, afhængigheder, afledte værdier og præsentation; opdatér kun kontrakt og adfærdstests ved faktisk ændring af fælles gemte data, og verificér med `npm run verify` samt den berørte browserprøve for Gem som.

## 4. Første indtryk og åbenhed om data

- [x] 4.1 Byg startoverblikket efter designets visuelle tese med klar hovedhandling, åbningsvalg, rolig Seneste-liste og præcis mobilkomposition; verificér kerneforløbet i målrettede browserprøver og gennemgå visuelt ved 390 og 1440 px med lange navne, tom, fyldt og fejltilstand.
- [x] 4.2 Skriv kort, ikke-teknisk forsidetekst og en let tilgængelig uddybning om valgt filplacering, browserens referencer og Drive-deling uden absolutte løfter; verificér tekst, fokus, tastatur, berøring, skærmlæserstatus og reduceret bevægelse i de berørte browserprøver.
- [ ] 4.3 Gennemgå faktisk cookie- og browserlagring ved første besøg og Drive-valg, inklusive Google-komponenter; dokumentér formål og nødvendighed, indfør kun et samtykkevalg hvis gennemgangen kræver det, og verificér før-aktivering, lige tydelig accept/afvisning, senere ændring og fortsat lokal brug med målrettede prøver.
- [x] 4.4 Opdatér brugervejledningen med første besøg, første gemning, placering og datalagring; verificér at den beskriver den byggede UI og at `npm run verify` samt de berørte browserprøver er grønne.
- [x] 4.5 Ombyg Arbejdsrum-dialogen med aktiv fil og Gem som/Afbryd forbindelse øverst, klare filhandlinger og AI-inddata lukket nederst; verificér tastatur, mobil ved 390 px, desktop ved 1440 px og at fælles data og fletning ikke påvirkes.

## 5. Samlet lokal aflevering

- [x] 5.1 Kør én afsluttende `npm run verify:full` efter implementeringen og ret eventuelle fejl, før lokal brugertest tilbydes.
- [x] 5.2 Start `npm.cmd run preview:local`, kontrollér at `http://127.0.0.1:5173/teamgym-team-manager/` åbner, lad serveren køre, og giv brugeren korte afprøvningstrin; afvent brugerens lokale test og udtrykkelige klarsignal før commit, push eller publicering.
