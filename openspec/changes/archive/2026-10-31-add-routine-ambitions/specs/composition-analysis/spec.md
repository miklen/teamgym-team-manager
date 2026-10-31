## ADDED Requirements

### Requirement: Ambitioner indgår i C som planlagte spring
Ambitionspladser SHALL indgå i kompositionskrav, tillæg, fradrag og guiden som planlagte spring med deres springidentitet og D. Der vises ingen opdeling mellem besatte pladser og ambitioner. Mixfordelingen SHALL kun vurderes på besatte pladser. Når den stadig kan opfyldes af ambitionspladserne, SHALL kravet vises som ufuldstændigt med henvisning til de ubesatte pladser og MUST NOT forhindre beregning af C. En allerede brudt fordeling SHALL fortsat være ugyldig. Hvis et krav afhænger af, hvilke gymnaster der tager ambitionerne, og udfaldene er forskellige, SHALL resultatet vises som ufuldstændigt med de mulige værdier. En omgang med ambitioner MUST NOT markeres som gennemført.

#### Scenario: Tillæg med ambitioner
- **WHEN** alle tre baneomgange har seks tællende spring, hvoraf fire er ambitioner, og sprungene opfylder et elementtillæg
- **THEN** vises tillægget som opnået i planen, og omgangene viser Mangler gymnast for ambitionerne.

#### Scenario: Mix afhænger af ambitioner
- **WHEN** et mixhold kræver tre piger og tre drenge, og en omgang har to piger, to drenge og to ambitioner
- **THEN** beregnes C, og mixkravet vises som ufuldstændigt med henvisning til de to ubesatte pladser.

#### Scenario: Brudt mix
- **WHEN** de besatte tællende pladser allerede har fire piger på et hold, der kræver tre piger og tre drenge
- **THEN** er mixkravet ugyldigt, uanset ambitionerne.

#### Scenario: Gentagelse afhænger af gymnaster
- **WHEN** gentagelsesreglen afhænger af, om de samme gymnaster udfører et spring, og en af de berørte pladser er en ambition, som giver forskellige udfald
- **THEN** vises fradraget som ufuldstændigt med begge mulige værdier.
