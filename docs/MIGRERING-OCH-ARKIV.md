# Migrering från tidigare dokument

**Syfte:** Förhindra att gamla dokument fortsätter styra bygget parallellt med den låsta arkitekturen.

## Ny source of truth

Endast följande dokument är normerande:

1. `00-ARKITEKTUR-LAST-v1.0.md`
2. `01-BYGGPLAN-LAST-v1.0.md`
3. framtida korta ADR:er som uttryckligen ändrar eller preciserar dessa

All övrig dokumentation är referens/historik.

## Vad som har behållits

Från Master Specification:
- konsultens intresse/neutralitetsprinciper där konsultagenten agerar för konsult
- fyra rekommendationsutfall
- mandatnivåerna
- gemensamma domänbegrepp
- principen om transparenta rekommendationer och osäkerhet
- separation av avrop, uppdrag och erbjudandevägar

Från arkitekturspecifikationen:
- informationsgränser via positiv datalista
- modellblindhet
- dokumentarbetare/extraktion som mandatlösa arbetare
- kanoniska händelser
- deterministisk tillståndsmaskin för förhandling
- adapter översätter, förhandlar aldrig
- en enda extern effektgräns
- human fallback

Från byggspecifikation v1.1/revisionen:
- TypeScript/Postgres/Drizzle/Fastify/Next/pg-boss/Playwright-baslinjen
- outbox/inbox och idempotens
- steguppautentisering för bindande handlingar
- kill switch innan autonom extern kommunikation
- EU/dataskyddskrav vid skarp persondata
- belastningsregister endast som verifieringsstatus i v1
- vertikal-slice-principen

## Vad som arkiveras

Följande filer ska behandlas som historik och får inte automatiskt läsas av en byggagent som normerande input:

- `master-specification-v0.6.md`
- `arkitekturspecifikation-agentlager-v1.1.md`
- `byggspecifikation-niva3-v1.1.md`
- `beslutslogg-delegerat.md`
- `instruktion-agent-architect-v1.1.md`
- `instruktion-block-4b.md`
- `overlamningsunderlag-agent-architect.md`
- `revisionsanalys-2026-09-01.md`
- `svar-till-agent-architect-aq001-005.md`
- `startprompter-claude-code-v1.1.md`
- `regler-versionshantering.md`

De får användas för provenance eller för att förstå varför ett gammalt beslut fattades, men de får inte överstyra den frysta baslinjen.

## Borttaget eller uppskjutet

| Område | Ny status | Skäl |
|---|---|---|
| Agent Architect-process | Arkiverad | meta-arbete, inte produktvärde |
| B0-R→B9 som strikt byggsekvens | Ersatt | för lång väg till första värde |
| Full L3-aggregatarkitektur | Senare | inte nödvändig för avropsintag/outreach |
| G1–G4 full extern verifierare | Senare hardening | tung före produktbevis |
| Fullföljandegrad | Backlog | svag koppling till första operativa värde |
| SmartPool | Produktbacklog | separat marknads-/tillväxtspår |
| 31 handlingstyper från start | Lazy expansion | implementera när handlingen existerar; okänd extern/bindande handling behandlas konservativt |
| Flerpartsbudgivning | Senare | enmotpartsläge först |
| Motpartsportal | Ej planerad | e-post/API räcker initialt |
| Separat agent per funktion | Förbjuden default | funktion/pipeline/verktyg föredras |
| Kryptografisk periodrot från första prototyp | Senare före hög assurance-prod | inte blockerare för syntetisk vertikal slice |

## Repo-migrering

När dessa dokument läggs i kodbasen rekommenderas:

```text
/docs
  /architecture
    00-ARKITEKTUR-LAST-v1.0.md
    01-BYGGPLAN-LAST-v1.0.md
    /adr
  /history
    <samtliga tidigare styrdokument>
```

README ska uttryckligen säga att byggagenter börjar med de två låsta dokumenten och **inte** läser `/docs/history` om inte ett specifikt ADR kräver provenance.

## Freeze-regel för AI-kodning

Använd följande korta instruktion i Codex/Claude Code:

> Följ `docs/architecture/00-ARKITEKTUR-LAST-v1.0.md` och `01-BYGGPLAN-LAST-v1.0.md` som enda normerande källor. Implementera aktuell slice. Skapa inte ny arkitektur, nya top-level-agenter eller framtidsinfrastruktur om det inte krävs för slices Definition of Done. Vid verklig konflikt: stoppa den delen, skriv ett kort ADR-förslag och fortsätt med allt annat som inte berör konflikten.

