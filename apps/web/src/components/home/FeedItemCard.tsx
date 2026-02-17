import { Layers } from "lucide-react";
import type { FeedItem } from "@/lib/social-api";

interface FeedItemCardProps {
  item: FeedItem;
  onDeckClick: (deckId: string) => void;
}

function timeAgo(date: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(date).getTime()) / 1000
  );
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

export function FeedItemCard({ item, onDeckClick }: FeedItemCardProps) {
  const initial = item.creator.displayName.charAt(0).toUpperCase();

  return (
    <button
      onClick={() => onDeckClick(item.deck.id)}
      className="flex gap-3 rounded-xl bg-neutral-0 p-4 text-left shadow-card transition-all hover:shadow-card-hover active:scale-[0.99]"
    >
      {/* Avatar */}
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-sm font-bold text-primary-600">
        {item.creator.avatarUrl ? (
          <img
            src={item.creator.avatarUrl}
            alt={item.creator.displayName}
            className="h-full w-full rounded-full object-cover"
          />
        ) : (
          initial
        )}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="text-sm text-neutral-900">
          <span className="font-semibold">{item.creator.displayName}</span>
          {" published "}
          <span className="font-semibold">{item.deck.name}</span>
        </p>
        <p className="mt-0.5 text-xs text-neutral-400">
          {timeAgo(item.deck.updatedAt)}
          {item.matchReason === "followed_tag" && item.matchedTag && (
            <span>
              {" "}
              &middot; via{" "}
              <span className="text-primary-500">#{item.matchedTag}</span>
            </span>
          )}
        </p>

        {/* Mini deck preview */}
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-neutral-50 p-2">
          <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md bg-neutral-200">
            {item.deck.coverImageUrl ? (
              <img
                src={item.deck.coverImageUrl}
                alt={item.deck.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-primary-100 to-primary-200">
                <Layers className="h-4 w-4 text-primary-400" />
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium text-neutral-700">
              {item.deck.cardCount} cards
            </p>
            {item.deck.tags.length > 0 && (
              <div className="mt-0.5 flex gap-1 overflow-hidden">
                {item.deck.tags.slice(0, 3).map((tag) => (
                  <span
                    key={tag}
                    className="flex-shrink-0 rounded-full bg-neutral-100 px-1.5 py-0.5 text-[10px] text-neutral-500"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </button>
  );
}
