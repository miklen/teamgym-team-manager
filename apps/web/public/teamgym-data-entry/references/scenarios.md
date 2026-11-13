# Scenarier og omgange · format 7

Find planen i `plans` med præcis `teamId`. `bindingFingerprint` er den kanoniske JSON af holdets `rulesetBinding` med sorterede objektnøgler. Planen har separate, ordnede arrays `tumbling` og `trampet`; bevar den anden disciplin og alle øvrige scenarier. Et scenarie `{id, name, rounds}` har et unikt ID, et trimmet navn på 1–200 tegn, som er entydigt uden forskel på store/små bogstaver inden for hold og disciplin, og **præcis tre** omgange. Første omgang er holdomgang. `rounds` må ikke omordnes for at passe et navn.

## Opret, kopier eller ret

- Ved oprettelse: vælg scenarieplacering sammen med træneren, opret nyt scenarie-ID og tre nye omgangs-ID'er med tomme `entries` og `reserves`, og udfyld derefter den besluttede opstilling.
- Ved kopiering: kopiér det valgte scenaries indhold og ordener, men giv scenarie, alle tre omgange og hver udførende og reserveplads **nye** ID'er. Fælles `athleteId`, `athleteSkillId`, `plannedSkillId` og `plannedSpot.skillId` refererer fortsat til de samme eksisterende objekter. Giv kopien et ledigt, trimmet navn. Redigér kun kopien, hvis træneren beder om det.
- Ved ændring: bevar eksisterende scenarie-, omgangs- og plads-ID'er for uændrede objekter. Bevar den rækkefølge, træneren har angivet. Opret ikke en ny vurdering eller et nyt spring blot for at fylde en plads.

`entries` er udførende i springrækkefølge. En besat plads er `{id, athleteId, athleteSkillId, role, plannedSpot, plannedSkillId:null}`. `role` skal gemmes som `counting` eller `extra`, men udledes af **positionen**, ikke af et særskilt trænerønske: hvis omgangen har flere pladser end profilens `counting`, er netop de første `entries.length - counting` pladser `extra`, og alle efterfølgende er `counting`. Ved højst `counting` pladser er alle `counting`. Regelpakken angiver `participants.counting` og `participants.maxExtra` i [katalog-v7.json](catalog-v7.json), og profilen angiver holdets tal. Overskrid ikke summen af de to grænser. Genberegn rollerne efter indsættelse, fjernelse eller flytning af en plads, men bevar en urørt ældre omgangs gemte roller. Alle gymnaster i en omgang skal være forskellige på tværs af `entries` og `reserves`. En udførendes `athleteSkillId` skal pege på **samme gymnasts** registrering af en definition i omgangens disciplin. `athleteSkillId:null` er en lovlig, ufuldstændig kladde og må ikke fremstilles som et færdigt spring.

`reserves` er et særskilt prioriteret array af `{id, athleteId, athleteSkillId}`. Første reserve har højest prioritet. En reserve kan have `athleteSkillId:null`, men aldrig `athleteId:null` eller en rolle. Reserver tæller ikke som udførende og indgår ikke i D/C eller sikkerhedsaggregatet før trænerens indsættelse.

En **ambition** er en udførende plads uden valgt gymnast: `{id, athleteId:null, athleteSkillId:null, role, plannedSpot:null, plannedSkillId:"<skill-id>"}`. `plannedSkillId` peger på en eksisterende præcis definition i samme disciplin. En besat plads har altid `plannedSkillId:null`. *Kan nu*, mulige kandidater og matchstatus er afledt i appen; gem dem ikke.

`plannedSpot` er `null` eller `{grade, skillId, elementIndex}` på en udførende plads med valgt spring. `grade` er `support`, `assist` eller `heavy`. `skillId` er definitionen, som modtagningen faktisk er planlagt for, normalt den valgte registrerings `skillId`. Ved `heavy` på bane er `elementIndex` et gyldigt nulbaseret indeks i seriens `elements`; ellers er feltet `null`. Bed om afklaring af modtaget element, hjælpens grad og springets identitet. En ændret springreference kræver fornyet modtagningsbeslutning; behold ikke en modtagning for det gamle spring.

## Syntetisk noter-til-scenarie

Træneren har **allerede besluttet**: “Nyt banescenarie Sikker A efter Plan A. Alle tre omgange: Test A, B, C, D, E, F i den rækkefølge med deres registrerede baneserie. Test G er første reserve. F er observeret som den flotteste afslutter. I anden omgang får C let støtte til samme serie.” Hvis disse ID'er og registreringer er entydigt fundet i filen, bliver den tilsigtede ændring:

| Omgang | `entries` i præcis orden | `reserves` i præcis orden | Modtagning |
| --- | --- | --- | --- |
| 1, holdomgang | A, B, C, D, E, F som `counting` | G | alle `null` |
| 2 | A, B, C, D, E, F som `counting` | G | C: `{ "grade":"support", "skillId":"skill-test-bane", "elementIndex":null }` |
| 3 | A, B, C, D, E, F som `counting` | G | alle `null` |

Scenariet, de tre omgange og 21 pladser får nye unikke ID'er. Hver udførende får sin egen `athleteId` og `athleteSkillId`; G's reserveplads får G's registrering eller `null` efter det faktiske filindhold. Hver besat udførende får `plannedSkillId:null`. Alle andre scenarier, fælles registreringer og deres rækkefølge bevares. Hvis træneren kun har bedt om “den flotteste til sidst” uden at oplyse en observation af udførelsen, skal du spørge; stabilitetstallet må ikke bruges som mål for flot udførelse. Denne registrering beviser ikke sportslig kvalitet eller officielle point.

Kontrollér efterfølgende hele filens ID-unikhed, scenarienavne, tre omgange, disciplin, gymnast/registrerings-referencer, reserver og modtagninger. En schema-valid fil kan stadig være en sportsligt uafklaret kladde; kald den ikke en godkendt opstilling uden trænerens valg.
