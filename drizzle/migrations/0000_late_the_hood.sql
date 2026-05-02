CREATE TYPE "public"."badge_type" AS ENUM('explorer', 'polyglot', 'bookOwner', 'swearMaster', 'ambassador');--> statement-breakpoint
CREATE TYPE "public"."member_tier" AS ENUM('regular', 'bookBuyer');--> statement-breakpoint
CREATE TYPE "public"."points_reason" AS ENUM('daily_login', 'rate_card', 'submit_ugc', 'ugc_five_star', 'ugc_weekly_rank');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."submission_status" AS ENUM('pending', 'approved', 'rejected');--> statement-breakpoint
CREATE TABLE "book_codes" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(32) NOT NULL,
	"is_used" boolean DEFAULT false NOT NULL,
	"used_by_user_id" integer,
	"used_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "book_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "country_ambassadors" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"country_slug" varchar(100) NOT NULL,
	"country_name" varchar(100) NOT NULL,
	"country_flag" varchar(10) DEFAULT '🏳️' NOT NULL,
	"assigned_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "country_ambassadors_country_slug_unique" UNIQUE("country_slug")
);
--> statement-breakpoint
CREATE TABLE "points_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"amount" integer NOT NULL,
	"reason" "points_reason" NOT NULL,
	"reference_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"country_slug" varchar(100) NOT NULL,
	"card_number" integer NOT NULL,
	"value" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "reviews" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"country_slug" varchar(100) NOT NULL,
	"card_number" integer NOT NULL,
	"content" text NOT NULL,
	"rating" integer NOT NULL,
	"author_name" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "submissions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"country_name" varchar(100) NOT NULL,
	"country_flag" varchar(10) DEFAULT '🏳️' NOT NULL,
	"phrase" varchar(500) NOT NULL,
	"ipa" varchar(500),
	"literal" varchar(500),
	"feels_like" text,
	"phrase_type" varchar(100),
	"lang_code" varchar(10),
	"risk_level" integer DEFAULT 2 NOT NULL,
	"status" "submission_status" DEFAULT 'pending' NOT NULL,
	"rejection_reason" text,
	"vote_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_badges" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"badge_type" "badge_type" NOT NULL,
	"country_slug" varchar(100),
	"earned_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"open_id" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"avatar_url" text,
	"login_method" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"member_tier" "member_tier" DEFAULT 'regular' NOT NULL,
	"display_name" varchar(100),
	"points" integer DEFAULT 0 NOT NULL,
	"last_daily_bonus" timestamp,
	"countries_visited" integer DEFAULT 0 NOT NULL,
	"phrases_listened" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"last_signed_in" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_open_id_unique" UNIQUE("open_id")
);
--> statement-breakpoint
CREATE TABLE "votes" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"submission_id" integer NOT NULL,
	"value" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "ratings_user_country_card_idx" ON "ratings" USING btree ("user_id","country_slug","card_number");--> statement-breakpoint
CREATE UNIQUE INDEX "votes_user_submission_idx" ON "votes" USING btree ("user_id","submission_id");