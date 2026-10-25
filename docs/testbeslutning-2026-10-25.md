# Testbeslutning · 25. oktober 2026

Brugeren har bekræftet, at Google-login fungerer med den tilgængelige konto, og har besluttet, at én konto er tilstrækkelig nu. Live test med trænerteamets separate konti foretages af brugeren, når appen er i produktion.

Dette erstatter kravet om at vente på to autoriserede testkonti før videre implementering og første publicering. Det ændrer testtidspunkt og ansvar, ikke appens krav om at afvise forældede gemninger og bevare kladder.

- Fortsæt implementering og publicering med den tilgængelige konto, automatiske tests og de reelle browser-/Drive-tests, som kan udføres.
- Registrér to-konto-/trænerteamstest som **udskudt af brugeren til efter første publicering**. Disse tests er hverken kørt eller bestået.
- Login, filadgang, medieupload, CORS og atomisk konfliktbeskyttelse er forskellige kontrolpunkter. Bekræftet login er ikke bevis for de øvrige.
- Gemning skal fortsat bruge den indlæste basis og en betinget Drive-opdatering. Ingen ubetinget fallback, skjult backend eller påstand om bevist samtidighedsbeskyttelse uden evidens.
- Hvis en faktisk test påviser overskrivning trods gammel betingelse, skal gemning stoppes og den konkrete fejl håndteres. Undtagelsen tillader ikke en kendt defekt skrivevej.
- Åbne manuelle testopgaver forbliver åbne i opgavelisten; de må ikke afkrydses alene på grund af denne beslutning.

Konfigurationen findes lokalt i Git-ignoreret `.env.local`. OAuth-klientens client secret indgår ikke i appen. Browsernøgle, OAuth-klient-id og projektnummer er offentlig browserkonfiguration, men faktiske brugertokens er fortsat private.
