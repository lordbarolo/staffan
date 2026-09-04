import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { createPostgresCallOffRepository, readDatabaseUrl } from "@staffan/db";
import {
  ConfiguredHttpModelGateway,
  OpenAiModelGateway,
  PlaywrightEavropPortalAdapter,
} from "@staffan/ingress";

import { buildApp } from "./app.js";
import { readApiConfig } from "./config.js";

const localEnvironmentPath = fileURLToPath(new URL("../../../.env", import.meta.url));
if (existsSync(localEnvironmentPath)) process.loadEnvFile(localEnvironmentPath);

const config = readApiConfig();
const repository = createPostgresCallOffRepository(readDatabaseUrl());
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
const app = buildApp(undefined, { gateway, repository, ...(eavrop === undefined ? {} : { eavrop }) });
app.addHook("onClose", async () => repository.close());

try {
  await app.listen({ host: config.API_HOST, port: config.API_PORT });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
