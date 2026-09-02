# Byggplan — låst v1.0

**Status:** NORMERANDE byggordning  
**Princip:** Varje fas ska avslutas med något körbart och observerbart. Nästa fas får inte expandera scope bakåt.

## Målbild för första operativa produkten

Ett riktigt kommunalt avrop ska kunna gå från inkommande källa till färdig konsultoutreach med så lite mänskligt arbete som möjligt:

```text
Avrop in
  -> råmaterial hämtat
  -> CallOff extraherat och validerat
  -> operatör korrigerar endast vid behov
  -> matchade konsulter
  -> outreach genererad
  -> human approval
  -> utskick
  -> svar kopplade tillbaka till avrop/matchning
```

Detta är prioriterat före den breda konsultagenten och före autonom förhandling.

## Slice 0 — Repo + minimal körbar ryggrad

Bygg endast det som behövs för Slice 1:

- monorepo
- TypeScript strict
- Postgres + Drizzle
- Fastify API
- minimal Next.js operationsyta
- tester/CI som kör lint, typecheck, test
- grundläggande konfiguration/secretsdisciplin

**Klart när:** ren clone kan startas, migreras och visa en tom operationsyta som kan läsa en health endpoint.

## Slice 1 — CallOff-kärnan

Input: rå text, PDF eller manuellt inklistrat avropsunderlag.  
Output: validerat `CallOff`.

Bygg:
- Zod/schema för `CallOffExtraction` och `CallOff`
- rå artifact + source metadata
- quarantine/extraction pipeline
- LLM-extraktion bakom `ModelGateway`
- schema validation + confidence/field provenance
- enkel review-skärm: råkälla till vänster, extraherade fält till höger
- operatören kan korrigera och godkänna
- fixtures från historiska, avidentifierade avrop

**Klart när:** minst 10 representativa gamla avrop kan processas end-to-end och fel syns tydligt i stället för att döljas.

## Slice 2 — Första portaladaptern: e-Avrop

Input: inkommande e-post/länk som pekar på e-Avrop.  
Output: samma råmaterial som Slice 1 redan förstår.

Bygg:
- mail trigger/import för avropsmail
- källa-identifiering
- Playwright-adapter för e-Avrop
- credential/secrets-hantering
- navigation till relevant avrop
- hämtning av text + bilagor
- adapterlogg med tydligt felsteg
- återanvänd Slice 1 utan portalspecifik parserlogik

**Klart när:** ett verkligt avrop kan hämtas från e-Avrop och landa i review-skärmen som ett `CallOff` utan manuell kopiering.

## Slice 3 — Konsultmodell + matchning

Bygg:
- minimal `Consultant`
- import av befintlig leads-lista
- hårda krav: profession, kompetens, geografi, tillgänglighet, obligatoriska verifieringar när relevanta
- enkel transparent score ovanpå pass/fail
- matchförklaring: varför match / varför inte

**Klart när:** ett godkänt `CallOff` ger en reproducerbar lista över relevanta konsulter och operatören kan förstå varje val.

## Slice 4 — Outreach med human approval

Bygg:
- outreach-template + personalisering
- Advisor/Operator Agent skriver utkast utifrån `CallOff` + relevant konsultdata
- batch preview
- mottagare och exakt payload låses vid godkännande
- `enforcement` + outbox för utskick
- svar kopplas till `CallOff`, `Consultant` och `Outreach`

**Klart när:** ett avrop kan gå från portal till godkänt utskick utan copy/paste och utan att systemet kan skicka till fel mottagare utanför godkänd batch.

## Slice 5 — Fler källor

Lägg till i ordning efter faktisk volym i verksamheten:

- Kommers
- Mercell TendSign
- andra portalvarianter
- Avropsplatsen/API där direktintegration är möjlig

Varje ny källa är endast en ingressadapter och får inte förändra kärnflödet.

**Klart när:** varje adapter har egna fixtures/E2E-test och kan falla utan att övriga källor påverkas.

## Slice 6 — Operativ automation

När kvaliteten är uppmätt:

- auto-approve av extraction för högkonfidensfält
- automatisk portalhämtning
- regelstyrd automatisk matchning
- standing mandate för vissa icke-bindande outreach-händelser om önskat
- exception queue för allt osäkert

Målet är att människan endast arbetar med undantag.

## Slice 7 — Konsultagenten

Återanvänd samma plattform för:

- erbjudandeanalys
- avtalsanalys
- CV/profil
- verifieringsstatus
- marknads-/ersättningsanalys
- rekommendation: acceptera / förhandla / tacka nej / vänta

Bygg inga nya parallella dataobjekt om samma `Consultant`, `Assignment`, `Offer` och `Contract` redan finns.

## Slice 8 — Förhandling

Först efter att rådgivningsflödet används:

- `Mandate`
- `Negotiation`
- kanoniska händelser
- strukturerad e-post först
- human confirmation per inkommande fri-mailtolkning
- enmotpartsläge före flerpartsbudgivning
- full nivå 3 payload-lock för bindande utfall

Autonomin höjs endast efter mätt precision och med kill switch.

## Definition of Done per slice

En slice är klar när:
1. den fungerar end-to-end på representativa fixtures eller riktiga godkända data,
2. fel och osäkerhet syns explicit,
3. kritiska regler har automatiska tester,
4. ingen ny generell arkitekturdokumentation krävs för nästa slice,
5. koden och ett kort README/ADR räcker för överlämning.

## Anti-bloat-regel

Om en planerad uppgift inte behövs för aktuell slices DoD och inte åtgärdar en konkret säkerhetsrisk, läggs den i backlog — inte i implementationen och inte i en ny spec.

