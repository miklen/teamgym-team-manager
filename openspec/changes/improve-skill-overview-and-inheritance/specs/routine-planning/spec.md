# Spec Delta

## MODIFIED Requirements

### Requirement: Gymnaster og kendte færdigheder vælges sammen
En omgangsplads SHALL vælge et aktivt holdmedlem og en af gymnastens registrerede anvendelige færdigheder i den pågældende disciplin. Hver valgmulighed SHALL før valg vise præcist springnavn, relevant saltoretning, springets egen D under holdets regelpakke og gymnastens effektive sikkerhed eller Ikke vurderet. Afledte registreringer SHALL kunne vælges på samme grundlag som egne, når de er aktive og anvendelige. Systemet MUST forhindre samme gymnast på flere pladser i samme omgang, men SHALL tillade deltagelse i flere forskellige omgange og forskellig gymnastbesætning mellem omgange.

#### Scenario: Samme gymnast i flere omgange
- **WHEN** en gymnast vælges i baneomgang 1 og 3
- **THEN** er det tilladt, mens et andet valg af samme gymnast i omgang 1 afvises.

#### Scenario: Ingen registrerede spring
- **WHEN** et holdmedlem uden registrerede baneserier vælges til en baneplads
- **THEN** vises en uafklaret plads og en direkte vej til færdighedsregistrering; appen opfinder eller tildeler ikke et spring.

#### Scenario: Sammenlign sikkerhed og D før valg
- **WHEN** træneren åbner gymnastens springvalg på en omgangsplads
- **THEN** kan spring med D 0,80 og sikkerhed 5 sammenlignes med spring med D 1,00 og sikkerhed 2 direkte blandt mulighederne uden at gemme et midlertidigt valg først.

## ADDED Requirements

### Requirement: Søgbart visuelt springvalg
Springvalget på en omgangsplads SHALL vise registrerede muligheder i adskilte rækker med navn, saltoretning, D og sikkerhed som særskilte visuelle oplysninger. Desktop SHALL bruge faste sammenlignelige kolonner, og mobil SHALL bevare oplysningerne uden vandret overflow. Sikkerhed SHALL bruge fem trin og en talværdi med tilgængelig forklaring ved Ikke vurderet. Listen SHALL kunne søges, betjenes med pile/Home/End/Enter og lukkes med Escape uden at lukke omgangspladsens dialog. Valg SHALL bevares ved lukning af listen, og et gymnastskift SHALL nulstille springvalget. Vælg senere SHALL tillade en plads uden spring. Planen MUST NOT ændres før Opdater.

#### Scenario: Søg og vælg med tastatur
- **WHEN** træneren søger en registreret variant, flytter det aktive valg og trykker Enter
- **THEN** lukkes listen med fokus på springfeltet, og feltet viser valgt navn, D og sikkerhed uden en lang sammenhængende optiontekst.

#### Scenario: Skift gymnast og annullér
- **WHEN** træneren vælger et spring, skifter til en anden gymnast og lukker dialogen
- **THEN** viser listen kun den nye gymnasts anvendelige spring, det tidligere valg er nulstillet, og den gemte plan er uændret.
