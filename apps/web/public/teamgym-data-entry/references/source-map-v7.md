# Kilder og referenceafsnit · format 7

| Kilde i produktet | Offentligt opslag og menneskelig gennemgang |
| --- | --- |
| `packages/domain/src/schema.ts`, `workspace.ts` | `structure-v7.json`, `format.md`: felter, version, krydsreferencer, serialisering og migration |
| `identity.ts`, `commands.ts`, `twist.ts` | `registration.md`, `scenarios.md`: stabile ID'er, præcise udførelser, registreringer og ordnede pladser |
| `inheritance.ts`, `stability.ts` | `registration.md`: egen/aktiv arv, dato og effektive værdier |
| `spotting.ts` | `scenarios.md`: planlagt modtagning og afledte resultater |
| `packages/rules/src/catalog.ts`, `dk-data.ts`, `dk-v1.ts`, `reg-v1.ts`, `spring-rules.ts`, `rhythm.ts` | `catalog-v7.json`, `registration.md`, `scenarios.md`: pakkeversioner, profiler, katalogposter, varianter og deltagergrænser |
| `practical-connections.ts`, `apps/web/src/spring-library.ts`, `spring-connections.ts`, `foundation-catalog-model.ts`, `spring-picker-model.ts`, `spring-names.ts`, `twist-choice.ts`, `twist-split.tsx`, `rhythm.tsx` | `catalog-v7.json`, `registration.md`: praktiske springopskrifter, fundament og entydigt opslag |

`source-review-v7.json` fastholder et samlet fingerprint af disse kilder. En ændring kræver gennemgang af de nævnte tekster og syntetiske tests, selv når skemaversionen er uændret. JSON-schemaet udtrykker ikke alle krydsreferencer og domæneregler; referenceafsnittene og appens validering er nødvendige supplementer.
