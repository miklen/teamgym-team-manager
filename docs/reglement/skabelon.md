# Skabelon til et reglement eller bilag

Kopiér strukturen til et nyt opslag. Udfyld manglende oplysninger med **ukendt**, ikke en gættet værdi. Et opslag kan dække en kilde; en implementerbar regelpakke kræver også et samlet afhængigheds- og versionsvalg.

## Kildeidentitet

| Felt                                                  | Udfyldes                                                        |
| ----------------------------------------------------- | --------------------------------------------------------------- |
| Stabilt kilde-ID og titel                             |                                                                 |
| Lokal original og SHA-256                             |                                                                 |
| Udgiver / normativ rolle                              |                                                                 |
| Trykt version, vedtagelse, revision og ikrafttrædelse | Bevar uoverensstemmelser                                        |
| Filnavnets dato / webindeksets dato                   | Hold adskilt fra indholdets dato                                |
| Omfang og sidekonvention                              | PDF-side fra 1 samt evt. trykt afvigelse                        |
| Rækker, aldre, køn, discipliner, konkurrencetype      |                                                                 |
| Afhængigheder / udtrykkelige erstatninger             | Præcis kilde og version                                         |
| Dækningsstatus                                        | Læst tekst, visuelt kontrollerede tabeller/figurer, åbne huller |

## Dokumentkort

| Side/afsnit | Emne | Normativt, orienterende eller administrativt | Afhængighed |
| ----------- | ---- | -------------------------------------------- | ----------- |

## Regelkort

Opret et stabilt ID pr. kontrollerbar regel eller tæt sammenhængende regelgruppe.

| Felt                     | Indhold                                                                       |
| ------------------------ | ----------------------------------------------------------------------------- |
| Regel-ID                 |                                                                               |
| Kildested                | Side, afsnit, tabel/række/celle og fodnote                                    |
| Gælder for               | Række, alder, køn, disciplin, sæson                                           |
| Forudsætning og input    | Skeln plan, faktisk observation, godkendelse og manglende input               |
| Krav eller formel        | Bevar enheder og præcis matematisk operation                                  |
| Tælleenhed               | Pr. element, gymnast, omgang, hændelse, hold eller disciplin                  |
| Udvælgelse               | Tællende deltagere, bedste omgang, højeste elementer, rækkefølge              |
| Identitet og lighed      | Kildepost, kode, variant, rotationsfordeling, alias                           |
| Undtagelser              | Alder/række, legitimt forsøg, ekstra deltagere, særlige konkurrencer          |
| Aggregation og afrunding | Rækkefølge af sum, gennemsnit, loft/gulv, nedrunding                          |
| Resultat                 | D/C/E, lovlighed, dokumentkrav, påtale eller observeret forhold               |
| Status                   | Klar kilde / konflikt / manglende præcisering / observation / manglende kilde |
| Afhængige regler         | Hvad bliver uafklaret, hvis dette input er uafklaret?                         |

## Katalogceller og figurer

Bevar kilde-ID+side+tabelrække+kolonne som kildeidentitet, også når trykte koder kolliderer. Registrér kode, navn, trykt værdi, symbol, figurreference, kategori, retning, redskab, rotationer, position pr. rotation, skruer pr. rotation, afsæt, landing, generelle krav, gruppekrav, rækkekrav, cellekrav og tolerance. Skeln en kildemarkering fra en ny udførelsesidentitet.

Ved tom celle, bindestreg eller manglende variant må hverken nul, forbud eller gyldig generalisering antages uden den overordnede regel. En angivet D-værdi beviser ikke tilladelse i alle rækker. Illustration og prosa skal kontrolleres sammen.

## Afklaringsliste

| ID / type | Præcise kildesteder | Konkurrerende læsninger / manglende definition | Hvorfor betydningsfuldt | Skelneeksempel og præcist spørgsmål | Berørte resultater | Svar og status |
| --------- | ------------------- | ---------------------------------------------- | ----------------------- | ----------------------------------- | ------------------ | -------------- |

Brug type kildekonflikt, manglende præcisering, versions-/omfangsproblem eller observationsbehov. Find først eventuelle undtagelser i afhængige dokumenter. Stil ikke et løst spørgsmål om at bekræfte hele reglementet; angiv det tilfælde, hvor læsningerne giver forskellige resultater.

## Uafhængig validering

| Case-ID | Regel-ID | Syntetisk input | Håndregnet forventning eller eksplicit uafklaret | Kilde | Status |
| ------- | -------- | --------------- | ------------------------------------------------ | ----- | ------ |

Test grænser, undtagelser, tælleenheder og rækkefølge af operationer. Et eksempel fra kilden skal først regnes efter, før det accepteres som facit. Appens output må ikke generere testens forventning.

## Betydning for fælles data

Beskriv påvirkning af gemte felter, sammenligning, identiteter, rækkefølge, afhængigheder, afledte værdier og præsentation. Dokumentationsarbejde angiver ingen påvirkning. Implementering kræver eksplicit politik i fælles flettekontrakt for nye/ændrede felter og samtidighedstests. Regler må ikke få lokale formularfortolkninger.

## Frigivelsesstatus

Hold kildegennemgang, sportslig afklaring, implementering, automatiske tests, lokal brugertest og publicering adskilt. En afsluttet kildegennemgang betyder ikke, at implementeringen er valideret. Versionsskift må ikke ændre historiske resultaters betydning uden spor.
