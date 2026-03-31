import { createHmac } from "crypto";

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getRequiredSession } from "@/lib/session";

export async function POST(
  _request: Request,
  {
    params,
  }: { params: Promise<{ formId: string; webhookId: string }> }
) {
  const { session, error } = await getRequiredSession();
  if (error) return error;

  const { formId, webhookId } = await params;

  const webhook = await prisma.formWebhook.findFirst({
    where: {
      id: webhookId,
      formId,
      form: {
        OR: [
          { creatorId: session.user.id },
          {
            workflow: {
              workspace: {
                members: {
                  some: {
                    userId: session.user.id,
                    role: { in: ["OWNER", "ADMIN", "MEMBER"] },
                  },
                },
              },
            },
          },
        ],
      },
    },
    include: {
      form: { select: { title: true } },
    },
  });

  if (!webhook) {
    return NextResponse.json(
      { error: "Webhook não encontrado" },
      { status: 404 }
    );
  }

  const payload = {
    event: "webhook.test",
    formId,
    formTitle: webhook.form.title,
    responseId: "test-response-id",
    submittedAt: new Date().toISOString(),
    data: {},
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

  try {
    const res = await fetch(webhook.url, {
      method: webhook.method,
      headers,
      body: bodyStr,
      signal: AbortSignal.timeout(10000),
    });

    return NextResponse.json({
      data: {
        success: res.ok,
        statusCode: res.status,
        statusText: res.statusText,
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Erro ao enviar requisição";
    return NextResponse.json(
      {
        data: {
          success: false,
          statusCode: null,
          statusText: message,
        },
      },
      { status: 200 }
    );
  }
}
