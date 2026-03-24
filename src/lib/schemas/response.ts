import { z } from "zod";

export const submitAnswerSchema = z.object({
  questionId: z.string().cuid(),
  textValue: z.string().nullable().optional(),
  numberValue: z.number().nullable().optional(),
  booleanValue: z.boolean().nullable().optional(),
  dateValue: z.string().datetime().nullable().optional(),
  jsonValue: z.unknown().nullable().optional(),
});

export const submitFormSchema = z.object({
  answers: z.array(submitAnswerSchema),
});

export const partialSubmitSchema = z.object({
  answers: z.array(submitAnswerSchema),
});
