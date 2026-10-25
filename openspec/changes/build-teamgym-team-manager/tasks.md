# Tasks

## 1. Projektgrundlag og målrepo

- [x] 1.1 Tilknyt arbejdet til `miklen/teamgym-team-manager`, kontrollér eksisterende fjernindhold før ændringer, og medtag denne OpenSpec-change og projektets frontend-skill; verificér korrekte repo-/branchreferencer og at ingen eksisterende filer er overskrevet.
- [x] 1.2 Opret TypeScript-struktur til statisk webapp, browserbaseret Google-adapter, fælles domæne og regelpakker efter designet med låste afhængigheder; verificér installation, typekontrol og produktionsbyg fra et rent checkout.
- [x] 1.3 Opsæt separate testkommandoer til domæne, Drive-adapterintegration og browserforløb samt lint/typekontrol i CI; verificér at de kan køres uden Google-hemmeligheder og uden lokale parent-filer.
- [x] 1.4 Dokumentér startkommandoer, miljøvariabler og grænsen mellem offentlige kilde-/testdata og private trænerdata; verificér at miljøeksempler er uden hemmeligheder, og at udviklingsdata kun er syntetiske.

- [x] 1.5 Opsæt GitHub Actions-checks og Pages-publicering med korrekt artifact, Pages/OIDC-rettigheder, miljø og deployment-concurrency; verificér repo-base `/teamgym-team-manager/`, hash-dyblink, genindlæsning og offentlig konfiguration uden client secret. Ingen backend må være nødvendig ved drift.
- [ ] 1.6 Udfør tilgængelige T01-tests fra reference/github-pages-drive.md med den ene autoriserede konto og en særskilt JSON-testfil: direkte Drive v2 etag/media-If-Match-kandidat, faktisk CORS og samtidige/stale requests. Efter brugerbeslutning 25. oktober 2026 udfører brugeren to-konto-live-test med trænerteamet efter første publicering; denne del forbliver udestående, ikke bestået. Ingen ubetinget upload eller serverfallback, hvis testen fejler.

## 2. Reproducerbare regelkilder og katalogdækning

Forberedelsesgrundlaget er allerede udarbejdet i [reference](reference/README.md): otte hashregistrerede PDF'er, to komplette dækningslister, regelmatrix, rytmekrav, 77 faste facitcases og seks konkrete faglige spørgsmål. Nedenstående er implementerings- og importkontrol; materialet må ikke erstattes af et nyt, mindre katalog. Ingen appopgave er markeret udført alene på grund af denne planlægning.

- [x] 2.1 Indlæs det medfølgende source-manifest.json og bevar de otte kildefiler; verificér alle hashes fra et rent checkout uden parent-mappen og stop ved ændrede bytes frem for at hente en nyere udgave stiltiende.
- [x] 2.2 Bind DK-profilerne til den medfølgende Teknisk Regulativ 26/27 og hovedreglement v1.4; verificér U14/junior/senior, piger/drenge/mix og at U11 ikke udbydes som DK. Hold fuld licens-/aldersberettigelse uden for produktets løfte.
- [x] 2.3 Importér alle 103 A3/A4-kildeposter fra spring-source-catalog.csv til versionsbundet katalog/diagnostik; kontrollér post-for-post mod kilde og import, at 83 tilladte, 19 forbudte ogén uafklaret er bevaret, og at startposter/alias ikke bliver falske nye identiteter.
- [x] 2.4 Importér alle 94 individuelle A1.1-felter og deres generelle, kategori-, række- og cellekrav efter rhythm-catalog.csv/rhythm-requirements.md; verificér den implementerede model visuelt mod PDF-figurerne, fire bevidst udeladte G-felter samt separate id'er for de to trykte DB804.
- [x] 2.5 Implementér de seks afgrænsede spørgsmål Q01–Q06 og katalogbemærkninger K01/K02 som versionsbundne diagnosedata; verificér uafklarede delresultater/totalsummer og ingen opdigtet standardværdi, kode eller kattespring540°.
- [x] 2.6 Bevar den medfølgende regelmatrixs inputunivers, profilgrænser, formler, kildepunkter og status i implementeringens sporbarhed; verificér at hvert relevant krav er dækket af kode/test eller en begrundet observations-/uafklaret-/scope-status.
- [x] 2.7 Implementér præcise kendte optællinger efter rule-matrix.md, herunder eksakte mellemregninger og panelnedrunding til 0,005; verificér top-tre-D, separat C-berettigelse, nærmeste rene baneomgang og uafhængige bedste omgange pr. tillæg.
- [x] 2.8 Implementér den specificerede uafklarede adfærd for delvise gentagelser/skiftende besætning, blandede redskabsomgange, flertalsgrænser og rækkefølgefejl; verificér6/2/0,3/3/0,3/3,2/2/2,3/2/1 og0,80/0,50/0,60 uden selvvalgt dommerfortolkning. En senere afklaring kræver kilde og ny pakkeversion.
- [x] 2.9 Omsæt alle 77 faste facitcases i reference/fixtures.json til eksekverbare tests med semantisk inputadapter; verificér at forventede værdier aldrig importeres/genereres fra produktionspakken, og tilføj fulde opstillings-/integrationstests ud over delresultaterne.
- [x] 2.10 Opdatér kontrolrapporten i reference/README.md med faktisk implementerings-/testdækning og eventuelle dokumenterede faglige svar; verificér at visuel kildekontrol, samme agents håndregning, beståede tests og ekstern dommergodkendelse beskrives hver for sig og ærligt.

## 3. Domænemodel, filskema og stabilitet

- [x] 3.1 Implementér skemaer og serialisering for arbejdsrum, holdbinding, gymnaster, præcise færdigheder, vurderinger og seks omgange; verificér round-trip med et fuldt syntetisk arbejdsrum og ufuldstændige, men lovlige kladder.
- [x] 3.2 Implementér stabile identiteter, ét valgfrit holdmedlemskab pr. gymnast og unikke registreringer pr. gymnast/færdighed; verificér navnesammenfald, flytning, ingen dubletter og bevarede vurderinger.
- [x] 3.3 Implementér arkivering og diagnosticering af berørte planreferencer frem for skjult sletning/udskiftning; verificér flyttet/arkiveret gymnast, arkiveret færdighed og genaktivering af hold.
- [x] 3.4 Implementér stabilitet 1–5, null, vurderingsdato og note uden konkurrerende indlæringsstatus; verificér afvisning af 0/6/brøktal og adskillelse mellem manglende registrering, null og 1.
- [x] 3.5 Implementér aggregater med gennemsnit, minimum, antal 1–2, vurderingsdækning og krævede/udfyldte pladser; verificér 5,5,5,5,5,1 samt fem femmere og null, tomt input og ekstra gymnaster.
- [x] 3.6 Implementér formatversionskontrol og en eksplicit migrationsgrænse; verificér at beskadiget JSON, almindelig uvedkommende JSON og nyere ukendt skema aldrig bliver til et tomt arbejdsrum eller kan gemmes over.
- [x] 3.7 Dokumentér filformat, invariants, kladdetilstande og stabilitetssemantik med syntetiske eksempler; verificér at eksemplerne validerer med de implementerede skemaer.

## 4. Regelregistry og versionskontrakt

- [x] 4.1 Implementér registry og uforanderlige pakkemanifester med reglements-id, pakkeversion, officiel udgave, profil, kildehenvisninger og algoritmeversioner; verificér at samme id/version ikke kan få andet indhold uden fejl.
- [x] 4.2 Implementér det fælles regelsnit for katalog, gyldighed, D, C, potentiale og rytmeækvivalens; verificér at det kan bruges fra både domænetest og browser uden UI-/Google-afhængigheder.
- [x] 4.3 Implementér stabile færdigheds-id'er med versionsbundne officielle kode-/værdikoblinger og aliasnormalisering; verificér samme udførelse med ny kode og forskellig udførelse med ens værdi.
- [x] 4.4 Implementér kendt/ufuldstændigt/ugyldigt/uafklaret resultat med kilde og berørte identiteter; verificér at ukendt pakke ikke vælger seneste eller anden rækkes regler automatisk.
- [x] 4.5 Opret en tydeligt testspecifik anden regelpakke med andre point, deltagerkrav og rytmeækvivalens; verificér to hold med forskellige pakker i samme arbejdsrum gennem katalog, opstilling og analyse.
- [x] 4.6 Opsæt regressionstest og ændringsrapport mellem gammel/ny pakkeversion; verificér at en fælles ændring, som utilsigtet påvirker gammel version, fanges af kontrollen.
- [x] 4.7 Dokumentér proceduren for at tilføje en række, rette en værdi og ændre en algoritme uden omskrivning af kartotek/UI; verificér vejledningen ved den syntetiske ekstra pakke.

## 5. DK-katalog og forbindelse af spring

- [x] 5.1 Implementér hele det verificerede DK-springkatalog med basisværdier, retning, positioner, rotationer, skruer, redskab og alias; verificér dækning mod gruppe 2's kildeoversigt og særlige A4-konflikt.
- [x] 5.2 Implementér strukturerede formelbaserede varianter uden trykt kode, med klare grænser for gyldighed og uafklarede poster; verificér lovlige tillæg og forbud mod trippel i DK uden at opfinde officielle koder.
- [x] 5.3 Implementér ordnede baneserier og normaliserede identiteter, inklusive gentaget flik, kropsposition pr. rotation og relevant skruefordeling; verificér at samme D ikke giver samme identitet.
- [x] 5.4 Implementér verificerede standardforbindelser, kendte orienterings-/landingsovergange og særskilt ikke-verificeret forbindelse; verificér at enkeltfærdigheder ikke automatisk skaber en behersket serie.
- [x] 5.5 Implementér konkret trænerbekræftelse af specialforbindelser med gyldige elementer uden at kunne tilsidesætte et forbud eller en uafklaret regelværdi; verificér begge begrænsninger i domænetest.
- [x] 5.6 Implementér DK-rytmekatalog med alle 94 individuelle felter, præcise varianter, kode, værdi, krav, kategorier og kilder; verificér katalogdækning mod A1.1 med fire G-felter bevidst udeladt og eksempler på tilladt spejling og uforenelige varianter.
- [x] 5.7 Dokumentér katalogets normalisering og forbindelsesgrænser med kildebaserede eksempler; verificér at hvert eksempel kan genskabes struktureret.

## 6. Sværhedsberegning

- [x] 6.1 Implementér eksakt pointrepræsentation, summer, gennemsnit og regelbestemt formatering; verificér at 0,10/3 og gentagne mellemregninger ikke akkumulerer binære afrundingsfejl.
- [x] 6.2 Implementér banens op til tre forskellige højest værdisatte elementer; verificér 0,80 for rondat-flik-strakt helskrue, uændret D med ekstra flik, 0,60 for kraft-strakt halvskrue og en serie med fire forskellige elementer.
- [x] 6.3 Implementér trampets komplette springværdi og redskabets samlede rotationskategori; verificér at overslag-salto/Tsukahara ikke værdisættes ved at lægge to uafhængige spring sammen.
- [x] 6.4 Implementér holdomgangens identitetsafvigelse og korrekt nulstilling af D; verificér fem ens plus én afvigende med samme D samt uafklaret reference ved stemmelighed.
- [x] 6.5 Implementér tællende omgangssum og disciplin-D uden ekstra division med seks; verificér 3,60/4,20/4,80 giver 4,20 og at ekstra gymnaster ikke ændrer summen.
- [x] 6.6 Implementér forklaringer for bidrag, udeladte elementer, gyldighed og kildetvivl; verificér begge mulige A4-værdier på den berørte variant og ingen påvirkning af sikre andre spring.
- [x] 6.7 Dokumentér planlagt D og afrundingsregler sammen med uafhængigt beregnede fixtures; verificér at stabilitetsændringer ikke ændrer D, og at C+D ikke mærkes som fuld karakter.

## 7. Kompositionsanalyse for begge discipliner

- [x] 7.1 Implementér generelt C-resultat med grundværdi, positive/negative bidrag, rå sum, nedre grænse, status og kildehenvisning; verificér banegrundlag 0, trampetgrundlag 1 og negativ rå sum med C=0.
- [x] 7.2 Implementér banens holdomgang, gentagelser og rene forlæns/baglæns krav med korrekt enhed og nærmeste omgang; verificér rondat som baglæns, blandet serie og forskellen mellem intern elementgentagelse og seriegentagelse mellem omgange.
- [x] 7.3 Implementér trampettens holdomgang, normaliserede gentagelser og med/uden-Pegasus-krav; verificér manglende redskabsomgang og ækvivalente redskabsnavne.
- [x] 7.4 Implementér rotationskategori-før-D-rækkefølge, kildebegrundet behandling af ekstra gymnaster og uafklaret optælling ved Q06; verificér en række med stigende D men forkert enkelt/dobbelt-orden samt korrekt sorteringsforslag.
- [x] 7.5 Implementér banens separate bedste omgang for skrue-/dobbelttillæg og begge fortolkningsspor for elementtillæg; verificér at de to bedste omgange kan være forskellige, og at uafklaret C ikke skjules.
- [x] 7.6 Implementér trampettens skruekrav pr. DK-aldersprofil, Tsukahara/Kasamatsu-særregler og to separate dobbelttillæg; verificér junior 360° kontra 540°, dobbeltsalto 180°, U14-profil og redskab/uden redskab hver for sig.
- [x] 7.7 Implementér ufuldstændige pladser og flow som manglende information/kræver observation frem for opdigtede udfald; verificér at fem planlagte gymnaster ikke automatisk skaber et gennemløb eller fuld udførelseskarakter.
- [x] 7.8 Dokumentér hver beregningsregel med punkt, sats, tælleenhed og mindst ét uafhængigt eksempel; verificér at alle viste C-bidrag kan spores til denne dokumentation og fixtures.
- [x] 7.9 Adskil C-berettigelse fra justeret D i holdomgangen og C-elementgrundlag fra D's tre højeste elementer; verificér facit C09 og en serie med fire forskellige elementer, så D-nulstilling eller D-begrænsning ikke automatisk fjerner gyldige C-bidrag.

## 8. Konkrete muligheder for tillæg

- [x] 8.1 Implementér kandidatgrundlag fra holdets aktive, registrerede og anvendelige komplette færdigheder; verificér at andre holds gymnaster, uregistrerede forbindelser og forbudte/uafklarede spring ikke skaber sikre muligheder.
- [x] 8.2 Implementér beregning pr. tillæg af valgt værdi, regelmaksimum og dokumenteret opnåelig værdi med en vidneopstilling; verificér seks forskellige tællende gymnaster, holdprofil og første holdomgang i vidnet.
- [x] 8.3 Implementér foreslåede konkrete ændringer med D, stabilitet og C-trade-offs uden automatisk anvendelse; verificér scenariet valgt 4/6 til mulig 6/6 med to navngivne ændringer i syntetiske data.
- [x] 8.4 Implementér adskillelse af individuelle muligheder og samlet gennemførlighed; verificér at uforenelige tillægsmaksima ikke lægges sammen til en falsk sikker samlet C.
- [x] 8.5 Begræns tung søgning uden at blokere redigering og markér afbrudt søgning som dokumenteret undergrænse frem for bevist maksimum; verificér resultatstatus, genstart efter dataændring og korrekt cache pr. hold/pakke.
- [x] 8.6 Dokumentér forskellen mellem valgt værdi, holdets dokumenterede mulighed og teoretisk maksimum; verificér dokumentationen mod de viste resultater og test med et hold, der ikke har seks anvendelige kandidater.

## 9. Rytmefællesnævnere i domænet

- [x] 9.1 Implementér momentgruppering og sammenligning efter præcis udførelse og holdets regelpakke; verificér samme familie med uforenelig variant, tilladt spejling og ukendt regelkobling.
- [x] 9.2 Implementér færdighedsdækning, vurderingsdækning, gennemsnit, minimum og navnelister over mangler/lave værdier; verificér 8/10 med otte femmere og at nævneren stadig er ti.
- [x] 9.3 Implementér filteret alle/partielt, kategori, søgning og mindste stabilitet pr. gymnast; verificér at 5,5,5,5,5,1 og én null ikke opfylder »alle mindst 4«.
- [x] 9.4 Implementér genberegning fra den lokale medlems-/færdighedskladde og tomt hold; verificér at en ny gymnast straks kan bryde en fællesnævner uden Drive-gemning, og at et tomt hold ikke kan alle momenter.
- [x] 9.5 Dokumentér rytmefællesnævnernes afgrænsning til individuel kunnen og regelkrav; verificér at domæneoutput ikke indeholder gruppeelementer, automatisk koreografi eller fuld rytmekarakter, og at fælles kode DB804 ikke sammenlægger to forskellige momenter.

## 10. Google-forbindelse mellem besøg

- [x] 10.1 Implementér GIS-browser-tokenmodel, personlig Google-konto, `drive.file` og direkte Picker/Drive-kald uden backend; verificér faktisk konto, manglende scopes, afbrudt samtykke og blokeret/lukket popup.
- [ ] 10.2 Implementér versionsmærket IndexedDB-lagring af access token, modtagelsestid/udløb, scopes, konto og seneste filreference efter designet; verificér browserluk/genåbn og redeploy inden tokenudløb uden nyt login/Picker, udløbsmargin og at ingen refresh token/client secret findes. Privat tilstand/lagerfejl må ikke foregive husket forbindelse.
- [x] 10.3 Implementér tokenudløb/401 og én Fortsæt med Google med genbrugt samtykke, `login_hint`, `prompt:''` og brugerklik; verificér AUTH02–AUTH03, ingen tvungen consent/select_account, ingen baggrundspopup-loop og bevaret kladde ved afbrydelse. Permanent tavs fornyelse må ikke loves.
- [x] 10.4 Implementér Afbryd forbindelse, separat tilbagekaldelse, kontoskift og rydning/meddelelse mellem faner; verificér at tidligere kontos token/arbejdsdata ikke genbruges, at forsinkede GIS-/lagersvar fra gammel forbindelsesgeneration kasseres, og at en allerede afsendt upload håndteres som særskilt muligt udfald.
- [ ] 10.5 Implementér mappevalg/oprettelse og konkret filvalg gennem Google Picker samt personlig rettighedskontrol; verificér at mappevalg ikke giver implicit appadgang til alle børn, og at husket fil-id genkontrolleres før genåbning/gemning.
- [ ] 10.6 Dokumentér Google Cloud-projekt, Pages-JavaScript-origin uden repo-sti, lokale origins, consent-/publiceringsstatus, browsernøglens restriktioner og offentlig buildkonfiguration; verificér samme projekt/konto i GIS/Picker/Drive uden hemmeligheder i artifacts.
- [ ] 10.7 Verificér reel adgang med to autoriserede konti i en særskilt delt testmappe: A opretter, B vælger samme fil med egen adgang; test læser, ophævet adgang og genforbindelse før/efter tokenudløb. Registrér resultater uden credentials/persondata.
- [ ] 10.8 Afprøv vedvarende forbindelseslagring, sletning ved udløb/afbrydelse, teksthåndtering og Pages-kompatibel CSP med GIS/Picker; verificér at tokens aldrig ender i URL, Drive, Git eller logs, og dokumentér fælles origin på `miklen.github.io` uden at kalde repostier sikkerhedsisolering.

## 11. Fælles fil og atomisk betinget Drive-gemning

- [x] 11.1 Implementér konsistent filindlæsning med metadata/etag før og efter indhold, versionsstreng og hash; verificér ændring under indlæsning og ugyldig/nyere fil uden fallback til tomt indhold.
- [ ] 11.2 Implementér den direkte betingede indholdsupload, som faktisk består T01, og lokal serialisering af egne gemninger; verificér med to selvstændige browsere/konti, at højst én upload fra samme basis lykkes. Browserlåse, en ekstra læsning og versionsstreng er ikke atomisk fælles låsning.
- [ ] 11.3 Implementér filupload med lokal skema-/referencevalidering og ny revision uden fil-id-/mappe-/rettighedsændring; verificér komplet round-trip af begge hold og alle seks omgange med faktisk betinget media-upload.
- [x] 11.4 Implementér operations-id/payload-hash uden selvreference, afgrænset historik og genkendelse efter mistet svar; verificér fejl før/efter upload, ændret payload med nyt id og genforsøg efter en anden træners gemning uden at omgå versionskontrollen.
- [x] 11.5 Implementér basis/snapshot/kladde og indlæser-/ændret-/gemmer-/gemt-/fejl-/konflikttilstande; verificér at sene svar ikke fjerner ændringer under upload, og at dobbeltklik ikke giver parallelle uploads fra samme fane.
- [x] 11.6 Implementér konfliktbesked med bevaret kladde, lokal kopi og bevidst genindlæsning uden automatisk merge/overskrivning; verificér A's gemte bytes og B's eksporterbare kladde samt en ændring mellem forkontrol og upload.
- [x] 11.7 Implementér ændringsvarsling ved genaktivering, udløb/genforbindelse og fil-/kontoskift; verificér ny basis-/rettighedskontrol efter Google-fornyelse, ingen erstatningsfil og ingen falsk gemt-status.
- [ ] 11.8 Dokumentér den beviste API-version/requesttype, CORS, fejlstatus og browserforløb DRIVE01–DRIVE05 fra den rigtige Pages-origin; verificér forkert/gammel etag, samtidig media-upload, mistet svar og tokenudløb. Manglende rigtig Google-verifikation er en åben frigivelsesbetingelse, ikke en bestået mock-test.

## 12. Visuelt system og appskal

- [x] 12.1 Anvend frontend-skillen og omsæt designets visuelle tese, indholdsplan og interaktionstese til typografi, spacing, accent og tabellariske tal; verificér en samlet visuel prøve med rigtige UI-tilstande og syntetiske data.
- [x] 12.2 Implementér navigation, arbejdsrums-/holdkontekst, reglement/version og vedvarende gemmeindikator; verificér skift mellem to hold og forskellige sider uden gamle analyseværdier i ny kontekst.
- [x] 12.3 Implementér genbrugelige tilgængelige formularer, vælgere, dialoger, inspektør og stabilitetskontrol med danske labels; verificér tastatur, fokusretur, skærmlæsernavne og null/1-adskillelse.
- [x] 12.4 Implementér responsive layoutprincipper for de fire aftalte skærmstørrelser uden hoverafhængige handlinger; verificér læsbarhed, berøringsmål, zoom og ingen utilsigtet vandret side-overflow.
- [x] 12.5 Implementér korte handlingsunderstøttende overgange og reduceret bevægelse; verificér inspektør, omarrangering og ændrede tal med både normal og reduceret bevægelse.
- [x] 12.6 Dokumentér UI-principper og kontrolpunkter med billeder af centrale arbejdsflader; verificér at løsningen bruger lister/matricer/arbejdsflader og ikke en generisk dashboardkort-mosaik.

## 13. Arbejdsrum, hold og gymnastkartotek i UI

- [ ] 13.1 Implementér login-, vælg/opret-fil- og genforbind-forløb med læse-/fejltilstande; verificér fra tom start til åbent arbejdsrum uden skjult demonstrationsfil.
- [x] 13.2 Implementér holdliste, opret/redigér/arkivér og profilvalg pr. hold; verificér flere hold, juniorpige-standard, andre gyldige DK-profiler og uændret profil på andre hold.
- [x] 13.3 Implementér søgbart gymnastkartotek, navnesammenfald, hold-/uden-hold-filter og medlemsændringer; verificér flytning med bevarede færdigheder og synlige berørte omgangspladser.
- [x] 13.4 Implementér gymnastinspektør med komplet bane, trampet og rytme samt tilføj/redigér/arkivér færdighed; verificér dubletregistrering, note og vurderingsdato uden at tildele enkeltkompetencer automatisk til serier.
- [x] 13.5 Implementér spring-/momentvælgere og bygger med kilde, præcis variant, D, gyldighed og forbindelsesbekræftelse; verificér valg af standardserie, formelvariant og ikke-verificeret specialforbindelse.
- [x] 13.6 Implementér skalaens ankre og fælles stabilitetsredigering i alle tre discipliner; verificér at en vurderingsændring straks opdaterer en allerede valgt omgang og rytmematrix.
- [x] 13.7 Aflever komponent-/browserchecks og kort dansk brugsvejledning for arbejdsrum, kartotek og medlemsændringer; verificér alle tom-, læse-, fejl- og arkiveringstilstande på computer og tablet.

## 14. Seks springomgange og analyser i UI

- [x] 14.1 Implementér begge discipliners tre vedvarende omgange med aktive holdmedlemmer og deres registrerede færdigheder; verificér gem/genåbn af alle seks omgange og afvisning af samme gymnast to gange i én omgang.
- [x] 14.2 Implementér seks tællende og op til to ekstra først med tydelig markering og profilkontrol; verificér at ekstra gymnaster ikke øger D/C/stabilitet, og at en niende plads afvises.
- [x] 14.3 Implementér rækkefølge med mus/berøring og flyt-op/ned samt bevidst sorteringsforslag; verificér rotationskategori før D og at trænerens valg ikke automatisk omarrangeres.
- [x] 14.4 Implementér flytning af valgt holdomgang til førstepladsen med bevaret indhold; verificér rækkefølge og genberegning, og at der altid er én første holdomgang pr. disciplin.
- [x] 14.5 Implementér D pr. gymnast/omgang/disciplin og udfoldelig beregningsforklaring; verificér tællende sum, holdomgangsnulstilling, delresultat ved tom plads og særskilt uafklaret A4-værdi.
- [x] 14.6 Implementér C-oversigt med valgte tillæg, rå fradrag, netto, berørte valg og kildepunkter; verificér begge baneelementspor og at flow vises som kræver observation.
- [x] 14.7 Implementér mulighedsoverblik og forhåndsvisning af konkrete ændringer med D-/C-/stabilitetskonsekvenser; verificér anvend/annuller og at uforenelige potentialer ikke summeres som sikkert samlet resultat.
- [x] 14.8 Implementér omgangens gennemsnit, minimum, lave vurderinger og dækningsgrad sammen med D/C; verificér de aftalte 4,3/5- og 5/6-eksempler og en tydelig ufuldstændig tilstand.
- [x] 14.9 Aflever browserchecks, skærmbilleder og dansk vejledning til hele springplanlægningen; verificér computer, tablet og mobil samt keyboard-only redigering af alle seks omgange.

## 15. Rytmeoverblik under holdsammensætning

- [x] 15.1 Implementér rytmematrix og mindre-skærmsvisning med fastholdt moment-/gymnastkontekst, kategorier, kode, værdi og variantkrav; verificér et hold med mindst 20 syntetiske gymnaster og lange navne.
- [x] 15.2 Implementér fælles/partielt-overblik med navne bag manglende færdighed, manglende vurdering og lav stabilitet; verificér 8/10-eksemplet og tydeligt forskellige celletilstande.
- [x] 15.3 Implementér filtre for kategori, søgning og »alle med mindst stabilitet N«; verificér alle tærskler 1–5, null og uforenelige varianter frem for kun gennemsnitskontrol.
- [x] 15.4 Integrér levende rytmeoverblik i redigering af holdmedlemmer med adgang til den enkelte vurdering; verificér at tilføj/fjern gymnast opdaterer fællesnævnere før gemning.
- [x] 15.5 Implementér ukendt/ændret regelkobling og revurderingsmarkering uden at slette kunnen; verificér forskel på kodeændring og ændret udførelseskrav.
- [x] 15.6 Aflever browserchecks, visuel QA og dansk vejledning til rytmefællesnævnere; verificér tastatur, berøring, tomt hold og at ingen fuld rytmekarakter loves.

## 16. Regelopdateringer og kompatibilitet i UI/data

- [x] 16.1 Implementér holdets reglementside med installerede pakker, valgt version/profil, kilder og kendt tvivl; verificér at produktet kun udbyder godkendte DK-pakker, mens tests kan indlæse en anden pakke.
- [x] 16.2 Implementér før/efter-beregning for eksplicit pakke-/profilskift med D, C, anvendelighed, rytmefællesnævnere og revurderinger; verificér forskellige versioner på to hold og ingen påvirkning af det andet hold.
- [x] 16.3 Implementér annullering og samlet anvendelse af skift i kladden med opdateret planfingerprint; verificér konfliktbeskyttet gemning og at annullering efterlader alle data uændrede.
- [x] 16.4 Implementér ukendt pakke i filen med bevaret binding/data, ingen skjult fallback og fortsat brug af kendte andre hold; verificér genåbning med en app, der ikke har den krævede version.
- [x] 16.5 Implementér understøttet filskemaopgradering separat fra regelversionsskift og sikker rollbackadfærd; verificér at nyere data ikke nedskrives af en ældre app, og at en migration ikke automatisk skifter reglement.
- [x] 16.6 Aflever browser-/integrationstest og vedligeholdelsesvejledning til regelopdateringer; verificér en værdiændring, en algoritmeændring og et ændret momentkrav med bevarede gamle fixtures og færdigheder.

## 17. Samlet accept, drift og GitHub-leverance

- [ ] 17.1 Kør hele trænerforløbet fra Google-arbejdsrum til flere hold, komplet kartotek, færdigheder/stabilitet, alle seks omgange, D/C/potentiale og rytmefællesnævnere; verificér at en anden autoriseret træner kan genåbne og fortsætte samme datafil.
- [ ] 17.2 Kør systemtesten med to sessioner, der gemmer samtidig, læseadgang, ophævet adgang, udløbet session og mistet uploadsvar; verificér ingen overskrivning/tab og sandfærdige tilstande gennem den faktiske driftsskrivevej.
- [x] 17.3 Gennemfør samlet visuel og tilgængeligheds-QA på 1440×900, 1024×768, 768×1024 og 390×844 med tastatur, berøring, zoom og reduceret bevægelse; aflever billeder og en kort kontrolrapport med rettede fund.
- [x] 17.4 Kør typekontrol, lint, relevant fuld testpakke, katalogdækningskontrol, pakke-regressioner og produktionsbyg; registrér kommandoer/resultater, og markér enhver manglende reel Google-verifikation som udestående frem for bestået.
- [ ] 17.5 Verificér ren GitHub Pages-drift fra et checkout: Actions-byg/deploy, korrekt base/dyblink/genindlæsning, HTTPS, offentlig Google-konfiguration, genbrug før tokenudløb og mindst mulig genforbindelse efter udløb; dokumentér T01-beviset og at ingen runtime-backend eller client secret er nødvendig.
- [x] 17.6 Afstem samtlige krav og scenarier i de ti specs med implementering, tests eller dokumenteret manuel kontrol og luk eventuelle huller; verificér at ingen aftalt funktion er udskudt som MVP, død knap eller demonstrationsdata.
- [x] 17.7 Lever kode, dokumentation, kilde-/regeldata, frontend-skill og OpenSpec-status i målrepoet med en gennemgåelig commit/PR; verificér at ændringerne er tilgængelige på GitHub og at ingen private gymnastdata, tokens eller lokale credentials er inkluderet.
- [x] 17.8 Gennemfør selvstændig kontrol af kode mod regelmatrix og kildegrundlag, inklusive bevidste fejlmutationer som 360° i stedet for 540°, forkert sats, dobbelttalt flik og C-filtrering på justeret D; verificér at facittests opdager fejlene, og at hver frigivet numerisk regel har kilde-, fortolknings- og testbevis. Manglende faglig afklaring skal forblive synlig som uafklaret, ikke godkendes af implementeringsagenten selv.

## 18. Brugerens udvidelse: færdige sammensætninger og genbrug

- [x] 18.1 Gør et bredt søgbart bibliotek af komplette juniorserier til standardvalget; bevar Byg selv til sjældne varianter og præcise D-/forbindelsesbegrænsninger.
- [x] 18.2 Medtag synlige, fravælgelige kortere begyndelser uden at kopiere stabilitet eller ændre eksisterende vurderinger/arkivering; verificér rondat-flik-1/1 → rondat og rondat-flik uden omvendt eller skruereducerende inferens.
- [x] 18.3 Genbrug egne springdefinitioner på andre gymnaster efter gem/genåbn med selvstændig vurdering og forbindelsesbekræftelse; aflever browser-/domænekontrol, mobilvisning og dansk vejledning.

## 19. Brugerens udvidelse: flervalg og nedarvet sikkerhed

- [x] 19.1 Tilføj flueben og sikkerhed 1–5/ikke vurderet ved hvert spring, fælles dato og én samlet registrering; bevar valg mellem søgninger, grupper og bane/trampet.
- [x] 19.2 Nedarv sikkerhed og dato til præcise kortere begyndelser fra den valgte serie med lavest D, med direkte kortere vurdering som forrang; verificér klikrækkefølge, dubletter, eksisterende noter og arkivering.
- [x] 19.3 Erstat den tekniske bekræftelsestekst med forståelig angivelse af hele serier, bevar personlig bekræftelse uden kopiering, og aflever domæne-/browserkontrol, mobilbilleder og dansk vejledning.

## 20. Brugerens præcisering: almindelige overgange og entydig serievisning

- [x] 20.1 Vis hovedserien særskilt, saml kortere serier under en udfoldelig overskrift, og gør forlæns/baglæns salto entydig i elementvalg og søgning.
- [x] 20.2 Tilføj praktisk genkendelse af forlæns salto i tre positioner til rondat/kraft og ulige halve skruer til flik/whip; udvid færdige familier uden at ændre den udgivne regelpakkes værdier eller algoritmer.
- [x] 20.3 Verificér strakt-rondat-flik-hel, forkert afslutningsretning og kortere begyndelser med syntetiske browserforløb på mobil/desktop, bevarede vurderinger og separate personlige bekræftelser; aflever vejledning og kontrolrapport.

## 21. Brugerens præcisering: retninger og meningsfulde færdige valg

- [x] 21.1 Fjern kategorien Grundspring, klassificér selvstændige indgange under retning, og hold løs baglæns salto/flik/whip ude af både standard- og egne færdige valg; bevar alle elementer i Byg selv og kræv en indgang ved registrering af nye hele baneserier.
- [x] 21.2 Verificér kategori, filtrering, bevaret filindhold og byggerforløbet baglæns salto → tilføj/flyt rondat foran → registrér komplet serie; opdatér vejledning og kontrolrapport.

## 22. Brugerens udvidelse: samlet UI-overhaling før afslutning

- [x] 22.1 Gennemfør en sammenhængende visuel identitet med selvhostet typografi, desktoprail, mobilnavigation, tydelig hold-/regel-/gemmekontekst og gennemarbejdet startskærm.
- [x] 22.2 Forfin holdvalg, gymnastlister, inspektør, springbibliotek, springomgange og rytmematrix med konsekvent hierarki og tilgængelige kontroller uden at ændre beregnings-/Drive-kontrakten.
- [x] 22.3 Verificér fyldte og tomme arbejdsflader, responsive skærmbilleder, tastatur, reduceret bevægelse og WCAG-kontrol samt regressionsprøver; aflever en lokal testudgave til brugerens godkendelse før commit/push.
- [ ] 22.4 Brugeren afprøver og godkender den lokale UI-kandidat og giver udtrykkeligt klarsignal til commit/push/publicering; derefter verificeres den publicerede udgave. Indtil da forbliver changen åben.

## 23. Brugerens forenkling: fjern arkivfunktion fra UI

- [x] 23.1 Fjern arkivfiltre samt arkiv-/genaktiveringshandlinger fra hold, gymnastkartotek og færdighedsoversigt; bevar ældre filers poster, status og referencer uden automatisk genaktivering eller sletning.
- [x] 23.2 Verificér den enkle arbejdsflade og ældre filers gem/genåbn på mobil og desktop, opdatér krav/vejledning og aflever en ny lokal testudgave før push.

## 24. Brugerens præcisering: Drive-navn og rolig opstart

- [x] 24.1 Omdøb forbindelseshandlingen til Forbind til Google Drive, og skjul startsiden gennem genoprettelse, kontokontrol og automatisk filhentning; bevar forståelige fejl-/genforbindelsesmuligheder og undgå dobbelt filhentning.
- [x] 24.2 Verificér langsomme kontosvar og filhentning uden startsideglimt på mobil/desktop, udløbet adgang, afvist fil, tilgængelig indlæsning og reduceret bevægelse; aflever en ny lokal testudgave før push.

## 25. Brugerens rettelser før commit: filter, fjernelse og saltoretning

- [x] 25.1 Vis Alle hold som standard i gymnastkartoteket, inklusive gymnaster uden hold, og bevar særskilt hold-/uden-hold-filtrering og søgning.
- [x] 25.2 Tilbyd Fjern færdighed med annullering og konsekvens for valgte planpladser; bevar andre registreringer og fælles definitioner, og lad et udtrykkeligt genvalg tilføje færdigheden igen uden dublet eller automatisk gammel sikkerhed.
- [x] 25.3 Vis saltoernes præcise retninger i liste, gymnast, bygger og plan; tilføj særskilte rondat-(flik)-baglæns-baglæns/forlæns-varianter i tre positioner uden ændring af den udgivne regelpakkes tal eller algoritmer.
- [x] 25.4 Verificér filter, fjernelse, annullering, læseadgang, genvalg og saltoretninger ved gem/genåbn på mobil/desktop; aflever en ny lokal testudgave. Commit og push er fortsat sat i bero efter brugerens besked.

## 26. Brugerens rettelse: fjern gymnast

- [x] 26.1 Tilføj Fjern gymnast med personens navn/kendetegn, annullering og antal berørte planpladser. Fjern fra aktive lister og holdoverblik, bevar øvrige personer, færdigheder og planreferencer, og vis forståelig utilgængelighed samt læsetilstand for gamle referencer.
- [x] 26.2 Verificér fjernelse med/uden hold, navnesammenfald, annullering/fokusretur, læseadgang, levende rytme og gem/genåbn på mobil/desktop; aflever ny lokal testudgave uden commit/push.

## 27. Brugerens tekstændring: Opdater

- [x] 27.1 Erstat Anvend i kladde og de tilsvarende udførelses-/opstillings-/regelprofilknapper med Opdater; bevar særskilt Gem på Drive, verificér formularforløb og aflever lokal testudgave uden commit/push.

## 28. Brugerens udvidelse: indsæt Google Drive-link

- [x] 28.1 Tilføj validerede fil-/mappelinks, resource keys og husket filreference uden bredere OAuth-adgang eller ændret konfliktbeskyttelse; verificér parsning, headers og kontoafgrænsning.
- [x] 28.2 Tilføj Åbn fra link og valgfrit mappelink ved oprettelse med målrettet Google-bekræftelse ved manglende appadgang; bevar formular/ugemt kladde ved annullering og fejl, og suspender appdialoger under Google-valget.
- [x] 28.3 Verificér mobil/desktop, direkte åbning, mappestart, ny fil, manglende adgang og fejl; opdatér dansk vejledning og aflever lokal testudgave uden commit/push. Reel Google-verifikation er særskilt og må ikke udledes af mocks.
