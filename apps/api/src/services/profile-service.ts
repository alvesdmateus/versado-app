import { eq } from "drizzle-orm";
import { db } from "../db";
import {
  users,
  refreshTokens,
  passwordResetTokens,
  emailVerificationTokens,
  cardProgress,
  studySessions,
  subscriptions,
  marketplaceReviews,
  follows,
  decks,
  flashcards,
  purchases,
} from "../db/schema";

export async function deleteAccount(userId: string): Promise<void> {
  await db.transaction(async (tx) => {
    // Delete card progress
    await tx.delete(cardProgress).where(eq(cardProgress.userId, userId));

    // Delete study sessions
    await tx
      .delete(studySessions)
      .where(eq(studySessions.userId, userId));

    // Delete marketplace reviews
    await tx
      .delete(marketplaceReviews)
      .where(eq(marketplaceReviews.userId, userId));

    // Delete follows
    await tx.delete(follows).where(eq(follows.followerId, userId));

    // Delete subscriptions
    await tx
      .delete(subscriptions)
      .where(eq(subscriptions.userId, userId));

    // Delete purchases where user is buyer
    await tx.delete(purchases).where(eq(purchases.buyerId, userId));

    // Delete auth tokens
    await tx
      .delete(refreshTokens)
      .where(eq(refreshTokens.userId, userId));
    await tx
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.userId, userId));
    await tx
      .delete(emailVerificationTokens)
      .where(eq(emailVerificationTokens.userId, userId));

    // Delete user's flashcards and decks
    const userDecks = await tx
      .select({ id: decks.id })
      .from(decks)
      .where(eq(decks.ownerId, userId));

    for (const deck of userDecks) {
      await tx.delete(flashcards).where(eq(flashcards.deckId, deck.id));
      await tx.delete(decks).where(eq(decks.id, deck.id));
    }

    // Delete the user
    await tx.delete(users).where(eq(users.id, userId));
  });
}
