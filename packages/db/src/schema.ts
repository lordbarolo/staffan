import type { CallOffFields, CallOffExtraction } from "@staffan/core";
import { sql } from "drizzle-orm";
import { boolean, index, integer, jsonb, pgTable, real, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

export const appMetadata = pgTable("app_metadata", {
  key: text("key").primaryKey(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  value: text("value").notNull(),
});

export const operators = pgTable(
  "operators",
  {
    id: text("id").primaryKey(),
    username: text("username").notNull(),
    passwordHash: text("password_hash").notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [uniqueIndex("operators_username_unique").on(table.username)],
);

export const operatorSessions = pgTable(
  "operator_sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    operatorId: text("operator_id")
      .notNull()
      .references(() => operators.id, { onDelete: "cascade" }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  },
  (table) => [index("operator_sessions_expires_at_index").on(table.expiresAt)],
);

export const rawArtifacts = pgTable("raw_artifacts", {
  id: text("id").primaryKey(),
  sourceType: text("source_type").notNull(),
  sourceSystem: text("source_system").notNull(),
  externalRef: text("external_ref"),
  fileName: text("file_name"),
  mediaType: text("media_type").notNull(),
  content: text("content").notNull(),
  sha256: text("sha256").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull(),
});

export const callOffExtractions = pgTable("call_off_extractions", {
  id: text("id").primaryKey(),
  artifactId: text("artifact_id")
    .notNull()
    .references(() => rawArtifacts.id),
  extraction: jsonb("extraction").$type<CallOffExtraction>(),
  issues: jsonb("issues").$type<string[]>().notNull(),
  modelProvider: text("model_provider").notNull(),
  modelName: text("model_name").notNull(),
  modelVersion: text("model_version").notNull(),
  status: text("status").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
});

export const callOffs = pgTable(
  "call_offs",
  {
    id: text("id").primaryKey(),
    artifactId: text("artifact_id")
      .notNull()
      .references(() => rawArtifacts.id),
    extractionId: text("extraction_id")
      .notNull()
      .references(() => callOffExtractions.id),
    approvedByOperatorId: text("approved_by_operator_id").references(() => operators.id),
    status: text("status").notNull(),
    fields: jsonb("fields").$type<CallOffFields>().notNull(),
    extractionConfidence: real("extraction_confidence").notNull(),
    fieldConfidence: jsonb("field_confidence").$type<Record<string, number>>().notNull(),
    fieldProvenance: jsonb("field_provenance").$type<CallOffExtraction["fieldProvenance"]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("call_offs_extraction_id_unique")
      .on(table.extractionId)
      .where(sql`${table.approvedByOperatorId} is not null`),
  ],
);

export const ingressDiscoveries = pgTable(
  "ingress_discoveries",
  {
    id: text("id").primaryKey(),
    sourceSystem: text("source_system").notNull(),
    sourceKey: text("source_key").notNull(),
    sourceUrl: text("source_url").notNull(),
    externalRef: text("external_ref"),
    status: text("status").notNull(),
    attemptCount: integer("attempt_count").default(0).notNull(),
    leaseExpiresAt: timestamp("lease_expires_at", { withTimezone: true }),
    extractionId: text("extraction_id").references(() => callOffExtractions.id),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
  },
  (table) => [
    uniqueIndex("ingress_discoveries_source_key_unique").on(
      table.sourceSystem,
      table.sourceKey,
    ),
  ],
);
