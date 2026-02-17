import { Star } from "lucide-react";

interface StarRatingInputProps {
  value: number;
  onChange: (rating: number) => void;
}

export function StarRatingInput({ value, onChange }: StarRatingInputProps) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: 5 }, (_, i) => {
        const starValue = i + 1;
        const filled = starValue <= value;
        return (
          <button
            key={i}
            type="button"
            onClick={() => onChange(starValue)}
            className="p-1 transition-transform active:scale-90"
          >
            <Star
              className={`h-7 w-7 ${
                filled
                  ? "fill-warning-500 text-warning-500"
                  : "text-neutral-300"
              }`}
            />
          </button>
        );
      })}
    </div>
  );
}
