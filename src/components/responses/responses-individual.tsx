"use client";

import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
} from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import type { Question } from "@/types/form";
import { QUESTION_TYPE_LABELS } from "@/types/form";
import type { ResponseData } from "@/types/response";
import { getAnswerDisplayValue } from "@/types/response";

interface ResponsesIndividualProps {
  responses: ResponseData[];
  questions: Question[];
}

const statusLabels: Record<string, { label: string; color: string }> = {
  COMPLETED: { label: "Completa", color: "bg-green-100 text-green-700" },
  IN_PROGRESS: { label: "Em andamento", color: "bg-amber-100 text-amber-700" },
  ABANDONED: { label: "Abandonada", color: "bg-red-100 text-red-700" },
};

export function ResponsesIndividual({ responses, questions }: ResponsesIndividualProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const response = responses[currentIndex];

  if (!response) return null;

  const sortedQuestions = [...questions].sort((a, b) => a.order - b.order);
  const s = statusLabels[response.status] || statusLabels.COMPLETED;

  return (
    <div className="flex flex-col h-full">
      {/* Navegacao */}
      <div className="shrink-0 flex items-center justify-between px-6 py-3 border-b border-surface-container-low">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            disabled={currentIndex === 0}
            className="rounded-lg p-1.5 text-on-surface/50 hover:bg-surface-container-low disabled:opacity-30 transition-colors"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="text-xs font-semibold text-on-surface">
            Resposta {currentIndex + 1} de {responses.length}
          </span>
          <button
            onClick={() => setCurrentIndex((i) => Math.min(responses.length - 1, i + 1))}
            disabled={currentIndex >= responses.length - 1}
            className="rounded-lg p-1.5 text-on-surface/50 hover:bg-surface-container-low disabled:opacity-30 transition-colors"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <Badge className={`${s.color} border-0 text-[10px] font-semibold`}>
          {s.label}
        </Badge>
      </div>

      {/* Conteudo */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Metadados */}
          <div className="rounded-2xl bg-surface-container-low p-5 space-y-3">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-primary-fixed p-2.5">
                <User className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold text-on-surface">
                  {response.respondentName || response.user?.name || "Anônimo"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {response.respondentEmail || response.user?.email || "Sem e-mail"}
                </p>
                {response.respondentCpf && (
                  <p className="text-xs text-muted-foreground">CPF: {response.respondentCpf}</p>
                )}
                {response.respondentPhone && (
                  <p className="text-xs text-muted-foreground">Tel: {response.respondentPhone}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-6 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5" />
                <span>
                  {new Date(response.completedAt || response.startedAt).toLocaleString("pt-BR")}
                </span>
              </div>
              {response.duration && (
                <div className="flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" />
                  <span>
                    {Math.floor(response.duration / 60)}m {response.duration % 60}s
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Respostas */}
          {sortedQuestions.map((question, index) => {
            const answer = response.answers.find((a) => a.questionId === question.id);
            const optionsMap = question.options?.length
              ? new Map(question.options.map((o) => [o.value, o.label]))
              : undefined;
            const value = answer ? getAnswerDisplayValue(answer, optionsMap) : "-";

            return (
              <div
                key={question.id}
                className="rounded-2xl bg-surface-container-lowest p-5 space-y-2"
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-primary bg-primary-fixed rounded-full h-5 w-5 flex items-center justify-center">
                    {index + 1}
                  </span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {QUESTION_TYPE_LABELS[question.type]}
                  </span>
                </div>
                <p className="text-sm font-semibold text-on-surface">{question.title}</p>
                <div className="rounded-xl bg-surface-container-low p-3">
                  {answer?.fileUpload ? (
                    <a
                      href={answer.fileUpload.storageUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary underline hover:text-primary/80 transition-colors"
                    >
                      {answer.fileUpload.originalName}
                    </a>
                  ) : (
                    <p className="text-sm text-on-surface whitespace-pre-wrap">
                      {value || <span className="text-muted-foreground italic">Sem resposta</span>}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
