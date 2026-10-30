# Tasks

## 1. Regelbundet guidegrundlag

- [x] 1.1 Tilføj en afledt guidemodel til de installerede DK-pakker med kategori, tælleform, kort kravtekst, kilde, status og evidens fra den eksisterende analyse; verificér med faste domæneforventninger for tom, delvis og fuld plan, så guidens tal stemmer med C-bidragene.
- [x] 1.2 Dæk særskilt pr.-gymnast-tillæg i egen bedste omgang, hele omgangskrav og banens versionsbundne gennemsnit; verificér i `tests/domain/spring-engine.test.ts` for 2/6 = 0,20, forskellige bedste omgange, Pegasus, begge DK-versioner og relevante aldersprofiler uden at hente forventede tal fra produktionsreglerne.
- [x] 1.3 Knyt sikre, præcise katalogeksempler til regelmål uden gymnastreference og hold regelmaksimum, foreløbigt planbidrag og dokumenteret potentiale adskilt; verificér i domænetests, at nul registreringer stadig giver træningsmål, at usikre eksempler udelades, og at uforenelige tillæg ikke summeres.
- [x] 1.4 Anvend brugerens positive elementtillæg i DK 1.1.0 uden at ændre DK 1.0.0 eller de fastlåste kildebytes: 0,10 pr. forskelligt C-element ud over seriens første, gennemsnit over tre omgange. Verificér med faste facit for ét element, rondat–flik–flik, rondat–flik–lukket, fire forskellige elementer, delvis plan, begge pakker og korrekt C-total.

## 2. Kompakt springguide i brugerfladen

- [x] 2.1 Vis guidens krav og tillæg efter scenarievalget og før omgangene, og komprimér D/C/profilstriben uden at fjerne dens oplysninger; verificér med browserprøve og visuel kontrol, at tomt scenarie, desktop og mobil viser korte rækker uden vandret rulning eller en lang tekstblok.
- [x] 2.2 Vis tælleform og tekstlig status på hver række, med detaljer, kilde, springeksempel og vej til relevant omgang eller eksisterende analyse ved åbning; verificér med browserprøver for tastatur, skærmlæsertekst, reduceret bevægelse og navigation uden ændring af kladden.
- [x] 2.3 Bind guiden til aktuel disciplin og scenarie samt planens ændringer, og vis foreløbig/uafklaret status uden opdigtede point; verificér med browserprøver for scenarieskift, ændret holdomgang, ufuldstændige pladser, manglende regelpakke og potentialesøgning, der afsluttes efter et skift.
- [x] 2.4 Opdatér `docs/brugsvejledning.md` med den korte guide, tælleformerne, den versionsbundne elementregel og forskellen på træningsmål og registreret kunnen; verificér, at beskrivelsen svarer til den færdige UI og at dokumentationens links virker.
- [x] 2.5 Vis DK 1.1.0's elementtillæg som »pr. serie · over tre omgange« med sikkert planbidrag og et verificeret serieeksempel; fjern Q01 fra denne pakke, bevar usikkerheden i 1.0.0, og lad potentialesøgningen dokumentere separate muligheder uden opdigtet regelmaksimum. Verificér i domæne- og browserprøver samt i versionssammenligningen.
- [x] 2.6 Saml valgte og dokumenterede tillægsbeløb, søgestatus og handlingen til konkret vidneopstilling i guidens tillægsrækker, og fjern den gentagne potentialeliste. Bevar scenarieisolering, annullering og bevidst anvendelse; verificér i browserprøver og dokumentér at denne visningsændring ikke ændrer fælles data eller fletning.
- [x] 2.7 Vis D og C som de primære dynamiske tal, og lad guiden starte lukket med status for færdige omgange samt alle C-tillæg og rå fradrag. Vis den faste holdprofil synligt ved scenariet og uddyb dens rammer i guiden. Afled summerne i regelpakken, marker delvise/uafklarede tal tydeligt, og verificér tom, delvis og fuld plan, begge skærmstørrelser, tastatur, visuel tæthed og uændret fælles data/fletning.

## 3. Samlet verifikation og lokal brugertest

- [x] 3.1 Kontrollér, at ændringen ikke tilføjer gemte felter, id'er, rækkefølger eller nye fletteregler, og dokumentér den ændrede betydning af den endnu ikke push'ede DK 1.1.0 i flettekontrakten og implementeringens verifikation. Dæk relevante samtidige regel-/planændringer og verificér med `npm.cmd run check`, `npm.cmd run test:domain`, `npm.cmd run test:drive`, `npm.cmd run build` og `npm.cmd run test:e2e` samt gennemgang af diffen.
- [x] 3.2 Start `npm.cmd run preview:local`, kontrollér at `http://127.0.0.1:5173/teamgym-team-manager/` åbner, og giv brugeren konkrete punkter til lokal afprøvning; verificér at serveren bliver kørende, og afvent udtrykkeligt klarsignal før commit, push eller publicering.
