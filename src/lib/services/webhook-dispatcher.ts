import { createHmac } from "crypto";

import { prisma } from "@/lib/prisma";

interface Respondent {
  name?: string;
  email?: string;
  cpf?: string;
  phone?: string;
  birthDate?: string;
  gender?: string;
}

interface DispatchParams {
  formId: string;
  formTitle: string;
  responseId: string;
  answers: Record<string, unknown>;
  questions: { id: string; title: string; type: string }[];
  respondent?: Respondent;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}

async function sendWithRetry(
  url: string,
  method: string,
  headers: Record<string, string>,
  body: string,
  retryCount: number
): Promise<void> {
  for (let attempt = 0; attempt <= retryCount; attempt++) {
    try {
      const res = await fetch(url, {
        method,
        headers,
        body,
        signal: AbortSignal.timeout(15000),
      });

      if (res.ok) return;

      // Don't retry on 4xx client errors
      if (res.status >= 400 && res.status < 500) return;
    } catch {
      // Network error — retry if attempts remain
    }

    if (attempt < retryCount) {
      // Exponential backoff: 1s, 2s, 4s
      await new Promise((resolve) =>
        setTimeout(resolve, Math.pow(2, attempt) * 1000)
      );
    }
  }
}

export async function dispatchWebhooks(params: DispatchParams): Promise<void> {
  const { formId, formTitle, responseId, answers, questions, respondent } = params;

  let webhooks;
  try {
    webhooks = await prisma.formWebhook.findMany({
      where: { formId, enabled: true },
    });
  } catch {
    return;
  }

  if (webhooks.length === 0) return;

  const questionMap = new Map(questions.map((q) => [q.id, q]));

  const dispatches = webhooks.map(async (webhook) => {
    try {
      // Filter answers to selected questionIds only
      const data: Record<string, unknown> = {};
      for (const qId of webhook.questionIds) {
        const question = questionMap.get(qId);
        if (!question) continue;
        if (answers[qId] === undefined) continue;
        const key = slugify(question.title) || qId;
        data[key] = answers[qId];
      }

      // Filtrar campos vazios do respondente
      const respondentData: Record<string, string> = {};
      if (respondent?.name) respondentData.nome = respondent.name;
      if (respondent?.email) respondentData.email = respondent.email;
      if (respondent?.cpf) respondentData.cpf = respondent.cpf;
      if (respondent?.phone) respondentData.telefone = respondent.phone;
      if (respondent?.birthDate) respondentData.data_nascimento = respondent.birthDate;
      if (respondent?.gender) respondentData.sexo = respondent.gender;

      const payload = {
        event: "form.submitted",
        formId,
        formTitle,
        responseId,
        submittedAt: new Date().toISOString(),
        ...(Object.keys(respondentData).length > 0 && { respondent: respondentData }),
        data,
      };

      const bodyStr = JSON.stringify(payload);

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
        ...(webhook.headers as Record<string, string>),
      };

      if (webhook.secret) {
        const signature = createHmac("sha256", webhook.secret)
          .update(bodyStr)
          .digest("hex");
        headers["X-Webhook-Signature"] = signature;
      }

      await sendWithRetry(
        webhook.url,
        webhook.method,
        headers,
        bodyStr,
        webhook.retryCount
      );
    } catch {
      // Never throw — log silently to avoid blocking submission
    }
  });

  await Promise.allSettled(dispatches);
}
