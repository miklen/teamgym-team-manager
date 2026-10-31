# Tjekliste: REG-springværdier

Kontrol af `spring-values.csv` mod renderede sider i H v1.4 (`reglement/Bedoemmelsesreglement-DK-REG-1.pdf`, SHA i `sources.json`).
Hver H-række er sammenholdt visuelt med REG-kolonnen. Skruetillæg følger H 9.3.6 (s. 34) og 10.3.6 (s. 44): 0,1 pr. 180° på enkeltsaltoer.
Afledte REG-værdier er sammenlignet automatisk med den trykte A3/A4-værdi (alle 44 tilladte er ens) og med REG-pakkens beregning (`tests/domain/reg-spring-values.test.ts`).

Kontrolleret 31. oktober 2026 ved visuel gennemgang af renderede sider.

| Side | Afsnit | H-række (REG-kolonne) | REG | Katalogrækker | Kontrolleret |
|---|---|---|---|---|---|
| 34 | 9.3.5 | Gruppe 1 - Forlæns: Vejrmølle | 0,10 | a3-f-01 | ✓ |
| 34 | 9.3.5 | Gruppe 1 - Forlæns: Kraftspring | 0,20 | a3-f-02 | ✓ |
| 34 | 9.3.5 | Gruppe 1 - Forlæns: Flyvespring | 0,20 | a3-f-03 | ✓ |
| 34 | 9.3.5 | Gruppe 1 - Forlæns: Lukket salto | 0,20, 0,30, 0,40 | a3-f-04, a3-f-05, a3-f-10, a3-f-11 | ✓ |
| 34 | 9.3.5 | Gruppe 1 - Forlæns: Hoftebøjet salto | 0,20, 0,30 | a3-f-06, a3-f-07, a3-f-12 | ✓ |
| 34 | 9.3.5 | Gruppe 1 - Forlæns: Strakt salto | 0,30, 0,40, 0,50, 0,60, 0,70, 0,80 | a3-f-08, a3-f-09, a3-f-13, a3-f-14, a3-f-15, a3-f-16, a3-f-17, a3-f-18 | ✓ |
| 34 | 9.3.5 | Gruppe 1 - Forlæns: Dobbeltsalto (REG -) | - | a3-f-19, a3-f-20, a3-f-21, a3-f-22, a3-f-23, a3-f-24, a3-f-25, a3-f-26, a3-f-27 | ✓ |
| 34 | 9.3.5 | Gruppe 2 - Baglæns: Rondat | 0,10 | a3-b-01 | ✓ |
| 34 | 9.3.5 | Gruppe 2 - Baglæns: Flik-flak | 0,20 | a3-b-02 | ✓ |
| 34 | 9.3.5 | Gruppe 2 - Baglæns: Whipback | 0,30 | a3-b-03 | ✓ |
| 34 | 9.3.5 | Gruppe 2 - Baglæns: Lukket salto | 0,20, 0,30, 0,40 | a3-b-04, a3-b-07, a3-b-09 | ✓ |
| 34 | 9.3.5 | Gruppe 2 - Baglæns: Hoftebøjet salto | 0,20, 0,30 | a3-b-05, a3-b-08 | ✓ |
| 34 | 9.3.5 | Gruppe 2 - Baglæns: Strakt salto | 0,30, 0,40, 0,50, 0,60, 0,70, 0,80 | a3-b-06, a3-b-10, a3-b-11, a3-b-12, a3-b-13, a3-b-14 | ✓ |
| 34 | 9.3.5 | Gruppe 2 - Baglæns: Dobbeltsalto (REG -) | - | a3-b-15, a3-b-16, a3-b-17, a3-b-18, a3-b-19, a3-b-20, a3-b-21, a3-b-22 | ✓ |
| 34 | 9.3.5 | Gruppe 2 - Baglæns: Trippelsalto (REG -) | - | a3-b-23, a3-b-24, a3-b-25 | ✓ |
| 43 | 10.3.5 | Gruppe 1 - med redskab: Mølleoverslag | 0,30 | a4-v-01 | ✓ |
| 43 | 10.3.5 | Gruppe 1 - med redskab: Overslag | 0,40 | a4-v-02 | ✓ |
| 43 | 10.3.5 | Gruppe 1 - med redskab: Tsukahara (REG -) | - | a4-v-03, a4-v-04, a4-v-05, a4-v-06, a4-v-07, a4-v-16, a4-v-17, a4-v-18, a4-v-19 | ✓ |
| 43 | 10.3.5 | Gruppe 1 - med redskab: Overslag salto (REG -) | - | a4-v-08, a4-v-09, a4-v-10, a4-v-11, a4-v-12, a4-v-13, a4-v-14, a4-v-15, a4-v-20, a4-v-21, a4-v-22, a4-v-23, a4-v-24 | ✓ |
| 43 | 10.3.5 | Gruppe 2 - uden redskab: Lukket salto | 0,10, 0,20 | a4-f-01, a4-f-04 | ✓ |
| 43 | 10.3.5 | Gruppe 2 - uden redskab: Hoftebøjet salto | 0,20, 0,30 | a4-f-02, a4-f-05 | ✓ |
| 43 | 10.3.5 | Gruppe 2 - uden redskab: Strakt salto | 0,30, 0,40, 0,50, 0,60, 0,70, 0,80 | a4-f-03, a4-f-06, a4-f-07, a4-f-08, a4-f-09, a4-f-10 | ✓ |
| 43 | 10.3.5 | Gruppe 2 - uden redskab: Dobbeltsalto (REG -) | - | a4-f-11, a4-f-12, a4-f-13, a4-f-14, a4-f-15, a4-f-16, a4-f-17, a4-f-18, a4-f-19, a4-f-20 | ✓ |
| 43 | 10.3.5 | Gruppe 2 - uden redskab: Trippelsalto (REG -) | - | a4-f-21, a4-f-22, a4-f-23, a4-f-24, a4-f-25, a4-f-26, a4-f-27 | ✓ |

## Bemærkninger

- H s. 43, »Tsukahara dobbelt, hoftebøjet«: REG-cellen er tom i stedet for »-«. Rækken behandles som ikke tilladt, fordi H 10.3.2 og 10.3.4 udelukker dobbeltroterende spring, og fordi Pegasus-hvidlisten kun rummer mølleoverslag og overslag.
- H s. 34, »Trippelsalto«: findes kun i Gruppe 2; A3 har ingen forlæns trippel. Begge kolonner er »-«.
- »Start«-rækker i A3 (a3-f-05, a3-f-07, a3-f-09, a3-f-15) følger samme H-række som den tilsvarende salto.
