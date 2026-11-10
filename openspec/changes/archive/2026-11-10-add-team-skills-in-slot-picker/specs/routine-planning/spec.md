## MODIFIED Requirements

### Requirement: Søgbart visuelt springvalg
Springvalget på en omgangsplads SHALL vise mulighederne i adskilte rækker med navn, saltoretning, D og sikkerhed som særskilte visuelle oplysninger. For en gymnast er mulighederne de registrerede. For Hele holdet er de holdets anvendelige spring, og kolonnen viser antal gymnaster i stedet for sikkerhed. For en ambition er mulighederne disciplinens springkatalog med Ingen gymnast i stedet for sikkerhed. Desktop SHALL bruge faste sammenlignelige kolonner, og mobil SHALL bevare oplysningerne uden vandret overflow. Sikkerhed SHALL bruge fem trin og en talværdi med tilgængelig forklaring ved Ikke vurderet. Listen SHALL kunne søges, betjenes med pile/Home/End/Enter og lukkes med Escape uden at lukke omgangspladsens dialog. Valg SHALL bevares ved lukning af listen. Et skift af gymnast, herunder til eller fra Ingen gymnast endnu, SHALL nulstille springvalget, undtagen når et spring valgt under Hele holdet overføres til en gymnast, der kan springet. Vælg senere SHALL tillade en plads med gymnast uden spring. Planen MUST NOT ændres før Opdater.

#### Scenario: Søg og vælg med tastatur
- **WHEN** træneren søger en registreret variant, flytter det aktive valg og trykker Enter
- **THEN** lukkes listen med fokus på springfeltet, og feltet viser valgt navn, D og sikkerhed uden en lang sammenhængende optiontekst.

#### Scenario: Skift gymnast og annullér
- **WHEN** træneren vælger et spring, skifter til en anden gymnast og lukker dialogen
- **THEN** viser listen kun den nye gymnasts anvendelige spring, det tidligere valg er nulstillet, og den gemte plan er uændret.

#### Scenario: Skift til Ingen gymnast endnu
- **WHEN** træneren har valgt en gymnasts spring og skifter til Ingen gymnast endnu
- **THEN** nulstilles springvalget, og listen viser disciplinens katalog.

#### Scenario: Holdets spring overføres til gymnasten
- **WHEN** træneren under Hele holdet har valgt et spring og derefter vælger en af de tilbudte gymnaster
- **THEN** står springvalget fortsat på samme springidentitet, nu som gymnastens egen registrering med gymnastens D og sikkerhed.

## ADDED Requirements

### Requirement: Hele holdet som udgangspunkt for en ny plads
Gymnastfeltet på en ny udførende plads eller reserveplads i gymnasttilstand i en bane- eller trampetomgang SHALL tilbyde valget Hele holdet før de enkelte gymnaster, og Hele holdet SHALL være forudvalgt. Ved redigering af en eksisterende plads SHALL pladsens gymnast være forudvalgt. Hele holdet er en midlertidig valgtilstand og MUST NOT kunne gemmes. Opdater SHALL være utilgængelig, og dialogen SHALL kort forklare, at der skal vælges en gymnast. Hele holdet SHALL være adskilt fra Ingen gymnast endnu, som fortsat opretter en ambition. Skift mellem Hele holdet og en gymnast MUST NOT ændre planen før Opdater.

#### Scenario: Ny plads åbner med holdets overblik
- **WHEN** træneren åbner Tilføj plads i baneomgang 2
- **THEN** står gymnastfeltet på Hele holdet, og springlisten viser holdets anvendelige spring i stedet for den første gymnasts spring.

#### Scenario: Redigering beholder gymnasten
- **WHEN** træneren redigerer en eksisterende plads med Anna Eksempel
- **THEN** står gymnastfeltet på Anna Eksempel, og listen viser Annas registrerede spring.

#### Scenario: Hele holdet kan ikke gemmes
- **WHEN** gymnastfeltet står på Hele holdet, uanset om der er valgt et spring
- **THEN** er Opdater utilgængelig, dialogen beder om en gymnast, og planen er uændret.

### Requirement: Holdets spring med antal gymnaster
Under Hele holdet SHALL springlisten vise hver anvendelig springidentitet i disciplinen én gang, også når flere gymnaster har den registreret. Identiteten SHALL følge regelpakkens springidentitet og samme anvendelighed som gymnastens liste: aktiv, ikke arkiveret og med kendt gyldighed. Kun spring, som mindst én ledig gymnast kan, SHALL vises. Ledige gymnaster er aktive holdmedlemmer, der ikke allerede står på en anden plads eller reserveplads i omgangen. Hver række SHALL vise navn, saltoretning, springets D under holdets regelpakke og antallet af ledige gymnaster, der kan springet, fx 4 ledige. Gymnaster, der kan springet, men allerede er placeret i omgangen, SHALL angives sekundært som totalen, fx 4 ledige af 6, og visuelt adskilt fra de ledige med gymnasternes initialer, så træneren kan se hvem. Når listen er indsnævret til et spring, SHALL gymnastlisten kort nævne de placerede gymnaster, der også kan springet. Personlig sikkerhed MUST NOT sammenfattes til et holdtal. Listen SHALL som standard være sorteret efter flest ledige gymnaster og derefter højeste D, og søgning SHALL bruge samme normalisering som gymnastens liste. Når holdet ikke har nogen anvendelige spring med en ledig gymnast, SHALL listen sige det kort og vise vejen til færdighedsregistrering. Antallene er afledte og MUST NOT gemmes.

#### Scenario: Samme spring hos flere gymnaster
- **WHEN** fire ledige gymnaster har rondat – flik – strakt salto registreret, heraf to via afledte registreringer
- **THEN** vises springet én gang med 4 ledige.

#### Scenario: Gymnast allerede i omgangen
- **WHEN** seks gymnaster kan et spring, og to af dem allerede står på omgangens pladser
- **THEN** viser rækken 4 ledige af 6, og de to placerede vises adskilt fra de ledige.

#### Scenario: Ingen ledige kan springet
- **WHEN** den eneste gymnast, der kan et spring, allerede står i omgangen
- **THEN** vises springet ikke under Hele holdet.

### Requirement: Valg af holdets spring indsnævrer gymnasterne
Når træneren vælger et spring under Hele holdet, SHALL gymnastfeltet kun tilbyde de ledige gymnaster, der har en anvendelig registrering med samme springidentitet. Hver gymnast SHALL vise sin effektive sikkerhed for springet, så træneren kan sammenligne før valget. Når træneren vælger en gymnast, SHALL pladsen bruge gymnastens egen registrering af identiteten. Har gymnasten flere anvendelige registreringer med samme identitet, SHALL den med højest effektiv sikkerhed vælges, og træneren SHALL kunne skifte til en anden i springlisten. Træneren SHALL kunne vende tilbage til Hele holdet uden at miste det valgte spring. Valg af et andet spring under Hele holdet SHALL igen indsnævre gymnastlisten. Formularen MUST NOT oprette registreringer eller vurderinger.

#### Scenario: Vælg spring først og gymnast bagefter
- **WHEN** træneren under Hele holdet vælger strakt salto, som Anna (sikkerhed 4) og Bea (sikkerhed 2) kan, og vælger Anna
- **THEN** tilbød gymnastfeltet kun Anna og Bea med deres sikkerhed, og efter Opdater står Annas registrering af strakt salto på pladsen.

#### Scenario: Tilbage til hele holdet
- **WHEN** træneren har valgt Bea og skifter tilbage til Hele holdet
- **THEN** er strakt salto stadig valgt, og gymnastfeltet tilbyder igen Anna og Bea.

### Requirement: Markering af gentagelse mellem omgange
Både gymnastens liste og listen under Hele holdet SHALL markere en springidentitet, som allerede bruges på en tællende plads i en anden omgang i samme scenarie. Ambitioner tæller med, når deres spring har en identitet. Markeringen SHALL nævne de berørte omgange og antal forekomster, fx Omg. 2 x3. Den SHALL fremstå som en advarsel om mulig gentagelse og MUST NOT blokere valget eller angive et fradragsbeløb. Fradraget afgøres fortsat af sammensætningsanalysen. Pladsen, der redigeres, MUST NOT tælle med. Ekstra pladser og reserver tæller ikke. Brug af samme identitet i den aktuelle omgang SHALL vises neutralt som antal i omgangen og ikke som advarsel. Når pladsen oprettes som ekstra eller som reserve, SHALL brug i andre omgange kun vises neutralt, fordi pladsen ikke indgår i gentagelsen. Markeringen SHALL kun vises for discipliner, hvor holdets regelpakke vurderer gentagelse mellem omgange. Den SHALL opdateres, når rollen ændres i dialogen. Markeringen er afledt og MUST NOT gemmes.

#### Scenario: Spring brugt i en anden omgang
- **WHEN** baneomgang 2 har tre tællende pladser med rondat – flik – strakt salto, og træneren tilføjer en tællende plads i omgang 3
- **THEN** viser rækken for springet en advarsel med Omg. 2 x3 i både gymnastens liste og under Hele holdet, og springet kan stadig vælges.

#### Scenario: Gentagelse inden for omgangen
- **WHEN** omgang 3 allerede har to tællende pladser med samme spring, og træneren tilføjer endnu en plads i omgang 3
- **THEN** viser rækken neutralt Brugt 2× i omgangen uden advarsel.

#### Scenario: Ekstra plads
- **WHEN** træneren skifter rollen til ekstra for et spring, der er brugt i omgang 2
- **THEN** ændres advarslen til en neutral oplysning om brugen i omgang 2.

#### Scenario: Redigering af den samme plads
- **WHEN** træneren redigerer den eneste plads med et spring i omgang 2
- **THEN** markeres springet ikke som brugt på grund af pladsen selv.

### Requirement: Holdoverblikket i springvalget er elegant og tilgængeligt
Hele holdet, holdantal og gentagelsesmarkering SHALL følge springvalgets rolige rækkeudtryk med faste kolonner på desktop og uden vandret overflow ved 390 px. Antal gymnaster SHALL være let at skimme. Gentagelse SHALL bruge appens eksisterende advarselssemantik og en form eller tekst, som ikke kun bæres af farve. Hver række SHALL have et tilgængeligt navn med spring, D, antal gymnaster eller sikkerhed og eventuel gentagelse. Overgangen fra holdets liste til den indsnævrede gymnastliste SHALL være rolig og respektere reduceret bevægelse.

#### Scenario: Skærmlæser læser rækken
- **WHEN** en skærmlæser fokuserer en række under Hele holdet med et spring brugt i omgang 2
- **THEN** oplæses fx »Strakt salto, D 0,80, 4 gymnaster kan, brugt i omgang 2 tre gange«.

#### Scenario: Mobil
- **WHEN** springvalget under Hele holdet åbnes ved 390 px
- **THEN** er navn, D, antal og markering synlige uden vandret rulning.
