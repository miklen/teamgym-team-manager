# Redskabsregulativ

[Til oversigten](README.md) · Kilde-ID: **RED**

| Kildeoplysning | Indhold                                                                                      |
| -------------- | -------------------------------------------------------------------------------------------- |
| Original       | [Redskabsregulativ-saeson-25-26-1.pdf](../../reglement/Redskabsregulativ-saeson-25-26-1.pdf) |
| Udgave i filen | Version 1.2, 2025; gældende fra sæson 2025/2026                                              |
| Omfang         | 10 PDF-sider; sidetal nedenfor er PDF-sider, fra 1                                           |
| Anvendelse     | ASP, REG, DK og Liga; TR 7 henviser hertil                                                   |
| SHA-256        | `19d5931eae7f9d5836d609e381ba4e6151e8ca3d84b3d08dd8725e6358a1f10a`                           |

Status: kildebaseret gennemgang 2026-10-30. Ikke en officiel fortolkning eller en godkendelse af appens implementering. Åbne spørgsmål nedenfor er ikke afgjort. Kravene er parafraseret; originalens tabeller og figurer er fortsat kildegrundlaget.

## Struktur og krav

S. 1-2 forside/indhold; s. 3-4 ASP; s. 5-7 REG; s. 8-10 DK/Liga. Formuleringen er gældende **fra** 25/26, ikke udtrykkeligt kun den sæson.

| ID     | Redskab            | ASP                                               | REG                                                            | DK/Liga                                                           |
| ------ | ------------------ | ------------------------------------------------- | -------------------------------------------------------------- | ----------------------------------------------------------------- |
| RED-01 | Rytmegulv          | 14×16 m; kan have måtter                          | 14×16 m med måtter                                             | 14×16 m med måtter                                                |
| RED-02 | Rytmemåtter        | Hvis anvendt 30-35 mm (±2 mm)                     | 30-35 mm (±2 mm)                                               | 30-35 mm (±2 mm)                                                  |
| RED-03 | Bane               | Airtrack 15×2,1 m, 32±2 cm; 50-55 mbar            | Airtrack samme mål; 55-60 mbar, ESM 60-65                      | Fiberbane 15×2 m, 32±2 cm                                         |
| RED-04 | Banelanding        | Måtte 3×7 m, 32±2 cm **samt sidste 4 m airtrack** | Måtte 3×7 m, 32±2 cm                                           | Måtte 3×7 m, 32±2 cm                                              |
| RED-05 | Banetilløb         | Intet selvstændigt mål fastlagt i ASP-afsnittet   | 16×1 m, 32±2 cm                                                | 16×1 m, 32±2 cm                                                   |
| RED-06 | Sikkerhed ved bane | Farlige strukturer bag landing afskærmes          | Samme                                                          | Desuden 0,5 m måtter langs sidste 4 m på begge sider, samme højde |
| RED-07 | Trampetlanding     | 3×7 m, 32±2 cm                                    | Samme                                                          | Samme                                                             |
| RED-08 | Springbord         | Skumplint 70×80×130 cm                            | Pegasus højst 165 cm eller skumplint 70×80×120 cm              | Kun international Pegasus, højst 165 cm                           |
| RED-09 | Trampettilløb      | Intet selvstændigt mål i ASP-afsnittet            | Obligatorisk 25 m ±20 cm fra trampetkant, skumklodsbegrænsning | Samme                                                             |

Rytmegulvets 5 cm velcrokant er med i arealet; neutral farve, sikker sammenføjning, gulvet må ikke skulle flyttes under konkurrencen. ASP omtaler også tapeafmærkning.

Banemarkeringer: 20 cm tværstreger ved 3, 5 og 10 m fra landing. Airtrack samles med flextube. REG/DK-tilløb fastmonteres uden revner og har målebånd med halve meter til landing. Trampettilløb har målebånd fra landingsmåttens kant. Crashmåtte 200×400×10 cm er valgfri ved landingerne. Farlige strukturer bag landingsområdet skal afskærmes. Skumplint ligger på landingsmåtten, kan vendes, men ikke stå på højkant.

| Stævnetrampetter | Udbud og højde                                                                                               |
| ---------------- | ------------------------------------------------------------------------------------------------------------ |
| ASP, s. 4        | Tre: 28 fjedre børnetrampet 16/55 cm forkant/bagkant; 28 og 32 fjedre med forkant 25 cm og justerbar bagkant |
| REG, s. 7        | Fire: børnetrampet 28 fjedre 16/55 cm, samt 28/32/36; generel forkantstekst siger 25 cm, se RED-U01          |
| DK/Liga, s. 10   | Fire: 28/32/36/40 fjedre, forkant 25 cm, justerbar bagkant                                                   |

Trampet cirka 1,25×1,25 m udvendigt, bør have skridsikre pladefødder. Egen trampolin tilladt i alle tre afsnit.

## Præcise afklaringspunkter

| ID      | Kildested og hvorfor uklart                                                    | Spørgsmål / betydning                                                                                                        |
| ------- | ------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| RED-U01 | 2.3.2, s. 7 siger alle fire har forkant 25 cm, men børnetrampet angives 16 cm. | Bekræft børnetrampetten som undtagelse, og hvilke REG-aldre der må benytte den.                                              |
| RED-U02 | 2.2.1/2.2.3, s. 6 omtaler fiberbane, mens 2.2.2 kræver airtrack.               | Er fiberbane-ordet en kopieringsfejl, og gælder tilkoblingskravene tilsvarende for airtrack?                                 |
| RED-U03 | 3.3.3/2.3.3 angiver maksimal, ikke minimal Pegasus-højde.                      | Ved en implementeret redskabsvalidator: hvilke øvrige godkendelses-/minimumskrav gælder? Opfind ikke minimum ud fra tavshed. |
| RED-U04 | H 10.2.2.5 nævner Pegasus; RED 2.3.3 tillader REG-skumplint.                   | Bekræft at godkendt skumplint tæller som redskabsomgang i REG, og hvilke spring den må anvendes til.                         |

## Senere validering

Redskabstype påvirker lovlighed og mulighed for at udføre en plan, men er ikke alene en D-værdi. Test ASP's landingsområde mod DK's, skumplint i REG versus DK og valgfri crashmåtte. Fysisk opsætning kræver kontrol på stedet; en registreret indstilling er ikke dokumentation for faktisk korrekt opstilling.
