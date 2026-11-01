# Proposal

## Why

Trænerne møder uensartede springnavne, fx "Strakt – kraftspring – barani" uden grader, mens andre barani'er vises med "(strakt 180°)". Årsagen er, at appen har to navnesystemer: Bibliotekets håndskrevne navne og de genererede navne til fundament og kortere serier. De er uenige for 234 af 263 baneserier. Det genererede navn gemmes i trænerfilen og vises derefter i stedet for bibliotekets navn. Samtidig har vælgeren 297 næsten ens rækker, søgningen kender hverken synonymer eller springenes opbygning, og de automatiske fundamentkæder findes kun i koden og kan ikke gennemgås af trænerne.

## What Changes

- Ét fælles navnesystem for alle spring på bane og trampet, beregnet ud fra den præcise udførelse: trænerjargon med grader i navnet, fx "Kraftspring – barani (strakt 180°)", "Rondat – flik – strakt 1/1 (360°)" og "Rudy (strakt 540°)". Bibliotek, fundament, kortere serier, gymnastoverblik, Springplan, ambitioner, reserver og ændringsgennemgang bruger samme navn.
- Navne vises ud fra udførelsen. Et gemt navn, der svarer til et nuværende eller tidligere automatisk navn, vises med det nye fælles navn. Ægte selvvalgte navne bevares og vises uændret. Filens gemte navne omskrives ikke.
- En lokal gennemgangsrapport af fundamentkæderne (`npm run report:fundament`) til den ansvarlige træner: hvad hvert spring giver som træ med relationens danske navn og en oversigt pr. relationstype. Kataloget vises ikke i appen.
- Søgningen forstår synonymer og tal: 1/1, hel, helskrue og 360 betyder det samme, ligesom kraft og kraftspring samt barani, rudy og randy med den tilsvarende udførelse. Søgningen matcher springets opbygning, ikke kun navnet.
- En visuel kædebygger erstatter springgruppe-dropdown'en: træneren vælger et element pr. plads, også længere fremme eller som afslutning, og ser kun de mulige fortsættelser med antal. Sjældne kombinationer efter en trænergodkendt tabel er skjult som standard, men findes altid ved søgning.
- Holdets kendte spring vises før øvrige biblioteksvalg, med antal gymnaster på holdet, der har springet registreret.
- Ingen ændring af identiteter, D, regelpakker, fundamentrelationer, fletteregler eller filformat.

## Capabilities

### New Capabilities

Ingen.

### Modified Capabilities

- `skill-catalog`: Fælles navnegrammatik for alle spring og visning af gemte automatiske navne. Synonym- og strukturbaseret søgning, visuel kædebygger med skjulte sjældne kombinationer, holdets kendte spring først og en lokal gennemgangsrapport af fundamentkataloget.

## Impact

Berører `apps/web/src/spring-library.ts` (navne, bibliotek, søgning), `spring-picker.tsx`, `spring-picker-model.ts`, `spring-choice-rows.tsx`, et nyt rapportscript og de steder, der i dag viser `definition.name` direkte, herunder `workspace-review.tsx`. Det påvirker også eksisterende domænetests og browserprøver, der forventer de gamle navne.

**Fælles data og fletning:** Ændringen er ren visning. Der tilføjes ingen gemte felter, og ingen eksisterende felter får ny betydning. `name` er fortsat et selvstændigt felt med den nuværende politik. Nye definitioner gemmer det fælles navn som i dag. Identiteter, rækkefølge, afhængigheder, arverelationer, fravalg og afledte værdier (D, arv, potentialer) ændres ikke. Holdtællingen, kædevalg og serier uden for listen er afledt ved visning og gemmes aldrig. Der kræves derfor ingen ny flettepolitik. Begrundelsen dokumenteres i flettevedligeholdelsen.
