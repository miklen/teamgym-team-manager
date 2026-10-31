## Why

Trænere planlægger ofte en modtagning for en bestemt gymnast og et bestemt spring i en konkurrenceomgang, typisk for at give psykologisk tryghed i en periode. Beslutningen gælder uanset gymnastens sikkerhed, og den koster kendte point efter reglementet. I dag kan træneren hverken registrere beslutningen i springplanen eller se, hvad den koster.

## What Changes

- Hver plads i en springomgang kan få én valgfri **planlagt modtagning** i én af tre grader:
  - **Let støtte:** E-fradrag 0,5.
  - **Hjælp til udførelse:** E-fradrag 1,0.
  - **Kraftig hjælp i svæv/landing:** E-fradrag 1,0 og halveret D for det modtagne element (H 9.3.3/10.3.3, A6-07). På bane vælges elementet med det sidste element som standard. Trampet har altid kun ét element.
- Modtagningen er en bevidst trænerbeslutning på pladsen. Den udledes aldrig af sikkerhed og knyttes ikke til gymnastens færdighedsregistrering.
- Kraftig hjælp reducerer pladsens D allerede i omgangens D. Rækkefølgefradrag (Q06), sorteringsforslag, holdomgangens afvigelse og øvrige C-forhold bruger fortsat springets uhalverede D og identitet.
- Planlagte E-fradrag vises som en særskilt linje pr. omgang. Ekstra, ikke-tællende gymnaster koster 0.
- Ny afledt visning, **Maks. mulig karakter**: C + D + (10,0 − planlagte E-fradrag) i gennemsnit over tre omgange. Visningen fremhæver modtagningens samlede pris. Det er et loft og ikke en forventet karakter.
- Modtagningen nulstilles, når gymnasten, springet eller springets udformning ændres, herunder når en reserve indsættes. Den følger med ved duplikering af scenarier og ved flytning inden for omgangen.
- **BREAKING (filformat):** Arbejdsrumsformat 4 tilføjer modtagningen til pladserne. Ældre filer migreres eksplicit og uden tab. Ældre apps afviser format 4 som et nyere format i stedet for at overskrive det.
- Flettepolitikken udvides med modtagningen som en del af den atomiske deltagerliste. Et samtidigt ændret spring gør modtagningen afledt ugyldig ved indlæsning af den nyere fil.

## Capabilities

### New Capabilities

- `planned-spotting`: Planlagt modtagning pr. omgangsplads, grader og regelbundne konsekvenser for D og E, planlagte E-fradrag, Maks. mulig karakter samt nulstilling og gyldighed.

### Modified Capabilities

- `routine-planning`: Pladser kan bære en planlagt modtagning. Reserveindsættelse, springskift og duplikering har eksplicit betydning for modtagningen. Konkrete potentialeforslag viser, når en modtagning bortfalder.
- `difficulty-scoring`: Planlagt kraftig hjælp halverer elementets D i panel-D. Kravet om, at planlagt sværhed ikke er observeret bedømmelse, præciseres, så en eksplicit planlagt modtagning og et pointloft kan vises uden at foregive en fuld C+D+E-karakter.
- `drive-workspace`: Format 4, eksplicit migration fra format 1–3 og afvisning i ældre apps.
- `workspace-merge`: Modtagningens flettepolitik og afledt ugyldighed ved samtidigt ændret spring.

## Impact

- `packages/domain`: schema (format 4, `plannedSpot` på `RoundEntry`), migration, kommandoer (sæt/fjern modtagning, nulstilling i eksisterende kommandoer), validering og `merge-policy.ts`.
- `packages/rules`: `dk-engine.ts`/`dk-spring.ts` får et særskilt modtagningslag for D, planlagte E-fradrag pr. omgang og Maks. mulig karakter. Satser og kilder bindes til DK-regelpakkerne.
- `packages/drive`: migrationsflow og fletning, hvor basen kan være en migreret format 3-fil.
- `apps/web`: pladsens modtagningsvalg, omgangens D/E-linjer, Maks. mulig karakter i overblikket, konfliktvisning og migrationsdialogens tekst. UI-arbejdet følger projektets frontend-skill.
- Dokumentation: `docs/vedligeholdelse-fletning.md` og regeldokumentation for modtagning.
- Tests: domæne, regler (faste facit fra kilden, ikke fra produktionsreglerne), fletning i begge retninger, Drive-migration og e2e.
