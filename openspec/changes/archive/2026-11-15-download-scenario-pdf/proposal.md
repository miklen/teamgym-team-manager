# Proposal

## Why

Trænere og gymnaster mangler en overskuelig kopi af en konkurrenceplan, som kan deles og læses uden adgang til appen eller internet. Den eksisterende springplan er en redigeringsflade og egner sig ikke som et dokument til forberedelse og hurtigt opslag på konkurrencedagen.

## What Changes

- Det valgte bane- eller trampetscenarie kan downloades med en synlig knap som én PDF med alle tre omgange i deres aktuelle rækkefølge.
- Dokumentet viser startrækkefølge, gymnaster, spring, ekstra pladser, prioriterede reserver, planlagt modtagning og de samme planlagte C- og D-tal som appen i et særskilt, printvenligt layout. Interne sikkerhedsvurderinger udelades.
- Manglende valg, ufuldstændige omgange og eksport fra en ugemt kladde markeres tydeligt. Eksporttidspunktet daterer kopien uden en særskilt Øjebliksbillede-etiket. En almindelig fuld plan med to ekstra og to reserver pr. omgang skal være på én side; yderligere reserver fortsætter uden at bortfalde.
- Download kan bruges fra læseadgang og skriver ikke til arbejdsrummet eller Drive.

## Capabilities

### New Capabilities

- `scenario-pdf-export`: Download af et valgt springscenarie som et delbart og printvenligt PDF-dokument.

### Modified Capabilities

Ingen.

## Impact

Springplanens scenariehandlinger og en ny lokal PDF-præsentation i `apps/web` berøres. Dokumentet læser eksisterende scenarie-, gymnast-, spring- og modtagningsdata samt regelpakkens afledte C- og D-resultater. Der tilføjes ingen gemte felter, nye fletteregler, Drive-kald eller backend; dette begrundes og verificeres i designet efter den fælles flettekontrakt. En browserkompatibel PDF-afhængighed kan blive nødvendig.
