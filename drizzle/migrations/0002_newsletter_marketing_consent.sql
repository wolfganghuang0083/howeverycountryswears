ALTER TABLE "newsletter_subscribers" ADD COLUMN "marketing_consent" boolean DEFAULT false NOT NULL;--> statement-breakpoint
UPDATE "newsletter_subscribers" SET "marketing_consent" = true;
