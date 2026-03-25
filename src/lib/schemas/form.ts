import { z } from "zod";

export const createFormSchema = z.object({
  workflowId: z.string().cuid(),
  title: z.string().min(1, "Título é obrigatório").max(255),
  description: z.string().optional(),
});

export const updateFormSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  description: z.string().optional(),
});

export const createQuestionSchema = z.object({
  type: z.enum([
    "SHORT_TEXT",
    "LONG_TEXT",
    "MULTIPLE_CHOICE",
    "SINGLE_SELECT",
    "DROPDOWN",
    "NUMBER",
    "DATE",
    "RATING",
    "FILE_UPLOAD",
    "YES_NO",
    "EMAIL",
    "PHONE",
    "URL",
    "STATEMENT",
  ]),
  title: z.string().min(1, "Título é obrigatório"),
  description: z.string().nullable().optional(),
  placeholder: z.string().nullable().optional(),
  required: z.boolean().default(false),
  config: z
    .record(z.string(), z.unknown())
    .default({})
    .refine(
      (val) => JSON.stringify(val).length <= 5000,
      "Configuração excede o tamanho máximo permitido"
    ),
  options: z
    .array(
      z.object({
        label: z.string().min(1),
        value: z.string().min(1),
        imageUrl: z.string().url().nullable().optional(),
      })
    )
    .optional(),
});

export const updateQuestionSchema = createQuestionSchema.partial();

export const reorderQuestionsSchema = z.object({
  questionIds: z.array(z.string().cuid()),
});

export const formSettingsSchema = z.object({
  presentationMode: z.enum(["ONE_AT_A_TIME", "ALL_AT_ONCE"]).optional(),
  showProgressBar: z.boolean().optional(),
  allowMultipleSubmissions: z.boolean().optional(),
  requireAuth: z.boolean().optional(),
  limitResponses: z.number().int().positive().nullable().optional(),
  scheduledOpenAt: z.string().datetime().nullable().optional(),
  scheduledCloseAt: z.string().datetime().nullable().optional(),
  confirmationMessage: z.string().nullable().optional(),
  redirectUrl: z.string().url().nullable().optional(),
  notifyOnSubmission: z.boolean().optional(),
  notifyEmails: z.array(z.string().email()).optional(),
  identificationMode: z.enum(["anonymous", "identified"]).optional(),
  identificationFields: z.array(z.enum(["name", "email", "cpf", "phone"])).optional(),
});

/**
 * Padrões CSS perigosos que permitem exfiltração de dados,
 * execução de scripts ou carregamento de recursos externos.
 */
const DANGEROUS_CSS_PATTERNS = [
  /url\s*\(/i,
  /expression\s*\(/i,
  /@import/i,
  /javascript:/i,
  /behavior\s*:/i,
  /-moz-binding/i,
];

export const formThemeSchema = z.object({
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  backgroundColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  textColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  titleColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  formTitleColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  fontFamily: z.string().optional(),
  logoUrl: z.string().min(1).nullable().optional(),
  backgroundImageUrl: z.string().min(1).nullable().optional(),
  buttonStyle: z.enum(["rounded", "pill", "square"]).optional(),
  customCss: z
    .string()
    .nullable()
    .optional()
    .refine(
      (val) => {
        if (!val) return true;
        return !DANGEROUS_CSS_PATTERNS.some((pattern) => pattern.test(val));
      },
      "CSS contém padrões não permitidos por segurança"
    ),
});

export const conditionalRuleSchema = z.object({
  operator: z.enum([
    "EQUALS",
    "NOT_EQUALS",
    "CONTAINS",
    "NOT_CONTAINS",
    "GREATER_THAN",
    "LESS_THAN",
    "GREATER_EQUAL",
    "LESS_EQUAL",
    "IS_EMPTY",
    "IS_NOT_EMPTY",
    "IN_LIST",
  ]),
  value: z.string(),
  action: z.enum(["SKIP_TO", "HIDE", "SHOW", "END_FORM"]),
  targetQuestionId: z.string().cuid().nullable().optional(),
});
