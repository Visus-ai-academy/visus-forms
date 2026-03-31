"use client";

import {
  Calendar,
  Clock,
  Search,
  Star,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import type { Question } from "@/types/form";
import { QUESTION_TYPE_LABELS } from "@/types/form";
import type { ResponseData } from "@/types/response";
import { getAnswerDisplayValue } from "@/types/response";

const IDENTIFICATION_FIELD_LABELS: Record<string, string> = {
  name: "Nome",
  email: "E-mail",
  cpf: "CPF",
  phone: "Telefone",
};

interface ResponsesIndividualProps {
  responses: ResponseData[];
  questions: Question[];
  identificationFields: string[];
}

const statusLabels: Record<string, { label: string; color: string }> = {
  COMPLETED: { label: "Completa", color: "bg-green-100 text-green-700" },
  IN_PROGRESS: { label: "Em andamento", color: "bg-amber-100 text-amber-700" },
  ABANDONED: { label: "Abandonada", color: "bg-red-100 text-red-700" },
};

function getRespondentInfo(
  response: ResponseData,
  identificationFields: string[],
  anonymousLabel?: string
) {
  const fieldGetters: Record<string, () => string | null> = {
    name: () => response.respondentName || response.user?.name || null,
    email: () => response.respondentEmail || response.user?.email || null,
    cpf: () => response.respondentCpf || null,
    phone: () => response.respondentPhone || null,
    birthDate: () => response.respondentBirthDate || null,
    gender: () => response.respondentGender || null,
  };
  const fields =
    identificationFields.length > 0 ? identificationFields : ["name", "email"];
  const values = fields.map((f) => ({
    label: IDENTIFICATION_FIELD_LABELS[f] || f,
    value: fieldGetters[f]?.() || null,
  }));
  const primary = values[0]?.value || anonymousLabel || "Anônimo";
  const secondary = values.slice(1).filter((v) => v.value);
  return { primary, secondary };
}

function buildAnonymousMap(
  responses: ResponseData[]
): Map<string, string> {
  const map = new Map<string, string>();
  // Numerar do mais antigo (último do array desc) para o mais recente
  const anonymousIds: string[] = [];
  for (const r of responses) {
    const hasIdentity =
      r.respondentName ||
      r.respondentEmail ||
      r.respondentCpf ||
      r.respondentPhone ||
      r.respondentBirthDate ||
      r.respondentGender ||
      r.user?.name ||
      r.user?.email;
    if (!hasIdentity) {
      anonymousIds.push(r.id);
    }
  }
  // responses vêm desc (mais recente primeiro), então invertemos para numerar do mais antigo
  anonymousIds.reverse();
  anonymousIds.forEach((id, i) => {
    map.set(id, `Anônimo ${i + 1}`);
  });
  return map;
}

export function ResponsesIndividual({
  responses,
  questions,
  identificationFields,
}: ResponsesIndividualProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    responses[0]?.id ?? null
  );
  const [search, setSearch] = useState("");

  const anonymousMap = useMemo(
    () => buildAnonymousMap(responses),
    [responses]
  );

  const filteredResponses = useMemo(() => {
    if (!search.trim()) return responses;
    const q = search.toLowerCase();
    return responses.filter((r) => {
      const info = getRespondentInfo(r, identificationFields, anonymousMap.get(r.id));
      const searchable = [
        info.primary,
        ...info.secondary.map((s) => s.value),
        r.respondentName,
        r.respondentEmail,
        r.respondentCpf,
        r.respondentPhone,
        r.respondentBirthDate,
        r.respondentGender,
        r.user?.name,
        r.user?.email,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return searchable.includes(q);
    });
  }, [responses, search, identificationFields, anonymousMap]);

  const selectedResponse =
    responses.find((r) => r.id === selectedId) ?? null;

  const sortedQuestions = useMemo(
    () => [...questions].sort((a, b) => a.order - b.order),
    [questions]
  );

  return (
    <div className="flex h-full">
      {/* Sidebar - Lista de respostas */}
      <div className="w-[300px] shrink-0 border-r border-surface-container-low flex flex-col">
        {/* Busca */}
        <div className="shrink-0 p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar respondente..."
              className="pl-9 h-9 rounded-lg bg-surface-container-low border-0 text-xs"
            />
          </div>
          <p className="text-[10px] text-muted-foreground mt-2 px-1">
            {filteredResponses.length} de {responses.length} respostas
          </p>
        </div>

        {/* Lista */}
        <div className="flex-1 overflow-y-auto px-2 pb-2">
          {filteredResponses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-xs text-muted-foreground">
                Nenhuma resposta encontrada.
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredResponses.map((r) => {
                const info = getRespondentInfo(r, identificationFields, anonymousMap.get(r.id));
                const s = statusLabels[r.status] || statusLabels.COMPLETED;
                const isSelected = r.id === selectedId;
                const date = r.completedAt || r.startedAt;

                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setSelectedId(r.id)}
                    className={`w-full text-left rounded-xl p-3 transition-all duration-150 ${
                      isSelected
                        ? "bg-primary-fixed ring-1 ring-primary/20"
                        : "hover:bg-surface-container-low"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p
                          className={`text-sm font-semibold truncate ${
                            isSelected ? "text-primary" : "text-on-surface"
                          }`}
                        >
                          {info.primary}
                        </p>
                        {info.secondary.map((v) => (
                          <p
                            key={v.label}
                            className="text-[11px] text-muted-foreground truncate"
                          >
                            {v.value}
                          </p>
                        ))}
                      </div>
                      <Badge
                        className={`${s.color} border-0 text-[9px] font-semibold shrink-0`}
                      >
                        {s.label}
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-1.5">
                      {new Date(date).toLocaleString("pt-BR")}
                    </p>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Detalhe da resposta */}
      <div className="flex-1 overflow-y-auto">
        {!selectedResponse ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-2">
              <User className="h-8 w-8 text-muted-foreground/30 mx-auto" />
              <p className="text-sm text-muted-foreground">
                Selecione uma resposta para visualizar
              </p>
            </div>
          </div>
        ) : (
          <div className="p-6">
            <div className="max-w-2xl mx-auto space-y-6">
              {/* Metadados */}
              <div className="rounded-2xl bg-surface-container-low p-5 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary-fixed p-2.5">
                    <User className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    {(() => {
                      const info = getRespondentInfo(
                        selectedResponse,
                        identificationFields,
                        anonymousMap.get(selectedResponse.id)
                      );
                      return (
                        <>
                          <p className="text-sm font-bold text-on-surface">
                            {info.primary}
                          </p>
                          {info.secondary.map((v) => (
                            <p
                              key={v.label}
                              className="text-xs text-muted-foreground"
                            >
                              {v.label}: {v.value}
                            </p>
                          ))}
                        </>
                      );
                    })()}
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5" />
                    <span>
                      {new Date(
                        selectedResponse.completedAt ||
                          selectedResponse.startedAt
                      ).toLocaleString("pt-BR")}
                    </span>
                  </div>
                  {selectedResponse.duration && (
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5" />
                      <span>
                        {Math.floor(selectedResponse.duration / 60)}m{" "}
                        {selectedResponse.duration % 60}s
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Respostas */}
              {sortedQuestions.map((question, index) => {
                const answer = selectedResponse.answers.find(
                  (a) => a.questionId === question.id
                );
                const optionsMap = question.options?.length
                  ? new Map(
                      question.options.map((o) => [o.value, o.label])
                    )
                  : undefined;
                const value = answer
                  ? getAnswerDisplayValue(answer, optionsMap)
                  : "-";

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
                    <p className="text-sm font-semibold text-on-surface">
                      {question.title}
                    </p>
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
                      ) : question.type === "RATING" && answer?.numberValue != null ? (
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: (question.config as { maxRating?: number })?.maxRating || 5 }, (_, i) => (
                            <Star
                              key={i}
                              className={`h-5 w-5 ${
                                i < answer.numberValue!
                                  ? "fill-amber-400 text-amber-400"
                                  : "text-muted-foreground/30"
                              }`}
                            />
                          ))}
                          <span className="text-xs text-muted-foreground ml-2">
                            {answer.numberValue}/{(question.config as { maxRating?: number })?.maxRating || 5}
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-on-surface whitespace-pre-wrap">
                          {value || (
                            <span className="text-muted-foreground italic">
                              Sem resposta
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
