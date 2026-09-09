CREATE TABLE "ingress_discoveries" (
	"id" text PRIMARY KEY NOT NULL,
	"source_system" text NOT NULL,
	"source_key" text NOT NULL,
	"source_url" text NOT NULL,
	"external_ref" text,
	"status" text NOT NULL,
	"attempt_count" integer DEFAULT 0 NOT NULL,
	"extraction_id" text,
	"last_error" text,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ingress_discoveries" ADD CONSTRAINT "ingress_discoveries_extraction_id_call_off_extractions_id_fk" FOREIGN KEY ("extraction_id") REFERENCES "public"."call_off_extractions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ingress_discoveries_source_key_unique" ON "ingress_discoveries" USING btree ("source_system","source_key");