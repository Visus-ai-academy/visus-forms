"use client";

import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface TextFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  multiline?: boolean;
  inputType?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export function TextField({
  value,
  onChange,
  placeholder,
  multiline,
  inputType = "text",
  onKeyDown,
}: TextFieldProps) {
  if (multiline) {
    return (
      <Textarea
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? "Digite sua resposta..."}
        className="rounded-xl bg-surface-container-lowest border-0 min-h-[120px] text-base focus:ring-0 focus-visible:ring-0 focus-visible:border-b-2 focus-visible:border-primary transition-all"
      />
    );
  }

  return (
    <Input
      type={inputType}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder ?? "Digite sua resposta..."}
      onKeyDown={onKeyDown}
      className="rounded-xl bg-surface-container-lowest border-0 h-12 text-base focus:ring-0 focus-visible:ring-0 focus-visible:border-b-2 focus-visible:border-primary transition-all"
    />
  );
}
