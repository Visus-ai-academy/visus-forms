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
import { Check, FileText, Loader2, Lock, UserCircle } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useFormBuilderStore } from "@/stores/form-builder-store";

import { QuestionCard } from "./question-card";
import { QuestionTypePicker } from "./question-type-picker";

interface BuilderCanvasProps {
  formId: string;
}

export function BuilderCanvas({ formId }: BuilderCanvasProps) {
  const { form, reorderQuestions, setSelectedQuestion, isQuestionsLocked, isDirty, markSaved } = useFormBuilderStore();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Identification state lifted here for fixed save button
  const [identificationState, setIdentificationState] = useState<{
    hasChanges: boolean;
    isSaving: boolean;
    save: (() => Promise<void>) | null;
  }>({ hasChanges: false, isSaving: false, save: null });

  const [isSaving, setIsSaving] = useState(false);

  const hasPendingChanges = isDirty || identificationState.hasChanges;

  if (!form) return null;

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !form || isQuestionsLocked) return;

    const oldIndex = form.questions.findIndex((q) => q.id === active.id);
    const newIndex = form.questions.findIndex((q) => q.id === over.id);

    const newIds = [...form.questions.map((q) => q.id)];
    newIds.splice(oldIndex, 1);
    newIds.splice(newIndex, 0, active.id as string);

    reorderQuestions(newIds);
  }

  async function handleSaveAll() {
    if (!form) return;
    setIsSaving(true);
    try {
      const promises: Promise<Response>[] = [];

      // Salvar cada pergunta (título, required, opções)
      if (isDirty) {
        for (const q of form.questions) {
          promises.push(
            fetch(`/api/forms/${formId}/questions/${q.id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                title: q.title,
                description: q.description,
                placeholder: q.placeholder,
                required: q.required,
                config: q.config,
                options: q.options.map((o) => ({
                  label: o.label,
                  value: o.value,
                  imageUrl: o.imageUrl,
                })),
              }),
            })
          );
        }

        // Salvar ordem
        promises.push(
          fetch(`/api/forms/${formId}/questions/reorder`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ questionIds: form.questions.map((q) => q.id) }),
          })
        );
      }

      // Salvar identificação
      if (identificationState.hasChanges && identificationState.save) {
        await identificationState.save();
      }

      if (promises.length > 0) {
        const results = await Promise.all(promises);
        const failed = results.some((r) => !r.ok);
        if (failed) {
          toast.error("Erro ao salvar algumas alterações");
        } else {
          markSaved();
          toast.success("Alterações salvas!");
        }
      }
    } catch {
      toast.error("Erro ao salvar");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="flex h-full">
      {/* Lista de perguntas */}
      <div className="w-72 shrink-0 bg-surface-container-low flex flex-col">
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 space-y-3">
            <h2 className="text-sm font-bold font-heading text-on-surface uppercase tracking-wider px-1">
              Perguntas
            </h2>

            {isQuestionsLocked && (
              <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 flex items-start gap-2">
                <Lock className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                <p className="text-[11px] text-amber-700 leading-tight">
                  Edição bloqueada. Despublique o formulário para editar perguntas.
                </p>
              </div>
            )}

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
                        locked={isQuestionsLocked}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {!isQuestionsLocked && <QuestionTypePicker formId={formId} />}

            {/* Identificação do respondente */}
            <IdentificationConfig formId={formId} onStateChange={setIdentificationState} />
          </div>
        </ScrollArea>

        {/* Botão salvar fixo no bottom */}
        <div className="p-3 border-t border-surface-container-high shrink-0">
          <button
            onClick={handleSaveAll}
            disabled={isSaving || !hasPendingChanges}
            className="btn-primary-gradient w-full py-2.5 text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
          >
            {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {isSaving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </div>

      {/* Canvas principal: area de preview */}
      <div
        className="flex-1 bg-surface overflow-y-auto p-8"
        onClick={() => setSelectedQuestion(null)}
      >
        <div className="w-full max-w-xl mx-auto">
          {form.questions.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-20">
              <FileText className="h-12 w-12 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">
                Nenhuma pergunta adicionada. Use o menu lateral para adicionar perguntas ao formulário.
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

                  {/* Preview de opções como tile selectors */}
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

interface IdentificationConfigProps {
  formId: string;
  onStateChange: (state: { hasChanges: boolean; isSaving: boolean; save: (() => Promise<void>) | null }) => void;
}

function IdentificationConfig({ formId, onStateChange }: IdentificationConfigProps) {
  const { form, updateSettings } = useFormBuilderStore();
  const settings = form?.settings;

  const [localMode, setLocalMode] = useState<string>((settings?.identificationMode as string) ?? "anonymous");
  const [localFields, setLocalFields] = useState<string[]>((settings?.identificationFields as string[]) ?? []);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const handleSave = useCallback(async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/forms/${formId}/settings`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identificationMode: localMode,
          identificationFields: localFields,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || "Erro ao salvar");
        return;
      }
      updateSettings({
        identificationMode: localMode,
        identificationFields: localFields,
      } as Partial<NonNullable<typeof settings>>);
      setHasChanges(false);
      toast.success("Configurações salvas!");
    } finally {
      setIsSaving(false);
    }
  }, [formId, localMode, localFields, updateSettings, settings]);

  // Sync state to parent for fixed save button
  useEffect(() => {
    onStateChange({ hasChanges, isSaving, save: handleSave });
  }, [hasChanges, isSaving, handleSave, onStateChange]);

  function handleModeChange(newMode: string) {
    setLocalMode(newMode);
    setHasChanges(true);
  }

  function handleFieldToggle(field: string, checked: boolean) {
    setLocalFields((prev) => {
      const updated = checked ? [...prev, field] : prev.filter((f) => f !== field);
      return updated;
    });
    setHasChanges(true);
  }

  return (
    <div className="space-y-3 pt-4 border-t border-surface-container-high">
      <p className="text-[10px] font-bold uppercase tracking-wider text-on-surface/40 flex items-center gap-1.5 px-1">
        <UserCircle className="h-3.5 w-3.5" />
        Identificação do respondente
      </p>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handleModeChange("anonymous")}
          className={`rounded-lg px-3 py-2 text-xs font-medium transition-all text-center ${
            localMode === "anonymous"
              ? "bg-primary-fixed text-primary"
              : "bg-surface-container-lowest text-on-surface/60 hover:bg-surface-container-low"
          }`}
        >
          Anônimo
        </button>
        <button
          onClick={() => handleModeChange("identified")}
          className={`rounded-lg px-3 py-2 text-xs font-medium transition-all text-center ${
            localMode === "identified"
              ? "bg-primary-fixed text-primary"
              : "bg-surface-container-lowest text-on-surface/60 hover:bg-surface-container-low"
          }`}
        >
          Identificado
        </button>
      </div>
      {localMode === "identified" && (
        <div className="space-y-2 pl-1">
          {(["name", "email", "cpf", "phone"] as const).map((field) => {
            const labels = { name: "Nome", email: "E-mail", cpf: "CPF", phone: "Telefone" };
            const isChecked = localFields.includes(field);
            return (
              <div key={field} className="flex items-center gap-2">
                <Checkbox
                  id={`id-field-editor-${field}`}
                  checked={isChecked}
                  onCheckedChange={(checked) => handleFieldToggle(field, !!checked)}
                />
                <label htmlFor={`id-field-editor-${field}`} className="text-xs text-on-surface/80">
                  {labels[field]}
                </label>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
