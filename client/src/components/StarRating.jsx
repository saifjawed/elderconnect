import { useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const SIZE_MAP = {
  xs: "h-3 w-3",
  sm: "h-4 w-4",
  md: "h-5 w-5",
  lg: "h-6 w-6",
  xl: "h-7 w-7",
};

const StarRating = ({
  rating = 0,
  onRate,
  size = "md",
  showValue = false,
  className,
  readOnly,
}) => {
  const [hoverValue, setHoverValue] = useState(null);

  const numericRating = Number(rating) || 0;
  const clampedRating = Math.max(0, Math.min(5, numericRating));
  const currentDisplayValue = hoverValue !== null ? hoverValue : clampedRating;
  const isInteractive = typeof onRate === "function" && !readOnly;
  const iconSize = SIZE_MAP[size] || SIZE_MAP.md;

  const stars = Array.from({ length: 5 }, (_, index) => {
    const position = index + 1;
    const isFilled = currentDisplayValue >= position;
    const isHalf = !isFilled && currentDisplayValue >= position - 0.5;

    const handleClick = (e) => {
      if (!isInteractive) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const isLeftHalf = (e.clientX - rect.left) / rect.width < 0.5;
      onRate(position - (isLeftHalf ? 0.5 : 0));
    };

    const handleMouseMove = (e) => {
      if (!isInteractive) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const isLeftHalf = (e.clientX - rect.left) / rect.width < 0.5;
      setHoverValue(position - (isLeftHalf ? 0.5 : 0));
    };

    return (
      <span
        key={index}
        onClick={handleClick}
        onMouseMove={handleMouseMove}
        className={cn(
          "relative inline-flex shrink-0 p-0 transition-transform",
          isInteractive ? "cursor-pointer hover:scale-110 rounded" : "cursor-default"
        )}
      >
        <Star
          className={cn(iconSize, "text-gray-300")}
          aria-hidden="true"
        />
        {(isFilled || isHalf) && (
          <Star
            className={cn(
              iconSize,
              "absolute inset-0 fill-amber-400 text-amber-400"
            )}
            style={isHalf ? { clipPath: "inset(0 50% 0 0)" } : undefined}
            aria-hidden="true"
          />
        )}
      </span>
    );
  });

  return (
    <div
      className={cn("inline-flex items-center gap-1", className)}
      role={isInteractive ? "radiogroup" : "img"}
      aria-label={`Rating: ${clampedRating.toFixed(1)} out of 5`}
      onMouseLeave={() => isInteractive && setHoverValue(null)}
    >
      <div className="inline-flex items-center">{stars}</div>
      {showValue && (
        <span className="text-sm font-medium text-gray-700">
          {clampedRating.toFixed(1)}
        </span>
      )}
    </div>
  );
};

export default StarRating;
