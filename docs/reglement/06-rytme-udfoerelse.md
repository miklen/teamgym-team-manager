# Appendix A2: rytmens udførelsesfejl

[Til oversigten](README.md) · Kilde-ID: **A2**

| Kildeoplysning | Indhold                                                                                                                          |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Original       | [A2-Appendix-A2-Rytme-Oversigt-over-udfoerelsesfejl.pdf](../../reglement/A2-Appendix-A2-Rytme-Oversigt-over-udfoerelsesfejl.pdf) |
| Udgave i filen | Ingen entydig versionsdato trykt                                                                                                 |
| Omfang         | 2 PDF-sider; sidetal nedenfor er PDF-sider, fra 1                                                                                |
| Anvendelse     | Rytme-E i H; ikke planlagt D                                                                                                     |
| SHA-256        | `352b27179f8b84616446822b03d8bf6e401c4ba34ebde77988fd0a36bfd56b41`                                                               |

Status: kildebaseret gennemgang 2026-10-30. Ikke en officiel fortolkning eller en godkendelse af appens implementering. Åbne spørgsmål nedenfor er ikke afgjort. Kravene er parafraseret; originalens tabeller og figurer er fortsat kildegrundlaget.

## Struktur og regler

S. 1 beskriver sammenlægning; s. 2 beskriver fem fejlfamilier. H 8.4.2 leverer tabellen over antal gymnaster og fejlstørrelse.

1. **A2-01:** Identificér samtidige individuelle fejl pr. gymnast. Sammenlæg og nedklassificér til nærmeste trin for én gymnast: 0,1, 0,2 eller 0,4. Eksempler i kilden: 0,1+0,2=0,3 bliver moderat 0,2; 0,1+0,2+0,2=0,5 bliver stor 0,4.
2. **A2-02:** Tæl gymnaster i hver fejlstørrelse: én, færre end halvdelen, mindst halvdelen. Brug H-tabellen. Blandede holdbidrag lægges sammen og nedklassificeres til 0,1/0,2/0,4/0,7/1,0.
3. **A2-03:** Kun mindre fejl: højst 0,4; moderat inklusive mindre: højst 0,7; stor inklusive øvrige: højst 1,0. Flere moderate gymnastfejl må ikke i sig selv skabe et større fejlniveau. Samme fejl må ikke trækkes to gange under forskellige betegnelser.

| Afsnit s. 2         | Mindre                               | Moderat                                  | Stor                                       |
| ------------------- | ------------------------------------ | ---------------------------------------- | ------------------------------------------ |
| 2.1 Synkronisering  | Omtrent én takt forskudt             | Omtrent to takter                        | Blackout, helt anden eller ingen udførelse |
| 2.2 Ensartethed     | Små forskelle, f.eks. <15°           | Synlige, f.eks. 15-45°                   | Meget synlige, f.eks. >45°                 |
| 2.3 Amplitude       | Begrænset bevægelsesudslag           | Ikke angivet                             | Ikke angivet                               |
| 2.4 Balance/kontrol | Ekstra bevægelse/ét skridt eller hop | Flere korrektioner eller hånd-/knæstøtte | Tungt fald                                 |
| 2.5 Formation       | Gymnast uden for den anmeldte form   | Ikke angivet                             | Ikke angivet                               |

## Præcise afklaringspunkter

**A2-U01 (manglende afgrænsning, s. 1):** Vurderingen sker på ethvert givet tidspunkt, men ingen tidslig grupperingsregel angiver, hvornår én fejl slutter og en ny begynder. Hvordan tælles en vedvarende usynkron sekvens versus gentagne fejl? Få konkrete video-/tælleeksempler før automatisk E-optælling. Det er ikke en modstrid i satserne, men en observationsafhængig afgrænsning.

**A2-U02 (s. 1):** Bekræft klassifikation ved blandede fejlstørrelser med et fuldt eksempel, fx to mindre og én stor fejl hos seks gymnaster, inklusive anvendelsen af loftet. De enkelte tabeller er klare, men en produktionsalgoritme bør have et godkendt facit for sammenlægning.

## Senere validering

Adskil observeret E fra rytme-D's fuld/halv/nul. Test skift fra 2 til 3 fejlende på hold med seks og fra 3 til 4 på hold med otte; samme antal fejl må ikke bruge et fast sekspersoners kriterium i rytme.
