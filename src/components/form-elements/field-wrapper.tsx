"use client";

import { cn } from "@/lib/utils";

interface FieldWrapperProps {
  label: string;
  description?: string | null;
  required?: boolean;
  error?: string;
  index?: number;
  typeLabel?: string;
  children: React.ReactNode;
  className?: string;
  titleColor?: string;
}

export function FieldWrapper({
  label,
  description,
  required,
  error,
  index,
  typeLabel,
  children,
  className,
  titleColor,
}: FieldWrapperProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div>
        <div className="flex items-center gap-2 mb-1">
          {typeof index === "number" && (
            <span className="text-xs font-semibold text-primary bg-primary/10 rounded-full h-5 w-5 flex items-center justify-center shrink-0">
              {index + 1}
            </span>
          )}
          {typeLabel && (
            <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
              {typeLabel}
            </span>
          )}
        </div>
        <h3 className="text-lg font-bold font-heading text-on-surface" style={titleColor ? { color: titleColor } : undefined}>
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </h3>
        {description && (
          <p className="text-sm text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      {children}
      {error && (
        <p className="text-xs text-destructive font-medium">{error}</p>
      )}
    </div>
  );
}
