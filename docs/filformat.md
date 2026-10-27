# Arbejdsrumsformat 3

Nye arbejdsrumsfiler bruger `format: "teamgym-team-manager"` og `schemaVersion: 3`. [Format 3-eksemplet](../examples/arbejdsrum-v3.json) indeholder kun syntetiske data. [Format 1](../examples/arbejdsrum-v1.json) og [format 2](../examples/arbejdsrum-v2.json) bevares som migrationsfixtures. Alle tre formater har selvstændige strikte læsere; ukendte felter fjernes ikke stiltiende.

## Identiteter og samlinger

| Samling | Betydning |
| --- | --- |
| `teams` | Navn, arkivering og selvstændig præcis regelbinding |
| `athletes` | Navn, valgfri navneadskillelse, ét `teamId` eller `null`, arkivering og eksplicit valgfri mixkategori |
| `skills` | Præcis udførelse af en ordnet baneserie, ét komplet trampetspring eller et individuelt rytmemoment med variant |
| `athleteSkills` | Én registrering pr. gymnast og præcis færdighed, vurdering/dato/note og eventuel konkret forbindelsesbekræftelse |
| `plans` | Én plan pr. hold, regelbindingens fingerprint og ordnede scenarier i hver springdisciplin; hvert scenarie har id, navn og tre omgange med `entries` og `reserves` |
| `recentOperations` | Højst 30 gemmeoperationer med id, hash, revision og tid; bruges af Drive-adapteren |
| `inheritanceRelations` | Accepterede forbindelser med kilde-/målregistrering, præcise udførelsesidentiteter, katalog-id/version og relations-id |
| `inheritanceExclusions` | Personlige fravalg med gymnast-id og præcis målidentitet, også uden en oprettet registrering |

Workspace-, hold-, gymnast-, færdigheds-, registrerings-, plan-, scenarie-, omgangs- og plads-id'er er globalt entydige i filen. Navne og officielle koder er aldrig identiteter. Scenarienavne trimmes og er 1–200 tegn og entydige uden forskel på store/små bogstaver pr. hold og disciplin. Hver disciplin har mindst ét scenarie. Arrayrækkefølgen angiver scenarie-, element-, omgangs-, gymnast- og reserveorden; holdomgang er altid første omgang. Et opslag bruger præcis reglements-id og pakkeversion; filvalidering kræver ikke, at pakken er installeret, og omskriver ikke ukendte bindinger.

Et element bevarer familie, retning, rotation i kvarte omgange, kropspositioner, skruer i halve omgange, relevant skruefordeling, redskab, afsæt, landing og strukturerede varianter. Kode og point er regelkoblinger, ikke frit redigerbare feltværdier. En serie er en ordnet liste med beskrevet overgang mellem hvert element. En trænerbekræftelse er knyttet til den konkrete udførelse; den kan ikke godkende forbudte elementer eller afklare en tvivlsom regelværdi.

## Lovlige kladder og ugyldige filer

Tomme omgange, færre deltagere og et `athleteSkillId: null` er kladder, som kan gemmes. En arkiveret/flyttet gymnast eller arkiveret færdighed bevarer sin planreference med diagnostik. Arkivering sletter ingen data. En ændret regelbinding uden tilsvarende planfingerprint kræver gennemgang.

Ukendte referencer, dublerede id'er, samme gymnast to gange samlet blandt udførende og reserver i én omgang, en anden gymnasts registrering, forkert disciplin, forkert antal omgange eller ukendte felter afvises. En sådan fil omfortolkes aldrig som tom. Den generelle filmodel kan bevare større/ugyldige importerede besætninger til diagnose; redigeringskommandoen får deltagergrænser fra holdets regelpakke og afviser for mange deltagere samt ekstra gymnaster efter de tællende.

## Stabilitet

`stability` er et heltal fra 1 til 5 eller `null`. En registrering uden vurdering har `assessedAt: null`. En vurdering har en gyldig kalenderdato som `2026-10-25`; `updatedAt` er et separat ISO-tidspunkt. Noten ændrer hverken identitet eller officielle point. Der er intet konkurrerende indlærings-/konkurrenceklar-felt.

`reviewRequiredFor` bevarer konkrete regelbindinger, som kræver revurdering efter ændrede udførelseskrav. Vurderingen slettes ikke, men tæller ikke som automatisk godkendt under den nye binding. En eksplicit revurdering rydder kun den valgte bindings markering.

- Ingen `athleteSkills`-post: færdigheden er ikke registreret.
- Post med `stability: null`: registreret, men ikke vurderet.
- Post med `stability: 1`: vurderet på laveste reelle trin.

Aggregater viser gennemsnit blandt kendte vurderinger, minimum, antal 1–2, vurderet antal og udfyldte/krævede springpladser. Manglende input giver ufuldstændig status. `5,5,5,5,5,1` giver 4,3 og minimum 1; `5,5,5,5,5,null` giver 5,0 blandt fem vurderede og ufuldstændig 5/6. Ekstra gymnaster har separat aggregat. Tomt input giver `null` for gennemsnit/minimum, aldrig nul eller fuld dækning. Ingen værdi er en sandsynlighed.

## Serialisering og migration

Serialisering validerer hele filen og sorterer objektnøgler deterministisk; betydende arrays omarrangeres ikke. Payload til gemmehash udelader rodens `revision`, `updatedAt` og `recentOperations`, så gemmefelterne ikke indgår i deres egen hash. En lokal redigering ændrer ikke den autoritative Drive-revision.

Nyere skemaer afvises med `newer-schema`. Format 1 og 2 kræver eksplicit migration: dialogen **Opgradér arbejdsrummet** tilbyder eksport af de faktisk læste originalbytes, **Annuller** og **Opgradér lokal kladde**. Dialogen viser den faktisk indlæste kildeversion og målformat 3. Migration validerer først originalens strikte skema. Format 1 får egen vurderingsoprindelse og tomme relations-/fravalgslister; format 2 bevarer arveophav, relationer og fravalg. Hver disciplins tre omgange placeres i ét nyt scenarie med navnet Plan A og tomme reservelister. Kun de nye scenarier får nye id’er. Ingen gamle ens vurderinger får gættet arvekilde. Regelbinding, id'er, navne, noter, datoer, arkivering, bekræftelser, planreferencer og revisionshistorik bevares.

Drive-basis beholder hash af originalbytes, ETag, filversion og arbejdsrumsrevision. Den migrerede kladde er ugemt, også uden øvrige ændringer. Først **Gem på Drive** uploader format 3 med normal rettighedskontrol og `If-Match` på originalens basis. Konflikt eller et uklart uploadsvar bevarer kladden og afstemmes gennem den eksisterende operationshistorik. En læser kan migrere lokalt og eksportere, men ikke gemme over originalen. Annullering og afviste filer bevarer et allerede åbent arbejdsrum.

Ældre apps skal afvise format 3. Tilbagerulning af appkode nedgraderer aldrig filen, og scenarier, reserver eller arvefelter må ikke fjernes for at gøre den læsbar i en gammel app. Google-forbindelsens særskilte lagerformat ændres ikke.

## Arvefelter og invariants

Hver registrering har `assessmentOrigin: { "kind": "own" }` eller `{ "kind": "inherited", "sourceId": null, "sourceChoice": null }`. En aktiv arvekilde erstatter `sourceId: null` med registrerings-id'et. Et bevidst kildevalg ved ukendt D gemmes som `sourceChoice: { "sourceId": "...", "context": "..." }`.

`stability` og `assessedAt` er effektive værdier. Ved aktiv arv skal de svare til kilden; uden kilde skal begge være null. Noter tilhører barnet og arves ikke. En egen null-vurdering er et aktivt valg, som ikke overskrives. Kilde og mål skal tilhøre samme gymnast og disciplin. Ukendte referencer, selvreferencer, dubletter, cykler og forfalskede udførelsesidentiteter afvises. Et kildevalg skal pege på en accepteret relation. Et fravalgt mål kan ikke samtidig have aktiv arv.

Relationskataloget `spring-foundation` ligger uden for de officielle regler. Version `2` tilføjer samme baneserie uden en kendt forlæns indgangssalto, når resten har en selvstændig indgang, samt dens specificerede fundament. Version `1` kontrolleres fortsat efter sin oprindelige matrix. Et bevidst nyt valg kan tilføje version `2`-relationer, mens eksisterende accepterede version `1`-relationer bevares uden ækvivalente dubletter. En ukendt katalogversion bevares til gennemgang og anvendes ikke automatisk af den aktuelle arveafstemning. En ændret udførelse ugyldiggør accepterede relationer til den gamle identitet. Genåbning og katalogopdatering opretter aldrig nye relationer eller børn. Arbejdsrummets skemaversion er `3`.

## Scenarier og reserver

Scenariet har `{ id, name, rounds }`. En omgang har `{ id, entries, reserves }`; `entries` bevarer rolle (`counting` eller `extra`), mens reservepladsen kun har `{ id, athleteId, athleteSkillId }`. Prioritet følger reservelistens rækkefølge. En reserve uden spring bruger `athleteSkillId: null`. Reserver optager ingen udførende plads og indgår ikke i D, C eller tællende sikkerhed før en bekræftet indsættelse.

Hele samlingen valideres og gemmes samlet, også lukkede scenarier. Det viste scenarie er sessionens navigation, indekseret efter arbejdsrum, hold og disciplin; det gemmes ikke i filen. Genindlæsning vælger første scenarie. Den eksisterende fælles gymnast- og færdighedsregistrering bruges i alle scenarier.
