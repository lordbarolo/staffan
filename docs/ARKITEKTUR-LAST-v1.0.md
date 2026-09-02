# Arkitekturlås v1.0

**Datum:** 2026-09-01  
**Status:** LÅST / NORMERANDE  
**Ägare:** Anders  
**Syfte:** Detta dokument är enda normerande arkitekturkälla för projektet tillsammans med `01-BYGGPLAN-LAST-v1.0.md`. Tidigare Master Specification, arkitekturspecifikation, byggspecifikation, beslutsloggar, blockinstruktioner, revisionsanalyser och startprompter är historiskt underlag och får inte styra nya implementationer.

## 1. Produktens kärna

Plattformen ska vara ett AI-native operativt lager för vårdbemanning och vårdkonsulter. Samma kärna ska kunna bära två användningsytor:

1. **Bemanningsdrift:** fånga avrop från e-post, portaler och API:er, normalisera dem, matcha mot konsulter och förbereda outreach/anbud med mänskligt godkännande där extern eller bindande effekt uppstår.
2. **Konsultagent:** hjälpa konsulten analysera uppdrag och avtal, hålla profil/verifieringar aktuella, rekommendera nästa steg och senare förhandla inom explicit mandat.

De två ytorna delar domänmodell, dokumenttolkning, matchning, kanaler, loggning och verkställighetslager. De ska inte byggas som två separata plattformar.

## 2. Låsta arkitekturprinciper

Följande är invarianta tills Anders uttryckligen ändrar dem.

### A1 — Kod bär garantier; modellen bär omdöme

LLM får analysera, extrahera, formulera och rekommendera. Behörighet, mandat, bindande övergångar, mottagare, payload, idempotens, tenantgränser och säkerhet ska verkställas deterministiskt i kod.

### A2 — En kanonisk domänmodell bakom alla kanaler

E-post, e-Avrop, Kommers, TendSign, Avropsplatsen och framtida API:er är **adaptrar**. De ska översätta externa format till samma interna objekt. Ingen portal får skapa egen affärslogik.

### A3 — Extern text är data, aldrig instruktion

All text och alla dokument från externa källor behandlas som otillförlitliga. De går genom karantän/extraktion och blir schemavaliderad strukturerad data innan de får påverka en agent eller workflow.

### A4 — Extern effekt går genom en enda verkställighetsgräns

Mail, API-anrop, dokumentdelning och andra externa handlingar får endast utföras via `enforcement`. Ingen agent, parser, matchare eller förhandlingsmodul får skicka direkt.

### A5 — Human-in-the-loop följer risk, inte funktion

- **Nivå 1:** intern, reversibel analys/utkast får köras autonomt.
- **Nivå 2:** extern men icke-bindande handling får automatiseras endast inom ett explicit, återkallbart mandat.
- **Nivå 3:** bindande handling, ny delning av identitet/dokument eller annan svåråterkallelig åtgärd kräver explicit godkännande av exakt payload.

Vid tveksamhet gäller högre nivå.

### A6 — Informationsminimering per komponent

En komponent får endast den information den behöver. Data som inte får påverka ett beslut ska inte finnas i modellens kontext. Sekretess ska inte bero på promptinstruktioner.

### A7 — Allt viktigt ska vara spårbart

Varje agentrekommendation och extern handling ska kunna kopplas till indata, versionerad logik/modell, mandat/godkännande och utfall. Vi bygger auditability för felsökning, säkerhet och förtroende — inte ett separat revisionssystem före produktvärde.

### A8 — Adapterfel får inte förstöra kärnan

Portaler kommer att ändras. En ändrad portal ska kunna repareras genom att byta eller uppdatera en adapter utan att ändra `CallOff`, matchning, outreach, förhandling eller konsultprofil.

### A9 — Börja med en vertikal produktkedja

Arkitekturen ska växa från verkliga end-to-end-flöden. Infrastruktur byggs när den behövs för nästa fungerande slice, inte som ett komplett framtidsskelett i förväg.

## 3. Systemgränser och komponenter

Den låsta logiska arkitekturen består av sju komponentområden.

```text
Externa källor
  email | e-Avrop | Kommers | TendSign | Avropsplatsen | API
                    |
                    v
            [1] Ingress adapters
                    |
                    v
          [2] Quarantine + Extract
                    |
                    v
             Canonical Domain
                    |
         +----------+----------+
         |                     |
         v                     v
 [3] Workflow/Matching    [4] Agent layer
         |                     |
         +----------+----------+
                    |
                    v
             [5] Enforcement
                    |
              external effect
                    |
                    v
          mail | portal | API

         [6] Data + audit
         [7] User surfaces
```

### 3.1 Ingress adapters

Ansvar: autentisera mot källa, navigera/hämta rådata, lagra källreferens och lämna råmaterial vidare.

För portalbaserade källor används Playwright där API saknas eller inte är praktiskt. Portalspecifik DOM/navigationslogik stannar i respektive adapter.

**Får inte:** tolka affärsregler, matcha konsulter, formulera outreach eller skicka något externt.

### 3.2 Quarantine + Extract

Ansvar: sanera och tolka extern text/dokument till strikt schema. Extraktionen får använda LLM men output måste schema-valideras.

Första centrala kontraktet är `CallOffExtraction` → `CallOff`.

**Får inte:** utföra externa handlingar eller fatta bindande beslut.

### 3.3 Workflow och matching

Ansvar: deterministiska steg, deduplicering, tillstånd, regler, scoring/filtering och jobb som kan reproduceras utan agentens fria resonemang.

Matchningen får använda modeller för semantisk hjälp, men hårda krav, tillgänglighet, geografi, giltiga verifieringar och andra explicita constraints hanteras som strukturerad data.

### 3.4 Agent layer

Agentlagret hålls litet:

- **Advisor/Operator Agent:** analyserar, rekommenderar, orkestrerar verktyg och skriver utkast.
- **Negotiation Session:** kortlivad instans för ett specifikt förhandlingsutbyte när den funktionen aktiveras.
- **Extractors:** behandlas som arbetare/verktyg, inte som självständiga agenter.

Vi skapar inte en separat agent för varje domänuppgift om en vanlig funktion, pipeline eller verktygsanrop räcker.

### 3.5 Enforcement

Enda vägen till extern effekt. Äger:

- action classification och mandatkontroll
- exakt payload-godkännande för nivå 3
- mottagar- och kanalbindning
- outbox/inbox och idempotens
- rate limits och kill switch
- transportadaptrar
- handlingslogg

### 3.6 Data + audit

PostgreSQL är primärt datalager. Dokument lagras i EU-hemmahörande objektlagring när verkliga dokument införs.

Data delas logiskt i:

- **Operational:** konsulter, kunder, avrop, uppdrag, matchningar, outreach, förhandlingar, mandat.
- **Market:** avrop/ramavtal/prisobservationer utan konsultpersondata.
- **Audit:** append-only händelser för viktiga beslut och externa handlingar.

Ett separat pseudonymiserat aggregatlager kan införas senare när faktisk produktnytta och datavolym motiverar det. Det är **inte** en förutsättning för den första produkten.

### 3.7 User surfaces

Två ytor kan byggas ovanpå samma API:

- intern operationsyta för bemanningsbolaget
- konsultyta för konsultagenten

Ingen motpartsportal byggs innan ett faktiskt behov är bevisat. Motparter nås initialt via befintliga kanaler.

## 4. Kanonisk domänmodell

Följande objekt är låsta som gemensamt språk. Fält får utökas, men parallella konkurrerande begrepp får inte införas utan arkitekturbeslut.

### `CallOff`
Ett inkommande avrop/konkret beställningsbehov från vårdgivare eller upphandlingssystem.

Minimikärna:
- `id`
- `externalRef`
- `sourceSystem`
- `careProvider`
- `role`
- `specialty/competenceRequirements`
- `location`
- `period`
- `scope`
- `schedule/onCall`
- `mandatoryRequirements`
- `commercialTerms` när tillgängligt
- `submissionDeadline`
- `sourceArtifacts`
- `extractionConfidence`
- `status`

### `Assignment`
Det normaliserade underliggande uppdraget. Ett eller flera `CallOff`/`OfferPath` kan representera samma faktiska behov.

### `OfferPath`
En specifik kommersiell väg/avsändare till samma `Assignment`.

### `Consultant`
Kompetens, erfarenhet, preferenser, tillgänglighet, ersättningskontext, dokument och verifieringsstatus.

### `Match`
Relation mellan `Consultant` och `Assignment/CallOff`, med hårda pass/fail-regler, score, orsaker och status.

### `Outreach`
Ett förberett eller skickat meddelande till konsult/motpart med mottagare, mall/version, payload, status och korrelation till avrop/matchning.

### `Offer`
Ett konkret erbjudande till en konsult.

### `Contract`
Avtalsvillkor och strukturerade riskflaggor.

### `Mandate`
Explicit delegerat handlingsutrymme med scope, nivå, giltighet och återkallelse.

### `Negotiation`
Ett versionerat förhandlingsutbyte med kanoniska händelser. Kandidatresultat är aldrig bindande avtal.

### `AgentDecision`
Rekommendation med indatareferenser, antaganden, osäkerhet, motivering och modell/policyversion.

## 5. Teknisk baslinje

Följande teknik är låst för första produktionsversionen om inte ett konkret hinder uppstår:

- **Språk:** TypeScript, strict mode
- **Repo:** pnpm workspace-monorepo
- **Databas:** PostgreSQL 16
- **ORM/migrationer:** Drizzle + versionerade SQL-migrationer
- **API:** Fastify
- **Web:** Next.js App Router
- **Bakgrundsjobb:** pg-boss
- **Browser automation:** Playwright
- **LLM:** provider bakom `ModelGateway`; modellnamn i konfiguration, inte i domänkod
- **Dokumentlagring:** S3-kompatibel EU-lagring när dokument tas i skarp drift
- **Tester:** Vitest + Playwright E2E
- **Drift:** EU-region, separata web/api/worker-processer när driftbehovet kräver det

### Minimal repostruktur

```text
/apps
  /web
  /api
  /worker
/packages
  /core          # domäntyper + rena regler
  /db            # schema + repositories
  /ingress       # email/portal/API adapters + extraction
  /agents        # advisor + negotiation session
  /enforcement   # mandat + outbox/inbox + transports
  /shared        # schema/config/utilities där verkligt delat
/tests
/docs
```

Fler paket skapas först när ett tydligt ägarskap eller säkerhetsgräns kräver det.

## 6. Säkerhetsgolv

Följande får inte skjutas upp när riktig persondata eller extern autonomi införs:

1. Principal/tenant-scope i all persondataåtkomst.
2. RLS eller motsvarande andra isoleringslinje i databasen.
3. Secrets utanför prompts och repo.
4. Steguppautentisering för nivå 3.
5. Transaktionell outbox/inbox för extern kommunikation.
6. Prompt-injection-test för varje ny extern text-/dokumentkanal.
7. Kill switch för autonoma externa handlingar.
8. Dataminimering och dokumenterad retention.
9. Belastningsregister lagras inte som innehåll i v1; endast verifieringsstatus.
10. Leverantörer som hanterar persondata måste ha dokumenterad rättslig/dataskyddsmässig grund innan skarp användning.

Kryptografisk förankring av auditloggar, avancerad extern verifierare och aggregerad anonym statistik är **senare hardening**, inte blockerare för första syntetiska/avidentifierade vertikala slice.

## 7. Förhandlingsarkitektur — behålls men aktiveras senare

När förhandling byggs gäller:

- ett `Negotiation` per utbyte
- deterministisk tillståndsmaskin och versionsnummer
- kanoniska händelser oavsett kanal
- adapter översätter; adapter förhandlar aldrig
- konsulten kan stoppa när som helst
- kandidatresultat kräver explicit nivå 3-bekräftelse för att bli bindande
- enmotpartsläge använder öppen `acceptanceLevel`; konfidentiell `hardFloor` är endast säkerhetsspärr
- fri inkommande e-post kräver initialt mänsklig bekräftelse av tolkningen

Blind flerpartsbudgivning, avancerad ranglogik och fler autonoma förhandlingsdimensioner byggs först efter att enkel enmotpartsförhandling är validerad.

## 8. Medvetet borttaget från den normerande kärnan

Följande är inte längre arkitekturkrav för första produkten:

- separat “Agent Architect”-process och blockindelning
- krav på att varje framtida paket har egen lång startprompt
- full L3/aggregatstatistik från dag ett
- komplett G1–G4 extern verifierare före första produktvärde
- SmartPool som byggkrav
- fullföljandegrad som systemkritisk funktion
- 31 handlingstyper som måste implementeras innan relevant funktion finns
- komplett B0-R/B0.5/B1…B9-sekvens innan första end-to-end-flöde
- portal för motparter
- agent-per-funktion

Dessa idéer är inte förbjudna. De är arkiverade möjligheter och får återinföras först när ett konkret användningsfall kräver dem.

## 9. Arkitekturlås och ändringsregel

Detta dokument är **frozen baseline v1.0**.

En modell eller utvecklare får:
- välja implementationdetaljer inom komponentgränserna
- lägga till fält och interna funktioner
- byta rivbara leverantörer bakom befintliga portar
- förenkla kod utan att bryta invarianten

En modell eller utvecklare får **inte** utan uttryckligt beslut från Anders:
- skapa en ny top-level komponent/agent
- skapa en ny väg för extern effekt utanför `enforcement`
- kringgå mandatnivåerna
- skapa portalspecifik affärslogik utanför adapterlagret
- blanda extern råtext direkt in i handlande agentkontext
- skapa en andra parallell domänmodell för samma begrepp
- göra en bindande handling autonom
- återinföra arkiverade framtidsfunktioner som förkrav för nuvarande build

Om ett sådant behov uppstår skapas ett kort `ADR-XXX` med: problem, föreslagen ändring, varför nuvarande arkitektur inte räcker, konsekvens och reversibilitet. **Ingen generell omskrivning av arkitekturen görs.**

