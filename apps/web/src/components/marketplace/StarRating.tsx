import { Star } from "lucide-react";

interface StarRatingProps {
  rating: number;
  size?: "sm" | "md";
  showValue?: boolean;
}

export function StarRating({ rating, size = "sm", showValue = false }: StarRatingProps) {
  const iconSize = size === "sm" ? "h-3.5 w-3.5" : "h-5 w-5";

  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => {
        const filled = i < Math.round(rating);
        return (
          <Star
            key={i}
            className={`${iconSize} ${
              filled
                ? "fill-warning-500 text-warning-500"
                : "text-neutral-300"
            }`}
          />
        );
      })}
      {showValue && (
        <span className={`ml-1 font-semibold text-neutral-700 ${size === "sm" ? "text-xs" : "text-sm"}`}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
