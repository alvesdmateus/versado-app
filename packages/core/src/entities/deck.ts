export type DeckVisibility = "private" | "shared" | "public" | "marketplace";

export type StudyAlgorithm = "sm2" | "fsrs";

export interface DeckSettings {
  newCardsPerDay: number;
  reviewsPerDay: number;
  algorithm: StudyAlgorithm;
}

export interface MarketplaceInfo {
  listed: boolean;
  price: number; // In cents (0 = free)
  purchaseCount: number;
  rating: number;
  reviewCount: number;
}

export interface DeckStats {
  totalCards: number;
  newCards: number;
  learningCards: number;
  reviewCards: number;
  masteredCards: number;
}

export interface Deck {
  id: string;
  ownerId: string | null; // null for local-only decks
  name: string;
  description: string;
  coverImageUrl: string | null;
  tags: string[];
  visibility: DeckVisibility;
  settings: DeckSettings;
  stats: DeckStats;
  marketplace: MarketplaceInfo | null;
  createdAt: Date;
  updatedAt: Date;
  // Sync fields
  _version: number;
  _tombstone: boolean;
}

export interface CreateDeckInput {
  name: string;
  description?: string;
  ownerId?: string;
  tags?: string[];
  visibility?: DeckVisibility;
  settings?: Partial<DeckSettings>;
}

const DEFAULT_SETTINGS: DeckSettings = {
  newCardsPerDay: 20,
  reviewsPerDay: 100,
  algorithm: "sm2",
};

const DEFAULT_STATS: DeckStats = {
  totalCards: 0,
  newCards: 0,
  learningCards: 0,
  reviewCards: 0,
  masteredCards: 0,
};

export function createDeck(input: CreateDeckInput): Deck {
  const now = new Date();
  return {
    id: crypto.randomUUID(),
    ownerId: input.ownerId ?? null,
    name: input.name,
    description: input.description ?? "",
    coverImageUrl: null,
    tags: input.tags ?? [],
    visibility: input.visibility ?? "private",
    settings: { ...DEFAULT_SETTINGS, ...input.settings },
    stats: { ...DEFAULT_STATS },
    marketplace: null,
    createdAt: now,
    updatedAt: now,
    _version: 1,
    _tombstone: false,
  };
}
