"use client";

import type { QuestionType } from "@/types/form";

import { ChoiceField } from "./choice-field";
import { DropdownField } from "./dropdown-field";
import { PhoneField } from "./phone-field";
import { RatingField } from "./rating-field";
import { StatementBlock } from "./statement-block";
import { TextField } from "./text-field";
import { YesNoField } from "./yes-no-field";

interface QuestionFieldProps {
  type: QuestionType;
  value: unknown;
  onChange: (value: unknown) => void;
  placeholder?: string | null;
  options?: { label: string; value: string }[];
  config?: Record<string, unknown>;
  title?: string;
  description?: string | null;
  onNext?: () => void;
}

export function QuestionField({
  type,
  value,
  onChange,
  placeholder,
  options = [],
  config = {},
  title = "",
  description,
  onNext,
}: QuestionFieldProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey && onNext) {
      e.preventDefault();
      onNext();
    }
  };

  switch (type) {
    case "SHORT_TEXT":
      return (
        <TextField
          value={String(value ?? "")}
          onChange={onChange}
          placeholder={placeholder ?? undefined}
          onKeyDown={handleKeyDown}
        />
      );

    case "LONG_TEXT":
      return (
        <TextField
          value={String(value ?? "")}
          onChange={onChange}
          placeholder={placeholder ?? undefined}
          multiline
        />
      );

    case "EMAIL":
      return (
        <TextField
          value={String(value ?? "")}
          onChange={onChange}
          placeholder={placeholder ?? "seu@email.com"}
          inputType="email"
          onKeyDown={handleKeyDown}
        />
      );

    case "PHONE":
      return (
        <PhoneField
          value={String(value ?? "")}
          onChange={onChange}
          placeholder={placeholder ?? "(00) 00000-0000"}
          onKeyDown={handleKeyDown}
        />
      );

    case "URL":
      return (
        <TextField
          value={String(value ?? "")}
          onChange={onChange}
          placeholder={placeholder ?? "https://"}
          inputType="url"
          onKeyDown={handleKeyDown}
        />
      );

    case "NUMBER":
      return (
        <TextField
          value={String(value ?? "")}
          onChange={(v) => onChange(v === "" ? "" : Number(v))}
          placeholder={placeholder ?? "0"}
          inputType="number"
          onKeyDown={handleKeyDown}
        />
      );

    case "DATE":
      return (
        <TextField
          value={String(value ?? "")}
          onChange={onChange}
          inputType="date"
          onKeyDown={handleKeyDown}
        />
      );

    case "RATING":
      return (
        <RatingField
          value={Number(value ?? 0)}
          onChange={onChange}
          max={(config.maxRating as number) || 5}
        />
      );

    case "YES_NO":
      return (
        <YesNoField value={String(value ?? "")} onChange={onChange} />
      );

    case "SINGLE_SELECT":
      return (
        <ChoiceField
          options={options}
          value={String(value ?? "")}
          onChange={onChange}
        />
      );

    case "MULTIPLE_CHOICE":
      return (
        <ChoiceField
          options={options}
          value={(value as string[]) ?? []}
          onChange={onChange}
          multiple
        />
      );

    case "DROPDOWN":
      return (
        <DropdownField
          options={options}
          value={String(value ?? "")}
          onChange={onChange}
          placeholder={placeholder ?? undefined}
        />
      );

    case "FILE_UPLOAD":
      return (
        <div className="rounded-xl border-2 border-dashed border-on-surface/10 bg-surface-container-lowest p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Upload de arquivos (em desenvolvimento)
          </p>
        </div>
      );

    case "STATEMENT":
      return <StatementBlock title={title} description={description} />;

    default:
      return (
        <TextField
          value={String(value ?? "")}
          onChange={onChange}
          placeholder={placeholder ?? undefined}
          onKeyDown={handleKeyDown}
        />
      );
  }
}

export { ChoiceField } from "./choice-field";
export { DropdownField } from "./dropdown-field";
export { FieldWrapper } from "./field-wrapper";
export { RatingField } from "./rating-field";
export { StatementBlock } from "./statement-block";
export { TextField } from "./text-field";
export { YesNoField } from "./yes-no-field";
