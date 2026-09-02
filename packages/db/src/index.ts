import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { readDatabaseUrl } from "./config.js";
import * as schema from "./schema.js";

export function createDatabaseClient(databaseUrl: string) {
  const client = postgres(databaseUrl, { max: 10 });
  return { client, db: drizzle(client, { schema }) };
}

export async function checkDatabase(databaseUrl = readDatabaseUrl()): Promise<void> {
  const { client, db } = createDatabaseClient(databaseUrl);
  try {
    await db.execute(sql`select 1`);
  } finally {
    await client.end();
  }
}

export { readDatabaseUrl } from "./config.js";
export * from "./schema.js";
