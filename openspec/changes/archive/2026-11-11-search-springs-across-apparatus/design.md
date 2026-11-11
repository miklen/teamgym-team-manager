## Context

`SkillEditor` har i dag én `discipline`-tilstand (`tumbling | trampet | rhythm`), som styres af feltet Disciplin øverst. `SpringPicker` får disciplinen som prop og remountes ved skift (`key={discipline}`). Filtrering (`filterSpringChoices`), kædebyggeren (`SpringChain`) og prefill til Byg selv er bundet til én disciplin. Valgte spring ligger allerede i `SkillEditor` og overlever et disciplinskift. `registerSpringBatch` og `springRegistrationPlan` håndterer hver definition efter dens egen disciplin, så en blandet registrering virker allerede i dag.

Kædens pladser betyder forskelligt pr. redskab. På bane er det spring 1…n og Slutter med, på trampet Redskab (med/uden pegasus) og Springtype. Kæden kan derfor ikke køre på en blandet mængde.

## Goals / Non-Goals

**Goals:**
- Én liste på tværs af bane og trampet som standard med redskab som synligt filter.
- Kædebyggeren skal fortsat virke uændret, når redskabet er valgt, og redskabsvalget skal være kædens naturlige første trin.
- Ingen ændring af gemte data eller registreringslogik.

**Non-Goals:**
- Ambitionsvælger og pladsvalg i Springplan, som er bundet til omgangens disciplin.
- Rytme i samme liste.
- At huske filteret mellem åbninger.

## Decisions

1. **Tilstand i `SkillEditor`.** En ny visningstilstand `apparatus: 'all' | 'tumbling' | 'trampet'` ligger i `SkillEditor` og sendes til `SpringPicker` med setter. Byg selv kan så læse den. Standard er `'all'` for nye registreringer. Ved åbning med en given springdisciplin (ambition, eksisterende registrering) bruges den disciplin. `discipline` beholder sin betydning for byggeren og rytme. Feltet øverst viser Spring/Rytme, og ved en eksisterende registrering vises den låste disciplin som i dag.
   - *Alternativ:* tilstand kun i `SpringPicker`. Fravalgt, fordi Byg selv-segmentet øverst så ikke kender redskabet.

2. **Filtrering.** `filterSpringChoices` får `discipline: SpringDiscipline | 'all'`. Ambitionsvælgerens kald er uændret. `springPickerRows` og `teamSpringCounts` er allerede disciplinuafhængige. Sortering uden søgning er planlagte → holdkendte → bibliotek, med bane før trampet som i biblioteket. Med søgning afgør søgerangen.

3. **Kædens første trin.** Ved `'all'` viser `SpringChain` én node, "Bane eller trampet", med en bakke af to fliser med antal efter søgning og D-filter. Valget kalder `setApparatus` og åbner kædens første plads for redskabet. Kæden er altså stadig én flade, og pladsernes logik i `spring-chain-model.ts` er uændret. Segmentknappen Alle · Bane · Trampet står over kæden og er den samme tilstand. Skift nulstiller kæden og aktiv plads (erstatter den nuværende `chainDiscipline`-nulstilling). Søgetekst, D-filter og Valgte bevares.
   - *Alternativ:* skjul kæden ved Alle. Fravalgt efter brugerens valg, fordi kæden så mister sit indgangspunkt.

4. **Redskabsmærke.** `SpringChoiceRows` får `showApparatus` og viser "Bane"/"Trampet" i rækkens metalinje og i rækkens tilgængelige navn, når listen er blandet. I Valgte vises mærket altid, fordi valgene kan være blandede uanset filter.

5. **Byg selv ved Alle.** Byggeren viser en segmentknap Bane | Trampet øverst, når der bygges en ny gymnastregistrering. Uden valgt redskab vises kun valget og en kort tekst. Fra `'tumbling'`/`'trampet'` eller en kædeprefill er redskabet sat. Skift tømmer elementerne som det gamle disciplinfelt.

6. **Fælles data og fletning.** Ren visning. Filteret gemmes ikke. Registrering sker via de eksisterende `registerSpringBatch`/`registerAthleteSkill` med uændrede definitioner, identiteter, rækkefølge, arverelationer, fravalg og D. Formularer indfører ingen fletteregler. Der kræves ingen ny flettepolitik eller samtidighedstest. Begrundelsen tilføjes afsnittet om springvælgeren i `docs/vedligeholdelse-fletning.md`.

## Risks / Trade-offs

- [Længere standardliste og flere kandidater i søgning] → Søgerang og holdkendskab sorterer stadig. Redskabsmærke og filter gør det let at afgrænse.
- [Samme navn på bane og trampet, fx strakt salto] → Mærket Bane/Trampet står i rækken og i det tilgængelige navn.
- [Browserprøver bruger `Disciplin` = trampet/tumbling] → Prøverne skiftes til redskabsfilteret. Rytme beholder `selectOption('rhythm')`, så eksisterende rytmeprøver er stabile.
- [Ydelse ved evaluering af hele biblioteket] → `evaluations` memoiseres allerede for hele biblioteket. Der kommer ingen ny beregning pr. række.

## Migration Plan

Ingen datamigration. Udrulles som almindelig statisk build. Rollback er en revert.

## Open Questions

Ingen.

## Verifikation

Kontrolniveauer efter AGENTS.md. En ny enhedstest af filtrering ved Alle. Browserprøve af søgning på tværs, kædens redskabstrin, blandet registrering og Byg selv fra Alle. Eksisterende prøver tilpasses. Visuel kontrol ved 390 og 1440 px, fordi kæde og filter ændrer udseende.
