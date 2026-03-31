import type { QuestionType, ResponseStatus } from "@/generated/prisma/client";

export type { ResponseStatus };

export interface FileUploadData {
  id: string;
  originalName: string;
  storageUrl: string;
  mimeType: string;
  sizeBytes: number;
}

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
  fileUpload: FileUploadData | null;
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
  respondentName: string | null;
  respondentEmail: string | null;
  respondentCpf: string | null;
  respondentPhone: string | null;
  respondentBirthDate: string | null;
  respondentGender: string | null;
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
  // FILE_UPLOAD: mostrar nome do arquivo
  if (answer.fileUpload) {
    return answer.fileUpload.originalName;
  }
  if (answer.jsonValue !== null) {
    // FILE_UPLOAD sem fileUpload record — extrair do jsonValue
    if (answer.question.type === "FILE_UPLOAD" && Array.isArray(answer.jsonValue)) {
      if (answer.jsonValue.length === 0) return "-";
      return (answer.jsonValue as { originalName?: string }[])
        .map((f) => f.originalName || "Arquivo")
        .join(", ");
    }
    if (Array.isArray(answer.jsonValue)) {
      const items = answer.jsonValue as unknown[];
      // Se os elementos são objetos (não strings), serializar
      if (items.length > 0 && typeof items[0] === "object") {
        return JSON.stringify(answer.jsonValue);
      }
      if (effectiveMap) {
        return (items as string[])
          .map((v) => effectiveMap.get(v) || v)
          .join(", ");
      }
      return (items as string[]).join(", ");
    }
    return JSON.stringify(answer.jsonValue);
  }
  return "-";
}
