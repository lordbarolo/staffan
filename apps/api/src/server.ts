import { buildApp } from "./app.js";
import { readApiConfig } from "./config.js";

const config = readApiConfig();
const app = buildApp();

try {
  await app.listen({ host: config.API_HOST, port: config.API_PORT });
} catch (error) {
  app.log.error(error);
  process.exitCode = 1;
}
