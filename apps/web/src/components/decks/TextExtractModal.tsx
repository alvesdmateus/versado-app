import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { FileText, Check, RotateCcw, Loader2, Sparkles } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { Textarea } from "@/components/shared/Textarea";
import { useToast } from "@/contexts/ToastContext";
import { useAuth } from "@/hooks/useAuth";
import { aiApi, type GeneratedCard } from "@/lib/ai-api";
import { flashcardApi } from "@/lib/flashcard-api";
import { TIER_LIMITS } from "@/lib/feature-limits";
import type { FlashcardResponse } from "@/lib/deck-api";
import { Button } from "@versado/ui";

const TEXT_MAX_LENGTH = 15000;

interface TextExtractModalProps {
  isOpen: boolean;
  onClose: () => void;
  deckId: string;
  onGenerated: (cards: FlashcardResponse[]) => void;
}

export function TextExtractModal({
  isOpen,
  onClose,
  deckId,
  onGenerated,
}: TextExtractModalProps) {
  const { t } = useTranslation("decks");
  const { showToast } = useToast();
  const { user } = useAuth();

  const [text, setText] = useState("");
  const [count, setCount] = useState(10);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Usage tracking (shared with AI Generate)
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
    setText("");
    setCount(10);
    setError("");
    setGeneratedCards([]);
    setSelected(new Set());
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleExtract() {
    if (text.trim().length < 50) {
      setError(t("textExtract.textTooShort"));
      return;
    }

    setIsExtracting(true);
    setError("");
    try {
      const { cards } = await aiApi.extract({ deckId, text: text.trim(), count });
      setGeneratedCards(cards);
      setSelected(new Set(cards.map((_, i) => i)));
      aiApi.getUsage().then(setUsage).catch(() => {});
    } catch (err) {
      const message = err instanceof Error ? err.message : t("textExtract.extractFailed");
      setError(message);
    } finally {
      setIsExtracting(false);
    }
  }

  async function handleSave() {
    const cardsToSave = generatedCards.filter((_, i) => selected.has(i));
    if (cardsToSave.length === 0) {
      setError(t("textExtract.selectValidation"));
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
      showToast(t("textExtract.added", { count: saved.length }));
      resetForm();
      onGenerated(saved);
    } catch {
      setError(t("textExtract.saveFailed"));
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
    <Modal isOpen={isOpen} onClose={handleClose} title={t("textExtract.title")} size="lg">
      <div className="flex flex-col gap-4">
        {/* Usage indicator for free tier */}
        {usage !== null && tierLimit !== Infinity && (
          <div className="flex items-center justify-between rounded-lg bg-neutral-50 px-3 py-2">
            <span className="text-xs text-neutral-500">{t("textExtract.usageLabel")}</span>
            <span className={`text-xs font-medium ${isLimitReached ? "text-error-500" : "text-neutral-700"}`}>
              {usage.used} / {tierLimit} {t("textExtract.used")}
            </span>
          </div>
        )}

        {isLimitReached ? (
          /* Upgrade CTA when limit reached */
          <div className="rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 p-5 text-center">
            <Sparkles className="mx-auto h-8 w-8 text-primary-500" />
            <h3 className="mt-2 font-semibold text-neutral-900">{t("textExtract.limitTitle")}</h3>
            <p className="mt-1 text-sm text-neutral-600">
              {t("textExtract.limitMessage")}
            </p>
            <Button
              className="mt-3"
              size="sm"
              onClick={() => {
                handleClose();
                window.location.href = "/fluent";
              }}
            >
              {t("textExtract.goFluent")}
            </Button>
          </div>
        ) : !hasCards ? (
          /* Step 1: Text Input */
          <>
            <div>
              <Textarea
                label={t("textExtract.textLabel")}
                placeholder={t("textExtract.textPlaceholder")}
                value={text}
                onChange={(e) => setText(e.target.value.slice(0, TEXT_MAX_LENGTH))}
                rows={8}
              />
              <p className="mt-1 text-right text-xs text-neutral-400">
                {t("textExtract.charCount", { count: text.length, max: TEXT_MAX_LENGTH.toLocaleString() })}
              </p>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-neutral-700">
                {t("textExtract.numberOfCards")}
              </label>
              <select
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                className="w-full rounded-lg border border-neutral-300 bg-neutral-0 px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition-colors hover:border-neutral-400 focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20"
              >
                {[5, 10, 15, 20, 30].map((n) => (
                  <option key={n} value={n}>
                    {n} {t("textExtract.cards")}
                  </option>
                ))}
              </select>
            </div>

            {error && <p className="text-sm text-error-500">{error}</p>}

            <Button
              fullWidth
              onClick={handleExtract}
              disabled={isExtracting || text.trim().length < 50}
            >
              {isExtracting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("textExtract.extracting")}
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4" />
                  {t("textExtract.extract")}
                </>
              )}
            </Button>
          </>
        ) : (
          /* Step 2: Preview & Save */
          <>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-neutral-700">
                {t("textExtract.selected", { selected: selected.size, total: generatedCards.length })}
              </p>
              <button
                type="button"
                onClick={toggleAll}
                className="text-xs font-medium text-primary-500 hover:text-primary-600"
              >
                {selected.size === generatedCards.length ? t("textExtract.deselectAll") : t("textExtract.selectAll")}
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
                {t("textExtract.regenerate")}
              </Button>
              <Button
                fullWidth
                onClick={handleSave}
                disabled={isSaving || selected.size === 0}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("textExtract.saving")}
                  </>
                ) : (
                  t("textExtract.saveCards", { count: selected.size })
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
