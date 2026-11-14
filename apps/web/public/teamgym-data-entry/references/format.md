# Filkontrakt · format 7

Læs [struktur-v7.json](structure-v7.json) for alle obligatoriske felter, datatyper, enumværdier og maksimallængder. JSON-schemaet er genereret fra appens Zod-schema og beskriver ikke alle krydsreferencer; reglerne nedenfor gælder også. Ukendte felter afvises. Kontroller **hele filen**, også scenarier der ikke ændres.

## Rod og gemmemetadata

`format` skal være `teamgym-team-manager`, `schemaVersion` skal være `7`, `workspaceId` er filens stabile interne ID. `revision` er et ikke-negativt heltal; `updatedAt` er et ISO-tidspunkt med tidszone. `recentOperations` har højst 30 app-gemmeoperationer `{id, payloadHash, revision, savedAt}`. En ekstern skrivning øger kun rodens `revision` med én og sætter `updatedAt` til et aktuelt ISO-tidspunkt. Bevar `recentOperations` uændret; opfind hverken app-operation eller payloadhash. Drive-filens ETag/version er særskilte metadata og er ikke rodens revision.

Appens lokale Drive-kopier kan have en særskilt indpakning med `format: "teamgym-local-copy"`, arbejdsrum og kildebasis. Den indpakning er ikke Drive-filens format 7 og må aldrig skrives direkte til Drive. Denne skill arbejder kun med den rå, validerede arbejdsrumsfil på Drive.

## Samlinger og ID'er

| Felt | Betydning |
| --- | --- |
| `teams` | `{id, name, archived, rulesetBinding}`; bindingen har `rulesetId`, `packageVersion`, `ageGroup`, `teamType` |
| `athletes` | `{id, name, discriminator, teamId, archived, mixCategory}`; `teamId` kan være `null` |
| `skills` | Præcise definitioner for `tumbling`, `trampet` og `rhythm`; se registrering |
| `athleteSkills` | Højst én registrering per `(athleteId, skillId)` med vurdering, dato, note og ophav |
| `inheritanceRelations` | Accepterede præcise kilde/mål-relationer; ingen automatisk skabelse |
| `inheritanceExclusions` | Personlige fravalg efter gymnast og målidentitet |
| `plans` | Præcis én plan per hold, med mindst ét scenarie i hver springdisciplin |

`workspaceId` og alle entitets-id'er for hold, gymnaster, definitioner, registreringer, planer, scenarier, omgange og pladser skal være entydige i hele filen. Nye ID'er skal overholde schemaet og må ikke genbruges. Navne, katalogets `referenceId` og officielle koder er ikke arbejdsrums-ID'er. Vælg aldrig en anden fil ved navnelighed.

Arrayorden er betydende: `skills[*].elements`, forbindelsens `transitions`, scenarier, de tre omgange, `entries` og `reserves` må ikke sorteres ved serialisering. Første omgang er holdomgang; flyttes en omgang efter trænerens valg, bevarer den sit ID og indhold. Udførende pladsers gemte `role` følger positionen og skal beregnes igen, når `entries` ændres; se [scenarier og omgange](scenarios.md). Kode, point, D, C, søgestatus, match og *Kan nu* er afledte værdier og gemmes ikke som ekstra felter. Et arkiveret eller flyttet objekt kan stadig være refereret og skal bevares til diagnose.

For en flersalto med 1–5 halve skruer er `twistDistribution` obligatorisk med én ikke-negativ værdi per salto i `bodyPositions`. Summen skal være `twistsHalfTurns`. Fordelingen er en del af udførelsesidentiteten: `[1,0]` og `[0,1]` er to forskellige spring. Fra 6 halve skruer bruges kun totalen; nye definitioner har tom `twistDistribution`. En uklar note må ikke omsættes til en gættet fordeling.

## Version og migration

Skriv kun til en fil, der allerede er format 7. Format 1–6 læses og migreres eksplicit i appen; en agent må ikke lave egen konvertering eller fjerne nye felter for at gøre filen læsbar for en ældre app. En nyere version, en ukendt binding eller en valideringsfejl er stop for direkte skrivning. Kilde- og målversion må ikke gættes.
