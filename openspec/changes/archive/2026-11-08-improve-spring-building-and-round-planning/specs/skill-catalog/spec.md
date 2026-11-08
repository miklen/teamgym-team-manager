# Spec Delta

## ADDED Requirements

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

## MODIFIED Requirements

### Requirement: Kontrol af forbindelser
Springbyggeren MUST kontrollere kendte orienterings- og forbindelsesbegrænsninger og MUST skelne mellem dokumenteret forbindelse, kendt problematisk forbindelse og ikke-verificeret forbindelse. Reglementsmæssige elementværdier MUST NOT alene godkende enhver elementpermutation som anvendelig serie. En hel serie SHALL registreres særskilt som gymnastens færdighed. En kendt problematisk eller ikke-verificeret forbindelse SHALL give en forklarende advarsel, men MUST NOT i sig selv forhindre bygning eller gemning. Den præcise serie SHALL først behandles som en godkendt kæde, når træneren udtrykkeligt godkender forbindelsen for arbejdsrummet.

Det praktiske forbindelseskatalog SHALL genkende afsluttet forlæns salto i lukket, hoftebøjet og strakt position med hele skruer til rondat eller kraftspring samt ulige halve skruer, fx barani/rudy, til flik eller whipback. Det SHALL også genkende forlæns salto i de tre positioner til vejrmølle. Kataloget SHALL være adskilt fra den udgivne regelpakkes pointalgoritmer. Trænerens godkendelse af den konkrete komplette kæde SHALL kunne læses af planlægningens gyldighedsvurdering uden at ændre udførelsen, personlige vurderinger, revurderingsmarkører eller regelbindingen. Uafklarede eller forbudte elementer MUST NOT blive gyldige alene gennem forbindelsesgodkendelse.

#### Scenario: Almindelig startsalto genkendes
- **WHEN** strakt-rondat-flik-baglæns helskrue bygges eller vælges fra listen
- **THEN** vises den som kendt uden ekstra erklæring om specialforbindelse og kan registreres som én præcis serie med D 1,00 i den aktuelle DK-pakke.

### Requirement: Regelværdi er adskilt fra færdighed
En færdighed SHALL kunne være registreret, selv om den ikke er tilladt eller kendt i det aktuelle holds reglement. Systemet SHALL bevare registreringen og forklare anvendeligheden pr. hold. En fælles trænergodkendelse af en præcis forbindelse SHALL kunne gøre forbindelsen anvendelig på en omgang, men MUST NOT gøre et reglementsforbudt element tilladt eller opfinde en ukendt elementværdi. Ikke-tilladte eller uafklarede elementer MUST NOT tilbydes som fuldt gyldige kandidater i en omgang.

#### Scenario: Flytning ændrer anvendelighed
- **WHEN** en gymnast med et dobbeltroterende spring senere flyttes fra DK til et hold med et reglement, der ikke tillader springet
- **THEN** bevares færdigheden, sikkerheden og en eventuel forbindelsesgodkendelse, mens planlægningen viser elementet som ikke tilladt for det nye hold.

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
