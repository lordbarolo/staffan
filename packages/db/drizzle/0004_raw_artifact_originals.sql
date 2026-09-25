CREATE TABLE "raw_artifact_originals" (
	"artifact_id" text PRIMARY KEY NOT NULL,
	"content" "bytea" NOT NULL,
	"sha256" text NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "raw_artifacts" ADD COLUMN "original_available" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "raw_artifact_originals" ADD CONSTRAINT "raw_artifact_originals_artifact_id_raw_artifacts_id_fk" FOREIGN KEY ("artifact_id") REFERENCES "public"."raw_artifacts"("id") ON DELETE cascade ON UPDATE no action;