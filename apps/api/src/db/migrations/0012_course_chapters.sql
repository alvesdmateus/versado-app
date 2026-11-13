CREATE TABLE "learning_chapters" (
	"id" text PRIMARY KEY NOT NULL,
	"track_id" text NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"title" text NOT NULL,
	"subtitle" text NOT NULL,
	"description" text NOT NULL,
	"status" text DEFAULT 'draft' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "learning_modules" ADD COLUMN "chapter_id" text;
--> statement-breakpoint
-- Move the existing course in place: module ids and module_progress rows survive.
INSERT INTO "learning_tracks" ("id", "domain", "title", "subtitle", "description", "icon", "color_token", "position", "status")
SELECT 'mathematics', "domain", 'Mathematics',
  'Learn mathematics by seeing, moving and predicting.',
  'Build intuition for algebra with shapes and the coordinate plane: areas become products, squares reveal identities, and equations become lines that meet.',
  "icon", "color_token", 0, "status"
FROM "learning_tracks" WHERE "id" = 'math-algebra-geometry'
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
INSERT INTO "learning_chapters" ("id", "track_id", "position", "title", "subtitle", "description", "status")
SELECT 'math-algebra', 'mathematics', 0, 'Algebra',
  'Algebra through geometry: see it, move it, predict it — then write it.',
  'Build algebraic intuition through shapes and the coordinate plane.', 'published'
WHERE EXISTS (SELECT 1 FROM "learning_tracks" WHERE "id" = 'math-algebra-geometry')
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint
UPDATE "learning_modules" SET "track_id" = 'mathematics', "chapter_id" = 'math-algebra'
WHERE "track_id" = 'math-algebra-geometry';
--> statement-breakpoint
UPDATE "users"
SET "preferences" = jsonb_set("preferences", '{activeLearningTrackId}', '"mathematics"'::jsonb)
WHERE "preferences" ->> 'activeLearningTrackId' = 'math-algebra-geometry'
  AND EXISTS (SELECT 1 FROM "learning_tracks" WHERE "id" = 'math-algebra-geometry');
--> statement-breakpoint
-- All modules have moved before deleting the old parent (which cascades).
DELETE FROM "learning_tracks" WHERE "id" = 'math-algebra-geometry';
--> statement-breakpoint
ALTER TABLE "learning_modules" ALTER COLUMN "chapter_id" SET NOT NULL;
--> statement-breakpoint
ALTER TABLE "learning_chapters" ADD CONSTRAINT "learning_chapters_track_id_learning_tracks_id_fk" FOREIGN KEY ("track_id") REFERENCES "public"."learning_tracks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "learning_chapters_track_idx" ON "learning_chapters" USING btree ("track_id","position");--> statement-breakpoint
ALTER TABLE "learning_modules" ADD CONSTRAINT "learning_modules_chapter_id_learning_chapters_id_fk" FOREIGN KEY ("chapter_id") REFERENCES "public"."learning_chapters"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "learning_modules_chapter_idx" ON "learning_modules" USING btree ("chapter_id","position");