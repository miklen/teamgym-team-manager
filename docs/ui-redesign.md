# Visuel retning: trænerens workspace

Brugerbestilt UI-overhaling, 25. oktober 2026. Del af `build-teamgym-team-manager`; lokal brugertest før commit og push.

## Plan før implementering

**Visuel tese:** Et lyst, præcist performance-workspace med dyb blå navigationsrail, skarp geometrisk typografi og én koboltaccent. Springets bevægelse bliver genkendelig i mærket, mens selve arbejdsfladen forbliver rolig.

**Indhold:** Fast navigation og aktuelt hold; kontekstuel sideoverskrift og primær handling; læsbare lister eller opstillinger; detaljer i en fokuseret inspektør. Startskærmen hjælper med at åbne en fil, uden markedsføringshero. Ingen opdigtede nøgletal.

**Interaktion:** Aktiv navigation og discipliner får en tydelig, rolig markeringsflade; inspektøren åbner med kort dybdebevægelse; ændrede rækker bevarer deres eksisterende flytteanimation. Reduceret bevægelse slår effekter fra.

| Token  | Farve     | Brug                           |
| ------ | --------- | ------------------------------ |
| Ink    | `#18243d` | Primær tekst                   |
| Rail   | `#182a46` | Navigation og identitet        |
| Cobalt | `#3155d9` | Primær handling og aktivt valg |
| Canvas | `#f3f5fa` | Arbejdsflade                   |
| Paper  | `#ffffff` | Lister, dialog og indtastning  |
| Line   | `#e0e5ef` | Diskrete strukturelle skel     |

Typografi: selvhostet Manrope, vægt 400–800, til både navigation, tal og overskrifter. Kompakte navigationsetiketter, større sideoverskrifter og tabellariske tal. Ingen dekorative versaler.

```text
Desktop                            Mobil
┌────────────┬──────────────────┐  ┌────────────────────┐
│ TeamGym    │ Kontekst / Gem   │  │ TeamGym / Gem      │
│ Holdvalg   ├──────────────────┤  │ Holdvalg           │
│ Navigation │ Titel + handling │  │ Titel + handling   │
│            │ Liste / 3 omgange│  │ Liste / én omgang  │
│ Regelprofil│                  │  │ Fast bundnavigation│
└────────────┴──────────────────┘  └────────────────────┘
```

Alt arbejdsindhold venstrestilles. Rytmens brede matrix bevarer sin kompakte mobilvisning. Tal og handlingsknapper følger en fast kolonne, og navne må ombrydes.

**Kritik før kode:** En lilla kortmosaik ville ligne et generisk SaaS-dashboard. Derfor er hovedgrebet i stedet en sportslig blå rail med et særligt, tegnet springmærke. Hold er reelle klikbare arbejdsrum; gymnaster er læsbare rækker; omgange er tre sammenhængende baner. Skygger bruges til lag, ikke på hver oplysning. Visuel pynt må ikke fortrænge gymnaster eller vurderinger.

Aktuel inspiration: [Linears designopdatering fra marts 2026](https://linear.app/now/behind-the-latest-design-refresh) om roligere navigation og konsistent placering af handlinger; [Figmas erfaringer med UI3](https://www.figma.com/blog/our-approach-to-designing-ui3/) om tydelig kontekst og faste paneler ved længere arbejdsforløb. Retningen er tilpasset trænerens opgaver, ikke en kopi af produkterne.

## Verifikation

Kandidat kontrolleret 25. oktober 2026:

- `npm.cmd run check`: TypeScript og ESLint bestået.
- `npm.cmd test`: 188 domæneprøver og 34 Drive-prøver bestået.
- `npm.cmd run build`: produktionsbyg bestået; alle otte PDF-kilders SHA-256 og størrelse uændrede. Den eksisterende advarsel om app-chunk over 500 kB består (cirka 521 kB / 156 kB gzip).
- `npm.cmd run test:e2e`: **44/44 bestået**. De eksisterende forløb dækker bl.a. flervalg, sikkerhedsarv, egne spring, seks omgange, konflikt/gem/genåbn og Google Pickers eksterne dialog. Fire nye browserprøver kontrollerer navigation, holdskift, regelkontekst, selvhostet font og responsive arbejdsflader.
- Axe WCAG 2.2 AA-kontrol uden fund på de fem centrale arbejdsflader på desktop og mobil, samt eksisterende vurderings-/flervalgsdialogprøver. Det er automatiseret kontrol, ikke en påstand om fuld manuel WCAG-certificering.
- Visuel gennemgang ved 1440×1000, 1024×768 og 390×844; eksisterende 20-gymnastforløb desuden ved 768×1024 og 1440×900. Tastatur, fokusretur, 200 % tekststørrelse og reduceret bevægelse bestået i browsersættet.
- Den faste mobilnavigation ligger uden for det rullende arbejdsområde. Filnavn/revision er tilgængelige ved bunden af arbejdsområdet; hold og regelprofil står over det.
- Interne navigationsvalg opdaterer rute og aktiv markering sammen og starter den nye arbejdsflade øverst. Holdskift bevarer arbejdsfladen.
- Lokal kandidat startet med `npm.cmd run preview:local` på `http://127.0.0.1:5173/teamgym-team-manager/` i det separate `dist-local/`. HTTP 200 på app og font; appen åbnet og visuelt kontrolleret i Edge med aktiv **Fortsæt med Google**. Den eksisterende browserfane er ikke genindlæst, og ingen virkelig Drive-fil er redigeret som del af denne UI-verifikation.

Alle testpersoner og skærmbilleder er syntetiske. Rigtige Google-/to-konto-prøver er fortsat særskilte og må ikke udledes af disse resultater. Brugerens lokale visuelle accept og tilladelse til push er udestående; changen arkiveres ikke endnu.

Skærmbilleder: [springplan på desktop](ui/redesign-springplan-1440.png), [gymnastkartotek](ui/redesign-gymnaster-1440.png), [springvalg på mobil](ui/redesign-springvalg-390.png), [startskærm](ui/redesign-start.png).

## Forenkling efter brugerens lokale gennemgang

Arkivfiltre samt arkiv-/genaktiveringsknapper er fjernet fra holdlisten, gymnastkartoteket og gymnastens færdigheder. Den almindelige oprettelse, redigering, holdflytning, søgning og vurdering er bevaret. Ældre filer beholder deres inaktive poster og referencer; UI-forenklingen sletter eller genaktiverer dem ikke automatisk.

`npm.cmd run check`, `npm.cmd run build` og **46/46 browserprøver** består på den opdaterede kandidat. To nye browserforløb ved 1440 og 390 px åbner filer med ældre inaktive poster, kontrollerer fravær af arkivkontroller, redigerer et holdnavn og gemmer/genåbner. De verificerer, at gymnaster, færdighedsdefinitioner, vurderinger, planer og det inaktive hold er bevaret uændret. [Opdateret færdighedsvisning](ui/uden-arkiv-1440.png).

Den lokale previewserver er genstartet med den nye kandidat. Brugerens godkendelse og tilladelse til push er fortsat udestående.

## Opstart og Drive-forbindelse

Knappen hedder nu **Forbind til Google Drive**, også ved genforbindelse. Under opstart vises en særskilt indlæsningsflade fra første render, gennem den huskede forbindelses kontokontrol og frem til Drive-filen er åbnet. Startside, forbind-knap og filvalg vises ikke i mellemtiden. Ved udløbet adgang eller fejlet filåbning afsluttes indlæsningen med relevante handlinger. Kontoreferencen holdes uden et ekstra renderudløsende tilstandsskift, så én opstart kun henter filindholdet én gang.

`npm.cmd run check`, produktionsbyg, **188 domæneprøver**, **34 Drive-prøver** og **50/50 browserprøver** består. Fire nye browserprøver tilbageholder kontosvar og filindhold hver for sig og kontrollerer hele forløbet ved 1440 og 390 px, inklusive start på rodadresse med husket fil og genindlæsning af dybt link. En DOM-observatør kontrollerer, at forbind-knappen aldrig indsættes under genåbningen. Prøverne dækker desuden udløbet adgang, afvist fil, ingen automatisk OAuth, én filhentning, Axe-kontrol og reduceret bevægelse. Den eksisterende loginprøve afventer nu den færdige arbejdsflade i stedet for den mellemliggende startside, der netop er fjernet.

[Indlæsningsvisning](ui/drive-opstart-1440.png). Resultaterne er fortsat fra syntetiske browser-/Drive-forløb, og lokal brugeraccept afventer.

## Gymnastfilter, fjernelse og saltoretninger

Brugeren satte commit/push i bero og bestilte følgende rettelser:

- Gymnastkartoteket starter på **Alle hold**, inklusive aktive gymnaster uden hold. Holdfilter, Uden hold og søgning fungerer fortsat hver for sig.
- En åbnet færdighed har **Fjern færdighed** med en bekræftelse, der kan annulleres og viser antal berørte planpladser. Fjernelsen gælder kun gymnastens registrering. Definitionen, andre personers kunnen, noter og kortere registrerede serier bevares. Planpladserne bevarer deres reference med en forståelig fejl og indgår ikke længere som gyldig kunnen. Åbnes en gammel reference, står der Fjernet.
- Et udtrykkeligt genvalg gennem den almindelige registrering genbruger id og note uden dublet. En gammel sikkerhed overtages ikke automatisk. Rytmemomenter kan ligeledes fjernes og tilføjes igen. Arv fra en længere serie tilføjer ikke i sig selv en fjernet kortere serie igen.
- Saltoernes retninger vises i rækkefølge i bibliotek, gymnastens færdigheder, bygger og springplan, også ved egne navne. Biblioteket har 36 nye sammensætninger: rondat med/uden flik, efterfulgt af baglæns → baglæns eller baglæns → forlæns, med de tre positioner på begge saltoer. De står parvis med samme positioner for nem sammenligning. Biblioteket har dermed 239 sammensatte baneserier. Den praktiske forbindelsesviden er `coach-connections-3`; den frigivne regelpakkes tal og algoritmer er uændrede.

Kontrol: TypeScript/ESLint og produktionsbyg bestået; **190 domæneprøver**, **34 Drive-prøver** og den fulde browsersuite **58/58** bestået. Efter den sidste tydeliggørelse af Fjernet ved gamle planreferencer er de otte berørte browserforløb genkørt og bestået. De nye forløb dækker standardfilter på tværs af hold/uden hold, fjernelse, annullering, fokusretur, læseadgang, genvalg, planreferencer, bevarede andre registreringer, begge saltoforløb og gem/genåbn ved 1440/390 px. Axe-kontrol af bekræftelsesdialogen gav ingen fund.

Se [saltoretninger](ui/saltoretninger-1440.png) og [fjern færdighed](ui/fjern-faerdighed-390.png). Ny lokal testudgave afleveres; der committes eller pushes fortsat ikke.

## Fjern gymnast

Gymnastdialogen har nu **Fjern gymnast**. Bekræftelsen viser navn og kendetegn, kan annulleres og oplyser antal valgte planpladser. Efter bekræftelse lukkes dialogen, gymnasten forsvinder fra aktive lister/holdtal/rytme, og fokus vender tilbage til søgningen. Eksisterende planreferencer bevares med beskeden **Gymnasten er fjernet. Vælg en anden gymnast.** En gammel reference kan stadig læses, men gymnastens vurderinger og profil kan ikke redigeres derfra. Andre gymnaster, alle færdighedsdefinitioner og registreringer bevares. Gem på Drive er fortsat en særskilt handling.

`npm.cmd run check`, produktionsbyg og **62/62 browserprøver** består. De fire nye forløb dækker mobil/desktop med navnesammenfald, annullering og fokusretur, seks berørte planpladser, levende rytme 7/7, gamle referencer i læsetilstand, bevaring af øvrige data og gem/genåbn; desuden gymnast uden hold og konto med læseadgang. Axe-kontrol af bekræftelsesdialogen gav ingen fund. [Mobilbillede med syntetiske data](ui/fjern-gymnast-390.png).

En ny lokal testudgave er klargjort. Commit og push venter fortsat efter brugerens besked.

## Kortere knaptekst

**Anvend i kladde** er ændret til **Opdater**, også på de tilsvarende knapper ved ændret udførelse, opstillingsforslag og regelprofilskift. **Gem på Drive** er fortsat den særskilte lagring i den fælles fil. TypeScript/ESLint, produktionsbyg og de 16 eksisterende formular-/gendannelsesforløb i `workspace.spec.ts` og `recovery.spec.ts` er bestået. Der er ikke tilføjet tests, som blot gentager tekstændringen. Ny lokal udgave afleveres uden commit/push.

## Åbn og opret med Google Drive-link

**Åbn fra link** findes på den forbundne startside og under Arbejdsrum. Et fillink åbner en kompatibel arbejdsrumsfil direkte, når appen har adgang; et mappelink starter filvælgeren inde i mappen. Oprettelse har **Link til mappe (valgfrit)** og bevarer det almindelige mappevalg, når feltet er tomt. Navn/link og eksisterende ugemt kladde bevares ved annullering eller fejl. Linkets URL hentes aldrig; kun validerede referencer bruges til den faste Drive API-origin.

Den eksisterende `drive.file`-adgang er bevaret. Googles [målrettede filvalg med setFileIds](https://developers.google.com/workspace/drive/picker/reference/picker.docsview.setfileids) bruges ved 403/404 for at tilbyde bekræftelse af den angivne ressource. [setParent](https://developers.google.com/workspace/drive/picker/reference/picker.docsview.setparent) bruges ved mappestart, og [resource keys](https://developers.google.com/workspace/drive/api/guides/resource-keys) sendes som Drive-header og huskes kun med forbindelsens filreference. Ingen resource key eller token skrives i arbejdsrumsfilen. Appens dialoger lukkes, mens Googles filvælger og eventuelle cookievalg er åbne.

TypeScript/ESLint, produktionsbyg, **190 domæneprøver**, **56 Drive-prøver** og den fulde browsersuite **72/72** er bestået. Ti nye browserprøver dækker mobil/desktop, direkte fillink med genåbning, mappe-/legacy-link, oprettelse uden ændring af eksisterende fil, målrettet Google-valg, annullering, læseadgang, ugyldige links og inkompatibel fil med bevaret ugemt kladde. Axe-kontrol af linkdialogen gav ingen fund. Visuel kontrol: [fillink på mobil](ui/drive-fillink-390.png) og [mappelink ved oprettelse](ui/drive-mappelink-1440.png).

Prøverne bruger syntetiske data og Google-mocks. De beviser ikke rigtig Google-adgang eller Pickers visning på brugerens konto; det afprøves særskilt. En ny lokal testudgave afleveres, og commit/push afventer fortsat brugerens klarsignal.

## Klarsignal til publicering

Efter den lokale testleverance gav brugeren 25. oktober 2026 udtrykkeligt klarsignal: »lad os publicere den«. Den samlede kandidat med UI-overhaling og de efterfølgende rettelser må derfor committes og publiceres. Det ændrer ikke den faste arbejdsgang for fremtidige ændringer eller status for de udestående rigtige Google-/flerbrugerprøver. Actions- og Pages-resultat registreres efter faktisk publicering.
