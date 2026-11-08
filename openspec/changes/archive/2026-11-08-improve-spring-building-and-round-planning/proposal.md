# Proposal

## Why

Træneren kan i dag hverken bygge et manglende spring direkte på en omgang uden gymnast eller hurtigt bruge samme spring på flere pladser. Gymnastens springvælger har allerede søgning, kædefilter, D-filter og én vej til Byg selv under listen; omgangens springvalg har kun en enklere søgeliste. Når kædefilteret ikke finder et spring, mangler en tydelig vej til at fortsætte fra netop den filtrerede kæde. Den eksisterende Byg selv-flade er stadig en særskilt, nummereret elementliste.

## What Changes

- Tilføj forlæns salto → vejrmølle som færdige baneserier med lukket, hoftebøjet og strakt salto.
- Bevar gymnastens nuværende søgning, kædefilter og totrinsvælger. Giv ambitioner samme søge- og filtergrundlag. Når de samlede filtre giver nul resultater, og kæden har en præcis, entydig begyndelse, tilbydes én Byg videre-handling ved tomtilstanden. Fritekst alene bliver aldrig til elementer. Ingen handling gentages på hver springrække.
- Videreudvikl den eksisterende Byg selv-flade til en tydelig, sammenhængende og redigerbar springkæde med direkte variantredigering, fri adgang til basiselementer og løbende visning af D, gyldighed og forbindelsesstatus.
- Lad et spring bygget direkte på en omgang blive en genbrugelig fælles definition. Lad træneren vælge et antal nye pladser med samme spring, så eksempelvis 2 + 2 + 2 og 3 + 3 kan oprettes uden gentagen søgning. Eksisterende pladser overskrives ikke.
- Skeln mellem kendt problematiske og endnu ikke verificerede forbindelser som forklarende advarsler. Træneren kan godkende en præcis kæde for hele arbejdsrummet; derefter kan den bruges og tælle med fuld D under holdets regelpakke. Godkendelsen ændrer ikke forbudte eller uafklarede elementværdier og siger ikke, at en bestemt gymnast kan udføre springet.

## Capabilities

### New Capabilities

Ingen.

### Modified Capabilities

- `skill-catalog`: Nye salto–mølle-serier, videreførelse fra en resultatløs filtrering med valgt kæde til Byg selv, forbedret bygger samt fælles godkendelse af præcise kæder.
- `routine-ambitions`: Byg og genbrug spring direkte på en ubesat omgangsplads med synlig forbindelsesstatus.
- `routine-planning`: Samme rangering som springbiblioteket og samlet oprettelse af et valgt antal pladser med ét spring.
- `difficulty-scoring`: Godkendt kæde tæller med fuld regelpakke-D på ambitioner og besatte pladser; elementernes reglementsmæssige status bevares.
- `workspace-merge`: Den fælles kædegodkendelse og samlet oprettelse af pladser får eksplicit konfliktpolitik og samtidighedsdækning.

## Impact

Berører springbibliotek, bygger, omgangsdialoger, domænekommandoer, regelmotorens forbindelsesvurdering, arbejdsrummets schema og fælles flettekontrakt. Kræver migration af ældre arbejdsrum, målrettede adfærds- og samtidighedstests samt lokal brugertest før commit, push eller publicering.
