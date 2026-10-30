# Hvad skal vi have afklaret i reglementerne?

[Til det samlede kildeoverblik](README.md)

Denne liste forklarer de spørgsmål, vi endnu ikke har et sikkert svar på. **Du skal ikke vælge den fortolkning, du bedst kan lide.** Vi skal først undersøge, om der findes en officiel præcisering; ellers skal det konkrete spørgsmål forelægges Dommer- og Reglementssektionen (DoRS) eller TeamGym-komitéen (KTG).

Vi begynder med spørgsmålene om Danmarksseriens springomgange. De kan påvirke, hvilke omgange der giver flest point. Rytme, udførelse og andre rækker står længere nede.

Der er to forskellige slags spørgsmål:

- **Kilderne siger noget forskelligt:** eksempelvis to forskellige værdier for samme spring. Vi skal have fastslået, hvilken angivelse der gælder.
- **Teksten forklarer ikke hele tilfældet:** eksempelvis hvordan man tæller fejl i en bestemt rækkefølge. Vi skal have et konkret bedømmelseseksempel, før vi kan lave en entydig beregning.

C betyder kompositionskarakter, D betyder sværhedskarakter, og E betyder udførelseskarakter. Eksemplerne nedenfor er konstrueret til at vise problemet; de mulige svar er **ikke** godkendte fortolkninger.

## Start her: Danmarksseriens springomgange

### 1. Giver rondat-flik 0,1 eller 0,2 i elementtillæg?

**Afklaret af træneren for DK 1.1.0 før push:** Tillægget er positivt og følger reglementets eksempel. Første element giver 0; hvert yderligere forskelligt gyldigt element giver +0,10. Gentaget flik tæller kun én gang. Rondat–flik–flik giver +0,10 og rondat–flik–lukket salto +0,20 pr. gymnast. DK 1.0.0 bevarer spørgsmålet og begge historiske fortolkningsspor. Kildeteksten nedenfor er bevaret som grundlag for afklaringen.

**Problemet:** Hovedreglementet siger, at hvert forskelligt element i en baneserie giver 0,1 i tillæg. Rondat og flik er to forskellige elementer, så denne formulering peger på 0,2. Men reglementets eget eksempel giver rondat-flik **0,1**. I samme eksempel giver en mølle alene **0,0**.

Det ser derfor ud til, at eksemplet først tæller fra element nummer to. Det står bare ikke i selve reglen.

**Spørgsmålet, vi skal have svar på:**

> Hvor meget giver henholdsvis mølle, rondat-flik og rondat-flik-lukket salto i elementtillæg pr. gymnast: 0,1/0,2/0,3 eller 0,0/0,1/0,2? Hvordan tælles en serie med fire forskellige elementer og en serie med gentaget flik?

**Betydning:** Det ændrer banens C-karakter. Appen må ikke skjule konflikten ved blot at vælge det ene regnestykke.

**Kilde:** Hovedreglementet, PDF-side 31, punkt 9.2.3.3 og eksemplet; side 32, punkt 9.2.4. Reference **H-U01** i [kildeopslaget](01-hovedreglement.md).

### 2. Hvad er værdien af overslag-salto hoftebøjet med halv skrue?

**Problemet:** Trampettabellen angiver springet til **1,20**. Men tabellen og hovedreglementet angiver samtidig basisværdien uden skrue til **1,00** og tillægget for en halv skrue til **0,10**. Regnet efter den formel bliver værdien **1,10**.

**Spørgsmålet, vi skal have svar på:**

> Er overslag-salto hoftebøjet med 180° skrue 1,10 eller 1,20 værd? Hvis 1,20 er korrekt, er det så en særlig undtagelse fra den almindelige skrueformel?

**Betydning:** Appen kan ellers give dette spring en forkert D-værdi og sammenligne det forkert med andre spring.

**Kilde:** Appendix A4, side 1, springkoden H>1; hovedreglementet punkt 10.3.5-6. Reference **A4-U01** i [kildeopslaget](08-trampet-vaerdier.md).

### 3. Hvem får fradrag, når kun nogle gymnaster gentager et spring?

**Problemet:** Reglen handler om, at en gymnast gentager samme spring eller baneserie i en anden omgang. Men den siger også, at omgangen, hvor springet udføres flest gange, er fri for fradrag. Vi mangler en præcis forklaring på, hvordan de to betingelser bruges sammen, når besætningen skifter.

**Eksempel:**

| Gymnast | Omgang 1              | Omgang 2              | Omgang 3              |
| ------- | --------------------- | --------------------- | --------------------- |
| A       | Lukket salto          | Lukket salto          | Et andet spring       |
| B       | Et andet spring       | Lukket salto          | Et andet spring       |
| Øvrige  | Ingen lukkede saltoer | Ingen lukkede saltoer | Ingen lukkede saltoer |

A gentager springet. Omgang 2 har flest lukkede saltoer, men B har ikke gentaget det. Alle øvrige spring i eksemplet forudsættes valgt, så de ikke giver andre gentagelser.

**Spørgsmålet, vi skal have svar på:**

> Hvilken udførelse får gentagelsesfradrag i eksemplet: A's spring i omgang 1 eller 2, og hvor stort bliver det samlede fradrag? Hvad gør man, når to omgange har lige mange af samme spring, men forskellige gymnaster udfører det?

**Betydning:** Vi skal kende både optællingen og de berørte gymnaster, når appen sammenligner forskellige besætninger og omgange.

**Kilde:** Hovedreglementet, side 30 og 40, punkt 9.2.2.3 og 10.2.2.3. Reference **H-U02** i [kildeopslaget](01-hovedreglement.md).

### 4. Hvad sker der i holdomgangen, hvis ingen springserie har et flertal?

**Problemet:** Første omgang skal være ens. En gymnast, der laver noget andet end størstedelen af holdet, får nul i D for sin serie/sit spring. Men teksten forklarer ikke tydeligt, hvad referencegruppen er, hvis ingen har mere end halvdelen.

**Eksempel:** Tre gymnaster laver rondat-flik-lukket, og tre laver rondat-flik-strakt i første baneomgang. Ingen af de to serier har et flertal.

**Spørgsmålet, vi skal have svar på:**

> Hvilke gymnaster får nul i D, og hvor mange får C-fradrag, når første omgang er fordelt 3+3? Hvad gælder ved 2+2+2 og 3+2+1? Skal eventuelle ekstra, ikke-tællende gymnaster indgå, når flertallet findes?

**Betydning:** Valget af reference kan ændre store dele af holdomgangens D-karakter, ikke kun et lille fradrag.

**Kilde:** Hovedreglementet, punkt 9.2.2.1/9.3.4 og 10.2.2.1/10.3.4, side 30/34 og 40/43. Reference **H-U03** i [kildeopslaget](01-hovedreglement.md).

### 5. Hvor mange rækkefølgefejl er der i 0,8 → 0,6 → 0,7?

**Problemet:** I anden og tredje omgang skal sværheden fastholdes eller stige inden for hver rotationskategori. Der trækkes 0,1 for hver forkert rækkefølge. Teksten definerer ikke præcis, hvordan antallet findes.

**Eksempel:** Tre på hinanden følgende spring i samme rotationskategori har D-værdierne **0,8 → 0,6 → 0,7**.

- Sammenligner man hvert spring med det umiddelbart foregående, er der ét fald: fra 0,8 til 0,6.
- Sammenligner man med den højeste tidligere værdi, ligger både 0,6 og 0,7 under 0,8.

**Spørgsmålet, vi skal have svar på:**

> Giver dette eksempel 0,1 eller 0,2 i rækkefølgefradrag, eller bruges en anden optælling? Hvordan bestemmes rotationskategorien for en baneserie med både enkelt- og dobbeltsalto og for en serie uden salto?

**Betydning:** Appen skal kunne foreslå rækkefølge og forklare det samme fradrag som dommerne.

**Kilde:** Hovedreglementet, side 30 og 40, punkt 9.2.2.2 og 10.2.2.2. Reference **H-U04** i [kildeopslaget](01-hovedreglement.md).

### 6. Hvordan bedømmes omgange, hvor nogle bruger Pegasus og andre ikke gør?

**Problemet:** Holdet skal have mindst én trampetomgang med redskab og én uden. Fradraget angives pr. gymnast. Det er ikke beskrevet præcist, hvordan man udvælger og tæller mangler ved blandede omgange.

**Eksempel:** Alle tre omgange består af tre gymnaster med Pegasus og tre uden. Ingen omgang er helt med eller helt uden.

**Spørgsmålet, vi skal have svar på:**

> Hvad bliver fradraget i dette eksempel? Skal man udpege to forskellige omgange til kravene med og uden redskab, og hvilke gymnaster tælles som manglende? Hvordan ændres vurderingen ved et legitimt, men mislykket redskabsforsøg?

**Betydning:** Appen kan ellers vise et sikkert C-resultat for en opstilling, som kilderne ikke giver os en entydig beregningsmetode til.

**Kilde:** Hovedreglementet, side 40, punkt 10.2.2.5. Reference **H-U05** i [kildeopslaget](01-hovedreglement.md).

### 7. Hvornår skal der afrundes?

**Problemet:** Ét punkt kræver, at springdommerne afgiver C og D med to decimaler. Et andet kræver, at panelkarakteren rundes ned til nærmeste 0,005. Det er ikke tilstrækkeligt beskrevet, hvordan en rå beregning passerer begge trin.

**Regneeksempel:** En tænkt rå værdi på 0,636 bliver 0,635, hvis man direkte runder ned til 0,005. Hvis den først afrundes almindeligt til to decimaler, bliver den 0,64, og en efterfølgende nedrunding til 0,005 ændrer ikke dette. Eksemplet viser forskellen mellem metoderne; det fastslår ikke, hvilken der er korrekt.

**Spørgsmålet, vi skal have svar på:**

> Skal hver dommers rå C/D først behandles til to decimaler, og i så fald hvordan? Eller skal den præcise værdi bevares indtil panelets nedrunding til 0,005? Vi ønsker et gennemregnet eksempel med alle mellemtrin.

**Betydning:** Selv en korrekt grundformel kan ende med en forkert karakter, hvis afrunding sker på det forkerte trin.

**Kilde:** Hovedreglementet, side 11 og 13, punkt 4.4.a og 4.6. Reference **H-U06** i [kildeopslaget](01-hovedreglement.md).

### 8. Hvilke krav om trænerlicens gælder i 2026/27?

**Problemet:** Trænerlicensbilaget omfatter også visse dobbeltspring. Men det angiver licensernes gyldighed til og med 2025/26 og siger kun, at forbundet kan forlænge dem. Den leverede fil dokumenterer ikke en forlængelse.

**Spørgsmålene, vi skal have svar på:**

> Hvilken officiel ordning og licensgyldighed gælder i 2026/27? Gælder tabellens dame-/herregrænser også for U14 og junior og pr. gymnast på mixhold? Skal den ansvarlige licenstræner være til stede ved konkurrencen?
>
> Hvad menes præcist med en transition fra et dobbeltspring: enhver fortsættelse med et nyt element eller kun bestemte forbindelser? Erstatter den lokale vurdering den ældre centrale trippelgodkendelse, eller kræves begge?

**Betydning:** At et spring er tilladt i DK og har en kendt D-værdi, dokumenterer ikke i sig selv, at alle godkendelseskrav er opfyldt.

**Kilde:** Appendix A7.1, side 1-2. Referencer **A71-U01-U05** i [kildeopslaget](14-traenerlicens.md).

### 9. Er en salto som start et andet element end den samme salto senere?

**Problemet:** Banetabellen har både almindelige poster og særskilt markerede startposter for visse forlæns saltoer. Værdien er den samme. Tabellen forklarer ikke selv, om startmarkeringen ændrer identiteten ved optælling af forskellige elementer.

**Spørgsmålet, vi skal have svar på:**

> Skal samme forlæns salto regnes som samme element, uanset om den bruges som start eller senere i en serie? Har startmarkeringen nogen betydning for gentagelsesregler eller elementtillæg?

**Betydning:** En markering i kataloget må ikke alene give et ekstra tællende element.

**Kilde:** Appendix A3, side 1. Reference **A3-U01** i [kildeopslaget](07-bane-vaerdier.md).

## Danmarksseriens rytme

Disse spørgsmål handler om elementvalg og deres værdi. Hvert spørgsmål henviser til en mere detaljeret kildebeskrivelse.

| Hvad er problemet?                                                                                                  | Hvad skal vi konkret have svar på?                                                                          | Kildeopslag                                                  |
| ------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| DB804 bruges både om en pirouette og et stem til håndstand.                                                         | Hvilken kode er korrekt for hvert element? Må de vælges sammen, når reglementet kræver forskellige koder?   | [A1DK-U01](04-rytme-dk.md), PDF-side 3-4                     |
| G802 bruges om to forskellige kast med værdierne 0,6 og 0,8.                                                        | Hvilken kode og værdi skal anmeldes for kast uden rotation og kast med rotation?                            | [A1DK-U02](04-rytme-dk.md), side 12                          |
| Et spagatspring har koden J822, mens de øvrige i samme række slutter på 11.                                         | Er J822 korrekt, og regnes det som samme tabelrække som J211/J611 ved valg af to spring?                    | [A1DK-U03](04-rytme-dk.md), side 8                           |
| Teksten angiver både 15° for horisontal overkrop og 30° for horisontal krop.                                        | Hvilken tolerance gælder i de konkrete balancer, hvor beskrivelserne bruger begge begreber?                 | [A1DK-U04](04-rytme-dk.md), side 1 og balancekravene         |
| Balancer skal vælges fra forskellige rækker, men rækkenumre går igen i forskellige kategorier.                      | Må hovedstand HB201 og stående balance SB201 vælges sammen, eller regnes de som samme række?                | [A1DK-U05](04-rytme-dk.md), H punkt 8.3.7.1                  |
| Ældre spørgsmål/svar beskriver fri Gumbi-start; den nyere tabel nævner sidelæns/baglæns start.                      | Hvilke startpositioner er tilladt for A807 i den gældende udgave, eksempelvis knælende start?               | [A1DK-U06](04-rytme-dk.md), [QA-U02](12-spoergsmaal-svar.md) |
| Revisionshistorikken siger, at 540° kattespring er tilføjet, men tabellerne har ingen identificerbar celle for det. | Findes et rettelsesblad med den korrekte kode, værdi og udførelseskrav, eller er revisionsnotitsen forkert? | [A1DK-U07](04-rytme-dk.md), H side 5                         |

## Udførelse og dommerfradrag

Disse punkter skal afklares før fuld karakterberegning ud fra en faktisk præstation. De er ikke alle nødvendige for at sammenligne planlagt C og D.

| Hvad er problemet?                                                                            | Hvad skal vi konkret have svar på?                                                                                                  | Kildeopslag                               |
| --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------- |
| Manglende trænerreaktion i fare har to forskellige satser.                                    | Skal DK fradrages 0,5 eller 0,2 pr. tilfælde på bane og trampet? Prosaen siger 0,5, oversigtstabellerne 0,2.                        | [H-U07](01-hovedreglement.md), side 38/47 |
| Lille landingsskridt er både beskrevet som tilladt og som eksempel på fradrag.                | Er ét skridt væk fra redskabet med højst 60° bendeling tilladt, og skal bilagets fradragseksempel sige **over** 60°?                | [A6-U01](10-spring-udfoerelse.md), side 5 |
| Fod-/hovedfejl beskrives både pr. gymnast og pr. element.                                     | Giver fodfejl i to saltoelementer i samme serie 0,1 samlet eller 0,1 for hvert element?                                             | [A6-U03](10-spring-udfoerelse.md), side 1 |
| Et gennemløb beskrives forskelligt i hovedtekst og bilag.                                     | Kan et legitimt, genkendeligt forsøg, som får nul D på grund af fald, blive et gennemløb? Hvilke konkrete tilfælde gør det?         | [A6-U04](10-spring-udfoerelse.md), side 6 |
| Landing og støtte har forskellige angivelser af tælleenhed.                                   | Hvordan tælles flere landingsfejl eller trænerindgreb i samme baneserie: pr. element eller samlet pr. gymnast?                      | [A6-U05](10-spring-udfoerelse.md)         |
| Whipback-definitionen dækker ikke alle kombinationer af højde og kropsform.                   | Hvad kaldes og værdisættes et lavt strakt spring uden bue og et højt buet spring?                                                   | [A5-U01](09-genkendelse.md), side 3       |
| Skruefordeling har 90° tolerance og kan ligge på grænsen mellem to varianter.                 | Hvordan identificeres et spring, der ligger præcis 90° fra to forskellige fordelinger?                                              | [A5-U02](09-genkendelse.md), side 3-4     |
| Teksten om håndstøttede baneelementer bruger både hænder **og** fødder og hånd **eller** fod. | Hvilken kontakt kræves for genkendelse, og hvad sker der ved manglende fodkontakt?                                                  | [A5-U03](09-genkendelse.md), side 3       |
| Rytmens E-regler beskriver ikke præcist, hvornår en vedvarende fejl bliver flere hændelser.   | Hvordan tælles en længere usynkron sekvens, og hvordan sammenlægges forskellige samtidige fejl? Vi ønsker konkrete dommereksempler. | [A2-U01-U02](06-rytme-udfoerelse.md)      |
| Rytmens overdommerfradrag nævnes både som fradrag fra E og fra slutkarakteren.                | Bekræft, at det trækkes én gang fra disciplinresultatet, og hvordan det påvirker den viste E-karakter og tolerancer.                | [H-U09](01-hovedreglement.md)             |
| Dommertolerancetabellen springer fra 8,95 til 9,00.                                           | Hvilken tolerance gælder ved 8,96-8,99 og tilsvarende huller?                                                                       | [H-U10](01-hovedreglement.md), side 12    |
| Rytmens tidsfradrag er ikke ens beskrevet alle steder.                                        | Bekræft satsen pr. række, og om 2,0 for mere end 15 sekunders undertid erstatter det almindelige undertidsfradrag.                  | [H-U12](01-hovedreglement.md), side 27-28 |

## Deltagelse, alder, redskaber og anmeldelse

Dette er især spørgsmål om, hvorvidt et hold og dets anmeldelse opfylder konkurrencens krav.

| Hvad skal vi have afklaret?                | Konkret spørgsmål                                                                                                                                                                                 | Kildeopslag                                                             |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| Beregning af aldersgennemsnit              | Hvilken dato/alder bruges i gennemsnittet, tæller reserver med, og hvordan bruges undtagelsen i seniorrækken?                                                                                     | [TR-U01](02-teknisk-regulativ.md)                                       |
| Gældende udgave og fejlagtige henvisninger | Bekræft 26/27-udgaven og de tilsigtede punkter, hvor teksten henviser til afsnit, der ikke passer.                                                                                                | [TR-U02-U03](02-teknisk-regulativ.md)                                   |
| Klubskifte og medlemskab                   | Hvordan hænger tilladt deltagelse for to klubber sammen med de fælles bestemmelser? Gælder flytte-/aftaleundtagelsen i den spærrede periode før DM, og hvordan håndteres tre måneders medlemskab? | [TR-U03](02-teknisk-regulativ.md), [FK-U01](17-faelles-bestemmelser.md) |
| Tilmeldingsfrist                           | Gælder PDF'ens mulighed for eftertilmelding til 1. december, eller hjemmesidens tidligere lukning?                                                                                                | [TR-U07](02-teknisk-regulativ.md)                                       |
| Rettelser efter Tariff-låsning             | Hvilke rettelser kræver betaling/genåbning, og hvilke kan foretages ved D-dommeren indtil gulvstart?                                                                                              | [TR-U06](02-teknisk-regulativ.md)                                       |
| Lighed mellem hold                         | Hvordan bruges indbyrdes sejre ved tre eller flere lige hold, og hvad sker ved fortsat lighed efter alle kriterier?                                                                               | [TR-U08](02-teknisk-regulativ.md), [FK-U02](17-faelles-bestemmelser.md) |
| Redskabsgrænser                            | Hvilke øvrige godkendelses-/minimumskrav gælder for Pegasus ud over den angivne maksimale højde?                                                                                                  | [RED-U03](11-redskaber.md)                                              |
| Eksterne bestemmelser                      | Er de fælles bestemmelser fra 2016 fortsat gældende uændret, og hvilke eksterne DIF-regler skal indgå i en fuld kontrol?                                                                          | [FK-U03](17-faelles-bestemmelser.md)                                    |

## Andre rækker og senere udvidelser

Disse punkter er bevaret, så de ikke bliver glemt. De behøver ikke alle være løst, før vi kan gennemgå DK's nuværende springberegninger.

| Område                        | Konkret spørgsmål                                                                                                                                   | Kildeopslag                                                          |
| ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| REG rytme-C                   | Maksimum står som 1,2, men alle komponenter giver tilsammen 1,3. Er 1,2 et loft, eller er en sats forkert? Hvad gælder U11?                         | [H-U08](01-hovedreglement.md)                                        |
| REG rytmekatalog              | Bekræft tabelværdier frem for kodecifre, de to G802-koder, håndstøtte i sidebalancer, række-/tolerancebegreber og udførelseskravet til X-hop J203.  | [H-U11](01-hovedreglement.md), [A1REG-U01-U05](05-rytme-reg.md)      |
| REG én hånd på Pegasus        | Giver det 0,6 i E-fradrag som hovedreglementet angiver, eller intet som bilagets streg antyder?                                                     | [A6-U02](10-spring-udfoerelse.md)                                    |
| REG dommerpanel               | Hvordan beregnes E, når der kun er én E-dommer?                                                                                                     | [H-U10](01-hovedreglement.md)                                        |
| REG redskaber                 | Er børnetrampettens 16 cm en undtagelse fra teksten om 25 cm? Er fiberbane i airtrack-afsnittet en skrivefejl? Tæller skumplint som redskabsomgang? | [RED-U01/U02/U04](11-redskaber.md)                                   |
| ASP regneeksempel             | Den trykte formel giver 4,525 i omgangskarakter, mens eksemplet siger 6,1. Hvad skal rettes, og hvordan afrundes?                                   | [ASP-U01](03-aspirant.md)                                            |
| ASP samlet karakter           | Hvordan sammenlægges omgange og dommere? Er der en nedre grænse for E, og hvordan behandles samtidige fradrag?                                      | [ASP-U02/U07](03-aspirant.md)                                        |
| ASP gentagelser               | Hvad er konsekvensen af ens omgange eller en afvigende gymnast i første omgang: påtale, pointfradrag eller andet?                                   | [ASP-U03](03-aspirant.md)                                            |
| ASP hold og frister           | Hvor tilmeldes 50/50-kønsblandede hold? Hvilken udgave og hvilken frist ved fredagskonkurrence gælder?                                              | [ASP-U04-U06](03-aspirant.md), [TR-U04/U06](02-teknisk-regulativ.md) |
| Liga videreførsel af point    | Er tredjedelen, der føres fra anden til tredje seniorrunde, beregnet af ren anden runde eller det kumulerede resultat?                              | [TR-U05](02-teknisk-regulativ.md)                                    |
| Trampetkatalog til udvidelser | Er dobbelt Tsukahara lukket med hel skrue 2,50 eller 2,10? Hvilken værdi/identitet har en hoftebøjet Kasamatsu, hvis den skal understøttes?         | [A4-U02-U03](08-trampet-vaerdier.md)                                 |
| Trippelgodkendelser           | Hvad gælder i dag: central database, lokal vurdering eller begge? Hvilke spring er undtaget, og hvornår bortfalder godkendelse efter inaktivitet?   | [A7-U01-U04](13-trippelgodkendelser.md)                              |
| Forældretilladelse            | Hvor længe og for hvilke spring gælder den, hvad sker ved klubskifte/tilbagekaldelse, og hvordan bruges den i den aktuelle ordning?                 | [FOR-U01-U02](16-foraeldretilladelse.md)                             |
| Liga-regelgrundlag            | Hvilken CoP-udgave gælder, hvilke præcise danske afsnit erstatter den, og hvad er definition/godkendelseskrav for Quad out?                         | [A8-U01-U03](15-liga-cop.md)                                         |
| Ældre spørgsmål/svar          | Hvilke svar gælder fortsat, hvad betyder planes i den danske sammenhæng, og hvornår er en bevægelse et forbudt A1-element i ind/ud?                 | [QA-U01-U03](12-spoergsmaal-svar.md)                                 |
| Historiske sæsoner            | Hvilken endelig 25/26-udgave erstatter orienteringsbrevet, og hvordan skal dets afvigende værdier og tidskrav forstås?                              | [NYT-U01-U03](18-aendringsorientering.md)                            |

## Sådan arbejder vi videre med et punkt

1. Vælg ét spørgsmål og kontrollér de angivne steder i original-PDF'en.
2. Se efter et officielt rettelsesblad eller en tidligere skriftlig afklaring, der gælder den konkrete række og sæson.
3. Hvis svaret mangler, indhent en afklaring med det konkrete eksempel ovenfor. En gruppesamtale om, hvad man plejer at gøre, er nyttig viden, men skal markeres som praksis og ikke som officiel regeltekst.
4. Gem svar, afsender, dato, original dokumentation og række/sæson sammen med punktets reference. Bevar den oprindelige konflikt.
5. Lav derefter et uafhængigt regneeksempel, som implementeringen kan testes imod.

**Status:** Der er endnu ikke indhentet eller registreret officielle svar i denne liste. Der er ikke sendt spørgsmål på brugerens vegne. Detaljerne og de oprindelige referencer er bevaret i kildeopslagene. Denne omskrivning gør spørgsmålene lettere at læse; den afgør ingen sportslige fortolkninger og ændrer ingen appregler eller fælles data.
