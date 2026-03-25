"use client";

import { GripVertical, Plus, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useFormBuilderStore } from "@/stores/form-builder-store";
import type { Question } from "@/types/form";

interface QuestionOptionsEditorProps {
  question: Question;
  formId: string;
}

export function QuestionOptionsEditor({
  question,
  formId,
}: QuestionOptionsEditorProps) {
  const { updateQuestion } = useFormBuilderStore();

  function handleOptionChange(index: number, label: string) {
    const newOptions = question.options.map((opt, i) =>
      i === index ? { ...opt, label, value: label.toLowerCase().replace(/\s+/g, "_") } : opt
    );
    updateQuestion(question.id, { options: newOptions });
  }

  function handleAddOption() {
    const newIndex = question.options.length + 1;
    const newOptions = [
      ...question.options,
      {
        id: `temp-${Date.now()}`,
        questionId: question.id,
        label: `Opção ${newIndex}`,
        value: `opcao_${newIndex}`,
        order: question.options.length,
        imageUrl: null,
      },
    ];
    updateQuestion(question.id, { options: newOptions });
  }

  function handleRemoveOption(index: number) {
    if (question.options.length <= 1) return;
    const newOptions = question.options.filter((_, i) => i !== index);
    updateQuestion(question.id, { options: newOptions });
  }

  return (
    <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
      <p className="text-xs font-medium text-muted-foreground">Opções</p>

      {question.options.map((option, index) => (
        <div key={option.id} className="flex items-center gap-2">
          <GripVertical className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <Input
            value={option.label}
            onChange={(e) => handleOptionChange(index, e.target.value)}
            className="h-8 text-sm"
            placeholder={`Opção ${index + 1}`}
          />
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={() => handleRemoveOption(index)}
            disabled={question.options.length <= 1}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      ))}
      <Button
        variant="ghost"
        size="sm"
        className="text-xs"
        onClick={handleAddOption}
      >
        <Plus className="mr-1 h-3 w-3" />
        Adicionar opção
      </Button>
    </div>
  );
}
