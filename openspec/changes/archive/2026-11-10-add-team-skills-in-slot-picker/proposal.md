## Why

Når træneren sammensætter omgange, viser springvalget kun én gymnasts registrerede spring, og gymnastfeltet forudvælger tilfældigt den første gymnast. Træneren kan derfor ikke se, hvad holdet samlet kan, eller om et spring allerede er brugt i en anden omgang og vil give fradrag for gentagelse. Overblikket skal være der, hvor beslutningen træffes, altså i springvalget på pladsen.

## What Changes

- Gymnastfeltet på en ny omgangs- eller reserveplads får det nye valg **Hele holdet**, som er standard ved nye pladser. Redigering af en eksisterende plads beholder pladsens gymnast.
- Med Hele holdet viser springlisten holdets anvendelige spring i disciplinen, samlet efter regelpakkens springidentitet. Hver række viser, hvor mange ledige gymnaster der kan springet.
- Når træneren vælger et spring på holdniveau, indsnævres gymnastvalget til de ledige gymnaster, der kan springet, og den valgte gymnasts egen registrering med egen D og sikkerhed bruges. Pladsen kan ikke gemmes, før der er valgt en gymnast. Dermed adskiller Hele holdet sig fra den eksisterende ambition, Ingen gymnast endnu.
- Begge lister, holdets og gymnastens, markerer spring, hvis identitet allerede bruges på tællende pladser i en anden omgang i samme scenarie. Markeringen er en advarsel om gentagelse og blokerer ikke valget. Brug i samme omgang vises neutralt, fordi gentagelse inden for omgangen er tilladt.
- Visningen er ren præsentation. Der kommer ingen nye gemte felter, ingen ændret betydning af eksisterende data og ingen ny flettepolitik.
- Uden for scope: en selvstændig matrix over holdets spring (spring x gymnaster x brug), som kan blive en senere ændring.

## Capabilities

### New Capabilities

Ingen.

### Modified Capabilities

- `routine-planning`: Kravene til "Gymnaster og kendte færdigheder vælges sammen" og "Søgbart visuelt springvalg" udvides med Hele holdet, holdoptælling, indsnævring af gymnaster og markering af gentagelse mellem omgange.

## Impact

- `apps/web/src/spring.tsx` (`AthleteEntryForm`, `EntryForm` og kaldet fra omgangsdialogen), `apps/web/src/reserves.tsx` (reservedialogen) og `apps/web/src/plan-skill-select.tsx` (rækker, kolonner og markeringer).
- Ny ren afledningsfunktion i `apps/web/src/spring-picker-model.ts` til holdoptælling pr. identitet blandt ledige gymnaster og brug pr. omgang. Funktionen genbruger regelpakkens `evaluateSkill(...).identity` og samme tællegrundlag som `C-GENTAG`.
- Styling i `apps/web/src/spring-plan.css`.
- Tests: udvidelse af `tests/e2e/plan-skill-select.spec.ts` og enhedstest af den nye afledning.
- Ingen ændringer i `packages/domain`, schema, flettepolitik eller Drive.
