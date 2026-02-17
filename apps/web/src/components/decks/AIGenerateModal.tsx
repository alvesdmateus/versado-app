import { useState, useEffect } from "react";
import { Sparkles, Check, RotateCcw, Loader2 } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { Textarea } from "@/components/shared/Textarea";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/hooks/useAuth";
import { aiApi, type GeneratedCard } from "@/lib/ai-api";
import { flashcardApi } from "@/lib/flashcard-api";
import { TIER_LIMITS } from "@/lib/feature-limits";
import type { FlashcardResponse } from "@/lib/deck-api";
import { Button } from "@flashcard/ui";

interface AIGenerateModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckId: string;
  onGenerated: (cards: FlashcardResponse[]) => void;
}

export function AIGenerateModal({
  isOpen,
  onClose,
  deckId,
  onGenerated,
}: AIGenerateModalProps) {
  const { showToast } = useToast();
  const { user } = useAuth();

  const [prompt, setPrompt] = useState("");
  const [count, setCount] = useState(10);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Usage tracking
  const [usage, setUsage] = useState<{ used: number; limit: number } | null>(null);

  // Generated cards + selection
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const tier = user?.tier ?? "free";
  const tierLimit = TIER_LIMITS[tier].aiGenerationLimit;
  const isLimitReached = usage !== null && tierLimit !== Infinity && usage.used >= tierLimit;

  useEffect(() => {
    if (isOpen) {
      aiApi.getUsage().then(setUsage).catch(() => {});
    }
  }, [isOpen]);

  function resetForm() {
    setPrompt("");
    setCount(10);
    setError("");
    setGeneratedCards([]);
    setSelected(new Set());
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleGenerate() {
    if (!prompt.trim()) {
      setError("Please enter a topic or prompt");
      return;
    }

    setIsGenerating(true);
    setError("");
    try {
      const { cards } = await aiApi.generate({ deckId, prompt: prompt.trim(), count });
      setGeneratedCards(cards);
      setSelected(new Set(cards.map((_, i) => i)));
      // Refresh usage count
      aiApi.getUsage().then(setUsage).catch(() => {});
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to generate cards";
      setError(message);
    } finally {
      setIsGenerating(false);
    }
  }

  async function handleSave() {
    const cardsToSave = generatedCards.filter((_, i) => selected.has(i));
    if (cardsToSave.length === 0) {
      setError("Select at least one card to save");
      return;
    }

    setIsSaving(true);
    try {
      const saved = await flashcardApi.batchCreate({
        deckId,
        cards: cardsToSave.map((c) => ({
          front: c.front,
          back: c.back,
          tags: c.tags,
          difficulty: c.difficulty,
        })),
      });
      showToast(`${saved.length} card${saved.length !== 1 ? "s" : ""} added!`);
      resetForm();
      onGenerated(saved);
    } catch {
      setError("Failed to save cards. Please try again.");
    } finally {
      setIsSaving(false);
    }
  }

  function toggleCard(index: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === generatedCards.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(generatedCards.map((_, i) => i)));
    }
  }

  const hasCards = generatedCards.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="AI Generate Cards" size="lg">
      <div className="flex flex-col gap-4">
        {/* Usage indicator for free tier */}
        {usage !== null && tierLimit !== Infinity && (
          <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
            <span className="text-xs text-neutral-500">AI Generations</span>
            <span className={`text-xs font-medium ${isLimitReached ? "text-error-500" : "text-neutral-700"}`}>
              {usage.used} / {tierLimit} used
            </span>
          </div>
        )}

        {isLimitReached ? (
          /* Upgrade CTA when limit reached */
          <div className="rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 p-5 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-primary-500" />
            <h3 className="mt-2 font-semibold text-neutral-900">Generation Limit Reached</h3>
            <p className="mt-1 text-sm text-neutral-600">
              Upgrade to Premium for unlimited AI generations.
            </p>
            <Button
              className="mt-3"
              size="sm"
              onClick={() => {
                handleClose();
                window.location.href = "/billing";
              }}
            >
              Upgrade to Premium
            </Button>
          </div>
        ) : !hasCards ? (
          /* Step 1: Prompt Input */
          <>
            <Textarea
              label="Topic or Prompt"
              placeholder="e.g., Spanish food vocabulary, World War II key events, JavaScript array methods..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                Number of Cards
              </label>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-300 bg-neutral-0 px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition-colors hover:border-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              >
                {[5, 10, 15, 20].map((n) => (
                  <option key={n} value={n}>
                    {n} cards
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="text-sm text-error-500">{error}</p>}

            <Button
              fullWidth
              onClick={handleGenerate}
              disabled={isGenerating || !prompt.trim()}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Generate Cards
                </>
              )}
            </Button>
          </>
        ) : (
          /* Step 2: Preview & Save */
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-700">
                {selected.size} of {generatedCards.length} cards selected
              </p>
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs font-medium text-primary-500 hover:text-primary-600"
              >
                {selected.size === generatedCards.length ? "Deselect All" : "Select All"}
              </button>
            </div>

            <div className="flex max-h-[40vh] flex-col gap-2 overflow-y-auto">
              {generatedCards.map((card, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => toggleCard(i)}
                  className={`w-full rounded-lg border p-3 text-left transition-colors ${
                    selected.has(i)
                      ? "border-primary-300 bg-primary-50"
                      : "border-neutral-200 bg-neutral-0 opacity-60"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                        selected.has(i)
                          ? "border-primary-500 bg-primary-500"
                          : "border-neutral-300"
                      }`}
                    >
                      {selected.has(i) && <Check className="h-3 w-3 text-white" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-neutral-900">{card.front}</p>
                      <p className="mt-1 text-sm text-neutral-500">{card.back}</p>
                      {card.tags.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {card.tags.map((tag) => (
                            <span
                              key={tag}
                              className="rounded-full bg-neutral-100 px-2 py-0.5 text-xs text-neutral-500"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {error && <p className="text-sm text-error-500">{error}</p>}

            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setGeneratedCards([]);
                  setSelected(new Set());
                  setError("");
                }}
              >
                <RotateCcw className="h-4 w-4" />
                Regenerate
              </Button>
              <Button
                fullWidth
                onClick={handleSave}
                disabled={isSaving || selected.size === 0}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  `Save ${selected.size} Card${selected.size !== 1 ? "s" : ""}`
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
