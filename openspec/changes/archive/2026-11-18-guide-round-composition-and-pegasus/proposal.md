# Proposal

## Why

Træneren ser i dag flere C-fradrag og sammensætningsmangler i en samlet guide, men kan ikke altid se direkte på de berørte pladser, hvorfor omgangen giver fradrag, eller hvad der kan rettes. Appen tillader desuden at planlægge Pegasus og trampet i samme omgang, selv om redskabet ikke kan flyttes under en omgang.

## What Changes

- Vis løbende, stedfæstet feedback på plads, omgang og scenarie for de sammensætningsforhold, som den valgte regelpakke faktisk kan afgøre. Forklar årsag, status og mulig rettelse uden at gøre uafklarede forhold til sikre fradrag.
- Gør springvalg i samme trampetomgang entydigt til Pegasus eller trampet. **BREAKING:** nye blandede valg afvises også i delvise kladder; gamle blandede planer kan stadig åbnes og rettes.
- Tilbyd en bevidst »Skift redskab«-handling, som viser konsekvenserne før anvendelse og bevarer gymnaster, roller og rækkefølge. Uforenelige springvalg fjernes eller erstattes kun efter trænerens konkrete valg.
- Lad reserveindsættelse, ambitioner, forslag og fælles fletning respektere samme grænse, og opdatér vejledningen til AI-dataindtastning.

## Capabilities

### New Capabilities

Ingen.

### Modified Capabilities

- `composition-analysis`: Stedfæstede og kildefaste sammensætningsfund med korrekt foreløbig/uafklaret status.
- `routine-planning`: Løbende feedback, entydigt redskab pr. omgang og en gennemskuelig handling til redskabsskift på tværs af alle planlægningsveje.
- `routine-ambitions`: Ambitioner indgår i redskabsgrænsen uden stiltiende at miste deres obligatoriske spring.
- `workspace-merge`: Samtidige ændringer må ikke skabe en ny blandet omgang uden synlig konflikt eller blokering; ældre blandede kladder bevares til rettelse.

## Impact

Berører regelanalysen i `packages/rules`, planlægningskommandoer i `packages/domain`, forslagsanvendelse og springvisningen i `apps/web` samt relevante domæne-, regel- og browserprøver. Ingen nye gemte felter eller formatversion planlægges: markeringer og beløb afledes af eksisterende scenarie, pladser, spring og regelbinding. Identiteter, rækkefølge og afhængige værdier kræver særskilt flettepolitik og samtidighedsprøver, fordi gyldigheden af de eksisterende felter ændres.
