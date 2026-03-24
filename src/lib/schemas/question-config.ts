import { z } from "zod";

export const ShortTextConfig = z.object({
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
});

export const LongTextConfig = z.object({
  minLength: z.number().optional(),
  maxLength: z.number().optional(),
  rows: z.number().min(2).max(20).optional(),
});

export const NumberConfig = z.object({
  min: z.number().optional(),
  max: z.number().optional(),
  step: z.number().optional(),
  allowDecimals: z.boolean().optional(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
});

export const DateConfig = z.object({
  minDate: z.string().optional(),
  maxDate: z.string().optional(),
  includeTime: z.boolean().optional(),
  format: z.enum(["DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]).optional(),
});

export const RatingConfig = z.object({
  maxValue: z.number().min(2).max(10).default(5),
  icon: z.enum(["star", "heart", "thumbsUp", "number"]).default("star"),
  labels: z
    .object({
      low: z.string().optional(),
      high: z.string().optional(),
    })
    .optional(),
});

export const FileUploadConfig = z.object({
  allowedMimeTypes: z.array(z.string()).optional(),
  maxSizeMb: z.number().default(10),
  maxFiles: z.number().default(1),
});

export const MultipleChoiceConfig = z.object({
  minSelections: z.number().optional(),
  maxSelections: z.number().optional(),
  randomizeOrder: z.boolean().optional(),
  allowOther: z.boolean().optional(),
});

export const SingleSelectConfig = z.object({
  randomizeOrder: z.boolean().optional(),
  allowOther: z.boolean().optional(),
});

export const DropdownConfig = z.object({
  searchable: z.boolean().optional(),
  allowOther: z.boolean().optional(),
});

export const YesNoConfig = z.object({
  yesLabel: z.string().default("Sim"),
  noLabel: z.string().default("Nao"),
});

export const EmailConfig = z.object({
  allowedDomains: z.array(z.string()).optional(),
});

export const PhoneConfig = z.object({
  defaultCountryCode: z.string().default("+55"),
  format: z.enum(["international", "national"]).default("national"),
});

export const UrlConfig = z.object({
  allowedProtocols: z.array(z.string()).default(["https", "http"]),
});

export const StatementConfig = z.object({
  buttonText: z.string().default("Continuar"),
});

export const QuestionConfigSchema: Record<string, z.ZodSchema> = {
  SHORT_TEXT: ShortTextConfig,
  LONG_TEXT: LongTextConfig,
  NUMBER: NumberConfig,
  DATE: DateConfig,
  RATING: RatingConfig,
  FILE_UPLOAD: FileUploadConfig,
  MULTIPLE_CHOICE: MultipleChoiceConfig,
  SINGLE_SELECT: SingleSelectConfig,
  DROPDOWN: DropdownConfig,
  YES_NO: YesNoConfig,
  EMAIL: EmailConfig,
  PHONE: PhoneConfig,
  URL: UrlConfig,
  STATEMENT: StatementConfig,
};
