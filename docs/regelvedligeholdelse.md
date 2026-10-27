# Tilføjelse og ændring af regelpakker

Alle holdets scenarier i begge springdiscipliner bruger samme regelbinding. Regler vælges pr. hold som reglements-id, præcis pakkeversion, aldersgruppe og holdtype. `RuleRegistry` vælger aldrig nyeste/nærmeste version automatisk. En ukendt binding bevares i filen, mens andre kendte hold fortsat kan bruges.

## Ny række

1. Fastlås officielle kildebytes og udgave med manifest og hashes. En ny REG-/Liga-pakke skal have sit eget regelsæt; DK er ikke automatisk fagligt grundlag for den.
2. Implementér `RulePackage` med eget manifest, profiler, katalogkoblinger, gyldighed, D/C, potentiale og rytmeækvivalens. Domænet beskriver konkret kunnen; officielle koder og point hører til pakken.
3. Registrér pakken eksplicit i appens registry. Kun pakker med `production: true` vises som produktvalg. Ingen kode fra Drive-filen indlæses eller eksekveres.
4. Bevis kontrakten med kilde-/facitkontrol, forskellige hold i samme fil, deltagerkrav, ukendt pakke og gamle pakker uændret. UI og kartotekets skema skal ikke omskrives for en ny række.

Den syntetiske kontrakttest bruger `synthetic-only@2.0.0` med dobbelt D, fire tællende, en anden tillægssats og uden spejlingsækvivalens. Den følger samme registry, filmodel, plananalyse, potentialesnit og rytmematrix som DK. Den er aldrig et produktionsgodkendt REG-/Liga-valg.

## Værdi- eller algoritmeændring

En frigivet `(rulesetId, packageVersion)` er uforanderlig. Registry afviser ændrede data eller nye funktionsreferencer under samme nøgle. Bevar gammel pakke og algoritmemodul; opret ny pakkeversion, beskriv ændringen og angiv algoritmeversioner og kilder. En rettelse i appens fortolkning kan kræve ny pakkeversion, selv om den officielle udgave stadig hedder v1.4.

En værdiændring ændrer pakkens værdikobling og facit, ikke gymnastens færdigheds-id. En algoritmeændring lægges i et nyt afgrænset modul/version. Gamle regressioner køres samtidig med de nye. `packageChangeReport` viser ændrede algoritmeversioner, profiler og rytmefelter; versionspreview beregner særskilt før/efter-D og C for hvert navngivet scenarie, reservevalgenes egne værdier og anvendelighed samt rytmefællesnævnere. Reserver indgår ikke i de udførendes beregningsgrundlag.

Ingen forventningsværdi må genereres fra produktionspakken. Bevar de gamle fixtures; tilføj nye med kilde, fortolkning og separat beregnet facit. Kør `npm run check`, `npm run test:domain`, `npm run test:mutations` og produktionsbyg. En fælles ændring, der utilsigtet påvirker gammel DK-version, skal fanges af de gamle tests.

## Kontrolleret skift på ét hold

`previewVersionChange` beregner ændringen på en kopi. Annullering ændrer intet. Gennemgangen inkluderer også lukkede alternative planer og reserver; disciplin og scenarienavn fremgår. Scenarie-, omgangs- og plads-id’er, navne, rækkefølger og registreringsreferencer bevares. `applyVersionChange` afviser en forældet preview og ændrer kun målholdets binding, planfingerprint og konkrete revurderingsmarkeringer i kladden. Gemning sker efterfølgende gennem normal konfliktbeskyttelse.

Kode-, navn- og værdiændringer uden ændrede udførelseskrav bevarer kunnen og stabilitet. Nye udførelseskrav giver `reviewRequiredFor` på de berørte registreringer, knyttet til den nye binding. Den gamle vurdering bevares, men opfylder ikke automatisk det nye holds stabilitetsfilter. En eksplicit regelrevurdering kan fjerne den konkrete markering; andre holds bindinger og vurderinger ændres ikke.

Filskemaopgradering og regelversionsskift er separate operationer. En nyere ukendt fil afvises, og en rollback må ikke nedskrive ukendte data. En uafklaret regel kan kun afklares i en ny dokumenteret pakkeversion; en note fra en træner er ikke en global regelændring.

Scenarieidentitet er et påkrævet argument til `RulePackage.analyze` og `potentials`. Et ukendt id afvises; pakken må ikke vælge første scenarie stiltiende. `analyzeVersionScenarios` gennemgår samlingen, mens den normale arbejdsflade kun beregner det viste scenarie. Prøverne bruger et syntetisk hold med bane Plan A/Plan B, trampet Plan A/Sikker og reserver; det andet holds binding og planer bevares ved skift.
