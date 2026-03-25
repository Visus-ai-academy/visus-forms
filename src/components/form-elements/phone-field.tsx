"use client";

import { Input } from "@/components/ui/input";

interface PhoneFieldProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

function applyPhoneMask(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);

  if (digits.length === 0) return "";
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  if (digits.length <= 10) {
    // Fixo: (XX) XXXX-XXXX
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  // Celular: (XX) XXXXX-XXXX
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export function PhoneField({ value, onChange, placeholder, onKeyDown }: PhoneFieldProps) {
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const masked = applyPhoneMask(e.target.value);
    onChange(masked);
  }

  return (
    <Input
      value={value}
      onChange={handleChange}
      placeholder={placeholder ?? "(00) 00000-0000"}
      type="tel"
      maxLength={15}
      onKeyDown={onKeyDown}
      className="rounded-xl bg-surface-container-lowest border-0 h-12 text-base focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-b-2 focus-visible:border-primary transition-all"
    />
  );
}
