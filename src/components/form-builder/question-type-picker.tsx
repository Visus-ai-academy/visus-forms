"use client";

import {
  AlignLeft,
  Calendar,
  CheckSquare,
  ChevronDown,
  Circle,
  Hash,
  Link,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  Star,
  ToggleLeft,
  Type,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useFormBuilderStore } from "@/stores/form-builder-store";
import type { Question, QuestionType } from "@/types/form";
import { QUESTION_TYPE_LABELS } from "@/types/form";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  SHORT_TEXT: Type,
  LONG_TEXT: AlignLeft,
  MULTIPLE_CHOICE: CheckSquare,
  SINGLE_SELECT: Circle,
  DROPDOWN: ChevronDown,
  NUMBER: Hash,
  DATE: Calendar,
  RATING: Star,
  FILE_UPLOAD: Upload,
  YES_NO: ToggleLeft,
  EMAIL: Mail,
  PHONE: Phone,
  URL: Link,
  STATEMENT: MessageSquare,
};

const categories = [
  {
    name: "Texto",
    types: ["SHORT_TEXT", "LONG_TEXT"] as QuestionType[],
  },
  {
    name: "Escolha",
    types: ["SINGLE_SELECT", "MULTIPLE_CHOICE", "DROPDOWN", "YES_NO"] as QuestionType[],
  },
  {
    name: "Dados",
    types: ["NUMBER", "DATE", "EMAIL", "PHONE", "URL"] as QuestionType[],
  },
  {
    name: "Midia",
    types: ["RATING", "FILE_UPLOAD"] as QuestionType[],
  },
  {
    name: "Outro",
    types: ["STATEMENT"] as QuestionType[],
  },
];

interface QuestionTypePickerProps {
  formId: string;
}

export function QuestionTypePicker({ formId }: QuestionTypePickerProps) {
  const [open, setOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const { addQuestion } = useFormBuilderStore();

  async function handleSelect(type: QuestionType) {
    setIsCreating(true);

    try {
      const defaultOptions =
        type === "SINGLE_SELECT" || type === "MULTIPLE_CHOICE" || type === "DROPDOWN"
          ? [
              { label: "Opcao 1", value: "opcao_1" },
              { label: "Opcao 2", value: "opcao_2" },
            ]
          : undefined;

      const res = await fetch(`/api/forms/${formId}/questions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          title: QUESTION_TYPE_LABELS[type],
          required: false,
          config: {},
          options: defaultOptions,
        }),
      });

      if (!res.ok) {
        toast.error("Erro ao criar pergunta");
        return;
      }

      const { data } = await res.json();
      addQuestion(data as Question);
      setOpen(false);
    } catch {
      toast.error("Erro ao criar pergunta");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className="inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-xs transition-colors hover:bg-accent hover:text-accent-foreground"
      >
        <Plus className="mr-2 h-4 w-4" />
        Adicionar pergunta
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Escolher tipo de pergunta</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {categories.map((category) => (
            <div key={category.name}>
              <p className="mb-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {category.name}
              </p>
              <div className="grid grid-cols-2 gap-2">
                {category.types.map((type) => {
                  const Icon = iconMap[type];
                  return (
                    <button
                      key={type}
                      disabled={isCreating}
                      onClick={() => handleSelect(type)}
                      className="flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition-colors hover:bg-muted disabled:opacity-50"
                    >
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {QUESTION_TYPE_LABELS[type]}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
