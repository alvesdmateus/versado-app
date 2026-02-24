import { useState, useMemo, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import { Plus, Layers, Upload } from "lucide-react";
import type { DeckResponse } from "@/lib/deck-api";
import { syncAwareApi } from "@/lib/sync-aware-api";
import { profileApi } from "@/lib/profile-api";
import { DecksHeader } from "@/components/decks/DecksHeader";
import { DeckSearchBar } from "@/components/decks/DeckSearchBar";
import { DeckFilterTabs } from "@/components/decks/DeckFilterTabs";
import { DeckGridCard } from "@/components/decks/DeckGridCard";
import { CreateDeckModal } from "@/components/decks/CreateDeckModal";
import { ImportDeckModal } from "@/components/decks/ImportDeckModal";
import { SortSelect } from "@/components/shared/SortSelect";
import { EmptyState, DeckGridSkeleton } from "@/components/shared";

const FILTER_TABS = ["All", "Recently Studied", "Favorites"];

const GRADIENTS = [
  "from-violet-300 to-violet-400",
  "from-amber-300 to-orange-400",
  "from-blue-200 to-blue-300",
  "from-amber-200 to-amber-300",
  "from-slate-300 to-slate-400",
  "from-emerald-300 to-emerald-400",
  "from-teal-300 to-teal-400",
  "from-rose-300 to-rose-400",
];

function getGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]!;
}

export function DecksPage() {
  const navigate = useNavigate();
  const [decks, setDecks] = useState<DeckResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    Promise.all([
      syncAwareApi.listDecks(),
      profileApi.getPreferences(),
    ])
      .then(([deckList, prefs]) => {
        setDecks(deckList);
        setFavoriteIds(new Set(prefs.favoriteDeckIds ?? []));
      })
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  const toggleFavorite = useCallback(
    async (deckId: string) => {
      const isFav = favoriteIds.has(deckId);
      const next = new Set(favoriteIds);
      if (isFav) {
        next.delete(deckId);
      } else {
        next.add(deckId);
      }
      setFavoriteIds(next);

      try {
        await profileApi.updatePreferences({
          favoriteDeckIds: Array.from(next),
        });
      } catch {
        // Revert on failure
        setFavoriteIds(favoriteIds);
      }
    },
    [favoriteIds]
  );

  const filteredDecks = useMemo(() => {
    let result = decks;

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((deck) =>
        deck.name.toLowerCase().includes(query)
      );
    }

    // Tab filter
    if (activeFilter === "Recently Studied") {
      result = result.filter(
        (d) =>
          d.stats.masteredCards > 0 ||
          d.stats.reviewCards > 0 ||
          d.stats.learningCards > 0
      );
    } else if (activeFilter === "Favorites") {
      result = result.filter((d) => favoriteIds.has(d.id));
    }

    // Sort
    result = [...result].sort((a, b) => {
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "cards") return b.stats.totalCards - a.stats.totalCards;
      if (sortBy === "progress") {
        const pA = a.stats.totalCards > 0 ? a.stats.masteredCards / a.stats.totalCards : 0;
        const pB = b.stats.totalCards > 0 ? b.stats.masteredCards / b.stats.totalCards : 0;
        return pB - pA;
      }
      // "newest" (default)
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [searchQuery, decks, activeFilter, favoriteIds, sortBy]);

  const emptyMessage = useMemo(() => {
    if (decks.length === 0) {
      return {
        title: "No decks yet",
        description: "Create your first deck to get started",
        action: { label: "Create Deck", onClick: () => setIsCreateOpen(true) },
      };
    }
    if (activeFilter === "Favorites" && filteredDecks.length === 0) {
      return {
        title: "No favorites yet",
        description: "Tap the heart icon on a deck to add it to favorites",
      };
    }
    if (activeFilter === "Recently Studied" && filteredDecks.length === 0) {
      return {
        title: "No study history",
        description: "Start studying a deck to see it here",
      };
    }
    if (searchQuery.trim() && filteredDecks.length === 0) {
      return {
        title: "No decks found",
        description: "Try a different search term",
      };
    }
    return null;
  }, [decks.length, activeFilter, filteredDecks.length, searchQuery]);

  if (isLoading) {
    return (
      <div className="pb-4">
        <DecksHeader />
        <DeckGridSkeleton />
      </div>
    );
  }

  return (
    <div className="pb-4">
      <DecksHeader />
      <DeckSearchBar value={searchQuery} onChange={setSearchQuery} />
      <DeckFilterTabs
        tabs={FILTER_TABS}
        activeTab={activeFilter}
        onTabChange={setActiveFilter}
      />
      <div className="mt-2 flex justify-end px-5">
        <SortSelect
          value={sortBy}
          onChange={setSortBy}
          options={[
            { value: "newest", label: "Newest" },
            { value: "name", label: "Name A-Z" },
            { value: "cards", label: "Most Cards" },
            { value: "progress", label: "Best Progress" },
          ]}
        />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 px-5">
        {filteredDecks.map((deck) => {
          const total = deck.stats.totalCards;
          const mastered = deck.stats.masteredCards;
          const progress = total > 0 ? Math.round((mastered / total) * 100) : 0;

          return (
            <DeckGridCard
              key={deck.id}
              name={deck.name}
              cardCount={total}
              coverImageUrl={deck.coverImageUrl}
              gradient={getGradient(deck.name)}
              progress={progress}
              lastStudied=""
              isFavorite={favoriteIds.has(deck.id)}
              onToggleFavorite={() => toggleFavorite(deck.id)}
              onClick={() => navigate(`/decks/${deck.id}`)}
            />
          );
        })}
      </div>

      {emptyMessage && (
        <EmptyState
          icon={<Layers className="h-10 w-10" />}
          title={emptyMessage.title}
          description={emptyMessage.description}
          action={emptyMessage.action}
        />
      )}

      {/* FABs */}
      <button
        onClick={() => setIsImportOpen(true)}
        className="fixed bottom-24 right-22 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-neutral-0 text-primary-500 shadow-card-lg border border-neutral-200 transition-all hover:bg-neutral-50 active:scale-90"
      >
        <Upload className="h-6 w-6" />
      </button>
      <button
        onClick={() => setIsCreateOpen(true)}
        className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary-500 text-white shadow-card-lg transition-all hover:bg-primary-600 active:scale-90"
      >
        <Plus className="h-6 w-6" />
      </button>

      <ImportDeckModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImported={(deck) => {
          setDecks((prev) => [deck, ...prev]);
          setIsImportOpen(false);
          navigate(`/decks/${deck.id}`);
        }}
      />

      <CreateDeckModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={(deck) => {
          setDecks((prev) => [deck, ...prev]);
          setIsCreateOpen(false);
          navigate(`/decks/${deck.id}`);
        }}
      />
    </div>
  );
}
