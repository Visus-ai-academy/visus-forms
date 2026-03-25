"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, Loader2 } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { FieldWrapper, QuestionField } from "@/components/form-elements";
import { Progress } from "@/components/ui/progress";
import { groupQuestionsIntoPages } from "@/lib/utils/page-groups";
import type { FormDefinition, Question } from "@/types/form";
import { QUESTION_TYPE_LABELS } from "@/types/form";

interface TypeformRendererProps {
  form: FormDefinition;
  onSubmit: (answers: Record<string, unknown>) => Promise<void>;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Aceita: (XX) XXXX-XXXX, (XX) XXXXX-XXXX, ou somente digitos 10-11
const PHONE_REGEX = /^(\(\d{2}\)\s?\d{4,5}-\d{4}|\d{10,11})$/;

function validateByType(question: Question, value: unknown): string | null {
  const strVal = typeof value === "string" ? value.trim() : "";
  const isArray = Array.isArray(value);

  if (question.required) {
    if (isArray) {
      if (value.length === 0) return "Selecione pelo menos uma opção";
    } else if (value === undefined || value === null || strVal === "") {
      return "Este campo é obrigatório";
    }
  }

  if (!isArray && !strVal && !question.required) return null;

  switch (question.type) {
    case "EMAIL":
      if (strVal && !EMAIL_REGEX.test(strVal)) return "Formato de e-mail inválido";
      break;
    case "PHONE": {
      const cleanPhone = strVal.replace(/\s/g, "");
      if (cleanPhone && !PHONE_REGEX.test(cleanPhone)) return "Formato inválido. Ex: (11) 99999-9999 ou (11) 3333-4444";
      break;
    }
      break;
    case "URL":
      if (strVal && !strVal.match(/^(https?:\/\/)?[\w.-]+\.\w{2,}/)) return "URL inválida";
      break;
    case "NUMBER":
    case "RATING":
      if (strVal && isNaN(Number(strVal))) return "Informe um número válido";
      break;
    case "DATE":
      if (strVal && isNaN(Date.parse(strVal))) return "Data inválida";
      break;
  }

  return null;
}

export function TypeformRenderer({ form, onSubmit }: TypeformRendererProps) {
  const questions = form.questions;
  const pages = useMemo(() => groupQuestionsIntoPages(questions), [questions]);

  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const currentPage = pages[currentPageIndex] ?? [];
  const isLastPage = currentPageIndex >= pages.length - 1;
  const isFirstPage = currentPageIndex <= 0;
  const progress = pages.length > 0 ? Math.round(((currentPageIndex + 1) / pages.length) * 100) : 0;

  const handleAnswer = useCallback((questionId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  }, []);

  const validateCurrentPage = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    for (const q of currentPage) {
      const error = validateByType(q, answers[q.id]);
      if (error) newErrors[q.id] = error;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentPage, answers]);

  function handleNext() {
    if (!validateCurrentPage()) return;
    if (isLastPage) {
      handleSubmit();
      return;
    }
    setDirection(1);
    setCurrentPageIndex((i) => i + 1);
  }

  function handlePrev() {
    if (isFirstPage) return;
    setDirection(-1);
    setCurrentPageIndex((i) => i - 1);
  }

  async function handleSubmit() {
    if (!validateCurrentPage()) return;
    setIsSubmitting(true);
    try {
      await onSubmit(answers);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-muted-foreground">Este formulário não possui perguntas.</p>
      </div>
    );
  }

  const btnRadius =
    form.theme?.buttonStyle === "pill" ? "9999px" : form.theme?.buttonStyle === "square" ? "4px" : "12px";
  const primaryColor = form.theme?.primaryColor ?? "#214037";

  return (
    <div className="flex flex-col min-h-screen" style={{
      backgroundColor: form.theme?.backgroundColor ?? "#ffffff",
      color: form.theme?.textColor ?? "#1f2937",
      fontFamily: form.theme?.fontFamily ?? "Inter",
      backgroundImage: form.theme?.backgroundImageUrl ? `url(${form.theme.backgroundImageUrl})` : undefined,
      backgroundSize: "cover",
      backgroundPosition: "center",
      backgroundAttachment: "fixed",
    }}>
      {/* Progress */}
      {form.settings?.showProgressBar !== false && (
        <div className="fixed top-0 left-0 right-0 z-50">
          <Progress value={progress} className="h-1 rounded-none" />
        </div>
      )}

      {/* Logo: fixo no desktop, normal no mobile */}
      {form.theme?.logoUrl && (
        <div className="px-6 pt-6 shrink-0 md:fixed md:top-4 md:left-6 md:z-40 md:p-0">
          <img src={form.theme.logoUrl} alt="Logo" className="h-10 object-contain" />
        </div>
      )}

      {/* Conteudo da pagina */}
      <div className="flex-1 flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentPageIndex}
              custom={direction}
              initial={{ opacity: 0, scale: direction === 1 ? 1.05 : 0.95, y: direction === 1 ? 40 : -40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: direction === 1 ? 0.95 : 1.05, y: direction === 1 ? -40 : 40 }}
              transition={{ duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="space-y-10">
                {currentPage.map((question, qIdx) => {
                  let globalIdx = 0;
                  for (let p = 0; p < currentPageIndex; p++) globalIdx += pages[p].length;
                  globalIdx += qIdx;

                  return (
                    <div key={question.id} className="rounded-2xl bg-white/90 backdrop-blur-sm p-6 shadow-sm">
                      {question.type === "STATEMENT" ? (
                        <QuestionField
                          type="STATEMENT"
                          value={null}
                          onChange={() => {}}
                          title={question.title}
                          description={question.description}
                        />
                      ) : (
                        <FieldWrapper
                          label={question.title}
                          description={question.description}
                          required={question.required}
                          error={errors[question.id]}
                          index={globalIdx}
                          typeLabel={QUESTION_TYPE_LABELS[question.type]}
                          titleColor={form.theme?.titleColor}
                        >
                          <QuestionField
                            type={question.type}
                            value={answers[question.id]}
                            onChange={(v) => handleAnswer(question.id, v)}
                            placeholder={question.placeholder}
                            options={question.options}
                            config={question.config}
                            onNext={currentPage.length === 1 ? handleNext : undefined}
                            formSlug={form.slug}
                            questionId={question.id}
                          />
                        </FieldWrapper>
                      )}
                    </div>
                  );
                })}

                {/* Botoes de navegacao -- abaixo da ultima pergunta */}
                <div className="flex items-center justify-between pt-2">
                  <button
                    onClick={handlePrev}
                    disabled={isFirstPage}
                    className="flex items-center gap-2 px-5 py-3 text-sm font-semibold rounded-xl transition-all duration-200 disabled:opacity-0 disabled:pointer-events-none"
                    style={{
                      backgroundColor: "rgba(255,255,255,0.9)",
                      backdropFilter: "blur(8px)",
                      color: primaryColor,
                      borderRadius: btnRadius,
                    }}
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </button>

                  <button
                    onClick={isLastPage ? handleSubmit : handleNext}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98] disabled:opacity-50"
                    style={{
                      background: `linear-gradient(135deg, ${primaryColor}, ${form.theme?.primaryColor ?? "#34594F"})`,
                      borderRadius: btnRadius,
                    }}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Enviando...
                      </>
                    ) : isLastPage ? (
                      <>
                        <Check className="h-4 w-4" />
                        Enviar respostas
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
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
