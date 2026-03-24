"use client";

import { Star } from "lucide-react";
import { useState } from "react";

import { cn } from "@/lib/utils";

interface RatingFieldProps {
  value: number;
  onChange: (value: number) => void;
  max?: number;
}

export function RatingField({ value, onChange, max = 5 }: RatingFieldProps) {
  const [hover, setHover] = useState(0);

  return (
    <div className="flex gap-2">
      {Array.from({ length: max }, (_, i) => i + 1).map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="transition-transform hover:scale-110 active:scale-95"
        >
          <Star
            className={cn(
              "h-8 w-8 transition-colors",
              (hover || value) >= star
                ? "fill-amber-400 text-amber-400"
                : "text-on-surface/20"
            )}
          />
        </button>
      ))}
    </div>
  );
}
