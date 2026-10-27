# Vedligeholdelse af sammenligning og fletning

`packages/domain/src/workspace-merge.ts` sammenligner basis B, lokal L og fil R uden mutation, netværk, ur eller tilfældige id'er. Alle tre skal være gyldige format 3-filer med samme workspaceId. Konteksten injicerer en stabil fingerprint og ren afstemning med de aktuelle regelpakker. Uafgjorte/ugyldige resultater har ingen `candidate`; kun `status: 'valid'` kan anvendes. Konflikt-id'er er bundet til input og kontekst. Ingen valg er forhåndsudfyldt. Genberegn ved ændrede valg.

## Dækningsoversigt

`merge-policy.ts` klassificerer hvert felt og alle indlejrede objekter/unioner. Typebestemte objektfelter og `checkMergePolicy` supplerer hinanden. Schemaets faktiske struktur kontrolleres også inde i atomiske grupper, record-værdier, nullable felter og tuplemedlemmer. En ny uniongren må ikke arve en anden grens politik.

| Model | Identitet og politik |
| --- | --- |
| Arbejdsrum | format/schemaVersion/workspaceId er kompatibilitet. revision/updatedAt/recentOperations er gemmemetadata fra R. |
| Hold | id; navn og arkivering selvstændigt; hele regelbindingen atomisk og afhængig af revurdering/plan. |
| Gymnast | id; navn, kendetegn, hold, arkivering og mixkategori selvstændigt; holdskift/arkivering forbindes med berørte planændringer. |
| Spring | id; navn/arkivering særskilt; udførelse og forbindelsens overgange atomisk. Alle tre discipliner, elementfelter og variantværdier er eksplicit dækket. |
| Registrering | id; sikkerhed/dato/ophav én gruppe, note særskilt, forbindelsesbekræftelse atomisk, revurderingsliste atomisk. updatedAt vælger ingen vinder. |
| Plan | id og teamId; regel-fingerprint; discipliner indeholder scenarier med id. |
| Scenarie | id; navn selvstændigt; rækkefølge eksplicit; tre omgange identificeres ved id. |
| Omgang | id; deltagere og reserver hver en atomisk ordnet liste inklusive medlemmernes id, gymnast, spring og rolle. Flytning mellem lister kan samle valget. |
| Arverelation | nøgle sourceId/targetId/catalogId/relationId; hele accepterede relation atomisk. |
| Fravalg | nøgle athleteId/targetIdentity; hele fravalget atomisk. |
| Ophav | own/inherited med eksplicit sourceId/sourceChoice/context; aktive arveværdier afstemmes, kildevalg bevares. |

Atomiske lister kræver valg ved forskellige samtidige ændringer i samme liste. Motoren fletter ikke listepositioner. Forskellige omgange og uafhængige vurderinger kan fortsat flettes. Scenarietilføjelser bevares ved den nærmeste bevarede forgænger; modstridende ændring af eksisterende scenariers rækkefølge kræver valg. Sletning mod redigering er et valg om hele den berørte identitet.

## Udvidelseskontrakt

1. Beskriv fælles data, stabile identiteter, listeorden, afhængigheder, afledte værdier og dansk præsentation.
2. Tilføj feltet i schema og en eksplicit klassifikation med betydning i politikken, også inde i eksisterende atomiske grupper.
3. Vurder samtidige kommandoer fra samme basis. Test begge retninger, ens ændringer, uafhængige ændringer og blandede konfliktvalg. Kandidaten skal valideres samlet uden skjult datafjernelse.
4. Kør `npm.cmd run check`, `npm.cmd run test:domain`, `npm.cmd run test:drive`, `npm.cmd run build` og `npm.cmd run test:e2e` efter ændringens omfang. `npm.cmd run verify:merge-policy` er den målrettede strukturelle kontrol, som også indgår i check.

**Nyt datafelt:** En ekstra gymnastoplysning får en selvstændig feltpolitik og en dansk betegnelse. Test samtidig ændring af oplysningen og en vurdering samt to forskellige ændringer af samme oplysning. En ny reference kræver også sletning/mod-reference-tests.

**Ændret semantik:** Ændres valg af arvekilde uden schemaændring, skal regler og tests stadig vurderes. Test kildeændring samtidig med note, eget vurderingsvalg og fravalg. Strukturel dækning vil stadig være grøn og er ikke tilstrækkelig evidens.

**Ren visning:** Ændring af lokal navigation eller tekststørrelse begrundes som uden indflydelse på fælles data og motor. Ingen ny flettepolitik kræves.

Eksempel på samtidige kommandoer: `renameTeam(B, hold, navn)` og `updateAssessment(B, registrering, vurdering)` skal begge overleve. To `updateAssessment` på samme registrering med forskellig sikkerhed skal kræve ét valg med sikkerhed/dato/ophav samlet. Disse eksempler dækkes i `tests/domain/workspace-merge.test.ts`.

## Sessionens levetid og gemning

`WorkspaceSession` ejer separat basis, levende kladde, afsendt pending-snapshot og sammenligningssnapshot. Gennemgangen har tilstandene loading, ready, applying, stale og error. Fil-/sessionsgeneration, lokale ændringer, forbindelsesgeneration/status og regelkontekstens fingerprint indgår i bindingen. Annullering, clear og filskift frigiver sammenligningssnapshot og ugyldiggør forsinkede svar. Ingen af disse data serialiseres i arbejdsrumsfilen eller lagres vedvarende.

En afvist betinget upload har kendt udfald. Et mistet svar beholder operationens id, payloadhash og afsendte snapshot. Genforsøg og gennemgang læser filen, før en ny upload kan ske. Genkendes operationen i recentOperations, bruges det bekræftede eget snapshot som sammenligningsbasis, også hvis andre siden har gemt. Det giver aldrig den gamle levende kladde en ekstern revisionsbasis uden fletning. Hvis en nyere fil ikke kan afklare udfaldet, blokeres gennemgangen til eksport/bevidst genindlæsning; ingen ny upload opfindes.

Anvendelse genkontrollerer filbasis og skriveadgang, genberegner den gyldige kandidat og sætter R som loaded/basis. Kandidaten får R's gemmemetadata. Pending-operationer ryddes, og næste særskilte gemning får et frisk operations-id. `DriveClient.upload` bevarer den oprindelige ETag i `If-Match`; et kapløb efter kontrollen kan derfor stadig ikke overskrive en nyere fil. Eksport, migration og afbrydelse dækkes fortsat af Drive-regressionstests.
