import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Plus, BookOpen, Layers, Pencil, Trash2, Store, Sparkles, Download } from "lucide-react";
import { deckApi, type DeckResponse, type FlashcardResponse } from "@/lib/deck-api";
import { ApiError } from "@/lib/api-client";
import { flashcardApi } from "@/lib/flashcard-api";
import { marketplaceApi } from "@/lib/marketplace-api";
import { useToast } from "@/contexts/ToastContext";
import { useErrorNotification } from "@/contexts/ErrorNotificationContext";
import { DeckDetailHeader } from "@/components/decks/DeckDetailHeader";
import { CardListItem } from "@/components/decks/CardListItem";
import { AddCardModal } from "@/components/decks/AddCardModal";
import { EditDeckModal } from "@/components/decks/EditDeckModal";
import { EditCardModal } from "@/components/decks/EditCardModal";
import { ListDeckModal } from "@/components/marketplace/ListDeckModal";
import { AIGenerateModal } from "@/components/decks/AIGenerateModal";
import { ExportDeckModal } from "@/components/decks/ExportDeckModal";
import { CardFilters } from "@/components/decks/CardFilters";
import { EmptyState, ConfirmDialog, CardListSkeleton } from "@/components/shared";
import { Button } from "@versado/ui";

export function DeckDetailPage() {
  const { t } = useTranslation();
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { showErrorNotification } = useErrorNotification();

  const [deck, setDeck] = useState<DeckResponse | null>(null);
  const [cards, setCards] = useState<FlashcardResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [isEditDeckOpen, setIsEditDeckOpen] = useState(false);
  const [editingCard, setEditingCard] = useState<FlashcardResponse | null>(null);
  const [deleteCardId, setDeleteCardId] = useState<string | null>(null);
  const [isDeletingDeck, setIsDeletingDeck] = useState(false);
  const [isDeleteDeckOpen, setIsDeleteDeckOpen] = useState(false);
  const [isListModalOpen, setIsListModalOpen] = useState(false);
  const [isAIGenerateOpen, setIsAIGenerateOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);

  // Card filter state
  const [cardSearch, setCardSearch] = useState("");
  const [cardDifficulty, setCardDifficulty] = useState("all");
  const [cardSort, setCardSort] = useState("newest");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    cards.forEach((c) => c.tags.forEach((t) => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [cards]);

  const filteredCards = useMemo(() => {
    let result = cards;

    if (cardSearch.trim()) {
      const q = cardSearch.toLowerCase();
      result = result.filter(
        (c) => c.front.toLowerCase().includes(q) || c.back.toLowerCase().includes(q)
      );
    }

    if (cardDifficulty !== "all") {
      result = result.filter((c) => c.difficulty === cardDifficulty);
    }

    if (selectedTags.length > 0) {
      result = result.filter((c) =>
        selectedTags.some((tag) => c.tags.includes(tag))
      );
    }

    result = [...result].sort((a, b) => {
      if (cardSort === "oldest") return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (cardSort === "a-z") return a.front.localeCompare(b.front);
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return result;
  }, [cards, cardSearch, cardDifficulty, cardSort, selectedTags]);

  function handleTagToggle(tag: string) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  useEffect(() => {
    if (!deckId) return;
    Promise.all([deckApi.get(deckId), deckApi.getCards(deckId)])
      .then(([d, c]) => {
        setDeck(d);
        setCards(c);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          navigate("/not-found", { replace: true });
        } else {
          navigate("/decks", { replace: true });
        }
      })
      .finally(() => setIsLoading(false));
  }, [deckId, navigate]);

  async function handleDeleteDeck() {
    if (!deckId) return;
    setIsDeletingDeck(true);
    try {
      await deckApi.delete(deckId);
      showToast(t("deck.deleteError"));
      navigate("/decks", { replace: true });
    } catch (err) {
      showErrorNotification(err, { onRetry: handleDeleteDeck });
    } finally {
      setIsDeletingDeck(false);
      setIsDeleteDeckOpen(false);
    }
  }

  async function handleDeleteCard() {
    if (!deleteCardId) return;
    try {
      await flashcardApi.delete(deleteCardId);
      setCards((prev) => prev.filter((c) => c.id !== deleteCardId));
      showToast(t("deck.cardDeleted"));
    } catch (err) {
      showErrorNotification(err);
    } finally {
      setDeleteCardId(null);
    }
  }

  async function handleUnlist() {
    if (!deckId) return;
    try {
      await marketplaceApi.unlistDeck(deckId);
      setDeck((prev) => (prev ? { ...prev, visibility: "private" } : prev));
      showToast(t("deck.deleteUnlist"));
    } catch (err) {
      showErrorNotification(err, { onRetry: handleUnlist });
    }
  }

  const isListed = deck?.visibility === "marketplace";

  if (isLoading) {
    return (
      <div className="pb-4">
        <div className="px-5 pt-4 pb-2">
          <div className="h-6 w-40 animate-pulse rounded bg-neutral-200" />
        </div>
        <CardListSkeleton />
      </div>
    );
  }

  if (!deck) return null;

  const total = deck.stats.totalCards;
  const mastered = deck.stats.masteredCards;
  const progress = total > 0 ? Math.round((mastered / total) * 100) : 0;

  return (
    <div className="pb-4">
      <DeckDetailHeader
        title={deck.name}
        onBack={() => navigate("/decks")}
        menuItems={[
          {
            label: t("deckDetail.edit"),
            icon: <Pencil className="h-4 w-4" />,
            onClick: () => setIsEditDeckOpen(true),
          },
          isListed
            ? {
                label: t("deckDetail.unlist"),
                icon: <Store className="h-4 w-4" />,
                onClick: handleUnlist,
              }
            : {
                label: t("deckDetail.list"),
                icon: <Store className="h-4 w-4" />,
                onClick: () => setIsListModalOpen(true),
              },
          {
            label: t("deckDetail.export"),
            icon: <Download className="h-4 w-4" />,
            onClick: () => setIsExportOpen(true),
          },
          {
            label: t("common.delete"),
            icon: <Trash2 className="h-4 w-4" />,
            onClick: () => setIsDeleteDeckOpen(true),
            variant: "danger",
          },
        ]}
      />

      {/* Deck info */}
      <div className="mx-5 rounded-xl bg-neutral-0 p-4 shadow-card">
        {deck.description && (
          <p className="mb-3 text-sm text-neutral-600">{deck.description}</p>
        )}
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <div className="flex items-center gap-1.5">
            <Layers className="h-4 w-4" />
            <span>{t("decks.cardCount", { count: total })}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>{t("decks.mastered", { count: mastered })}</span>
            <span className="text-neutral-300">|</span>
            <span>{t("decks.progress", { percent: progress })}</span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-primary-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Action buttons */}
      <div className="mx-5 mt-4 flex gap-3">
        <Button
          fullWidth
          onClick={() => navigate(`/study/${deckId}`)}
          disabled={total === 0}
        >
          <BookOpen className="h-4 w-4" />
          {t("deckDetail.studyNow")}
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => setIsAddCardOpen(true)}
        >
          <Plus className="h-4 w-4" />
          {t("deckDetail.addCards")}
        </Button>
        <Button
          variant="secondary"
          fullWidth
          onClick={() => setIsAIGenerateOpen(true)}
        >
          <Sparkles className="h-4 w-4" />
          {t("deckDetail.aiGenerate")}
        </Button>
      </div>

      {/* Card list */}
      <div className="mt-6 px-5">
        <h2 className="mb-3 text-sm font-semibold text-neutral-700">
          {t("deckDetail.cards")}{" "}
          {filteredCards.length !== cards.length
            ? t("deckDetail.cardsCount", { count: filteredCards.length, total: cards.length })
            : `(${cards.length})`}
        </h2>

        {cards.length === 0 ? (
          <EmptyState
            icon={<Layers className="h-10 w-10" />}
            title={t("deckDetail.noCards")}
            description={t("deckDetail.noCardsDesc")}
            action={{
              label: t("deckDetail.noCardAction"),
              onClick: () => setIsAddCardOpen(true),
            }}
          />
        ) : (
          <>
            <CardFilters
              search={cardSearch}
              onSearchChange={setCardSearch}
              difficulty={cardDifficulty}
              onDifficultyChange={setCardDifficulty}
              sort={cardSort}
              onSortChange={setCardSort}
              allTags={allTags}
              selectedTags={selectedTags}
              onTagToggle={handleTagToggle}
            />
            <div className="mt-3 flex flex-col gap-2">
              {filteredCards.length === 0 ? (
                <p className="py-6 text-center text-sm text-neutral-400">
                  {t("deckDetail.noMatch")}
                </p>
              ) : (
                filteredCards.map((card) => (
                  <CardListItem
                    key={card.id}
                    card={card}
                    onEdit={(card) => setEditingCard(card)}
                    onDelete={(id) => setDeleteCardId(id)}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>

      {/* Add Card Modal */}
      <AddCardModal
        isOpen={isAddCardOpen}
        onClose={() => setIsAddCardOpen(false)}
        deckId={deckId!}
        onAdded={(newCards) => {
          setCards((prev) => [...prev, ...newCards]);
          setDeck((prev) =>
            prev
              ? {
                  ...prev,
                  stats: {
                    ...prev.stats,
                    totalCards: prev.stats.totalCards + newCards.length,
                    newCards: prev.stats.newCards + newCards.length,
                  },
                }
              : prev
          );
          setIsAddCardOpen(false);
        }}
      />

      {/* AI Generate Modal */}
      <AIGenerateModal
        isOpen={isAIGenerateOpen}
        onClose={() => setIsAIGenerateOpen(false)}
        deckId={deckId!}
        onGenerated={(newCards) => {
          setCards((prev) => [...prev, ...newCards]);
          setDeck((prev) =>
            prev
              ? {
                  ...prev,
                  stats: {
                    ...prev.stats,
                    totalCards: prev.stats.totalCards + newCards.length,
                    newCards: prev.stats.newCards + newCards.length,
                  },
                }
              : prev
          );
          setIsAIGenerateOpen(false);
        }}
      />

      {/* Edit Deck Modal */}
      {deck && (
        <EditDeckModal
          isOpen={isEditDeckOpen}
          onClose={() => setIsEditDeckOpen(false)}
          deck={deck}
          onUpdated={(updated) => {
            setDeck(updated);
            setIsEditDeckOpen(false);
          }}
        />
      )}

      {/* Edit Card Modal */}
      {editingCard && (
        <EditCardModal
          isOpen={true}
          onClose={() => setEditingCard(null)}
          card={editingCard}
          onUpdated={(updated) => {
            setCards((prev) =>
              prev.map((c) => (c.id === updated.id ? updated : c))
            );
            setEditingCard(null);
          }}
        />
      )}

      {/* Delete Deck Confirm */}
      <ConfirmDialog
        isOpen={isDeleteDeckOpen}
        onClose={() => setIsDeleteDeckOpen(false)}
        onConfirm={handleDeleteDeck}
        title={t("deckDetail.deleteTitle")}
        message={t("deckDetail.deleteMessage")}
        confirmLabel={t("deckDetail.deleteConfirm")}
        variant="danger"
        isLoading={isDeletingDeck}
      />

      {/* Delete Card Confirm */}
      <ConfirmDialog
        isOpen={deleteCardId !== null}
        onClose={() => setDeleteCardId(null)}
        onConfirm={handleDeleteCard}
        title={t("deckDetail.deleteCard")}
        message={t("deckDetail.deleteCardMessage")}
        confirmLabel={t("common.delete")}
        variant="danger"
      />

      {/* Export Deck Modal */}
      <ExportDeckModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        deck={deck}
        cards={cards}
      />

      {/* List on Marketplace Modal */}
      <ListDeckModal
        isOpen={isListModalOpen}
        onClose={() => setIsListModalOpen(false)}
        deckId={deckId!}
        onListed={() => {
          setDeck((prev) =>
            prev ? { ...prev, visibility: "marketplace" } : prev
          );
          setIsListModalOpen(false);
        }}
      />
    </div>
  );
}
