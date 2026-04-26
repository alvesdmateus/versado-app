CREATE TABLE "exam_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"track_id" text NOT NULL,
	"question_count" integer NOT NULL,
	"correct_count" integer DEFAULT 0 NOT NULL,
	"passing_score" integer NOT NULL,
	"passed" boolean,
	"time_limit_seconds" integer NOT NULL,
	"time_spent_seconds" integer,
	"answers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "exam_sessions" ADD CONSTRAINT "exam_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;