# Spec Delta

## ADDED Requirements

### Requirement: Ambitionens redskab passer til omgangen

En ny eller ændret ambition i en trampetomgang SHALL vælge spring af omgangens aktuelle redskabstype, hvis denne er fastlagt. Ambitionen SHALL fortsat have præcis ét spring, når den gemmes. Et redskabsskift SHALL aldrig stiltiende slette eller tømme en ambition; træneren SHALL for hver berørt ambition vælge et foreneligt spring eller udtrykkeligt fjerne pladsen i forhåndsvisningen. Et nyt spring bygget fra omgangens dialog SHALL være underlagt samme grænse.

#### Scenario: Modsat ambition afvises
- **WHEN** omgangen har et Pegasus-spring, og træneren forsøger at gemme en ambition med et trampetspring
- **THEN** forklares konflikten, og hverken ambition eller ny fælles definition oprettes.

#### Scenario: Redskabsskift med ambition
- **WHEN** træneren skifter en omgang med en Pegasus-ambition til trampet
- **THEN** kræver forhåndsvisningen et konkret trampetspring til ambitionen eller et udtrykkeligt valg om at fjerne netop den plads.
