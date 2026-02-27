import { useState } from "react";
import { useTranslation } from "react-i18next";
import { FileJson, FileSpreadsheet } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { useToast } from "@/contexts/ToastContext";
import { useErrorNotification } from "@/contexts/ErrorNotificationContext";
import { exportDeckAsJSON, exportDeckAsCSV } from "@/lib/deck-io";
import type { DeckResponse, FlashcardResponse } from "@/lib/deck-api";
import { Button } from "@versado/ui";

interface ExportDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
  deck: DeckResponse;
  cards: FlashcardResponse[];
}

type ExportFormat = "json" | "csv";

export function ExportDeckModal({
  isOpen,
  onClose,
  deck,
  cards,
}: ExportDeckModalProps) {
  const { t } = useTranslation("decks");
  const { showToast } = useToast();
  const { showErrorNotification } = useErrorNotification();
  const [format, setFormat] = useState<ExportFormat>("json");

  function handleExport() {
    try {
      if (format === "json") {
        exportDeckAsJSON(deck, cards);
      } else {
        exportDeckAsCSV(deck, cards);
      }
      showToast(t("exportModal.exported", { format: format.toUpperCase() }));
      onClose();
    } catch (err) {
      showErrorNotification(err);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("exportModal.title")} size="sm">
      <div className="flex flex-col gap-4">
        <p className="text-sm text-neutral-600">
          {t("exportModal.description", { name: deck.name, count: cards.length })}
        </p>

        <div className="flex flex-col gap-2">
          <label
            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
              format === "json"
                ? "border-primary-300 bg-primary-50"
                : "border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <input
              type="radio"
              name="format"
              value="json"
              checked={format === "json"}
              onChange={() => setFormat("json")}
              className="sr-only"
            />
            <FileJson className={`h-5 w-5 ${format === "json" ? "text-primary-500" : "text-neutral-400"}`} />
            <div>
              <p className="text-sm font-medium text-neutral-900">
                {t("exportModal.jsonLabel")}
              </p>
              <p className="text-xs text-neutral-500">
                {t("exportModal.jsonDesc")}
              </p>
            </div>
          </label>

          <label
            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
              format === "csv"
                ? "border-primary-300 bg-primary-50"
                : "border-neutral-200 hover:border-neutral-300"
            }`}
          >
            <input
              type="radio"
              name="format"
              value="csv"
              checked={format === "csv"}
              onChange={() => setFormat("csv")}
              className="sr-only"
            />
            <FileSpreadsheet className={`h-5 w-5 ${format === "csv" ? "text-primary-500" : "text-neutral-400"}`} />
            <div>
              <p className="text-sm font-medium text-neutral-900">{t("exportModal.csvLabel")}</p>
              <p className="text-xs text-neutral-500">
                {t("exportModal.csvDesc")}
              </p>
            </div>
          </label>
        </div>

        <Button fullWidth onClick={handleExport}>
          {t("exportModal.exportAs", { format: format.toUpperCase() })}
        </Button>
      </div>
    </Modal>
  );
}
