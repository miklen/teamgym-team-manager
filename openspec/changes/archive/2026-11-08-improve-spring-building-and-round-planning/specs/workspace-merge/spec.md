# Spec Delta

## ADDED Requirements

### Requirement: Nyt format åbnes ved et eksplicit lokalt valg
Arbejdsrum i format 1–5 SHALL kunne læses gennem den eksisterende migrationskæde, når format 6 indføres. Et ældre arbejdsrum SHALL først opgraderes til en lokal kladde, når træneren udtrykkeligt vælger det i migrationsdialogen. Dialogen SHALL forklare, hvorfor det nye format kræves, at originalen kan eksporteres uændret, og at Drive-filen først ændres ved en særskilt gemmehandling. Annullering MUST NOT erstatte en åben kladde eller skrive til Drive. Personlige forbindelsesbekræftelser SHALL bevares som personlige og MUST NOT automatisk blive fælles godkendelser.

#### Scenario: Åbn format 5 med ugemt kladde
- **WHEN** træneren har en ugemt kladde og åbner en anden fil i format 5
- **THEN** kan originalens bytes eksporteres og opgraderingen annulleres uden at ændre kladden eller uploade, eller træneren kan efter kassationsvalg opgradere den nye fil lokalt til format 6.

#### Scenario: Gem først efter opgradering
- **WHEN** træneren har valgt lokal opgradering af et ældre arbejdsrum
- **THEN** ligger originalfilen fortsat uændret på Drive, indtil træneren særskilt vælger Gem på Drive.

### Requirement: Fælles kædegodkendelse og samlet pladsoprettelse flettes eksplicit
En trænergodkendelse af en komplet springkæde SHALL være fælles data knyttet til en præcis springidentitet og MUST NOT kopieres som en gymnastvurdering. Sammenligning og fletning SHALL vise godkendelse, ændring og fjernelse på dansk og bevare sammenhængen til definitionen. Ens samtidige godkendelser af samme præcise kæde SHALL samles uden dublet. Godkendelse samtidig med ændret udførelse, arkivering eller fjernelse af den refererede definition SHALL kræve et forklaret valg eller samlet valideret afstemning; godkendelsen MUST NOT stiltiende overføres til en anden kæde. Pladser oprettet med antalvalget SHALL fortsat være selvstændige identiteter i omgangens atomiske, ordnede deltagerliste. Forskellige samtidige ændringer i samme omgang SHALL kræve konfliktvalg efter den fælles flettekontrakt, mens uafhængige omgange SHALL kunne flettes. Afledt D, forbindelsesstatus og kan nu-antal SHALL genberegnes og MUST NOT gemmes som selvstændige trænerbeslutninger.

#### Scenario: To sider godkender samme kæde
- **WHEN** to trænere godkender samme præcise springkæde fra samme basis og ændringerne sammenlignes
- **THEN** findes én gyldig fælles godkendelse uden dublet og med samme præcise springidentitet i begge fletteretninger.

#### Scenario: Godkendelse mod ændret udførelse
- **WHEN** én side godkender en kæde, mens den anden ændrer et elements retning i den samme definition
- **THEN** kan resultatet ikke stiltiende anvende godkendelsen på den ændrede kæde; konflikten forklares, og kun en samlet gyldig kladde kan anvendes.

#### Scenario: Antalvalg i samme omgang
- **WHEN** to sider hver tilføjer flere pladser i den samme omgang fra samme basis
- **THEN** behandles de forskellige ordnede deltagerlister som én konflikt med begge springblokke synlige, ikke som en skjult fletning af positioner.

#### Scenario: Antalvalg i forskellige omgange
- **WHEN** én side tilføjer tre pladser i omgang 1, og den anden tilføjer to i omgang 2
- **THEN** kan begge ændringer bevares uden konflikt, når den samlede kladde er gyldig.
