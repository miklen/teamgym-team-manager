## ADDED Requirements

### Requirement: Holdprofilen er en afledt visning af holdets springfærdigheder
Systemet SHALL tilbyde en Holdprofil pr. hold for bane og trampet. Profilen SHALL kun bygge på holdets aktive, ikke-arkiverede gymnaster og deres aktive, anvendelige registreringer under holdets regelpakke. Registreringer SHALL grupperes efter regelpakkens springidentitet. Hver gymnast SHALL tælle én gang pr. identitet med sin bedste registrering efter højeste effektive sikkerhed, hvor Ikke vurderet rangerer lavest. Medtaget fundament med arvet sikkerhed SHALL tælle som enhver anden aktiv registrering, mens fravalgt fundament ikke tæller. Profilen MUST NOT gemme data, sende domænekommandoer eller ændre arbejdsrummet. Disciplinvalg, udfoldning, detaljepanel og fremhævning SHALL være flygtig visningstilstand. Rytme MUST NOT indgå.

#### Scenario: Én gymnast med flere registreringer af samme spring
- **WHEN** en gymnast har to registreringer med samme springidentitet vurderet henholdsvis 2 og 4
- **THEN** tæller gymnasten én gang for springet som sikker med 4

#### Scenario: Arvet fundament tæller
- **WHEN** en gymnast har Rondat-flik-1/1 med medtaget barn Rondat-flik med arvet sikkerhed 3, og en anden gymnast har fravalgt barnet
- **THEN** tæller den første gymnast som sikker på Rondat-flik, og den anden tæller ikke

#### Scenario: Visningen ændrer ikke arbejdsrummet
- **WHEN** træneren åbner Holdprofil, skifter disciplin, udfolder linjer, åbner detaljer og fremhæver en gymnast
- **THEN** er arbejdsrummet og gemmetilstanden uændrede

### Requirement: Holdomgangens krav læses fra regelpakken
Grænsen N SHALL være regelpakkens `participants.counting` for den valgte disciplin. Profilen MUST NOT have en fast talværdi for N. Loftet for sammenligning og visning SHALL være N + 2 for alle regelpakker.

#### Scenario: Grænse fra holdets regelpakke
- **WHEN** holdets regelpakke angiver 6 tællende gymnaster for bane
- **THEN** står N-linjen efter sjette plads, og statusser beregnes mod 6

### Requirement: Sikkerhedsfordeling pr. spring uden sandsynlighed
For hver identitet SHALL profilen vise D under holdets regelpakke, antal der kan springet, antal sikre (3–5), antal lave (1–2) og antal Ikke vurderet. Ikke vurderet MUST NOT tælles som sikker eller lav eller erstattes af et tal. Profilen MUST NOT vise sandsynligheder, gennemsnit som chance eller samlede succesrater.

#### Scenario: Blandet sikkerhed
- **WHEN** 8 gymnaster kan et spring med sikkerhederne 5, 4, 4, 3, 2, 1, 1 og Ikke vurderet
- **THEN** vises kan 8, sikre 4, lave 3 og 1 ikke vurderet

### Requirement: Status i forhold til holdomgangens krav
Hver række SHALL have én status, beregnet i denne rækkefølge:

1. Klar: kan ≥ N og sikre ≥ N + 1.
2. Skrøbelig: kan ≥ N og sikre = N.
3. Mangler vurdering: kan ≥ N, sikre < N og sikre + Ikke vurderet ≥ N.
4. Ustabil: kan ≥ N og sikre + Ikke vurderet < N.
5. Tæt på: kan = N − 1.

Alle andre rækker SHALL nedtones uden status. Status SHALL vises som tekst og MUST NOT bæres af farve alene. Tæt på SHALL angive, at der mangler 1. Ustabil SHALL angive antallet af lave.

#### Scenario: Seks kan, to lave
- **WHEN** N er 6, og 6 gymnaster kan et spring, heraf 4 sikre og 2 lave
- **THEN** er status Ustabil · 2 lave

#### Scenario: Præcis N sikre
- **WHEN** N er 6, og 6 gymnaster kan springet, alle sikre
- **THEN** er status Skrøbelig

#### Scenario: Margin
- **WHEN** N er 6, og 7 gymnaster kan springet, alle sikre
- **THEN** er status Klar

#### Scenario: Én mangler
- **WHEN** N er 6, og 5 gymnaster kan springet
- **THEN** er status Tæt på · mangler 1

#### Scenario: Mangel skyldes kun manglende vurdering
- **WHEN** N er 6, og 6 gymnaster kan springet, heraf 4 sikre og 2 Ikke vurderet
- **THEN** er status Mangler vurdering og ikke Ustabil

### Requirement: Springene vises som trapper pr. linje
Profilen SHALL inddele identiteterne i linjer efter den fælles springfamilie for repræsentative definitioner og vise linjerne i fast rækkefølge. Inden for en linje SHALL rækkerne sorteres efter D faldende og derefter efter navn. Spring med samme D SHALL begge vises. Hver linjes overskrift SHALL vise fordelingen af sikre, lave og Ikke vurderet for linjens synlige og skjulte rækker. Navne SHALL følge den fælles navnegrammatik.

#### Scenario: Sværeste øverst
- **WHEN** Rondat-flik-linjen indeholder Rondat-flik-salto strakt, Rondat-flik-1/1 og Rondat-flik-2/1
- **THEN** står Rondat-flik-2/1 øverst og Rondat-flik-salto strakt nederst blandt de synlige rækker

### Requirement: Relativ relevans skjuler overgåede spring inden for en linje
En række A SHALL skjules som overgået, når en anden række B i samme linje har højere kendt D, og både min(kan, N + 2) og min(sikre, N + 2) for B er mindst lige så høje som for A. Rækker med ukendt D MUST NOT overgå eller overgås. De SHALL vises samlet nederst i linjen under Uden kendt D. Overgåede rækker SHALL samles under en udfoldelig handling med antallet, fx "+4 lettere", og kunne vises på stedet. Spring i forskellige linjer MUST NOT skjule hinanden.

#### Scenario: Stærkt hold skjuler lette saltoer
- **WHEN** N er 6, 8 gymnaster kan et svært spring med 8 sikre, og 10 gymnaster kan en lettere salto i samme linje med 10 sikre
- **THEN** er saltoen skjult, fordi begge tal er beskåret til 8

#### Scenario: Blandet hold bevarer trappen
- **WHEN** i samme linje 2 kan Rondat-flik-2/1, 4 kan Rondat-flik-1/1 og 9 kan Rondat-flik
- **THEN** vises alle tre, fordi hvert lettere trin kendes af flere

#### Scenario: Udfold skjulte
- **WHEN** træneren vælger "+4 lettere" i en linje
- **THEN** vises de fire overgåede rækker i linjen med deres tal og status, og handlingen kan skjule dem igen

#### Scenario: Ukendt D
- **WHEN** et registreret spring ikke har kendt D under holdets regelpakke
- **THEN** står det under Uden kendt D i sin linje og påvirker ikke hvilke andre rækker der skjules

### Requirement: Prikbånd med N-linje
Hver række SHALL vise et prikbånd med én prik pr. gymnast, der kan springet, i rækkefølgen sikre, lave og Ikke vurderet. Tomme pladser op til N SHALL vises som stiplede pladser. En gennemgående N-linje SHALL stå efter plads N på samme position i alle rækker i en linje. Højst N + 2 prikker SHALL vises, og et overskud SHALL vises som +k. Sikre, lave, Ikke vurderet og tomme pladser SHALL kunne skelnes ved form og ikke kun farve. Prikbåndet SHALL have en tilgængelig tekst med navn, D, tal og status.

#### Scenario: Tæt på ser ud som en manglende plads
- **WHEN** N er 6, og 5 gymnaster kan et spring
- **THEN** viser båndet fem prikker og én tom stiplet plads før N-linjen

### Requirement: Holdets niveau og fokuspunkter
Profilen SHALL pr. disciplin vise holdets niveau som det sværeste Klar-spring i op til tre linjer samt antallet af linjer med en Tæt på- eller Ustabil-række over linjens niveau. Uden Klar-spring SHALL profilen sige det tydeligt. Profilen SHALL vise op til fem fokuspunkter i denne prioritet:

1. Tæt på over linjens niveau.
2. Ustabil over linjens niveau.
3. Skrøbelig på linjens niveau.
4. En linje, hvor mindst halvdelen af de vurderede registreringer er lave.
5. Mangler vurdering.

Inden for hver prioritet sorteres efter D faldende. Et fokuspunkt SHALL bringe den relevante række eller linje i syne og åbne dens detaljer. Tekster SHALL beskrive tilstanden og MUST NOT give træningsråd.

#### Scenario: Fokus på det nærmeste trin
- **WHEN** Rondat-flik-linjens sværeste Klar-spring er Rondat-flik-1/1, og Rondat-flik-2/1 er Tæt på
- **THEN** står "Rondat-flik-2/1 · mangler 1" som første fokuspunkt, og valget viser rækken med dens detaljer

#### Scenario: Linje med lav sikkerhed
- **WHEN** halvdelen af de vurderede registreringer i Startsalto · forlæns er 1–2
- **THEN** viser Fokus linjen med teksten om lav sikkerhed i linjen

### Requirement: Detaljer og navne bag en række
Valg af en række SHALL åbne detaljer med springnavn, retning, D, status forklaret i én sætning og holdets aktive gymnaster grupperet som Sikre med værdi, Lave med værdi, Ikke vurderet og Kan ikke endnu. Detaljerne SHALL kunne lukkes med Escape og Luk, og fokus SHALL vende tilbage til rækken. På smalle skærme SHALL detaljerne være et bundark.

#### Scenario: Hvem er de lave
- **WHEN** træneren vælger en Ustabil række
- **THEN** viser detaljerne navnene på de lave gymnaster med deres sikkerhed

### Requirement: Fremhævning af en gymnast på tværs af profilen
Valg af en gymnast i detaljerne SHALL fremhæve den gymnasts prikker i alle synlige rækker i den valgte disciplin og dæmpe de øvrige prikker. Fremhævningen SHALL have en synlig betegnelse med navnet og kunne ophæves med Escape, et nyt valg eller Luk. Fremhævningen MUST NOT ændre tal, status eller hvilke rækker der er skjult.

#### Scenario: Nøglegymnast
- **WHEN** træneren fremhæver en gymnast
- **THEN** kan træneren se alle synlige spring, hvor gymnasten indgår, mens tal og status er uændrede

### Requirement: Layout, bevægelse og tilgængelighed
Øverst SHALL en Vandstand vise alle linjers synlige rækker som søjler, hvor højden er `kan` op til loftet, og en lysende vandlinje ved N skiller spring, der kan bære en holdomgang, fra resten. Vandstanden er en ren visning af de samme tal som rækkerne; den SHALL have en tekstopsummering, og søjlerne MUST NOT være eneste vej til en række. Ved brede skærme SHALL linjerne stå som kolonner side om side og ombrydes til nye rækker ved overskud. Profilen MUST NOT rulle vandret. Ved 390 px SHALL linjerne stå under hinanden med klæbende linjefaner, der springer til linjen, hvor navn og D står over prikbånd og status. Profilen SHALL følge appens visuelle system med én accentfarve for N-linjen og sikre prikker og den eksisterende ravfarve for lave og advarende status. Den MUST NOT bruge en mosaik af kort. Ved åbning og disciplinskift SHALL N-linjen og prikkerne animeres kortvarigt ind. Udfoldning SHALL ske på stedet. Al bevægelse SHALL slås fra ved `prefers-reduced-motion`. Disciplinvalg, linjefaner, rækker, udfoldning og fokuspunkter SHALL kunne betjenes med tastatur. Touchmål SHALL være mindst 44 × 44 CSS-pixel, og intet SHALL afhænge af hover.

#### Scenario: Mobil
- **WHEN** profilen vises ved 390 px med flere linjer
- **THEN** kan træneren springe til en linje med fanerne, og siden har ingen vandret overflow

#### Scenario: Reduceret bevægelse
- **WHEN** brugeren har slået reduceret bevægelse til
- **THEN** vises N-linje, prikker og udfoldning uden animation

### Requirement: Tomme og ufuldstændige tilstande
Profilen SHALL forklare, når holdet ikke har aktive gymnaster, når disciplinen ikke har registrerede spring, og når ingen spring er Klar, med en vej til Gymnaster. Holdprofilen SHALL fungere i læsetilstand og efter fletning med de aktuelle data.

#### Scenario: Ingen registrerede spring på trampet
- **WHEN** holdet har gymnaster, men ingen registrerede trampetspring
- **THEN** viser Trampet en tom tilstand med en henvisning til at registrere spring under Gymnaster
