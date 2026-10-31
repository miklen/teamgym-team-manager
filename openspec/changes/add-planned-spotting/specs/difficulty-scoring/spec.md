# Spec Delta

## MODIFIED Requirements

### Requirement: Planlagt sværhed er ikke observeret bedømmelse
Resultater SHALL være mærket som planlagte og forudsætte den registrerede udførelse. Systemet MUST NOT udlede faktisk støtte, fald, underrotation eller fodkontakt af stabilitetsvurderingen. En eksplicit planlagt modtagning på pladsen er en trænerbeslutning. Den SHALL indgå efter regelpakkens satser og vises som planlagt, ikke som observeret. Systemet MUST NOT præsentere C+D som en fuld C+D+E-disciplinkarakter. Maks. mulig karakter med planlagte E-fradrag SHALL vises som et loft og MUST NOT betegnes som forventet eller faktisk karakter.

#### Scenario: Lav stabilitet
- **WHEN** et spring vurderes til stabilitet 1
- **THEN** er den kildebaserede D uændret, mens stabiliteten vises som selvstændig information.

#### Scenario: Planlagt kraftig hjælp
- **WHEN** et spring med stabilitet 5 har planlagt Kraftig hjælp
- **THEN** vises pladsens justerede D som planlagt halveret efter kilden, mens stabiliteten fortsat vises uændret.

## ADDED Requirements

### Requirement: Modtagningens D-lag er adskilt fra C-grundlaget
Planlagt Kraftig hjælp SHALL kun påvirke pladsens bidrag til omgangssummen og dermed disciplinens D. Holdomgangens afvigelse SHALL vurderes før modtagningen, og et bidrag, der er nulstillet af afvigelse, SHALL forblive 0. Rækkefølgefradrag og sorteringsforslag efter trænerens Q06-afklaring, Pegasus-kontrol (Q04), gentagelser (Q03), identiteter, tillæg og øvrige C-forhold SHALL bruge springets egen, uhalverede D og identitet. Pladsen SHALL vise egen D og justeret bidrag særskilt med årsagen planlagt modtagning.

#### Scenario: Rækkefølge påvirkes ikke
- **WHEN** omgang 2 har tællende spring med D 0,60 og 0,80 i stigende rækkefølge, og Kraftig hjælp halverer sidstnævntes bidrag til 0,40
- **THEN** giver rækkefølgen ingen fejl, og der foreslås ingen sortering på grund af modtagningen.

#### Scenario: Afvigelse i holdomgangen
- **WHEN** en afvigende plads i holdomgangen har planlagt Kraftig hjælp
- **THEN** er bidraget fortsat 0 på grund af afvigelsen, og C-HOLD identificerer fortsat pladsen som afvigende.
