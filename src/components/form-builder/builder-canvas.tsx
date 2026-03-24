"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { FileText } from "lucide-react";

import { useFormBuilderStore } from "@/stores/form-builder-store";

import { QuestionCard } from "./question-card";
import { QuestionTypePicker } from "./question-type-picker";

interface BuilderCanvasProps {
  formId: string;
}

export function BuilderCanvas({ formId }: BuilderCanvasProps) {
  const { form, reorderQuestions, setSelectedQuestion } = useFormBuilderStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  if (!form) return null;

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !form) return;

    const oldIndex = form.questions.findIndex((q) => q.id === active.id);
    const newIndex = form.questions.findIndex((q) => q.id === over.id);

    const newIds = [...form.questions.map((q) => q.id)];
    newIds.splice(oldIndex, 1);
    newIds.splice(newIndex, 0, active.id as string);

    reorderQuestions(newIds);

    await fetch(`/api/forms/${formId}/questions/reorder`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionIds: newIds }),
    });
  }

  return (
    <div className="flex h-full">
      {/* Lista de perguntas */}
      <div className="w-72 shrink-0 bg-surface-container-low overflow-y-auto p-4 space-y-3">
        <h2 className="text-sm font-bold font-heading text-on-surface uppercase tracking-wider px-1">
          Perguntas
        </h2>

        {form.questions.length === 0 ? (
          <div className="rounded-2xl bg-surface-container-lowest p-6 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground mb-3">
              Nenhuma pergunta ainda
            </p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={form.questions.map((q) => q.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-2">
                {form.questions.map((question, index) => (
                  <QuestionCard
                    key={question.id}
                    question={question}
                    formId={formId}
                    index={index}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        <QuestionTypePicker formId={formId} />
      </div>

      {/* Canvas principal: area de preview */}
      <div
        className="flex-1 bg-surface overflow-y-auto p-8"
        onClick={() => setSelectedQuestion(null)}
      >
        <div className="w-full max-w-xl mx-auto">
          {form.questions.length === 0 ? (
            <div className="text-center space-y-4">
              <p className="text-4xl font-extrabold font-heading text-on-surface/20 leading-tight">
                Digite sua pergunta aqui...
              </p>
              <p className="text-sm text-muted-foreground">
                Adicione perguntas na barra lateral para comecar a construir seu formulario.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {form.questions.map((q, i) => (
                <div key={q.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-primary bg-primary-fixed rounded-full h-6 w-6 flex items-center justify-center">
                      {i + 1}
                    </span>
                    <span className="text-[10px] uppercase tracking-wider font-semibold text-muted-foreground">
                      {q.type.replace(/_/g, " ")}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold font-heading text-on-surface leading-tight">
                    {q.title}
                  </h3>
                  {q.description && (
                    <p className="text-sm text-muted-foreground">{q.description}</p>
                  )}

                  {/* Preview de opcoes como tile selectors */}
                  {q.options.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      {q.options.map((opt) => (
                        <div
                          key={opt.id}
                          className="rounded-xl bg-surface-container-low p-4 transition-colors hover:bg-primary-fixed cursor-pointer"
                        >
                          <p className="text-sm font-semibold text-on-surface">{opt.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
