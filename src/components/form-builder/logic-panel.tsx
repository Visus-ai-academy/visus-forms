"use client";

import { GitBranch, Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useFormBuilderStore } from "@/stores/form-builder-store";
import type { ConditionalRule, Question } from "@/types/form";
import { QUESTION_TYPE_LABELS } from "@/types/form";

import { LogicRuleRow } from "./logic-rule-row";

interface LogicPanelProps {
  formId: string;
}

export function LogicPanel({ formId }: LogicPanelProps) {
  const { form } = useFormBuilderStore();
  const [rules, setRules] = useState<Record<string, ConditionalRule[]>>(() => {
    if (!form) return {};
    const map: Record<string, ConditionalRule[]> = {};
    for (const q of form.questions) {
      if (q.conditionalRules.length > 0) {
        map[q.id] = q.conditionalRules;
      }
    }
    return map;
  });
  const [loadingQuestion, setLoadingQuestion] = useState<string | null>(null);

  if (!form) return null;

  async function handleAddRule(questionId: string) {
    setLoadingQuestion(questionId);

    try {
      const res = await fetch(
        `/api/forms/${formId}/questions/${questionId}/rules`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            operator: "EQUALS",
            value: "",
            action: "SKIP_TO",
            targetQuestionId: null,
          }),
        }
      );

      if (!res.ok) {
        toast.error("Erro ao criar regra");
        return;
      }

      const { data: newRule } = await res.json();
      setRules((prev) => ({
        ...prev,
        [questionId]: [...(prev[questionId] || []), newRule as ConditionalRule],
      }));
    } catch {
      toast.error("Erro ao criar regra");
    } finally {
      setLoadingQuestion(null);
    }
  }

  function handleDeleteRule(questionId: string, ruleId: string) {
    setRules((prev) => ({
      ...prev,
      [questionId]: (prev[questionId] || []).filter((r) => r.id !== ruleId),
    }));
  }

  function handleUpdateRule(
    questionId: string,
    ruleId: string,
    updates: Partial<ConditionalRule>
  ) {
    setRules((prev) => ({
      ...prev,
      [questionId]: (prev[questionId] || []).map((r) =>
        r.id === ruleId ? { ...r, ...updates } : r
      ),
    }));
  }

  return (
    <div className="flex h-full">
      {/* Lista de perguntas com regras */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-2xl space-y-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="rounded-xl bg-primary-fixed p-2.5">
              <GitBranch className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h2 className="text-lg font-bold font-heading text-on-surface">
                Lógica Condicional
              </h2>
              <p className="text-sm text-muted-foreground">
                Defina regras para controlar o fluxo do formulário.
              </p>
            </div>
          </div>

          {form.questions.length === 0 ? (
            <div className="rounded-2xl bg-surface-container-lowest p-8 text-center">
              <p className="text-muted-foreground">
                Adicione perguntas ao formulário para configurar a lógica condicional.
              </p>
            </div>
          ) : (
            form.questions.map((question, index) => {
              const questionRules = rules[question.id] || [];

              return (
                <div
                  key={question.id}
                  className="rounded-2xl bg-surface-container-low p-5 space-y-3"
                >
                  {/* Pergunta header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-primary bg-primary-fixed rounded-full h-6 w-6 flex items-center justify-center">
                        {index + 1}
                      </span>
                      <span className="text-sm font-semibold text-on-surface">
                        {question.title}
                      </span>
                      <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                        {QUESTION_TYPE_LABELS[question.type]}
                      </span>
                    </div>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleAddRule(question.id)}
                      disabled={loadingQuestion === question.id}
                      className="text-xs font-semibold text-primary hover:text-primary/80"
                    >
                      {loadingQuestion === question.id ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Plus className="h-3 w-3" />
                      )}
                      Adicionar regra
                    </Button>
                  </div>

                  {/* Regras */}
                  {questionRules.length === 0 ? (
                    <p className="text-xs text-muted-foreground pl-8">
                      Nenhuma regra. A próxima pergunta será exibida na ordem.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {questionRules.map((rule) => (
                        <LogicRuleRow
                          key={rule.id}
                          rule={rule}
                          questions={form.questions}
                          formId={formId}
                          sourceQuestionId={question.id}
                          onDelete={(ruleId) =>
                            handleDeleteRule(question.id, ruleId)
                          }
                          onUpdate={(ruleId, updates) =>
                            handleUpdateRule(question.id, ruleId, updates)
                          }
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
