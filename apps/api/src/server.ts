import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  createPostgresAuthRepository,
  createPostgresCallOffRepository,
  createPostgresIngressDiscoveryRepository,
  readDatabaseUrl,
} from "@staffan/db";
import {
  ConfiguredHttpModelGateway,
  OpenAiModelGateway,
  PlaywrightEavropPortalAdapter,
  TesseractCliOcrEngine,
} from "@staffan/ingress";

import { buildApp } from "./app.js";
import { createAuthService } from "./auth.js";
import { readApiConfig } from "./config.js";

const localEnvironmentPath = fileURLToPath(new URL("../../../.env", import.meta.url));
if (existsSync(localEnvironmentPath)) process.loadEnvFile(localEnvironmentPath);

const config = readApiConfig();
const authRepository = createPostgresAuthRepository(readDatabaseUrl());
await authRepository.ensureOperator({
  passwordHash: config.OPERATOR_PASSWORD_HASH,
  username: config.OPERATOR_USERNAME,
});
const authService = createAuthService(authRepository, {
  sessionTtlHours: config.AUTH_SESSION_TTL_HOURS,
});
const repository = createPostgresCallOffRepository(readDatabaseUrl());
const discoveryRepository = createPostgresIngressDiscoveryRepository(readDatabaseUrl());
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
const eavrop =
  config.EAVROP_USERNAME === undefined || config.EAVROP_PASSWORD === undefined
    ? undefined
    : new PlaywrightEavropPortalAdapter(
        { username: config.EAVROP_USERNAME, password: config.EAVROP_PASSWORD },
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
const app = buildApp(undefined, {
  gateway,
  ocr,
  repository,
  discoveryRepository,
  ...(eavrop === undefined ? {} : { eavrop }),
}, { cookieSecure: config.AUTH_COOKIE_SECURE, service: authService });
app.addHook("onClose", async () => {
  await Promise.all([authRepository.close(), repository.close(), discoveryRepository.close()]);
});

try {
  await app.listen({ host: config.API_HOST, port: config.API_PORT });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
