"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { FieldWrapper, QuestionField } from "@/components/form-elements";
import { type AnswerValue, getVisibleQuestions } from "@/lib/services/conditional-engine";
import type { FormDefinition, Question, QuestionLayout } from "@/types/form";
import { QUESTION_TYPE_LABELS } from "@/types/form";

interface ClassicRendererProps {
  form: FormDefinition;
  onSubmit: (answers: Record<string, unknown>) => Promise<void>;
}

function QuestionCard({
  question,
  index,
  value,
  error,
  onChange,
  titleColor,
  formSlug,
}: {
  question: Question;
  index: number;
  value: unknown;
  error?: string;
  onChange: (questionId: string, value: unknown) => void;
  titleColor?: string;
  formSlug?: string;
}) {
  if (question.type === "STATEMENT") {
    return (
      <QuestionField
        type="STATEMENT"
        value={null}
        onChange={() => {}}
        title={question.title}
        description={question.description}
      />
    );
  }

  return (
    <FieldWrapper
      label={question.title}
      description={question.description}
      required={question.required}
      error={error}
      index={index}
      typeLabel={QUESTION_TYPE_LABELS[question.type]}
      titleColor={titleColor}
    >
      <QuestionField
        type={question.type}
        value={value}
        onChange={(v) => onChange(question.id, v)}
        placeholder={question.placeholder}
        options={question.options}
        config={question.config}
        formSlug={formSlug}
        questionId={question.id}
      />
    </FieldWrapper>
  );
}

export function ClassicRenderer({ form, onSubmit }: ClassicRendererProps) {
  const questions = form.questions;
  const rules = useMemo(() => {
    return questions.flatMap((q) =>
      q.conditionalRules.map((r) => ({
        ...r,
        sourceQuestionId: q.id,
      }))
    );
  }, [questions]);

  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const answersMap = useMemo(() => {
    return new Map(Object.entries(answers)) as Map<string, AnswerValue>;
  }, [answers]);

  const visibleIds = useMemo(() => {
    return getVisibleQuestions(answersMap, questions, rules);
  }, [answersMap, questions, rules]);

  const visibleQuestions = useMemo(() => {
    return visibleIds
      .map((id) => questions.find((q) => q.id === id))
      .filter(Boolean) as typeof questions;
  }, [visibleIds, questions]);

  // Verificar se ha layout grid salvo (desktop)
  const hasGridLayout = useMemo(() => {
    return questions.some((q) =>
      q.layouts?.some((l: QuestionLayout) => l.breakpoint === "desktop")
    );
  }, [questions]);

  // Construir grid CSS a partir dos layouts
  const gridItems = useMemo(() => {
    if (!hasGridLayout) return null;

    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    const breakpoint = isMobile ? "mobile" : "desktop";

    return visibleQuestions.map((q) => {
      const layout = q.layouts?.find((l: QuestionLayout) => l.breakpoint === breakpoint)
        ?? q.layouts?.find((l: QuestionLayout) => l.breakpoint === "desktop");

      return {
        question: q,
        x: layout?.x ?? 0,
        y: layout?.y ?? 0,
        w: layout?.w ?? 12,
        h: layout?.h ?? 2,
      };
    });
  }, [visibleQuestions, hasGridLayout]);

  const handleAnswer = useCallback((questionId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  }, []);

  function validate(): boolean {
    const newErrors: Record<string, string> = {};

    for (const q of visibleQuestions) {
      if (!q.required) continue;
      const val = answers[q.id];
      if (val === undefined || val === null || val === "") {
        newErrors[q.id] = "Este campo é obrigatório";
      } else if (Array.isArray(val) && val.length === 0) {
        newErrors[q.id] = "Selecione pelo menos uma opção";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(answers);
    } finally {
      setIsSubmitting(false);
    }
  }

  const btnRadius =
    form.theme?.buttonStyle === "pill" ? "9999px" : form.theme?.buttonStyle === "square" ? "4px" : "12px";

  return (
    <div
      className="min-h-screen py-12 px-6"
      style={{
        backgroundColor: form.theme?.backgroundColor ?? "#ffffff",
        color: form.theme?.textColor ?? "#1f2937",
        fontFamily: form.theme?.fontFamily ?? "Inter",
        backgroundImage: form.theme?.backgroundImageUrl ? `url(${form.theme.backgroundImageUrl})` : undefined,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <form onSubmit={handleSubmit} className="mx-auto max-w-4xl">
        {/* Titulo */}
        <div className="space-y-2 mb-12">
          {form.theme?.logoUrl && (
            <img src={form.theme.logoUrl} alt="Logo" className="h-10 object-contain mb-4" />
          )}
          <h1 className="text-3xl font-bold font-heading" style={form.theme?.formTitleColor ? { color: form.theme.formTitleColor } : undefined}>{form.title}</h1>
          {form.description && (
            <p className="text-lg text-muted-foreground">{form.description}</p>
          )}
        </div>

        {/* Perguntas -- Grid layout ou lista */}
        {hasGridLayout && gridItems ? (
          <div
            className="grid gap-3"
            style={{
              gridTemplateColumns: "repeat(12, 1fr)",
            }}
          >
            {gridItems
              .sort((a, b) => a.y - b.y || a.x - b.x)
              .map((item, index) => (
                <motion.div
                  key={item.question.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  style={{
                    gridColumn: `${item.x + 1} / span ${item.w}`,
                  }}
                >
                  <div className="rounded-2xl bg-surface-container-lowest p-6 h-full">
                    <QuestionCard
                      question={item.question}
                      index={index}
                      value={answers[item.question.id]}
                      error={errors[item.question.id]}
                      onChange={handleAnswer}
                      titleColor={form.theme?.titleColor}
                      formSlug={form.slug}
                    />
                  </div>
                </motion.div>
              ))}
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {visibleQuestions.map((question, index) => (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                >
                  <div className="rounded-2xl bg-surface-container-lowest p-6">
                    <QuestionCard
                      question={question}
                      index={index}
                      value={answers[question.id]}
                      error={errors[question.id]}
                      onChange={handleAnswer}
                      titleColor={form.theme?.titleColor}
                      formSlug={form.slug}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}

        {/* Submit */}
        <div className="pt-8">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${form.theme?.primaryColor ?? "#3730a3"}, ${form.theme?.primaryColor ?? "#4f4bbc"})`,
              borderRadius: btnRadius,
            }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" />
                Enviar respostas
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
