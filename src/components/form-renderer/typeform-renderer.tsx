"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { FieldWrapper, QuestionField } from "@/components/form-elements";
import { Progress } from "@/components/ui/progress";
import { type AnswerValue, evaluateNextQuestion } from "@/lib/services/conditional-engine";
import type { FormDefinition, Question } from "@/types/form";
import { QUESTION_TYPE_LABELS } from "@/types/form";

interface TypeformRendererProps {
  form: FormDefinition;
  onSubmit: (answers: Record<string, unknown>) => Promise<void>;
}

export function TypeformRenderer({ form, onSubmit }: TypeformRendererProps) {
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
  const [history, setHistory] = useState<string[]>([questions[0]?.id ?? ""]);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentQuestionId = history[history.length - 1];
  const currentQuestion = questions.find((q) => q.id === currentQuestionId);
  const currentIndex = questions.findIndex((q) => q.id === currentQuestionId);

  const answersMap = useMemo(() => {
    return new Map(Object.entries(answers)) as Map<string, AnswerValue>;
  }, [answers]);

  const progress = useMemo(() => {
    if (questions.length === 0) return 0;
    return Math.round(((history.length - 1) / questions.length) * 100);
  }, [history, questions.length]);

  const handleAnswer = useCallback((questionId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  }, []);

  const validateCurrent = useCallback((): boolean => {
    if (!currentQuestion) return true;
    if (!currentQuestion.required) return true;

    const val = answers[currentQuestion.id];
    if (val === undefined || val === null || val === "") {
      setErrors({ [currentQuestion.id]: "Este campo e obrigatorio" });
      return false;
    }
    if (Array.isArray(val) && val.length === 0) {
      setErrors({ [currentQuestion.id]: "Selecione pelo menos uma opcao" });
      return false;
    }
    return true;
  }, [currentQuestion, answers]);

  const handleNext = useCallback(() => {
    if (!currentQuestionId) return;
    if (!validateCurrent()) return;

    const nextId = evaluateNextQuestion(
      currentQuestionId,
      answersMap,
      questions,
      rules
    );

    if (nextId === null) {
      handleSubmit();
      return;
    }

    setDirection(1);
    setHistory((prev) => [...prev, nextId]);
  }, [currentQuestionId, answersMap, questions, rules, validateCurrent]);

  const handlePrev = useCallback(() => {
    if (history.length <= 1) return;
    setDirection(-1);
    setHistory((prev) => prev.slice(0, -1));
  }, [history]);

  async function handleSubmit() {
    if (!validateCurrent()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(answers);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!currentQuestion || questions.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Este formulario nao possui perguntas.</p>
      </div>
    );
  }

  const isLastQuestion = evaluateNextQuestion(currentQuestionId, answersMap, questions, rules) === null;

  return (
    <div className="flex flex-col min-h-screen" style={{
      backgroundColor: form.theme?.backgroundColor ?? "#ffffff",
      color: form.theme?.textColor ?? "#1f2937",
    }}>
      {/* Progress */}
      {form.settings?.showProgressBar !== false && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <Progress
            value={progress}
            className="h-1 rounded-none"
          />
        </div>
      )}

      {/* Conteudo */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentQuestionId}
              custom={direction}
              initial={{ opacity: 0, scale: direction === 1 ? 1.05 : 0.95, y: direction === 1 ? 40 : -40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: direction === 1 ? 0.95 : 1.05, y: direction === 1 ? -40 : 40 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            >
              {currentQuestion.type === "STATEMENT" ? (
                <QuestionField
                  type="STATEMENT"
                  value={null}
                  onChange={() => {}}
                  title={currentQuestion.title}
                  description={currentQuestion.description}
                />
              ) : (
                <FieldWrapper
                  label={currentQuestion.title}
                  description={currentQuestion.description}
                  required={currentQuestion.required}
                  error={errors[currentQuestion.id]}
                  index={currentIndex}
                  typeLabel={QUESTION_TYPE_LABELS[currentQuestion.type]}
                >
                  <QuestionField
                    type={currentQuestion.type}
                    value={answers[currentQuestion.id]}
                    onChange={(v) => handleAnswer(currentQuestion.id, v)}
                    placeholder={currentQuestion.placeholder}
                    options={currentQuestion.options}
                    config={currentQuestion.config}
                    onNext={handleNext}
                  />
                </FieldWrapper>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navegacao */}
      <div className="fixed bottom-0 left-0 right-0 p-6">
        <div className="max-w-xl mx-auto flex items-center justify-between">
          <button
            onClick={handlePrev}
            disabled={history.length <= 1}
            className="rounded-xl p-3 text-on-surface/50 hover:bg-surface-container-low transition-colors disabled:opacity-30"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          <button
            onClick={isLastQuestion ? handleSubmit : handleNext}
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-3xl px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
            style={{
              background: `linear-gradient(135deg, ${form.theme?.primaryColor ?? "#3730a3"}, ${form.theme?.primaryColor ?? "#4f4bbc"})`,
            }}
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : isLastQuestion ? (
              <>
                <Check className="h-4 w-4" />
                Enviar
              </>
            ) : (
              <>
                Continuar
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
