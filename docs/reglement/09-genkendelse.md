# Appendix A5: genkendelse og elementidentitet

[Til oversigten](README.md) · Kilde-ID: **A5**

| Kildeoplysning | Indhold                                                                                                                        |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| Original       | [Appendix-A5-Bane-Trampet-Genkendelse-af-elementer.pdf](../../reglement/Appendix-A5-Bane-Trampet-Genkendelse-af-elementer.pdf) |
| Udgave i filen | Ingen entydig versionsdato trykt                                                                                               |
| Omfang         | 4 PDF-sider; sidetal nedenfor er PDF-sider, fra 1                                                                              |
| Anvendelse     | Bane/trampet; A1 henviser også til dele af definitionerne                                                                      |
| SHA-256        | `4372f24bdd3df2b86efce2cc6cc89e69e6260898f90217e093c090e277c3934b`                                                             |

Status: kildebaseret gennemgang 2026-10-30. Ikke en officiel fortolkning eller en godkendelse af appens implementering. Åbne spørgsmål nedenfor er ikke afgjort. Kravene er parafraseret; originalens tabeller og figurer er fortsat kildegrundlaget.

## Struktur og regler

| ID    | Sted       | Regel                                                                                                                                                                                                                                                      |
| ----- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A5-01 | 1, s. 1    | Lukket: hofte/knæ højst 135°. Hoftebøjet: hofte højst 135°, knæ mindst 150°; under 150° regnes lukket. Strakt: hofte/knæ mindst 135° for genkendelse; idealet er 180°. Præcis 135° bedømmes til holdets fordel i C/D.                                      |
| A5-02 | 1, s. 1-2  | Pucked er modificeret lukket i dobbelt/trippel med mere end 180° skrue; samme D som lukket. Lukket/pucked/hoftebøjet vises i hver rotation; strakt holdes hele svævefasen. Laveste viste position afgør D.                                                 |
| A5-03 | Figur s. 2 | Forlæns svævefase vises fra første 135° af overkropsrotationen til sidste 120°; baglæns fra første 90° til sidste 120°. Disse figurtekster mangler i almindeligt tekstudtræk og er visuelt læst.                                                           |
| A5-04 | 2, s. 3    | Skrue genkendes indtil 45° underrotation; ved mere reduceres til fuldførte halve skruer, målt fra hofte. Ved færre end tre skruer i holdomgang samme antal i hver salto, 90° tolerance for fordelingen. D-tolerance er ikke det samme som E's >30°-grænse. |
| A5-05 | 3, s. 3    | Trampetrotationer tælles fra afsæt til landing. TSU/KAS/overslag-salto er dobbelte; dobbelt TSU/KAS og overslag-dobbelt er tredobbelte.                                                                                                                    |
| A5-06 | 4, s. 3    | Whipback: buet enkeltrotation i skulderhøjde eller lavere. Højere end skulder og uden bue regnes strakt salto.                                                                                                                                             |
| A5-07 | 5, s. 3-4  | Rondat er baglæns element trods forlæns indløb. Kraftspring og flyvespring er forlæns; flik baglæns. Hånd-/fodkontakt kræves. Kraftspring kan lande samlet eller i skridt afhængigt af næste element; flyvespring afsæt/landing to fødder.                 |
| A5-08 | 6, s. 4    | TSU 360° lukket/strakt = KAS lukket/strakt, også med yderligere skruer.                                                                                                                                                                                    |
| A5-09 | 7, s. 4    | Forskellig kropsposition i blot én rotation giver forskelligt element til C, selv ved samme D. Skruefordeling er identitetsbærende under tre skruer; fra tre skruer vurderes præcis fordeling ikke.                                                        |

## Præcise afklaringspunkter

| ID     | Sted og hvorfor uklart                                                                    | Spørgsmål / konsekvens                                                                                                                                          |
| ------ | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A5-U01 | 4, s. 3 beskriver to kombinationer af højde og bue.                                       | Hvad er identiteten for et lavt strakt element uden bue eller et højt buet element? Whipback-definitionen er klar, men alle grænsekombinationer er ikke dækket. |
| A5-U02 | 2, s. 3 giver 90° for skruefordeling, men 7 kræver bestemte fordelinger under tre skruer. | Hvordan tilordnes et observeret grænsetilfælde, der ligger præcis 90° fra to fordelinger? Kræv dommereksempel før automatisk identitetsgenkendelse.             |
| A5-U03 | 5, s. 3 kræver hænder og fødder, men næste sætning siger mindst én hånd eller fod.        | Bekræft, at der kræves både håndkontakt og fodkontakt for at genkende de nævnte håndstøttede baneelementer, og hvad manglende fodkontakt betyder.               |

## Senere validering

Test 135°/150°-grænser, 44°/45°/46° underrotation, 30°/31° E-afvigelse separat, 2,5 versus 3 skruers identitetsregel, og to dobbelter med samme laveste position men forskellige positionsforløb. Gem kropsposition pr. rotation, ikke kun minimumspositionen.
