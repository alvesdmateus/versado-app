import { Hono } from "hono";
import { eq, and, sql, inArray } from "drizzle-orm";
import {
  idSchema,
  followTagSchema,
  feedQuerySchema,
  popularDecksQuerySchema,
  paginationSchema,
} from "@flashcard/validation";
import { db } from "../db";
import { decks, users, follows } from "../db/schema";
import { validate } from "../lib/validate";
import { AppError } from "../middleware/error-handler";

export const socialRoutes = new Hono();

// ─── Follow / Unfollow ──────────────────────────────────────────────

// Follow a user
socialRoutes.post("/follow/user/:userId", async (c) => {
  const me = c.get("user");
  const targetId = validate(idSchema, c.req.param("userId"));

  if (targetId === me.id) {
    throw new AppError(400, "Cannot follow yourself", "SELF_FOLLOW");
  }

  // Check target exists
  const [target] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, targetId))
    .limit(1);
  if (!target) throw new AppError(404, "User not found", "NOT_FOUND");

  // Upsert (ignore conflict)
  await db
    .insert(follows)
    .values({
      followerId: me.id,
      followType: "user",
      followedUserId: targetId,
    })
    .onConflictDoNothing();

  return c.json({ success: true });
});

// Unfollow a user
socialRoutes.delete("/follow/user/:userId", async (c) => {
  const me = c.get("user");
  const targetId = validate(idSchema, c.req.param("userId"));

  await db
    .delete(follows)
    .where(
      and(
        eq(follows.followerId, me.id),
        eq(follows.followType, "user"),
        eq(follows.followedUserId, targetId)
      )
    );

  return c.json({ success: true });
});

// Follow a tag
socialRoutes.post("/follow/tag", async (c) => {
  const me = c.get("user");
  const body = await c.req.json();
  const { tag } = validate(followTagSchema, body);

  await db
    .insert(follows)
    .values({
      followerId: me.id,
      followType: "tag",
      followedTag: tag.toLowerCase(),
    })
    .onConflictDoNothing();

  return c.json({ success: true });
});

// Unfollow a tag
socialRoutes.delete("/follow/tag/:tag", async (c) => {
  const me = c.get("user");
  const tag = decodeURIComponent(c.req.param("tag")).toLowerCase();

  await db
    .delete(follows)
    .where(
      and(
        eq(follows.followerId, me.id),
        eq(follows.followType, "tag"),
        eq(follows.followedTag, tag)
      )
    );

  return c.json({ success: true });
});

// Get current user's follows
socialRoutes.get("/following", async (c) => {
  const me = c.get("user");

  const allFollows = await db
    .select({
      followType: follows.followType,
      followedUserId: follows.followedUserId,
      followedTag: follows.followedTag,
      createdAt: follows.createdAt,
    })
    .from(follows)
    .where(eq(follows.followerId, me.id))
    .orderBy(sql`${follows.createdAt} DESC`);

  // Get user details for followed users
  const userIds = allFollows
    .filter((f) => f.followType === "user" && f.followedUserId)
    .map((f) => f.followedUserId!);

  let userMap = new Map<
    string,
    { displayName: string; avatarUrl: string | null }
  >();
  if (userIds.length > 0) {
    const userDetails = await db
      .select({
        id: users.id,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(inArray(users.id, userIds));
    for (const u of userDetails) {
      userMap.set(u.id, {
        displayName: u.displayName,
        avatarUrl: u.avatarUrl,
      });
    }
  }

  return c.json({
    users: allFollows
      .filter((f) => f.followType === "user" && f.followedUserId)
      .map((f) => ({
        id: f.followedUserId!,
        displayName: userMap.get(f.followedUserId!)?.displayName ?? "Unknown",
        avatarUrl: userMap.get(f.followedUserId!)?.avatarUrl ?? null,
        followedAt: f.createdAt,
      })),
    tags: allFollows
      .filter((f) => f.followType === "tag" && f.followedTag)
      .map((f) => ({
        tag: f.followedTag!,
        followedAt: f.createdAt,
      })),
  });
});

// ─── Feed & Discovery ───────────────────────────────────────────────

// Activity feed: recent marketplace/public decks from followed users/tags
socialRoutes.get("/feed", async (c) => {
  const me = c.get("user");
  const query = c.req.query();
  const params = validate(feedQuerySchema, {
    ...query,
    limit: query.limit ? Number(query.limit) : undefined,
    offset: query.offset ? Number(query.offset) : undefined,
  });

  const limit = params.limit ?? 20;
  const offset = params.offset ?? 0;

  // Build filter condition based on filter type
  let followCondition;
  if (params.filter === "users") {
    followCondition = sql`
      ${decks.ownerId} IN (
        SELECT followed_user_id FROM follows
        WHERE follower_id = ${me.id} AND follow_type = 'user'
      )
    `;
  } else if (params.filter === "tags") {
    followCondition = sql`
      EXISTS (
        SELECT 1 FROM follows f
        WHERE f.follower_id = ${me.id}
          AND f.follow_type = 'tag'
          AND ${decks.tags} @> jsonb_build_array(f.followed_tag)
      )
    `;
  } else {
    followCondition = sql`
      (
        ${decks.ownerId} IN (
          SELECT followed_user_id FROM follows
          WHERE follower_id = ${me.id} AND follow_type = 'user'
        )
        OR EXISTS (
          SELECT 1 FROM follows f
          WHERE f.follower_id = ${me.id}
            AND f.follow_type = 'tag'
            AND ${decks.tags} @> jsonb_build_array(f.followed_tag)
        )
      )
    `;
  }

  const items = await db
    .select({
      id: decks.id,
      name: decks.name,
      description: decks.description,
      coverImageUrl: decks.coverImageUrl,
      tags: decks.tags,
      stats: decks.stats,
      visibility: decks.visibility,
      marketplace: decks.marketplace,
      updatedAt: decks.updatedAt,
      creatorId: users.id,
      creatorName: users.displayName,
      creatorAvatarUrl: users.avatarUrl,
    })
    .from(decks)
    .innerJoin(users, eq(decks.ownerId, users.id))
    .where(
      and(
        eq(decks.tombstone, false),
        sql`${decks.visibility} IN ('marketplace', 'public')`,
        followCondition
      )
    )
    .orderBy(sql`${decks.updatedAt} DESC`)
    .limit(limit + 1)
    .offset(offset);

  const hasMore = items.length > limit;
  const pageItems = items.slice(0, limit);

  // Determine match reason for each item
  const followedUserIds = new Set<string>();
  const followedTags = new Set<string>();

  const myFollows = await db
    .select({
      followType: follows.followType,
      followedUserId: follows.followedUserId,
      followedTag: follows.followedTag,
    })
    .from(follows)
    .where(eq(follows.followerId, me.id));

  for (const f of myFollows) {
    if (f.followType === "user" && f.followedUserId)
      followedUserIds.add(f.followedUserId);
    if (f.followType === "tag" && f.followedTag)
      followedTags.add(f.followedTag);
  }

  const mapped = pageItems.map((item) => {
    const isFollowedUser = followedUserIds.has(item.creatorId);
    const matchedTag = item.tags.find((t: string) =>
      followedTags.has(t.toLowerCase())
    );

    return {
      type: "deck_published" as const,
      deck: {
        id: item.id,
        name: item.name,
        description: item.description,
        coverImageUrl: item.coverImageUrl,
        tags: item.tags,
        cardCount: item.stats.totalCards,
        marketplace: item.marketplace,
        updatedAt: item.updatedAt,
      },
      creator: {
        id: item.creatorId,
        displayName: item.creatorName,
        avatarUrl: item.creatorAvatarUrl,
      },
      matchReason: isFollowedUser
        ? ("followed_user" as const)
        : ("followed_tag" as const),
      matchedTag: matchedTag ?? undefined,
    };
  });

  return c.json({ items: mapped, hasMore });
});

// Popular decks
socialRoutes.get("/popular", async (c) => {
  const query = c.req.query();
  const params = validate(popularDecksQuerySchema, {
    ...query,
    limit: query.limit ? Number(query.limit) : undefined,
    offset: query.offset ? Number(query.offset) : undefined,
  });

  const limit = params.limit ?? 10;

  // Period filter
  let periodCondition = sql`true`;
  if (params.period === "week") {
    periodCondition = sql`${decks.updatedAt} >= NOW() - INTERVAL '7 days'`;
  } else if (params.period === "month") {
    periodCondition = sql`${decks.updatedAt} >= NOW() - INTERVAL '30 days'`;
  }

  const items = await db
    .select({
      id: decks.id,
      name: decks.name,
      description: decks.description,
      coverImageUrl: decks.coverImageUrl,
      tags: decks.tags,
      marketplace: decks.marketplace,
      creatorId: users.id,
      creatorName: users.displayName,
    })
    .from(decks)
    .innerJoin(users, eq(decks.ownerId, users.id))
    .where(
      and(
        eq(decks.visibility, "marketplace"),
        eq(decks.tombstone, false),
        sql`${decks.marketplace} IS NOT NULL`,
        sql`(${decks.marketplace}->>'listed')::boolean = true`,
        periodCondition
      )
    )
    .orderBy(sql`(${decks.marketplace}->>'purchaseCount')::int DESC`)
    .limit(limit);

  return c.json({
    decks: items.map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      coverImageUrl: d.coverImageUrl,
      tags: d.tags,
      creator: { id: d.creatorId, displayName: d.creatorName },
      price: d.marketplace?.price ?? 0,
      rating: d.marketplace?.rating ?? 0,
      purchaseCount: d.marketplace?.purchaseCount ?? 0,
    })),
  });
});

// Recommendations based on followed tags
socialRoutes.get("/recommendations", async (c) => {
  const me = c.get("user");
  const query = c.req.query();
  const params = validate(paginationSchema, {
    limit: query.limit ? Number(query.limit) : undefined,
    offset: query.offset ? Number(query.offset) : undefined,
  });

  const limit = params.limit ?? 10;
  const offset = params.offset ?? 0;

  const items = await db
    .select({
      id: decks.id,
      name: decks.name,
      description: decks.description,
      coverImageUrl: decks.coverImageUrl,
      tags: decks.tags,
      marketplace: decks.marketplace,
      creatorId: users.id,
      creatorName: users.displayName,
      tagMatchCount: sql<number>`COUNT(*)::int`,
    })
    .from(decks)
    .innerJoin(users, eq(decks.ownerId, users.id))
    .innerJoin(
      follows,
      and(
        eq(follows.followerId, me.id),
        eq(follows.followType, "tag"),
        sql`${decks.tags} @> jsonb_build_array(${follows.followedTag})`
      )
    )
    .where(
      and(
        eq(decks.visibility, "marketplace"),
        eq(decks.tombstone, false),
        sql`${decks.marketplace} IS NOT NULL`,
        sql`(${decks.marketplace}->>'listed')::boolean = true`,
        sql`${decks.ownerId} != ${me.id}`,
        sql`${decks.id} NOT IN (
          SELECT deck_id FROM purchases WHERE buyer_id = ${me.id} AND status = 'completed'
        )`
      )
    )
    .groupBy(decks.id, users.id, users.displayName)
    .orderBy(
      sql`COUNT(*) DESC`,
      sql`(${decks.marketplace}->>'purchaseCount')::int DESC`
    )
    .limit(limit)
    .offset(offset);

  return c.json({
    decks: items.map((d) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      coverImageUrl: d.coverImageUrl,
      tags: d.tags,
      creator: { id: d.creatorId, displayName: d.creatorName },
      price: d.marketplace?.price ?? 0,
      rating: d.marketplace?.rating ?? 0,
      purchaseCount: d.marketplace?.purchaseCount ?? 0,
    })),
  });
});

// Suggested creators
socialRoutes.get("/suggested-creators", async (c) => {
  const me = c.get("user");
  const query = c.req.query();
  const limit = Math.min(Number(query.limit) || 6, 20);

  // Get followed tags
  const myTagFollows = await db
    .select({ tag: follows.followedTag })
    .from(follows)
    .where(
      and(eq(follows.followerId, me.id), eq(follows.followType, "tag"))
    );

  const followedTags = myTagFollows
    .map((f) => f.tag)
    .filter((t): t is string => t !== null);

  // If no tags followed, fall back to creators with most marketplace decks
  let creators;
  if (followedTags.length === 0) {
    creators = await db
      .select({
        id: users.id,
        displayName: users.displayName,
        avatarUrl: users.avatarUrl,
        deckCount: sql<number>`COUNT(DISTINCT ${decks.id})::int`,
      })
      .from(users)
      .innerJoin(
        decks,
        and(
          eq(decks.ownerId, users.id),
          eq(decks.visibility, "marketplace"),
          eq(decks.tombstone, false),
          sql`(${decks.marketplace}->>'listed')::boolean = true`
        )
      )
      .where(
        and(
          sql`${users.id} != ${me.id}`,
          sql`${users.id} NOT IN (
            SELECT followed_user_id FROM follows
            WHERE follower_id = ${me.id} AND follow_type = 'user' AND followed_user_id IS NOT NULL
          )`
        )
      )
      .groupBy(users.id)
      .orderBy(sql`COUNT(DISTINCT ${decks.id}) DESC`)
      .limit(limit);

    return c.json({
      creators: creators.map((cr) => ({
        id: cr.id,
        displayName: cr.displayName,
        avatarUrl: cr.avatarUrl,
        marketplaceDeckCount: cr.deckCount,
        matchingTags: [],
      })),
    });
  }

  // With followed tags: find creators whose decks match
  creators = await db
    .select({
      id: users.id,
      displayName: users.displayName,
      avatarUrl: users.avatarUrl,
      deckCount: sql<number>`COUNT(DISTINCT ${decks.id})::int`,
    })
    .from(users)
    .innerJoin(
      decks,
      and(
        eq(decks.ownerId, users.id),
        eq(decks.visibility, "marketplace"),
        eq(decks.tombstone, false),
        sql`(${decks.marketplace}->>'listed')::boolean = true`
      )
    )
    .innerJoin(
      follows,
      and(
        eq(follows.followerId, me.id),
        eq(follows.followType, "tag"),
        sql`${decks.tags} @> jsonb_build_array(${follows.followedTag})`
      )
    )
    .where(
      and(
        sql`${users.id} != ${me.id}`,
        sql`${users.id} NOT IN (
          SELECT followed_user_id FROM follows
          WHERE follower_id = ${me.id} AND follow_type = 'user' AND followed_user_id IS NOT NULL
        )`
      )
    )
    .groupBy(users.id)
    .orderBy(sql`COUNT(DISTINCT ${decks.id}) DESC`)
    .limit(limit);

  // Get matching tags for each creator
  const creatorIds = creators.map((cr) => cr.id);
  let creatorTagMap = new Map<string, string[]>();

  if (creatorIds.length > 0) {
    const creatorDecks = await db
      .select({ ownerId: decks.ownerId, tags: decks.tags })
      .from(decks)
      .where(
        and(
          inArray(decks.ownerId, creatorIds),
          eq(decks.visibility, "marketplace"),
          eq(decks.tombstone, false)
        )
      );

    const followedTagSet = new Set(followedTags);
    for (const d of creatorDecks) {
      if (!d.ownerId) continue;
      const matching = d.tags.filter((t: string) =>
        followedTagSet.has(t.toLowerCase())
      );
      const existing = creatorTagMap.get(d.ownerId) ?? [];
      creatorTagMap.set(
        d.ownerId,
        [...new Set([...existing, ...matching])]
      );
    }
  }

  return c.json({
    creators: creators.map((cr) => ({
      id: cr.id,
      displayName: cr.displayName,
      avatarUrl: cr.avatarUrl,
      marketplaceDeckCount: cr.deckCount,
      matchingTags: creatorTagMap.get(cr.id) ?? [],
    })),
  });
});

// Trending tags
socialRoutes.get("/trending-tags", async (c) => {
  const result = await db.execute<{ tag: string; count: number }>(sql`
    SELECT tag, COUNT(*)::int as count
    FROM decks, jsonb_array_elements_text(tags) AS tag
    WHERE visibility = 'marketplace' AND tombstone = false
    GROUP BY tag
    ORDER BY count DESC
    LIMIT 20
  `);

  const tags = Array.from(result).map((r) => ({
    tag: r.tag,
    count: r.count,
  }));

  return c.json({ tags });
});
