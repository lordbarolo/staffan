import { createHash, randomUUID } from "node:crypto";

import type { EavropDiscoveredCallOff } from "@staffan/ingress";
import { and, desc, eq, inArray, lt, or, sql } from "drizzle-orm";

import { createDatabaseClient } from "./index.js";
import { ingressDiscoveries } from "./schema.js";

export type IngressDiscoveryStatus =
  | "discovered"
  | "queued"
  | "processing"
  | "in_review"
  | "failed";

export interface IngressDiscoveryRecord {
  attemptCount: number;
  createdAt: string;
  externalRef: string | null;
  extractionId: string | null;
  id: string;
  lastError: string | null;
  leaseExpiresAt: string | null;
  sourceKey: string;
  sourceSystem: string;
  sourceUrl: string;
  status: IngressDiscoveryStatus;
  updatedAt: string;
}

export interface IngressDiscoveryRepository {
  claim(id: string): Promise<IngressDiscoveryRecord | null>;
  close(): Promise<void>;
  get(id: string): Promise<IngressDiscoveryRecord | null>;
  list(limit?: number): Promise<IngressDiscoveryRecord[]>;
  listPending(limit?: number): Promise<IngressDiscoveryRecord[]>;
  markFailed(id: string, error: string): Promise<void>;
  markInReview(id: string, extractionId: string): Promise<void>;
  markQueued(id: string): Promise<void>;
  markRetry(id: string, error: string): Promise<void>;
  register(discovery: EavropDiscoveredCallOff): Promise<IngressDiscoveryRecord>;
}

export function createPostgresIngressDiscoveryRepository(
  databaseUrl: string,
): IngressDiscoveryRepository {
  const { client, db } = createDatabaseClient(databaseUrl);

  return {
    async register(discovery) {
      const now = new Date();
      const sourceKey = discoveryKey(discovery);
      const inserted = await db
        .insert(ingressDiscoveries)
        .values({
          id: randomUUID(),
          sourceSystem: "e-avrop",
          sourceKey,
          sourceUrl: discovery.sourceUrl,
          externalRef: discovery.externalRef,
          status: "discovered",
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoUpdate({
          target: [ingressDiscoveries.sourceSystem, ingressDiscoveries.sourceKey],
          set: {
            externalRef: discovery.externalRef,
            sourceUrl: discovery.sourceUrl,
          },
        })
        .returning();
      if (inserted[0] === undefined) throw new Error("Upptäckten kunde inte registreras");
      return mapDiscovery(inserted[0]);
    },
    async listPending(limit = 100) {
      const now = new Date();
      const rows = await db
        .select()
        .from(ingressDiscoveries)
        .where(
          or(
            inArray(ingressDiscoveries.status, ["discovered", "queued"]),
            and(
              eq(ingressDiscoveries.status, "processing"),
              lt(ingressDiscoveries.leaseExpiresAt, now),
            ),
          ),
        )
        .orderBy(ingressDiscoveries.createdAt)
        .limit(limit);
      return rows.map(mapDiscovery);
    },
    async list(limit = 100) {
      const rows = await db
        .select()
        .from(ingressDiscoveries)
        .orderBy(desc(ingressDiscoveries.updatedAt))
        .limit(limit);
      return rows.map(mapDiscovery);
    },
    async get(id) {
      const rows = await db
        .select()
        .from(ingressDiscoveries)
        .where(eq(ingressDiscoveries.id, id))
        .limit(1);
      return rows[0] === undefined ? null : mapDiscovery(rows[0]);
    },
    async markQueued(id) {
      await updateStatus(id, "queued", null);
    },
    async claim(id) {
      const now = new Date();
      const leaseExpiresAt = new Date(now.getTime() + 15 * 60 * 1_000);
      const rows = await db
        .update(ingressDiscoveries)
        .set({
          attemptCount: sql`${ingressDiscoveries.attemptCount} + 1`,
          lastError: null,
          leaseExpiresAt,
          status: "processing",
          updatedAt: now,
        })
        .where(
          and(
            eq(ingressDiscoveries.id, id),
            or(
              inArray(ingressDiscoveries.status, ["discovered", "queued"]),
              and(
                eq(ingressDiscoveries.status, "processing"),
                lt(ingressDiscoveries.leaseExpiresAt, now),
              ),
            ),
          ),
        )
        .returning();
      return rows[0] === undefined ? null : mapDiscovery(rows[0]);
    },
    async markRetry(id, error) {
      await updateStatus(id, "queued", safeError(error));
    },
    async markFailed(id, error) {
      await updateStatus(id, "failed", safeError(error));
    },
    async markInReview(id, extractionId) {
      await db
        .update(ingressDiscoveries)
        .set({
          extractionId,
          lastError: null,
          leaseExpiresAt: null,
          status: "in_review",
          updatedAt: new Date(),
        })
        .where(eq(ingressDiscoveries.id, id));
    },
    async close() {
      await client.end();
    },
  };

  async function updateStatus(
    id: string,
    status: IngressDiscoveryStatus,
    lastError: string | null,
  ) {
    await db
      .update(ingressDiscoveries)
      .set({ lastError, leaseExpiresAt: null, status, updatedAt: new Date() })
      .where(eq(ingressDiscoveries.id, id));
  }
}

export function discoveryKey(discovery: EavropDiscoveredCallOff) {
  if (discovery.externalRef !== null) return `ref:${discovery.externalRef}`;
  return `url:${createHash("sha256").update(discovery.sourceUrl).digest("hex")}`;
}

function mapDiscovery(
  row: typeof ingressDiscoveries.$inferSelect,
): IngressDiscoveryRecord {
  return {
    attemptCount: row.attemptCount,
    createdAt: row.createdAt.toISOString(),
    externalRef: row.externalRef,
    extractionId: row.extractionId,
    id: row.id,
    lastError: row.lastError,
    leaseExpiresAt: row.leaseExpiresAt?.toISOString() ?? null,
    sourceKey: row.sourceKey,
    sourceSystem: row.sourceSystem,
    sourceUrl: row.sourceUrl,
    status: row.status as IngressDiscoveryStatus,
    updatedAt: row.updatedAt.toISOString(),
  };
}

function safeError(error: string) {
  return error.replace(/[\r\n]+/g, " ").slice(0, 1_000);
}
