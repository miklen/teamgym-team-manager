## Context

Holdets spring findes i dag kun set fra gymnasten (gymnastoverblikket) eller fra en konkret plads (springvalget med Hele holdet). `teamSkillRows` i `apps/web/src/spring-picker-model.ts` grupperer allerede holdets anvendelige registreringer efter regelpakkens identitet med bedste sikkerhed pr. gymnast. `skillFamily` i `apps/web/src/skill-overview.ts` inddeler spring i linjer som Rondat-flik, Rondat-whipback, Kraftspring, Startsalto · forlæns og, på trampet, Med/Uden redskab · Enkelt/Dobbelt salto. Medtaget fundament er almindelige aktive registreringer med arvet sikkerhed, og fravalgte børn findes ikke som registreringer. Når vi tæller registreringer, tæller vi derfor allerede "kan" korrekt.

Holdomgangens krav N står i regelpakken som `springRules[discipline].participants.counting` (6 i både DK og Regionsrækken). Stabilitetsspecen forbyder sandsynligheder og fastlægger "lav" som 1–2. Rytmen har allerede sin egen matrix over fælles momenter.

Appens visuelle system: Manrope, hvidt papir (`--paper`), mørk blæk (`--ink`), `--muted`, `--line`, én blå accent (`--accent: #3155d9`) og den eksisterende ravfarve (`#a87428`) som advarselssemantik. Der er ingen animationsbibliotek. Bevægelse laves med CSS og respekterer `prefers-reduced-motion`.

## Goals / Non-Goals

**Goals:**
- Træneren skal på få sekunder kunne se holdets niveau, de nærmeste opgraderinger, de skrøbelige spring og linjer med lav sikkerhed.
- Det, der vises, skal være relevant ud fra holdets eget niveau uden opsætning.
- Visningen skal give inspiration til andre omgange ved at vise styrker i flere linjer side om side.
- Udtrykket skal være et instrument, man får lyst til at åbne: roligt, præcist og med én umiskendelig visuel idé.
- Ingen påvirkning af fælles data eller fletning.

**Non-Goals:**
- Træningsplanlægning eller markering af "er ved at lære" pr. gymnast.
- Kobling til ambitioner, Springplan eller scenarier.
- Rytme.
- Sandsynlighed, risikoscore eller samlede "succesrater".
- Redigering af færdigheder fra Holdprofil.

## Decisions

### Visuel retning

- **Visuel tese:** *Vandlinjen.* Holdets spring står som trapper, og én tynd, lysende accentlinje ved N går gennem dem alle. Alt over linjen kan bære en holdomgang. Det, der mangler, ses som tomme pladser lige før linjen. Udtrykket er papir og blæk, og kun linjen og de sikre gymnaster lyser i accentfarven.
- **Indhold:**
  1. Overskrift med disciplinvalg og holdets niveau i én linje.
  2. Fokuspunkter med op til fem afledte iagttagelser.
  3. Trapperne, én pr. linje.
  4. Detaljepanel med navnene bag en række.
- **Interaktionstese:**
  1. *Linjen trækkes.* Ved åbning og disciplinskift tegnes N-linjen ovenfra og ned gennem trapperne (ca. 350 ms). Prikkerne fyldes ind fra venstre med en kort forskydning pr. række, så holdets niveau "stiger op" til linjen.
  2. *Fremhæv en gymnast.* Når man trykker på et navn i detaljepanelet, lyser den gymnasts prikker op på tværs af hele profilen, og resten dæmpes. Det viser med det samme, om én gymnast er den sjette på mange spring.
  3. *Udfold linjen.* "+4 lettere" udfolder de skjulte rækker med en højde- og tone-overgang på stedet. Intet hopper andre steder.

  Al bevægelse slås fra ved `prefers-reduced-motion`. Der kommer ingen nye afhængigheder.

### Anatomi af en række: prikbåndet

```
                                         N-linje
                                            |
 Rondat - flik - 2/1          3,60   * * * o . |              Tæt på · mangler 1
 Rondat - flik - flik - 1/1   3,20   * * * - - - | * .          Ustabil · 2 lave
 Rondat - flik - 1/1          2,80   * * * * * * | *            Klar
 Rondat - flik - strakt       2,40   * * * * * * |              Skrøbelig · ingen margin

  *  sikker (3-5), fyldt accent        -  lav (1-2), fyldt rav
  o  ikke vurderet, ring i --muted     .  tom plads op til N, stiplet spøgelse
```

- Båndet har N pladser, derefter N-linjen og derefter op til to marginpladser (N + 2 i alt). Ud over loftet vises et diskret `+k`.
- Prikkerne står i rækkefølgen sikre, lave, ikke vurderede. Så viser båndets form sikkerheden, uden at man skal læse tal. En række er "solid" helt ud til linjen eller har en rav hale.
- D står med tabulære cifre i en fast kolonne. Navnet følger den fælles navnegrammatik.
- Status står som kort tekst yderst til højre og bæres aldrig af farve alene. Klar står i blæk, Tæt på i accent, Skrøbelig, Ustabil og Mangler vurdering i rav med et lille trekantmærke. Nedtonede rækker vises i `--muted` uden status.

### Trapperne: én kolonne pr. linje

```
 1440 px
 +------------------------------------------------------------------------------------------+
 | Holdprofil                                             [ Bane | Trampet ]   12 gymnaster |
 | Niveau: Rondat-flik-1/1 (2,80) · Rondat-whipback-salto (2,20) · 3 linjer tæt på næste   |
 |------------------------------------------------------------------------------------------|
 | Fokus   > Rondat-flik-2/1 mangler 1   > Whipback-1/1 mangler 1   > Startsalto fl. lavt   |
 |------------------------------------------------------------------------------------------|
 | RONDAT-FLIK  ====-  | RONDAT-WHIPBACK ===-- | STARTSALTO FL. =----  | KRAFTSPRING  ====   |
 |                     |                       |                       |                     |
 | 2/1     ***o. |     | whip-1/1  *****|      | fl-fl-str  **---- |   | kr-flik   ******|*  |
 | 1/1     ***---|*.   | whip-salt ******|**   | fl-salto   ****---|*  |                     |
 | strakt  ******|     |                       |                       |                     |
 |  +4 lettere         |  +2 lettere           |                       |                     |
 +------------------------------------------------------------------------------------------+
```

- Hver linje er en kolonne med rækker sorteret efter D faldende, så trappen læses oppefra som "sværest". N-linjen står på samme x-position inden for hver kolonne og danner visuelt én gennemgående vandlinje.
- Linjens overskrift har en tynd fordelingsstreg (sikre/lave/ikke vurderede for alle registreringer i linjen). Det afslører mønstre som "forlæns ligger generelt lavt" uden ekstra tekst.
- Linjerne står i fast katalogrækkefølge, så træneren genkender placeringen fra gang til gang. Det, der springer i øjnene, findes i Fokus.
- Ingen kort. Kolonner adskilles af luft og en hårfin `--line`.
- Ved flere linjer end bredden kan rumme, ombrydes kolonnerne til en ny række. Intet ruller vandret.

### Vandstand

- Øverst står et søjlediagram over alle linjers synlige rækker, grupperet pr. linje i katalogrækkefølge og sorteret let → svær. Søjlehøjden er `kan` op til loftet N + 2, delt i sikre, lave og ikke vurderede.
- Et gennemsigtigt vandlag stiger op til N med en lysende overflade. Søjler over vandet lyser; søjler under vandet dæmpes af laget. Tæt på-søjler får et stiplet "mangler 1"-felt, og det sværeste niveauspring får mærket Niveau.
- Diagrammet er dekorativt for skærmlæsere (`aria-hidden`) med en synlig tekstopsummering ("x af y spring rager over vandlinjen"). Søjler kan trykkes med mus og åbner samme detaljepanel; tastatur bruger rækkerne. Under fremhævning dæmpes søjler uden gymnasten.

```
 390 px
 +----------------------------------+
 | Holdprofil       [Bane|Trampet]  |
 | Niveau: R-flik-1/1 · 2,80        |
 | Fokus  > R-flik-2/1 mangler 1  > |
 |----------------------------------|
 | (Rondat-flik) Whipback  Startsal |  <- klæbende linjefaner, hop til linje
 |----------------------------------|
 | Rondat-flik-2/1          3,60    |
 | ***o.|          Tæt på · 1       |
 | Rondat-flik-1/1          2,80    |
 | ******|*        Klar             |
 +----------------------------------+
```

- På mobil står linjerne under hinanden. Linjefanerne klæber øverst, hopper til linjen og følger med, mens der rulles. Navn og D står på første linje og prikbånd og status på anden. Touchmål er mindst 44 × 44.

### Holdets niveau og Fokus

- **Niveau** pr. disciplin er det sværeste Klar-spring i de stærkeste linjer (op til tre) efterfulgt af antallet af linjer med en Tæt på- eller Ustabil-række over niveauet. Uden Klar-spring står "Ingen spring med N sikre endnu".
- **Fokus** viser op til fem afledte iagttagelser i fast prioritet:
  1. Tæt på over linjens niveau.
  2. Ustabil over linjens niveau.
  3. Skrøbelig på linjens niveau.
  4. Linjer, hvor mindst halvdelen af de vurderede registreringer er lave.
  5. Mangler vurdering.

  Inden for hver prioritet sorteres efter D faldende. Et tryk ruller til rækken, åbner detaljepanelet og giver rækken en kort accentpuls. Formuleringerne er utility-tekst og ikke råd, fx "Rondat-flik-2/1 · mangler 1".

### Detaljepanel

- Desktop: et inspektørpanel i højre side, der glider ind over den yderste kolonne. Mobil: et bundark.
- Indhold: springnavn, retning, D, status forklaret i én sætning og navnene grupperet som Sikre (med værdi), Lave (med værdi), Ikke vurderet og Kan ikke endnu (aktive gymnaster uden registrering).
- Et tryk på et navn aktiverer fremhævning på tværs af profilen. Fremhævningen ophæves med Escape, et nyt tryk eller luk.
- Escape lukker panelet, og fokus vender tilbage til rækken.

### Status mod N

N = `springRules[discipline].participants.counting`. For hver identitet: `kan` = aktive gymnaster med anvendelig registrering, `sikre` = bedste sikkerhed 3–5, `lave` = 1–2, `uvurderede` = Ikke vurderet. Bedste registrering pr. gymnast følger `teamSkillRows`.

| Status | Betingelse |
|---|---|
| Klar | kan ≥ N og sikre ≥ N + 1 |
| Skrøbelig | kan ≥ N og sikre = N |
| Mangler vurdering | kan ≥ N, sikre < N og sikre + uvurderede ≥ N |
| Ustabil | kan ≥ N og sikre + uvurderede < N |
| Tæt på | kan = N − 1 |
| (nedtonet) | ellers |

"Mangler vurdering" er adskilt fra Ustabil, så en ikke-vurdering aldrig fremstår som lav sikkerhed.

### Relativ relevansregel

Inden for samme linje er række A overgået af række B, når:

- D(B) > D(A), og begge D er kendte,
- min(kan_B, N + 2) ≥ min(kan_A, N + 2), og
- min(sikre_B, N + 2) ≥ min(sikre_A, N + 2).

Overgåede rækker skjules under "+k lettere" i linjen. Rækker med ukendt D overgår aldrig og overgås aldrig. De står samlet nederst i linjen under "Uden kendt D". Spring med samme D skjuler aldrig hinanden, så alternativer bevares som inspiration.

*Alternativ: faste niveaugrænser for D.* De passer ikke til både et blandet og et stærkt hold og kræver opsætning. *Alternativ: hver gymnasts top-spring.* Det giver ikke trinene mellem, hvor holdtallet stiger. *Alternativ: regel på tværs af linjer.* Den ville skjule hele linjer, fx whipback bag flik, og fjerne inspirationen.

### Ren afledning

`team-profile-model.ts` eksporterer en ren funktion `teamProfile(workspace, teamId, discipline, rulePackage)`. Den returnerer N, linjer med synlige rækker, skjulte rækker, rækker uden kendt D, fordeling, niveau og fokuspunkter. Funktionen bygger på `teamSkillRows` med alle aktive gymnaster som ledige og på `skillFamily` af rækkens repræsentative definition. Siden memoiserer resultatet pr. arbejdsrumsversion og disciplin. Intet skrives til arbejdsrummet.

### Fælles data og fletning

Holdprofilen læser kun eksisterende registreringer, sikkerhed, arv, gymnaster og regelpakke. Den indfører ingen gemte felter, ændrer ikke betydningen af eksisterende data, sender ingen domænekommandoer og har ingen formularer. Disciplinvalg, udfoldning, panel og fremhævning er flygtig visningstilstand. Flettekontrakten og samtidighedstests er derfor uændrede. Efter en fletning genberegnes profilen fra det flettede arbejdsrum. Ingen flettedækning eller -politik skal ændres.

## Risks / Trade-offs

- [Relevansreglen skjuler et spring, der er nyttigt for retningsblandede omgange] → Reglen gælder kun inden for samme linje, og skjulte spring kan altid foldes ud med deres antal synligt.
- [Statusord kan læses som en dom] → Hver status har en forklarende sætning i panelet, og tallene står altid ved siden af.
- [Mange linjer og gymnaster giver tæthed] → Loft på N + 2 prikker med `+k`, ombrydning af kolonner på desktop og klæbende linjefaner på mobil.
- [`skillFamily` grupperer efter de første elementer, så fx rondat-flik-flik havner i Rondat-flik] → Det accepteres i første version. Linjeinddelingen ligger ét sted og kan forfines senere uden dataændring.
- [Animation virker forstyrrende ved hyppige skift] → Linjen trækkes kun ved åbning og disciplinskift, ikke ved fremhævning eller udfoldning. Alt slås fra ved `prefers-reduced-motion`.

## Open Questions

- Er loftet N + 2 rigtigt for Regionsrækken, hvor der må være op til 6 ekstra (`maxExtra: 6`)? Indtil videre bruges N + 2 for alle regelpakker.
- Skal rondat-flik-flik (og tilsvarende dobbelte indgange) være sin egen linje?
- Skal fanen hedde Holdprofil?
