# Spec Delta

## Purpose

Lader træneren oprette, åbne og gemme et arbejdsrum som en lokal fil med en ærlig arbejdsgang for den aktuelle browsers muligheder og uden at opbevare ugemte gymnastdata skjult i browseren.

## ADDED Requirements

### Requirement: Nyt arbejdsrum kan redigeres før placering vælges
Systemet SHALL lade træneren starte et gyldigt, tomt arbejdsrum og bruge de almindelige redigeringsfunktioner uden Google-forbindelse eller oprettet fil. Første Gem SHALL lade træneren vælge lokal fil eller Google Drive og MUST NOT betegne kladden som gemt, før den valgte fil er skrevet og bekræftet. Annullering af placering SHALL bevare kladden.

#### Scenario: Start uden konto
- **WHEN** en førstegangsbruger vælger Start fra bunden uden Google-forbindelse, opretter et hold og vælger Gem
- **THEN** kan brugeren vælge placering, og holdet forbliver i den ugemte kladde, indtil en fil faktisk er gemt.

#### Scenario: Annulleret første gemning
- **WHEN** træneren lukker valget af placering eller annullerer filvælgeren
- **THEN** kan træneren fortsætte redigeringen af samme kladde uden filoprettelse eller falsk gemt-status.

### Requirement: Lokal fil kan åbnes sikkert
Systemet SHALL åbne en lokal fil, når træneren selv vælger den, og validere arbejdsrummets format, identiteter og referencer før den aktive kladde erstattes. Eksisterende ældre arbejdsrumsformater SHALL følge den eksplicitte migrationsdialog med mulighed for at bevare originalens bytes. En ugyldig, beskadiget, fremmed eller nyere fil MUST NOT opfattes som et tomt arbejdsrum eller overskrives. Åbning af en anden fil SHALL beskytte en ugemt kladde.

#### Scenario: Ugyldig lokal fil
- **WHEN** træneren vælger en JSON-fil, som ikke er et understøttet TeamGym-arbejdsrum
- **THEN** forklares fejlen, og både filen og den hidtil åbne kladde forbliver uændrede.

#### Scenario: Ældre lokal fil
- **WHEN** træneren vælger et understøttet ældre arbejdsrumsformat og accepterer migration
- **THEN** vises den migrerede kladde som ugemt, mens originalfilens bytes først ændres ved en særskilt gemning.

### Requirement: Lokal gemning følger browserens muligheder
Hvor browseren giver et vedvarende filhåndtag og skriveadgang, SHALL Gem skrive til præcis den valgte lokale fil og bekræfte resultatet ved efterfølgende læsning. Hvis filhåndtag eller skrivning i samme fil ikke understøttes, SHALL appen tilbyde download af hele arbejdsrummet og tydeligt forklare, at brugeren selv vælger filen igen ved genåbning. Annullering, nægtet adgang, slettet fil eller skrivefejl MUST NOT kassere kladden eller vise Gemt. En ny redigering under skrivning SHALL forblive ugemt.

#### Scenario: Direkte lokal gemning
- **WHEN** browseren understøtter skrivning i den åbnede fil, og træneren vælger Gem
- **THEN** ligger den bekræftede version i samme fil, og eventuelle ændringer foretaget efter gemmesnapshottet vises fortsat som ugemte.

#### Scenario: Browser uden filhåndtag
- **WHEN** browseren ikke kan skrive tilbage til en valgt lokal fil
- **THEN** tilbydes en JSON-download med forståelig status, og appen lover ikke automatisk genåbning eller overskrivning af den oprindelige fil.

### Requirement: Ændret lokal fil standser uventet overskrivning
Før gemning til en allerede valgt lokal fil SHALL systemet kontrollere den faktisk tilgængelige fil mod den indlæste eller sidst bekræftede basis. En konstateret ekstern ændring SHALL standse den normale gemning, bevare kladden og tilbyde genåbning eller en særskilt kopi. Appen MUST NOT fremstille denne kontrol som en atomisk garanti mod alle eksterne programmer; lokal filbrug forudsætter én redigerende person.

#### Scenario: Filen er ændret uden for appen
- **WHEN** filens indhold afviger fra den kendte basis ved næste Gem
- **THEN** overskrives filen ikke i det normale gemmeforløb, og træneren kan bevare sin kladde som en anden fil.

### Requirement: Seneste lokale filer huskes uden arbejdsrumsdata
Systemet SHALL kunne vise tidligere valgte lokale filer med navn, placeringstype og seneste åbningstid uden at gemme gymnastdata eller ugemte kladder i browserens vedvarende lager. Hvor et filhåndtag kan huskes, SHALL adgang kontrolleres på ny ved åbning fra Seneste. Hvor genåbning via håndtag ikke er mulig, SHALL posten tilbyde Vælg fil igen og kontrollere den valgte fils arbejdsrumsidentitet. Brugeren SHALL kunne fjerne en post fra Seneste; fjernelsen MUST NOT slette filen.

#### Scenario: Filadgang skal gives igen
- **WHEN** træneren vælger en lokal fil i Seneste efter browsergenstart, og adgangen er udløbet
- **THEN** beder appen fra brugerens handling om nødvendig tilladelse eller nyt filvalg og åbner først efter validering.

#### Scenario: Seneste fil er flyttet eller slettet
- **WHEN** et husket filhåndtag ikke længere kan læses
- **THEN** forklares problemet, posten kan fjernes, og appen opretter ikke en erstatningsfil.

### Requirement: Lokal kopi kan bevare en kendt Drive-basis
Når en Drive-fil gemmes som lokal kopi, SHALL kopien bevare nok verificerbar information om den præcise kildefil og fælles arbejdsrumsbasis til senere trevejssammenligning, også efter browsergenstart og uden vedvarende lagring af gymnastdata i browserlageret. Den lokale kopi SHALL være en særskilt fil, og ændringer i den MUST NOT ændre Drive-filen automatisk. Hvis oprindelse eller basis mangler eller er ugyldig, MUST NOT fletning tilbydes som en trevejssammenligning.

#### Scenario: Eksperiment over flere besøg
- **WHEN** en træner gemmer en Drive-fil som lokal kopi, lukker browseren, åbner kopien igen og ændrer en opstilling
- **THEN** er den oprindelige Drive-fil uændret, og den kendte fælles basis er stadig til rådighed for et senere valg om Gennemgå og flet til netop den kildefil.

### Requirement: Ugemte kladder lagres ikke skjult
Systemet MUST NOT gemme et nyt eller ændret arbejdsrums gymnastdata vedvarende i browseren som automatisk kladdegendannelse. Ved lukning eller filskift SHALL appen advare om ugemte ændringer, hvor browseren tillader det, og tilbyde gemning eller eksport før bevidst kassation i appens egne forløb.

#### Scenario: Genindlæsning før første gemning
- **WHEN** træneren forsøger at genindlæse siden med et endnu ikke gemt arbejdsrum
- **THEN** advarer browseren, hvor den tillader det; efter gennemført genindlæsning påstår appen ikke at kunne gendanne kladden.
