"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { FieldWrapper, QuestionField } from "@/components/form-elements";
import { groupQuestionsIntoPages } from "@/lib/utils/page-groups";
import { useFormBuilderStore } from "@/stores/form-builder-store";
import type { FormDefinition, QuestionLayout } from "@/types/form";
import { QUESTION_TYPE_LABELS } from "@/types/form";

import { DeviceFrame } from "./device-frame";

interface BuilderPreviewProps {
  formId: string;
}

export function BuilderPreview({ formId }: BuilderPreviewProps) {
  const { form, previewDevice, setPreviewDevice } = useFormBuilderStore();
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);

  if (!form) return null;

  const mode = form.settings?.presentationMode ?? "ONE_AT_A_TIME";
  const questions = form.questions;
  const btnRadius =
    form.theme?.buttonStyle === "pill" ? "9999px" : form.theme?.buttonStyle === "square" ? "4px" : "12px";
  const primaryColor = form.theme?.primaryColor ?? "#3730a3";

  const hasGridLayout = questions.some((q) =>
    q.layouts?.some((l: QuestionLayout) => l.breakpoint === "desktop")
  );

  return (
    <div className="flex-1 flex items-center justify-center p-6 bg-surface-container-low h-full overflow-y-auto">
      <DeviceFrame device={previewDevice} onDeviceChange={setPreviewDevice}>
        <div
          className="min-h-full"
          style={{
            backgroundColor: form.theme?.backgroundColor ?? "#ffffff",
            color: form.theme?.textColor ?? "#1f2937",
            fontFamily: form.theme?.fontFamily ?? "Inter",
            backgroundImage: form.theme?.backgroundImageUrl ? `url(${form.theme.backgroundImageUrl})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {questions.length === 0 ? (
            <div className="flex items-center justify-center h-full p-8">
              <p className="text-sm opacity-40">
                Adicione perguntas na aba Editor para visualizar o preview.
              </p>
            </div>
          ) : mode === "ONE_AT_A_TIME" ? (
            <TypeformPreview
              form={form}
              answers={answers}
              setAnswers={setAnswers}
              currentIndex={currentIndex}
              setCurrentIndex={setCurrentIndex}
              direction={direction}
              setDirection={setDirection}
              primaryColor={primaryColor}
              btnRadius={btnRadius}
            />
          ) : (
            <ClassicPreview
              form={form}
              answers={answers}
              setAnswers={setAnswers}
              primaryColor={primaryColor}
              btnRadius={btnRadius}
              hasGridLayout={hasGridLayout}
            />
          )}
        </div>
      </DeviceFrame>
    </div>
  );
}

/** Preview modo TypeForm -- uma pergunta por vez */
function TypeformPreview({
  form,
  answers,
  setAnswers,
  currentIndex,
  setCurrentIndex,
  direction,
  setDirection,
  primaryColor,
  btnRadius,
}: {
  form: FormDefinition;
  answers: Record<string, unknown>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  currentIndex: number;
  setCurrentIndex: React.Dispatch<React.SetStateAction<number>>;
  direction: 1 | -1;
  setDirection: React.Dispatch<React.SetStateAction<1 | -1>>;
  primaryColor: string;
  btnRadius: string;
}) {
  const pages = useMemo(() => groupQuestionsIntoPages(form.questions), [form.questions]);
  const currentPage = pages[currentIndex] ?? [];
  const isLast = currentIndex >= pages.length - 1;
  const progress = pages.length > 0 ? Math.round(((currentIndex + 1) / pages.length) * 100) : 0;

  function handleNext() {
    if (isLast) return;
    setDirection(1);
    setCurrentIndex((i) => i + 1);
  }

  function handlePrev() {
    if (currentIndex <= 0) return;
    setDirection(-1);
    setCurrentIndex((i) => i - 1);
  }

  if (pages.length === 0) return null;

  // Calcula indice global para numeracao
  let globalOffset = 0;
  for (let p = 0; p < currentIndex; p++) globalOffset += pages[p].length;

  return (
    <div className="flex flex-col h-full min-h-[500px]">
      {/* Progress bar */}
      {form.settings?.showProgressBar !== false && (
        <div className="h-1 bg-black/5">
          <div className="h-full transition-all duration-300" style={{ width: `${progress}%`, backgroundColor: primaryColor }} />
        </div>
      )}

      {/* Logo */}
      {form.theme?.logoUrl && (
        <div className="px-6 pt-4 shrink-0">
          <img src={form.theme.logoUrl} alt="Logo" className="h-8 object-contain" />
        </div>
      )}

      {/* Conteudo */}
      <div className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-md">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              initial={{ opacity: 0, y: direction === 1 ? 30 : -30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: direction === 1 ? -30 : 30 }}
              transition={{ duration: 0.35, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="space-y-8">
                {currentPage.map((question, qIdx) => (
                  <div key={question.id} className="rounded-2xl bg-white/90 backdrop-blur-sm p-6 shadow-sm">
                    {question.type === "STATEMENT" ? (
                      <QuestionField type="STATEMENT" value={null} onChange={() => {}} title={question.title} description={question.description} />
                    ) : (
                      <FieldWrapper label={question.title} description={question.description} required={question.required} index={globalOffset + qIdx} typeLabel={QUESTION_TYPE_LABELS[question.type]} titleColor={form.theme?.titleColor}>
                        <QuestionField
                          type={question.type}
                          value={answers[question.id]}
                          onChange={(v) => setAnswers((prev) => ({ ...prev, [question.id]: v }))}
                          placeholder={question.placeholder}
                          options={question.options}
                          config={question.config}
                          onNext={currentPage.length === 1 ? handleNext : undefined}
                        />
                      </FieldWrapper>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Navegacao */}
      <div className="p-4 flex items-center justify-between">
        <button onClick={handlePrev} disabled={currentIndex <= 0} className="rounded-xl p-2.5 opacity-50 hover:opacity-100 transition-opacity disabled:opacity-20">
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button onClick={isLast ? undefined : handleNext} className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-white transition-all hover:brightness-110 active:scale-[0.98]" style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`, borderRadius: btnRadius }}>
          {isLast ? (<><Check className="h-3.5 w-3.5" />Enviar</>) : (<>Continuar<ArrowRight className="h-3.5 w-3.5" /></>)}
        </button>
      </div>
    </div>
  );
}

/** Preview modo classico -- todas de uma vez */
function ClassicPreview({
  form,
  answers,
  setAnswers,
  primaryColor,
  btnRadius,
  hasGridLayout,
}: {
  form: FormDefinition;
  answers: Record<string, unknown>;
  setAnswers: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
  primaryColor: string;
  btnRadius: string;
  hasGridLayout: boolean;
}) {
  const questions = form.questions;

  const gridItems = useMemo(() => {
    if (!hasGridLayout) return null;
    return questions.map((q) => {
      const layout = q.layouts?.find((l: QuestionLayout) => l.breakpoint === "desktop");
      return {
        question: q,
        x: layout?.x ?? 0,
        y: layout?.y ?? 0,
        w: layout?.w ?? 12,
      };
    });
  }, [questions, hasGridLayout]);

  const handleChange = useCallback((id: string, v: unknown) => {
    setAnswers((prev) => ({ ...prev, [id]: v }));
  }, [setAnswers]);

  return (
    <div className="p-8 space-y-6">
      {/* Titulo */}
      <div className="space-y-2">
        {form.theme?.logoUrl && (
          <img src={form.theme.logoUrl} alt="Logo" className="h-8 object-contain mb-4" />
        )}
        <h1 className="text-2xl font-bold font-heading" style={form.theme?.formTitleColor ? { color: form.theme.formTitleColor } : undefined}>{form.title}</h1>
        {form.description && <p className="text-sm opacity-60">{form.description}</p>}
      </div>

      {/* Perguntas -- grid ou lista */}
      {hasGridLayout && gridItems ? (
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(12, 1fr)" }}>
          {gridItems
            .sort((a, b) => a.y - b.y || a.x - b.x)
            .map((item, index) => (
              <div
                key={item.question.id}
                style={{ gridColumn: `${item.x + 1} / span ${item.w}` }}
                className="rounded-2xl p-5"
              >
                {item.question.type === "STATEMENT" ? (
                  <QuestionField
                    type="STATEMENT"
                    value={null}
                    onChange={() => {}}
                    title={item.question.title}
                    description={item.question.description}
                  />
                ) : (
                  <FieldWrapper
                    label={item.question.title}
                    description={item.question.description}
                    required={item.question.required}
                    index={index}
                    typeLabel={QUESTION_TYPE_LABELS[item.question.type]}
                    titleColor={form.theme?.titleColor}
                  >
                    <QuestionField
                      type={item.question.type}
                      value={answers[item.question.id]}
                      onChange={(v) => handleChange(item.question.id, v)}
                      placeholder={item.question.placeholder}
                      options={item.question.options}
                      config={item.question.config}
                    />
                  </FieldWrapper>
                )}
              </div>
            ))}
        </div>
      ) : (
        questions.map((question, index) => (
          <div key={question.id}>
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
                index={index}
                typeLabel={QUESTION_TYPE_LABELS[question.type]}
                titleColor={form.theme?.titleColor}
              >
                <QuestionField
                  type={question.type}
                  value={answers[question.id]}
                  onChange={(v) => handleChange(question.id, v)}
                  placeholder={question.placeholder}
                  options={question.options}
                  config={question.config}
                />
              </FieldWrapper>
            )}
          </div>
        ))
      )}

      {/* Botao */}
      <button
        type="button"
        className="px-6 py-3 text-sm font-semibold text-white"
        style={{
          background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}cc)`,
          borderRadius: btnRadius,
        }}
      >
        Enviar
      </button>
    </div>
  );
}
