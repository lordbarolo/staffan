CREATE TABLE "raw_artifacts" (
	"id" text PRIMARY KEY NOT NULL,
	"source_type" text NOT NULL,
	"source_system" text NOT NULL,
	"external_ref" text,
	"file_name" text,
	"media_type" text NOT NULL,
	"content" text NOT NULL,
	"sha256" text NOT NULL,
	"received_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "call_off_extractions" (
	"id" text PRIMARY KEY NOT NULL,
	"artifact_id" text NOT NULL,
	"extraction" jsonb,
	"issues" jsonb NOT NULL,
	"model_provider" text NOT NULL,
	"model_name" text NOT NULL,
	"model_version" text NOT NULL,
	"status" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "call_offs" (
	"id" text PRIMARY KEY NOT NULL,
	"artifact_id" text NOT NULL,
	"extraction_id" text NOT NULL,
	"status" text NOT NULL,
	"fields" jsonb NOT NULL,
	"extraction_confidence" real NOT NULL,
	"field_confidence" jsonb NOT NULL,
	"field_provenance" jsonb NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "call_off_extractions" ADD CONSTRAINT "call_off_extractions_artifact_id_raw_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."raw_artifacts"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "call_offs" ADD CONSTRAINT "call_offs_artifact_id_raw_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."raw_artifacts"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "call_offs" ADD CONSTRAINT "call_offs_extraction_id_call_off_extractions_id_fk" FOREIGN KEY ("extraction_id") REFERENCES "public"."call_off_extractions"("id") ON DELETE no action ON UPDATE no action;
