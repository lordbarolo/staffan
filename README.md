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
pnpm dev:infra
pnpm db:migrate
pnpm db:verify
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

## Konfiguration och secrets

`.env.example` innehåller enbart lokala utvecklingsvärden. `.env` och alla miljöspecifika varianter ignoreras av Git. Riktiga credentials ska tillföras som miljövariabler av körmiljön och får inte läggas i repo, loggar eller klientexponerade `NEXT_PUBLIC_*`-variabler.
