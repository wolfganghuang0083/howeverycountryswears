ALTER TABLE "users" ADD COLUMN "email_verified_at" timestamp;--> statement-breakpoint
UPDATE "users" SET "email_verified_at" = "created_at" WHERE "login_method" = 'github' AND "email_verified_at" IS NULL;
