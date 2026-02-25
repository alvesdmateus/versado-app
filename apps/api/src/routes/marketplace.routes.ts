import { Hono } from "hono";
import { eq, and, sql, ilike } from "drizzle-orm";
import {
  idSchema,
  listMarketplaceSchema,
  listDeckSchema,
  createReviewSchema,
} from "@versado/validation";
import { db } from "../db";
import { decks, users, flashcards, marketplaceReviews, purchases } from "../db/schema";
import { validate } from "../lib/validate";
import { AppError } from "../middleware/error-handler";
import { requireFeature } from "../lib/feature-gates";

export const marketplaceRoutes = new Hono();

// Browse marketplace listings
marketplaceRoutes.get("/", async (c) => {
  const query = c.req.query();
  const params = validate(listMarketplaceSchema, {
    ...query,
    limit: query.limit ? Number(query.limit) : undefined,
    offset: query.offset ? Number(query.offset) : undefined,
    minRating: query.minRating ? Number(query.minRating) : undefined,
  });

  // Build conditions
  const conditions = [
    eq(decks.visibility, "marketplace"),
    eq(decks.tombstone, false),
    sql`${decks.marketplace} IS NOT NULL`,
    sql`(${decks.marketplace}->>'listed')::boolean = true`,
  ];

  if (params.search) {
    conditions.push(ilike(decks.name, `%${params.search}%`));
  }

  if (params.tag) {
    conditions.push(sql`${decks.tags} @> ${JSON.stringify([params.tag])}::jsonb`);
  }

  if (params.minRating) {
    conditions.push(
      sql`(${decks.marketplace}->>'rating')::numeric >= ${params.minRating}`
    );
  }

  // Build order by
  const orderMap = {
    newest: sql`${decks.createdAt} DESC`,
    popular: sql`(${decks.marketplace}->>'purchaseCount')::int DESC`,
    rating: sql`(${decks.marketplace}->>'rating')::numeric DESC`,
    price_asc: sql`(${decks.marketplace}->>'price')::int ASC`,
    price_desc: sql`(${decks.marketplace}->>'price')::int DESC`,
  } as const;

  const orderBy = orderMap[params.sortBy ?? "popular"];

  // Get total count
  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(decks)
    .where(and(...conditions));
  const total = countResult[0]?.count ?? 0;

  // Get listings with creator info
  const listings = await db
    .select({
      id: decks.id,
      name: decks.name,
      description: decks.description,
      coverImageUrl: decks.coverImageUrl,
      tags: decks.tags,
      marketplace: decks.marketplace,
      createdAt: decks.createdAt,
      creatorId: users.id,
      creatorName: users.displayName,
    })
    .from(decks)
    .innerJoin(users, eq(decks.ownerId, users.id))
    .where(and(...conditions))
    .orderBy(orderBy)
    .limit(params.limit ?? 20)
    .offset(params.offset ?? 0);

  const mapped = listings.map((l) => ({
    id: l.id,
    name: l.name,
    description: l.description,
    coverImageUrl: l.coverImageUrl,
    tags: l.tags,
    creator: { id: l.creatorId, displayName: l.creatorName },
    price: l.marketplace?.price ?? 0,
    rating: l.marketplace?.rating ?? 0,
    reviewCount: l.marketplace?.reviewCount ?? 0,
    purchaseCount: l.marketplace?.purchaseCount ?? 0,
    createdAt: l.createdAt,
  }));

  return c.json({ listings: mapped, total });
});

// Get marketplace listing detail
marketplaceRoutes.get("/:deckId", async (c) => {
  const deckId = validate(idSchema, c.req.param("deckId"));
  const user = c.get("user");

  const deckResults = await db
    .select({
      id: decks.id,
      name: decks.name,
      description: decks.description,
      coverImageUrl: decks.coverImageUrl,
      tags: decks.tags,
      marketplace: decks.marketplace,
      stats: decks.stats,
      createdAt: decks.createdAt,
      creatorId: users.id,
      creatorName: users.displayName,
      creatorAvatarUrl: users.avatarUrl,
    })
    .from(decks)
    .innerJoin(users, eq(decks.ownerId, users.id))
    .where(
      and(
        eq(decks.id, deckId),
        eq(decks.visibility, "marketplace"),
        eq(decks.tombstone, false),
        sql`(${decks.marketplace}->>'listed')::boolean = true`
      )
    )
    .limit(1);

  const deck = deckResults[0];
  if (!deck) throw new AppError(404, "Listing not found", "NOT_FOUND");

  const [sampleCards, reviews, purchaseCheck] = await Promise.all([
    db
      .select({ id: flashcards.id, front: flashcards.front, back: flashcards.back })
      .from(flashcards)
      .where(and(eq(flashcards.deckId, deckId), eq(flashcards.tombstone, false)))
      .limit(5),
    db
      .select({
        id: marketplaceReviews.id,
        rating: marketplaceReviews.rating,
        comment: marketplaceReviews.comment,
        createdAt: marketplaceReviews.createdAt,
        userId: users.id,
        userName: users.displayName,
        userAvatarUrl: users.avatarUrl,
      })
      .from(marketplaceReviews)
      .innerJoin(users, eq(marketplaceReviews.userId, users.id))
      .where(eq(marketplaceReviews.deckId, deckId))
      .orderBy(sql`${marketplaceReviews.createdAt} DESC`)
      .limit(20),
    db
      .select({ id: purchases.id })
      .from(purchases)
      .where(
        and(
          eq(purchases.buyerId, user.id),
          eq(purchases.deckId, deckId),
          eq(purchases.status, "completed")
        )
      )
      .limit(1),
  ]);

  return c.json({
    id: deck.id,
    name: deck.name,
    description: deck.description,
    coverImageUrl: deck.coverImageUrl,
    tags: deck.tags,
    cardCount: deck.stats.totalCards,
    price: deck.marketplace?.price ?? 0,
    rating: deck.marketplace?.rating ?? 0,
    reviewCount: deck.marketplace?.reviewCount ?? 0,
    purchaseCount: deck.marketplace?.purchaseCount ?? 0,
    createdAt: deck.createdAt,
    creator: {
      id: deck.creatorId,
      displayName: deck.creatorName,
      avatarUrl: deck.creatorAvatarUrl,
    },
    sampleCards,
    reviews,
    isOwner: deck.creatorId === user.id,
    isPurchased: purchaseCheck.length > 0,
  });
});

// Add marketplace deck to user's library (clone)
marketplaceRoutes.post("/:deckId/add-to-library", async (c) => {
  const deckId = validate(idSchema, c.req.param("deckId"));
  const user = c.get("user");

  const [sourceDeck] = await db
    .select()
    .from(decks)
    .where(
      and(
        eq(decks.id, deckId),
        eq(decks.visibility, "marketplace"),
        eq(decks.tombstone, false),
        sql`(${decks.marketplace}->>'listed')::boolean = true`
      )
    )
    .limit(1);

  if (!sourceDeck) throw new AppError(404, "Listing not found", "NOT_FOUND");
  if (sourceDeck.ownerId === user.id) {
    throw new AppError(400, "Cannot add your own deck", "OWN_DECK");
  }

  const [existing] = await db
    .select({ id: purchases.id })
    .from(purchases)
    .where(
      and(
        eq(purchases.buyerId, user.id),
        eq(purchases.deckId, deckId),
        eq(purchases.status, "completed")
      )
    )
    .limit(1);
  if (existing) {
    throw new AppError(400, "Already added to library", "ALREADY_PURCHASED");
  }

  const price = sourceDeck.marketplace?.price ?? 0;
  if (price > 0) {
    throw new AppError(400, "Paid decks are not yet supported", "PAID_NOT_SUPPORTED");
  }

  // Clone the deck
  const [clonedDeck] = await db
    .insert(decks)
    .values({
      ownerId: user.id,
      name: sourceDeck.name,
      description: sourceDeck.description,
      coverImageUrl: sourceDeck.coverImageUrl,
      tags: sourceDeck.tags,
      visibility: "private",
      settings: sourceDeck.settings,
      stats: { totalCards: 0, newCards: 0, learningCards: 0, reviewCards: 0, masteredCards: 0 },
    })
    .returning();

  // Clone flashcards
  const sourceCards = await db
    .select()
    .from(flashcards)
    .where(and(eq(flashcards.deckId, deckId), eq(flashcards.tombstone, false)));

  if (sourceCards.length > 0) {
    await db.insert(flashcards).values(
      sourceCards.map((card) => ({
        deckId: clonedDeck!.id,
        front: card.front,
        back: card.back,
        tags: card.tags,
        difficulty: card.difficulty,
        source: { type: "imported" as const, source: `marketplace:${deckId}` },
      }))
    );

    // Update cloned deck card count
    await db
      .update(decks)
      .set({
        stats: {
          totalCards: sourceCards.length,
          newCards: sourceCards.length,
          learningCards: 0,
          reviewCards: 0,
          masteredCards: 0,
        },
      })
      .where(eq(decks.id, clonedDeck!.id));
  }

  // Create purchase record
  await db.insert(purchases).values({
    buyerId: user.id,
    deckId,
    sellerId: sourceDeck.ownerId!,
    priceInCents: 0,
    commissionInCents: 0,
    status: "completed",
  });

  // Increment purchaseCount on source deck
  const currentCount = sourceDeck.marketplace?.purchaseCount ?? 0;
  await db
    .update(decks)
    .set({
      marketplace: { ...sourceDeck.marketplace!, purchaseCount: currentCount + 1 },
      updatedAt: new Date(),
    })
    .where(eq(decks.id, deckId));

  return c.json({ clonedDeckId: clonedDeck!.id }, 201);
});

// List deck on marketplace
marketplaceRoutes.patch("/:deckId/list", async (c) => {
  const user = c.get("user");
  const deckId = validate(idSchema, c.req.param("deckId"));
  const body = await c.req.json();
  const { price } = validate(listDeckSchema.omit({ deckId: true }), body);

  const [deck] = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.tombstone, false)))
    .limit(1);
  if (!deck) throw new AppError(404, "Deck not found", "NOT_FOUND");
  if (deck.ownerId !== user.id) throw new AppError(403, "Access denied", "FORBIDDEN");

  if (price > 0) {
    requireFeature(user.tier, "canListPaidDecks");
  }

  const cardCount = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(flashcards)
    .where(and(eq(flashcards.deckId, deckId), eq(flashcards.tombstone, false)));
  if ((cardCount[0]?.count ?? 0) === 0) {
    throw new AppError(400, "Deck must have at least one card", "EMPTY_DECK");
  }

  await db
    .update(decks)
    .set({
      visibility: "marketplace",
      marketplace: {
        listed: true,
        price,
        purchaseCount: deck.marketplace?.purchaseCount ?? 0,
        rating: deck.marketplace?.rating ?? 0,
        reviewCount: deck.marketplace?.reviewCount ?? 0,
      },
      updatedAt: new Date(),
      version: deck.version + 1,
    })
    .where(eq(decks.id, deckId));

  return c.json({ success: true });
});

// Unlist deck from marketplace
marketplaceRoutes.delete("/:deckId/list", async (c) => {
  const user = c.get("user");
  const deckId = validate(idSchema, c.req.param("deckId"));

  const [deck] = await db
    .select()
    .from(decks)
    .where(and(eq(decks.id, deckId), eq(decks.tombstone, false)))
    .limit(1);
  if (!deck) throw new AppError(404, "Deck not found", "NOT_FOUND");
  if (deck.ownerId !== user.id) throw new AppError(403, "Access denied", "FORBIDDEN");

  await db
    .update(decks)
    .set({
      visibility: "private",
      marketplace: deck.marketplace ? { ...deck.marketplace, listed: false } : null,
      updatedAt: new Date(),
      version: deck.version + 1,
    })
    .where(eq(decks.id, deckId));

  return c.json({ success: true });
});

// Get reviews for a marketplace listing
marketplaceRoutes.get("/:deckId/reviews", async (c) => {
  const deckId = validate(idSchema, c.req.param("deckId"));
  const query = c.req.query();
  const limit = Math.min(Number(query.limit) || 20, 50);
  const offset = Number(query.offset) || 0;

  const reviews = await db
    .select({
      id: marketplaceReviews.id,
      rating: marketplaceReviews.rating,
      comment: marketplaceReviews.comment,
      createdAt: marketplaceReviews.createdAt,
      userId: users.id,
      userName: users.displayName,
      userAvatarUrl: users.avatarUrl,
    })
    .from(marketplaceReviews)
    .innerJoin(users, eq(marketplaceReviews.userId, users.id))
    .where(eq(marketplaceReviews.deckId, deckId))
    .orderBy(sql`${marketplaceReviews.createdAt} DESC`)
    .limit(limit)
    .offset(offset);

  return c.json({ reviews });
});

// Submit a review for a marketplace listing
marketplaceRoutes.post("/:deckId/reviews", async (c) => {
  const user = c.get("user");
  const deckId = validate(idSchema, c.req.param("deckId"));
  const body = await c.req.json();
  const { rating, comment } = validate(createReviewSchema.omit({ deckId: true }), body);

  const [deck] = await db
    .select()
    .from(decks)
    .where(
      and(
        eq(decks.id, deckId),
        eq(decks.visibility, "marketplace"),
        eq(decks.tombstone, false)
      )
    )
    .limit(1);
  if (!deck) throw new AppError(404, "Listing not found", "NOT_FOUND");
  if (deck.ownerId === user.id) {
    throw new AppError(400, "Cannot review your own deck", "OWN_DECK");
  }

  const [purchase] = await db
    .select({ id: purchases.id })
    .from(purchases)
    .where(
      and(
        eq(purchases.buyerId, user.id),
        eq(purchases.deckId, deckId),
        eq(purchases.status, "completed")
      )
    )
    .limit(1);
  if (!purchase) {
    throw new AppError(400, "Must add deck to library before reviewing", "NOT_PURCHASED");
  }

  // Upsert review
  const [existingReview] = await db
    .select()
    .from(marketplaceReviews)
    .where(
      and(eq(marketplaceReviews.userId, user.id), eq(marketplaceReviews.deckId, deckId))
    )
    .limit(1);

  let review;
  if (existingReview) {
    const [updated] = await db
      .update(marketplaceReviews)
      .set({ rating, comment: comment ?? null })
      .where(eq(marketplaceReviews.id, existingReview.id))
      .returning();
    review = updated;
  } else {
    const [inserted] = await db
      .insert(marketplaceReviews)
      .values({ deckId, userId: user.id, rating, comment: comment ?? null })
      .returning();
    review = inserted;
  }

  // Recalculate deck rating
  const [ratingResult] = await db
    .select({
      avgRating: sql<number>`round(avg(${marketplaceReviews.rating})::numeric, 1)::real`,
      count: sql<number>`count(*)::int`,
    })
    .from(marketplaceReviews)
    .where(eq(marketplaceReviews.deckId, deckId));

  await db
    .update(decks)
    .set({
      marketplace: {
        ...deck.marketplace!,
        rating: ratingResult?.avgRating ?? 0,
        reviewCount: ratingResult?.count ?? 0,
      },
      updatedAt: new Date(),
    })
    .where(eq(decks.id, deckId));

  return c.json(review, 201);
});

// Delete review
marketplaceRoutes.delete("/:deckId/reviews", async (c) => {
  const user = c.get("user" as never) as { id: string };
  const deckId = validate(idSchema, c.req.param("deckId"));

  const [existing] = await db
    .select({ id: marketplaceReviews.id })
    .from(marketplaceReviews)
    .where(
      and(eq(marketplaceReviews.userId, user.id), eq(marketplaceReviews.deckId, deckId))
    )
    .limit(1);

  if (!existing) {
    throw new AppError(404, "Review not found", "NOT_FOUND");
  }

  await db.delete(marketplaceReviews).where(eq(marketplaceReviews.id, existing.id));

  // Recalculate deck rating
  const [deck] = await db
    .select({ marketplace: decks.marketplace })
    .from(decks)
    .where(eq(decks.id, deckId))
    .limit(1);

  const [ratingResult] = await db
    .select({
      avgRating: sql<number>`round(avg(${marketplaceReviews.rating})::numeric, 1)::real`,
      count: sql<number>`count(*)::int`,
    })
    .from(marketplaceReviews)
    .where(eq(marketplaceReviews.deckId, deckId));

  await db
    .update(decks)
    .set({
      marketplace: {
        ...deck!.marketplace!,
        rating: ratingResult?.avgRating ?? 0,
        reviewCount: ratingResult?.count ?? 0,
      },
      updatedAt: new Date(),
    })
    .where(eq(decks.id, deckId));

  return c.json({ success: true });
});
