"use client";

import { Input } from "@/components/ui/input";

interface CpfFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

function formatCpf(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9)
    return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

export function CpfField({ value, onChange, placeholder, onKeyDown }: CpfFieldProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    onChange(formatCpf(e.target.value));
  }

  return (
    <Input
      value={value}
      onChange={handleChange}
      onKeyDown={onKeyDown}
      placeholder={placeholder ?? "000.000.000-00"}
      inputMode="numeric"
      maxLength={14}
      className="rounded-xl bg-surface-container-lowest border-0 h-12 text-base focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-b-2 focus-visible:border-primary transition-all"
    />
  );
}
