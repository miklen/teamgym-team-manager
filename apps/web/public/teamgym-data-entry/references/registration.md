# Opslag, registrering og arv · format 7

## Find den rigtige post

1. Find holdet i `teams` ved trænerens navn og bekræft `id` samt hele `rulesetBinding`. Find gymnasten i `athletes` med både navn, `discriminator`, `teamId` og arkiveringsstatus. Spørg ved navnesammenfald; et navn er ikke et ID.
2. Find først en eksisterende definition i **filens** `skills`. Sammenlign hele den præcise udførelse, ikke kun navn eller officiel kode. For bane er identiteten `discipline + ordnede elements + connection.kind/transitions`; for trampet `discipline + jump`; for rytme `discipline + momentId + variant`. Udelad `id`, `name`, `archived` og godkendelser i sammenligningen. Objektfelternes nøgler sorteres, men arrays bevarer rækkefølge.
3. For en ny definition: slå op i [versionsmærket katalog](catalog-v7.json) under netop holdets `rulesetId` og `packageVersion`. `springCatalog.referenceId` og `rhythmCatalog.id` er katalogidentiteter, **ikke** filens `skills[*].id`. En officiel kode kan tilhøre flere poster; fx deler to rytmeposter `DB804`. Vælg præcis post og udførelsesvariant. `practicalSprings[*].recipeId` er et forslag til en hel springdefinition; kontrollér dens `executionIdentity` og hele `definition` før et nyt arbejdsrums-ID tildeles. En ukendt/forbudt post eller uafklaret variant kræver trænerens afklaring.
4. Find gymnastens eksisterende `athleteSkills` ved både `athleteId` og definitionens `skillId`. Genbrug den, hvis den findes. Opret højst én manglende registrering. Opret ikke automatisk nye fundamentregistreringer, relationer eller fravalg. Genbrug aldrig en anden gymnasts registrerings-ID.

En banedefinition har `elements` (1–30), `connection: {kind, transitions}` med netop ét overgangsord per nabopar og `sharedConnectionApproval: null` eller en faktisk trænergodkendelse med identitet, tidspunkt og note. Trampet har ét `jump`. Hvert element angiver familie, retning, rotation i kvarte omgange, kropspositioner, skruer i halve omgange, eventuel skruefordeling, redskab, afsæt, landing og `variant`. Rytme har `momentId` og en præcis `variant` med valg fra katalogpostens `options`. En personlig `connectionConfirmation` på en registrering kræver særskilt faktisk bekræftelse; opfind den ikke ud fra en note.

Ved en flersalto med 1–5 halve skruer skal træneren angive, hvor mange halve skruer der sker på hver salto. `bodyPositions: ["tuck","tuck"]` og `twistsHalfTurns: 1` kræver enten `twistDistribution: [1,0]` (in) eller `[0,1]` (out); de er forskellige definitioner og registreringer. Spørg, hvis noten blot siger “dobbelt med en halv skrue”. Fra 6 halve skruer bruges totalen uden fordelingsvalg. Appens migration af en ældre fil kan sætte en manglende fordeling til out; det giver ikke agenten lov til at gætte ved ny indtastning.

## Vurdering og note

Ingen post betyder **ikke registreret**. En post med `stability: null`, `assessedAt: null` betyder **registreret, ikke vurderet**. En vurdering er et heltal `1`–`5` med faktisk kalenderdato `YYYY-MM-DD`; `1` er en reel lav vurdering og må ikke erstatte ukendt. Skriv noten i `note` (højst 2000 tegn), og sæt registreringens `updatedAt` til tidspunktet for den faktiske redigering. Bevar `reviewRequiredFor`, medmindre træneren udtrykkeligt har revurderet den konkrete binding. Udled ikke dato, stabilitet eller godkendelse af formuleringer som “kan springet”.

Syntetisk eksempel: Noten “Testgymnast A kan springet; ingen sikkerhedsvurdering endnu” kan føre til én post som nedenfor, hvis `athlete-test-a` og `skill-test-bane` allerede er entydigt fundet i filen. Alle øvrige felter og samlinger bevares.

```json
{
  "id": "registration-test-a-bane",
  "athleteId": "athlete-test-a",
  "skillId": "skill-test-bane",
  "archived": false,
  "stability": null,
  "assessedAt": null,
  "updatedAt": "2026-11-10T12:00:00.000Z",
  "note": "Kan springet; endnu ikke vurderet.",
  "connectionConfirmation": null,
  "reviewRequiredFor": [],
  "assessmentOrigin": { "kind": "own" }
}
```

## Arv er et bevidst valg

`assessmentOrigin: {"kind":"own"}` bevarer egen vurdering, også en bevidst `null`. Aktiv arv bruger `{ "kind":"inherited", "sourceId":"<registrerings-id>", "sourceChoice":null }`; uden kilde er `sourceId: null`, `stability: null` og `assessedAt: null`. `sourceChoice` kan kun pege på en accepteret kilde med en forklarende `context`. Gæt aldrig kilde ud fra ens tal.

En accepteret relation kræver `sourceId`, `targetId` (registrerings-ID'er), `sourceIdentity`, `targetIdentity` (præcise udførelsesidentiteter), `catalogId`, `catalogVersion`, `relationId`. Kilde og mål skal være hos samme gymnast og samme springdisciplin; de kan ikke være samme post eller danne en cyklus. Kataloget `spring-foundation` version `2` er aktuelt; historiske relationer fra version `1` bevares. Ukendte versioner bevares til gennemgang og bruges ikke som grundlag for en ny afledning. En `inheritanceExclusions`-post `{athleteId, targetIdentity}` er et bevidst fravalg og må ikke samtidig have aktiv arv.

Når en kildes egen vurdering ændres, gennemgå alle dens **aktive arvede** børn og videre kæder i kildeførst orden: kopier `stability` og `assessedAt` fra den valgte kilde, og opdatér barnets `updatedAt` ved reel ændring. Bevar barnets `id`, `note`, `connectionConfirmation`, `reviewRequiredFor` og `sourceChoice`. Egne børn ændres ikke. Hvis en kilde fjernes eller arkiveres, må ingen aktiv arvet post beholde forældet værdi. Valg mellem flere kilder kræver katalog- og regelgrundlag samt eventuelt trænerens valg; vælg ikke vilkårligt.

Kontrollér hele filen efter ændringen: alle referencer skal findes, `(athleteId, skillId)` være entydigt, effektive arveværdier stemme med aktiv kilde, og noter/datoer bevaret. Det offentlige JSON-schema kan ikke alene udføre denne kontrol.
