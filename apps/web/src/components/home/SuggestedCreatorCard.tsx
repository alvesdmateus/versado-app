import { useTranslation } from "react-i18next";
import { Layers, MoreVertical, Flag, Ban } from "lucide-react";
import type { SuggestedCreator } from "@/lib/social-api";
import { DropdownMenu } from "@/components/shared";
import { FollowButton } from "./FollowButton";

interface SuggestedCreatorCardProps {
  creator: SuggestedCreator;
  isFollowing: boolean;
  onToggleFollow: () => void;
  onReport?: (creatorId: string, displayName: string) => void;
  onBlock?: (creatorId: string, displayName: string) => void;
}

export function SuggestedCreatorCard({
  creator,
  isFollowing,
  onToggleFollow,
  onReport,
  onBlock,
}: SuggestedCreatorCardProps) {
  const { t } = useTranslation("common");
  const initial = creator.displayName.charAt(0).toUpperCase();

  return (
    <div className="relative flex w-40 flex-shrink-0 flex-col items-center rounded-xl bg-neutral-0 p-4 shadow-card">
      {/* Report/block menu */}
      {(onReport || onBlock) && (
        <div className="absolute right-1 top-1">
          <DropdownMenu
            trigger={
              <span className="rounded-lg p-1 text-neutral-300 transition-colors hover:bg-neutral-100 hover:text-neutral-500">
                <MoreVertical className="h-3.5 w-3.5" />
              </span>
            }
            items={[
              ...(onReport
                ? [{
                    label: t("menu.reportUser"),
                    icon: <Flag className="h-4 w-4" />,
                    onClick: () => onReport(creator.id, creator.displayName),
                  }]
                : []),
              ...(onBlock
                ? [{
                    label: t("menu.blockUser"),
                    icon: <Ban className="h-4 w-4" />,
                    onClick: () => onBlock(creator.id, creator.displayName),
                    variant: "danger" as const,
                  }]
                : []),
            ]}
          />
        </div>
      )}
      {/* Avatar */}
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary-100 text-lg font-bold text-primary-600">
        {creator.avatarUrl ? (
          <img
            src={creator.avatarUrl}
            alt={creator.displayName}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          initial
        )}
      </div>

      {/* Name */}
      <h3 className="mt-2 w-full truncate text-center text-sm font-semibold text-neutral-900">
        {creator.displayName}
      </h3>

      {/* Deck count */}
      <div className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
        <Layers className="h-3 w-3" />
        <span>{creator.marketplaceDeckCount} decks</span>
      </div>

      {/* Matching tags */}
      {creator.matchingTags.length > 0 && (
        <div className="mt-1.5 flex flex-wrap justify-center gap-1">
          {creator.matchingTags.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-primary-50 px-1.5 py-0.5 text-[10px] text-primary-600"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* Follow button */}
      <div className="mt-3">
        <FollowButton isFollowing={isFollowing} onToggle={onToggleFollow} />
      </div>
    </div>
  );
}
