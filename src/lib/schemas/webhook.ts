import { z } from "zod";

export const createWebhookSchema = z.object({
  name: z.string().min(1, "Nome obrigatório").max(100).trim(),
  url: z.string().url("URL inválida"),
  method: z.enum(["POST", "PUT", "PATCH"]).default("POST"),
  headers: z.record(z.string(), z.string()).default({}),
  enabled: z.boolean().default(true),
  questionIds: z.array(z.string()).min(1, "Selecione pelo menos uma pergunta"),
  secret: z.string().max(200).optional().nullable(),
  retryCount: z.number().min(0).max(3).default(0),
});

export type CreateWebhookInput = z.infer<typeof createWebhookSchema>;

export const updateWebhookSchema = createWebhookSchema.partial();

export type UpdateWebhookInput = z.infer<typeof updateWebhookSchema>;
