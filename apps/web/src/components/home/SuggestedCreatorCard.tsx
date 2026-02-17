import { Layers } from "lucide-react";
import type { SuggestedCreator } from "@/lib/social-api";
import { FollowButton } from "./FollowButton";

interface SuggestedCreatorCardProps {
  creator: SuggestedCreator;
  isFollowing: boolean;
  onToggleFollow: () => void;
}

export function SuggestedCreatorCard({
  creator,
  isFollowing,
  onToggleFollow,
}: SuggestedCreatorCardProps) {
  const initial = creator.displayName.charAt(0).toUpperCase();

  return (
    <div className="flex w-40 flex-shrink-0 flex-col items-center rounded-xl bg-neutral-0 p-4 shadow-card">
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
