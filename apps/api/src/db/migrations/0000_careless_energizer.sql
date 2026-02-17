CREATE TYPE "public"."deck_visibility" AS ENUM('private', 'shared', 'public', 'marketplace');--> statement-breakpoint
CREATE TYPE "public"."user_tier" AS ENUM('free', 'premium', 'team');--> statement-breakpoint
CREATE TABLE "card_progress" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"card_id" uuid NOT NULL,
	"deck_id" uuid NOT NULL,
	"ease_factor" real DEFAULT 2.5 NOT NULL,
	"interval" integer DEFAULT 0 NOT NULL,
	"repetitions" integer DEFAULT 0 NOT NULL,
	"status" text DEFAULT 'new' NOT NULL,
	"due_date" timestamp with time zone DEFAULT now() NOT NULL,
	"last_reviewed_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"tombstone" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "decks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid,
	"name" text NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"cover_image_url" text,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"visibility" "deck_visibility" DEFAULT 'private' NOT NULL,
	"settings" jsonb DEFAULT '{"newCardsPerDay":20,"reviewsPerDay":100,"algorithm":"sm2"}'::jsonb NOT NULL,
	"stats" jsonb DEFAULT '{"totalCards":0,"newCards":0,"learningCards":0,"reviewCards":0,"masteredCards":0}'::jsonb NOT NULL,
	"marketplace" jsonb DEFAULT 'null'::jsonb,
	"version" integer DEFAULT 1 NOT NULL,
	"tombstone" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "flashcards" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deck_id" uuid NOT NULL,
	"front" text NOT NULL,
	"back" text NOT NULL,
	"tags" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"difficulty" text DEFAULT 'medium' NOT NULL,
	"source" jsonb DEFAULT '{"type":"manual"}'::jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"tombstone" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "marketplace_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"deck_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"comment" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "purchases" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"buyer_id" uuid NOT NULL,
	"deck_id" uuid NOT NULL,
	"seller_id" uuid NOT NULL,
	"price_in_cents" integer NOT NULL,
	"commission_in_cents" integer NOT NULL,
	"stripe_payment_intent_id" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "refresh_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "study_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"deck_id" uuid NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"reviews" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"stats" jsonb DEFAULT '{"cardsStudied":0,"correctCount":0,"incorrectCount":0,"averageTimeMs":0}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"stripe_subscription_id" text NOT NULL,
	"stripe_price_id" text NOT NULL,
	"status" text NOT NULL,
	"current_period_start" timestamp with time zone NOT NULL,
	"current_period_end" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"tier" "user_tier" DEFAULT 'free' NOT NULL,
	"stripe_customer_id" text,
	"stripe_connect_account_id" text,
	"preferences" jsonb DEFAULT '{"darkMode":false,"themeColor":"sky","dailyGoal":50,"reminderTimes":[],"cardSortingLogic":"due_first","pushAlerts":true}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "card_progress" ADD CONSTRAINT "card_progress_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_progress" ADD CONSTRAINT "card_progress_card_id_flashcards_id_fk" FOREIGN KEY ("card_id") REFERENCES "public"."flashcards"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "card_progress" ADD CONSTRAINT "card_progress_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decks" ADD CONSTRAINT "decks_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "flashcards" ADD CONSTRAINT "flashcards_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_reviews" ADD CONSTRAINT "marketplace_reviews_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "marketplace_reviews" ADD CONSTRAINT "marketplace_reviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_buyer_id_users_id_fk" FOREIGN KEY ("buyer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "purchases" ADD CONSTRAINT "purchases_seller_id_users_id_fk" FOREIGN KEY ("seller_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "study_sessions" ADD CONSTRAINT "study_sessions_deck_id_decks_id_fk" FOREIGN KEY ("deck_id") REFERENCES "public"."decks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "card_progress_user_card_idx" ON "card_progress" USING btree ("user_id","card_id");--> statement-breakpoint
CREATE UNIQUE INDEX "marketplace_reviews_user_deck_idx" ON "marketplace_reviews" USING btree ("user_id","deck_id");