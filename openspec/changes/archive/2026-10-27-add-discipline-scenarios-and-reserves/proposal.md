# Proposal

## Why

Trænere forbereder ofte flere næsten ens springplaner før en konkurrence og skal hurtigt kunne finde et alternativ ved eksempelvis skader. Én opstilling pr. hold gør variationer besværlige og giver ikke et tydeligt overblik over reserver til hver omgang.

## What Changes

- Hvert hold får selvstændige, navngivne scenarier for bane og trampet. Hvert scenarie indeholder præcis tre omgange; antallet af scenarier er ikke begrænset til Plan A, B og C.
- Træneren kan oprette et tomt scenarie, duplikere hele et eksisterende scenarie, omdøbe, skifte og slette. Kopier har selvstændige opstillinger og bevarer de samme referencer til det fælles gymnast- og færdighedskartotek.
- Alle scenarier er ligeværdige. Navngivningen beskriver formålet; der indføres ingen udpegning, godkendelse eller aktivering af en fælles konkurrenceplan.
- Hver omgang får sin egen prioriterede reserveliste. Reserver gælder hele omgangen og er ikke bundet til en bestemt gymnast. De adskilles fra ekstra gymnaster og påvirker først omgangens beregninger, når de sættes ind.
- D, C, sikkerhed, mangler og konkrete ændringsforslag følger det viste scenarie. Andre scenariers opstillinger ændres ikke ved redigering.
- UX og UI skal opleves som en smuk, moderne, elegant og intuitiv app. Projektets frontend-skill omsættes til et konkret design for scenarienavigation, reserveoversigt, responsive tilstande, tilgængelighed og meningsfuld bevægelse samt en visuel kvalitetskontrol.
- **BREAKING:** Arbejdsrummets format udvides til scenarier og reserver. Eksisterende opstillinger bevares som Plan A i hver disciplin gennem en eksplicit lokal migration før en eventuel bevidst gemning.

## Capabilities

### New Capabilities

Ingen nye selvstændige capabilities; funktionerne udvider de eksisterende områder nedenfor.

### Modified Capabilities

- `routine-planning`: flere scenarier pr. disciplin, selvstændig redigering og duplikering, reserver til hele omgangen og beregninger for et entydigt valgt scenarie.
- `coach-workspace`: elegant scenarienavigation og reservebetjening med konkrete krav til visuel kvalitet, mobil, tastatur, fokus, lange navne og mange scenarier.
- `drive-workspace`: validering, lokal formatmigration og bevaring af samtlige scenarier og reserver gennem gemning, genåbning og eksport.
- `team-roster`: berørte planpladser ved fjernelse eller flytning af gymnaster skal findes på tværs af alle scenarier og reservelister og bevare deres referencer.
- `ruleset-versioning`: holdets regelbinding og konsekvensvisning skal omfatte alle holdets scenarier i begge discipliner, også dem der ikke er åbne.

## Impact

Berører domænets format, validering og plankommandoer; regelmotorens valg af scenarie, potentialeforslag og regelversionsskift; springplanens UI samt gennemgang af berørte gymnast- og færdighedsreferencer. Drive-adapterens migrations- og filrundtur skal understøtte det nye format med den eksisterende konfliktbeskyttede gemning.

Der forventes ingen ny runtimeafhængighed, ekstern tjeneste eller backend. Ændringens adfærdskrav ligger i deltaspecifikationerne under `specs/`, og implementeringsrækkefølge og verifikation beskrives i `tasks.md`.
