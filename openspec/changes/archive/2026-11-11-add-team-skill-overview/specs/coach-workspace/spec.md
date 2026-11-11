## MODIFIED Requirements

### Requirement: Sammenhængende dansk arbejdsflade
Appen SHALL have tydelig navigation mellem arbejdsrum, gymnastkartotek, hold, springopstilling, holdprofil og rytmeoverblik. Aktuelt hold, reglement/version og gemmetilstand SHALL være synlige i relevant kontekst. Produktnavnet SHALL være TeamGym Team Manager, og brugerrettet tekst SHALL være dansk med danske talvisninger.

#### Scenario: Skift mellem hold
- **WHEN** træneren skifter fra hold A's springopstilling til hold B's rytmeoverblik
- **THEN** viser konteksten det nye hold og dets egen regelprofil uden at genbruge det gamle holds resultater.

#### Scenario: Holdprofil i holdets navigation
- **WHEN** træneren har valgt et hold
- **THEN** tilbyder navigationen Holdprofil ved siden af Gymnaster, Springplan og Rytme. Et dybt hash-link til holdets Holdprofil åbner samme visning efter genindlæsning, og skift til et andet hold viser det nye holds profil.
