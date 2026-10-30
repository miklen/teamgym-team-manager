# Appendix A3: banens sværhedsværdier

[Til oversigten](README.md) · Kilde-ID: **A3**

| Kildeoplysning | Indhold                                                                                            |
| -------------- | -------------------------------------------------------------------------------------------------- |
| Original       | [A3-Appendix-A3.1-Bane-Basisvaerdier.pdf](../../reglement/A3-Appendix-A3.1-Bane-Basisvaerdier.pdf) |
| Udgave i filen | Én tabelside uden entydig versionsdato                                                             |
| Omfang         | 1 PDF-sider; sidetal nedenfor er PDF-sider, fra 1                                                  |
| Anvendelse     | Katalogværdier; H bestemmer lovlighed og aggregering                                               |
| SHA-256        | `0f211f746bb146d33334a1b8412ace9ec9b537bdcad8acf42d9bfe5225c3ca36`                                 |

Status: kildebaseret gennemgang 2026-10-30. Ikke en officiel fortolkning eller en godkendelse af appens implementering. Åbne spørgsmål nedenfor er ikke afgjort. Kravene er parafraseret; originalens tabeller og figurer er fortsat kildegrundlaget.

## Struktur og regler

S. 1 har to uafhængige grupper: forlæns og baglæns. Hver post har D-værdi, navn, symbol og K-kode. Startmarkeringer forekommer særskilt. **A3-01:** Retning er del af identiteten: koden O findes på begge sider med samme værdi, mens OO har forskellig basis. En kode uden gruppe er ikke en entydig nøgle.

| Basis                   | Forlæns      | Baglæns |
| ----------------------- | ------------ | ------- |
| Vejrmølle / rondat      | 0,10         | 0,10    |
| Kraftspring / flik-flak | 0,20         | 0,20    |
| Flyvespring / whipback  | 0,20         | 0,30    |
| Lukket salto            | 0,20         | 0,20    |
| Hoftebøjet salto        | 0,20         | 0,20    |
| Strakt salto            | 0,30         | 0,30    |
| Dobbelt lukket          | 1,20         | 0,80    |
| Dobbelt hoftebøjet      | 1,40         | 0,90    |
| Dobbelt strakt          | 1,60         | 1,10    |
| Trippel lukket          | Ikke angivet | 1,60    |
| Trippel hoftebøjet      | Ikke angivet | 1,90    |

**A3-02:** Skruetillæg: enkelt/dobbelt +0,10 pr. 180°, trippel +0,20 pr. 180°, desuden +0,10 ved 1080° og hver yderligere 360°. Tabellens trykte eksempler omfatter baglæns dobbelt strakt 1080°=1,80 og baglæns trippel lukket 360°=2,00.

**A3-03:** Stjernemarkerede startposter: forlæns lukket, hoftebøjet, strakt samt strakt 360° har samme D som den tilsvarende ikke-startpost. Registrér markeringen særskilt; se identitetsspørgsmålet nedenfor.

**A3-04:** H 9.3.1 bruger kun de tre forskellige højeste elementer i D, men C-elementvurdering er ikke begrænset til disse tre. H 9.3.2 forbyder tripler i DK og dobbelter i REG; tabellens tal er ikke rækkeautorisation.

## Præcise afklaringspunkter

**A3-U01 (s. 1, startposter):** Tabellen forklarer ikke selv, om startstjernen ændrer elementidentitet til C eller blot angiver anvendelse. Bekræft, at samme forlæns salto som start og senere i serien er samme element ved D-gentagelse og C. Indtil da bevares både kildepost og udførelsesrolle uden at skabe et ekstra tillæg alene på baggrund af stjernen.

Ingen modstrid mellem de aflæste basisværdier og H 9.3.5 er identificeret i denne gennemgang. Dette udsagn afgør ikke H-U01 om C-elementtillæg.

## Senere validering

Håndberegnet D: rondat 0,10 + flik 0,20 + baglæns strakt 360° 0,50 = 0,80. Ekstra flik giver stadig 0,80. Kraftspring 0,20 + forlæns strakt 180° 0,40 = 0,60. Ved kildeimport skal hver af tabellens poster bevares, også forbudte poster; de må blot ikke blive tilbudt som lovlige i forkert række.
