import { fileURLToPath } from "node:url";

import { migrate } from "drizzle-orm/postgres-js/migrator";

import { createDatabaseClient, readDatabaseUrl } from "./index.js";

const migrationsFolder = fileURLToPath(new URL("../drizzle", import.meta.url));
const { client, db } = createDatabaseClient(readDatabaseUrl());

try {
  await migrate(db, { migrationsFolder });
  console.log("Database migrations applied.");
} finally {
  await client.end();
}
