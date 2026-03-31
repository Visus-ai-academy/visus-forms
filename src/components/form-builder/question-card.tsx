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
  MapPin,
  MessageSquare,
  Phone,
  Star,
  ToggleLeft,
  Trash2,
  Type,
  Upload,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  ADDRESS: MapPin,
};

const typesWithOptions: QuestionType[] = [
  "SINGLE_SELECT",
  "MULTIPLE_CHOICE",
  "DROPDOWN",
];

const typeColorMap: Record<string, string> = {
  SHORT_TEXT: "bg-primary-fixed text-primary",
  LONG_TEXT: "bg-primary-fixed text-primary",
  MULTIPLE_CHOICE: "bg-accent text-accent-foreground",
  SINGLE_SELECT: "bg-accent text-accent-foreground",
  DROPDOWN: "bg-accent text-accent-foreground",
  NUMBER: "bg-success/10 text-success",
  DATE: "bg-surface-container-high text-on-surface",
  RATING: "bg-surface-container-high text-on-surface",
  FILE_UPLOAD: "bg-destructive/10 text-destructive",
  YES_NO: "bg-primary-fixed text-primary",
  EMAIL: "bg-primary-fixed text-primary",
  PHONE: "bg-primary-fixed text-primary",
  URL: "bg-primary-fixed text-primary",
  STATEMENT: "bg-muted text-muted-foreground",
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

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

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
        title: `${question.title} (cópia)`,
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

  function handleTitleChange(title: string) {
    updateQuestion(question.id, { title });
  }

  function handleRequiredChange(required: boolean) {
    updateQuestion(question.id, { required });
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

            <Badge className={`text-[10px] font-semibold border-0 ${typeColorMap[question.type] || "bg-muted text-muted-foreground"}`}>
              <Icon className="h-3 w-3 mr-1" />
              {QUESTION_TYPE_LABELS[question.type]}
            </Badge>

            <div className="flex-1" />

            {!locked && (
              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="rounded-lg text-on-surface/40 hover:text-on-surface/70 hover:bg-surface-container-low"
                  onClick={(e) => { e.stopPropagation(); handleDuplicate(); }}
                  aria-label="Duplicar pergunta"
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-xs"
                  className="rounded-lg text-on-surface/40 hover:text-destructive hover:bg-red-50"
                  onClick={(e) => { e.stopPropagation(); setShowDeleteDialog(true); }}
                  aria-label="Excluir pergunta"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            )}
          </div>

          {/* Title */}
          <Input
            value={question.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="text-sm font-semibold bg-transparent border-0 shadow-none px-0 h-auto py-0 focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:rounded-lg text-on-surface placeholder:text-on-surface/30"
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
                <span className="text-xs text-muted-foreground">Obrigatória</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir pergunta?</AlertDialogTitle>
            <AlertDialogDescription>
              Essa ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              onClick={() => { setShowDeleteDialog(false); handleDelete(); }}
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
