# Springbibliotek

Springregistrering starter med **Vælg fra listen**. Biblioteket rummer 239 færdige banesammensætninger, 24 selvstændige spring med indgang fra tilløb og 35 komplette trampetspring i den installerede DK-pakke. Søgningen forstår navne og aliaser som `rondat-flik-1/1`, `flik hel`, `kraft barani` og `rudy`. Vælg Forlæns, Baglæns, Blandede, Med/Uden redskab eller Egne spring for at begrænse listen. D følger altid holdets regelpakke.

Kategorien Grundspring er fjernet. Fx rondat, kraftspring og forlæns salto ligger under deres retning. Løs baglæns salto, flik og whipback tilbydes som dele af komplette serier med indgang. Alle elementer findes fortsat i **Byg selv**, men en ny hel baneserie kan først registreres, når en indgang fra tilløb står først. Det gælder også egne genbrugelige definitioner i listen. Filtreringen ændrer ikke allerede gemte registreringer eller det officielle elementkatalog.

De færdige serier dækker disse afgrænsede familier:

| Indgang | Afslutninger og varianter |
| --- | --- |
| Rondat–flik | Lukket, hoftebøjet, strakt, halv/hel/halvanden/dobbelt skrue samt dobbelt lukket/hoftebøjet salto |
| Rondat–flik–flik | Samme afslutninger med den ekstra flik bevaret i den præcise serie |
| Rondat–whipback og rondat–flik–whipback | Samme afgrænsede baglæns afslutninger |
| Rondat direkte til salto | Lukket, hoftebøjet, strakt og de fire ovenstående strakte skruevarianter |
| Rondat med eller uden flik til to saltoer | Baglæns → baglæns og baglæns → forlæns, med lukket/hoftebøjet/strakt position på begge saltoer |
| Kraftspring og flyvespring | Lukket, hoftebøjet, strakt, barani, helskrue, rudy, dobbeltskrue og randy |
| Lukket/hoftebøjet/strakt startsalto–kraftspring | Samme otte forlæns afslutninger samt den kortere startsalto–kraft-serie |
| Lukket/hoftebøjet/strakt startsalto–rondat–flik | Ni baglæns afslutninger, herunder helskrue, samt de kortere begyndelser |
| Barani/rudy samt lukket/hoftebøjet halvskrue til flik eller whipback | Ni baglæns afslutninger og de kortere indgange |

Listen er udarbejdet med udgangspunkt i brugerens `Springgrundlag-Juniorpiger.md` og det tilknyttede `Banespring-Udviklingsspor-Juniorpiger.md`, som præciserer bl.a. strakt flik-1/1, kraft-barani og strakt-kraft-rudy. GymDanmarks [TeamGym-samling](https://gymdanmark.dk/arrangement/teamgym-samling-1/) beskriver også hofte/strakt-kraft-barani og rondat-flik-dobbelt som relevante sammensætninger. De præcise elementer hentes fra appens fastlåste A3/A4-katalog; opskrifterne indfører ingen nye officielle koder eller point.

Ingen serie tildeles en gymnast alene ved at findes i biblioteket. Sæt flueben ved de spring, gymnasten kan udføre som en hel serie uden mellemtrin, og vælg **Sikkerhed** 1–5 ud for hvert spring. Ikke vurderet kan også vælges. Angiv vurderingsdato, og registrér alle valgene i én handling. Valg og vurderinger bevares mellem søgninger, grupper og skift mellem bane/trampet. En allerede registreret færdighed genbruges og får den direkte valgte vurdering uden en dublet.

Fluebenet under denne forklaring er trænerens personlige angivelse af, at gymnasten kan hele serien. Det erstatter listens tidligere ekstra bekræftelsesfelt. For en egen serie opbygges en ny personlig bekræftelse på den valgte gymnast; en anden gymnasts bekræftelse kopieres ikke. Den frie bygger bruger den konkrete formulering **Gymnasten kan udføre hele serien uden mellemtrin**, når en særlig sammensætning skal bekræftes. Biblioteket ændrer ikke den udgivne regelpakkes algoritmer eller gør forbudte/uafklarede elementer gyldige.

## Kortere begyndelser

**Medtag kortere serier med samme sikkerhed** er valgt som standard. Rondat–flik–1/1 med sikkerhed 4 medtager rondat og rondat–flik med sikkerhed 4 og samme vurderingsdato. De kan gennemgås før registrering og fravælges. Der udledes kun præcise begyndelser: hverken mindre skrue, anden kropsposition, nye afslutninger eller omvendt sammenbygning af enkeltfærdigheder.

**Brugerens regel for fælles begyndelser:** Hvis flere valgte serier deler en kortere serie, arves sikkerheden fra serien med **lavest sværhed (D)**, fordi den er tættest på den korte serie i udførelse. Fx giver en halvskrueserie med D 0,70/sikkerhed 2 og en helskrueserie med D 0,80/sikkerhed 5 sikkerhed 2 til rondat og rondat–flik. Vælges den korte serie særskilt med en anden vurdering, har den direkte vurdering forrang. Ved samme D bruges den laveste sikkerhed; klikrækkefølgen ændrer ikke resultatet.

Arv kan opdatere en eksisterende kortere vurdering, men bevarer id og note. Arkiverede registreringer ændres ikke. Et tomt sikkerhedsfelt på en længere serie sletter ikke en kendt vurdering af en kortere serie. Nedarvning sker i den samlede registrering; der etableres ingen permanent binding mellem efterfølgende individuelle vurderinger. En serie med ekstra flik bevarer elementrækkefølgen, men den gentagne flik giver fortsat ikke ekstra D.

## Byg én gang, genbrug

Byggeren viser **Valgt serie**, fx *Strakt – rondat – flik – helskrue*. De automatisk medtagne begyndelser ligger særskilt under **Medtagne kortere serier (3)** som *Strakt*, *Strakt – rondat* og *Strakt – rondat – flik*. Oversigten er lukket som standard. Elementvalg viser tydeligt **forlæns** og **baglæns**, og søgning som `baglæns 360` eller `forlæns helskrue` finder den relevante retning.

Det praktiske forbindelseskatalog `coach-connections-2` genkender forlæns salto i alle tre positioner med hele skruer til rondat/kraft og med ulige halve skruer til flik/whipback. Kendte serier vises uden felt om specialforbindelse. Hvis en forlæns salto vælges efter flik, gives en konkret forklaring om den baglæns afslutning til den almindelige serie. Trænerens valg omskrives ikke automatisk.

Genkendelsen er en klientfunktion, som er adskilt fra den fastlåste DK-pakkes pointberegning. Når træneren registrerer den konkrete hele serie på gymnasten, kan en personlig bekræftelse lagres uden at omklassificere udførelsen som en specialserie. Den udgivne DK-pakke kan læse bekræftelsen; dens algoritmer, D/C, binding og filformat ændres ikke. Noter, sikkerhed og revurderingsmarkører nulstilles ikke af selve bekræftelsen.

**Byg selv** bevarer elementbyggeren og de præcise varianter til spring, som mangler i listen. Giv serien et navn og registrér den; definitionen ligger derefter i det fælles arbejdsrums `skills` og findes i listen på andre gymnaster. Færdighedens navn er også søgbart, når den samme udførelse allerede findes som standardspring.

Gem arbejdsrummet på Drive for at bevare egne spring til næste åbning og dele dem med de andre trænere, der bruger samme fil. Vurdering, vurderingsdato, note og personlig forbindelsesbekræftelse følger den enkelte gymnast og kopieres ikke. Der er ingen ny filtype, særskilt browserdatabase eller automatisk ændring af eksisterende færdigheder.

## Kontrol

Elleve domænetests kontrollerer håndregnede D-eksempler, præcise begyndelser, fravalg, dubletter, fælles begyndelser med forskellige D-/sikkerhedsværdier, direkte forrang, dato, bevarede noter/arkivering, atomisk fejl ved ugyldig dato og genbrug efter fil-roundtrip uden kopieret vurdering/bekræftelse. Seks browserprøver dækker flervalg, vurdering og arv ved 1440 og 390 px, genbrug af egne spring og valg mellem grupper/discipliner. Axe kontrollerer bibliotekets tilgængelighed. Testpersoner og Drive-svar er syntetiske; dette er ikke en ny reel Google-/flerbrugertest.
