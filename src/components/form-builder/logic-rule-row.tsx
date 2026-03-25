"use client";

import { Loader2, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ACTION_LABELS,
  OPERATOR_LABELS,
} from "@/lib/services/conditional-engine";
import type {
  ConditionalAction,
  ConditionalOperator,
  ConditionalRule,
  Question,
} from "@/types/form";

const operators: ConditionalOperator[] = [
  "EQUALS",
  "NOT_EQUALS",
  "CONTAINS",
  "NOT_CONTAINS",
  "GREATER_THAN",
  "LESS_THAN",
  "IS_EMPTY",
  "IS_NOT_EMPTY",
  "IN_LIST",
];

const actions: ConditionalAction[] = ["SKIP_TO", "HIDE", "SHOW", "END_FORM"];

interface LogicRuleRowProps {
  rule: ConditionalRule;
  questions: Question[];
  formId: string;
  sourceQuestionId: string;
  onDelete: (ruleId: string) => void;
  onUpdate: (ruleId: string, updates: Partial<ConditionalRule>) => void;
}

export function LogicRuleRow({
  rule,
  questions,
  formId,
  sourceQuestionId,
  onDelete,
  onUpdate,
}: LogicRuleRowProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const needsValue = !["IS_EMPTY", "IS_NOT_EMPTY"].includes(rule.operator);
  const needsTarget = ["SKIP_TO", "HIDE", "SHOW"].includes(rule.action);
  const otherQuestions = questions.filter((q) => q.id !== sourceQuestionId);

  async function handleFieldChange(field: string, value: string) {
    const updates: Record<string, unknown> = { [field]: value };

    if (field === "action" && value === "END_FORM") {
      updates.targetQuestionId = null;
    }

    onUpdate(rule.id, updates as Partial<ConditionalRule>);

    await fetch(
      `/api/forms/${formId}/questions/${sourceQuestionId}/rules/${rule.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      }
    );
  }

  async function handleDelete() {
    setIsDeleting(true);
    const res = await fetch(
      `/api/forms/${formId}/questions/${sourceQuestionId}/rules/${rule.id}`,
      { method: "DELETE" }
    );

    if (!res.ok) {
      toast.error("Erro ao excluir regra");
      setIsDeleting(false);
      return;
    }

    onDelete(rule.id);
  }

  return (
    <div className="rounded-xl bg-surface-container-lowest p-4 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Regra condicional
        </p>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label="Excluir regra"
          className="rounded-lg text-on-surface/40 hover:text-destructive hover:bg-red-50"
        >
          {isDeleting ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Trash2 className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {/* Se a resposta... */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Se a resposta...</p>
        <div className="flex gap-2">
          <select
            value={rule.operator}
            onChange={(e) => handleFieldChange("operator", e.target.value)}
            aria-label="Selecionar condição"
            className="flex-1 rounded-lg bg-surface-container-low border-0 px-3 py-2 text-sm text-on-surface"
          >
            {operators.map((op) => (
              <option key={op} value={op}>
                {OPERATOR_LABELS[op]}
              </option>
            ))}
          </select>

          {needsValue && (
            <Input
              value={rule.value}
              onChange={(e) => handleFieldChange("value", e.target.value)}
              placeholder="Valor"
              className="flex-1 rounded-lg bg-surface-container-low border-0 h-auto py-2 text-sm"
            />
          )}
        </div>
      </div>

      {/* Entao... */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">Então...</p>
        <div className="flex gap-2">
          <select
            value={rule.action}
            onChange={(e) => handleFieldChange("action", e.target.value)}
            aria-label="Selecionar ação"
            className="flex-1 rounded-lg bg-surface-container-low border-0 px-3 py-2 text-sm text-on-surface"
          >
            {actions.map((act) => (
              <option key={act} value={act}>
                {ACTION_LABELS[act]}
              </option>
            ))}
          </select>

          {needsTarget && (
            <select
              value={rule.targetQuestionId || ""}
              onChange={(e) => handleFieldChange("targetQuestionId", e.target.value)}
              aria-label="Selecionar pergunta de destino"
              className="flex-1 rounded-lg bg-surface-container-low border-0 px-3 py-2 text-sm text-on-surface"
            >
              <option value="">Selecione...</option>
              {otherQuestions.map((q, i) => (
                <option key={q.id} value={q.id}>
                  {i + 1}. {q.title}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </div>
  );
}
