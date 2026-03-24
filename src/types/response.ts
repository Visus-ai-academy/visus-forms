import type { QuestionType, ResponseStatus } from "@/generated/prisma/client";

export type { ResponseStatus };

export interface AnswerData {
  id: string;
  formResponseId: string;
  questionId: string;
  textValue: string | null;
  numberValue: number | null;
  booleanValue: boolean | null;
  dateValue: string | null;
  jsonValue: unknown;
  createdAt: string;
  question: {
    id: string;
    title: string;
    type: QuestionType;
    order: number;
    options?: { value: string; label: string }[];
  };
}

export interface ResponseData {
  id: string;
  formId: string;
  userId: string | null;
  status: ResponseStatus;
  metadata: unknown;
  startedAt: string;
  completedAt: string | null;
  duration: number | null;
  answers: AnswerData[];
  user: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

export interface ResponsesApiResult {
  data: ResponseData[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  stats: {
    total: number;
    completed: number;
    completionRate: number;
    avgDuration: number;
  };
}

/**
 * Converte o valor bruto de uma resposta para texto legível.
 * @param optionsMap - Mapa de value→label para perguntas de escolha (opcional)
 */
export function getAnswerDisplayValue(
  answer: AnswerData,
  optionsMap?: Map<string, string>
): string {
  // Se nao tem optionsMap explicito, tentar construir a partir da question
  const effectiveMap = optionsMap ??
    (answer.question.options?.length
      ? new Map(answer.question.options.map((o) => [o.value, o.label]))
      : undefined);

  if (answer.textValue !== null) {
    if (effectiveMap?.has(answer.textValue)) return effectiveMap.get(answer.textValue)!;
    return answer.textValue;
  }
  if (answer.numberValue !== null) return String(answer.numberValue);
  if (answer.booleanValue !== null) return answer.booleanValue ? "Sim" : "Nao";
  if (answer.dateValue !== null) return new Date(answer.dateValue).toLocaleDateString("pt-BR");
  if (answer.jsonValue !== null) {
    if (Array.isArray(answer.jsonValue)) {
      if (effectiveMap) {
        return (answer.jsonValue as string[])
          .map((v) => effectiveMap.get(v) || v)
          .join(", ");
      }
      return (answer.jsonValue as string[]).join(", ");
    }
    return JSON.stringify(answer.jsonValue);
  }
  return "-";
}
