import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Upload, FileJson, FileSpreadsheet, Loader2 } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { Textarea } from "@/components/shared/Textarea";
import { useToast } from "@/contexts/ToastContext";
import { deckApi, type DeckResponse } from "@/lib/deck-api";
import { flashcardApi } from "@/lib/flashcard-api";
import { parseJSONImport, parseCSVImport, type DeckExport } from "@/lib/deck-io";
import { Input, Button } from "@versado/ui";

interface ImportDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImported: (deck: DeckResponse) => void;
}

interface ParsedImport {
  name: string;
  description: string;
  tags: string[];
  cards: Array<{ front: string; back: string; tags: string[]; difficulty: string }>;
  sourceFormat: "json" | "csv";
}

export function ImportDeckModal({
  isOpen,
  onClose,
  onImported,
}: ImportDeckModalProps) {
  const { t } = useTranslation("decks");
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [parsed, setParsed] = useState<ParsedImport | null>(null);
  const [deckName, setDeckName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [isDragOver, setIsDragOver] = useState(false);

  function resetForm() {
    setParsed(null);
    setDeckName("");
    setDescription("");
    setError("");
    setIsImporting(false);
    setImportProgress({ current: 0, total: 0 });
    setIsDragOver(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  function processFile(file: File) {
    setError("");

    const extension = file.name.split(".").pop()?.toLowerCase();
    if (extension !== "json" && extension !== "csv") {
      setError(t("importModal.invalidFile"));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      try {
        if (extension === "json") {
          const data: DeckExport = parseJSONImport(text);
          setParsed({
            name: data.deck.name,
            description: data.deck.description,
            tags: data.deck.tags,
            cards: data.cards,
            sourceFormat: "json",
          });
          setDeckName(data.deck.name);
          setDescription(data.deck.description);
        } else {
          const cards = parseCSVImport(text);
          const nameFromFile = file.name.replace(/\.csv$/i, "");
          setParsed({
            name: nameFromFile,
            description: "",
            tags: [],
            cards,
            sourceFormat: "csv",
          });
          setDeckName(nameFromFile);
          setDescription("");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to parse file");
      }
    };
    reader.onerror = () => setError(t("importModal.readFailed"));
    reader.readAsText(file);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
    setIsDragOver(true);
  }

  function handleDragLeave() {
    setIsDragOver(false);
  }

  async function handleImport() {
    if (!parsed || !deckName.trim()) {
      setError(t("importModal.nameRequired"));
      return;
    }

    setIsImporting(true);
    setError("");
    setImportProgress({ current: 0, total: parsed.cards.length });

    try {
      // Create the deck
      const deck = await deckApi.create({
        name: deckName.trim(),
        description: description.trim(),
        tags: parsed.tags,
      });

      // Batch import cards in chunks of 100
      const chunkSize = 100;
      for (let i = 0; i < parsed.cards.length; i += chunkSize) {
        const chunk = parsed.cards.slice(i, i + chunkSize);
        await flashcardApi.batchCreate({
          deckId: deck.id,
          cards: chunk.map((c) => ({
            front: c.front,
            back: c.back,
            tags: c.tags,
            difficulty: c.difficulty,
          })),
        });
        setImportProgress({
          current: Math.min(i + chunkSize, parsed.cards.length),
          total: parsed.cards.length,
        });
      }

      showToast(
        t("importModal.imported", { name: deckName, count: parsed.cards.length })
      );
      resetForm();
      onImported(deck);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : t("importModal.importFailed");
      setError(message);
    } finally {
      setIsImporting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t("importModal.title")} size="lg">
      <div className="flex flex-col gap-4">
        {!parsed ? (
          /* Step 1: File Selection */
          <>
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`flex cursor-pointer flex-col items-center gap-3 rounded-xl border-2 border-dashed p-8 transition-colors ${
                isDragOver
                  ? "border-primary-400 bg-primary-50"
                  : "border-neutral-300 hover:border-primary-300 hover:bg-neutral-50"
              }`}
            >
              <Upload
                className={`h-8 w-8 ${isDragOver ? "text-primary-500" : "text-neutral-400"}`}
              />
              <div className="text-center">
                <p className="text-sm font-medium text-neutral-700">
                  {t("importModal.dropPrompt")}
                </p>
                <p className="mt-1 text-xs text-neutral-500">
                  {t("importModal.supportedFormats")}
                </p>
              </div>
              <div className="flex gap-2">
                <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">
                  <FileJson className="h-3 w-3" /> {t("importModal.json")}
                </span>
                <span className="flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-1 text-xs text-neutral-600">
                  <FileSpreadsheet className="h-3 w-3" /> {t("importModal.csv")}
                </span>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            {error && <p className="text-sm text-error-500">{error}</p>}
          </>
        ) : (
          /* Step 2: Preview & Import */
          <>
            <Input
              label={t("importModal.deckName")}
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              placeholder={t("importModal.deckNamePlaceholder")}
            />

            <Textarea
              label={t("importModal.descriptionLabel")}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("importModal.descriptionPlaceholder")}
              rows={2}
            />

            <div className="rounded-lg bg-neutral-50 px-3 py-2">
              <p className="text-sm font-medium text-neutral-700">
                {t("importModal.cardsFound", { count: parsed.cards.length })}
                <span className="ml-1 text-xs text-neutral-400">
                  ({parsed.sourceFormat.toUpperCase()})
                </span>
              </p>
            </div>

            {/* Card preview */}
            <div className="flex max-h-[30vh] flex-col gap-1.5 overflow-y-auto">
              {parsed.cards.slice(0, 10).map((card, i) => (
                <div
                  key={i}
                  className="rounded-lg border border-neutral-200 px-3 py-2"
                >
                  <p className="text-sm font-medium text-neutral-900 truncate">
                    {card.front}
                  </p>
                  <p className="text-xs text-neutral-500 truncate">
                    {card.back}
                  </p>
                </div>
              ))}
              {parsed.cards.length > 10 && (
                <p className="text-center text-xs text-neutral-400">
                  {t("importModal.andMore", { count: parsed.cards.length - 10 })}
                </p>
              )}
            </div>

            {error && <p className="text-sm text-error-500">{error}</p>}

            {isImporting && importProgress.total > 100 && (
              <div className="flex items-center gap-2">
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
                  <div
                    className="h-full rounded-full bg-primary-500 transition-all"
                    style={{
                      width: `${Math.round((importProgress.current / importProgress.total) * 100)}%`,
                    }}
                  />
                </div>
                <span className="text-xs text-neutral-500">
                  {importProgress.current}/{importProgress.total}
                </span>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => {
                  setParsed(null);
                  setError("");
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                disabled={isImporting}
              >
                {t("importModal.back")}
              </Button>
              <Button
                fullWidth
                onClick={handleImport}
                disabled={isImporting || !deckName.trim()}
              >
                {isImporting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("importModal.importing")}
                  </>
                ) : (
                  t("importModal.importCards", { count: parsed.cards.length })
                )}
              </Button>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
