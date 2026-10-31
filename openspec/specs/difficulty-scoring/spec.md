# difficulty-scoring Specification

## Purpose

Beregner planlagt sværhed fra strukturerede færdigheder og holdets præcise regelversion og viser bidrag og forbehold, så træneren kan efterprøve resultatet.
## Requirements
### Requirement: Holdets regelbinding styrer beregningen
Alle D-resultater SHALL bruge det konkrete holds reglement, regelversion og profil. Samme færdighed SHALL kunne vurderes forskelligt på forskellige hold uden at ændre færdighedsregistreringen. Resultater SHALL identificere deres regelgrundlag.

#### Scenario: Uafhængig beregning
- **WHEN** samme strukturerede spring vurderes med to forskellige installerede regelpakker
- **THEN** følger hver beregning sin pakke, og en ændring i den ene kan ikke ændre den andens resultat.

### Requirement: Banens tre forskellige tællende elementer
For DK-versionen i kildegrundlaget SHALL en sammenhængende baneseries D være summen af de op til tre forskellige elementer med højest værdi. Gentagne identiske elementer SHALL ikke tælle igen, og der MUST NOT indføres et generelt minimum på tre elementer. Forskellighed SHALL afgøres efter normaliseret identitet, ikke værdi eller fritekst.

#### Scenario: Gentagen flik
- **WHEN** serien er rondat-flik-flik-strakt baglæns salto med helskrue under den kildeverificerede DK-pakke
- **THEN** er D 0,80, samme som uden den ekstra flik, og forklaringen viser, hvorfor gentagelsen ikke giver ekstra D.

#### Scenario: To-elementserie
- **WHEN** serien er kraftspring-strakt forlæns salto med halvskrue
- **THEN** er D 0,60 uden et opdigtet fradrag for kun to elementer.

#### Scenario: Mere end tre forskellige elementer
- **WHEN** en gyldig serie indeholder fire forskellige elementer
- **THEN** vises alle fire, men kun de tre med højest D tæller i sværhedssummen.

### Requirement: Trampetspring er én færdighed
Trampettens D SHALL komme fra det komplette valgte spring med korrekt basisværdi og tillæg. Tsukahara og overslag-salto MUST NOT beregnes som summen af uafhængige spring. Redskabets rotationskategori SHALL følge den samlede rotation fra trampetafsæt til landing.

#### Scenario: Overslag-salto
- **WHEN** et struktureret overslag-salto vælges
- **THEN** bruges redskabsspringets samlede værdi og rotationskategori frem for separat overslagsværdi plus fritstående salto.

### Requirement: Tællende sum og disciplinens gennemsnit
Systemet SHALL vise springets egen D og gymnastens effektive sikkerhed på hver udfyldt omgangsplads, også før alle pladser er udfyldt. Springets egen D SHALL skelnes fra det justerede bidrag til omgangen. Et uafklaret eller nulstillet bidrag MUST NOT skjule en kendt egen D. Et afvigende eller uafklaret bidrag SHALL have en synlig betegnelse og forklaring. Omgangssummen SHALL fortsat følge de tællendes justerede bidrag og sin fuldstændighed. Disciplinens D SHALL være summen af de tre omgangssummer divideret med tre; der MUST NOT divideres med seks igen. Ekstra gymnasters egen D og sikkerhed SHALL vises uden at indgå i summen.

#### Scenario: Beregn fuld disciplin
- **WHEN** omgangssummerne er 3,60, 4,20 og 4,80
- **THEN** vises disciplinens D som 4,20 med den synlige beregning (3,60 + 4,20 + 4,80) / 3.

#### Scenario: En gymnast i holdomgangen
- **WHEN** holdomgangen har én af seks pladser udfyldt med rondat-flik-strakt helskrue, egen D 0,80 og sikkerhed 5
- **THEN** vises D 0,80 og sikkerhed 5/5 ved springet, mens bidrag og omgangssum fortsat markeres ufuldstændige uden et opdigtet referenceelement.

#### Scenario: Kendt springværdi men nulstillet bidrag
- **WHEN** en gyldig serie med egen D 0,80 afviger fra holdomgangens entydige reference og derfor får bidrag 0,00
- **THEN** vises egen D 0,80 og bidrag 0,00 særskilt med forklaring om afvigelsen.

#### Scenario: Ekstra har også egen D
- **WHEN** en gymnast er markeret Ekstra med et kendt registreret spring
- **THEN** vises springets egen D og sikkerhed sammen med Ekstra, uden at værdien lægges til omgangens tællende sum.

#### Scenario: Ukendt springværdi
- **WHEN** springets egen D er uafklaret under holdets regelpakke
- **THEN** vises Uafklaret med relevant begrundelse frem for en opdigtet numerisk D eller et tal hentet fra en anden regelpakke.

### Requirement: Holdomgangens afvigelser påvirker D
Systemet SHALL identificere afvigende præcise serier/elementer i holdomgangen efter pakkens regler. Afvigende D SHALL nulstilles på den korrekte enhed, mens kompositionskonsekvenser vurderes særskilt. Ved uafklaret flertal, herunder stemmelighed, MUST NOT vælges et skjult vilkårligt referenceelement.

#### Scenario: Fem ens og én afvigende baneserie
- **WHEN** fem tællende gymnaster har identisk serie og den sjette har en anden serie med samme D
- **THEN** får den sjette hele seriens planlagte D nul i holdomgangsanalysen, og et særskilt C-forhold vises.

#### Scenario: Uafklaret reference
- **WHEN** holdomgangen er fordelt ligeligt mellem to forskellige serier uden et entydigt flertal
- **THEN** vises afvigelsen og behovet for afklaring med regelhenvisning, og appen hævder ikke et entydigt sikkert D-resultat ved at vælge en serie tilfældigt.

### Requirement: Forbudte og uafklarede værdier
Et ikke-tilladt spring SHALL forklares og udelukkes fra gyldige valgmuligheder. En ukendt eller modstridende værdi SHALL give et markeret uafklaret resultat, ikke nul eller en skjult rettelse. Importerede ugyldige valg SHALL bevares til rettelse.

#### Scenario: Trippel i Danmarksserien
- **WHEN** en importeret opstilling indeholder et trippelroterende element under DK-pakken
- **THEN** markeres det som ikke tilladt, og opstillingen vises ikke som fuldt gyldig.

#### Scenario: Modstridende A4-værdi
- **WHEN** overslag-salto hoftebøjet med halvskrue bruges, før den dokumenterede forskel mellem tabel 1,20 og formel 1,10 er afklaret
- **THEN** vises begge kildebaserede muligheder og et uafklaret resultat; der vises ikke en enkelt autoritativ værdi.

### Requirement: Forklaringer og præcision
Hvert D-resultat SHALL kunne udfoldes til elementbidrag, tillæg, udeladelser, gyldighed og officielle kildepunkter. Mellemregninger SHALL bevares som eksakte rationelle værdier. For den fastlåste DK-udgave SHALL panelværdien nedrundes til nærmeste 0,005 efter pkt. 4.6 ved floor(200*x)/200, efter disciplinens middelberegning; rå værdi og panelværdi SHALL skelnes. Stabilitet MUST NOT indgå som multiplikator i D.

#### Scenario: Ændring på 0,10 hos én gymnast
- **WHEN** ét tællende spring i én omgang forbedres med 0,10
- **THEN** øges den uafrundede disciplin-D med 0,10/3, og forklaringen viser denne sammenhæng uden at ændre de andre omganges bidrag.

#### Scenario: Panelnedrunding
- **WHEN** den rå disciplin-D er 127/30
- **THEN** bevares den eksakte rå værdi, og panelværdien vises som 4,230 frem for almindelig afrunding til 4,235.

### Requirement: Planlagt sværhed er ikke observeret bedømmelse
Resultater SHALL være mærket som planlagte og forudsætte den registrerede udførelse. Systemet MUST NOT udlede faktisk støtte, fald, underrotation eller fodkontakt af stabilitetsvurderingen. En eksplicit planlagt modtagning på pladsen er en trænerbeslutning. Den SHALL indgå efter regelpakkens satser og vises som planlagt, ikke som observeret. Systemet MUST NOT præsentere C+D som en fuld C+D+E-disciplinkarakter. Maks. mulig karakter med planlagte E-fradrag SHALL vises som et loft og MUST NOT betegnes som forventet eller faktisk karakter.

#### Scenario: Lav stabilitet
- **WHEN** et spring vurderes til stabilitet 1
- **THEN** er den kildebaserede D uændret, mens stabiliteten vises som selvstændig information.

#### Scenario: Planlagt kraftig hjælp
- **WHEN** et spring med stabilitet 5 har planlagt Kraftig hjælp
- **THEN** vises pladsens justerede D som planlagt halveret efter kilden, mens stabiliteten fortsat vises uændret.

### Requirement: Kompakt visuel D og sikkerhed på omgangspladsen
En kendt D SHALL vises som et enkelt tal uden den synlige formulering Egen D på Springplanens pladser. D SHALL have en tilgængelig betegnelse og en diskret visuel markering. Sikkerhed SHALL vises som fem trin sammen med vurderingen 1–5; farve MUST NOT være eneste signal. Ikke vurderet SHALL bevare sin særskilte, tilgængelige betydning og MUST NOT vises som en faktisk nulvurdering. Den visuelle forenkling MUST NOT ændre springværdi, omgangsbidrag eller reglers fuldstændighed.

#### Scenario: Aflæs sværhed og sikkerhed
- **WHEN** en plads har en kendt D på 0,80 og sikkerhed 5
- **THEN** vises D-tallet uden Egen D og fem udfyldte sikkerhedstrin sammen med 5/5, og et afvigende eller uafklaret bidrag forklares fortsat særskilt.

### Requirement: Modtagningens D-lag er adskilt fra C-grundlaget
Planlagt Kraftig hjælp SHALL kun påvirke pladsens bidrag til omgangssummen og dermed disciplinens D. Holdomgangens afvigelse SHALL vurderes før modtagningen, og et bidrag, der er nulstillet af afvigelse, SHALL forblive 0. Rækkefølgefradrag og sorteringsforslag efter trænerens Q06-afklaring, Pegasus-kontrol (Q04), gentagelser (Q03), identiteter, tillæg og øvrige C-forhold SHALL bruge springets egen, uhalverede D og identitet. Pladsen SHALL vise egen D og justeret bidrag særskilt med årsagen planlagt modtagning.

#### Scenario: Rækkefølge påvirkes ikke
- **WHEN** omgang 2 har tællende spring med D 0,60 og 0,80 i stigende rækkefølge, og Kraftig hjælp halverer sidstnævntes bidrag til 0,40
- **THEN** giver rækkefølgen ingen fejl, og der foreslås ingen sortering på grund af modtagningen.

#### Scenario: Afvigelse i holdomgangen
- **WHEN** en afvigende plads i holdomgangen har planlagt Kraftig hjælp
- **THEN** er bidraget fortsat 0 på grund af afvigelsen, og C-HOLD identificerer fortsat pladsen som afvigende.

### Requirement: D for en ambition beregnes fra springet
For en ambition SHALL springets egen D og pladsens bidrag beregnes fra springdefinitionen under holdets regelpakke uden en gymnastregistrering. Bidraget SHALL indgå i omgangens tællende sum og disciplinens gennemsnit på samme måde som en besat plads med samme spring, herunder holdomgangens afvigelser. Når springets gyldighed kræver gymnastens personlige forbindelsesbekræftelse, SHALL D vises som uafklaret med forklaring, indtil en gymnast tager pladsen. Systemet MUST NOT opdigte en værdi.

#### Scenario: Omgang med en ambition
- **WHEN** en omgang har fem besatte tællende spring med D 0,60 hver og én tællende ambition med D 0,80
- **THEN** er omgangens D 3,80, og ambitionen vises med D 0,80 og Mangler gymnast.

#### Scenario: Ambition afviger i holdomgangen
- **WHEN** en tællende ambition i holdomgangen har et andet spring end holdomgangens entydige reference
- **THEN** får ambitionen bidrag 0,00 med samme forklaring som en besat plads, mens dens egne D vises.

#### Scenario: Brugerdefineret forbindelse
- **WHEN** en ambition har en brugerdefineret forbindelse, som kræver personlig bekræftelse
- **THEN** vises D som uafklaret med forklaringen, at forbindelsen bekræftes, når en gymnast tager pladsen.

