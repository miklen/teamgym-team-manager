# Browserlagring ved første besøg og Drive-valg

Appen opretter ingen egne cookies og bruger ikke browserlager til statistik, reklamer eller automatisk gendannelse af en ugemt gymnastkladde.

| Lager | Hvornår | Indhold og formål | Nødvendighed og kontrol |
| --- | --- | --- | --- |
| `teamgym-team-manager.connection.v1` (IndexedDB) | Første besøg | En tom forbindelsesstatus og et generationsmærke, så afbrydelse i én fane også gælder i andre faner. | Bruges til at forhindre, at et forsinket svar genopretter afbrudt adgang. |
| Samme lager, med forbindelse | Kun hvis brugeren vælger **Husk Google-forbindelsen** | Konto, valgt filreference, tilladelser og tidsbegrænset adgangstoken. | Valgfrit. Uden valget holdes forbindelsen kun i den åbne side. **Afbryd forbindelse** rydder den gemte forbindelse. |
| `teamgym-team-manager.recent.v1` (IndexedDB) | Første besøg | En afgrænset liste over filreferencer. Listen er tom ved første besøg. | Gør **Seneste** og præcis genåbning mulig. **Fjern** sletter en reference, ikke filen. |
| Samme lager, med lokale filer | Efter valg af lokal fil | Filnavn, arbejdsrumsidentitet og eventuelt browserens filhåndtag. Selve JSON-indholdet gemmes ikke i listen. | Filhåndtaget gør genåbning mulig efter ny tilladelseskontrol; ellers vælges filen igen. |

Google Identity Services og Google Picker hentes først efter en Drive-handling. Login, filvalg og adgangskontrol kræver de komponenter. Google kan anvende egne cookies og browserlagre og vise egne cookievalg; appen bestemmer ikke disse komponenters aktuelle lagring. Undersøg derfor cookies, formål og valg i en browser med reel adgang til Google, før en vurdering af tredjepartsteknologier afsluttes. Hvis der bruges teknologi til andre formål end teknisk nødvendig funktion, skal samtykke håndteres før aktivering med lige tydelige valg for accept og afvisning og mulighed for senere ændring.

Se [Digitaliseringsstyrelsens cookievejledning](https://digst.dk/tilsyn/sporingsteknologiomraadet/cookievejledningen/) for skellet mellem teknisk nødvendig lagring og lagring, der kræver samtykke.
