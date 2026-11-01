## ADDED Requirements

### Requirement: Fælles navnegrammatik for spring
Alle spring på bane og trampet SHALL navngives af én fælles grammatik ud fra den præcise udførelse. Elementerne i en baneserie SHALL forbindes med " – ", og navnet SHALL begynde med stort bogstav. Grammatikken SHALL bruge:
- Faste elementer: rondat, flik, whipback, kraftspring, flyvespring, vejrmølle, overslag og mølleoverslag.
- Salto uden skrue: rotation og kropsposition efterfulgt af "salto", fx "lukket salto", "strakt salto" og "dobbelt hoftebøjet salto". Forskellige kropspositioner i en dobbelt vises i rækkefølge, fx "dobbelt lukket → strakt salto".
- Forlæns enkeltsalto med 1, 3, 5 eller 7 halve skruer: kaldenavnet barani, rudy, randy eller addy efterfulgt af kropsposition og grader i parentes, fx "barani (strakt 180°)", "barani (lukket 180°)" og "rudy (strakt 540°)".
- Øvrige skruede saltoer: rotation, kropsposition, skruebrøk og grader i parentes, fx "strakt 1/2 (180°)", "strakt 1/1 (360°)", "strakt 1½ (540°)", "strakt 2/1 (720°)" og "dobbelt lukket 1/2 (180°)". En kendt skruefordeling i en dobbelt SHALL tilføjes som " · 0° + 180°".
- Overslag-salto og Tsukahara på trampet: "overslag" eller "tsukahara" foran saltoens navn, fx "overslag barani (strakt 180°)" og "tsukahara strakt 1/1 (360°)".
- Retning: "forlæns" eller "baglæns" SHALL tilføjes efter et saltonavn, når retningen afviger fra den forventede. En serie, der starter med en salto, og en salto efter kraftspring, flyvespring eller en forlæns salto forventes forlæns. En salto efter rondat, flik, whipback eller en baglæns salto forventes baglæns. Trampetsaltoer forventes forlæns, og Tsukahara forventes baglæns.

Bibliotek, fundament, præcise kortere serier, Byg selv og nye registreringer SHALL bruge samme grammatik. Navnet MUST NOT ændre identitet, D, officielle koder, kildebytes eller point.

#### Scenario: Kraft-barani med og uden indgang
- **WHEN** træneren ser Kraftspring–barani og Strakt salto–kraftspring–barani i biblioteket, som fundament og på en gymnast
- **THEN** vises de alle steder som "Kraftspring – barani (strakt 180°)" og "Strakt salto – kraftspring – barani (strakt 180°)".

#### Scenario: Kortere serie og fundament har samme navn som biblioteket
- **WHEN** Rondat–flik–strakt helskrue vælges med automatisk fundament
- **THEN** vises fundamentet blandt andet som "Rondat – flik" og "Rondat – flik – lukket salto", altså samme navne som de tilsvarende biblioteksvalg, uden grader på saltoer uden skrue og uden retning, når den er den forventede.

#### Scenario: Afvigende retning er en del af navnet
- **WHEN** biblioteket viser rondat–lukket salto baglæns–strakt salto forlæns og rondat–lukket salto baglæns–strakt salto baglæns
- **THEN** hedder de "Rondat – lukket salto – strakt salto forlæns" og "Rondat – lukket salto – strakt salto", og saltoretningerne vises fortsat særskilt for hver salto.

#### Scenario: Trampet følger samme grammatik
- **WHEN** træneren ser strakt forlæns salto med 540° uden redskab og forlæns dobbelt lukket med 180° og fordeling [0,1]
- **THEN** vises de som "Rudy (strakt 540°)" og "Dobbelt lukket 1/2 (180°) · 0° + 180°".

### Requirement: Gennemgang af fundamentkataloget
Projektet SHALL have en lokal gennemgangsrapport af det aktuelle trænerfaglige fundamentkatalog for DK-regelpakken, genereret med `npm run report:fundament` til en fil uden for Git. Rapporten SHALL for hvert biblioteksspring vise medfølgende fundament som træ med fælles navn, D, relationens danske navn, kæden af relationer og fundament, der kræver afklaring af skruefordeling. Rapporten SHALL også have en oversigt pr. relationstype med en kort dansk forklaring og alle konkrete kilde → fundament-par. Kun relationer, der faktisk forekommer, SHALL vises, og katalogversionen SHALL fremgå. Rapporten SHALL bruge præcis samme fundamentberegning som registreringen. Kataloget MUST NOT vises i appen for trænerteamet.

#### Scenario: Hvad giver rondat-flik-helskrue
- **WHEN** rapporten viser Rondat – flik – strakt 1/1 (360°)
- **THEN** står Rondat, Rondat – flik og samme indgang med lukket, hoftebøjet og strakt salto hver én gang med relationsnavn og D.

#### Scenario: Transitiv kæde er synlig
- **WHEN** rapporten viser Strakt salto – rondat – flik – strakt 1/1 (360°)
- **THEN** står Rondat – flik – strakt 1/1 (360°) som "uden indgangssalto", og dennes fundament står under den med den samlede kæde af relationer.

#### Scenario: Oversigt pr. relationstype
- **WHEN** rapporten viser relationstypen for forlæns udviklingskæde
- **THEN** står alle bibliotekets konkrete par, fx Kraftspring – randy (strakt 900°) → Kraftspring – rudy (strakt 540°), sorteret efter kildens navn.

### Requirement: Holdets kendte spring først
Springvælgeren SHALL vise biblioteksvalg, som andre aktive gymnaster på samme hold har aktivt registreret, før øvrige biblioteksvalg. Rækken SHALL vise antallet, fx "Kendt af 3 på holdet". Ved registrering på en gymnast SHALL holdet være gymnastens hold, og ved ambitioner holdet for planen. En gymnast uden hold eller et hold uden registreringer SHALL give den almindelige rækkefølge. Direkte valg og deres fundament SHALL fortsat stå øverst. Med søgetekst SHALL søgerangen gå forud, og holdkendskab SHALL kun afgøre rækkefølgen ved lige rang. Tallet SHALL afledes ved visning og MUST NOT gemmes eller vise navne på andre gymnaster.

#### Scenario: Holdets serier først
- **WHEN** to andre gymnaster på holdet har Rondat – flik – strakt 1/2 (180°) registreret, og træneren åbner vælgeren uden søgetekst for en ny gymnast
- **THEN** står denne serie før de øvrige biblioteksvalg med "Kendt af 2 på holdet".

#### Scenario: Andet hold påvirker ikke rækkefølgen
- **WHEN** springet kun er registreret på gymnaster fra et andet hold
- **THEN** får det ingen holdmarkering og ingen fortrinsplads.

### Requirement: Sammenhængende forløb fra søgning til valg og vurdering
Springvælgeren SHALL vise forløbet som to nummererede trin: "Find springet" med søgning, kædebygger og et sammenfoldet D-filter, og "Vælg og vurdér sikkerhed" med den afgrænsede liste. På brede skærme SHALL trinene stå side om side, så listen ændrer sig synligt ved siden af afgrænsningen. På smalle skærme SHALL en knap med antallet af passende spring føre direkte ned til listen. Hver række SHALL have sikkerhedsknapper 1–5, hvor ét tryk vælger springet med den vurdering, og en knap til at vælge uden vurdering. Vælgeren MUST NOT bruge afkrydsningsfelter til at vælge spring. Fundament SHALL stå indrykket under det valgte spring med Arvet, 1–5 og fravalg på samme række. Valgte spring SHALL kunne vises for sig i en visning ved siden af resultaterne. Automatisk medtagelse af fundament SHALL være en forklaret kontakt, som kun vises, når der er valgt spring. Under listen SHALL vælgeren føre til Byg selv, og kædens sammenhængende, entydige valg fra første plads SHALL lægges ind som start i Byg selv. Forløbet ændrer ikke gemte felter.

#### Scenario: Vælg og vurdér i ét tryk
- **WHEN** træneren har afgrænset listen med kæden og trykker 4 på rækken Rondat – flik – strakt 1/1 (360°)
- **THEN** er springet valgt med sikkerhed 4, og dets fundament vises indrykket under det med Arvet 4/5.

#### Scenario: Springet findes ikke
- **WHEN** træneren har valgt Rondat i kæden og trykker Byg det selv
- **THEN** åbner Byg selv med rondat som første element.

#### Scenario: Smal skærm
- **WHEN** træneren afgrænser med kæden på en 390 px bred skærm
- **THEN** viser knappen "Vis N spring" antallet og fører ned til listen uden vandret siderulning.

## MODIFIED Requirements

### Requirement: Konsistente visningsnavne for spring
Navne og aliaser SHALL følge samme præcise udførelse og den fælles navnegrammatik på tværs af bibliotek, fundament, gymnastoverblik, Springplan, ambitioner, reserver, fundamentkataloget og ændringsgennemgang. Skrueantal i grader SHALL vises med gradtegn på både bane og trampet. Den strakte forlæns enkeltsalto med 540° SHALL kunne findes som rudy og rudi og vises med både dagligt navn og præcis beskrivelse. Et gemt navn, der svarer til et nuværende eller tidligere automatisk navn for samme udførelse, SHALL vises med det fælles navn. Et selvvalgt navn, der ikke er et automatisk navn, SHALL vises uændret, med saltoretningerne synlige. Visningsændringer MUST NOT ændre identitet, gemte navne, officielle koder, kildebytes eller point.

#### Scenario: Rudy på begge discipliner
- **WHEN** træneren søger rudy eller rudi på bane og trampet
- **THEN** findes de relevante udførelser, og trampetvarianten vises som Rudy (strakt 540°) med synlig retning og uden ny færdighedsidentitet.

#### Scenario: Gemt automatisk navn uden grader
- **WHEN** en fil indeholder en definition af strakt salto–kraftspring–barani med det tidligere automatiske navn "Strakt – kraftspring – barani"
- **THEN** vises den overalt som "Strakt salto – kraftspring – barani (strakt 180°)", og filens gemte navn er uændret, indtil definitionen selv redigeres.

#### Scenario: Selvvalgt navn bevares
- **WHEN** en egen serie er gemt med navnet "Lines konkurrenceserie"
- **THEN** vises dette navn med saltoretninger i alle visninger, og serien kan stadig findes via sin udførelse.

### Requirement: Søgning efter seriens begyndelse
Springvælgeren SHALL prioritere præcise navne og sammenhængende begyndelser før løse ord i vilkårlig rækkefølge. Bindestreger, tankestreger og mellemrum SHALL behandles ens. Søgning SHALL matche springets strukturerede udførelse og ikke kun navn og aliaser, så en egen navngiven serie også kan findes via sin udførelse. Søgeord SHALL normaliseres gennem en fast synonymtabel, hvor mindst følgende betyder det samme:
- 1/2, halv, halvskrue og 180
- 1/1, hel, helskrue og 360
- 1½, 1.5, halvanden og 540
- 2/1, dobbeltskrue og 720
- 2½ og 900
- kraft og kraftspring
- lukket og tuck, hofte, hoftebøjet og pike, samt strakt og straight
- forlæns, forlænder og front, samt baglæns, baglænder og back
- RF og rondat flik
- DB og dobbelt baglæns

Barani, rudy, randy og addy SHALL matche den tilsvarende forlæns udførelse. Tal uden gradtegn SHALL matche grader. Synonymer MUST NOT matche en anden retning, kropsposition eller et andet skrueantal end ordet betyder. Søgning og filterændring SHALL vise listen fra toppen. Aktive filtre og trin SHALL kunne ryddes med Søg i alle spring uden tab af søgetekst eller valgte spring.

#### Scenario: Søg strakt rondat
- **WHEN** træneren skriver strakt rondat efter at have rullet ned i listen
- **THEN** vises Strakt salto – rondat og Strakt salto – rondat – flik øverst før Rondat – flik med strakt afslutning, og tidligere valg forbliver tilgængelige i samme liste.

#### Scenario: Samme skrue med forskellige ord
- **WHEN** træneren søger "rf 1/1", "rondat flik hel" eller "rondat flik 360"
- **THEN** står Rondat – flik – strakt 1/1 (360°) først i alle tre tilfælde, og ingen serie med 1/2 eller 1½ skrue regnes som match på skrueordet.

#### Scenario: Kraft barani
- **WHEN** træneren søger "kraft barani"
- **THEN** findes Kraftspring – barani (strakt 180°) som bedste match, også når en gymnast i arbejdsrummet har samme udførelse gemt under et tidligere automatisk navn.

### Requirement: Én samlet springvælger uden gentagelser
Bibliotek, direkte valg og medtaget eller fravalgt fundament SHALL vises i samme vælger med én række pr. præcis udførelse. En færdighed MUST NOT samtidig optræde som et almindeligt katalogvalg og i en separat fundament-/valgblok. Sikkerhed, ophav, fravalg og skrueafklaring SHALL betjenes på den præcise udførelses række. Direkte valg og deres fundament SHALL stå øverst uden søgetekst og forblive tilgængelige gennem søgning, kædevalg, minimum-D og skift mellem discipliner. Med søgetekst SHALL de bedste match stå først, mens tidligere valg bevares. Visningen Valgte SHALL afgrænse den samme liste. En upræciseret katalogskabelon SHALL erstattes af det præciserede valg. Forskellige præcise skruefordelinger SHALL fortsat bevares som forskellige udførelser. Byg selv SHALL anvende samme samlede rækkevisning uden en ekstra gentagelse af den valgte hele serie.

#### Scenario: Et fundament findes også i biblioteket
- **WHEN** helskrueserien vælges, og rondat-flik medtages som fundament og også findes som katalogvalg
- **THEN** vises rondat-flik på én række i den fælles vælger, hvor træneren kan fravælge det eller give egen vurdering.

#### Scenario: Et direkte valg bliver også fundament
- **WHEN** rondat-flik først vælges med egen sikkerhed 2, og en helskrueserie derefter vælges med sikkerhed 5
- **THEN** vises rondat-flik fortsat én gang med den direkte vurdering 2. Fjernes det direkte valg, kan samme række vise fravalg af fundamentet uden at gentage springet.

### Requirement: Grupperet valg og færdighedsoverblik
Gymnastoverblikket SHALL bruge sammenhængende familier efter baneindgang og efter trampetredskab, springfamilie og enkelt/dobbelt rotation med synlige gruppetællinger og udfoldelige relationer. Springvælgeren SHALL i stedet for en gruppeliste tilbyde en visuel kædebygger. På bane SHALL hver plads i serien og en særskilt plads "Slutter med" kunne låses til en elementtype, fx Rondat, Flik eller Strakt salto, og præciseres til en variant, fx Strakt 1/1 (360°). En plads SHALL kunne vælges uden at udfylde de foregående. Hver plads SHALL kun tilbyde valg med mindst ét match under de øvrige pladsers valg og vise antallet. På trampet vælges redskab og springtype. Pladser SHALL kunne ryddes enkeltvis og kombineres med søgetekst og minimum-D. Kun næsten umulige indbyggede serier efter den trænergodkendte tabel, dvs. baneserier der starter med en dobbeltsalto og en baglæns salto direkte efter en forlæns salto, SHALL hverken vises i kæden eller ved søgning og bygges i stedet med Byg selv. Egne serier, valgte spring og fundament SHALL altid vises. Biblioteket SHALL efter en forlæns startsalto, herunder strakt 1/1 (360°), tilbyde rondat, kraftspring og flyvespring, give kraftspring og flyvespring samme afslutninger, tilbyde både flik og whipback efter rondat og tilbyde dobbeltsaltoer med regelpakkens tilladte skruer. På desktop SHALL spring, D og sikkerhed stå i faste, sammenlignelige kolonner med kompakte rækker. Mobilvisningen SHALL bevare navn, præcis retning, D, sikkerhed og handlinger uden vandret siderulning. Små repertoirer SHALL være overskuelige uden unødvendig nesting, og store repertoirer SHALL kunne søges og afgrænses uden at åbne hver færdighed. Søgning SHALL synliggøre et match i en sammenfoldet familie og dets kontekst. Alle udfoldninger, kædepladser, valg og vurderinger SHALL kunne betjenes med tastatur.

#### Scenario: Stort syntetisk repertoire
- **WHEN** en syntetisk gymnast har 120 aktive færdigheder fordelt på bane, trampet og rytme
- **THEN** kan træneren finde en bestemt variant gennem søgning eller kædebyggeren, aflæse D og sikkerhed og redigere vurderingen uden at gennemgå alle rækker.

#### Scenario: Kæde til en baneserie
- **WHEN** træneren vælger Rondat på første plads og Flik på anden
- **THEN** viser listen kun typiske serier, der begynder med rondat–flik, og tredje plads tilbyder lukket, hoftebøjet og strakt salto samt dobbeltsaltoer med antal.

#### Scenario: Spring frem i kæden
- **WHEN** træneren har Rondat og Flik og vælger Strakt salto som tredje led
- **THEN** vises alle rondat–flik-serier med strakt salto på tredje plads, fra strakt salto til 2/1 (720°), og varianten kan præciseres med ét klik.

#### Scenario: Typiske kæder
- **WHEN** træneren vælger Strakt salto på første plads
- **THEN** tilbyder anden plads Rondat, Kraftspring og Flyvespring, og efter Rondat tilbydes både Flik og Whipback.

#### Scenario: Dobbeltsalto med skrue
- **WHEN** træneren har Rondat og Flik og vælger Dobbelt strakt på tredje plads
- **THEN** kan varianten præciseres til fx dobbelt strakt 1/1 (360°) som ved enkeltsaltoer.

#### Scenario: Næsten umulig serie uden for listen
- **WHEN** træneren søger efter en serie, der starter med en dobbeltsalto
- **THEN** findes den ikke i listen, og den kan bygges med Byg selv; en egen serie bygget på den måde vises derefter i listen.

#### Scenario: Ryd en plads
- **WHEN** træneren rydder pladsen med Flik og beholder Rondat
- **THEN** udvides listen til alle typiske serier, der begynder med rondat, uden tab af søgetekst eller valgte spring.
