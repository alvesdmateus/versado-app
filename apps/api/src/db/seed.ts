import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import bcrypt from "bcrypt";
import { eq, inArray } from "drizzle-orm";
import {
  users,
  refreshTokens,
  decks,
  flashcards,
  cardProgress,
  studySessions,
  purchases,
  subscriptions,
  marketplaceReviews,
  follows,
} from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL environment variable is required");
  process.exit(1);
}

const client = postgres(DATABASE_URL, { max: 1 });
const db = drizzle(client);

const SEED_EMAILS = [
  "alice@seed.versado.dev",
  "bob@seed.versado.dev",
];

const PASSWORD = "Password1!";

async function cleanup() {
  console.log("Cleaning up previous seed data...");

  const seedUsers = await db
    .select({ id: users.id })
    .from(users)
    .where(inArray(users.email, SEED_EMAILS));

  if (seedUsers.length === 0) {
    console.log("No previous seed data found.");
    return;
  }

  const userIds = seedUsers.map((u) => u.id);

  // Delete in FK-safe order
  await db.delete(follows).where(inArray(follows.followerId, userIds));
  await db
    .delete(marketplaceReviews)
    .where(inArray(marketplaceReviews.userId, userIds));
  await db.delete(purchases).where(inArray(purchases.buyerId, userIds));
  await db.delete(subscriptions).where(inArray(subscriptions.userId, userIds));

  // Get all decks owned by seed users to delete related data
  const seedDecks = await db
    .select({ id: decks.id })
    .from(decks)
    .where(inArray(decks.ownerId, userIds));

  if (seedDecks.length > 0) {
    const deckIds = seedDecks.map((d) => d.id);
    await db.delete(studySessions).where(inArray(studySessions.deckId, deckIds));
    await db.delete(cardProgress).where(inArray(cardProgress.deckId, deckIds));
    await db.delete(flashcards).where(inArray(flashcards.deckId, deckIds));
    await db.delete(decks).where(inArray(decks.id, deckIds));
  }

  await db.delete(refreshTokens).where(inArray(refreshTokens.userId, userIds));
  await db.delete(users).where(inArray(users.id, userIds));

  console.log(`Cleaned up ${userIds.length} seed users and their data.`);
}

async function seed() {
  const passwordHash = await bcrypt.hash(PASSWORD, 4);

  // --- Users ---
  console.log("Creating seed users...");
  const aliceRows = await db
    .insert(users)
    .values({
      email: "alice@seed.versado.dev",
      passwordHash,
      displayName: "Alice",
      emailVerified: true,
      tier: "free",
      preferences: {
        darkMode: false,
        themeColor: "sky",
        dailyGoal: 25,
        reminderTimes: ["09:00"],
        cardSortingLogic: "due_first",
        pushAlerts: true,
        favoriteDeckIds: [],
      },
    })
    .returning();
  const alice = aliceRows[0]!;

  const bobRows = await db
    .insert(users)
    .values({
      email: "bob@seed.versado.dev",
      passwordHash,
      displayName: "Bob",
      emailVerified: true,
      tier: "fluent",
      preferences: {
        darkMode: true,
        themeColor: "violet",
        dailyGoal: 50,
        reminderTimes: ["08:00", "20:00"],
        cardSortingLogic: "due_first",
        pushAlerts: true,
        favoriteDeckIds: [],
      },
    })
    .returning();
  const bob = bobRows[0]!;

  // --- Decks ---
  console.log("Creating decks...");

  const aliceDeckData = [
    {
      name: "Spanish Vocabulary",
      description: "Essential Spanish words and phrases for beginners",
      tags: ["language", "spanish"],
    },
    {
      name: "JavaScript Concepts",
      description: "Core JavaScript concepts every developer should know",
      tags: ["programming", "javascript"],
    },
    {
      name: "World Capitals",
      description: "Capital cities of countries around the world",
      tags: ["geography"],
    },
  ];

  const bobDeckData = [
    {
      name: "React Hooks",
      description: "Master React hooks with practical examples",
      tags: ["programming", "react"],
    },
    {
      name: "French Phrases",
      description: "Everyday French phrases for travelers and learners",
      tags: ["language", "french"],
    },
    {
      name: "AWS Services",
      description: "Key AWS services and their use cases",
      tags: ["cloud", "aws"],
    },
    {
      name: "Design Patterns",
      description: "Common software design patterns with real-world examples",
      tags: ["programming", "architecture"],
    },
  ];

  const aliceDecks = await db
    .insert(decks)
    .values(
      aliceDeckData.map((d) => ({
        ...d,
        ownerId: alice.id,
        visibility: "private" as const,
      }))
    )
    .returning();

  const bobDecks = await db
    .insert(decks)
    .values(
      bobDeckData.map((d) => ({
        ...d,
        ownerId: bob.id,
        visibility: "private" as const,
      }))
    )
    .returning();

  // --- Flashcards ---
  console.log("Creating flashcards...");

  const cardsByDeck: Record<string, { front: string; back: string }[]> = {
    "Spanish Vocabulary": [
      { front: "Hello", back: "Hola" },
      { front: "Goodbye", back: "Adiós" },
      { front: "Thank you", back: "Gracias" },
      { front: "Please", back: "Por favor" },
      { front: "Good morning", back: "Buenos días" },
      { front: "How are you?", back: "¿Cómo estás?" },
    ],
    "JavaScript Concepts": [
      { front: "What is a closure?", back: "A closure is a function that has access to its outer function's variables even after the outer function has returned." },
      { front: "What does 'hoisting' mean?", back: "Hoisting is JavaScript's behavior of moving declarations to the top of the current scope during compilation." },
      { front: "What is the event loop?", back: "The event loop is a mechanism that processes the callback queue when the call stack is empty, enabling asynchronous behavior." },
      { front: "Difference between let and var?", back: "let is block-scoped and not hoisted to the top. var is function-scoped and is hoisted." },
      { front: "What is a Promise?", back: "A Promise is an object representing the eventual completion or failure of an asynchronous operation." },
    ],
    "World Capitals": [
      { front: "France", back: "Paris" },
      { front: "Japan", back: "Tokyo" },
      { front: "Brazil", back: "Brasília" },
      { front: "Australia", back: "Canberra" },
      { front: "Egypt", back: "Cairo" },
      { front: "Canada", back: "Ottawa" },
      { front: "South Korea", back: "Seoul" },
    ],
    "React Hooks": [
      { front: "What does useState return?", back: "An array with the current state value and a setter function: [state, setState]" },
      { front: "When does useEffect run?", back: "After every render by default, or when specified dependencies change." },
      { front: "What is useRef used for?", back: "To persist a mutable value across renders without triggering re-renders, or to reference DOM elements." },
      { front: "What does useMemo do?", back: "Memoizes an expensive computation so it only recalculates when its dependencies change." },
      { front: "What is useCallback?", back: "Returns a memoized version of a callback function that only changes when its dependencies change." },
      { front: "What does useContext do?", back: "Subscribes to a React context and returns the current context value." },
    ],
    "French Phrases": [
      { front: "Hello", back: "Bonjour" },
      { front: "How much does this cost?", back: "Combien ça coûte ?" },
      { front: "Where is the bathroom?", back: "Où sont les toilettes ?" },
      { front: "I don't understand", back: "Je ne comprends pas" },
      { front: "Excuse me", back: "Excusez-moi" },
      { front: "See you later", back: "À bientôt" },
      { front: "I would like...", back: "Je voudrais..." },
      { front: "The bill, please", back: "L'addition, s'il vous plaît" },
    ],
    "AWS Services": [
      { front: "What is EC2?", back: "Elastic Compute Cloud — scalable virtual servers in the cloud." },
      { front: "What is S3?", back: "Simple Storage Service — object storage with high availability and durability." },
      { front: "What is Lambda?", back: "Serverless compute service that runs code in response to events without managing servers." },
      { front: "What is RDS?", back: "Relational Database Service — managed databases (PostgreSQL, MySQL, etc.)." },
      { front: "What is CloudFront?", back: "A CDN (Content Delivery Network) that distributes content globally with low latency." },
      { front: "What is DynamoDB?", back: "A fully managed NoSQL database service with single-digit millisecond performance." },
    ],
    "Design Patterns": [
      { front: "What is the Singleton pattern?", back: "Ensures a class has only one instance and provides a global point of access to it." },
      { front: "What is the Observer pattern?", back: "Defines a one-to-many dependency between objects so that when one changes state, all dependents are notified." },
      { front: "What is the Factory pattern?", back: "Provides an interface for creating objects without specifying their concrete classes." },
      { front: "What is the Strategy pattern?", back: "Defines a family of algorithms, encapsulates each one, and makes them interchangeable." },
      { front: "What is the Decorator pattern?", back: "Attaches additional responsibilities to an object dynamically, providing a flexible alternative to subclassing." },
    ],
  };

  const allDecks = [...aliceDecks, ...bobDecks];

  for (const deck of allDecks) {
    const cards = cardsByDeck[deck.name];
    if (!cards) continue;

    await db.insert(flashcards).values(
      cards.map((c) => ({
        deckId: deck.id,
        front: c.front,
        back: c.back,
      }))
    );

    // Update deck stats
    await db
      .update(decks)
      .set({
        stats: {
          totalCards: cards.length,
          newCards: cards.length,
          learningCards: 0,
          reviewCards: 0,
          masteredCards: 0,
        },
      })
      .where(eq(decks.id, deck.id));
  }

  // --- Card Progress (for first deck of each user) ---
  console.log("Creating card progress...");

  const aliceFirstDeck = aliceDecks[0]!;
  const bobFirstDeck = bobDecks[0]!;

  const aliceCards = await db
    .select({ id: flashcards.id })
    .from(flashcards)
    .where(eq(flashcards.deckId, aliceFirstDeck.id));

  const bobCards = await db
    .select({ id: flashcards.id })
    .from(flashcards)
    .where(eq(flashcards.deckId, bobFirstDeck.id));

  type CardStatus = "new" | "learning" | "review" | "mastered";
  const statusList: CardStatus[] = ["new", "learning", "review", "mastered"];
  const getStatus = (i: number): CardStatus => statusList[i % statusList.length]!;
  const now = new Date();

  if (aliceCards.length > 0) {
    await db.insert(cardProgress).values(
      aliceCards.map((card, i) => ({
        userId: alice.id,
        cardId: card.id,
        deckId: aliceFirstDeck.id,
        status: getStatus(i),
        easeFactor: 2.5 + (i % 3) * 0.2,
        interval: i * 2,
        repetitions: i,
        dueDate: new Date(now.getTime() + i * 86400000), // stagger due dates
        lastReviewedAt: i > 0 ? new Date(now.getTime() - 86400000) : null,
      }))
    );

    // Update deck stats to reflect progress
    const statusCounts = { new: 0, learning: 0, review: 0, mastered: 0 };
    aliceCards.forEach((_, i) => {
      statusCounts[getStatus(i)]++;
    });
    await db
      .update(decks)
      .set({
        stats: {
          totalCards: aliceCards.length,
          ...statusCounts,
          newCards: statusCounts.new,
          learningCards: statusCounts.learning,
          reviewCards: statusCounts.review,
          masteredCards: statusCounts.mastered,
        },
      })
      .where(eq(decks.id, aliceFirstDeck.id));
  }

  if (bobCards.length > 0) {
    await db.insert(cardProgress).values(
      bobCards.map((card, i) => ({
        userId: bob.id,
        cardId: card.id,
        deckId: bobFirstDeck.id,
        status: getStatus(i),
        easeFactor: 2.5 + (i % 3) * 0.15,
        interval: i * 3,
        repetitions: i,
        dueDate: new Date(now.getTime() + i * 86400000),
        lastReviewedAt: i > 0 ? new Date(now.getTime() - 86400000) : null,
      }))
    );

    const statusCounts = { new: 0, learning: 0, review: 0, mastered: 0 };
    bobCards.forEach((_, i) => {
      statusCounts[getStatus(i)]++;
    });
    await db
      .update(decks)
      .set({
        stats: {
          totalCards: bobCards.length,
          ...statusCounts,
          newCards: statusCounts.new,
          learningCards: statusCounts.learning,
          reviewCards: statusCounts.review,
          masteredCards: statusCounts.mastered,
        },
      })
      .where(eq(decks.id, bobFirstDeck.id));
  }

  // --- Study Sessions ---
  console.log("Creating study sessions...");

  await db.insert(studySessions).values([
    {
      userId: alice.id,
      deckId: aliceFirstDeck.id,
      startedAt: new Date(now.getTime() - 3600000), // 1 hour ago
      endedAt: new Date(now.getTime() - 1800000), // 30 min ago
      reviews: aliceCards.slice(0, 3).map((card, i) => ({
        id: crypto.randomUUID(),
        cardId: card.id,
        rating: (i % 3 === 0 ? 1 : i % 3 === 1 ? 3 : 4) as 1 | 2 | 3 | 4,
        responseTimeMs: 2000 + i * 500,
        reviewedAt: new Date(now.getTime() - 3600000 + i * 60000).toISOString(),
      })),
      stats: {
        cardsStudied: 3,
        correctCount: 2,
        incorrectCount: 1,
        averageTimeMs: 2500,
      },
    },
    {
      userId: bob.id,
      deckId: bobFirstDeck.id,
      startedAt: new Date(now.getTime() - 7200000), // 2 hours ago
      endedAt: new Date(now.getTime() - 5400000), // 1.5 hours ago
      reviews: bobCards.slice(0, 4).map((card, i) => ({
        id: crypto.randomUUID(),
        cardId: card.id,
        rating: (i % 2 === 0 ? 3 : 4) as 1 | 2 | 3 | 4,
        responseTimeMs: 1500 + i * 300,
        reviewedAt: new Date(now.getTime() - 7200000 + i * 45000).toISOString(),
      })),
      stats: {
        cardsStudied: 4,
        correctCount: 4,
        incorrectCount: 0,
        averageTimeMs: 1950,
      },
    },
  ]);

  // --- Print credentials ---
  console.log("\n========================================");
  console.log("  Seed complete!");
  console.log("========================================\n");
  console.log("  Login credentials:\n");
  console.log(`  Alice (free tier):   alice@seed.versado.dev / ${PASSWORD}`);
  console.log(`  Bob (fluent tier):   bob@seed.versado.dev / ${PASSWORD}`);
  console.log(`\n  Alice has ${aliceDecks.length} decks, Bob has ${bobDecks.length} decks.`);
  console.log("========================================\n");
}

async function main() {
  await cleanup();
  await seed();
  await client.end();
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
