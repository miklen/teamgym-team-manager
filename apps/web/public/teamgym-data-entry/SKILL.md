---
name: teamgym-data-entry
description: Registrér trænerens besluttede TeamGym-data og opstillinger i ét valgt arbejdsrum via brugerens egen Google-forbindelse.
---

# Inddata i TeamGym-arbejdsrum

Brug denne vejledning, når en træner beder dig registrere noter, vurderinger, færdigheder eller en allerede besluttet opstilling i en bestemt TeamGym JSON-fil på Google Drive. Du skal have adgang til filen gennem trænerens egen Google-forbindelse. Et fillink giver ikke i sig selv adgang. Skillen giver hverken adgangstoken eller en ny Google-integration.

1. Få **ét konkret Drive-fil-id** fra træneren. Læs kun den fil og dens revisionsmetadata. Kontrollér `format: "teamgym-team-manager"` og `schemaVersion: 7`. Stop ved et andet, ukendt eller nyere format. Lad appen håndtere migration af format 1–6.
2. Læs [filkontrakten](references/format.md) og [det genererede strukturschema](references/structure-v7.json). Brug [katalogopslagene](references/catalog-v7.json) for filens præcise `rulesetId` og `packageVersion`. Alle opslag er offentlige; arbejdsrummets ID'er findes kun i den valgte fil.
3. Følg [registrering og arv](references/registration.md) ved gymnastdata og [scenarier og omgange](references/scenarios.md) ved planlægning. Bed om præcisering ved tvetydige identiteter, vurderinger, udførelser eller sportslige valg. Registrér en opstilling, som træneren allerede har besluttet; beregn eller lov ikke officiel D/C eller sportslig kvalitet.
4. Lav forslaget på en kopi af den læste fil. Bevar uvedkommende data og arrayrækkefølge. Vis træneren en kort, forståelig ændringsoversigt. Kontrollér hele den ændrede fil efter [gemmeforløbet](references/drive.md), genlæs sent, skriv kun til samme fil-id, og læs igen efter skrivning.

Direkte Google MCP-skrivning er **ikke** appens konfliktbeskyttede gemning. Selv efter sen genlæsning kan en samtidig ændring mellem læsning og upload blive overskrevet. Stop ved enhver opdaget ændring; lov aldrig sikker fletning.

[Kildeoversigt og review](references/source-map-v7.md) viser, hvilke produktkilder de offentlige opslag følger.
