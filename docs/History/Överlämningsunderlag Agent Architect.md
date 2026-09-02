# Överlämningsunderlag till Agent Architect

**Från:** Master Spec-processen (Nivå 1)
**Underlag:** Master Specification v0.4 (projektets source of truth — läs den i sin helhet; detta dokument ersätter den inte)
**Datum:** 2026-08-15

Detta dokument beskriver vad Agent Architect ärver: vad som är låst, vad som är dess att avgöra, vad som är känt men inte dess att lösa, var underlaget är svagast, och vilka spänningar som måste hanteras i designen.

---

## 1. Låst — får inte omprövas på nivå 2

Följande är beslutat i Master Spec-processen. Upptäcks ett problem med något av detta eskaleras det tillbaka till nivå 1 — det designas inte bort, tolkas inte om och kringgås inte.

### Principer (samtliga P-001–P-012)

Den fasta kärnan enligt P-012 är: lojalitetsarkitekturen, beslutslager-positioneringen, säkerhets- och mandatprinciperna samt samtyckesarkitekturen. Särskilt:

- **P-001** — Agenten representerar alltid konsulten. Betalande B2B-parter ändrar aldrig lojaliteten.
- **P-002/P-003** — Agenten är inte optimerad för transaktion. Fyra likvärdiga utfall: acceptera, förhandla, tacka nej, vänta (D-003).
- **P-005** — Varje rekommendation ska kunna förklaras: underliggande data, antaganden, osäkerhet.
- **P-006** — Ingen datainsamling utan samtidigt värde för konsulten (operationaliserad i D-005).
- **P-008 + P-010** — Betalning ger synlighet, aldrig prioritet. Ägarkoppling (BEGA) ger ingen fördel i något led — agenten rekommenderar aktivt bort från ägarkopplad väg när en annan är bättre. Likabehandlingen ska vara **tekniskt granskbar från lanseringsdagen**, inte från första avgiften.
- **P-011** — Trenivåmodellen för mandat. Nivåerna och klassificeringsregeln (reversibilitet + extern påverkan; vid tveksamhet en nivå högre) är lag. Exemplen är vägledning.
- **P-012** — Gränsen mellan fast kärna och fri tillväxtyta, samt kravet att experiment med externt beroende har en fallback projektet kontrollerar.

### Beslut med direkt arkitekturpåverkan

- **D-001/D-002** — Beslutsstöd är produkten och första leveransen; förmedling är inte pitchen.
- **D-004** — Datagrunden för ersättningsbedömning: SKR-priser, standardmarginaler (ca 18 % löneanställd / ca 10 % företagare), kodifierad domänexpertis, 36 mån rullande avropsdata, BEGA-historik. Avrops- och ramavtalsdata hålls åtskilda i modell och resonemang.
- **D-005** — Ingen obligatorisk profillista. Profilen växer värde-utlöst.
- **D-006** — Uppdragsmatchning och timvikariat är aktiva val (opt-in-kryss) med matchningskriterier. Domänmodellen skiljer uppdragsgivartyp från dag ett.
- **D-009** — Deduplicering: *Uppdrag* (behovet) och *Erbjudandeväg* (vägen in) är separata objekt. Flera vägar → ett uppdrag.
- **D-010 + D-015** — BEGA seedar flödet som fallback och ska spädas; ingen kommersiell särställning; öppen anslutning på samma villkor.
- **D-012/D-013** — Anställningsform och uppdragslängd är centrala dimensioner. Uppdragets slutdatum är agentens viktigaste proaktivitetstrigger.
- **D-016** — Automatiserad förhandling ingår i premium v1 som agent-till-agent-datautbyte. **Inget resultat är bindande utan konsultens explicita bekräftelse — oavsett mandat.** Mänsklig fallback finns alltid.
- **D-017** — Konsulten har full realtidsinsyn i pågående förhandling, inte bara i slutresultatet.
- **D-018** — Fakturakontrollen (faktura mot tidrapport, efterfakturering) gäller endast företagande konsulter. Lönespecifikation ingår inte i v1 men designas inte bort.
- **D-019/D-020** — Konsultdelad data återanvänds endast aggregerat, med explicit opt-in, trösklar per roll/ort/period, rådata aldrig exponerad. Samtyckets ändamål är snävt: konsultsidans rådgivning. All annan användning kräver nytt samtycke.
- **D-021** — SmartPool är planerad produkt (mål: inom 12 månader) med två låsta villkor: beslutslagret lanserar först och SmartPool är aldrig pitchen i fas 1; brandväggen omfattar vårdgivares betalning.
- **§11 bindande princip** — Ingen take rate på kontraktsvärde på konsultsidan. Intäktsmodellen får aldrig belöna avslut.
- **§12 särskild princip** — Ingen informationsläcka mellan aktörer eller konsulter inom plattformen.

---

## 2. Medvetet lämnat till Agent Architect att avgöra

Detta är nivå 2:s designutrymme. Master Spec ställer krav men föreskriver inte lösning.

1. **Agentuppsättningen.** Vilka agenter som finns, deras roller, mandat, informationsbehov, kommunikationsmönster och hur den personliga huvudagenten orkestrerar specialisterna. §13 anger endast preliminär riktning (huvudagent + specialiserade domänagenter).
2. **Klassificeringen av samtliga handlingstyper** mot P-011:s tre nivåer. Regeln är låst; tillämpningen per handlingstyp är nivå 2:s uppgift.
3. **Granskbarhetsmekanismen** för P-008/P-010: loggning av rekommendationsunderlag, reproducerbarhet, eventuell tredjepartsgranskning. Kravet (granskbar från lanseringsdagen) är låst; mekanismen är öppen.
4. **Förhandlingsutbytets protokoll.** Teknisk form för agent-till-agent-utbytet, avbrytbarhet under pågående förhandling, samt vad som utgör minsta gångbara motpartsgränssnitt (t.ex. strukturerad e-post) innan mänsklig fallback tar vid.
5. **Representation av osäkerhet och konfidens** i Agentbeslut — hur P-005:s förklarbarhetskrav realiseras, inklusive beteendet vid tunt dataunderlag per ort/period (när modell ersätter observation).
6. **Minnes- och profilarkitekturen** inom D-005:s värde-utlösta regel — vad som persisteras, var, och hur profilen växer utan att bryta P-006.
7. **Realisering av §12:s säkerhetskrav** — tenant isolation, prompt injection-skydd, behörighetsmodell för verktygsanrop, separation mellan datalager (individrådgivning vs aggregerat).
8. **Hur deduplicering (D-009) faktiskt utförs** — matchningslogik för att känna igen samma underliggande behov via flera vägar.

---

## 3. Öppna frågor att känna till men inte lösa

Dessa ligger kvar på nivå 1 (produktbeslut hos Anders) eller i affärsledet. Agent Architect ska inte avgöra dem — men får inte designa så att något av utfallen omöjliggörs.

- **Konsultanskaffning och aktivering** (prioriterad fråga 1). Enda arkitekturkonsekvensen: krokar ska kunna bytas utan ombyggnad (D-022).
- **Exakt intäktsmodell och prissättning** på konsultsidan, samt **freemium/premium-gränsen funktion för funktion**.
- **vardbemanning.ai:s roll** — faktakälla, datalager, produktdomän eller vilande. (Mockups använder domänen som produktyta; det är inte beslutat.)
- **B2B-användning av aggregerad konsultdata** — medvetet olåst. Arkitekturen får varken förutsätta att optionen exerceras eller omöjliggöra re-consent-vägen (D-020).
- **SmartPool-prissättning** mot vårdgivare — avgörs i pilotdialog.
- **Falsifieringskriterium för A-006** — sätts vid lansering.
- **Juridisk struktur och regulatoriska krav** per datatyp och användningsfall.
- **När det konsultdelade datalagret når kritisk massa** per ort/roll, och hur kallstarten överbryggas.
- **Premiumbevis för löneanställda** utöver Löneanalysen.
- **Röst som förstaklassgränssnitt** — riktning, ej beslutad; texten är beslutat gränssnitt i v1-planen.

---

## 4. Var specen är svagast eller tunnast underbyggd

Ärlig bedömning från nivå 1, i fallande allvarlighetsgrad:

1. **A-003 (betalningsvilja för premium).** Hela den primära intäktsmodellen vilar på den, och ingenting i specen validerar den. Produkten kan fungera och bolaget ändå fallera.
2. **D-016 (autoförhandling i v1) är det svagast motiverade beslutet.** Det flyttar den tekniskt mest komplexa, mest beroendetunga förmågan in i v1 på ett overifierat antagande (A-009) om motparternas teknik. Skyddsräckena är solida (bekräftelsekrav, insyn, fallback), men sannolikheten att verkligheten tvingar fram omprövning är högre här än någon annanstans. Fallbacken bör i praktiken behandlas som ett förstklassigt läge, inte ett undantagsfall.
3. **A-002 + domänfaktan (marginalerna 18 %/10 %).** Löneanalysens träffsäkerhet är kärnleveransens förtroendegrund, och marginalsiffrorna är approximativ branschkunskap från grundaren — inte verifierade mot data. Fel här syns direkt i produktens första intryck.
4. **D-021:s 12-månadersmål** vilar på A-010, där Bemlos existens är indikation men inte bevis — varken för vårdgivarnas betalningsvilja eller för att tillräckligt många konsulter aktiverar direktvalet.
5. **A-007 (avropsdatans praktiska inhämtning).** Rättsligt oproblematisk (offentlighetsprincipen) men kadens, format och kostnad för löpande inhämtning från ~290 kommuner och 21 regioner är oprövad.
6. **Domänmodellen är beslutad men grund.** Kärnobjekten finns, men attribut, relationer och livscykler är skissade snarare än specificerade — nivå 2/3 kommer att behöva fördjupa utan att ändra objektgränserna.

---

## 5. Kända spänningar som Agent Architect måste hantera

Dessa är inte fel — de är medvetna avvägningar vars balans designen måste bära.

1. **P-007 mot D-021.** Beslutslagret ska etablera förtroende innan SmartPool får synas, samtidigt som SmartPool har ett 12-månadersmål. Kommersiellt tryck kommer att testa sekvensen. Designen måste göra SmartPool byggbar i skuggan utan att den läcker in i positioneringen.
2. **D-016 mot P-012:s fallback-klausul.** Autoförhandlingens huvudform beror på motparter projektet inte kontrollerar. Fallbacken är det som gör beslutet förenligt med P-012 — den måste därför vara verklig och likvärdig i kvalitet, inte en teoretisk reservutgång.
3. **D-010 mot P-010.** I värsta fall (A-008 faller) lanserar plattformen med ägarens bolag som dominerande utbudskälla, samtidigt som ägarneutralitet är kärnlöftet. Granskbarhetsmekanismen är det enda som gör den kombinationen trovärdig — därför är den ett lanseringskrav, inte en förbättring.
4. **D-021 mot A-008.** SmartPool disintermedierar bemanningsföretag — samma bolag som ska rekryteras som pilotpartners. Arkitekturen bör inte tvinga fram att båda relationerna exponeras för varandra tidigare än nödvändigt.
5. **P-006 mot D-019.** Datalagret behöver volym för att nå trösklarna; P-006 förbjuder datainsamling utan samtidigt värde. Opt-in-flödet måste därför generera data som biprodukt av leverans — aldrig som eget arbetsmoment.
6. **D-015 mot §11:s värdebaserade prissättning.** "Samma villkor" betyder samma prislogik, inte samma belopp. Distinktionen är beslutad men kommunikativt känslig — allt som exponerar prissättning mot utbudssidan måste bära den korrekt.
7. **D-022 mot P-007.** Anskaffningskrokar får bytas fritt, men en krok som gör förmedling till pitchen kräver supersede av P-007 på nivå 1. Systemet ska tillåta krok-experiment utan att öppna den dörren av misstag.

---

*Vid konflikt mellan detta dokument och Master Specification v0.4 gäller v0.4. Ändringar i något av ovanstående går genom Master Spec-processen (nivå 1).*
