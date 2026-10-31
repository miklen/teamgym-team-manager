# Vedligeholdelse af sammenligning og fletning

`packages/domain/src/workspace-merge.ts` sammenligner basis B, lokal L og fil R uden mutation, netværk, ur eller tilfældige id'er. Alle tre skal være gyldige format 5-filer med samme workspaceId. En basis eller fil i format 3 eller 4 migreres først deterministisk uden nye id'er; format 1 og 2 flettes ikke. Konteksten injicerer en stabil fingerprint og ren afstemning med de aktuelle regelpakker. Uafgjorte/ugyldige resultater har ingen `candidate`; kun `status: 'valid'` kan anvendes. Konflikt-id'er er bundet til input og kontekst. Ingen valg er forhåndsudfyldt. Genberegn ved ændrede valg.

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
| Omgang | id; deltagere og reserver hver en atomisk ordnet liste inklusive medlemmernes id, gymnast, spring og rolle. Deltagerens planlagte modtagning (grad, element og springreference) er én atomisk værdi i deltagerlisten. Flytning mellem lister kan samle valget. |
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

### Forlæns springfundament, katalog 3

Version 3 udvider de accepterbare relationer for Barani, Rudy, Randy, 3½ skrue og forlæns dobbeltsaltoer. Version 1 og 2 beholder deres præcise matrix og relations-id'er. Genåbning afstemmer kun allerede accepterede relationer; nye relationer og registreringer oprettes ved et bevidst valg med gennemgang af fundamentet. En gyldig ældre relation genbruges frem for en dublet.

Der tilføjes ingen gemte felter. Fælles springidentitet bevarer retning, kropspositionsforløb, skruefordeling, redskab, afsæt/landing og baneseriens indgang/overgange. Registreringer beholder id og note; arverelationer følger fortsat den atomiske politik med nøgle sourceId/targetId/catalogId/relationId. Katalogversion er del af den atomiske relation. Kun afslutningen i en baneserie ændres; rækkefølgen af eksisterende elementer og planpladser ændres ikke. Nye fundamenter vises i katalogets deterministiske rækkefølge og kun én gang pr. identitet. Alle relationer peger fra den direkte valgte kilde; automatisk oprettede mellemtrin bliver ikke nye kilder.

Sikkerhed, dato og ophav er fortsat én vurderingsgruppe. Aktive arveværdier afstemmes i den fælles motor; kendte kilder rangeres fortsat efter laveste D og derefter sikkerhed. Egne vurderinger, også null, samt fravalg har forrang. D og gyldighed genberegnes efter eksisterende regler, og noter arves aldrig. Et nyt 180°-barn uden kendt skruefordeling markeres til afklaring; ingen fordeling opfindes. Præsentationen bruger de eksisterende danske navne og ophavsmarkeringer. Sammenligningskontekstens fingerprint omfatter nu også fundamentkataloget.

`tests/domain/forward-foundation.test.ts` dækker kildeændring samtidig med note, egen vurdering og fravalg i begge fletteretninger med rigtig katalogkontekst, samt filrundtur, versionsbevaring og genvalg. Det supplerer den eksisterende strukturelle politikdækning.

### Reviderede sikkerhedsbeskrivelser

Den aftalte skala går fra enkelte vellykkede forsøg til gennemprøvet under konkurrencepres. Kun de fælles beskrivelser i `STABILITY_ANCHORS` ændres; historiske arkivspecifikationer bevares. Gemte 1–5-værdier og null, dato, note og ophav omnummereres eller omvurderes ikke. Træneren kan revurdere gamle vurderinger bevidst. Der oprettes ingen ny status, versionsmarkør eller lokal fletteregel i formularerne.

Den eksplicitte politik er fortsat én atomisk gruppe for sikkerhed/dato/ophav og en selvstændig note. Forskellige samtidige vurderinger kræver valg af hele gruppen; en uafhængig note kan flettes med vurderingen. Id'er, udførelsesidentiteter, rækkefølge, arverelationer og fravalg ændres ikke af beskrivelserne. Arv følger fortsat det gemte tal; D, rangering, grænsen 1–2 for lave vurderinger og øvrige afledte aggregater bevarer deres beregning. Præsentationen får de fem fulde danske beskrivelser i den eksisterende fælles skalaforklaring og ved valgt vurdering.

Samtidighedskontrakten verificeres af `tests/domain/workspace-merge.test.ts` (forskellige atomiske vurderinger, uafhængige noter, arvekilde mod note/egen vurdering/fravalg), suppleret af arveprøverne og skalaprøverne. Browserprøver kontrollerer de nye tekster ved valg og redigering samt bevarelse af eksisterende vurderinger og annullering.

Eksempel på samtidige kommandoer: `renameTeam(B, hold, navn)` og `updateAssessment(B, registrering, vurdering)` skal begge overleve. To `updateAssessment` på samme registrering med forskellig sikkerhed skal kræve ét valg med sikkerhed/dato/ophav samlet. Disse eksempler dækkes i `tests/domain/workspace-merge.test.ts`.

### Planlagt modtagning, format 4

**Fælles data:** Hver plads i en bane- eller trampetomgang har `plannedSpot`, som enten er `null` eller `{ grade, skillId, elementIndex }`. Grad er `support`, `assist` eller `heavy`. `elementIndex` bruges kun ved kraftig hjælp på bane og er ellers `null`. Reserver og rytme har ikke feltet. Format 3 migreres deterministisk til format 4 med `plannedSpot: null` på alle pladser uden nye id'er, ur eller tilfældighed. Ældre apps afviser format 4 som nyere.

**Identiteter og rækkefølge:** Modtagningen har ingen egen id. Den tilhører pladsens id og peger på registreringens `skillId`. Pladsrækkefølge, rolle og omgangens id ændres ikke af en modtagning. Ændring af rækkefølge eller rolle samt `moveRoundFirst` og `duplicateScenario` bevarer den.

**Politik:** `merge-policy.ts` klassificerer feltet som atomisk værdi med betegnelsen "Planlagt modtagning". Fordi deltagerlisten er atomisk, kræver forskellige samtidige ændringer i samme omgang, herunder modtagning mod rækkefølgeskift, ét valg for hele listen i begge fletteretninger. Ændringer i forskellige omgange eller scenarier flettes. Ens ændringer giver ingen konflikt. Konfliktvisningen viser modtagningen på dansk, f.eks. "Kraftig hjælp · <element>" eller "Ingen".

**Afhængigheder og afledte værdier:** `setRoundEntries` nulstiller modtagningen, når pladsens gymnast eller registrering skifter. Det dækker manuelle skift, reserveindsættelse og potentialeforslag. `replaceAthleteSkill` nulstiller modtagninger på registreringen i alle planer, når udførelsen ændres. Ved samtidig modtagning og udskiftet spring flettes begge ændringer uden konflikt. Den gemte `skillId` matcher så ikke længere registreringen, og `plannedSpotState` giver afledt status `reset`. Reglerne bruger kun `activePlannedSpot`, så en nulstillet modtagning giver hverken halveret D eller planlagt E-fradrag. Transitive referencer i sammenligningen slås op i basis først, så fletteretningen ikke afgør grupperingen. Omgangens D med modtagning, D uden modtagning, planlagte E-fradrag, Maks. mulig karakter og modtagningens pris er afledte værdier, som genberegnes efter fletning og aldrig gemmes. Potentialesøgningen bruger D uden modtagning.

**Præsentation:** Pladsen viser grad, eventuelt element og justeret D med tekst. En nulstillet modtagning vises som afledt status med handlinger til at fjerne den eller planlægge igen og præsenteres ikke som en trænerbeslutning. Formularer bruger `setPlannedSpot`/`clearPlannedSpot` og indfører ingen egne regler for nulstilling eller fletning.

**Tests:** `tests/domain/workspace-merge.test.ts` (planlagt modtagning i trevejsfletning: samme omgang, forskellige omgange, to forskellige modtagninger på samme plads og ens ændringer i begge retninger samt udskiftet spring med afledt nulstilling), `tests/domain/planned-spotting.test.ts` (validering, migration og kommandoer), `tests/domain/planned-spotting-rules.test.ts` (D, E-loft og Maks. mulig karakter med faste facit) og `tests/drive/workspace-session.test.ts` (migration fra format 3, gennemgang mod en fil i format 3 og afvisning af format 5).

### Ambitioner, format 5

**Fælles data:** En plads i en bane- eller trampetomgang har nu `athleteId: Id | null` og `plannedSkillId: Id | null`. Præcis ét af dem er sat: en besat plads har gymnast og `plannedSkillId: null`; en ambition har `athleteId: null`, `athleteSkillId: null`, `plannedSpot: null` og et `plannedSkillId`, der peger på en kendt definition i pladsens disciplin. Reserver har altid gymnast. Format 4 migreres deterministisk til format 5 med `plannedSkillId: null` på alle pladser uden nye id'er, ur eller tilfældighed; format 1–3 går gennem samme kæde. Ældre apps afviser format 5 som nyere.

**Identiteter og rækkefølge:** Ambitionen er en almindelig plads med eget id, rolle og position. `addAmbition` genbruger en aktiv definition med samme springidentitet (regelpakkens identitet injiceres som `CommandEnvironment.springIdentity`) eller opretter definitionen i samme ændring. `fillAmbition` bevarer plads-id, rolle og position og sætter `plannedSkillId: null`. `setRoundEntries` kan ikke omdanne en plads mellem ambition og besat; det kræver de navngivne kommandoer. `duplicateScenario` og `moveRoundFirst` bevarer ambitioner. To sider, der definerer samme nye spring med forskellige id'er, samles af den eksisterende unikhedsregel for præcise spring.

**Politik:** `merge-policy.ts` klassificerer `plannedSkillId` som værdi med betegnelsen "Planlagt spring" inden for den atomiske deltagerliste. Samme ambition besat med forskellige gymnaster, spring skiftet mens pladsen besættes, og besættelse mod reserve med samme gymnast giver ét valg for hele omgangen i begge fletteretninger; en blandet plads kan ikke opstå. Arkiveret definition mod en ny besættelse følger reglen om sletning mod ny reference og kræver ét valg; vælges arkiveringen, forbliver ambitionen med diagnosen `skill-archived`.

**Afhængigheder og afledte værdier:** `planReferences()` medtager `plannedSkillId`, så kartotekets referencer og diagnoser kender ambitioner. *Kan nu*, match, kandidater, mixstatus, D, C, sikkerhed og potentialer er afledte og gemmes aldrig. Reglerne giver diagnosen `athlete-missing`; mix vurderes kun på besatte pladser (opnåelig er ufuldstændig, brudt er ugyldig); den uafklarede gentagelsesregel giver begge udfald som alternativer. Potentialesøgningen udskifter aldrig en omgang med ambitioner og forklarer det med `AMBITION-ROUNDS`. `insertReserve` og `setPlannedSpot` afviser ambitioner.

**Præsentation:** Ambitionspladsen har samme geometri som en besat plads med stiplet kontur og chips for Mangler gymnast og *N kan nu*. Besættelse sker i én formular med fastlåst spring og grupperne Kan springet og Kan ikke endnu. Konfliktvisningen viser "Ambition · <springnavn> · mangler gymnast". Formularer bruger `addAmbition`, `changeAmbitionSkill` og `fillAmbition` og indfører ingen egne flette- eller matchregler.

**Tests:** `tests/domain/workspace-merge.test.ts` (ambitioner i trevejsfletning i begge retninger), `tests/domain/routine-ambitions.test.ts` (validering, migration og kommandoer), `tests/domain/routine-ambitions-rules.test.ts` (D, holdomgang, mix, gentagelse, sikkerhed, *kan nu* og forslag med faste facit) og `tests/drive/workspace-session.test.ts` (migration fra format 4, gennemgang mod en fil i format 4 og afvisning af format 6).

## Sessionens levetid og gemning

### DK-regelpakke 1.1.0

**Afklaret gentagelsesfradrag 31. oktober 2026:** Træneren har afklaret Q03 som holdoptælling pr. præcis serie- eller springidentitet. `dk@1.1.0` beregner nu 0,20 × (summen af forekomster minus flest forekomster i én omgang) for hver identitet. Ingen gymnastidentitet indgår i gentagelsesoptællingen. Den lokale 1.1.0 blev ændret før nogen brug af regelpakkerne; 1.0.0 vises ikke længere som installeret pakke i appen. Historiske syntetiske versionsprøver bevarer den gamle pakke som testgrundlag, og de fastlåste kilder ændres ikke.

Ændringen tilføjer ingen gemte felter. Hold, gymnast, spring, registrering, scenarie, omgang og plads bevarer deres id'er og rækkefølge; springets præcise identitet og regelbindingens atomiske flettepolitik ændres ikke. Afledt C, guidebeløb, potentialer og deres præsentation genberegnes fra den valgte samlede plan efter fletning. Forskellige samtidige ændringer i to omgange kan flettes og genberegnes; forskellige ændringer i samme ordnede omgangsliste kræver fortsat konfliktvalg. `tests/domain/workspace-merge.test.ts` dækker genberegning efter to uafhængige omgangsændringer i begge fletteretninger; `tests/domain/repetition-clarification.test.ts` dækker holdoptælling og skiftende gymnaster med fast facit.

**Afklaret rækkefølgefradrag 31. oktober 2026:** Træneren har afklaret Q06. `dk@1.1.0` giver 0,10 pr. tællende gymnast, der står efter et tidligere tællende spring med højere rotationskategori eller samme kategori og højere D. Ekstra indgår ikke; blandet serie bruger højeste kategori, og serie uden salto laveste. Ændringen tilføjer ingen gemte felter og ændrer ikke id'er, pladsrækkefølge eller flettepolitik. Kategori, fejlgymnaster, C-total, sorteringsforslag og potentialer er afledte værdier, der genberegnes fra den valgte samlede plan efter fletning. Samtidige ændringer af samme omgangs pladser følger fortsat den atomiske listepolitik.

**Afklaret Pegasus-omgang 31. oktober 2026:** Træneren har afklaret Q04. I `dk@1.1.0` er en trampetomgang hel med eller hel uden Pegasus, også for ekstra gymnaster. En blandet omgang giver en afledt diagnose og ugyldig omgangsstatus; C-REDSKAB beregnes ikke. Ændringen tilføjer ingen gemte felter, blokerer ingen gemning og indfører ingen formularregel. To samtidige ændringer kan derfor flettes til en blandet omgang; den vises bagefter som ugyldig og rettes af træneren. Pladser følger fortsat den atomiske listepolitik, og diagnose, C-total og potentialer genberegnes efter fletning.

**Afklaret H>1 31. oktober 2026:** En dommer har via træneren afklaret Q02: reglementet går forud for appendiks. I `dk@1.1.0` er overslag-salto hoftebøjet 180° derfor 1,10 efter formlen; A4's trykte 1,20 bevares som kildeværdi i kataloget. Ændringen tilføjer ingen gemte felter og ændrer ikke springidentitet, id'er, pladsrækkefølge, regelbinding eller flettepolitik. D, omgangssum, rækkefølgefradrag, sorteringsforslag og potentialer er afledte værdier, som genberegnes fra den valgte samlede plan efter fletning. Ingen gemte værdier migreres; `dk@1.0.0` bevarer Q02. `tests/domain/vault-value-clarification.test.ts` dækker begge pakker og en planberegning.

Rettelserne og den fælles datakontrakt er beskrevet i [rettelser og advarsler](reglement/rettelser-og-advarsler-2026-10-30.md). Pakkevalg ændrer den eksisterende atomiske regelbinding og planens fingerprint; ændrede rytmekrav giver versionsbundet revurdering. Springets gemte identitet, gymnast- og registrerings-id'er samt planorden bevares. Regelidentitet, D, C og rytmefællesnævnere genberegnes efter den valgte pakke. Samtidig pakkevalg og ændret vurdering kræver konfliktvalg i begge fletteretninger; visningsadvarsler gemmes ikke.

**Afklaret elementtillæg før push af 1.1.0:** Træneren har valgt reglementets eksempelspor som gældende: 0,10 i positivt tillæg for hver forskellig C-elementidentitet ud over seriens første, gennemsnit over tre omgange. `dk@1.1.0` fik dermed justeret betydning uden ændring af gemt schema eller regelbindingsstreng. En allerede lokalt oprettet 1.1.0-testfil genberegnes ved åbning; ingen gemte C-tal, guideoptællinger eller potentialer migreres. `dk@1.0.0` bevarer de to åbne Q01-spor. Fordi den gamle og nye lokale 1.1.0 har samme binding, kan flettefingeraftrykket ikke skelne dem; den gamle lokale preview skal derfor ikke bruges til ny gemning efter denne rettelse.

Regelbinding og planfingerprint er fortsat én afhængig, atomisk beslutning. Samtidigt skift fra 1.0.0 til den afklarede 1.1.0 og redigering af en omgang kræver eksplicit valg af et sammenhængende grundlag i begge fletteretninger; en blanding af ny binding og gammel/ændret opstilling vælges ikke stiltiende. Uafhængige ændringer bevares efter de eksisterende felt- og listepolitikker. Afledt C genberegnes fra den valgte binding og de valgte planreferencer efter fletning. `tests/domain/workspace-merge.test.ts` dækker samtidig pakkevalg mod vurdering og omgangsændring, valgene i begge fletteretninger og versionsbundet genberegning af elementtillægget. Ingen formular indfører egen fletteregel.


`WorkspaceSession` ejer separat basis, levende kladde, afsendt pending-snapshot og sammenligningssnapshot. Gennemgangen har tilstandene loading, ready, applying, stale og error. Fil-/sessionsgeneration, lokale ændringer, forbindelsesgeneration/status og regelkontekstens fingerprint indgår i bindingen. Annullering, clear og filskift frigiver sammenligningssnapshot og ugyldiggør forsinkede svar. Ingen af disse data serialiseres i arbejdsrumsfilen eller lagres vedvarende.

En afvist betinget upload har kendt udfald. Et mistet svar beholder operationens id, payloadhash og afsendte snapshot. Genforsøg og gennemgang læser filen, før en ny upload kan ske. Genkendes operationen i recentOperations, bruges det bekræftede eget snapshot som sammenligningsbasis, også hvis andre siden har gemt. Det giver aldrig den gamle levende kladde en ekstern revisionsbasis uden fletning. Hvis en nyere fil ikke kan afklare udfaldet, blokeres gennemgangen til eksport/bevidst genindlæsning; ingen ny upload opfindes.

Anvendelse genkontrollerer filbasis og skriveadgang, genberegner den gyldige kandidat og sætter R som loaded/basis. Kandidaten får R's gemmemetadata. Pending-operationer ryddes, og næste særskilte gemning får et frisk operations-id. `DriveClient.upload` bevarer den oprindelige ETag i `If-Match`; et kapløb efter kontrollen kan derfor stadig ikke overskrive en nyere fil. Eksport, migration og afbrydelse dækkes fortsat af Drive-regressionstests.
