# Arkitekturspecifikation — Agentlagret v0.12

**Nivå 2 | Agent Architect**

Datum: 2026-08-19
Status: **Block 1–4 beslutade (A-008, A-011, A-012, A-013, A-014) + A-015 (förhandlingsmodellen). Kvar: Block 5 (granskbarhet/säkerhet, AQ-006) och Block 6 (lojalitetsmatris, färdigkriterier, slutlig handoff till nivå 3). Utestående nivå 1-åtgärd: D-019-preciseringen ur AQ-008 kräver Master Specification v0.6.**
Underlag: Master Specification v0.5 (source of truth). Vid konflikt gäller Master Specification.
Versionsdisciplin: samma som Master Specification. Ersätter: v0.11.

---

## Ändringslogg

**v0.12 (2026-08-19)** — Block 4 beslutat i sin helhet (Anders: "Beslut."). 4a konsoliderad till **A-013** (§14): datalagren L1/L2/L3 med trösklad statistikbro, integritetströskeln k=5/dominans 40 %, kvalitetströskeln med kalibreringsapparat, oberoendet mekaniserat, minnesklasserna K1–K3 med anskaffningsanledning som spärr, samtycke/delningsvy/radering, tenant-golvet med principaler och grants. AQ-008 avgjord enligt rekommendationen: pseudonymiserat lager med separerat nyckelvalv, anonym exponerad statistik — **D-019-preciseringen är en nivå 1-åtgärd (MS v0.6), utestående**. 4b konsoliderad till **A-014** (§15): fullföljandehändelser med deterministisk attribution och undantagskategorier, motpartsinsyn/bestridande som exitvillkor (uttryckligt BESLUT), deduplicering i tre nivåer, integrationslagrets två flöden, utbytesdedup. De fristående blockdokumenten utgår; DL-001–DL-018 gäller (beslutslogg-delegerat.md).

**v0.11 (2026-08-19)** — **A-015 (förhandlingsmodellen, BESLUT ur granskningsdialog):** tvålägesmodell — flera intressenter → budgivning (A-003 oförändrad); en motpart → öppen acceptnivå som agenten kommunicerar rakt, ingen stegvis kohandel. Förhandlingsdimensionen är normaltidslön; OB och övriga villkor förhandlas inte utan måste alltid preciseras av bf i budet. Mött acceptnivå → kandidatresultat + deterministisk spärr mot vidare krav uppåt; D-016 orubbad. Konsultens identitet känd för motparten i varje förhandling; A-003:s blindhet avser bud och konkurrenter. Berörda delar av §13.7/§5.4 superseded öppet (§13.11). Block 4b (fullföljande, dedup, integrationslager) beslutat i fristående dokument — §1.8 (motpartsinsyn/bestridande) uttryckligt BESLUT; U4-efterhandskontroll tillagd (DL-016). Anders processram: inga fler framtidsscenario-utvikningar i granskningarna.

**v0.10 (2026-08-19)** — Block 3 beslutad (A-012). Anders beslut på samtliga granskningspunkter, med en revision: **allt avbrott bekräftas av konsulten** — kärnan verkställer aldrig avbrott själv. Positionstjänstens fjärde svar ändras "avbryt" → "föreslå avbrott" (eskalering); deterministiska stoppvillkor ger omedelbar spärr men avslutet väntar på konsultens bekräftelse; ny handlingstyp 31 (nivå 3, konsultens handling, tillagd via A-012 — ingen tyst ändring av A-008). Beslutat som föreslaget: delad "nr 1" vid exakt likvärdighet; tystnadstrappans defaults T1/T2/T3 = 2/4/10 arbetsdagar som konsultjusterbara driftparametrar; synlig budsgiltighet; kanoniskt händelseschema; adapterprotokollen; fallback som förstklassigt läge; rangbeskedets standardsemantik; AA-003. §13 och §5.2 uppdaterade till beslutad lydelse.

**v0.9 (2026-08-19)** — Block 3 (förhandlingsarkitekturen) levererad som FÖRSLAG i §13: förhandlingsutbytets livscykel, kanoniskt händelseschema, protokoll per kanaladapter (API / strukturerad e-post / fri e-post), mänsklig fallback som förstklassigt läge, positionstjänstens detaljflöde, budgivningsprotokollets semantik (inkl. A-010.3-realisering), tystnadstrappans parametrar, avbrytbarhetens mekanik. Nytt antagande AA-003 (fri e-posts tolkningsbarhet). Inga nya beslut loggade — allt i §13 är förslag tills Anders klassificerat.

**v0.8 (2026-08-19)** — Block 2 beslutad (A-011) med Anders revisioner: (1) den delade tröskeln avslagen — integritetströskel och kvalitetströskel separeras till två oberoende värden (båda sätts i Block 4); (2) preferensvillkor — tredjemans-personuppgifter i relationspreferenser är fältspårbara, raderbara och går aldrig till aggregatlagret; terminologin "påverkat rekommendationen" ersätter "rangordningen" (erbjudanden visas i ankomstordning, modellen rangordnar inte); (3) ägarkopplingsflaggan i modellens kontext avslagen → ny princip **AP-003 (modellblindhet)**: rekommendationsförbjudna värden når aldrig modellens indata; P-009 uppfylls genom UI-rendering ur databasposten. Fullföljandegraden hanteras likadant. Spänning 3 löst per konstruktion. §12 uppdaterad till beslutad lydelse.

**v0.7 (2026-08-19)** — A-010 (konsultsuveränitet). Block 2 levererad som förslag.

**v0.6 (2026-08-19)** — A-009 (e-postkanalen, app-mail, redigeringsflöde); handlingstyp 30; skuggläge för fullföljandefaktorn.

**v0.5 (2026-08-19)** — Block 1 beslutad (A-008); kvalitetskontroll och handoff-brief vid tionde beslutet.

**v0.4 (2026-08-19)** — A-007; AQ-006 → VET INTE; Block 1 som förslag.

**v0.3 (2026-08-19)** — Blockindelning godkänd; A-002–A-006; AA-002.

**v0.2 (2026-08-19)** — A-001; AP-002. · **v0.1** — Dokumentet etablerat.

---

## 1. Arkitekturprinciper (AP)

### AP-001 | 2026-08-19 | Status: aktiv — BESLUT
**Härleds ur:** §12 (least privilege; prompt injection-skydd; särskilda läckageprincipen)
**Princip:** Informationsgränser realiseras genom vad en komponent får veta — aldrig genom vad den instrueras att inte säga.
**Konsekvens:** Informationsbehov specificeras som positiv lista. Instruktionsbaserad sekretess bär aldrig en §12-garanti.

### AP-002 | 2026-08-19 | Status: aktiv — BESLUT
**Härleds ur:** AP-001, §12, D-016
**Princip (exponeringskriteriet):** Förhandlingsagentens kontext får endast innehålla information som är avsedd att exponeras för motparten eller redan exponerats i utbytet.

### AP-003 | 2026-08-19 | Status: aktiv — BESLUT (Anders avslag på §12.2-förslaget, generaliserat)
**Härleds ur:** AP-001, P-009 (visningskrav, inte modellkrav), P-010, D-026
**Princip (modellblindhet):** Ett värde som inte får påverka rekommendationen ska inte finnas i modellens indata. Visningskrav uppfylls genom att gränssnittet renderar värdet ur databasposten — aldrig genom att modellen förmedlar det.
**Konsekvens:** Ägarkopplingsflaggan och fullföljandegraden är UI-renderade datavärden, inte modellsignaler. P-010 uppfylls per konstruktion — en ägarblind modell kan inte gynna någon. Granskbarheten för "flaggan användes inte" reduceras till att visa att flaggan inte ingår i loggade modellindata (D-026) — inget beteendebevis behövs. Frågor från konsulten om ägarkoppling besvaras med renderade datakort ur databasen, inte med modellens text.

---

## 2. Arkitekturbeslut (A)

### A-001 | 2026-08-19 | Status: aktiv — BESLUT
**Härleds ur:** §12 ("ska inte kunna" = teknisk spärr), P-011, D-016/D-017, D-023, P-013, P-004/P-005, designmetodens tre kriterier.
**Beslut:** Agentlagret: (1) **Huvudagenten** — enda konsultkontakten, all rådgivning via verktyg, orkestrerar, äger rekommendation och förhandlingsstrategi. (2) **Förhandlingsagenten** — instans per Förhandlingsutbyte; protokollhanterare med utbytesram (§5.1), positioner från kärnan (§5.2). (3) **Dokumentarbetare** — tillståndslösa, mandatlösa, schemavaliderad utdata (§5.3). (4) **Bakgrundspipelines** — deterministiska jobb. (5) **Verkställighetslagret** — mandatvakt, behörighetsmodell, informationsförbud, positionstjänst, Agentbeslut-logg. Ingen domänuppdelning av rådgivningen.
**Vilar på:** AA-001.

### A-002 | 2026-08-19 | Status: aktiv — BESLUT (batch)
a. Oklassificerat i drift = nivå 3 *(P-011)* · b. Konsultmandatets form *(P-011 nivå 2)* · c. Spärr = logg + notis, spamtröskel *(P-005)* · d. Filtreringsförbud: allt visas, i ankomstordning, med rekommendation *(P-010, D-024)* · e. Fel maskeras aldrig *(P-005)* · f. Proaktivitet händelsestyrd *(D-013/D-014)* · g. Tunt underlag: rekommendera med redovisad osäkerhet *(§7, P-005)* · h. Strukturerad e-post = minsta strukturerade motpartsgränssnitt *(D-023)* · i. Vid avbrott förfaller bud, motparten meddelas *(D-016, P-013)* · j. Fallback: konsulten för dialogen *(D-023, D-016)* · k. Tystnad: påminnelse → notis → parkering · l. Minnesregel *(D-005, P-006)* · m. Osäker deduplicering visas som två med flagga *(D-024)* · n. Granskningsvyns minimum *(D-024, D-026)*

### A-003 | 2026-08-19 | Status: aktiv — BESLUT
**Härleds ur:** P-001, P-013, AP-002, D-016, P-010.
**Beslut (budgivningsmodellen):** Blind budgivning med rangbesked: motparter får veta "nr 1 / inte nr 1" — aldrig belopp, detaljvillkor eller övriga budgivares identitet. Rangen beräknas deterministiskt i kärnan mot mandatets dimensioner. Konsulten ser alla bud i realtid (D-017). Aktörer som återkommande inte fullföljer till avtal ska kunna viktas ned.
**Tillägg 1 (skuggläge, BESLUT):** Fullföljandefaktorn startar i skuggläge — loggad och visad men utan effekt — tills händelsedefinitioner med undantagskategorier (Block 4) och verifierad datakvalitet finns.
**Tillägg 2 (AP-003-anpassning, 2026-08-19):** Fullföljandegraden är ett deterministiskt beräknat värde som presenteras för konsulten — aldrig en signal modellen väger in. Eventuell framtida automatisk effekt kan endast läggas i deterministisk logik i verkställighetslagret (kopplat till AQ-006), aldrig i modellens kontext.
**Vilar på:** AA-002.

### A-004 | 2026-08-19 | Status: aktiv — BESLUT
Ingen autonom myndighetskontakt i v1. Freemium: utlänkning. Premium: person-in-the-loop. *(P-011 nivå 3, D-007)*

### A-005 | 2026-08-19 | Status: aktiv — BESLUT
Fri positionsrörelse inom konsultmandat som default; "bekräfta per drag" valbar. *(P-011 nivå 2, D-016, D-017)*

### A-006 | 2026-08-19 | Status: aktiv — BESLUT
Tenant-beredskap för SmartPool = exakt D-023:s golv. *(D-023, D-021, P-007)*

### A-007 | 2026-08-19 | Status: aktiv — BESLUT
Minimal injektionstestsvit är lanseringskrav; regressionstest per release. Full svit = förbättring. *(§12, D-024)*

### A-008 | 2026-08-19 | Status: aktiv — BESLUT
Block 1 beslutad med två justeringar: mandatpåminnelse via uppdragsslutstriggern (D-013); engångsram för budgivning (nivå 3 en gång per uppdrag, inbjudningar därefter nivå 2; CV/dokument kvarstår nivå 3 per part). *(P-011, A-002–A-004, D-013)*

### A-009 | 2026-08-19 | Status: aktiv — BESLUT
E-post förstklassig förhandlingskanal (även ostrukturerad); svar i samma kanal som erbjudandet; konsultens app-mail med payload-låst redigeringsgodkännande; avsändaridentitet alltid explicit (P-013); inkommande mail genom karantänen. Mänsklig fallback krymper till icke-digitala kanaler. *(D-023, D-016, P-013, P-011, D-017)*

### A-010 | 2026-08-19 | Status: aktiv — BESLUT
**Konsultsuveränitet:** (1) Rekommendationen är rådgivande; konsultens val bland kända vägar verkställs friktionsfritt, avvikande bedömning redovisas en gång. (2) Konsultens relationspreferenser är legitima faktorer som får påverka rekommendationen — personalisering är inte neutralitetsbrott (P-010 gäller kommersiell koppling till plattformen). (3) Rangbesked är lägesbesked, aldrig utfallslöften (P-013). *(P-002/P-003, D-003, P-004, P-011 nivå 3, P-005, P-013)*

### A-011 | 2026-08-19 | Status: aktiv — BESLUT
**Härleds ur:** A-002d/e/f/g/l, A-010, AP-001–AP-003, D-003, D-024/D-026, P-006, D-020.
**Beslut:** Block 2 (§12) beslutad med tre revisioner från Anders:
1. **Tröskelseparation:** integritetströskeln (minsta underlag för att ingen individ ska kunna härledas, D-019) och kvalitetströskeln (minsta underlag för att punktskattning ska slå domänmodellen) är två oberoende värden som sätts var för sig i Block 4. En höjning av integritetsskäl får aldrig tyst försämra rådgivningen.
2. **Preferensvillkor:** relationspreferenser som namnger personer hos motpart är personuppgifter om tredje man — samma fältspårbarhet och raderbarhet som övriga profilfält, och de går aldrig till aggregatlagret (D-020). Terminologi: preferenser "påverkar rekommendationen" — erbjudanden visas i ankomstordning och rangordnas inte av modellen.
3. **Modellblindhet (→ AP-003):** ägarkopplingsflaggan och fullföljandegraden når aldrig modellens indata; P-009 uppfylls i gränssnittet ur databasposten. Spänning 3 löst per konstruktion.
**Operationalisering (arkitektens):** Avsändaridentiteten (vilket bolag en väg tillhör) kvarstår i modellens kontext — den behövs för förhandlingsorkestrering, deduplicering och konsultens relationspreferenser. Det som utesluts är ägarkopplingsflaggan och andra rekommendationsförbjudna värden.

### A-012 | 2026-08-19 | Status: aktiv — BESLUT
**Härleds ur:** D-016/D-017, A-003, A-008.2, A-010, A-002 h–k, P-002, P-011, P-013.
**Beslut:** Block 3 (§13) beslutad med en revision från Anders: **allt avbrott av förhandlingsutbyte bekräftas av konsulten — kärnan verkställer aldrig avbrott själv.**
1. Positionstjänstens fjärde svar ändras från "avbryt" till **"föreslå avbrott"** — en eskalering med orsak som konsulten bekräftar innan något avbryts (§13.10.2, §5.2).
2. Deterministiska stoppvillkor i utbytesramen ger **omedelbar spärr** mot vidare utgående drag (§12:s "ska inte kunna" bevaras) men avslutet — budförfall och motpartsmeddelande — verkställs först vid konsultens bekräftelse (§13.10.3).
3. **Ny handlingstyp 31** (nivå 3, konsultens handling, per instans): bekräfta avbrott av förhandlingsutbyte. Tillagd i 9.3 via detta beslut — ingen tyst ändring av A-008.
4. Övriga granskningspunkter beslutade som föreslagna: delad "nr 1" vid exakt likvärdighet (13.8); T1/T2/T3 = 2/4/10 arbetsdagar som konsultjusterbara driftparametrar samt synlig budsgiltighet (13.9); livscykel, händelseschema, adaptrar, fallback, positionsflöde, rangsemantik (13.1–13.8); AA-003.
**Varför:** Avbrott har extern verkan (bud förfaller, motpart meddelas) och stänger en möjlighet för konsulten — det ska ligga hos huvudmannen, konsekvent med A-010.1 (konsultens val styr) och P-011:s tveksamhetsregel.
**Konsekvens:** Agentens skydd av konsulten sker genom spärr + eskalering, aldrig genom eget avslut. P-002 ("agenten ska kunna säga nej") realiseras i rekommendation och förslag, inte i verkställighet.
**Vilar på:** AA-002, AA-003.

### A-013 | 2026-08-19 | Status: aktiv — BESLUT
**Härleds ur:** §12, D-019/D-020/D-025, D-004, D-005, P-006, A-011.1/.2, A-006, D-023, AP-001.
**Beslut:** Block 4a beslutad (§14): datalagertopologi L1/L2/L3 med deterministisk statistikbro; integritetströskel (k = 5 distinkta konsulter, dominansspärr 40 %, fast cellraster, beräkning vid läsning, icke-informativt besked); kvalitetströskel som precisionskrav med provisoriska startvärden och kalibreringsapparat som lanseringskrav; trösklarnas oberoende mekaniserat; minnesklasser K1–K3 med anskaffningsanledning som teknisk P-006-spärr, inget fritt textminne; samtycke, delningsvy och omedelbar radering; tenant-golv med principaler, scopat dataåtkomstlager och grants.
**AQ-008-utfall (Anders BESLUT enligt rekommendation):** aggregatlagret är pseudonymiserat med kryptografiskt separerat nyckelvalv; exponerad statistik är anonym; raderingsrätten verkställs fullt ut. **D-019:s formulering preciseras i Master Specification — nivå 1-åtgärd, kräver MS v0.6.** Till dess bär arkitekturen preciseringen här.
**Delegerade beslut:** DL-001–DL-008 (beslutslogg-delegerat.md). **Vilar på:** AA-004, AA-005.

### A-014 | 2026-08-19 | Status: aktiv — BESLUT
**Härleds ur:** A-003 (tilläggen), D-009, D-011, D-015, D-024/D-026, A-002 d/e/m, A-009, A-012, AP-003.
**Beslut:** Block 4b beslutad (§15): fullföljandehändelser med deterministisk attribution, undantagskategorier och tveksamhetsregel (oattribuerat = ingen effekt); **motpartsinsyn och bestridande som förhandsvillkor för exit ur skuggläget (uttryckligt BESLUT)**; U4-bevisbörda med efterhandskontroll; deduplicering i tre regelnivåer i deterministisk pipeline, presentation aldrig urval; integrationslagrets två flöden utan delad skrivväg, ingestkontrakt med källa/färskhet, karantän utan undantag; utbytesdedup — parallella utbyten mot samma Uppdrag endast inom budgivningsram.
**Delegerade beslut:** DL-011–DL-018. **Vilar på:** AA-006, AA-007, AA-003.

### A-015 | 2026-08-19 | Status: aktiv — BESLUT (Anders, granskningsdialog)
**Härleds ur:** P-013 (öppet ombudskap), P-003/P-004 (värdet ligger i kalibrering och timing), D-016, D-012/D-013, A-003, A-010.
**Beslut (förhandlingsmodellen):**
1. **Tvålägesmodell.** Flera intressenter → budgivning (A-003, oförändrad): budgivarna konkurrerar tills konsulten bedömer att budet räcker. En motpart → **öppen acceptnivå**: agenten kommunicerar konsultens acceptnivå rakt; ingen stegvis kohandel.
2. **Förhandlingsdimensionen är normaltidslön.** OB och övriga villkor förhandlas inte — de **måste alltid preciseras av bf** i budet. Ett bud utan preciserade villkor är ofullständigt; avviker ett villkor från mandatets krav är acceptnivån inte mött.
3. **Mött acceptnivå stänger förhandlingen uppåt.** När motparten möter den kommunicerade nivån skapas kandidatresultat och vidare krav spärras deterministiskt i verkställighetslagret — konsulten bekräftar (22) eller avböjer, men omförhandling uppåt i samma utbyte är utesluten. D-016 orubbad: inget binder utan konsultens bekräftelse.
4. **Konsultens identitet är känd för motparten i varje förhandling** — moral och etik ska vara en faktor i motpartens beteende (P-013 fullbordad åt båda håll). A-003:s blindhet avser bud och konkurrenter, aldrig konsulten. Första exponeringen mot ny part förblir nivå 3 (handlingstyp 25/26).
**Konsekvens:** Agentens förhandlingsvärde flyttar från taktik till **kalibrering** — rätt acceptnivå sätts före förhandlingen med löneanalys och marknadsdata (P-004), inklusive vänta-rådet (P-003). §5.4:s hemlighållna reservationsvärden utgår i enmotpartsläget: acceptnivån är avsedd exponering, AP-002 intakt. Berörda delar av A-012/§13.7 superseded — öppet, ej tyst (§13.11).
**Operationalisering (arkitektens):** spärren i punkt 3 är deterministisk (§12:s "ska inte kunna"); avböjande efter mött nivå förblir konsultens rätt (D-016, D-003) men agenten återöppnar aldrig utbytet uppåt, och en kommunicerad acceptnivå är ett åtagande om förhandlingsslut — konsultsidans spegel av motpartens fullföljande (P-013).

---

## 3. Antaganden (AA)

### AA-001 | Status: aktivt
Rådgivningskärnans verktygsmängd ryms i en agent. Mätning: verktygsvals-felfrekvens i evalsvit (resor A–E + proaktivitet). Tröskel: >5 % totalt / >10 % per resa efter åtgärdsrunda. Reträtt: delning i tre kärnor med oförändrade mandat och gränssnitt.

### AA-002 | Status: aktivt
Bemanningsföretag accepterar blind budgivning med rangbesked. Om fel: bilateral förhandling är fallback.

### AA-003 | Status: aktivt *(nytt v0.9)*
Inkommande fri e-post kan tolkas till kanoniska förhandlingshändelser (§13.2) med tillräcklig träffsäkerhet för att kanalen ska bära autonoma drag inom mandat. Om fel: kanalen degraderar per konstruktion till eskaleringsläge — konsulten bekräftar tolkningen per händelse innan kärnan agerar på den (§13.5) — utan arkitekturändring. Skalfördelen minskar; inget löfte bryts.

### AA-004 | Status: aktivt *(4a)*
k = 5 med dominansspärr 40 % ger tillräcklig avidentifiering för populationen. Mätning: återidentifieringstest mot tidig verklig data. Reträtt: höj k — kostnadsfritt tack vare beräkning vid läsning (DL-003).

### AA-005 | Status: aktivt *(4a)*
Beräkning vid läsning skalar för v1:s volymer. Mätning: svarstid för statistikanrop. Reträtt: materialiserade celler med invalidering — dyrare raderingsväg; därför bevakas AA-004 aktivt.

### AA-006 | Status: aktivt *(4b)*
Attributionskatalogen täcker verkliga avslut med < 20 % oattribuerat. Mätning: skugglägets löpande andel. Reträtt: utöka katalogen; faktorn stannar i skuggläge.

### AA-007 | Status: aktivt *(4b)*
Dedup-signalerna (särskilt avrops-/DIS-referens) finns i tillräcklig andel för nivå A-matchning. Mätning: andel säkra matchningar i pilotdata. Reträtt: gråzonspresentation dominerar; §11:s dedup-baserade prissättning försvagas → affärsfråga till nivå 1 om den faller hårt.

---

## 4. Öppna frågor (AQ)

| ID | Fråga | Status |
|---|---|---|
| AQ-001–005 | (Leverans 1) | Besvarade → D-023, P-013, D-024, D-025, D-026 |
| AQ-006 | Deterministiskt rangordnings-/rekommendationssteg (D-026-optionen) | VET INTE (Anders). Återupptas i Block 5. **Nytt underlag via A-011.3:** eftersom fullföljandegrad och ägardata aldrig får vara modellsignaler är deterministisk logik i verkställighetslagret den enda plats där sådana faktorer någonsin kan ges automatisk effekt. |
| AQ-007 | Injektionstestsvit | Besvarad → A-007 |
| AQ-008 | Aggregatlagret pseudonymiserat, inte anonymt — samtyckesformuleringen | Besvarad → A-013 (Anders BESLUT: pseudonymisering med separerat nyckelvalv). **Nivå 1-åtgärd utestående: D-019 preciseras i MS v0.6.** |

---

## 5. Komponentspecifikationer

### 5.1 Mandatmodellens två objekt
**Konsultmandatet** — konsultens verkliga ramar (§9.4). Bor i kärnan, verkställs deterministiskt, når aldrig förhandlingsagentens kontext.
**Utbytesramen** — minimal projektion: aktuell auktoriserad position; tillåtna dimensioner; protokollregler och P-013-identifiering; stopp-/eskaleringsvillkor som händelsetyper; egna utbytets historik. Uppfyller AP-002 per konstruktion.

### 5.2 Positionstjänsten *(reviderad per A-012)*
Kärnan föreslår positioner, mandatvakten kontrollerar, svar: ny position / stå kvar / föreslå avbrott / eskalera. Fri rörelse inom mandat (A-005). Rangbesked beräknas deterministiskt och levereras samma väg (A-003). Avbrott verkställs endast efter konsultens bekräftelse (handlingstyp 31, A-012): bud förfaller, motpart meddelas. Kanaladaptrar (A-009): API / strukturerad e-post / fri e-post; mänsklig fallback samma objekt. *Detaljerad i §13.7.*

### 5.3 Dokumentarbetarnas utdatakontrakt
Deterministiskt schematvång; inert härkomstmärkt fritext; hård garanti (inget i huvudagentens kontext kan utlösa nivå 2/3-handlingar); upptäckbarhet via P-005/D-024. Omfattar inkommande motpartsmail. Residualrisk hanteras av A-007.

### 5.4 Förhandlingsagentens informationslista *(reviderad per A-015)*
**Vet:** utbytesram, motpartens identitet, konsultens identitet (A-015.4 — exponeras i utbytet), egna utbytets historik, mottagna rangbesked; i enmotpartsläget den kommunicerade acceptnivån (A-015.1 — avsedd exponering, AP-002 intakt). **Vet inte:** preferensvikter, profil utöver identiteten, parallella utbyten, kommersiella relationer, aggregatdata; i budgivningsläget konsultmandatets värden och övriga budgivares bud/identiteter (A-003).

---

## 6. Spänningsregister

| # | Spänning | Berörs av | Hantering |
|---|---|---|---|
| 1 | P-007/D-021 | A-001, A-006 | Motpartsagent-mönstret återanvändbart; endast golvet byggs |
| 2 | D-016/P-012 | §5.2, A-002j, A-009, AA-002, §13.6 | E-postkanalen gör huvudformen oberoende av motparts-API:er; fallback är samma utbytesobjekt med samma underlag (§13.6) — likvärdig, inte reservutgång |
| 3 | D-010/P-010 | AP-003, A-011 | **Löst per konstruktion:** modellen är ägarblind; P-009 uppfylls i gränssnittet; inget beteendebevis behövs |
| 4 | D-021/A-008 (MS) | A-006 | Ingen vårdgivaryta exponerar relationerna i förtid |
| 5 | P-006/D-019 | A-002l, A-011.2, §14.5 | Persistens värde-utlöst; anskaffningsanledningen gör spärren teknisk; tredjemans-uppgifter aldrig till aggregat |
| 6 | D-015/§11 | §15.1, §15.2 | **Börd:** unika bidraget granskbart utan att exponera andras villkor; motpartsinsyn/bestridande gör framtida nedviktning förenlig med "samma villkor". Stängs när prissättningen aktiveras (nivå 1) |
| 7 | D-022/P-007 | — | Ej börd ännu |
| 8 | T_int mot kallstarten (från 4a) | DL-001, §14.1 | v1:s rådgivning beror inte på L3; blir skarp om någon vill sänka k för volym — sänkning ej delegerad |

---

## 7. Parkeringslista

Tom.

---

## 8. Blockindelning — GODKÄND 2026-08-19

Block 1 Mandat (§9, **BESLUTAD**) → Block 2 Huvudagenten (§12, **BESLUTAD**) → Block 3 Förhandling (§13, **BESLUTAD**; reviderad av A-015, §13.11) → Block 4 Data/minne/profil/tenant + fullföljande/dedup/integrationslager (§14–15, **BESLUTAD** via A-013/A-014) → Block 5 Granskbarhet/säkerhet (inkl. AQ-006) → Block 6 Lojalitetsmatris/färdigkriterier/slutlig handoff till nivå 3.

---

## 9. BLOCK 1 — Mandatarkitekturen (BESLUTAD via A-008)

### 9.1 Klassificeringsmekaniken
Två axlar, deterministisk uppslagning, aldrig LLM-bedömning i körögonblicket: (1) extern exponering — ingen (nivå 1-kandidat) / synlig, icke-bindande, känd part (nivå 2-kandidat) / bindande, svårreversibel eller exponering mot ny part (nivå 3); (2) reversibilitet — handling som kräver motpartens medverkan för att göras ogjord är aldrig nivå 1. Oklassificerat = nivå 3 + backlog (A-002a). Klassificeringen sitter på handlingstypen, inte verktyget. Bortvalt: dynamisk LLM-nivåbedömning (§12 kräver spärr, inte omdöme).

### 9.2 Mönstret "första gången per part, därefter stående mandat"
Nivå 3 per part första gången; därefter stående mandat → nivå 2 för uppdateringar till samma part. Specialfall: budgivningens engångsram (A-008.2).

### 9.3 Handlingstypsinventariet — BESLUTAT

**Nivå 1 — fritt, alltid loggat**

| # | Handlingstyp |
|---|---|
| 1 | Läsa data konsulten delat |
| 2 | Marknadsdata-bevakning och analys |
| 3 | Löneanalys, ersättningsberäkning, erbjudandeanalys |
| 4 | Avtalsanalys och riskbedömning |
| 5 | Fakturakontroll-jämförelsen |
| 6 | Prognoser, matchningsanalys, jämförelse av erbjudandevägar |
| 7 | Generera rekommendation (Agentbeslut loggas) |
| 8 | Utkast: CV, positioner, meddelanden, redigeringsförslag (A-009.3) |
| 9 | Proaktiv notis till konsulten |
| 10 | Instansiera dokumentarbetare |
| 11 | Skriva profilfält (värde-utlöst, fältspårbart) |
| 12 | Ändra/radera profilfält på konsultens begäran |
| 13 | Skriva datapunkter till aggregatlagret inom opt-in (D-019/D-025) |

**Nivå 2 — inom mandat; loggat + realtidsinsyn**

| # | Handlingstyp |
|---|---|
| 14 | Bud, motbud, svar inom utbytesram — alla kanaladaptrar (D-016, A-009) |
| 15 | Rangbesked till budgivare (A-003) |
| 16 | Standardförfrågan till känd motpart |
| 17 | Påminnelse vid motpartstystnad |
| 18 | Meddelande om avbrott och budförfall |
| 19 | Uppdatera CV/dokument hos part inom stående mandat |
| 20 | Registerutdragsbeställning inom stående mandat (efter rad 23) |
| 21 | Bjuda in budgivare inom öppnad budgivningsram (efter rad 29) |

**Nivå 3 — explicit per instans, payload-låst**

| # | Handlingstyp |
|---|---|
| 22 | Bekräfta förhandlingsresultat / acceptera villkor (undantagslöst) |
| 23 | Första registerutdragsbeställningen per myndighet (A-004) |
| 24 | Skicka efterfaktura till motpart |
| 25 | Intresseanmälan till part där konsulten inte är känd |
| 26 | Första delningen av CV/profil/registerutdrag per part |
| 27 | Ge/ändra/återkalla opt-in-samtycke (konsultens handling) |
| 28 | Sätta/ändra/återkalla konsultmandat (konsultens handling) |
| 29 | Öppna budgivningsläge — engångsram (A-008.2) |
| 30 | Avsända konsultmeddelande via app-mail — konsultens handling, payload-låst (A-009) |
| 31 | Bekräfta avbrott av förhandlingsutbyte — konsultens handling, per instans *(tillagd via A-012)* |

**Utanför P-011:** pipelines och loggning — deterministiska, alltid spårbara.

### 9.4 Konsultmandatets form
Omfång (uppdragsprocess eller stående per part/myndighet); golv/tak per dimension; tillåtna dimensioner; giltighetstid; bekräfta-per-drag (A-005); notiskanal. Återkallelse total, framåtriktad, omedelbar. Stående mandat: tills återkallat; visas vid uppdragsslutsproaktivitet (A-008.1).

### 9.5 Mandatvaktens funktionssätt
Verkställighetslagret; alla externa verktygsanrop passerar; uppslagning per handlingstyp; payload-låsning på nivå 3 (kryptografiskt bunden, kort giltighet); spärr = logg + notis; oklassificerat = nivå 3 + backlog; allt loggas (D-024/D-026).

---

## 10. Kvalitetskontroll vid tionde beslutet (2026-08-19)

**Antaganden rangordnade:** 1. AA-001 (reträtt fördefinierad) · 2. MS-A-002 (förtroendet, styr AQ-006) · 3. MS-A-009 (nedgraderad efter A-009) · 4. AA-002 (endast budgivningsläget) · 5. MS-A-008/A-010 (sekvens).
**Svagast beslut:** A-003:s fullföljandefaktor — åtgärdad dubbelt: skuggläge (Tillägg 1) och modellblindhet (Tillägg 2).

---

## 11. Handoff-brief (uppdaterad vid A-015)

*Skriven för en mottagare som aldrig sett konversationen.*

**Uppdraget:** Agent Architect (nivå 2) designar agentarkitekturen för en personlig AI-agent för svenska vårdkonsulter, på grundval av Master Specification v0.5 (source of truth, i Claude-projektet) och Överlämningsunderlaget. Arbetsform: block med granskningspunkter; Anders beslutar med markörerna BESLUT/LUTAR ÅT/VET INTE/PARKERA. Detta dokument är arbetets tillstånd.

**Beslutat:** AP-001 (informationsgränser = vad komponenten vet), AP-002 (förhandlingsagentens exponeringskriterium), AP-003 (modellblindhet — rekommendationsförbjudna värden når aldrig modellindata; visningskrav uppfylls i UI). A-001 (struktur: huvudagent + förhandlingsagent + arbetare + pipelines + verkställighetslager), A-002 (14 punkter), A-003 (blind budgivning; fullföljandefaktor i skuggläge, UI-värde ej modellsignal), A-004 (HOSP/IVO), A-005 (fri positionsrörelse), A-006 (tenant-golvet), A-007 (injektionssvit lanseringskrav), A-008 (Block 1: 30 handlingstyper, mandatvakt, payload-låsning), A-009 (e-postkanalen, app-mail), A-010 (konsultsuveränitet; erbjudanden i ankomstordning, modellen rangordnar inte), A-011 (Block 2 med tröskelseparation, tredjemans-preferensvillkor, modellblindhet), A-012 (Block 3: livscykel, kanoniskt händelseschema, adaptrar API/strukturerad/fri e-post, fallback som förstklassigt läge, positionsflöde, blind budgivning med delad "nr 1", tystnadstrappan 2/4/10, allt avbrott bekräftas av konsulten — handlingstyp 31), A-013 (Block 4a: datalager L1/L2/L3, trösklarna, minnesklasser, tenant-golv; AQ-008 → pseudonymisering, MS v0.6-åtgärd utestående), A-014 (Block 4b: fullföljandehändelser med motpartsinsyn/bestridande, dedup i tre nivåer, integrationslagrets två flöden, utbytesdedup), A-015 (förhandlingsmodellen: budgivning vid flera / öppen acceptnivå vid en motpart; normaltidslön förhandlas, OB/villkor preciseras alltid av bf; mött nivå spärrar vidare krav; konsultens identitet känd). Delegerade beslut DL-001–DL-018 i beslutslogg-delegerat.md.

**Öppet:** AQ-006 (VET INTE; konkret förslag i Block 5 — nytt underlag: deterministisk logik är enda platsen där fullföljande-/ägarfaktorer kan ges automatisk effekt; 4b:s E1–E4 listar de möjliga effekterna). Nivå 1-åtgärd utestående: D-019-preciseringen kräver MS v0.6 (A-013/§14.8). Spänning 7 obearbetad; 3 löst per konstruktion; 6 börd via §15.

**Nästa steg:** Block 5 — granskbarhet/säkerhet (loggschema, granskningsvy "visa underlaget", AQ-006 som konkret förslag, §12-resten inkl. secrets/kryptering/injektionsskyddets detaljer). Därefter Block 6 (lojalitetsmatris P-001–P-013 mot mekanism, färdigkriterierna 1–8, slutlig handoff-brief till nivå 3). Kvalitetskontroll + handoff vid beslut 20 (nu 15).

**Discipliner:** härledning ur MS v0.5 per beslut; Anders markörer; luckor eskaleras till nivå 1; endast senaste dokumentversionen giltig; kvalitetskontroll + handoff-brief var tionde beslut (nästa vid beslut 20).

---

## 12. BLOCK 2 — Huvudagenten och rådgivningskärnan (BESLUTAD via A-011)

### 12.1 Roll och mandat
Huvudagenten är konsultens rådgivare och ombudets strategiska centrum — enda komponenten som talar med konsulten och enda som ser helheten. Analyserar, rekommenderar (fyra utfall, D-003), orkestrerar, föreslår mandat och positioner, skriver minne värde-utlöst.
**Förbjudna beslutstyper:** binda konsulten (nivå 3 undantagslöst); dölja erbjudanden eller vägar (A-002d); fortsätta argumentera efter konsultens val (A-010.1); nå extern kanal förbi mandatvakten; efterfråga data utan samtidig användning (P-006); väga in plattformens intäkt (P-001 — inga intäktssignaler finns i kontexten).

### 12.2 Informationsbehov (positiv lista per AP-001; reviderad per AP-003)
**Har:** konsultens profil, preferenser (inkl. relationspreferenser, A-010.2), historik och delade data; marknadsdata enligt D-004 (avrop och ramavtal åtskilda); aggregatlagrets trösklade statistik (aldrig rådata); uppdrags- och erbjudandevägsdata inklusive avsändaridentitet (behövs för orkestrering, deduplicering och relationspreferenser); pågående utbytens händelseströmmar (D-017); egna Agentbeslut-loggen.
**Har inte:** andra konsulters individdata (§12); kommersiella villkor mellan plattform och B2B-parter (P-008/P-010); aggregatlagrets rådata; credentials (verkställighetslagret); **ägarkopplingsflaggan** och **fullföljandegraden** (AP-003 — UI-renderade värden, aldrig modellindata).
**P-009-realisering:** avsändare och ägarkoppling renderas i gränssnittet ur databasposten. Frågor om ägarkoppling besvaras med datakort, inte med modelltext.

### 12.3 Verktygsfamiljer (7)
1. Marknad & analys · 2. Dokument (arbetare) · 3. Profil & minne (fältspårbart) · 4. Uppdrag & matchning · 5. Förhandlingsorkestrering (via mandatvakt) · 6. Kommunikation (notiser, utkast, app-mail-redigering) · 7. Underlag & logg (Agentbeslut, "visa underlaget"). Verktygsräkning mot AA-001 per familj vid implementation.

### 12.4 Orkestrering och felhantering
Typad delegation (arbetare: dokument + schema; instanser: utbytesram). Fel maskeras aldrig (A-002e): ett omförsök → ärligt besked med orsak och alternativ. Instans utanför mandat: spärr, frys, omstart med färsk ram eller eskalering — aldrig tyst omstart med ändrad position. Instanskrasch: utbytet parkeras + notis. Kärnkrasch: återupptag från loggat tillstånd; inga externa effekter utanför mandatvaktens logg.

### 12.5 Proaktivitetsflödet
Pipelines genererar händelser (uppdragsslut D-013, marknadssignal D-014, matchning D-006, mandatpåminnelse A-008.1, förhandlingshändelse) → väcker huvudagenten → nivå 1-analys → notis i konsultens kanal. Aldrig schemalagd kontakt. Händelser buntas; konsulten styr kanal och frekvens.

### 12.6 Agentbeslut-objektet och osäkerhetsrepresentation (reviderad per A-011)
**Fält:** id, tidpunkt, typ; rekommenderat utfall (D-003); samtliga kända alternativ och erbjudandevägar (D-024/D-026); underlagsdatapunkter med källa och färskhet; antaganden (t.ex. marginal 18/10 %); preferensfaktorer som påverkat rekommendationen (A-010.2; tredjemans-uppgifter fältspårbara, raderbara, aldrig till aggregat — A-011.2); osäkerhetsläge; motivering; modellversion; mandat-/samtyckeskontext.
**Presentation:** erbjudanden visas i ankomstordning; modellen rangordnar inte — den rekommenderar, och rekommendationen motiveras i underlaget.
**Tre osäkerhetslägen (A-002g):** observationsgrundad (skattning med spann) · modellgrundad (SKR-pris minus marginal, märkt "beräknad, ej observerad") · otillräcklig (ingen rekommendation, ärligt besked).
**Trösklar (A-011.1):** integritetströskeln (D-019) och kvalitetströskeln (observation vs modell) är två oberoende värden; båda sätts i Block 4. En ändring av den ena påverkar aldrig den andra tyst.

---

## 13. BLOCK 3 — Förhandlingsarkitekturen (BESLUTAD via A-012)

*Bygger på: A-001 (förhandlingsagent som instans), AP-002 (exponeringskriteriet), A-003 (blind budgivning), A-005 (fri positionsrörelse), A-008.2 (engångsram), A-009 (kanaler), A-010 (konsultsuveränitet), A-002 h/i/j/k, D-016/D-017, P-013. Berörda spänningar: 2 (fallbackens likvärdighet). Anders revision inarbetad: allt avbrott bekräftas av konsulten (A-012, §13.10).*

### 13.1 Förhandlingsutbytets livscykel

Varje Förhandlingsutbyte (MS §9) bär en deterministisk tillståndsmaskin i verkställighetslagret — aldrig LLM-bedömd i körögonblicket (samma logik som 9.1):

**skapad → aktiv → {väntar motpart | väntar kärna | väntar konsult} → parkerad ⇄ aktiv → avslutad {bekräftat | avböjt | avbrutet | förfallet}**

Varje övergång är en händelse i utbyteshistoriken och exponeras i realtid mot konsulten (D-017). **Kandidatresultat är ett tillstånd, inte ett avtal:** motpartens accept av agentens position (eller konsultens accept av motpartens bud) skapar tillståndet *väntar konsult* med ett kandidatresultat som endast handlingstyp 22 (nivå 3, payload-låst) kan omvandla till bekräftat — undantagslöst (D-016). Förhandlingsagent-instansen skapas vid aktivering och termineras vid parkering eller avslut; en återupptagen förhandling får en färsk utbytesram (konsistent med 12.4 — aldrig tyst omstart med ändrad position).

**Härleds ur:** D-016 (bindning kräver bekräftelse), D-017 (realtidsinsyn i processen), §12 ("ska inte kunna" = spärr, därför tillståndsmaskin i verkställighetslagret, inte modellomdöme).

### 13.2 Kanoniskt händelseschema — kanaladaptrarnas gemensamma kontrakt

Alla kanaler normaliseras till samma kanoniska händelsetyper. Utgående: bud/motbud/svar (14), rangbesked (15), förfrågan (16), påminnelse (17), avbrott/budförfall (18). Inkommande: motbud, accept-signal, avböjande, fråga/information, budgivaranmälan, otolkad (13.5). Varje händelse bär utbytes-id, part, kanal, tidpunkt, dimensionsvärden (payload) och källreferens till råmeddelandet.

**Adaptrar översätter — de förhandlar aldrig.** All förhandlingslogik ligger i instansen (inom utbytesramen) och kärnan (positionstjänsten); en adapter är ren protokollöversättning. Detta gör att A-009:s löfte — samma utbytesobjekt oavsett kanal — håller per konstruktion, och att en kanal kan bytas mitt i ett utbyte utan att historiken eller mandatet påverkas.

Rå inkommande motpartstext går genom karantänen (§5.3) och blir schematolkade fält + inert härkomstmärkt fritext innan något når instansen eller kärnan.

**P-013-blocket:** varje utgående meddelande, oavsett kanal, inleds med standardiserad identifiering — att avsändaren är konsultens agent, vem den företräder, samt D-016-förbehållet: *inget utfall binder konsulten förrän konsulten själv bekräftat det.* Förbehållet är inte artighet utan protokoll — det förhindrar att en motpart bygger berättigade förväntningar på ett kandidatresultat och gör P-013:s öppenhet operativ i varje enskilt meddelande.

**Härleds ur:** P-013, D-016, AP-002, A-009, §5.3.

### 13.3 Adapter: API (agent-till-agent)

Kanoniska händelser utbyts direkt som strukturerade meddelanden. Protokollegenskaper: sekvensnummer och idempotensnyckel per meddelande (dubbletter är verkningslösa); kvittens på mottagande; explicit giltighetstid på varje utgående bud, synlig för motparten; utgånget bud förfaller automatiskt och loggas (18 vid behov). En motparts accept-signal skapar kandidatresultat enligt 13.1 — aldrig avtal; D-016-förbehållet finns i meddelandeschemat, inte bara i text. Versions-/förmågehandskakning hålls minimal. Fältdefinitioner och transport är nivå 4.

**Härleds ur:** D-016, MS-A-009, A-009.

### 13.4 Adapter: strukturerad e-post

Minsta strukturerade motpartsgränssnittet (A-002h): utgående mail bär både läsbar text och maskinläsbar payload (samma kanoniska händelse); utbytes-id i ämnesraden binder svar till rätt utbyte. Inkommande svar tolkas i första hand ur payload; saknas den behandlas svaret som fri e-post (13.5). Svar går i samma kanal som erbjudandet kom (A-009). Ingen förhandsöverenskommelse krävs av motparten — payloaden är ett erbjudande om struktur, inte ett krav.

**Härleds ur:** A-002h, A-009, D-023 (utbyte via motpartens befintliga kanaler).

### 13.5 Adapter: fri e-post

Utgående: naturligt språk genereras *ur* den kanoniska händelsen — aldrig omvänt. Eftersom instansen som formulerar texten bara känner utbytesramen (AP-002, §5.4) kan texten inte läcka reservationsvärden, mandatgolv eller parallella utbyten — läckagegarantin är strukturell, inte instruerad (AP-001).

Inkommande: karantän (§5.3) → dokumentarbetare tolkar till kanonisk händelse med konfidensmarkering. Under konfidenströskeln klassas händelsen *otolkad*: den visas för konsulten med originaltexten, kärnan agerar inte på den förrän konsulten bekräftat tolkningen — gissning förekommer aldrig (A-002e). En motparts fritextaccept ("vi kör på det") är alltid endast kandidatresultat, oavsett formulering (D-016).

**Härleds ur:** A-009, AP-001/AP-002, A-002e, D-016. **Vilar på:** AA-003.

### 13.6 Mänsklig fallback — förstklassigt läge

Fallbacken är **samma Förhandlingsutbyte-objekt, samma tillståndsmaskin, samma logg och samma positionstjänst** — skillnaden är enbart att konsulten är kanalen (A-002j). Det är så spänning 2 bärs: läget är likvärdigt i kvalitet därför att allt utom transporten är identiskt.

Konkret: kärnan levererar samma underlag som i digitala kanaler — auktoriserad position, argument och talepunkter, rekommenderat nästa drag — direkt till konsulten (här gäller AP-002 inte, ty konsulten är huvudman, inte exponeringsyta: konsulten ser även sitt eget mandat och kärnans resonemang). Konsulten för dialogen (telefon, möte, egen mail) och rapporterar motpartens svar via snabbregistrering i appen; registreringen blir kanoniska händelser i samma händelseström, så realtidsvyn (D-017), rangberäkningen (A-003) och Agentbeslut-underlaget fungerar oförändrat. Bud som konsulten rapporterar in deltar i budgivning på samma villkor som digitala bud.

P-013 i fallback: konsulten talar som sig själv — ingen ombudsfråga uppstår. Vill konsulten skicka agentformulerad text i eget namn gäller app-mail-flödet (A-009, handlingstyp 30, payload-låst).

Fallbacken är också **degraderingsvägen**: fallerar en digital kanal mitt i ett utbyte växlar utbytet till fallback utan omstart — historik, mandat och tillstånd följer med (13.2).

**Härleds ur:** A-002j, A-009, D-016 (fallback i beslutet), D-017, P-013; spänning 2 (Överlämningsunderlaget §5.2: fallbacken ska vara verklig och likvärdig).

### 13.7 Positionstjänsten — detaljflöde *(delvis superseded av A-015 — se §13.11: i enmotpartsläget är positionen acceptnivån och stegvis rörelse utgår; flödet nedan gäller oförändrat i budgivningsläget)*

Per drag: **(1)** inkommande kanonisk händelse väcker kärnan; **(2)** kärnan bedömer strategiskt och föreslår nästa drag — den äger strategin (A-001), instansen föreslår aldrig positioner; **(3)** mandatvakten verifierar deterministiskt mot konsultmandatet (golv/tak, tillåtna dimensioner, giltighetstid); **(4)** svaret till instansen är ett av fyra: *ny position / stå kvar / föreslå avbrott / eskalera* (§5.2, reviderad per A-012 — avbrott verkställs aldrig utan konsultens bekräftelse); **(5)** i bekräfta-per-drag-läge (A-005) hålls steget tills konsulten godkänt.

**Direktivets innehåll är AP-002-minimalt:** den nya auktoriserade positionen och eventuell meddelandetext — aldrig motivering, avstånd till golvet eller strategi. Instansen vet *vad* den får bjuda, aldrig *varför* eller *hur långt* kärnan är beredd att gå.

**Eskalera** är svaret när draget kräver konsulten: motparten introducerar en dimension utanför mandatets tillåtna (instansen får inte förhandla den; konsulten kan utöka mandatet via handlingstyp 28), ett stoppvillkor i utbytesramen utlöses, eller kärnan bedömer att läget kräver konsultens ställningstagande. Eskalering är en notis med underlag — aldrig ett tyst stopp (A-002c/e).

Tempo: kärnan svarar asynkront; instansen har inga egna tidskrav — all tidsstyrning ligger i tystnadstrappan (13.9). Kraschsemantik enligt 12.4.

**Härleds ur:** A-001, A-005, AP-002, P-011 nivå 2, §5.1–5.2.

### 13.8 Budgivningsprotokollets semantik

**Sekvens:** konsulten öppnar engångsramen (29, nivå 3) → inbjudningar till budgivare (21, nivå 2) → bud inkommer via valfri adapter (inkl. fallback-inrapporterade) → rang beräknas deterministiskt i verkställighetslagret mot mandatets dimensioner — aldrig LLM, aldrig fullföljandegrad så länge skuggläget gäller (A-003) → rangbesked (15) sänds endast till budgivare vars rang ändrats.

**Rangbeskedets semantik (A-010.3-realisering):** ett rangbesked är ett lägesbesked vid en tidpunkt, med standardiserad lydelse av innebörden: budet är för närvarande främst / inte främst enligt konsultens kriterier; detta är inget löfte om utfall — konsulten väljer fritt bland alla vägar och kan avstå helt (D-003, A-010.1). Standardlydelsen är protokoll, inte modellformulering, så att inget besked någonsin kan glida mot utfallslöfte.

**Blindhet (A-003):** aldrig belopp, detaljvillkor, budgivares identiteter — och inte heller antal budgivare. Att ett "nr 1"-besked ersätts av "inte nr 1" avslöjar med nödvändighet att ett bättre bud finns; det är inneboende i beslutad modell och accepteras.

**Likvärdighet:** vid exakt likvärdighet enligt mandatets dimensioner får samtliga likvärdiga budgivare "nr 1". Rang är lägesbeskrivning, inte tilldelningsmekanik — ett artificiellt sekundärkriterium (tidsstämpel, slump) vore ett dolt automatiskt rangordningssteg, vilket är exakt frågan AQ-006 håller öppen och därför inte får smygas in här.

**Avslut:** budgivningen har ingen automatisk tilldelning. Konsultens val (A-010.1) och bekräftelse (22) avgör; ramens giltighetstid löper ut → utbytena stängs och budgivarna meddelas (18). Sena bud efter konsultens val men före bekräftelse visas för konsulten (A-002d — filtreringsförbudet gäller) men utlöser aldrig autonom omförhandling.

**Härleds ur:** A-003, A-008.2, A-010.1/A-010.3, A-002d, D-003, D-016, P-013.

### 13.9 Tystnad och timeout

Trappan (A-002k) konkretiseras som tre parametrar per utbyte, synliga för konsulten och justerbara av konsulten inom mandatet:

**T1** — påminnelse till motpart (17). **T2** — notis till konsulten med handlingsval: vänta / påminn igen / avbryt / växla till fallback. **T3** — parkering: instansen termineras, tillståndet bevaras, konsulten notifieras.

Defaultvärden (BESLUT, A-012): T1 = 2 arbetsdagar, T2 = 4, T3 = 10. Värdena är driftparametrar, inte arkitektur — de ändras utan ombyggnad och kan differentieras per kanal (API-tystnad är mer signifikant än mailtystnad).

Utgående bud bär egen giltighetstid, synlig för motparten (13.3–13.5); utgånget bud förfaller automatiskt och loggas. Sent svar på parkerat utbyte väcker det: notis till konsulten, som avgör återupptag (färsk ram enligt 13.1) eller avslut. I budgivning är tystnad kostnadsfri: en inbjuden budgivare som inte svarar får högst en påminnelse (T1) och sedan ingenting — uteblivet bud är ett giltigt icke-bud, inte ett fel.

**Härleds ur:** A-002k, A-002e (parkering redovisas ärligt), D-017, P-006-analogin (ingen kontakt utan syfte — gäller även motparter).

### 13.10 Avbrytbarhet (reviderad per A-012)

**Grundregel (A-012): allt avbrott bekräftas av konsulten — kärnan verkställer aldrig avbrott själv.** Avbrott kan initieras av tre håll; verkställigheten är gemensam och sker först vid konsultens bekräftelse (handlingstyp 31, nivå 3):

**(1) Konsulten själv.** Stoppet är en förstklassig kontroll i realtidsvyn (D-017): ett tryck, en enkel bekräftelse som felklicksskydd (= handlingstyp 31), därefter omedelbar verkan. Verkställs i verkställighetslagret, inte via modellen — kan inte fördröjas, omtolkas eller argumenteras emot (A-010.1, §12 "ska inte kunna").

**(2) Kärnan — föreslår, verkställer aldrig.** Positionstjänstens *föreslå avbrott*-svar (§5.2) är en eskalering till konsulten med orsak och alternativ (A-002e). Konsulten bekräftar (31) eller ger annan riktning. I väntan på svar gör kärnan inga vidare drag i utbytet ("stå kvar"); P-002 realiseras i förslaget och rekommendationen — aldrig i egen verkställighet.

**(3) Stoppvillkor i utbytesramen — spärr direkt, avslut efter bekräftelse.** Villkoren är händelsetyper (§5.1), t.ex. motparten kräver bindande svar eller introducerar otillåten dimension upprepat. Utlöst villkor ger **omedelbar deterministisk spärr** mot alla vidare utgående drag (§12:s skyddsverkan förloras inte av bekräftelsekravet) + eskalering till konsulten, som bekräftar avbrott (31) eller justerar mandatet (28). Kommer inget svar hanterar tystnadstrappan läget: utbytet parkeras vid T3 — parkering är inte avbrott, inget motpartsmeddelande om avslut sänds utan konsultens beslut.

**Verkan vid bekräftat avbrott:** spärr i mandatvakten mot alla vidare utgående drag; instansen termineras; utestående egna bud förfaller; motparten meddelas (18, A-002i); tillstånd → avslutat (avbrutet); allt i händelseström och Agentbeslut-logg (D-024/D-026). Redan avsända meddelanden kan inte återkallas ur motpartens kanal — avbrottsmeddelandet är den arkitektoniska kompensationen och P-013:s krav på öppenhet även i avslut.

**Två räckvidder:** bekräfta avbrott av ett utbyte (31, per instans) respektive återkalla mandatet (28) — det senare avbryter samtliga utbyten under mandatet med samma verkan, i linje med 9.4 (återkallelse total, framåtriktad, omedelbar). Båda är konsultens handlingar; bekräftelsekravet är därmed uniformt.

**Härleds ur:** A-012, D-017 (och MS §15: avbrytbarhet delegerad till nivå 2 — härmed besvarad), A-002i, A-010.1, P-002, P-011 (tveksamhetsregeln), P-013, §12.

### 13.11 Förhandlingsmodellen (A-015) — revision av 13.7–13.8

**Två lägen, valda av verkligheten, inte av agenten:**

**Läge 1 — flera intressenter: budgivning.** Oförändrat enligt A-003 och §13.8: blind budgivning, rangbesked, konkurrensen driver priset tills konsulten bedömer att budet räcker (A-010.1). Konsultens identitet är känd för varje budgivare (A-015.4); blindheten avser deras bud och varandra.

**Läge 2 — en motpart: öppen acceptnivå.** Konsulten sätter acceptnivån i mandatet (nivå 3, handlingstyp 28); agenten kommunicerar den rakt. Exempel ur beslutet: konsulten satte 410 kr/h; bf bjuder 390; agenten svarar att acceptnivån är 410; bf höjer till 410; kandidatresultat skapas och konsulten meddelas — hon bekräftar (22) eller avböjer, men kan inte fortsätta förhandla uppåt i utbytet. Spärren är deterministisk i verkställighetslagret. Ingen stegvis kohandel förekommer: positionen ÄR acceptnivån, §13.7:s dragflöde reduceras i detta läge till svar/förtydligande/eskalering.

**Dimensionen och preciseringskravet (A-015.2):** det som förhandlas är **normaltidslön**. OB och övriga villkor måste alltid preciseras av bf i budet; ett bud utan preciserade villkor är ofullständigt och kandidatresultat skapas inte. Avviker ett preciserat villkor från mandatets krav är acceptnivån inte mött, och agenten säger det — men förhandlar det inte.

**Vad som superseded:** §13.7:s stegvisa positionsrörelse och §5.4:s hemlighållna reservationsvärden i enmotpartsläget; A-005:s "fri positionsrörelse" avser efter A-015 endast budgivningslägets rang-responsiva justeringar inom mandat. Historiken kvarstår i respektive avsnitt med markering — inget ändrat tyst.

**Vad som består:** D-016 (inget binder utan bekräftelse), D-017 (realtidsinsyn), P-013-blocket i varje meddelande, tystnadstrappan (§13.9), avbrytbarheten (§13.10, handlingstyp 31), mänsklig fallback (§13.6) — fallbacken blir till och med enklare: konsulten säger sin acceptnivå själv, med agentens kalibreringsunderlag.

---

### 13.12 Vad som medvetet valts bort

**Automatisk budgivningsstängning med tilldelning** — vore ett automatiskt rangordningssteg med utfallsverkan (AQ-006 öppen; A-010.1 kräver konsultens val). **Sekundärkriterium vid lika rang** — samma skäl (avslaget bekräftat i A-012). **Kärnans självständiga avbrottsrätt** — förslogs som nivå 2; avslagen av Anders (A-012): allt avbrott bekräftas av konsulten. **Stegvis kohandel i enmotpartsläget** — ersatt av öppen acceptnivå (A-015). **Återkallelse av avsända meddelanden** — omöjligt i e-post, opålitligt i API; kompensationsmeddelande valt i stället. **Förhandlingslogik i adaptrar** — skulle bryta AP-002:s garanti och göra kanalbyte mitt i utbyte omöjligt. **Egen tidsstyrning i instansen** — skulle ge instansen initiativ utanför händelsestyrningen; all klocka ligger i verkställighetslagret.

---

## 14. BLOCK 4a — Data, minne, profil, tenant (BESLUTAD via A-013)

### 14.1 Datalagren
**L1 Individlagret** (profil, dokument, erbjudanden, utbyten, Agentbeslut; ägs av principal, ingen läsning tvärs över) · **L2 Marknadslagret** (SKR-priser, avropsdata, ramavtalsdata, domänexpertis, BEGA-historik; ingen konsultpersondata; **avrop och ramavtal fysiskt åtskilda tabeller med åtskilda frågevägar**, D-004) · **L3 Aggregatlagret** (opt-in-datapunkter inkl. härledd data, D-025; rådata exponeras aldrig). **Bron:** L3 nås endast via deterministisk statistiktjänst i verkställighetslagret — trösklad statistik eller "under tröskel"; ingen frågeväg förbi (AP-001). **v1:s rådgivning beror inte på L3** (DL-001) — L3 är uppsida, inte beroende.

### 14.2 Integritetströskeln (T_int)
Cell = (roll, ort, period) med anställningsform/uppdragslängdsklass som förfining; **fast raster** (DL-006). Exponering kräver **k = 5 distinkta konsulter** och **ingen konsult > 40 %** av observationerna (DL-002; sänkning av k ej delegerad). **Aggregatceller materialiseras aldrig — beräkning vid frågetillfället** (DL-003): radering omedelbar, trösklar frågetidsparametrar. Besked under tröskel är icke-informativt (DL-007).

### 14.3 Kvalitetströskeln (T_kval)
Grindar valet av skattare (observation vs domänmodell), inte L3. Trösklarna sitter på olika rör — därav A-011.1:s separation. Provisorisk startregel: ≥ 8 obs / ≥ 4 källor / IQR ≤ 15 % av median (DL-004 — uttalade gissningar). **Kalibreringsapparaten är lanseringskrav:** båda skattningarna loggas per rekommendation plus observerat utfall; tröskeln sätts empiriskt. Tredje läget "otillräcklig": ingen rekommendation, ärligt besked (A-002e/g).

### 14.4 Oberoendet mekaniserat (A-011.1)
Konsekvensrapport med kvittens före varje T_int-ändring; osäkerhetsläget synligt fält per Agentbeslut; regressionstest att parametrarna läses ur separata källor; separat ägarskap (dataskydd respektive rådgivningskvalitet). **Regel: stryper T_int observationen faller rådgivningen till modellen — aldrig till tystnad.**

### 14.5 Minne och profil
**K1 profilfält** (typade, fältspårbara; attribut: källa, färskhet, giltighetstid, **anskaffningsanledning**, delningsstatus, aggregatstatus, tredjemansflagga) · **K2 härledda observationer** (D-025, samma spårbarhet) · **K3 arbetsminne** (persisteras aldrig som profil). **Anskaffningsanledningen är teknisk spärr:** verkställighetslagret avvisar profilskrivning utan giltig anledning (levereras-nu-analys, pågående dokumentgenerering, aktiverad matchning, oombedd delning, beställd verifiering) — P-006 granskbar ur databasposten (AP-003-mönstret; DL-008). **Inget fritt textminne i v1** (DL-005): fritext endast fältbunden; vektorindex endast över dokument (raderbart med dokumentet). Kostnaden uttalad: agenten minns det som blev ett fält.

### 14.6 Samtycke, delningsvy, radering
Ett samtycke, snävt ändamål (D-020), härledd data uttryckligen namngiven (D-025). Delningsvyn renderas ur delnings-/aggregatstatusfälten. Återkallelse framåtriktad per D-019 — och med omedelbar bakåtverkan på aggregatet tack vare 14.2. Tredjemansflaggade fält filtreras bort på skrivvägen till L3, i kod (A-011.2).

### 14.7 Tenant-golvet (A-006 konkretiserat)
Principaltyper: Konsult, Vårdgivare, Bemanningsföretag, Plattform — endast Konsult och Plattform har inloggningsväg i v1 (D-023). Fyra golvkrav: (1) principal-id på varje persondatarad från dag ett; (2) all åtkomst via scopat dataåtkomstlager, scope av principal, aldrig modellomdöme; (3) delning mellan principaler som **grant-objekt med livscykel, aldrig kopierade rader**; (4) loggrader bär principal + handlande agent (D-024). Byggs inte i v1: portaler, API-nycklar, tenant-administration. SmartPool-medlemskap blir ett grant från konsulten (P-011 nivå 3), aldrig en profilkopia. §12:s läckageprincip: två oberoende mekanismer (scopat lager + huvudagentens informationslista); aggregattjänsten enda bron mellan konsulter.

### 14.8 Aggregatlagrets rättsliga karaktär (AQ-008 — BESLUTAT)
Lagret är **pseudonymiserat** (konsultpseudonym krävs för k- och dominansvillkoren), med nyckeln i separerat nyckelvalv; **exponerad statistik är anonym**; raderingsrätten verkställs fullt ut. Konstruktionen är starkare för konsulten än äkta anonymitet (som omöjliggör både tröskelräkning och radering). **Nivå 1-åtgärd utestående: D-019:s ordalydelse ("anonymiserat") preciseras i Master Specification v0.6.**

---

## 15. BLOCK 4b — Fullföljande, deduplicering, integrationslager (BESLUTAD via A-014)

### 15.1 Fullföljandehändelser
Mätenhet: avslutad förhandlingsprocess; per aktör, aldrig individ; deterministiskt UI-värde i skuggläge (AP-003, A-003). **Klasser:** FULLFÖLJT (bekräftat → motparten står fast); ICKE-FULLFÖLJT (N1 återtag/försämring efter kandidatresultat eller "nr 1" utan konsultsideshändelse; N2 förfallet där tystnaden var motpartens; N3 bekräftat som inte fullföljs utan giltigt undantag); NEUTRALT (U1 konsulten tackade nej; U2 avbrutet — per A-012 alltid konsultens handling; U3 konsultsidan ändrade villkor; U4 vårdgivaren drog uppdraget — kräver mekaniskt stöd eller dokumenterat bestridande, **aldrig motpartens eget påstående**, med 30 dagars efterhandskontroll mot dedup-grafen, DL-016; U5 förfallet på konsultsidans tystnad; U6 konsultens förhinder; U7 yttre hinder, manuell). **Tveksamhetsregeln:** oentydig händelseström → OATTRIBUERAT, räknas aldrig mot någon. Ingen LLM-klassning (AP-003, D-026).
**Parametrar:** 12 mån rullande fönster (DL-011); visningströskel 5 attribuerade avslut (DL-012). **Exit ur skuggläget är alltid Anders beslut**, vid mätbara villkor (DL-013) inklusive att **motpartsinsyn och bestridande är i drift — uttryckligt BESLUT:** aktör får på begäran (befintliga kanaler, ingen portal — D-023) se egen grad och egna klassningar, bestrida; bestriden händelse oattribuerad tills manuellt avgjord. Möjliga framtida effekter (E1 rangviktning, E2 inbjudningsstöd, E3 hårdare protokollvillkor, E4 ingen) redovisade — beslutas med AQ-006 i Block 5.

### 15.2 Deduplicering (D-009)
Regelstyrd, nivåindelad: **A säker** (avrops-/DIS-referens eller full nyckelmatch) → ett Uppdrag med flera vägar; **B gråzon** (vårdgivare+roll+ort, periodöverlapp ≥ 80 %, omfattning ±10 % — parametrar, DL-014) → två med ömsesidig flagga (A-002m); **C** separata. Körs i **deterministisk bakgrundspipeline** (D-026-prövbar, P-010-lika för alla); LLM endast för fältextraktion under schematvång uppströms. **Dedup är presentation, aldrig urval:** alla vägar visas i ankomstordning (A-002d); inga rekommendationsförbjudna värden i nyckeln (AP-003). Konsultkorrigering = lokal åsidosättning, aldrig automatisk inlärning (DL-015). §11:s prissättning: aktörens **unika bidrag** beräknas ur dedup-grafen; mot aktören exponeras endast egna uppdrag och antal — aldrig andras villkor.

### 15.3 Integrationslagret (D-011)
Två flöden som aldrig delar skrivväg: **marknadsdata → L2**, **motpartskanaler → L1**; vägen L1 → L3 endast via opt-in (handlingstyp 13) och läsning endast genom T_int. **Ingestkontraktet** (låser gränssnittet, inte lagringsplatsen — D-011): varje datapunkt bär källa, inhämtningstidpunkt, giltighetsperiod, datatyp (styr fysisk avrop/ramavtal-separation) och schemaversion; färskheten når Agentbeslut-underlaget — en släpande källa syns som ålder, aldrig som tyst hål (P-005). **Karantän utan undantag** — även myndighetsdokument (A-007:s svit omfattar båda flödena). **Fallbacken är en kanaladapter med konsulten som transport:** samma händelser, samma skrivvägar, samma attributionsunderlag — ingen egen enklare kodväg (spänning 2).

### 15.4 Utbytesdeduplicering
Parallella aktiva utbyten mot samma Uppdrag (nivå A-match) endast inom öppnad budgivningsram (29) — där är parallelliteten avsedd och styrd. Annars **ett aktivt utbyte per Uppdrag**; vid upptäckt eskalering till konsulten: konvertera till budgivning eller välj väg — inga autonoma avslut (A-012). Nivå B-match: endast flagga i realtidsvyn. Ingen förhandlingsagent får kännedom om parallellutbytet (AP-002).
