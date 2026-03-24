import { z } from "zod";

export const createWorkspaceSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  description: z.string().max(500).optional(),
});

export const updateWorkspaceSchema = createWorkspaceSchema.partial();

export const inviteMemberSchema = z.object({
  email: z.string().email("Email invalido"),
  role: z.enum(["ADMIN", "MEMBER", "VIEWER"]).default("MEMBER"),
});

export const createWorkflowSchema = z.object({
  name: z.string().min(1, "Nome e obrigatorio").max(100),
  description: z.string().max(500).optional(),
});

export const updateWorkflowSchema = createWorkflowSchema.partial();
