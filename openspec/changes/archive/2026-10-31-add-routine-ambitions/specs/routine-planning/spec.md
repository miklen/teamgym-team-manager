## MODIFIED Requirements

### Requirement: Gymnaster og kendte færdigheder vælges sammen
En omgangsplads SHALL enten vælge et aktivt holdmedlem og en af gymnastens registrerede anvendelige færdigheder i den pågældende disciplin eller være en ambition med et valgt spring og uden gymnast efter kravene til ambitioner. Hver valgmulighed for en gymnast SHALL før valg vise præcist springnavn, relevant saltoretning, springets egen D under holdets regelpakke og gymnastens effektive sikkerhed eller Ikke vurderet. Afledte registreringer SHALL kunne vælges på samme grundlag som egne, når de er aktive og anvendelige. Systemet MUST forhindre samme gymnast på flere pladser samlet blandt deltagere og reserver i samme omgang i samme scenarie, men SHALL tillade deltagelse og reservestatus i flere forskellige omgange og scenarier og forskellig gymnastbesætning mellem omgange. Ambitioner uden gymnast SHALL ikke indgå i denne unikhedskontrol.

#### Scenario: Samme gymnast i flere omgange
- **WHEN** en gymnast vælges i baneomgang 1 og 3
- **THEN** er det tilladt, mens et andet valg af samme gymnast som deltager eller reserve i omgang 1 i samme scenarie afvises.

#### Scenario: Ingen registrerede spring
- **WHEN** et holdmedlem uden registrerede baneserier vælges til en baneplads
- **THEN** vises en uafklaret plads og en direkte vej til færdighedsregistrering; appen opfinder eller tildeler ikke et spring.

#### Scenario: Sammenlign sikkerhed og D før valg
- **WHEN** træneren åbner gymnastens springvalg på en omgangsplads
- **THEN** kan spring med D 0,80 og sikkerhed 5 sammenlignes med spring med D 1,00 og sikkerhed 2 direkte blandt mulighederne uden at gemme et midlertidigt valg først.

#### Scenario: Samme gymnast i alternative planer
- **WHEN** en gymnast deltager i Plan A og er reserve i samme omgangsnummer i Plan B
- **THEN** er begge valg tilladt og uafhængige.

#### Scenario: Flere ambitioner med samme spring
- **WHEN** træneren opretter to ambitioner med samme spring i samme omgang
- **THEN** er det tilladt, fordi ingen gymnast endnu er valgt.

### Requirement: Ufuldstændighed er forskellig fra fradrag
En tom plads, et manglende valg eller en ambition uden gymnast SHALL vises som en planlægningsmangel og MUST NOT automatisk fortolkes som et faktisk gennemløb, et bestemt udførelsesfradrag eller en fuld godkendt opstilling. Kendte delresultater SHALL kunne vises med tydeligt beregningsgrundlag. En ambition SHALL vises som Mangler gymnast, mens dens spring indgår i D og C som planlagt spring.

#### Scenario: Fem udfyldte pladser
- **WHEN** kun fem tællende gymnaster er valgt
- **THEN** viser appen de kendte værdier og den manglende plads og bruger ikke en skjult antagelse om den sjette gymnasts udførelse.

#### Scenario: Fem besatte og én ambition
- **WHEN** en omgang har fem besatte tællende pladser og én tællende ambition med kendt D
- **THEN** viser omgangen den samlede D for alle seks spring og status Mangler gymnast for én plads, uden at omgangen fremstår som gennemført.

### Requirement: Søgbart visuelt springvalg
Springvalget på en omgangsplads SHALL vise mulighederne i adskilte rækker med navn, saltoretning, D og sikkerhed som særskilte visuelle oplysninger. For en gymnast er mulighederne de registrerede, og for en ambition er de disciplinens springkatalog med Ingen gymnast i stedet for sikkerhed. Desktop SHALL bruge faste sammenlignelige kolonner, og mobil SHALL bevare oplysningerne uden vandret overflow. Sikkerhed SHALL bruge fem trin og en talværdi med tilgængelig forklaring ved Ikke vurderet. Listen SHALL kunne søges, betjenes med pile/Home/End/Enter og lukkes med Escape uden at lukke omgangspladsens dialog. Valg SHALL bevares ved lukning af listen, og et skift af gymnast, herunder til eller fra Ingen gymnast endnu, SHALL nulstille springvalget. Vælg senere SHALL tillade en plads med gymnast uden spring. Planen MUST NOT ændres før Opdater.

#### Scenario: Søg og vælg med tastatur
- **WHEN** træneren søger en registreret variant, flytter det aktive valg og trykker Enter
- **THEN** lukkes listen med fokus på springfeltet, og feltet viser valgt navn, D og sikkerhed uden en lang sammenhængende optiontekst.

#### Scenario: Skift gymnast og annullér
- **WHEN** træneren vælger et spring, skifter til en anden gymnast og lukker dialogen
- **THEN** viser listen kun den nye gymnasts anvendelige spring, det tidligere valg er nulstillet, og den gemte plan er uændret.

#### Scenario: Skift til Ingen gymnast endnu
- **WHEN** træneren har valgt en gymnasts spring og skifter til Ingen gymnast endnu
- **THEN** nulstilles springvalget, og listen viser disciplinens katalog.

### Requirement: Konkrete forslag ændrer kun deres eget scenarie
Et potentialeforslag SHALL vise målscenariet og være bundet til den opstilling og det arbejdsrumsgrundlag, det blev beregnet for. Et forældet forslag eller et forslag til et andet scenarie MUST NOT kunne anvendes som ændring af den viste plan. Anvendelse SHALL kun ændre målscenariets udførende opstillinger og bevare andre scenarier og fælles registreringer. Reserver SHALL bevares, bortset fra at en reserve, som forslaget gør udførende i samme omgang, SHALL fjernes fra netop den reserveliste med synlig angivelse i forhåndsvisningen. Udgående deltagere MUST NOT automatisk blive reserver. Ambitionspladser SHALL behandles som faste; et forslag MUST NOT besætte, ændre eller fjerne dem, og et forslag, der ville udskifte en omgang med ambitioner, MUST NOT tilbydes. Når det udelukker forslag, SHALL årsagen vises.

#### Scenario: Forslag bruger en reserve som udførende
- **WHEN** et konkret forslag til Plan B gør en af anden omgangs reserver til tællende deltager
- **THEN** vises ændringen af både deltagere og reserveliste før anvendelse, og øvrige omganges reserver samt Plan A bevares.

#### Scenario: Planen ændres efter forslag
- **WHEN** træneren redigerer arbejdsrummet efter at have åbnet et forslag
- **THEN** afvises anvendelsen med besked om at beregne igen, uden at overskrive de nyere ændringer.

#### Scenario: Omgang med ambitioner
- **WHEN** et tillæg kun kan opnås ved at udskifte en omgang, der indeholder en ambition
- **THEN** tilbydes intet konkret forslag, og tillægget forklarer, at forslag ikke udskifter omgange med ambitioner.
