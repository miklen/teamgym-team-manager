# Grundlag for senere validering af implementeringen

[Oversigt](README.md). Dette er testdesign og håndregning fra kilderne, **ikke kørte app-tests**. Alle gymnaster nedenfor er syntetiske. Ingen forventninger er beregnet med produktionsreglerne.

## Kontrolrækkefølge

1. Fastlås kildeudgave, række, alder og konkurrencetype. Kontrollér, om alle nødvendige dokumenter findes.
2. Identificér aktive gymnaster, reserver, tællende positioner, køn og rækkefølge.
3. Genkend elementer med kildeidentitet, positioner og skruefordeling. Hold denne identitet adskilt fra D-basis.
4. Vurder rækkeautorisation, sikkerheds-/licenskrav og faktisk observeret gyldighed hver for sig.
5. Beregn D og C med hver sin filtrering, tælleenhed og aggregation. Et D-nul kan have flere årsager med forskellige C-konsekvenser.
6. Bevar åbne delresultater; beregn kun sikre, uafhængige bidrag. Ingen manglende observation må præsenteres som et fejlfrit E-forløb.
7. Anvend dokumenteret panelbehandling og afrunding. Sammenlign med uafhængigt facit, ikke med eksisterende app-output.

## Håndregnede og kildebestemte cases

| Case | Regel / kilde | Input                                                       | Forventning                                                                                              |
| ---- | ------------- | ----------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| V01  | H-S03, A3     | Rondat-flik-baglæns strakt 360°                             | D=0,10+0,20+0,50=0,80                                                                                    |
| V02  | H-S03, A3     | Samme, med en ekstra flik                                   | D stadig 0,80; gentaget element ikke med to gange                                                        |
| V03  | H-S03, A3     | Kraftspring-forlæns strakt 180°                             | D=0,20+0,40=0,60                                                                                         |
| V04  | H-S03/04      | Omgangssummer 3,60;4,20;4,80                                | Disciplin-D=(3,60+4,20+4,80)/3=4,20; ikke 0,70                                                           |
| V05  | H-S03/04      | Én tællende gymnast forbedres med 0,10 i én omgang          | Rå disciplin-D stiger med 0,10/3=1/30                                                                    |
| V06  | H-G06         | Rå panelværdi 127/30, forudsat ingen tidligere afrunding    | Nedrunding til 0,005 giver 4,230; tidspunktet i fuld panelproces kræver H-U06                            |
| V07  | H-S02         | Otte DK-gymnaster i rækkefølge G1-G8                        | G3-G8 tæller til C/D/E; G1/G2 er stadig omfattet af rækkefølgekravet                                     |
| V08  | H-S02         | Ni DK-gymnaster                                             | Position 3-8 er tællende; niende er ikke en lovlig udvidelse. Forkert antal skal vurderes særskilt       |
| V09  | H-S06, A5     | Dobbelt Tsukahara i DK                                      | Tredobbelt rotation fra trampet til landing: forbudt og D=0 uanset trykt A4-værdi                        |
| V10  | H-C08/09      | Bane: kvalificerende skrueantal 2/6/4 og dobbeltantal 6/1/2 | DK +0,60 for skruer og +0,60 for dobbelter; de bedste omgange behøver ikke være samme omgang             |
| V11  | H-C11         | Fri enkeltsalto 360° på trampet                             | Opfylder DK U14's tærskel, ikke DK juniors/seniors 540°-tærskel                                          |
| V12  | H-C11, A5     | TSU uden skrue efter håndafsæt                              | Opfylder ikke skruekravet alene ved drejningen i indspringet                                             |
| V13  | A5-09         | Dobbelt med positioner strakt/hofte mod hofte/hofte         | Samme laveste D-basis, forskellige C-elementer                                                           |
| V14  | A5-09         | Dobbelt strakt med skruefordeling 540°/720° mod 720°/540°   | Samme element efter reglen for mindst tre hele skruer                                                    |
| V15  | H-R10         | Markerede rytmeelement D=0,8; alle forsøger, 0/1/2/3 fejler | 0,8/0,4/0,4/0; G undtaget fra halv-værdi-reglen                                                          |
| V16  | H-R11         | DK J-basis 0,8, én fejl i elementet; alle opfylder ind/ud   | 0,8/2+0,2=0,6; ikke (0,8+0,2)/2                                                                          |
| V17  | A1.2 s. 2/11  | HB1001 og F402 i REG                                        | Tabelværdier 0,6 og 0,1; kodecifre må ikke give 1,0 og 0,4                                               |
| V18  | A6 1.8.B      | DK seks tællende: 2 drenge+4 piger                          | Kildens antalfradrag 3,0, ikke 6,0                                                                       |
| V19  | ASP 1.7       | Fradrag 7,3 blandt otte                                     | Formlen giver 5,475 og omgang 4,525; trykt eksempel 3,9/6,1 er konflikt, ikke alternativt godkendt facit |
| V20  | ASP 3.2       | Rondat-flik-lukket                                          | Ikke i tilladte komplette kombinationer; anses som gennemløb                                             |
| V21  | FOR           | Samme gymnast dagen før og på 18-årsfødselsdag              | Under-18-betingelsen gælder før dagen, ikke på dagen; adskilt fra TR-rækkealder                          |

## Cases, hvor forventningen skal være en synlig afklaring

| Case | Input                                                     | Åben afhængighed                                         |
| ---- | --------------------------------------------------------- | -------------------------------------------------------- |
| U01  | Seks ens rondat-flik-serier i en baneomgang               | H-U01: 0,1 eller 0,2 pr. gymnast i elementtillæg         |
| U02  | Overslag salto hoftebøjet 180°                            | A4-U01 afklaret for DK 1.1.0: reglementet gælder, D=1,10 |
| U03  | Holdomgang fordelt 3/3, 2/2/2 eller 3/2/1                 | H-U03: reference og D/C                                  |
| U04  | Delvis gentagelse på tværs af skiftende gymnaster         | H-U02: afklaret for DK 1.1.0; holdoptælling, 0,20 × (sum − største omgang) pr. identitet. Ved lighed er omgangsplacering ikke fastlagt. |
| U05  | Tre blandede redskabsomgange, hver 3 med/3 uden           | H-U05 afklaret for DK 1.1.0: ugyldig omgang, intet fradrag |
| U06  | Faldende/stigende D inden for samme rotation: 0,8;0,6;0,7 | H-U04 afklaret for DK 1.1.0: to fejl, 0,20              |
| U07  | Fuldt REG-rytmeprogram med alle C-komponenter             | H-U08: 1,2-maksimum versus 1,3-komponentsum              |
| U08  | REG med én hånd på Pegasus                                | A6-U02: 0 eller 0,6 i E; kan stadig være legitimt forsøg |
| U09  | Alle har trænerlicens, dokumenteret kun til 25/26         | A71-U01: ingen sikker gyldighed i 26/27                  |

## Sporbarhed ved næste trin

For hvert regel-ID oprettes forbindelse til konkret produktionskode, eksisterende test, nyt uafhængigt eksempel og eventuel produktbegrænsning. Registrér resultat som korrekt, afvigende, ikke implementeret, uden for produktomfang eller kildeafklaring nødvendig. Et grønt testresultat med forkert forventning er en afvigelse, ikke dokumentation for sportslig korrekthed.

Før ændring af appen skal berørte gemte felter og flettepolitik vurderes. Efter implementering følger projektets lokale brugerafprøvning før commit/push. Denne dokumentgennemgang indeholder ingen appændring, migration eller skriveprøve mod trænerfiler.
