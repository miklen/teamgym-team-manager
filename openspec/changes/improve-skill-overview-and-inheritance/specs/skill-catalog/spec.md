# Spec Delta

## MODIFIED Requirements

### Requirement: Kortere begyndelser af en registreret serie
Ved registrering af komplette baneserier SHALL de præcise kortere serier fra samme begyndelse være medtaget som standard og vises før registrering. Træneren SHALL kunne fravælge hver enkelt. Rondat-flik-1/1 SHALL således medtage rondat og rondat-flik med samme sikkerhed og dato. Kandidatkilder SHALL være aktive, direkte valgte registreringer med en accepteret relation til barnet; automatisk oprettede børn MUST NOT blive nye selvstændige kilder uden et senere direkte valg med gennemgang af deres fundament. Deles en afledt færdighed af flere sådanne kilder, SHALL den vises én gang under kilden med lavest kendt D i det aktuelle holds regelpakke. Ved samme D bruges laveste sikkerhed, hvor Ikke vurderet rangerer før vurderinger, og derefter en stabil identitetsrækkefølge. Direkte angivne vurderinger SHALL have forrang. Andre positioner og færre skruer SHALL kun afledes gennem de specificerede trænerfaglige relationer. Systemet MUST NOT danne nye forbindelser ved at kombinere løse færdighedsregistreringer. Nye afledte vurderinger SHALL følge deres kilde løbende efter kravene til stabilitetsarv; eksisterende egne vurderinger, id'er, noter og arkiveringsvalg SHALL bevares.

#### Scenario: Helskrueserie giver kortere begyndelser
- **WHEN** rondat-flik-strakt helskrue registreres med sikkerhed 4 og automatisk medtagning
- **THEN** medtages rondat, rondat-flik og samme indgang med lukket, hoftebøjet og strakt baglæns salto uden skrue, hver én gang med sikkerhed 4, med mulighed for individuelt fravalg før registrering.

#### Scenario: Arv følger laveste sværhed
- **WHEN** en helskrueserie med D 0,80 og sikkerhed 5 samt en halvskrueserie med D 0,70 og sikkerhed 2 deler rondat-flik
- **THEN** vises rondat-flik kun under halvskrueserien med sikkerhed 2; en egen vurdering på 4 bevares som 4.

#### Scenario: Samme D og Ikke vurderet
- **WHEN** to mulige kilder har samme kendte D, den ene er Ikke vurderet, og den anden har sikkerhed 5
- **THEN** vælges den ikke vurderede kilde uden et opdigtet sikkerhedstal og uafhængigt af klikrækkefølgen.

#### Scenario: Afledt begyndelse overtager ikke parentrollen
- **WHEN** en helskrueserie og en halvskrueserie vælges direkte, og rondat-flik medtages automatisk
- **THEN** arver rondat fra den direkte valgte serie med lavest D og ikke fra det automatisk oprettede rondat-flik-barn.

### Requirement: Entydige serienavne og separate kortere serier
Byggeren SHALL vise den valgte komplette serie særskilt. Automatisk medtagne begyndelser og øvrigt fundament SHALL vises som individuelt identificerbare børn under den valgte kilde med sikkerhed, ophav og mulighed for fravalg eller egen vurdering; de MUST NOT vises som én sammensat navnelinje. Den samme struktur SHALL opdateres live ved valg fra listen og ved ændret sikkerhed. Elementkataloget SHALL vise forlæns/baglæns ved saltoer og kunne søges på både retning og skrueantal. Kendte almindelige sammensætninger MUST NOT vise feltet om specialforbindelse.

#### Scenario: Retningen på afslutningen er synlig
- **WHEN** forlæns helskrue vælges efter flik i en selvbygget serie
- **THEN** er den forlæns retning synlig, og byggeren forklarer at vælge den baglæns variant til den almindelige afslutning uden at omskrive trænerens valg automatisk.

#### Scenario: Enkeltelementer danner ikke automatisk en færdighed
- **WHEN** en gymnast har kraftspring og salto registreret hver for sig
- **THEN** kan kraftspring-salto ikke vælges som hendes beherskede serie, før den komplette forbindelse er registreret.

#### Scenario: Ikke-verificeret specialforbindelse
- **WHEN** træneren bygger en kombination, som ikke er dækket af de kontrollerede forbindelsesregler
- **THEN** vises den som ikke verificeret, og den tæller ikke som en sikker gyldig planlægningskandidat; en eksplicit trænerbekræftelse af den konkrete forbindelse og gyldige elementer er nødvendig.

#### Scenario: Live kontrol af konsekvenser
- **WHEN** træneren markerer et spring og ændrer dets sikkerhed fra 2 til 4
- **THEN** viser den åbne valgoversigt straks det medfølgende fundament med sikkerhed 4, mens børn med egen vurdering beholder deres værdi.

### Requirement: Gymnastens færdighedsregistrering
En gymnast SHALL kunne få tilføjet og redigeret hele baneserier, trampetspring og rytmemomenter med sikkerhed 1–5 eller Ikke vurderet, vurderingsdato og eventuel kort note. Rytmeoprettelse SHALL tilbyde vurderingen i samme handling og anvende katalogets navn med synlig valgt variant uden et navnefelt i standardforløbet. Ældre selvvalgte navne SHALL bevares i filen. Brugerfladen SHALL ikke vise arkivfiltre eller arkiv-/genaktiveringshandlinger; ældre filers inaktive registreringer SHALL bevares. Registrering af samme præcise færdighed igen SHALL genbruge den eksisterende registrering frem for utilsigtede dubletter. Enkeltregistrering kan åbne redigering; samlet springregistrering SHALL opdatere de direkte valgte vurderinger i samme handling. Overgangen fra manglende registrering til registreret uden vurdering SHALL være eksplicit.

#### Scenario: Færdigheden findes allerede
- **WHEN** træneren forsøger at tilføje samme normaliserede færdighed til samme gymnast igen
- **THEN** genbruges registreringen; enkeltregistrering åbner redigering, mens samlet springregistrering anvender den valgte sikkerhed og bevarer noten.

#### Scenario: Rytme med sikkerhed fra starten
- **WHEN** træneren vælger Håndstand, sikkerhed 3 og en vurderingsdato og registrerer momentet
- **THEN** oprettes én personlig færdighed med sikkerhed 3 og den valgte dato uden efterfølgende redigering eller krav om et nyt navn.

#### Scenario: Rytme uden vurdering
- **WHEN** træneren registrerer et rytmemoment som Ikke vurderet
- **THEN** oprettes færdigheden med tom vurdering og tom vurderingsdato uden at opfinde en værdi.

### Requirement: Fjern og tilføj en personlig færdighed igen
Træneren SHALL kunne fjerne en baneserie, et trampetspring eller et rytmemoment fra én gymnast med handlingen Fjern færdighed. En bekræftelse SHALL kunne annulleres og SHALL oplyse, hvis færdigheden anvendes på planpladser eller er arvekilde for andre færdigheder. Fjernelsen MUST NOT ændre andre personers registreringer eller fælles definitioner og MUST NOT fjerne kortere registrerede serier eller ændre deres egne vurderinger. Afhængige arvede vurderinger SHALL følge reglerne for alternativ eller manglende arvekilde. Valgte planreferencer SHALL bevares med tydelig utilgængelighed frem for at indgå som gyldig kunnen, når selve den valgte færdighed fjernes. Fjernede færdigheder SHALL kunne vælges igen gennem den almindelige registrering uden dublet; id og note bevares, mens sikkerhed kræver en ny egen vurdering eller et bevidst valg om at følge en aktuel kilde. Arv fra længere serier MUST NOT i sig selv tilføje en fjernet kortere serie igen.

#### Scenario: Fjern et spring, der bruges i planen
- **WHEN** træneren bekræfter fjernelse af en færdighed, som er valgt på tre pladser
- **THEN** forsvinder færdigheden fra gymnastens aktive liste, pladserne markeres som utilgængelige, og der kan vælges en anden færdighed uden at ændre andre gymnasters kunnen.

#### Scenario: Vælg en fjernet færdighed igen
- **WHEN** træneren senere udtrykkeligt registrerer samme præcise færdighed på samme gymnast
- **THEN** genbruges registreringen uden dublet, og en gammel sikkerhed sættes ikke automatisk som den nye vurdering.

#### Scenario: Fjern en arvekilde
- **WHEN** træneren fjerner en parent efter at have set konsekvensen for dens børn
- **THEN** bevares børnenes registreringer, egne vurderinger og planreferencer, mens børn med arv får anden gyldig kilde eller Ikke vurderet med besked om manglende kilde.

## ADDED Requirements

### Requirement: Afgrænset trænerfagligt fundament
Systemet SHALL have et versionsmærket katalog over præcise relationer mellem spring og deres fundament, adskilt fra officielle pointregler. De aftalte relationer SHALL omfatte præcise banebegyndelser, rondat-flik-strakt helskrue til samme indgang med lukket/hoftebøjet/strakt salto uden skrue, trampettens rudy til enkelt lukket/hoftebøjet/strakt salto uden skrue og med 180° samt præcis forlæns dobbelt med 540° uden redskab til dobbelt med 180° med samme kropspositionsforløb. For den dobbelte SHALL skruefordelingen bevares med hensyn til halve skruer pr. salto: 540°-fordelingerne [3,0] og [1,2] giver 180°-fordelingen [1,0], mens [2,1] og [0,3] giver [0,1], målt i halve skruer. Relationerne SHALL dække begge kropspositioners kombinationer af lukket, hoftebøjet og strakt uden at ændre dem. Disse børn SHALL medtages automatisk med arvet sikkerhed. En 540°-registrering uden nødvendig fordeling SHALL fortsat vise sit automatisk medtagne 180°-fundament som Afklar skruefordeling; den præcise fordeling SHALL vælges, før barnet kan registreres og bruges i planen. Retning, indgang, redskab, rotationsantal og nødvendige skruefordelinger SHALL være præcise i hver relation. Relationerne MUST NOT udledes alene af lavere D, aliaser eller en antagelse om, at alle lettere spring følger med. Forbudte eller uafklarede udførelser MUST NOT blive gyldige planlægningskandidater gennem afledning. Katalogændringer MUST NOT stiltiende tilføje nye personlige færdigheder ved genåbning.

#### Scenario: Rudy med baranivarianter
- **WHEN** en strakt forlæns salto med 540° uden redskab vælges på trampet
- **THEN** medtages enkelt lukket, hoftebøjet og strakt salto samt de tre tilsvarende varianter med 180° automatisk, og hver kan fravælges direkte.

#### Scenario: Dobbelt med mindre skrue
- **WHEN** en forlæns dobbelt lukket med 540° uden redskab og fordeling [2,1] vælges
- **THEN** medtages dobbelt lukket med 180° og fordeling [0,1] automatisk med samme sikkerhed og dato uden at ændre redskab eller kropspositioner.

#### Scenario: Dobbelt kræver præcisering
- **WHEN** et dobbelt 540°-valg mangler den nødvendige skruefordeling
- **THEN** vises det medfølgende 180°-fundament med behov for afklaring, og efter valg af [3,0] på parenten bliver barnet præcist [1,0] uden at træneren skal finde og tilføje barnet særskilt.

#### Scenario: Ingen forbindelse mellem redskaber
- **WHEN** en gymnast registreres på rudy uden redskab
- **THEN** tildeles ingen overslag-salto eller Tsukahara alene på grund af lavere D.

### Requirement: Individuelt og vedvarende fravalg
Træneren SHALL kunne fravælge hvert automatisk medtaget barn på stedet uden at fjerne parenten eller andre børn. Fravalget SHALL gælde den konkrete færdighed for den pågældende gymnast og bevares gennem filtre, ændring af parentens vurdering, tilføjelse af andre kilder og gem/genåbn, indtil træneren bevidst tilvælger færdigheden igen. Fravalg af en endnu ikke gemt afledning MUST NOT slette en eksisterende egen registrering; fjernelse af en allerede registreret færdighed SHALL følge den eksisterende bekræftelse og bevare planreferencer som utilgængelige.

#### Scenario: Fravalg trods ny kilde
- **WHEN** en medfølgende barani fravælges, arbejdsrummet gemmes og genåbnes, og en anden kilde til samme barani tilføjes
- **THEN** forbliver barani fravalgt og kan bevidst tilvælges igen uden dublet.

#### Scenario: Fortryd formular
- **WHEN** træneren ændrer valg og fravalg i registreringen og annullerer formularen
- **THEN** er gymnastens gemte registreringer, arvekilder og fravalg uændrede.

### Requirement: Grupperet valg og færdighedsoverblik
Vælger og gymnastoverblik SHALL bruge sammenhængende familier efter baneindgang og efter trampetredskab, springfamilie og enkelt/dobbelt rotation med synlige gruppetællinger og udfoldelige relationer. På desktop SHALL spring, D og sikkerhed stå i faste, sammenlignelige kolonner med kompakte rækker. Mobilvisningen SHALL bevare navn, præcis retning, D, sikkerhed og handlinger uden vandret siderulning. Små repertoirer SHALL være overskuelige uden unødvendig nesting, og store repertoirer SHALL kunne søges og afgrænses uden at åbne hver færdighed. Søgning SHALL synliggøre et match i en sammenfoldet familie og dets kontekst. Alle udfoldninger, valg og vurderinger SHALL kunne betjenes med tastatur.

#### Scenario: Stort syntetisk repertoire
- **WHEN** en syntetisk gymnast har 120 aktive færdigheder fordelt på bane, trampet og rytme
- **THEN** kan træneren finde en bestemt variant gennem søgning eller familie, aflæse D og sikkerhed og redigere vurderingen uden at gennemgå alle rækker.

### Requirement: Én samlet springvælger uden gentagelser
Bibliotek, direkte valg og medtaget eller fravalgt fundament SHALL vises i samme vælger med én række pr. præcis udførelse. En færdighed MUST NOT samtidig optræde som et almindeligt katalogvalg og i en separat fundament-/valgblok. Sikkerhed, ophav, fravalg og skrueafklaring SHALL betjenes på denne ene række. Direkte valg og deres fundament SHALL stå øverst uden søgetekst og forblive tilgængelige gennem søgning, gruppefilter, minimum-D og skift mellem discipliner. Med søgetekst SHALL de bedste match stå først, mens tidligere valg bevares. Kun valgte SHALL afgrænse den samme liste. En upræciseret katalogskabelon SHALL erstattes af det præciserede valg; forskellige præcise skruefordelinger SHALL fortsat bevares som forskellige udførelser. Byg selv SHALL anvende samme samlede rækkevisning uden en ekstra gentagelse af den valgte hele serie.

#### Scenario: Et fundament findes også i biblioteket
- **WHEN** helskrueserien vælges, og rondat-flik medtages som fundament og også findes som katalogvalg
- **THEN** vises rondat-flik på én række i den fælles vælger, hvor træneren kan fravælge det eller give egen vurdering.

#### Scenario: Et direkte valg bliver også fundament
- **WHEN** rondat-flik først vælges med egen sikkerhed 2, og en helskrueserie derefter vælges med sikkerhed 5
- **THEN** vises rondat-flik fortsat én gang med den direkte vurdering 2; fjernes det direkte valg, kan samme række vise fravalg af fundamentet uden at gentage springet.

### Requirement: Minimum-D uden tab af valg
Springvælgeren SHALL tilbyde et valgfrit minimum for springets egen D under det aktuelle holds regelpakke sammen med søgning og gruppefilter. En værdi på grænsen SHALL medtages. Valgte spring og deres medfølgende eller fravalgte fundament SHALL forblive tilgængelige i en samlet gennemgang, selv om de ligger under grænsen eller ikke matcher søgningen. Ukendt D MUST NOT behandles som nul; sådanne spring SHALL kunne findes i en særskilt tydeligt markeret visning uden at påstå, at de opfylder minimum.

#### Scenario: Fundament under grænsen
- **WHEN** et spring vælges med minimum-D 0,80, og dets fundament har lavere D
- **THEN** skjules de lave spring fra de almindelige søgeresultater, men vises stadig under valget med mulighed for fravalg og egen vurdering.

### Requirement: Konsistente visningsnavne for spring
Navne og aliaser SHALL følge samme præcise udførelse på tværs af bibliotek, gymnastoverblik og Springplan. Skrueantal i grader SHALL vises med gradtegn på både bane og trampet. Den strakte forlæns enkeltsalto med 540° SHALL kunne findes som rudy og rudi og vises med både dagligt navn og præcis beskrivelse. Visningsændringer MUST NOT ændre identitet, gemte egne navne, officielle koder, kildebytes eller point.

#### Scenario: Rudy på begge discipliner
- **WHEN** træneren søger rudy eller rudi på bane og trampet
- **THEN** findes de relevante udførelser, og trampetvarianten vises som Rudy · strakt salto 540°, med retning synlig og uden ny færdighedsidentitet.

### Requirement: Samme serie uden indgangssalto
Trænerkatalog version 2 SHALL medtage en præcis baneserie uden dens første kendte, tilladte forlæns indgangssalto, når resten kan starte selvstændigt fra tilløb. Restens elementer og overgange SHALL bevares. De specificerede fundamentrelationer SHALL anvendes til et endeligt, identitetsunikt resultat, hvor alle accepterede børn knyttes til den direkte valgte kilde. Et resterende flik-/whipbackforløb uden selvstændig indgang MUST NOT oprettes som hel serie. Accepterede version 1-relationer SHALL fortsat anvendes efter deres oprindelige matrix. Genåbning MUST NOT tilføje version 2-børn; et bevidst nyt valg med gennemgang SHALL kunne tilføje dem uden at dublerere ækvivalente accepterede relationer.

#### Scenario: Strakt foran rondat-flik-hel
- **WHEN** træneren vælger Strakt–rondat–flik–helskrue med sikkerhed 3 og automatisk fundament
- **THEN** medtages Rondat–flik–helskrue og dens fem fundamenter sammen med de tre præcise begyndelser, hver én gang og med arvet sikkerhed 3; ændring til 5 opdaterer børn med arv, mens egne vurderinger og fravalg bevares.

#### Scenario: Tidligere accepteret katalogversion
- **WHEN** en fil med version 1-relationer åbnes og serien senere vælges igen med gennemgang af fundament
- **THEN** bevares de gamle relationer ved åbning, og først genvalget tilføjer de manglende version 2-relationer.

### Requirement: Søgning efter seriens begyndelse
Springvælgeren SHALL prioritere præcise navne og sammenhængende begyndelser før løse ord i vilkårlig rækkefølge. Bindestreger, tankestreger og mellemrum SHALL behandles ens. En egen navngiven serie SHALL også kunne findes via dens strukturerede udførelse. Søgning og filterændring SHALL vise listen fra toppen. Aktive filtre SHALL kunne ryddes med Søg i alle spring uden tab af søgetekst eller valgte spring.

#### Scenario: Søg strakt rondat
- **WHEN** træneren skriver strakt rondat efter at have rullet ned i listen
- **THEN** vises Strakt–rondat og Strakt–rondat–flik øverst før Rondat–flik med strakt afslutning, og tidligere valg forbliver tilgængelige i samme liste.
