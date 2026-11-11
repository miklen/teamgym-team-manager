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
Træneren SHALL kunne markere flere spring i listen og angive sikkerhed 1–5 eller ikke vurderet ud for hvert valgt spring. Valg og vurderinger SHALL bevares mellem søgninger, grupper og skift af redskabsfilter mellem Alle, Bane og Trampet. Én samlet handling SHALL oprette eller opdatere valgene med den angivne vurderingsdato uden dubletter eller ændringer på andre gymnaster, også når valgene omfatter både bane og trampet. En markering SHALL tydeligt betyde, at gymnasten kan udføre hele serien uden mellemtrin; listen MUST NOT kræve den tekniske ekstraerklæring om at have verificeret en præcis forbindelse.

#### Scenario: Flere spring registreres samlet
- **WHEN** træneren markerer en helskrueserie med sikkerhed 5 og en halvskrueserie med sikkerhed 2
- **THEN** kan begge registreres i én handling med hver sin vurdering og fælles vurderingsdato, og valgene forsvinder ikke ved søgning eller skift af redskabsfilter.

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
Springbyggeren MUST kontrollere kendte orienterings- og forbindelsesbegrænsninger og MUST skelne mellem dokumenteret forbindelse, kendt problematisk forbindelse og ikke-verificeret forbindelse. Reglementsmæssige elementværdier MUST NOT alene godkende enhver elementpermutation som anvendelig serie. En hel serie SHALL registreres særskilt som gymnastens færdighed. En kendt problematisk eller ikke-verificeret forbindelse SHALL give en forklarende advarsel, men MUST NOT i sig selv forhindre bygning eller gemning. Den præcise serie SHALL først behandles som en godkendt kæde, når træneren udtrykkeligt godkender forbindelsen for arbejdsrummet.

Det praktiske forbindelseskatalog SHALL genkende afsluttet forlæns salto i lukket, hoftebøjet og strakt position med hele skruer til rondat eller kraftspring samt ulige halve skruer, fx barani/rudy, til flik eller whipback. Det SHALL også genkende forlæns salto i de tre positioner til vejrmølle. Kataloget SHALL være adskilt fra den udgivne regelpakkes pointalgoritmer. Trænerens godkendelse af den konkrete komplette kæde SHALL kunne læses af planlægningens gyldighedsvurdering uden at ændre udførelsen, personlige vurderinger, revurderingsmarkører eller regelbindingen. Uafklarede eller forbudte elementer MUST NOT blive gyldige alene gennem forbindelsesgodkendelse.

#### Scenario: Almindelig startsalto genkendes
- **WHEN** strakt-rondat-flik-baglæns helskrue bygges eller vælges fra listen
- **THEN** vises den som kendt uden ekstra erklæring om specialforbindelse og kan registreres som én præcis serie med D 1,00 i den aktuelle DK-pakke.

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
- **THEN** vises den som ikke verificeret og kan gemmes; først en udtrykkelig godkendelse af den præcise kæde gør forbindelsen anvendelig i en plan, når elementerne er tilladt.

#### Scenario: Live kontrol af konsekvenser
- **WHEN** træneren markerer et spring og ændrer dets sikkerhed fra 2 til 4
- **THEN** viser den åbne valgoversigt straks det medfølgende fundament med sikkerhed 4, mens børn med egen vurdering beholder deres værdi.

### Requirement: Rytmekatalog med udførelsesvarianter
Systemet SHALL tilbyde rytmekataloget fra holdets regelpakke:
- DK: alle 94 individuelle momentfelter fra det fastlåste A1.1-DK-bilag efter reference/rhythm-catalog.csv og reference/rhythm-requirements.md.
- REG: alle 75 individuelle momentfelter fra det fastlåste A1.2-REG-bilag.

Momenterne SHALL grupperes efter bilagets kategorier og vise navn, trykt kode, værdi, generelle krav, kategorikrav og specifik variantbeskrivelse. Gruppeelementer (G) SHALL være udeladt fra katalog, registrering og analyse.

Sammenligning SHALL tage hensyn til udførelseskrav, herunder relevante afsæts-/landingsvarianter. Spejling SHALL behandles efter regelpakkens ækvivalensregler og MUST NOT tilsidesætte et specifikt krav om fælles startretning for ansigtet. En registrering SHALL kun gælde i en anden pakke gennem en eksplicit kortlægning af moment-id.

#### Scenario: To registreringer er ikke nødvendigvis fælles
- **WHEN** to gymnaster er registreret på samme momentfamilie, men udfører forskellige varianter, som ikke kan opfylde samme holdkrav
- **THEN** vises de ikke som et fælles identisk moment alene på grund af familienavnet.

#### Scenario: Gruppeelementer er udeladt
- **WHEN** træneren søger eller filtrerer rytmekataloget og tilføjer færdigheder til en gymnast
- **THEN** tilbydes ingen G-momenter, løft, kast eller registrering af deltagergrupper, mens alle individuelle momentfelter fortsat er dækket.

#### Scenario: Officiel kode forekommer to gange
- **WHEN** kataloget indlæser DB804 for pirouetten på A1.1 side 3 og stem til håndstand på side 4
- **THEN** bevares de trykte koder og begge værdier 0,80, men momenterne får forskellige stabile interne id'er og krav, så registreringer ikke sammenlægges.

#### Scenario: Katalog følger holdets pakke
- **WHEN** træneren åbner rytmekataloget fra et REG-hold og derefter fra et DK-hold
- **THEN** viser REG-holdet 75 momenter med A1.2-værdier, og DK-holdet viser 94 momenter med A1.1-værdier.

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
En færdighed SHALL kunne være registreret, selv om den ikke er tilladt eller kendt i det aktuelle holds reglement. Systemet SHALL bevare registreringen og forklare anvendeligheden pr. hold. En fælles trænergodkendelse af en præcis forbindelse SHALL kunne gøre forbindelsen anvendelig på en omgang, men MUST NOT gøre et reglementsforbudt element tilladt eller opfinde en ukendt elementværdi. Ikke-tilladte eller uafklarede elementer MUST NOT tilbydes som fuldt gyldige kandidater i en omgang.

#### Scenario: Flytning ændrer anvendelighed
- **WHEN** en gymnast med et dobbeltroterende spring senere flyttes fra DK til et hold med et reglement, der ikke tillader springet
- **THEN** bevares færdigheden, sikkerheden og en eventuel forbindelsesgodkendelse, mens planlægningen viser elementet som ikke tilladt for det nye hold.

### Requirement: Kildedækning og manglende katalogposter
Kataloget SHALL indeholde verificerbare henvisninger til officielle kilder og SHALL dække de gyldige kombinationer af basisværdier og tillæg, som den understøttede regelpakke beskriver, også hvor et spring ikke har en trykt kode. Uafklarede poster SHALL fremgå som sådanne. Leverancen MUST NOT nøjes med et lille demonstrationsudvalg af spring eller rytmemomenter.

#### Scenario: Gyldigt spring uden særskilt tabelkode
- **WHEN** en springvariant kan udledes entydigt af kildeverificerede basisværdier og skruetillæg
- **THEN** kan den oprettes struktureret med beregningsforklaring uden at kræve en opdigtet officiel kode.

### Requirement: Afgrænset trænerfagligt fundament
Systemet SHALL have et versionsmærket katalog over præcise relationer mellem spring og deres fundament, adskilt fra officielle pointregler. De aftalte relationer SHALL omfatte præcise banebegyndelser, rondat-flik-strakt helskrue til samme indgang med lukket/hoftebøjet/strakt salto uden skrue, trampettens rudy til enkelt lukket/hoftebøjet/strakt salto uden skrue og med 180° samt præcis forlæns dobbelt med 540° uden redskab til dobbelt med 180° med samme kropspositionsforløb. For den dobbelte SHALL skruefordelingen bevares med hensyn til halve skruer pr. salto: 540°-fordelingerne [3,0] og [1,2] giver 180°-fordelingen [1,0], mens [2,1] og [0,3] giver [0,1], målt i halve skruer. Relationerne SHALL dække begge kropspositioners kombinationer af lukket, hoftebøjet og strakt uden at ændre dem. Disse børn SHALL medtages automatisk med arvet sikkerhed. En dobbeltsalto med 1–5 halve skruer SHALL have valgt præcis fordeling, før den kan registreres eller bruges som ambition; barnet følger parentens valgte fordeling. Retning, indgang, redskab, rotationsantal og nødvendige skruefordelinger SHALL være præcise i hver relation. Relationerne MUST NOT udledes alene af lavere D, aliaser eller en antagelse om, at alle lettere spring følger med. Forbudte eller uafklarede udførelser MUST NOT blive gyldige planlægningskandidater gennem afledning. Katalogændringer MUST NOT stiltiende tilføje nye personlige færdigheder ved genåbning.

#### Scenario: Rudy med baranivarianter
- **WHEN** en strakt forlæns salto med 540° uden redskab vælges på trampet
- **THEN** medtages enkelt lukket, hoftebøjet og strakt salto samt de tre tilsvarende varianter med 180° automatisk, og hver kan fravælges direkte.

#### Scenario: Dobbelt med mindre skrue
- **WHEN** en forlæns dobbelt lukket med 540° uden redskab og fordeling [2,1] vælges
- **THEN** medtages dobbelt lukket med 180° og fordeling [0,1] automatisk med samme sikkerhed og dato uden at ændre redskab eller kropspositioner.

#### Scenario: Dobbelt kræver præcisering
- **WHEN** et dobbelt 540°-valg mangler den nødvendige skruefordeling
- **THEN** er registrering spærret, og efter valg af [3,0] i Hvor sker skruen? bliver barnet præcist [1,0] uden at træneren skal finde og tilføje barnet særskilt.

### Requirement: Påkrævet skruefordeling
Systemet SHALL kræve en fuld skruefordeling pr. salto for elementer med flere saltoer og 1–5 halve skruer, fordi in og out er forskellige spring. Fordelingen SHALL vælges i en fælles visuel vælger med ét valg pr. mulig fordeling ordnet fra in til out i Byg selv, registreringsrækker og ambitioner. Ved 6 halve skruer eller flere SHALL kun totalen gemmes. Format 7 SHALL afvise definitioner uden nødvendig fordeling. Ved opgradering fra format 1–6 SHALL en manglende fordeling deterministisk blive out med hele skruen på sidste salto.

#### Scenario: Dobbelt lukket med halv skrue
- **WHEN** træneren vælger dobbelt lukket 180° på trampet
- **THEN** kan springet først registreres, når In eller Out er valgt, og de to valg gemmes som forskellige spring.

#### Scenario: Uafklaret spring opgraderes
- **WHEN** et arbejdsrum i format 6 har dobbelt lukket 180° uden fordeling
- **THEN** viser opgraderingsdialogen springet med "→ out", og efter opgradering kan registreringen vælges i omgangens springvælger.

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

### Requirement: Én samlet springvælger uden gentagelser
Bibliotek, direkte valg og medtaget eller fravalgt fundament SHALL vises i samme vælger med én række pr. præcis udførelse. En færdighed MUST NOT samtidig optræde som et almindeligt katalogvalg og i en separat fundament-/valgblok. Sikkerhed, ophav, fravalg og skrueafklaring SHALL betjenes på den præcise udførelses række. Direkte valg og deres fundament SHALL stå øverst uden søgetekst og forblive tilgængelige gennem søgning, kædevalg, minimum-D og skift mellem discipliner. Med søgetekst SHALL de bedste match stå først, mens tidligere valg bevares. Visningen Valgte SHALL afgrænse den samme liste. En upræciseret katalogskabelon SHALL erstattes af det præciserede valg. Forskellige præcise skruefordelinger SHALL fortsat bevares som forskellige udførelser. Byg selv SHALL anvende samme samlede rækkevisning uden en ekstra gentagelse af den valgte hele serie.

#### Scenario: Et fundament findes også i biblioteket
- **WHEN** helskrueserien vælges, og rondat-flik medtages som fundament og også findes som katalogvalg
- **THEN** vises rondat-flik på én række i den fælles vælger, hvor træneren kan fravælge det eller give egen vurdering.

#### Scenario: Et direkte valg bliver også fundament
- **WHEN** rondat-flik først vælges med egen sikkerhed 2, og en helskrueserie derefter vælges med sikkerhed 5
- **THEN** vises rondat-flik fortsat én gang med den direkte vurdering 2. Fjernes det direkte valg, kan samme række vise fravalg af fundamentet uden at gentage springet.

### Requirement: Minimum-D uden tab af valg
Springvælgeren SHALL tilbyde et valgfrit minimum for springets egen D under det aktuelle holds regelpakke sammen med søgning og gruppefilter. En værdi på grænsen SHALL medtages. Valgte spring og deres medfølgende eller fravalgte fundament SHALL forblive tilgængelige i en samlet gennemgang, selv om de ligger under grænsen eller ikke matcher søgningen. Ukendt D MUST NOT behandles som nul; sådanne spring SHALL kunne findes i en særskilt tydeligt markeret visning uden at påstå, at de opfylder minimum.

#### Scenario: Fundament under grænsen
- **WHEN** et spring vælges med minimum-D 0,80, og dets fundament har lavere D
- **THEN** skjules de lave spring fra de almindelige søgeresultater, men vises stadig under valget med mulighed for fravalg og egen vurdering.

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

### Requirement: Samme serie uden indgangssalto
Trænerkatalog version 2 SHALL medtage en præcis baneserie uden dens første kendte, tilladte forlæns indgangssalto, når resten kan starte selvstændigt fra tilløb. Restens elementer og overgange SHALL bevares. De specificerede fundamentrelationer SHALL anvendes til et endeligt, identitetsunikt resultat, hvor alle accepterede børn knyttes til den direkte valgte kilde. Et resterende flik-/whipbackforløb uden selvstændig indgang MUST NOT oprettes som hel serie. Accepterede version 1-relationer SHALL fortsat anvendes efter deres oprindelige matrix. Genåbning MUST NOT tilføje version 2-børn; et bevidst nyt valg med gennemgang SHALL kunne tilføje dem uden at dublerere ækvivalente accepterede relationer.

#### Scenario: Strakt foran rondat-flik-hel
- **WHEN** træneren vælger Strakt–rondat–flik–helskrue med sikkerhed 3 og automatisk fundament
- **THEN** medtages Rondat–flik–helskrue og dens fem fundamenter sammen med de tre præcise begyndelser, hver én gang og med arvet sikkerhed 3; ændring til 5 opdaterer børn med arv, mens egne vurderinger og fravalg bevares.

#### Scenario: Tidligere accepteret katalogversion
- **WHEN** en fil med version 1-relationer åbnes og serien senere vælges igen med gennemgang af fundament
- **THEN** bevares de gamle relationer ved åbning, og først genvalget tilføjer de manglende version 2-relationer.

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

### Requirement: Fælles navnegrammatik for spring
Alle spring på bane og trampet SHALL navngives af én fælles grammatik ud fra den præcise udførelse. Elementerne i en baneserie SHALL forbindes med " – ", og navnet SHALL begynde med stort bogstav. Grammatikken SHALL bruge:
- Faste elementer: rondat, flik, whipback, kraftspring, flyvespring, vejrmølle, overslag og mølleoverslag.
- Salto uden skrue: rotation og kropsposition efterfulgt af "salto", fx "lukket salto", "strakt salto" og "dobbelt hoftebøjet salto". Forskellige kropspositioner i en dobbelt vises i rækkefølge, fx "dobbelt lukket → strakt salto".
- Forlæns enkeltsalto med 1, 3, 5 eller 7 halve skruer: kaldenavnet barani, rudy, randy eller addy efterfulgt af kropsposition og grader i parentes, fx "barani (strakt 180°)", "barani (lukket 180°)" og "rudy (strakt 540°)".
- Øvrige skruede saltoer: rotation, kropsposition, skruebrøk og grader i parentes, fx "strakt 1/2 (180°)", "strakt 1/1 (360°)", "strakt 1½ (540°)", "strakt 2/1 (720°)" og "dobbelt lukket 1/2 (180°)". Skruefordelingen i en dobbelt SHALL tilføjes som " · out", " · in" eller en dansk fordeling som " · hel in, ½ out".
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
- **THEN** vises de som "Rudy (strakt 540°)" og "Dobbelt lukket 1/2 (180°) · out".

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
Springvælgeren SHALL vise forløbet som to nummererede trin: "Find springet" med søgning, redskabsfilter, kædebygger og et sammenfoldet D-filter, og "Vælg og vurdér sikkerhed" med den afgrænsede liste. På brede skærme SHALL trinene stå side om side, så listen ændrer sig synligt ved siden af afgrænsningen. På smalle skærme SHALL en knap med antallet af passende spring føre direkte ned til listen. Hver række SHALL have sikkerhedsknapper 1–5, hvor ét tryk vælger springet med den vurdering, og en knap til at vælge uden vurdering. Vælgeren MUST NOT bruge afkrydsningsfelter til at vælge spring. Fundament SHALL stå indrykket under det valgte spring med Arvet, 1–5 og fravalg på samme række. Valgte spring SHALL kunne vises for sig i en visning ved siden af resultaterne. Automatisk medtagelse af fundament SHALL være en forklaret kontakt, som kun vises, når der er valgt spring. Under listen SHALL vælgeren føre til Byg selv, og kædens sammenhængende, entydige valg fra første plads SHALL lægges ind som start i Byg selv på kædens redskab. Forløbet ændrer ikke gemte felter.

#### Scenario: Vælg og vurdér i ét tryk
- **WHEN** træneren har afgrænset listen med kæden og trykker 4 på rækken Rondat – flik – strakt 1/1 (360°)
- **THEN** er springet valgt med sikkerhed 4, og dets fundament vises indrykket under det med Arvet 4/5.

#### Scenario: Springet findes ikke
- **WHEN** træneren har valgt Bane og Rondat i kæden og trykker Byg det selv
- **THEN** åbner Byg selv på bane med rondat som første element.

#### Scenario: Smal skærm
- **WHEN** træneren afgrænser med kæden på en 390 px bred skærm
- **THEN** viser knappen "Vis N spring" antallet og fører ned til listen uden vandret siderulning, og redskabsfilteret ruller ikke vandret.

### Requirement: Forlæns salto til vejrmølle er et færdigt banevalg
Springbiblioteket SHALL tilbyde forlæns salto direkte til vejrmølle som tre særskilte komplette baneserier med henholdsvis lukket, hoftebøjet og strakt salto. Den præcise position og elementrækkefølge SHALL indgå i hver series identitet og vises i både gymnastregistrering og omgangsvalg. En baglæns salto til vejrmølle MUST NOT forveksles med disse tre serier.

#### Scenario: Tre positioner
- **WHEN** træneren søger salto mølle i banevalget
- **THEN** kan lukket, hoftebøjet og strakt forlæns salto → vejrmølle vælges hver for sig med egen D under holdets regelpakke.

### Requirement: Byg videre fra en valgt kæde ved nul resultater
Gymnastens eksisterende springvælger med søgning, kædefilter, D-filter, resultater og vurderinger SHALL bevares. Når de samlede filtre giver nul resultater og kæden har en sammenhængende, entydig begyndelse, SHALL det almindelige Byg det selv-link under listen erstattes af én Byg videre-handling i tomtilstanden, som åbner Byg selv med begyndelsen i præcis rækkefølge og variant. Handlingen MUST NOT gentages på de enkelte resultatrækker eller vises som en ekstra, dubleret handling. Når kæden ikke bestemmer et præcist første element, SHALL træneren få besked om at præcisere en variant eller starte fra bunden; systemet MUST NOT gætte. Byggeren SHALL også kunne åbnes tom. Søgetekst og D-filter MUST NOT omsættes til elementer. Træneren SHALL frit kunne tilføje, fjerne, ændre variant og omordne basiselementer efter overførsel.

#### Scenario: Fortsæt fra en præcis kæde uden resultat
- **WHEN** træneren har valgt Strakt salto uden skrue, Rondat og Flik som præcise kædeled, og ingen færdig serie passer til de øvrige filtre
- **THEN** vises én Byg videre-handling i tomtilstanden, og byggeren åbner med netop de tre elementer i den rækkefølge, klar til at tilføje næste element.

#### Scenario: Søgning er ikke et springvalg
- **WHEN** træneren skriver strakt rondat uden at vælge et kædeled og åbner Byg selv fra bunden
- **THEN** er byggeren tom og opfinder ikke retning, position eller overgang ud fra søgeordene.

#### Scenario: Upræcist kædevalg
- **WHEN** træneren har filtreret med Strakt salto uden at præcisere en variant, og ingen entydig første udførelse kan udledes
- **THEN** forklarer tomtilstanden, at varianten skal vælges før Byg videre, og Byg fra bunden er fortsat mulig.

#### Scenario: Færdige resultater er en ren liste
- **WHEN** kædefilteret stadig giver spring i resultatlisten
- **THEN** har springrækkerne deres nuværende valg og vurdering uden en Byg videre-knap på hver række.

### Requirement: Springkæden er byggerens primære arbejdsflade
Byg selv SHALL vise den komplette elementrækkefølge som en sammenhængende, redigerbar kæde med tydeligt aktivt element, navn, relevant retning og elementværdi. Søgning i alle basiselementer, variantredigering, samlet D, gyldighed og forbindelsesstatus SHALL være tilgængelige i samme arbejdsflade. På smalle skærme SHALL kæde, handlinger og status kunne bruges uden vandret siderulning. Alle handlinger SHALL kunne betjenes med tastatur og have forståelige tilgængelige navne; bevægelse SHALL respektere reduceret bevægelse.

#### Scenario: Redigér en variant på mobil
- **WHEN** træneren åbner byggeren på en smal skærm og vælger saltoelementet i en kæde
- **THEN** kan position og skrue ændres, og kædens navn, D og status opdateres uden vandret siderulning.

### Requirement: Fælles trænergodkendelse af en præcis springkæde
Byggeren SHALL skelne mellem en kendt problematisk forbindelse og en forbindelse, som appen endnu ikke kan verificere, med forskellige forklarende advarsler. Ingen af vurderingerne MUST blokere, at træneren færdiggør kæden. Træneren SHALL kunne godkende den konkrete komplette kæde for hele arbejdsrummet efter at have set advarslen. En sådan godkendelse SHALL gælde netop kædens præcise udførelse og SHALL kunne genbruges på andre gymnaster og ambitioner uden ny godkendelse. Den SHALL ikke være en personlig færdighedsregistrering, sikkerhedsvurdering eller en tilladelse til at tilsidesætte et reglements forbudte eller uafklarede elementer. Ændres kædens udførelse eller overgange, MUST den gamle godkendelse ikke automatisk gælde den nye kæde.

#### Scenario: Træneren godkender en kendt problematisk overgang
- **WHEN** træneren bygger baglæns salto → vejrmølle, ser advarslen og bekræfter den præcise kæde
- **THEN** kan definitionen bruges på en ambition med synlig betegnelse Trænerbekræftet forbindelse, og samme kæde kræver ikke ny forbindelsesgodkendelse på næste plads.

#### Scenario: Ikke verificeret forbindelse
- **WHEN** træneren bygger en overgang, som appen ikke kan vurdere, og godkender den
- **THEN** bevares forskellen til kendt problematisk i forklaringen, og den godkendte præcise kæde kan genbruges i arbejdsrummet.

#### Scenario: Ny udførelse kræver nyt valg
- **WHEN** et element i en godkendt kæde skifter retning eller position
- **THEN** er den ændrede kæde ikke dækket af den tidligere godkendelse, mens den oprindelige definition og dens godkendelse bevares.

### Requirement: Springvalg på tværs af bane og trampet
Tilføj færdighed på en gymnast SHALL øverst kun skelne mellem Spring og Rytme. Springvælgeren SHALL have et altid synligt redskabsfilter med Alle, Bane og Trampet under søgefeltet i Find springet, og Alle SHALL være standard. Med Alle SHALL søgning, D-filter, holdkendskab og listen omfatte både bane- og trampetspring, og hver række SHALL vise sit redskab som tekst. Med Bane eller Trampet SHALL listen kun vise det redskab, og rækkerne behøver ikke redskabsmærket. Står filteret på Alle, SHALL kædens første trin være "Bane eller trampet" med antallet af passende spring pr. redskab. Et valg i trinnet SHALL sætte filteret, hvorefter kæden fortsætter med redskabets nuværende pladser. Skift af redskab SHALL nulstille kæden, men MUST NOT fjerne søgetekst, D-filter, valgte spring, vurderinger eller fundament. Byg selv SHALL bruge filterets redskab. Står filteret på Alle, SHALL byggeren starte med et valg mellem Bane og Trampet, før elementer kan vælges. Ambitionens springvalg og pladsvalg i Springplan SHALL fortsat følge omgangens disciplin. Filteret er ren visning og MUST NOT gemmes.

#### Scenario: Søgning rammer begge redskaber
- **WHEN** træneren åbner Tilføj færdighed og søger strakt 1/1 uden at ændre filteret
- **THEN** viser listen både baneserier og trampetspring med strakt 1/1 (360°), og hver række viser Bane eller Trampet.

#### Scenario: Kædens første trin vælger redskab
- **WHEN** filteret står på Alle, og træneren vælger Trampet i kædens første trin
- **THEN** står filteret på Trampet, listen viser kun trampetspring, og kæden fortsætter med redskab og springtype.

#### Scenario: Valg bevares ved redskabsskift
- **WHEN** træneren har valgt en baneserie med sikkerhed 4 og skifter filteret til Trampet og vælger et trampetspring med sikkerhed 3
- **THEN** står begge i Valgte og registreres i én handling med hver sin vurdering.

#### Scenario: Byg selv fra Alle
- **WHEN** filteret står på Alle, og træneren åbner Byg selv
- **THEN** starter byggeren med valget Bane eller Trampet, og elementkataloget vises først efter valget.
