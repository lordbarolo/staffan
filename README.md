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

`MODEL_PROVIDER=openai` använder OpenAI Responses API via AI SDK och kräver `OPENAI_API_KEY`. Modellens snapshot anges i `MODEL_NAME`; standardexemplet är pinning till `gpt-5.4-mini-2026-03-17`. Modellanropen använder strikt `CallOffExtraction`-schema och `store: false`. Nyckeln får endast finnas i lokal `.env` eller körmiljöns secret store.

`MODEL_PROVIDER=http` behåller den generiska HTTP-porten och kräver `MODEL_GATEWAY_URL`. `MODEL_GATEWAY_TOKEN` kan anges när gatewayn kräver Bearer-autentisering. Modellvalet ligger i båda fallen bakom samma `ModelGateway`, så domän- och ingresskod förblir leverantörsoberoende.

Docker-verifieringen körs med `docker compose -f compose.verify.yaml up --build --detach` följt av health- och intake-kontrollerna i CI. Den bygger API och webb, migrerar en ren PostgreSQL-instans och använder en separat deterministisk testgateway för att verifiera hela intake-flödet utan externa modellcredentials. Denna testgateway är inte en produktionsmodell.

## e-Avrop

Operationsytan kan importera en direktlänk till ett avrop på `e-avrop.com`. API:t loggar in med `EAVROP_USERNAME` och `EAVROP_PASSWORD`, hämtar sidtext och direktlänkade bilagor och skickar det sammanslagna materialet genom samma karantän-, modell- och reviewflöde som manuella underlag.

Playwright använder installerad Chrome eller Edge automatiskt på Windows. API:ts Docker-image installerar Chromium och anger `EAVROP_BROWSER_EXECUTABLE_PATH`; motsvarande sökväg kan anges i andra körmiljöer. Portalinloggningen är endast läsande; adaptern skickar inga anbud och ändrar inga uppgifter i e-Avrop.

Se [`docs/EAVROP-INTEGRATION.md`](docs/EAVROP-INTEGRATION.md) för flöde, konfiguration utan hemligheter, verifierad omfattning och kända begränsningar.

## Konfiguration och secrets

`.env.example` innehåller enbart lokala utvecklingsvärden. `.env` och alla miljöspecifika varianter ignoreras av Git. Riktiga credentials ska tillföras som miljövariabler av körmiljön och får inte läggas i repo, loggar eller klientexponerade `NEXT_PUBLIC_*`-variabler.
