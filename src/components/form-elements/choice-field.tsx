"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

interface ChoiceFieldProps {
  options: { label: string; value: string }[];
  value: string | string[];
  onChange: (value: string | string[]) => void;
  multiple?: boolean;
}

export function ChoiceField({
  options,
  value,
  onChange,
  multiple,
}: ChoiceFieldProps) {
  const selected = multiple
    ? Array.isArray(value)
      ? value
      : []
    : typeof value === "string"
      ? value
      : "";

  function handleSelect(optionValue: string) {
    if (multiple) {
      const arr = selected as string[];
      if (arr.includes(optionValue)) {
        onChange(arr.filter((v) => v !== optionValue));
      } else {
        onChange([...arr, optionValue]);
      }
    } else {
      onChange(optionValue);
    }
  }

  return (
    <div className="space-y-2">
      {options.map((opt) => {
        const isSelected = multiple
          ? (selected as string[]).includes(opt.value)
          : selected === opt.value;

        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => handleSelect(opt.value)}
            className={cn(
              "w-full text-left rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200",
              isSelected
                ? "bg-primary-fixed text-primary border-2 border-primary/20"
                : "bg-surface-container-lowest text-on-surface hover:bg-surface-container-low border-2 border-transparent"
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "h-5 w-5 rounded-md flex items-center justify-center shrink-0 transition-all",
                  multiple
                    ? isSelected
                      ? "bg-primary text-white"
                      : "border-2 border-on-surface/20"
                    : isSelected
                      ? "bg-primary text-white rounded-full"
                      : "border-2 border-on-surface/20 rounded-full"
                )}
              >
                {isSelected && <Check className="h-3 w-3" />}
              </div>
              <span>{opt.label}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}
