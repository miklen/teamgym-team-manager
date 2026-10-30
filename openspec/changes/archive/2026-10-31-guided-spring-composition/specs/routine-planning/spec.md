# Spec Delta

## ADDED Requirements

### Requirement: Springplanen giver overblik før opstillingen
For et hold med installeret regelpakke SHALL springplanen vise en sammenklappelig, kompakt guide for den valgte disciplin og det valgte scenarie før de tre omgange, også når alle omgange er tomme. Den lukkede guide SHALL give et kort statusoverblik; når den åbnes, SHALL den adskille planens rammer og kompositionskrav fra tillæg og vise deres aktuelle tilstand uden at kræve gennemlæsning af den fulde C-analyse. En tom eller delvis plan MUST NOT markeres som et gennemført forsøg med faktisk fradrag. Guidens tilstande SHALL afledes af den aktuelle regelbinding og plan; træneren MUST NOT skulle gemme særskilte flueben.

#### Scenario: Tomt scenarie
- **WHEN** træneren åbner et nyt, tomt banescenarie
- **THEN** vises et kort statusoverblik før omgangene, og krav og tillæg kan åbnes med status som ikke påbegyndt eller afventer planvalg, uden at tomme pladser tælles som faktiske fradrag.

#### Scenario: Andet scenarie og disciplin
- **WHEN** træneren skifter fra Plan A på bane til Plan B på trampet
- **THEN** viser guiden kun Plan B's trampetkrav, tillæg og planstatus uden at ændre eller genbruge Plan A's visningsresultater.

#### Scenario: Planen ændres
- **WHEN** træneren ændrer et spring eller flytter en omgang til holdomgang
- **THEN** opdateres guidens relevante tilstande fra samme scenarie som D- og C-analysen, uden at andre scenariers data ændres.

### Requirement: Guiden er kort og fører til detaljer
Den lukkede standardvisning SHALL give kort tekstlig status for omgangene samt tillæg og fradrag. Når guiden åbnes, SHALL hver linje bruge kort betegnelse, synlig tællemetode og tekstlig status eller værdi. På både smalle og brede skærme SHALL krav og tillæg kunne aflæses uden vandret rulning eller lange regelafsnit. Træneren SHALL kunne åbne en linje for regelkrav, kilde, berørte omgange og relevante næste handlinger; handlinger, som kun navigerer eller åbner detaljer, MUST NOT ændre planen. Status og tællemetode MUST NOT formidles alene med farve eller ikon.

#### Scenario: Mobil og tastatur
- **WHEN** træneren åbner springplanen på en smal skærm eller bruger tastatur
- **THEN** kan guiden åbnes med tastatur, hvorefter alle linjer kan læses og åbnes i logisk rækkefølge med synlig tekst for status og tællemetode.

#### Scenario: Se grundlaget
- **WHEN** træneren åbner en uafklaret eller delvis linje
- **THEN** vises den korte årsag og vej til den relevante omgang eller den eksisterende dybere analyse uden at anvende et forslag eller ændre kladden.
