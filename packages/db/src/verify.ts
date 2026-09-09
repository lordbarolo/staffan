import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { sql } from "drizzle-orm";

import {
  appMetadata,
  callOffs,
  createDatabaseClient,
  ingressDiscoveries,
  operatorSessions,
  operators,
  readDatabaseUrl,
} from "./index.js";

const localEnvironmentPath = fileURLToPath(new URL("../../../.env", import.meta.url));
if (existsSync(localEnvironmentPath)) process.loadEnvFile(localEnvironmentPath);
const { client, db } = createDatabaseClient(readDatabaseUrl());

try {
  await db.select({ key: appMetadata.key }).from(appMetadata).limit(1);
  await db
    .select({ id: ingressDiscoveries.id, leaseExpiresAt: ingressDiscoveries.leaseExpiresAt })
    .from(ingressDiscoveries)
    .limit(1);
  await db.select({ id: operators.id }).from(operators).limit(1);
  await db.select({ tokenHash: operatorSessions.tokenHash }).from(operatorSessions).limit(1);
  await db
    .select({ approvedByOperatorId: callOffs.approvedByOperatorId })
    .from(callOffs)
    .limit(1);
  const indexes = await db.execute<{ is_partial: boolean; is_unique: boolean }>(
    sql`select i.indisunique as is_unique, i.indpred is not null as is_partial
        from pg_index i
        where i.indexrelid = to_regclass('public.call_offs_extraction_id_unique')`,
  );
  if (indexes[0]?.is_unique !== true || indexes[0].is_partial !== true) {
    throw new Error("Partiellt approval-idempotensindex saknas");
  }
  await db.execute(sql`select 1`);
  console.log("Database schema and connection verified.");
} finally {
  await client.end();
}
