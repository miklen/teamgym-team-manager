# Tasks

## 1. Dokumentdata

- [x] 1.1 Vælg en browserkompatibel PDF-afhængighed og en indlejret font med danske tegn; verificér licens, lokal indlæsning og at produktionsbygningen kan oprettes.
- [x] 1.2 Byg en ren projektion af den valgte snapshot med omgangsorden, startere, ekstra, reserver, spring, modtagning og mangler; verificér den med syntetiske adfærdsprøver for forkert scenarie, ændret rækkefølge, nulstillet modtagning og manglende regelpakke.

## 2. PDF-dokument

- [x] 2.1 Generér et A4-dokument i liggende format med tre tydelige omgange, tekstbaserede rækker, kladdestatus, eksporttidspunkt og forståeligt filnavn; verificér at PDF-tekst kan udtrækkes, at planlagt C og D stemmer med analysen, og at interne sikkerheds- og E-tal ikke er med.
- [x] 2.2 Indfør målt tekstombrydning og fortsættelsessider uden afklipning eller krympning under læsbar skriftstørrelse; verificér én side med to ekstra, seks tællende og to reserver pr. omgang samt fortsættelse med flere reserver og lange navne, og gennemgå et print i gråtoner.

## 3. Handling og vejledning

- [x] 3.1 Tilføj en synlig Download som PDF-knap til det valgte scenarie med beskyttelse af ikke anvendte formularvalg, læseadgang og forståelig fejltilstand; verificér i den berørte browserprøve, at filen svarer til den valgte aktuelle kladde og ikke udløser gemning eller Drive-kald.
- [x] 3.2 Beskriv den synlige eksportknap, den daterede kopi og Ugemt kladde i `docs/brugsvejledning.md`; verificér at vejledningen stemmer med den implementerede handling og PDF'ens indhold.

## 4. Samlet kontrol før lokal brugertest

- [x] 4.1 Kør `npm run verify:full`, start `npm.cmd run preview:local`, kontrollér at den lokale app åbner, og giv brugeren adresse og korte prøvepunkter; lad serveren køre og afvent brugerens test før commit eller push.
