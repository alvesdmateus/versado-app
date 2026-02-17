CREATE TYPE "public"."follow_type" AS ENUM('user', 'tag');--> statement-breakpoint
CREATE TABLE "follows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"follower_id" uuid NOT NULL,
	"follow_type" "follow_type" NOT NULL,
	"followed_user_id" uuid,
	"followed_tag" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_follower_id_users_id_fk" FOREIGN KEY ("follower_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "follows" ADD CONSTRAINT "follows_followed_user_id_users_id_fk" FOREIGN KEY ("followed_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "follows_user_user_idx" ON "follows" USING btree ("follower_id","followed_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "follows_user_tag_idx" ON "follows" USING btree ("follower_id","followed_tag");