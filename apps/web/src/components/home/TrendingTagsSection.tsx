import type { TrendingTag } from "@/lib/social-api";
import { SectionHeader } from "./SectionHeader";

interface TrendingTagsSectionProps {
  tags: TrendingTag[];
  followedTags: Set<string>;
  onToggleTag: (tag: string) => void;
}

export function TrendingTagsSection({
  tags,
  followedTags,
  onToggleTag,
}: TrendingTagsSectionProps) {
  if (tags.length === 0) return null;

  return (
    <section className="mt-6">
      <SectionHeader title="Trending Topics" />
      <div className="scrollbar-hide mt-3 flex gap-2 overflow-x-auto px-5 pb-1">
        {tags.map((t) => {
          const isFollowed = followedTags.has(t.tag.toLowerCase());
          return (
            <button
              key={t.tag}
              onClick={() => onToggleTag(t.tag)}
              className={`flex-shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-all ${
                isFollowed
                  ? "bg-primary-500 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              #{t.tag}
            </button>
          );
        })}
      </div>
    </section>
  );
}
