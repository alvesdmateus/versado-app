export {
  idSchema,
  paginationSchema,
  sortDirectionSchema,
  tagsSchema,
} from "./common";

export {
  registerSchema,
  loginSchema,
  changePasswordSchema,
  updateProfileSchema,
  updatePreferencesSchema,
  googleOAuthSchema,
  type RegisterInput,
  type LoginInput,
  type ChangePasswordInput,
  type UpdateProfileInput,
  type UpdatePreferencesInput,
  type GoogleOAuthInput,
} from "./auth";

export {
  createDeckSchema,
  updateDeckSchema,
  listDecksSchema,
  type CreateDeckInput,
  type UpdateDeckInput,
  type ListDecksInput,
} from "./deck";

export {
  createFlashcardSchema,
  updateFlashcardSchema,
  batchCreateFlashcardsSchema,
  type CreateFlashcardInput,
  type UpdateFlashcardInput,
  type BatchCreateFlashcardsInput,
} from "./flashcard";

export {
  reviewRatingSchema,
  submitReviewSchema,
  startSessionSchema,
  type SubmitReviewInput,
  type StartSessionInput,
} from "./study";

export {
  listMarketplaceSchema,
  purchaseDeckSchema,
  createReviewSchema,
  listDeckSchema,
  unlistDeckSchema,
  type ListMarketplaceInput,
  type PurchaseDeckInput,
  type CreateReviewInput,
  type ListDeckInput,
  type UnlistDeckInput,
} from "./marketplace";

export {
  createCheckoutSchema,
  type CreateCheckoutInput,
} from "./billing";

export {
  generateFlashcardsSchema,
  type GenerateFlashcardsInput,
} from "./ai";

export {
  followUserSchema,
  followTagSchema,
  feedQuerySchema,
  popularDecksQuerySchema,
  type FollowUserInput,
  type FollowTagInput,
  type FeedQueryInput,
  type PopularDecksQueryInput,
} from "./social";
