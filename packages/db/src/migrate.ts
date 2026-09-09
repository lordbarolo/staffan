import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { migrate } from "drizzle-orm/postgres-js/migrator";

import { createDatabaseClient } from "./client.js";
import { readDatabaseUrl } from "./config.js";

const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));
const localEnvironmentPath = fileURLToPath(new URL("../../../.env", import.meta.url));
if (existsSync(localEnvironmentPath)) process.loadEnvFile(localEnvironmentPath);
const { client, db } = createDatabaseClient(readDatabaseUrl());

try {
  await migrate(db, { migrationsFolder });
  console.log("Database migrations applied.");
} finally {
  await client.end();
}
