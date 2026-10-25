# Drive-adapter og kladde

Produktionsadapteren er `packages/drive`. Den bruger direkte browserkald til Drive v2. Følgende er den implementerede protokol; faktisk atomisk media-upload/CORS på Pages er stadig en åben manuel verifikation. CI's simulator beviser appens håndtering, ikke Googles adfærd.

## Basis og rettighed

`GET /drive/v2/files/{id}` indlæser `id,title,mimeType,etag,version,editable,labels(trashed),parents(id),capabilities(canAddChildren)`. Derefter hentes JSON med `alt=media`, og metadata læses igen. Ændret etag/version gentager læsningen, højst tre gange. Først derefter parses/valideres filformat, identiteter og referencer. SHA-256 knytter basis til de indlæste bytes; `version` forbliver en opaque streng.

Hver netværksanmodning henter tokenet gennem forbindelsens aktuelle gyldighedskontrol. Konto verificeres med `about.user`. Genåbning kontrollerer konto og aktuelle filrettigheder igen. Læseadgang, fjernet adgang, papirkurv, forkert JSON og nyere format giver hver sin fejl/tilstand. Ingen af dem opretter en erstatningsfil.

## Upload

Egne gemninger serialiseres. Snapshot af brugerindhold valideres og får operations-id, SHA-256 af `workspacePayload`, revision +1 og tidspunkt. Payload udelader rodens revision, tid og operationshistorik og indeholder derfor ikke sin egen hash. De seneste højst 30 operationer medfølger. En ændret snapshot får nyt id.

Den aktuelle skriverettighed og basis kontrolleres. Selve requesten er:

```http
PUT https://www.googleapis.com/upload/drive/v2/files/{id}?uploadType=media&supportsAllDrives=true
Authorization: Bearer [aktuelt token]
Content-Type: application/json; charset=UTF-8
If-Match: [den oprindelige basis-etag, uændret]
```

Body er den validerede snapshot. Fil-id, navn, mappe og deling ændres ikke. Forkontrollen er ikke en fælles lås; `If-Match` i media-requesten er den atomiske betingelse, som skal prøves mod rigtig Google. Der er ingen ubetinget vej og ingen backend-fallback.

Efter et accepteret svar læses filen konsistent igen. Kun genkendt operation med samme id/hash og aktuel nyttelast kan bekræfte snapshot. Fortsat redigering under upload bevares som ugemt kladde.

## Afvisning og ukendt udfald

| Udfald | Appens reaktion |
| --- | --- |
| 412 eller afvigende basis | Konflikt, kladde bevaret, ingen automatisk merge eller overskrivning |
| 401/udløb | Token slettes, konto-/filhint bevares, ét brugerklik til GIS-genforbindelse |
| 403/læseadgang | Gemning afvises; kladde kan eksporteres |
| 404/410/papirkurv | Filen er væk eller utilgængelig; ingen erstatningsfil |
| Netværk/CORS/mistet svar | Fejl med ukendt udfald; læs konsistent før genforsøg |

Genforsøg efter mistet svar genkender operationshistorikken før ny upload. Hvis operationen er gennemført, men en anden træner siden har gemt, vises begge forhold. Den gamle kladde får aldrig den anden træners nye basis automatisk. Hvis historikken ikke længere indeholder operationen, giver ændret etag stadig konflikt.

En forbindelsesgeneration invaliderer sene Google-svar; en fælles IndexedDB-epoch invaliderer gamle lagerskrivninger. Afbrudt forbindelse stopper nye requests. En allerede afsendt upload kan være gennemført, men dens sene svar genopretter ikke adgang eller arbejdsdata. En kladde, som afbrydes fra en anden fane, isoleres til eksport og bliver ikke data for en ny konto.

Ved genaktivering kontrolleres fjernfilen. En ændring varsles uden at erstatte lokal visning. Genindlæsning kræver bevidst kassation af en ugemt kladde. Før browserluk gives browserens standardadvarsel, hvor den understøttes.

Se [T01](google-t01.md), [testbeslutningen](testbeslutning-2026-10-25.md) og [Google-opsætningen](google-opsaetning.md) for forskellen på implementeret adfærd og faktisk Google-verifikation. Direkte API-referencer: [files](https://developers.google.com/workspace/drive/api/reference/rest/v2/files), [update](https://developers.google.com/workspace/drive/api/reference/rest/v2/files/update).
