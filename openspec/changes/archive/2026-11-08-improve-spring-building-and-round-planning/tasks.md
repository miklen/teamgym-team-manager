# Tasks

Grundlag: `main` på `afb7e54`. Den tidligere implementering er kasseret; ingen af opgaverne nedenfor er udført på dette grundlag.

## 1. Fælles kædegodkendelse og data

- [x] 1.1 Udvid banedefinition og formatmigration med nullable fælles kædegodkendelse bundet til præcis udførelse; verificér format 1–5 → 6, genåbning og at personlige bekræftelser bevares uden automatisk opgradering i domænetests.
- [x] 1.2 Tilføj domænekommando for godkendelse af den præcise kæde og afvis genbrug efter ændret udførelse; verificér godkendelse, identitetsgenbrug, annullering og ændret variant med domænetests.
- [x] 1.3 Klassificér det nye felt i `merge-policy.ts`, beskriv data, identitet, afhængigheder og dansk konfliktpræsentation i `docs/vedligeholdelse-fletning.md`, og verificér strukturel dækning samt samtidige ens godkendelser, forskellig godkendelse, ændret udførelse og arkivering i begge fletteretninger.
- [x] 1.4 Udvid den eksisterende migrationsdialog til format 6 med klar forklaring, eksport af uændrede originalbytes og eksplicit valg om lokal opgradering. Verificér annullering med åben kladde og ingen Drive-upload før særskilt gemning.

## 2. Forbindelser og beregning

- [x] 2.1 Udvid det praktiske, versionsmærkede forbindelseskatalog med forlæns salto i tre positioner → vejrmølle og særskilt advarsel for baglæns salto → vejrmølle; verificér klassifikation af kendt, problematisk og ikke verificeret i målrettede tests.
- [x] 2.2 Lad fælles trænergodkendelse gøre den præcise forbindelse anvendelig i evaluering af ambition og registreret gymnast uden at ændre officielle elementværdier; verificér fuld D for godkendt kæde, uafklaret uden godkendelse og fortsat forbud/ukendt værdi med faste facit.
- [x] 2.3 Tilføj de tre salto–mølle-serier til det eksisterende fælles springbibliotek og navnegrammatik; verificér søgning, D pr. regelpakke, deduplikering og gem/genåbn i biblioteks- og domænetests.

## 3. Vælgerens tomtilstand og Byg selv

- [x] 3.1 Bevar gymnastens nuværende søgning, kædefilter, D-filter, resultater og vurdering; genbrug deres rene filter- og rangeringsregler i ambitionsvalget. Verificér begyndelsesrangering, præcise navne og bevarede valg ved filterskift.
- [x] 3.2 Vis én Byg videre-handling, når de samlede filtre giver nul resultater og kæden har en entydig begyndelse; overfør kun kædens præcise sammenhængende begyndelse. Verificér ingen knap pr. række, ingen udledning fra fritekst eller D-filter, hjælp ved upræcist valg, tom start og uændret arbejdsrum ved annullering.
- [x] 3.3 Videreudvikl den eksisterende Byg selv-flade til en sammenhængende, redigerbar springkæde med aktivt element, søgbare basiselementer, direkte varianter og live D/forbindelsesstatus; verificér desktop/mobil uden overflow, tastatur, skærmlæsernavne og reduceret bevægelse.
- [x] 3.4 Vis særskilte advarsler for kendt problematisk og ikke verificeret forbindelse samt eksplicit fælles godkendelse uden at blokere byggeren; verificér synlig status før/efter godkendelse og at gymnastens sikkerhed ikke kopieres.

## 4. Omgang uden gymnast og antalvalg

- [x] 4.1 Giv ambitionens oprettelses- og ændringsdialog samme findeflade som den eksisterende springvælger, men med Ingen gymnast og forbindelsesstatus. Lad Byg selv oprette eller genbruge én definition sammen med ambitionen; verificér valg, bygning, annullering og genbrug på næste plads.
- [x] 4.2 Implementér atomisk domænekommando for 1–ledig kapacitet nye pladser med samme spring og rolle; verificér 2 + 2 + 2, 3 + 3, selvstændige plads-id'er, blokrækkefølge, ingen overskrivning samt fuld afvisning ved grænsefejl.
- [x] 4.3 Tilføj antalvalget og hurtig gentagelse på omgangens brugerflade med tydeligt preview af antal, rolle og rækkefølge; verificér mobil, tastatur og at ingen gymnast/sikkerhed opfindes i browserprøver.
- [x] 4.4 Verificér samlet oprettelse og godkendelse ved trevejsfletning i samme og forskellige omgange samt identiske nye definitioner på begge sider; dokumentér den observerede konfliktadfærd i `docs/vedligeholdelse-fletning.md`.

## 5. Samlet verificering og lokal brugertest

- [x] 5.1 Kør `npm.cmd run verify` under udvikling, relevante browserprøver og `npm.cmd run verify:full` én gang før lokal brugertest. Undersøg og ret konkrete røde eller ustabile prøver.
- [x] 5.2 Start `npm.cmd run preview:local`, kontrollér `http://127.0.0.1:5173/teamgym-team-manager/`, og giv brugeren en kort prøvevejledning til den bevarede filtrering, Byg videre ved nul resultater, salto–mølle, fælles godkendelse, migration og 2 + 2 + 2/3 + 3. Lad serveren køre og afvent lokal brugertest og udtrykkeligt klarsignal før commit, push eller publicering.
