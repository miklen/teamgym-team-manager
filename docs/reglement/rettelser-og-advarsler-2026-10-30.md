# Rettelser og synlig regelusikkerhed — 30. oktober 2026

Dette følger [implementeringsreviewet](implementeringsreview-2026-10-30.md). Kildernes bytes er ikke ændret. Træneren har afklaret Q01 for DK 1.1.0 før push; øvrige uafklarede fortolkninger er ikke erklæret officielle.

## Pakker og sikre rettelser

`dk@1.1.0` er ny standard ved oprettelse af hold. Eksisterende hold beholder `dk@1.0.0`, indtil en træner gennemgår **Reglement → Vis før og efter** og vælger skiftet. Dermed ændres tidligere gemte beregninger ikke lydløst.

| Reviewfund | Ændring i 1.1.0 |
| --- | --- |
| R01 | Ubekræftet eller ugyldig serie kan bevare sin teoretiske kendte del, men giver ikke sikker omgangs- eller disciplin-D. |
| R02 | Et eksplicit mellemtrin, en pause eller et fald kan ikke gøres gyldigt med en fri trænernote. Serien markeres ugyldig; appen opfinder ikke D for elementerne efter afbrydelsen. |
| R03 | En Tsukaharas redundante angivelse af samme skrue efter hænderne adskiller ikke længere regelidentiteten. Rå gemt udførelse og bekræftelsens binding ændres ikke. |
| R04 | Generelt tilløb til rytmemoment beskrives som højst tre gå- eller løbeskridt. Et særskilt et-skridtskrav under et konkret moment berøres ikke. |
| R05 | Sissone 180° er bendeling og får ikke et automatisk fælles startfrontkrav for skruehop. |
| Q01 | Banens elementtillæg følger det trykte eksempel: +0,10 pr. forskelligt gyldigt element ud over seriens første, gennemsnit over tre omgange. Gentagne elementer tæller ikke igen. |

### Afklaret baneelementtillæg

For hver tællende gymnast i DK 1.1.0 tælles forskellige gyldige C-elementidentiteter i serien. Første element giver 0; hvert yderligere forskelligt element giver +0,10. Rondat–flik–flik giver derfor +0,10 pr. gymnast, rondat–flik–lukket salto +0,20, og ét element 0. Tillæggene summeres over alle tællende i de tre omgange og divideres med tre. En delvis plan viser kun et foreløbigt beløb. Et sikkert samlet regelmaksimum opfindes ikke af filformatets grænse på 30 elementer. DK 1.0.0 bevarer Q01's to åbne spor.

## Åbne spørgsmål i visningen

En diskret trekant står ved de resultater eller valg, hvor et åbent spørgsmål er relevant. Forklaringen foldes ud på stedet. Den erstatter ikke et dommersvar.

| Spørgsmål | Hvornår vises det? | Nuværende håndtering |
| --- | --- | --- |
| Q02–Q06 i DK 1.1.0; Q01–Q06 i DK 1.0.0 | Berørte D- og C-beslutninger i springplanen samt åben spring-D i færdighedsvisningen. | Når point ikke kan fastslås, vises en kort forklaring og eventuelle kildealternativer. Et beregnet delbeløb markeres som foreløbigt eller afhængigt af regelafklaring. |
| H-U06 | En D- eller C-værdi har flere end to rå decimaler før panelets nedrunding. | Eksakt værdi rundes direkte ned til 0,005; muligt forudgående todecimalstrin er åbent. |
| C-RETNING-VALG | Samme blandede omgang er eneste bedste kandidat til begge retningskrav. | Fradraget markeres åbent. Den hidtidige optælling vises som ét muligt spor. |
| A71-U01 | Et valgt dobbeltspring. | Beregnet D er ikke bevis for licens eller særskilt godkendelse. |
| A3-U01 | En baneserie begynder med forlæns salto. | Startsalto tælles som samme element som almindelig salto. |
| A1DK-U06 | Knælende Gumbi vælges eller vises. | Valget tillades, men den nyere tabel og et ældre svar er ikke forenet. |
| A1DK-U03 | J822 vælges eller vises. | Den trykte kode bevares; tilhørsforhold til spagatrækken ved programvalg er åbent. |
| A1DK-U04 | En balance med vandret overkrop vælges eller vises. | Kravteksten vises, men 15°/30°-grænsen afgøres ikke af appen. |
| K01 | Et af de to momenter med trykt kode DB804 vælges eller vises. | Begge har særskilt intern identitet; fælles anmeldelse er ikke afklaret. |

Spørgsmål om faktisk udførelse, E, dommerfradrag, rytmens fulde program, aldersdispensationer og andre rækker kan ikke knyttes til et beregnet appresultat, fordi appen ikke beregner disse forhold. De er fortsat opført i kildegennemgangens afklaringsliste.

## Fælles data og fletning

Ingen nye gemte felter er tilføjet. `team.rulesetBinding.packageVersion` er det eneste gemte valg, når en træner skifter til 1.1.0. Det er allerede en del af den atomiske regelbinding i den fælles flettekontrakt. Selve skiftet opdaterer også planens regel-fingerprint og markerer berørte rytmeregistreringer til revurdering; samtidige ændringer i samme vurdering kræver eksplicit konfliktvalg. Formularer fastlægger ingen egen flettepolitik.

Den direkte Q01-rettelse ændrede betydningen af den lokale 1.1.0 før push uden at ændre bindingsstreng eller schema. Allerede oprettede lokale 1.1.0-testfiler får ny afledt C ved genindlæsning; de må ikke gemmes fra den gamle lokale preview efter rettelsen. 1.0.0-filer følger fortsat deres gamle pakke. [Flettekontrakten](../vedligeholdelse-fletning.md) beskriver pakkevalg mod samtidig omgangsændring og genberegning efter valg.

Sammenligning mellem pakker er versionsbundet: gammel og ny beregning vises før skift, og en forældet forhåndsvisning kan ikke anvendes. Gemte gymnast-, spring- og registrerings-id'er, planpladser og deres orden bevares. Rå springidentitet og forbindelsesbekræftelse bevares; den nye regelidentitet bruges kun af 1.1.0's afledte D-, C-, gentagelses- og søgeberegninger. Rytmens ændrede krav og sissonevalg kan ændre fællesnævnere. Advarslerne er kun præsentation af versionsbundne beslutninger; de skriver intet fælles data.

`tests/domain/dk-v2-corrections.test.ts`, `tests/domain/spring-engine.test.ts`, `tests/domain/potential.test.ts`, `tests/domain/registry.test.ts` og `tests/domain/workspace-merge.test.ts` kontrollerer regelafklaringen, versionsskift, bevaret vurdering og samtidige pakke-/planændringer i begge fletteretninger. Browserprøven `tests/e2e/rule-uncertainty.spec.ts` kontrollerer både det åbne 1.0.0-spor og 1.1.0's afklarede række. De gamle auditprøver i `tests/review/` er historisk reproduktion af `dk@1.0.0` og indgår ikke i normal grøn suite.
