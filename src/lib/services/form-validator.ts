import { z } from "zod";

import type { Question, QuestionType } from "@/types/form";

/**
 * Gera um schema Zod dinamico a partir das perguntas do formulario.
 * Chave = questionId, valor = resposta tipada.
 */
export function buildDynamicSchema(
  questions: { id: string; type: QuestionType; required: boolean; config: Record<string, unknown> | unknown; options: { label: string; value: string }[] }[]
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const shape: Record<string, z.ZodTypeAny> = {};

  for (const q of questions) {
    let field = buildFieldSchema(q.type, (q.config ?? {}) as Record<string, unknown>);

    if (q.required) {
      // Manter required
    } else {
      field = field.optional();
    }

    shape[q.id] = field;
  }

  return z.object(shape).strip();
}

function buildFieldSchema(
  type: QuestionType,
  config: Record<string, unknown>
): z.ZodTypeAny {
  switch (type) {
    case "SHORT_TEXT":
      return z.string().min(1, "Campo obrigatorio").max(
        (config.maxLength as number) || 500
      );

    case "LONG_TEXT":
      return z.string().min(1, "Campo obrigatorio").max(
        (config.maxLength as number) || 5000
      );

    case "EMAIL":
      return z.string().email("Email invalido");

    case "PHONE":
      return z.string().min(8, "Telefone invalido").max(20);

    case "URL":
      return z.string().min(1, "URL obrigatoria").refine(
        (val) => {
          try {
            new globalThis.URL(val.startsWith("http") ? val : `https://${val}`);
            return true;
          } catch {
            return false;
          }
        },
        { message: "URL invalida" }
      );

    case "NUMBER":
      return z.coerce.number({ error: "Informe um numero valido" });

    case "DATE":
      return z.string().min(1, "Data obrigatoria");

    case "RATING": {
      const max = (config.maxRating as number) || 5;
      return z.coerce.number().min(1).max(max);
    }

    case "YES_NO":
      return z.union([z.boolean(), z.enum(["sim", "nao"])]);

    case "SINGLE_SELECT":
    case "DROPDOWN":
      return z.string().min(1, "Selecione uma opcao");

    case "MULTIPLE_CHOICE":
      return z.array(z.string()).min(1, "Selecione pelo menos uma opcao");

    case "FILE_UPLOAD": {
      const fileSchema = z.object({
        url: z.string().url(),
        storagePath: z.string(),
        originalName: z.string(),
        mimeType: z.string(),
        sizeBytes: z.number(),
      });
      return z.array(fileSchema);
    }

    case "STATEMENT":
      return z.any().optional();

    default:
      return z.string();
  }
}
