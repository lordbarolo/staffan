CREATE TABLE "operator_sessions" (
	"token_hash" text PRIMARY KEY NOT NULL,
	"operator_id" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "operators" (
	"id" text PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password_hash" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone NOT NULL,
	"updated_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "call_offs" ADD COLUMN "approved_by_operator_id" text;--> statement-breakpoint
ALTER TABLE "ingress_discoveries" ADD COLUMN "lease_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "operator_sessions" ADD CONSTRAINT "operator_sessions_operator_id_operators_id_fk" FOREIGN KEY ("operator_id") REFERENCES "public"."operators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "operator_sessions_expires_at_index" ON "operator_sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "operators_username_unique" ON "operators" USING btree ("username");--> statement-breakpoint
ALTER TABLE "call_offs" ADD CONSTRAINT "call_offs_approved_by_operator_id_operators_id_fk" FOREIGN KEY ("approved_by_operator_id") REFERENCES "public"."operators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "call_offs_extraction_id_unique" ON "call_offs" USING btree ("extraction_id") WHERE "approved_by_operator_id" IS NOT NULL;
