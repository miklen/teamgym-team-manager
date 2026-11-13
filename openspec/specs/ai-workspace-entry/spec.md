# ai-workspace-entry Specification

## Purpose

Giver trænere en offentlig og ajourført vejledning, som deres egen agent kan følge for at registrere oplysninger og færdige omgangsopstillinger direkte i den valgte TeamGym-fil via Google MCP uden adgang til projektets kode.

## Requirements

### Requirement: Agentvejledningen kan bruges fra det valgte arbejdsrum
Systemet SHALL udgive én dansk `SKILL.md` som både læsbar Markdown og installerbar skill for kompatible agenter. Et åbent arbejdsrum SHALL vise en tydelig vej til skillen og en kopierbar starttekst, der identificerer netop den valgte Drive-fil. Den publicerede vejledning MUST NOT indeholde gymnastdata, adgangstokens eller kontoafhængige fil-id'er.

#### Scenario: Træneren starter med sin egen agent
- **WHEN** træneren åbner AI-hjælpen fra et valgt arbejdsrum
- **THEN** kan træneren kopiere et skill-link og et link til den valgte Drive-fil, så agenten kan arbejde med denne fil gennem trænerens egen Google-forbindelse.

#### Scenario: Filen er ikke valgt
- **WHEN** appen ikke har et åbent arbejdsrum
- **THEN** vises ingen starttekst, der foregiver at kende en bestemt datafil.

#### Scenario: Appen har en ugemt kladde
- **WHEN** træneren åbner AI-hjælpen, mens arbejdsrummet har lokale ugemte ændringer
- **THEN** forklarer appen, at agenten kun kan læse Drive-filen, og beder træneren gemme eller eksportere kladden før ekstern redigering.

### Requirement: Vejledningen beskriver hele det aktuelle skriveformat
Skillen SHALL oplyse, hvilket arbejdsrumsformat og hvilke skemaversioner den understøtter, og give agenten et selvstændigt opslag over obligatoriske felter, datatyper, stabile identiteter, referencer, betydende arrayrækkefølge, afledte værdier og gemmemetadata. Den SHALL kræve kontrol af filens faktiske format og version før ændring. Ukendt eller nyere format MUST NOT omskrives, og ældre format MUST NOT opgraderes direkte uden appens eksplicitte migrationsforløb.

#### Scenario: Aktuel fil uden kodebase
- **WHEN** agenten kun får skillen og en aktuel TeamGym-fil
- **THEN** kan den finde kontrakten for de felter, en registrering eller omgangsændring berører, uden at læse repoets kildekode.

#### Scenario: Filen har en anden version
- **WHEN** filens skemaversion ikke matcher den version, skillen beskriver
- **THEN** instruerer skillen agenten i at stoppe direkte skrivning og bruge den aktuelle vejledning eller appens migrationsforløb frem for at gætte en konvertering.

### Requirement: Opslag og registrering bruger præcise identiteter
Skillen SHALL forklare, hvordan agenten finder hold, gymnaster, eksisterende springdefinitioner og gymnastens registreringer i den valgte fil, og hvordan regelpakke og katalogversion styrer opslag af nye definitioner. Den SHALL skelne mellem arbejdsrummets ID'er, katalogets reference-ID'er, officielle koder, navne og springets præcise udførelse. Den MUST kræve afklaring ved tvetydigt match og MUST NOT opfinde en vurdering, dato, variant, forbindelse eller trænergodkendelse ud fra en løs note.

#### Scenario: Note om et eksisterende spring
- **WHEN** noten entydigt beskriver en eksisterende præcis definition hos en gymnast
- **THEN** instruerer skillen agenten i at genbruge definitionen og registreringen eller oprette netop én manglende registrering uden dublet.

#### Scenario: Navn eller kode er ikke entydig
- **WHEN** to katalogposter deler officiel kode eller en note mangler en udførelsesvariant
- **THEN** må agenten ikke vælge på navn eller kode alene og skal bede træneren præcisere springet.

#### Scenario: Note om flersalto med ukendt skruefordeling
- **WHEN** noten beskriver en flersalto med 1–5 halve skruer uden at placere skruen på saltoerne
- **THEN** beder agenten træneren om den præcise fordeling og skriver ingen ny definition ud fra noten. Skillen beskriver format 7 og overlader migration af format 1–6 til appen.

### Requirement: Vurdering og arv bevarer trænerens valg
Skillen SHALL skelne mellem manglende registrering, registreret uden vurdering og sikkerhed 1–5 med vurderingsdato. Den SHALL beskrive egen vurdering, aktiv arv, accepterede relationer, kildevalg, fravalg, barns egne noter og den nødvendige afstemning af effektive værdier. Ændring af en kildes vurdering MUST NOT efterlade aktive arvede børn med forældet sikkerhed eller dato. Skillen MUST NOT gætte arveophav ud fra ens værdier eller generere nye fundamentregistreringer uden et bevidst valg og et gyldigt kataloggrundlag.

#### Scenario: Kildens sikkerhed ændres
- **WHEN** en note ændrer en egen vurdering på en kilde med aktive arvede børn
- **THEN** instruerer skillen agenten i at afstemme børnenes effektive sikkerhed og dato, mens deres ID'er, noter og egne vurderinger bevares.

#### Scenario: Ukendt sikkerhed
- **WHEN** noten siger, at gymnasten kan springet, men ikke angiver en vurdering
- **THEN** kan agenten registrere færdigheden med `stability: null` og `assessedAt: null` uden at omfortolke den som sikkerhed 1.

### Requirement: Færdige scenarier og omgange kan registreres
Skillen SHALL beskrive oprettelse, kopiering og ændring af et scenarie for ét hold og én springdisciplin med præcis tre omgange, unikke ID'er, ordnede udførende pladser og prioriterede reserver. Den SHALL forklare holdomgangens første position, tællende og ekstra roller udledt af pladsrækkefølgen, regelpakkens deltagergrænser, gymnastens egen springregistrering, ambitioner og planlagte modtagningers referencer. Den MUST bevare trænerens angivne rækkefølge og andre scenarier, og MUST NOT påstå, at registrering af en opstilling også beviser dens sportslige kvalitet eller officielle point.

#### Scenario: Træneren har besluttet tre omgange
- **WHEN** træneren giver en entydig opstilling for et nyt banescenarie
- **THEN** kan agenten oprette tre omgange med de angivne gymnaster, spring, roller og reserver, mens andre scenarier og fælles registreringer bevares.

#### Scenario: Kopi af et eksisterende scenarie
- **WHEN** træneren vil bruge et eksisterende scenarie som udgangspunkt
- **THEN** beskriver skillen nye ID'er til scenarie, omgange og pladser samt bevarelse af referencer til fælles gymnaster og færdigheder.

#### Scenario: Manglende kvalitativ observation
- **WHEN** træneren beder om den flotteste afsluttende gymnast uden at have givet en observation af udførelsen
- **THEN** må agenten ikke udlede flot udførelse af stabilitetstallet alene og skal bede om den manglende vurdering.

### Requirement: Direkte gemning har et ærligt og kontrollerbart forløb
Skillen SHALL instruere agenten i kun at ændre den valgte fil, bevare en læst basis, vise en forståelig ændringsoversigt, kontrollere hele den ændrede fil, genlæse filen umiddelbart før skrivning og stoppe ved en opdaget nyere version. Efter skrivning SHALL den genlæse og kontrollere, at den tilsigtede fil og indhold er gemt. Den SHALL forklare, at en almindelig Google MCP-skrivning uden atomisk versionsbetingelse stadig kan overskrive en samtidig ændring mellem genlæsning og skrivning. Den MUST NOT kalde denne vej appens konfliktbeskyttede gemning, love sikker fletning eller opfinde et succesfuldt gemmeresultat efter et uklart svar.

#### Scenario: Ændring før agentens upload
- **WHEN** Drive-filen er ændret siden agentens oprindelige læsning og dette opdages ved genlæsning
- **THEN** instruerer skillen agenten i at stoppe, bevare sit forslag og få ændringerne afstemt før ny skrivning.

#### Scenario: Uklart skriveresultat
- **WHEN** Google MCP ikke giver et entydigt svar på en skrivning
- **THEN** genlæser agenten den valgte fil, før den fortæller træneren, om ændringen er gemt eller forsøger igen.

### Requirement: Skillen følger relevante ændringer i produktet
Udgivne referenceopslag SHALL stemme med den aktuelle skemaversion, de installerede regelpakkers inddatarelevante kataloger og profiler samt det praktiske arvekatalog. Projektets almindelige kontrol SHALL opdage, når en ændring i format, identitet, registrering, arv eller omgangsgrænser kræver fornyet gennemgang af skillen. Automatisk strukturel kontrol MUST suppleres med adfærdsprøver af syntetiske registreringer og scenarier; skillen MUST NOT regnes ajour alene på grundlag af et versionsnummer.

#### Scenario: Nyt filformat
- **WHEN** arbejdsrummets skemaversion eller obligatoriske feltstruktur ændres uden opdatering af skill og reference
- **THEN** fejler projektets almindelige kontrol før ændringen kan betegnes færdig.

#### Scenario: Ændret arveregel eller deltagergrænse
- **WHEN** en inddatarelevant regel ændres uden gennemgang af vejledning og relevante syntetiske eksempler
- **THEN** afslører kontrollen manglende vedligeholdelse eller en adfærdsprøve, der ikke længere svarer til produktet.
