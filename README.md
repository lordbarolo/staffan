# Staffan

Minimal körbar ryggrad för den operativa produkten.

## Normerande dokument

Byggarbete börjar med [arkitekturlåset](docs/ARKITEKTUR-LAST-v1.0.md) och [byggplanen](docs/BYGGPLAN-LAST-v1.0.md). Innehållet i `docs/History` är historik och ska inte användas som normerande input.

## Förutsättningar

- Node.js 22 eller senare
- pnpm 11.25.0 via Corepack (`corepack enable`)
- Docker med Compose för lokal PostgreSQL 16

## Start från ren clone

```bash
cp .env.example .env
pnpm install --frozen-lockfile
pnpm db:up
pnpm db:migrate
pnpm db:smoke
pnpm dev
```

Öppna `http://localhost:3000`. Operationsytan läser API:ts `GET /health`; en frisk installation visar både API och databas som tillgängliga.

## Kvalitetskontroller

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

`pnpm check` kör hela kedjan. CI migrerar dessutom en ren PostgreSQL-instans och verifierar hela produktionsvägen från operationsytan via health-endpointen till databasen.

`pnpm db:up` startar PostgreSQL 16 via Docker Compose och väntar tills databasen är frisk. `pnpm db:migrate` applicerar Drizzle-migreringarna och `pnpm db:smoke` verifierar både anslutningen och det migrerade schemat.

## Docker och modellgateway

Produktions-API:t startar inte utan `MODEL_GATEWAY_URL`. Det är en avsiktlig spärr: en riktig modellkörning ska alltid peka på en explicit konfigurerad gateway. `MODEL_GATEWAY_TOKEN` kan anges när gatewayn kräver Bearer-autentisering.

Docker-verifieringen körs med `docker compose -f compose.verify.yaml up --build --detach` följt av health- och intake-kontrollerna i CI. Den bygger API och webb, migrerar en ren PostgreSQL-instans och använder en separat deterministisk testgateway för att verifiera hela intake-flödet utan externa modellcredentials. Denna testgateway är inte en produktionsmodell.

## Konfiguration och secrets

`.env.example` innehåller enbart lokala utvecklingsvärden. `.env` och alla miljöspecifika varianter ignoreras av Git. Riktiga credentials ska tillföras som miljövariabler av körmiljön och får inte läggas i repo, loggar eller klientexponerade `NEXT_PUBLIC_*`-variabler.
