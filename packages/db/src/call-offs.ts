import { randomUUID } from "node:crypto";

import type { CallOff, CallOffApproval, RawArtifact } from "@staffan/core";
import type { CallOffReviewRepository, ExtractionRecord } from "@staffan/ingress";
import { desc, eq } from "drizzle-orm";

import { createDatabaseClient } from "./index.js";
import { callOffExtractions, callOffs, rawArtifacts } from "./schema.js";

export interface ReviewRecord {
  artifact: RawArtifact;
  extraction: ExtractionRecord;
}

export function createPostgresCallOffRepository(databaseUrl: string) {
  const connection = createDatabaseClient(databaseUrl);
  const { client, db } = connection;

  const repository: CallOffReviewRepository & {
    approve(extractionId: string, fields: CallOffApproval): Promise<CallOff>;
    close(): Promise<void>;
    getReview(extractionId: string): Promise<ReviewRecord | null>;
    listReviews(): Promise<ReviewRecord[]>;
  } = {
    async saveArtifact(artifact) {
      await db.insert(rawArtifacts).values({
        ...artifact,
        receivedAt: new Date(artifact.receivedAt),
      });
    },
    async saveExtraction(record) {
      await db.insert(callOffExtractions).values({
        id: record.id,
        artifactId: record.artifactId,
        extraction: record.extraction,
        issues: record.issues,
        modelProvider: record.model.provider,
        modelName: record.model.name,
        modelVersion: record.model.version,
        status: record.status,
        createdAt: new Date(record.createdAt),
      });
    },
    async getReview(extractionId) {
      const rows = await db
        .select()
        .from(callOffExtractions)
        .innerJoin(rawArtifacts, eq(callOffExtractions.artifactId, rawArtifacts.id))
        .where(eq(callOffExtractions.id, extractionId))
        .limit(1);
      return rows[0] === undefined ? null : mapReview(rows[0]);
    },
    async listReviews() {
      const rows = await db
        .select()
        .from(callOffExtractions)
        .innerJoin(rawArtifacts, eq(callOffExtractions.artifactId, rawArtifacts.id))
        .orderBy(desc(callOffExtractions.createdAt));
      return rows.map(mapReview);
    },
    async approve(extractionId, fields) {
      const review = await this.getReview(extractionId);
      if (review?.extraction.extraction === null || review === null) {
        throw new Error("Extraktionen kan inte godkännas");
      }
      const now = new Date();
      const id = randomUUID();
      await db.insert(callOffs).values({
        id,
        artifactId: review.artifact.id,
        extractionId,
        status: "approved",
        fields,
        extractionConfidence: review.extraction.extraction.confidence,
        fieldConfidence: review.extraction.extraction.fieldConfidence,
        fieldProvenance: review.extraction.extraction.fieldProvenance,
        createdAt: now,
        updatedAt: now,
      });
      return {
        id,
        artifactId: review.artifact.id,
        status: "approved",
        extractionConfidence: review.extraction.extraction.confidence,
        sourceArtifacts: [review.artifact.id],
        fields,
        fieldConfidence: review.extraction.extraction.fieldConfidence,
        fieldProvenance: review.extraction.extraction.fieldProvenance,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      };
    },
    async close() {
      await client.end();
    },
  };

  return repository;
}

function mapReview(row: {
  call_off_extractions: typeof callOffExtractions.$inferSelect;
  raw_artifacts: typeof rawArtifacts.$inferSelect;
}): ReviewRecord {
  const artifact = row.raw_artifacts;
  const extraction = row.call_off_extractions;
  return {
    artifact: {
      id: artifact.id,
      sourceType: artifact.sourceType as RawArtifact["sourceType"],
      sourceSystem: artifact.sourceSystem,
      externalRef: artifact.externalRef,
      fileName: artifact.fileName,
      mediaType: artifact.mediaType,
      content: artifact.content,
      sha256: artifact.sha256,
      receivedAt: artifact.receivedAt.toISOString(),
    },
    extraction: {
      id: extraction.id,
      artifactId: extraction.artifactId,
      extraction: extraction.extraction,
      issues: extraction.issues,
      model: {
        provider: extraction.modelProvider,
        name: extraction.modelName,
        version: extraction.modelVersion,
      },
      status: extraction.status as ExtractionRecord["status"],
      createdAt: extraction.createdAt.toISOString(),
    },
  };
}
