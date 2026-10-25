# Rytme: individuelle færdigheder og fællesnævnere

Kilde: den fastlåste A1.1 i [manifestet](source-manifest.json),13sider. [Kataloget](rhythm-catalog.csv) er en dækningsliste over94 individuelle felter, ikke en løs liste over kodepræfikser. Alle nedenstående krav skal følge med til produktets regeldata og variantmodel; de korte CSV-beskrivelser alene er utilstrækkelige som valideringsskema.

## Afgrænsning og identitet

- Medtag HB, DB-pirouetter, DB-power, SB, J-hop, J-spring, J-hink, A og F. **G/gruppeelementer udelades helt**: ingen registrering, deltagergrupper, løft/kast, stabilitet, filterkategori eller beregning. Side12 indeholder fire trykte G-felter, som er redegjort for som bevidst udeladt.
- Beregn individuelle fællesnævnere og deres stabilitet; ingen fuld rytmekarakter eller påstand om fuld dækning af officielle rytmekrav, som også omfatter G.
- Brug stabilt internt moment-id plus strukturerede varianter. Koden er officiel visning/søgning, ikke unik nøgle. DB804 er to forskellige momenter på side3/4, begge .80; de må aldrig matches alene på koden.
- En højere værdi er ikke automatisk en registrering af alle lavere momenter. Færdigheder skal registreres konkret, eller have en dokumenteret regelkobling til den præcise fælles udførelse. Familiematch og samme D er utilstrækkeligt.
- Hele holdet skal udføre samme element på samme måde. Spejling er tilladt. Valgfrie varianter skal kunne samles til én fælles tilladt udførelse, fx samme afsæt/landing og håndstøtte. Et fritekstfelt kan ikke bevise denne mulighed.

## Generelle krav — A1.1 side1

Udførelse skal opfylde momentets samlede krav. Holdet vælger kun frit, hvor kilden ikke fastlægger en variant. Samtidighed og højst ét skridt inden momentet vedrører faktisk koreografi/udførelse og kan ikke godkendes ud fra kartoteket. Tariff Forms er ikke en funktion i dette produkt.

| Krav | Generel tolerance og betydning |
| --- | --- |
| Strakt krop |30° for overstrakt/bøjet krop |
| Lodret kropsposition |30° |
| Vandret overkrop | Torso fra hofte til skulderled,15°; torsoens uønskede drejning15° |
| Vandret kropsposition |30° |
| Bendeling, hofte-/knævinkel |15°; større fleksibilitet eller mindre hofte-/knævinkel giver ikke mere D |
| Samlede ben/knæ, strakte ben/hofte, strakte arme |15° generelt |
| Rotation/skruer | Måles fra hoften; højst45° samlet under-/overrotation ved start/slut, ikke45° i hver ende |

Specifikke krav og undtagelser i kategori, række og celle går forud for generelle tolerancer. Figurer er vejledende. Implementeringen skal vise den relevante kilde/side og beskrive varianten konkret; den skal ikke forsøge automatisk kropsvinkelmåling.

## Kategorier og rækkeundtagelser

| Gruppe / sider / antal | Krav, som skal følge de enkelte varianter |
| --- | --- |
| HB;2;11 | Genkendelig statisk balance mindst2sekunder. Kun hænder i gulvet med undtagelse af HB201/203/603/803. Strakte ben med HB1001-undtagelsen. HB201 samlede ben. HB1001 strakte arme med specifik45° tolerance og ben over hoftehøjde med45° tolerance. HB401 samme krav, men håndskridt tilladt; stille udførelse kan stadig være HB401. HB403 vandret planche, støtte på begge hænder/albuer eller strakte arme, ben samlede/spredte. Brovarianter: skuldre mindst over hænder; ingen tolerance for det frie bens højde. HB604/804 samlede eller spredte ben, begge hænder ved siden af kroppen tæt ved hoften; ingen støtte op ad armene. |
| DB-pirouette;3;8 | På én fod på tå, ingen hop. Fremad/bagud bestemmes relativt til støttebenet, ikke blot højre/venstre. Frit bens krævede position mindst3/4af rotationen; ved bøjet frit ben definerer hælen hoftevinklen. Start når fri fod og støttehæl er løftet, slut ved færdig rotation, hælkontakt eller fri fod i gulv. Hele holdet starter med ansigtet samme vej; spejling ophæver ikke dette.90°-varianter uden håndstøtte. |
| DB-power;4;5 | Aktiv muskelstyrke, kontrolleret kontinuerlig bevægelse, ikke tyngdekraft. Ingen pause på mindst2sekunder, intet fald eller mere end ét skridt, ingen benstøtte. Start/slut skal være tydelige, men behøver ikke holdes2sekunder. Håndstand som start/slut har strakte arme med45° tolerance, strakte samlede ben og strakt hofte. Stem-varianterne har spredte/samlede ben som specifik forskel. DB405 kontrolleret hovedstand via strakt krop til albueplanche; DB805 håndstand til albueplanche; DB806 håndstand til katete med spredte ben og strakte ben hele vejen. |
| SB;5;12 | Stående balance mindst2sekunder; frit bens vinkel og håndstøtte skal registreres særskilt. Side-/fremadløft, vægt og sidebalance er forskellige udførelser. Brug rækkens angivne overkropsstilling og benvinkel, ikke blot navnet »balance«. Benet må ikke uden kildegrundlag regnes som støttet/ustøttet ækvivalent. |
| J-hop;6;8 | Afsæt på to fødder, landing på en eller to efter variant. Position i svævefase, skrueantal og landing er strukturerede krav. Skruede hop har fælles startretning for ansigtet som angivet i kategorien. Strakt, lukket, side-split og sissone er adskilte udførelser. |
| J-spring;7–8;18 | Som udgangspunkt afsæt på én fod og landing på den anden, med cellens/rækkens særlige varianter. Registrér bendeling og benenes position/bevægelsesforløb, ikke kun slutvinkel: kattespring, saks, entrélacé, butterfly, zigzag, sidesplit, split og split med benskift er forskellige. J822 er den faktisk trykte kode for180°split på side8; den må ikke automatisk ændres til J811. |
| J-hink;9;6 | Afsæt og landing på samme fod. Strakt/bøjet afsætsben, lukket/kosak-position og skrueantal er særskilte varianter. De må ikke normaliseres til to-fods-hop med samme navn eller værdi. |
| A;10–11;15 | Retning, håndstøtte, landingsform og rotation er præcis identitet: fx salto til siddende kontra til fødder, kraftspring kontra fri kraft, mølle kontra enhåndsmølle/fri mølle. Gainer er ikke et alias for almindelig baglæns udførelse. CSV's korte beskrivelser skal suppleres med rækkens krav fra den angivne side ved katalogimport. |
| F;13;11 | Position, bendeling og kontakt med gulv skal beskrives efter række/celle.45°foroverbøjning er ikke bryst mod gulv; siddende og stående fold er forskellige. Split/sidesplit samt knælende sidesplit med90/135/180°må ikke matches alene på familien. |

Tabellen er ikke en tilladelse til at erstatte række-/cellekrav med generelle stikord. Ved import skal hvert moment have de relevante generelle krav, kategorikrav og specifikke krav med kildeside; tvivl om en tegnet variant skal bevares som ubekræftet variant frem for at opfinde en ækvivalens. De94 felter har kendt trykt kode og værdi; det betyder ikke, at enhver selvvalgt udførelse af familien opfylder kravene.

## Stabilitet og fællesnævnere — produktkrav

Stabilitet er heltal1–5 eller null pr. gymnast/præcis færdighed, uden færdighedsstatus ved siden af. Vis færdighedsdækning over alle aktive holdmedlemmer, vurderingsdækning, gennemsnit af kendte vurderinger, minimum og antal1–2. Manglende færdighed og registreret færdighed mednull er forskellige mangler. »Alle mindst4« kræver hver gymnast med registreret fælles udførelse og kendt vurdering≥4. Et tomt hold opfylder ingen fællesnævner. Nye medlemmer skal straks påvirke resultatet i den lokale kladde. Ingen stabilitet må omregnes til procentchance, officiel D eller rytmekarakter.
