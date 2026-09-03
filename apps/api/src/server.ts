import { createPostgresCallOffRepository, readDatabaseUrl } from "@staffan/db";
import { ConfiguredHttpModelGateway } from "@staffan/ingress";

import { buildApp } from "./app.js";
import { readApiConfig } from "./config.js";

const config = readApiConfig();
const repository = createPostgresCallOffRepository(readDatabaseUrl());
const gateway = new ConfiguredHttpModelGateway(
  config.MODEL_GATEWAY_URL,
  { provider: "configured-http", name: config.MODEL_NAME, version: config.MODEL_VERSION },
  config.MODEL_GATEWAY_TOKEN,
);
const app = buildApp(undefined, { gateway, repository });
app.addHook("onClose", async () => repository.close());

try {
  await app.listen({ host: config.API_HOST, port: config.API_PORT });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
