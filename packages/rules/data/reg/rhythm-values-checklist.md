# Visuel tjekliste: A1.2-rytmeværdier

Kilde: `reglement/Appendix-A1.2-Rytme-Oversigt-over-svaerheder-REG.pdf` (SHA-256 `90893b0b…be4a`). Alle 11 sider er gengivet som PNG og gennemgået visuelt 31. oktober 2026. For hver celle er koden aflæst i billedet og sammenholdt med kolonneoverskriften over cellen. Værdien er ikke udledt af koden.

Maskinel kontrol: `python3 tools/verify-a12/extract_cells.py <A1.2-pdf> tools/verify-a12/a12-cells.csv --compare packages/rules/data/reg/rhythm-catalog.csv` gav 75 celler uden G, 75 katalogrækker og 0 afvigelser. Samme script mod A1.1 og DK-kataloget gav 94/94. `tests/domain/reg-rhythm.test.ts` gentager sammenligningen og kontrollerer de 10 kendte transskriptionsfejl.

Script og billede var enige i alle 79 celler.

| Side | Billedkontrol | Bemærkning                                                                                            |
| ---- | ------------- | ----------------------------------------------------------------------------------------------------- |
| 1    | ✓             | Generelle krav, ingen celler. Højst tre skridt (gang eller løb) før et element.                       |
| 2    | ✓             | Overskrift 0,2 · 0,4 · 0,4 · 0,4 · 0,6. HB1001 står i 0,6-kolonnen (A1REG-U01).                       |
| 3    | ✓             | To tabeller, begge 0,2 · 0,4 · 0,4 · 0,4 · 0,4.                                                       |
| 4    | ✓             | 0,1 · 0,2 · 0,3 · 0,4 · 0,6. SB201-rækken hedder »med eller uden håndstøtte« (A1REG-U03).             |
| 5    | ✓             | 0,1 · 0,2 · 0,3 · 0,4 · 0,6. J203 X-hop står i splithoprækken (A1REG-U05); J403 har ingen celletekst. |
| 6    | ✓             | 0,1 · 0,2 · 0,3 · 0,4 · 0,6. J405 er kattespring med skrue 180° (anden udførelse end A1.1 J405).      |
| 7    | ✓             | 0,1 · 0,2 · 0,3 · 0,4 · 0,6. Alle tre hink er 360°.                                                   |
| 8    | ✓             | 0,1 · 0,2 · 0,3 · 0,4 · 0,4.                                                                          |
| 9    | ✓             | 0,1 · 0,2 · 0,3 · 0,4 · 0,4.                                                                          |
| 10   | ✓             | G: 0,2 · 0,4 · 0,4 · 0,4 · 0,4. Ikke i kataloget; G802 står to gange (A1REG-U02).                     |
| 11   | ✓             | 0,1 · 0,3 · 0,4 · 0,4 · 0,6.                                                                          |

## Celler

| Side | Kode   | Kolonne | Katalog-id                    | Billede |
| ---- | ------ | ------- | ----------------------------- | ------- |
| 2    | HB201  | 0,2     | `rh-hb-headstand`             | ✓       |
| 2    | HB401  | 0,4     | `rh-hb-dynamic-handstand`     | ✓       |
| 2    | HB1001 | 0,6     | `rh-hb-handstand`             | ✓       |
| 2    | HB202  | 0,2     | `rh-reg-hb-frog`              | ✓       |
| 2    | HB203  | 0,2     | `rh-hb-bridge`                | ✓       |
| 2    | HB403  | 0,4     | `rh-hb-elbow-planche`         | ✓       |
| 2    | HB603  | 0,4     | `rh-hb-bridge-leg-45`         | ✓       |
| 2    | HB803  | 0,4     | `rh-hb-bridge-leg-vertical`   | ✓       |
| 2    | HB204  | 0,2     | `rh-hb-straddle-l`            | ✓       |
| 2    | HB404  | 0,4     | `rh-hb-l`                     | ✓       |
| 2    | HB604  | 0,4     | `rh-hb-v-45`                  | ✓       |
| 2    | HB804  | 0,4     | `rh-hb-v-90`                  | ✓       |
| 3    | DB201  | 0,2     | `rh-db-turn-forward-360`      | ✓       |
| 3    | DB601  | 0,4     | `rh-db-turn-forward-540`      | ✓       |
| 3    | DB801  | 0,4     | `rh-db-turn-forward-720`      | ✓       |
| 3    | DB202  | 0,2     | `rh-db-turn-backward-360`     | ✓       |
| 3    | DB602  | 0,4     | `rh-db-turn-backward-540`     | ✓       |
| 3    | DB802  | 0,4     | `rh-db-turn-backward-720`     | ✓       |
| 3    | DB205  | 0,2     | `rh-reg-db-headstand-frog`    | ✓       |
| 3    | DB405  | 0,4     | `rh-db-headstand-planche`     | ✓       |
| 3    | DB605  | 0,4     | `rh-reg-db-handstand-frog`    | ✓       |
| 3    | DB805  | 0,4     | `rh-db-handstand-planche`     | ✓       |
| 4    | SB201  | 0,1     | `rh-reg-sb-side-under-90`     | ✓       |
| 4    | SB401  | 0,2     | `rh-reg-sb-side-90`           | ✓       |
| 4    | SB601  | 0,4     | `rh-reg-sb-side-135`          | ✓       |
| 4    | SB202  | 0,2     | `rh-sb-forward-supported-90`  | ✓       |
| 4    | SB602  | 0,4     | `rh-sb-forward-supported-135` | ✓       |
| 4    | SB203  | 0,2     | `rh-sb-scale-90`              | ✓       |
| 4    | SB603  | 0,4     | `rh-sb-scale-135`             | ✓       |
| 4    | SB604  | 0,4     | `rh-sb-side-scale-90`         | ✓       |
| 4    | SB804  | 0,6     | `rh-sb-side-scale-120`        | ✓       |
| 4    | SB605  | 0,4     | `rh-sb-side-balance-90`       | ✓       |
| 4    | SB805  | 0,6     | `rh-sb-side-balance-120`      | ✓       |
| 5    | J201   | 0,2     | `rh-reg-j-jump-straight-180`  | ✓       |
| 5    | J401   | 0,3     | `rh-j-jump-straight-360`      | ✓       |
| 5    | J601   | 0,4     | `rh-j-jump-straight-540`      | ✓       |
| 5    | J202   | 0,2     | `rh-reg-j-jump-tuck`          | ✓       |
| 5    | J402   | 0,3     | `rh-reg-j-jump-tuck-180`      | ✓       |
| 5    | J602   | 0,4     | `rh-j-jump-tuck-360`          | ✓       |
| 5    | J203   | 0,1     | `rh-reg-j-x-jump`             | ✓       |
| 5    | J403   | 0,4     | `rh-j-jump-straddle`          | ✓       |
| 6    | J205   | 0,2     | `rh-j-cat`                    | ✓       |
| 6    | J405   | 0,3     | `rh-reg-j-cat-180`            | ✓       |
| 6    | J605   | 0,4     | `rh-j-cat-360`                | ✓       |
| 6    | J206   | 0,2     | `rh-j-scissor-90`             | ✓       |
| 6    | J606   | 0,4     | `rh-j-scissor-135`            | ✓       |
| 6    | J210   | 0,2     | `rh-reg-j-leap-straddle`      | ✓       |
| 6    | J410   | 0,3     | `rh-j-leap-straddle-90`       | ✓       |
| 6    | J610   | 0,4     | `rh-j-leap-straddle-180-90`   | ✓       |
| 6    | J211   | 0,2     | `rh-j-split-leap-90`          | ✓       |
| 6    | J611   | 0,4     | `rh-j-split-leap-135`         | ✓       |
| 7    | J614   | 0,4     | `rh-j-straight-hop-360`       | ✓       |
| 7    | J415   | 0,4     | `rh-j-bent-leg-hop-360`       | ✓       |
| 7    | J816   | 0,4     | `rh-j-tuck-hop-360`           | ✓       |
| 8    | A401   | 0,4     | `rh-a-forward-sit`            | ✓       |
| 8    | A601   | 0,4     | `rh-a-forward-tuck`           | ✓       |
| 8    | A402   | 0,4     | `rh-a-handspring`             | ✓       |
| 8    | A603   | 0,4     | `rh-a-back-tuck`              | ✓       |
| 8    | A204   | 0,2     | `rh-reg-a-roundoff`           | ✓       |
| 8    | A404   | 0,3     | `rh-a-back-walkover`          | ✓       |
| 8    | A604   | 0,4     | `rh-a-flic`                   | ✓       |
| 8    | A804   | 0,4     | `rh-a-gainer-flic`            | ✓       |
| 9    | A206   | 0,2     | `rh-a-cartwheel`              | ✓       |
| 9    | A406   | 0,4     | `rh-a-onehand-cartwheel`      | ✓       |
| 9    | A806   | 0,4     | `rh-a-aerial`                 | ✓       |
| 10   | G601   | 0,4     | `(G, udeladt)`                | ✓       |
| 10   | G801   | 0,4     | `(G, udeladt)`                | ✓       |
| 10   | G802   | 0,4     | `(G, udeladt)`                | ✓       |
| 10   | G802   | 0,4     | `(G, udeladt)`                | ✓       |
| 11   | F401   | 0,3     | `rh-f-straddle-fold-45`       | ✓       |
| 11   | F801   | 0,4     | `rh-f-straddle-fold-floor`    | ✓       |
| 11   | F402   | 0,3     | `rh-f-pike-fold-45`           | ✓       |
| 11   | F602   | 0,4     | `rh-f-standing-fold`          | ✓       |
| 11   | F802   | 0,4     | `rh-f-sitting-fold`           | ✓       |
| 11   | F1003  | 0,6     | `rh-f-front-split`            | ✓       |
| 11   | F804   | 0,4     | `rh-f-side-split-135`         | ✓       |
| 11   | F1004  | 0,6     | `rh-f-side-split-floor`       | ✓       |
| 11   | F405   | 0,3     | `rh-f-kneeling-side-90`       | ✓       |
| 11   | F805   | 0,4     | `rh-f-kneeling-side-135`      | ✓       |

## Kendte transskriptionsfejl

Den første transskription i `docs/reglement/05-rytme-reg.md` (30. oktober 2026) havde 10 forkerte værdier. Alle er rettet i kataloget og bekræftet i billedet: SB601 0,4 · SB604 0,4 · SB804 0,6 · SB605 0,4 · SB805 0,6 · A404 0,3 · A406 0,4 · F402 0,3 · F602 0,4 · F405 0,3.
