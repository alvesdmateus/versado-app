import { useTranslation, Trans } from "react-i18next";
import { PartyPopper } from "lucide-react";
import { Modal } from "@/components/shared/Modal";
import { Button } from "@versado/ui";

interface DeckCreatedModalProps {
  isOpen: boolean;
  deck: { id: string; name: string } | null;
  onAddCards: () => void;
  onViewDeck: () => void;
}

export function DeckCreatedModal({
  isOpen,
  deck,
  onAddCards,
  onViewDeck,
}: DeckCreatedModalProps) {
  const { t } = useTranslation("decks");

  return (
    <Modal isOpen={isOpen} onClose={onViewDeck} size="sm">
      <div className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success-50">
          <PartyPopper className="h-8 w-8 text-success-500" />
        </div>

        <h2 className="mt-4 text-xl font-bold text-neutral-900">
          {t("deckCreated.heading")}
        </h2>
        <p className="mt-2 text-sm text-neutral-500">
          <Trans
            i18nKey="deckCreated.description"
            ns="decks"
            values={{ name: deck?.name }}
            components={{ bold: <span className="font-semibold text-neutral-700" /> }}
          />
        </p>

        <div className="mt-6 flex w-full flex-col gap-3">
          <Button variant="primary" size="lg" fullWidth onClick={onAddCards}>
            {t("deckCreated.addCards")}
          </Button>
          <Button variant="secondary" size="lg" fullWidth onClick={onViewDeck}>
            {t("deckCreated.viewDeck")}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
