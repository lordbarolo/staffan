# Beslutslogg — delegerade beslut

Beslut som fattats åt Anders utan att fråga, enligt projektets delegationsregel: beslutet följer av en befintlig princip eller ett befintligt beslut, kan ändras senare utan att kod eller data byggs om, exponerar ingen persondata mot ny part och binder inte mot tredje man.

Anders granskar i efterhand och kan riva upp när som helst.

---

## 2026-08-19 — Block 4a (data, minne, profil, tenant)

Levererat i `claude/block-4a-data-minne-profil-tenant.md`. Åtta delegerade beslut.

### DL-001 | v1:s rådgivningskvalitet får inte bero på aggregatlagret
**Vad:** Löneanalysen och rekommendationerna ska klara sig helt på marknadslagret (D-004) och konsultens egen data. Aggregatlagret (L3) är uppsida, inte beroende.
**Följer av:** D-004 (datagrunden är beslutad utan aggregatlagret), A-001 som uttryckligt antagande i MS §14.
**Du hade annars fått frågan:** "Får v1:s rådgivning förutsätta att det konsultdelade datalagret har volym vid lansering?" — där ditt svar följer av att A-001 är ett antagande, inte ett faktum.

### DL-002 | Integritetströskeln: k = 5 distinkta konsulter, dominansspärr 40 %
**Vad:** En aggregatcell exponeras när minst 5 distinkta konsulter bidrar och ingen enskild konsult står för mer än 40 % av observationerna.
**Följer av:** D-019 (trösklar per roll/ort/period så att ingen individ kan härledas).
**Du hade annars fått frågan:** "Vilket k?" — en fråga utan information för dig, eftersom höjning är kostnadsfri (DL-003) och 5 är europeisk statistikpraxis.
**Gräns:** att **sänka** k under 5 är inte delegerat — det rör dataskyddslöftet och går tillbaka till dig.

### DL-003 | Aggregatceller beräknas vid läsning, materialiseras aldrig
**Vad:** Statistik räknas fram ur levande datapunkter vid frågetillfället. Inga förberäknade cellvärden.
**Följer av:** D-019 (återkallbar opt-in) + A-011.1 (trösklar ska kunna sättas var för sig).
**Du hade annars fått frågan:** en ren implementationsfråga. Den loggas ändå eftersom den är förutsättningen för att DL-002 ska vara reversibel och för att radering ska nå aggregatet omedelbart.

### DL-004 | Provisorisk kvalitetströskel plus kalibreringsapparat som lanseringskrav
**Vad:** T_kval startar på ≥ 8 observationer från ≥ 4 distinkta källor med interkvartilavstånd ≤ 15 % av medianen. Parallellt loggas både observations- och modellskattning för varje rekommendation, så att tröskeln kan sättas empiriskt i stället för gissas.
**Följer av:** A-011.1 (kvalitetströskeln sätts i block 4), A-002g (tre osäkerhetslägen), D-026 (loggat prövbart underlag). Samma mönster som A-003:s skuggläge.
**Du hade annars fått frågan:** "Vilka startvärden?" — där varken du eller jag har underlag idag. Beslutet är i praktiken att bygga mätapparaten, inte att välja tal.

### DL-005 | Inget fritt textminne i v1
**Vad:** Allt persistent minne är typade, fältspårbara fält. Fritext endast som fältbunden kommentar. Vektorindex tillåts över dokument (raderbara med dokumentet), aldrig över konversation.
**Följer av:** A-011.2 (tredjemansuppgifter ska vara fältspårbara och raderbara), D-005, P-006.
**Du hade annars fått frågan:** "Får agenten ha ett löpande konversationsminne?" — där svaret följer av att A-011.2:s raderingslöfte inte kan hållas i en inbäddning.
**Kostnad, uttalad:** agenten minns inte allt som sagts i förbifarten — bara det som blev ett fält.

### DL-006 | Fast cellraster i aggregatstatistiken
**Vad:** Konsulten kan inte definiera egna intervall för roll/ort/period. Rastret är fördefinierat.
**Följer av:** D-019 (ingen individ ska kunna härledas) — fritt valda överlappande intervall subtraheras till en individ oavsett k.
**Du hade annars fått frågan:** ingen; det är en ren följd av tröskelkravet.

### DL-007 | Icke-informativt besked under tröskel
**Vad:** Samma besked ("observationsunderlag under tröskel") oavsett om cellen innehåller noll eller k−1 konsulter.
**Följer av:** D-019, P-005 (transparens om *varför*, utan att beskedet självt blir en signal).
**Du hade annars fått frågan:** ingen.

### DL-008 | Ingen ny arkitekturprincip för P-006-spärren
**Vad:** Kravet att varje profilfältsskrivning bär en registrerad anskaffningsanledning införs som beslut inom block 4a, inte som ny AP.
**Följer av:** AP-001 (informationsgränser realiseras i vad en komponent får göra, inte i instruktioner) — spärren är en tillämpning, inte en ny princip.
**Du hade annars fått frågan:** "Ska detta bli AP-004?" — där principinflation gör principregistret mindre användbart och du sannolikt sagt nej.

---

## 2026-08-19 — Block 3 (förhandlingsarkitekturen)

### DL-009 | Versionsbeteckningen v0.10 i stället för aviserat v1.0
**Vad:** Arkitekturdokumentets version efter block 3 betecknas v0.10, inte v1.0 som aviserats i chatten. v1.0 reserveras för slutleveransen (block 6, när färdigkriterierna är uppfyllda).
**Följer av:** versionsdisciplinen i `regler-versionshantering.md` samt instruktionens färdigkriterium — versionsnumret är en ren etikett, ändringsbar utan att kod eller data byggs om.
**Du hade annars fått frågan:** "Ska Block 3-versionen heta v0.10 eller v1.0?"
**Ursprung:** fattat i block 3-tråden. Infört i detta format här eftersom de två trådarna skrev loggfilen samtidigt och den ena skrivningen skrev över den andra.

---

## 2026-08-19 — Numreringsjustering efter parallellarbete

### DL-010 | Block 4a omnumrerad efter kollision med block 3
**Vad:** Block 4a konsolideras vid beslut till **A-013** (inte A-012, som togs av block 3), och dess antaganden blir **AA-004 och AA-005** (inte AA-003, som togs av block 3). AQ-008 är oförändrad. Block 4b reserveras A-014.
**Följer av:** ren bokföring — block 4a och block 3 skrevs parallellt i två trådar.
**Du hade annars fått frågan:** ingen. Noteras bara så att ingen läser en tidigare kopia av block 4a och tror att A-012 syftar på data-blocket.
**Kontroll gjord:** block 4a är läst mot v0.10 i sin helhet. Inga sakliga konflikter med A-012 — blocken rör olika lager.

---

## 2026-08-19 — Block 4b (fullföljande, deduplicering, integrationslager)

Levererat i `claude/block-4b-fullfoljande-dedup-integration.md`. Fem delegerade beslut.

### DL-011 | 12 månaders rullande fönster för fullföljandegraden
**Vad:** Fullföljandegraden beräknas över 12 månaders rullande fönster, vid frågetillfället (aldrig materialiserad — DL-003-mönstret).
**Följer av:** A-003 (faktorns syfte), D-015 ("samma villkor" — tre års belastning för åtgärdat beteende skaver). D-004:s 36 månader gäller prisdata; beteendedata åldras med organisationen, inte prisregimen.
**Du hade annars fått frågan:** "Vilket fönster?" — parametern är frågetidsberäknad och ändringsbar utan ombyggnad.

### DL-012 | Visningströskel 5 attribuerade avslut per aktör
**Vad:** En aktörs fullföljandegrad visas för konsulten först vid ≥ 5 attribuerade avslutade processer inom fönstret; under tröskeln visas "för få avslut för bedömning" — icke-informativt om riktning.
**Följer av:** A-003 Tillägg 1 (verifierad datakvalitet), DL-007-mönstret. Skyddar en aktör mot statistik på enstaka händelser — annan avvägning än k (individskydd), därför eget tal.
**Du hade annars fått frågan:** "Vilket minsta underlag?" — parameter, ändringsbar utan ombyggnad.

### DL-013 | Exitkriteriets provisoriska tal
**Vad:** Skugglägets exitkriterium: ≥ 50 attribuerade terminalhändelser över ≥ 10 aktörer, < 20 % oattribuerat, ≥ 30 stickprov med ≥ 95 % överensstämmelse, plus bestridandemekanism i drift. Exit är alltid Anders beslut — talen är villkor, inte automatik.
**Följer av:** A-003 Tillägg 1 ("verifierad datakvalitet" gjord mätbar).
**Du hade annars fått frågan:** "Vad betyder verifierad datakvalitet?" — talen är provisoriska parametrar; själva exiten ligger kvar hos dig.

### DL-014 | Dedup-nivågränserna som frågetidsparametrar
**Vad:** Gråzonsgränserna (periodöverlapp ≥ 80 %, omfattning ±10 %) är justerbara parametrar; startvärden kalibreras mot pilotdata. Säker sammanslagning kräver avrops-/DIS-referens eller full nyckelmatch.
**Följer av:** D-009, A-002m (osäker dedup visas som två med flagga).
**Du hade annars fått frågan:** "Var går gråzonsgränsen?" — utan pilotdata har ingen av oss underlag; mekanismen gör talen ersättbara.

### DL-015 | Konsultkorrigering av dedup är lokal, aldrig automatisk inlärning
**Vad:** Konsultens ihop-/isärslagning gäller endast den konsultens vy, loggad och reversibel. Globala regeländringar går via versionerad backlog med konsekvensrapport.
**Följer av:** P-010 (en konsults åsikt får inte tyst forma en annans marknadsbild), D-026 (prövbarhet kräver versionerat regelverk).
**Du hade annars fått frågan:** ingen; det är en följd av likabehandlingen.

---

## 2026-08-19 — Block 4b, granskningscykeln

### DL-016 | Efterhandskontroll av U4 med 30 dagars fönster
**Vad:** U4 (vårdgivaren drog uppdraget) sätts aldrig på motpartens eget påstående — mekaniskt stöd eller dokumenterat bestridande krävs. Återuppstår samma Uppdrag i dedup-grafen inom 30 dagar omprövas klassningen med logg och bestridanderätt. Fönstret är en parameter.
**Följer av:** A-003 (faktorns syfte), D-026 (prövbarhet), branschfaktum från Anders (bf häver och tillsätter internt).
**Du hade annars fått frågan:** "Hur skyddas U4 mot spel?" — mekanismen följer av att undantag kräver underlag; fönstrets längd är justerbar utan ombyggnad.

### DL-017 | antaget: BESLUT — block 4b i sin helhet
**Vad:** Blocket i stort behandlas som beslutat. §1.8 fick uttryckligt BESLUT av Anders; övriga delar granskades i två scenariegenomgångar utan invändning, och Anders angav att processen ska gå framåt utan fler utvikningar.
**Följer av:** granskningsdialogen 2026-08-19 + projektets delegationsregel (sannolikt svar känt).
**Du hade annars fått frågan:** "Markör för blocket i stort?" — rivbart som allt annat i denna logg.

### DL-018 | antaget: BESLUT — utbytesdedup-regeln (block 4b §4)
**Vad:** Parallella utbyten mot samma Uppdrag endast inom öppnad budgivningsram; annars ett aktivt utbyte per Uppdrag, med eskalering till konsulten vid upptäckt.
**Följer av:** A-003, AP-002, A-012 (inga autonoma avslut); scenariegenomgång utan invändning.
**Du hade annars fått frågan:** "Markör för §4?" — rivbart.

---

## Ej delegerat — ligger hos Anders

| ID | Fråga | Varför inte delegerat |
|---|---|---|
| AQ-008 | Aggregatlagret är pseudonymiserat, inte anonymt. Ska D-019:s samtyckesformulering preciseras? | **BESLUT av Anders 2026-08-19 enligt rekommendationen** (pseudonymisering, separerat nyckelvalv, anonym exponerad statistik). Kvarstående nivå 1-åtgärd: D-019 preciseras i MS v0.6. |
| — | Block 4a:s markör | **BESLUT av Anders 2026-08-19** ("Beslut.") → A-013, konsoliderad i v0.12. |
| — | Sänkning av k under 5 | Rör dataskyddslöftet. |
| — | Blockindelningens ändring (4a/4b-uppdelningen) | Beslutad av Anders 2026-08-19. |
| ~~—~~ | ~~Motpartsinsyn och bestridande (block 4b §1.8)~~ | **BESLUT av Anders 2026-08-19.** |
| ~~—~~ | ~~Utbytesdedup-regeln (block 4b §4)~~ | Antaget: BESLUT (DL-018). |
| — | A-015 (förhandlingsmodellen) | **BESLUT av Anders 2026-08-19** — loggad i arkitekturspecifikationen v0.11, §2/§13.11. Ingår här endast som referens. |
