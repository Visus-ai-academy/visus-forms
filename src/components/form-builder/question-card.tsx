"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  AlignLeft,
  Calendar,
  CheckSquare,
  ChevronDown,
  Circle,
  Copy,
  GripVertical,
  Hash,
  Link,
  Mail,
  MessageSquare,
  Phone,
  Star,
  ToggleLeft,
  Trash2,
  Type,
  Upload,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useFormBuilderStore } from "@/stores/form-builder-store";
import type { Question, QuestionType } from "@/types/form";
import { QUESTION_TYPE_LABELS } from "@/types/form";

import { QuestionOptionsEditor } from "./question-options-editor";

const iconMap: Record<QuestionType, React.ComponentType<{ className?: string }>> = {
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

const typesWithOptions: QuestionType[] = [
  "SINGLE_SELECT",
  "MULTIPLE_CHOICE",
  "DROPDOWN",
];

const typeColorMap: Record<string, string> = {
  SHORT_TEXT: "bg-blue-100 text-blue-700",
  LONG_TEXT: "bg-blue-100 text-blue-700",
  MULTIPLE_CHOICE: "bg-violet-100 text-violet-700",
  SINGLE_SELECT: "bg-violet-100 text-violet-700",
  DROPDOWN: "bg-violet-100 text-violet-700",
  NUMBER: "bg-emerald-100 text-emerald-700",
  DATE: "bg-amber-100 text-amber-700",
  RATING: "bg-amber-100 text-amber-700",
  FILE_UPLOAD: "bg-rose-100 text-rose-700",
  YES_NO: "bg-teal-100 text-teal-700",
  EMAIL: "bg-cyan-100 text-cyan-700",
  PHONE: "bg-cyan-100 text-cyan-700",
  URL: "bg-cyan-100 text-cyan-700",
  STATEMENT: "bg-gray-100 text-gray-700",
};

interface QuestionCardProps {
  question: Question;
  formId: string;
  index: number;
  locked?: boolean;
}

export function QuestionCard({ question, formId, index, locked = false }: QuestionCardProps) {
  const {
    selectedQuestionId,
    setSelectedQuestion,
    updateQuestion,
    removeQuestion,
    duplicateQuestion,
  } = useFormBuilderStore();

  const isSelected = selectedQuestionId === question.id;
  const Icon = iconMap[question.type];
  const hasOptions = typesWithOptions.includes(question.type);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  async function handleDelete() {
    const res = await fetch(`/api/forms/${formId}/questions/${question.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Erro ao remover pergunta");
      return;
    }
    removeQuestion(question.id);
  }

  async function handleDuplicate() {
    const res = await fetch(`/api/forms/${formId}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: question.type,
        title: `${question.title} (copia)`,
        description: question.description,
        placeholder: question.placeholder,
        required: question.required,
        config: question.config,
        options: question.options.map((o) => ({
          label: o.label,
          value: o.value,
          imageUrl: o.imageUrl,
        })),
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Erro ao duplicar pergunta");
      return;
    }

    const { data } = await res.json();
    duplicateQuestion(question.id, data as Question);
  }

  async function handleTitleChange(title: string) {
    updateQuestion(question.id, { title });
    const res = await fetch(`/api/forms/${formId}/questions/${question.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Erro ao salvar");
    }
  }

  async function handleRequiredChange(required: boolean) {
    updateQuestion(question.id, { required });
    const res = await fetch(`/api/forms/${formId}/questions/${question.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ required }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      toast.error(data.error || "Erro ao salvar");
    }
  }

  return (
    <div ref={setNodeRef} style={style}>
      <div
        className={`group rounded-2xl transition-all duration-200 cursor-pointer ${
          isSelected
            ? "bg-surface-container-lowest shadow-ambient"
            : "bg-surface-container-lowest/60 hover:bg-surface-container-lowest hover:shadow-ambient"
        }`}
        onClick={() => setSelectedQuestion(question.id)}
      >
        <div className="p-4 space-y-3">
          {/* Header row */}
          <div className="flex items-center gap-2">
            <button
              className={`touch-none text-on-surface/30 transition-colors ${locked ? "cursor-not-allowed opacity-30" : "cursor-grab hover:text-on-surface/60"}`}
              {...(locked ? {} : { ...attributes, ...listeners })}
            >
              <GripVertical className="h-4 w-4" />
            </button>

            <span className="text-xs font-semibold text-muted-foreground">
              {index + 1}.
            </span>

            <Badge className={`text-[10px] font-semibold border-0 ${typeColorMap[question.type] || "bg-gray-100 text-gray-700"}`}>
              <Icon className="h-3 w-3 mr-1" />
              {QUESTION_TYPE_LABELS[question.type]}
            </Badge>

            <div className="flex-1" />

            {!locked && (
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  className="rounded-lg p-1.5 text-on-surface/40 hover:text-on-surface/70 hover:bg-surface-container-low transition-colors"
                  onClick={(e) => { e.stopPropagation(); handleDuplicate(); }}
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button
                  className="rounded-lg p-1.5 text-on-surface/40 hover:text-destructive hover:bg-red-50 transition-colors"
                  onClick={(e) => { e.stopPropagation(); handleDelete(); }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )}
          </div>

          {/* Title */}
          <Input
            value={question.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="text-sm font-semibold bg-transparent border-0 shadow-none px-0 h-auto py-0 focus-visible:ring-0 text-on-surface placeholder:text-on-surface/30"
            placeholder="Digite sua pergunta aqui..."
            onClick={(e) => e.stopPropagation()}
            disabled={locked}
            readOnly={locked}
          />

          {/* Options editor */}
          {isSelected && hasOptions && !locked && (
            <QuestionOptionsEditor question={question} formId={formId} />
          )}

          {/* Settings */}
          {isSelected && !locked && (
            <div className="flex items-center gap-4 pt-3">
              <div className="flex items-center gap-2">
                <Switch
                  checked={question.required}
                  onCheckedChange={handleRequiredChange}
                />
                <span className="text-xs text-muted-foreground">Obrigatoria</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
