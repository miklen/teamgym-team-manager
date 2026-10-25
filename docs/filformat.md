# Arbejdsrumsformat 1

En arbejdsrumsfil er JSON med `format: "teamgym-team-manager"` og `schemaVersion: 1`. [Det syntetiske eksempel](../examples/arbejdsrum-v1.json) valideres i tests og indeholder et hold, en gymnast, en registreret rytmefærdighed uden vurdering og alle seks tomme omgange. Den større syntetiske testfixture gennemfører round-trip med to forskellige regelbindinger, alle tre discipliner og seks udfyldte omgange.

## Identiteter og samlinger

| Samling | Betydning |
| --- | --- |
| `teams` | Navn, arkivering og selvstændig præcis regelbinding |
| `athletes` | Navn, valgfri navneadskillelse, ét `teamId` eller `null`, arkivering og eksplicit valgfri mixkategori |
| `skills` | Præcis udførelse af en ordnet baneserie, ét komplet trampetspring eller et individuelt rytmemoment med variant |
| `athleteSkills` | Én registrering pr. gymnast og præcis færdighed, vurdering/dato/note og eventuel konkret forbindelsesbekræftelse |
| `plans` | Én plan pr. hold, regelbindingens fingerprint og tre ordnede omgange i hver springdisciplin |
| `recentOperations` | Højst 30 gemmeoperationer med id, hash, revision og tid; bruges af Drive-adapteren |

Workspace-, hold-, gymnast-, færdigheds-, registrerings-, plan-, omgangs- og plads-id'er er globalt entydige i filen. Navne og officielle koder er aldrig identiteter. Arrayrækkefølgen angiver element-, omgangs- og gymnastorden; holdomgang er altid første omgang. Et opslag bruger præcis reglements-id og pakkeversion; filvalidering kræver ikke, at pakken er installeret, og omskriver ikke ukendte bindinger.

Et element bevarer familie, retning, rotation i kvarte omgange, kropspositioner, skruer i halve omgange, relevant skruefordeling, redskab, afsæt, landing og strukturerede varianter. Kode og point er regelkoblinger, ikke frit redigerbare feltværdier. En serie er en ordnet liste med beskrevet overgang mellem hvert element. En trænerbekræftelse er knyttet til den konkrete udførelse; den kan ikke godkende forbudte elementer eller afklare en tvivlsom regelværdi.

## Lovlige kladder og ugyldige filer

Tomme omgange, færre deltagere og et `athleteSkillId: null` er kladder, som kan gemmes. En arkiveret/flyttet gymnast eller arkiveret færdighed bevarer sin planreference med diagnostik. Arkivering sletter ingen data. En ændret regelbinding uden tilsvarende planfingerprint kræver gennemgang.

Ukendte referencer, dublerede id'er, samme gymnast to gange i én omgang, en anden gymnasts registrering, forkert disciplin, forkert antal omgange eller ukendte felter afvises. En sådan fil omfortolkes aldrig som tom. Den generelle filmodel kan bevare større/ugyldige importerede besætninger til diagnose; redigeringskommandoen får deltagergrænser fra holdets regelpakke og afviser for mange deltagere samt ekstra gymnaster efter de tællende.

## Stabilitet

`stability` er et heltal fra 1 til 5 eller `null`. En registrering uden vurdering har `assessedAt: null`. En vurdering har en gyldig kalenderdato som `2026-10-25`; `updatedAt` er et separat ISO-tidspunkt. Noten ændrer hverken identitet eller officielle point. Der er intet konkurrerende indlærings-/konkurrenceklar-felt.

- Ingen `athleteSkills`-post: færdigheden er ikke registreret.
- Post med `stability: null`: registreret, men ikke vurderet.
- Post med `stability: 1`: vurderet på laveste reelle trin.

Aggregater viser gennemsnit blandt kendte vurderinger, minimum, antal 1–2, vurderet antal og udfyldte/krævede springpladser. Manglende input giver ufuldstændig status. `5,5,5,5,5,1` giver 4,3 og minimum 1; `5,5,5,5,5,null` giver 5,0 blandt fem vurderede og ufuldstændig 5/6. Ekstra gymnaster har separat aggregat. Tomt input giver `null` for gennemsnit/minimum, aldrig nul eller fuld dækning. Ingen værdi er en sandsynlighed.

## Serialisering og migration

Serialisering validerer hele filen og sorterer objektnøgler deterministisk; betydende arrays omarrangeres ikke. Payload til gemmehash udelader rodens `revision`, `updatedAt` og `recentOperations`, så gemmefelterne ikke indgår i deres egen hash. En lokal redigering ændrer ikke den autoritative Drive-revision.

Nyere skemaer afvises med `newer-schema`; ældre versioner kræver `migration-required`. Der findes endnu ingen frigivet ældre arbejdsrumsudgave og derfor ingen implicit migration. En senere understøttet migration skal være eksplicit, bevare originalen og anvendes før en bevidst, konfliktbeskyttet gemning. Filskemaopgradering må aldrig automatisk ændre holdets reglement eller pakkeversion.
