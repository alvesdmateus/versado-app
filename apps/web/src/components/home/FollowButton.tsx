import { cn } from "@flashcard/ui";

interface FollowButtonProps {
  isFollowing: boolean;
  onToggle: () => void;
  size?: "sm" | "md";
}

export function FollowButton({
  isFollowing,
  onToggle,
  size = "sm",
}: FollowButtonProps) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      className={cn(
        "rounded-full font-medium transition-all",
        size === "sm" ? "px-3 py-1 text-xs" : "px-4 py-1.5 text-sm",
        isFollowing
          ? "bg-primary-500 text-white hover:bg-error-500"
          : "border border-primary-500 text-primary-500 hover:bg-primary-50"
      )}
    >
      {isFollowing ? "Following" : "Follow"}
    </button>
  );
}
