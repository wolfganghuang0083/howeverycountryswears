CREATE TABLE IF NOT EXISTS "page_hits" (
  "id" serial PRIMARY KEY,
  "ts" timestamptz NOT NULL DEFAULT now(),
  "path" text NOT NULL,
  "user_agent" text,
  "is_bot" boolean NOT NULL DEFAULT false,
  "bot_name" text,
  "country" text,
  "referer" text
);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "page_hits_ts_idx" ON "page_hits" ("ts");
