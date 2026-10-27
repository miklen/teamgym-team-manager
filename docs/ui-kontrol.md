# Brugerflade og kontrol

Den visuelle retning følger projektets frontend-skill: lys arbejdsflade, mørk tekst, tabellariske tal og én blå accent. Indholdet er holdkontekst/navigation, primær arbejdsflade og detaljer ved de relevante valg. Lister og matricer bærer data; der er ingen dashboardmosaik eller marketinghero.

Interaktionerne er korte positionsovergange ved inspektør, nye/flyttede rækker og ændrede tal, synlige fokusmarkeringer, bevidste forhåndsvisninger samt genberegning af kladden. Flytning bevarer DOM-identitet og tastaturfokus. Dialoger bruger native modal/fokus og returnerer fokus ved lukning. Reduceret bevægelse fjerner animationerne. Tekst fades ikke ind: axe fandt utilstrækkelig kontrast under den oprindelige opacitetsanimation, som blev erstattet af en ren positionsovergang. Den visuelle gennemgang rettede også et skrumpende logo og en klemt redigeringsknap ved stor tekst samt tilføjede omgang, plads og rolle til potentialets ændringsliste.

## Kontrol 25. oktober 2026

Chromium kontrollerer produktionsbygget med syntetisk Google-/Drive-netværk. Der er ingen skjult demonstrationsfil i produktet. 40 browserchecks bestod ved seneste samlede kørsel. De dækker oprettelse af hold/gymnast, komplet banekæde og element-D, dubletåbning, stabilitet, seks omgange, ekstra først/grænse, gem/genåbn, læseadgang, ukendt pakke, konflikter/eksport, mistet uploadsvar, potentiale 4/6→6/6, regelskift/annullering, IndexedDB og afbrydelse mellem faner.

Efter brugerens fejlmelding er Googles SDK-indlæsning automatisk; login kræver fortsat et direkte klik. Appens native modaler lukkes midlertidigt, før Picker åbnes, så de ikke gør Googles iframe og cookievalg inert. Formularen forbliver monteret og bevarer filnavnet ved annullering; Picker fjernes, før appens dialog genåbnes. Fem ekstra browserchecks dækker automatisk indlæsning uden OAuth-kald, genforsøg ved indlæsningsfejl, cookie-/mappevalg og oprettelse ved 1440 og 390 px samt filvalg fra indstillinger. Cookievalget foregår i en separat iframe uden for appdialogerne, så testen rammer den oprindelige native-modal-konflikt. Det er en simulator og ikke en ny faktisk Google-accepttest.

Der er kørt axe med reglerne `wcag2a`, `wcag2aa`, `wcag21aa`, `wcag22aa` på Hold, Gymnaster, Springplan, Rytme, Reglement og vurderingsdialog: ingen fund efter rettelsen. Det er automatiseret kontrol, ikke en påstand om fuld WCAG-certificering eller reel skærmlæserafprøvning.

Alle seks omgange blev omarrangeret med Enter/pileknapper ved tabletbredde med bevaret fokus. Dialogens Escape/fokusretur, reduceret bevægelse og 200 % tekststørrelse blev kontrolleret. Det sidste er tekstzoom gennem CSS, ikke en påstand om afprøvning af enhver browsers zoomfunktion. Klik-/pilehandlingerne er tilgængelige uden hover, og knapper har mindst 44 px berøringsmål.

| Viewport | Kontrolleret | Billeder |
| --- | --- | --- |
| 1440×900 | Tre omgange, matrix med faste moment-/gymnastoverskrifter, 20 gymnaster | [Spring](ui/spring-1440.png), [rytme](ui/rytme-1440.png) |
| 1024×768 | Én omgang med faner, rullende matrix, ingen side-overflow | [Spring](ui/spring-1024.png), [rytme](ui/rytme-1024.png) |
| 768×1024 | Tabletportræt, fastholdt momentkontekst, lange navne | [Spring](ui/spring-768.png), [rytme](ui/rytme-768.png) |
| 390×844 | Én omgang, udfoldelige gymnastlister pr. rytmemoment, ingen side-overflow | [Spring](ui/spring-390.png), [rytme](ui/rytme-390.png) |

Supplerende billeder: [vurdering](ui/vurdering.png), [konkret potentiale](ui/potentiale.png), [regelskift](ui/regelskift.png), [stor tekst](ui/stor-tekst.png). Alle personnavne og arbejdsdata i billederne er syntetiske. Billederne er visuelt gennemgået af implementeringsagenten; de er ikke en ekstern designgodkendelse.

## Afgrænsning

Rigtig Google-login/genbrug, Picker, CORS og betinget media-upload på Pages er særskilt manuel accept. To-konto-testen udfører brugeren efter publicering som aftalt. En browser-simulator eller et grønt axe-resultat må ikke bruges som bevis for disse Google-egenskaber. Se [testbeslutningen](testbeslutning-2026-10-25.md), [Google-opsætning](google-opsaetning.md) og [gemmeprotokol](drive-gemning.md).

## Springbibliotek efter brugerens afprøvning

Tre ekstra browserprøver dækker valg af en komplet helskrueserie, præcise kortere begyndelser, gem/genåbn på desktop og mobil samt genbrug af en egen serie på en anden gymnast uden kopieret stabilitet eller personlig bekræftelse. Axe fandt ingen overtrædelser i biblioteket. Den fastholdte registreringsknap blev visuelt kontrolleret ved 390 px. Se [biblioteket på desktop](ui/springbibliotek-1440.png), [mobilvisningen](ui/springbibliotek-390.png) og [forklaringen](springbibliotek.md).

## Flueben og sikkerhed

Listen har nu flueben og sikkerhed ved hvert spring, med bevarede valg mellem søgninger, grupper og discipliner. Den tekniske ekstraerklæring er erstattet af tekst om hele serien uden mellemtrin. Opdaterede desktop-/mobilbilleder viser flere valgte serier og forskellige sikkerheder; en udfoldelig oversigt viser arven fra lavest D. Axe fandt ingen fund i de afprøvede WCAG 2.2 AA-regler ved 1440 og 390 px. Hele den samlede kørsel har 37 browserchecks. De tidligere beskrivelser af en ekstra personlig bekræftelse gælder den oprindelige udgave; det aktuelle personlige valg udtrykkes med listens flueben.

## Standardserier og kortere begyndelser

To nye browserprøver genskaber eksempelserien med udelukkende syntetiske personer: først en forlæns afslutning efter flik med forklaring, dernæst den korrekte baglæns helskrue med kendt forbindelse, D 1,00 og sikkerhed 3 på alle tre begyndelser. Byggerens gamle sammensatte navnelinje er erstattet af en særskilt overskrift og en udfoldelig punktliste. Forlæns og baglæns er synlige i alle saltoelementer. Kontrolleret på [desktop](ui/standardserie-1440.png) og [mobil](ui/standardserie-390.png). Brugerens originale PDF er ikke medtaget. Samlet browserkontrol: 39 bestået.

## Retninger og indgang fra tilløb

Ny mobilkontrol verificerer, at Grundspring og løs baglæns salto/flik/whipback ikke findes i færdige valg. Alle elementer findes i Byg selv; en [tydelig besked om manglende indgang](ui/springindgang-390.png) ledsager den deaktiverede registreringsknap, indtil rondat er sat foran. Serien kan derefter registreres og gemmes med uændrede eksisterende data. Samlet browserkontrol: 40 bestået.

## Scenarier og reserver · 27. oktober 2026

Den lokale format 3-udgave er gennemgået med 12 banescenarier, navne på 200 tegn, tre omgange, tomme og fyldte reserveområder og en reserve uden spring. Disciplin, scenarie og omgang har forskellige niveauer. Scenarier ligger som en integreret navnerække før analysen; Nyt og menuen forbliver uden for rækkens lokale rulning. Alle scenarier viser fulde navne og søgning. Reserveprioritet, spring, D og fem sikkerhedstrin kan læses hver for sig under omgangen.

Implementeringsagenten har visuelt åbnet og gennemgået nedenstående PNG’er. Det er kontrol af faktisk rendering med syntetiske data, ikke ekstern designgodkendelse eller manuel live Drive-accept.

| CSS-bredde | Navigation og lange navne | Reserveoversigt | Navnefejl | Læseadgang |
| --- | --- | --- | --- | --- |
| 390 | [Navigation](ui/scenarios-navigation-390.png), [200 tegn](ui/scenarios-long-name-390.png) | [Fyldt og springløs](ui/scenarios-reserves-390.png) | [Navnekonflikt](ui/scenarios-error-390.png) | [Låst formular](ui/scenarios-readonly-390.png) |
| 768 | [Navigation](ui/scenarios-navigation-768.png), [200 tegn](ui/scenarios-long-name-768.png) | [Reserveområder](ui/scenarios-reserves-768.png) | [Navnekonflikt](ui/scenarios-error-768.png) | [Låst formular](ui/scenarios-readonly-768.png) |
| 1440 | [Navigation](ui/scenarios-navigation-1440.png), [200 tegn](ui/scenarios-long-name-1440.png) | [Fyldt og tomt beredskab](ui/scenarios-reserves-1440.png) | [Navnekonflikt](ui/scenarios-error-1440.png) | [Låst formular](ui/scenarios-readonly-1440.png) |

Den visuelle gennemgang fandt og rettede mobilens overskrift, taloversigt og navigation ved stor tekst samt fokus, som kunne placere navnefeltets label over viewporten. Navneformularen bringes nu samlet i syne. [Alle scenarier](ui/scenarios-all-390.png) viser fulde navne uden hover. [200 % tekst på mobil](ui/scenarios-large-text-390.png) og [kort dialog ved skaleret layout](ui/scenarios-zoom-200.png) har tilgængelige handlinger og ingen vandret side-overflow.

Browserprøverne dækker pile/Home/End og Enter/Space, navneformularens Escape/fokus, Opdater/Kassér/Bliv og valideringsfejl, reserveprioritet uden drag, navnesammenfald, annullering og samlet indsættelse. Et helt forløb med kopi, reserve, prioritering og indsættelse er gennemført med tastatur ved 720×450 CSS-pixels og skala 2 (1440×900 fysiske pixels). Der er også prøvet 200 % CSS-tekststørrelse ved 390, 768 og 1440, reduceret bevægelse og mindst 44×44 CSS-pixels på centrale handlinger. Denne skalering erstatter ikke brugerens afprøvning af browserens egen zoomfunktion.

Axe med `wcag2a`, `wcag2aa`, `wcag21aa` og `wcag22aa` fandt ingen overtrædelser i de nye afprøvede flader. Det er ikke fuld WCAG-certificering eller en reel skærmlæserprøve. De tre bevægelser er en kort scenariemarkering, positionsovergang ved menu/navneformular og flytte-/indsættelsesovergang. Reduceret bevægelse fjerner animationerne uden at forsinke handlinger.

Brugeren godkendte den lokale udgave 27. oktober 2026 og bad om synkronisering, arkivering og lokalt commit. Se [lokal test](lokal-test.md).
