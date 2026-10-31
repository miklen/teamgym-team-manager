# Spec Delta

## ADDED Requirements

### Requirement: Pladsen viser og redigerer planlagt modtagning
Hver udfyldt deltagerplads i en bane- eller trampetomgang SHALL give adgang til at planlægge, ændre og fjerne én modtagning uden at forlade springplanen. Pladsen SHALL vise en kompakt og tilgængelig markering af grad, for Kraftig hjælp på bane også det modtagne element, og pladsens justerede D. Markeringen MUST NOT formidles alene med farve eller ikon. Ændringen SHALL ske gennem en domænekommando. Formularer MUST NOT indføre egne regler for nulstilling eller fletning.

#### Scenario: Vælg grad med tastatur
- **WHEN** træneren åbner modtagningsvalget på en plads med tastatur og vælger Kraftig hjælp på en baneserie
- **THEN** vises elementvalget med seriens sidste element valgt, og pladsen viser grad, element og justeret D med tekst.

### Requirement: Planændringer har eksplicit betydning for modtagning
Indsættelse af en reserve på en plads SHALL fjerne pladsens modtagning, da reserver ikke bærer modtagning. Skift af gymnast eller spring på en plads SHALL fjerne modtagningen. Duplikering af et scenarie SHALL kopiere modtagningerne til kopiens pladser, og senere ændringer i kopien MUST NOT ændre originalen. Flytning af en omgang til holdomgang og ændring af rækkefølge eller rolle SHALL bevare modtagningen. Når en indsættelse eller ændring fjerner en modtagning, SHALL bekræftelsen eller ændringsvisningen oplyse det.

#### Scenario: Reserve indsættes
- **WHEN** træneren indsætter en reserve på en plads med planlagt Hjælp til udførelse
- **THEN** har pladsen bagefter ingen modtagning, og indsættelsesvisningen har oplyst, at modtagningen bortfalder.

#### Scenario: Duplikering
- **WHEN** Plan A har en planlagt modtagning, og træneren duplikerer Plan A til Plan B og fjerner modtagningen i Plan B
- **THEN** har Plan A stadig modtagningen.

### Requirement: Potentialeforslag viser bortfald af modtagning
Et konkret forslag, som ændrer springet eller gymnasten på en plads med planlagt modtagning, SHALL i forhåndsvisningen oplyse, at modtagningen bortfalder. Anvendelse SHALL følge de samme regler som en manuel ændring. Søgningen efter C-potentiale MUST NOT bruge modtagning som kriterium.

#### Scenario: Forslag ændrer modtaget spring
- **WHEN** et potentialeforslag udskifter springet på en plads med planlagt modtagning
- **THEN** viser forhåndsvisningen, at modtagningen fjernes, og efter anvendelse har pladsen ingen modtagning.
