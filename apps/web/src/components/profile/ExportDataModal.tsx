import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Download } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { useToast } from "@/contexts/ToastContext";
import { useErrorNotification } from "@/contexts/ErrorNotificationContext";
import { deckApi } from "@/lib/deck-api";
import { downloadFile } from "@/lib/deck-io";
import { Button } from "@versado/ui";

interface ExportDataModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExportDataModal({ isOpen, onClose }: ExportDataModalProps) {
  const { t } = useTranslation("profile");
  const { showToast } = useToast();
  const { showErrorNotification } = useErrorNotification();
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const decks = await deckApi.list();
      const fullDecks = await Promise.all(
        decks.map(async (deck) => {
          const cards = await deckApi.getCards(deck.id);
          return { ...deck, cards };
        })
      );

      const content = JSON.stringify(
        { decks: fullDecks, exportedAt: new Date().toISOString() },
        null,
        2
      );
      downloadFile(
        content,
        `versado-export-${new Date().toISOString().slice(0, 10)}.json`,
        "application/json"
      );

      showToast(t("exportDataModal.success"));
      onClose();
    } catch (err) {
      showErrorNotification(err);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={t("exportDataModal.title")} size="sm">
      <div className="flex flex-col items-center gap-4 py-2">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-50">
          <Download className="h-6 w-6 text-primary-500" />
        </div>
        <p className="text-center text-sm text-neutral-600">
          {t("exportDataModal.description")}
        </p>
        <Button fullWidth onClick={handleExport} disabled={isExporting}>
          {isExporting ? t("exportDataModal.exporting") : t("exportDataModal.exportJson")}
        </Button>
      </div>
    </Modal>
  );
}
