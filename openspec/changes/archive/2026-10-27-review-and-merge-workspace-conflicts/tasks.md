# Tasks

## 1. Fælles kontrakt og permanent vedligeholdelseskrav

- [x] 1.1 Definér den fælles domænekontrakt for snapshots, ændringer, konfliktgrupper, valg, kontekst og blokeret/gyldigt resultat; verificér med typekontrol og kontrakttests, at uafgjorte resultater ikke kan anvendes som gyldige kandidater.
- [x] 1.2 Definér eksplicit politik for alle format 3-modeller og felter, herunder indlejrede unioner, atomiske grupper, tekniske metadata og ordnede samlinger; verificér med en gennemgået dækningsoversigt og positive strukturelle tests.
- [x] 1.3 Tilføj automatisk schema-/politikdækning til projektets normale kontroller; verificér med negative tests, at et udeladt topniveaufelt, indlejret felt, atomisk gruppemedlem og unionvariant hver giver fejl uden at ændre produktionsschemaet som testgreb.
- [x] 1.4 Opdatér `AGENTS.md` med brugerens permanente acceptkrav og skriv en vedligeholdelsesvejledning med eksempler på nyt datafelt, ændret semantik og ren visningsfunktion; verificér, at vejledningen beskriver samme udvidelseskontrakt og de faktiske kontrolkommandoer.

## 2. Sammenligning og domænebevidst fletning

- [x] 2.1 Implementér ren trevejssammenligning på stabile identiteter og eksplicitte samlingsnøgler; verificér uændret/ensidig/ens/dobbeltsidig ændring, tilføjelse og fjernelse samt ingen mutation af input og deterministisk output i domænetests.
- [x] 2.2 Implementér felt- og gruppepolitikker for hold, gymnaster, spring og vurderinger; verificér uafhængige felter, sikkerhed/dato/ophav som helhed, ændret udførelse mod vurdering og ens semantisk ændring med forskellige tidsstempler.
- [x] 2.3 Implementér politik for scenarier, scenarierækkefølge, omgange, deltager- og reservelister; verificér uafhængige omgange, ensidige tilføjelser, sletning mod redigering, modstridende rækkefølger og flytning mellem deltager og reserve.
- [x] 2.4 Implementér afhængighedsgrupper på tværs af samlinger; verificér navnesammenstød, samtidige identiske spring/registreringer med forskellige id'er, sletning mod reference og arkivering/flytning mod planændring samt bevarelse af uafhængige ændringer udenfor gruppen.
- [x] 2.5 Implementér afstemning af arv og regelbinding via en stabil injiceret kontekst og samlet validering; verificér kildeændring mod note, kildeændring mod eget vurderingsvalg, fravalg, forbindelsesbekræftelse og regelskift med følgevirkninger før anvendelse.
- [x] 2.6 Implementér valg pr. konflikt og genberegning af kandidaten; verificér blandede valg, ændrede valg, afvisning af manglende/fremmede valg og ugyldige kombinationer samt afvisning af ukendt format, anden identitet og udækket data uden tab.
- [x] 2.7 Dokumentér motorens kontrakt, atomiske listebegrænsninger og udvidelseseksempel i vedligeholdelsesvejledningen; verificér beskrivelserne mod domænetests og eksempler med to samtidige kommandoer fra samme basis.

## 3. Drive-session, revisionsbasis og fejlhåndtering

- [x] 3.1 Tilføj separat sammenligningssnapshot og levetid til sessionen samt ikke-destruktiv hentning af nyeste fil; verificér i sessionstests, at åbning, annullering og læsefejl hverken erstatter kladden/basis eller uploader data.
- [x] 3.2 Afstem tidligere uafklarede gemmeoperationer før fletning og bevar den bekræftede egne snapshot som basis, når en ekstern gemning følger efter; verificér mistet svar med og uden senere ekstern gemning samt fortsatte lokale ændringer, uden falsk konflikt eller dobbeltupload.
- [x] 3.3 Bind gennemgang og valg til basis, kladde, revisionsmetadata og sessions-/forbindelses-/regelkontekst; verificér lokale ændringer under hentning, fil-/kontoskift, forsinkede svar, adgangsudløb og ændret regelkontekst med bevaret arbejde.
- [x] 3.4 Implementér genkontrol før anvendelse og overtagelse af R som basis med en valideret lokal kandidat; verificér nyere ekstern fil, fjernet skriveadgang, uændret kandidat, frisk operation ved senere gemning og kapløbet mellem kontrol og betinget upload.
- [x] 3.5 Dokumentér sessionstilstande, ukendt uploadresultat og genforsøg; verificér med eksisterende og nye Drive-tests, at eksport, migration og afbrydelse fortsat bevarer kladden, og at den atomiske uploadbetingelse ikke er svækket.

## 4. Dansk ændrings- og konfliktvisning

- [x] 4.1 Integrér Gennemgå ændringer og skeln Nyere fil fra konstaterede konflikter; verificér browserforløb efter både baggrundskontrol og afvist gemning, inklusive forenelige ændringer uden konfliktvalg.
- [x] 4.2 Byg den fælles gennemgang med oversigt, før/min/filens udgave, kontekst, tilføjet/ændret/fjernet og følgevirkninger; verificér med syntetiske data, identiske navne, fjernede scenarier, lukkede planer og ændringer på andre hold.
- [x] 4.3 Tilføj valg og ændring af valg pr. konfliktgruppe, forklaring af gruppering, filtrering og adgang til uafgjorte konflikter; verificér blandede valg, bevarede valg ved filtrering og blokeret anvendelse før alle nødvendige valg er gyldige.
- [x] 4.4 Integrér formularbeskyttelse, Annuller, anvendelse til kladde og separat Gem på Drive; verificér Opdater/Kassér/Bliv, ingen forældet formularskrivning efter fletning, nul uploads under gennemgang/anvendelse og gem/genåbn af resultatet.
- [x] 4.5 Verificér tastatur, hjælpemiddelbetegnelser, fokus, 200 % zoom og reduceret bevægelse med relevante browserchecks; gennemgå og dokumentér visningen ved 390, 768 og 1440 pixels med lange navne, mange ændringer samt indlæsnings-, fejl-, forældet- og læsetilstande.
- [x] 4.6 Skriv en kort dansk brugervejledning med sammenligningens basis, valg, afhængige grupper, forældelse, eksport og særskilt gemning; verificér, at navne og trin svarer til den færdige brugerflade.

## 5. Samlet verifikation og lokal brugertest

- [x] 5.1 Kør relevante samlede kontroller: `npm.cmd run check`, `npm.cmd run test:domain`, `npm.cmd run test:drive`, `npm.cmd run build` og `npm.cmd run test:e2e`; dokumentér faktiske resultater og ret fejl, før opgaven meldes klar til lokal test.
- [x] 5.2 Mål beregning og betjening på et syntetisk stort arbejdsrum med flere hold, scenarier og mange ændringer; dokumentér datastørrelse, måling og vurdering af respons, og verificér at gennemgangen kan afsluttes og snapshots frigives uden at ændre filen.
- [x] 5.3 Start `npm.cmd run preview:local` på `http://127.0.0.1:5173/teamgym-team-manager/` med `dist-local/`, kontrollér at appen åbner, og giv brugeren konkrete testtrin for uafhængige ændringer, konfliktvalg og forældet gennemgang; lad serveren køre uden yderligere ændringer/genbygning under brugerens test.
- [x] 5.4 Registrér brugerens lokale testresultat og udtrykkelige klarsignal, før commit/push/publicering; ved rettelser bedes kladden gemt/eksporteret før genindlæsning, og en ny lokal testudgave verificeres. Markér ikke denne opgave færdig uden faktisk tilbagemelding; udestående T01/to-konto-test angives fortsat sandfærdigt.
