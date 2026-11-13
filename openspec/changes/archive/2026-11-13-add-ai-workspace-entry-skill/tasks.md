# Tasks

## 1. Aktuel filkontrakt og vedligeholdelse

- [x] 1.1 Ret `docs/filformat.md` efter den faktiske format-7-model og migration fra 1–6; kontrollér felter og eksempler mod `schema.ts`, `workspace.ts`, `twist.ts` og de relevante eksisterende domæneprøver.
- [x] 1.2 Byg versionsmærkede, offentlige struktur- og katalogreferencer fra de aktuelle domæne- og regelkilder uden persondata; kontrollér format 7 og de genererede filer mod installerede pakker og schema med en målrettet prøve.
- [x] 1.3 Knyt en kilde-/referenceoversigt og semantisk review-fingerprint inklusiv skruefordeling til `npm run check`, og skriv vedligeholdelseskravet i `AGENTS.md`; verificér, at en syntetisk ændring af skemaversion eller inddatarelevant kilde uden gennemgang gør kontrollen rød.

## 2. Skill til direkte inddata

- [x] 2.1 Opdatér den publicerede `teamgym-data-entry/SKILL.md` med gyldig skill-frontmatter, agentneutral starttekst og fokuserede referencelinks; kontrollér, at samme fil og links kan læses i buildets Pages-sti og som installeret skill-mappe.
- [x] 2.2 Beskriv ID-opslag, præcise spring-/rytmeidentiteter inklusiv skruefordeling, registreringer, vurderingsdatoer, noter og arv med syntetiske eksempler; verificér eksemplernes forventede filtilstand med den eksisterende domænevalidering og målrettede tests af egen/aktiv arv og tvetydige katalogopslag.
- [x] 2.3 Beskriv oprettelse og kopiering af scenarier samt tre omgange med roller, rækkefølge, reserver, ambitioner og modtagninger; verificér mindst ét syntetisk noter-til-scenarie-eksempel med eksisterende scenario- og domæneprøver.
- [x] 2.4 Beskriv direkte Google MCP-læsning og -skrivning for format 7, sen genlæsning, revisionsmetadata, efterkontrol og den accepterede samtidighedsbegrænsning; verificér med en syntetisk ekstern filændring, at appen kan genåbne filen og opdager ændret Drive-basis.

## 3. Indgang i appen

- [x] 3.1 Tilføj en rolig, tilgængelig AI-indgang i arbejdsrummets indstillinger efter projektets frontend-skill med link til skillen, valgt Drive-fillink, kopierbar starttekst og besked om ugemt kladde; verificér kerneforløbet i den berørte browserprøve og kontrollér, at startteksten ikke indeholder token eller andre filers ID'er.
- [x] 3.2 Dokumentér kort brugen af skillen og forskellen mellem inddata og sportslig planlægning i brugervejledningen; kontrollér de publicerede links og den synlige tekst i lokal build.

## 4. Samlet lokal brugertest

- [x] 4.1 Kør én gang `npm run verify:full` for format-7-udgaven efter kontrolniveauerne i `AGENTS.md`, start `npm.cmd run preview:local` på `http://127.0.0.1:5173/teamgym-team-manager/`, kontrollér at app og skill-link åbner, og lad serveren køre til brugerens lokale afprøvning. Afvent udtrykkeligt klarsignal før commit, push eller publicering.
