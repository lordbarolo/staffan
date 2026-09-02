# Master Specification v0.5

**Personlig AI-agent för vårdkonsulter**

Datum: 2026-08-15
Status: **Överlämnad till Agent Architect (Nivå 2) — nivå 1 besvarar eskaleringar löpande**
Ersätter: Master Specification v0.4

---

## Ändringslogg v0.4 → v0.5

Samtliga ändringar är svar på Agent Architects eskaleringar (Leverans 1, frågor AQ-001–AQ-005):

- **Ny princip:** P-013 (Öppet ombudskap) — svar på AQ-002.
- **Nya beslut:** D-023 (ingen motpartsyta i v1; tenant-modellen bär framtida ytor — AQ-001), D-024 (granskbarhetens publik: konsulten i produkten + tredjepartsgranskningsbar per konstruktion — AQ-003), D-025 (ett samtycke som uttryckligen omfattar härledd data — AQ-004), D-026 (reproducerbarhet = prövbart loggat underlag, inte bitvis återkörning — AQ-005).
- **§15:** granskarens identitet (del av prioriterad fråga 6) beslutad; mekanismdesignen kvarstår hos nivå 2.
- Agent Architects Leverans 1 godkänd av nivå 1 utan anmärkning; skärpningen om profilfältsspårbarhet (P-006) godkänd inom nivå 2:s mandat.

---

## Ändringslogg v0.3 → v0.4

- **Ny princip:** P-012 (Fast kärna, fri tillväxtyta) — formaliserar trial-and-error-arbetssättet och sluter K4 (den tidigare oformulerade principen bakom D-010/D-011).
- **Nya beslut:** D-021 (SmartPool — pool, inhyrning och rekrytering mot vårdgivare, mål inom 12 månader), D-022 (Anskaffningsmekanismen är strategi, inte princip).
- **Nytt antagande:** A-010 (vårdgivares betalningsvilja och SmartPools kritiska massa).
- **Härledningar slutna:** D-010 och D-011 härleds nu även ur P-012.
- **§10/§11:** SmartPool tillagd som planerad produkt; §11 får en vårdgivarsida. Bemlo loggad som konkurrent/förebild.
- **§15:** P-012-kandidaten struken (löst); nya öppna frågor: SmartPool-prissättning, falsifieringskriterium för A-006.

---

## Ändringslogg v0.2 → v0.3

- **Nya principer:** P-010 (Ägarneutralitet), P-011 (Mandatprincip — trenivåmodell).
- **Nya beslut:** D-015 (BEGA utan särställning), D-016 (Automatiserad förhandling i v1), D-017 (Full insyn i pågående förhandling), D-018 (Fakturakontrollen — ersätter D-008), D-019 (Konsultdelad data återanvänds aggregerat, opt-in), D-020 (Snävt samtyckesändamål).
- **Superseded:** D-008 ersatt av D-018.
- **§9 Domänmodell:** nytt objekt *Förhandlingsutbyte*; *Faktura* preciserad (konsultens egen utställda faktura); *Konsultdelat marknadsdatalager* tillagt; Lönespecifikation utanför v1 men designas inte bort.
- **§10:** Automatiserad förhandling flyttad från framtida till kärnfunktion (med D-016:s gränser). Löneanalys och Fakturakontroll separerade och segmentsmarkerade.
- **§11:** Brandväggens granskbarhet gäller från lanseringsdagen (tidigare: från första avgiften). Öppen anslutning på samma villkor för alla bemanningsföretag (D-015).
- **§13:** "Röst som förstaklassgränssnitt" omklassificerad från oklassificerad riktning till öppen fråga.
- **§14:** Nya antaganden A-006–A-009. Domänfakta om standardmarginaler tillagd.
- **Redaktionellt:** D-003:s felaktiga hänvisning "Se D-012" rättad till §11.
- **Nytt:** §17 Handoff-brief, §18 Kvalitetskontroller vid D-020.

---

## 1. Produktvision

### Ambition

Att bygga världens bästa personliga AI-agent för läkare, sjuksköterskor och andra vårdkonsulter — en agent som sitter **på konsultens sida av bordet** och arbetar uteslutande för konsultens bästa.

### Visionens kärna

Idag är vårdkonsulten beroende av sin konsultchef på bemanningsföretaget. Konsultchefen är konsultens ingång till marknaden, men har tre begränsningar konsulten inte kan påverka:

- **Tillgänglighet.** Konsultchefen arbetar kontorstid.
- **Kompetens.** Kvaliteten varierar kraftigt mellan individer.
- **Delad lojalitet.** Konsultchefen ska samtidigt tillgodose beställarens intresse, bemanningsföretagets marginal och konsultens villkor.

**Om fem år ska konsulten inte längre vara beroende av sin konsultchef.**

Agenten ska fylla konsultchefens funktion — men vara tillgänglig dygnet runt, ha konsekvent hög kompetens, och ha odelad lojalitet mot konsulten.

Den långsiktiga visionen är att konsulten ska kunna säga:

> "Det här är min agent. Den känner mig, känner marknaden och hjälper mig fatta bättre beslut än jag hade kunnat göra själv."

### Vad agenten inte är

Agenten är inte primärt en jobbsökmotor.

Den svenska vårdbemanningsmarknaden är mättad med aktörer som vill erbjuda uppdrag och jobb. Agenten kan inte lanseras som ytterligare en take på uppdragskarusellen.

Agenten ska först och främst vara **beslutslagret** — det som hjälper konsulten sålla bland inkommande erbjudanden och fatta beslut grundade på marknadskunskap konsulten idag saknar.

Agentens uppgift är att maximera konsultens långsiktiga nytta, inte bemanningsföretagets marginal eller plattformens kortsiktiga intäkt.

---

## 2. Vilket problem vi löser

Vårdkonsulter möter en fragmenterad bemanningsmarknad där ett stort antal bemanningsföretag konkurrerar om samma läkare och sjuksköterskor.

Konsulten behöver ofta:

- hantera erbjudanden från flera bemanningsföretag parallellt
- själv bedöma om en ersättning är bra eller dålig
- förhandla utan fullständig marknadsinformation
- hålla reda på olika kontrakt och ansvarsfördelningar
- uppdatera CV och referenser
- hantera verifieringar och registerutdrag
- återkommande hitta nya uppdrag, eftersom många uppdrag bara varar 8–12 veckor
- förstå skillnaden mellan olika anställningsformer och deras riskbild
- bedöma om det är bättre att acceptera nu eller vänta på ett bättre uppdrag

### Informationsasymmetrin

Det centrala problemet är att bemanningsföretaget vet mer än konsulten.

Bemanningsföretaget kan känna till vilket pris vårdgivaren betalar, marknadens efterfrågan, konkurrerande kandidater, normal marginal, vilka uppdrag som sannolikt kommer och vilka villkor som är förhandlingsbara.

Konsulten har sällan motsvarande information.

Agenten ska minska denna asymmetri.

### Uppdragslängden som produktens klocka

Att uppdrag typiskt varar 8–12 veckor är inte enbart en smärta — det ger produkten en rytm.

Varje konsult har fyra till sex beslutstillfällen per år, och slutdatumet är känt i förväg. Det ger agenten en återkommande, förutsägbar anledning att vara proaktiv utan att användaren behöver komma ihåg att återvända.

---

## 3. Vem kunden är

**Primär kund: konsulten.**

Läkare, sjuksköterskor och på sikt andra vårdprofessioner som arbetar eller kan arbeta som konsulter.

Plattformen kan samtidigt ha betalande B2B-parter — bemanningsföretag, vårdgivare, rekryteringsföretag — men dessa får aldrig ändra agentens grundläggande lojalitet.

Det ska finnas en strikt och granskbar skillnad mellan:

**vem som betalar för en viss tjänst** och **vem agenten representerar.**

Agentens primära representantrelation är alltid med konsulten.

---

## 4. Agentens lojalitet och grundprinciper

**P-001 — Konsultens intresse först.**
Agenten arbetar för konsultens bästa, inte för bemanningsföretagets marginal.

**P-002 — Agenten ska kunna säga nej.**
Agenten är inte optimerad för att få konsulten att acceptera ett uppdrag. Den ska kunna rekommendera acceptera, förhandla, tacka nej eller avvakta.

**P-003 — Agenten ska kunna rekommendera att vänta.**
Om marknadsdata indikerar att ett bättre uppdrag sannolikt kommer i konsultens önskade område kan avvaktan vara rätt råd. Exempel: en konsult i Karlstad kan få rådet att avstå ett uppdrag i Karlskoga om ett relevant Karlstadsuppdrag sannolikt dyker upp inom kort.

**P-004 — Agenten optimerar för långsiktigt utfall.**
Högst ersättning idag är inte alltid bästa beslutet. Agenten väger in ersättning, uppdragslängd, geografi, jour, risk, framtida möjligheter, sannolikheten för bättre alternativ och konsultens personliga prioriteringar.

**P-005 — Agenten ska vara transparent.**
Varje rekommendation ska kunna förklaras. Konsulten ska kunna se vilken data och vilka antaganden som ligger bakom.

**P-006 — Ingen datainsamling för profilens egen skull.**
Varje uppgift som efterfrågas ska ha ett tydligt användningsområde och helst skapa direkt värde för konsulten i samma stund.

**P-007 — Agenten är beslutslager före förmedlingslager.**
Agenten får inte positioneras eller lanseras som ännu en uppdragsförmedlare. Förmedlingsfunktioner tillkommer först när agenten etablerat förtroende som beslutsstöd.

**P-008 — Betalning ger synlighet, aldrig prioritet.**
Ingen part kan betala för att rangordnas högre i matchning eller rekommendation. Separationen mellan betalande part och rangordningslogik ska vara tekniskt granskbar, inte enbart en policy.

**P-009 — Avsändartransparens.**
Konsulten ska alltid kunna se vilket bemanningsföretag ett uppdrag kommer från, inklusive när avsändaren är ett bolag med koppling till plattformens ägare.

**P-010 — Ägarneutralitet.** *(ny 2026-08-09; härleds ur P-001, P-008)*
Agentens analys, matchning och rekommendationer behandlar alla bemanningsföretag lika. Ägarkoppling till plattformen ger ingen fördel i något led — agenten rekommenderar aktivt bort från en ägarkopplad erbjudandeväg när en annan väg är bättre för konsulten. Likabehandlingen ska vara tekniskt granskbar från lanseringsdagen, inte först när första avgiften tas ut.
*Varför:* Trovärdighet i lojalitetslöftet kan inte byggas in i efterhand. Konflikten är som störst under pilotfasen, innan någon avgift finns — det är precis då granskbarheten måste finnas.

**P-011 — Mandatprincip (trenivåmodell).** *(ny 2026-08-15)*

- **Nivå 1 — Fritt (autonomt, loggat):** handlingar som är reversibla och osynliga för extern part. Analys, beräkningar, bevakning av marknadsdata, utkast, läsning av data konsulten delat.
- **Nivå 2 — Autonomt inom förhandsgodkänt, återkallbart mandat (loggat + realtidsinsyn):** handlingar synliga för extern part men icke-bindande och återkallbara. Förhandlingsutbyte inom ramar (D-016), standardiserade förfrågningar till motpart. Konsulten sätter ramarna en gång och kan återkalla dem.
- **Nivå 3 — Explicit godkännande per instans:** handlingar som är bindande, svåra att återkalla, eller exponerar konsultens identitet/dokument för en ny extern part. Acceptera villkor, skicka intresseanmälan i konsultens namn, dela CV/profil/registerutdrag med ny part, skicka efterfaktura.
- **Regel:** vid tveksamhet klassificeras handlingen en nivå högre.

Exemplen är vägledning; klassificeringsregeln är lag. Agent Architect klassificerar samtliga handlingstyper mot denna princip.

**P-012 — Fast kärna, fri tillväxtyta.** *(ny 2026-08-15)*
Master Spec skyddar produktens kärna, inte metoderna att nå tillväxt.

- **Fast kärna** (ändras endast via supersede i denna process): lojalitetsarkitekturen (P-001–P-011), beslutslager-positioneringen (D-001, P-007), säkerhets- och mandatprinciper, samtyckesarkitekturen (D-019/D-020).
- **Fri tillväxtyta** (trial and error, ingen principändring krävs): anskaffningskrokar, datakällornas mix, integrationsformer, partnerstrategi, volymmål, kanaler och intäktsexperiment inom §11:s bindande princip.
- Antaganden är testbara satsningar: ett fallet antagande utlöser strategirevidering, inte spec-kris. Beslut som vilar på antaganden ska ange det, och experiment med externt beroende ska ha en fallback som projektet självt kontrollerar (mönstret i D-010, D-011, D-016).

**P-013 — Öppet ombudskap.** *(ny 2026-08-15, svar på AQ-002)*
Agenten agerar alltid öppet som konsultens ombud gentemot externa parter — den uppträder aldrig som konsulten själv. Gäller alla kanaler: agent-till-agent-utbyte, strukturerad e-post och mänsklig fallback.
*Varför:* Samma irreversibilitetslogik som P-010 — avslöjad förställning raserar motpartsförtroendet permanent, och lojalitetsvarumärket tål inte att vila på förställning åt något håll. Juridiskt är öppet ombud (fullmakt) en ren figur; imitation skapar oklarhet om vems vilja som uttryckts. Kommersiellt normaliserar det produkten: motparter ska lära sig att konsultagenten är en professionell, strukturerad motpart.

---

## 5. Användarens behov och triggers

**5.1 Ett konkret erbjudande ligger på bordet.**
Konsulten vill veta hur uppdraget ser ut, vad ersättningen bör vara, om erbjudandet är bra, vad som bör förhandlas och om hen bör acceptera eller vänta. Detta är produktens viktigaste första användningsfall.

**5.2 Konsulten vill veta vad hen bör begära.**
Utan marknadsdata utgår konsulten från sin senaste lön eller magkänsla, vilket kan kosta betydande belopp över tid.

**5.3 Konsulten upptäcker att någon annan tjänar mer.**
Triggar behov av marknadsanalys, avtalsanalys och förhandlingsstöd.

**5.4 Konsulten upptäcker risk i sitt avtal.**
Särskilt viktigt för egenföretagare — exempelvis vitesrisk vid sjukdom eller frånvaro. Agenten ska kunna identifiera ansvarsfördelning, obalanserade villkor och orimlig riskövervältring.

**5.5 Konsulten vill maximera inkomsten under en begränsad period.**
Exempelvis en specialistläkare med god ordinarie lön som vill arbeta en eller två veckor på annan ort.

**5.6 Konsulten behöver förbättra sin professionella profil.**
CV-optimering, bättre kompetenspresentation, uppdaterade referenser, registerutdrag och verifieringar.

**5.7 Konsulten misstänker att hen inte fått betalt för all arbetad tid.**
Diskrepans mellan tidrapport och faktura. Gäller företagande konsulter (D-018): konsulten räknar själv ihop timmar från tidrapporten till fakturan — ett felbenäget manuellt moment.

---

## 6. Användarresor

### Resa A — Befintligt erbjudande *(primär)*
Konsulten får ett erbjudande → beskriver eller laddar upp det → agenten analyserar uppdrag, villkor och ersättning → jämför mot marknadsdata → föreslår förhandlingsposition → rekommenderar acceptera, förhandla, tacka nej eller vänta → konsulten godkänner nästa steg.

### Resa B — Konsulten söker uppdrag
Konsulten anger roll, geografi, uppdragslängd och anställningsform → agenten analyserar tillgängliga och historiska uppdrag → matchar mot profilen → prognostiserar kommande behov → rekommenderar om konsulten bör agera nu eller avvakta.

### Resa C — Avtalsanalys
Konsulten laddar upp ett avtal → agenten identifierar ansvar, risk och ekonomiska villkor → särskiljer riskbilden för egenföretagare respektive anställd → flaggar avvikelser och obalanser → ger rekommendationer inför förhandling.

### Resa D — Profiloptimering
Agenten identifierar vad som saknas för att konsulten ska bli mer attraktiv för önskade uppdrag → efterfrågar det som skapar konkret värde → CV, referenser och verifieringar förbättras löpande → profilen används i rådgivning och matchning.

### Resa E — Fakturakontroll *(företagande konsulter, D-018)*
Konsulten delar tidrapport och utställd faktura → agenten jämför → identifierar timmar och tillägg konsulten missat att fakturera → underlag för efterfakturering med kronbelopp per fynd.

### Resa F — Automatiserad förhandling *(ny, D-016/D-017)*
Konsulten godkänner mandat och ramar → agenten utbyter position, bud och motbud med motpartens system → konsulten har full realtidsinsyn i utbytet → agenterna når ett kandidatresultat → konsulten bekräftar uttryckligen innan något blir bindande. Fallback: agenten förbereder position och underlag, människa för dialogen, för motparter utan kompatibelt gränssnitt.

---

## 7. Produktprinciper

- Konsulten först.
- Beslutsstöd före jobbförmedling.
- Data före magkänsla.
- Personalisering före generiska råd.
- Varje insamlad datapunkt ska skapa värde.
- Profilen är en biprodukt av att agenten lär känna konsulten — aldrig ett mål i sig.
- Agenten ska våga säga nej.
- Agenten ska våga säga vänta.
- Förklara rekommendationer.
- Skilj på fakta, prognos och osäkerhet.
- Använd historik för att skapa framtida fördel.
- Olika anställningsformer kräver olika riskmodeller.
- Användarens långsiktiga nytta är viktigare än kortsiktig transaktion.
- Datainsamling ska vara en biprodukt av levererat värde, aldrig ett separat arbetsmoment för konsulten.

---

## 8. Centrala designbeslut

### D-001 — Agenten är en beslutsagent, inte en jobbagent
**Härleds ur:** P-007
**Varför:** Konsulten har nytta av agenten även när det inte finns något uppdrag i plattformen. Marknaden är dessutom mättad på förmedlingsaktörer; en ny förmedlare skulle inte differentiera.
**Konsekvens:** Positionering, onboarding och första användarupplevelse ska handla om beslut och kunskap, inte om uppdragssökning.

### D-002 — Första värdet är analys och förhandling av befintliga erbjudanden
**Härleds ur:** P-001, P-007
**Varför:** Det skapar omedelbart, mätbart värde utan att konsulten först måste ändra sitt beteende.
**Konsekvens:** Marknadskunskap — typisk ersättningsnivå per roll och ort — är anskaffningskroken som får konsulten att skapa konto *(hypotesen att kroken driver kontoskapande är utbruten som A-006)*. Erbjudandeanalysen är produktens första verkliga leverans. Båda ska finnas vid lansering, med tydliga roller.
**Ersätter:** tidigare formulering i v0.1 som inte skilde krok från leverans.

### D-003 — Agenten ska kunna rekommendera fyra utfall
acceptera · förhandla · tacka nej · vänta
**Härleds ur:** P-002, P-003
**Varför:** En agent som alltid driver mot transaktion blir i praktiken en säljkanal.
**Konsekvens:** Intäktsmodellen får inte belöna avslut. Se §11 (bindande princip). *(Rättat i v0.3 — pekade tidigare felaktigt på D-012.)*

### D-004 — Datagrunden för ersättningsbedömning
**Härleds ur:** P-001
**Beslut:** Agentens ersättningsbedömning bygger på
- priser i nationella avtalet (SKR),
- bemanningsföretagens standardmarginaler *(ca 18 % mot löneanställd, ca 10 % mot företagande konsult — se §14 Domänfakta)*,
- kodifierad domänexpertis,
- 36 månaders rullande avropsdata från offentliga handlingar hos kommuner och regioner *(inhämtningsbarheten är utbruten som A-007)*,
- samt BEGA:s egen historiska transaktionsdata där den är relevant.

**Varför:** Detta är data projektet kontrollerar och kan referera till. Ett rullande 36-månadersfönster undviker dessutom att data från före det nationella avtalets prisregim 2024 förorenar bedömningarna.
**Konsekvens:** Avropsdata och ramavtalsdata hålls strikt åtskilda i modell och resonemang — villkor som springer ur offentliga upphandlingar med fasta priser har lågt värde i förhållande till marknadsdata.
**Ersätter:** D-004 v0.1.

### D-005 — Profilen byggs värde-utlöst
**Härleds ur:** P-006
**Beslut:** Agenten efterfrågar en ny datapunkt först när den låser upp något konsulten vill ha just då. Ingen fast obligatorisk profillista vid onboarding.
**Varför:** Profilen är en biprodukt av att agenten lär känna konsulten — samma information konsulten idag delar med sin konsultchef.
**Konsekvens:** Konsulter som aktiverar uppdragsmatchning (D-006) får en tydlig, motiverad väg till komplett profil. Övriga får aldrig se en ofylld profil som ett krav.
**Ersätter:** D-005 v0.1.

### D-006 — Kryssrutor för uppdragserbjudanden finns från start
**Härleds ur:** P-007
**Beslut:** I profilen kan konsulten aktivt välja att ta emot uppdragserbjudanden, och separat välja om hen även är öppen för timvikariat direkt från vårdgivare (region, kommun eller privat). Vid ja anges matchningskriterier.
**Varför:** Kapaciteten ska finnas i datamodellen från dag ett, men den ska inte driva trafik och den är inte produktens pitch.
**Konsekvens:** Domänmodellen skiljer på uppdragsgivartyp — bemanningsföretag respektive vårdgivare. Kanal 2 är latent kapacitet, inte framtida scope.

### D-007 — Freemium och premium skiljs av vem som utför arbetet
**Härleds ur:** P-001
**Beslut:**
- **Freemium:** konsulten gör arbetet själv med agentens vägledning — hämtar sina egna registerutdrag, strukturerar sin profil, får marknadskunskap och grundläggande erbjudandeanalys.
- **Premium:** agenten utför arbetet — hämtar HOSP- och IVO-utdrag, bygger om CV, förhandlar med bemanningsföretag (inom D-016:s ramar), granskar avtal och påtalar riskfylld ansvarsfördelning, granskar utställda fakturor mot tidrapport (D-018).

**Varför:** Det speglar exakt skillnaden mellan att ha och att inte ha en konsultchef — och gör värdet av premium självförklarande.
**Konsekvens:** Premiumintäkt från konsulten är den primära intäktsmodellen *(vilar på A-003)*. Exakt gräns funktion för funktion är öppen fråga.

### D-008 — *(superseded, ersatt av D-018)*
Ursprunglig lydelse: "Fakturagranskning mot tidrapport är en kärnfunktion", motiverad bl.a. med sjuksköterskors felbenägna OB-strukturer. Ersatt eftersom funktionen riktas om till enbart företagande konsulter — sjuksköterskeargumentet bar inte, då sjuksköterskekonsulter oftast är löneanställda.

### D-009 — Deduplicering av uppdrag är en kärnfunktion
**Härleds ur:** P-001
**Beslut:** Samma underliggande behov som kommer in via flera bemanningsföretag med samma ramavtal ska presenteras som **ett** uppdrag med flera möjliga vägar in.
**Varför:** Utan deduplicering återskapar produkten exakt det grundproblem den ska lösa. Dedupliceringen är dessutom förutsättningen för utbudssidans prissättning (§11).
**Konsekvens:** Domänmodellen skiljer på *Uppdrag* (det underliggande behovet) och *Erbjudandeväg* (vägen in via en viss aktör).

### D-010 — Uppdragsflödet seedas av BEGA och späds sedan
**Härleds ur:** P-009, P-012 (fallback-klausulen)
**Beslut:** Innan pilotintegrationer finns levereras uppdrag från BEGA Bemanning via befintliga ramavtal och DIS-anslutningar. I takt med att integrationer tillkommer ska BEGA:s andel av uppdragsbasen minska.
**Varför:** Ger uppdragsflöde från dag ett utan att lanseringen är beroende av ett partneravtal vars tempo projektet inte kontrollerar. BEGA:s roll är tillgångsutnyttjande och fallback, inte privilegium.
**Konsekvens:** Intressekonflikten är som störst vid lansering, då BEGA:s andel är högst. P-009 (avsändartransparens) och **P-010 (ägarneutralitet med granskbarhet)** gäller därför från första dagen. Minskande BEGA-andel är ett uttalat mål. Pilotmålet 3–5 bolag bärs av A-008; faller det aktiveras fallbacken fullt ut och P-010:s granskbarhet blir än viktigare.

### D-011 — Agenten designas för externa datakällor
**Härleds ur:** P-012 (fallback-klausulen — optionen hålls öppen till känd kostnad)
**Beslut:** Agenten ska arkitekteras med ett definierat integrationslager för extern data, oavsett var avropsdatan slutligen bor.
**Varför:** Var aggregerad avropsdata ska ligga är ännu inte beslutat. Designkravet håller optionen öppen till känd kostnad.

### D-012 — Anställningsform är en central dimension
**Härleds ur:** P-004
**Varför:** Riskbilden skiljer sig väsentligt mellan egenföretagare och konsult anställd av bemanningsföretag.

### D-013 — Uppdragslängd har hög prioritet
**Härleds ur:** P-004
**Varför:** Skillnaden mellan ett veckouppdrag och ett 26-veckorsuppdrag påverkar ekonomisk optimering, risk, timing och framtida möjligheter. Uppdragets slutdatum är dessutom agentens viktigaste proaktivitetstrigger.

### D-014 — Agenten ska kunna använda framtida marknadssignaler
**Härleds ur:** P-003
**Varför:** Återkommande behov och historiska mönster gör det möjligt att ibland rekommendera att vänta på ett mer attraktivt uppdrag.

### D-015 — BEGA har ingen kommersiell särställning *(2026-08-09)*
**Härleds ur:** P-008, P-010
**Beslut:** Anslutning är öppen för alla bemanningsföretag på samma villkor från start. BEGA omfattas av samma prislogik (§11, värdebaserad progression) som alla andra aktörer.
**Varför:** BEGA:s roll är fallback och lanseringsaccelerator — befintliga tillgångar (ramavtal, DIS) används för att lansera med skarpa uppdrag snabbare än konkurrenter. Rollen är tillgångsutnyttjande, inte privilegium.
**Konsekvens:** "Samma villkor" betyder samma prislogik och regelverk — inte identiska belopp, eftersom §11 prissätter efter marginellt bidrag. Det gäller även BEGA.

### D-016 — Automatiserad förhandling ingår i premium v1 *(2026-08-12)*
**Härleds ur:** D-007, P-002, P-004
**Beslut:** Automatiserad förhandling ingår i premium redan i v1, inte som framtida funktion. Vanligaste formen: konsultens agent och bemanningsföretagets system/agent utbyter strukturerad data (position, motbud, villkor). **Inget resultat blir bindande för konsulten förrän konsulten uttryckligen bekräftat det — oavsett förhandsgodkänt mandat.** Fallback (agent förbereder position, människa för dialogen) kvarstår för motparter utan kompatibelt gränssnitt.
**Varför:** Ger snabbhet och skalbarhet i själva utbytet, samtidigt som P-002 hålls intakt genom att bindning aldrig sker autonomt.
**Konsekvens:** §10 korrigerad — flyttad från framtida funktioner till kärnfunktioner. Domänmodellen har nytt objekt *Förhandlingsutbyte*. Mandatmodellen (P-011) är en förutsättning för kärnfunktionen. Vilar på A-009 (motpartens maskinläsbara gränssnitt).

### D-017 — Full insyn i pågående förhandling *(2026-08-15)*
**Härleds ur:** P-005, D-016
**Beslut:** Konsulten har full insyn i pågående förhandling — bud, motbud och villkor synliga i realtid, inte bara slutresultatet vid bekräftelsesteget.
**Varför:** P-005:s transparenskrav gäller processen, inte bara slutpunkten. Fel i en autonom runda upptäcks medan de sker.
**Konsekvens:** Förhandlingsutbyte-objektet exponerar löpande händelsehistorik mot konsultgränssnittet. Avbrytbarhet (konsulten stoppar pågående förhandling) delegeras till nivå 2.

### D-018 — Fakturakontrollen riktas till företagande konsulter *(2026-08-15)*
**Härleds ur:** P-001, D-012
**Beslut:** Fakturakontrollen — AI-jämförelse av konsultens utställda fakturor mot tidrapport — endast företagande konsulter. Syfte: hitta missade timmar och tillägg som underlag för efterfakturering. Funktionen finns eftersom konsulten manuellt räknar ihop timmar från tidrapporten till fakturan, ett felbenäget moment. Löneanställda omfattas inte i v1; lönespec-granskning designas dock inte bort ur domänmodellen (samma logik som §11:s rekryteringskanal).
**Varför:** Varje fynd har direkt mätbart kronbelopp (efterfakturerbara timmar) — starkaste bevisfunktionen för premium. Löneanställdas premiumbevis bärs istället av Löneanalysen.
**Konsekvens:** §10 skiljer Löneanalys (båda segment) från Fakturakontroll (endast företagare). Lönespecifikation utgår ur v1-domänmodellen.
**Ersätter:** D-008

### D-019 — Konsultdelad data återanvänds aggregerat, med opt-in *(2026-08-15)*
**Härleds ur:** P-001, P-005, P-006, A-001
**Beslut:** Data konsulten delar för sin egen rådgivning får återanvändas anonymiserat och aggregerat för att förbättra rådgivningen för andra konsulter. Samtyckesmodell: explicit opt-in vid onboarding, inramad som ömsesidighet, återkallbar framåt i tiden. Aggregering med trösklar — statistik visas endast när underlaget per roll/ort/period är stort nog att ingen individ kan härledas; rådata är aldrig synlig för andra konsulter.
**Varför:** Operationaliserar A-001 (nätverkseffekten) och bygger det lager A-002 pekar ut som det försvarbara. Opt-in bevarar P-006 och lojalitetspositioneringen.
**Konsekvens:** Samtyckesarkitekturen måste finnas från första användaren. Prioriterad öppen fråga 2 är delvis besvarad: mekanismen som gör produkten bättre med fler användare är detta datalager. Huruvida aggregerad konsultdata får kommersialiseras mot B2B-sidan är **medvetet olåst** (öppen fråga, §15).

### D-020 — Snävt samtyckesändamål *(2026-08-15)*
**Härleds ur:** P-006, D-019
**Beslut:** Opt-in-samtycket omfattar enbart ändamålet "förbättra rådgivningen för andra konsulter". Eventuell framtida B2B-användning kräver nytt, separat samtycke (re-consent).
**Varför:** GDPR kräver specifika ändamål; brett samtycke vore juridiskt svagt för båda ändamålen och skulle sänka opt-in-frekvensen — nätverkseffektens bränsle. Snävt samtycke stänger inte B2B-optionen, det prissätter den.
**Konsekvens:** Samtyckestext v1 skrivs snävt. B2B-optionen bär en känd re-consent-kostnad om den någonsin exerceras.

### D-021 — SmartPool *(2026-08-15)*
**Härleds ur:** P-001, P-012, D-006; motiveras av A-003-risken (intäktsdiversifiering)
**Beslut:** SmartPool ingår i produktplanen med mål att lansera inom 12 månader. Konsulter som aktivt valt timanställningserbjudanden (D-006) bildar en pool dit regioner och kommuner kan publicera behov direkt — pool, inhyrning och rekrytering (jfr Bemlo). Arkitektur och domänmodell ska stödja detta från start.
**Villkor:** Sekvens enligt P-007 — beslutslagret lanserar och etablerar förtroende först; SmartPool blir aldrig produktens publika pitch i fas 1. Brandväggen (P-008/P-010) omfattar även vårdgivares betalning: pool-åtkomst ger synlighet, aldrig prioritet i agentens rekommendationer — agenten avråder fortfarande konsulten från ett dåligt pool-pass.
**Varför:** Hedgar A-003 — bolagets ekonomi vilar inte enbart på konsultens premiumbetalning. Missionskonsistent: direktanställning kapar mellanledsmarginalen, konsulten får mer och vårdgivaren betalar mindre.
**Konsekvens:** "Direktanställningskanal mot vårdgivare" flyttas från framtida funktion till planerad produkt med måldatum. §11 får en vårdgivarsida. Prissättning är öppen fråga. Bemlo (bemlo.com — pool, inhyrning, rekrytering, 20 000+ vårdproffs) loggas som direkt konkurrent och förebild. Medveten risk: SmartPool disintermedierar bemanningsföretag och kan påverka pilotrekryteringen (A-008).

### D-022 — Anskaffningsmekanismen är strategi, inte princip *(2026-08-15)*
**Härleds ur:** P-007, P-012
**Beslut:** D-002:s val av marknadskunskap/löneanalys som anskaffningskrok är ett testbart antagande (A-006). Om kroken inte driver trafik ska anskaffningsstrategin revideras, och Master Spec får inte begränsa den revideringen. Alternativa krokar (t.ex. fakturakontroll-demon) får prövas utan principändring.
**Gräns:** Lojalitetsprinciperna och beslutslager-positioneringen omfattas inte av revisionsfriheten — en krok som gör förmedling till produktens pitch kräver supersede av P-007 via denna process.
**Konsekvens:** D-002 har revideringsklausul. A-006 ska ges ett mätbart falsifieringskriterium vid lansering.

### D-023 — Ingen motpartsyta i v1 *(2026-08-15, svar på AQ-001)*
**Härleds ur:** P-012, D-016, D-021
**Beslut:** v1 innehåller ingen egen produktyta för bemanningsföretag (konto, portal, API-nycklar). Allt förhandlings- och avroputbyte sker via motpartens befintliga kanaler — strukturerad e-post, API där det finns, DIS. "Ansluten pilot" (A-008) betyder integrationsöverenskommelse på dataplanet, inte portalkonto.
**Krav:** Tenant-modellen ska från start rymma framtida motpartsytor utan ombyggnad. Vårdgivare blir den första externa produktytan (SmartPool, D-021, inom 12 månader) — före bemanningsföretag.
**Varför:** En bf-portal i v1 är en andra produkt som försenar konsultkärnan; §10 listar redan avropsintegration som framtida; D-016:s fallback är designad för motparter utan teknik. Optionen bärs, inte byggs (P-012).

### D-024 — Granskbarhetens publik *(2026-08-15, svar på AQ-003)*
**Härleds ur:** P-005, P-008, P-010
**Beslut:** Granskbarheten har två nivåer. (1) **Konsulten i produkten, per beslut:** "visa underlaget" — inklusive vilka erbjudandevägar som var kända vid beslutet och varför en rekommenderades. (2) **Tredjepartsgranskningsbar per konstruktion:** loggschema och dataseparation utformas så att en extern granskare kan verifiera neutraliteten. Att faktiskt beställa en revision är ett affärsbeslut på tillväxtytan (P-012), inte ett lanseringskrav. Offentlig reproducerbarhet för envar avvisas.
**Varför:** Nivå 1 är neutralitetsbeviset i vardagen och nära gratis (samma Agentbeslut-objekt som P-005 kräver). Nivå 2 kostar lite vid design och köper det trovärdiga påståendet "kan granskas av tredje part". Offentlig reproducerbarhet exponerar data och kostar en storleksordning mer utan motsvarande förtroendevinst. Lanseringskravet "granskbar från dag ett" uppfylls av nivå 1 + strukturen i nivå 2.

### D-025 — Samtyckets omfång inkluderar härledd data *(2026-08-15, svar på AQ-004)*
**Härleds ur:** P-005, P-006, D-019, D-020
**Beslut:** D-019:s opt-in omfattar även data som uppstår genom agentens arbete — förhandlingsutfall, accepterade ersättningsnivåer — under samma snäva ändamål (D-020). Villkor: samtyckestexten namnger uttryckligen härledd data som del av "dina datapunkter" (aldrig tyst inkludering), och konsulten kan när som helst se exakt vilka datapunkter som delats. Ett samtycke — inte separata per kategori.
**Varför:** Förhandlingsutfall är den mest värdefulla marknadsdatan för A-001; att utesluta den urholkar moaten. Tyst inkludering bryter informerat samtycke (GDPR) och D-019:s anda. Separata samtycken ger friktion utan juridisk vinst. P-005 tillämpas på datadelningen själv.

### D-026 — Reproducerbarhetens innebörd *(2026-08-15, svar på AQ-005)*
**Härleds ur:** P-005, P-010
**Beslut:** "Reproducerbarhet" betyder att varje Agentbeslut loggas med fullständigt underlag — datapunkter, modellversion, antaganden, motivering, kända alternativ — så att beslutet kan prövas, förklaras och ifrågasättas i efterhand. Bitvis återkörning av LLM-resonemang krävs inte. Option till nivå 2 (ej krav): gör själva rangordningssteget deterministiskt (regelstyrd poängsättning på loggade indata) så att exakt det steg neutraliteten hänger på blir återkörbart.
**Varför:** Bitvis återkörning är tekniskt orealistisk och adderar inget förtroende; det P-005/P-010 behöver är prövbarhet.

---

## 9. Domänmodell

**Konsult** — profession/roll, kompetenser, erfarenhet, anställningsform, geografiska preferenser, önskad uppdragslängd, jourpreferenser, tillgänglighet, ersättningshistorik, CV, referenser, verifieringar, dokument, samt aktiva val för uppdragsmatchning och datadelning (opt-in enligt D-019/D-020).

**Uppdrag** — det underliggande behovet: roll, kompetenskrav, geografi, period, uppdragslängd, jour, ersättning/pris, krav, status.

**Erbjudandeväg** — en specifik aktörs väg in till ett Uppdrag. Flera Erbjudandevägar kan peka på samma Uppdrag. Bär avsändare, villkor och marginal. Behandlas ägarneutralt (P-010).

**Erbjudande** — ett konkret erbjudande riktat till en enskild konsult.

**Förhandlingsutbyte** *(nytt, D-016/D-017)* — strukturerat utbyte mellan konsultens agent och motpartens system: position, bud, motbud, villkor, status. Bär full händelsehistorik som exponeras mot konsulten i realtid. Inget utfall är bindande utan konsultens explicita bekräftelse (mandatnivå 3, P-011).

**Avtal** — villkor mellan parter, inklusive ekonomiska villkor och ansvarsfördelning.

**Tidrapport** — rapporterad arbetad tid, inklusive OB och tillägg. Sanningskälla för Fakturakontrollen.

**Faktura** — konsultens egen utställda faktura (företagande konsult), jämförbar mot Tidrapport (D-018). *Lönespecifikation ingår inte i v1 men designas inte bort ur modellen.*

**Vårdgivare** — region, kommun, sjukhus eller privat aktör med personalbehov. Kan vara både uppdragsgivare via bemanningsföretag och direkt arbetsgivare vid timvikariat.

**Bemanningsföretag** — aktör som förmedlar eller anställer konsulter och kan publicera eller vidarebefordra behov.

**Rekryteringsföretag** — aktör som matchar kandidater mot permanenta rekryteringsbehov.

**Konsultprofil** — den levande representationen av konsultens kompetens, preferenser och dokumentation.

**Marknadshändelse** — historiskt eller aktuellt behov, erbjudande, pris eller annan datapunkt som kan användas för analys och prognos.

**Konsultdelat marknadsdatalager** *(nytt, D-019)* — anonymiserat, aggregerat lager byggt av opt-in-delad konsultdata. Trösklar per roll/ort/period; rådata aldrig exponerad. Ändamål begränsat enligt D-020.

**Agentbeslut** — en rekommendation med rekommenderat utfall, underliggande data, antaganden, osäkerhet och motivering.

---

## 10. Funktionella krav

### Kärnfunktioner

- Naturligt samtal med agenten, med sammanfattning av vad agenten uppfattat och bekräftelse innan viktiga uppgifter används
- Marknadskunskap: typisk ersättningsnivå per roll och ort
- Analys av befintliga erbjudanden
- **Löneanalys** *(båda segment)* — rimlig ersättning beräknad från bemanningsbolagens pris mot region (offentlig handling) minus standardmarginal (ca 18 % löneanställd / ca 10 % företagare), enligt D-004
- Förhandlingsstöd
- **Automatiserad förhandling** *(premium, D-016)* — agent-till-agent-datautbyte inom förhandsgodkänt mandat (P-011 nivå 2); bindning kräver alltid konsultens bekräftelse (nivå 3); full realtidsinsyn (D-017); mänsklig fallback
- Rekommendation: acceptera / förhandla / tacka nej / vänta
- Avtalsanalys med riskidentifiering
- **Fakturakontroll** *(premium, endast företagande konsulter, D-018)* — faktura mot tidrapport, hittar missade timmar för efterfakturering
- CV-optimering
- Referenshantering
- Verifierings- och registerutdragshantering (HOSP, IVO, vid behov belastningsregister, legitimation)
- Personlig konsultprofil som växer värde-utlöst
- Val för uppdragsmatchning och timvikariat
- Matchning mot uppdrag med deduplicering
- Prognoser om framtida behov
- Marknadsanalys

### Planerad produkt — SmartPool *(D-021, mål: lansering inom 12 månader)*

Pool av konsulter som aktivt valt timanställningserbjudanden (D-006). Regioner och kommuner publicerar behov direkt till poolen — pool, inhyrning och rekrytering. Sekvens och brandvägg enligt D-021: beslutslagret först, aldrig produktens pitch i fas 1.

### Framtida och utökade funktioner

- Integration av bemanningsföretagens inkommande avrop
- Permanent rekryteringskanal
- Matchning mot rekryteringsföretag
- Lönespec-granskning för löneanställda (ej designad bort, D-018)

---

## 11. Affärsregler

### Konsultsidan

**Premiumintäkt från konsulten är den primära intäktsmodellen.**

Exakt modell är ännu inte beslutad. Kandidater som identifierats: abonnemang, success fee kopplad till uppnådd förbättring över en definierad baseline, eller kombination.

**Bindande princip:** affärsmodellen får inte skapa konflikt med agentens lojalitet till konsulten (P-001, P-002). Take rate på kontraktsvärde är därmed utesluten — den skulle innebära att agenten förlorar intäkt varje gång den korrekt rekommenderar att tacka nej eller vänta.

### Utbudssidan

Anslutning är öppen för alla bemanningsföretag på samma villkor från start (D-015). Betalning följer värdebaserad progression:

- **Tidiga integrationer är avgiftsfria.** De uppdrag de bidrar med adderar värde till plattformen innan plattformen har konsultvolym att erbjuda.
- **Avgift införs när plattformen kan erbjuda tillräckligt många konsulter.**
- **Priset följer marginellt bidrag.** En nationell aktör med bred ramavtalstäckning har högt värde som integrerad part. Ett femte bolag med samma ramavtal adderar mindre, eftersom dess uppdrag redan är synliggjorda.

Denna prislogik förutsätter deduplicering (D-009).

**Firewall (P-008 + P-010):** betalning ger synlighet, aldrig prioritet i matchning eller rekommendation — och ägarkoppling ger ingen fördel i något led. Separationen ska vara tekniskt granskbar **från lanseringsdagen, oavsett om avgift tagits ut** — den kan inte byggas in i efterhand med bibehållen trovärdighet. *(Ändrat i v0.3; tidigare gällde granskbarheten från första avgiften.)*

### Utbudsstrategi

BEGA:s befintliga ramavtal och DIS-anslutningar seedar flödet (D-010). Cirka 30–40 DIS-system är aktiva hos svenska kommuner; anslutning är möjlig löpande under systemets öppna period. Uppskattad volym vid full seedning: 200–500 publicerade uppdrag per vecka. *(A-004 — ej verifierat.)* Pilotmål: 3–5 bemanningsföretag inklusive BEGA. *(A-008 — ej verifierat.)*

### Vårdgivarsidan — SmartPool (D-021)

Regioner och kommuner betalar för åtkomst till SmartPool (pool, inhyrning, rekrytering). Prissättningsmodell är öppen fråga — kandidater: pool-åtkomstavgift, avgift per tillsättning, rekryteringsavgift. Brandväggen gäller: vårdgivares betalning ger synlighet i poolen, aldrig prioritet i agentens rekommendationer. Vilar på A-010.

### Rekryteringskanalen

Permanenta rekryteringsbehov kan ge take rate på rekryteringsaffärer.

**Strategisk observation:** när en vårdgivare inser att den behöver rekrytera fast personal tar processen typiskt 8–12 veckor, och under tiden hyrs en konsult in. Bemanningsuppdraget är därmed en ledande indikator på ett rekryteringsbehov som ännu inte annonserats. Den signalen har eget värde för rekryteringsföretag.

Detta ligger utanför v1 men ska inte designas bort ur domänmodellen.

---

## 12. Säkerhetsprinciper

Säkerhet är en grundläggande del av arkitekturen, inte en efterhandskontroll.

- Least privilege
- Strikt roll- och behörighetsstyrning
- Tydlig separering mellan konsulter, bemanningsföretag och vårdgivare
- Tenant isolation där relevant
- Kryptering av känslig information
- Säker secrets management
- Audit logging och spårbarhet för agentens handlingar
- Explicit användarsamtycke för känsliga operationer — **operationaliserat genom P-011:s trenivåmodell**
- Agenten ska inte kunna utföra högriskåtgärder utan korrekt mandat (P-011 nivå 3)
- Skydd mot prompt injection och manipulerad extern information
- Dataminimering
- Säker hantering av personuppgifter och dokument
- Separering mellan data som används för individuell rådgivning och data som används aggregerat (D-019: opt-in, trösklar, snävt ändamål enligt D-020)
- Granskbar separation mellan betalande/ägarkopplad part och rangordningslogik (P-008, P-010) — från lanseringsdagen

**Särskild princip:** agenten ska inte kunna läcka information mellan olika aktörer eller konsulter, även när informationen finns i samma plattform.

---

## 13. Teknisk arkitektur

Teknisk arkitektur är ännu inte slutligt beslutad. Preliminär riktning:

**AI- och agentlager:** en huvudagent med konsultens perspektiv och lojalitetsregler; specialiserade agenter för separata domäner; gemensam grundspecifikation; verktygsanrop med explicit behörighetsmodell (P-011); persistent användarprofil och minne; spårbara beslut.

**Backend:** relationsdatabas för kärndata; API-lager; autentisering och auktorisering; dokumentlagring; sök- eller vektorlager där det faktiskt behövs; bakgrundsjobb för matchning, verifieringar och prognoser; definierat integrationslager för externa datakällor (D-011); gränssnitt för agent-till-agent-förhandlingsutbyte (D-016).

**Frontend:** webbaserad konsultupplevelse; text som gränssnitt; tydliga bekräftelsesteg före viktiga agenthandlingar (P-011 nivå 3); realtidsvy för pågående förhandling (D-017). *Röst som förstaklassgränssnitt var i v0.2 en oklassificerad riktning — omklassificerad till öppen fråga (§15).*

**Utvecklingsstrategi:** projektet ska inte vara beroende av en enda allt-i-ett-byggplattform. Miljön ska stödja versionshantering, tester, kodgranskning, säkerhetsgranskning, tydlig separation mellan frontend och backend, reproducerbara miljöer och en arkitektur som kan växa utan total omskrivning.

---

## 14. Antaganden

Följande behandlas som antaganden tills de verifierats:

- **A-001** — Att användarnas egen interaktion med agenten kan aggregeras till ett realtidslager av marknadsdata som förbättrar rådgivningen för övriga användare. Potentiell nätverkseffekt; operationaliserad genom D-019 men beroende av opt-in-frekvens, datakvalitet och volym.
- **A-002** — Att v1-metoden (nationella avtalets priser + standardmarginaler + domänexpertis) är tillräckligt träffsäker för att skapa förtroende. Metoden är replikerbar av en konkurrent som förstår marginalstrukturen. Det försvarbara ligger i vad som byggs ovanpå (D-019-lagret).
- **A-003** — Att konsulter har betalningsvilja för premium. Ämnesintresse är belagt; betalningsvilja är inte.
- **A-004** — Att utbudsvolymen 200–500 uppdrag per vecka är uppnåelig via BEGA:s ramavtal och DIS.
- **A-005** — Att produkten inte kommer att frontas av grundaren personligen. Om så är fallet kan trovärdigheten inte vila på grundarens bakgrund, utan måste byggas in i vad agenten visar och förklarar.
- **A-006** *(ny, utbruten ur D-002)* — Att fri marknadskunskap är den krok som faktiskt driver kontoskapande. Overifierad förvärvshypotes; alternativa krokar finns (t.ex. fakturakontroll-demo). Mätbart falsifieringskriterium sätts vid lansering (D-022).
- **A-007** *(ny, utbruten ur D-004)* — Att 36 månaders rullande avropsdata går att inhämta löpande från kommuner och regioner med tillräcklig kadens, kvalitet och kostnad.
- **A-008** *(ny, 2026-08-09)* — Att 3–5 pilotbemanningsföretag (inkl. BEGA) är anslutna vid eller kort efter lansering. Beror på partneravtal vars tempo projektet inte kontrollerar. Om fel: D-010:s fallback aktiveras fullt ut och intressekonfliktfönstret förlängs — P-010:s granskbarhet blir än viktigare.
- **A-009** *(ny, 2026-08-12)* — Att bemanningsföretag har eller skaffar maskinläsbara gränssnitt för förhandlingsutbyte. Om fel: D-016:s huvudform faller tillbaka på mänsklig fallback i högre grad än tänkt.
- **A-010** *(ny, 2026-08-15)* — Att regioner/kommuner har betalningsvilja för SmartPool-åtkomst och att tillräckligt många konsulter aktiverar direktanställnings-valet för kritisk massa inom 12 månader. Bemlos existens är indikation, inte bevis.

### Domänfakta (källa: Anders, branschkunskap)

Standardmarginal bemanningsföretag: **ca 18 % mot löneanställd konsult, ca 10 % mot företagande konsult.** Approximativa — används som utgångspunkt i Löneanalysen, förfinas mot observerad data.

---

## 15. Öppna frågor

### Prioriterade

1. **Hur konsultanskaffning och aktivering ska lösas.** *Detta är den fråga som avgör om produkten existerar — utbudet är löst, tekniken är inte huvudrisken.* (A-006 är en delhypotes, inte ett svar.)
2. **När det konsultdelade datalagret (D-019) når kritisk massa per ort/roll, och hur kallstartsperioden överbryggas.** Mekanismen är beslutad; volymfrågan är inte.
3. **Vilken roll vardbemanning.ai ska ha:** publik faktakälla, internt datalager, produktdomän/varumärke, eller vilande. *(Not: befintliga mockups använder domänen som produktyta — det är inte beslutat.)*
4. Exakt konsultintäktsmodell och prissättning.
5. Var gränsen mellan freemium och premium går, funktion för funktion.
6. **Konkret mekanism för "tekniskt granskbar" (P-008/P-010)** — *delvis besvarad:* publiken är beslutad (D-024: konsulten per beslut + tredjepartsgranskningsbar per konstruktion) och reproducerbarhetens innebörd definierad (D-026). Kvarstår hos nivå 2: loggschema och granskningsgränssnittets design.

### Övriga

- **B2B-användning av aggregerad konsultdata** — medvetet olåst (D-019). Avvägning: intäktsoption mot risken att bygga den asymmetri produkten bekämpar. Tas inte upp igen utan nytt underlag. Re-consent krävs oavsett (D-020).
- **SmartPool: prissättningsmodell mot vårdgivare** (D-021) — beror på pilotdialog med kommuner/regioner.
- **Mätbart falsifieringskriterium för A-006** — sätts vid lansering (D-022).
- **Premiumbevis för löneanställda** utöver Löneanalysen (Fakturakontrollen gäller endast företagare, D-018).
- **Röst som förstaklassgränssnitt** — riktning från v0.2, ej beslutad.
- Avbrytbarhet av pågående förhandling (delegerad till nivå 2).
- Hur agenten ska beräkna "bra utfall" för en individuell konsult.
- Exakt modell för löneprognoser och förhandlingsrekommendationer.
- Hur baseline för en eventuell success fee ska definieras.
- Hur konfidensnivå ska hanteras vid tunt dataunderlag per ort och period, och när agenten ska falla tillbaka på domänmodell i stället för observationer.
- Exakt teknisk stack och molnarkitektur.
- Exakt modell för persistent memory.
- Hur historisk marknadsdata ska modelleras och exponeras för agenten.
- Hur konkurrerande erbjudanden ska jämföras.
- Hur agenten hanterar situationer där många konsulter konkurrerar om samma uppdrag.
- Hur LinkedIn eller andra externa professionella profiler ska integreras.
- Vilken juridisk struktur eller bolagsenhet produkten ska ligga under.
- Vilka regulatoriska krav som gäller för respektive datatyp och användningsfall.

### Lösta sedan v0.2

- ~~Hur mycket autonomi agenten ska ha vid faktisk förhandling~~ → D-016, P-011.
- ~~Vilka åtgärder som alltid kräver explicit godkännande~~ → P-011 (nivå 3 + klassificeringsregel).
- ~~Vilken mekanism gör produkten bättre med fler användare~~ → delvis löst via D-019 (se prioriterad fråga 2).

---

## 16. Beslutslogg

| ID | Beslut | Härleds ur | Status |
|---|---|---|---|
| D-001 | Agenten är en beslutsagent, inte en jobbagent | P-007 | aktiv |
| D-002 | Första värdet är analys och förhandling av befintliga erbjudanden | P-001, P-007 | aktiv |
| D-003 | Agenten rekommenderar fyra utfall | P-002, P-003 | aktiv |
| D-004 | Datagrund: nationella avtalet, standardmarginaler, domänexpertis, 36 mån avropsdata, BEGA-historik | P-001 | aktiv, ersätter v0.1 D-004 |
| D-005 | Profilen byggs värde-utlöst | P-006 | aktiv, ersätter v0.1 D-005 |
| D-006 | Kryssrutor för uppdragserbjudanden och timvik finns från start | P-007 | aktiv |
| D-007 | Freemium/premium skiljs av vem som utför arbetet | P-001 | aktiv |
| D-008 | Fakturagranskning mot tidrapport är kärnfunktion | P-001 | **superseded → D-018** |
| D-009 | Deduplicering av uppdrag är kärnfunktion | P-001 | aktiv |
| D-010 | BEGA seedar uppdragsflödet, andelen ska spädas | P-009, P-010, P-012 | aktiv |
| D-011 | Agenten designas för externa datakällor | P-012 | aktiv |
| D-012 | Anställningsform är central dimension | P-004 | aktiv |
| D-013 | Uppdragslängd har hög prioritet | P-004 | aktiv |
| D-014 | Agenten ska kunna använda framtida marknadssignaler | P-003 | aktiv |
| D-015 | BEGA utan kommersiell särställning; öppen anslutning på samma villkor | P-008, P-010 | aktiv |
| D-016 | Automatiserad förhandling i premium v1; bindning kräver alltid bekräftelse | D-007, P-002, P-004 | aktiv |
| D-017 | Full realtidsinsyn i pågående förhandling | P-005, D-016 | aktiv |
| D-018 | Fakturakontrollen endast för företagande konsulter | P-001, D-012 | aktiv, ersätter D-008 |
| D-019 | Konsultdelad data återanvänds aggregerat; opt-in + trösklar | P-001, P-005, P-006, A-001 | aktiv |
| D-020 | Snävt samtyckesändamål; B2B kräver re-consent | P-006, D-019 | aktiv |
| D-021 | SmartPool — pool/inhyrning/rekrytering mot vårdgivare, mål 12 mån | P-001, P-012, D-006 | aktiv |
| D-022 | Anskaffningsmekanismen är strategi, inte princip | P-007, P-012 | aktiv |
| D-023 | Ingen motpartsyta i v1; tenant-modellen bär framtida ytor | P-012, D-016, D-021 | aktiv |
| D-024 | Granskbarhet: konsulten per beslut + tredjepartsgranskningsbar per konstruktion | P-005, P-008, P-010 | aktiv |
| D-025 | Opt-in omfattar uttryckligen även härledd data | P-005, P-006, D-019, D-020 | aktiv |
| D-026 | Reproducerbarhet = prövbart loggat underlag, ej bitvis återkörning | P-005, P-010 | aktiv |

### Superseded

| ID | Tidigare beslut | Ersatt av | Varför |
|---|---|---|---|
| D-004 (v0.1) | Datagrund: sex års marknadsdata, 20 000 uppdrag, 40 000 offerter | D-004 | Offertdatan är inte tillgänglig för projektet |
| D-005 (v0.1) | Fyra obligatoriska startparametrar i profilen | D-005 | Profilen ska växa värde-utlöst |
| D-008 (v0.2) | Fakturagranskning som kärnfunktion för alla, motiverad med sjuksköterskors OB | D-018 | Riktas om till företagande konsulter; sjuksköterskeargumentet bar inte (löneanställda omfattas ej) |

---

## 17. Handoff-brief *(uppdaterad vid D-022, 2026-08-15)*

**Produktkärna i en mening:** En AI-agent med odelad, verifierbar lojalitet till vårdkonsulten, som ersätter konsultchefens funktion — beslutsstöd först, förmedling senare — finansierad av konsultens premiumavgift och på sikt vårdgivares SmartPool-åtkomst, aldrig av att agenten driver konsulten mot transaktion.

**Lojalitetsarkitekturen (komplett):** P-001–P-013. Fyra bärande lås: ingen intäkt från avslut (§11), ingen fördel av betalning eller ägarkoppling — granskbart från dag ett (P-008/P-010), bindning aldrig utan konsultens bekräftelse (D-016/P-011), öppet ombudskap mot externa parter (P-013). P-012 definierar vad som är fast kärna respektive fri tillväxtyta för trial and error.

**Senaste besluten:** D-015–D-026 plus P-010–P-013 (se §8). D-023–D-026 är nivå 1:s svar på Agent Architects eskaleringar AQ-001–AQ-005 (Leverans 1, godkänd).

**Öppna frågor i prioritetsordning:** se §15 — konsultanskaffning (1), kritisk massa för datalagret (2), vardbemanning.ai:s roll (3), intäktsmodell (4), freemium-gräns (5), granskbarhetsmekanism (6).

**Överlämningsstatus mot kriterierna:**

| Kriterium | Status |
|---|---|
| Agentens lojalitetsprinciper | ✅ P-001–P-010 |
| Beslutstyper: självständigt vs godkännande | ✅ P-011 + D-016/D-017 |
| Domänmodellens kärnobjekt | ✅ §9 (inkl. Förhandlingsutbyte, datalager) |
| Datakällor | ✅ D-004, D-019, D-020 |
| Säkerhets- och mandatprinciper | ✅ §12 + P-011 |

**Master Specification är redo för Agent Architect (Nivå 2).** Öppna frågor inom affärsmodell, prissättning, GTM och teknisk stack hindrar inte övergången (per processdefinitionen).

**Nästa steg för Agent Architect:** (1) designa agentuppsättning och roller utifrån §13:s preliminära riktning; (2) klassificera samtliga handlingstyper mot P-011; (3) specificera granskbarhetsmekanismen för P-008/P-010 (prioriterad öppen fråga 6); (4) designa Förhandlingsutbytets protokoll inkl. avbrytbarhet; (5) eskalera tillbaka hit om någon design kräver nya produktprinciper — specialistagenter får inte skapa principer som konflikterar med detta dokument.

---

## 18. Kvalitetskontroller vid D-020

### 1. Aktiva antaganden, rangordnade efter hur mycket av specen som ogiltigförklaras om de faller

1. **A-003 (betalningsvilja för premium)** — Faller den, faller den primära intäktsmodellen (§11, D-007) och därmed bolagets ekonomi, även om produkten fungerar. Ingenting i specen validerar den ännu.
2. **A-002 (v1-metodens träffsäkerhet)** — Faller den, faller förtroendet för själva beslutsstödet (D-001, D-002, Löneanalysen) — produktens kärnleverans. Allt nedströms förtroende bygger på att första analysen upplevs träffsäker.
3. **A-001 (aggregering ger nätverkseffekt)** — Faller den, fungerar produkten fortfarande men försvarbarheten (A-002:s "det som byggs ovanpå") och D-019-arkitekturens motiv försvagas kraftigt.
4. **A-006 (marknadskunskap driver kontoskapande)** — Faller den, saknar produkten bevisad anskaffningsmekanism — men alternativa krokar finns (fakturakontroll-demo). Kopplad till prioriterad öppen fråga 1.
5. **A-009 (maskinläsbara förhandlingsgränssnitt)** — Faller den, degraderas D-016 till mänsklig fallback — funktionen överlever men skalfördelen uteblir.
6. **A-008 (3–5 pilotbolag)** — Faller den, förlängs BEGA-dominansfönstret — hanterat av P-010, men förtroendekostnaden ökar.
7. **A-004 (200–500 uppdrag/vecka)** — Faller den, försvagas matchningsvärdet men beslutsstödet (produktens pitch) står kvar.
8. **A-007 (avropsdatans inhämtningsbarhet)** — Faller den, försvagas D-004:s datagrund — men tre andra källor kvarstår.
9. **A-005 (produkten frontas ej av grundaren)** — Minst strukturell påverkan; ändrar kommunikation, inte arkitektur.

### 2. Svagast motiverade beslutet

**D-016 (automatiserad förhandling i premium v1).** Motiveringen — snabbhet och skalbarhet — är riktig men tunn i förhållande till beslutets kostnad: det flyttar projektets tekniskt mest komplexa och mest beroendetunga förmåga in i v1-scope, vilande på ett helt overifierat antagande (A-009) om motparternas teknik, i spänning med den ännu oformulerade P-012-kandidaten (oberoende av parter projektet inte kontrollerar). Skyddsräcken finns (bekräftelsekrav, insyn, fallback), så beslutet är inte *farligt* — men det är det beslut som mest sannolikt tvingas omprövas av verkligheten.
**Så stärks det:** verifiera A-009 mot 1–2 pilotbolag innan implementation prioriteras, och definiera en minimal gränssnittsnivå (t.ex. strukturerad e-post) som sänker tröskeln för motparter.

---

## Arbetsprincip

Specifikationen utvecklas iterativt:

**Mini-fråga → svar → analys → designbeslut → dokumentation → nästa mini-fråga.**

Nya idéer klassificeras alltid som PRINCIPLE, DECISION, ASSUMPTION eller OPEN QUESTION.

Tidigare beslut ändras aldrig tyst. Ersatta beslut ligger kvar med status superseded, tillsammans med vad som ändrats och varför.

**Master Specification är projektets långsiktiga källa till sanning.**
