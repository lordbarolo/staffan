import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  createPostgresCallOffRepository,
  createPostgresIngressDiscoveryRepository,
  readDatabaseUrl,
} from "@staffan/db";
import {
  ConfiguredHttpModelGateway,
  EAVROP_IMPORT_QUEUE,
  OpenAiModelGateway,
  PlaywrightEavropPortalAdapter,
  TesseractCliOcrEngine,
} from "@staffan/ingress";
import { PgBoss } from "pg-boss";

import { readWorkerConfig } from "./config.js";
import { importEavropDiscovery, pollEavrop } from "./jobs.js";

const POLL_QUEUE = "eavrop.poll";
const localEnvironmentPath = fileURLToPath(new URL("../../../.env", import.meta.url));
if (existsSync(localEnvironmentPath)) process.loadEnvFile(localEnvironmentPath);

const config = readWorkerConfig();
const databaseUrl = readDatabaseUrl();
const callOffRepository = createPostgresCallOffRepository(databaseUrl);
const discoveryRepository = createPostgresIngressDiscoveryRepository(databaseUrl);
const gateway =
  config.MODEL_PROVIDER === "openai"
    ? new OpenAiModelGateway(
        config.OPENAI_API_KEY as string,
        config.MODEL_NAME,
        config.MODEL_VERSION,
      )
    : new ConfiguredHttpModelGateway(
        config.MODEL_GATEWAY_URL as string,
        { provider: "configured-http", name: config.MODEL_NAME, version: config.MODEL_VERSION },
        config.MODEL_GATEWAY_TOKEN,
      );
const portal = new PlaywrightEavropPortalAdapter(
  { password: config.EAVROP_PASSWORD, username: config.EAVROP_USERNAME },
  {
    ...(config.EAVROP_BROWSER_EXECUTABLE_PATH === undefined
      ? {}
      : { browserExecutablePath: config.EAVROP_BROWSER_EXECUTABLE_PATH }),
  },
);
const ocr = new TesseractCliOcrEngine({
  ...(config.OCR_TESSERACT_PATH === undefined
    ? {}
    : { executablePath: config.OCR_TESSERACT_PATH }),
});
const boss = new PgBoss(databaseUrl);
boss.on("error", () => console.error("Background worker infrastructure error"));

await boss.start();
await boss.createQueue(EAVROP_IMPORT_QUEUE);
const pollUrl = config.EAVROP_POLL_URL;
if (pollUrl !== undefined) {
  await boss.createQueue(POLL_QUEUE, { policy: "exclusive" });
  await boss.schedule(POLL_QUEUE, config.EAVROP_POLL_CRON, {}, {
    tz: config.EAVROP_POLL_TIME_ZONE,
  });

  await boss.work(POLL_QUEUE, async () => {
    const result = await pollEavrop({
      discoveryRepository,
      pollUrl,
      portal,
      queue: {
        async enqueue(discovery) {
          return boss.send(
            EAVROP_IMPORT_QUEUE,
            { discoveryId: discovery.id },
            {
              retryBackoff: true,
              retryDelay: 60,
              retryLimit: config.WORKER_IMPORT_MAX_ATTEMPTS - 1,
              singletonKey: discovery.sourceKey,
            },
          );
        },
      },
    });
    console.log("e-Avrop poll complete", result);
  });
  await boss.send(POLL_QUEUE, {}, { singletonKey: "startup" });
}

await boss.work<{ discoveryId: string }>(EAVROP_IMPORT_QUEUE, async ([job]) => {
  if (job === undefined) return;
  const result = await importEavropDiscovery({
    callOffRepository,
    discoveryId: job.data.discoveryId,
    discoveryRepository,
    gateway,
    maxAttempts: config.WORKER_IMPORT_MAX_ATTEMPTS,
    ocr,
    portal,
  });
  console.log("e-Avrop import complete", { status: result.status });
});

async function shutdown() {
  await boss.stop({ graceful: true, timeout: 30_000 });
  await Promise.all([callOffRepository.close(), discoveryRepository.close()]);
}

process.once("SIGINT", () => void shutdown());
process.once("SIGTERM", () => void shutdown());
