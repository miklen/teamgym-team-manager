# Proposal

## Why

Træneren ser i dag først kompositionskrav og tillæg som en omfattende C-analyse under de tre omgange. Det gør det svært at planlægge omgangene og vælge, hvad holdet skal træne frem mod, før opstillingen er udfyldt.

## What Changes

- Vis en kort, visuel guide over omgangene for den valgte disciplin og det valgte scenarie: planens rammer og krav på den ene side, tillæg på den anden.
- Vis reglementets mål uafhængigt af holdets registrerede færdigheder. Skeln mellem planens aktuelle bidrag, dokumenterede muligheder med registrerede spring og mulige træningsmål, som endnu ikke er registreret som kunnen.
- Angiv tællemetoden direkte på hver linje: eksempelvis tillæg pr. kvalificerende gymnast i den bedste omgang, krav til en hel omgang eller gennemsnit over tre omgange. Et delvist tillæg må ikke ligne et alt-eller-intet-krav.
- Opdatér status fra den aktuelle plan uden selvstændige flueben. Hold regeltekst og detaljer bag en tilgængelig uddybning, og bevar den fulde C-analyse.
- Afgræns første udgave til installerede DK-regelpakker. Liga og personlige, gemte træningsmål indføres ikke med denne ændring.
- Anvend trænerens afklaring af banens elementtillæg i den endnu ikke push'ede DK-pakke 1.1.0: 0,10 pr. forskelligt gyldigt element ud over seriens første, summeret over de tællende og gennemsnittet over tre omgange. Gentagelser af samme element tæller ikke flere gange. DK 1.0.0 bevarer de to oprindelige fortolkningsspor.

## Capabilities

### New Capabilities

Ingen.

### Modified Capabilities

- `routine-planning`: En kompakt guide over omgangene giver orientering før og under planlægningen og er bundet til aktuelt hold, disciplin og scenarie.
- `composition-analysis`: Tillæg og krav viser tælleenhed, nuværende bidrag, regelbaseret træningsmål og uafklarede forhold uden at forveksle dem med dokumenteret opnåelighed.

## Impact

Berører springplanens React-visning og dens responsive layout samt en regelbundet præsentationsmodel i `packages/rules`. DK 1.1.0's C-beregning og potentialesøgning ændres for det afklarede elementtillæg; D og DK 1.0.0's C-spor bevares. Guiden afleder visning fra eksisterende regelbinding, plan og færdighedsregistreringer. Der tilføjes ingen gemte felter, identiteter, rækkefølger eller formularbaserede fletteregler. Betydningen af den endnu ikke publicerede binding til 1.1.0 ændres, så flettekontrakten og relevante samtidighedstests skal gennemgås eksplicit, selv om den gemte struktur er uændret.
