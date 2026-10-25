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
Systemet SHALL vise hver tællende gymnasts D og omgangssummen. Disciplinens D SHALL være summen af de tre omgangssummer divideret med tre; der MUST NOT divideres med seks igen. Ekstra gymnaster SHALL vises uden at indgå i summen.

#### Scenario: Beregn fuld disciplin
- **WHEN** omgangssummerne er 3,60, 4,20 og 4,80
- **THEN** vises disciplinens D som 4,20 med den synlige beregning (3,60 + 4,20 + 4,80) / 3.

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
Resultater SHALL være mærket som planlagte og forudsætte den registrerede udførelse. Systemet MUST NOT udlede faktisk støtte, fald, underrotation eller fodkontakt af stabilitetsvurderingen og MUST NOT præsentere C+D som en fuld C+D+E-disciplinkarakter.

#### Scenario: Lav stabilitet
- **WHEN** et spring vurderes til stabilitet 1
- **THEN** er den kildebaserede D uændret, mens stabiliteten vises som selvstændig information.
