"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface DropdownFieldProps {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function DropdownField({
  options,
  value,
  onChange,
  placeholder,
}: DropdownFieldProps) {
  return (
    <Select
      value={value ?? ""}
      onValueChange={(val: string | null) => onChange(val ?? "")}
    >
      <SelectTrigger className="rounded-xl bg-surface-container-lowest border-0 h-12 text-base">
        <SelectValue placeholder={placeholder ?? "Selecione uma opcao..."} />
      </SelectTrigger>
      <SelectContent className="rounded-xl">
        {options.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="rounded-lg">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
