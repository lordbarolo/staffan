import type { CallOffFields, CallOffExtraction } from "@staffan/core";
import { jsonb, pgTable, real, text, timestamp } from "drizzle-orm/pg-core";

export const appMetadata = pgTable("app_metadata", {
  key: text("key").primaryKey(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  value: text("value").notNull(),
});

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

export const callOffs = pgTable("call_offs", {
  id: text("id").primaryKey(),
  artifactId: text("artifact_id")
    .notNull()
    .references(() => rawArtifacts.id),
  extractionId: text("extraction_id")
    .notNull()
    .references(() => callOffExtractions.id),
  status: text("status").notNull(),
  fields: jsonb("fields").$type<CallOffFields>().notNull(),
  extractionConfidence: real("extraction_confidence").notNull(),
  fieldConfidence: jsonb("field_confidence").$type<Record<string, number>>().notNull(),
  fieldProvenance: jsonb("field_provenance").$type<CallOffExtraction["fieldProvenance"]>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull(),
});
