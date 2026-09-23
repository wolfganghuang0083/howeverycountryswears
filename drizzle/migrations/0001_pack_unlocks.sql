CREATE TABLE IF NOT EXISTS "pack_unlocks" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"unlock_id" varchar(64) NOT NULL,
	"recur_event_id" varchar(128) NOT NULL,
	"transaction_id" varchar(128),
	"product_id" varchar(128),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pack_unlocks_recur_event_id_idx" ON "pack_unlocks" USING btree ("recur_event_id");
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "pack_unlocks_user_unlock_idx" ON "pack_unlocks" USING btree ("user_id","unlock_id");
