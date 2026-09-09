import { randomUUID } from "node:crypto";
import { isDeepStrictEqual } from "node:util";

import { callOffApprovalSchema, type CallOff, type CallOffApproval, type RawArtifact } from "@staffan/core";
import type { CallOffReviewRepository, ExtractionRecord } from "@staffan/ingress";
import { desc, eq, isNotNull, isNull } from "drizzle-orm";

import { createDatabaseClient } from "./client.js";
import { callOffExtractions, callOffs, rawArtifacts } from "./schema.js";

export class ApprovalConflictError extends Error {
  constructor() {
    super("Extraktionen har redan godkänts med ett annat innehåll eller av en annan operatör");
    this.name = "ApprovalConflictError";
  }
}

export class ApprovalValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ApprovalValidationError";
  }
}

export interface ReviewRecord {
  artifact: RawArtifact;
  extraction: ExtractionRecord;
}

export function createPostgresCallOffRepository(databaseUrl: string) {
  const connection = createDatabaseClient(databaseUrl);
  const { client, db } = connection;

  const repository: CallOffReviewRepository & {
    approve(extractionId: string, fields: CallOffApproval, approvedByOperatorId: string): Promise<CallOff>;
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
        .leftJoin(callOffs, eq(callOffExtractions.id, callOffs.extractionId))
        .where(isNull(callOffs.id))
        .orderBy(desc(callOffExtractions.createdAt));
      return rows.map(mapReview);
    },
    async approve(extractionId, fields, approvedByOperatorId) {
      const validatedFields = callOffApprovalSchema.parse(fields);
      const review = await this.getReview(extractionId);
      if (review?.extraction.extraction === null || review === null) {
        throw new Error("Extraktionen kan inte godkännas");
      }
      if (validatedFields.sourceSystem !== review.artifact.sourceSystem) {
        throw new ApprovalValidationError("Källsystemet får inte ändras vid godkännande");
      }

      const existingApprovals = await db
        .select()
        .from(callOffs)
        .where(eq(callOffs.extractionId, extractionId))
        .limit(2);
      const existingApproval = findReplayableApproval(
        existingApprovals,
        validatedFields,
        approvedByOperatorId,
      );
      if (existingApproval !== null) return mapCallOff(existingApproval, review);

      const now = new Date();
      const id = randomUUID();
      const inserted = await db
        .insert(callOffs)
        .values({
          id,
          approvedByOperatorId,
          artifactId: review.artifact.id,
          extractionId,
          status: "approved",
          fields: validatedFields,
          extractionConfidence: review.extraction.extraction.confidence,
          fieldConfidence: review.extraction.extraction.fieldConfidence,
          fieldProvenance: review.extraction.extraction.fieldProvenance,
          createdAt: now,
          updatedAt: now,
        })
        .onConflictDoNothing({
          target: callOffs.extractionId,
          where: isNotNull(callOffs.approvedByOperatorId),
        })
        .returning();

      if (inserted[0] === undefined) {
        const concurrentlyInserted = await db
          .select()
          .from(callOffs)
          .where(eq(callOffs.extractionId, extractionId))
          .limit(2);
        const concurrentApproval = findReplayableApproval(
          concurrentlyInserted,
          validatedFields,
          approvedByOperatorId,
        );
        if (concurrentApproval === null) throw new ApprovalConflictError();
        return mapCallOff(concurrentApproval, review);
      }
      return {
        id,
        artifactId: review.artifact.id,
        status: "approved",
        extractionConfidence: review.extraction.extraction.confidence,
        sourceArtifacts: [review.artifact.id],
        fields: validatedFields,
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

export function findReplayableApproval<TApproval extends {
  approvedByOperatorId: string | null;
  fields: CallOffApproval;
}>(
  approvals: TApproval[],
  fields: CallOffApproval,
  approvedByOperatorId: string,
): TApproval | null {
  if (approvals.length === 0) return null;
  const approved = approvals[0];
  if (
    approvals.length !== 1 ||
    approved === undefined ||
    approved.approvedByOperatorId !== approvedByOperatorId ||
    !isDeepStrictEqual(approved.fields, fields)
  ) {
    throw new ApprovalConflictError();
  }
  return approved;
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

function mapCallOff(
  approved: typeof callOffs.$inferSelect,
  review: ReviewRecord,
): CallOff {
  if (review.extraction.extraction === null) {
    throw new ApprovalValidationError("Extraktionen kan inte godkännas");
  }
  return {
    artifactId: approved.artifactId,
    createdAt: approved.createdAt.toISOString(),
    extractionConfidence: approved.extractionConfidence,
    fieldConfidence: approved.fieldConfidence,
    fieldProvenance: approved.fieldProvenance,
    fields: approved.fields,
    id: approved.id,
    sourceArtifacts: [approved.artifactId],
    status: "approved",
    updatedAt: approved.updatedAt.toISOString(),
  };
}
