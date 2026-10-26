# Spec Delta

## MODIFIED Requirements

### Requirement: Fælles skala for spring og rytme
Systemet SHALL bruge én fælles stabilitetsvurdering med heltal 1–5 på komplette baneserier, trampetspring og rytmemomenter; i brugerfladen SHALL den betegnes Sikkerhed. Stabilitet og Sikkerhed MUST NOT være særskilte værdier. Skalaen SHALL forklares som 1: måske klar til konkurrencen; 2: usikkert, lykkes enkelte gange; 3: lykkes ofte, men svingende; 4: meget stabilt; 5: sikkert og gennemprøvet under konkurrencelignende forhold. Der MUST NOT indføres konkurrerende statusfelter som under indlæring/konkurrenceklar.

#### Scenario: Samme skala i begge kartoteker
- **WHEN** træneren vurderer et trampetspring og et rytmemoment
- **THEN** har begge de samme fem trin og forklaringer under betegnelsen Sikkerhed, og trin 1 kan gemmes som et reelt vurderet niveau.

### Requirement: Vurdering pr. gymnast og præcis færdighed
Vurderingen SHALL knyttes til en bestemt gymnasts præcise færdighed og SHALL kunne opdateres med dato og valgfri note. En vurdering SHALL enten være egen eller komme fra en synligt identificerbar kilde i samme gymnasts eksplicit medtagne fundament. Vurdering MUST NOT overføres til en anden gymnast, bygges opad fra enkeltelementer eller overføres mellem varianter uden en specificeret trænerfaglig relation. Egen vurdering, også et bevidst valg af Ikke vurderet, SHALL have forrang for arv.

#### Scenario: Samme salto i to serier
- **WHEN** en gymnast har egen sikkerhed 5 på rondat-flik-strakt og egen sikkerhed 2 på rondat-flik-strakt med helskrue
- **THEN** beholder serierne hver sin vurdering, og den valgte series værdi bruges i opstillingen.

#### Scenario: Bevidst Ikke vurderet
- **WHEN** et arvet barn sættes til en egen vurdering med Ikke vurderet
- **THEN** er barnets sikkerhed og vurderingsdato tomme, og senere ændringer af parenten overskriver ikke valget.

### Requirement: Vurderingsændringer slår straks igennem
Ændring af en vurdering SHALL genberegne alle berørte lokale spring- og rytmeoverblik og SHALL gemmes i den fælles fil. For børn med aktiv arv SHALL parentens sikkerhed og vurderingsdato slå igennem straks, også når parenten bliver Ikke vurderet. Egne vurderinger SHALL bevares. Der SHALL vises effektiv vurderingsdato og ophav, så en gammel vurdering kan genkendes; ændring af en note alene MUST NOT løsrive eller forny en arvet vurdering.

#### Scenario: Opdater en færdighed i brug
- **WHEN** et valgt springs sikkerhed ændres fra 2 til 4
- **THEN** opdateres omgangens gennemsnit, minimum og antal lave vurderinger uden at springet skal vælges igen.

#### Scenario: Løbende arv i eksisterende plan
- **WHEN** en parent ændres fra sikkerhed 3 til 5 med ny dato, og et af dens børn bruges i en omgang
- **THEN** får barnet straks sikkerhed 5 og parentens dato, og omgangens sikkerhedsoversigt opdateres; barnets note og id bevares.

#### Scenario: Parent bliver ikke vurderet
- **WHEN** parentens vurdering fjernes, mens et barn følger den og et andet har egen vurdering 4
- **THEN** bliver det arvede barn Ikke vurderet uden dato, mens den egne vurdering 4 bevares.

## ADDED Requirements

### Requirement: Vedvarende arv og egne vurderinger
Arvekilder og valg mellem egen vurdering og arv SHALL gemmes og bevares efter genåbning. Brugerfladen SHALL vise Arvet fra med kildens springnavn og tilbyde Egen vurdering samt Følg igen, når en gyldig kilde findes. Egen vurdering SHALL kunne ændres uden at ændre parenten, andre børn eller andre gymnaster. Genoptagelse af arv SHALL vise den aktuelle kilde og anvende dennes aktuelle vurdering og dato.

#### Scenario: Overskriv og genoptag arv
- **WHEN** et barn arver 4, får egen vurdering 2, parenten ændres til 5, og træneren derefter vælger Følg igen
- **THEN** forbliver barnet på 2 indtil Følg igen og får derefter 5 med parentens vurderingsdato.

#### Scenario: Genåbning bevarer vedligeholdelsen
- **WHEN** et arbejdsrum med egne vurderinger og arvede børn gemmes og genåbnes
- **THEN** bevares både værdier og ophav, og en senere ændring af parenten opdaterer fortsat kun de børn, der følger den.

### Requirement: Skift og bortfald af arvekilde
Når flere gyldige kilder findes, SHALL kilden vælges efter lavest kendt D, derefter laveste sikkerhed og stabil identitetsrækkefølge som i springkataloget. En kilde med ukendt D MUST NOT fortrænge en kilde med kendt D. Hvis ingen kilde har kendt D, SHALL en eksisterende gyldig kilde fastholdes, og en ny binding SHALL kræve trænerens kildevalg. Fjernelse eller ændring af en kilde SHALL straks genvurdere afhængige relationer. Findes en anden gyldig kendt kilde, SHALL arv flyttes dertil; ellers SHALL barnet bevares som registreret med Ikke vurderet og tydelig manglende kilde, uden at opfinde en egen vurdering eller slette planreferencer. Ugyldige kildecykler og relationer på tværs af gymnaster MUST NOT accepteres.

#### Scenario: Parent fjernes
- **WHEN** en parent fjernes, og barnet ikke har egen vurdering eller en anden gyldig kilde
- **THEN** bevares barnet med Ikke vurderet og besked om manglende arvekilde; barnets anvendelse i planen viser den manglende vurdering.

#### Scenario: En enklere kilde tilføjes
- **WHEN** et barn arver 5 fra en kilde med D 0,80, og en anden aktiv kilde med D 0,70 og sikkerhed 2 tilføjes
- **THEN** flyttes barnets arvekilde og placering til D 0,70-kilden med sikkerhed 2 og dennes dato, mens en egen vurdering ikke ændres.

### Requirement: Eksisterende vurderinger får ikke gættet ophav
Ved overgang fra en fil uden arveophav SHALL alle eksisterende vurderinger behandles som egne, også Ikke vurderet. Systemet MUST NOT gætte arv ud fra samme værdi, dato, navnelighed eller præcis begyndelse. Eksisterende registreringer SHALL først følge en kilde efter trænerens bevidste valg.

#### Scenario: Ældre ens vurderinger
- **WHEN** en format 1-fil indeholder rondat-flik og en helskrueserie med samme sikkerhed og dato
- **THEN** bevares begge som egne vurderinger, indtil træneren bevidst vælger arv for den korte serie.
