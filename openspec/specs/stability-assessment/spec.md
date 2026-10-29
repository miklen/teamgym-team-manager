# stability-assessment Specification

## Purpose

Gør trænernes vurdering af den enkelte gymnasts konkrete færdighed sammenlignelig og synlig i springomgange og rytmefællesnævnere uden falsk statistisk præcision.

## Requirements

### Requirement: Fælles skala for spring og rytme
Systemet SHALL bruge én fælles stabilitetsvurdering med heltal 1–5 på komplette baneserier, trampetspring og rytmemomenter; i brugerfladen SHALL den betegnes Sikkerhed. Stabilitet og Sikkerhed MUST NOT være særskilte værdier. Skalaen SHALL forklares med disse fulde betegnelser:

1. Enkelte vellykkede forsøg – lykkes endnu kun sporadisk.
2. Lykkes jævnligt – men med tydelige udsving mellem forsøgene.
3. Lykkes oftest – men enkelte forsøg mislykkes stadig.
4. Stabile udførelser – lykkes gentagne gange til træning.
5. Gennemprøvet under konkurrencepres – udføres stabilt, også når det gælder.

Der MUST NOT indføres konkurrerende statusfelter som under indlæring/konkurrenceklar. Eksisterende gemte tal, datoer, noter og ophav SHALL bevares uden automatisk omvurdering; de nye betegnelser vises også for eksisterende vurderinger. Træneren SHALL fortsat kunne ændre en vurdering med de almindelige vurderingskommandoer og den fælles flettepolitik.

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

### Requirement: Ikke vurderet er forskelligt fra manglende færdighed
Systemet SHALL skelne mellem ingen færdighedsregistrering, en registreret færdighed uden vurdering og en registreret færdighed vurderet 1–5. Tom vurdering MUST NOT erstattes med 0, 1, 3 eller 5.

#### Scenario: Registreret uden vurdering
- **WHEN** træneren tilføjer et rytmemoment uden stabilitetsvurdering
- **THEN** tæller gymnasten som registreret på momentet, men opfylder ikke et filter, der kræver stabilitet mindst 4.

### Requirement: Omgangens aggregater er gennemskuelige
For de tællende pladser SHALL systemet vise aritmetisk gennemsnit af vurderede pladser, laveste vurdering, antal vurderinger på 1–2, antal vurderede og antal krævede/udfyldte pladser. Ved manglende vurderinger eller pladser SHALL aggregatet markeres som ufuldstændigt. Ekstra gymnaster SHALL vises særskilt og MUST NOT stiltiende ændre de tællendes aggregat.

#### Scenario: En usikker gymnast skjules ikke
- **WHEN** seks tællende spring har stabilitet 5, 5, 5, 5, 5 og 1
- **THEN** vises gennemsnit 4,3/5, minimum 1, én lav vurdering og 6/6 vurderet.

#### Scenario: Delvist vurderet omgang
- **WHEN** en omgang har seks valgte spring, hvor fem er vurderet 5 og det sidste ikke er vurderet
- **THEN** vises 5,0/5 blandt de fem vurderede sammen med minimum 5, 5/6 vurderet og en tydelig ufuldstændig tilstand; omgangen fremstår ikke fuldt sikker.

#### Scenario: Ingen vurderinger
- **WHEN** ingen tællende spring er vurderet
- **THEN** vises ikke vurderet og 0/6, ikke et numerisk gennemsnit eller minimum.

### Requirement: Rytmeaggregater bruger det valgte hold
Stabilitet for et rytmemoment SHALL beregnes blandt det aktuelle holds valgte gymnaster med samme gyldige momentvariant. Systemet SHALL vise både færdighedsdækning og vurderingsdækning samt navnene bag mangler/lave værdier. En gymnast uden moment MUST NOT forsvinde fra nævneren.

#### Scenario: To gymnaster mangler momentet
- **WHEN** otte af ti holdmedlemmer har momentet og alle otte er vurderet 5
- **THEN** vises 8/10 kan, 8/10 vurderet og 5,0 blandt de vurderede, og momentet betegnes ikke som fælles for alle.

### Requirement: Stabilitet er en vurdering uden procentløfte
Systemet MUST NOT omsætte skalaen til sandsynlighed, multiplicere værdier som uafhængige chancer eller kalde et gennemsnit sandsynligheden for en vellykket omgang. Stabilitet SHALL vises ved siden af D og C; den MUST NOT reducere eller øge de officielle point.

#### Scenario: Høj D med lav stabilitet
- **WHEN** træneren vælger et sværere spring med stabilitet 1 frem for et lettere med 5
- **THEN** ændres D og stabilitetsoversigten hver for sig, uden opdigtet forventet karakter eller procentchance.

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
