# skill-catalog Specification

## Purpose

Giver trænerne præcise, genbrugelige færdigheder for bane, trampet og rytme, som kan vurderes efter forskellige reglementer uden beregning ud fra fritekst.

## Requirements

### Requirement: Præcise elementidentiteter
Systemet SHALL beskrive spring med disciplin, elementfamilie, rotationsretning, rotationer, kropsposition, skrueantal, relevant skruefordeling og redskab. Alias og daglige navne SHALL pege på samme præcise identitet, når reglementet anser springene for ens. Forskellig værdi og forskellig identitet MUST NOT sammenblandes.

#### Scenario: Samme værdi er ikke samme serie
- **WHEN** to baneserier har samme D, men forskellige elementer eller elementrækkefølge
- **THEN** behandles de som forskellige serier ved holdomgang og gentagelseskontrol.

#### Scenario: Alias skaber ikke ny variation
- **WHEN** to trampetspring har navne, som reglementet definerer som ækvivalente, eksempelvis den relevante Tsukahara-/Kasamatsu-variant
- **THEN** får de samme normaliserede identitet ved holdomgang og gentagelser.

### Requirement: Struktureret springbygger
Træneren SHALL kunne søge standardfærdigheder og opbygge en komplet baneserie af strukturerede elementer i rækkefølge samt vælge et struktureret trampetspring. Byggeren SHALL løbende vise præcist navn, D og det valgte holds reglementsmæssige begrænsninger. Noter MUST NOT ændre den beregnede identitet.

#### Scenario: Byg en hel baneserie
- **WHEN** træneren vælger rondat, flik og strakt baglæns salto med helskrue
- **THEN** vises hele kæden, elementernes værdier og samlet D under den valgte regelprofil før registrering på gymnasten.

### Requirement: Færdige spring og fælles springbibliotek
Registrering af spring SHALL som udgangspunkt tilbyde en søgbar liste af gængse komplette sammensætninger med præcise positioner, skruer og D under holdets regelpakke. Listen SHALL omfatte rondat-/flik-/whipbackfamilier og kraftspring-/forlæns startsaltofamilier, herunder rondat-flik-1/1, kraft-barani og strakt-kraft-rudy. En særskilt Byg selv-mulighed SHALL bevare den strukturerede bygger til sjældne varianter. Springdefinitioner registreret i arbejdsrummet SHALL kunne genbruges på andre gymnaster efter gemning og genåbning uden at skulle bygges igen. Vurdering og personlig forbindelsesbekræftelse MUST NOT kopieres til den næste gymnast.

#### Scenario: Vælg en gængs hel serie
- **WHEN** træneren søger rondat-flik-1/1
- **THEN** kan rondat-flik-strakt baglæns salto med 360° vælges samlet med D og præcis udførelse uden valg af hvert element.

### Requirement: Færdige banevalg med indgang
Springlisten MUST NOT have en separat kategori Grundspring. Selvstændige spring med indgang fra tilløb SHALL placeres under Forlæns eller Baglæns. En løs baglæns salto, flik eller whipback MUST NOT tilbydes som et færdigt banevalg, heller ikke via arbejdsrummets egne springdefinitioner. Alle rå elementer SHALL fortsat være tilgængelige i Byg selv. Byggeren SHALL forklare en manglende indgang og forhindre registrering af en ny komplet baneserie, indtil en indgang er sat først. Eksisterende filindhold MUST NOT slettes eller omskrives af filtreringen.

#### Scenario: Baglæns salto skal indgå i en serie
- **WHEN** en baglæns salto søges blandt færdige banevalg
- **THEN** tilbydes relevante komplette serier, fx rondat-salto eller rondat-flik-salto, mens den løse salto kun kan tilføjes som element i Byg selv; registrering kræver en indgang først.

#### Scenario: Egne spring genbruges
- **WHEN** træneren bygger og registrerer en egen serie og senere åbner en anden gymnast i samme arbejdsrum
- **THEN** kan serien vælges fra listen med samme definition og en selvstændig vurdering; markeringen under den tydelige tekst om hele serier er trænerens nye personlige bekræftelse, og en anden gymnasts vurdering eller bekræftelse kopieres ikke.

### Requirement: Flere spring med sikkerhed i samme registrering
Træneren SHALL kunne markere flere spring i listen og angive sikkerhed 1–5 eller ikke vurderet ud for hvert valgt spring. Valg og vurderinger SHALL bevares mellem søgninger, grupper og skift mellem bane/trampet. Én samlet handling SHALL oprette eller opdatere valgene med den angivne vurderingsdato uden dubletter eller ændringer på andre gymnaster. En markering SHALL tydeligt betyde, at gymnasten kan udføre hele serien uden mellemtrin; listen MUST NOT kræve den tekniske ekstraerklæring om at have verificeret en præcis forbindelse.

#### Scenario: Flere spring registreres samlet
- **WHEN** træneren markerer en helskrueserie med sikkerhed 5 og en halvskrueserie med sikkerhed 2
- **THEN** kan begge registreres i én handling med hver sin vurdering og fælles vurderingsdato, og valgene forsvinder ikke ved søgning eller disciplinskift.

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

### Requirement: Kontrol af forbindelser
Springbyggeren MUST kontrollere kendte orienterings- og forbindelsesbegrænsninger og MUST skelne mellem dokumenteret forbindelse, ugyldig forbindelse og ikke-verificeret forbindelse. Reglementsmæssige elementværdier MUST NOT alene godkende enhver elementpermutation som anvendelig serie. En hel serie SHALL registreres særskilt som gymnastens færdighed.

Det praktiske forbindelseskatalog SHALL genkende afsluttet forlæns salto i lukket, hoftebøjet og strakt position med hele skruer til rondat eller kraftspring samt ulige halve skruer, fx barani/rudy, til flik eller whipback. Kataloget SHALL være adskilt fra den udgivne regelpakkes pointalgoritmer. Trænerens registrering af den konkrete komplette standardserie SHALL kunne gemme en personlig bekræftelse, som den eksisterende regelpakke kan læse, uden at ændre udførelsen, vurderingen, revurderingsmarkører eller regelbindingen. Uafklarede/forbudte elementer MUST NOT blive gyldige af denne grund.

#### Scenario: Almindelig startsalto genkendes
- **WHEN** strakt-rondat-flik-baglæns helskrue bygges eller vælges fra listen
- **THEN** vises den som kendt uden en ekstra erklæring om specialforbindelse og kan registreres som én præcis serie med D 1,00 i den aktuelle DK-pakke.

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

### Requirement: Rytmekatalog med udførelsesvarianter
Systemet SHALL tilbyde alle 94 individuelle momentfelter fra det fastlåste A1.1-DK-bilag, grupperet efter bilagets kategorier, med navn, trykt kode, værdi, generelle krav, kategorikrav og specifik variantbeskrivelse efter reference/rhythm-catalog.csv og reference/rhythm-requirements.md. Gruppeelementer (G) SHALL være udeladt fra katalog, registrering og analyse. Sammenligning SHALL tage hensyn til udførelseskrav, herunder relevante afsæts-/landingsvarianter. Spejling SHALL behandles efter regelpakkens ækvivalensregler og MUST NOT tilsidesætte et specifikt krav om fælles startretning for ansigtet.

#### Scenario: To registreringer er ikke nødvendigvis fælles
- **WHEN** to gymnaster er registreret på samme momentfamilie, men udfører forskellige varianter, som ikke kan opfylde samme holdkrav
- **THEN** vises de ikke som et fælles identisk moment alene på grund af familienavnet.

#### Scenario: Gruppeelementer er udeladt
- **WHEN** træneren søger eller filtrerer rytmekataloget og tilføjer færdigheder til en gymnast
- **THEN** tilbydes ingen G-momenter, løft, kast eller registrering af deltagergrupper, mens alle individuelle momentfelter fortsat er dækket.

#### Scenario: Officiel kode forekommer to gange
- **WHEN** kataloget indlæser DB804 for pirouetten på A1.1 side 3 og stem til håndstand på side 4
- **THEN** bevares de trykte koder og begge værdier 0,80, men momenterne får forskellige stabile interne id'er og krav, så registreringer ikke sammenlægges.

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

### Requirement: Saltoretning vises for hvert saltoelement
Liste, gymnastregistrering, byggerens serievisning og planlægning SHALL vise saltoernes rotationsretninger i udførelsesrækkefølge, også hvis serien har et selvvalgt navn. Biblioteket SHALL tilbyde særskilte rondat–baglæns salto–baglæns salto og rondat–baglæns salto–forlæns salto, også med flik efter rondat og med de tre kropspositioner på begge saltoer. Definitionernes retning, identitet, præcise kortere begyndelser og personlige bekræftelser SHALL bevares særskilt; appens praktiske forbindelsesviden MUST NOT ændre den frigivne regelpakkes tal eller algoritmer.

#### Scenario: To forskellige rondat-salto-salto
- **WHEN** træneren søger på rondat salto salto
- **THEN** kan baglæns → baglæns og baglæns → forlæns vælges særskilt med entydige navne og retninger, som bevares efter gem/genåbn.

### Requirement: Regelværdi er adskilt fra færdighed
En færdighed SHALL kunne være registreret, selv om den ikke er tilladt eller kendt i det aktuelle holds reglement. Systemet SHALL bevare registreringen og forklare anvendeligheden pr. hold; en ikke-tilladt eller ikke-verificeret færdighed MUST NOT tilbydes som gyldig kandidat i en omgang.

#### Scenario: Flytning ændrer anvendelighed
- **WHEN** en gymnast med et dobbeltroterende spring senere flyttes fra DK til et hold med et reglement, der ikke tillader springet
- **THEN** bevares færdigheden og stabiliteten, mens planlægningen viser den som ikke tilladt for det nye hold.

### Requirement: Kildedækning og manglende katalogposter
Kataloget SHALL indeholde verificerbare henvisninger til officielle kilder og SHALL dække de gyldige kombinationer af basisværdier og tillæg, som den understøttede regelpakke beskriver, også hvor et spring ikke har en trykt kode. Uafklarede poster SHALL fremgå som sådanne. Leverancen MUST NOT nøjes med et lille demonstrationsudvalg af spring eller rytmemomenter.

#### Scenario: Gyldigt spring uden særskilt tabelkode
- **WHEN** en springvariant kan udledes entydigt af kildeverificerede basisværdier og skruetillæg
- **THEN** kan den oprettes struktureret med beregningsforklaring uden at kræve en opdigtet officiel kode.

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
