## Why

Trænerne kan i dag se den enkelte gymnasts spring og planlægge konkrete omgange, men de har intet samlet billede af, hvad holdet kan som hold. Det gør det svært at svare på de spørgsmål, der styrer træning og ambitionsniveau: Hvor er vi tæt på at have N gymnaster til en sværere holdomgang? Hvilke spring hviler på præcis N gymnaster og er derfor skrøbelige? Hvor er sikkerheden generelt lav? Og findes der linjer, hvor holdet er stærkere end man tror, som kunne give en anderledes omgang?

## What Changes

- Ny fane **Holdprofil** under holdet ved siden af Gymnaster, Springplan og Rytme. Den viser bane og trampet for holdets aktive gymnaster.
- Holdets spring vises som **trapper pr. springlinje**, side om side og sorteret efter D. Hver række viser, hvor mange der kan springet, og hvordan sikkerheden fordeler sig i sikre (3–5), lave (1–2) og ikke vurderede. Hvem der står bag, vises ved et tryk.
- Hver række får en **status i forhold til holdomgangens krav N**, som læses fra regelpakken (`participants.counting`): Klar, Skrøbelig, Ustabil eller Tæt på. Andre rækker nedtones.
- En **relativ relevansregel** skjuler spring, som et sværere spring i samme linje overgår. Det gælder, når det sværere spring kendes af mindst lige så mange med mindst lige så mange sikre, og tællingen har loft ved N + 2. Holdets eget niveau afgør derfor, hvad der vises. Et stærkt hold ser ikke saltoer og baranier, mens et blandet hold ser hele spændet. Skjulte spring kan foldes ud pr. linje.
- **Holdets niveau** pr. disciplin vises som en kort sammenfatning med det sværeste Klar-spring pr. linje og de nærmeste muligheder.
- Visningen er **ren afledning**. Der kommer ingen nye gemte felter, ingen ændret betydning af eksisterende data, ingen domænekommandoer og ingen ny flettepolitik. Begrundelsen dokumenteres i design og verificering efter acceptkravet om fælles konflikthåndtering.
- Uden for scope: træningsplanlægning pr. gymnast (fx "er ved at lære"), kobling til ambitioner eller Springplan, filtrering efter scenariets deltagere, rytme (har allerede rytmematricen) og sandsynligheder eller samlede "succesrater".

## Capabilities

### New Capabilities

- `team-skill-overview`: Holdprofilen med afledt springprofil pr. linje, status i forhold til N, sikkerhedsfordeling, relativ relevansregel med udfoldning, holdets niveau og adgang til navnene bag hver række.

### Modified Capabilities

- `coach-workspace`: Navigationskravet udvides, så holdets visninger også omfatter Holdprofil.

## Impact

- Ny side `apps/web/src/team-profile.tsx` med styling i `apps/web/src/team-profile.css` og en ny fane i navigationen i `apps/web/src/main.tsx`.
- Ny ren afledningsmodel `apps/web/src/team-profile-model.ts`. Den genbruger `teamSkillRows` (`spring-picker-model.ts`), regelpakkens `evaluateSkill(...).identity` og D samt linjeinddelingen fra `skillFamily` (`skill-overview.ts`).
- Tests: enhedstests af status, relevansregel, loft og linjer med syntetiske data, og en ny browserprøve `tests/e2e/team-profile.spec.ts`.
- Ingen ændringer i `packages/domain`, schema, flettekontrakt, `packages/rules` eller Drive.
