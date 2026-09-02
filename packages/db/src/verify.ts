import { sql } from "drizzle-orm";

import { appMetadata, createDatabaseClient, readDatabaseUrl } from "./index.js";

const { client, db } = createDatabaseClient(readDatabaseUrl());

try {
  await db.select({ key: appMetadata.key }).from(appMetadata).limit(1);
  await db.execute(sql`select 1`);
  console.log("Database schema and connection verified.");
} finally {
  await client.end();
}
