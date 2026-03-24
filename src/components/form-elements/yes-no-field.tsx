"use client";

import { ThumbsDown, ThumbsUp } from "lucide-react";

import { cn } from "@/lib/utils";

interface YesNoFieldProps {
  value: string;
  onChange: (value: string) => void;
}

export function YesNoField({ value, onChange }: YesNoFieldProps) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={() => onChange("sim")}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 rounded-xl py-4 text-sm font-semibold transition-all duration-200",
          value === "sim"
            ? "bg-emerald-50 text-emerald-600 border-2 border-emerald-200"
            : "bg-surface-container-lowest text-on-surface/60 border-2 border-transparent hover:bg-surface-container-low"
        )}
      >
        <ThumbsUp className="h-5 w-5" />
        Sim
      </button>
      <button
        type="button"
        onClick={() => onChange("nao")}
        className={cn(
          "flex-1 flex items-center justify-center gap-2 rounded-xl py-4 text-sm font-semibold transition-all duration-200",
          value === "nao"
            ? "bg-red-50 text-red-600 border-2 border-red-200"
            : "bg-surface-container-lowest text-on-surface/60 border-2 border-transparent hover:bg-surface-container-low"
        )}
      >
        <ThumbsDown className="h-5 w-5" />
        Nao
      </button>
    </div>
  );
}
