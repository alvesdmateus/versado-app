import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  real,
  jsonb,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";

// Enums
export const userTierEnum = pgEnum("user_tier", ["free", "fluent"]);
export const followTypeEnum = pgEnum("follow_type", ["user", "tag"]);
export const deckVisibilityEnum = pgEnum("deck_visibility", [
  "private",
  "shared",
  "public",
  "marketplace",
]);

// Users
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash"),
  googleId: text("google_id").unique(),
  displayName: text("display_name").notNull(),
  avatarUrl: text("avatar_url"),
  emailVerified: boolean("email_verified").notNull().default(false),
  tier: userTierEnum("tier").notNull().default("free"),
  stripeCustomerId: text("stripe_customer_id"),
  stripeConnectAccountId: text("stripe_connect_account_id"),
  aiGenerationsUsed: integer("ai_generations_used").notNull().default(0),
  preferences: jsonb("preferences")
    .$type<{
      darkMode: boolean;
      themeColor: string;
      dailyGoal: number;
      reminderTimes: string[];
      cardSortingLogic: "due_first" | "random" | "difficulty";
      pushAlerts: boolean;
      favoriteDeckIds: string[];
    }>()
    .notNull()
    .default({
      darkMode: false,
      themeColor: "sky",
      dailyGoal: 50,
      reminderTimes: [],
      cardSortingLogic: "due_first",
      pushAlerts: true,
      favoriteDeckIds: [],
    }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Refresh tokens for JWT rotation
export const refreshTokens = pgTable("refresh_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  revokedAt: timestamp("revoked_at", { withTimezone: true }),
});

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Email verification tokens
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  tokenHash: text("token_hash").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Decks
export const decks = pgTable("decks", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerId: uuid("owner_id").references(() => users.id, {
    onDelete: "set null",
  }),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  coverImageUrl: text("cover_image_url"),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  visibility: deckVisibilityEnum("visibility").notNull().default("private"),
  settings: jsonb("settings")
    .$type<{
      newCardsPerDay: number;
      reviewsPerDay: number;
      algorithm: "sm2" | "fsrs";
    }>()
    .notNull()
    .default({ newCardsPerDay: 20, reviewsPerDay: 100, algorithm: "sm2" }),
  stats: jsonb("stats")
    .$type<{
      totalCards: number;
      newCards: number;
      learningCards: number;
      reviewCards: number;
      masteredCards: number;
    }>()
    .notNull()
    .default({
      totalCards: 0,
      newCards: 0,
      learningCards: 0,
      reviewCards: 0,
      masteredCards: 0,
    }),
  marketplace: jsonb("marketplace")
    .$type<{
      listed: boolean;
      price: number;
      purchaseCount: number;
      rating: number;
      reviewCount: number;
    } | null>()
    .default(null),
  version: integer("version").notNull().default(1),
  tombstone: boolean("tombstone").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Flashcards
export const flashcards = pgTable("flashcards", {
  id: uuid("id").primaryKey().defaultRandom(),
  deckId: uuid("deck_id")
    .notNull()
    .references(() => decks.id, { onDelete: "cascade" }),
  front: text("front").notNull(),
  back: text("back").notNull(),
  tags: jsonb("tags").$type<string[]>().notNull().default([]),
  difficulty: text("difficulty").notNull().default("medium"),
  source: jsonb("source")
    .$type<
      | { type: "manual" }
      | { type: "ai"; prompt?: string }
      | { type: "imported"; source: string }
    >()
    .notNull()
    .default({ type: "manual" }),
  version: integer("version").notNull().default(1),
  tombstone: boolean("tombstone").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Card progress (per-user SM-2 state)
export const cardProgress = pgTable(
  "card_progress",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    cardId: uuid("card_id")
      .notNull()
      .references(() => flashcards.id, { onDelete: "cascade" }),
    deckId: uuid("deck_id")
      .notNull()
      .references(() => decks.id, { onDelete: "cascade" }),
    easeFactor: real("ease_factor").notNull().default(2.5),
    interval: integer("interval").notNull().default(0),
    repetitions: integer("repetitions").notNull().default(0),
    status: text("status").notNull().default("new"),
    dueDate: timestamp("due_date", { withTimezone: true })
      .notNull()
      .defaultNow(),
    lastReviewedAt: timestamp("last_reviewed_at", { withTimezone: true }),
    version: integer("version").notNull().default(1),
    tombstone: boolean("tombstone").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("card_progress_user_card_idx").on(table.userId, table.cardId)]
);

// Study sessions
export const studySessions = pgTable("study_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  deckId: uuid("deck_id")
    .notNull()
    .references(() => decks.id, { onDelete: "cascade" }),
  startedAt: timestamp("started_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  endedAt: timestamp("ended_at", { withTimezone: true }),
  reviews: jsonb("reviews")
    .$type<
      Array<{
        id: string;
        cardId: string;
        rating: 1 | 2 | 3 | 4;
        responseTimeMs: number;
        reviewedAt: string;
      }>
    >()
    .notNull()
    .default([]),
  stats: jsonb("stats")
    .$type<{
      cardsStudied: number;
      correctCount: number;
      incorrectCount: number;
      averageTimeMs: number;
    }>()
    .notNull()
    .default({
      cardsStudied: 0,
      correctCount: 0,
      incorrectCount: 0,
      averageTimeMs: 0,
    }),
});

// Marketplace purchases
export const purchases = pgTable("purchases", {
  id: uuid("id").primaryKey().defaultRandom(),
  buyerId: uuid("buyer_id")
    .notNull()
    .references(() => users.id),
  deckId: uuid("deck_id")
    .notNull()
    .references(() => decks.id),
  sellerId: uuid("seller_id")
    .notNull()
    .references(() => users.id),
  priceInCents: integer("price_in_cents").notNull(),
  commissionInCents: integer("commission_in_cents").notNull(),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Subscriptions
export const subscriptions = pgTable("subscriptions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  stripeSubscriptionId: text("stripe_subscription_id").notNull(),
  stripePriceId: text("stripe_price_id").notNull(),
  status: text("status").notNull(),
  currentPeriodStart: timestamp("current_period_start", {
    withTimezone: true,
  }).notNull(),
  currentPeriodEnd: timestamp("current_period_end", {
    withTimezone: true,
  }).notNull(),
  cancelAtPeriodEnd: boolean("cancel_at_period_end").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// Marketplace reviews
export const marketplaceReviews = pgTable(
  "marketplace_reviews",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    deckId: uuid("deck_id")
      .notNull()
      .references(() => decks.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    rating: integer("rating").notNull(),
    comment: text("comment"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [uniqueIndex("marketplace_reviews_user_deck_idx").on(table.userId, table.deckId)]
);

// Social follows (user-follows-user and user-follows-tag)
export const follows = pgTable(
  "follows",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    followerId: uuid("follower_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    followType: followTypeEnum("follow_type").notNull(),
    followedUserId: uuid("followed_user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    followedTag: text("followed_tag"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    uniqueIndex("follows_user_user_idx").on(
      table.followerId,
      table.followedUserId
    ),
    uniqueIndex("follows_user_tag_idx").on(
      table.followerId,
      table.followedTag
    ),
  ]
);
