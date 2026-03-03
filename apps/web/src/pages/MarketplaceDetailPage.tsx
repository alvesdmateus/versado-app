import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { Layers, Download, Users, MoreVertical, Flag, Ban } from "lucide-react";
import { Button } from "@versado/ui";
import {
  marketplaceApi,
  type MarketplaceDetail,
  type MarketplaceReview,
} from "@/lib/marketplace-api";
import { blocksApi } from "@/lib/blocks-api";
import { ApiError } from "@/lib/api-client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/contexts/ToastContext";
import { useErrorNotification } from "@/contexts/ErrorNotificationContext";
import { DropdownMenu, ConfirmDialog, ReportModal } from "@/components/shared";
import { MarketplaceDetailHeader } from "@/components/marketplace/MarketplaceDetailHeader";
import { MarketplaceDetailSkeleton } from "@/components/marketplace/MarketplaceDetailSkeleton";
import { StarRating } from "@/components/marketplace/StarRating";
import { SampleCardList } from "@/components/marketplace/SampleCardList";
import { ReviewList } from "@/components/marketplace/ReviewList";
import { ReviewForm } from "@/components/marketplace/ReviewForm";

const GRADIENTS = [
  "from-violet-300 to-violet-400",
  "from-emerald-300 to-emerald-400",
  "from-slate-300 to-slate-400",
  "from-amber-300 to-amber-400",
  "from-teal-300 to-teal-400",
  "from-rose-300 to-rose-400",
  "from-blue-300 to-blue-400",
];

function getGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]!;
}

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function MarketplaceDetailPage() {
  const { deckId } = useParams<{ deckId: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation(["marketplace", "common"]);
  const { user } = useAuth();
  const { showToast } = useToast();
  const { showErrorNotification } = useErrorNotification();

  const [detail, setDetail] = useState<MarketplaceDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Report & block state
  const [reportTarget, setReportTarget] = useState<{
    type: "deck" | "review" | "user";
    id: string;
    name: string;
  } | null>(null);
  const [blockTarget, setBlockTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [isBlocking, setIsBlocking] = useState(false);

  useEffect(() => {
    if (!deckId) return;
    marketplaceApi
      .getDetail(deckId)
      .then(setDetail)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          navigate("/not-found", { replace: true });
        } else {
          navigate("/market", { replace: true });
        }
      })
      .finally(() => setIsLoading(false));
  }, [deckId, navigate]);

  async function handleAddToLibrary() {
    if (!deckId) return;
    setIsAdding(true);
    try {
      const { clonedDeckId } = await marketplaceApi.addToLibrary(deckId);
      showToast(t("marketplace:addedToLibrary"));
      navigate(`/decks/${clonedDeckId}`);
    } catch (err) {
      if (err instanceof ApiError && err.code === "ALREADY_PURCHASED") {
        showToast(t("marketplace:alreadyInLibraryToast"), "info");
      } else {
        showErrorNotification(err, { onRetry: handleAddToLibrary });
      }
    } finally {
      setIsAdding(false);
    }
  }

  function handleReviewSubmitted(review: MarketplaceReview) {
    if (!detail) return;
    const filtered = detail.reviews.filter((r) => r.userId !== review.userId);
    const isUpdate = detail.reviews.length !== filtered.length;
    setDetail({
      ...detail,
      reviews: [review, ...filtered],
      reviewCount: isUpdate ? detail.reviewCount : detail.reviewCount + 1,
    });
  }

  async function handleReviewDeleted(reviewId: string) {
    if (!detail || !deckId) return;
    try {
      await marketplaceApi.deleteReview(deckId);
      setDetail({
        ...detail,
        reviews: detail.reviews.filter((r) => r.id !== reviewId),
        reviewCount: Math.max(0, detail.reviewCount - 1),
      });
      showToast(t("marketplace:reviewDeleted"));
    } catch (err) {
      showErrorNotification(err);
    }
  }

  async function handleBlock() {
    if (!blockTarget) return;
    setIsBlocking(true);
    try {
      await blocksApi.blockUser(blockTarget.id);
      showToast(t("common:block.success", { name: blockTarget.name }));
      setBlockTarget(null);
      navigate("/market", { replace: true });
    } catch {
      showToast(t("common:block.error"), "error");
    } finally {
      setIsBlocking(false);
    }
  }

  if (isLoading) return <MarketplaceDetailSkeleton />;
  if (!detail) return null;

  const isFree = detail.price === 0;
  const existingReview = user ? detail.reviews.find((r) => r.userId === user.id) : null;

  return (
    <div className="pb-4">
      <MarketplaceDetailHeader
        title={detail.name}
        onBack={() => navigate("/market")}
      />

      {/* Hero */}
      <div className="mx-5 h-40 overflow-hidden rounded-xl bg-neutral-200">
        {detail.coverImageUrl ? (
          <img
            src={detail.coverImageUrl}
            alt={detail.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${getGradient(detail.name)}`}
          >
            <Layers className="h-12 w-12 text-white/40" />
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="mx-5 mt-4 rounded-xl bg-neutral-0 p-4 shadow-card">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <h2 className="text-lg font-bold text-neutral-900">
              {detail.name}
            </h2>
            <p className="mt-0.5 text-sm text-neutral-500">
              {t("marketplace:byCreator", { name: detail.creator.displayName })}
            </p>
          </div>
          {!detail.isOwner && (
            <DropdownMenu
              trigger={
                <span className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-100">
                  <MoreVertical className="h-5 w-5" />
                </span>
              }
              items={[
                {
                  label: t("common:menu.reportDeck"),
                  icon: <Flag className="h-4 w-4" />,
                  onClick: () =>
                    setReportTarget({ type: "deck", id: detail.id, name: detail.name }),
                },
                {
                  label: t("common:menu.reportUser"),
                  icon: <Flag className="h-4 w-4" />,
                  onClick: () =>
                    setReportTarget({
                      type: "user",
                      id: detail.creator.id,
                      name: detail.creator.displayName,
                    }),
                },
                {
                  label: t("common:menu.blockUser"),
                  icon: <Ban className="h-4 w-4" />,
                  onClick: () =>
                    setBlockTarget({
                      id: detail.creator.id,
                      name: detail.creator.displayName,
                    }),
                  variant: "danger",
                },
              ]}
            />
          )}
          <span
            className={`flex-shrink-0 rounded-full px-3 py-1 text-sm font-bold ${
              isFree
                ? "bg-success-100 text-success-700"
                : "bg-primary-500 text-white"
            }`}
          >
            {isFree ? t("free") : `$${(detail.price / 100).toFixed(2)}`}
          </span>
        </div>

        {detail.description && (
          <p className="mt-3 text-sm text-neutral-600">{detail.description}</p>
        )}

        {/* Stats row */}
        <div className="mt-3 flex items-center gap-4">
          <div className="flex items-center gap-1">
            <StarRating rating={detail.rating} size="sm" showValue />
            <span className="text-xs text-neutral-400">
              ({detail.reviewCount})
            </span>
          </div>
          <div className="flex items-center gap-1 text-xs text-neutral-500">
            <Download className="h-3.5 w-3.5" />
            <span>{formatCount(detail.purchaseCount)}</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-neutral-500">
            <Users className="h-3.5 w-3.5" />
            <span>{t("cards", { count: detail.cardCount })}</span>
          </div>
        </div>

        {/* Tags */}
        {detail.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {detail.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs text-neutral-600"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Action button */}
      <div className="mx-5 mt-4">
        {detail.isOwner ? (
          <Button variant="secondary" fullWidth disabled>
            {t("yourDeck")}
          </Button>
        ) : detail.isPurchased ? (
          <Button variant="secondary" fullWidth disabled>
            {t("alreadyInLibrary")}
          </Button>
        ) : isFree ? (
          <Button fullWidth onClick={handleAddToLibrary} disabled={isAdding}>
            {isAdding ? t("adding") : t("addToLibrary")}
          </Button>
        ) : (
          <Button fullWidth disabled>
            ${(detail.price / 100).toFixed(2)} — {t("comingSoon")}
          </Button>
        )}
      </div>

      {/* Sample Cards */}
      {detail.sampleCards.length > 0 && (
        <div className="mx-5 mt-6">
          <h3 className="mb-3 text-sm font-semibold text-neutral-700">
            {t("sampleCards")}
          </h3>
          <SampleCardList cards={detail.sampleCards} />
        </div>
      )}

      {/* Reviews */}
      <div className="mx-5 mt-6">
        <h3 className="mb-3 text-sm font-semibold text-neutral-700">
          {t("reviews", { count: detail.reviewCount })}
        </h3>

        {detail.isPurchased && !detail.isOwner && (
          <div className="mb-4">
            <ReviewForm
              deckId={deckId!}
              existingReview={existingReview}
              onSubmitted={handleReviewSubmitted}
            />
          </div>
        )}

        <ReviewList
          reviews={detail.reviews}
          currentUserId={user?.id}
          onDelete={handleReviewDeleted}
          onReportReview={(reviewId, userName) =>
            setReportTarget({ type: "review", id: reviewId, name: userName })
          }
          onBlockUser={(userId, userName) =>
            setBlockTarget({ id: userId, name: userName })
          }
        />
      </div>

      {/* Report modal */}
      {reportTarget && (
        <ReportModal
          isOpen
          onClose={() => setReportTarget(null)}
          targetType={reportTarget.type}
          targetId={reportTarget.id}
          displayName={reportTarget.name}
        />
      )}

      {/* Block confirm dialog */}
      <ConfirmDialog
        isOpen={!!blockTarget}
        onClose={() => setBlockTarget(null)}
        onConfirm={handleBlock}
        title={t("common:block.title", { name: blockTarget?.name })}
        message={t("common:block.message")}
        confirmLabel={t("common:block.confirm")}
        variant="danger"
        isLoading={isBlocking}
      />
    </div>
  );
}
