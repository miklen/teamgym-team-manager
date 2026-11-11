## Why

En træner har bedt om at kunne søge på tværs af bane og trampet, når der tilføjes færdigheder til en gymnast. I dag skal træneren først vælge disciplin øverst i formularen. Et spring som en strakt salto med 1/1 findes på begge redskaber, og det er nemt at søge forgæves, fordi listen er låst til det forkerte redskab.

## What Changes

- Disciplinvalget øverst i Tilføj færdighed bliver et valg mellem **Spring** og **Rytme**. Bane og trampet er ikke længere et formularvalg, før listen vises.
- Springvælgeren får et altid synligt redskabsfilter **Alle · Bane · Trampet** under søgefeltet i trinnet Find springet. Standard er **Alle**, og så viser listen bane- og trampetspring sammen.
- Står filteret på Alle, er kædens første trin **Bane eller trampet** med antal pr. redskab. Et valg sætter filteret, og kæden fortsætter med de nuværende pladser for redskabet. Skift af redskab nulstiller kun kæden.
- Når listen viser begge redskaber, får hver række et diskret mærke, **Bane** eller **Trampet**.
- Byg selv bruger filterets redskab. Står filteret på Alle, starter byggeren med et synligt valg mellem Bane og Trampet, før elementer kan vælges.
- Valg, vurderinger, fundament, søgetekst og D-filter bevares ved skift af redskabsfilter. En samlet registrering kan indeholde spring fra begge redskaber, som den allerede kan i dag.
- Ren visning: ingen nye gemte felter, ingen ændret betydning, ingen nye domænekommandoer og ingen ny flettepolitik.
- Uden for scope: ambitionens springvalg og pladsvalg i Springplan, som fortsat følger omgangens disciplin, samt rytme.

## Capabilities

### New Capabilities

Ingen.

### Modified Capabilities

- `skill-catalog`: Springvælgerens flerspringsvalg, kædebygger og forløbet fra søgning til valg ændres fra ét forudvalgt redskab til en samlet liste med redskabsfilter.

## Impact

- `apps/web/src/skill-editor.tsx`: valget Spring/Rytme, redskabsfilterets tilstand og redskabsvalget i Byg selv.
- `apps/web/src/spring-picker.tsx`, `spring-chain.tsx` og `spring-choice-rows.tsx`: segmentfilter, kædens første trin og redskabsmærke.
- `apps/web/src/spring-picker-model.ts`: `filterSpringChoices` accepterer alle springdiscipliner. Ambitionsvælgeren kalder den uændret med én disciplin.
- Styling i den eksisterende CSS for vælger og kæde.
- Tests: enhedstest af filtrering på tværs i `tests/domain/spring-picker-model.test.ts`. Browserprøver, der vælger Bane/Trampet i `Disciplin`, tilpasses, og der kommer én prøve af søgning på tværs og kædens redskabstrin.
- Docs: `docs/brugsvejledning.md` og afsnittet om ren visning i `docs/vedligeholdelse-fletning.md`.
- Ingen ændringer i `packages/domain`, `packages/rules`, `packages/drive`, schema eller flettekontrakt.
