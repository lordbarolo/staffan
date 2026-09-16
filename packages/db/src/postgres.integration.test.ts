import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import type { CallOffApproval, CallOffExtraction, RawArtifact } from "@staffan/core";
import type { ExtractionRecord } from "@staffan/ingress";
import { eq } from "drizzle-orm";
import postgres from "postgres";
import { afterEach, describe, expect, it } from "vitest";

import { createDatabaseClient } from "./client.js";
import { createPostgresCallOffRepository } from "./call-offs.js";
import { createPostgresIngressDiscoveryRepository } from "./ingress-discoveries.js";
import { callOffExtractions, callOffs, ingressDiscoveries, operators, rawArtifacts } from "./schema.js";

const runDatabaseTests = process.env.STAFFAN_RUN_DB_INTEGRATION_TESTS === "true";
const databaseUrl = process.env.DATABASE_URL ?? "";
const cleanup: Array<() => Promise<void>> = [];

afterEach(async () => {
  await Promise.all(cleanup.splice(0).map(async (close) => close()));
});

describe.runIf(runDatabaseTests)("PostgreSQL transition guarantees", () => {
  it("does not let polling overwrite a processing discovery or clear its lease", async () => {
    const repository = createPostgresIngressDiscoveryRepository(databaseUrl);
    const discovery = await repository.register({
      externalRef: `RACE-${randomUUID()}`,
      sourceUrl: `https://www.e-avrop.com/notice.aspx?id=${randomUUID()}`,
    });
    cleanup.push(async () => {
      const { client, db } = createDatabaseClient(databaseUrl);
      await db.delete(ingressDiscoveries).where(eq(ingressDiscoveries.id, discovery.id));
      await client.end();
      await repository.close();
    });

    const claimed = await repository.claim(discovery.id);
    expect(claimed?.status).toBe("processing");
    expect(await repository.markQueued(discovery.id)).toBe(false);
    const current = await repository.get(discovery.id);
    expect(current?.status).toBe("processing");
    expect(current?.leaseExpiresAt).toBe(claimed?.leaseExpiresAt);
  });

  it("returns one idempotent result for simultaneous identical approvals", async () => {
    const repository = createPostgresCallOffRepository(databaseUrl);
    const { client, db } = createDatabaseClient(databaseUrl);
    const operatorId = randomUUID();
    const artifactId = randomUUID();
    const extractionId = randomUUID();
    const fields = completeApproval();
    const artifact: RawArtifact = {
      id: artifactId,
      sourceType: "raw_text",
      sourceSystem: fields.sourceSystem,
      externalRef: null,
      fileName: null,
      mediaType: "text/plain",
      content: "Vårdgivare: Testkommun\nRoll: Sjuksköterska\nPlats: Teststad",
      sha256: "a".repeat(64),
      receivedAt: new Date().toISOString(),
    };
    const extraction = completeExtraction(fields, artifactId);
    const record: ExtractionRecord = {
      id: extractionId,
      artifactId,
      extraction,
      issues: [],
      model: { provider: "fixture", name: "postgres-race", version: "1" },
      status: "ready_for_review",
      createdAt: new Date().toISOString(),
    };
    await db.insert(operators).values({
      id: operatorId,
      username: `operator-${operatorId}`,
      passwordHash: "test-only",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await repository.saveArtifact(artifact);
    await repository.saveExtraction(record);
    cleanup.push(async () => {
      await db.delete(callOffs).where(eq(callOffs.extractionId, extractionId));
      await db.delete(callOffExtractions).where(eq(callOffExtractions.id, extractionId));
      await db.delete(rawArtifacts).where(eq(rawArtifacts.id, artifactId));
      await db.delete(operators).where(eq(operators.id, operatorId));
      await client.end();
      await repository.close();
    });

    const [first, second] = await Promise.all([
      repository.approve(extractionId, fields, operatorId),
      repository.approve(extractionId, fields, operatorId),
    ]);

    expect(second.id).toBe(first.id);
    const stored = await db.select().from(callOffs).where(eq(callOffs.extractionId, extractionId));
    expect(stored).toHaveLength(1);
  });

  it("upgrades a pre-0003 database containing historical duplicate approvals", async () => {
    const base = new URL(databaseUrl);
    const temporaryDatabase = `staffan_migration_${randomUUID().replaceAll("-", "")}`;
    const adminUrl = new URL(base);
    adminUrl.pathname = "/postgres";
    const admin = postgres(adminUrl.href, { max: 1 });
    await admin.unsafe(`CREATE DATABASE "${temporaryDatabase}"`);
    const temporaryUrl = new URL(base);
    temporaryUrl.pathname = `/${temporaryDatabase}`;
    const temporary = postgres(temporaryUrl.href, { max: 1 });
    cleanup.push(async () => {
      await temporary.end();
      await admin.unsafe(`DROP DATABASE IF EXISTS "${temporaryDatabase}" WITH (FORCE)`);
      await admin.end();
    });

    for (const migration of [
      "0000_slice_0_backbone.sql",
      "0001_slice_1_calloff_intake.sql",
      "0002_eavrop_polling.sql",
    ]) {
      await runSqlFile(temporary, migration);
    }
    await temporary.unsafe(`
      INSERT INTO raw_artifacts VALUES
        ('artifact', 'raw_text', 'test', NULL, NULL, 'text/plain', 'test', '${"a".repeat(64)}', now());
      INSERT INTO call_off_extractions VALUES
        ('extraction', 'artifact', NULL, '[]', 'test', 'test', '1', 'ready_for_review', now());
      INSERT INTO call_offs VALUES
        ('approval-1', 'artifact', 'extraction', 'approved', '{}', 0.5, '{}', '{}', now(), now()),
        ('approval-2', 'artifact', 'extraction', 'approved', '{}', 0.5, '{}', '{}', now(), now());
    `);

    await runSqlFile(temporary, "0003_auth_approval_idempotency.sql");
    await runSqlFile(temporary, "0004_raw_artifact_originals.sql");
    const rows = await temporary<{ count: number }[]>`
      SELECT count(*)::int AS count FROM call_offs WHERE extraction_id = 'extraction'
    `;
    expect(rows[0]?.count).toBe(2);
  });
});

async function runSqlFile(client: ReturnType<typeof postgres>, name: string) {
  const sql = await readFile(fileURLToPath(new URL(`../drizzle/${name}`, import.meta.url)), "utf8");
  for (const statement of sql.split("--> statement-breakpoint")) {
    if (statement.trim() !== "") await client.unsafe(statement);
  }
}

function completeApproval(): CallOffApproval {
  return {
    externalRef: null,
    sourceSystem: "postgres-integration",
    careProvider: "Testkommun",
    organizationNumber: null,
    administration: null,
    unit: null,
    requester: null,
    role: "Sjuksköterska",
    specialty: null,
    competenceRequirements: [],
    location: "Teststad",
    periodStart: "2027-06-01",
    periodEnd: "2027-06-30",
    periodSegments: [],
    scope: { consultantCount: 1, description: null },
    schedule: "Dagtid",
    onCall: null,
    introduction: null,
    mandatoryRequirements: [],
    preferences: [],
    classifiedRequirements: [],
    criteria: [],
    priorities: [],
    requiredDocuments: [],
    commercialTerms: null,
    submissionDeadline: "2027-05-01",
    otherTerms: [],
  };
}

function completeExtraction(fields: CallOffApproval, artifactId: string): CallOffExtraction {
  const source = [{ artifactId, excerpt: "Test", locator: null }];
  return {
    ...fields,
    confidence: 0.9,
    fieldConfidence: { careProvider: 0.9, role: 0.9, location: 0.9 },
    fieldProvenance: { careProvider: source, role: source, location: source },
  };
}
